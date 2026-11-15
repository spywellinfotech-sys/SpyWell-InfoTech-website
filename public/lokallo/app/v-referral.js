/* Merchant referral & rewards (Phase 4). Off until lk_settings.ref_on = 1. Backend: supabase/migrations/0009. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc, API = window.API, BE = window.BE, M = LK.money;
  LK.refOn = function () { return !!(S.fees && +S.fees.ref_on === 1); };
  var CODE = /^M[0-9A-Fa-f]{6}$/;
  var ERR = { referral_off: "Referral abhi chalu nahi hai", invalid_referral_code: "Ye referral code sahi nahi hai", self_referral: "Apna hi code nahi laga sakte", referral_already_used: "Aap pehle hi referral code laga chuke ho", referral_too_late: "Referral code sirf naye account par, pehle order se pehle lagta hai", referral_not_for_shops: "Dukaandaar customer-referral nahi laga sakte", shop_not_found: "Pehle dukaan save karo", reason_required: "Wajah likho", cannot_block: "Jis referral ka reward mil chuka hai use block nahi kar sakte", cannot_release: "Ye release nahi ho sakta", invalid_value: "Value galat hai" };
  function msg(x) { var m = (x && x.message) || "", k = Object.keys(ERR).filter(function (e) { return m.indexOf(e) > -1; })[0]; return k ? ERR[k] : (m || "Kuch gadbad hui"); }
  function fail(x) { LK.toast(msg(x), "bad"); }
  if (API && API.real && BE) {
    var R = API.real, oApply = R.applyReferral;
    R.refMy = function () { return BE.rpc("lk_ref_my", {}); };
    R.refApply = function (c, k) { return BE.rpc("lk_ref_apply", { p_code: c, p_kind: k }); };
    R.aRefSet = function (on, c, s, n) { return BE.rpc("lk_admin_ref_set", { p_on: !!on, p_cust: c, p_shop: s, p_orders: n }); };
    R.aRefOverview = function () { return BE.rpc("lk_admin_ref_overview", {}); };
    R.aRefList = function (f) { return BE.rpc("lk_admin_ref_list", { p_filter: f || "all" }); };
    R.aRefBlock = function (id, why) { return BE.rpc("lk_admin_ref_block", { p_ref: id, p_reason: why }); };
    R.aRefRelease = function (id) { return BE.rpc("lk_admin_ref_release", { p_ref: id }); };
    /* a merchant code (M + 6) goes to the new system; every other code still goes to the old friend-referral */
    R.applyReferral = function (c) { return CODE.test(String(c || "").trim()) ? R.refApply(String(c).trim().toUpperCase(), "customer").catch(function (x) { throw new Error(msg(x)); }) : oApply.call(R, c); };
  }
  if (API && API.demo) {
    var D = API.demo, w = function (v) { return new Promise(function (r) { setTimeout(function () { r(JSON.parse(JSON.stringify(v === undefined ? null : v))); }, 80); }); };
    D.refMy = function () { return w({ code: "M7K2P9", on: false, cust_reward: 10, shop_reward: 20, shop_orders: 5, customers: 0, shops: 0, pending: 0, earned: 0, adjusted: 0, available: 0, history: [] }); };
    D.refApply = D.aRefSet = D.aRefBlock = D.aRefRelease = function () { return w(); };
    D.aRefOverview = function () { return w({ on: false, cust_reward: 10, shop_reward: 20, shop_orders: 5, customers: 0, shops: 0, pending: 0, review: 0, blocked: 0, earned: 0, adjusted: 0 }); };
    D.aRefList = function () { return w([]); };
  }

  /* ?ref=CODE on a web link is remembered and pre-filled in the sign-up forms */
  try { var q = /[?&]ref=([A-Za-z0-9]{4,8})/.exec(location.search); if (q) localStorage.setItem("lk-ref", q[1].toUpperCase()); } catch (x) {}
  function saved() { try { return localStorage.getItem("lk-ref") || ""; } catch (x) { return ""; } }
  if (V.setup && V.setup.html) { var sh = V.setup.html; V.setup.html = function () { if (LK.form && !LK.form.ref && saved()) LK.form.ref = saved(); return sh.apply(this, arguments); }; }
  var oaf = LK.areaForm, oas = LK.areaFormSave;
  LK.areaForm = function () {
    var h = oaf ? oaf() : "";
    if (!S.shop && LK.refOn() && !window.LK_SINGLE) { if (LK.form && !LK.form.ref && saved()) LK.form.ref = saved(); h += '<label class="fld"><span>Referral code (agar kisi dukaandaar ne diya ho)</span><input data-in="f" data-k="ref" maxlength="8" autocapitalize="characters" autocomplete="off" value="' + esc((LK.form && LK.form.ref) || "") + '" placeholder="Jaise: M7K2P9"></label>'; }
    return h;
  };
  LK.areaFormSave = function () {
    var p = oas ? oas() : Promise.resolve(), code = LK.form && String(LK.form.ref || "").trim();
    return Promise.resolve(p).then(function () { if (code && !S.shop && LK.refOn()) return S.api.refApply(code.toUpperCase(), "shop").then(function () { LK.toast("Referral code lag gaya ✓"); }, fail); });
  };

  /* ---------- merchant ---------- */
  var ST = { REGISTERED: ["Judd gaya", "warn"], FIRST_ORDER_PENDING: ["Order baaki", "warn"], QUALIFIED: ["Admin check", "warn"], REWARDED: ["Reward mila ✓", "ok"], BLOCKED: ["Band", "bad"] };
  function badge(s, shop, d) { var b = ST[s] || [s, "warn"]; var t = b[0]; if (shop && s === "FIRST_ORDER_PENDING") t = d.verified ? d.orders_done + "/" + (LK.refCfg ? LK.refCfg.shop_orders : 5) + " order" : "Admin verify baaki"; return '<span class="bd ' + b[1] + '">' + t + "</span>"; }
  V.mref = {
    html: function (e) {
      var d = e.data; if (!d) return '<section class="pad"><h2>🎁 Referral aur Rewards</h2><div class="empty">Ruko…</div></section>';
      LK.refCfg = d;
      var h = '<section class="pad"><h2>🎁 Referral aur Rewards</h2>' + (d.on ? "" : '<div class="card warn-c">Referral abhi chalu nahi hai. Chalu hone par hi naye reward milenge.</div>') +
        '<div class="card"><p class="muted sm">Aapka referral code</p><div class="refcode">' + esc(d.code) + '</div><p class="muted sm">Customer judne par aur uska <b>pehla order</b> poora hone par aapko <b>' + M(d.cust_reward) + "</b> milta hai. Naya dukaandaar judne, admin se verify hone aur uske <b>" + d.shop_orders + " order</b> poore hone par <b>" + M(d.shop_reward) + '</b> milta hai.</p><button class="btn big" data-act="refshare" data-v="' + esc(d.code) + '">📤 WhatsApp par share karo</button></div>' +
        '<div class="stats"><div><span>Customer joode</span><b>' + d.customers + "</b></div><div><span>Dukaanein joodi</span><b>" + d.shops + "</b></div><div><span>Pending reward</span><b>" + M(d.pending) + "</b></div><div><span>Mila reward</span><b>" + M(d.earned) + "</b></div><div><span>Commission me laga</span><b>" + M(d.adjusted) + "</b></div><div><span>Abhi bacha credit</span><b>" + M(d.available) + "</b></div></div>" +
        '<p class="muted sm">Reward cash nahi hai. Ye aapke LoKalLo commission me se kat jata hai. Jo credit bach jata hai wo aage ke commission me kaam aata hai.</p>' +
        "<h3>Referral history</h3>" + ((d.history || []).length ? '<div class="card">' + d.history.map(function (x) { return '<div class="ri"><b class="nm">' + (x.kind === "shop" ? "🏪 " + esc(x.who || "Dukaan") : "👤 Customer") + "<small>" + LK.ago(x.at) + " · " + M(x.reward) + (x.held ? " · admin check ke baad milega" : "") + "</small></b>" + badge(x.status, x.kind === "shop", x) + "</div>"; }).join("") + "</div>" : '<div class="empty">Abhi koi referral nahi. Apna code share karo.</div>') + "</section>";
      return h;
    },
    init: function (e) { return S.api.refMy().then(function (d) { e.data = d; LK.redraw(e); }, function (x) { fail(x); e.data = { code: "—", on: false, history: [], cust_reward: 10, shop_reward: 20, shop_orders: 5 }; LK.redraw(e); }); }
  };
  LK.act.mref = function () { LK.go("mref"); };
  LK.act.refshare = function (el) {
    var c = el.dataset.v, m = "LoKalLo se apni gali ki dukaan se saman mangao 🛒\nSign up ke time ye referral code daalo: " + c + "\nApp download karo: " + (LK.APK_URL || "") + "\n(Dukaandaar ho to bhi isi code se judo)";
    if (window.LkNative && LkNative.shareApp && LkNative.shareApp(m) === "ok") return;
    if (navigator.share) { navigator.share({ title: "LoKalLo", text: m }).catch(function () {}); return; }
    window.location.href = "https://wa.me/?text=" + encodeURIComponent(m);
  };

  /* ---------- admin ---------- */
  var AF = { f: "all" };
  var KIND = { customer: "👤 Customer", shop: "🏪 Dukaan" };
  V.aref = {
    html: function (e) {
      var d = e.data; if (!d) return '<section class="pad"><h2>🎁 Referral</h2><div class="empty">Ruko…</div></section>';
      var o = d.o, chips = [["all", "Sab"], ["review", "Review (" + o.review + ")"], ["pending", "Pending"], ["blocked", "Blocked"]];
      return '<section class="pad"><h2>🎁 Referral</h2>' +
        '<div class="card"><div class="row"><b>Referral system</b><b>' + (o.on ? "ON ✓" : "OFF") + '</b></div><div class="two"><label class="fld"><span>Customer reward (₹)</span><input id="ar-c" inputmode="numeric" value="' + (+o.cust_reward) + '"></label><label class="fld"><span>Dukaan reward (₹)</span><input id="ar-s" inputmode="numeric" value="' + (+o.shop_reward) + '"></label></div><label class="fld"><span>Naye dukaan ke kitne order poore hon</span><input id="ar-n" inputmode="numeric" value="' + (+o.shop_orders) + '"></label>' +
        '<p class="muted sm">Pehli baar ON karne ke baad hi bane naye account judte hain. Purane account aur purane order par reward kabhi nahi milta. Customer ka order itna bada ho ki platform ka commission reward se kam na ho (jaise 5% par ₹10 ke liye ₹200).</p><button class="btn ' + (o.on ? "ghost" : "") + '" data-act="arset" data-v="' + (o.on ? 0 : 1) + '">' + (o.on ? "Band karo" : "Chalu karo") + '</button> <button class="btn ghost" data-act="arset" data-v="' + (o.on ? 1 : 0) + '">Sirf rakam save</button></div>' +
        '<div class="stats"><div><span>Customer referral</span><b>' + o.customers + "</b></div><div><span>Dukaan referral</span><b>" + o.shops + "</b></div><div><span>Pending</span><b>" + o.pending + "</b></div><div><span>Review me</span><b>" + o.review + "</b></div><div><span>Reward diya</span><b>" + M(o.earned) + "</b></div><div><span>Commission me laga</span><b>" + M(o.adjusted) + "</b></div></div>" +
        '<div class="chips">' + chips.map(function (c) { return '<button class="chip" aria-pressed="' + (AF.f === c[0]) + '" data-act="arfil" data-v="' + c[0] + '">' + c[1] + "</button>"; }).join("") + "</div>" +
        ((d.list || []).length ? d.list.map(function (r) { var b = ST[r.status] || [r.status, "warn"]; return '<div class="card' + ((r.flags || []).length && r.status !== "REWARDED" ? " hot" : "") + '"><div class="row"><b>' + (KIND[r.kind] || r.kind) + " · " + esc(r.referred || "—") + '</b><span class="bd ' + b[1] + '">' + b[0] + '</span></div><div class="muted sm">Referrer: ' + esc(r.referrer || "—") + " · " + M(r.reward) + " · " + LK.ago(r.at) + (r.kind === "shop" ? " · " + r.orders_done + " order" : "") + ((r.flags || []).length ? "<br>⚠️ Shak: " + esc(r.flags.join(", ")) : "") + (r.reason ? "<br>Wajah: " + esc(r.reason) : "") + "</div>" +
          (r.status !== "REWARDED" && r.status !== "BLOCKED" ? '<div class="row2">' + (r.held || (r.flags || []).length ? '<button class="btn sm" data-act="arrel" data-id="' + r.id + '">✅ Theek hai, release</button>' : "") + '<button class="btn ghost sm danger-t" data-act="arblk" data-id="' + r.id + '">🚫 Block</button></div>' : "") + "</div>"; }).join("") : '<div class="empty">Koi referral nahi.</div>') + "</section>";
    },
    init: function (e) { return Promise.all([S.api.aRefOverview(), S.api.aRefList(AF.f)]).then(function (r) { e.data = { o: r[0], list: r[1] }; LK.redraw(e); }, function (x) { fail(x); e.data = { o: { on: false, cust_reward: 10, shop_reward: 20, shop_orders: 5, customers: 0, shops: 0, pending: 0, review: 0, earned: 0, adjusted: 0 }, list: [] }; LK.redraw(e); }); }
  };
  function redoA() { var e = LK.top(); e.data = null; LK.redraw(e); return V.aref.init(e); }
  LK.act.aref = function () { AF.f = "all"; LK.go("aref"); };
  LK.act.arfil = function (el) { AF.f = el.dataset.v; return redoA(); };
  LK.act.arset = function (el) {
    var c = parseFloat($("#ar-c").value), s = parseFloat($("#ar-s").value), n = parseInt($("#ar-n").value, 10), on = el.dataset.v === "1";
    if (!(c >= 0 && c <= 100 && s >= 0 && s <= 100 && n >= 1 && n <= 50)) return LK.toast("Rakam 0–100 aur order 1–50 rakho", "bad");
    return LK.ask(on ? "Referral chalu/jaari rakhna hai? Sirf isi ke baad bane naye account judenge." : "Referral band karna hai?", "Haan", !on).then(function (y) { if (y) return LK.busy(el, function () { return S.api.aRefSet(on, c, s, n); }).then(function () { S.fees.ref_on = on ? 1 : 0; LK.toast("Save ✓"); return redoA(); }, fail); });
  };
  LK.act.arrel = function (el) { return LK.ask("Is referral ka reward dena theek hai?", "Haan, release karo").then(function (y) { if (y) return LK.busy(el, function () { return S.api.aRefRelease(el.dataset.id); }).then(function () { LK.toast("Release ✓"); return redoA(); }, fail); }); };
  LK.act.arblk = function (el) {
    LK.sheet('<h3>Block karne ki wajah</h3><label class="fld"><span>Wajah *</span><input id="ar-w" maxlength="200" placeholder="jaise: ek hi phone number"></label><div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn danger" data-act="arblk2" data-id="' + el.dataset.id + '">Block karo</button></div>');
  };
  LK.act.arblk2 = function (el) { var w = ($("#ar-w").value || "").trim(); if (w.length < 3) return LK.toast("Wajah likho", "bad"); return LK.busy(el, function () { return S.api.aRefBlock(el.dataset.id, w); }).then(function () { LK.closeSheet(); LK.toast("Block ✓"); return redoA(); }, fail); };
})();
