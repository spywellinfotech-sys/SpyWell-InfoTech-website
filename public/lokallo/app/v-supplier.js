/* Supplier system (Single edition): for shops that buy stock from a third party.
   Shopkeeper: supplier list, kharid order (optionally on WhatsApp), "Maal aaya" adds stock automatically, udhaar / payment hisaab.
   Supplier (Google login by the Gmail the shopkeeper added): sees orders, fills rates, Accept, "Maal bhej diya". */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc;
  var LOADING = '<div class="empty">Ruko…</div>';
  var UN = { kg: "kg", g: "gram", l: "litre", ml: "ml", packet: "packet", piece: "piece" };
  function on() { return !!window.LK_SINGLE; }
  function n(x) { return Math.round((+x || 0) * 100) / 100; }
  var STL = { sent: "📨 Bheja", accepted: "✅ Supplier ne maan liya", delivered: "🚚 Maal bheja gaya", received: "📦 Maal aa gaya", cancelled: "❌ Cancel" };
  function qtxt(i) { return n(i.qty) + " " + (UN[i.unit] || i.unit); }

  S.sup = [];
  LK.isSup = function () { return on() && S.sup && S.sup.length > 0; };
  LK.supLoad = function () {
    if (!on() || !S.api) { S.sup = []; return Promise.resolve(); }
    return S.api.supClaim().catch(function () {}).then(function () { return S.api.supMe(); }).then(function (r) { S.sup = r || []; }, function () { S.sup = []; });
  };

  /* ================= shopkeeper: supplier list ================= */
  V.sups = {
    html: function (e) {
      var d = e.data;
      var h = '<section class="pad"><div class="row"><h2>🚛 Supplier</h2><button class="btn sm" data-act="supadd">➕ Naya</button></div><p class="muted sm">Jinse aap maal kharidte ho unhe yahan jodo. Order bhejo, maal aane par stock apne aap badh jayega aur udhaar ka hisaab rahega.</p>';
      if (!d) return h + LOADING + "</section>";
      if (!d.length) return h + '<div class="empty">Abhi koi supplier nahi hai. ➕ Naya dabao.</div></section>';
      var act_ = d.filter(function (x) { return x.active !== false; }), off_ = d.filter(function (x) { return x.active === false; });
      function sc(s) {
        return '<button class="card ord" data-act="supopen" data-id="' + s.id + '"><div class="row"><b>' + esc(s.name) + "</b><span>" + (+s.balance > 0 ? '<b class="bad">Baaki ' + LK.money(s.balance) + "</b>" : (+s.balance < 0 ? "Advance " + LK.money(-s.balance) : "Hisaab saaf ✓")) + '</span></div><div class="meta">' + (s.phone ? esc(s.phone) + " · " : "") + (s.active === false ? "🚫 Hataya gaya" : (s.email ? (s.claimed ? "✓ App login" : "⏳ Login baaki") : "Bina app")) + (+s.open ? " · " + s.open + " order chal rahe" : "") + "</div></button>";
      }
      return h + act_.map(sc).join("") + (off_.length ? "<h3>Hataye gaye (purana hisaab)</h3>" + off_.map(sc).join("") : "") + "</section>";
    },
    init: function (e) { return S.api.supList().then(function (r) { e.data = r || []; LK.redraw(e); }).catch(LK.fail); }
  };
  LK.act.sups = function () { LK.go("sups"); };
  LK.act.supopen = function (el) { LK.go("sup", { id: el.dataset.id }); };
  LK.act.supadd = function () {
    LK.sheet('<h3>Naya supplier</h3><label class="fld"><span>Naam / firm</span><input id="sp-n" maxlength="60" placeholder="Jaise: Gupta Traders"></label><label class="fld"><span>Mobile</span><input id="sp-p" inputmode="tel" maxlength="15" placeholder="10 digit"></label><label class="fld"><span>Gmail (optional)</span><input id="sp-e" type="email" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="supplier@gmail.com"></label><p class="muted sm">Gmail doge to supplier app mein login karke aapka order dekh sakta hai, rate bhar sakta hai aur "Maal bhej diya" dabayega. Gmail nahi doge to order WhatsApp par bhej sakte ho.</p><div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="supaddgo">Jodo</button></div>');
  };
  LK.act.supaddgo = function (el) {
    var nm = $("#sp-n").value.trim(), p = $("#sp-p").value.trim(), m = $("#sp-e").value.trim();
    if (nm.length < 2) return LK.toast("Naam likho.", "bad");
    if (m && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) return LK.toast("Sahi Gmail likho ya khali chhodo.", "bad");
    return LK.busy(el, function () { return S.api.supAdd(nm, p, m); }).then(function () { LK.closeSheet(); LK.toast("Supplier jud gaya ✓"); V.sups.init(LK.top()); });
  };

  /* ================= shopkeeper: one supplier (orders, hisaab) ================= */
  V.sup = {
    html: function (e) {
      var d = e.data; if (!d) return LOADING;
      var s = d.s || {}, h = '<section class="pad"><div class="row"><h2>' + esc(s.name || "Supplier") + '</h2>' + (s.active === false ? '<span class="muted sm">🚫 Hataya gaya</span>' : '<button class="btn ghost sm danger-t" data-act="suprm" data-id="' + esc(s.id) + '">Hata do</button>') + '</div>';
      h += '<div class="card"><div class="kv"><div><span>Hisaab</span><b>' + (+s.balance > 0 ? "Aapko dena baaki " + LK.money(s.balance) : (+s.balance < 0 ? "Advance " + LK.money(-s.balance) : "Saaf ✓")) + "</b></div>" + (s.phone ? "<div><span>Mobile</span><b>" + esc(s.phone) + "</b></div>" : "") + '</div><div class="btns3">' + (s.phone ? '<a class="btn ghost sm" href="' + LK.tel(s.phone) + '">📞 Call</a>' : "") + '<button class="btn ghost sm" data-act="suppay" data-id="' + esc(s.id) + '">💵 Payment kiya</button></div></div>';
      h += (s.active === false ? "" : '<button class="btn big" data-act="supnew" data-id="' + esc(s.id) + '">📝 Naya kharid order</button>') + "<h3>Orders</h3>";
      h += d.orders.length ? d.orders.map(function (o) {
        var open = ["sent", "accepted", "delivered"].indexOf(o.status) > -1;
        return '<div class="card"><div class="row"><b>#' + esc(o.code) + "</b><span>" + (STL[o.status] || o.status) + '</span></div><div class="meta">' + LK.ago(o.created_at) + (o.status === "received" ? " · Bill " + LK.money(o.total) : "") + "</div>" +
          '<div class="muted sm">' + o.items.map(function (i) { return esc(i.name) + " " + qtxt(i) + (i.rate != null ? " @₹" + n(i.rate) : ""); }).join(" · ") + "</div>" +
          (o.status === "received" && o.items.some(function (i) { return (+i.got_qty || 0) - (+i.ret_qty || 0) > 0; }) ? '<button class="btn ghost sm" data-act="supret" data-id="' + o.id + '">↩️ Maal wapas karo</button>' : "") +
          (open ? '<div class="btns3"><button class="btn" data-act="suprecv" data-id="' + o.id + '">📦 Maal aa gaya</button>' + (o.status !== "delivered" ? '<button class="btn ghost" data-act="supcancel" data-id="' + o.id + '">Cancel</button>' : "") + "</div>" : "") + "</div>";
      }).join("") : '<div class="empty">Abhi koi order nahi.</div>';
      h += "<h3>Maal aur payment ka hisaab</h3>" + (d.ledger.length ? '<div class="card">' + d.ledger.map(function (r) { return '<div class="ri"><b class="nm">' + (r.kind === "maal" ? "📦 Maal #" + esc(r.code) : (r.kind === "ret" ? "↩️ Maal wapas · " + esc(r.note || "") : "💵 Payment" + (r.note ? " · " + esc(r.note) : ""))) + "<small>" + LK.ago(r.at) + "</small></b><b>" + (r.kind === "maal" ? "+" : "−") + LK.money(r.amount) + "</b></div>"; }).join("") + "</div>" : '<div class="empty">Abhi koi entry nahi.</div>');
      return h + "</section>";
    },
    init: function (e) {
      var id = e.params.id;
      return Promise.all([S.api.supList(), S.api.supOrders(id), S.api.supLedger(id)]).then(function (r) {
        e.data = { s: (r[0] || []).filter(function (x) { return x.id === id; })[0] || {}, orders: r[1] || [], ledger: r[2] || [] }; LK.redraw(e);
      }).catch(LK.fail);
    }
  };
  function reload() { var e = LK.top(); return V[e.name].init(e); }
  LK.act.suprm = function (el) {
    var id = el.dataset.id;
    return LK.ask("Is supplier ko hata do? Purana hisaab aur record bana rahega.", "Haan, hata do", true).then(function (ok) { if (!ok) return; return S.api.supRemove(id).then(function () { LK.toast("Hata diya"); LK.back(); V.sups.init(LK.top()); }, LK.fail); });
  };
  LK.act.supcancel = function (el) {
    var id = el.dataset.id;
    return LK.ask("Ye order cancel karna hai?", "Haan, cancel", true).then(function (ok) { if (ok) return S.api.supCancel(id).then(reload, LK.fail); });
  };
  LK.act.suppay = function (el) {
    LK._sid = el.dataset.id;
    LK.sheet('<h3>💵 Supplier ko payment</h3><label class="fld"><span>Rakam (₹)</span><input id="sy-a" inputmode="decimal"></label><label class="fld"><span>Note (optional)</span><input id="sy-n" maxlength="100" placeholder="Jaise: UPI / cash"></label><div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="suppaygo">Save</button></div>');
  };
  LK.act.suppaygo = function (el) {
    var a = parseFloat($("#sy-a").value); if (!(a > 0)) return LK.toast("Rakam likho.", "bad");
    return LK.busy(el, function () { return S.api.supPay(LK._sid, a, $("#sy-n").value); }).then(function () { LK.closeSheet(); LK.toast("Payment likh li ✓"); return reload(); });
  };

  /* ---------- new purchase order ---------- */
  V.supnew = {
    html: function (e) {
      var l = e.stock;
      var h = '<section class="pad"><h2>📝 Naya kharid order</h2><p class="muted sm">Jo saman chahiye uski matra likho. Khali = nahi chahiye. Kam stock wale saman me matra pehle se bhari hai.</p>';
      if (!l) return h + LOADING + "</section>";
      h += '<div class="card">' + (l.length ? l.map(function (s) {
        var low = +s.qty <= +s.low_at, sug = low ? Math.max(Math.ceil((+s.low_at || 0) * 2 - (+s.qty || 0)), 1) : "";
        return '<div class="ri"><b class="nm">' + esc(s.name) + "<small>Stock " + n(s.qty) + " " + (UN[s.unit] || s.unit) + (low ? " · ⚠️ kam" : "") + '</small></b><input class="sq" data-id="' + s.id + '" inputmode="decimal" placeholder="0" value="' + sug + '" style="width:80px"><span class="muted sm">' + (UN[s.unit] || s.unit) + "</span></div>";
      }).join("") : '<p class="muted sm">Stock list khali hai. Neeche naya saman likho.</p>') + "</div>";
      h += '<h3>Aur / naya saman</h3><div class="card">' + [0, 1, 2].map(function (i) {
        return '<div class="ri"><input class="xn" placeholder="Saman ka naam" maxlength="60" style="flex:1"><input class="xq" inputmode="decimal" placeholder="Matra" style="width:70px"><select class="xu">' + Object.keys(UN).map(function (u) { return '<option value="' + u + '">' + UN[u] + "</option>"; }).join("") + "</select></div>";
      }).join("") + "</div>";
      h += '<label class="fld"><span>Note (optional)</span><input id="so-n" maxlength="200" placeholder="Jaise: kal subah tak bhejna"></label><button class="btn big" data-act="supsend">📨 Order bhejo</button></section>';
      return h;
    },
    init: function (e) { return S.api.stockList().then(function (r) { e.stock = r || []; LK.redraw(e); }).catch(LK.fail); }
  };
  LK.act.supnew = function (el) { LK.go("supnew", { id: el.dataset.id }); };
  LK.act.supsend = function (el) {
    var e = LK.top(), items = [];
    document.querySelectorAll("#screen .sq").forEach(function (i) {
      var q = parseFloat(i.value), s = (e.stock || []).filter(function (x) { return x.id === i.dataset.id; })[0];
      if (q > 0 && s) items.push({ stock_id: s.id, name: s.name, unit: s.unit, qty: q });
    });
    document.querySelectorAll("#screen .xn").forEach(function (nm, k) {
      var q = parseFloat(document.querySelectorAll("#screen .xq")[k].value), u = document.querySelectorAll("#screen .xu")[k].value;
      if (nm.value.trim().length >= 2 && q > 0) items.push({ name: nm.value.trim(), unit: u, qty: q });
    });
    if (!items.length) return LK.toast("Kam se kam ek saman ki matra likho.", "bad");
    var sid = e.params.id, note = ($("#so-n").value || "").trim();
    return LK.busy(el, function () { return S.api.supOrderCreate(sid, items, note); }).then(function () {
      LK.toast("Order bhej diya ✓");
      return S.api.supList().then(function (l) {
        var sp = (l || []).filter(function (x) { return x.id === sid; })[0] || {};
        LK.back(); V.sup.init(LK.top());
        if (!sp.phone) return;
        var nm = (LK.brandOf && LK.brandOf().name) || (S.shop && S.shop.name) || "";
        var t = "Namaste, " + nm + " ke liye ye maal chahiye:\n" + items.map(function (i, k) { return (k + 1) + ". " + i.name + " — " + n(i.qty) + " " + (UN[i.unit] || i.unit); }).join("\n") + (note ? "\n" + note : "") + "\nKripya bhej dein. Dhanyavad.";
        return LK.ask("WhatsApp par bhi bhejna hai?", "Haan, bhejo").then(function (ok) { if (ok) window.location.href = LK.wa(sp.phone, t); });
      });
    });
  };

  /* ---------- receive goods ---------- */
  LK.act.suprecv = function (el) {
    var e = LK.top(), o = e.data.orders.filter(function (x) { return x.id === el.dataset.id; })[0]; if (!o) return;
    LK._so = o;
    LK.sheet('<h3>📦 Maal aa gaya — #' + esc(o.code) + '</h3><p class="muted sm">Jo asli matra aur rate aaya wo likho. Stock apne aap badh jayega aur supplier ka hisaab ban jayega. Jo nahi aaya uski matra 0 kardo.</p>' + o.items.map(function (i) {
      return '<div class="be" data-id="' + i.id + '"><div class="row"><b>' + esc(i.name) + '</b><span class="muted sm">Order: ' + qtxt(i) + '</span></div><div class="rr"><input class="gq" inputmode="decimal" value="' + n(i.qty) + '" style="width:80px"><span>' + (UN[i.unit] || i.unit) + ' ×  ₹</span><input class="gr" inputmode="decimal" value="' + (i.rate != null ? n(i.rate) : "") + '" placeholder="rate" style="width:80px"><span>/' + (UN[i.unit] || i.unit) + "</span></div></div>";
    }).join("") + '<div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="suprecvgo">✅ Stock mein jodo</button></div>');
  };
  LK.act.suprecvgo = function (el) {
    var items = [], bad = null, o = LK._so;
    document.querySelectorAll("#modal .be").forEach(function (b) {
      var q = parseFloat(b.querySelector(".gq").value) || 0, r = parseFloat(b.querySelector(".gr").value);
      if (q > 0 && !(r >= 0)) bad = bad || b.querySelector("b").textContent;
      items.push({ id: b.dataset.id, qty: q, rate: isNaN(r) ? 0 : r });
    });
    if (bad) return LK.toast("\"" + bad + "\" ka rate likho.", "bad");
    return LK.busy(el, function () { return S.api.supReceive(o.id, items); }).then(function (t) { LK.closeSheet(); LK.toast("Stock badh gaya ✓ Bill " + LK.money(+t || 0)); return reload(); });
  };

  /* ================= supplier home (supplier's own login) ================= */
  var INB = null, ME = [];
  V.shome = {
    tab: "shome",
    html: function (e) {
      var d = e.data, h = '<section class="pad"><div class="row"><h2>📦 Supplier</h2><span class="muted sm">' + esc(ME.map(function (b) { return b.shop; }).join(", ")) + "</span></div>";
      h += '<div class="card"><div class="kv">' + ME.map(function (m) { return "<div><span>" + esc(m.shop) + " se lena baaki</span><b>" + LK.money(+m.balance || 0) + "</b></div>"; }).join("") + "</div></div>";
      if (!d) return h + LOADING + "</section>";
      var act = d.filter(function (o) { return ["sent", "accepted", "delivered"].indexOf(o.status) > -1; }), done = d.filter(function (o) { return act.indexOf(o) < 0; });
      h += "<h3>Abhi ke orders</h3>";
      h += act.length ? act.map(function (o) {
        var edit = o.status === "sent" || o.status === "accepted";
        return '<div class="card ord" data-oid="' + o.id + '"><div class="row"><b>' + esc(o.shop) + "</b><span>" + (STL[o.status] || o.status) + '</span></div><div class="meta">#' + esc(o.code) + " · " + LK.ago(o.created_at) + (o.note ? " · " + esc(o.note) : "") + "</div>" +
          o.items.map(function (i) {
            return '<div class="be" data-id="' + i.id + '"><div class="row"><b>' + esc(i.name) + '</b><span class="qtx">' + qtxt(i) + "</span></div>" + (edit ? '<div class="rr"><span>₹</span><input class="rin" inputmode="decimal" value="' + (i.rate != null ? n(i.rate) : "") + '" placeholder="rate"><span>/' + (UN[i.unit] || i.unit) + "</span></div>" : (i.rate != null ? '<div class="muted sm">Rate ₹' + n(i.rate) + "/" + (UN[i.unit] || i.unit) + "</div>" : "")) + "</div>";
          }).join("") +
          (o.status === "sent" ? '<button class="btn" data-act="sstep" data-id="' + o.id + '" data-v="accepted">✅ Order maan liya</button>' : "") +
          (edit ? '<button class="btn big" data-act="sstep" data-id="' + o.id + '" data-v="delivered">🚚 Maal bhej diya</button>' : '<p class="muted sm">Dukaandaar maal milte hi "Maal aa gaya" dabayega.</p>') + "</div>";
      }).join("") : '<div class="empty">Abhi koi order nahi. Naya order aate hi yahan dikhega 🔔</div>';
      if (done.length) h += "<h3>Purane orders (30 din)</h3>" + done.map(function (o) { return '<div class="card"><div class="row"><b>' + esc(o.shop) + "</b><span>#" + esc(o.code) + "</span></div><div class=\"meta\">" + (STL[o.status] || o.status) + " · " + LK.ago(o.updated_at) + (o.status === "received" ? " · Bill " + LK.money(o.total) : "") + "</div></div>"; }).join("");
      h += '<div class="links"><button class="btn ghost" data-act="tomode" data-v="customer">🛍️ Customer mode mein jao</button><button class="btn ghost danger-t" data-act="logout">Logout</button></div></section>';
      return h;
    },
    init: function (e, quiet) {
      if (quiet && document.activeElement && document.activeElement.tagName === "INPUT") return;
      return Promise.all([S.api.supInbox(), S.api.supMe()]).then(function (r) {
        var sig = JSON.stringify(r); INB = r[0] || []; ME = r[1] || []; S.sup = ME;
        if (e.data && e.sig === sig) return;
        e.sig = sig; e.data = INB; LK.redraw(e);
      }).catch(function (x) { if (!quiet) LK.fail(x); });
    }
  };
  LK.act.sstep = function (el) {
    var id = el.dataset.id, st = el.dataset.v, card = document.querySelector('#screen [data-oid="' + id + '"]'), rates = [];
    if (card) card.querySelectorAll(".be").forEach(function (b) { var r = b.querySelector(".rin"); if (r && r.value !== "") rates.push({ id: b.dataset.id, rate: r.value }); });
    return LK.busy(el, function () { return S.api.supStep(id, st, rates); }).then(function () { LK.toast(st === "delivered" ? "Dukaandaar ko bata diya ✓" : "Order maan liya ✓"); return V.shome.init(LK.top()); });
  };
  LK.supPoll = function (first) {
    if (!LK.isSup() || S.demo) return;
    S.api.supInbox().then(function (list) {
      var seen = S.seen || {};
      (list || []).forEach(function (o) {
        var k = "p" + o.id;
        if (!seen[k]) { if (!first && o.status === "sent") LK.notify("Naya order aaya 📦", (o.shop || "") + " · #" + o.code); }
        seen[k] = o.status;
      });
    }).catch(function () {});
  };
})();
