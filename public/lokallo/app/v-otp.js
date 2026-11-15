/* Optional delivery OTP (Phase 3). Shop switch lk_shops.otp_on; code kept in lk_order_otp (only the customer can read it).
   The database refuses "completed" until the code is verified, so old APKs just get an 'otp_required' error. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc, API = window.API, BE = window.BE;
  var NEED = /otp_required/;
  if (API && API.real && BE) {
    var R = API.real;
    R.shopSetOtp = function (on) { return BE.rpc("lk_shop_set_otp", { p_on: !!on }); };
    R.otpCheck = function (id, code) { return BE.rpc("lk_otp_check", { p_order: id, p_code: code }); };
    R.otpSkip = function (id, why) { return BE.rpc("lk_otp_skip", { p_order: id, p_reason: why }); };
    var oSet = R.setStatus, oDel = R.dboyDeliver, oOrd = R.order;
    function retry(fn, id, skip) { return function () { var a = arguments; return fn.apply(R, a).catch(function (x) { if (!NEED.test((x && x.message) || "")) throw x; return LK.otpAsk(id, skip).then(function () { return fn.apply(R, a); }); }); }; }
    R.setStatus = function (id) { return retry(oSet, id, true).apply(null, arguments); };
    R.dboyDeliver = function (id) { return retry(oDel, id, false).apply(null, arguments); };
    R.order = function (id) {
      return oOrd.call(R, id).then(function (r) {
        if (r && r.o && r.o.otp_required && ["confirmed", "ready", "out_for_delivery"].indexOf(r.o.status) > -1)
          return BE.sel("lk_order_otp", "order_id=eq." + id + "&select=code").then(function (x) { if (x && x[0]) r.otp = x[0].code; return r; }, function () { return r; });
        return r;
      });
    };
  }
  if (API && API.demo) { var D = API.demo; D.shopSetOtp = D.otpCheck = D.otpSkip = function () { return Promise.resolve({ ok: true }); }; }

  var ST = null;
  LK.otpAsk = function (id, canSkip) {
    return new Promise(function (res, rej) {
      ST = { id: id, res: res, rej: rej };
      LK.sheet('<h3>🔐 Delivery code</h3><p class="muted sm">Customer ke app me 4 ank ka code dikh raha hai. Wo code yahan likho, tabhi order poora hoga.</p><label class="fld"><span>Code *</span><input id="otp-c" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="0000"></label><p id="otp-m" class="muted sm"></p><div class="row2"><button class="btn ghost" data-act="otpx">Band karo</button><button class="btn" data-act="otpgo">Check karo</button></div>' +
        (canSkip ? '<button class="btn ghost danger-t" data-act="otpsk">Bina code ke poora karo</button>' : ""));
    });
  };
  function end(ok) { var s = ST; ST = null; LK.closeSheet(); if (s) { if (ok) s.res(); else s.rej(new Error("Code nahi daala — order poora nahi hua")); } }
  LK.act.otpx = function () { end(false); };
  LK.act.otpgo = function (el) {
    var c = ($("#otp-c").value || "").trim(); if (!/^\d{4}$/.test(c)) return LK.toast("4 ank ka code likho", "bad");
    var id = ST && ST.id;
    return LK.busy(el, function () { return S.api.otpCheck(id, c); }).then(function (r) {
      if (r && r.ok) return end(true);
      var m = $("#otp-m"); if (m) m.textContent = r && r.locked ? "Bahut galat koshish — code lock ho gaya. Customer se naya code nahi milta; dukaan 'bina code ke' poora kar sakti hai." : "Galat code. " + (r ? r.left : "") + " koshish baaki.";
    });
  };
  LK.act.otpsk = function () {
    var id = ST && ST.id;
    LK.sheet('<h3>Bina code ke poora karo</h3><label class="fld"><span>Wajah likho *</span><input id="otp-w" maxlength="200" placeholder="jaise: customer ka phone band hai"></label><div class="row2"><button class="btn ghost" data-act="otpx">Wapas</button><button class="btn danger" data-act="otpsk2">Poora karo</button></div>');
    if (ST) ST.id = id;
  };
  LK.act.otpsk2 = function (el) {
    var w = ($("#otp-w").value || "").trim(); if (w.length < 3) return LK.toast("Wajah likho", "bad");
    return LK.busy(el, function () { return S.api.otpSkip(ST.id, w); }).then(function () { end(true); });
  };

  /* customer sees the code */
  if (V.order && V.order.html) {
    var oh = V.order.html;
    V.order.html = function (e) {
      var h = oh.apply(this, arguments), d = e && e.data;
      if (d && d.otp && d.o && d.o.otp_required) {
        var card = '<div class="card hot"><div class="row"><b>🔐 Delivery code</b><b style="font-size:26px;letter-spacing:6px">' + esc(d.otp) + '</b></div><p class="muted sm">Ye code tabhi delivery boy ya dukaan ko batao jab aapko saman mil jaye.</p></div>';
        var i = h.indexOf('<div class="card bill">'); if (i > -1) h = h.slice(0, i) + card + h.slice(i);
      }
      return h;
    };
  }
  var oInit = V.order && V.order.init;
  if (oInit) V.order.init = function (e) { var q = arguments[1]; return oInit.apply(this, arguments).then(function (x) { var d = e.data, r = d && d.o; if (r && r.otp_required && !d.otp) { return S.api.order(r.id).then(function (y) { if (y && y.otp) { d.otp = y.otp; LK.redraw(e); } }, function () {}); } return x; }); };

  /* shop switch */
  LK.act.otptoggle = function (el) {
    var on = !(S.shop && S.shop.otp_on);
    return LK.busy(el, function () { return S.api.shopSetOtp(on); }).then(function () { S.shop.otp_on = on; LK.toast(on ? "Delivery OTP chalu ✓ (naye orders par)" : "Delivery OTP band ✓"); LK.redraw(LK.top()); });
  };
})();
