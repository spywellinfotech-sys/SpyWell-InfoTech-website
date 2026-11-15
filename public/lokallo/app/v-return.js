/* Returns (Single edition): customer returns (item-wise, optional back to stock) and supplier returns (stock down, supplier udhaar down). */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc;
  var UN = { kg: "kg", g: "gram", l: "litre", ml: "ml", packet: "packet", piece: "piece" };
  function n(x) { return Math.round((+x || 0) * 100) / 100; }
  LK.retOn = function () { return !!window.LK_SINGLE; };

  /* ---- customer return, from a completed order ---- */
  LK.act.custret = function () {
    var e = LK.top(), d = e.data; if (!d) return;
    var items = (d.items || []).filter(function (i) { return !i.removed && (+i.qty - (+i.ret_qty || 0)) > 0; });
    if (!items.length) return LK.toast("Is order mein return ke liye saman nahi bacha.", "bad");
    LK.sheet('<h3>↩️ Saman return</h3><p class="muted sm">Jo saman customer ne lautaya uski matra likho. "Stock mein wapas" tab lagao jab saman achha hai aur dobara bech sakte ho. Kharab saman ka tick hatao. Refund ka paisa aap customer ko seedha lauta do.</p>' + items.map(function (i) {
      var left = n(+i.qty - (+i.ret_qty || 0));
      return '<div class="be" data-id="' + i.id + '" data-q="' + i.qty + '" data-a="' + (+i.amount || 0) + '"><div class="row"><b>' + esc(i.name) + '</b><span class="muted sm">Bacha: ' + left + " " + (UN[i.qty_unit] || i.qty_unit) + '</span></div><div class="rr"><input class="rq" inputmode="decimal" placeholder="0" max="' + left + '" data-max="' + left + '" style="width:80px"><span>' + (UN[i.qty_unit] || i.qty_unit) + '</span><label class="chip" style="margin-left:auto"><input type="checkbox" class="rs" checked> Stock mein wapas</label></div></div>';
    }).join("") + '<label class="fld"><span>Wajah (optional)</span><input id="rt-n" maxlength="150" placeholder="Jaise: kharab nikla"></label><div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="custretgo">✅ Return darj karo</button></div>');
  };
  LK.act.custretgo = function (el) {
    var e = LK.top(), items = [], tot = 0;
    document.querySelectorAll("#modal .be").forEach(function (b) {
      var inp = b.querySelector(".rq"), q = parseFloat(inp.value) || 0, mx = parseFloat(inp.dataset.max) || 0;
      if (q > mx) q = mx; if (q > 0) { items.push({ item_id: b.dataset.id, qty: q, restock: b.querySelector(".rs").checked }); tot += (+b.dataset.a || 0) * q / (+b.dataset.q || 1); }
    });
    if (!items.length) return LK.toast("Kam se kam ek saman ki matra likho.", "bad");
    return LK.busy(el, function () { return S.api.custReturn(e.params.id, items, $("#rt-n").value.trim()); }).then(function (t) {
      LK.closeSheet(); LK.toast("Return darj ho gaya ✓ Refund " + LK.money(+t || tot)); e.sig = ""; e.fk = ""; return V.sorder.init(e);
    });
  };

  /* ---- supplier return, from a received order ---- */
  LK.act.supret = function (el) {
    var e = LK.top(), o = (e.data.orders || []).filter(function (x) { return x.id === el.dataset.id; })[0]; if (!o) return;
    LK._ro = o;
    var items = o.items.filter(function (i) { return (+i.got_qty || 0) - (+i.ret_qty || 0) > 0; });
    LK.sheet('<h3>↩️ Maal wapas — #' + esc(o.code) + '</h3><p class="muted sm">Jo maal supplier ko lautaya uski matra likho. Stock kam ho jayega aur supplier ke baaki hisaab se paisa kat jayega.</p>' + items.map(function (i) {
      var left = n((+i.got_qty || 0) - (+i.ret_qty || 0));
      return '<div class="be" data-id="' + i.id + '"><div class="row"><b>' + esc(i.name) + '</b><span class="muted sm">Aaya: ' + left + " " + (UN[i.unit] || i.unit) + (i.rate != null ? " @₹" + n(i.rate) : "") + '</span></div><div class="rr"><input class="rq" inputmode="decimal" placeholder="0" data-max="' + left + '" style="width:80px"><span>' + (UN[i.unit] || i.unit) + "</span></div></div>";
    }).join("") + '<label class="fld"><span>Wajah (optional)</span><input id="rt-n" maxlength="150" placeholder="Jaise: kharab / galat maal"></label><div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="supretgo">✅ Wapas darj karo</button></div>');
  };
  LK.act.supretgo = function (el) {
    var items = [], o = LK._ro;
    document.querySelectorAll("#modal .be").forEach(function (b) {
      var inp = b.querySelector(".rq"), q = parseFloat(inp.value) || 0, mx = parseFloat(inp.dataset.max) || 0; if (q > mx) q = mx; if (q > 0) items.push({ id: b.dataset.id, qty: q });
    });
    if (!items.length) return LK.toast("Kam se kam ek saman ki matra likho.", "bad");
    return LK.busy(el, function () { return S.api.supReturn(o.id, items, $("#rt-n").value.trim()); }).then(function (t) {
      LK.closeSheet(); LK.toast("Maal wapas darj ho gaya ✓ Hisaab se " + LK.money(+t || 0) + " kata"); var e = LK.top(); return V[e.name].init(e);
    });
  };

  /* ---- return list ---- */
  var DAYS = 30;
  V.rets = {
    html: function (e) {
      var d = e.data, h = '<section class="pad"><h2>↩️ Returns</h2><div class="chips flush">' + [7, 30, 90].map(function (x) { return '<button class="chip" data-act="retdays" data-v="' + x + '" aria-pressed="' + (DAYS === x) + '">' + x + " din</button>"; }).join("") + "</div>";
      if (!d) return h + '<div class="empty">Ruko…</div></section>';
      var cu = 0, su = 0; d.forEach(function (r) { if (r.kind === "customer") cu += +r.amount; else su += +r.amount; });
      h += '<div class="card"><div class="kv"><div><span>Customer ko wapas (refund)</span><b>' + LK.money(cu) + "</b></div><div><span>Supplier se wapas (credit)</span><b>" + LK.money(su) + "</b></div></div></div>";
      if (!d.length) return h + '<div class="empty">Is samay mein koi return nahi.</div></section>';
      return h + '<div class="card">' + d.map(function (r) {
        return '<div class="ri"><b class="nm">' + (r.kind === "customer" ? "👤 " : "🚛 ") + esc(r.who || "") + " · #" + esc(r.code || "") + "<small>" + esc(r.name) + " " + n(r.qty) + " " + (UN[r.unit] || r.unit) + (r.kind === "customer" ? (r.restock ? " · stock mein wapas" : " · kharab") : "") + " · " + LK.ago(r.at) + "</small></b><b>" + LK.money(+r.amount) + "</b></div>";
      }).join("") + "</div></section>";
    },
    init: function (e) { return S.api.returnsList(DAYS).then(function (r) { e.data = r || []; LK.redraw(e); }).catch(LK.fail); }
  };
  LK.act.rets = function () { LK.go("rets"); };
  LK.act.retdays = function (el) { DAYS = +el.dataset.v; var e = LK.top(); e.data = null; LK.redraw(e); V.rets.init(e); };
})();
