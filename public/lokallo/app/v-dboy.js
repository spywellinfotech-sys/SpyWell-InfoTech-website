/* Delivery boy system (Single edition first).
   - Shopkeeper: add boys by Gmail, assign an order to a boy, see cash hisaab and settle it.
   - Boy: signs in with Google (same Gmail), sees assigned orders, Nikal gaya / Deliver ho gaya, COD cash, live location is sent while out for delivery.
   - Customer: sees the boy's name, Call button and a live map while the order is out for delivery. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc;
  var LOADING = '<div class="empty">Ruko…</div>';
  function on() { return !!window.LK_SINGLE; }
  LK.dboyOn = on;

  /* ---------- who am I ---------- */
  S.dboy = [];
  LK.isBoy = function () { return on() && S.dboy && S.dboy.length > 0; };
  LK.dboyLoad = function () {
    if (!on() || !S.api) { S.dboy = []; return Promise.resolve(); }
    return S.api.dboyClaim().catch(function () {}).then(function () { return S.api.dboyMe(); }).then(function (r) { S.dboy = r || []; }, function () { S.dboy = []; });
  };

  /* ---------- order timeline labels ---------- */
  LK.EVT_DBOY = { dboy_assigned: "Delivery boy tay hua", dboy_unassigned: "Delivery boy hataya gaya" };

  /* ---- salary / per order rate ---- */
  function payTxt(b) {
    if (b.pay_type === "salary") return "💼 Salary " + LK.money(+b.pay_amount || 0) + "/mahina" + (b.work_time ? " · Samay " + b.work_time : "");
    if (b.pay_type === "order") { var c = +b.month_delivered || 0, r = +b.pay_amount || 0; return "💼 " + LK.money(r) + " per order · is mahine " + c + " delivery = " + LK.money(c * r); }
    return "";
  }
  LK.dboyPayTxt = payTxt;
  /* ================= shopkeeper: delivery boys list ================= */
  V.dboys = {
    html: function (e) {
      var d = e.data;
      var h = '<section class="pad"><div class="row"><h2>🚚 Delivery boys</h2><button class="btn sm" data-act="dbadd">➕ Naya</button></div>' +
        '<p class="muted sm">Boy ka Gmail daalo. Wo usi Gmail se app mein Google login karega, to use apne orders aur Delivered ka button dikhega.</p>';
      if (!d) return h + LOADING + "</section>";
      if (!d.length) return h + '<div class="empty">Abhi koi delivery boy nahi hai. ➕ Naya dabao.</div></section>';
      function card(b) {
        var gone = b.active === false;
        return '<div class="card"' + (gone ? ' style="opacity:.85"' : "") + '><div class="row"><b>' + esc(b.name || b.email) + "</b><span class=\"muted sm\">" + (gone ? "🚫 Kaam se hataya gaya" : (b.claimed ? "✓ Login ho chuka" : "⏳ Login baaki")) + "</span></div>" +
          '<div class="kv"><div><span>Gmail</span><b>' + esc(b.email) + "</b></div>" + (b.phone ? "<div><span>Mobile</span><b>" + esc(b.phone) + "</b></div>" : "") +
          (gone ? "" : "<div><span>Chal rahe orders</span><b>" + (+b.open || 0) + "</b></div>") + "<div><span>Delivered</span><b>" + (+b.delivered || 0) + "</b></div>" +
          "<div><span>Cash dena baaki</span><b>" + LK.money(+b.pending || 0) + '</b></div></div>' + (payTxt(b) ? '<p class="sm"><b>' + esc(payTxt(b)) + "</b></p>" : "") + '<div class="btns3"><button class="btn ghost sm" data-act="dbpay" data-id="' + b.id + '">💼 Salary / Rate</button></div><div class="btns3"><button class="btn ghost sm" data-act="dbdocs" data-id="' + b.id + '">🪪 Photo / Aadhaar' + (b.photo_path && b.aadhaar_path ? " ✓" : "") + '</button><button class="btn ghost sm" data-act="dbhis" data-id="' + b.id + '">💵 Hisaab</button>' + (gone ? "" : '<button class="btn ghost sm danger-t" data-act="dbrm" data-id="' + b.id + '">Hata do</button>') + "</div></div>";
      }
      var on_ = d.filter(function (b) { return b.active !== false; }), off = d.filter(function (b) { return b.active === false; });
      return h + (on_.length ? on_.map(card).join("") : '<div class="empty">Abhi koi chalu delivery boy nahi hai.</div>') + (off.length ? "<h3>Hataye gaye (purana hisaab)</h3>" + off.map(card).join("") : "") + "</section>";
    },
    init: function (e) { return S.api.dboyList().then(function (r) { e.data = r || []; LK.redraw(e); }).catch(LK.fail); }
  };
  LK.act.dboys = function () { LK.go("dboys"); };
  LK.act.dbadd = function () {
    LK.sheet('<h3>Naya delivery boy</h3><label class="fld"><span>Naam</span><input id="db-n" maxlength="60" placeholder="Jaise: Raju"></label><label class="fld"><span>Mobile (optional)</span><input id="db-p" inputmode="tel" maxlength="15" placeholder="10 digit"></label><label class="fld"><span>Gmail</span><input id="db-e" type="email" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="raju@gmail.com"></label><div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="dbaddgo">Jodo</button></div>');
  };
  LK.act.dbaddgo = function (el) {
    var n = $("#db-n").value.trim(), p = $("#db-p").value.trim(), m = $("#db-e").value.trim();
    if (!n) return LK.toast("Naam likho.", "bad");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) return LK.toast("Sahi Gmail likho.", "bad");
    return LK.busy(el, function () { return S.api.dboyAdd(m, n, p); }).then(function () { LK.closeSheet(); LK.toast("Delivery boy jud gaya ✓ Ab wo us Gmail se login kare."); var e = LK.top(); if (e.name === "dboys") V.dboys.init(e); else if (e.name === "sorder") { e.sig = ""; V.sorder.init(e); } });
  };
  LK.act.dbrm = function (el) {
    var id = el.dataset.id;
    return LK.ask("Is delivery boy ko kaam se hata do? Uska purana hisaab, cash aur record bana rahega. Chal rahe orders khali ho jayenge.", "Haan, hata do", true).then(function (ok) { if (!ok) return; return S.api.dboyRemove(id).then(function () { LK.toast("Kaam se hata diya. Hisaab bana hai."); V.dboys.init(LK.top()); }, LK.fail); });
  };
  var PAY = null;
  LK.act.dbpay = function (el) {
    var b = (LK.top().data || []).filter(function (x) { return x.id === el.dataset.id; })[0]; if (!b) return;
    PAY = { id: b.id, type: b.pay_type || "salary" };
    LK.sheet('<h3>💼 ' + esc(b.name || "Delivery boy") + ' — Salary / Rate</h3><p class="muted sm">Jo tay hua wo yahan likho. Boy ko ye apni screen par dikhega.</p><div class="chips flush wrapc"><button class="chip" data-act="dbptype" data-v="salary" aria-pressed="' + (PAY.type === "salary") + '">Mahine ki salary</button><button class="chip" data-act="dbptype" data-v="order" aria-pressed="' + (PAY.type === "order") + '">Per order rate</button></div>' +
      '<label class="fld"><span id="dp-al">' + (PAY.type === "order" ? "Rate per order (₹)" : "Salary per mahina (₹)") + '</span><input id="dp-a" inputmode="decimal" value="' + (+b.pay_amount || "") + '"></label>' +
      '<label class="fld" id="dp-tw"' + (PAY.type === "order" ? " hidden" : "") + '><span>Kaam ka samay</span><input id="dp-t" maxlength="60" placeholder="Jaise: subah 9 se shaam 6" value="' + esc(b.work_time || "") + '"></label>' +
      '<div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="dbpaygo">Save</button></div>');
  };
  LK.act.dbptype = function (el) {
    PAY.type = el.dataset.v; el.parentNode.querySelectorAll(".chip").forEach(function (c) { c.setAttribute("aria-pressed", String(c === el)); });
    $("#dp-al").textContent = PAY.type === "order" ? "Rate per order (₹)" : "Salary per mahina (₹)"; $("#dp-tw").hidden = PAY.type === "order";
  };
  LK.act.dbpaygo = function (el) {
    var a = parseFloat($("#dp-a").value) || 0;
    if (!(a > 0)) return LK.toast("Rakam likho.", "bad");
    return LK.busy(el, function () { return S.api.dboyPay(PAY.id, PAY.type, a, $("#dp-t").value.trim()); }).then(function () { LK.closeSheet(); LK.toast("Save ho gaya ✓"); V.dboys.init(LK.top()); });
  };
  /* ---- boy photo and Aadhaar card (private; only this shopkeeper can see) ---- */
  var DD = null;
  function docBox(label, key, path) {
    return '<div class="card"><b>' + label + '</b><div id="dd-' + key + '" class="ddimg">' + (path ? '<span class="muted sm">Photo load ho rahi hai…</span>' : '<span class="muted sm">Abhi nahi lagayi</span>') + '</div><label class="btn ghost sm" for="dd-in-' + key + '">📷 ' + (path ? "Badlo" : "Photo lo / chuno") + '</label><input type="file" id="dd-in-' + key + '" accept="image/*" hidden data-in="dbdoc" data-k="' + key + '"></div>';
  }
  function showImg(key, path) {
    var box = $("#dd-" + key); if (!box || !path) return;
    S.api.kycUrl(path).then(function (u) { var b = $("#dd-" + key); if (b && u) b.innerHTML = '<img src="' + u + '" alt="" style="max-width:100%;max-height:220px;border-radius:10px;display:block;margin:6px 0">'; else if (b) b.innerHTML = '<span class="muted sm">✓ Lagi hui hai</span>'; }, function () { var b = $("#dd-" + key); if (b) b.innerHTML = '<span class="muted sm">✓ Lagi hui hai (dikhane me dikkat)</span>'; });
  }
  LK.act.dbdocs = function (el) {
    var b = (LK.top().data || []).filter(function (x) { return x.id === el.dataset.id; })[0]; if (!b) return;
    DD = { id: b.id, photo: null, aadhaar: null };
    LK.sheet('<h3>🪪 ' + esc(b.name || "Delivery boy") + '</h3><p class="muted sm">Photo aur Aadhaar card sirf aapko dikhenge. Customer ya boy ko nahi. Boy ki marzi se hi lein.</p>' +
      docBox("📸 Boy ki photo", "photo", b.photo_path) + docBox("🪪 Aadhaar card (aage ki taraf)", "aadhaar", b.aadhaar_path) +
      '<label class="fld"><span>Aadhaar ke aakhri 4 ank (optional)</span><input id="dd-l4" inputmode="numeric" maxlength="4" value="' + esc(b.aadhaar_last4 || "") + '" placeholder="1234"></label>' +
      '<div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="dbdocsgo">Save</button></div>');
    showImg("photo", b.photo_path); showImg("aadhaar", b.aadhaar_path);
  };
  LK.inp.dbdoc = function (el) {
    var f = el.files && el.files[0], k = el.dataset.k; if (!f || !DD) return;
    var box = $("#dd-" + k); if (box) box.innerHTML = '<span class="muted sm">Upload ho raha hai…</span>';
    LK.shrink(f, k === "aadhaar" ? 1400 : 900).then(function (s) { return S.api.kycUpload(s).then(function (path) { DD[k] = path; if (box) box.innerHTML = '<img src="' + URL.createObjectURL(s) + '" alt="" style="max-width:100%;max-height:220px;border-radius:10px;display:block;margin:6px 0">'; }); }).catch(function (x) { if (box) box.innerHTML = ""; LK.fail(x); });
  };
  LK.act.dbdocsgo = function (el) {
    var l4 = ($("#dd-l4").value || "").trim();
    if (l4 && !/^\d{4}$/.test(l4)) return LK.toast("Aadhaar ke 4 ank hi likho.", "bad");
    return LK.busy(el, function () { return S.api.dboyDocs(DD.id, DD.photo, DD.aadhaar, l4); }).then(function () { LK.closeSheet(); LK.toast("Save ho gaya ✓"); V.dboys.init(LK.top()); });
  };
  LK.act.dbhis = function (el) {
    var id = el.dataset.id, b = (LK.top().data || []).filter(function (x) { return x.id === id; })[0] || {};
    return S.api.dboyHisaab(id).then(function (rows) {
      rows = rows || [];
      var h = '<h3>💵 ' + esc(b.name || "Delivery boy") + " ka hisaab</h3><p class=\"muted sm\">Pichhle 30 din ke delivered orders.</p>";
      h += '<div class="card"><div class="kv"><div><span>Abhi cash dena baaki</span><b>' + LK.money(+b.pending || 0) + "</b></div></div></div>";
      h += rows.length ? '<div class="list">' + rows.map(function (r) { return '<div class="row"><span>#' + esc(r.code) + " · " + LK.ago(r.at) + "</span><b>" + (+r.cash > 0 ? LK.money(r.cash) + (r.settled ? " ✓ mil gaya" : " ⏳ baaki") : "UPI / cash nahi") + "</b></div>"; }).join("") + "</div>" : '<div class="empty">Abhi koi delivered order nahi.</div>';
      if (+b.pending > 0) h += '<button class="btn big" data-act="dbsettle" data-id="' + id + '">✅ ' + LK.money(b.pending) + " cash mil gaya</button>";
      h += '<button class="btn ghost" data-act="mclose" data-v="0">Band karo</button>';
      LK.sheet(h);
    }, LK.fail);
  };
  LK.act.dbsettle = function (el) {
    var id = el.dataset.id;
    return LK.busy(el, function () { return S.api.dboySettle(id); }).then(function (amt) { LK.closeSheet(); LK.toast(LK.money(+amt || 0) + " ka hisaab clear ho gaya ✓"); V.dboys.init(LK.top()); });
  };

  /* ================= shopkeeper: assign on order page ================= */
  LK.dboyBox = function (e, o) {
    if (!on() || o.fulfilment !== "delivery" || ["confirmed", "ready", "out_for_delivery"].indexOf(o.status) < 0) return "";
    var boys = (e.boys || []).filter(function (b) { return b.active !== false; });
    if (!boys.length) return '<div class="card"><b>🚚 Delivery boy</b><p class="muted sm">Abhi koi delivery boy nahi hai.</p><button class="btn ghost sm" data-act="dboys">➕ Delivery boy jodo</button></div>';
    return '<div class="card"><b>🚚 Delivery boy chuno</b><div class="chips flush wrapc">' + boys.map(function (b) { return '<button class="chip" data-act="dassign" data-v="' + b.id + '" aria-pressed="' + (o.dboy_id === b.id) + '">' + esc(b.name || b.email) + "</button>"; }).join("") +
      (o.dboy_id ? '<button class="chip" data-act="dassign" data-v="">✖ Hatao</button>' : "") + "</div>" + (o.dboy_id ? '<p class="muted sm">Boy ke phone par ye order dikh raha hai. Wahi "Nikal gaya" aur "Deliver ho gaya" dabayega.</p>' : "") + "</div>";
  };
  LK.act.dassign = function (el) {
    var e = LK.top(), v = el.dataset.v || null;
    return S.api.dboyAssign(e.params.id, v).then(function () { LK.toast(v ? "Delivery boy tay ho gaya ✓" : "Hata diya"); e.sig = ""; e.fk = ""; return V.sorder.init(e); }, LK.fail);
  };

  /* ================= customer: tracking card ================= */
  LK.dboyCard = function (d, o, shop) {
    if (!d || !on()) return "";
    var h = '<div class="card"><h3>🚚 ' + (shop ? "Delivery boy" : "Aapka delivery boy") + '</h3><div class="kv"><div><span>Naam</span><b>' + esc(d.name || "Delivery boy") + "</b></div></div>";
    if (d.phone) h += '<a class="btn ghost sm" href="' + LK.tel(d.phone) + '">📞 ' + esc(d.name || "Boy") + " ko call karo</a>";
    if (o.status === "out_for_delivery") {
      if (d.lat != null && d.lng != null) {
        var la = +d.lat, ln = +d.lng, k = 0.006;
        h += '<iframe class="dmap" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=' + (ln - k) + "," + (la - k) + "," + (ln + k) + "," + (la + k) + "&amp;layer=mapnik&amp;marker=" + la + "%2C" + ln + '"></iframe>' +
          '<p class="muted sm">Live location · ' + LK.ago(d.at) + ' pehle update hui</p><a class="btn ghost sm" href="' + LK.mapUrl(la, ln) + '">🗺️ Bade Map mein dekho</a>';
      } else h += '<p class="muted sm">Boy ki location abhi nahi mili…</p>';
    }
    return h + "</div>";
  };

  /* ================= delivery boy home ================= */
  var ORD = null, ME = [];
  function pay(o) {
    if (o.payment_mode === "cod") return '<div class="cta">💵 Cash lena hai: <b>' + LK.money(o.total) + "</b></div>";
    return o.customer_paid ? '<div class="cta ok">✓ UPI se pay ho chuka</div>' : '<div class="cta">📲 UPI payment baaki (customer abhi pay karega)</div>';
  }
  V.dhome = {
    tab: "dhome",
    html: function (e) {
      var pend = ME.reduce(function (a, b) { return a + (+b.pending || 0); }, 0), d = e.data;
      var h = '<section class="pad"><div class="row"><h2>🚚 Delivery</h2><span class="muted sm">' + esc(ME.map(function (b) { return b.shop; }).join(", ")) + "</span></div>";
      h += '<div class="card"><div class="kv"><div><span>Dukaandaar ko dena baaki (cash)</span><b>' + LK.money(pend) + "</b></div></div></div>";
      var pt = ME.filter(function (m) { return payTxt(m); });
      if (pt.length) h += '<div class="card"><b>Mera tay kiya hua</b>' + pt.map(function (m) { return '<p class="sm">' + (ME.length > 1 ? esc(m.shop) + ": " : "") + esc(payTxt(m)) + "</p>"; }).join("") + "</div>";
      if (!d) return h + LOADING + "</section>";
      var act = d.filter(function (o) { return o.status !== "completed"; }), done = d.filter(function (o) { return o.status === "completed"; });
      h += "<h3>Abhi ke orders</h3>";
      h += act.length ? act.map(function (o) {
        return '<div class="card ord"><div class="row"><b>' + esc(o.customer_name || "Customer") + "</b>" + LK.badge(o.status, true) + '</div><div class="meta">#' + esc(o.code) + " · " + esc(o.shop || "") + "</div>" +
          '<div class="kv"><div><span>Pata</span><b>' + esc(o.address || "") + "</b></div></div>" + pay(o) + '<div class="btns3">' +
          (o.customer_phone ? '<a class="btn ghost sm" href="' + LK.tel(o.customer_phone) + '">📞 Call</a>' : "") +
          (o.lat != null ? '<a class="btn ghost sm" href="https://www.google.com/maps/dir/?api=1&destination=' + o.lat + "," + o.lng + '">🧭 Map</a>' : '<a class="btn ghost sm" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(o.address || "") + '">🧭 Map</a>') + "</div>" +
          (o.status !== "out_for_delivery" ? '<button class="btn" data-act="dstart" data-id="' + o.id + '">🚚 Nikal gaya</button>' : "") +
          '<button class="btn big" data-act="ddone" data-id="' + o.id + '">✅ Deliver ho gaya</button></div>';
      }).join("") : '<div class="empty">Abhi koi order nahi mila. Naya order aate hi yahan dikhega 🔔</div>';
      if (done.length) h += "<h3>Poore hue (3 din)</h3>" + done.map(function (o) { return '<div class="card"><div class="row"><b>' + esc(o.customer_name || "Customer") + "</b><span>#" + esc(o.code) + "</span></div><div class=\"meta\">" + LK.ago(o.updated_at) + " · " + (+o.cash > 0 ? "Cash " + LK.money(o.cash) + (o.settled ? " ✓ de diya" : " ⏳ dena baaki") : "Cash nahi") + "</div></div>"; }).join("");
      h += '<div class="links"><button class="btn ghost" data-act="tomode" data-v="customer">🛍️ Customer mode mein jao</button>' + '<button class="btn ghost danger-t" data-act="logout">Logout</button></div></section>';
      return h;
    },
    init: function (e, quiet) {
      return Promise.all([S.api.dboyOrders(), S.api.dboyMe()]).then(function (r) {
        var sig = JSON.stringify(r);
        ORD = r[0] || []; ME = r[1] || []; S.dboy = ME;
        if (e.data && e.sig === sig) return;
        e.sig = sig; e.data = ORD; LK.redraw(e);
      }).catch(function (x) { if (!quiet) LK.fail(x); });
    }
  };
  LK.act.dstart = function (el) {
    var id = el.dataset.id;
    return LK.busy(el, function () { return S.api.dboyStart(id); }).then(function () { LK.toast("Customer ko bata diya ✓ Safe chalana 🏍️"); track(); return V.dhome.init(LK.top()); });
  };
  LK.act.ddone = function (el) {
    var id = el.dataset.id, o = (LK.top().data || []).filter(function (x) { return x.id === id; })[0]; if (!o) return;
    if (o.payment_mode === "cod") {
      LK.sheet('<h3>Cash mila?</h3><p>Customer se <b>' + LK.money(o.total) + '</b> cash lena tha.</p><button class="btn big" data-act="ddonego" data-id="' + id + '" data-v="1">💵 Haan, cash mil gaya</button><button class="btn ghost" data-act="ddonego" data-id="' + id + '" data-v="0">Cash nahi mila</button><button class="btn ghost" data-act="mclose" data-v="0">Wapas</button>');
    } else {
      return LK.ask("Order deliver ho gaya?", "Haan, ho gaya").then(function (ok) { if (ok) return fin(id, false); });
    }
  };
  LK.act.ddonego = function (el) { LK.closeSheet(); return fin(el.dataset.id, el.dataset.v === "1"); };
  function fin(id, cash) {
    return S.api.dboyDeliver(id, cash).then(function () { LK.toast("Order poora hua ✓"); return V.dhome.init(LK.top()); }, LK.fail);
  }

  /* ---------- live location: while any order is out for delivery, send GPS every 20 s ---------- */
  var tt = null;
  function sendLoc() {
    var out = (ORD || []).filter(function (o) { return o.status === "out_for_delivery"; });
    if (!out.length || S.mode !== "dboy" && !LK.isBoy()) return;
    LK.gps().then(function (p) { out.forEach(function (o) { S.api.dboyLoc(o.id, p.lat, p.lng).catch(function () {}); }); }, function () {});
  }
  function track() { if (tt || !LK.isBoy()) return; tt = setInterval(sendLoc, 20000); sendLoc(); }
  LK.dboyPoll = function (first) {
    if (!LK.isBoy() || S.demo) return;
    track();
    S.api.dboyOrders().then(function (list) {
      var seen = S.seen || {}; ORD = list || [];
      ORD.forEach(function (o) {
        var k = "d" + o.id;
        if (!seen[k]) { if (!first && o.status !== "completed") LK.notify("Naya delivery mila 🚚", "#" + o.code + " · " + (o.customer_name || "")); seen[k] = o.status; }
        else seen[k] = o.status;
      });
    }).catch(function () {});
  };
})();
