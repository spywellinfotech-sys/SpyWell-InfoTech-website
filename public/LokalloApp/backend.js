/* LoKalLo backend client (adapted from the Yada+ client). Talks to Supabase over plain fetch
   (Auth + PostgREST + Storage), so no vendor library is needed. Exposes window.BE. */
(function (root) {
  "use strict";
  var C = root.LK_CONFIG || {};
  var URL_ = String(C.supabaseUrl || "").replace(/\/+$/, ""), KEY = String(C.supabaseKey || "");
  var SKEY = "lk-session-v1";
  var BE = { sess: null, url: URL_ };

  var MSG = {
    invalid_phone: "10 ank ka sahi mobile number daalo.",
    invalid_pin: "PIN 6 ank ka hona chahiye.",
    wrong_pin: "PIN galat hai. Dobara koshish karo.",
    too_many_attempts: "Bahut baar galat PIN. 15 minute baad koshish karo.",
    signup_failed: "Account nahi ban paaya. Thodi der baad koshish karo.",
    not_authenticated: "Dobara login karo.",
    invalid_name: "Sahi naam likho.",
    invalid_shop_name: "Dukaan ka naam likho.",
    location_required: "Dukaan ki location lo (GPS button dabao).",
    choose_shop_type: "Dukaan ka type chuno (Kirana, Dairy...).",
    no_shop: "Pehle apni dukaan register karo.",
    invalid_rate: "Sahi rate likho.",
    profile_required: "Pehle apna naam aur mobile number bharo.",
    shop_unavailable: "Ye dukaan abhi order nahi le rahi.",
    shop_closed: "Dukaan abhi band hai.",
    own_shop: "Apni hi dukaan par order nahi kar sakte.",
    empty_list: "List khaali hai. Kuch saman jodo.",
    too_many_items: "Ek list mein 80 se zyada saman nahi.",
    too_many_open_orders: "Aapke 5 order pehle se chal rahe hain. Unka bill aane do.",
    invalid_items: "List mein kuch galat hai.",
    order_not_found: "Order nahi mila.",
    bill_locked: "Customer confirm kar chuka hai, bill ab nahi badal sakta.",
    choose_delivery_or_pickup: "Home delivery ya pickup mein se kam se kam ek chuno.",
    invalid_charge: "Delivery charge sahi likho.",
    rate_missing: "Har saman ka rate bharo, ya jo nahi hai use hatao.",
    amount_missing: "Is saman ki unit alag hai, total rupaye khud likho.",
    not_bill_stage: "Ye order ab is step par nahi hai.",
    invalid_comment: "Comment likho.",
    delivery_not_offered: "Dukaan home delivery nahi de rahi.",
    pickup_not_offered: "Is order par pickup nahi hai.",
    address_required: "Delivery ke liye pata likho.",
    not_cancellable: "Confirm hone ke baad order cancel nahi hota. Dukaandaar se baat karo.",
    invalid_status: "Ye status abhi nahi badal sakta.",
    not_refundable: "Is order par refund nahi ho sakta.",
    invalid_amount: "Refund ki raqam sahi likho.",
    invalid_title: "Ad ka title likho.",
    invalid_media: "Photo ya video sahi nahi hai.",
    too_many_promos: "Ek saath 5 ad chal sakte hain. Purana band karo.",
    admins_only: "Sirf admin ye kar sakta hai.",
    upload_failed: "File upload nahi hui. Chhoti file try karo.",
    oauth_failed: "Google login poora nahi hua. Dobara koshish karo.",
    provider_disabled: "Google login abhi chalu nahi hai. Mobile + PIN se login karo.",
    validation_failed: "Google login abhi chalu nahi hai. Mobile + PIN se login karo.",
    invalid_age: "Sahi umar likho (10 se 110).",
    invalid_upi: "UPI ID sahi likho, jaise naam@okaxis.",
    too_many_photos: "Dukaan ki 6 photo tak laga sakte ho.",
    upi_not_available: "Is dukaan ki UPI ID nahi hai. Cash chuno.",
    invalid_payment: "Payment ka tarika chuno.",
    not_payable: "Is order par abhi payment nahi.",
    invalid_sex: "Ling chuno.",
    invalid_referral_code: "Ye referral code sahi nahi hai.",
    referral_already_used: "Aap pehle hi referral code laga chuke ho.",
    referral_too_late: "Referral code sirf pehle order se pehle lag sakta hai.",
    not_found: "Nahi mila."
  };
  function friendly(code, status) {
    if (MSG[code]) return MSG[code];
    if (status === 0) return "Internet nahi hai. Connection dekho aur dobara koshish karo.";
    if (status === 401 || status === 403) return "Dobara login karo.";
    if (status === 413) return "File bahut badi hai (50 MB tak).";
    return "Kuch gadbad hui" + (code ? " (" + code + ")" : "") + ". Dobara koshish karo.";
  }
  function Err(code, status) { var e = new Error(friendly(code, status)); e.code = code; e.status = status; return e; }

  function ls(op, k, v) { try { if (op === "g") return localStorage.getItem(k); if (op === "s") localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} return null; }
  function loadSess() { try { var s = JSON.parse(ls("g", SKEY)); if (s && s.access_token && s.user) BE.sess = s; } catch (e) {} }
  function saveSess(s) {
    BE.sess = s;
    if (s) ls("s", SKEY, JSON.stringify({ access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at || (Math.floor(Date.now() / 1000) + (s.expires_in || 3600)), user: { id: s.user.id, phone: (s.user.user_metadata || {}).phone || s.user.phone || "" } }));
    else ls("r", SKEY);
  }
  loadSess();

  function raw(path, opt, tok) {
    opt = opt || {};
    var h = { apikey: KEY, Authorization: "Bearer " + (tok || KEY) };
    if (!opt.file) h["Content-Type"] = "application/json";
    if (opt.headers) for (var k in opt.headers) h[k] = opt.headers[k];
    return fetch(URL_ + path, { method: opt.method || "GET", headers: h, body: opt.file ? opt.file : (opt.body === undefined ? undefined : JSON.stringify(opt.body)) })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
          if (!r.ok) {
            var m = j && (j.message || j.error || j.msg || j.error_description) || "";
            var code = /^[a-z_]+$/.test(String(m)) ? m : (j && j.error_code) || ("http_" + r.status);
            throw Err(code, r.status);
          }
          return j;
        });
      }, function () { throw Err("offline", 0); });
  }
  var refreshing = null;
  function token() {
    var s = BE.sess; if (!s) return Promise.resolve(null);
    var now = Math.floor(Date.now() / 1000);
    if (s.expires_at && s.expires_at - now > 60) return Promise.resolve(s.access_token);
    if (refreshing) return refreshing;
    refreshing = raw("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: s.refresh_token } })
      .then(function (j) { j.user = j.user || s.user; saveSess(j); refreshing = null; return j.access_token; },
        function (e) { refreshing = null; if (e.status === 400 || e.status === 401) saveSess(null); throw e; });
    return refreshing;
  }
  function api(path, opt) { return token().then(function (t) { if (!t) throw Err("login_needed", 401); return raw(path, opt, t); }); }
  BE.rpc = function (name, args) { return api("/rest/v1/rpc/" + name, { method: "POST", body: args || {} }); };
  /* Install count: a random id kept on this phone, sent on every start (works before login too). */
  BE.devicePing = function (ed, build) {
    var id = ""; try { id = localStorage.getItem("lk-dev") || ""; if (!id) { id = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12); localStorage.setItem("lk-dev", id); } } catch (e) {}
    if (!id) return Promise.resolve();
    return token().then(function (t) { return t || null; }, function () { return null; }).then(function (t) { return raw("/rest/v1/rpc/lk_device_ping", { method: "POST", body: { p_device: id, p_edition: ed, p_build: build || 0 } }, t); }).catch(function () {});
  };
  BE.fn = function (name, body) { return api("/functions/v1/" + name, { method: "POST", body: body || {} }); };
  BE.sel = function (table, qs) { return api("/rest/v1/" + table + (qs ? "?" + qs : "")); };
  BE.friendly = friendly;

  /* ---- auth: mobile + 6-digit PIN ---- */
  BE.signedIn = function () { return !!BE.sess; };
  BE.uid = function () { return BE.sess ? BE.sess.user.id : null; };
  BE.myPhone = function () { return BE.sess ? BE.sess.user.phone || "" : ""; };
  BE.login = function (phone, pin) {
    return raw("/functions/v1/lk-auth", { method: "POST", body: { phone: phone, pin: pin } }).then(function (j) {
      if (!j || !j.access_token) throw Err("wrong_pin", 400);
      j.user = j.user || {}; j.user.user_metadata = j.user.user_metadata || { phone: phone };
      saveSess(j); return j;
    });
  };
  /* Google sign-in: the app opens the browser at this URL; Supabase returns to redirectTo with the session in the fragment. */
  BE.googleUrl = function (redirectTo, withDrive) {
    var u = URL_ + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(redirectTo);
    /* Normal login stays plain. Drive access (own files only, offline for the nightly backup) is asked only from the Drive backup button. */
    if (withDrive) u += "&scopes=" + encodeURIComponent("https://www.googleapis.com/auth/drive.file") + "&access_type=offline&prompt=consent";
    return u;
  };
  BE.finishOAuth = function (frag) {
    var q = {};
    String(frag || "").replace(/^[#?]/, "").split("&").forEach(function (kv) { var i = kv.indexOf("="); if (i > 0) q[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " ")); });
    if (!q.access_token) return Promise.reject(Err("oauth_failed", 400));
    if (q.provider_token && LK.driveSave) LK.driveSave(q.provider_token);
    if (q.provider_refresh_token) { try { localStorage.setItem("lk-grt", q.provider_refresh_token); } catch (e) {} }
    return raw("/auth/v1/user", {}, q.access_token).then(function (u) {
      saveSess({ access_token: q.access_token, refresh_token: q.refresh_token || "", expires_at: q.expires_at ? +q.expires_at : Math.floor(Date.now() / 1000) + (+q.expires_in || 3600), user: { id: u.id, user_metadata: u.user_metadata || {} } });
      var m = u.user_metadata || {}; return { name: String(m.full_name || m.name || "").slice(0, 80), email: u.email || "" };
    });
  };
  BE.logout = function () { var t = BE.sess && BE.sess.access_token; saveSess(null); if (t) return raw("/auth/v1/logout", { method: "POST" }, t).catch(function () {}); return Promise.resolve(); };

  /* ---- reads ---- */
  BE.profile = function () { return BE.sel("lk_profiles", "id=eq." + BE.uid() + "&select=*").then(function (r) { return r && r[0] || null; }); };
  BE.myShop = function () { return BE.sel("lk_shops", "owner_id=eq." + BE.uid() + "&select=*").then(function (r) { return r && r[0] || null; }); };
  BE.isAdmin = function () { return BE.sel("lk_admins", "user_id=eq." + BE.uid() + "&select=user_id").then(function (r) { return !!(r && r.length); }); };
  BE.catalog = function () { return BE.sel("lk_catalog", "select=*&order=shop_type,sort"); };
  BE.shopItems = function (shopId) { return BE.sel("lk_shop_items", "shop_id=eq." + shopId + "&select=*&order=name"); };
  BE.orders = function (filter) { return BE.sel("lk_orders", filter + "&select=*,lk_shops(name,phone,address,lat,lng)&order=created_at.desc&limit=100"); };
  BE.order = function (id) { return BE.sel("lk_orders", "id=eq." + id + "&select=*,lk_shops(name,phone,address,lat,lng)").then(function (r) { return r && r[0] || null; }); };
  BE.orderItems = function (id) { return BE.sel("lk_order_items", "order_id=eq." + id + "&select=*&order=pos"); };
  BE.orderEvents = function (id) { return BE.sel("lk_order_events", "order_id=eq." + id + "&select=event,at&order=at"); };
  BE.myPromos = function (shopId) { return BE.sel("lk_promos", "shop_id=eq." + shopId + "&select=*&order=created_at.desc&limit=20"); };
  BE.allShops = function () { return BE.sel("lk_shops", "select=*&order=created_at.desc&limit=300"); };
  BE.mediaUrl = function (p) { return p ? URL_ + "/storage/v1/object/public/lk-media/" + p.split("/").map(encodeURIComponent).join("/") : ""; };

  /* ---- upload a photo or video for a shop ad ---- */
  BE.upload = function (file) {
    var ext = (String(file.name || "").split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "bin";
    var path = BE.uid() + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    return api("/storage/v1/object/lk-media/" + path, { method: "POST", file: file, headers: { "Content-Type": file.type || "application/octet-stream", "x-upsert": "false" } })
      .then(function () { return path; }, function (e) { if (e.status === 413) throw e; throw Err("upload_failed", e.status); });
  };

  /* ---- private KYC files (delivery boy photo / Aadhaar): only the uploading shopkeeper can read them ---- */
  BE.uploadKyc = function (file) {
    var path = BE.uid() + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
    return api("/storage/v1/object/lk-kyc/" + path, { method: "POST", file: file, headers: { "Content-Type": file.type || "image/jpeg", "x-upsert": "false" } })
      .then(function () { return path; }, function (e) { throw Err(e.status === 413 ? "http_413" : "upload_failed", e.status); });
  };
  BE.kycBlob = function (path) {
    return token().then(function (t) {
      return fetch(URL_ + "/storage/v1/object/authenticated/lk-kyc/" + path.split("/").map(encodeURIComponent).join("/"), { headers: { apikey: KEY, Authorization: "Bearer " + t } });
    }).then(function (r) { if (!r.ok) throw Err("http_" + r.status, r.status); return r.blob(); }).then(function (b) { return URL.createObjectURL(b); });
  };

  /* ---- delete my uploaded files (account deletion) ---- */
  BE.rmMedia = function (paths) {
    if (!paths || !paths.length) return Promise.resolve();
    return api("/storage/v1/object/lk-media", { method: "DELETE", body: { prefixes: paths } }).catch(function () {});
  };

  root.BE = BE;
})(window);
