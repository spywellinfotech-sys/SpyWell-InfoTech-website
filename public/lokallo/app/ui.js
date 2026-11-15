/* LoKalLo UI core: state, router, helpers, shared form handlers. Views live in v-*.js and register on LK.views. */
(function () {
  "use strict";
  var LK = window.LK = { views: {}, act: {}, inp: {}, stack: [], form: {}, S: { mode: "customer", range: 2, type: "", fees: { customer_fee: 0, shop_fee: 0 }, cart: {}, cartShop: null, seen: null, badge: { c: 0, s: 0 }, loc: null } };
  var S = LK.S, V = LK.views;
  var $ = LK.$ = function (s, e) { return (e || document).querySelector(s); };
  LK.IMG = window.LK_IMG || { word: "", icon: "" };
  LK.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var esc = LK.esc;

  /* ---------- constants ---------- */
  LK.TYPES = { grocery: "Kirana", dairy: "Dairy", bakery: "Bakery", fruitveg: "Fal-Sabzi", sweets: "Mithai" };
  LK.TICON = { grocery: "🛒", dairy: "🥛", bakery: "🍞", fruitveg: "🥬", sweets: "🍬" };
  LK.UNAME = { kg: "kg", g: "g", l: "L", ml: "ml", packet: "packet", piece: "pcs" };
  LK.FAM = { kg: ["kg", "g"], g: ["kg", "g"], l: ["l", "ml"], ml: ["l", "ml"], packet: ["packet"], piece: ["piece"] };
  LK.PRESET = {
    weight: [[250, "g"], [500, "g"], [1, "kg"], [2, "kg"], [5, "kg"]],
    volume: [[250, "ml"], [500, "ml"], [1, "l"], [2, "l"], [5, "l"]],
    packet: [[1, "packet"], [2, "packet"], [3, "packet"], [5, "packet"], [10, "packet"]],
    piece: [[1, "piece"], [2, "piece"], [4, "piece"], [6, "piece"], [12, "piece"]]
  };
  LK.KIND_UNITS = { weight: ["kg", "g"], volume: ["l", "ml"], packet: ["packet", "piece"], piece: ["piece", "packet"], any: ["kg", "g", "l", "ml", "packet", "piece"] };
  LK.DEFQ = { weight: [1, "kg"], volume: [1, "l"], packet: [1, "packet"], piece: [1, "piece"], any: [1, "kg"] };
  LK.ST = { placed: ["Bill ka intezaar", "warn"], bill_sent: ["Bill aa gaya", "accent"], confirmed: ["Confirm", "ok"], ready: ["Pickup ready", "ok"], out_for_delivery: ["Delivery pe", "ok"], completed: ["Poora hua", "done"], cancelled: ["Cancel", "bad"], rejected: ["Dukaan ne mana kiya", "bad"] };
  LK.STS = { placed: ["Naya order", "accent"], bill_sent: ["Bill bheja", "warn"], confirmed: ["Confirm", "ok"], ready: ["Pickup ready", "ok"], out_for_delivery: ["Delivery pe", "ok"], completed: ["Poora hua", "done"], cancelled: ["Customer ne cancel kiya", "bad"], rejected: ["Aapne mana kiya", "bad"] };

  /* ---------- formatting ---------- */
  LK.money = function (n) { n = +n || 0; var r = Math.round(n * 100) / 100; return "₹" + (r % 1 === 0 ? r.toLocaleString("en-IN") : r.toFixed(2)); };
  LK.dist = function (k) { k = +k || 0; if (k > 50) return "Poore India 🇮🇳"; return k < 1 ? Math.max(10, Math.round(k * 100) * 10) + " m" : (Math.round(k * 10) / 10) + " km"; };
  LK.qty = function (q, u) {
    var n = Math.round(+q * 1000) / 1000;
    if (u === "g" && n >= 1000) { n = n / 1000; u = "kg"; }
    if (u === "ml" && n >= 1000) { n = n / 1000; u = "l"; }
    return n + " " + (LK.UNAME[u] || u);
  };
  LK.rate = function (r, u) { return LK.money(r) + "/" + ({ kg: "kg", g: "g", l: "L", ml: "ml", packet: "packet", piece: "pc" }[u] || u); };
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  /* 12-hour clock, e.g. 5:30 PM */
  LK.clock = function (d) { d = d instanceof Date ? d : new Date(d); var h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ":" + (m < 10 ? "0" : "") + m + " " + (h < 12 ? "AM" : "PM"); };
  /* "17:30" (from a time input) -> "5:30 PM" */
  LK.t12 = function (hhmm) { var m = /^(\d{1,2}):(\d{2})/.exec(hhmm || ""); if (!m) return ""; var h = +m[1]; return (h % 12 || 12) + ":" + m[2] + " " + (h < 12 ? "AM" : "PM"); };
  /* "5:30 PM" -> "17:30" (to fill a time input) */
  LK.t24 = function (txt) { var m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(txt || ""); if (!m) return ""; var h = +m[1] % 12; if (/pm/i.test(m[3])) h += 12; return (h < 10 ? "0" : "") + h + ":" + m[2]; };
  LK.ago = function (iso) {
    var d = new Date(iso), m = Math.round((Date.now() - d.getTime()) / 60000);
    if (m < 1) return "abhi"; if (m < 60) return m + " min pehle";
    var h = Math.round(m / 60); if (h < 24) return h + " ghante pehle";
    return d.getDate() + " " + MON[d.getMonth()] + ", " + LK.clock(d);
  };
  LK.badge = function (st, shop) { var x = (shop && LK.STS[st]) || LK.ST[st] || [st, ""]; return '<span class="bd ' + x[1] + '">' + x[0] + "</span>"; };
  /* Days of "platform fee free" offer left for this user (0 = none). */
  LK.freeLeft = function () {
    var p = LK.S.profile, fd = +(LK.S.fees || {}).free_days || 0;
    if (!p || !p.created_at || !fd) return 0;
    var left = fd - (Date.now() - new Date(p.created_at).getTime()) / 86400000;
    return left > 0 ? Math.ceil(left) : 0;
  };
  LK.freeBanner = function (who) { var n = LK.freeLeft(); return n ? '<div class="card free-c">🎉 ' + who + ' offer: platform fee FREE — ' + n + ' din baaki</div>' : ""; };
  LK.img = function (p) { return p ? LK.S.api.media(p) : ""; };
  LK.typesText = function (t) { return (t || []).map(function (x) { return LK.TYPES[x] || x; }).join(" · "); };
  LK.tel = function (p) { return "tel:+91" + String(p).replace(/\D/g, "").slice(-10); };
  LK.wa = function (p, text) { return "https://wa.me/91" + String(p).replace(/\D/g, "").slice(-10) + (text ? "?text=" + encodeURIComponent(text) : ""); };
  LK.mapUrl = function (lat, lng) { return "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng; };

  /* ---------- toast, sheet, ask ---------- */
  LK.toast = function (msg, kind) {
    var t = $("#toast"); t.textContent = msg; t.className = "show " + (kind || "");
    clearTimeout(LK._tt); LK._tt = setTimeout(function () { t.className = ""; }, 3400);
  };
  LK.fail = function (e) { LK.toast((e && e.message) || "Kuch gadbad hui. Dobara koshish karo.", "bad"); if (window.console) console.error(e); };
  LK.sheet = function (html) { var m = $("#modal"); m.innerHTML = '<div class="sheet">' + html + "</div>"; m.className = "on"; };
  LK.closeSheet = function () { var m = $("#modal"); m.className = ""; m.innerHTML = ""; };
  LK.sheetOpen = function () { return $("#modal").className === "on"; };
  LK.ask = function (msg, ok, danger) {
    return new Promise(function (res) {
      LK.sheet("<p class=\"q\">" + esc(msg) + '</p><div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Nahi</button><button class="btn ' + (danger ? "danger" : "") + '" data-act="mclose" data-v="1">' + esc(ok || "Haan") + "</button></div>");
      LK._mres = res;
    });
  };
  LK.act.mclose = function (el) { LK.closeSheet(); var r = LK._mres; LK._mres = null; if (r) r(el.dataset.v === "1"); };
  LK.busy = function (el, fn) {
    var old = el.innerHTML; el.disabled = true; el.innerHTML = "Ruko…";
    return Promise.resolve().then(fn).then(function (r) { el.disabled = false; el.innerHTML = old; return r; }, function (e) { el.disabled = false; el.innerHTML = old; LK.fail(e); throw e; });
  };

  /* ---------- router ---------- */
  var TABS = {
    customer: [["home", "🏪", (window.LK_SINGLE ? "Dukaan" : "Dukaanein")], ["orders", "🧾", "Orders"], ["me", "👤", "Profile"]],
    dboy: [["dhome", "🚚", "Delivery"]],
    supp: [["shome", "📦", "Supplier"]],
    shop: [["sorders", "🧾", "Orders"], ["rates", "📋", "Rate"], ["ads", "📢", "Ads"], ["report", "📊", "Report"], ["sshop", "🏬", "Dukaan"]]
  };
  LK.top = function () { return LK.stack[LK.stack.length - 1]; };
  LK.go = function (name, params, o) { if (o && o.replace) LK.stack.pop(); LK.stack.push({ name: name, params: params || {} }); LK.draw(); };
  LK.root = function (name, params) { LK.stack = [{ name: name, params: params || {} }]; LK.draw(); };
  LK.back = function () { if (LK.stack.length > 1) { LK.stack.pop(); LK.draw(); return true; } return false; };
  LK.header = function (v) {
    var back = LK.stack.length > 1, r = "";
    if (S.demo) r += '<span class="chip-demo">DEMO</span>';
    if (S.mode === "shop" && S.shop && v.tab) r += '<button class="tg ' + (S.shop.is_open ? "on" : "") + '" data-act="toggleopen">' + (S.shop.is_open ? "🟢 Khula" : "🔴 Band") + "</button>";
    $("#top").innerHTML = (back ? '<button class="bk" data-act="back" aria-label="Wapas">←</button>' : "") + (LK.brandHeader && LK.brandHeader() || '<img class="logo wordlogo" src="' + LK.IMG.word + '" alt="LoKalLo">') + '<span class="clk" id="clk">' + LK.clock() + '</span><span class="sp"></span>' + r + (LK.S.profile ? '<button class="bell" data-act="bell" aria-label="Notifications">🔔<i id="bellcnt" style="display:none"></i></button>' : "") + '<button class="lang" data-act="lang" aria-label="Language">' + (LK.hi ? "EN" : "हिं") + "</button>";
    if (LK.bellRefresh) LK.bellRefresh();
  };
  LK.nav = function (v) {
    var n = $("#nav");
    if (!v.tab) { n.innerHTML = ""; n.hidden = true; document.body.classList.remove("hasnav"); return; }
    var tabs = TABS[S.mode] || TABS.customer, b = S.badge;
    n.innerHTML = tabs.map(function (t) {
      var dot = (t[0] === "orders" && b.c) ? '<i class="dot">' + b.c + "</i>" : (t[0] === "me" && b.s) ? '<i class="dot">' + b.s + "</i>" : (t[0] === "sorders" && b.s) ? '<i class="dot">' + b.s + "</i>" : "";
      return '<button data-act="tab" data-v="' + t[0] + '" aria-current="' + (v.tab === t[0]) + '"><span class="ic">' + t[1] + dot + "</span><span>" + t[2] + "</span></button>";
    }).join("");
    n.hidden = false; document.body.classList.add("hasnav");
  };
  LK.navRefresh = function () { var e = LK.top(); if (e) { LK.nav(V[e.name]); } };
  LK.draw = function () {
    var e = LK.top(); if (!e) return; var v = V[e.name]; LK.cur = e;
    LK.onForm = null;
    LK.header(v); LK.nav(v);
    $("#screen").innerHTML = v.html(e);
    window.scrollTo(0, 0);
    if (v.init) v.init(e);
    if (v.after) v.after(e);
  };
  LK.redraw = function (e) {
    if (LK.top() !== e) return; var v = V[e.name], y = window.scrollY;
    $("#screen").innerHTML = v.html(e); window.scrollTo(0, y);
    LK.header(v); LK.nav(v); if (v.after) v.after(e);
  };

  /* ---------- delegated events ---------- */
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-act]"); if (!t || t.disabled) return;
    var f = LK.act[t.dataset.act]; if (!f) return;
    ev.preventDefault();
    try { var r = f(t, ev); if (r && r.catch) r.catch(function () {}); } catch (x) { LK.fail(x); }
  });
  function inpHandler(ev) {
    var t = ev.target.closest("[data-in]"); if (!t) return;
    var f = LK.inp[t.dataset.in]; if (f) { try { f(t, ev); } catch (x) { LK.fail(x); } }
  }
  document.addEventListener("input", inpHandler);
  document.addEventListener("change", inpHandler);
  LK.act.back = function () { LK.back(); };
  LK.PRIVACY_URL = "https://spywellinfotech.blogspot.com/p/lokallo-privacy-policy.html";
  LK.privLink = function () { return '<a href="' + LK.PRIVACY_URL + '">🔒 Privacy Policy</a>'; };
  LK.verLine = function () { var b = LK.myBuild ? LK.myBuild() : 0; return b ? '<div class="devc ver">' + (window.LK_SINGLE ? "LoKalLo Single" : "LoKalLo Multi") + ' · Version 1.0.' + b + ' (build ' + b + ')</div>' + '<div class="devc">' + LK.privLink() + '</div>' : '<div class="devc">' + LK.privLink() + '</div>'; };
  LK.devContact = function () { var b = LK.myBuild ? LK.myBuild() : 0; return '<div class="devc">' + (b ? '<div>' + (window.LK_SINGLE ? "LoKalLo Single" : "LoKalLo Multi") + ' · Version 1.0.' + b + ' (build ' + b + ')</div>' : "") + '<b>Contact Developer</b> · <a href="mailto:spywellinfotech@gmail.com?subject=' + encodeURIComponent((document.title || "LoKalLo") + " Support") + '">✉️ spywellinfotech@gmail.com</a><br>' + LK.privLink() + '</div>'; };
  LK.homeRoot = function () { var one = window.LK_SINGLE; if (one && one.shopId) LK.root("shop", { id: one.shopId }); else LK.root("home"); };
  LK.act.tab = function (el) { if (el.dataset.v === "home") LK.homeRoot(); else LK.root(el.dataset.v); };

  /* ---------- form helpers ---------- */
  function onForm() { if (LK.onForm) LK.onForm(); }
  LK.inp.f = function (el) { LK.form[el.dataset.k] = el.value; onForm(); };
  LK.act.fset = function (el) {
    LK.form[el.dataset.k] = el.dataset.v;
    el.parentNode.querySelectorAll('[data-act="fset"][data-k="' + el.dataset.k + '"]').forEach(function (b) { b.setAttribute("aria-pressed", b === el ? "true" : "false"); });
    onForm();
  };
  LK.act.ftog = function (el) {
    var k = el.dataset.k, arr = LK.form[k] || (LK.form[k] = []), v = el.dataset.v, i = arr.indexOf(v);
    if (i < 0) arr.push(v); else arr.splice(i, 1);
    el.setAttribute("aria-pressed", i < 0 ? "true" : "false"); onForm();
  };

  /* ---------- GPS ---------- */
  LK.gps = function () {
    return new Promise(function (res, rej) {
      if (!navigator.geolocation) return rej({ code: 0 });
      navigator.geolocation.getCurrentPosition(function (p) { res({ lat: p.coords.latitude, lng: p.coords.longitude }); }, function (e) { rej(e); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
    });
  };
  LK.gpsMsg = function (e) {
    if (e && e.code === 1) return "Location ki permission do (Phone Settings → Apps → LoKalLo → Permissions → Location).";
    return "Location nahi mil rahi. GPS on karo, khule mein jaakar dobara 📍 dabao.";
  };
  LK.revgeo = function (lat, lng) {
    var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
    return fetch("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&accept-language=hi,en&lat=" + lat + "&lon=" + lng, ctl ? { signal: ctl.signal } : {})
      .then(function (r) { return r.json(); })
      .then(function (j) { clearTimeout(t); var a = j.address || {}; return [a.road || a.neighbourhood, a.suburb || a.village || a.hamlet, a.city || a.town || a.county].filter(Boolean).join(", "); })
      .catch(function () { clearTimeout(t); return ""; });
  };
  LK.locInfo = function () {
    var d = $("#locinfo"); if (!d) return;
    d.innerHTML = LK.form.lat != null && LK.form.lat !== ""
      ? '<span class="okc">✓ Location mil gayi</span> <span class="muted">(' + (+LK.form.lat).toFixed(4) + ", " + (+LK.form.lng).toFixed(4) + ')</span> · <a href="' + LK.mapUrl(LK.form.lat, LK.form.lng) + '">Map par dekho</a>'
      : '<span class="muted">Abhi location nahi li. 📍 dabao.</span>';
  };
  LK.act.gps = function (el) {
    var old = el.innerHTML; el.disabled = true; el.innerHTML = "📍 Location dhoondh raha hoon…";
    return LK.gps().then(function (p) {
      LK.form.lat = p.lat; LK.form.lng = p.lng; LK.locInfo();
      return LK.revgeo(p.lat, p.lng).then(function (a) {
        if (a && !String(LK.form.address || "").trim()) { LK.form.address = a; var ta = $("#f-address"); if (ta) ta.value = a; }
      });
    }).catch(function (e) { LK.toast(LK.gpsMsg(e), "bad"); })
      .then(function () { el.disabled = false; el.innerHTML = LK.form.lat != null ? "📍 Location dobara lo" : old; LK.locInfo(); onForm(); });
  };

  /* ---------- images ---------- */
  LK.shrink = function (file, max) {
    max = max || 1280;
    if (!/^image\//.test(file.type)) return Promise.resolve(file);
    return new Promise(function (res) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        c.toBlob(function (b) { res(b ? new File([b], (file.name || "photo").replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file); }, "image/jpeg", 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); res(file); };
      img.src = u;
    });
  };
  LK.qrSvg = function (text) {
    try { var q = window.qrcode(0, "M"); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 5, margin: 2, scalable: true }); } catch (e) { return ""; }
  };
  /* ---- in-app notification list (bell) ---- */
  function nkey() { return "lk-notes-" + ((window.BE && BE.uid && BE.uid()) || (LK.S.demo ? "demo" : "x")); }
  LK.notes = function () { try { return JSON.parse(localStorage.getItem(nkey()) || "[]"); } catch (e) { return []; } };
  function saveNotes(a) { try { localStorage.setItem(nkey(), JSON.stringify(a.slice(0, 60))); } catch (e) {} }
  LK.unreadNotes = function () { return LK.notes().filter(function (n) { return !n.r; }).length; };
  LK.addNote = function (title, body) { var a = LK.notes(); a.unshift({ t: title, b: body || "", at: Date.now(), r: 0 }); saveNotes(a); LK.bellRefresh(); };
  LK.bellRefresh = function () { var b = document.getElementById("bellcnt"); if (!b) return; var n = LK.unreadNotes(); b.textContent = n > 9 ? "9+" : n; b.style.display = n ? "" : "none"; };
  LK.notify = function (title, body) {
    LK.addNote(title, body);
    if (LK.catchup) return; // already shown by the background alert; only list it in the bell
    LK.toast(title + (body ? " — " + body : ""));
    try { if (window.LkNative && window.LkNative.notify) window.LkNative.notify(title, body || ""); } catch (e) {}
  };
  LK.act.bell = function () { LK.go("notes"); };
  LK.views.notes = {
    html: function () {
      var a = LK.notes();
      var h = '<section class="pad"><div class="row"><h2>🔔 Notifications</h2>' + (a.length ? '<button class="btn ghost sm" data-act="clearnotes">Saaf karo</button>' : "") + "</div>";
      if (!a.length) return h + '<div class="empty">Abhi koi notification nahi.</div></section>';
      return h + '<div class="list">' + a.map(function (n) { return '<div class="card nt' + (n.r ? "" : " new") + '"><b>' + esc(n.t) + "</b>" + (n.b ? "<span>" + esc(n.b) + "</span>" : "") + "<small>" + LK.ago(new Date(n.at).toISOString()) + "</small></div>"; }).join("") + "</div></section>";
    },
    init: function () { var a = LK.notes(); a.forEach(function (n) { n.r = 1; }); saveNotes(a); LK.bellRefresh(); }
  };
  LK.act.clearnotes = function () { saveNotes([]); LK.bellRefresh(); LK.redraw(LK.top()); };

  /* header digital clock, 12-hour, red */
  LK.clock = function () {
    var d = new Date(), h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m + " " + ap;
  };
  setInterval(function () { var e = document.getElementById("clk"); if (e) e.textContent = LK.clock(); }, 1000);
})();
