/* LoKalLo data layer. API.real talks to Supabase through BE; API.demo keeps everything in memory
   (demo shops are placed around the phone's location) so the whole app can be clicked through without an account. */
(function (root) {
  "use strict";
  var TYPES = { grocery: "Kirana", dairy: "Dairy", bakery: "Bakery", fruitveg: "Fal-Sabzi", sweets: "Mithai" };

  function conv(q, from, to) {
    if (from === to) return q;
    if (from === "g" && to === "kg") return q / 1000;
    if (from === "kg" && to === "g") return q * 1000;
    if (from === "ml" && to === "l") return q / 1000;
    if (from === "l" && to === "ml") return q * 1000;
    return null;
  }
  function km(a, b, c, d) {
    var r = Math.PI / 180, x = Math.sin((c - a) * r / 2), y = Math.sin((d - b) * r / 2);
    return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(x * x + Math.cos(a * r) * Math.cos(c * r) * y * y)));
  }

  /* ================= real backend ================= */
  var R = {
    demo: false,
    signedIn: function () { return BE.signedIn(); },
    me: function () {
      return Promise.all([BE.profile(), BE.myShop(), BE.isAdmin()]).then(function (a) { return { profile: a[0], shop: a[1], admin: a[2], phone: BE.myPhone() }; });
    },
    saveProfile: function (p) { return BE.rpc("lk_save_profile", { p_name: p.full_name, p_phone: p.phone, p_age: +p.age, p_sex: p.sex, p_address: p.address, p_lat: p.lat, p_lng: p.lng }); },
    saveShop: function (p) { return BE.rpc("lk_save_shop", { p: p }); },
    setOpen: function (b) { return BE.rpc("lk_set_open", { p_open: b }); },
    nearbyShops: function (lat, lng, k, type) { return BE.rpc("lk_nearby_shops2", { p_lat: lat, p_lng: lng, p_km: k, p_type: type || null }); },
    shop: function (id) { return BE.rpc("lk_shop_public", { p_shop: id }).then(function (r) { return r && r[0] || null; }); },
    nearbyPromos: function (lat, lng) { return BE.rpc("lk_nearby_promos", { p_lat: lat, p_lng: lng }); },
    catalog: function () { return BE.catalog(); },
    shopItems: function (shopId) { return BE.shopItems(shopId); },
    saveItem: function (it) { return BE.rpc("lk_save_item", { p_id: it.id || null, p_name: it.name, p_unit: it.unit, p_rate: +it.rate, p_available: it.available !== false, p_catalog: it.catalog_id || null }); },
    deleteItem: function (id) { return BE.rpc("lk_delete_item", { p_id: id }); },
    myOrders: function () { return BE.orders("customer_id=eq." + BE.uid()); },
    shopOrders: function (shopId) { return BE.orders("shop_id=eq." + shopId); },
    order: function (id) { return Promise.all([BE.order(id), BE.orderItems(id), BE.orderEvents(id)]).then(function (a) { return { o: a[0], items: a[1] || [], events: a[2] || [] }; }); },
    placeOrder: function (shopId, items, note, feePaid) { return feePaid ? BE.rpc("lk_place_order2", { p_shop: shopId, p_items: items, p_note: note || "", p_fee_paid: true }) : BE.rpc("lk_place_order", { p_shop: shopId, p_items: items, p_note: note || "" }); },
    sendBill: function (id, items, dOk, pOk, charge, note) { return BE.rpc("lk_send_bill", { p_order: id, p_items: items, p_delivery_ok: dOk, p_pickup_ok: pOk, p_delivery_charge: charge, p_bill_note: note || "" }); },
    comment: function (itemId, text) { return BE.rpc("lk_comment_item", { p_item: itemId, p_comment: text }); },
    confirm: function (id, ful, addr, pay) { return BE.rpc("lk_confirm_order", { p_order: id, p_fulfilment: ful, p_address: addr || null, p_payment: pay }); },
    markPaid: function (id) { return BE.rpc("lk_mark_paid", { p_order: id }); },
    cancel: function (id, reason) { return BE.rpc("lk_cancel_order", { p_order: id, p_reason: reason || "" }); },
    setStatus: function (id, st, by, cash) { return BE.rpc("lk_set_status", { p_order: id, p_status: st, p_delivered_by: by == null ? null : by, p_cash: cash == null ? null : cash }); },
    /* ---- delivery boy ---- */
    dboyAdd: function (email, name, phone) { return BE.rpc("lk_dboy_add", { p_email: email, p_name: name || "", p_phone: phone || "" }); },
    custReturn: function (oid, items, note) { return BE.rpc("lk_cust_return", { p_order: oid, p_items: items, p_note: note || "" }); },
    supReturn: function (oid, items, note) { return BE.rpc("lk_sup_return", { p_order: oid, p_items: items, p_note: note || "" }); },
    returnsList: function (d) { return BE.rpc("lk_returns_list", { p_days: d || 30 }); },
    dboyList: function () { return BE.rpc("lk_dboy_list", {}); },
    dboyPay: function (id, type, amt, time) { return BE.rpc("lk_dboy_pay", { p_id: id, p_type: type || "", p_amount: +amt || 0, p_time: time || "" }); },
    dboyDocs: function (id, photo, aadhaar, last4) { return BE.rpc("lk_dboy_docs", { p_id: id, p_photo: photo || null, p_aadhaar: aadhaar || null, p_last4: last4 || null }); },
    kycUpload: function (file) { return BE.uploadKyc(file); },
    kycUrl: function (p) { return BE.kycBlob(p); },
    dboyRemove: function (id) { return BE.rpc("lk_dboy_remove", { p_id: id }); },
    dboyAssign: function (oid, did) { return BE.rpc("lk_dboy_assign", { p_order: oid, p_dboy: did || null }); },
    dboyClaim: function () { return BE.rpc("lk_dboy_claim", {}); },
    dboyMe: function () { return BE.rpc("lk_dboy_me", {}); },
    dboyOrders: function () { return BE.rpc("lk_dboy_orders", {}); },
    dboyStart: function (oid) { return BE.rpc("lk_dboy_start", { p_order: oid }); },
    dboyDeliver: function (oid, cash) { return BE.rpc("lk_dboy_deliver", { p_order: oid, p_cash: !!cash }); },
    dboyLoc: function (oid, lat, lng) { return BE.rpc("lk_dboy_loc_set", { p_order: oid, p_lat: lat, p_lng: lng }); },
    orderDboy: function (oid) { return BE.rpc("lk_order_dboy", { p_order: oid }); },
    dboySettle: function (id) { return BE.rpc("lk_dboy_settle", { p_dboy: id }); },
    dboyHisaab: function (id) { return BE.rpc("lk_dboy_hisaab", { p_dboy: id }); },
    /* ---- supplier ---- */
    supAdd: function (name, phone, email) { return BE.rpc("lk_sup_add", { p_name: name, p_phone: phone || "", p_email: email || "" }); },
    supList: function () { return BE.rpc("lk_sup_list", {}); },
    supRemove: function (id) { return BE.rpc("lk_sup_remove", { p_id: id }); },
    supOrderCreate: function (sid, items, note) { return BE.rpc("lk_sup_order_create", { p_supplier: sid, p_items: items, p_note: note || "" }); },
    supOrders: function (sid) { return BE.rpc("lk_sup_orders", { p_supplier: sid || null }); },
    supCancel: function (oid) { return BE.rpc("lk_sup_cancel", { p_order: oid }); },
    supReceive: function (oid, items) { return BE.rpc("lk_sup_receive", { p_order: oid, p_items: items }); },
    supPay: function (sid, amt, note) { return BE.rpc("lk_sup_pay", { p_supplier: sid, p_amount: +amt, p_note: note || "" }); },
    supLedger: function (sid) { return BE.rpc("lk_sup_ledger", { p_supplier: sid }); },
    supClaim: function () { return BE.rpc("lk_sup_claim", {}); },
    supMe: function () { return BE.rpc("lk_sup_me", {}); },
    supInbox: function () { return BE.rpc("lk_sup_inbox", {}); },
    supStep: function (oid, st, rates) { return BE.rpc("lk_sup_step", { p_order: oid, p_status: st, p_rates: rates || [] }); },
    refund: function (id, amt, note) { return BE.rpc("lk_refund", { p_order: id, p_amount: +amt, p_note: note || "" }); },
    shopCustomers: function (days) { return BE.rpc("lk_shop_customers", { p_days: days || 30 }); },
    ping: function (ed, b) { return BE.rpc("lk_ping", { p_edition: ed, p_build: b || 0 }); },
    adminWallets: function () { return BE.rpc("lk_admin_wallets", {}); },
    adminDevices: function () { return BE.rpc("lk_admin_devices", {}); },
    beat: function (ed, secs) { return BE.rpc("lk_beat", { p_edition: ed, p_secs: secs }); },
    adminActivity: function () { return BE.rpc("lk_admin_activity", {}); },
    subStatus: function () { return BE.rpc("lk_sub_status", {}); },
    subPays: function (sid) { return BE.rpc("lk_sub_pays", { p_shop: sid || null }); },
    multiRequest: function (plan) { return BE.rpc("lk_multi_request", { p_plan: plan }); },
    adminSubOverview: function () { return BE.rpc("lk_admin_sub_overview", {}); },
    adminSubAddPay: function (sid, ed, amt, m, mode, note) { return BE.rpc("lk_admin_sub_addpay", { p_shop: sid, p_edition: ed, p_amount: amt, p_months: m, p_mode: mode, p_note: note || "" }); },
    adminSetSub: function (free, mp) { return BE.rpc("lk_admin_set_sub", { p_free: free || "", p_multi_price: mp }); },
    adminMultiReqs: function () { return BE.rpc("lk_admin_multi_reqs", {}); },
    adminMultiApprove: function (sid, m) { return BE.rpc("lk_admin_multi_approve", { p_shop: sid, p_months: m }); },
    adminOrders: function (days) { return BE.rpc("lk_admin_orders_report", { p_days: days || 30 }); },
    report: function (days) { return BE.rpc("lk_shop_report2", { p_days: days || 30 }); },
    myPromos: function (shopId) { return BE.myPromos(shopId); },
    savePromo: function (title, body, path, kind) { return BE.rpc("lk_save_promo", { p_title: title, p_body: body, p_media_path: path || "", p_media_type: kind || "none" }); },
    endPromo: function (id) { return BE.rpc("lk_end_promo", { p_id: id }); },
    upload: function (file) { return BE.upload(file); },
    setAvatar: function (path) { return BE.rpc("lk_set_avatar", { p_path: path || null }); },
    /* ---- Lucky Draw (module: lucky-draw-module/web) ---- */
    ldSave: function (p) { return BE.rpc("ld_save_draft", { p: p }); },
    ldList: function (sid) { return BE.sel("ld_draws", "shop_id=eq." + sid + "&select=*,ld_prizes(*)&order=created_at.desc&limit=30"); },
    ldLive: function (sid) { return BE.sel("ld_draws", "shop_id=eq." + sid + "&status=in.(live,closed,drawn)&select=*,ld_prizes(*)&order=created_at.desc&limit=5"); },
    ldOne: function (id) { return BE.sel("ld_draws", "id=eq." + id + "&select=*,ld_prizes(*)").then(function (r) { return r && r[0] || null; }); },
    ldCoupons: function (id) { return BE.sel("ld_coupons", "draw_id=eq." + id + "&select=*&order=created_at.desc&limit=1000"); },
    ldWinners: function (id) { return BE.sel("ld_winners", "draw_id=eq." + id + "&select=*,ld_prizes(name,rank),ld_coupons(code,customer_name,customer_phone)&order=slot"); },
    ldGoLive: function (id) { return BE.rpc("ld_go_live", { p_draw: id }); },
    ldIssue: function (id, amt, name, phone, src) { return BE.rpc("ld_issue_coupons", { p_draw: id, p_amount: +amt || 0, p_name: name || "", p_phone: phone || "", p_source: src || "purchase", p_order_ref: "", p_customer_id: null }); },
    ldRun: function (id) { return BE.rpc("ld_run_draw", { p_draw: id }); },
    ldClaim: function (wid) { return BE.rpc("ld_mark_claimed", { p_winner: wid }); },
    ldStatus: function (id, st) { return BE.rpc("ld_set_status", { p_draw: id, p_status: st }); },
    ldResults: function (id) { return BE.rpc("ld_results", { p_draw: id }); },
    ldVerify: function (id) { return BE.rpc("ld_verify_data", { p_draw: id }); },
    ldMine: function () { return BE.rpc("ld_my_coupons", {}); },
    deleteAccount: function () {
      return BE.rpc("lk_my_media", {}).then(function (paths) { return BE.rmMedia(paths); }, function () {})
        .then(function () { return BE.rpc("lk_delete_my_account", {}); })
        .then(function (r) { return BE.logout().then(function () { return r; }); });
    },
    media: function (p) { return BE.mediaUrl(p); },
    adminStats: function () { return BE.rpc("lk_admin_stats2", {}).then(function (r) { return r && r[0] || {}; }); },
    adminShops: function () { return BE.allShops(); },
    singleInfo: function (sid) { return BE.rpc("lk_single_info", { p_shop: sid }).then(function (r) { return Array.isArray(r) ? r[0] : r; }); },
    singlePrices: function () { return BE.rpc("lk_single_prices", {}).then(function (r) { return Array.isArray(r) ? r[0] : r; }); },
    singleRequest: function (plan) { return BE.rpc("lk_single_request", { p_plan: plan }); },
    setBrand: function (b) { return BE.rpc("lk_set_brand", { p: b }); },
    adminSingleReqs: function () { return BE.rpc("lk_admin_single_reqs", {}); },
    adminSingleApprove: function (id, months) { return BE.rpc("lk_admin_single_approve", { p_shop: id, p_months: months }); },
    adminSingleReject: function (id) { return BE.rpc("lk_admin_single_reject", { p_shop: id }); },
    setSinglePrice: function (p, q, y) { return BE.rpc("lk_admin_set_single_price", { p_price: p, p_q: q, p_y: y }); },
    stockList: function () { return BE.sel("lk_stock", "select=*&order=name"); },
    stockSave: function (p) { return BE.rpc("lk_stock_save", { p: p }); },
    stockBuy: function (id, q, r, ex) { return BE.rpc("lk_stock_buy", { p_stock: id, p_qty: q, p_rate: r, p_expiry: ex || null }); },
    stockWaste: function (id, q, n) { return BE.rpc("lk_stock_waste", { p_stock: id, p_qty: q, p_note: n || "" }); },
    stockProfit: function (d) { return BE.rpc("lk_stock_profit", { p_days: d }); },
    expList: function (d) { return BE.sel("lk_expense", "spent_on=gte." + new Date(Date.now() - d * 864e5).toISOString().slice(0, 10) + "&select=*&order=spent_on.desc,created_at.desc&limit=200"); },
    expAdd: function (a, c, n, d) { return BE.rpc("lk_expense_add", { p_amount: a, p_cat: c, p_note: n || "", p_date: d || null }); },
    expDel: function (i) { return BE.rpc("lk_expense_del", { p_id: i }); },
    setUpdateSingle: function (n, u) { return BE.rpc("lk_admin_set_update_single", { p_min: n, p_url: u || "" }); },
    claimInvite: function () { return BE.rpc("lk_claim_invite", {}); },
    adminInviteShop: function (e, p) { return BE.rpc("lk_admin_invite_shop", { p_email: e, p: p }); },
    adminInvites: function () { return BE.rpc("lk_admin_invites2", {}); },
    adminInviteCancel: function (e) { return BE.rpc("lk_admin_invite_cancel", { p_email: e }); },
    promoSearch: function (a) { return BE.fn("lk-promo-search", { area: a }); },
    promoList: function (a, st) { return BE.rpc("lk_promo_list", { p_area: a || "", p_status: st || "" }); },
    promoMark: function (id, st, n) { return BE.rpc("lk_promo_mark", { p_id: id, p_status: st, p_note: n || null }); },
    promoAreas: function () { return BE.rpc("lk_promo_areas", {}); },
    setUpdate: function (n, m) { return BE.rpc("lk_admin_set_update", { p_min: n, p_msg: m || "" }); },
    setLuckyFees: function (w, m, y) { return BE.rpc("lk_admin_set_lucky_fees", { p_week: w, p_month: m, p_year: y }); },
    luckyRequest: function (plan, days) { return BE.rpc("lk_lucky_request", { p_plan: plan, p_days: days || null }); },
    luckyMine: function () { return BE.sel("lk_lucky_req", "owner_id=eq." + BE.uid() + "&select=status,amount,created_at"); },
    adminLuckyReqs: function () { return BE.rpc("lk_admin_lucky_reqs2", {}); },
    adminLuckyReject: function (id) { return BE.rpc("lk_admin_lucky_reject", { p_shop: id }); },
    adminSetLucky: function (id, on, until) { return BE.rpc("lk_admin_lucky_set", { p_shop: id, p_on: !!on, p_until: until || null }); },
    adminSetShop: function (id, st) { return BE.rpc("lk_admin_set_shop", { p_shop: id, p_status: st }); },
    setPoint: function (id, la, ln) { return BE.rpc("lk_set_delivery_point", { p_order: id, p_lat: la, p_lng: ln }); },
    adminPeople: function () { return BE.rpc("lk_admin_people", {}); },
    watchKey: function () { return BE.rpc("lk_watch_key", {}); },
    fees: function () { return BE.sel("lk_settings", "select=key,value,text_value").then(function (r) { var o = { customer_fee: 0, shop_fee: 0, free_days: 0, admin_upi: "", lucky_week: 149, lucky_month: 499, lucky_year: 4999, min_build: 0, update_msg: "" }; (r || []).forEach(function (x) { o[x.key] = +x.value; if (x.key === "admin_upi") o.admin_upi = x.text_value || ""; if (x.key === "min_build") o.min_build = +x.text_value || 0; if (x.key === "update_msg") o.update_msg = x.text_value || ""; if (x.key === "min_build_single") o.min_build_single = +x.text_value || 0; if (x.key === "single_update_url") o.single_update_url = x.text_value || ""; if (x.key === "lucky_fee_week") o.lucky_week = +x.text_value || 0; if (x.key === "lucky_fee_month") o.lucky_month = +x.text_value || 0; if (x.key === "lucky_fee_year") o.lucky_year = +x.text_value || 0; }); return o; }); },
    wallet: function () { return BE.rpc("lk_my_wallet", {}).then(function (w) { return BE.sel("lk_wallet_txn", "select=amount,kind,note,created_at&order=created_at.desc&limit=40").then(function (t) { w.txns = t || []; return w; }); }); },
    applyReferral: function (c) { return BE.rpc("lk_apply_referral", { p_code: c }); },
    setAdminUpi: function (u) { return BE.rpc("lk_admin_set_upi", { p_upi: u || "" }); },
    setFreeDays: function (n) { return BE.rpc("lk_admin_set_free_days", { p_days: n }); },
    markFeePaid: function (id) { return BE.rpc("lk_mark_fee_paid", { p_order: id }); },
    setFee: function (k, v) { return BE.rpc("lk_admin_set_fee", { p_key: k, p_value: v }); },
    logout: function () { return BE.logout(); }
  };

  /* ================= demo (in memory) ================= */
  var D = { demo: true, ready: false };
  var db = null, seq = 1;
  function id() { return "d" + (seq++) + "-" + Math.random().toString(36).slice(2, 7); }
  function now() { return new Date().toISOString(); }
  function wait(v) { return new Promise(function (res) { setTimeout(function () { res(JSON.parse(JSON.stringify(v === undefined ? null : v))); }, 120); }); }
  function fail(code) { return Promise.reject(Object.assign(new Error(BE.friendly(code)), { code: code })); }
  var PH = {
    grocery: "#1B7A2E", dairy: "#1565C0", bakery: "#8D5524", fruitveg: "#43A047", sweets: "#D81B60"
  };
  function pic(type, label) {
    var c = PH[type] || "#1B7A2E";
    var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='480' height='300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='" + c + "'/><stop offset='1' stop-color='#F57C00'/></linearGradient></defs><rect width='480' height='300' fill='url(#g)'/><rect x='70' y='70' width='340' height='170' rx='14' fill='rgba(255,255,255,.18)'/><path d='M70 110h340l-24-48H94z' fill='rgba(255,255,255,.35)'/><text x='240' y='190' font-family='sans-serif' font-size='30' font-weight='700' fill='#fff' text-anchor='middle'>" + label + "</text></svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function seed(lat, lng) {
    function at(dLat, dLng) { return { lat: lat + dLat, lng: lng + dLng }; }
    var shops = [
      { name: "Gupta Kirana Store", owner_name: "Ramesh Gupta", phone: "9876500001", types: ["grocery"], p: at(0.0028, 0.0012), dk: 2, dc: 20, fa: 500, upi: "guptakirana@okaxis" },
      { name: "Shree Krishna Dairy", owner_name: "Mohan Yadav", phone: "9876500002", types: ["dairy"], p: at(-0.0035, 0.0021), dk: 1.5, dc: 10, fa: 200, upi: "krishnadairy@ybl" },
      { name: "Fresh Bake Bakery", owner_name: "Salim Khan", phone: "9876500003", types: ["bakery"], p: at(0.0072, -0.0045), dk: 1, dc: 15, fa: null, upi: "" },
      { name: "Hari Bhari Sabzi Mandi", owner_name: "Suresh Kumar", phone: "9876500004", types: ["fruitveg"], p: at(-0.0018, -0.0039), dk: 2, dc: 0, fa: null, upi: "haribhari@paytm" },
      { name: "Agarwal Mishthan Bhandar", owner_name: "Vinod Agarwal", phone: "9876500005", types: ["sweets", "dairy"], p: at(0.0141, 0.0102), dk: 3, dc: 30, fa: 800, upi: "agarwalsweets@okicici" },
      { name: "Sharma General Store", owner_name: "Anil Sharma", phone: "9876500006", types: ["grocery", "dairy"], p: at(-0.0205, 0.0154), dk: 4, dc: 40, fa: 1000, upi: "sharmastore@okhdfcbank" }
    ];
    db = { shops: [], items: [], orders: [], oitems: [], events: [], promos: [], me: null, myShopId: null };
    shops.forEach(function (s, i) {
      var sid = "shop" + (i + 1);
      db.shops.push({ id: sid, owner_id: "owner" + (i + 1), name: s.name, owner_name: s.owner_name, phone: s.phone, address: ["Main Bazaar", "Station Road", "Gandhi Chowk", "Purani Mandi", "Sadar Bazaar", "Civil Lines"][i] + ", Ward " + (i + 3),
        lat: s.p.lat, lng: s.p.lng, delivery_km: s.dk, min_order: 0, delivery_charge: s.dc, free_above: s.fa, slots: "Subah 8-12, Shaam 5-9", is_open: i !== 2, status: "active", types: s.types,
        photos: [pic(s.types[0], s.name.split(" ")[0]), pic(s.types[s.types.length - 1], "Andar se")], upi_id: s.upi, upi_qr: "" });
    });
    db.promos.push({ id: id(), shop_id: "shop1", title: "Diwali Dhamaka", body: "5 kg aata par 1 packet namak free. Sirf is hafte.", media_path: pic("grocery", "Diwali Offer"), media_type: "image", active: true, created_at: now() });
    db.promos.push({ id: id(), shop_id: "shop5", title: "Taaza Kaju Katli", body: "Shuddh desi ghee ki mithai, ₹880 kilo.", media_path: pic("sweets", "Kaju Katli"), media_type: "image", active: true, created_at: now() });
    // the demo user's own shop (shopkeeper mode)
    db.myShopId = "shop1"; db.shops.forEach(function (s) { if (s.id === "shop1") s.lucky_enabled = true; });
    var rates = { "Gehu Aata": [40, "kg"], "Basmati Chawal": [110, "kg"], "Arhar / Toor Daal": [150, "kg"], "Sarson Tel": [180, "l"], "Cheeni": [46, "kg"], "Chai Patti": [480, "kg"], "Namak": [25, "packet"], "Haldi": [260, "kg"], "Biscuit": [10, "packet"], "Maggi / Noodles": [14, "packet"], "Washing Powder": [55, "packet"], "Moong Daal": [130, "kg"] };
    Object.keys(rates).forEach(function (n) { db.items.push({ id: id(), shop_id: "shop1", catalog_id: null, name: n, unit: rates[n][1], rate: rates[n][0], available: true }); });
    // orders for the demo user as a customer
    addOrder("shop2", "me", "placed", [["Bhains ka Doodh", 2, "l"], ["Paneer", 250, "g"], ["Dahi", 500, "g"]], -40);
    var o2 = addOrder("shop4", "me", "bill_sent", [["Aloo", 2, "kg"], ["Pyaaz", 1, "kg"], ["Tamatar", 500, "g"], ["Dhaniya Patta", 100, "g"]], -90);
    bill(o2, { "Aloo": [30, "kg"], "Pyaaz": [40, "kg"], "Tamatar": [60, "kg"], "Dhaniya Patta": [null] }, 0);
    var o3 = addOrder("shop5", "me", "completed", [["Kaju Katli", 500, "g"], ["Samosa", 6, "piece"]], -3000);
    bill(o3, { "Kaju Katli": [880, "kg"], "Samosa": [15, "piece"] }, 30); o3.status = "completed"; o3.fulfilment = "delivery"; o3.payment_mode = "upi"; o3.customer_paid = true; o3.cash_received = true; o3.total = o3.subtotal + 30; o3.delivered_by = "Raju";
    // orders coming in to the demo user's shop
    addOrder("shop1", "c1", "placed", [["Gehu Aata", 5, "kg"], ["Sarson Tel", 1, "l"], ["Cheeni", 2, "kg"], ["Maggi / Noodles", 4, "packet"], ["Shampoo", 1, "packet"]], -8, "Sunita Devi", "9811100001");
    var s2 = addOrder("shop1", "c2", "bill_sent", [["Basmati Chawal", 1, "kg"], ["Arhar / Toor Daal", 1, "kg"], ["Haldi", 100, "g"]], -55, "Rakesh Verma", "9811100002");
    bill(s2, { "Basmati Chawal": [110, "kg"], "Arhar / Toor Daal": [150, "kg"], "Haldi": [260, "kg"] }, 20);
    db.oitems.filter(function (x) { return x.order_id === s2.id && x.name === "Arhar / Toor Daal"; })[0].customer_comment = "Pichli baar ₹140 tha";
    db.oitems.filter(function (x) { return x.order_id === s2.id && x.name === "Arhar / Toor Daal"; })[0].comment_open = true; s2.has_comment = true;
    var s3 = addOrder("shop1", "c3", "confirmed", [["Chai Patti", 250, "g"], ["Biscuit", 3, "packet"], ["Namak", 1, "packet"]], -180, "Pooja Singh", "9811100003");
    bill(s3, { "Chai Patti": [480, "kg"], "Biscuit": [10, "packet"], "Namak": [25, "packet"] }, 20); s3.status = "confirmed"; s3.fulfilment = "delivery"; s3.payment_mode = "cod"; s3.total = s3.subtotal + 20;
    var s4 = addOrder("shop1", "c4", "completed", [["Gehu Aata", 10, "kg"], ["Cheeni", 1, "kg"]], -1500, "Mahesh Patel", "9811100004");
    bill(s4, { "Gehu Aata": [40, "kg"], "Cheeni": [46, "kg"] }, 0); s4.status = "completed"; s4.fulfilment = "pickup"; s4.payment_mode = "upi"; s4.customer_paid = true; s4.cash_received = true; s4.total = s4.subtotal;
    var s5 = addOrder("shop1", "c5", "completed", [["Moong Daal", 2, "kg"], ["Washing Powder", 2, "packet"]], -2900, "Kavita Mishra", "9811100005");
    bill(s5, { "Moong Daal": [130, "kg"], "Washing Powder": [55, "packet"] }, 20); s5.status = "completed"; s5.fulfilment = "delivery"; s5.payment_mode = "cod"; s5.cash_received = true; s5.total = s5.subtotal + 20;
  }
  function addOrder(shopId, cust, status, lines, minsAgo, name, phone) {
    var t = new Date(Date.now() + minsAgo * 60000).toISOString();
    var o = { id: id(), code: Math.random().toString(36).slice(2, 8).toUpperCase(), customer_id: cust, shop_id: shopId, status: status,
      customer_avatar: name ? "" : ((db.me && db.me.avatar_path) || ""), customer_name: name || (db.me && db.me.full_name) || "Aap", customer_phone: phone || (db.me && db.me.phone) || "9000000000", address: name ? "Gali " + (2 + seq % 7) + ", Ward " + (1 + seq % 9) : ((db.me && db.me.address) || "Mera ghar"),
      note: "", delivery_ok: true, pickup_ok: true, delivery_charge: 0, bill_note: "", bill_version: 0, subtotal: 0, fulfilment: null, total: 0, delivered_by: "", cash_received: false,
      refund_amount: 0, refund_note: "", cancel_reason: "", has_comment: false, payment_mode: null, customer_paid: false, created_at: t, updated_at: t };
    db.orders.push(o);
    lines.forEach(function (l, i) { db.oitems.push({ id: id(), order_id: o.id, pos: i + 1, catalog_id: null, name: l[0], qty: l[1], qty_unit: l[2], rate: null, rate_unit: null, amount: null, removed: false, customer_comment: "", shop_reply: "", comment_open: false }); });
    db.events.push({ order_id: o.id, event: "placed", at: t });
    return o;
  }
  function bill(o, rates, charge) {
    var sub = 0;
    db.oitems.filter(function (x) { return x.order_id === o.id; }).forEach(function (it) {
      var r = rates[it.name];
      if (!r || r[0] == null) { it.removed = true; it.amount = 0; it.rate = null; return; }
      it.rate = r[0]; it.rate_unit = r[1];
      var q = conv(it.qty, it.qty_unit, r[1]); it.amount = Math.round((q == null ? it.qty : q) * r[0] * 100) / 100; sub += it.amount;
    });
    o.subtotal = sub; o.total = sub; o.delivery_charge = charge; o.bill_version++; if (o.status === "placed") o.status = "bill_sent";
    db.events.push({ order_id: o.id, event: "bill_sent", at: now() });
  }
  function ord(id) { return db.orders.filter(function (o) { return o.id === id; })[0]; }
  function withShop(o) { var s = db.shops.filter(function (x) { return x.id === o.shop_id; })[0] || {}; var c = Object.assign({}, o); c.lk_shops = { name: s.name, phone: s.phone, address: s.address, lat: s.lat, lng: s.lng }; return c; }
  function log(oid, ev) { db.events.push({ order_id: oid, event: ev, at: now() }); }

  D.start = function (lat, lng, registered) { if (!db) { seed(lat, lng); db.shopRegistered = !!registered; } D.ready = true; };
  D.signedIn = function () { return true; };
  D.me = function () { return wait({ profile: db.me, shop: db.shopRegistered ? (db.shops.filter(function (s) { return s.id === db.myShopId; })[0] || null) : null, admin: true, phone: db.me ? db.me.phone : "" }); };
  D.saveProfile = function (p) {
    var keep = db.me, reg = db.shopRegistered; if (!db.seedAt || km(db.seedAt[0], db.seedAt[1], p.lat, p.lng) > 0.3) { seed(p.lat, p.lng); db.shopRegistered = reg; }
    db.seedAt = [p.lat, p.lng]; db.me = { id: "me", created_at: new Date(Date.now() - 2 * 86400000).toISOString(), full_name: p.full_name, phone: p.phone, age: +p.age, sex: p.sex, address: p.address, lat: p.lat, lng: p.lng };
    db.orders.forEach(function (o) { if (o.customer_id === "me") { o.customer_name = p.full_name; o.customer_phone = p.phone; } }); return wait(); };
  D.saveShop = function (p) {
    var s = db.shops.filter(function (x) { return x.id === db.myShopId; })[0];
    if (!s) { s = { id: "myshop", owner_id: "me", status: "active" }; db.shops.push(s); db.myShopId = "myshop"; }
    db.shopRegistered = true; Object.assign(s, p); return wait(s.id);
  };
  D.setOpen = function (b) { var s = db.shops.filter(function (x) { return x.id === db.myShopId; })[0]; if (s) s.is_open = b; return wait(); };
  D.nearbyShops = function (lat, lng, k, type) {
    k = Math.min(Math.max(+k || 2, 0.5), 50);
    var r = db.shops.filter(function (s) { return s.status === "active" && (!type || s.types.indexOf(type) > -1); }).map(function (s) {
      var d = km(lat, lng, s.lat, s.lng); var c = Object.assign({}, s); c.km = Math.round(d * 100) / 100; c.delivers = d <= s.delivery_km; c.photo = s.photos[0] || ""; c.has_upi = !!s.upi_id; return c;
    }).filter(function (s) { return s.km <= k; });
    r.sort(function (a, b) { return (b.is_open - a.is_open) || (a.km - b.km); });
    return wait(r);
  };
  D.shop = function (sid) { return wait(db.shops.filter(function (s) { return s.id === sid; })[0] || null); };
  D.nearbyPromos = function (lat, lng) {
    return wait(db.promos.filter(function (p) { return p.active; }).map(function (p) { var s = db.shops.filter(function (x) { return x.id === p.shop_id; })[0]; var c = Object.assign({}, p); c.shop_name = s.name; c.km = Math.round(km(lat, lng, s.lat, s.lng) * 10) / 10; return c; }).filter(function (p) { return p.km <= 4; }));
  };
  D.catalog = function () { return wait(root.LK_CATALOG || []); };
  D.shopItems = function (sid) { return wait(db.items.filter(function (i) { return i.shop_id === sid; }).sort(function (a, b) { return a.name.localeCompare(b.name); })); };
  D.saveItem = function (it) {
    var cur = it.id ? db.items.filter(function (x) { return x.id === it.id; })[0] : db.items.filter(function (x) { return x.shop_id === db.myShopId && x.name === it.name; })[0];
    if (!cur) { cur = { id: id(), shop_id: db.myShopId }; db.items.push(cur); }
    Object.assign(cur, { name: it.name, unit: it.unit, rate: +it.rate, available: it.available !== false, catalog_id: it.catalog_id || cur.catalog_id || null }); return wait(cur.id);
  };
  D.deleteItem = function (iid) { db.items = db.items.filter(function (x) { return x.id !== iid; }); return wait(); };
  D.myOrders = function () { return wait(db.orders.filter(function (o) { return o.customer_id === "me"; }).map(withShop).sort(function (a, b) { return b.created_at.localeCompare(a.created_at); })); };
  D.shopOrders = function (sid) { return wait(db.orders.filter(function (o) { return o.shop_id === sid; }).map(withShop).sort(function (a, b) { return b.created_at.localeCompare(a.created_at); })); };
  D.order = function (oid) { var o = ord(oid); return wait({ o: withShop(o), items: db.oitems.filter(function (x) { return x.order_id === oid; }).sort(function (a, b) { return a.pos - b.pos; }), events: db.events.filter(function (e) { return e.order_id === oid; }) }); };
  D.placeOrder = function (sid, items, note) {
    var s = db.shops.filter(function (x) { return x.id === sid; })[0];
    if (!s.is_open) return fail("shop_closed");
    if (sid === db.myShopId) return fail("own_shop");
    var o = addOrder(sid, "me", "placed", items.map(function (i) { return [i.name, +i.qty, i.qty_unit]; }), 0);
    o.note = note || "";
    // the demo shopkeeper answers with a bill after a few seconds
    setTimeout(function () {
      if (o.status !== "placed") return;
      var rates = {};
      db.oitems.filter(function (x) { return x.order_id === o.id; }).forEach(function (it) {
        var base = { kg: 60, g: 60, l: 120, ml: 120, packet: 25, piece: 12 }[it.qty_unit] || 30;
        var r = Math.round(base * (0.7 + ((it.name.length * 37) % 60) / 100));
        rates[it.name] = [r, it.qty_unit === "g" ? "kg" : it.qty_unit === "ml" ? "l" : it.qty_unit];
      });
      bill(o, rates, s.delivery_charge || 0); o.updated_at = now();
    }, 6000);
    return wait(o.id);
  };
  D.sendBill = function (oid, items, dOk, pOk, charge, note) {
    var o = ord(oid); if (["placed", "bill_sent"].indexOf(o.status) < 0) return fail("bill_locked");
    if (!dOk && !pOk) return fail("choose_delivery_or_pickup");
    var sub = 0, bad = null;
    items.forEach(function (e) {
      var it = db.oitems.filter(function (x) { return x.id === e.id; })[0];
      if (e.shop_reply != null) it.shop_reply = e.shop_reply;
      it.comment_open = false;
      if (e.removed) { it.removed = true; it.rate = null; it.amount = 0; return; }
      if (e.rate == null || e.rate === "" || +e.rate < 0) { bad = "rate_missing"; return; }
      it.removed = false; it.rate = +e.rate; it.rate_unit = e.rate_unit;
      var q = conv(+it.qty, it.qty_unit, e.rate_unit);
      it.amount = q != null ? Math.round(q * it.rate * 100) / 100 : +e.amount;
      if (!(it.amount >= 0)) bad = "amount_missing";
    });
    if (bad) return fail(bad);
    db.oitems.filter(function (x) { return x.order_id === oid && !x.removed; }).forEach(function (x) { sub += +x.amount || 0; });
    log(oid, o.status === "bill_sent" ? "bill_updated" : "bill_sent");
    Object.assign(o, { status: "bill_sent", delivery_ok: dOk, pickup_ok: pOk, delivery_charge: +charge || 0, bill_note: note || "", subtotal: sub, total: sub, has_comment: false, updated_at: now() });
    o.bill_version++;
    return wait();
  };
  D.comment = function (iid, text) {
    var it = db.oitems.filter(function (x) { return x.id === iid; })[0]; var o = ord(it.order_id);
    it.customer_comment = text; it.comment_open = true; o.has_comment = true; o.updated_at = now(); log(o.id, "comment");
    // demo shopkeeper replies and lowers the rate a little
    setTimeout(function () {
      if (o.status !== "bill_sent" || !it.comment_open) return;
      it.rate = Math.round(it.rate * 0.95); var q = conv(+it.qty, it.qty_unit, it.rate_unit); it.amount = Math.round((q == null ? 1 : q) * it.rate * 100) / 100;
      it.shop_reply = "Theek hai, ₹" + it.rate + " laga diya"; it.comment_open = false;
      var sub = 0; db.oitems.filter(function (x) { return x.order_id === o.id && !x.removed; }).forEach(function (x) { sub += +x.amount || 0; });
      o.subtotal = sub; o.total = sub; o.bill_version++; o.has_comment = false; o.updated_at = now(); log(o.id, "bill_updated");
    }, 5000);
    return wait();
  };
  D.confirm = function (oid, ful, addr, pay) {
    var o = ord(oid); if (o.status !== "bill_sent") return fail("not_bill_stage");
    if (!ful) return fail("choose_delivery_or_pickup");
    if (ful === "delivery" && String(addr || "").trim().length < 5) return fail("address_required");
    var s = db.shops.filter(function (x) { return x.id === o.shop_id; })[0];
    if (pay === "upi" && !s.upi_id) return fail("upi_not_available");
    Object.assign(o, { status: "confirmed", fulfilment: ful, payment_mode: pay, address: ful === "delivery" ? addr : o.address, customer_fee: D.freeNow() ? 0 : D.f().customer_fee, shop_fee: D.freeNow() ? 0 : D.f().shop_fee, total: o.subtotal + (ful === "delivery" ? o.delivery_charge : 0) + (D.freeNow() ? 0 : D.f().customer_fee), has_comment: false, updated_at: now() });
    log(oid, "confirmed");
    if (o.customer_id === "me") setTimeout(function () { if (o.status === "confirmed") { o.status = ful === "delivery" ? "out_for_delivery" : "ready"; o.delivered_by = ful === "delivery" ? "Raju" : ""; o.updated_at = now(); log(oid, o.status); } }, 8000);
    return wait();
  };
  D.markPaid = function (oid) { var o = ord(oid); o.customer_paid = true; o.payment_mode = "upi"; o.updated_at = now(); log(oid, "customer_paid"); return wait(); };
  D.cancel = function (oid, reason) {
    var o = ord(oid); if (["placed", "bill_sent"].indexOf(o.status) < 0) return fail("not_cancellable");
    o.status = o.customer_id === "me" ? "cancelled" : "rejected"; o.cancel_reason = reason || ""; o.updated_at = now(); log(oid, o.status); return wait();
  };
  D.setStatus = function (oid, st, by, cash) {
    var o = ord(oid); var was = o.status; o.status = st; if (by != null) o.delivered_by = by; if (cash != null) o.cash_received = cash; o.updated_at = now(); log(oid, st); if (st === "completed" && was !== "completed" && D.ldAuto) D.ldAuto(o); return wait();
  };
  /* delivery boy (demo): shopkeeper side only, one fake boy flow */
  D.dboyAdd = function (email, name, phone) { db.dboys = db.dboys || []; var x = { id: id(), email: String(email || "").toLowerCase(), name: name || "", phone: phone || "", claimed: false, pending: 0, delivered: 0, open: 0 }; db.dboys.push(x); return wait(x.id); };
  D.dboyList = function () { var l = db.dboys || []; l.forEach(function (b) { b.open = db.orders.filter(function (o) { return o.dboy_id === b.id && ["confirmed", "ready", "out_for_delivery"].indexOf(o.status) > -1; }).length; }); return wait(l.slice()); };
  D.dboyDocs = function () { return wait(); };
  D.kycUpload = function () { return wait("demo/x.jpg"); };
  D.kycUrl = function () { return wait(""); };
  D.dboyPay = function () { return wait(); };
  D.custReturn = function (oid, items, note) { var o = ord(oid), tot = 0; db.returns = db.returns || []; items.forEach(function (x) { var it = db.oitems.filter(function (i) { return i.id === x.item_id; })[0]; if (!it) return; var q = Math.min(+x.qty || 0, it.qty - (it.ret_qty || 0)); if (q <= 0) return; var a = Math.round((it.amount || 0) * q / it.qty * 100) / 100; it.ret_qty = (it.ret_qty || 0) + q; tot += a; db.returns.unshift({ kind: "customer", who: o.customer_name || "Customer", code: o.code, name: it.name, qty: q, unit: it.qty_unit, amount: a, restock: !!x.restock, at: now() }); var s = stk().filter(function (z) { return z.name.toLowerCase() === it.name.toLowerCase(); })[0]; if (s && x.restock) s.qty += q; }); o.refund_amount = (o.refund_amount || 0) + tot; log(oid, "returned"); return wait(tot); };
  D.supReturn = function (oid, items) { var o = sorders().filter(function (x) { return x.id === oid; })[0], tot = 0; db.returns = db.returns || []; items.forEach(function (x) { var it = o.items.filter(function (i) { return i.id === x.id; })[0]; if (!it) return; var q = Math.min(+x.qty || 0, (it.got_qty || 0) - (it.ret_qty || 0)); if (q <= 0) return; it.ret_qty = (it.ret_qty || 0) + q; var a = q * (it.rate || 0); tot += a; spays().push({ supplier_id: o.supplier_id, amount: a, note: "Return " + it.name, at: now() }); db.returns.unshift({ kind: "supplier", who: (sups().filter(function (s) { return s.id === o.supplier_id; })[0] || {}).name, code: o.code, name: it.name, qty: q, unit: it.unit, amount: a, restock: false, at: now() }); var s = stk().filter(function (z) { return z.name.toLowerCase() === it.name.toLowerCase(); })[0]; if (s) s.qty = Math.max(s.qty - q, 0); }); return wait(tot); };
  D.returnsList = function () { return wait(db.returns || []); };
  D.dboyRemove = function (bid) { db.dboys = (db.dboys || []).filter(function (b) { return b.id !== bid; }); return wait(); };
  D.dboyAssign = function (oid, bid) { var o = ord(oid); o.dboy_id = bid || null; log(oid, bid ? "dboy_assigned" : "dboy_unassigned"); return wait(); };
  D.dboyClaim = function () { return wait(false); };
  D.dboyMe = function () { return wait([]); };
  D.dboyOrders = function () { return wait([]); };
  D.dboyStart = function () { return wait(); };
  D.dboyDeliver = function () { return wait(); };
  D.dboyLoc = function () { return wait(); };
  D.orderDboy = function (oid) { var o = ord(oid), b = (db.dboys || []).filter(function (x) { return x.id === o.dboy_id; })[0]; return wait(b ? { name: b.name || "Delivery boy", phone: b.phone, lat: null, lng: null, at: null, status: o.status } : null); };
  D.dboySettle = function () { return wait(0); };
  D.dboyHisaab = function () { return wait([]); };
  /* supplier (demo): shopkeeper side only */
  function sups() { return db.sups || (db.sups = []); }
  function sorders() { return db.sorders || (db.sorders = []); }
  function spays() { return db.spays || (db.spays = []); }
  function sbal(sid) { return sorders().filter(function (o) { return o.supplier_id === sid && o.status === "received"; }).reduce(function (a, o) { return a + o.total; }, 0) - spays().filter(function (p) { return p.supplier_id === sid; }).reduce(function (a, p) { return a + p.amount; }, 0); }
  D.supAdd = function (name, phone, email) { var x = { id: id(), name: name, phone: phone || "", email: email || "", claimed: false }; sups().push(x); return wait(x.id); };
  D.supList = function () { return wait(sups().map(function (s) { return Object.assign({}, s, { balance: sbal(s.id), open: sorders().filter(function (o) { return o.supplier_id === s.id && ["sent", "accepted", "delivered"].indexOf(o.status) > -1; }).length }); })); };
  D.supRemove = function (sid) { db.sups = sups().filter(function (s) { return s.id !== sid; }); return wait(); };
  D.supOrderCreate = function (sid, items, note) { var o = { id: id(), code: "S" + Math.random().toString(36).slice(2, 7).toUpperCase(), supplier_id: sid, status: "sent", note: note || "", total: 0, created_at: now(), updated_at: now(), items: items.map(function (i) { return { id: id(), stock_id: i.stock_id || null, name: i.name, unit: i.unit, qty: +i.qty, rate: null, got_qty: null }; }) }; sorders().unshift(o); return wait(o.id); };
  D.supOrders = function (sid) { return wait(sorders().filter(function (o) { return !sid || o.supplier_id === sid; })); };
  D.supCancel = function (oid) { sorders().forEach(function (o) { if (o.id === oid) o.status = "cancelled"; }); return wait(); };
  D.supReceive = function (oid, items) { var o = sorders().filter(function (x) { return x.id === oid; })[0], tot = 0; items.forEach(function (it) { var r = o.items.filter(function (x) { return x.id === it.id; })[0]; if (!r || !(+it.qty > 0)) return; r.got_qty = +it.qty; r.rate = +it.rate || 0; var s = stk().filter(function (x) { return x.name.toLowerCase() === r.name.toLowerCase(); })[0]; if (!s) { s = { id: id(), name: r.name, unit: r.unit, qty: 0, buy_rate: 0, low_at: 5 }; stk().push(s); } s.buy_rate = (Math.max(s.qty, 0) * s.buy_rate + r.got_qty * r.rate) / (Math.max(s.qty, 0) + r.got_qty); s.qty += r.got_qty; tot += r.got_qty * r.rate; }); o.status = "received"; o.total = tot; o.updated_at = now(); return wait(tot); };
  D.supPay = function (sid, amt, note) { spays().push({ supplier_id: sid, amount: +amt, note: note || "", at: now() }); return wait(); };
  D.supLedger = function (sid) { return wait(sorders().filter(function (o) { return o.supplier_id === sid && o.status === "received"; }).map(function (o) { return { kind: "maal", code: o.code, amount: o.total, at: o.updated_at }; }).concat(spays().filter(function (p) { return p.supplier_id === sid; }).map(function (p) { return { kind: "pay", note: p.note, amount: p.amount, at: p.at }; }))); };
  D.supClaim = function () { return wait(false); };
  D.supMe = function () { return wait([]); };
  D.supInbox = function () { return wait([]); };
  D.supStep = function () { return wait(); };
  D.refund = function (oid, amt, note) { var o = ord(oid); if (!(+amt > 0) || +amt > o.total) return fail("invalid_amount"); o.refund_amount = +amt; o.refund_note = note; log(oid, "refunded"); return wait(); };
  D.shopCustomers = function () {
    var m = {};
    db.orders.filter(function (o) { return o.shop_id === db.myShopId; }).forEach(function (o) {
      var k = o.customer_phone || o.customer_name, r = m[k] = m[k] || { customer_id: k, name: o.customer_name, phone: o.customer_phone, orders: 0, done: 0, cancelled: 0, spent: 0, last_order: o.created_at, first_order: o.created_at };
      r.orders++; if (o.status === "completed") { r.done++; r.spent += o.total - (o.customer_fee || 0); } if (o.status === "cancelled" || o.status === "rejected") r.cancelled++;
      if (o.created_at > r.last_order) r.last_order = o.created_at; if (o.created_at < r.first_order) r.first_order = o.created_at;
    });
    return wait(Object.keys(m).map(function (k) { return m[k]; }).sort(function (x, y) { return y.orders - x.orders; }));
  };
  D.subStatus = function () { return wait({ free_now: true, free_until: new Date(Date.now() + 30 * 864e5).toISOString(), single_until: null, multi_until: null, single_price: 2000, multi_price: 299, q_off: 10, y_off: 20, multi_ok: true }); };
  D.subPays = function () { return wait([]); };
  D.multiRequest = function () { return wait(); };
  D.adminSubOverview = function () { return wait({ free_now: true, free_until: new Date(Date.now() + 30 * 864e5).toISOString(), multi_price: 299, single_price: 2000, collected_total: 0, collected_30: 0, shops: [] }); };
  D.adminSubAddPay = function () { return wait(); };
  D.adminSetSub = function () { return wait(); };
  D.adminMultiReqs = function () { return wait([]); };
  D.adminMultiApprove = function () { return wait(); };
  D.adminWallets = function () { return wait({ settings: { reward: 2, unlock: 100 }, tot_balance: 40, tot_earned: 52, tot_used: 12, tot_refs: 6, tot_rewarded: 4, users: [{ id: "1", name: "Ram", phone: "9999999999", code: "RAM7K2", balance: 24, earned: 30, used: 6, referred: 5, rewarded: 3, by: null, last: new Date().toISOString() }, { id: "2", name: "Sita", phone: "8888888888", code: "SIT9A1", balance: 0, earned: 0, used: 0, referred: 0, rewarded: 0, by: "Ram", last: null }] }); };
  D.adminDevices = function () { return wait({ total: 3, new_today: 1, new_7: 3, active_7: 2, no_login: 1, by_edition: [{ edition: "multi", n: 3, a7: 2 }], by_build: [] }); };
  D.beat = function () { return wait(); };
  D.ping = function () { return wait(); };
  D.adminActivity = function () { return wait({ registered: 128, tracked: 2, online_now: 1, secs_today: 600, secs_7: 3600, d1: 1, d7: 2, d30: 2, by_edition: [{ edition: "multi", users: 2, d7: 2 }], by_build: [{ edition: "multi", build: 82, users: 2 }], recent: [] }); };
  D.adminOrders = function () {
    var m = {};
    db.orders.forEach(function (o) {
      [["shop", o.shop_id, (db.shops.filter(function (s) { return s.id === o.shop_id; })[0] || {}).name, ""], ["cust", o.customer_phone || o.customer_name, o.customer_name, o.customer_phone]].forEach(function (t) {
        var k = t[0] + t[1], r = m[k] = m[k] || { kind: t[0], id: t[1], name: t[2], phone: t[3], orders: 0, done: 0, cancelled: 0, spent: 0, shops: 0, last_order: o.created_at, _s: {} };
        r.orders++; r._s[o.shop_id] = 1; r.shops = Object.keys(r._s).length; if (o.status === "completed") { r.done++; r.spent += o.total - (o.customer_fee || 0); } if (o.status === "cancelled" || o.status === "rejected") r.cancelled++;
      });
    });
    return wait(Object.keys(m).map(function (k) { return m[k]; }));
  };
  D.report = function () {
    var m = {};
    db.orders.filter(function (o) { return o.shop_id === db.myShopId && o.status === "completed"; }).forEach(function (o) {
      var d = o.created_at.slice(0, 10); m[d] = m[d] || { day: d, orders: 0, sales: 0, refunds: 0, platform_fee: 0 }; m[d].orders++; m[d].sales += o.total - (o.customer_fee || 0); m[d].refunds += o.refund_amount; m[d].platform_fee += (o.customer_fee || 0) + (o.shop_fee || 0);
    });
    return wait(Object.keys(m).sort().reverse().map(function (k) { return m[k]; }));
  };
  D.myPromos = function (sid) { return wait(db.promos.filter(function (p) { return p.shop_id === sid; })); };
  D.savePromo = function (title, body, path, kind) { db.promos.unshift({ id: id(), shop_id: db.myShopId, title: title, body: body, media_path: path, media_type: path ? kind : "none", active: true, created_at: now() }); return wait(); };
  D.endPromo = function (pid) { db.promos.forEach(function (p) { if (p.id === pid) p.active = false; }); return wait(); };
  D.upload = function (file) { return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(file); }); };
  D.media = function (p) { return p || ""; };
  D.adminStats = function () { return wait({ shops: db.shops.length, active_shops: db.shops.filter(function (s) { return s.status === "active"; }).length, customers: 128, orders: db.orders.length, completed: db.orders.filter(function (o) { return o.status === "completed"; }).length, sales: db.orders.filter(function (o) { return o.status === "completed"; }).reduce(function (a, o) { return a + o.total - (o.customer_fee || 0); }, 0), fees: db.orders.filter(function (o) { return o.status === "completed"; }).reduce(function (a, o) { return a + (o.customer_fee || 0) + (o.shop_fee || 0); }, 0) }); };
  D.adminShops = function () { return wait(db.shops); };
  D.adminSetLucky = function (sid, on, until) { db.shops.forEach(function (s) { if (s.id === sid) { s.lucky_enabled = !!on; s.lucky_until = on ? until || null : null; } }); db.lreq = (db.lreq || []).filter(function (r) { return r.shop_id !== sid; }); return wait(); };
  D.singleInfo = function () { var b = db.brand || {}; return wait({ brand: b, active: db.singleOn !== false, until: new Date(Date.now() + 25 * 864e5).toISOString() }); };
  D.singlePrices = function () { return wait(db.sprice || { price: 2000, q_off: 10, y_off: 20 }); };
  D.singleRequest = function (plan) { var p = D.singlePricesNow(), m = plan === "year" ? 12 : plan === "quarter" ? 3 : 1, off = plan === "year" ? p.y_off : plan === "quarter" ? p.q_off : 0; (db.sreq = db.sreq || []).push({ shop_id: db.myShopId || "demo", shop_name: "Meri dukaan", phone: "9876543210", plan: plan, months: m, amount: Math.round(p.price * m * (100 - off) / 100), created_at: now() }); return wait(); };
  D.singlePricesNow = function () { return db.sprice || { price: 2000, q_off: 10, y_off: 20 }; };
  D.setBrand = function (b) { db.brand = b; return wait(); };
  D.adminSingleReqs = function () { return wait(db.sreq || []); };
  D.adminSingleApprove = function (id) { db.sreq = (db.sreq || []).filter(function (r) { return r.shop_id !== id; }); return wait(); };
  D.adminSingleReject = D.adminSingleApprove;
  D.setSinglePrice = function (p, q, y) { db.sprice = { price: p, q_off: q, y_off: y }; return wait(); };
  function stk() { return db.stock || (db.stock = []); }
  D.stockList = function () { return wait(stk().slice().sort(function (a, b) { return a.name < b.name ? -1 : 1; })); };
  D.stockSave = function (p) { var s = p.id ? stk().filter(function (x) { return x.id === p.id; })[0] : null; if (!s) { s = { id: id(), qty: 0, buy_rate: 0 }; stk().push(s); } Object.assign(s, { name: p.name, unit: p.unit, low_at: +p.low_at || 0, expiry: p.expiry || null }); return wait(s.id); };
  D.stockBuy = function (i, q, r, ex) { var s = stk().filter(function (x) { return x.id === i; })[0]; s.buy_rate = (Math.max(s.qty, 0) * s.buy_rate + q * r) / (Math.max(s.qty, 0) + q); s.qty += q; if (ex) s.expiry = ex; return wait(); };
  D.stockWaste = function (i, q) { var s = stk().filter(function (x) { return x.id === i; })[0]; s.qty = Math.max(s.qty - q, 0); return wait(); };
  D.stockProfit = function () { return wait(db.orders.filter(function (o) { return o.status === "completed"; }).map(function (o) { return { order_id: o.id, code: o.code, created_at: o.created_at, revenue: o.total - (o.customer_fee || 0), cost: Math.round((o.total - (o.customer_fee || 0)) * 0.8), unmatched: 0 }; })); };
  D.expList = function (d) { var c = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10); return wait((db.exp || []).filter(function (x) { return x.spent_on >= c; })); };
  D.expAdd = function (a, c, n, d) { (db.exp = db.exp || []).unshift({ id: id(), amount: a, category: c, note: n || "", spent_on: d || new Date().toISOString().slice(0, 10) }); return wait(); };
  D.expDel = function (i) { db.exp = (db.exp || []).filter(function (x) { return x.id !== i; }); return wait(); };
  D.setUpdateSingle = function (n, u) { var f = D.f(); f.min_build_single = n; f.single_update_url = u; return wait(); };
  D.claimInvite = function () { return wait(false); };
  D.adminInviteShop = function (e, p) { (db.inv = db.inv || []).unshift({ email: e, name: p.name, phone: p.phone, created_at: now(), claimed_at: null, cancelled: false }); return wait(); };
  D.adminInvites = function () { return wait(db.inv || []); };
  D.adminInviteCancel = function (e) { (db.inv || []).forEach(function (i) { if (i.email === e) { i.cancelled = true; i.claimed_at = now(); } }); return wait(); };
  function pl() { return db.pl || (db.pl = [{ id: "p1", name: "Gupta General Store", phone: "9812345670", address: "Main Bazaar", lat: 29.85, lng: 77.89, area: "roorkee", status: "new" }, { id: "p2", name: "Jain Kirana", phone: "", address: "Civil Lines", lat: 29.86, lng: 77.9, area: "roorkee", status: "new" }]); }
  D.promoSearch = function (a) { return wait({ ok: true, found: 2, with_phone: 1 }); };
  D.promoList = function (a, st) { return wait(pl().filter(function (x) { return !st || x.status === st; })); };
  D.promoMark = function (i, st) { pl().forEach(function (x) { if (x.id === i) x.status = st; }); return wait(); };
  D.promoAreas = function () { return wait([{ area: "roorkee", total: 2, with_phone: 1 }]); };
  D.setUpdate = function (n, m) { var f = D.f(); f.min_build = n; f.update_msg = m; return wait(); };
  D.setLuckyFees = function (w, m, y) { var f = D.f(); f.lucky_week = w; f.lucky_month = m; f.lucky_year = y; return wait(); };
  D.luckyRequest = function (plan, days) { var f = D.f(), dd = plan === "week" ? 7 : plan === "month" ? 30 : plan === "year" ? 365 : Math.max(1, days || 1), am = plan === "week" ? f.lucky_week : plan === "month" ? f.lucky_month : plan === "year" ? f.lucky_year : Math.ceil(dd * f.lucky_month / 30); var sh = db.shops.filter(function (s) { return s.id === db.myShopId; })[0] || {}; db.lreq = (db.lreq || []).filter(function (r) { return r.shop_id !== db.myShopId; }); db.lreq.push({ shop_id: db.myShopId, shop_name: sh.name || "Meri dukaan", phone: sh.phone || "9000000000", amount: am, plan: plan, days: dd, created_at: now() }); return wait(); };
  D.luckyMine = function () { return wait((db.lreq || []).filter(function (r) { return r.shop_id === db.myShopId; }).map(function (r) { return { status: "pending", amount: r.amount }; })); };
  D.adminLuckyReqs = function () { return wait(db.lreq || []); };
  D.adminLuckyReject = function (sid) { db.lreq = (db.lreq || []).filter(function (r) { return r.shop_id !== sid; }); return wait(); };
  D.adminSetShop = function (sid, st) { db.shops.forEach(function (s) { if (s.id === sid) s.status = st; }); return wait(); };
  D.f = function () { return db.fees || (db.fees = { customer_fee: 3, shop_fee: 3, free_days: 7, admin_upi: "9837900303@ybl", lucky_week: 149, lucky_month: 499, lucky_year: 4999 }); };
  D.freeNow = function () { var c = db.me && db.me.created_at; return !!c && (Date.now() - new Date(c).getTime()) < D.f().free_days * 86400000; };
  D.wallet = function () { var w = db.wallet || (db.wallet = { balance: 24, earned: 24, unlock: 100, unlocked: false, reward: 2, code: "RAM7K2", referred: 14, rewarded: 12, used_code: false, txns: [{ amount: 2, kind: "referral", note: "Refer reward (dost ka pehla order poora hua)", created_at: now() }, { amount: 2, kind: "referral", note: "Refer reward (dost ka pehla order poora hua)", created_at: now() }] }); return wait(w); };
  D.applyReferral = function () { return wait(); };
  D.setAdminUpi = function (u) { D.f().admin_upi = u || ""; return wait(); };
  D.setFreeDays = function (n) { D.f().free_days = n; return wait(); };
  D.markFeePaid = function (oid) { ord(oid).fee_paid = true; return wait(); };
  D.setPoint = function (oid, la, ln) { var o = ord(oid); o.delivery_lat = la; o.delivery_lng = ln; return wait(); };
  D.adminPeople = function () { return wait([{ id: "u1", full_name: "Sunita Devi", phone: "9811100001", age: 32, sex: "female", address: "Gali 6, Ward 3", is_shop: false, orders: 4, email: "" }, { id: "u2", full_name: "Rakesh Verma", phone: "9811100002", age: 41, sex: "male", address: "Gali 2, Ward 5", is_shop: false, orders: 2, email: "rakesh@example.com" }]); };
  D.fees = function () { return wait(D.f()); };
  D.setFee = function (k, v) { D.f()[k] = v; return wait(); };
  /* ---- Lucky Draw demo (in memory; same rules as the SQL) ---- */
  function L() { return db.ld || (db.ld = { draws: [], coupons: [], winners: [] }); }
  function ldGet(i) { var d = L().draws.filter(function (x) { return x.id === i; })[0]; if (!d) throw new Error("Draw nahi mila"); return d; }
  function ldErr(m) { return Promise.reject(new Error(m)); }
  function ldCode() { var a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = ""; for (var i = 0; i < 8; i++) s += a.charAt(Math.floor(Math.random() * 32)); return s; }
  function ldIssueCore(d, amt, name, phone, src, ref, cid) {
    var ph = String(phone || "").replace(/\D/g, ""); if (d.status !== "live") throw new Error("Draw live nahi hai"); if (ph.length < 10) throw new Error("Sahi mobile number daaliye"); ph = ph.slice(-10);
    if (ref && L().coupons.some(function (c) { return c.draw_id === d.id && c.order_ref === ref; })) return [];
    var mine = L().coupons.filter(function (c) { return c.draw_id === d.id && c.customer_phone === ph; }), want;
    if (src === "free") { if (!d.allow_free_entry) throw new Error("Is draw mein free entry band hai"); if (mine.some(function (c) { return c.source === "free"; })) throw new Error("Is number ko free coupon mil chuka hai"); want = 1; }
    else if (src === "manual") want = 1;
    else { want = LD.couponsForPurchase(d, +amt || 0); if (want < 1) throw new Error("Kam se kam ₹" + d.min_purchase + " ki kharidari par coupon milta hai"); }
    want = Math.min(want, d.max_coupons_per_customer - mine.length); if (want < 1) throw new Error("Is customer ki coupon limit (" + d.max_coupons_per_customer + ") poori ho gayi");
    var out = []; for (var i = 0; i < want; i++) { var c = { id: id(), draw_id: d.id, code: ldCode(), customer_id: cid || null, customer_name: name || "", customer_phone: ph, source: src, order_ref: ref || "", amount: +amt || 0, created_at: now() }; L().coupons.push(c); out.push(c); }
    return out;
  }
  D.ldAuto = function (o) {
    L().draws.forEach(function (d) { if (d.status === "live" && d.shop_id === o.shop_id) { try { ldIssueCore(d, o.total - (o.customer_fee || 0), o.customer_name, o.customer_phone, "purchase", o.id, o.customer_id); } catch (e) {} } });
  };
  D.ldSave = function (p) {
    var sh = db.shops.filter(function (s) { return s.id === db.myShopId; })[0] || {}, d = { id: id(), shop_id: db.myShopId, shop_name: sh.name || "Meri dukaan", owner_id: "me", title: p.title || "Lucky Draw", description: p.description || "", min_purchase: +p.min_purchase, coupons_per_slab: +p.coupons_per_slab || 1, max_coupons_per_customer: +p.max_coupons_per_customer || 10, allow_free_entry: p.allow_free_entry !== false, one_win_per_person: p.one_win_per_person !== false, end_at: p.end_at || null, status: "draft", expected_sales: p.expected_sales, margin_pct: p.margin_pct, promo_cost: p.promo_cost, seed_hash: null, seed: null, created_at: now() };
    d.ld_prizes = p.prizes.map(function (x, i) { return { id: id(), draw_id: d.id, rank: x.rank, sort_order: i, name: x.name, kind: x.kind, unit_cost: x.unit_cost, qty: x.qty }; });
    L().draws.unshift(d); return wait(d.id);
  };
  D.ldList = function (sid) { return wait(L().draws.filter(function (d) { return d.shop_id === (sid || db.myShopId); })); };
  D.ldLive = function (sid) { return wait(L().draws.filter(function (d) { return d.shop_id === sid && ["live", "closed", "drawn"].indexOf(d.status) > -1; })); };
  D.ldOne = function (i) { return wait(ldGet(i)); };
  D.ldCoupons = function (i) { return wait(L().coupons.filter(function (c) { return c.draw_id === i; }).reverse()); };
  D.ldWinners = function (i) { return wait(L().winners.filter(function (w) { return w.draw_id === i; }).sort(function (a, b) { return a.slot - b.slot; }).map(function (w) { var d = ldGet(i), p = d.ld_prizes.filter(function (x) { return x.id === w.prize_id; })[0], c = L().coupons.filter(function (x) { return x.id === w.coupon_id; })[0]; return Object.assign({ ld_prizes: { name: p.name, rank: p.rank }, ld_coupons: { code: c.code, customer_name: c.customer_name, customer_phone: c.customer_phone } }, w); })); };
  D.ldGoLive = function (i) { var d = ldGet(i); if (d.status !== "draft") return ldErr("Draw pehle se live hai"); d.seed = null; d._seed = Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2); d.seed_hash = LD.sha256Hex(d._seed); d.status = "live"; d.start_at = now(); return wait(d); };
  D.ldIssue = function (i, amt, name, phone, src) { try { return wait(ldIssueCore(ldGet(i), amt, name, phone, src || "purchase", "", null)); } catch (e) { return ldErr(e.message); } };
  D.ldRun = function (i) {
    var d = ldGet(i); if (["live", "closed"].indexOf(d.status) < 0) return ldErr("Draw live nahi hai");
    var cs = L().coupons.filter(function (c) { return c.draw_id === i; }); if (!cs.length) return ldErr("Abhi tak koi coupon nahi diya gaya");
    var picks = LD.pickWinners(d._seed, cs.map(function (c) { return { id: c.id, code: c.code, phone_key: c.customer_phone }; }), d.ld_prizes, d.one_win_per_person);
    L().winners = L().winners.filter(function (w) { return w.draw_id !== i; });
    picks.forEach(function (k) { L().winners.push({ id: id(), draw_id: i, prize_id: k.prize.id, coupon_id: k.coupon.id, slot: k.slot, claimed: false }); });
    d.status = "drawn"; d.seed = d._seed; d.drawn_at = now(); return wait(L().winners.filter(function (w) { return w.draw_id === i; }));
  };
  D.ldClaim = function (wid) { L().winners.forEach(function (w) { if (w.id === wid) w.claimed = true; }); return wait(); };
  D.ldStatus = function (i, st) { var d = ldGet(i); if (d.status === "drawn") return ldErr("Draw ho chuka hai"); d.status = st; return wait(); };
  D.ldResults = function (i) { return D.ldWinners(i).then(function (ws) { return ws.map(function (w) { var n = w.ld_coupons.customer_name || "", p = w.ld_coupons.customer_phone; return { winner_id: w.id, slot: w.slot, prize_name: w.ld_prizes.name, prize_rank: w.ld_prizes.rank, code: w.ld_coupons.code, who: (n ? n.charAt(0) + "***" : "") + " " + p.slice(0, 2) + "XXXXXX" + p.slice(-2), claimed: w.claimed }; }); }); };
  D.ldVerify = function (i) { return wait(L().coupons.filter(function (c) { return c.draw_id === i; }).sort(function (a, b) { return a.code < b.code ? -1 : 1; }).map(function (c) { return { coupon_id: c.id, code: c.code, phone_key: c.customer_phone }; })); };
  D.ldMine = function () {
    var ph = db.me && db.me.phone; return wait(L().coupons.filter(function (c) { return c.customer_id === "me" || c.customer_phone === ph; }).map(function (c) { var d = ldGet(c.draw_id), w = L().winners.filter(function (x) { return x.coupon_id === c.id; })[0], p = w && d.ld_prizes.filter(function (x) { return x.id === w.prize_id; })[0]; return { coupon_id: c.id, code: c.code, draw_id: d.id, title: d.title, shop_name: d.shop_name, status: d.status, end_at: d.end_at, won_prize: p ? p.name : null, claimed: w ? w.claimed : null }; }));
  };
  D.setAvatar = function (path) { if (db.me) db.me.avatar_path = path || null; db.orders.forEach(function (o) { if (o.customer_id === "me") o.customer_avatar = path || ""; }); return wait(); };
  D.deleteAccount = function () { db = null; D.ready = false; return wait(true); };
  D.logout = function () { db = null; D.ready = false; return wait(); };

  root.API = { real: R, demo: D, TYPES: TYPES, conv: conv, km: km };
})(window);
