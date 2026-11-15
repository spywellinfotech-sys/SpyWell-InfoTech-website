/* Super admin: find kirana stores in an area (OpenStreetMap via edge fn lk-promo-search), keep them as leads, contact by call / WhatsApp. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc;
  var ST = { new: "Naya", contacted: "Contact kiya", interested: "Interested", joined: "Join ho gaya", not_interested: "Interested nahi" };
  var F = { area: "", st: "", ph: true };
  function msg(l) {
    return "Namaste " + l.name + " ji,\nMain LoKalLo se bol raha hu. LoKalLo ek local order-booking app hai: aapke grahak ghar baithe saman ki list bhejte hain, aap bill banakar bhejte ho. Dukaan se koi commission nahi.\nApp yahan se download karein: " + (LK.APK_URL || "") + "\nZyada jaankari ke liye reply karein.";
  }
  V.promote = {
    tab: "sorders",
    html: function (e) {
      var l = (e.leads || []).filter(function (x) { return !F.ph || x.phone; });
      return '<section class="pad"><h2>📣 Promote</h2><p class="muted sm">Shehar ya area ka naam likho. Google Maps jaisi dukaan list OpenStreetMap se aati hai. Dhyan: bahut dukaanon ka phone number list mein nahi hota.</p>' +
        '<div class="row2"><input id="pr-area" data-in="pra" placeholder="Jaise: Roorkee" value="' + esc(F.area) + '"><button class="btn" data-act="prgo">🔎 Dhoondho</button></div>' +
        ((e.areas || []).length ? '<div class="chips flush wrapc">' + e.areas.map(function (a) { return '<button class="chip" data-act="prarea" data-v="' + esc(a.area) + '" aria-pressed="' + (F.area.toLowerCase() === a.area) + '">' + esc(a.area) + " (" + a.total + " · 📞" + a.with_phone + ")</button>"; }).join("") + "</div>" : "") +
        '<div class="chips flush wrapc"><button class="chip" data-act="prst" data-v="" aria-pressed="' + (F.st === "") + '">Sab</button>' + Object.keys(ST).map(function (k) { return '<button class="chip" data-act="prst" data-v="' + k + '" aria-pressed="' + (F.st === k) + '">' + ST[k] + "</button>"; }).join("") + '<button class="chip" data-act="prph" aria-pressed="' + F.ph + '">📞 Sirf phone wale</button></div>' +
        '<p class="muted sm">' + l.length + " dukaan</p>" +
        (l.map(function (x) {
          return '<div class="card"><div class="row"><b>' + esc(x.name) + '</b><span class="bd ' + (x.status === "joined" ? "ok" : x.status === "new" ? "warn" : "done") + '">' + ST[x.status] + '</span></div><div class="muted sm">' + esc(x.address || "") + (x.phone ? " · " + esc(x.phone) : " · phone nahi") + '</div><div class="btns3">' +
            (x.phone ? '<a class="btn ghost sm" href="' + LK.tel(x.phone) + '" data-act="prcall" data-id="' + x.id + '">📞 Call</a><a class="btn ghost sm" href="' + LK.wa(x.phone, msg(x)) + '" data-act="prcall" data-id="' + x.id + '">💬 WhatsApp</a>' : "") +
            (x.lat != null ? '<a class="btn ghost sm" href="https://www.google.com/maps/search/?api=1&query=' + x.lat + "," + x.lng + '">🗺️ Map</a>' : "") +
            '</div><div class="chips flush">' + ["contacted", "interested", "joined", "not_interested"].map(function (k) { return '<button class="chip" data-act="prmark" data-id="' + x.id + '" data-v="' + k + '" aria-pressed="' + (x.status === k) + '">' + ST[k] + "</button>"; }).join("") + "</div></div>";
        }).join("") || '<div class="empty">Abhi list khali hai. Upar area likhkar "Dhoondho" dabao.</div>') + "</section>";
    },
    init: function (e) { return load(e); }
  };
  function load(e) { return Promise.all([S.api.promoList(F.area, F.st), S.api.promoAreas()]).then(function (r) { e.leads = r[0] || []; e.areas = r[1] || []; LK.redraw(e); }).catch(LK.fail); }
  LK.act.promote = function () { LK.go("promote"); };
  LK.inp.pra = function (el) { F.area = el.value; };
  LK.act.prarea = function (el) { F.area = el.dataset.v; load(LK.top()); };
  LK.act.prst = function (el) { F.st = el.dataset.v; load(LK.top()); };
  LK.act.prph = function () { F.ph = !F.ph; LK.redraw(LK.top()); };
  LK.act.prgo = function (el) {
    var a = F.area.trim(); if (a.length < 2) return LK.toast("Area ka naam likho.", "bad");
    var e = LK.top();
    return LK.busy(el, function () { return S.api.promoSearch(a); }).then(function (r) { LK.toast(r.found ? r.found + " dukaan mili (" + r.with_phone + " ka phone)" : "Is area mein koi dukaan nahi mili."); return load(e); }, function (x) {
      var c = String((x && (x.message || x.code || x.m)) || x); LK.toast(/area_not_found/.test(c) ? "Ye area nahi mila, naam badal ke likho." : /area_too_big/.test(c) ? "Area bahut bada hai, chhota shehar/area likho." : /osm_busy/.test(c) ? "Map server abhi busy hai, thodi der baad try karo." : "Dhoondh nahi paye. Dobara try karo.", "bad");
    });
  };
  LK.act.prmark = function (el) { var e = LK.top(); return S.api.promoMark(el.dataset.id, el.dataset.v).then(function () { return load(e); }, LK.fail); };
  LK.act.prcall = function (el) { var id = el.dataset.id, e = LK.top(), href = el.getAttribute("href"); S.api.promoMark(id, "contacted").then(function () { (e.leads || []).forEach(function (x) { if (x.id === id && x.status === "new") x.status = "contacted"; }); }, function () {}); window.location.href = href; };
})();
