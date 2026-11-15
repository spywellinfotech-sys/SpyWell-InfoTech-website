/* Lucky Draw screens (LoKalLo adapter for lucky-draw-module/web). Shopkeeper: budget planner, draw, coupons, run, winners.
   Customer: live schemes on a shop page, my coupons, results + verification. Core logic lives in ld-core.js (window.LD). */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc, LD = window.LD, R = LD.rupees;
  var LOADING = '<div class="empty">Ruko…</div>';
  function num(v, d) { var n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) ? n : (d == null ? 0 : d); }
  function dt(s) { return s ? new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""; }
  var STX = { draft: ["Draft", "warn"], live: ["Chal raha 🟢", "ok"], closed: ["Coupon band", "accent"], drawn: ["Draw ho gaya 🏆", "done"], cancelled: ["Radd", "bad"] };
  function badge(st) { var x = STX[st] || [st, ""]; return '<span class="bd ' + x[1] + '">' + x[0] + "</span>"; }
  function prizeText(d) {
    return (d.ld_prizes || []).slice().sort(function (a, b) { return a.rank - b.rank || a.sort_order - b.sort_order; }).map(function (p) { return (p.qty > 1 ? p.qty + " × " : "") + p.name; }).join(", ");
  }
  function rulesLine(d) { return R(d.min_purchase) + " ki kharidari par " + d.coupons_per_slab + " coupon (max " + d.max_coupons_per_customer + ")"; }

  /* ---------- budget rules prompt (shown before planning and before going live) ---------- */
  var RULES = '<h3>📋 Budget ke niyam — pehle padho</h3><ul class="ldrules">' +
    "<li>Inaam ka <b>asli kharcha</b> apni expected sales ka <b>2% se 3%</b> rakho.</li>" +
    "<li>Voucher / discount par laagat sirf aapka purchase price hai: <b>face value × (1 − margin)</b>.</li>" +
    "<li>Inaam ka hissa: ~40% bumper, ~40% weekly / chhote, ~20% consolation.</li>" +
    "<li>Kharcha 3% tak 🟢 achha, 6% tak 🟡 theek, usse upar 🔴 inaam kam karo.</li>" +
    "<li>Draw fair rehta hai: live hote hi secret seed ka hash dikhta hai, draw ke baad seed khulta hai — koi bhi jaanch sakta hai.</li>" +
    "<li>Live hone ke baad inaam aur shartein badal nahi sakte.</li></ul>";
  function showRules(label, then) { LK.sheet(RULES + '<button class="btn big" data-act="ldrulesok">' + label + "</button>"); LK._ldNext = then; }
  LK.act.ldrulesok = function () { LK.closeSheet(); var f = LK._ldNext; LK._ldNext = null; if (f) f(); };

  /* ================= shopkeeper: list ================= */
  V.ldlist = {
    tab: "sorders",
    html: function (e) {
      if (!S.shop) return '<section class="pad"><div class="empty">Pehle apni dukaan register karo.</div></section>';
      var d = e.data, h = '<section class="pad"><h2>🎁 Lucky Draw</h2><p class="muted sm">Customer kharidari par coupon paate hain, aap fair draw nikalte ho. Order poora hote hi coupon apne aap mil jaate hain.</p><p><button class="btn ghost sm" data-act="ldniyam">📖 Poore niyam padho</button> <button class="btn ghost sm" data-act="ldpdf">📄 Niyam PDF download karo</button></p>' + (S.shop && S.shop.lucky_until ? '<div class="card ok-c row"><span>✓ Plan ' + dt(S.shop.lucky_until) + ' tak</span><button class="btn ghost sm" data-act="ldrenew">Renew</button></div>' : "") + '<button class="btn big" data-act="ldnew">➕ Naya Lucky Draw banao</button>';
      if (!d) return h + LOADING + "</section>";
      if (!d.length) return h + '<div class="empty">Abhi koi Lucky Draw nahi. Pehle budget plan banao 👆</div></section>';
      return h + d.map(function (x) {
        return '<button class="card" data-act="ldopen" data-id="' + x.id + '"><div class="row"><b>' + esc(x.title) + "</b>" + badge(x.status) + '</div><div class="meta muted sm">' + esc(rulesLine(x)) + "</div><div class=\"sm\">" + esc(prizeText(x)) + "</div></button>";
      }).join("") + "</section>";
    },
    init: function (e) { if (!S.shop) return; return S.api.ldList(S.shop.id).then(function (r) { e.data = r || []; LK.redraw(e); }).catch(LK.fail); }
  };
  LK.luckyOn = function (s) { return !!(s && s.lucky_enabled && (!s.lucky_until || new Date(s.lucky_until).getTime() > Date.now())); };
  LK.LPLAN = function (plan, days) { return ({ week: "Hafta (7 din)", month: "Mahina (30 din)", year: "Saal (365 din)" }[plan]) || "Custom " + days + " din"; };
  LK.act.ldlist = function () {
    return S.api.me().then(function (m) { if (m && m.shop) S.shop = m.shop; }, function () {}).then(function () {
      if (LK.luckyOn(S.shop)) return LK.go("ldlist");
      return S.api.luckyMine().catch(function () { return []; }).then(function (r) { LP = { plan: "month", days: 0, pending: (r || []).filter(function (x) { return x.status === "pending"; })[0] }; paySheet(); });
    });
  };

  LK.act.ldpdf = function () {
    var en = (LK.ldPdfLang ? LK.ldPdfLang() : (LK.hi ? "hi" : "en")) === "en", name = en ? "LoKalLo-Lucky-Draw-Rules.pdf" : "LoKalLo-Lucky-Draw-Niyam.pdf", b = en ? window.LK_LDPDF_EN : window.LK_LDPDF;
    if (!b) return LK.toast("PDF nahi mili", "bad");
    try {
      if (window.LkNative && LkNative.savePdf) { if (!LkNative.savePdf(b, name)) LK.toast("PDF save nahi ho payi", "bad"); return; }
      var a = document.createElement("a"); a.href = "data:application/pdf;base64," + b; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { LK.toast("PDF save nahi ho payi", "bad"); }
  };
  var LP = { plan: "month", days: 0 };
  function lpAmt() {
    var f = LK.S.fees || {};
    return LP.plan === "week" ? +f.lucky_week || 0 : LP.plan === "year" ? +f.lucky_year || 0 : LP.plan === "custom" ? Math.ceil((LP.days || 0) * (+f.lucky_month || 0) / 30) : +f.lucky_month || 0;
  }
  function paySec() {
    var up = (LK.S.fees || {}).admin_upi, amt = lpAmt();
    if (LP.pending) return '<div class="card ok-c">✓ Aapki request (' + esc(LK.LPLAN(LP.pending.plan, LP.pending.days)) + ", " + LK.money(LP.pending.amount) + ") admin ko bhej di gayi hai. Admin fee dekhkar Lucky Draw chalu kar dega — notification aa jayega.</div>";
    if (LP.plan === "custom" && !(LP.days > 0)) return '<p class="muted sm">Upar se tareekh chuno.</p>';
    if (!up || !(amt > 0) || !LK.appBtns) return '<p class="muted">Abhi payment option set nahi hai.</p>';
    var link = LK.feeLink(up, amt);
    return '<div class="kv"><div><span>Fee</span><b>' + LK.money(amt) + "</b></div></div>" + LK.appBtns(link) + '<div class="kv"><div><span>UPI ID</span><b>' + esc(up) + '</b></div></div><button class="btn ghost sm" data-act="copyupi" data-v="' + esc(up) + '">📋 UPI ID copy karo</button>' + LK.manualPay(up, amt) + '<button class="btn big" data-act="ldpaid">✅ Maine fee pay kar di</button>';
  }
  function paySheet() {
    var f = LK.S.fees || {}, on = LK.luckyOn(S.shop), min = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    LK.sheet("<h3>🎁 Lucky Draw " + (S.shop && S.shop.lucky_enabled ? "renew karo" : "chalu karo") + "</h3><p class=\"muted sm\">Plan chuno, fee UPI se pay karo, phir \"Maine fee pay kar di\" dabao. Admin ko notification jayega aur wo chalu kar dega.</p>" +
      '<div class="chips flush wrapc">' + [["week", "Hafta", f.lucky_week], ["month", "Mahina", f.lucky_month], ["year", "Saal", f.lucky_year], ["custom", "Custom date", null]].map(function (p) { return '<button class="chip" data-act="ldplan" data-v="' + p[0] + '" aria-pressed="' + (LP.plan === p[0]) + '">' + p[1] + (p[2] != null ? " " + LK.money(p[2]) : "") + "</button>"; }).join("") + "</div>" +
      '<label class="fld" id="ldcustom" style="display:' + (LP.plan === "custom" ? "block" : "none") + '"><span>Is tareekh tak chalana hai</span><input type="date" data-in="ldpd" min="' + min + '"></label><div id="ldpay">' + paySec() + '</div><p><button class="btn ghost sm" data-act="ldniyam">📖 Poore niyam padho</button> <button class="btn ghost sm" data-act="ldpdf">📄 Niyam PDF download karo</button></p><button class="btn ghost" data-act="mclose" data-v="0">Band</button>');
  }
  LK.act.ldplan = function (el) {
    if (LP.pending) return; LP.plan = el.dataset.v; el.parentNode.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); });
    $("#ldcustom").style.display = LP.plan === "custom" ? "block" : "none"; $("#ldpay").innerHTML = paySec();
  };
  LK.inp.ldpd = function (el) { var d = el.value ? Math.ceil((new Date(el.value + "T23:59:59").getTime() - Date.now()) / 86400000) : 0; LP.days = Math.max(0, Math.min(730, d)); $("#ldpay").innerHTML = paySec(); };
  LK.act.ldpaid = function (el) {
    return LK.busy(el, function () { return S.api.luckyRequest(LP.plan, LP.days); }).then(function () { LK.toast("Admin ko bata diya ✓ — verify hote hi Lucky Draw chalu ho jayega"); LP.pending = { plan: LP.plan, days: LP.plan === "custom" ? LP.days : ({ week: 7, month: 30, year: 365 }[LP.plan]), amount: lpAmt() }; $("#ldpay").innerHTML = paySec(); });
  };
  LK.act.ldrenew = function () { LP = { plan: "month", days: 0 }; paySheet(); };
  LK.act.ldopen = function (el) { LK.go("lddraw", { id: el.dataset.id }); };
  LK.act.ldnew = function () { showRules("Samajh gaya, plan banao", function () { P = newPlan(); LK.go("ldplan"); }); };

  /* ================= shopkeeper: budget planner ================= */
  var P = null;
  function newPlan() {
    var t = LD.APP_TYPE[(S.shop && S.shop.types && S.shop.types[0]) || "grocery"] || "kirana", st = LD.SHOP_TYPES[t];
    var p = { type: t, sales: 300000, margin: st.margin, minp: st.minPurchase, weeks: 4, slab: 1, banner: 500, print: 0, maxc: 10, free: true, onewin: true, end: "", title: "", rewards: [] };
    p.rewards = LD.suggestRewards(inp(p));
    return p;
  }
  function inp(p) { return { shopType: p.type, expectedSales: p.sales, marginPct: p.margin, minPurchase: p.minp, weeks: p.weeks, couponsPerSlab: p.slab, bannerCost: p.banner, printPerCoupon: p.print, rewards: p.rewards }; }
  function resHtml() {
    var b = LD.computeBudget(inp(P)), cls = b.verdict === "good" ? "ok" : b.verdict === "ok" ? "warn" : "bad";
    return '<div class="card ldres ' + cls + '"><b>' + esc(LD.verdictText(b)) + "</b>" +
      '<div class="kv"><div><span>Inaam ka face value</span><b>' + R(b.prizeFaceValue) + "</b></div><div><span>Asli kharcha (inaam)</span><b>" + R(b.prizeRealCost) + "</b></div><div><span>Prachar (banner/print)</span><b>" + R(b.promoCost) + "</b></div><div><span>Total kharcha</span><b>" + R(b.totalReal) + " (" + b.pctOfSales.toFixed(1) + "%)</b></div>" +
      "<div><span>Achha budget (2–3%)</span><b>" + R(b.suggestedMin) + " – " + R(b.suggestedMax) + "</b></div><div><span>Kharcha wapas laane ko extra sale</span><b>" + R(b.breakEvenExtraSales) + "</b></div>" +
      "<div><span>Andaza coupon</span><b>" + b.estCoupons + "</b></div><div><span>Jeetne ka chance</span><b>" + (b.oneInN ? "1 / " + b.oneInN : "—") + "</b></div></div>" +
      '<small class="muted">Bumper ' + R(b.byTier[1]) + " · Weekly " + R(b.byTier[2]) + " · Consolation " + R(b.byTier[3]) + "</small></div>";
  }
  function rewardsHtml() {
    if (!P.rewards.length) return '<div class="empty">Koi inaam nahi. "Auto plan" dabao ya neeche se jodo.</div>';
    return P.rewards.map(function (r, i) {
      return '<div class="card ldrw"><div class="row"><input data-in="ldr" data-i="' + i + '" data-f="name" value="' + esc(r.name) + '" maxlength="80" aria-label="Inaam ka naam"><button class="btn ghost sm" data-act="ldrm" data-i="' + i + '" aria-label="Hatao">✕</button></div>' +
        '<div class="row2"><label class="fld"><span>Kimat (₹)</span><input data-in="ldr" data-i="' + i + '" data-f="unit_cost" value="' + r.unit_cost + '" inputmode="decimal"></label><label class="fld"><span>Kitne</span><input data-in="ldr" data-i="' + i + '" data-f="qty" value="' + r.qty + '" inputmode="numeric"></label></div>' +
        '<div class="row2"><select data-in="ldr" data-i="' + i + '" data-f="rank">' + [1, 2, 3].map(function (t) { return '<option value="' + t + '"' + (r.rank === t ? " selected" : "") + ">" + LD.TIERS[t] + "</option>"; }).join("") + '</select><select data-in="ldr" data-i="' + i + '" data-f="kind">' +
        [["item", "Samaan"], ["store_voucher", "Voucher"], ["discount", "Discount"]].map(function (k) { return '<option value="' + k[0] + '"' + (r.kind === k[0] ? " selected" : "") + ">" + k[1] + "</option>"; }).join("") + "</select></div></div>";
    }).join("");
  }
  function fld(label, k, val, mode, ph) { return '<label class="fld"><span>' + label + '</span><input data-in="ldp" data-k="' + k + '" value="' + esc(val) + '" inputmode="' + (mode || "decimal") + '"' + (ph ? ' placeholder="' + ph + '"' : "") + "></label>"; }
  function tog(label, k) { return '<button type="button" class="chip" data-act="ldtog" data-k="' + k + '" aria-pressed="' + !!P[k] + '">' + label + "</button>"; }
  V.ldplan = {
    tab: "sorders",
    html: function () {
      if (!P) P = newPlan();
      var cat = LD.rewardCatalog(P.type);
      return '<section class="pad"><h2>📊 Budget planner</h2><p class="muted sm">Pehle hisab lagao: kitne ka inaam, asli kharcha kitna, aur kitni extra bikri chahiye. <a href="#" data-act="ldrules">Niyam dobara padho</a></p>' +
        '<label class="fld"><span>Dukaan ka type</span><select data-in="ldp" data-k="type">' + Object.keys(LD.SHOP_TYPES).map(function (k) { return '<option value="' + k + '"' + (P.type === k ? " selected" : "") + ">" + LD.SHOP_TYPES[k].label + "</option>"; }).join("") + "</select></label>" +
        '<div class="row2">' + fld("Scheme mein expected sale (₹)", "sales", P.sales) + fld("Aapka margin (%)", "margin", P.margin) + "</div>" +
        '<div class="row2">' + fld("Kitni kharidari par coupon (₹)", "minp", P.minp) + fld("Kitne hafte", "weeks", P.weeks, "numeric") + "</div>" +
        '<div class="row2">' + fld("Har slab par coupon (1–10)", "slab", P.slab, "numeric") + fld("Banner / prachar kharcha (₹)", "banner", P.banner) + "</div>" +
        '<div id="ldres">' + resHtml() + '</div><div class="row2"><button class="btn" data-act="ldauto">✨ Auto plan</button><button class="btn ghost" data-act="ldclear">Saaf karo</button></div>' +
        "<h3>🎁 Inaam</h3><div id=\"ldrw\">" + rewardsHtml() + "</div><button class=\"btn ghost\" data-act=\"ldaddown\">➕ Apna inaam jodo</button>" +
        '<p class="muted sm">Ready ideas (dabao to judega):</p><div class="chips flush wrapc">' + cat.map(function (c, i) { return '<button class="chip sm" data-act="ldaddcat" data-i="' + i + '">' + esc(c.name) + " · " + R(c.unit_cost) + "</button>"; }).join("") + "</div>" +
        "<h3>⚙️ Draw ki shartein</h3>" + '<label class="fld"><span>Draw ka naam *</span><input data-in="ldp" data-k="title" value="' + esc(P.title) + '" maxlength="80" placeholder="Jaise: Diwali Dhamaka Lucky Draw"></label>' +
        '<div class="row2">' + fld("Ek customer ko max coupon", "maxc", P.maxc, "numeric") + '<label class="fld"><span>Coupon dene ki aakhri tareekh</span><input type="date" data-in="ldp" data-k="end" value="' + esc(P.end) + '"></label></div>' +
        '<div class="chips flush wrapc">' + tog("🆓 Free entry (1 coupon / number)", "free") + tog("👤 Ek insaan ko ek hi inaam", "onewin") + "</div>" +
        '<button class="btn big" data-act="ldsave">💾 Draft banao</button><small class="muted">Draft banne ke baad bhi live karne se pehle sab dekh sakte ho.</small></section>';
    }
  };
  function refresh() { var a = $("#ldres"); if (a) a.innerHTML = resHtml(); }
  var NUMK = { sales: 1, margin: 1, minp: 1, weeks: 1, slab: 1, banner: 1, print: 1, maxc: 1 };
  LK.inp.ldp = function (el) {
    var k = el.dataset.k;
    if (k === "type") { var st = LD.SHOP_TYPES[el.value]; P.type = el.value; P.margin = st.margin; P.minp = st.minPurchase; P.rewards = LD.suggestRewards(inp(P)); return LK.redraw(LK.top()); }
    P[k] = NUMK[k] ? num(el.value) : el.value; if (NUMK[k]) refresh();
  };
  LK.inp.ldr = function (el) {
    var r = P.rewards[+el.dataset.i], f = el.dataset.f; if (!r) return;
    if (f === "name" || f === "kind") r[f] = el.value; else r[f] = f === "rank" ? +el.value : Math.max(f === "qty" ? 1 : 0, num(el.value));
    if (f === "qty") r.qty = Math.min(500, Math.round(r.qty)); refresh();
  };
  LK.act.ldrules = function () { showRules("Theek hai", null); };
  LK.act.ldtog = function (el) { P[el.dataset.k] = !P[el.dataset.k]; el.setAttribute("aria-pressed", String(!!P[el.dataset.k])); };
  LK.act.ldauto = function () { P.rewards = LD.suggestRewards(inp(P)); LK.redraw(LK.top()); LK.toast("Auto plan lag gaya ✓ — apne hisab se badlo"); };
  LK.act.ldclear = function () { P.rewards = []; LK.redraw(LK.top()); };
  LK.act.ldrm = function (el) { P.rewards.splice(+el.dataset.i, 1); LK.redraw(LK.top()); };
  LK.act.ldaddown = function () { P.rewards.push({ name: "Naya inaam", unit_cost: 100, qty: 1, kind: "item", rank: 2 }); LK.redraw(LK.top()); };
  LK.act.ldaddcat = function (el) { var c = LD.rewardCatalog(P.type)[+el.dataset.i]; if (c) { P.rewards.push(JSON.parse(JSON.stringify(c))); LK.redraw(LK.top()); } };
  LK.act.ldsave = function (el) {
    if (!String(P.title || "").trim()) return LK.toast("Draw ka naam likho.", "bad");
    if (!P.rewards.length) return LK.toast("Kam se kam ek inaam jodo.", "bad");
    if (P.minp <= 0) return LK.toast("Kharidari ki rakam 0 se zyada rakho.", "bad");
    var b = LD.computeBudget(inp(P));
    function go() {
      return LK.busy(el, function () {
        return S.api.ldSave({
          title: P.title.trim(), description: "", min_purchase: P.minp, coupons_per_slab: Math.max(1, Math.min(10, Math.round(P.slab))), max_coupons_per_customer: Math.max(1, Math.round(P.maxc)),
          allow_free_entry: !!P.free, one_win_per_person: !!P.onewin, end_at: P.end ? new Date(P.end + "T23:59:59").toISOString() : null,
          expected_sales: P.sales, margin_pct: P.margin, promo_cost: b.promoCost,
          prizes: P.rewards.map(function (r) { return { name: r.name, kind: r.kind, unit_cost: r.unit_cost, qty: r.qty, rank: r.rank }; })
        });
      }).then(function (id) { LK.toast("Draft ban gaya ✓"); P = null; LK.go("lddraw", { id: id }, { replace: true }); });
    }
    if (b.verdict === "high") return LK.ask("Kharcha sales ka " + b.pctOfSales.toFixed(1) + "% hai (achha: 2–3%). Phir bhi draft banana hai?", "Haan, banao").then(function (ok) { if (ok) return go(); });
    return go();
  };

  /* ================= shopkeeper: one draw ================= */
  function budgetOf(d) {
    var rew = (d.ld_prizes || []).map(function (p) { return { name: p.name, unit_cost: +p.unit_cost, qty: p.qty, kind: p.kind, rank: p.rank }; });
    return LD.computeBudget({ expectedSales: +d.expected_sales || 0, marginPct: +d.margin_pct || 0, minPurchase: +d.min_purchase, couponsPerSlab: d.coupons_per_slab, bannerCost: 0, printPerCoupon: 0, rewards: rew });
  }
  function winnersHtml(e, own) {
    var w = e.w || [];
    if (!w.length) return '<div class="empty">Koi winner nahi — coupon kam the.</div>';
    return w.map(function (x) {
      var c = x.ld_coupons || {}, who = (c.customer_name || "") + (c.customer_phone ? " · " + c.customer_phone : "");
      return '<div class="card ldw' + (x.claimed ? " done" : "") + '"><div class="row"><b>🏆 ' + esc(x.ld_prizes.name) + '</b><span class="bd">' + esc(c.code || "") + '</span></div><div class="muted sm">' + esc(who) + "</div>" +
        (own ? '<div class="row2">' + (c.customer_phone ? '<a class="btn ghost sm" href="' + LK.wa(c.customer_phone, "Badhai ho! Aap " + e.d.shop_name + " ke Lucky Draw mein jeete: " + x.ld_prizes.name + " 🎉 Coupon: " + c.code + ". Dukaan par aakar le jaiye.") + '">💬 Winner ko batao</a>' : "") +
          (x.claimed ? '<span class="okc">✓ Inaam diya</span>' : '<button class="btn sm" data-act="ldclaim" data-id="' + x.id + '">Inaam de diya</button>') + "</div>" : "") + "</div>";
    }).join("");
  }
  V.lddraw = {
    tab: "sorders",
    html: function (e) {
      var d = e.d; if (!d) return '<section class="pad">' + LOADING + "</section>";
      var b = budgetOf(d), cp = e.cp || [], st = d.status, acts = "";
      if (st === "draft") acts = '<button class="btn big" data-act="ldgolive" data-id="' + d.id + '">🚀 Live karo</button>';
      if (st === "live") acts = '<button class="btn big" data-act="ldissue" data-id="' + d.id + '">🎟️ Coupon do</button><div class="row2"><button class="btn ghost" data-act="ldclose" data-id="' + d.id + '" data-v="closed">🛑 Coupon band</button><button class="btn" data-act="ldrun" data-id="' + d.id + '">🎰 Draw nikalo</button></div><button class="btn ghost sm" data-act="ldshare" data-id="' + d.id + '">📣 WhatsApp par batao</button>';
      if (st === "closed") acts = '<button class="btn big" data-act="ldrun" data-id="' + d.id + '">🎰 Draw nikalo</button>';
      if (["draft", "live", "closed"].indexOf(st) > -1) acts += '<button class="btn ghost danger-t" data-act="ldclose" data-id="' + d.id + '" data-v="cancelled">Radd karo</button>';
      return '<section class="pad"><div class="row"><h2>' + esc(d.title) + "</h2>" + badge(st) + "</div>" +
        '<div class="card kv"><div><span>Coupon kaise milta hai</span><b>' + esc(rulesLine(d)) + "</b></div>" + (d.end_at ? "<div><span>Coupon ki aakhri tareekh</span><b>" + dt(d.end_at) + "</b></div>" : "") +
        "<div><span>Free entry</span><b>" + (d.allow_free_entry ? "Haan" : "Nahi") + "</b></div><div><span>Ek insaan ko</span><b>" + (d.one_win_per_person ? "Ek hi inaam" : "Kai inaam ho sakte") + "</b></div><div><span>Ab tak coupon</span><b>" + cp.length + "</b></div>" +
        "<div><span>Inaam ka asli kharcha</span><b>" + R(b.prizeRealCost) + (d.expected_sales > 0 ? " (" + (b.prizeRealCost / d.expected_sales * 100).toFixed(1) + "% sales)" : "") + "</b></div></div>" +
        "<h3>🎁 Inaam</h3>" + (d.ld_prizes || []).slice().sort(function (a, b2) { return a.rank - b2.rank || a.sort_order - b2.sort_order; }).map(function (p) { return '<div class="card"><div class="row"><b>' + esc(p.name) + '</b><span class="muted">× ' + p.qty + '</span></div><small class="muted">' + LD.TIERS[p.rank] + " · " + R(p.unit_cost) + "</small></div>"; }).join("") +
        (d.seed_hash ? '<div class="card ldfair"><b>🔒 Fair draw</b><div class="sm muted">Seed ka hash (draw se pehle hi publish): <code>' + esc(d.seed_hash.slice(0, 20)) + "…</code></div>" + (d.seed ? '<div class="sm">Seed: <code>' + esc(d.seed) + '</code></div><button class="btn ghost sm" data-act="ldverify" data-id="' + d.id + '">✅ Result jaanchein</button>' : '<div class="sm muted">Draw ke baad seed khulega aur koi bhi result jaanch sakega.</div>') + "</div>" : "") +
        (st === "drawn" ? "<h3>🏆 Winners</h3>" + winnersHtml(e, true) + '<button class="btn ghost" data-act="ldshare" data-id="' + d.id + '">📣 Winners list WhatsApp par bhejo</button>' : "") +
        '<div class="ldacts">' + acts + "</div>" +
        (st === "live" || st === "closed" || st === "drawn" ? "<h3>🎟️ Coupon (" + cp.length + ")</h3>" + (cp.length ? cp.slice(0, 40).map(function (c) { return '<div class="card row"><div><b>' + esc(c.code) + '</b><div class="muted sm">' + esc(c.customer_name || "—") + " · " + esc(c.customer_phone) + '</div></div><span class="bd">' + ({ purchase: "Kharidari", free: "Free", manual: "Manual" }[c.source] || c.source) + "</span></div>"; }).join("") + (cp.length > 40 ? '<p class="muted sm">…aur ' + (cp.length - 40) + " coupon</p>" : "") : '<div class="empty">Abhi koi coupon nahi.</div>') : "") +
        "</section>";
    },
    init: function (e, quiet) {
      var id = e.params.id;
      return Promise.all([S.api.ldOne(id), S.api.ldCoupons(id).catch(function () { return []; })]).then(function (a) {
        e.d = a[0]; e.cp = a[1] || [];
        if (e.d && e.d.status === "drawn") return S.api.ldWinners(id).then(function (w) { e.w = w; });
      }).then(function () { LK.redraw(e); }).catch(function (x) { if (!quiet) LK.fail(x); });
    }
  };
  function reload() { var e = LK.top(); if (e && e.name === "lddraw") return V.lddraw.init(e, true); }
  LK.act.ldgolive = function (el) {
    var id = el.dataset.id;
    showRules("Samajh gaya, aage badho", function () {
      LK.ask("Live karne ke baad inaam aur shartein badal nahi sakte. Draw live karein?", "Haan, live karo").then(function (ok) {
        if (ok) return S.api.ldGoLive(id).then(function () { LK.toast("Lucky Draw live ho gaya 🎉"); return reload(); }, LK.fail);
      });
    });
  };
  LK.act.ldclose = function (el) {
    var id = el.dataset.id, st = el.dataset.v, can = st === "cancelled";
    return LK.ask(can ? "Ye Lucky Draw radd karna hai?" : "Coupon dena band karein? Uske baad draw nikal sakte ho.", can ? "Haan, radd karo" : "Haan, band karo", can).then(function (ok) { if (ok) return S.api.ldStatus(id, st).then(function () { return reload(); }, LK.fail); });
  };
  LK.act.ldclaim = function (el) { return S.api.ldClaim(el.dataset.id).then(function () { LK.toast("Inaam de diya ✓"); return reload(); }, LK.fail); };
  LK.act.ldshare = function (el) {
    var e = LK.top(), d = e.d, t;
    if (d.status === "drawn") t = "🎉 " + d.shop_name + " — " + d.title + " ka RESULT\n\n" + (e.w || []).map(function (x) { var c = x.ld_coupons || {}; return "🏆 " + x.ld_prizes.name + ": " + (c.customer_name || "Winner") + " (coupon " + c.code + ")"; }).join("\n") + "\n\nLoKalLo app mein result jaanch sakte ho.";
    else t = "🎁 " + d.shop_name + " ka Lucky Draw: " + d.title + "!\n" + rulesLine(d) + ".\nInaam: " + prizeText(d) + "\n\nLoKalLo app se order karo aur coupon paao 🎟️";
    window.location.href = "https://wa.me/?text=" + encodeURIComponent(t);
  };

  /* ---------- issue coupon sheet ---------- */
  var IS = { name: "", phone: "", amount: "", src: "purchase" };
  LK.inp.ldi = function (el) { IS[el.dataset.k] = el.value; };
  LK.act.ldissue = function (el) {
    IS = { name: "", phone: "", amount: "", src: "purchase", id: el.dataset.id };
    var d = LK.top().d;
    LK.sheet("<h3>🎟️ Coupon do</h3>" + '<div class="chips flush">' + [["purchase", "Kharidari"], ["free", "Free entry"], ["manual", "Manual"]].map(function (s) { return '<button class="chip" data-act="ldsrc" data-v="' + s[0] + '" aria-pressed="' + (IS.src === s[0]) + '">' + s[1] + "</button>"; }).join("") + "</div>" +
      '<label class="fld"><span>Customer ka naam</span><input data-in="ldi" data-k="name" maxlength="60"></label><label class="fld"><span>Mobile number *</span><input data-in="ldi" data-k="phone" inputmode="tel" maxlength="12"></label>' +
      '<label class="fld" id="ldamtf"><span>Bill ki rakam (₹) — ' + esc(rulesLine(d)) + '</span><input data-in="ldi" data-k="amount" inputmode="decimal"></label>' +
      '<div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band</button><button class="btn" data-act="ldissueok">Coupon do</button></div>');
  };
  LK.act.ldsrc = function (el) {
    IS.src = el.dataset.v; el.parentNode.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); });
    var f = $("#ldamtf"); if (f) f.style.display = IS.src === "purchase" ? "" : "none";
  };
  LK.act.ldissueok = function (el) {
    return LK.busy(el, function () { return S.api.ldIssue(IS.id, IS.src === "purchase" ? num(IS.amount) : 0, IS.name.trim(), IS.phone.trim(), IS.src); }).then(function (r) {
      var n = (r || []).length; LK.closeSheet(); LK.toast(n + " coupon de diye ✓" + (n ? " (" + r.map(function (c) { return c.code; }).join(", ") + ")" : "")); return reload();
    });
  };

  /* ---------- run the draw: slot-machine reveal ---------- */
  var ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  function rnd8() { var s = ""; for (var i = 0; i < 8; i++) s += ALPHA.charAt(Math.floor(Math.random() * 32)); return s; }
  LK.act.ldrun = function (el) {
    var id = el.dataset.id;
    return LK.ask("Draw abhi nikalna hai? Iske baad coupon nahi de sakte aur result badal nahi sakta.", "Haan, draw nikalo").then(function (ok) {
      if (!ok) return;
      return S.api.ldRun(id).then(function () { return S.api.ldWinners(id); }).then(function (ws) { reveal(ws); return reload(); }, LK.fail);
    });
  };
  function reveal(ws) {
    var i = 0, skip = false, shown = [], tm = null;
    function paint(code, label, done) {
      LK.sheet('<h3>🎰 Lucky Draw</h3><p class="muted sm">' + (done ? "Winner:" : "Nikal raha hai…") + '</p><div class="ldslot' + (done ? " on" : "") + '">' + esc(code) + "</div><p><b>" + esc(label) + "</b></p>" +
        '<div class="ldshown">' + shown.map(function (s) { return "<div>🏆 " + esc(s) + "</div>"; }).join("") + '</div><button class="btn ' + (done && i >= ws.length ? "" : "ghost") + '" data-act="ldskip">' + (i >= ws.length && done ? "Theek hai" : "Skip ⏭") + "</button>");
    }
    LK.act.ldskip = function () { skip = true; clearTimeout(tm); LK.closeSheet(); };
    function next() {
      if (skip || !LK.sheetOpen() && i > 0) return;
      if (i >= ws.length) return paint(ws[ws.length - 1] ? ws[ws.length - 1].ld_coupons.code : "", "Sab winner nikal gaye! 🎉", true);
      var w = ws[i], c = w.ld_coupons || {}, t0 = Date.now(), dur = w.ld_prizes.rank === 1 ? 2600 : 1300;
      (function spin() {
        if (skip) return;
        if (Date.now() - t0 < dur) { paint(rnd8(), w.ld_prizes.name, false); tm = setTimeout(spin, 70); }
        else { shown.push(w.ld_prizes.name + " → " + (c.customer_name || c.code)); paint(c.code, w.ld_prizes.name + " — " + (c.customer_name || "") + " " + (c.customer_phone || ""), true); i++; tm = setTimeout(next, 1500); }
      })();
    }
    next();
  }

  /* ---------- verification + public result ---------- */
  LK.act.ldverify = function (el) {
    var id = el.dataset.id;
    return LK.busy(el, function () {
      return Promise.all([S.api.ldOne(id), S.api.ldVerify(id), S.api.ldWinners(id)]).then(function (a) {
        var d = a[0], cs = a[1].map(function (c) { return { id: c.coupon_id, code: c.code, phone_key: c.phone_key }; }), r = LD.verifyDraw(d, cs, d.ld_prizes, a[2]);
        LK.sheet("<h3>" + (r.ok ? "✅" : "❌") + " Result jaanch</h3><p>" + esc(r.message) + '</p><p class="muted sm">Ye jaanch aapke phone par hi hoti hai: seed ka SHA-256 hash draw se pehle publish hash se milaya jaata hai, phir wahi formula chala kar winners dobara nikaale jaate hain.</p><button class="btn" data-act="mclose" data-v="0">Theek hai</button>');
      });
    });
  };
  LK.act.ldresult = function (el) {
    var id = el.dataset.id;
    return S.api.ldResults(id).then(function (r) {
      LK.sheet("<h3>🏆 Winners</h3>" + ((r || []).length ? r.map(function (x) { return '<div class="card"><div class="row"><b>' + esc(x.prize_name) + '</b><span class="bd">' + esc(x.code) + '</span></div><div class="muted sm">' + esc(x.who) + "</div></div>"; }).join("") : '<div class="empty">Koi winner nahi.</div>') +
        '<button class="btn ghost" data-act="ldverify" data-id="' + id + '">✅ Result jaanchein</button><button class="btn" data-act="mclose" data-v="0">Band</button>');
    }, LK.fail);
  };

  /* ================= customer ================= */
  LK.ldBanner = function (list) {
    return (list || []).filter(function (d) { return d.status !== "closed" || true; }).map(function (d) {
      var live = d.status === "live";
      return '<div class="card ldban"><div class="row"><b>🎁 ' + esc(d.title) + "</b>" + badge(d.status) + '</div><div class="sm">' + esc(rulesLine(d)) + '</div><div class="muted sm">Inaam: ' + esc(prizeText(d)) + "</div>" +
        (live ? '<div class="sm">' + (d.end_at ? "Aakhri tareekh " + dt(d.end_at) + ". " : "") + "Order poora hote hi coupon aapko apne aap mil jayega 🎟️</div>" : "") +
        (d.status === "drawn" ? '<button class="btn ghost sm" data-act="ldresult" data-id="' + d.id + '">🏆 Winners dekho</button>' : "") + "</div>";
    }).join("");
  };
  V.ldmine = {
    tab: "me",
    html: function (e) {
      var d = e.data; var h = '<section class="pad"><h2>🎟️ Mere Lucky Draw coupon</h2>';
      if (!d) return h + LOADING + "</section>";
      if (!d.length) return h + '<div class="empty">Abhi koi coupon nahi. Jis dukaan par 🎁 Lucky Draw chal raha ho wahan se order karo — order poora hote hi coupon mil jayega.</div></section>';
      var by = {}, order = []; d.forEach(function (c) { if (!by[c.draw_id]) { by[c.draw_id] = []; order.push(c.draw_id); } by[c.draw_id].push(c); });
      return h + order.map(function (k) {
        var cs = by[k], f = cs[0], won = cs.filter(function (c) { return c.won_prize; });
        return '<div class="card"><div class="row"><b>' + esc(f.title) + "</b>" + badge(f.status) + '</div><div class="muted sm">' + esc(f.shop_name) + (f.end_at ? " · " + dt(f.end_at) : "") + "</div>" +
          won.map(function (c) { return '<div class="cta ok">🏆 Aap jeete: ' + esc(c.won_prize) + " (" + esc(c.code) + ")" + (c.claimed ? " — mil gaya ✓" : " — dukaan par jaakar lo") + "</div>"; }).join("") +
          '<div class="chips flush wrapc">' + cs.map(function (c) { return '<span class="chip sm" aria-pressed="' + !!c.won_prize + '">' + esc(c.code) + "</span>"; }).join("") + "</div>" +
          (f.status === "drawn" ? '<button class="btn ghost sm" data-act="ldresult" data-id="' + k + '">🏆 Winners / jaanch</button>' : "") + "</div>";
      }).join("") + "</section>";
    },
    init: function (e) { return S.api.ldMine().then(function (r) { e.data = r || []; LK.redraw(e); }).catch(LK.fail); }
  };
  LK.act.ldmine = function () { LK.go("ldmine"); };
})();
