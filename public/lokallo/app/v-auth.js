/* Login, mandatory profile setup (name, mobile, age, sex, GPS location) and shop registration / editing. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc;
  LK.PROTO = !!window.LK_PROTO;
  function okPhone(p) { return /^[6-9]\d{9}$/.test(String(p || "").trim()); }
  function has(v) { return v != null && String(v).trim() !== ""; }

  /* ================= login ================= */
  V.login = {
    html: function () {
      LK.form = { phone: "", pin: "" };
      return '<section class="login">' +
        '<div class="hero"><img class="heroicon" src="' + LK.IMG.icon + '" alt=""><h1>LoKalLo</h1><p>Apni gali ki dukaan se, ghar baithe saman mangao.</p>' + LK.verLine() + '</div>' +
        '<button class="btn gbtn" data-act="google"><span class="g">G</span> Google se login</button>' +
        '<p class="hint">Apne Google account se login karo. Alag se PIN ya password nahi chahiye.</p>' +
        (LK.PROTO ? '<button class="btn ghost" data-act="demo">Pehle demo dekho (bina login)</button>' : "") +
        '<p class="hint">Madad chahiye? <a href="mailto:spywellinfotech@gmail.com?subject=LoKalLo%20Support">spywellinfotech@gmail.com</a></p>' +
        (LK.PROTO ? '<p class="hint">Ye prototype hai: saare button demo data ke saath chalte hain.</p>' : "") +
        "</section>";
    }
  };
  LK.act.pinlogin = function (el) {
    var f = LK.form, ph = String(f.phone || "").replace(/\D/g, "");
    if (!okPhone(ph)) return LK.toast("10 ank ka sahi mobile number daalo.", "bad");
    if (!/^\d{6}$/.test(f.pin || "")) return LK.toast("PIN 6 ank ka hona chahiye.", "bad");
    S.phone = ph;
    if (LK.PROTO) return LK.startDemo(true);
    return LK.busy(el, function () { return BE.login(ph, f.pin); }).then(function () { return LK.afterLogin(); });
  };
  LK.act.google = function (el) {
    if (LK.PROTO) { S.googleName = "Ramesh Gupta"; return LK.startDemo(true); }
    var web = !window.LkNative;
    return LK.busy(el, function () {
      return fetch(BE.url + "/auth/v1/settings", { headers: { apikey: window.LK_CONFIG.supabaseKey } }).then(function (r) { return r.json(); }).then(function (s) {
        if (!(s && s.external && s.external.google)) throw new Error("Google login abhi server par chalu nahi hai. Thodi der baad koshish karo.");
        window.location.href = BE.googleUrl(web ? (location.origin + location.pathname) : "lokallo://auth");
      });
    });
  };
  LK.act.demo = function () { return LK.startDemo(false); };

  /* ================= mandatory profile ================= */
  V.setup = {
    html: function (e) {
      if (!e.fi) {
        var p = S.profile || {};
        LK.form = {
          full_name: p.full_name || S.googleName || "", phone: p.phone || S.phone || (window.BE && BE.myPhone && BE.myPhone()) || "",
          age: p.age || "", sex: p.sex || "", address: p.address || "", lat: p.lat != null ? p.lat : null, lng: p.lng != null ? p.lng : null,
          role: S.shop ? "shop" : "customer"
        };
        e.fi = true;
      }
      var f = LK.form;
      function sx(v, t) { return '<button type="button" data-act="fset" data-k="sex" data-v="' + v + '" aria-pressed="' + (f.sex === v) + '">' + t + "</button>"; }
      function rl(v, ic, t, d) { return '<button type="button" class="role" data-act="fset" data-k="role" data-v="' + v + '" aria-pressed="' + (f.role === v) + '"><span class="ri">' + ic + "</span><b>" + t + "</b><small>" + d + "</small></button>"; }
      return '<section class="pad"><h2>Apni jaankari bharo</h2><p class="muted">Ye sab zaroori hai. Dukaandaar ko order ke liye aapka naam, number aur pata chahiye.</p>' +
        '<label class="fld"><span>Poora naam *</span><input data-in="f" data-k="full_name" value="' + esc(f.full_name) + '" autocomplete="name" placeholder="Jaise: Ramesh Kumar"></label>' +
        '<label class="fld"><span>Mobile number *</span><input data-in="f" data-k="phone" value="' + esc(f.phone) + '" inputmode="numeric" maxlength="10" placeholder="10 ank ka number"></label>' +
        '<div class="two"><label class="fld"><span>Umar *</span><input data-in="f" data-k="age" value="' + esc(f.age) + '" inputmode="numeric" maxlength="3" placeholder="Saal"></label>' +
        '<div class="fld"><span>Ling *</span><div class="seg">' + sx("male", "Purush") + sx("female", "Mahila") + sx("other", "Anya") + "</div></div></div>" +
        '<div class="fld"><span>Location *</span><button type="button" class="gpsbtn" data-act="gps">' + (f.lat != null ? "📍 Location dobara lo" : "📍 GPS se meri location lo") + '</button><div id="locinfo" class="locinfo"></div></div>' +
        '<label class="fld"><span>Ghar ka pata *</span><textarea id="f-address" data-in="f" data-k="address" rows="2" placeholder="Gali, mohalla, landmark">' + esc(f.address) + "</textarea></label>" +
        (S.profile ? "" : '<label class="fld"><span>Referral code (agar kisi dost ne diya ho)</span><input data-in="f" data-k="ref" maxlength="8" autocapitalize="characters" autocomplete="off" value="' + esc(f.ref || "") + '" placeholder="Jaise: 5E4AC6"></label>') +
        '<div class="fld"><span>Main yahan kaun hoon?</span><div class="roles">' + rl("customer", "🛍️", "Customer", "Saman mangana hai") + rl("shop", "🏪", "Dukaandaar", "Meri dukaan hai") + "</div></div>" +
        '<button class="btn" id="savebtn" data-act="savesetup" disabled>Aage badho</button></section>';
    },
    after: function () {
      LK.locInfo();
      LK.onForm = function () {
        var f = LK.form, ok = String(f.full_name || "").trim().length >= 2 && okPhone(f.phone) && +f.age >= 10 && +f.age <= 110 && !!f.sex && f.lat != null && String(f.address || "").trim().length >= 5;
        var b = $("#savebtn"); if (b) b.disabled = !ok;
      };
      LK.onForm();
    }
  };
  LK.act.savesetup = function (el) {
    var f = LK.form, firstTime = !S.profile, refCode = String(f.ref || "").trim();
    return LK.busy(el, function () {
      return S.api.saveProfile({ full_name: f.full_name.trim(), phone: String(f.phone).trim(), age: +f.age, sex: f.sex, address: f.address.trim(), lat: f.lat, lng: f.lng })
        .then(function () { return (firstTime && refCode) ? S.api.applyReferral(refCode).then(function () { LK.toast("Referral code lag gaya ✓"); }, function (x) { LK.toast((x && x.message) || "Referral code nahi laga.", "bad"); }) : null; })
        .then(function () { return LK.loadMe(); })
        .then(function () {
          S.loc = { lat: +f.lat, lng: +f.lng };
          if (f.role === "shop" && !S.shop) LK.root("shopsetup", { first: true }); else LK.enter();
        });
    });
  };

  /* ================= shop registration / editing ================= */
  function photosHtml() {
    var ph = LK.form.photos || [];
    return ph.map(function (p, i) { return '<div class="ph"><img src="' + esc(LK.img(p)) + '" alt=""><button type="button" class="x" data-act="rmphoto" data-i="' + i + '" aria-label="Hatao">✕</button></div>'; }).join("") +
      (ph.length < 6 ? '<button type="button" class="ph add" data-act="addphoto">＋<small>Photo</small></button>' : "");
  }
  function qrHtml() {
    var q = LK.form.upi_qr;
    return q ? '<div class="qrprev"><img src="' + esc(LK.img(q)) + '" alt="UPI QR"><button type="button" class="btn ghost sm" data-act="rmqr">Hatao</button></div>' : '<button type="button" class="btn ghost sm" data-act="addqr">＋ UPI QR ki photo lagao</button>';
  }
  function shopForm(e, tab) {
    if (!e.fi) {
      var s = S.shop || {}, p = S.profile || {};
      LK.form = {
        name: s.name || "", owner_name: s.owner_name || p.full_name || "", phone: s.phone || p.phone || "", address: s.address || "",
        lat: s.lat != null ? s.lat : null, lng: s.lng != null ? s.lng : null, delivery_km: String(s.delivery_km != null ? s.delivery_km : 2),
        min_order: s.min_order != null ? s.min_order : "", delivery_charge: s.delivery_charge != null ? s.delivery_charge : "", free_above: s.free_above != null ? s.free_above : "",
        slots: s.slots || "", t_open: LK.t24(String(s.slots || "").split(/[–-]/)[0]), t_close: LK.t24(String(s.slots || "").split(/[–-]/)[1]), types: (s.types || []).slice(), photos: (s.photos || []).slice(), upi_id: s.upi_id || "", upi_qr: s.upi_qr || ""
      };
      e.fi = true;
    }
    var f = LK.form;
    function tc(t) { return '<button type="button" class="chip" data-act="ftog" data-k="types" data-v="' + t + '" aria-pressed="' + (f.types.indexOf(t) > -1) + '">' + LK.TICON[t] + " " + LK.TYPES[t] + "</button>"; }
    function kc(k, t) { return '<button type="button" class="chip" data-act="fset" data-k="delivery_km" data-v="' + k + '" aria-pressed="' + (String(f.delivery_km) === String(k)) + '">' + t + "</button>"; }
    function inp(k, label, ph, attrs) { return '<label class="fld"><span>' + label + '</span><input data-in="f" data-k="' + k + '" value="' + esc(f[k]) + '" placeholder="' + ph + '" ' + (attrs || "") + "></label>"; }
    return '<section class="pad"><h2>' + (S.shop ? "Meri dukaan" : "Apni dukaan register karo") + "</h2>" +
      (S.shop ? "" : '<p class="muted">Customer aapko tab dekhenge jab dukaan 500 m se 50 km ke andar hogi. Isliye dukaan par khade hoke 📍 dabao.</p>') +
      inp("name", "Dukaan ka naam *", "Jaise: Gupta Kirana Store") + inp("owner_name", "Malik ka naam", "Aapka naam") +
      inp("phone", "Dukaan ka mobile number *", "10 ank ka number", 'inputmode="numeric" maxlength="10"') +
      '<div class="fld"><span>Dukaan ka type * (ek ya zyada)</span><div class="chips wrap">' + ["grocery", "dairy", "bakery", "fruitveg", "sweets"].map(tc).join("") + "</div></div>" +
      '<div class="fld"><span>Dukaan ki location *</span><button type="button" class="gpsbtn" data-act="gps">' + (f.lat != null ? "📍 Location dobara lo" : "📍 GPS se dukaan ki location lo") + '</button><div id="locinfo" class="locinfo"></div></div>' +
      '<div id="areabox">' + (LK.areaForm ? LK.areaForm() : "") + "</div>" +
      '<label class="fld"><span>Dukaan ka pata *</span><textarea id="f-address" data-in="f" data-k="address" rows="2" placeholder="Bazaar, gali, landmark">' + esc(f.address) + "</textarea></label>" +
      '<div class="fld"><span>Kitni door tak delivery?</span><div class="chips wrap">' + kc("0.5", "500 m") + kc("1", "1 km") + kc("2", "2 km") + kc("3", "3 km") + kc("4", "4 km") + kc("6", "6 km") + kc("8", "8 km") + kc("10", "10 km") + kc("25", "25 km") + kc("50", "50 km") + "</div></div>" +
      '<div class="two">' + inp("min_order", "Kam se kam order (₹)", "0", 'inputmode="numeric"') + inp("delivery_charge", "Delivery charge (₹)", "0", 'inputmode="numeric"') + "</div>" +
      inp("free_above", "Itne ₹ se upar delivery free (optional)", "Jaise 500", 'inputmode="numeric"') +
      '<div class="two"><label class="fld"><span>Dukaan kab khulti hai</span><input type="time" data-in="f" data-k="t_open" value="' + esc(f.t_open) + '"></label><label class="fld"><span>Kab band hoti hai</span><input type="time" data-in="f" data-k="t_close" value="' + esc(f.t_close) + '"></label></div>' +
      '<h3>Dukaan ki photos</h3><p class="muted sm">6 tak. Customer ko dukaan ke card par dikhengi.</p><div class="photos" id="photos">' + photosHtml() + "</div>" +
      '<h3>UPI se payment</h3><p class="muted sm">Customer bill par seedha aapki UPI ID ko pay kar sakega.</p>' +
      inp("upi_id", "UPI ID", "naam@okaxis", 'autocapitalize="none" autocorrect="off" spellcheck="false"') +
      '<div class="fld"><span>UPI QR code (optional)</span><div id="qrbox">' + qrHtml() + "</div></div>" +
      '<input type="file" id="ph-in" accept="image/*" hidden data-in="phfile"><input type="file" id="qr-in" accept="image/*" hidden data-in="qrfile">' +
      '<button class="btn" id="savebtn" data-act="saveshop" disabled>' + (S.shop ? "Save karo" : "Dukaan register karo") + "</button>" +
      (tab ? '<div class="links"><button class="btn ghost" data-act="tomode" data-v="customer">🛍️ Customer mode mein jao</button>' + (LK.isBoy && LK.isBoy() ? '<button class="btn ghost" data-act="tomode" data-v="dboy">🚚 Delivery mode</button>' : "") + (LK.isSup && LK.isSup() ? '<button class="btn ghost" data-act="tomode" data-v="supp">📦 Supplier mode</button>' : "") + (S.admin ? '<button class="btn ghost" data-act="admin">🛡️ Admin panel</button>' : "") + (S.shop ? '<button class="btn ghost" data-act="otptoggle">🔐 Delivery OTP: ' + (S.shop.otp_on ? "ON ✓ (band karo)" : "OFF (chalu karo)") + "</button>" : "") + (S.shop && !window.LK_SINGLE ? '<button class="btn ghost" data-act="mref">🎁 Referral aur Rewards</button>' : "") + (S.shop && LK.commOn && LK.commOn() ? '<button class="btn ghost" data-act="mcomm">💰 Commission hisaab</button>' : "") + (S.shop ? '<button class="btn ghost" data-act="backup">☁️ Google Drive backup</button>' : "") + '<button class="btn ghost" data-act="shareapp">📤 LoKalLo app share karo</button><a class="btn ghost" href="mailto:spywellinfotech@gmail.com?subject=LoKalLo%20Support">✉️ Contact Support: spywellinfotech@gmail.com</a><button class="btn ghost danger-t" data-act="logout">Logout</button></div>' : "") + "</section>";
  }
  function shopAfter() {
    LK.locInfo(); if (LK.areaFormLoad) LK.areaFormLoad();
    LK.onForm = function () {
      var f = LK.form, u = String(f.upi_id || "").trim();
      var ok = String(f.name || "").trim().length >= 2 && okPhone(f.phone) && f.types.length > 0 && f.lat != null && String(f.address || "").trim().length >= 5 && (!u || /^[A-Za-z0-9._-]{2,64}@[A-Za-z0-9.-]{2,40}$/.test(u));
      var b = $("#savebtn"); if (b) b.disabled = !ok;
    };
    LK.onForm();
  }
  V.shopsetup = { html: function (e) { return shopForm(e, false); }, after: shopAfter };
  V.sshop = { tab: "sshop", html: function (e) { return shopForm(e, true) + LK.verLine(); }, after: shopAfter };

  LK.act.addphoto = function () { $("#ph-in").click(); };
  LK.act.addqr = function () { $("#qr-in").click(); };
  LK.act.rmphoto = function (el) { LK.form.photos.splice(+el.dataset.i, 1); $("#photos").innerHTML = photosHtml(); };
  LK.act.rmqr = function () { LK.form.upi_qr = ""; $("#qrbox").innerHTML = qrHtml(); };
  LK.inp.phfile = function (el) {
    var files = [].slice.call(el.files || []), room = 6 - (LK.form.photos || []).length; el.value = "";
    files = files.slice(0, room); if (!files.length) return;
    LK.toast("Photo upload ho rahi hai…");
    files.reduce(function (p, f) {
      return p.then(function () { return LK.shrink(f).then(function (s) { return S.api.upload(s); }).then(function (path) { (LK.form.photos = LK.form.photos || []).push(path); var d = $("#photos"); if (d) d.innerHTML = photosHtml(); }); });
    }, Promise.resolve()).then(function () { LK.toast("Photo lag gayi ✓"); }, LK.fail);
  };
  LK.inp.qrfile = function (el) {
    var f = el.files && el.files[0]; el.value = ""; if (!f) return;
    LK.toast("QR upload ho raha hai…");
    LK.shrink(f, 900).then(function (s) { return S.api.upload(s); }).then(function (path) { LK.form.upi_qr = path; var d = $("#qrbox"); if (d) d.innerHTML = qrHtml(); LK.toast("QR lag gaya ✓"); }).catch(LK.fail);
  };
  LK.act.saveshop = function (el) {
    var f = LK.form, first = !!LK.top().params.first;
    function num(v) { return v === "" || v == null ? null : +v; }
    return LK.busy(el, function () {
      return S.api.saveShop({
        name: f.name.trim(), owner_name: String(f.owner_name || "").trim(), phone: String(f.phone).trim(), address: f.address.trim(), lat: +f.lat, lng: +f.lng,
        delivery_km: +f.delivery_km || 2, min_order: num(f.min_order) || 0, delivery_charge: num(f.delivery_charge) || 0, free_above: num(f.free_above),
        slots: (f.t_open && f.t_close) ? (LK.t12(f.t_open) + " – " + LK.t12(f.t_close)) : "", types: f.types, photos: f.photos || [], upi_id: String(f.upi_id || "").trim(), upi_qr: f.upi_qr || "",
        is_open: S.shop ? S.shop.is_open : true
      }).then(function () { return LK.areaFormSave ? LK.areaFormSave() : null; }).then(function () { return LK.loadMe(); }).then(function () {
        LK.toast("Dukaan save ho gayi ✓"); try { LK.driveSync(); } catch (x) {}
        S.mode = "shop"; try { localStorage.setItem("lk-mode", "shop"); } catch (x) {}
        if (S.shop && S.shop.status === "pending" && !S.admin) { LK.root(first ? "sorders" : "sshop"); S.pendShown = true; return LK.pendPopup(); }
        LK.root(first ? "sorders" : "sshop");
      });
    });
  };
})();
