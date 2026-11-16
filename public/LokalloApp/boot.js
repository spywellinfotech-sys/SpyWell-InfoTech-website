/* Boot: session restore, routing after login, demo start, polling for alerts. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$;
  var FALLBACK = { lat: 26.8467, lng: 80.9462 };

  LK.loadMe = function () {
    S.api.fees().then(function (f) { S.fees = f; LK.checkUpdate(); }, function () {});
    return S.api.me().then(function (m) {
      S.profile = m.profile; S.shop = m.shop; S.admin = !!m.admin; S.phone = m.phone || S.phone;
      if (m.profile && m.profile.lat != null) S.loc = { lat: +m.profile.lat, lng: +m.profile.lng };
      return m;
    });
  };
  /* Force update: server setting min_build (admin) vs this app's build number. Blocks the app until updated. */
  LK.myBuild = function () { try { return window.LkNative && LkNative.appVersion ? +LkNative.appVersion() || 0 : 0; } catch (e) { return 0; } };
  LK.checkUpdate = function () {
    var sg = !!window.LK_SINGLE, min = +((S.fees || {})[sg ? "min_build_single" : "min_build"]) || 0, mine = LK.myBuild();
    if (!mine || !(min > mine) || $("#force")) return;
    var d = document.createElement("div"); d.id = "force";
    d.innerHTML = '<div class="fbox"><img class="logo" src="' + LK.IMG.icon + '" alt=""><h2>⬆️ Naya update zaroori hai</h2><p>' + LK.esc((S.fees.update_msg || "LoKalLo ka naya version aa gaya hai. Aage use karne ke liye update karo.")) + '</p><a class="btn big" href="' + LK.esc((sg ? (S.fees || {}).single_update_url : LK.APK_URL) || "") + '">⬇️ Update download karo</a><p class="muted sm">Download hone ke baad file kholkar Install dabao.</p></div>';
    document.body.appendChild(d);
  };
  LK.complete = function (p) { return complete(p); };
  function complete(p) { return !!(p && p.full_name && p.phone && p.age && p.sex && p.lat != null && p.address); }
  LK.syncWatch = function () {
    if (S.demo || !window.LkNative || !LkNative.setWatch || !window.BE || !BE.signedIn()) return;
    S.api.watchKey().then(function (wk) { LkNative.setWatch(JSON.stringify({ url: window.LK_CONFIG.supabaseUrl, key: window.LK_CONFIG.supabaseKey, uid: BE.uid(), wk: wk, hi: !!LK.hi })); }).catch(function () {});
  };
  /* Switch to shopkeeper mode (new order arrived / notification tapped). */
  LK.openShopMode = function () {
    if (!S.shop || S.mode === "shop") return false;
    S.mode = "shop"; try { localStorage.setItem("lk-mode", "shop"); } catch (x) {}
    S.badge = S.badge || { c: 0, s: 0 };
    LK.root("sorders"); return true;
  };
  window.__lkOpen = function () {
    var v = ""; try { if (window.LkNative && LkNative.takeOpen) v = LkNative.takeOpen(); } catch (x) {}
    if (v === "shop") LK.openShopMode();
  };
  LK.enter = function () { if (LK.singleEnter) return LK.singleEnter(LK.enter2); LK.enter2(); };
  LK.pendingGate = function () {
    var d = $("#gate") || document.createElement("div"); d.id = "gate";
    d.innerHTML = '<div class="fbox"><h2>⏳ Approval baaki hai</h2><p><b>' + LK.esc(S.shop.name) + '</b> ka registration mil gaya. ✅ Aapki shop approve hone ke baad list kar di jayegi — 24 ghante ke andar. Tab tak grahakon ko dikhegi nahi.</p><button class="btn" data-act="sgreload">🔄 Dobara check karo</button><button class="btn ghost sm" data-act="logout">Logout</button></div>';
    if (!d.parentNode) document.body.appendChild(d);
  };
  LK.enter2 = function () {
    var g = $("#gate"); if (g && g.parentNode) g.parentNode.removeChild(g);
    LK.syncWatch();
    var mode = "customer"; try { mode = localStorage.getItem("lk-mode") || "customer"; } catch (x) {}
    var saved = null; try { saved = localStorage.getItem("lk-mode"); } catch (x) {}
    S.mode = S.shop && saved !== "customer" ? "shop" : "customer";
    var rb = LK.isBoy && LK.isBoy(), rs = LK.isSup && LK.isSup();
    if (rb && (saved === "dboy" || (saved !== "supp" && ((!S.shop && saved !== "customer") || !complete(S.profile))))) S.mode = "dboy";
    else if (rs && (saved === "supp" || (!S.shop && saved !== "customer") || !complete(S.profile))) S.mode = "supp";
    S.seen = null; S.badge = { c: 0, s: 0 };
    if (S.mode === "shop") LK.root("sorders"); else if (S.mode === "dboy") LK.root("dhome"); else if (S.mode === "supp") LK.root("shome"); else LK.homeRoot();
    startPoll();
    window.__lkOpen();
    if (S.shop && S.shop.status === "pending" && !S.admin && !S.pendShown) { S.pendShown = true; LK.pendPopup(); }
  };
  LK.pendPopup = function () {
    LK.sheet('<h3>⏳ Approval baaki hai</h3><p><b>' + LK.esc((S.shop && S.shop.name) || "Aapki dukaan") + '</b> ka registration mil gaya. Aapki shop approve hone ke baad list kar di jayegi — 24 ghante ke andar.</p><button class="btn big" data-act="mclose" data-v="0">Theek hai</button>');
  };
  /* Active time: while the app is open and on screen, tell the server every 60 s. */
  var beatT = null, beatLast = 0;
  LK.startBeat = function () {
    if (beatT || S.demo) return; beatLast = Date.now();
    beatT = setInterval(function () {
      var now = Date.now(), gap = Math.round((now - beatLast) / 1000); beatLast = now;
      if (document.hidden || S.demo || !window.BE || !BE.signedIn() || !S.api || !S.api.beat) return;
      S.api.beat(window.LK_SINGLE ? "single" : "multi", Math.min(gap, 120)).catch(function () {});
    }, 60000);
  };
  LK.afterLogin = function () {
    S.api = window.API.real;
    try { S.api.ping(window.LK_SINGLE ? "single" : "multi", LK.myBuild()).catch(function () {}); } catch (x) {}
    LK.startBeat();
    return S.api.claimInvite().catch(function () {}).then(function () { return LK.loadMe(); }).then(function () { return LK.dboyLoad ? LK.dboyLoad() : null; }).then(function () { return LK.supLoad ? LK.supLoad() : null; }).then(function () { return LK.subLoad ? LK.subLoad() : null; }).then(function () {
      if (!complete(S.profile) && !((LK.isBoy && LK.isBoy() || LK.isSup && LK.isSup()) && !S.shop)) return LK.root("setup");
      if (!S.shop && S.profile) { /* customer */ }
      try { LK.driveSync(); } catch (x) {}
      LK.enter();
      try { LK.driveRestoreCheck(); } catch (x) {}
    });
  };
  LK.startDemo = function (partial) {
    S.api = window.API.demo; S.demo = true;
    return LK.gps().catch(function () { return FALLBACK; }).then(function (p) {
      window.API.demo.start(p.lat, p.lng, !partial);
      if (!partial) {
        return window.API.demo.saveProfile({ full_name: "Ramesh Gupta", phone: "9876543210", age: 34, sex: "male", address: "Main Bazaar, Ward 3", lat: p.lat, lng: p.lng }).then(function () { return LK.loadMe(); }).then(function () { try { localStorage.setItem("lk-mode", "customer"); } catch (x) {} LK.enter(); });
      }
      S.profile = null; S.shop = null; S.loc = p; S.admin = true;
      LK.root("setup");
    });
  };

  LK.act.tomode = function (el) {
    if (el.dataset.v === "shop" && S.mode === "dboy") return;
    S.mode = el.dataset.v; try { localStorage.setItem("lk-mode", S.mode); } catch (x) {}
    S.seen = null;
    if (S.mode === "customer" && !complete(S.profile)) { LK.toast("Pehle apni jaankari bharo.", "bad"); return LK.root("setup"); }
    if (S.mode === "shop") LK.root("sorders"); else if (S.mode === "dboy") LK.root("dhome"); else if (S.mode === "supp") LK.root("shome"); else LK.homeRoot();
  };
  LK.act.toggleopen = function () {
    var nv = !S.shop.is_open;
    return S.api.setOpen(nv).then(function () { S.shop.is_open = nv; LK.toast(nv ? "Dukaan khul gayi 🟢" : "Dukaan band 🔴"); LK.header(V[LK.top().name]); }, LK.fail);
  };
  LK.act.logout = function () {
    return LK.ask("Logout karna hai?", "Haan, logout", true).then(function (ok) {
      if (!ok) return;
      stopPoll(); try { if (window.LkNative && LkNative.clearWatch) LkNative.clearWatch(); } catch (x) {}
      return S.api.logout().then(function () {
        S.profile = S.shop = null; S.admin = false; S.demo = false; S.loc = null; S.cart = {}; S.cartShop = null; S.mode = "customer";
        try { localStorage.removeItem("lk-mode"); } catch (x) {}
        LK.root("login");
      });
    });
  };

  /* ---------- Android back button / Google return ---------- */
  window.__lkBack = function () {
    if (LK.sheetOpen()) { var m = $("#modal [data-act=mclose]"); if (m) m.click(); else LK.closeSheet(); return true; }
    return LK.back();
  };
  window.__lkAuth = function (frag) {
    return window.BE.finishOAuth(frag).then(function (g) { S.googleName = g.name; try { if (localStorage.getItem("lk-drive-pending") === "1") { localStorage.removeItem("lk-drive-pending"); if (LK.driveTok && LK.driveTok()) S.autoBackup = true; } } catch (x) {} return LK.afterLogin(); }).then(function () { if (S.autoBackup && S.shop) { LK.go("backup"); } else S.autoBackup = false; }).catch(function (e) { LK.toast((e && e.message) || "Google login nahi ho paya.", "bad"); });
  };

  /* ---------- polling for alerts ---------- */
  var timer = null;
  function stopPoll() { if (timer) clearInterval(timer); timer = null; }
  LK.stopPoll = stopPoll;

  /* Hidden: press and hold the logo for 2 seconds to open "delete my account". */
  (function () {
    var t = null;
    function stop() { if (t) clearTimeout(t); t = null; }
    function isLogo(ev) { return ev.target && ev.target.classList && ev.target.classList.contains("logo"); }
    function start(ev) {
      if (!isLogo(ev) || !S.profile) return;
      stop();
      t = setTimeout(function () { t = null; try { if (navigator.vibrate) navigator.vibrate(60); } catch (x) {} LK.act.delacct(); }, 2000);
    }
    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("mousedown", start);
    ["touchend", "touchcancel", "mouseup", "mouseleave", "touchmove", "scroll"].forEach(function (n) { document.addEventListener(n, stop, true); });
    document.addEventListener("contextmenu", function (ev) { if (isLogo(ev)) ev.preventDefault(); });
  })();
  function startPoll() { stopPoll(); if (S.demo || !S.api || S.api.demo) { /* demo also polls: simulated replies */ } timer = setInterval(poll, 15000); poll(); }
  function sig(o) { return [o.status, o.bill_version, o.has_comment, o.customer_paid].join("|"); }
  var newShopOrder = false;
  function handle(list, shop, seen, first) {
    var cnt = 0;
    (list || []).forEach(function (o) {
      var k = (shop ? "s" : "c") + o.id, s = sig(o), old = seen[k];
      if (shop) {
        if (o.status === "placed" || o.has_comment || (o.customer_paid && o.status === "confirmed")) cnt++;
        if (!first) {
          if (!old) { LK.notify("Online Order aaya hai 🛒", (o.customer_name || "") + " ka order #" + o.code); if (S.mode !== "shop" && S.shop) newShopOrder = true; }
          else if (old !== s) { if (o.has_comment) LK.notify("Customer ka comment 💬", "#" + o.code + " ke rate par"); else if (o.customer_paid) LK.notify("UPI payment 📲", "#" + o.code + " ka customer ne pay kiya"); else if (o.status === "confirmed") LK.notify("Order confirm ✓", "#" + o.code); }
        }
      } else {
        if (o.status === "bill_sent") cnt++;
        if (!first && old && old !== s) {
          var nm = (o.lk_shops && o.lk_shops.name) || "Dukaan";
          if (o.status === "bill_sent") LK.notify("Bill aa gaya 🧾", nm + " ne bill bheja");
          else if (o.status === "ready") LK.notify("Pickup ready 🛍️", nm);
          else if (o.status === "out_for_delivery") LK.notify("Delivery pe nikla 🚚", nm);
          else if (o.status === "completed") LK.notify("Order poora hua ✅", nm);
          else if (o.status === "rejected") LK.notify("Dukaan ne mana kiya", nm);
        }
      }
      seen[k] = s;
    });
    return cnt;
  }
  function poll() {
    if (document.hidden && !window.LkNative) return;
    if (!S.demo && window.BE && !BE.signedIn()) {
      stopPoll(); try { if (window.LkNative && LkNative.clearWatch) LkNative.clearWatch(); } catch (x) {}
      S.profile = S.shop = null; S.admin = false; S.cart = {}; LK.root("login"); LK.toast("Session khatam ho gaya. Dobara login karo.", "bad"); return;
    }
    if (!S.demo) S.api.fees().then(function (f) { S.fees = f; LK.checkUpdate(); }, function () {});
    var skey = "lk-seen-" + ((window.BE && BE.uid && BE.uid()) || "demo");
    if (!S.seen && !S.demo) { try { var ps = JSON.parse(localStorage.getItem(skey) || "null"); if (ps) { S.seen = ps; LK.catchup = true; } } catch (x) {} }
    var first = !S.seen, seen = S.seen = S.seen || {};
    Promise.all([S.api.myOrders().catch(function () { return []; }), S.shop ? S.api.shopOrders(S.shop.id).catch(function () { return []; }) : Promise.resolve([])]).then(function (r) {
      S.badge.c = handle(r[0], false, seen, first);
      S.badge.s = handle(r[1], true, seen, first);
      if (S.admin && S.api.adminLuckyReqs) S.api.adminLuckyReqs().then(function (lr) { (lr || []).forEach(function (q) { var kk = "a" + q.shop_id; if (!seen[kk]) { if (!first) LK.notify("Lucky Draw request 🎁", q.shop_name + " ne fee pay ki — enable karo"); seen[kk] = 1; } }); }, function () {});
      LK.catchup = false; if (!S.demo) { try { localStorage.setItem(skey, JSON.stringify(seen)); } catch (x) {} }
      if (newShopOrder) { newShopOrder = false; if (!LK.sheetOpen() && LK.openShopMode()) LK.toast("Naya order aaya — dukaandaar mode khul gaya 🏪"); }
      if (LK.dboyPoll) LK.dboyPoll(first); if (LK.supPoll) LK.supPoll(first);
      var e = LK.top(); if (!e) return; var v = V[e.name];
      LK.navRefresh(); LK.bellRefresh();
      if (v && v.init && ["orders", "order", "sorders", "sorder", "dhome", "shome"].indexOf(e.name) > -1 && !LK.sheetOpen()) v.init(e, true);
    }).catch(function () {});
  }

  /* ---------- start ---------- */
  function start() {
    $("#screen").innerHTML = '<div class="splash"><img src="' + (LK.IMG.splash || LK.IMG.icon) + '" alt="LoKalLo"></div>';
    if (LK.PROTO) return LK.root("login");
    S.api = window.API.real;
    if (!window.LkNative && /access_token=/.test(location.hash || "")) {
      var fr = location.hash; try { history.replaceState(null, "", location.pathname + location.search); } catch (x) {}
      return window.__lkAuth(fr).then(function () { if (!(window.BE && BE.signedIn())) LK.root("login"); });
    }
    try { if (window.BE && BE.devicePing) BE.devicePing(window.LK_SINGLE ? "single" : "multi", LK.myBuild()); } catch (x) {}
    if (window.BE && BE.signedIn()) return LK.afterLogin().catch(function () { LK.root("login"); });
    LK.root("login");
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden && timer) poll(); });
  /* Browser (web) version: show an "install the app" bar; hidden inside the real app. */
  function webBar() {
    if (!window.LkNative) document.documentElement.classList.add("web");
    var g = document.getElementById("getapp"); if (!g || window.LkNative) return;
    var u = "https://toouzmbhlltipjjcyqim.supabase.co/storage/v1/object/public/lk-apk/" + (window.LK_SINGLE ? "Shop-sharma.apk" : "LoKalLo.apk");
    var closed = false; try { closed = sessionStorage.getItem("lk-getapp") === "1"; } catch (x) {}
    if (closed) return;
    g.innerHTML = '<span>📲 Behtar anubhav ke liye app download karein</span><a class="btn sm" href="' + u + '" download>App download</a><button type="button" aria-label="Band karo" id="getappx">✕</button>';
    g.hidden = false;
    document.getElementById("getappx").onclick = function () { g.hidden = true; try { sessionStorage.setItem("lk-getapp", "1"); } catch (x) {} };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", webBar); else webBar();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
