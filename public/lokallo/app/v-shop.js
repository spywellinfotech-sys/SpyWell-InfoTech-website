/* Shopkeeper side: orders and bills, rates, catalog picker, ads, report. Plus the admin panel. */
(function () {
  "use strict";
  var LK = window.LK, S = LK.S, V = LK.views, $ = LK.$, esc = LK.esc, API = window.API;
  var LOADING = '<div class="empty">Ruko…</div>';
  function activeInput() { var a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && $("#screen").contains(a)); }
  function num(v) { var n = parseFloat(String(v == null ? "" : v).replace(",", ".")); return isFinite(n) ? n : NaN; }
  function noShop() { return '<section class="pad"><div class="empty">Pehle apni dukaan register karo.<br><button class="btn sm" data-act="regshop">Dukaan register karo</button></div></section>'; }

  /* ================= orders list ================= */
  var FILTERS = [["all", "Sab"], ["placed", "Naye"], ["bill_sent", "Bill bheja"], ["run", "Chal rahe"], ["done", "Poore"]];
  function inFilter(o, f) {
    if (f === "all") return true; if (f === "run") return ["confirmed", "ready", "out_for_delivery"].indexOf(o.status) > -1;
    if (f === "done") return ["completed", "cancelled", "rejected"].indexOf(o.status) > -1; return o.status === f;
  }
  V.sorders = {
    tab: "sorders",
    html: function (e) {
      if (!S.shop) return noShop();
      var d = e.data, f = S.sfilter || "all";
      var h = '<section class="pad">' + (LK.subBanner ? LK.subBanner() : "") + LK.freeBanner("Naye dukaandaar") + '<div class="row"><h2>Orders</h2><span class="btns2"><button class="btn ghost sm" data-act="ldlist">🎁 Lucky Draw</button>' + '<button class="btn ghost sm" data-act="stock">📦 Stock</button>' + (LK.dboyOn && LK.dboyOn() ? '<button class="btn ghost sm" data-act="dboys">🚚 Delivery boy</button>' : "") + '<button class="btn ghost sm" data-act="munafa">📊 Munafa</button>' + '</span></div><div class="chips flush">' + FILTERS.map(function (x) { return '<button class="chip" data-act="sfilter" data-v="' + x[0] + '" aria-pressed="' + (f === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div>";
      if (!d) return h + LOADING + "</section>";
      var list = d.filter(function (o) { return inFilter(o, f); });
      if (!list.length) return h + '<div class="empty">' + (d.length ? "Is filter mein koi order nahi." : "Abhi koi order nahi aaya. Customer ko apni dukaan ke baare mein batao 📣") + "</div></section>";
      return h + '<div class="list">' + list.map(function (o) {
        var hot = o.status === "placed" || o.has_comment;
        return '<button class="card ord' + (hot ? " hot" : "") + '" data-act="openso" data-id="' + o.id + '"><div class="row"><b class="cn">' + cav(o) + esc(o.customer_name || "Customer") + "</b>" + LK.badge(o.status, true) + '</div><div class="meta">#' + esc(o.code) + " · " + LK.ago(o.created_at) + (o.subtotal > 0 ? " · <b>" + LK.money(o.total || o.subtotal) + "</b>" : "") + "</div>" +
          (o.has_comment ? '<div class="cta">💬 Customer ne rate par comment kiya</div>' : "") + (o.customer_paid && o.status !== "completed" ? '<div class="cta ok">📲 UPI se pay kiya</div>' : "") + "</button>";
      }).join("") + "</div></section>";
    },
    init: function (e, quiet) {
      if (!S.shop || (quiet && activeInput())) return;
      return S.api.shopOrders(S.shop.id).then(function (r) { e.data = r || []; LK.redraw(e); }).catch(function (x) { if (!quiet) LK.fail(x); });
    }
  };
  LK.act.sfilter = function (el) { S.sfilter = el.dataset.v; LK.redraw(LK.top()); };
  LK.act.openso = function (el) { LK.go("sorder", { id: el.dataset.id }); };

  /* ================= one order: bill editor and status ================= */
  function defRate(e, it) {
    if (it.rate != null) return { rate: it.rate, unit: it.rate_unit || LK.FAM[it.qty_unit][0] };
    var fam = LK.FAM[it.qty_unit] || [it.qty_unit], key = String(it.name).trim().toLowerCase();
    var si = (e.rates || []).filter(function (r) { return String(r.name).trim().toLowerCase() === key; })[0];
    if (si && fam.indexOf(si.unit) > -1) return { rate: si.rate, unit: si.unit };
    return { rate: "", unit: fam[0] };
  }
  function billRow(e, it) {
    var d = defRate(e, it), fam = LK.FAM[it.qty_unit] || [it.qty_unit];
    var units = fam.map(function (u) { return '<option value="' + u + '"' + (u === d.unit ? " selected" : "") + ">" + LK.UNAME[u] + "</option>"; }).join("");
    return '<div class="be' + (it.removed ? " rm" : "") + '" data-id="' + it.id + '" data-q="' + it.qty + '" data-u="' + it.qty_unit + '" data-name="' + esc(it.name) + '">' +
      '<div class="row"><b>' + esc(it.name) + '</b><span class="qtx">' + LK.qty(it.qty, it.qty_unit) + '</span><button class="rmb" data-act="brm" aria-pressed="' + !!it.removed + '">Nahi hai</button></div>' +
      '<div class="rr"><span>₹</span><input class="rin" data-in="rcalc" inputmode="decimal" value="' + esc(d.rate) + '" placeholder="rate"><span>/</span><select class="run" data-in="rcalc">' + units + '</select><span>=</span><b class="amt">—</b></div>' +
      (it.customer_comment ? '<div class="cm me">Customer: ' + esc(it.customer_comment) + '</div><input class="rep" placeholder="Jawab likho (optional)" value="' + esc(it.shop_reply || "") + '" maxlength="200">' : "") + "</div>";
  }
  function recalc() {
    var sub = 0, f = LK.form, sh = S.shop || {};
    document.querySelectorAll("#screen .be").forEach(function (b) {
      var amt = b.querySelector(".amt");
      if (b.classList.contains("rm")) { amt.textContent = "—"; return; }
      var r = num(b.querySelector(".rin").value), q = API.conv(+b.dataset.q, b.dataset.u, b.querySelector(".run").value);
      if (isFinite(r) && q != null) { var a = Math.round(q * r * 100) / 100; sub += a; amt.textContent = LK.money(a); } else amt.textContent = "₹ —";
    });
    if (!f.dtouched) { var auto = (sh.free_above && sub >= sh.free_above) ? 0 : (+sh.delivery_charge || 0); f.dcharge = auto; var di = $("#dch"); if (di) di.value = auto; }
    var s = $("#bsub"); if (s) s.textContent = LK.money(sub);
    var n = $("#bnote2"); if (n) n.textContent = f.dok ? "Delivery lene par customer ka total: " + LK.money(sub + (+f.dcharge || 0)) : "";
  }
  LK.inp.rcalc = recalc;
  LK.inp.dch = function (el) { LK.form.dcharge = el.value; LK.form.dtouched = true; recalc(); };
  LK.act.brm = function (el) { var b = el.closest(".be"); var on = !b.classList.contains("rm"); b.classList.toggle("rm", on); el.setAttribute("aria-pressed", on); recalc(); };
  LK.act.btog = function (el) { var k = el.dataset.k; LK.form[k] = !LK.form[k]; el.setAttribute("aria-pressed", !!LK.form[k]); recalc(); };

    function cav(o, sz) {
    var n = (o.customer_name || "?").trim().charAt(0).toUpperCase();
    return '<span class="cav' + (sz ? " " + sz : "") + '">' + (o.customer_avatar ? '<img src="' + esc(LK.img(o.customer_avatar)) + '" alt="">' : esc(n)) + "</span>";
  }
  function custCard(o) {
    return '<div class="card"><div class="row"><b class="cn">' + cav(o, "lg") + esc(o.customer_name) + '</b><span class="muted">' + esc(o.customer_phone) + '</span></div><p class="sm">' + esc(o.address || "") + "</p>" + (o.note ? '<p class="cm me">Note: ' + esc(o.note) + "</p>" : "") +
      '<div class="btns3"><a class="btn ghost sm" href="' + LK.tel(o.customer_phone) + '">📞 Call</a><a class="btn ghost sm" href="' + LK.wa(o.customer_phone, "Namaste, aapka LoKalLo order #" + o.code) + '">💬 WhatsApp</a></div></div>';
  }
  function viewLines(d) {
    return d.items.map(function (it) {
      var cm = (it.customer_comment ? '<div class="cm me">Customer: ' + esc(it.customer_comment) + "</div>" : "") + (it.shop_reply ? '<div class="cm shop">Aap: ' + esc(it.shop_reply) + "</div>" : "");
      if (it.removed) return '<div class="bl gone"><span>' + esc(it.name) + " <small>" + LK.qty(it.qty, it.qty_unit) + "</small></span><b>Nahi hai</b></div>" + cm;
      return '<div class="bl"><span>' + esc(it.name) + " <small>" + LK.qty(it.qty, it.qty_unit) + "</small>" + (it.rate != null ? "<small>" + LK.rate(it.rate, it.rate_unit) + "</small>" : "") + "</span><b>" + (it.amount != null ? LK.money(it.amount) : "—") + "</b></div>" + cm;
    }).join("");
  }
  function evtLabel(ev) { return ({ placed: "Order aaya", bill_sent: "Aapne bill bheja", bill_updated: "Bill update kiya", comment: "Customer ne comment kiya", confirmed: "Customer ne confirm kiya", ready: "Pickup ready", out_for_delivery: "Delivery pe nikla", completed: "Order poora hua", customer_paid: "Customer ne UPI se pay kiya", refunded: "Refund note hua", cancelled: "Customer ne cancel kiya", rejected: "Aapne mana kiya", returned: "Saman return hua" })[ev] || (LK.EVT_DBOY || {})[ev] || ev; }
  V.sorder = {
    tab: "sorders",
    html: function (e) {
      var d = e.data; if (!d) return LOADING; var o = d.o, f = LK.form, h = "";
      h += '<section class="pad"><div class="row"><h2>' + esc(o.customer_name) + "</h2>" + LK.badge(o.status, true) + '</div><p class="muted">Order #' + esc(o.code) + " · " + LK.ago(o.created_at) + "</p>" + custCard(o);
      if (o.status === "placed" || o.status === "bill_sent") {
        h += '<div class="card"><h3>' + (o.status === "placed" ? "Rate bharo aur bill bhejo" : "Bill (customer ke jawab ka intezaar)") + "</h3>" + d.items.map(function (it) { return billRow(e, it); }).join("") +
          '<div class="tot"><span>Saman ka total</span><b id="bsub">₹0</b></div>' +
          '<div class="fld"><span>Customer ko kya option dena hai?</span><div class="opts"><button type="button" class="opt" data-act="btog" data-k="dok" aria-pressed="' + !!f.dok + '"><b>🚚 Home delivery</b></button><button type="button" class="opt" data-act="btog" data-k="pok" aria-pressed="' + !!f.pok + '"><b>🚶 Pickup</b></button></div></div>' +
          '<label class="fld"><span>Delivery charge (₹)</span><input id="dch" data-in="dch" inputmode="numeric" value="' + esc(f.dcharge) + '"></label><p class="muted sm" id="bnote2"></p>' +
          '<label class="fld"><span>Bill par note (optional)</span><input data-in="f" data-k="bnote" maxlength="300" value="' + esc(f.bnote || "") + '" placeholder="Jaise: aaj aata kam hai"></label>' +
          '<button class="btn big" data-act="sendbill">' + (o.status === "placed" ? "📤 Bill bhejo" : "📤 Bill update karke bhejo") + '</button><button class="btn ghost danger-t" data-act="rejectorder">Order mana karo</button></div>';
      } else {
        h += '<div class="card bill"><h3>Bill</h3>' + viewLines(d) + '</div>' + '<div class="tot"><span>Customer se lena hai</span><b>' + LK.money((+o.total || 0) - (+o.customer_fee || 0)) + "</b></div>" + (+o.shop_fee > 0 ? '<p class="muted sm">Aapki platform fee: ' + LK.money(o.shop_fee) + " (customer apni fee LoKalLo ko alag se deta hai)</p>" : "");
        if (["confirmed", "ready", "out_for_delivery", "completed"].indexOf(o.status) > -1) {
          h += '<div class="card"><div class="kv"><div><span>Tarika</span><b>' + (o.fulfilment === "delivery" ? "🚚 Ghar tak delivery" : "🚶 Pickup") + "</b></div><div><span>Payment</span><b>" + (o.payment_mode === "upi" ? "UPI" : "Cash") + "</b></div>" + (o.fulfilment === "delivery" ? "<div><span>Pata</span><b>" + esc(o.address || "") + "</b></div>" : "") +
            (o.payment_mode === "upi" ? "<div><span>UPI status</span><b>" + (o.upi_verified ? "✅ Aapne check kiya — paisa aa gaya" : o.customer_paid ? "Customer ne bataya ki pay kiya (check karo)" : "Abhi pay nahi kiya") + "</b></div>" : "") + (o.delivered_by ? "<div><span>Delivery</span><b>" + esc(o.delivered_by) + "</b></div>" : "") + "</div></div>";
          if (o.fulfilment === "delivery") h += o.delivery_lat != null ? '<a class="btn" href="https://www.google.com/maps/dir/?api=1&destination=' + o.delivery_lat + "," + o.delivery_lng + '">🧭 Delivery location par chalo (Map)</a>' : '<a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(o.address || "") + '">🧭 Pate se Map me dhoondo</a>';
          if (o.payment_mode === "upi" && LK.commOn && LK.commOn()) h += o.upi_verified ? '<button class="btn ghost" data-act="upiok" data-v="0" data-id="' + o.id + '">UPI check hatao</button>' : '<button class="btn" data-act="upiok" data-v="1" data-id="' + o.id + '">✅ Mere bank/UPI me paisa aa gaya</button>';
          if (o.refund_amount > 0) h += '<div class="card warn-c">Refund note: <b>' + LK.money(o.refund_amount) + "</b> " + esc(o.refund_note || "") + "</div>";
          if (o.status !== "completed") {
            if (LK.dboyBox) h += LK.dboyBox(e, o);
            if (LK.dboyCard && d.dboy) h += LK.dboyCard(d.dboy, o, true);
            if (o.status === "confirmed" && o.fulfilment === "delivery") h += '<label class="fld"><span>Delivery kaun karega? (optional)</span><input data-in="f" data-k="by" placeholder="Jaise: Raju" value="' + esc(f.by || "") + '"></label><button class="btn" data-act="setst" data-v="out_for_delivery">🚚 Delivery pe nikla</button>';
            if (o.status === "confirmed" && o.fulfilment === "pickup") h += '<button class="btn" data-act="setst" data-v="ready">🛍️ Pickup ke liye ready</button>';
            h += '<button type="button" class="opt wide" data-act="btog" data-k="cash" aria-pressed="' + !!f.cash + '"><b>💰 Paisa mil gaya</b></button><button class="btn big" data-act="setst" data-v="completed">✅ Order poora hua</button>';
          }
          if (o.status === "completed" && LK.retOn && LK.retOn()) h += '<button class="btn ghost" data-act="custret">↩️ Saman return (wapas) darj karo</button>';
          h += '<button class="btn ghost" data-act="refundopen">Refund note karo</button>';
        } else h += o.cancel_reason ? '<p class="muted">Kaaran: ' + esc(o.cancel_reason) + "</p>" : "";
      }
      h += '<div class="btns3"><button class="btn ghost sm" data-act="printbill">🖨️ Bill print karo</button><button class="btn ghost sm" data-act="printerset">⚙️ Printer chuno</button></div>';
      h += '<h3>Order ka safar</h3><div class="tl">' + d.events.map(function (ev) { return "<div><i></i><span>" + evtLabel(ev.event) + "</span><small>" + LK.ago(ev.at) + "</small></div>"; }).join("") + "</div></section>";
      return h;
    },
    init: function (e, quiet) {
      if (!S.shop || (quiet && activeInput())) return;
      return S.api.order(e.params.id).then(function (x) { return Promise.all([x, e.rates ? Promise.resolve(e.rates) : S.api.shopItems(S.shop.id).catch(function () { return []; }), LK.dboyOn && LK.dboyOn() ? S.api.dboyList().catch(function () { return []; }) : Promise.resolve([]), LK.dboyOn && LK.dboyOn() && x.o.dboy_id && x.o.status === "out_for_delivery" ? S.api.orderDboy(x.o.id).catch(function () { return null; }) : Promise.resolve(null)]); }).then(function (r) {
        var o = r[0].o, di = r[3], sig = [o.status, o.bill_version, o.has_comment, o.customer_paid, o.upi_verified, r[0].events.length, o.dboy_id, (r[2] || []).length, di ? di.at + "|" + di.lat : ""].join("|");
        e.rates = r[1]; e.boys = r[2] || [];
        if (e.data && e.sig === sig) return;
        e.sig = sig; e.data = { o: o, items: r[0].items || [], events: r[0].events || [], dboy: di };
        var fk = o.id + ":" + o.bill_version + ":" + o.status;
        if (e.fk !== fk) {
          e.fk = fk; var sh = S.shop;
          LK.form = { dok: o.bill_version > 0 ? !!o.delivery_ok : true, pok: o.bill_version > 0 ? !!o.pickup_ok : true, dcharge: o.bill_version > 0 ? o.delivery_charge : (sh.delivery_charge || 0), dtouched: o.bill_version > 0, bnote: o.bill_note || "", by: "", cash: o.payment_mode === "upi" && o.customer_paid };
        }
        LK.redraw(e);
      }).catch(function (x) { if (!quiet) LK.fail(x); });
    },
    after: function () { recalc(); }
  };
  LK.act.sendbill = function (el) {
    var e = LK.top(), f = LK.form, items = [], bad = null;
    document.querySelectorAll("#screen .be").forEach(function (b) {
      var rep = b.querySelector(".rep"), it = { id: b.dataset.id };
      if (rep) it.shop_reply = rep.value.trim();
      if (b.classList.contains("rm")) { it.removed = true; items.push(it); return; }
      var r = num(b.querySelector(".rin").value); if (!(r >= 0)) { bad = bad || b.dataset.name; return; }
      it.rate = r; it.rate_unit = b.querySelector(".run").value; it.removed = false; items.push(it);
    });
    if (bad) return LK.toast("\"" + bad + "\" ka rate bharo, ya \"Nahi hai\" dabao.", "bad");
    if (items.every(function (i) { return i.removed; })) return LK.toast("Kam se kam ek saman ka rate bharo.", "bad");
    if (!f.dok && !f.pok) return LK.toast("Home delivery ya pickup mein se ek chuno.", "bad");
    return LK.busy(el, function () { return S.api.sendBill(e.params.id, items, !!f.dok, !!f.pok, Math.round(+f.dcharge || 0), f.bnote || ""); }).then(function () { LK.toast("Bill customer ko bhej diya ✓"); e.sig = ""; e.fk = ""; return V.sorder.init(e); });
  };
  LK.act.rejectorder = function () {
    var e = LK.top();
    return LK.ask("Ye order mana karna hai? Customer ko bata diya jayega.", "Haan, mana karo", true).then(function (ok) { if (!ok) return; return S.api.cancel(e.params.id, "").then(function () { LK.toast("Order mana kar diya"); e.sig = ""; e.fk = ""; return V.sorder.init(e); }); });
  };
  LK.act.setst = function (el) {
    var e = LK.top(), f = LK.form, st = el.dataset.v;
    return LK.busy(el, function () { return S.api.setStatus(e.params.id, st, f.by ? f.by.trim() : null, st === "completed" ? !!f.cash : null); }).then(function () { LK.toast("Status badal gaya ✓"); e.sig = ""; e.fk = ""; return V.sorder.init(e); });
  };
  LK.act.refundopen = function () {
    LK.sheet('<h3>Refund note karo</h3><p class="muted sm">Paisa customer ko aap seedha lauta do. Yahan sirf hisaab ke liye likho.</p><label class="fld"><span>Raqam (₹)</span><input id="rf-a" inputmode="decimal"></label><label class="fld"><span>Kaaran</span><input id="rf-n" placeholder="Jaise: rate galat laga tha" maxlength="200"></label><div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band karo</button><button class="btn" data-act="refundgo">Save</button></div>');
  };
  LK.act.refundgo = function (el) {
    var a = num($("#rf-a").value), n = $("#rf-n").value, e = LK.top(); if (!(a > 0)) return LK.toast("Raqam likho.", "bad");
    return LK.busy(el, function () { return S.api.refund(e.params.id, a, n); }).then(function () { LK.closeSheet(); LK.toast("Refund note ho gaya ✓"); e.sig = ""; return V.sorder.init(e); });
  };


  /* ================= Bluetooth receipt printer (ESC/POS) ================= */
  function prefs() { try { return JSON.parse(localStorage.getItem("lk-printer") || "null") || { w: 32 }; } catch (e) { return { w: 32 }; } }
  function savePrefs(p) { try { localStorage.setItem("lk-printer", JSON.stringify(p)); } catch (e) {} }
  function receipt(d, W) {
    var o = d.o, sh = S.shop || {}, out = [];
    function raw() { for (var i = 0; i < arguments.length; i++) out.push(arguments[i]); }
    function clean(s) { return String(s == null ? "" : s).replace(/₹/g, "Rs ").replace(/[^\x20-\x7E]/g, "?"); }
    function txt(s) { s = clean(s); for (var i = 0; i < s.length; i++) out.push(s.charCodeAt(i)); }
    function line(s) { txt(s); raw(10); }
    function sep() { line(new Array(W + 1).join("-")); }
    function two(l, r) { l = clean(l); r = clean(r); var gap = W - l.length - r.length; if (gap < 1) { l = l.slice(0, Math.max(1, W - r.length - 1)); gap = W - l.length - r.length; } line(l + new Array(Math.max(gap, 1) + 1).join(" ") + r); }
    function wrap(s) { s = clean(s); while (s.length > W) { line(s.slice(0, W)); s = s.slice(W); } if (s) line(s); }
    function money(n) { var r = Math.round((+n || 0) * 100) / 100; return "Rs " + (r % 1 === 0 ? r : r.toFixed(2)); }
    var nm = clean(sh.name || "LoKalLo"); raw(27, 64, 27, 97, 1, 27, 69, 1, 29, 33, nm.length <= W / 2 ? 17 : 0); wrap(nm);
    raw(29, 33, 0, 27, 69, 0);
    if (sh.address) wrap(sh.address); if (sh.phone) line("Ph: " + sh.phone);
    raw(27, 97, 0); sep();
    var dt = new Date(o.created_at || Date.now());
    two("Order #" + o.code, ("0" + dt.getDate()).slice(-2) + "/" + ("0" + (dt.getMonth() + 1)).slice(-2) + " " + ("0" + dt.getHours()).slice(-2) + ":" + ("0" + dt.getMinutes()).slice(-2));
    wrap("Customer: " + (o.customer_name || "")); if (o.customer_phone) line("Ph: " + o.customer_phone);
    if (o.fulfilment === "delivery" && o.address) wrap("Addr: " + o.address);
    sep();
    d.items.filter(function (it) { return !it.removed; }).forEach(function (it) {
      wrap(it.name);
      two("  " + LK.qty(it.qty, it.qty_unit) + (it.rate != null ? " x " + LK.rate(it.rate, it.rate_unit) : ""), it.amount != null ? money(it.amount) : "-");
    });
    sep();
    two("Saman", money(o.subtotal));
    if (o.fulfilment === "delivery" && +o.delivery_charge > 0) two("Delivery", money(o.delivery_charge));
    raw(27, 69, 1, 29, 33, 1); two("TOTAL", money(o.total > 0 ? o.total - (+o.customer_fee || 0) : o.subtotal)); raw(29, 33, 0, 27, 69, 0);
    if (o.fulfilment) line((o.fulfilment === "delivery" ? "Home delivery" : "Pickup") + " | " + (o.payment_mode === "upi" ? "UPI" : "Cash"));
    if (o.bill_note) wrap("Note: " + o.bill_note);
    sep(); raw(27, 97, 1); line("Dhanyavaad! Phir aana"); line("LoKalLo"); raw(10, 10, 10, 27, 97, 0);
    return out;
  }
  function b64(bytes) { var s = ""; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s); }
  function printersOr(cb) {
    if (!window.LkNative || !LkNative.printers) return LK.toast("Print phone ke LoKalLo app mein chalta hai.", "bad");
    var r = LkNative.printers();
    if (r === "need_perm") return LK.toast("Bluetooth ki permission do, phir dobara dabao.", "bad");
    if (r === "no_bt") return LK.toast("Is phone mein Bluetooth nahi hai.", "bad");
    if (r === "bt_off") return LK.toast("Bluetooth chalu karo.", "bad");
    if (r === "error") return LK.toast("Printer list nahi mili. Dobara koshish karo.", "bad");
    var list = []; try { list = JSON.parse(r); } catch (e) {}
    cb(list);
  }
  function printerSheet(after) {
    printersOr(function (list) {
      var p = prefs();
      LK.sheet("<h3>Printer chuno</h3><p class=\"muted sm\">Pehle printer ko phone ki Bluetooth settings mein pair karo, phir yahan chuno.</p>" +
        '<div class="seg" style="margin:8px 0"><button data-act="pw" data-v="32" aria-pressed="' + (p.w !== 48) + '">58 mm (chhota)</button><button data-act="pw" data-v="48" aria-pressed="' + (p.w === 48) + '">80 mm (bada)</button></div>' +
        (list.length ? list.map(function (d) { return '<button class="opt wide" data-act="pickprinter" data-addr="' + esc(d.addr) + '" data-name="' + esc(d.name) + '" data-after="' + (after ? 1 : 0) + '"><b>🖨️ ' + esc(d.name) + "</b><small>" + esc(d.addr) + "</small></button>"; }).join("") : '<div class="empty">Koi paired printer nahi mila. Phone Settings → Bluetooth mein printer pair karo.</div>') +
        '<button class="btn ghost" data-act="mclose" data-v="0">Band karo</button>');
    });
  }
  LK.act.pw = function (el) { var p = prefs(); p.w = +el.dataset.v; savePrefs(p); el.parentNode.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b === el); }); };
  LK.act.pickprinter = function (el) { var p = prefs(); p.addr = el.dataset.addr; p.name = el.dataset.name; savePrefs(p); var go = el.dataset.after === "1"; LK.closeSheet(); LK.toast("Printer chun liya ✓"); if (go) LK.act.printbill(); };
  LK.act.printerset = function () { printerSheet(false); };
  LK.act.printbill = function () {
    var e = LK.top(), d = e && e.data; if (!d || !d.o) return;
    var p = prefs(); if (!p.addr) return printerSheet(true);
    if (!window.LkNative || !LkNative.print) return LK.toast("Print phone ke LoKalLo app mein chalta hai.", "bad");
    LK.toast("Print ho raha hai…");
    window.__lkPrint = function (ok, msg) { LK.toast(ok ? "Bill print ho gaya ✓" : "Print nahi hua. Printer on aur paas hai? Dobara printer chuno.", ok ? "" : "bad"); if (!ok && window.console) console.error(msg); };
    LkNative.print(p.addr, b64(receipt(d, p.w === 48 ? 48 : 32)));
  };

  /* ================= rates ================= */
  V.rates = {
    tab: "rates",
    html: function (e) {
      if (!S.shop) return noShop(); var d = e.data;
      var h = '<section class="pad"><div class="row"><h2>Saman aur rate</h2><button class="btn sm" data-act="topick">＋ Saman jodo</button></div><p class="muted sm">Yahan rate ek baar daalo. Bill banate waqt rate apne aap bhar jayega (aap badal sakte ho).</p>';
      if (!d) return h + LOADING + "</section>";
      if (!d.length) return h + '<div class="empty">Abhi koi saman nahi.<br><button class="btn" data-act="topick">＋ Saman jodo</button></div></section>';
      return h + '<div class="card rl2">' + d.map(function (it) {
        var us = (LK.KIND_UNITS[{ kg: "weight", g: "weight", l: "volume", ml: "volume", packet: "packet", piece: "piece" }[it.unit]] || LK.KIND_UNITS.any).map(function (u) { return '<option value="' + u + '"' + (u === it.unit ? " selected" : "") + ">" + LK.UNAME[u] + "</option>"; }).join("");
        return '<div class="ri' + (it.available ? "" : " off") + '" data-id="' + it.id + '"><b class="nm">' + esc(it.name) + '</b><span>₹</span><input data-in="rrate" data-id="' + it.id + '" inputmode="decimal" value="' + it.rate + '"><span>/</span><select data-in="runit" data-id="' + it.id + '">' + us + '</select><button class="sw" data-act="rstock" data-id="' + it.id + '" aria-pressed="' + it.available + '" title="Stock mein hai">' + (it.available ? "Hai" : "Khatam") + '</button><button class="x" data-act="rdel" data-id="' + it.id + '" aria-label="Hatao">✕</button></div>';
      }).join("") + "</div></section>";
    },
    init: function (e) { if (!S.shop) return; return S.api.shopItems(S.shop.id).then(function (r) { e.data = r || []; LK.redraw(e); }).catch(LK.fail); }
  };
  var saveT = {};
  function itemOf(id) { return (LK.top().data || []).filter(function (x) { return x.id === id; })[0]; }
  function saveItemLater(id) {
    clearTimeout(saveT[id]);
    saveT[id] = setTimeout(function () {
      var it = itemOf(id); if (!it || !(+it.rate >= 0)) return;
      S.api.saveItem(it).then(function () { LK.toast("Rate save ✓"); }, LK.fail);
    }, 700);
  }
  LK.inp.rrate = function (el) { var it = itemOf(el.dataset.id); if (!it) return; var r = num(el.value); if (isFinite(r)) { it.rate = r; saveItemLater(it.id); } };
  LK.inp.runit = function (el) { var it = itemOf(el.dataset.id); if (!it) return; it.unit = el.value; saveItemLater(it.id); };
  LK.act.rstock = function (el) { var it = itemOf(el.dataset.id); if (!it) return; it.available = !it.available; LK.redraw(LK.top()); return S.api.saveItem(it); };
  LK.act.rdel = function (el) {
    var it = itemOf(el.dataset.id), e = LK.top(); if (!it) return;
    return LK.ask("\"" + it.name + "\" hata dein?", "Haan, hatao", true).then(function (ok) { if (!ok) return; return S.api.deleteItem(it.id).then(function () { e.data = e.data.filter(function (x) { return x.id !== it.id; }); LK.redraw(e); }); });
  };
  LK.act.topick = function () { LK.go("pick"); };

  /* ================= pick items from the master list ================= */
  var DEFU = { weight: "kg", volume: "l", packet: "packet", piece: "piece" };
  function pickRows(e) {
    var q = (e.q || "").trim().toLowerCase(), have = e.have || {};
    var list = (e.cat || []).filter(function (c) { return q ? (c.name.toLowerCase().indexOf(q) > -1 || (c.name_en || "").toLowerCase().indexOf(q) > -1) : (c.shop_type + "|" + c.category) === e.cur; });
    return list.slice(0, 80).map(function (c) {
      var k = "c" + c.id, s = e.sel[k], had = have[c.name.toLowerCase()];
      if (had) return '<div class="it"><div class="itl"><span class="cb on">✓</span><span class="nm">' + esc(c.name) + "<small>Pehle se list mein hai</small></span></div></div>";
      var units = (LK.KIND_UNITS[c.unit_kind] || LK.KIND_UNITS.any).map(function (u) { return '<option value="' + u + '"' + (s && u === s.unit ? " selected" : "") + ">" + LK.UNAME[u] + "</option>"; }).join("");
      return '<div class="it' + (s ? " on" : "") + '"><button class="itl" data-act="ptick" data-k="' + k + '" aria-pressed="' + !!s + '"><span class="cb">✓</span><span class="nm">' + esc(c.name) + (c.name_en && c.name_en !== c.name ? "<small>" + esc(c.name_en) + "</small>" : "") + "</span></button>" +
        (s ? '<div class="rr"><span>₹</span><input data-in="prate" data-k="' + k + '" inputmode="decimal" value="' + esc(s.rate) + '" placeholder="rate"><span>/</span><select data-in="punit" data-k="' + k + '">' + units + "</select></div>" : "") + "</div>";
    }).join("") || '<div class="empty">Nahi mila.</div>';
  }
  function pickRefresh(e) {
    var a = $("#plist"), b = $("#pchips"), c = $("#pbar"), n = Object.keys(e.sel).length;
    if (a) a.innerHTML = pickRows(e);
    if (b) b.innerHTML = (e.cats || []).map(function (x) { return '<button class="chip" data-act="pcat" data-v="' + esc(x.key) + '" aria-pressed="' + (e.cur === x.key && !e.q) + '">' + esc(x.label) + "</button>"; }).join("");
    if (c) c.innerHTML = n ? "<span><b>" + n + '</b> saman</span><button class="btn" data-act="psave">Save karo</button>' : '<span class="muted">Saman tick karke rate daalo</span>';
  }
  V.pick = {
    tab: "rates",
    html: function (e) {
      if (!e.cat) return LOADING;
      return '<section><div class="pad"><h2>Saman jodo</h2><p class="muted sm">Tick karo aur rate daalo.</p><div class="search"><input data-in="psearch" placeholder="Saman dhoondho" value="' + esc(e.q || "") + '"></div>' +
        '<div class="custom"><b>Apna saman (list mein nahi hai)</b><div class="row2"><input id="pn" placeholder="Naam"><input id="pr" placeholder="₹ rate" inputmode="decimal"><select id="pu"><option value="kg">kg</option><option value="l">L</option><option value="packet">packet</option><option value="piece">pcs</option></select><button class="btn sm" data-act="pcustom">Jodo</button></div></div></div>' +
        '<div class="chips wrapx" id="pchips"></div><div class="pad" id="plist"></div><div class="cbspace"></div><div class="cartbar" id="pbar"></div></section>';
    },
    init: function (e) {
      e.sel = e.sel || {};
      return Promise.all([S.api.catalog(), S.api.shopItems(S.shop.id)]).then(function (r) {
        e.cat = (r[0] || []).filter(function (c) { return (S.shop.types || []).indexOf(c.shop_type) > -1; });
        e.have = {}; (r[1] || []).forEach(function (i) { e.have[String(i.name).toLowerCase()] = 1; });
        var seen = {}; e.cats = [];
        e.cat.forEach(function (c) { var k = c.shop_type + "|" + c.category; if (!seen[k]) { seen[k] = 1; e.cats.push({ key: k, label: c.category }); } });
        e.cur = e.cats[0] && e.cats[0].key; LK.redraw(e); pickRefresh(e);
      }).catch(LK.fail);
    },
    after: function (e) { if (e.cat) pickRefresh(e); }
  };
  LK.inp.psearch = function (el) { var e = LK.top(); e.q = el.value; pickRefresh(e); };
  LK.act.pcat = function (el) { var e = LK.top(); e.cur = el.dataset.v; e.q = ""; var s = $(".search input"); if (s) s.value = ""; pickRefresh(e); window.scrollTo(0, 0); };
  LK.act.ptick = function (el) {
    var e = LK.top(), k = el.dataset.k;
    if (e.sel[k]) delete e.sel[k]; else { var c = e.cat.filter(function (x) { return "c" + x.id === k; })[0]; e.sel[k] = { name: c.name, catalog_id: c.id, unit: DEFU[c.unit_kind] || "kg", rate: "" }; }
    pickRefresh(e);
  };
  LK.inp.prate = function (el) { var s = LK.top().sel[el.dataset.k]; if (s) s.rate = el.value; };
  LK.inp.punit = function (el) { var s = LK.top().sel[el.dataset.k]; if (s) s.unit = el.value; };
  LK.act.psave = function (el) {
    var e = LK.top(), ks = Object.keys(e.sel);
    var bad = ks.filter(function (k) { return !(num(e.sel[k].rate) >= 0); });
    if (bad.length) return LK.toast("\"" + e.sel[bad[0]].name + "\" ka rate likho.", "bad");
    return LK.busy(el, function () { return Promise.all(ks.map(function (k) { var s = e.sel[k]; return S.api.saveItem({ name: s.name, unit: s.unit, rate: num(s.rate), catalog_id: s.catalog_id, available: true }); })); })
      .then(function () { LK.toast(ks.length + " saman jud gaye ✓"); LK.back(); });
  };
  LK.act.pcustom = function (el) {
    var n = ($("#pn").value || "").trim(), r = num($("#pr").value), u = $("#pu").value;
    if (!n) return LK.toast("Saman ka naam likho.", "bad"); if (!(r >= 0)) return LK.toast("Rate likho.", "bad");
    return LK.busy(el, function () { return S.api.saveItem({ name: n.slice(0, 80), unit: u, rate: r, available: true }); }).then(function () { $("#pn").value = ""; $("#pr").value = ""; LK.toast("Jud gaya ✓"); });
  };

  /* ================= ads ================= */
  V.ads = {
    tab: "ads",
    html: function (e) {
      if (!S.shop) return noShop(); if (!e.fi) { LK.form = { title: "", body: "", media: null, kind: "none" }; e.fi = true; }
      var d = e.data || [];
      return '<section class="pad"><h2>Ads / Offers</h2><p class="muted sm">Aapki dukaan ke 5 km ke customer ko home screen par dikhega. Photo ya chhota video lagao.</p>' +
        '<label class="fld"><span>Title *</span><input data-in="f" data-k="title" maxlength="80" placeholder="Jaise: Diwali Sale"></label><label class="fld"><span>Kya offer hai?</span><textarea data-in="f" data-k="body" rows="2" maxlength="300" placeholder="5 kg aata par namak free"></textarea></label>' +
        '<div class="fld"><span>Photo ya video</span><div id="adprev" class="adprev"></div><div class="row2"><button class="btn ghost sm" data-act="adpick" data-v="img">📷 Photo lagao</button><button class="btn ghost sm" data-act="adpick" data-v="vid">🎥 Video lagao</button></div><input type="file" id="ad-img" accept="image/*" hidden data-in="adfile"><input type="file" id="ad-vid" accept="video/*" hidden data-in="adfile"></div>' +
        '<button class="btn big" data-act="adpost">📢 Ad lagao</button><h3>Chal rahe ads</h3>' +
        (d.filter(function (p) { return p.active; }).map(function (p) {
          return '<div class="card adc"><div class="row"><b>' + esc(p.title) + '</b><button class="btn ghost sm" data-act="adend" data-id="' + p.id + '">Band karo</button></div>' + (p.media_type === "video" ? '<video src="' + esc(LK.img(p.media_path)) + '" muted controls playsinline></video>' : p.media_path ? '<img src="' + esc(LK.img(p.media_path)) + '" alt="">' : "") + "<p>" + esc(p.body) + "</p></div>";
        }).join("") || '<div class="empty">Abhi koi ad nahi.</div>') + "</section>";
    },
    init: function (e) { if (!S.shop) return; return S.api.myPromos(S.shop.id).then(function (r) { e.data = r || []; if (!activeInput()) LK.redraw(e); }).catch(LK.fail); }
  };
  LK.act.adpick = function (el) { $(el.dataset.v === "vid" ? "#ad-vid" : "#ad-img").click(); };
  LK.inp.adfile = function (el) {
    var f = el.files && el.files[0]; el.value = ""; if (!f) return;
    var video = /^video\//.test(f.type); if (video && f.size > 50 * 1024 * 1024) return LK.toast("Video 50 MB se chhota chuno.", "bad");
    LK.form.media = f; LK.form.kind = video ? "video" : "image";
    var u = URL.createObjectURL(f); $("#adprev").innerHTML = video ? '<video src="' + u + '" muted controls playsinline></video>' : '<img src="' + u + '" alt="">';
  };
  LK.act.adpost = function (el) {
    var f = LK.form; if (!String(f.title || "").trim()) return LK.toast("Ad ka title likho.", "bad");
    return LK.busy(el, function () {
      return (f.media ? LK.shrink(f.media).then(function (m) { return S.api.upload(m); }) : Promise.resolve("")).then(function (path) { return S.api.savePromo(f.title.trim(), f.body || "", path, path ? f.kind : "none"); });
    }).then(function () { LK.toast("Ad lag gaya ✓"); var e = LK.top(); e.fi = false; e.data = null; return V.ads.init(e).then(function () { LK.redraw(e); }); });
  };
  LK.act.adend = function (el) { var e = LK.top(); return S.api.endPromo(el.dataset.id).then(function () { LK.toast("Ad band ho gaya"); return V.ads.init(e); }); };

  /* ================= report ================= */
  V.report = {
    tab: "report",
    html: function (e) {
      if (!S.shop) return noShop(); var d = e.data; if (!d) return '<section class="pad"><h2>Report</h2>' + LOADING + "</section>";
      var tot = d.reduce(function (a, r) { a.s += +r.sales; a.o += +r.orders; a.r += +r.refunds; a.f += +r.platform_fee; return a; }, { s: 0, o: 0, r: 0, f: 0 });
      return '<section class="pad"><h2>Bikri report</h2><p class="muted sm">Pichhle ' + (e.days || 30) + ' din (poore hue orders)</p><div class="stats"><div><span>Kul bikri</span><b>' + LK.money(tot.s) + "</b></div><div><span>Orders</span><b>" + tot.o + "</b></div><div><span>Refund</span><b>" + LK.money(tot.r) + "</b></div><div><span>Platform ko dena</span><b>" + LK.money(tot.f) + "</b></div></div>" +
        (d.length ? '<div class="card"><div class="rep-h"><span>Din</span><span>Orders</span><span>Bikri</span></div>' + d.map(function (r) { return '<div class="rep-r"><span>' + String(r.day).slice(8, 10) + "/" + String(r.day).slice(5, 7) + "</span><span>" + r.orders + "</span><b>" + LK.money(r.sales) + "</b></div>"; }).join("") + "</div>" : '<div class="empty">Abhi koi poora hua order nahi.</div>') + custHtml(e) + "</section>";
    },
    init: function (e) { if (!S.shop) return; e.days = e.days || 30; return Promise.all([S.api.report(e.days), S.api.shopCustomers(e.days)]).then(function (r) { e.data = r[0] || []; e.cust = r[1] || []; LK.redraw(e); }).catch(LK.fail); }
  };
  function custHtml(e) {
    var c = e.cust || [], dd = [7, 30, 90, 365], fd = function (t) { return t ? String(t).slice(8, 10) + "/" + String(t).slice(5, 7) : ""; };
    return '<h3>👥 Customers — kaun kitna order kar raha hai</h3><div class="chips">' + dd.map(function (n) { return '<button class="chip' + ((e.days || 30) === n ? " on" : "") + '" data-act="repdays" data-v="' + n + '">' + (n === 365 ? "1 saal" : n + " din") + "</button>"; }).join("") + "</div>" +
      (c.length ? '<p class="muted sm">' + c.length + " customer · " + c.reduce(function (a, r) { return a + +r.orders; }, 0) + " order</p><div class=\"card\">" + c.map(function (r) { return '<div class="ri"><b class="nm">' + esc(r.name || "Customer") + "<small>" + esc(r.phone || "") + " · " + r.orders + " order (" + r.done + " poore" + (+r.cancelled ? ", " + r.cancelled + " cancel" : "") + ") · " + LK.money(r.spent) + " · pehla " + fd(r.first_order) + ", aakhri " + fd(r.last_order) + "</small></b>" + (r.phone ? '<a class="btn ghost sm" href="' + LK.tel(r.phone) + '">📞</a>' : "") + "</div>"; }).join("") + "</div>" : '<div class="empty">Is samay mein koi order nahi aaya.</div>');
  }
  LK.act.repdays = function (el) { var e = LK.top(); if (!e) return; e.days = +el.dataset.v || 30; V.report.init(e); };

  /* ================= admin ================= */
  function shopRow(s) {
          return '<div class="ri"><b class="nm">' + esc(s.name) + "<small>" + esc(LK.typesText(s.types)) + " · " + esc(s.phone) + (s.email ? " · " + esc(s.email) : "") + '</small></b><a class="btn ghost sm" href="' + LK.tel(s.phone) + '">📞</a><button class="btn sm' + (LK.luckyOn(s) ? "" : " ghost") + '" data-act="adminlucky" data-id="' + s.id + '" data-v="' + (LK.luckyOn(s) ? "0" : "1") + '">🎁 ' + (LK.luckyOn(s) ? "ON" + (s.lucky_until ? " · " + new Date(s.lucky_until).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "") : "OFF") + '</button><button class="btn ghost sm" data-act="adminset" data-id="' + s.id + '" data-v="' + (s.status === "active" ? "blocked" : "active") + '">' + (s.status === "active" ? "Block karo" : s.status === "pending" ? "✅ Approve" : "Chalu karo") + "</button></div>";
  }
  function custRow(u) { return '<div class="ri"><b class="nm">' + esc(u.full_name) + "<small>" + esc(u.phone) + " · " + esc(u.age) + " saal · " + esc(u.address || "") + (u.email ? " · " + esc(u.email) : "") + " · " + u.orders + ' order</small></b><a class="btn ghost sm" href="' + LK.tel(u.phone) + '">📞</a></div>'; }
  /* Admin search: mobile number (any part, +91/spaces ignored), Gmail / email, or name. */
  function aMatch(q, name, phone, email) {
    q = String(q || "").trim().toLowerCase(); if (!q) return false;
    var dq = q.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    if (dq.length >= 3 && q.replace(/[\s+()-]/g, "").replace(/\d/g, "") === "" && String(phone || "").replace(/\D/g, "").indexOf(dq) >= 0) return true;
    return String(email || "").toLowerCase().indexOf(q) >= 0 || String(name || "").toLowerCase().indexOf(q) >= 0;
  }
  function aResults(d) {
    var q = S.asq; if (!q || !String(q).trim()) return "";
    var sh = d.shops.filter(function (s) { return aMatch(q, s.name + " " + (s.owner_name || ""), s.phone, s.email) || aMatch(q, "", s.owner_phone, ""); });
    var cu = d.cust.filter(function (u) { return aMatch(q, u.full_name, u.phone, u.email); });
    if (!sh.length && !cu.length) return '<div class="empty">"' + esc(q) + '" se koi dukaan ya customer nahi mila.</div>';
    return (sh.length ? '<h3>🏪 Dukaanein (' + sh.length + ')</h3><div class="card">' + sh.map(shopRow).join("") + "</div>" : "") +
      (cu.length ? '<h3>👤 Customers (' + cu.length + ')</h3><div class="card">' + cu.map(custRow).join("") + "</div>" : "");
  }
  LK.inp.asearch = function (el) {
    S.asq = el.value; var e = LK.top(); if (!e || !e.data) return;
    var r = $("#asr"), l = $("#alist"); if (r) r.innerHTML = aResults(e.data); if (l) l.hidden = !!String(S.asq).trim();
  };
  V.admin = {
    html: function (e) {
      var d = e.data; if (!d) return LOADING; var st = d.stats;
      return '<section class="pad"><h2>🛡️ Admin</h2>' + LK.verLine() + '<div class="stats"><div><span>Dukaanein</span><b>' + st.shops + "</b></div><div><span>Customers</span><b>" + st.customers + "</b></div><div><span>Orders</span><b>" + st.orders + "</b></div><div><span>Poore</span><b>" + st.completed + "</b></div><div><span>Kul bikri</span><b>" + LK.money(st.sales) + "</b></div><div><span>Active dukaan</span><b>" + st.active_shops + "</b></div><div><span>Platform kamai</span><b>" + LK.money(st.fees) + "</b></div></div>" +
        '<label class="fld asearch"><span>🔍 Dukaan / customer khojo</span><input id="asq" type="search" data-in="asearch" value="' + esc(S.asq || "") + '" placeholder="Mobile number ya Gmail ID (naam bhi chalega)" autocapitalize="none" autocorrect="off" spellcheck="false"></label><div id="asr" style="margin-bottom:8px">' + aResults(d) + '</div>' +
        '<h3>⬆️ Single-shop force update</h3><div class="card"><p class="muted sm">Sirf "LoKalLo Single" apps ke liye. Inka build number Multi se alag chalta hai (is app ka build: ' + LK.myBuild() + ').</p><label class="fld"><span>Kam se kam build (0 = band)</span><input id="ups-min" inputmode="numeric" value="' + (S.fees.min_build_single || 0) + '"></label><label class="fld"><span>Naye APK ka download link</span><input id="ups-url" value="' + esc(S.fees.single_update_url || "") + '" placeholder="https://..." autocapitalize="none"></label><button class="btn" data-act="upssave">Save karo</button></div>' +
        '<h3>⬆️ Force update (Multi)</h3><div class="card"><p class="muted sm">Is build se purane app band ho jayenge aur sirf "Update download karo" dikhega. Is app ka build: <b>' + LK.myBuild() + '</b>. Naya APK Supabase par public link se download hota hai.</p><label class="fld"><span>Kam se kam build number (0 = band)</span><input id="up-min" inputmode="numeric" value="' + (S.fees.min_build || 0) + '"></label><label class="fld"><span>Message (optional)</span><input id="up-msg" maxlength="200" value="' + esc(S.fees.update_msg || "") + '" placeholder="Naya version aa gaya hai"></label><button class="btn" data-act="upsave">Save karo</button></div>' +
        '<button class="btn big" data-act="abilling">💎 Prime billing — monthly charge, free offer, payments</button>' +
        '<button class="btn big" data-act="aref">🎁 Referral — customer aur dukaan referral, review</button>' +
        '<button class="btn big" data-act="acomm">💰 Commission — hisaab, payments, verify</button>' +
        '<button class="btn big" data-act="aareas">🏘️ Gaon / Mohalla — areas aur dukaanein</button>' +
        '<button class="btn big" data-act="awallets">🎁 Refer & earn — har user ka wallet</button>' +
        '<button class="btn big" data-act="aactive">📱 App users — kitne log app use kar rahe hain</button>' +
        '<button class="btn big" data-act="aorders">📊 Orders report — kaun si dukaan / kaun sa customer kitna</button>' +
        '<button class="btn big" data-act="promote">📣 Promote — kirana stores ki list (Google/OSM)</button>' +
        '<h3>📝 Shopkeeper ke liye dukaan register karo</h3><div class="card"><p class="muted sm">Dukaan ki jaankari aap bharo. Shopkeeper sirf apne Google account se login karega to dukaan seedha chalu mil jayegi.</p><button class="btn" data-act="invnew">➕ Nayi dukaan register karo</button>' + (d.inv || []).map(function (i) { return '<div class="ri"><b class="nm">' + esc(i.name) + "<small>" + esc(i.email) + " · " + esc(i.phone) + "</small></b>" + (i.cancelled ? '<span class="bd bad">Cancel</span>' : i.claimed_at ? '<span class="bd ok">Login ho gaya ✓</span>' : '<span class="bd warn">Login baaki</span><button class="btn ghost sm" data-act="invcancel" data-e="' + esc(i.email) + '">Cancel</button>') + "</div>"; }).join("") + "</div>" +
        ((d.sreq || []).length ? '<h3>🏪 Single-shop plan requests (' + d.sreq.length + ')</h3>' + d.sreq.map(function (r) { return '<div class="card hot"><div class="row"><b>' + esc(r.shop_name) + '</b><b>' + LK.money(r.amount) + '</b></div><div class="muted sm">' + esc(r.phone) + ' · ' + LK.ago(r.created_at) + ' · ' + r.months + ' mahine · UPI check karke approve karo.</div><div class="row2"><button class="btn sm" data-act="sgappr" data-id="' + r.shop_id + '" data-m="' + r.months + '">✅ Approve</button><button class="btn ghost sm" data-act="sgrej" data-id="' + r.shop_id + '">Reject</button></div></div>'; }).join("") : "") +
        '<h3>🏪 Single-shop plan ke daam</h3><div class="card"><div class="two"><label class="fld"><span>Per mahina (₹)</span><input id="sp-p" inputmode="numeric" value="' + ((d.sp || {}).price || 2000) + '"></label><label class="fld"><span>3 mahine par % off</span><input id="sp-q" inputmode="numeric" value="' + ((d.sp || {}).q_off || 0) + '"></label></div><label class="fld"><span>Saal par % off</span><input id="sp-y" inputmode="numeric" value="' + ((d.sp || {}).y_off || 0) + '"></label><button class="btn" data-act="spsave">Save karo</button></div>' +
        ((d.lreq || []).length ? '<h3>🎁 Lucky Draw requests (' + d.lreq.length + ')</h3>' + d.lreq.map(function (r) { return '<div class="card hot"><div class="row"><b>' + esc(r.shop_name) + '</b><b>' + LK.money(r.amount) + '</b></div><div class="muted sm">' + esc(r.phone) + ' · ' + LK.ago(r.created_at) + ' · ' + esc(LK.LPLAN(r.plan, r.days)) + ' · ne fee pay karne ka bataya. Apna UPI check karke enable karo.</div><div class="row2"><button class="btn sm" data-act="adminlucky" data-id="' + r.shop_id + '" data-days="' + r.days + '" data-v="1">✅ Enable karo</button><button class="btn ghost sm" data-act="luckyrej" data-id="' + r.shop_id + '">Reject</button></div></div>'; }).join("") : "") +
        '<h3>Platform fee (per order)</h3><div class="card"><div class="two"><label class="fld"><span>Customer se (₹) — 0 = FREE</span><input id="fee-c" inputmode="decimal" value="' + S.fees.customer_fee + '"></label><label class="fld"><span>Shopkeeper se (₹)</span><input id="fee-s" inputmode="decimal" value="' + S.fees.shop_fee + '"></label></div>' +
          '<label class="fld"><span>Naye user ko free (din) — badha sakte ho</span><input id="fee-d" inputmode="numeric" value="' + (S.fees.free_days || 0) + '"></label>' +
          '<label class="fld"><span>Aapki UPI ID (customer fee yahin aayegi)</span><input id="fee-u" value="' + esc(S.fees.admin_upi || "") + '" placeholder="naam@okaxis" autocapitalize="none" autocorrect="off" spellcheck="false"></label><span class="muted sm">🎁 Lucky Draw plan ki fee (₹)</span><div class="two"><label class="fld"><span>Hafta</span><input id="fee-lw" inputmode="decimal" value="' + (S.fees.lucky_week || 0) + '"></label><label class="fld"><span>Mahina</span><input id="fee-lm" inputmode="decimal" value="' + (S.fees.lucky_month || 0) + '"></label><label class="fld"><span>Saal</span><input id="fee-ly" inputmode="decimal" value="' + (S.fees.lucky_year || 0) + '"></label></div><button class="btn" data-act="feesave">Save karo</button></div>' +
        '<div id="alist"' + (S.asq ? ' hidden' : '') + '>' +
        '<div class="seg" style="margin:12px 0"><button data-act="atab" data-v="shops" aria-pressed="' + (S.atab !== "cust") + '">Dukaandaar (' + d.shops.length + ')</button><button data-act="atab" data-v="cust" aria-pressed="' + (S.atab === "cust") + '">Customers (' + d.cust.length + ')</button></div>' +
        (S.atab === "cust" ? '<div class="card">' + (d.cust.map(custRow).join("") || '<div class="empty">Koi customer nahi.</div>') + "</div></div></section>" : "") +
        (S.atab === "cust" ? "" : (d.shops.filter(function (s) { return s.status === "pending"; }).length ? '<div class="card hot"><b>⏳ Naye registration (approval baaki): ' + d.shops.filter(function (s) { return s.status === "pending"; }).length + '</b></div>' : "") + '<div class="card">' + d.shops.slice().sort(function (a, b) { return (b.status === "pending") - (a.status === "pending"); }).map(shopRow).join("") + "</div></div></section>");
    },
    init: function (e) { return Promise.all([S.api.adminStats(), S.api.adminShops(), S.api.adminPeople(), S.api.adminLuckyReqs().catch(function () { return []; }), S.api.adminSingleReqs().catch(function () { return []; }), S.api.singlePrices().catch(function () { return {}; }), S.api.adminInvites().catch(function () { return []; })]).then(function (r) { var ppl = r[2] || []; e.data = { lreq: r[3] || [], sreq: r[4] || [], sp: r[5] || {}, inv: r[6] || [], stats: r[0] || {}, shops: (r[1] || []).map(function (s) { var o = ppl.filter(function (p) { return p.id === s.owner_id; })[0] || ppl.filter(function (p) { return p.is_shop && p.shop_name === s.name; })[0]; s.email = o && o.email; s.owner_phone = o && o.phone; return s; }), cust: ppl.filter(function (p) { return !p.is_shop; }) }; LK.redraw(e); }).catch(LK.fail); }
  };
  LK.act.feesave = function (el) {
    var lw = num($("#fee-lw").value), lm = num($("#fee-lm").value), ly = num($("#fee-ly").value); if (!(lw >= 0 && lm >= 0 && ly >= 0 && Math.max(lw, lm, ly) <= 100000)) return LK.toast("Lucky Draw fee sahi likho.", "bad");
    var c = num($("#fee-c").value), sf = num($("#fee-s").value), dd = Math.round(num($("#fee-d").value)), u = String($("#fee-u").value || "").trim();
    if (!(c >= 0 && c <= 100 && sf >= 0 && sf <= 100)) return LK.toast("Fee 0 se 100 ke beech likho.", "bad");
    if (!(dd >= 0 && dd <= 365)) return LK.toast("Free din 0 se 365 ke beech likho.", "bad");
    if (u && !/^[A-Za-z0-9._-]{2,64}@[A-Za-z0-9.-]{2,40}$/.test(u)) return LK.toast("UPI ID sahi likho (jaise naam@okaxis).", "bad");
    return LK.busy(el, function () {
      return S.api.setFee("customer_fee", c).then(function () { return S.api.setFee("shop_fee", sf); }).then(function () { return S.api.setFreeDays(dd); }).then(function () { return S.api.setAdminUpi(u); }).then(function () { return S.api.setLuckyFees(lw, lm, ly); });
    }).then(function () { S.fees = Object.assign(S.fees || {}, { customer_fee: c, shop_fee: sf, free_days: dd, admin_upi: u, lucky_week: lw, lucky_month: lm, lucky_year: ly }); LK.toast("Save ho gaya ✓"); });
  };
  function dur(sec) { sec = Math.round(+sec || 0); if (sec < 60) return sec ? sec + " sec" : "0"; var m = Math.round(sec / 60); if (m < 60) return m + " min"; var h = Math.floor(m / 60); return h + " ghanta " + (m % 60 ? (m % 60) + " min" : ""); }
  function ist(t) { try { return new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }); } catch (x) { return String(t || "").slice(0, 16); } }
  function agoTxt(t) { var m = Math.round((Date.now() - new Date(t)) / 60000); return m < 2 ? "abhi online" : m < 60 ? m + " min pehle" : m < 1440 ? Math.floor(m / 60) + " ghante pehle" : Math.floor(m / 1440) + " din pehle"; }
  V.aactive = {
    html: function (e) {
      var d = e.data; if (!d) return '<section class="pad"><h2>📱 Active users</h2>' + LOADING + "</section>";
      var ed = function (x) { return x === "single" ? "Single" : "Multi"; }, rc = d.recent || [], sort = e.sort || "recent";
      var list = rc.slice(); if (sort === "time") list.sort(function (a, b) { return b.d7_secs - a.d7_secs; }); else if (sort === "opens") list.sort(function (a, b) { return b.opens - a.opens; });
      var seg = '<div class="chips flush">' + [["recent", "Haal ke"], ["time", "Zyada time (7 din)"], ["opens", "Zyada baar khola"]].map(function (x) { return '<button class="chip" data-act="aasort" data-v="' + x[0] + '" aria-pressed="' + (sort === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div>";
      var avg = d.d7 ? dur(d.secs_7 / d.d7) : "0";
      var dv = e.dev, devH = dv ? '<h3>📲 Kitne phone mein app hai</h3><div class="stats"><div><span>Kul phone</span><b>' + dv.total + "</b></div><div><span>Aaj naye</span><b>" + dv.new_today + "</b></div><div><span>7 din mein naye</span><b>" + dv.new_7 + "</b></div><div><span>7 din mein khole</span><b>" + dv.active_7 + "</b></div><div><span>Bina login</span><b>" + dv.no_login + "</b></div></div>" + ((dv.by_edition || []).length ? '<div class="card">' + dv.by_edition.map(function (r) { return '<div class="ri"><b class="nm">' + ed(r.edition) + "<small>" + r.n + " phone · 7 din mein " + r.a7 + " ne khola</small></b></div>"; }).join("") + "</div>" : "") + '<p class="muted sm">Har phone ek baar ginta hai (app ki apni pehchaan se, login se pehle bhi). Ginti naye build se shuru hui' + (dv.since ? " (" + ist(dv.since) + " se)" : "") + ". App hata dene par ye ghat nahi hota, aur app dobara install ya data clear karne par naya phone ginta ja sakta hai. Asli install ginti ke liye Play Console dekho.</p>" : "";
      return '<section class="pad"><h2>📱 Active users</h2>' + devH + '<h3>👤 Login kiye hue users</h3><div class="stats"><div><span>Abhi online</span><b>' + d.online_now + "</b></div><div><span>Aaj active</span><b>" + d.d1 + "</b></div><div><span>7 din active</span><b>" + d.d7 + "</b></div><div><span>30 din active</span><b>" + d.d30 + "</b></div><div><span>Registered</span><b>" + d.registered + "</b></div><div><span>App kholne wale</span><b>" + d.tracked + "</b></div></div>" +
        '<div class="card"><div class="kv"><div><span>Aaj kul app time</span><b>' + dur(d.secs_today) + "</b></div><div><span>7 din kul app time</span><b>" + dur(d.secs_7) + "</b></div><div><span>Per active user (7 din)</span><b>" + avg + "</b></div></div></div>" +
        '<p class="muted sm">Time tab ginta hai jab app khuli aur screen par ho' + (d.tracking_since ? " (record " + ist(d.tracking_since) + " se shuru; time ki ginti naye build se)" : "") + ". Sirf login kiye hue users aate hain. Total installs ke liye Play Console dekho.</p>" +
        "<h3>Edition wise</h3>" + ((d.by_edition || []).length ? '<div class="card">' + d.by_edition.map(function (r) { return '<div class="ri"><b class="nm">' + ed(r.edition) + "<small>" + r.users + " user · 7 din mein " + r.d7 + " active · kul " + dur(r.secs) + "</small></b></div>"; }).join("") + "</div>" : '<div class="empty">Abhi record nahi.</div>') +
        "<h3>Build wise (kaun purana hai)</h3>" + ((d.by_build || []).length ? '<div class="card">' + d.by_build.map(function (r) { return '<div class="ri"><b class="nm">' + ed(r.edition) + " build " + r.build + "<small>" + r.users + " user</small></b></div>"; }).join("") + "</div>" : '<div class="empty">Abhi record nahi.</div>') +
        "<h3>Users (" + rc.length + ")</h3>" + seg + (list.length ? '<div class="card">' + list.map(function (r) {
          return '<div class="ri"><b class="nm">' + esc(r.name || "—") + (agoTxt(r.last_seen) === "abhi online" ? ' <span class="bd ok">online</span>' : "") + "<small>" + esc(r.phone || "") + " · " + ed(r.edition) + " b" + r.build + "<br>Aakhri: " + ist(r.last_seen) + " (" + agoTxt(r.last_seen) + ")<br>Aaj: " + dur(r.today_secs) + " · 7 din: " + dur(r.d7_secs) + " · kul: " + dur(r.total_secs) + "<br>" + r.opens + " baar khola · 30 din mein " + r.days + " din active</small></b>" + (r.phone ? '<a class="btn ghost sm" href="' + LK.tel(r.phone) + '">📞</a>' : "") + "</div>";
        }).join("") + "</div>" : '<div class="empty">Abhi koi record nahi — users ke app kholne par yahan aayega.</div>') + "</section>";
    },
    init: function (e) { return Promise.all([S.api.adminActivity(), S.api.adminDevices ? S.api.adminDevices().catch(function () { return null; }) : null]).then(function (r) { e.data = r[0] || {}; e.dev = r[1]; LK.redraw(e); }).catch(LK.fail); }
  };
  LK.act.aasort = function (el) { var e = LK.top(); e.sort = el.dataset.v; LK.redraw(e); };
  LK.act.aactive = function () { LK.go("aactive"); };
  V.awallets = {
    html: function (e) {
      var d = e.data; if (!d) return '<section class="pad"><h2>🎁 Refer & earn wallet</h2>' + LOADING + "</section>";
      var q = (e.q || "").toLowerCase(), sort = e.sort || "bal", all = d.users || [];
      var list = all.filter(function (r) { return !q || (r.name || "").toLowerCase().indexOf(q) > -1 || (r.phone || "").indexOf(q) > -1 || (r.code || "").toLowerCase().indexOf(q) > -1; });
      list.sort(function (a, b) { return sort === "ref" ? b.referred - a.referred : sort === "earn" ? b.earned - a.earned : b.balance - a.balance; });
      var seg = '<div class="chips flush">' + [["bal", "Zyada balance"], ["earn", "Zyada kamaya"], ["ref", "Zyada refer"]].map(function (x) { return '<button class="chip" data-act="awsort" data-v="' + x[0] + '" aria-pressed="' + (sort === x[0]) + '">' + x[1] + "</button>"; }).join("") + "</div>";
      var st = d.settings || {};
      return '<section class="pad"><h2>🎁 Refer & earn wallet</h2><div class="stats"><div><span>Kul wallet balance</span><b>' + LK.money(d.tot_balance) + "</b></div><div><span>Ab tak diya</span><b>" + LK.money(d.tot_earned) + "</b></div><div><span>Use hua</span><b>" + LK.money(d.tot_used) + "</b></div><div><span>Kul refer</span><b>" + d.tot_refs + "</b></div><div><span>Reward mile</span><b>" + d.tot_rewarded + "</b></div></div>" +
        '<p class="muted sm">Dost ka pehla order poora hone par ' + LK.money(st.reward) + " reward. Wallet " + LK.money(st.unlock) + " kamane ke baad use hota hai.</p>" +
        '<input class="in" data-in="awq" placeholder="Naam / phone / code se dhundo" value="' + esc(e.q || "") + '">' + seg +
        "<h3>Users (" + list.length + ")</h3>" + (list.length ? '<div class="card">' + list.map(function (r) {
          return '<div class="ri"><b class="nm">' + esc(r.name || "—") + (r.balance > 0 ? ' <span class="bd ok">' + LK.money(r.balance) + "</span>" : "") + "<small>" + esc(r.phone || "") + " · code " + esc(r.code || "") + "<br>Balance " + LK.money(r.balance) + " · kamaya " + LK.money(r.earned) + " · use " + LK.money(r.used) + "<br>Refer kiye " + r.referred + " (reward " + r.rewarded + ")" + (r.by ? " · " + esc(r.by) + " ne bheja" : "") + "</small></b>" + (r.phone ? '<a class="btn ghost sm" href="' + LK.tel(r.phone) + '">📞</a>' : "") + "</div>";
        }).join("") + "</div>" : '<div class="empty">Koi user nahi mila.</div>') + "</section>";
    },
    init: function (e) { return S.api.adminWallets().then(function (r) { e.data = r || {}; LK.redraw(e); }).catch(LK.fail); }
  };
  LK.act.awallets = function () { LK.go("awallets"); };
  LK.act.awsort = function (el) { var e = LK.top(); e.sort = el.dataset.v; LK.redraw(e); };
  LK.inp.awq = function (el) { var e = LK.top(); e.q = el.value; LK.redraw(e); var i = document.querySelector('[data-in="awq"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } };
  V.aorders = {
    html: function (e) {
      var d = e.data, days = e.days || 30, fd = function (t) { return t ? String(t).slice(8, 10) + "/" + String(t).slice(5, 7) : ""; };
      var chips = '<div class="chips flush">' + [7, 30, 90, 365].map(function (n) { return '<button class="chip' + (days === n ? " on" : "") + '" data-act="aordays" data-v="' + n + '">' + (n === 365 ? "1 saal" : n + " din") + "</button>"; }).join("") + "</div>";
      if (!d) return '<section class="pad"><h2>Orders report</h2>' + chips + LOADING + "</section>";
      var sh = d.filter(function (r) { return r.kind === "shop"; }).sort(function (a, b) { return b.orders - a.orders; }), cu = d.filter(function (r) { return r.kind === "cust"; }).sort(function (a, b) { return b.orders - a.orders; });
      var row = function (r, isShop) { return '<div class="ri"><b class="nm">' + esc(r.name || (isShop ? "Dukaan" : "Customer")) + "<small>" + esc(r.phone || "") + " · " + r.orders + " order (" + r.done + " poore" + (+r.cancelled ? ", " + r.cancelled + " cancel" : "") + ") · " + LK.money(r.spent) + " · " + r.shops + (isShop ? " customer" : " dukaan") + " · aakhri " + fd(r.last_order) + "</small></b>" + (r.phone ? '<a class="btn ghost sm" href="' + LK.tel(r.phone) + '">📞</a>' : "") + "</div>"; };
      return '<section class="pad"><h2>📊 Orders report</h2><p class="muted sm">Pichhle ' + days + " din</p>" + chips +
        "<h3>🏪 Dukaan wise (" + sh.length + ")</h3>" + (sh.length ? '<div class="card">' + sh.map(function (r) { return row(r, true); }).join("") + "</div>" : '<div class="empty">Koi order nahi.</div>') +
        "<h3>👤 Customer wise (" + cu.length + ")</h3>" + (cu.length ? '<div class="card">' + cu.map(function (r) { return row(r, false); }).join("") + "</div>" : '<div class="empty">Koi order nahi.</div>') + "</section>";
    },
    init: function (e) { e.days = e.days || 30; return S.api.adminOrders(e.days).then(function (r) { e.data = r || []; LK.redraw(e); }).catch(LK.fail); }
  };
  LK.act.aorders = function () { LK.go("aorders"); };
  LK.act.aordays = function (el) { var e = LK.top(); if (!e) return; e.days = +el.dataset.v || 30; e.data = null; LK.redraw(e); V.aorders.init(e); };
  LK.act.atab = function (el) { S.atab = el.dataset.v; LK.redraw(LK.top()); };
  LK.act.admin = function () { LK.go("admin"); };
  LK.act.upssave = function (el) {
    var n = Math.round(num($("#ups-min").value)), u = String($("#ups-url").value || "").trim();
    if (!(n >= 0 && n <= 100000)) return LK.toast("Build number sahi likho.", "bad");
    if (n > 0 && !/^https:\/\//.test(u)) return LK.toast("Download link https:// se shuru hona chahiye.", "bad");
    return LK.busy(el, function () { return S.api.setUpdateSingle(n, u); }).then(function () { S.fees.min_build_single = n; S.fees.single_update_url = u; LK.toast(n ? "Single force update chalu ✓" : "Band ✓"); });
  };
  LK.act.upsave = function (el) {
    var n = Math.round(num($("#up-min").value)), m = String($("#up-msg").value || "").trim();
    if (!(n >= 0 && n <= 100000)) return LK.toast("Build number sahi likho.", "bad");
    var go = function () { return LK.busy(el, function () { return S.api.setUpdate(n, m); }).then(function () { S.fees.min_build = n; S.fees.update_msg = m; LK.toast(n ? "Force update chalu ✓" : "Force update band ✓"); }); };
    return n > 0 ? LK.ask("Build " + n + " se purane sabhi app band ho jayenge. Pehle pakka karo ki naya APK upload ho chuka hai. Chalu karein?", "Haan, chalu karo", true).then(function (ok) { if (ok) return go(); }) : go();
  };
  var INV = null;
  LK.act.invnew = function () {
    INV = { types: ["grocery"], km: "2", lat: null, lng: null };
    LK.sheet('<h3>Nayi dukaan register karo</h3><label class="fld"><span>Shopkeeper ka Google email (Gmail)</span><input id="iv-e" type="email" autocapitalize="none" placeholder="naam@gmail.com"></label><label class="fld"><span>Dukaan ka naam</span><input id="iv-n" maxlength="60"></label><label class="fld"><span>Maalik ka naam</span><input id="iv-o" maxlength="60"></label><label class="fld"><span>Mobile (10 digit)</span><input id="iv-p" inputmode="numeric" maxlength="10"></label><label class="fld"><span>Pata</span><input id="iv-a" maxlength="200"></label><div class="fld"><span>Dukaan ka type</span><div class="chips wrap">' + Object.keys(LK.TYPES).map(function (k) { return '<button type="button" class="chip" data-act="ivtype" data-v="' + k + '" aria-pressed="' + (k === "grocery") + '">' + LK.TYPES[k] + "</button>"; }).join("") + '</div></div><div class="fld"><span>Delivery kitni door tak</span><div class="chips wrap">' + ["1", "2", "4", "6", "10", "25", "50"].map(function (k) { return '<button type="button" class="chip" data-act="ivkm" data-v="' + k + '" aria-pressed="' + (k === "2") + '">' + k + " km</button>"; }).join("") + '</div></div><div class="fld"><span>Dukaan ki location</span><button type="button" class="btn ghost" data-act="ivgps">📍 Abhi dukaan par ho to GPS lo</button><input id="iv-ll" placeholder="ya lat, lng likho (Google Maps se copy)"><small id="iv-loc" class="muted"></small></div><button class="btn" data-act="ivsave">Register karo</button>');
  };
  LK.act.ivtype = function (el) { var t = INV.types, v = el.dataset.v, i = t.indexOf(v); if (i > -1) { if (t.length > 1) t.splice(i, 1); } else t.push(v); el.parentNode.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(t.indexOf(b.dataset.v) > -1)); }); };
  LK.act.ivkm = function (el) { INV.km = el.dataset.v; el.parentNode.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); }); };
  LK.act.ivgps = function () { LK.toast("Location le rahe hain…"); return LK.gps().then(function (p) { INV.lat = p.lat; INV.lng = p.lng; $("#iv-ll").value = p.lat.toFixed(6) + ", " + p.lng.toFixed(6); $("#iv-loc").textContent = "✓ Location mil gayi"; }, function (e) { LK.toast(LK.gpsMsg(e), "bad"); }); };
  LK.act.ivsave = function (el) {
    var ll = String($("#iv-ll").value).split(/[,\s]+/).filter(Boolean).map(parseFloat), em = $("#iv-e").value.trim().toLowerCase();
    if (ll.length === 2 && isFinite(ll[0]) && isFinite(ll[1])) { INV.lat = ll[0]; INV.lng = ll[1]; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return LK.toast("Sahi email likho.", "bad");
    if ($("#iv-n").value.trim().length < 2) return LK.toast("Dukaan ka naam likho.", "bad");
    if (!/^[6-9][0-9]{9}$/.test($("#iv-p").value.trim())) return LK.toast("10 digit ka sahi mobile likho.", "bad");
    if (INV.lat == null) return LK.toast("Dukaan ki location daalo.", "bad");
    var e = LK.top();
    return LK.busy(el, function () { return S.api.adminInviteShop(em, { name: $("#iv-n").value.trim(), owner_name: $("#iv-o").value.trim(), phone: $("#iv-p").value.trim(), address: $("#iv-a").value.trim(), lat: INV.lat, lng: INV.lng, types: INV.types, delivery_km: +INV.km }); }).then(function () { LK.closeSheet(); LK.toast("Register ho gaya ✓ — ab shopkeeper Google login kare"); return V.admin.init(e); });
  };
  LK.act.invcancel = function (el) { var e = LK.top(); return LK.ask("Ye registration cancel karni hai?", "Haan, cancel", true).then(function (ok) { if (ok) return S.api.adminInviteCancel(el.dataset.e).then(function () { return V.admin.init(e); }, LK.fail); }); };
  LK.act.sgappr = function (el) { var e = LK.top(); return LK.busy(el, function () { return S.api.adminSingleApprove(el.dataset.id, +el.dataset.m); }).then(function () { LK.toast("Plan chalu ✓"); return V.admin.init(e); }); };
  LK.act.sgrej = function (el) { var e = LK.top(); return LK.ask("Ye request reject karni hai?", "Haan, reject", true).then(function (ok) { if (ok) return S.api.adminSingleReject(el.dataset.id).then(function () { LK.toast("Reject ho gayi"); return V.admin.init(e); }, LK.fail); }); };
  LK.act.spsave = function (el) { var p = num($("#sp-p").value), q = num($("#sp-q").value), y = num($("#sp-y").value); if (!(p > 0 && q >= 0 && q <= 90 && y >= 0 && y <= 90)) return LK.toast("Daam/discount sahi likho.", "bad"); return LK.busy(el, function () { return S.api.setSinglePrice(p, q, y); }).then(function () { LK.toast("Save ho gaya ✓"); }); };
  LK.act.luckyrej = function (el) { var e = LK.top(); return LK.ask("Ye request reject karni hai?", "Haan, reject", true).then(function (ok) { if (ok) return S.api.adminLuckyReject(el.dataset.id).then(function () { LK.toast("Reject ho gayi"); return V.admin.init(e); }, LK.fail); }); };
  LK.act.adminlucky = function (el) {
    var e = LK.top(), id = el.dataset.id;
    if (el.dataset.v === "0") return LK.ask("Is dukaan ka Lucky Draw band karein?", "Haan, band karo", true).then(function (ok) { if (ok) return S.api.adminSetLucky(id, false, null).then(function () { LK.toast("Lucky Draw band"); return V.admin.init(e); }, LK.fail); });
    var days = +el.dataset.days || 30; LK._lk = { id: id, days: days };
    var d0 = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    LK.sheet('<h3>🎁 Lucky Draw chalu karo</h3><p class="muted sm">Kitne din ke liye? (fees le li ho tabhi)</p><div class="chips flush wrapc">' + [[7, "Hafta"], [30, "Mahina"], [365, "Saal"]].map(function (p) { return '<button class="chip" data-act="lkdays" data-v="' + p[0] + '" aria-pressed="' + (p[0] === days) + '">' + p[1] + "</button>"; }).join("") + '</div><label class="fld"><span>Is tareekh tak (custom bhi chuno)</span><input type="date" id="lk-until" value="' + d0 + '" min="' + new Date().toISOString().slice(0, 10) + '"></label><div class="row2"><button class="btn ghost" data-act="mclose" data-v="0">Band</button><button class="btn" data-act="lkenable">✅ Enable karo</button></div>');
  };
  LK.act.lkdays = function (el) { var n = +el.dataset.v; $("#lk-until").value = new Date(Date.now() + n * 86400000).toISOString().slice(0, 10); el.parentNode.querySelectorAll(".chip").forEach(function (b) { b.setAttribute("aria-pressed", String(b === el)); }); };
  LK.act.lkenable = function (el) {
    var v = $("#lk-until").value; if (!v) return LK.toast("Tareekh chuno.", "bad");
    var e = LK.top(), until = new Date(v + "T23:59:59").toISOString();
    return LK.busy(el, function () { return S.api.adminSetLucky(LK._lk.id, true, until); }).then(function () { LK.closeSheet(); LK.toast("Lucky Draw chalu ✓"); return V.admin.init(e); });
  };
  LK.act.adminset = function (el) { var e = LK.top(); return S.api.adminSetShop(el.dataset.id, el.dataset.v).then(function () { LK.toast("Ho gaya ✓"); return V.admin.init(e); }); };
})();
