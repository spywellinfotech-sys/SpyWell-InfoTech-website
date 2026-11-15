/* Prime membership billing: monthly charge for shops (Multi and Single), payment ledger with receipts, free-period, admin management. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc, money = LK.money, LOADING = '<div class="empty">Ruko…</div>';
  var ED = function () { return window.LK_SINGLE ? "single" : "multi"; };
  var DAY = 864e5;
  function fdate(t) { try { return new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }); } catch (x) { return String(t || "").slice(0, 10); } }
  function left(t) { return t ? Math.ceil((new Date(t) - Date.now()) / DAY) : null; }
  function plans(price, q, y) { var m = +price || 0; return [["month", "1 Mahina", 1, Math.round(m), 0], ["quarter", "3 Mahine", 3, Math.round(m * 3 * (100 - q) / 100), q], ["year", "1 Saal", 12, Math.round(m * 12 * (100 - y) / 100), y]]; }
  function untilOf(st) { return ED() === "single" ? st.single_until : st.multi_until; }
  function priceOf(st) { return +(ED() === "single" ? st.single_price : st.multi_price) || 0; }

  /* ---------- status loaded after login (owner only) ---------- */
  LK.subLoad = function () {
    if (S.demo || !S.shop || !S.api.subStatus) return Promise.resolve();
    return S.api.subStatus().then(function (r) { S.sub = r || null; }, function () {});
  };
  /* Warning card shown on the shopkeeper's Orders page. */
  LK.subBanner = function () {
    var st = S.sub; if (!st || !S.shop) return "";
    var u = untilOf(st), d = left(u), p = priceOf(st); if (!(p > 0)) return "";
    var free = st.free_now;
    if (free) return '<div class="card ok-c row"><span>🎁 Prime membership abhi FREE hai (' + fdate(st.free_until) + ' tak)</span></div>';
    if (u && d > 7) return "";
    var msg = !u || d <= 0 ? "⚠️ Aapki Prime membership khatam hai" + (ED() === "multi" ? " — dukaan customers ko nahi dikh rahi." : ".") : "⏰ Prime membership " + d + " din mein khatam hogi";
    return '<div class="card warn-c row"><span>' + msg + '</span><button class="btn sm" data-act="billing">Renew</button></div>';
  };

  /* ---------- owner: billing page ---------- */
  var PL = "month", HIST = null, SENT = false;
  V.billing = {
    get tab() { return S.mode === "shop" ? "sorders" : "me"; },
    html: function (e) {
      if (!S.shop) return '<section class="pad"><div class="empty">Ye option sirf dukaandaar ke liye hai.</div></section>';
      var st = S.sub; if (!st) return '<section class="pad"><h2>💎 Prime membership</h2>' + LOADING + "</section>";
      var u = untilOf(st), d = left(u), p = priceOf(st), ok = u && d > 0;
      var h = '<section class="pad"><h2>💎 Prime membership</h2><p class="muted sm">LoKalLo ' + (ED() === "single" ? "Single" : "Multi") + ' — fixed mahine ka charge</p>';
      h += '<div class="card"><div class="kv"><div><span>Monthly charge</span><b>' + (p > 0 ? money(p) : "Abhi koi charge nahi") + '</b></div><div><span>Status</span><b>' + (st.free_now ? "🎁 Free" : ok ? "✓ Chalu" : "⚠️ Khatam") + "</b></div>" +
        (u ? "<div><span>Plan " + (ok ? "tak" : "khatam hua") + "</span><b>" + fdate(u) + (ok ? " (" + d + " din)" : "") + "</b></div>" : "") +
        (st.free_now ? "<div><span>Free offer</span><b>" + fdate(st.free_until) + " tak</b></div>" : "") + "</div></div>";
      if (p > 0) h += '<button class="btn big" data-act="subrenew">🔄 Renew / Pay karo</button>';
      h += "<h3>🧾 Payment ka hisaab</h3>";
      if (!HIST) h += LOADING;
      else if (!HIST.length) h += '<div class="empty">Abhi koi payment darj nahi.</div>';
      else h += '<div class="card">' + HIST.map(function (x) { return '<div class="ri"><b class="nm">Receipt #' + x.receipt_no + "<small>" + fdate(x.paid_at) + " · " + x.months + " mahina · " + String(x.mode || "").toUpperCase() + (x.valid_to ? " · " + fdate(x.valid_to) + " tak" : "") + (x.note ? " · " + esc(x.note) : "") + "</small></b><b>" + money(x.amount) + "</b></div>"; }).join("") + "</div>";
      return h + "</section>";
    },
    init: function (e) {
      return Promise.all([LK.subLoad(), S.api.subPays()]).then(function (r) { HIST = r[1] || []; LK.redraw(e); }).catch(LK.fail);
    }
  };
  LK.act.billing = function () { HIST = null; LK.go("billing"); };
  function paySheet() {
    var st = S.sub, up = (S.fees || {}).admin_upi, pl = plans(priceOf(st), +st.q_off || 0, +st.y_off || 0), cur = pl.filter(function (x) { return x[0] === PL; })[0], amt = cur[3];
    var chips = '<div class="chips flush wrapc">' + pl.map(function (p) { return '<button class="chip" data-act="subplan" data-v="' + p[0] + '" aria-pressed="' + (PL === p[0]) + '">' + p[1] + " " + money(p[3]) + (p[4] ? " (" + p[4] + "% off)" : "") + "</button>"; }).join("") + "</div>";
    var body = SENT ? '<div class="card ok-c">✓ Request admin ko bhej di gayi. Payment verify hote hi plan chalu ho jayega.</div>'
      : (!up || !(amt > 0) || !LK.appBtns) ? '<p class="muted">Abhi payment option set nahi hai.</p>'
      : '<div class="kv"><div><span>Fee</span><b>' + money(amt) + "</b></div></div>" + LK.appBtns(LK.feeLink(up, amt)) + '<div class="kv"><div><span>UPI ID</span><b>' + esc(up) + "</b></div></div>" + LK.manualPay(up, amt) + '<button class="btn big" data-act="subpaid">✅ Maine fee pay kar di</button>';
    return "<h3>Plan renew karo</h3>" + chips + '<div id="subpay">' + body + '</div><button class="btn ghost" data-act="mclose" data-v="0">Band</button>';
  }
  LK.act.subrenew = function () { PL = "quarter"; SENT = !!(ED() === "multi" && S.sub && S.sub.pending_multi); LK.sheet(paySheet()); };
  LK.act.subplan = function (el) { if (SENT) return; PL = el.dataset.v; var s = $("#subpay"); el.parentNode.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); }); var tmp = document.createElement("div"); tmp.innerHTML = paySheet(); var n = tmp.querySelector("#subpay"); if (s && n) s.innerHTML = n.innerHTML; };
  LK.act.subpaid = function (el) {
    return LK.busy(el, function () { return ED() === "single" ? S.api.singleRequest(PL) : S.api.multiRequest(PL); }).then(function () { SENT = true; LK.toast("Admin ko bata diya ✓"); var s = $("#subpay"); if (s) s.innerHTML = '<div class="card ok-c">✓ Request admin ko bhej di gayi. Payment verify hote hi plan chalu ho jayega.</div>'; });
  };

  /* ---------- super admin: billing management ---------- */
  var F = {}, AD = null;
  function sdate(t, ed) { var d = left(t); return t ? (d > 0 ? fdate(t) + " (" + d + " din)" : "⚠️ " + fdate(t) + " ko khatam") : "—"; }
  V.abilling = {
    html: function (e) {
      if (!AD) return '<section class="pad"><h2>💎 Prime billing</h2>' + LOADING + "</section>";
      var d = AD, sh = d.shops || [];
      var freeVal = d.free_until ? new Date(d.free_until).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) : "";
      var h = '<section class="pad"><h2>💎 Prime billing</h2><div class="stats"><div><span>Kul vasooli</span><b>' + money(d.collected_total) + "</b></div><div><span>30 din mein</span><b>" + money(d.collected_30) + "</b></div><div><span>Free offer</span><b>" + (d.free_now ? "Chalu" : "Band") + "</b></div></div>" +
        '<div class="card"><h3>🎁 Free offer aur Multi charge</h3><p class="muted sm">Free date tak Multi aur Single dono ka monthly charge nahi lagega. Date khali = free band. Multi ka charge 0 ho to Multi mein kuch nahi lagega.</p>' +
        '<label class="fld"><span>Free kab tak (antim din)</span><input type="date" id="ab-free" value="' + freeVal + '"></label>' +
        '<label class="fld"><span>Multi monthly charge (₹)</span><input id="ab-mp" inputmode="numeric" value="' + (+d.multi_price || 0) + '"></label>' +
        '<p class="muted sm">Single ka default charge: ' + money(d.single_price) + ' (Admin mein "Single-shop plan ke daam" se badlo). Kisi ek dukaan ka alag charge neeche us dukaan se set karo.</p><button class="btn" data-act="absave">Save karo</button></div>';
      var rq = AD.reqs || [];
      if (rq.length) h += "<h3>🔔 Renew requests (" + rq.length + ")</h3>" + rq.map(function (r) { return '<div class="card hot"><div class="row"><b>' + esc(r.shop_name) + " (" + (r.ed === "multi" ? "Multi" : "Single") + ")</b><b>" + money(r.amount) + '</b></div><div class="muted sm">' + r.months + ' mahina · ' + esc(r.phone || "") + '</div><button class="btn" data-act="abapprove" data-id="' + r.shop_id + '" data-m="' + r.months + '" data-e="' + r.ed + '">✅ Payment mil gaya — ' + r.months + ' mahina chalu karo</button></div>'; }).join("");
      h += "<h3>🏪 Dukaanein (" + sh.length + ")</h3>" + (sh.length ? '<div class="card">' + sh.map(function (s) {
        return '<div class="ri"><b class="nm">' + esc(s.name) + (s.global ? " 🌐" : "") + "<small>Multi: " + sdate(s.multi_until) + " · Single: " + sdate(s.single_until) + " · " + s.pays + " payment · " + money(s.paid) + (s.multi_price != null ? " · Multi ₹" + s.multi_price : "") + (s.single_price != null ? " · Single ₹" + s.single_price : "") + "</small></b>" +
          '<button class="btn sm" data-act="abpay" data-id="' + s.id + '">💰</button><button class="btn ghost sm" data-act="abhist" data-id="' + s.id + '">🧾</button></div>';
      }).join("") + "</div>" : '<div class="empty">Koi dukaan nahi.</div>');
      return h + "</section>";
    },
    init: function (e) {
      return Promise.all([S.api.adminSubOverview(), S.api.adminSingleReqs().catch(function () { return []; }), S.api.adminMultiReqs().catch(function () { return []; })]).then(function (r) {
        AD = r[0] || {}; AD.reqs = (r[2] || []).map(function (x) { x.ed = "multi"; return x; }).concat((r[1] || []).map(function (x) { x.ed = "single"; return x; }));
        LK.redraw(e);
      }).catch(LK.fail);
    }
  };
  LK.act.abilling = function () { AD = null; LK.go("abilling"); };
  function reload() { var e = LK.top(); AD = null; LK.redraw(e); return V.abilling.init(e); }
  LK.act.absave = function (el) {
    var f = $("#ab-free").value, mp = Math.round(+String($("#ab-mp").value).replace(/[^\d.]/g, "") || 0);
    if (!(mp >= 0 && mp <= 100000)) return LK.toast("Charge sahi likho.", "bad");
    return LK.busy(el, function () { return S.api.adminSetSub(f ? f + "T23:59:00+05:30" : "", mp); }).then(function () { LK.toast("Save ho gaya ✓"); S.fees = S.fees || {}; return reload(); });
  };
  LK.act.abapprove = function (el) {
    var id = el.dataset.id, m = +el.dataset.m || 1, ed = el.dataset.e;
    return LK.busy(el, function () { return ed === "multi" ? S.api.adminMultiApprove(id, m) : S.api.adminSingleApprove(id, m); }).then(function () { LK.toast("Plan chalu kar diya ✓"); return reload(); });
  };
  LK.act.abpay = function (el) {
    var id = el.dataset.id, s = (AD.shops || []).filter(function (x) { return x.id === id; })[0] || {};
    F = { id: id, ed: "multi", amt: "", months: "1", mode: "cash", note: "" };
    LK.sheet('<h3>💰 Payment darj karo</h3><p class="muted sm">' + esc(s.name || "") + '</p><div class="chips flush"><button class="chip" data-act="abed" data-v="multi" aria-pressed="true">Multi</button><button class="chip" data-act="abed" data-v="single" aria-pressed="false">Single</button></div>' +
      '<label class="fld"><span>Kitna mila (₹)</span><input data-in="abf" data-k="amt" inputmode="numeric"></label><label class="fld"><span>Kitne mahine ka</span><input data-in="abf" data-k="months" inputmode="numeric" value="1"></label>' +
      '<div class="chips flush"><button class="chip" data-act="abmode" data-v="cash" aria-pressed="true">Cash</button><button class="chip" data-act="abmode" data-v="upi" aria-pressed="false">UPI</button><button class="chip" data-act="abmode" data-v="bank" aria-pressed="false">Bank</button></div>' +
      '<label class="fld"><span>Note (optional)</span><input data-in="abf" data-k="note" maxlength="120"></label><button class="btn big" data-act="abpaygo">Save — plan badhao</button><button class="btn ghost" data-act="mclose" data-v="0">Band</button>');
  };
  LK.inp.abf = function (el) { F[el.dataset.k] = el.value; };
  function seg(el, key) { F[key] = el.dataset.v; el.parentNode.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); }); }
  LK.act.abed = function (el) { seg(el, "ed"); };
  LK.act.abmode = function (el) { seg(el, "mode"); };
  LK.act.abpaygo = function (el) {
    var a = Math.round(+String(F.amt).replace(/[^\d.]/g, "") || 0), m = Math.round(+F.months || 0);
    if (!(a >= 0 && m >= 1 && m <= 60) || F.amt === "") return LK.toast("Raqam aur mahine sahi likho.", "bad");
    return LK.busy(el, function () { return S.api.adminSubAddPay(F.id, F.ed, a, m, F.mode, F.note); }).then(function () { LK.closeSheet(); LK.toast("Payment darj ho gaya ✓"); return reload(); });
  };
  LK.act.abhist = function (el) {
    var id = el.dataset.id;
    return S.api.subPays(id).then(function (r) {
      LK.sheet("<h3>🧾 Payment hisaab</h3>" + ((r || []).length ? '<div class="card">' + r.map(function (x) { return '<div class="ri"><b class="nm">#' + x.receipt_no + " · " + (x.edition === "multi" ? "Multi" : "Single") + "<small>" + fdate(x.paid_at) + " · " + x.months + " mahina · " + String(x.mode || "").toUpperCase() + (x.valid_to ? " · " + fdate(x.valid_to) + " tak" : "") + (x.note ? " · " + esc(x.note) : "") + "</small></b><b>" + money(x.amount) + "</b></div>"; }).join("") + "</div>" : '<div class="empty">Koi payment nahi.</div>') + '<button class="btn ghost" data-act="mclose" data-v="0">Band</button>');
    }).catch(LK.fail);
  };
})();
