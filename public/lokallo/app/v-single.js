/* Single-shop edition (paid subscription + client self-branding). Only active when window.LK_SINGLE is set by the build.
   - Gate: when the shop's plan has run out the app shows a renew screen (owner) or "app band hai" (customers).
   - Brand: shop owner edits app name, tagline, welcome text, logo and colours inside the app; everyone sees it. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc;
  var DEF = { g: "#1B7A2E", y: "#FFC400" };
  function one() { return window.LK_SINGLE; }
  function mix(hex, k) { // blend with white: k=0 keeps colour, k=1 is white
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(c) { return Math.round(c + (255 - c) * k); }
    return "#" + [f(r), f(g), f(b)].map(function (x) { return (x < 16 ? "0" : "") + x.toString(16); }).join("");
  }
  var OK = /^#[0-9a-fA-F]{6}$/;
  LK.applyBrand = function (b) {
    b = b || {}; var root = document.documentElement.style;
    var c = OK.test(b.color || "") ? b.color : DEF.g, a = OK.test(b.accent || "") ? b.accent : DEF.y;
    root.setProperty("--g", c); root.setProperty("--gl", mix(c, 0.9)); root.setProperty("--y", a); root.setProperty("--yl", mix(a, 0.85));
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", c);
    document.title = b.name || (one() && one().name) || "LoKalLo";
  };
  LK.brandOf = function () { return (S.single && S.single.brand) || {}; };
  LK.brandHeader = function () {
    var b = LK.brandOf(); if (!one()) return null;
    var nm = b.name || one().name || "";
    if (b.logo) return '<img class="logo brand" src="' + esc(LK.img(b.logo)) + '" alt="' + esc(nm) + '"><b class="bname">' + esc(nm) + "</b>";
    return '<b class="bname only">' + esc(nm) + "</b>";
  };
  LK.singleBanner = function () {
    var b = LK.brandOf(); if (!one() || !(b.welcome || b.tagline)) return "";
    return '<div class="card welc">' + (b.tagline ? "<b>" + esc(b.tagline) + "</b>" : "") + (b.welcome ? "<p>" + esc(b.welcome) + "</p>" : "") + "</div>";
  };

  /* ---------- prices ---------- */
  function plans(p) {
    var m = +p.price || 0, q = +p.q_off || 0, y = +p.y_off || 0;
    return [["month", "Mahina", 1, Math.round(m)], ["quarter", "3 Mahine", 3, Math.round(m * 3 * (100 - q) / 100), q], ["year", "Saal", 12, Math.round(m * 12 * (100 - y) / 100), y]];
  }
  LK.singlePlans = plans;

  /* ---------- entry: load info, apply brand, gate ---------- */
  LK.singleEnter = function (next) {
    if (!one()) return next();
    return Promise.all([S.api.singleInfo(one().shopId), S.api.singlePrices()]).then(function (r) {
      var i = r[0] || {}; S.single = { brand: i.brand || {}, active: !!i.active, until: i.until, prices: r[1] || {} };
      LK.applyBrand(S.single.brand);
      if (S.single.active) return next();
      gate();
    }, function () { next(); });
  };
  function isOwner() { return !!(S.shop && one() && S.shop.id === one().shopId); }
  var PL = "month", REQ = null;
  function paySec() {
    var up = (S.fees || {}).admin_upi, pl = plans(S.single.prices).filter(function (x) { return x[0] === PL; })[0], amt = pl[3];
    if (REQ) return '<div class="card ok-c">✓ Aapki request admin ko bhej di gayi hai. Payment verify hote hi app chalu ho jayega.</div>';
    if (!up || !(amt > 0) || !LK.appBtns) return '<p class="muted">Abhi payment option set nahi hai.</p>';
    return '<div class="kv"><div><span>Fee</span><b>' + LK.money(amt) + "</b></div></div>" + LK.appBtns(LK.feeLink(up, amt)) + '<div class="kv"><div><span>UPI ID</span><b>' + esc(up) + "</b></div></div>" + LK.manualPay(up, amt) + '<button class="btn big" data-act="sgpaid">✅ Maine fee pay kar di</button>';
  }
  function planChips() {
    return '<div class="chips flush wrapc">' + plans(S.single.prices).map(function (p) { return '<button class="chip" data-act="sgplan" data-v="' + p[0] + '" aria-pressed="' + (PL === p[0]) + '">' + p[1] + " " + LK.money(p[3]) + (p[4] ? " (" + p[4] + "% off)" : "") + "</button>"; }).join("") + "</div>";
  }
  function gate() {
    var d = $("#gate") || document.createElement("div"); d.id = "gate";
    var nm = LK.brandOf().name || one().name;
    if (isOwner()) {
      d.innerHTML = '<div class="fbox"><h2>' + esc(nm) + '</h2><p><b>Aapka app plan khatam ho gaya hai.</b> Chalu rakhne ke liye plan chuno aur fee pay karo.</p>' + planChips() + '<div id="sgpay">' + paySec() + '</div><button class="btn ghost sm" data-act="sgreload">🔄 Dobara check karo</button> <button class="btn ghost sm" data-act="logout">Logout</button></div>';
    } else {
      d.innerHTML = '<div class="fbox"><h2>' + esc(nm) + '</h2><p>Ye app abhi band hai. Kripya dukaan se sampark karein.</p><button class="btn ghost sm" data-act="logout">Logout</button></div>';
    }
    if (!d.parentNode) document.body.appendChild(d);
  }
  LK.act.sgreload = function () { location.reload(); };
  LK.act.sgreload = LK.act.sgreload || function () { location.reload(); };
  LK.act.sgplan = function (el) {
    if (REQ) return; PL = el.dataset.v; el.parentNode.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); });
    $("#sgpay").innerHTML = paySec();
  };
  LK.act.sgpaid = function (el) {
    return LK.busy(el, function () { return S.api.singleRequest(PL); }).then(function () { REQ = true; LK.toast("Admin ko bata diya ✓"); $("#sgpay").innerHTML = paySec(); });
  };

  /* ---------- owner: customise + plan ---------- */
  var B = null;
  V.brand = {
    tab: "sorders",
    html: function () {
      if (!one() || !S.shop) return '<section class="pad"><div class="empty">Ye option sirf dukaandaar ke liye hai.</div></section>';
      if (!B) B = JSON.parse(JSON.stringify(LK.brandOf()));
      var until = S.single && S.single.until;
      return '<section class="pad"><h2>🎨 Apna app customize karo</h2><p class="muted sm">Yahan jo badloge wo aapke sabhi grahakon ko dikhega. Phone par app ka icon/naam badalna ho to humse sampark karein.</p>' +
        (until ? '<div class="card ok-c row"><span>✓ Plan ' + new Date(until).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + ' tak</span><button class="btn ghost sm" data-act="sgrenew">Renew</button></div>' : "") +
        '<label class="fld"><span>App / dukaan ka naam</span><input data-in="sgb" data-k="name" maxlength="40" value="' + esc(B.name || one().name || "") + '"></label>' +
        '<label class="fld"><span>Tagline (chhoti line)</span><input data-in="sgb" data-k="tagline" maxlength="80" value="' + esc(B.tagline || "") + '" placeholder="Jaise: Taaza saman, sahi daam"></label>' +
        '<label class="fld"><span>Grahak ke liye swagat sandesh</span><textarea data-in="sgb" data-k="welcome" rows="2" maxlength="160" placeholder="Jaise: Aaj 500 se upar ke order par delivery free">' + esc(B.welcome || "") + "</textarea></label>" +
        '<div class="fld"><span>Logo</span><div class="avwrap"><div class="avatar" id="sglogo">' + (B.logo ? '<img src="' + esc(LK.img(B.logo)) + '" alt="">' : "<span>🏪</span>") + '</div><div><button class="btn ghost sm" data-act="sglogopick">📷 Logo lagao</button>' + (B.logo ? ' <button class="btn ghost sm" data-act="sglogorm">Hatao</button>' : "") + '</div></div><input type="file" id="sg-file" accept="image/*" hidden data-in="sgfile"></div>' +
        '<div class="row2"><label class="fld"><span>Mukhya rang</span><input type="color" data-in="sgb" data-k="color" value="' + esc(OK.test(B.color || "") ? B.color : DEF.g) + '"></label><label class="fld"><span>Doosra rang</span><input type="color" data-in="sgb" data-k="accent" value="' + esc(OK.test(B.accent || "") ? B.accent : DEF.y) + '"></label></div>' +
        '<div class="row2"><button class="btn ghost" data-act="sgreset">Default rang</button><button class="btn" data-act="sgsave">💾 Save karo</button></div></section>';
    }
  };
  Object.defineProperty(V.brand, "tab", { get: function () { return S.mode === "shop" ? "sorders" : "me"; } });
  LK.act.brand = function () { B = null; LK.go("brand"); };
  LK.inp.sgb = function (el) { B[el.dataset.k] = el.value; if (el.dataset.k === "color" || el.dataset.k === "accent") LK.applyBrand(B); };
  LK.act.sglogopick = function () { $("#sg-file").click(); };
  LK.act.sglogorm = function () { B.logo = ""; LK.redraw(LK.top()); };
  LK.inp.sgfile = function (el) {
    var f = el.files && el.files[0]; el.value = ""; if (!f) return; LK.toast("Logo upload ho raha hai…");
    LK.shrink(f, 400).then(function (m) { return S.api.upload(m); }).then(function (p) { B.logo = p; LK.redraw(LK.top()); LK.toast("Logo lag gaya ✓"); }).catch(LK.fail);
  };
  LK.act.sgreset = function () { B.color = ""; B.accent = ""; LK.applyBrand(B); LK.redraw(LK.top()); };
  LK.act.sgsave = function (el) {
    return LK.busy(el, function () { return S.api.setBrand({ name: (B.name || "").trim(), tagline: (B.tagline || "").trim(), welcome: (B.welcome || "").trim(), logo: B.logo || "", color: B.color || "", accent: B.accent || "" }); }).then(function () {
      S.single.brand = JSON.parse(JSON.stringify(B)); LK.applyBrand(B); LK.header(V[LK.top().name]); LK.toast("Save ho gaya ✓");
    });
  };
  LK.act.sgrenew = function () {
    REQ = null; PL = "quarter";
    LK.sheet("<h3>Plan renew karo</h3>" + planChips() + '<div id="sgpay">' + paySec() + '</div><button class="btn ghost" data-act="mclose" data-v="0">Band</button>');
  };
})();
