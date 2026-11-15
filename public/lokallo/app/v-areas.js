/* Village / mohalla marketplace (Phase 1). Everything here is off until lk_settings.area_enabled = 1.
   Backend: lk_areas, lk_shop_areas, lk_shops_by_area ... (supabase/migrations/0005). Old APKs ignore all of it. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc, API = window.API;
  var LV = { state: "Rajya", district: "Zila", block: "Block", village: "Gaon", mohalla: "Mohalla" };
  LK.areaOn = function () { return !!(S.fees && +S.fees.area_enabled === 1); };

  /* ---------- API (real + demo) ---------- */
  var BE = window.BE;
  if (API && API.real && BE) {
    var R = API.real;
    R.areaSearch = function (q, levels) { return BE.rpc("lk_areas_search", { p_q: q, p_levels: levels || ["village", "mohalla"] }); };
    R.areaList = function (parent, level) { return BE.rpc("lk_areas_list", { p_parent: parent || null, p_level: level || null }); };
    R.areaInfo = function (id) { return BE.rpc("lk_area_info", { p_area: id }).then(function (r) { return r && r[0] || null; }); };
    R.shopsByArea = function (area, type, lat, lng) { return BE.rpc("lk_shops_by_area", { p_area: area, p_type: type || null, p_lat: lat == null ? null : lat, p_lng: lng == null ? null : lng }); };
    R.setMyArea = function (id) { return BE.rpc("lk_set_my_area", { p_area: id || null }); };
    R.shopSetArea = function (id) { return BE.rpc("lk_shop_set_area", { p_area: id || null }); };
    R.shopSetService = function (ids) { return BE.rpc("lk_shop_set_service", { p_areas: ids || [] }); };
    R.shopMyAreas = function () { return BE.rpc("lk_shop_my_areas", {}); };
    R.adminAreaOn = function (b) { return BE.rpc("lk_admin_set_area_on", { p_on: !!b }); };
    R.adminAreaSave = function (p) { return BE.rpc("lk_admin_area_save", { p: p }); };
    R.adminAreaActive = function (id, b) { return BE.rpc("lk_admin_area_set_active", { p_id: id, p_active: !!b }); };
    R.adminAreaCounts = function () { return BE.rpc("lk_admin_area_counts", {}); };
    R.adminAreaShops = function (id) { return BE.rpc("lk_admin_area_shops", { p_area: id || null }); };
    R.adminShopSetArea = function (shop, area, svc) { return BE.rpc("lk_admin_shop_set_area", { p_shop: shop, p_area: area || null, p_service: svc || null }); };
  }
  if (API && API.demo) {
    var A = [
      { id: "st1", parent_id: null, level: "state", name: "Rajasthan", name_hi: "", active: true, kids: 1 },
      { id: "di1", parent_id: "st1", level: "district", name: "Sikar", name_hi: "", active: true, kids: 1 },
      { id: "bl1", parent_id: "di1", level: "block", name: "Danta Ramgarh", name_hi: "", active: true, kids: 2 },
      { id: "v1", parent_id: "bl1", level: "village", name: "Rampura", name_hi: "", active: true, kids: 1 },
      { id: "v2", parent_id: "bl1", level: "village", name: "Shyamgarh", name_hi: "", active: true, kids: 0 },
      { id: "m1", parent_id: "v1", level: "mohalla", name: "Bazaar", name_hi: "", active: true, kids: 0 }
    ];
    function pathOf(id) { var p = [], a; while ((a = A.filter(function (x) { return x.id === id; })[0])) { p.push(a.name); id = a.parent_id; } return p.join(", "); }
    function wd(v) { return new Promise(function (r) { setTimeout(function () { r(JSON.parse(JSON.stringify(v === undefined ? null : v))); }, 100); }); }
    var D = API.demo;
    D.areaList = function (p) { return wd(A.filter(function (a) { return (a.parent_id || null) === (p || null); })); };
    D.areaSearch = function (q) { q = String(q || "").toLowerCase(); return wd(A.filter(function (a) { return /village|mohalla/.test(a.level) && a.name.toLowerCase().indexOf(q) > -1; }).map(function (a) { return { id: a.id, level: a.level, name: a.name, name_hi: "", path: pathOf(a.id) }; })); };
    D.areaInfo = function (id) { var a = A.filter(function (x) { return x.id === id; })[0]; return wd(a ? { id: a.id, level: a.level, name: a.name, name_hi: "", path: pathOf(a.id) } : null); };
    D.shopsByArea = function (area, type, lat, lng) { return D.nearbyShops(lat || 0, lng || 0, 50, type).then(function (r) { r.forEach(function (s) { s.km = null; s.delivers = true; }); return r; }); };
    D.setMyArea = D.shopSetArea = D.shopSetService = D.adminAreaActive = D.adminShopSetArea = D.adminAreaOn = function () { return wd(); };
    D.shopMyAreas = function () { return wd({ home: null, service: [] }); };
    D.adminAreaSave = function (p) { var id = p.id || ("n" + Date.now()); if (!p.id) A.push({ id: id, parent_id: p.parent_id || null, level: p.level, name: p.name, name_hi: p.name_hi || "", active: true, kids: 0 }); return wd(id); };
    D.adminAreaCounts = function () { return wd(A.filter(function (a) { return /village|mohalla/.test(a.level); }).map(function (a) { return { id: a.id, level: a.level, path: pathOf(a.id), active: a.active, home_shops: 0, serving_shops: 0, customers: 0 }; })); };
    D.adminAreaShops = function () { return wd([]); };
  }

  /* ---------- selected area (customer), kept on the phone ---------- */
  S.area = null; S.areaMode = "area";
  try { S.area = JSON.parse(localStorage.getItem("lk-area") || "null"); S.areaMode = localStorage.getItem("lk-areamode") || "area"; } catch (x) {}
  LK.setArea = function (a) {
    S.area = a || null; S.areaMode = a ? "area" : "gps";
    try { if (a) localStorage.setItem("lk-area", JSON.stringify(a)); else localStorage.removeItem("lk-area"); localStorage.setItem("lk-areamode", S.areaMode); } catch (x) {}
    if (a && S.api && !S.demo) S.api.setMyArea(a.id).catch(function () {}); /* only the profile owner can set it; ignore if profile not saved yet */
  };
  LK.areaActive = function () { return LK.areaOn() && S.area && S.areaMode === "area"; };

  /* ---------- picker sheet: search box + browse (Rajya > Zila > Block > Gaon > Mohalla) ---------- */
  var P = null;
  function pickRow(a) {
    var ok = P.levels.indexOf(a.level) > -1, sel = P.multi && P.sel.some(function (x) { return x.id === a.id; });
    return '<button type="button" class="card ap-row" data-act="apitem" data-id="' + esc(a.id) + '" data-ok="' + (ok ? 1 : 0) + '"><div class="row"><b>' + esc(a.name_hi || a.name) + "</b>" +
      '<span class="muted sm">' + (sel ? "✓ chuna" : ok ? LV[a.level] : "Aage ▸") + "</span></div>" + (a.path ? '<div class="muted sm">' + esc(a.path) + "</div>" : "") + "</button>";
  }
  function pickBody() {
    var h = "";
    if (P.multi && P.sel.length) h += '<div class="chips wrap">' + P.sel.map(function (a) { return '<button type="button" class="chip" data-act="apdrop" data-id="' + esc(a.id) + '" aria-pressed="true">' + esc(a.name_hi || a.name) + " ✕</button>"; }).join("") + "</div>";
    if (!P.q && P.stack.length) h += '<button type="button" class="btn ghost sm" data-act="apback">◂ Peeche</button> <span class="muted sm">' + esc(P.stack.map(function (s) { return s.name; }).join(" ▸ ")) + "</span>";
    if (P.busy) return h + '<div class="empty">Ruko…</div>';
    var list = P.q ? P.res : P.list;
    h += list.length ? list.map(pickRow).join("") : '<div class="empty">' + (P.q ? "Is naam ka gaon/mohalla nahi mila." : "Yahan abhi kuch nahi hai.") + "</div>";
    return h;
  }
  function pickDraw() { if (!P) return; var b = $("#ap-body"); if (b) b.innerHTML = pickBody(); }
  function pickLoad() {
    if (!P) return; var mine = P; P.busy = true; pickDraw(); var par = P.stack.length ? P.stack[P.stack.length - 1].id : null;
    return S.api.areaList(par, null).then(function (r) { if (P !== mine) return; P.list = r || []; P.busy = false; pickDraw(); }, function (x) { if (P === mine) P.busy = false; LK.fail(x); pickDraw(); });
  }
  /* LK.areaPick({title, levels:[...], multi, sel:[{id,name,path}]}) -> Promise of one area, or an array when multi; resolves null if closed */
  LK.areaPick = function (o) {
    return new Promise(function (resolve) {
      P = { levels: o.levels || ["village", "mohalla"], multi: !!o.multi, sel: (o.sel || []).slice(), stack: [], list: [], res: [], q: "", busy: false, resolve: resolve };
      LK.sheet("<h3>" + esc(o.title || "Gaon / Mohalla chuno") + '</h3><label class="fld"><span>🔍 Naam likho</span><input data-in="apq" placeholder="Jaise: Rampura" autocomplete="off"></label><div id="ap-body"></div>' +
        '<div class="row2"><button class="btn ghost" data-act="apclose">Band karo</button>' + (P.multi ? '<button class="btn" data-act="apdone">Ho gaya</button>' : "") + "</div>");
      pickLoad();
    });
  };
  function pickEnd(v) { var r = P && P.resolve; P = null; LK.closeSheet(); if (r) r(v); }
  var qt = null;
  LK.inp.apq = function (el) {
    if (!P) return; var q = String(el.value || "").trim(); P.q = q; clearTimeout(qt);
    if (q.length < 2) { P.q = ""; pickDraw(); return; }
    var lv = P.levels; qt = setTimeout(function () { if (!P) return; S.api.areaSearch(q, lv).then(function (r) { if (P && P.q === q) { P.res = r || []; pickDraw(); } }, LK.fail); }, 250);
  };
  LK.act.apitem = function (el) {
    if (!P) return; var id = el.dataset.id, src = P.q ? P.res : P.list, a = src.filter(function (x) { return x.id === id; })[0]; if (!a) return;
    if (el.dataset.ok === "1") {
      var item = { id: a.id, level: a.level, name: a.name_hi || a.name, path: a.path || (P.stack.map(function (s) { return s.name; }).concat([a.name_hi || a.name]).join(", ")) };
      if (!P.multi) return pickEnd(item);
      var i = -1; P.sel.forEach(function (x, k) { if (x.id === id) i = k; }); if (i > -1) P.sel.splice(i, 1); else P.sel.push(item); return pickDraw();
    }
    if (P.q) return; P.stack.push({ id: a.id, name: a.name_hi || a.name }); pickLoad();
  };
  LK.act.apback = function () { if (P && P.stack.length) { P.stack.pop(); pickLoad(); } };
  LK.act.apdrop = function (el) { if (!P) return; P.sel = P.sel.filter(function (x) { return x.id !== el.dataset.id; }); pickDraw(); };
  LK.act.apdone = function () { pickEnd(P ? P.sel : []); };
  LK.act.apclose = function () { pickEnd(null); };

  /* ---------- customer: area chip on the home screen ---------- */
  LK.act.hpickarea = function () {
    LK.areaPick({ title: "Apna gaon / mohalla chuno", levels: ["village", "mohalla"] }).then(function (a) {
      if (!a) return; LK.setArea(a); var e = LK.top(); if (e && e.name === "home") { e.busy = true; LK.redraw(e); return LK.loadHome && LK.loadHome(e); }
    });
  };
  LK.act.hgpsmode = function () {
    S.areaMode = "gps"; try { localStorage.setItem("lk-areamode", "gps"); } catch (x) {}
    var e = LK.top(); if (e && e.name === "home") { e.busy = true; LK.redraw(e); return LK.loadHome && LK.loadHome(e); }
  };
  LK.act.hareamode = function () {
    if (!S.area) return LK.act.hpickarea();
    S.areaMode = "area"; try { localStorage.setItem("lk-areamode", "area"); } catch (x) {}
    var e = LK.top(); if (e && e.name === "home") { e.busy = true; LK.redraw(e); return LK.loadHome && LK.loadHome(e); }
  };
  LK.areaChip = function () {
    if (!LK.areaOn()) return "";
    var on = LK.areaActive();
    return '<div class="card areachip"><div class="row"><b>🏘️ ' + (S.area ? esc(S.area.name) : "Gaon / Mohalla chuno") + '</b><button type="button" class="btn sm" data-act="hpickarea">' + (S.area ? "Badlo" : "Chuno") + "</button></div>" +
      (S.area ? '<div class="muted sm">' + esc(S.area.path || "") + "</div>" : '<div class="muted sm">Apne gaon ki dukaanein dekhne ke liye gaon chuno.</div>') +
      '<div class="chips wrap"><button type="button" class="chip" data-act="hareamode" aria-pressed="' + on + '">🏘️ Gaon ke hisaab se</button><button type="button" class="chip" data-act="hgpsmode" aria-pressed="' + (!on) + '">📍 GPS se paas</button></div></div>';
  };

  /* ---------- shop form: own area + areas it serves ---------- */
  LK.areaForm = function () {
    if (!LK.areaOn()) return "";
    var f = LK.form, svc = f.svc || [];
    return '<div class="fld"><span>🏘️ Dukaan kis gaon / mohalle mein hai?</span><button type="button" class="btn ghost" data-act="fpickarea">' + (f.area ? esc(f.area.path || f.area.name) : "＋ Gaon / mohalla chuno") + "</button></div>" +
      '<div class="fld"><span>Kin gaon / mohalle mein saman pahunchate ho?</span><div class="chips wrap">' + svc.map(function (a) { return '<button type="button" class="chip" data-act="fsvcdrop" data-id="' + esc(a.id) + '" aria-pressed="true">' + esc(a.name) + " ✕</button>"; }).join("") +
      '<button type="button" class="chip" data-act="fpicksvc">＋ Jodo</button></div><small class="muted">Gaon chunoge to uske saare mohalle bhi aa jayenge.</small></div>';
  };
  LK.areaFormLoad = function () {
    if (!LK.areaOn() || !S.shop || LK.form.areaLoaded) return;
    LK.form.areaLoaded = true;
    S.api.shopMyAreas().then(function (r) {
      if (!r) return; LK.form.area = r.home ? { id: r.home.id, name: String(r.home.path || "").split(",")[0], path: r.home.path } : null;
      LK.form.svc = (r.service || []).map(function (a) { return { id: a.id, name: String(a.path || "").split(",")[0], path: a.path, level: a.level }; });
      var b = $("#areabox"); if (b) b.innerHTML = LK.areaForm();
    }, function () {});
  };
  function refreshBox() { var b = $("#areabox"); if (b) b.innerHTML = LK.areaForm(); }
  LK.act.fpickarea = function () { LK.areaPick({ title: "Dukaan ka gaon / mohalla", levels: ["village", "mohalla"] }).then(function (a) { if (a) { LK.form.area = a; LK.form.areaDirty = true; refreshBox(); } }); };
  LK.act.fpicksvc = function () { LK.areaPick({ title: "Kin jagah delivery karte ho", levels: ["block", "village", "mohalla"], multi: true, sel: LK.form.svc || [] }).then(function (a) { if (a) { LK.form.svc = a; LK.form.svcDirty = true; refreshBox(); } }); };
  LK.act.fsvcdrop = function (el) { LK.form.svc = (LK.form.svc || []).filter(function (x) { return x.id !== el.dataset.id; }); LK.form.svcDirty = true; refreshBox(); };
  /* called after the shop itself is saved */
  LK.areaFormSave = function () {
    if (!LK.areaOn() || !LK.form) return Promise.resolve();
    var f = LK.form, p = Promise.resolve();
    if (f.areaDirty) p = p.then(function () { return S.api.shopSetArea(f.area ? f.area.id : null); });
    if (f.svcDirty) p = p.then(function () { return S.api.shopSetService((f.svc || []).map(function (a) { return a.id; })); });
    return p.catch(function (x) { LK.toast("Dukaan save ho gayi, par gaon save nahi hua: " + ((x && x.message) || ""), "bad"); });
  };

  /* ---------- admin: इलाके page ---------- */
  var AD = { parent: null, stack: [], list: [], counts: [], noarea: [] };
  V.aareas = {
    html: function (e) {
      var d = e.data; if (!d) return '<section class="pad"><h2>🏘️ Gaon / Mohalla</h2><div class="empty">Ruko…</div></section>';
      var on = LK.areaOn(), crumb = AD.stack.length ? '<button class="btn ghost sm" data-act="aarback">◂ Peeche</button> <span class="muted sm">' + esc(AD.stack.map(function (s) { return s.name; }).join(" ▸ ")) + "</span>" : "";
      var nextLv = d.nextLevel;
      var h = '<section class="pad"><h2>🏘️ Gaon / Mohalla</h2>' +
        '<div class="card"><div class="row"><b>Customer ko gaon chunna dikhao</b><b>' + (on ? "ON ✓" : "OFF") + '</b></div><p class="muted sm">OFF hone par app bilkul pehle jaisa chalta hai (sirf GPS). Pehle gaon aur dukaanein set karo, phir ON karo.</p><button class="btn ' + (on ? "ghost" : "") + '" data-act="aaron" data-v="' + (on ? 0 : 1) + '">' + (on ? "Band karo" : "Chalu karo") + "</button></div>" +
        "<h3>Rajya ▸ Zila ▸ Block ▸ Gaon ▸ Mohalla</h3>" + crumb;
      h += d.list.length ? d.list.map(function (a) {
        return '<div class="card"><div class="row"><b>' + esc(a.name_hi || a.name) + ' <span class="bd ' + (a.active ? "ok" : "bad") + '">' + LV[a.level] + (a.active ? "" : " · band") + '</span></div>' +
          '<div class="row2">' + (a.kids || a.level !== "mohalla" ? '<button class="btn sm" data-act="aaropen" data-id="' + esc(a.id) + '">Andar dekho (' + (a.kids || 0) + ")</button>" : "") + '<button class="btn ghost sm" data-act="aaredit" data-id="' + esc(a.id) + '">Badlo</button><button class="btn ghost sm" data-act="aarsw" data-id="' + esc(a.id) + '" data-v="' + (a.active ? 0 : 1) + '">' + (a.active ? "Band" : "Chalu") + "</button></div></div>";
      }).join("") : '<div class="empty">Yahan abhi kuch nahi hai.</div>';
      h += nextLv ? '<button class="btn big" data-act="aaradd">＋ ' + LV[nextLv] + " jodo</button>" : "";
      h += "<h3>Gaon / mohalle ke hisaab se dukaanein</h3>" + (d.counts.length ? '<div class="card">' + d.counts.map(function (c) {
        return '<button type="button" class="ri" data-act="aarshops" data-id="' + esc(c.id) + '"><b class="nm">' + esc(c.path) + "<small>" + LV[c.level] + (c.active ? "" : " · band") + " · " + c.home_shops + " dukaan yahan · " + c.serving_shops + " pahunchati · " + c.customers + " customer</small></b></button>";
      }).join("") + "</div>" : '<div class="empty">Abhi koi gaon/mohalla nahi jura.</div>');
      h += '<h3>Bina gaon wali dukaanein (' + d.noarea.length + ")</h3>" + (d.noarea.length ? d.noarea.map(function (s) {
        return '<div class="card"><div class="row"><b>' + esc(s.name) + '</b><span class="muted sm">' + esc(s.phone || "") + '</span></div><button class="btn sm" data-act="aarassign" data-id="' + esc(s.id) + '">Gaon set karo</button></div>';
      }).join("") : '<div class="empty">Sab dukaanon ka gaon set hai.</div>');
      return h + "</section>";
    },
    init: function (e) {
      var par = AD.stack.length ? AD.stack[AD.stack.length - 1].id : null;
      return Promise.all([S.api.areaList(par, null), S.api.adminAreaCounts(), S.api.adminAreaShops(null)]).then(function (r) {
        var order = ["state", "district", "block", "village", "mohalla"], lv = AD.stack.length ? AD.stack[AD.stack.length - 1].level : null, nl = lv ? order[order.indexOf(lv) + 1] : "state";
        if (lv === "district") nl = "block"; /* a village can also go straight under a district; use the ＋ Gaon button below */
        e.data = { list: r[0] || [], counts: r[1] || [], noarea: r[2] || [], nextLevel: nl }; AD.list = e.data.list; LK.redraw(e);
      }, function (x) { LK.fail(x); e.data = { list: [], counts: [], noarea: [], nextLevel: "state" }; LK.redraw(e); });
    }
  };
  function redo() { var e = LK.top(); e.data = null; LK.redraw(e); return V.aareas.init(e); }
  LK.act.aareas = function () { AD.stack = []; LK.go("aareas"); };
  LK.act.aaron = function (el) { var v = +el.dataset.v; return LK.busy(el, function () { return S.api.adminAreaOn(v === 1); }).then(function () { S.fees.area_enabled = v; LK.toast(v ? "Chalu ✓" : "Band ✓"); LK.redraw(LK.top()); }, LK.fail); };
  LK.act.aaropen = function (el) { var a = AD.list.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!a) return; AD.stack.push({ id: a.id, name: a.name_hi || a.name, level: a.level }); redo(); };
  LK.act.aarback = function () { AD.stack.pop(); redo(); };
  LK.act.aarsw = function (el) { var on = el.dataset.v === "1"; return LK.ask(on ? "Ye chalu karna hai?" : "Ye band karna hai? Iske andar ki dukaanein customer ko nahi dikhengi.", on ? "Haan, chalu" : "Haan, band", !on).then(function (ok) { if (ok) return S.api.adminAreaActive(el.dataset.id, on).then(redo, LK.fail); }); };
  function areaSheet(a, level) {
    LK.sheet("<h3>" + (a ? "Badlo" : LV[level] + " jodo") + '</h3><label class="fld"><span>Naam (English) *</span><input id="ar-n" maxlength="80" value="' + esc(a ? a.name : "") + '"></label><label class="fld"><span>Naam (Hindi, optional)</span><input id="ar-h" maxlength="80" value="' + esc(a ? a.name_hi : "") + '"></label>' +
      (/village|mohalla/.test(level) ? '<label class="fld"><span>Pincode (optional)</span><input id="ar-p" inputmode="numeric" maxlength="6"></label>' : "") +
      '<div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="aarsave">Save</button></div>');
    AD.edit = { id: a ? a.id : null, level: level, parent: a ? a.parent_id : (AD.stack.length ? AD.stack[AD.stack.length - 1].id : null) };
  }
  LK.act.aaradd = function () { areaSheet(null, LK.top().data.nextLevel); };
  LK.act.aaredit = function (el) { var a = AD.list.filter(function (x) { return x.id === el.dataset.id; })[0]; if (a) areaSheet(a, a.level); };
  LK.act.aarsave = function (el) {
    var n = $("#ar-n").value.trim(); if (n.length < 2) return LK.toast("Naam likho", "bad");
    var p = { id: AD.edit.id, parent_id: AD.edit.parent, level: AD.edit.level, name: n, name_hi: $("#ar-h").value.trim(), pincode: $("#ar-p") ? $("#ar-p").value.trim() : "" };
    return LK.busy(el, function () { return S.api.adminAreaSave(p); }).then(function () { LK.closeSheet(); LK.toast("Save ✓"); return redo(); }, function (x) { LK.toast(/duplicate_area/.test((x && x.message) || "") ? "Ye naam pehle se hai" : /bad_hierarchy|bad_parent/.test((x && x.message) || "") ? "Ye level yahan nahi jur sakta" : ((x && x.message) || "Save nahi hua"), "bad"); });
  };
  LK.act.aarshops = function (el) {
    return S.api.adminAreaShops(el.dataset.id).then(function (r) {
      LK.sheet("<h3>Is jagah ki dukaanein</h3>" + ((r || []).length ? r.map(function (s) { return '<div class="card"><b>' + esc(s.name) + '</b><div class="muted sm">' + esc(s.phone || "") + " · " + esc(s.home || "—") + ((s.serves || []).length ? "<br>Pahunchati: " + esc(s.serves.join(" | ")) : "") + "</div></div>"; }).join("") : '<div class="empty">Koi dukaan nahi.</div>') + '<button class="btn ghost" data-act="mclose" data-v="0">Band karo</button>');
    }, LK.fail);
  };
  LK.act.aarassign = function (el) {
    var id = el.dataset.id; return LK.areaPick({ title: "Dukaan ka gaon / mohalla", levels: ["village", "mohalla"] }).then(function (a) { if (a) return S.api.adminShopSetArea(id, a.id, null).then(function () { LK.toast("Set ✓"); return redo(); }, LK.fail); });
  };
})();
