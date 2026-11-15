/* Commission ledger (Phase 2). Everything is off until lk_settings.commission_on = 1. Backend: supabase/migrations/0007. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc, API = window.API, BE = window.BE;
  var M = LK.money;
  LK.commOn = function () { return !!(S.fees && +S.fees.commission_on === 1); };
  if (API && API.real && BE) {
    var R = API.real;
    R.commSummary = function () { return BE.rpc("lk_comm_summary", {}); };
    R.commStatement = function (w) { return BE.rpc("lk_comm_statement", { p_week: w || null }); };
    R.commPayments = function () { return BE.rpc("lk_comm_payments", {}); };
    R.commSubmit = function (amt, utr, on) { return BE.rpc("lk_comm_submit_payment", { p_amount: amt, p_utr: utr, p_paid_on: on }); };
    R.shopVerifyUpi = function (id, ok) { return BE.rpc("lk_shop_verify_upi", { p_order: id, p_ok: ok !== false }); };
    R.aCommSet = function (pct, on) { return BE.rpc("lk_admin_comm_set", { p_pct: pct, p_on: !!on }); };
    R.aCommOverview = function () { return BE.rpc("lk_admin_comm_overview", {}); };
    R.aCommShops = function () { return BE.rpc("lk_admin_comm_shops", {}); };
    R.aCommStatement = function (shop, w) { return BE.rpc("lk_admin_comm_statement", { p_shop: shop, p_week: w || null }); };
    R.aCommPending = function () { return BE.rpc("lk_admin_comm_pending", {}); };
    R.aCommVerify = function (id) { return BE.rpc("lk_admin_comm_verify", { p_payment: id }); };
    R.aCommReject = function (id, why) { return BE.rpc("lk_admin_comm_reject", { p_payment: id, p_reason: why || "" }); };
    R.aCommRecord = function (shop, amt, utr, on, ver) { return BE.rpc("lk_admin_comm_record", { p_shop: shop, p_amount: amt, p_utr: utr, p_paid_on: on, p_verify: !!ver }); };
    R.aCommReverse = function (order, why) { return BE.rpc("lk_admin_comm_reverse", { p_order: order, p_reason: why }); };
    R.aCommRefunds = function (days) { return BE.rpc("lk_admin_comm_refunds", { p_days: days || 30 }); };
  }
  if (API && API.demo) {
    var D = API.demo, w = function (v) { return new Promise(function (r) { setTimeout(function () { r(JSON.parse(JSON.stringify(v === undefined ? null : v))); }, 80); }); };
    D.commSummary = function () { return w({ completed_sales: 0, cod_sales: 0, upi_sales_verified: 0, upi_sales_unverified: 0, commission_total: 0, commission_paid: 0, outstanding: 0, this_week_due: 0, pending_payments: 0, rate: 5, on: false, weeks: [] }); };
    D.commStatement = D.commPayments = D.aCommShops = D.aCommPending = D.aCommRefunds = function () { return w([]); };
    D.commSubmit = D.shopVerifyUpi = D.aCommSet = D.aCommVerify = D.aCommReject = D.aCommRecord = D.aCommReverse = function () { return w(); };
    D.aCommOverview = function () { return w({ earned: 0, collected: 0, outstanding: 0, refund_adjustments: 0, reversals: 0, pending_verification: { count: 0, amount: 0 }, rate: 5, on: false }); };
    D.aCommStatement = function () { return w({ balance: 0, orders: [], payments: [] }); };
  }
  var ERR = { invalid_reference: "UPI reference galat hai (8–30 akshar/number, bina space)", duplicate_reference: "Ye reference pehle use ho chuka hai", invalid_amount: "Amount galat hai", invalid_date: "Date galat hai", too_many_pending: "Pehle ke payments verify hone do", exceeds_outstanding: "Amount baaki hisaab se zyada hai", payment_decided: "Is payment par faisla ho chuka hai", invalid_pct: "Rate 0 se 20 ke beech rakho", already_reversed: "Ye pehle hi reverse ho chuka hai", no_commission: "Is order par commission nahi hai", reason_required: "Wajah likho", not_upi_order: "Ye UPI order nahi hai", not_payable: "Abhi UPI confirm nahi ho sakta" };
  function fail(x) { var m = (x && x.message) || ""; var k = Object.keys(ERR).filter(function (e) { return m.indexOf(e) > -1; })[0]; if (k) LK.toast(ERR[k], "bad"); else LK.fail(x); }
  function wk(d) { var t = new Date(d + "T00:00:00"), e = new Date(t.getTime() + 6 * 864e5), f = function (x) { return x.toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }; return f(t) + " – " + f(e); }
  function today() { return new Date(Date.now() + 5.5 * 36e5).toISOString().slice(0, 10); }
  function badge(s) { return '<span class="bd ' + (s === "verified" ? "ok" : s === "rejected" ? "bad" : "warn") + '">' + ({ verified: "Verify ✓", rejected: "Reject", submitted: "Jaanch baaki" })[s] + "</span>"; }
  function payRows(a) { return (a || []).length ? a.map(function (p) { return '<div class="ri"><b class="nm">' + M(p.amount) + " " + badge(p.status) + "<small>" + esc(p.utr) + " · " + esc(p.paid_on) + (p.reject_reason ? " · " + esc(p.reject_reason) : "") + (p.source === "admin" ? " · admin ne likha" : "") + "</small></b></div>"; }).join("") : '<div class="empty">Abhi koi payment nahi.</div>'; }
  function ordRows(a) { return (a || []).length ? a.map(function (o) { return '<div class="ri"><b class="nm">#' + esc(o.code) + " · " + (o.mode === "upi" ? "UPI" + (o.upi_verified ? " ✓" : "") : "Cash") + "<small>Saman " + M(o.subtotal) + (+o.refund > 0 ? " − refund " + M(o.refund) : "") + " × " + (+o.pct) + "%</small></b><b>" + M(o.commission) + "</b></div>"; }).join("") : '<div class="empty">Is hafte koi commission nahi.</div>'; }
  function csvDl(name, rows) {
    var t = "﻿" + rows.map(function (r) { return r.map(function (v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\r\n");
    try { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); } catch (x) {}
    try { navigator.clipboard.writeText(t).then(function () { LK.toast("CSV copy ho gayi — Sheets/WhatsApp me paste karo"); }); } catch (x) {}
  }

  /* ---------- merchant ---------- */
  var MC = { week: null };
  V.mcomm = {
    html: function (e) {
      var d = e.data; if (!d) return '<section class="pad"><h2>💰 Commission hisaab</h2><div class="empty">Ruko…</div></section>';
      var s = d.s, weeks = (s.weeks || []);
      return '<section class="pad"><h2>💰 Commission hisaab</h2><p class="muted sm">LoKalLo ka commission ' + (+s.rate) + '% sirf saman ke daam par lagta hai (delivery par nahi). Cash (COD) aur UPI dono orders par, poore hue orders ke baad.' + (s.on ? "" : " <b>Abhi band hai.</b>") + "</p>" +
        '<div class="stats"><div><span>Baaki (dena hai)</span><b>' + M(s.outstanding) + "</b></div><div><span>Is hafte ka</span><b>" + M(s.this_week_due) + "</b></div><div><span>Kul commission</span><b>" + M(s.commission_total) + "</b></div><div><span>Diya hua</span><b>" + M(s.commission_paid) + "</b></div></div>" +
        '<div class="card"><div class="kv"><div><span>Poori bikri</span><b>' + M(s.completed_sales) + "</b></div><div><span>Cash (COD) bikri</span><b>" + M(s.cod_sales) + "</b></div><div><span>UPI bikri (aapne check ki)</span><b>" + M(s.upi_sales_verified) + "</b></div><div><span>UPI — check baaki</span><b>" + M(s.upi_sales_unverified) + "</b></div></div></div>" +
        '<button class="btn big" data-act="mcpay">📲 Maine commission pay kiya — reference bhejo</button>' +
        '<p class="muted sm">Har hafte UPI se admin ko pay karo. Reference bhejne se payment apne aap pakki nahi hoti — admin bank me dekh kar verify karta hai.</p>' +
        "<h3>Hafta (Somvar–Ravivar)</h3>" + (weeks.length ? '<div class="chips">' + weeks.map(function (x) { return '<button class="chip" aria-pressed="' + (MC.week === x.week) + '" data-act="mcweek" data-w="' + x.week + '">' + wk(x.week) + " · " + M(x.accrued) + "</button>"; }).join("") + '<button class="chip" aria-pressed="' + (!MC.week) + '" data-act="mcweek" data-w="">Sab</button></div>' : "") +
        '<div class="card">' + ordRows(d.st) + "</div><h3>Payment history</h3><div class=\"card\">" + payRows(d.pay) + "</div></section>";
    },
    init: function (e) {
      return Promise.all([S.api.commSummary(), S.api.commStatement(MC.week), S.api.commPayments()]).then(function (r) { e.data = { s: r[0] || {}, st: r[1] || [], pay: r[2] || [] }; LK.redraw(e); }, function (x) { fail(x); e.data = { s: {}, st: [], pay: [] }; LK.redraw(e); });
    }
  };
  function redoM() { var e = LK.top(); e.data = null; LK.redraw(e); return V.mcomm.init(e); }
  LK.act.mcomm = function () { MC.week = null; LK.go("mcomm"); };
  LK.act.mcweek = function (el) { MC.week = el.dataset.w || null; return redoM(); };
  LK.act.mcpay = function () {
    var due = LK.top().data ? +LK.top().data.s.outstanding || 0 : 0;
    LK.sheet('<h3>Commission pay ka reference</h3><p class="muted sm">Pehle admin ke UPI par pay karo, phir yahan UPI reference (UTR) likho.</p><label class="fld"><span>Amount (₹) *</span><input id="cp-a" inputmode="decimal" value="' + (due > 0 ? due : "") + '"></label><label class="fld"><span>UPI reference / UTR *</span><input id="cp-u" maxlength="30" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="jaise 412345678901"></label><label class="fld"><span>Pay ki date *</span><input id="cp-d" type="date" value="' + today() + '"></label><div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="mcsend">Bhejo</button></div>');
  };
  LK.act.mcsend = function (el) {
    var a = parseFloat($("#cp-a").value), u = $("#cp-u").value, d = $("#cp-d").value;
    if (!(a > 0)) return LK.toast("Amount likho", "bad");
    return LK.busy(el, function () { return S.api.commSubmit(Math.round(a * 100) / 100, u, d); }).then(function () { LK.closeSheet(); LK.toast("Bhej diya — admin verify karega"); return redoM(); }, fail);
  };
  LK.act.upiok = function (el) {
    var ok = el.dataset.v === "1";
    return LK.ask(ok ? "Kya ye UPI payment aapke bank/UPI app me aa gayi hai?" : "UPI payment ka check hata dein?", ok ? "Haan, aa gayi" : "Haan, hatao", !ok).then(function (y) {
      if (y) return S.api.shopVerifyUpi(el.dataset.id, ok).then(function () { LK.toast(ok ? "Payment pakki ✓" : "Hata diya"); var e = LK.top(); if (e && e.view === "sorder") { e.data = null; e.sig = null; LK.redraw(e); return V.sorder.init(e); } }, fail);
    });
  };

  /* ---------- admin ---------- */
  var AC = { shop: null, week: null };
  V.acomm = {
    html: function (e) {
      var d = e.data; if (!d) return '<section class="pad"><h2>💰 Commission</h2><div class="empty">Ruko…</div></section>';
      if (AC.shop) {
        var st = d.stmt, sh = (d.shops || []).filter(function (x) { return x.shop_id === AC.shop; })[0] || {};
        return '<section class="pad"><button class="btn ghost sm" data-act="acback">◂ Peeche</button><h2>' + esc(sh.name || "Dukaan") + '</h2><div class="stats"><div><span>Baaki</span><b>' + M(st.balance) + "</b></div><div><span>Is hafte ka</span><b>" + M(sh.this_week) + "</b></div></div>" +
          '<div class="row2"><button class="btn" data-act="acrec">＋ Payment likho</button><button class="btn ghost" data-act="accsv">CSV</button></div><h3>Order-wise commission</h3><div class="card">' + ordRows(st.orders) + "</div><h3>Payments</h3><div class=\"card\">" + st.payments.map(function (p) { return '<div class="ri"><b class="nm">' + M(p.amount) + " " + badge(p.status) + "<small>" + esc(p.utr) + " · " + esc(p.paid_on) + "</small></b>" + (p.status === "submitted" ? '<button class="btn sm" data-act="acver" data-id="' + p.id + '">Verify</button><button class="btn ghost sm" data-act="acrej" data-id="' + p.id + '">Reject</button>' : "") + "</div>"; }).join("") + "</div></section>";
      }
      var o = d.o, pend = d.pend || [];
      return '<section class="pad"><h2>💰 Commission</h2>' +
        '<div class="card"><div class="row"><b>Commission engine</b><b>' + (o.on ? "ON ✓" : "OFF") + '</b></div><label class="fld"><span>Rate % (naye orders ke liye, 0–20)</span><input id="ac-p" inputmode="decimal" value="' + (+o.rate) + '"></label><p class="muted sm">Rate order confirm hote waqt us order par fix ho jata hai. Badalne se purane orders nahi badalte. OFF hone par kuch nahi lagta.</p><button class="btn ' + (o.on ? "ghost" : "") + '" data-act="acset" data-v="' + (o.on ? 0 : 1) + '">' + (o.on ? "Band karo" : "Chalu karo") + '</button> <button class="btn ghost" data-act="acset" data-v="' + (o.on ? 1 : 0) + '">Sirf rate save</button></div>' +
        '<div class="stats"><div><span>Kul kamai</span><b>' + M(o.earned) + "</b></div><div><span>Mila (verified)</span><b>" + M(o.collected) + "</b></div><div><span>Baaki</span><b>" + M(o.outstanding) + "</b></div><div><span>Refund adjust</span><b>" + M(o.refund_adjustments) + "</b></div></div>" +
        "<h3>Verify karne wale payments (" + pend.length + ")</h3>" + (pend.length ? pend.map(function (p) { return '<div class="card hot"><div class="row"><b>' + esc(p.shop || "") + "</b><b>" + M(p.amount) + '</b></div><div class="muted sm">UTR ' + esc(p.utr) + " · " + esc(p.paid_on) + ' · pehle bank/UPI me check karo</div><div class="row2"><button class="btn sm" data-act="acver" data-id="' + p.id + '">✅ Verify</button><button class="btn ghost sm" data-act="acrej" data-id="' + p.id + '">Reject</button></div></div>'; }).join("") : '<div class="empty">Koi payment baaki nahi.</div>') +
        '<h3>Dukaan-wise baaki</h3><div class="card">' + ((d.shops || []).length ? d.shops.map(function (s) { return '<button type="button" class="ri" data-act="acshop" data-id="' + s.shop_id + '"><b class="nm">' + esc(s.name) + "<small>Is hafte " + M(s.this_week) + " · diya " + M(s.paid) + (s.pending ? " · " + s.pending + " verify baaki" : "") + "</small></b><b>" + M(s.outstanding) + "</b></button>"; }).join("") : '<div class="empty">Abhi koi commission nahi bani.</div>') + "</div>" +
        '<div class="row2"><button class="btn ghost" data-act="acref">Refund / adjustment report</button><button class="btn ghost" data-act="acall">Sab dukaanon ki CSV</button></div></section>';
    },
    init: function (e) {
      var p = [S.api.aCommOverview(), S.api.aCommShops(), S.api.aCommPending()];
      if (AC.shop) p.push(S.api.aCommStatement(AC.shop, AC.week));
      return Promise.all(p).then(function (r) { e.data = { o: r[0], shops: r[1], pend: r[2], stmt: r[3] }; LK.redraw(e); }, function (x) { fail(x); AC.shop = null; });
    }
  };
  function redoA() { var e = LK.top(); e.data = null; LK.redraw(e); return V.acomm.init(e); }
  LK.act.acomm = function () { AC.shop = null; LK.go("acomm"); };
  LK.act.acshop = function (el) { AC.shop = el.dataset.id; return redoA(); };
  LK.act.acback = function () { AC.shop = null; return redoA(); };
  LK.act.acset = function (el) {
    var p = parseFloat($("#ac-p").value), v = el.dataset.v === "1"; if (!(p >= 0 && p <= 20)) return LK.toast("Rate 0 se 20 ke beech rakho", "bad");
    return LK.ask(v ? "Commission " + p + "% par chalu rakhna/karna hai? Ye sirf naye confirm hone wale orders par lagega." : "Commission band karna hai? Naye orders par commission nahi banega.", "Haan", !v).then(function (y) { if (y) return LK.busy(el, function () { return S.api.aCommSet(p, v); }).then(function () { S.fees.commission_on = v ? 1 : 0; S.fees.commission_pct = p; LK.toast("Save ✓"); return redoA(); }, fail); });
  };
  LK.act.acver = function (el) { return LK.ask("Kya aapne bank/UPI me ye payment aate dekh li hai?", "Haan, verify karo").then(function (y) { if (y) return LK.busy(el, function () { return S.api.aCommVerify(el.dataset.id); }).then(function () { LK.toast("Verify ✓"); return redoA(); }, fail); }); };
  LK.act.acrej = function (el) {
    LK.sheet('<h3>Reject karne ki wajah</h3><label class="fld"><span>Wajah</span><input id="ac-w" maxlength="200"></label><div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="acrej2" data-id="' + el.dataset.id + '">Reject</button></div>');
  };
  LK.act.acrej2 = function (el) { return LK.busy(el, function () { return S.api.aCommReject(el.dataset.id, $("#ac-w").value); }).then(function () { LK.closeSheet(); return redoA(); }, fail); };
  LK.act.acrec = function () {
    LK.sheet('<h3>Payment likho</h3><label class="fld"><span>Amount (₹) *</span><input id="ar-a" inputmode="decimal"></label><label class="fld"><span>UPI reference / UTR *</span><input id="ar-u" maxlength="30" autocapitalize="characters" autocorrect="off"></label><label class="fld"><span>Date *</span><input id="ar-d" type="date" value="' + today() + '"></label><label class="fld"><span><input id="ar-v" type="checkbox"> Bank me dekh li — abhi verify bhi karo</span></label><div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="acrec2">Save</button></div>');
  };
  LK.act.acrec2 = function (el) {
    var a = parseFloat($("#ar-a").value); if (!(a > 0)) return LK.toast("Amount likho", "bad");
    return LK.busy(el, function () { return S.api.aCommRecord(AC.shop, Math.round(a * 100) / 100, $("#ar-u").value, $("#ar-d").value, $("#ar-v").checked); }).then(function () { LK.closeSheet(); LK.toast("Save ✓"); return redoA(); }, fail);
  };
  LK.act.accsv = function () {
    var d = LK.top().data, sh = (d.shops || []).filter(function (x) { return x.shop_id === AC.shop; })[0] || {};
    var rows = [["Order", "Tarika", "UPI check", "Saman", "Refund", "Rate %", "Commission"]].concat(d.stmt.orders.map(function (o) { return [o.code, o.mode, o.upi_verified ? "haan" : "nahi", o.subtotal, o.refund, o.pct, o.commission]; }));
    rows.push([]); rows.push(["Payment", "UTR", "Date", "Status"]); d.stmt.payments.forEach(function (p) { rows.push([p.amount, p.utr, p.paid_on, p.status]); });
    csvDl("commission-" + (sh.name || "shop") + "-" + today() + ".csv", rows);
  };
  LK.act.acall = function () { var d = LK.top().data; csvDl("commission-sab-" + today() + ".csv", [["Dukaan", "Phone", "Kul commission", "Diya", "Baaki", "Is hafte"]].concat((d.shops || []).map(function (s) { return [s.name, s.phone, s.accrued, s.paid, s.outstanding, s.this_week]; }))); };
  LK.act.acref = function () {
    return S.api.aCommRefunds(30).then(function (r) { LK.sheet("<h3>Refund / adjustment (30 din)</h3>" + ((r || []).length ? r.map(function (x) { return '<div class="ri"><b class="nm">' + esc(x.shop || "") + " · #" + esc(x.code || "") + "<small>" + (x.kind === "reversal" ? "Reverse" : "Refund adjust") + " · " + esc(x.note || "") + "</small></b><b>" + M(x.amount) + "</b></div>"; }).join("") : '<div class="empty">Kuch nahi.</div>') + '<button class="btn ghost" data-act="mclose" data-v="0">Band karo</button>'); }, fail);
  };
})();
