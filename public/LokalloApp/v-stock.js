/* Stock management (single-shop edition): purchases, stock, auto-reduce on completed orders (server trigger), low-stock + expiry alerts, profit per order. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc;
  var UN = { kg: "kg", g: "gram", l: "litre", ml: "ml", packet: "packet", piece: "piece" };
  var TAB = "stock", DAYS = 30, P = null;
  function n(x) { return Math.round((+x || 0) * 100) / 100; }
  var PO = {};
  function need(l) { return (l || []).filter(function (s) { return +s.qty <= +s.low_at; }); }
  function sugg(s) { return Math.max(Math.ceil((+s.low_at * 2 || 5) - (+s.qty || 0)), 1); }
  function days(d) { return d ? Math.ceil((new Date(d + "T23:59:59") - Date.now()) / 864e5) : null; }
  function flags(s) {
    var f = [], d = days(s.expiry);
    if (+s.qty <= 0) f.push('<span class="bd bad">Khatam</span>'); else if (+s.qty <= +s.low_at) f.push('<span class="bd warn">Kam stock</span>');
    if (d != null) f.push(d < 0 ? '<span class="bd bad">Expired</span>' : d <= 7 ? '<span class="bd warn">' + d + ' din me expiry</span>' : '<span class="bd ok">Exp ' + new Date(s.expiry).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + "</span>");
    return f.join(" ");
  }
  V.stock = {
    tab: "sorders",
    html: function (e) {
      var l = e.list || [], alert = l.filter(function (s) { return +s.qty <= +s.low_at || (days(s.expiry) != null && days(s.expiry) <= 7); });
      var h = '<section class="pad"><div class="row"><h2>📦 Stock</h2><span class="btns2"><button class="btn sm" data-act="stkpick">📋 List se</button><button class="btn ghost sm" data-act="stknew">➕ Apna</button><button class="btn ghost sm" data-act="sups">🚛 Supplier</button><button class="btn ghost sm" data-act="rets">↩️ Returns</button></span></div><div class="chips flush"><button class="chip" data-act="stktab" data-v="stock" aria-pressed="' + (TAB === "stock") + '">Stock</button><button class="chip" data-act="stktab" data-v="po" aria-pressed="' + (TAB === "po") + '">🛒 Kharid list' + (need(l).length ? " (" + need(l).length + ")" : "") + '</button></div>';
      if (TAB === "po") {
        var nd = need(l); if (!nd.length) return h + '<div class="empty">Sab saman stock mein hai. Jo saman khatam ya kam hoga wo yahan apne aap aa jayega.</div></section>';
        return h + '<p class="muted sm">Khatam / kam stock wala saman apne aap aaya hai. Matra badlo, jo nahi chahiye uska tick hatao, phir WhatsApp par bhejo — supplier aap WhatsApp mein khud chuno.</p><div class="card">' + nd.map(function (s) { var o = PO[s.id] || (PO[s.id] = { on: true, q: sugg(s) }); return '<div class="ri"><input type="checkbox" data-in="pocheck" data-id="' + s.id + '"' + (o.on ? " checked" : "") + '><b class="nm">' + esc(s.name) + "<small>Abhi " + n(s.qty) + " " + UN[s.unit] + '</small></b><input class="rin" style="width:70px" inputmode="decimal" data-in="poqty" data-id="' + s.id + '" value="' + o.q + '"><span>' + UN[s.unit] + "</span></div>"; }).join("") + '</div><button class="btn big" data-act="powa">📲 Supplier ko WhatsApp par bhejo</button></section>';
      }
      if (e.name === "munafa" || TAB === "profit") {
        var p = e.profit || [], ex = e.exp || [], rev = 0, cost = 0, tex = 0; p.forEach(function (o) { rev += +o.revenue; cost += +o.cost; }); ex.forEach(function (x) { tex += +x.amount; });
        var gp = rev - cost;
        return '<section class="pad"><h2>📊 Munafa</h2><div class="chips flush">' + [7, 30, 90].map(function (d) { return '<button class="chip" data-act="stkdays" data-v="' + d + '" aria-pressed="' + (DAYS === d) + '">' + d + ' din</button>'; }).join("") + '</div><div class="kv"><div><span>Bikri (sale price)</span><b>' + LK.money(n(rev)) + "</b></div><div><span>Khareed lagat (purchase price)</span><b>− " + LK.money(n(cost)) + "</b></div><div><span>Gross profit</span><b>" + LK.money(n(gp)) + "</b></div><div><span>Anya kharch</span><b>− " + LK.money(n(tex)) + "</b></div><div><span>Net profit</span><b style=\"color:" + (gp - tex < 0 ? "var(--r)" : "var(--g)") + "\">" + LK.money(n(gp - tex)) + "</b></div></div>" +
          '<p class="muted sm">Gross profit = bikri − khareed lagat. Net profit = Gross profit − anya kharch. Jo saman stock list mein nahi, uski lagat 0 maani jati hai.</p>' +
          '<div class="row"><h3>Anya kharch</h3><button class="btn sm" data-act="expnew">➕ Kharch likho</button></div><div class="card">' +
          (ex.map(function (x) { return '<div class="ri"><b class="nm">' + esc(x.category) + "<small>" + new Date(x.spent_on).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + (x.note ? " · " + esc(x.note) : "") + "</small></b><b>" + LK.money(n(x.amount)) + '</b><button class="btn ghost sm" data-act="expdel" data-id="' + x.id + '">🗑️</button></div>'; }).join("") || '<div class="empty">Koi kharch nahi likha (kiraya, bijli, salary, transport...).</div>') + "</div>" +
          '<h3>Order wise gross profit</h3><div class="card">' +
          (p.map(function (o) { var m = n(o.revenue - o.cost); return '<div class="ri"><b class="nm">#' + esc(o.code) + "<small>" + LK.ago(o.created_at) + " · bikri " + LK.money(n(o.revenue)) + (o.unmatched ? " · " + o.unmatched + " saman stock me nahi" : "") + "</small></b><b>" + LK.money(m) + "</b></div>"; }).join("") || '<div class="empty">Abhi koi complete order nahi.</div>') + "</div></section>";
      }
      return h + (alert.length ? '<div class="card hot"><b>⚠️ ' + alert.length + " saman par dhyan dein</b><div class=\"muted sm\">" + alert.map(function (s) { return esc(s.name); }).join(", ") + "</div></div>" : "") +
        '<p class="muted sm">Order complete hote hi stock apne aap kam hota hai (naam same hona chahiye, jaise rate list mein).</p><div class="card">' +
        (l.map(function (s) { return '<div class="ri"><b class="nm">' + esc(s.name) + "<small>" + n(s.qty) + " " + UN[s.unit] + " · khareed ₹" + n(s.buy_rate) + "/" + UN[s.unit] + "</small>" + flags(s) + '</b><button class="btn ghost sm" data-act="stkbuy" data-id="' + s.id + '">➕ Khareed</button><button class="btn ghost sm" data-act="stkwaste" data-id="' + s.id + '">🗑️</button></div>'; }).join("") || '<div class="empty">Stock list khali hai. "Naya saman" se shuru karo.</div>') + "</div></section>";
    },
    init: function (e) { return Promise.all([S.api.stockList(), S.api.stockProfit(DAYS), S.api.expList(DAYS)]).then(function (r) { e.list = r[0] || []; e.profit = r[1] || []; e.exp = r[2] || []; LK.redraw(e); }).catch(LK.fail); }
  };
  V.munafa = { tab: "sorders", html: function (e) { e.name = "munafa"; var t = TAB; TAB = "profit"; try { return V.stock.html(e); } finally { TAB = t; } }, init: function (e) { return V.stock.init(e); } };
  LK.act.munafa = function () { LK.go("munafa"); };
  function item(id) { return (LK.top().list || []).filter(function (s) { return s.id === id; })[0]; }
  function reload() { return V.stock.init(LK.top()); }
  LK.act.stock = function () { LK.go("stock"); };
  LK.inp.pocheck = function (el) { (PO[el.dataset.id] = PO[el.dataset.id] || {}).on = el.checked; };
  LK.inp.poqty = function (el) { (PO[el.dataset.id] = PO[el.dataset.id] || { on: true }).q = el.value; };
  LK.act.powa = function () {
    var l = need(LK.top().list), rows = l.filter(function (s) { return PO[s.id] && PO[s.id].on && parseFloat(PO[s.id].q) > 0; });
    if (!rows.length) return LK.toast("Kuch saman chuno.", "bad");
    var nm = (LK.brandOf && LK.brandOf().name) || (S.shop && S.shop.name) || "";
    var t = "Namaste, " + nm + " ke liye ye saman chahiye:\n" + rows.map(function (s, i) { return (i + 1) + ". " + s.name + " — " + parseFloat(PO[s.id].q) + " " + UN[s.unit]; }).join("\n") + "\nKripya bhej dein. Dhanyavad.";
    window.location.href = "https://wa.me/?text=" + encodeURIComponent(t);
  };
  LK.act.stktab = function (el) { TAB = el.dataset.v; LK.redraw(LK.top()); };
  LK.act.stkdays = function (el) { DAYS = +el.dataset.v; reload(); };
  var UK = { weight: "kg", volume: "l", packet: "packet", piece: "piece" };
  V.stkpick = {
    tab: "sorders",
    html: function (e) {
      return '<section><div class="pad"><h2>Saman chuno</h2><p class="muted sm">Tick karo, phir neeche "Stock mein jodo". Tick karte hi matra aur khareed rate bharne ka box aayega (optional).</p><div class="search"><input data-in="spsearch" placeholder="Saman dhoondho"></div></div><div class="chips wrapx" id="spchips"></div><div class="pad" id="splist"></div><div class="cbspace"></div><div class="cartbar" id="spbar"></div></section>';
    },
    init: function (e) {
      e.sel = e.sel || {}; e.q = ""; e.cur = "";
      return Promise.all([S.api.catalog(), S.api.stockList()]).then(function (r) {
        e.cat = (r[0] || []).filter(function (c) { return !S.shop || !S.shop.types || S.shop.types.indexOf(c.shop_type) > -1; });
        e.have = {}; (r[1] || []).forEach(function (s) { e.have[String(s.name).toLowerCase()] = 1; });
        var seen = {}; e.cats = []; e.cat.forEach(function (c) { if (!seen[c.category]) { seen[c.category] = 1; e.cats.push(c.category); } });
        e.cur = e.cats[0] || ""; LK.redraw(e); draw(e);
      }).catch(LK.fail);
    }
  };
  function draw(e) {
    var q = (e.q || "").toLowerCase(), c = $("#spchips"), l = $("#splist"), b = $("#spbar"); if (!l) return;
    c.innerHTML = e.cats.map(function (x) { return '<button class="chip" data-act="spcat" data-v="' + esc(x) + '" aria-pressed="' + (!q && x === e.cur) + '">' + esc(x) + "</button>"; }).join("");
    var rows = e.cat.filter(function (x) { return q ? (x.name + " " + (x.name_en || "")).toLowerCase().indexOf(q) > -1 : x.category === e.cur; });
    l.innerHTML = rows.map(function (x) { var has = e.have[x.name.toLowerCase()]; return '<label class="ri"><input type="checkbox" data-in="spchk" data-id="' + x.id + '"' + (e.sel[x.id] ? " checked" : "") + (has ? " disabled" : "") + '><b class="nm">' + esc(x.name) + "<small>" + esc(x.name_en || "") + (has ? " · stock mein hai" : "") + "</small></b>" + (e.sel[x.id] ? '<span class="rr"><input class="rin" style="width:64px" data-in="spq" data-id="' + x.id + '" inputmode="decimal" placeholder="matra" value="' + esc(e.sel[x.id].q || "") + '"><span>' + UN[UK[x.unit_kind] || "kg"] + '</span><input class="rin" style="width:64px" data-in="spr" data-id="' + x.id + '" inputmode="decimal" placeholder="₹ rate" value="' + esc(e.sel[x.id].r || "") + '"></span>' : "") + "</label>"; }).join("") || '<div class="empty">Kuch nahi mila.</div>';
    var k = Object.keys(e.sel).filter(function (i) { return e.sel[i]; }).length;
    b.innerHTML = '<button class="btn big" data-act="spadd"' + (k ? "" : " disabled") + ">Stock mein jodo (" + k + ")</button>";
  }
  LK.act.stkpick = function () { LK.go("stkpick"); };
  LK.inp.spsearch = function (el) { var e = LK.top(); e.q = el.value.trim(); draw(e); };
  LK.act.spcat = function (el) { var e = LK.top(); e.cur = el.dataset.v; draw(e); };
  LK.inp.spchk = function (el) { var e = LK.top(); e.sel[el.dataset.id] = el.checked ? (e.sel[el.dataset.id] || { q: "", r: "" }) : null; draw(e); };
  LK.inp.spq = function (el) { LK.top().sel[el.dataset.id].q = el.value; };
  LK.inp.spr = function (el) { LK.top().sel[el.dataset.id].r = el.value; };
  LK.act.spadd = function (el) {
    var e = LK.top(), items = e.cat.filter(function (x) { return e.sel[x.id]; });
    return LK.busy(el, function () { return items.reduce(function (p, x) { return p.then(function () { var s = e.sel[x.id], q = parseFloat(s.q) || 0, r = parseFloat(s.r) || 0; return S.api.stockSave({ name: x.name, unit: UK[x.unit_kind] || "kg", low_at: 5 }).then(function (id) { return q > 0 ? S.api.stockBuy(id, q, r, null) : null; }); }); }, Promise.resolve()); }).then(function () { LK.toast(items.length + " saman jud gaye ✓"); LK.back(); });
  };
  LK.act.stknew = function () {
    LK.sheet('<h3>Naya saman</h3><label class="fld"><span>Saman ka naam</span><input id="st-n" maxlength="60" placeholder="Jaise: Chawal"></label><label class="fld"><span>Unit</span><select id="st-u">' + Object.keys(UN).map(function (u) { return '<option value="' + u + '">' + UN[u] + "</option>"; }).join("") + '</select></label><label class="fld"><span>Kam stock alert (is se kam hone par)</span><input id="st-l" inputmode="decimal" value="5"></label><label class="fld"><span>Pehli khareed: matra (optional)</span><input id="st-q" inputmode="decimal"></label><label class="fld"><span>Khareed rate ₹ per unit</span><input id="st-r" inputmode="decimal"></label><label class="fld"><span>Expiry date (optional)</span><input id="st-e" type="date"></label><button class="btn" data-act="stksave">Save karo</button>');
  };
  LK.act.stksave = function (el) {
    var name = $("#st-n").value.trim(), q = parseFloat($("#st-q").value) || 0, r = parseFloat($("#st-r").value) || 0, ex = $("#st-e").value;
    if (name.length < 2) return LK.toast("Naam likho.", "bad"); if (q > 0 && !(r >= 0 && $("#st-r").value)) return LK.toast("Khareed rate likho.", "bad");
    return LK.busy(el, function () { return S.api.stockSave({ name: name, unit: $("#st-u").value, low_at: parseFloat($("#st-l").value) || 0, expiry: ex }).then(function (id) { return q > 0 ? S.api.stockBuy(id, q, r, ex) : null; }); }).then(function () { LK.closeSheet(); LK.toast("Save ho gaya ✓"); return reload(); });
  };
  LK.act.expnew = function () {
    LK.sheet('<h3>➕ Kharch likho</h3><div class="chips flush wrapc">' + ["Store rent", "Delivery boy", "Salary", "Bijli", "Transport", "Packing", "Anya"].map(function (c, i) { return '<button class="chip" data-act="expcat" data-v="' + c + '" aria-pressed="' + (i === 0) + '">' + c + "</button>"; }).join("") + '</div><label class="fld"><span>Rakam ₹</span><input id="ex-a" inputmode="decimal"></label><label class="fld"><span>Note (optional)</span><input id="ex-n" maxlength="100"></label><label class="fld"><span>Tareekh</span><input id="ex-d" type="date" value="' + new Date().toISOString().slice(0, 10) + '"></label><button class="btn" data-act="expok">Save karo</button>');
    LK._exc = "Store rent";
  };
  LK.act.expcat = function (el) { LK._exc = el.dataset.v; el.parentNode.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); }); };
  LK.act.expok = function (el) {
    var a = parseFloat($("#ex-a").value); if (!(a > 0)) return LK.toast("Rakam likho.", "bad");
    return LK.busy(el, function () { return S.api.expAdd(a, LK._exc, $("#ex-n").value, $("#ex-d").value); }).then(function () { LK.closeSheet(); LK.toast("Kharch likh diya ✓"); return reload(); });
  };
  LK.act.expdel = function (el) { return LK.ask("Ye kharch hatana hai?", "Haan, hatao", true).then(function (ok) { if (ok) return S.api.expDel(el.dataset.id).then(reload, LK.fail); }); };
  LK.act.stkbuy = function (el) {
    var s = item(el.dataset.id); P = s.id;
    LK.sheet("<h3>➕ " + esc(s.name) + ' ki khareed</h3><label class="fld"><span>Matra (' + UN[s.unit] + ')</span><input id="sb-q" inputmode="decimal"></label><label class="fld"><span>Rate ₹ per ' + UN[s.unit] + '</span><input id="sb-r" inputmode="decimal" value="' + (+s.buy_rate || "") + '"></label><label class="fld"><span>Expiry date (optional)</span><input id="sb-e" type="date"></label><button class="btn" data-act="stkbuyok">Stock badhao</button>');
  };
  LK.act.stkbuyok = function (el) {
    var q = parseFloat($("#sb-q").value), r = parseFloat($("#sb-r").value);
    if (!(q > 0) || !(r >= 0)) return LK.toast("Matra aur rate sahi likho.", "bad");
    return LK.busy(el, function () { return S.api.stockBuy(P, q, r, $("#sb-e").value); }).then(function () { LK.closeSheet(); LK.toast("Stock badh gaya ✓"); return reload(); });
  };
  LK.act.stkwaste = function (el) {
    var s = item(el.dataset.id); P = s.id;
    LK.sheet("<h3>🗑️ " + esc(s.name) + ' kharab / expire</h3><label class="fld"><span>Kitna kharab hua (' + UN[s.unit] + ')</span><input id="sw-q" inputmode="decimal"></label><label class="fld"><span>Wajah</span><input id="sw-n" maxlength="100" placeholder="Expire / kharab / toot gaya"></label><button class="btn" data-act="stkwasteok">Stock se hatao</button>');
  };
  LK.act.stkwasteok = function (el) {
    var q = parseFloat($("#sw-q").value); if (!(q > 0)) return LK.toast("Matra likho.", "bad");
    return LK.busy(el, function () { return S.api.stockWaste(P, q, $("#sw-n").value); }).then(function () { LK.closeSheet(); LK.toast("Hisaab me likh liya ✓"); return reload(); });
  };
})();
