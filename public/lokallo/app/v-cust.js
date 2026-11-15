/* Customer side: nearby shops, shop page, saman list, orders, bill confirmation, profile. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc;
  var LOADING = '<div class="empty">Ruko…</div>';
  function activeInput() { var a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && $("#screen").contains(a)); }
  function shortAddr() { var a = (S.profile && S.profile.address) || ""; return a ? (a.length > 30 ? a.slice(0, 30) + "…" : a) : "Meri location"; }

  /* ================= home: nearby shops ================= */
  function loadHome(e) {
    var l = S.loc; if (!l) return Promise.resolve();
    var byArea = LK.areaActive && LK.areaActive();
    return Promise.all([byArea ? S.api.shopsByArea(S.area.id, S.type, l.lat, l.lng) : S.api.nearbyShops(l.lat, l.lng, S.range, S.type), S.api.nearbyPromos(l.lat, l.lng)]).then(function (r) {
      var own = S.shop && S.shop.id;
      e.data = { shops: (r[0] || []).filter(function (s) { return s.id !== own; }), promos: r[1] || [] };
      e.busy = false; LK.redraw(e);
    }).catch(function (x) { e.busy = false; LK.fail(x); LK.redraw(e); });
  }
  LK.loadHome = loadHome;
  function shopCard(s) {
    var ph = s.photo ? '<img src="' + esc(LK.img(s.photo)) + '" alt="" loading="lazy">' : '<div class="noph">' + LK.TICON[(s.types || ["grocery"])[0]] + "</div>";
    var del = s.km > 50 ? "🎁 Demo dukaan — sabke liye" : s.delivers ? "🚚 Delivery " + (s.delivery_charge ? LK.money(s.delivery_charge) : "free") : "🚶 Sirf pickup";
    return '<button class="card shop' + (s.is_open ? "" : " closed") + '" data-act="openshop" data-id="' + s.id + '"><div class="sph">' + ph + "</div><div class=\"sb\"><div class=\"nm\">" + esc(s.name) +
      ' <span class="bd ' + (s.is_open ? "ok" : "bad") + '">' + (s.is_open ? "Khula" : "Band") + '</span></div><div class="sub">' + esc(LK.typesText(s.types)) + '</div><div class="meta"><b>📍 ' + (s.km == null ? "Aapke area mein" : LK.dist(s.km)) + "</b> · " + del + (s.min_order ? " · Min " + LK.money(s.min_order) : "") + "</div>" +
      (s.slots ? '<div class="meta hrs">🕒 ' + esc(s.slots) + "</div>" : "") +
      (s.has_upi ? '<div class="tags"><span class="tag">UPI ✓</span></div>' : "") + "</div></button>";
  }
  function draftBanner() {
    var d = LK.drafts(), ks = Object.keys(d).sort(function (a, b) { return d[b].at - d[a].at; });
    return ks.map(function (k) {
      var n = Object.keys(d[k].items).length;
      return '<div class="card hot draftb"><div class="row"><b>📝 Adhoori list — ' + esc(d[k].name) + "</b><span class=\"muted sm\">" + n + ' saman</span></div><div class="row2"><button class="btn sm" data-act="draftopen" data-id="' + esc(k) + '">Jaari rakho →</button><button class="btn ghost sm" data-act="draftrm" data-id="' + esc(k) + '">Hatao</button></div></div>';
    }).join("");
  }
  LK.act.draftopen = function (el) { LK.go("compose", { id: el.dataset.id }); };
  LK.act.draftrm = function (el) { LK.dropDraft(el.dataset.id); if (S.cartShop === el.dataset.id) { S.cart = {}; S.cartShop = null; } LK.toast("Draft hata diya"); LK.redraw(LK.top()); };
  var TCOL = { grocery: ["#E3F3E5", "#1B7A2E"], dairy: ["#E1EEFB", "#1F6FB5"], bakery: ["#F3E8FB", "#7a4fb5"], fruitveg: ["#FDE9D4", "#E8640C"], sweets: ["#FBE4E8", "#C4284A"] };
  function shopsHtml(d) {
    var q = String(S.hq || "").trim().toLowerCase(), list = d.shops;
    if (q) list = list.filter(function (s) { return (s.name + " " + LK.typesText(s.types) + " " + (s.address || "")).toLowerCase().indexOf(q) > -1; });
    var rt = S.range < 1 ? "500 m" : S.range + " km";
    if (!d.shops.length && LK.areaActive && LK.areaActive()) return '<div class="empty">Is gaon / mohalle mein abhi koi dukaan nahi hai.<br><button class="btn sm" data-act="hgpsmode">📍 GPS se paas ki dukaanein dekho</button></div>';
    if (!d.shops.length) return '<div class="empty">Is range mein koi dukaan nahi mili.<br><button class="btn sm" data-act="hrange" data-v="50">50 km tak dhoondho</button></div>';
    if (!list.length) return '<div class="empty">"' + esc(S.hq) + '" se koi dukaan nahi mili.</div>';
    return '<div class="list">' + list.map(shopCard).join("") + "</div>";
  }
  V.home = {
    tab: "home",
    html: function (e) {
      var d = e.data, p = S.profile || {}, first = String(p.full_name || "").trim().split(/\s+/)[0];
      var h = '<section class="home2"><div class="hhero"><button class="locchip2" data-act="hloc">📍 <span>' + esc(shortAddr()) + "</span> <b>↻</b></button>" +
        '<div class="hg">Namaste' + (first ? ", " + esc(first) + " ji" : "") + '</div><div class="ht">Aaj kya mangwana hai?</div></div>' +
        '<div class="hsearch"><span aria-hidden="true">🔍</span><input data-in="hsearch" aria-label="Dukaan khojo" placeholder="Dukaan ya saman khojo" value="' + esc(S.hq || "") + '"></div>';
      h += (LK.areaChip ? LK.areaChip() : "") + draftBanner();
      h += '<div class="hsec"><b>Kya chahiye?</b></div><div class="cats"><button class="cat" data-act="htype" data-v="" aria-pressed="' + (S.type === "") + '"><i style="background:#E3F3E5">🏪</i><span>Sab</span></button>' +
        Object.keys(LK.TYPES).map(function (t) { var c = TCOL[t] || ["#E3F3E5", "#1B7A2E"]; return '<button class="cat" data-act="htype" data-v="' + t + '" aria-pressed="' + (S.type === t) + '"><i style="background:' + c[0] + '">' + LK.TICON[t] + "</i><span>" + LK.TYPES[t] + "</span></button>"; }).join("") + "</div>";
      if (!d) return h + LOADING + "</section>";
      if (d.promos.length && !S.type) {
        h += '<div class="promos' + (d.promos.length === 1 ? " one" : "") + '">' + d.promos.map(function (p, i) {
          var m = p.media_type === "video" ? '<video src="' + esc(LK.img(p.media_path)) + '" muted autoplay loop playsinline></video>' : p.media_path ? '<img src="' + esc(LK.img(p.media_path)) + '" alt="">' : "";
          return '<button class="promo" data-act="openad" data-i="' + i + '">' + m + '<div class="pt"><small>' + esc(p.shop_name) + " · " + LK.dist(p.km) + "</small><b>" + esc(p.title) + "</b><span>" + esc(p.body) + "</span></div></button>";
        }).join("") + "</div>";
      }
      var rt = S.range < 1 ? "500 m" : S.range + " km";
      h += '<div class="hsec"><b>Paas ki dukaanein</b><span class="muted sm">' + (e.busy ? "Dhoondh raha hoon…" : d.shops.length + " dukaan" + (LK.areaActive && LK.areaActive() ? "" : " · " + rt)) + "</span></div>" +
        (LK.areaActive && LK.areaActive() ? "" : '<div class="rsl"><div class="row"><b>Doori (radius)</b><b id="rsl-v">' + (S.range < 1 ? "500 m" : S.range + " km") + '</b></div><input type="range" id="rslide" min="1" max="50" step="1" value="' + Math.max(1, Math.round(S.range)) + '" aria-label="Kitni door tak dukaan dekhni hain"><div class="row muted sm"><span>1 km</span><span>25 km</span><span>50 km</span></div></div>') +
        '<div id="hshops" class="hshops">' + shopsHtml(d) + "</div>";
      return h + "</section>";
    },
    init: function (e) { if (!S.loc && S.profile && S.profile.lat != null) S.loc = { lat: +S.profile.lat, lng: +S.profile.lng }; return loadHome(e); }
  };
  LK.inp.hsearch = function (el) { S.hq = el.value; var e = LK.top(), b = $("#hshops"); if (e && e.data && b) b.innerHTML = shopsHtml(e.data); };
  document.addEventListener("input", function (ev) { var t = ev.target; if (t && t.id === "rslide") { var v = $("#rsl-v"); if (v) v.textContent = t.value + " km"; } });
  document.addEventListener("change", function (ev) { var t = ev.target; if (t && t.id === "rslide") { S.range = +t.value; var e = LK.top(); if (e && e.name === "home") { e.busy = true; loadHome(e); } } });
  LK.act.hrange = function (el) { S.range = +el.dataset.v; var e = LK.top(); e.busy = true; LK.redraw(e); return loadHome(e); };
  LK.act.htype = function (el) { S.type = el.dataset.v; var e = LK.top(); e.busy = true; LK.redraw(e); return loadHome(e); };
  LK.act.hloc = function (el) {
    el.disabled = true;
    return LK.gps().then(function (p) { S.loc = p; LK.toast("Location update ho gayi ✓"); return loadHome(LK.top()); }, function (x) { LK.toast(LK.gpsMsg(x), "bad"); }).then(function () { el.disabled = false; });
  };
  LK.act.openad = function (el) {
    var e = LK.top(), p = e.data && e.data.promos && e.data.promos[+el.dataset.i]; if (!p) return;
    var m = p.media_type === "video" ? '<video src="' + esc(LK.img(p.media_path)) + '" controls autoplay playsinline></video>' : p.media_path ? '<img src="' + esc(LK.img(p.media_path)) + '" alt="">' : "";
    LK.sheet('<div class="adview">' + m + "<h3>" + esc(p.title) + "</h3><p>" + esc(p.body) + '</p><p class="muted sm">' + esc(p.shop_name) + " · " + LK.dist(p.km) + '</p><button class="btn big" data-act="adshop" data-id="' + esc(p.shop_id) + '">🏪 ' + esc(p.shop_name) + ' ki dukaan kholo</button><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button></div>');
  };
  LK.act.adshop = function (el) { LK.closeSheet(); LK.go("shop", { id: el.dataset.id }); };
  LK.act.openshop = function (el) { LK.go("shop", { id: el.dataset.id }); };

  /* ================= shop page ================= */
  V.shop = {
    tab: "home",
    html: function (e) {
      var s = e.data; if (!s) return LOADING;
      var km = S.loc ? window.API.km(S.loc.lat, S.loc.lng, s.lat, s.lng) : null, ph = s.photos || [];
      var gal = ph.length ? '<div class="gallery">' + ph.map(function (p) { return '<img src="' + esc(LK.img(p)) + '" alt="">'; }).join("") + "</div>" : '<div class="gallery"><div class="noph big">' + LK.TICON[(s.types || ["grocery"])[0]] + "</div></div>";
      var del = km != null && km > 50 ? "Demo dukaan: app try karne ke liye. Order ka bill dukaandaar banayega." : km != null && km > s.delivery_km ? "Aapke ghar tak delivery nahi (sirf pickup)" : (s.delivery_charge ? LK.money(s.delivery_charge) : "Free") + (s.free_above ? " · " + LK.money(s.free_above) + " se upar free" : "");
      return "<section>" + gal + '<div class="pad"><div class="row"><h2>' + esc(s.name) + '</h2><span class="bd ' + (s.is_open ? "ok" : "bad") + '">' + (s.is_open ? "Khula" : "Band") + "</span></div>" +
        '<p class="muted">' + esc(LK.typesText(s.types)) + (km != null ? " · 📍 " + LK.dist(km) : "") + "</p><p>" + esc(s.address || "") + "</p>" +
        '<div class="btns3"><a class="btn ghost sm" href="' + LK.tel(s.phone) + '">📞 Call</a><a class="btn ghost sm" href="' + LK.wa(s.phone, "Namaste, LoKalLo se aapki dukaan dekhi.") + '">💬 WhatsApp</a><a class="btn ghost sm" href="' + LK.mapUrl(s.lat, s.lng) + '">🗺️ Map</a></div>' +
        '<div class="kv"><div><span>Delivery</span><b>' + del + "</b></div><div><span>Kam se kam order</span><b>" + (s.min_order ? LK.money(s.min_order) : "Koi nahi") + "</b></div>" + (s.slots ? "<div><span>Working hours</span><b>" + esc(s.slots) + "</b></div>" : "") +
        "<div><span>Payment</span><b>Cash" + (s.upi_id ? " + UPI" : "") + "</b></div></div>" +
        (s.upi_qr ? '<div class="qrprev"><img src="' + esc(LK.img(s.upi_qr)) + '" alt="UPI QR"><small>Dukaan ka UPI QR</small></div>' : "") +
        (LK.singleBanner ? LK.singleBanner() : "") + (LK.ldBanner ? LK.ldBanner(e.ld) : "") + '<button class="btn big" data-act="compose" data-id="' + s.id + '"' + (s.is_open ? "" : " disabled") + ">" + (s.is_open ? "📝 Saman ki list banao" : "Dukaan abhi band hai") + "</button></div></section>";
    },
    init: function (e) { S.api.ldLive(e.params.id).then(function (l) { e.ld = l || []; if (e.data) LK.redraw(e); }, function () {}); return S.api.shop(e.params.id).then(function (s) { if (!s) throw new Error("Dukaan nahi mili."); e.data = s; LK.redraw(e); }).catch(LK.fail); }
  };
  LK.act.compose = function (el) { LK.go("compose", { id: el.dataset.id }); };

  /* ================= saman list ================= */
  var STEP = { kg: 0.5, g: 50, l: 0.5, ml: 100, packet: 1, piece: 1 };
  function cart() { return S.cart; }
  /* Draft: the saman list is saved on this phone automatically after every change, one draft per shop. */
  function dkey() { var u = ""; try { u = (window.BE && BE.uid && BE.uid()) || ""; } catch (x) {} return "lk-draft-" + (u || "demo"); }
  LK.drafts = function () {
    var d = {}; try { d = JSON.parse(localStorage.getItem(dkey()) || "{}") || {}; } catch (x) {}
    var old = Date.now() - 30 * 864e5; Object.keys(d).forEach(function (k) { if (!d[k] || !d[k].items || !Object.keys(d[k].items).length || d[k].at < old) delete d[k]; });
    return d;
  };
  function putDrafts(d) { try { localStorage.setItem(dkey(), JSON.stringify(d)); } catch (x) {} }
  function saveDraft() {
    var id = S.cartShop; if (!id) return; var d = LK.drafts();
    if (Object.keys(S.cart || {}).length) d[id] = { name: S.cartName || (d[id] && d[id].name) || "Dukaan", items: S.cart, at: Date.now() }; else delete d[id];
    putDrafts(d);
  }
  LK.dropDraft = function (id) { var d = LK.drafts(); delete d[id]; putDrafts(d); };
  function qtyHtml(c) {
    var pre = (LK.PRESET[c.kind] || []).map(function (p) { return '<button class="chip sm" data-act="qpre" data-k="' + c.key + '" data-q="' + p[0] + '" data-u="' + p[1] + '" aria-pressed="' + (+c.qty === p[0] && c.unit === p[1]) + '">' + LK.qty(p[0], p[1]) + "</button>"; }).join("");
    var units = (LK.KIND_UNITS[c.kind] || LK.KIND_UNITS.any).map(function (u) { return '<option value="' + u + '"' + (u === c.unit ? " selected" : "") + ">" + LK.UNAME[u] + "</option>"; }).join("");
    return '<div class="qty">' + (pre ? '<div class="chips">' + pre + "</div>" : "") +
      '<div class="step"><button data-act="qstep" data-k="' + c.key + '" data-d="-1" aria-label="Kam">−</button><input data-in="qv" data-k="' + c.key + '" value="' + c.qty + '" inputmode="decimal"><select data-in="qu" data-k="' + c.key + '">' + units + '</select><button data-act="qstep" data-k="' + c.key + '" data-d="1" aria-label="Zyada">+</button></div></div>';
  }
  function itemRow(key, name, en, c) {
    return '<div class="it' + (c ? " on" : "") + '"><button class="itl" data-act="tick" data-k="' + key + '" aria-pressed="' + !!c + '"><span class="cb">✓</span><span class="nm">' + esc(name) + (en && en !== name ? "<small>" + esc(en) + "</small>" : "") + "</span></button>" + (c ? qtyHtml(c) : "") + "</div>";
  }
  function composeItems(e) {
    var ct = cart(), q = (e.q || "").trim().toLowerCase(), rows = [];
    if (e.cur === "__sel" && !q) {
      Object.keys(ct).forEach(function (k) { rows.push(itemRow(k, ct[k].name, "", ct[k])); });
      return rows.length ? rows.join("") : '<div class="empty">Abhi kuch nahi chuna. Upar se category kholo aur saman tick karo.</div>';
    }
    var list = (e.cat || []).filter(function (c) { return q ? (c.name.toLowerCase().indexOf(q) > -1 || (c.name_en || "").toLowerCase().indexOf(q) > -1) : (c.shop_type + "|" + c.category) === e.cur; });
    list.slice(0, 80).forEach(function (c) {
      var k = "c" + c.id; rows.push(itemRow(k, c.name, c.name_en, ct[k]));
    });
    return rows.length ? rows.join("") : '<div class="empty">Nahi mila. Neeche "Apna saman likho" se jodo.</div>';
  }
  function composeChips(e) {
    var n = Object.keys(cart()).length;
    return '<button class="chip" data-act="ccat" data-v="__sel" aria-pressed="' + (e.cur === "__sel") + '">✓ Chuna hua (' + n + ")</button>" +
      (e.cats || []).map(function (c) { return '<button class="chip" data-act="ccat" data-v="' + esc(c.key) + '" aria-pressed="' + (e.cur === c.key && !e.q) + '">' + esc(c.label) + "</button>"; }).join("");
  }
  function composeBar() {
    var n = Object.keys(cart()).length;
    return n ? '<span><b>' + n + "</b> saman chune</span><button class=\"btn\" data-act=\"toreview\">Order dekho →</button>" : "<span class=\"muted\">Saman tick karke list banao</span>";
  }
  function composeRefresh(e) {
    var a = $("#clist"), b = $("#cchips"), c = $("#cbar");
    if (a) a.innerHTML = composeItems(e); if (b) b.innerHTML = composeChips(e); if (c) c.innerHTML = composeBar();
    saveDraft();
  }
  V.compose = {
    html: function (e) {
      if (!e.shop) return LOADING;
      return '<section><div class="pad"><h2>' + esc(e.shop.name) + '</h2><p class="muted sm">Sirf saman aur matra chuno. Rate dukaandaar bill mein bhejega.</p>' +
        '<div class="search"><input data-in="csearch" placeholder="Saman dhoondho (aata, doodh, tamatar…)" value="' + esc(e.q || "") + '"></div></div>' +
        '<div class="chips wrapx" id="cchips">' + composeChips(e) + '</div><div class="pad" id="clist">' + composeItems(e) + "</div>" +
        '<div class="pad custom"><b>Catalog mein nahi mila?</b><div class="row2"><input id="cust" placeholder="Apna saman likho"><button class="btn sm" data-act="cadd">Jodo</button></div></div><div class="cbspace"></div><div class="cartbar" id="cbar">' + composeBar() + "</div></section>";
    },
    init: function (e) {
      if (S.cartShop !== e.params.id) { var dr = LK.drafts()[e.params.id]; S.cart = dr ? dr.items : {}; S.cartShop = e.params.id; S.cartName = dr ? dr.name : ""; }
      return Promise.all([S.api.shop(e.params.id), S.api.catalog()]).then(function (r) {
        e.shop = r[0]; S.cartName = r[0].name || S.cartName; saveDraft(); e.cat = (r[1] || []).filter(function (c) { return (r[0].types || []).indexOf(c.shop_type) > -1; });
        var seen = {}, cats = [];
        e.cat.forEach(function (c) { var k = c.shop_type + "|" + c.category; if (!seen[k]) { seen[k] = 1; cats.push({ key: k, label: c.category }); } });
        e.cats = cats; e.cur = Object.keys(S.cart).length ? "__sel" : (cats[0] && cats[0].key); LK.redraw(e);
      }).catch(LK.fail);
    }
  };
  LK.inp.csearch = function (el) { var e = LK.top(); e.q = el.value; composeRefresh(e); };
  LK.act.ccat = function (el) { var e = LK.top(); e.cur = el.dataset.v; e.q = ""; var s = $(".search input"); if (s) s.value = ""; composeRefresh(e); window.scrollTo(0, 0); };
  LK.act.tick = function (el) {
    var e = LK.top(), k = el.dataset.k, ct = cart();
    if (ct[k]) delete ct[k];
    else {
      var cat = (e.cat || []).filter(function (c) { return "c" + c.id === k; })[0]; if (!cat) return;
      var kind = cat.unit_kind, dq = LK.DEFQ[kind] || [1, "kg"];
      ct[k] = { key: k, name: cat.name, catalog_id: cat.id, kind: kind, qty: dq[0], unit: dq[1] };
    }
    composeRefresh(e);
  };
  LK.act.qpre = function (el) { var c = cart()[el.dataset.k]; if (!c) return; c.qty = +el.dataset.q; c.unit = el.dataset.u; composeRefresh(LK.top()); };
  LK.act.qstep = function (el) {
    var c = cart()[el.dataset.k]; if (!c) return; var st = STEP[c.unit] || 1;
    c.qty = Math.round((+c.qty + (+el.dataset.d) * st) * 1000) / 1000; if (c.qty <= 0) c.qty = st; composeRefresh(LK.top());
  };
  LK.inp.qv = function (el) { var c = cart()[el.dataset.k]; if (c) { c.qty = parseFloat(String(el.value).replace(",", ".")) || 0; saveDraft(); } };
  LK.inp.qu = function (el) { var c = cart()[el.dataset.k]; if (c) { c.unit = el.value; composeRefresh(LK.top()); } };
  LK.act.cadd = function () {
    var i = $("#cust"), n = (i.value || "").trim(); if (!n) return LK.toast("Saman ka naam likho.", "bad");
    var k = "x" + Date.now(); cart()[k] = { key: k, name: n.slice(0, 80), catalog_id: null, kind: "any", qty: 1, unit: "kg", custom: true };
    i.value = ""; var e = LK.top(); e.cur = "__sel"; e.q = ""; composeRefresh(e); LK.toast("Jud gaya ✓ — matra chuno");
  };
  LK.act.toreview = function () {
    var ct = cart(), bad = Object.keys(ct).filter(function (k) { return !(+ct[k].qty > 0); });
    if (bad.length) return LK.toast("\"" + ct[bad[0]].name + "\" ki matra likho.", "bad");
    LK.go("review", { id: LK.top().params.id, name: LK.top().shop.name });
  };

  V.review = {
    html: function (e) {
      var ct = cart(), ks = Object.keys(ct);
      if (!e.fi) { LK.form = { note: "" }; e.fi = true; }
      if (!ks.length) return '<section class="pad"><div class="empty">List khaali hai.</div><button class="btn" data-act="back">← Saman chuno</button></section>';
      return '<section class="pad"><h2>Aapki list</h2><p class="muted">' + esc(e.params.name || "") + " ko bhejni hai. Rate dukaandaar bill mein bharega, aap confirm karoge tab order pakka hoga.</p>" +
        '<div class="card pl">' + ks.map(function (k) { return '<div class="rl"><span>' + esc(ct[k].name) + "</span><b>" + LK.qty(ct[k].qty, ct[k].unit) + '</b><button class="x" data-act="rmcart" data-k="' + k + '" aria-label="Hatao">✕</button></div>'; }).join("") + "</div>" +
        '<label class="fld"><span>Dukaandaar ke liye note (optional)</span><textarea data-in="f" data-k="note" rows="2" maxlength="300" placeholder="Jaise: aata chakki wala dena"></textarea></label>' +
        feePre() +
        '<button class="btn big" data-act="placeorder"' + (cfee() > 0 && !LK.form.feepaid ? " disabled" : "") + '>✅ Dukaan ko bhejo</button><button class="btn ghost" data-act="back">← Aur saman jodo</button></section>';
    }
  };
  /* Platform fee, asked BEFORE the list reaches the shop (only when the admin has set a fee > 0). */
  function feePre() {
    var fee = cfee(), up = (LK.S.fees || {}).admin_upi; if (fee <= 0 || !up) return "";
    return '<div class="card pay"><h3>Pehle platform fee ' + LK.money(fee) + ' (LoKalLo ko)</h3><p class="muted sm">Galat/jhoothe order rokne ke liye. Fee dukaan ko nahi, LoKalLo ko jati hai. Pay karne ke baad hi list dukaandaar ko pahunchegi.</p>' + appBtns(LK.feeLink(up, fee)) +
      '<div class="kv"><div><span>UPI ID</span><b>' + esc(up) + '</b></div></div><button class="btn ghost sm" data-act="copyupi" data-v="' + esc(up) + '">📋 UPI ID copy karo</button>' + LK.manualPay(up, fee) +
      '<label class="chk"><input type="checkbox" data-act="feepaidtick"' + (LK.form.feepaid ? " checked" : "") + '> Maine ' + LK.money(fee) + ' fee pay kar di</label></div>';
  }
  LK.act.feepaidtick = function (el) { LK.form.feepaid = !!el.checked; LK.redraw(LK.top()); };
  LK.act.rmcart = function (el) { delete cart()[el.dataset.k]; saveDraft(); LK.redraw(LK.top()); };
  LK.act.placeorder = function (el) {
    var ct = cart(), e = LK.top();
    if (cfee() > 0 && !LK.form.feepaid) return LK.toast("Pehle platform fee pay karke tick karo.", "bad");
    var items = Object.keys(ct).map(function (k) { return { name: ct[k].name, catalog_id: ct[k].catalog_id, qty: +ct[k].qty, qty_unit: ct[k].unit }; });
    return LK.busy(el, function () { return S.api.placeOrder(e.params.id, items, LK.form.note || "", cfee() > 0 && !!LK.form.feepaid); }).then(function (id) {
      LK.dropDraft(e.params.id); S.cart = {}; S.cartShop = null; LK.toast("Order bhej diya ✓ Dukaandaar bill banayega.");
      LK.root("orders"); LK.go("order", { id: id });
    });
  };

  /* ================= my orders ================= */
  V.orders = {
    tab: "orders",
    html: function (e) {
      var d = e.data; if (!d) return LOADING;
      if (!d.length) return '<section class="pad"><h2>Mere orders</h2><div class="empty">Abhi koi order nahi.<br><button class="btn sm" data-act="tab" data-v="home">Dukaanein dekho</button></div></section>';
      return '<section class="pad"><h2>Mere orders</h2><div class="list">' + d.map(function (o) {
        var s = o.lk_shops || {};
        return '<button class="card ord' + (o.status === "bill_sent" ? " hot" : "") + '" data-act="openorder" data-id="' + o.id + '"><div class="row"><b>' + esc(s.name || "Dukaan") + "</b>" + LK.badge(o.status) + '</div><div class="meta">#' + esc(o.code) + " · " + LK.ago(o.created_at) + (o.subtotal > 0 ? " · <b>" + LK.money(o.total || o.subtotal) + "</b>" : "") + "</div>" +
          (o.status === "bill_sent" ? '<div class="cta">Bill dekho aur confirm karo →</div>' : "") + "</button>";
      }).join("") + "</div></section>";
    },
    init: function (e, quiet) {
      if (quiet && activeInput()) return;
      return S.api.myOrders().then(function (r) { e.data = r || []; LK.redraw(e); }).catch(function (x) { if (!quiet) LK.fail(x); });
    }
  };
  LK.act.openorder = function (el) { LK.go("order", { id: el.dataset.id }); };

  /* ================= one order (customer) ================= */
  var EVT = { placed: "Order bheja", bill_sent: "Dukaan ne bill bheja", bill_updated: "Bill update hua", comment: "Aapne rate par comment kiya", confirmed: "Aapne confirm kiya", ready: "Pickup ke liye ready", out_for_delivery: "Delivery pe nikla", completed: "Order poora hua", customer_paid: "Aapne UPI se pay kiya", refunded: "Refund note hua", cancelled: "Aapne cancel kiya", rejected: "Dukaan ne order mana kiya", returned: "Saman return hua", dboy_assigned: "Delivery boy tay hua", dboy_unassigned: "Delivery boy badla ja raha hai" };
  function cfee() { return LK.freeLeft() ? 0 : (+((LK.S.fees || {}).customer_fee) || 0); }
  function feeLine() { return LK.freeBanner("Naye user") + (cfee() > 0 ? '<div class="bl"><span>Platform fee (alag UPI se, aap LoKalLo ko do)</span><b>' + LK.money(cfee()) + "</b></div>" : ""); }
  function shopAmt(o) { return (+o.total || 0) - (+o.customer_fee || 0); }
  function upiLink(sh, o) { return "upi://pay?pa=" + encodeURIComponent(sh.upi_id).replace(/%40/g, "@") + "&pn=" + encodeURIComponent(String(sh.name || "Shop").replace(/[^A-Za-z0-9 ]/g, "").trim() || "Shop") + "&mc=0000&tr=LK" + o.code + "&am=" + (Math.round(shopAmt(o) * 100) / 100).toFixed(2) + "&cu=INR&tn=" + encodeURIComponent("LoKalLo order " + o.code); }
  function itemLines(e) {
    var d = e.data, o = d.o, billed = o.status !== "placed" && o.status !== "cancelled" && o.bill_version > 0;
    return d.items.map(function (it) {
      var cm = "";
      if (it.customer_comment) cm += '<div class="cm me">Aap: ' + esc(it.customer_comment) + "</div>";
      if (it.shop_reply) cm += '<div class="cm shop">Dukaan: ' + esc(it.shop_reply) + "</div>";
      if (it.removed) return '<div class="bl gone"><span>' + esc(it.name) + " <small>" + LK.qty(it.qty, it.qty_unit) + "</small></span><b>Nahi hai</b></div>" + cm;
      var right = billed && it.amount != null ? "<b>" + LK.money(it.amount) + "</b>" : '<b class="muted">—</b>';
      var sub = billed && it.rate != null ? "<small>" + LK.rate(it.rate, it.rate_unit) + "</small>" : "";
      var cbtn = o.status === "bill_sent" ? '<button class="cmb" data-act="cmopen" data-id="' + it.id + '" aria-label="Rate par comment">💬</button>' : "";
      return '<div class="bl"><span>' + esc(it.name) + " <small>" + LK.qty(it.qty, it.qty_unit) + "</small>" + sub + "</span>" + right + cbtn + "</div>" + cm +
        (o.status === "bill_sent" ? '<div class="cmbox" id="cm-' + it.id + '" hidden><textarea id="cmt-' + it.id + '" rows="2" maxlength="200" placeholder="Jaise: pichli baar ₹55 tha"></textarea><button class="btn sm" data-act="cmsend" data-id="' + it.id + '">Dukaan ko bhejo</button></div>' : "");
    }).join("");
  }
  function confirmBox(e) {
    var o = e.data.o, sh = e.data.shop || {}, f = LK.form;
    function opt(k, v, t, d, on) { return '<button type="button" class="opt" data-act="fset" data-k="' + k + '" data-v="' + v + '" aria-pressed="' + (f[k] === v) + '"><b>' + t + "</b><small>" + d + "</small></button>"; }
    return '<div class="card cf"><h3>Order confirm karo</h3><p class="muted sm">Apni zaroorat ke hisaab se chuno — dono mein se jo chahiye.</p><div class="opts">' +
      (o.delivery_ok ? opt("ful", "delivery", "🚚 Ghar tak delivery", o.delivery_charge ? "+ " + LK.money(o.delivery_charge) : "Free") : "") +
      (o.pickup_ok ? opt("ful", "pickup", "🚶 Dukaan se pickup", "Free") : "") + "</div>" +
      '<label class="fld" id="addrbox"><span>Delivery ka pata *</span><textarea data-in="f" data-k="addr" rows="2">' + esc(f.addr || "") + "</textarea><button type=\"button\" class=\"gpsbtn\" data-act=\"dgps\">📍 Delivery location GPS se lo</button><span class=\"muted sm\" id=\"dloc\">" + (f.dlat != null ? "✓ Abhi ki location li gayi" : "Bina GPS ke aapke profile ki location use hogi.") + "</span></label>" +
      '<div class="opts">' + opt("pay", "cod", "💵 Cash", "Delivery / pickup par") + (sh.upi_id ? opt("pay", "upi", "📲 UPI se pay", "Seedha dukaan ko") : "") + "</div>" +
      feeLine() + '<div class="tot"><span>Dukaan ko dena</span><b id="paytotal"></b></div>' +
      '<button class="btn big" data-act="confirmorder">✅ Confirm karo</button>' +
      '<p class="hint">Confirm ke baad order cancel nahi hota. Rate galat lage to pehle 💬 se comment karo, ya dukaandaar se baat karke refund lo.</p></div>';
  }
  function appBtns(link) {
    var apps = [["", "📲 UPI app kholo (sab apps)"], ["com.phonepe.app", "PhonePe"], ["com.google.android.apps.nbu.paisa.user", "GPay"], ["net.one97.paytm", "Paytm"], ["in.org.npci.upiapp", "BHIM"]];
    return '<a class="btn big" data-act="upipay" data-pkg="" data-url="' + esc(link) + '" href="' + esc(link) + '">' + apps[0][1] + '</a><div class="upis">' + apps.slice(1).map(function (a) { return '<button type="button" class="btn ghost sm" data-act="upipay" data-pkg="' + a[0] + '" data-url="' + esc(link) + '">' + a[1] + "</button>"; }).join("") + "</div>";
  }
  LK.appBtns = appBtns;
  /* Simple P2P-style link (no merchant code / ref / note): personal UPI IDs get declined by PhonePe/GPay when those are present. */
  LK.feeLink = function (up, amt) { return "upi://pay?pa=" + encodeURIComponent(up).replace(/%40/g, "@") + "&pn=LoKalLo&am=" + (+amt).toFixed(2) + "&cu=INR"; };
  LK.manualPay = function (up, amt) {
    return '<div class="card"><b>Payment decline ho to (manual tareeka):</b><p class="muted sm">Apne UPI app mein "UPI ID / number se pay karo" chuno, ye ID daalo aur ' + LK.money(amt) + ' bhejo.</p><div class="row2"><button class="btn ghost sm" data-act="copyupi" data-v="' + esc(up) + '">📋 UPI ID copy</button><button class="btn ghost sm" data-act="copyupi" data-v="' + (+amt).toFixed(0) + '">📋 Raqam copy</button></div>' + (LK.qrSvg ? '<div class="qr">' + LK.qrSvg(LK.feeLink(up, amt)) + '</div><p class="muted sm">Ya dusre phone se ye QR scan karo</p>' : "") + "</div>";
  };
  function feeCard(e) {
    var o = e.data.o, fee = +o.customer_fee || 0, wu = +o.wallet_used || 0, due = Math.max(0, fee - wu);
    if (fee <= 0) return LK.freeLeft() ? '<div class="card ok-c">🎉 Is order par platform fee FREE hai.</div>' : "";
    if (wu > 0 && due <= 0) return '<div class="card ok-c">🎁 Platform fee ' + LK.money(fee) + " aapke wallet se kat gayi. Kuch dena nahi.</div>";
    if (o.fee_paid) return '<div class="card ok-c">✓ Platform fee ' + LK.money(due) + " pay ho gayi. Shukriya!</div>";
    var up = (LK.S.fees || {}).admin_upi; if (!up) return "";
    var link = LK.feeLink(up, due);
    return '<div class="card pay"><h3>Platform fee ' + LK.money(due) + ' (LoKalLo ko)</h3>' + (wu > 0 ? '<p class="muted sm">Wallet se ' + LK.money(wu) + " kat chuka hai.</p>" : "") + '<p class="muted sm">Ye fee dukaan ko nahi, LoKalLo ko alag UPI se deni hai.</p>' + appBtns(link) +
      '<div class="kv"><div><span>UPI ID</span><b>' + esc(up) + '</b></div></div><button class="btn ghost sm" data-act="copyupi" data-v="' + esc(up) + '">📋 UPI ID copy karo</button>' + LK.manualPay(up, due) + '<button class="btn ghost" data-act="markfee">Maine fee pay kar di</button></div>';
  }
  LK.act.markfee = function (el) { var e = LK.top(); return LK.busy(el, function () { return S.api.markFeePaid(e.params.id); }).then(function () { LK.toast("Shukriya ✓"); e.sig = ""; return V.order.init(e); }); };
  function afterConfirm(e) {
    var o = e.data.o, sh = e.data.shop || {}, s = o.lk_shops || {}, h = "";
    h += '<div class="card"><div class="kv"><div><span>Tarika</span><b>' + (o.fulfilment === "delivery" ? "🚚 Ghar tak delivery" : "🚶 Dukaan se pickup") + "</b></div>" + (o.fulfilment === "delivery" ? "<div><span>Pata</span><b>" + esc(o.address) + "</b></div>" : "") +
      "<div><span>Payment</span><b>" + (o.payment_mode === "upi" ? "UPI" : "Cash") + "</b></div>" + (o.delivered_by ? "<div><span>Delivery</span><b>" + esc(o.delivered_by) + "</b></div>" : "") + "</div></div>";
    if (LK.dboyCard) h += LK.dboyCard(e.data.dboy, o);
    if (o.payment_mode === "upi" && sh.upi_id) {
      if (o.customer_paid) h += '<div class="card ok-c">✓ Aapne UPI se pay kar diya. Dukaandaar ko dikh raha hai.</div>';
      else {
        var link = upiLink(sh, o), qr = LK.qrSvg(link);
        h += '<div class="card pay"><h3>UPI se ' + LK.money(shopAmt(o)) + " pay karo</h3><a class=\"btn big\" data-act=\"upipay\" data-pkg=\"\" data-url=\"" + esc(link) + '" href="' + esc(link) + '">📲 UPI app kholo (sab apps)</a><div class="upis"><button type="button" class="btn ghost sm" data-act="upipay" data-pkg="com.phonepe.app" data-url="' + esc(link) + '">PhonePe</button><button type="button" class="btn ghost sm" data-act="upipay" data-pkg="com.google.android.apps.nbu.paisa.user" data-url="' + esc(link) + '">GPay</button><button type="button" class="btn ghost sm" data-act="upipay" data-pkg="net.one97.paytm" data-url="' + esc(link) + '">Paytm</button><button type="button" class="btn ghost sm" data-act="upipay" data-pkg="in.org.npci.upiapp" data-url="' + esc(link) + '">BHIM</button></div><div class="kv"><div><span>UPI ID</span><b>' + esc(sh.upi_id) + '</b></div><div><span>Raqam</span><b>' + LK.money(shopAmt(o)) + '</b></div></div><button class="btn ghost sm" data-act="copyupi" data-v="' + esc(sh.upi_id) + '">📋 UPI ID copy karo</button>' + (qr ? '<div class="qr">' + qr + "</div><p class=\"muted sm\">Ya dusre phone se ye QR scan karo</p>" : "") +
          '<p class="sm">UPI ID: <b>' + esc(sh.upi_id) + '</b></p><button class="btn ghost" data-act="markpaid">Maine pay kar diya</button></div>';
      }
    }
    if (o.refund_amount > 0) h += '<div class="card warn-c">Refund: <b>' + LK.money(o.refund_amount) + "</b> " + esc(o.refund_note || "") + "</div>";
    h += '<div class="btns3"><a class="btn ghost sm" href="' + LK.tel(s.phone || sh.phone || "") + '">📞 Dukaan ko call</a><a class="btn ghost sm" href="' + LK.wa(s.phone || sh.phone || "", "Order #" + o.code + " ke baare mein") + '">💬 WhatsApp</a></div>';
    return h;
  }
  function orderTot() {
    var e = LK.top(); if (!e || e.name !== "order" || !e.data) return; var o = e.data.o, f = LK.form;
    var t = $("#paytotal"); if (t) t.textContent = LK.money(+o.subtotal + (f.ful === "delivery" ? +o.delivery_charge : 0));
    var a = $("#addrbox"); if (a) a.hidden = f.ful !== "delivery";
  }
  V.order = {
    tab: "orders",
    html: function (e) {
      var d = e.data; if (!d) return LOADING; var o = d.o, s = o.lk_shops || {}, billed = o.bill_version > 0 && o.status !== "cancelled";
      var h = '<section class="pad"><div class="row"><h2>' + esc(s.name || "Order") + "</h2>" + LK.badge(o.status) + '</div><p class="muted">Order #' + esc(o.code) + " · " + LK.ago(o.created_at) + "</p>";
      if (o.status === "placed") h += '<div class="card info">⏳ Dukaandaar aapki list dekh kar bill bana raha hai. Bill aate hi yahan dikhega.</div>';
      if (o.status === "rejected" || o.status === "cancelled") h += '<div class="card warn-c">' + (o.status === "rejected" ? "Dukaandaar ne ye order nahi liya." : "Aapne ye order cancel kiya.") + (o.cancel_reason ? " " + esc(o.cancel_reason) : "") + "</div>";
      h += '<div class="card bill"><h3>' + (billed ? "Bill" : "Aapki list") + "</h3>" + itemLines(e) + "</div>";
      if (o.note) h += '<p class="muted sm">Aapka note: ' + esc(o.note) + "</p>";
      if (billed && o.status === "bill_sent") {
        h += '<div class="tot"><span>Saman ka total</span><b>' + LK.money(o.subtotal) + "</b></div>" + (o.bill_note ? '<p class="cm shop">Dukaan: ' + esc(o.bill_note) + "</p>" : "") + confirmBox(e);
      } else if (billed && ["confirmed", "ready", "out_for_delivery", "completed"].indexOf(o.status) > -1) {
        h += '<div class="tot"><span>Dukaan ko dena</span><b>' + LK.money(shopAmt(o)) + "</b></div>" + feeCard(e) + afterConfirm(e);
      }
      if (o.status === "placed" || o.status === "bill_sent") h += '<button class="btn ghost danger-t" data-act="cancelorder">Order cancel karo</button>';
      if (["completed", "cancelled", "rejected"].indexOf(o.status) > -1) h += '<button class="btn ghost" data-act="reorder">🔁 Yehi saman dobara mangao</button>';
      h += '<h3>Order ka safar</h3><div class="tl">' + d.events.map(function (ev) { return "<div><i></i><span>" + (EVT[ev.event] || ev.event) + "</span><small>" + LK.ago(ev.at) + "</small></div>"; }).join("") + "</div></section>";
      return h;
    },
    init: function (e, quiet) {
      if (quiet && activeInput()) return;
      return S.api.order(e.params.id).then(function (r) {
        var o = r.o, need = o.status !== "placed" && o.status !== "cancelled" && o.status !== "rejected";
        return (need && LK.dboyOn && LK.dboyOn() && o.dboy_id ? S.api.orderDboy(o.id).catch(function () { return null; }) : Promise.resolve(null)).then(function (db) {
        var sig = [o.status, o.bill_version, o.has_comment, o.customer_paid, r.events.length, o.dboy_id, db ? db.at + "|" + db.lat : ""].join("|");
        if (e.data && e.sig === sig) return;
        return (need ? S.api.shop(o.shop_id).catch(function () { return null; }) : Promise.resolve(null)).then(function (sh) {
          e.sig = sig; e.data = { o: o, items: r.items || [], events: r.events || [], shop: sh, dboy: db };
          var fk = o.id + ":" + o.bill_version + ":" + o.status;
          if (e.fk !== fk) {
            e.fk = fk;
            LK.form = { ful: (o.delivery_ok && o.pickup_ok) ? "" : (o.delivery_ok ? "delivery" : "pickup"), pay: (sh && sh.upi_id) ? "" : "cod", addr: o.address || (S.profile && S.profile.address) || "" };
          }
          LK.onForm = orderTot; LK.redraw(e); orderTot();
        });
        });
      }).catch(function (x) { if (!quiet) LK.fail(x); });
    },
    after: function () { LK.onForm = orderTot; orderTot(); }
  };
  LK.act.cmopen = function (el) { var b = $("#cm-" + el.dataset.id); if (b) { b.hidden = !b.hidden; if (!b.hidden) $("#cmt-" + el.dataset.id).focus(); } };
  LK.act.cmsend = function (el) {
    var id = el.dataset.id, t = ($("#cmt-" + id).value || "").trim(); if (!t) return LK.toast("Comment likho.", "bad");
    return LK.busy(el, function () { return S.api.comment(id, t); }).then(function () { LK.toast("Dukaandaar ko bhej diya ✓"); V.order.init(LK.top()); });
  };
  LK.act.confirmorder = function (el) {
    var e = LK.top(), f = LK.form;
    if (!f.ful) return LK.toast("Pehle chuno: Ghar tak delivery ya Dukaan se pickup.", "bad");
    if (!f.pay) return LK.toast("Pehle chuno: Cash ya UPI se pay.", "bad");
    if (f.ful === "delivery" && String(f.addr || "").trim().length < 5) return LK.toast("Delivery ka pata likho.", "bad");
    return LK.busy(el, function () {
      var pre = (f.ful === "delivery" && f.dlat == null) ? LK.gps().then(function (g) { f.dlat = g.lat; f.dlng = g.lng; }, function () {}) : Promise.resolve();
      return pre.then(function () { return S.api.confirm(e.params.id, f.ful, f.ful === "delivery" ? f.addr.trim() : null, f.pay); }).then(function () {
        var p = S.profile || {}, la = f.dlat != null ? f.dlat : p.lat, ln = f.dlat != null ? f.dlng : p.lng;
        if (f.ful === "delivery" && la != null) return S.api.setPoint(e.params.id, +la, +ln).catch(function () {});
      });
    }).then(function () { LK.toast(f.ful === "delivery" ? "Order confirm ho gaya ✓ Delivery location dukaandaar ko bhej di" : "Order confirm ho gaya ✓"); e.sig = ""; return V.order.init(e); });
  };
  LK.act.dgps = function (el) {
    var old = el.innerHTML; el.disabled = true; el.innerHTML = "📍 Location dhoondh raha hoon…";
    return LK.gps().then(function (p) { LK.form.dlat = p.lat; LK.form.dlng = p.lng; var d = $("#dloc"); if (d) d.textContent = "✓ Abhi ki location li gayi"; }, function (x) { LK.toast(LK.gpsMsg(x), "bad"); }).then(function () { el.disabled = false; el.innerHTML = old; });
  };
  LK.act.upipay = function (el, ev) {
    var pkg = el.dataset.pkg || "";
    if (!window.LkNative || !LkNative.openUpi) { window.location.href = el.dataset.url; return; }
    var r = pkg ? LkNative.openUpi(el.dataset.url, pkg) : LkNative.openUpi(el.dataset.url);
    if (r === "ok") return;
    if (r === "none") LK.toast(pkg ? "Ye app phone mein nahi hai. Doosra chuno ya UPI ID copy karo." : "Phone mein koi UPI app nahi mila. UPI ID copy karke pay karo.", "bad");
    else LK.toast("UPI app nahi khul paya (" + String(r).slice(0, 60) + "). UPI ID copy karke pay karo.", "bad");
  };
  LK.act.copyupi = function (el) {
    var v = el.dataset.v, done = function () { LK.toast("Copy ho gaya ✓"); };
    if (window.LkNative && LkNative.copyText && LkNative.copyText(v)) return done();
    if (navigator.clipboard) navigator.clipboard.writeText(v).then(done, function () { LK.toast(v); }); else LK.toast(v);
  };
  LK.act.markpaid = function (el) { var e = LK.top(); return LK.busy(el, function () { return S.api.markPaid(e.params.id); }).then(function () { LK.toast("Dukaandaar ko bata diya ✓"); e.sig = ""; return V.order.init(e); }); };
  LK.act.cancelorder = function () {
    var e = LK.top();
    return LK.ask("Ye order cancel karna hai?", "Haan, cancel", true).then(function (ok) { if (!ok) return; return S.api.cancel(e.params.id, "").then(function () { LK.toast("Order cancel ho gaya"); e.sig = ""; return V.order.init(e); }); });
  };
  LK.act.reorder = function () {
    var e = LK.top(), d = e.data;
    var items = d.items.map(function (i) { return { name: i.name, catalog_id: i.catalog_id, qty: +i.qty, qty_unit: i.qty_unit }; });
    return LK.ask("Yehi saman " + ((d.o.lk_shops || {}).name || "dukaan") + " ko dobara bhejna hai?", "Haan, bhejo").then(function (ok) {
      if (!ok) return;
      return S.api.placeOrder(d.o.shop_id, items, "").then(function (id) { LK.toast("Naya order bhej diya ✓"); LK.root("orders"); LK.go("order", { id: id }); });
    });
  };

  /* ================= profile ================= */
  V.me = {
    tab: "me",
    html: function () {
      var p = S.profile || {};
      var av = p.avatar_path ? '<img src="' + esc(LK.img(p.avatar_path)) + '" alt="">' : "<span>" + esc((p.full_name || "?").trim().charAt(0).toUpperCase()) + "</span>";
      return '<section class="pad"><h2>Mera profile</h2><div class="avwrap"><button type="button" class="avatar" data-act="addavatar" aria-label="Profile photo badlo">' + av + '</button><div><b>' + esc(p.full_name || "") + '</b><button type="button" class="btn ghost sm" data-act="addavatar">📷 Profile photo badlo</button></div></div>' +
        '<input type="file" id="av-in" accept="image/*" hidden data-in="avfile"><div class="card kv"><div><span>Naam</span><b>' + esc(p.full_name || "") + "</b></div><div><span>Mobile</span><b>" + esc(p.phone || "") + "</b></div><div><span>Umar / Ling</span><b>" + esc(p.age || "") + " · " + ({ male: "Purush", female: "Mahila", other: "Anya" }[p.sex] || "") + "</b></div><div><span>Pata</span><b>" + esc(p.address || "") + "</b></div></div>" +
        '<button class="btn ghost" data-act="meloc">📍 Meri location GPS se update karo</button><button class="btn ghost" data-act="editprofile">✏️ Jaankari badlo</button>' +
        (S.shop && !S.admin ? (S.shop.status === "pending" ? '<div class="card hot"><b>⏳ Dukaan approval baaki hai</b><p class="muted sm">' + esc(S.shop.name) + ' approve hone ke baad list ho jayegi — 24 ghante ke andar.</p></div>' : S.shop.status === "active" ? '<div class="card ok-c"><b>✓ Dukaan approved</b><p class="muted sm">' + esc(S.shop.name) + ' customers ko dikh rahi hai.</p></div>' : "") : "") +
        (S.shop ? '<button class="btn" data-act="tomode" data-v="shop">🏪 Dukaandaar mode</button>' : '<button class="btn" data-act="regshop">🏪 Apni dukaan register karo</button>') +
        (LK.isBoy && LK.isBoy() ? '<button class="btn" data-act="tomode" data-v="dboy">🚚 Delivery mode</button>' : "") + (LK.isSup && LK.isSup() ? '<button class="btn" data-act="tomode" data-v="supp">📦 Supplier mode</button>' : "") +
        (S.shop ? '<button class="btn" data-act="billing">💎 Prime membership aur billing</button>' : "") + (window.LK_SINGLE && S.shop ? '<button class="btn" data-act="brand">🎨 Theme color, logo aur naam customize karo</button>' : "") + (S.admin ? '<button class="btn ghost" data-act="admin">🛡️ Admin panel</button>' : "") + '<button class="btn" data-act="wallet">🎁 Refer & Earn / Wallet</button><button class="btn" data-act="ldmine">🎟️ Mere Lucky Draw coupon</button><button class="btn ghost" data-act="shareapp">📤 LoKalLo app share karo</button><button class="btn ghost danger-t" data-act="logout">Logout</button>' + LK.devContact() + '</section>';
    }
  };
  var APK_URL = "https://toouzmbhlltipjjcyqim.supabase.co/storage/v1/object/public/lk-apk/LoKalLo.apk?download=LoKalLo.apk";
  LK.APK_URL = APK_URL;
  LK.act.shareapp = function () {
    var one = window.LK_SINGLE, msg = one ? (one.name || "Dukaan") + " – ghar baithe saman mangao 🛒\n(Install ke liye Unknown source allow karna padega)" : "LoKalLo – apni gali ki dukaan se ghar baithe saman mangao 🛒\nApp download karo:\n" + APK_URL + "\n(Install ke liye Unknown source allow karna padega)";
    var r = window.LkNative && LkNative.shareApp ? LkNative.shareApp(msg) : "none";
    if (r === "ok") return;
    if (navigator.share) { navigator.share({ title: "LoKalLo", text: msg }).catch(function () {}); return; }
    window.location.href = "https://wa.me/?text=" + encodeURIComponent(msg);
  };
  /* ================= refer & earn wallet ================= */
  V.wallet = {
    html: function (e) {
      var w = e.data; if (!w) return LOADING;
      var pct = Math.min(100, Math.round((+w.earned / +w.unlock) * 100)), left = Math.max(0, +w.unlock - +w.earned);
      var h = '<section class="pad"><h2>🎁 Refer & Earn</h2><div class="card wal"><small>Wallet balance</small><b class="big">' + LK.money(w.balance) + "</b>" +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
        (w.unlocked ? '<p class="okc sm">✓ Wallet chalu hai: ab aapki platform fee yahin se apne aap kategi.</p>' : '<p class="muted sm">' + LK.money(w.earned) + " / " + LK.money(w.unlock) + " jama. Abhi " + LK.money(left) + " aur — phir ye wallet platform fee me apne aap adjust hoga.</p>") + "</div>" +
        '<div class="card"><h3>Aapka referral code</h3><div class="refcode">' + esc(w.code) + '</div><p class="muted sm">Har dost jo is code se judkar apna pehla order poora kare, uske liye aapko ' + LK.money(w.reward) + " milenge.</p>" +
        '<button class="btn" data-act="sharecode" data-v="' + esc(w.code) + '">📤 Dost ko code bhejo</button></div>' +
        '<div class="card kv"><div><span>Dost jude</span><b>' + w.referred + "</b></div><div><span>Reward mila</span><b>" + w.rewarded + "</b></div><div><span>Intezaar me</span><b>" + Math.max(0, w.referred - w.rewarded) + "</b></div></div>" +
        "<h3>Hisaab</h3>";
      if (!(w.txns || []).length) return h + '<div class="empty">Abhi koi lenden nahi.</div></section>';
      return h + '<div class="card">' + w.txns.map(function (t) { return '<div class="ri"><b class="nm">' + esc(t.note || (t.kind === "fee" ? "Platform fee" : "Reward")) + "<small>" + LK.ago(t.created_at) + '</small></b><b class="' + (+t.amount > 0 ? "okc" : "") + '">' + (+t.amount > 0 ? "+" : "−") + LK.money(Math.abs(t.amount)) + "</b></div>"; }).join("") + "</div></section>";
    },
    init: function (e) { return S.api.wallet().then(function (w) { e.data = w; LK.redraw(e); }, LK.fail); }
  };
  LK.act.wallet = function () { LK.go("wallet"); };
  LK.act.sharecode = function (el) {
    var msg = "LoKalLo app se apni gali ki dukaan se saman mangao 🛒\nMera referral code: " + el.dataset.v + "\n(Sign up ke time ye code daalna)\nDownload: " + APK_URL;
    if (window.LkNative && LkNative.shareApp && LkNative.shareApp(msg) === "ok") return;
    if (navigator.share) { navigator.share({ title: "LoKalLo", text: msg }).catch(function () {}); return; }
    window.location.href = "https://wa.me/?text=" + encodeURIComponent(msg);
  };
  LK.act.addavatar = function () { var i = document.getElementById("av-in"); if (i) i.click(); };
  LK.inp.avfile = function (el) {
    var f = el.files && el.files[0]; el.value = ""; if (!f) return;
    LK.toast("Photo upload ho rahi hai…");
    LK.shrink(f, 600).then(function (s) { return S.api.upload(s); })
      .then(function (path) { return S.api.setAvatar(path); })
      .then(function () { return LK.loadMe(); })
      .then(function () { LK.toast("Profile photo lag gayi ✓"); LK.root("me"); }).catch(LK.fail);
  };
  LK.act.delacct = function () {
    var msg = "Account delete karne par aapka profile, dukaan, photos, ads aur login hamesha ke liye hat jayenge. Purane orders dukaandaar ke record mein bina naam-number ke rahenge. Ye wapas nahi hoga. Pakka delete karna hai?";
    return LK.ask(msg, "Haan, sab delete karo", true).then(function (ok) {
      if (!ok) return;
      return LK.ask("Aakhri baar puchh rahe hain — account delete kar dein?", "Haan, delete", true).then(function (ok2) {
        if (!ok2) return;
        try { if (window.LkNative && LkNative.clearWatch) LkNative.clearWatch(); } catch (x) {}
        return S.api.deleteAccount().then(function () {
          if (LK.stopPoll) LK.stopPoll();
          S.profile = S.shop = null; S.admin = false; S.demo = false; S.loc = null; S.cart = {}; S.cartShop = null; S.mode = "customer";
          try { localStorage.removeItem("lk-mode"); } catch (x) {}
          LK.root("login"); LK.toast("Aapka account aur data delete ho gaya ✓");
        }, LK.fail);
      });
    });
  };
  LK.act.editprofile = function () { LK.root("setup"); };
  LK.act.regshop = function () { LK.root("shopsetup", { first: true }); };
  LK.act.meloc = function (el) {
    return LK.busy(el, function () {
      return LK.gps().then(function (p) { var q = S.profile; return S.api.saveProfile({ full_name: q.full_name, phone: q.phone, age: q.age, sex: q.sex, address: q.address, lat: p.lat, lng: p.lng }).then(function () { S.loc = p; return LK.loadMe(); }); });
    }).then(function () { LK.toast("Location update ho gayi ✓"); }, function () {});
  };
})();
