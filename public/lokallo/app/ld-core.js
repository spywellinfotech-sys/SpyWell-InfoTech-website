/* Lucky Draw core (plain JS, no dependencies) — port of packages/lucky_draw budget.dart + draw_engine.dart.
   Use in any WebView / web shop app. Exposes window.LD. */
(function (root) {
  "use strict";
  var rupees = function (n) { return "₹" + Math.round(n).toLocaleString("en-IN"); };

  /* ---------- SHA-256 (sync; works without secure-context crypto.subtle) ---------- */
  var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function utf8(s) { return unescape(encodeURIComponent(s)); }
  function sha256Bytes(str) {
    var m = utf8(str), l = m.length, i, j, w = new Array(64);
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var words = []; for (i = 0; i < l; i++) words[i >> 2] |= m.charCodeAt(i) << (24 - (i % 4) * 8);
    words[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    var n = (((l + 8) >> 6) + 1) * 16; words[n - 1] = l * 8; for (i = 0; i < n; i++) if (!words[i]) words[i] = 0;
    for (var o = 0; o < n; o += 16) {
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        if (j < 16) w[j] = words[o + j]; else {
          var s0 = ((w[j-15] >>> 7) | (w[j-15] << 25)) ^ ((w[j-15] >>> 18) | (w[j-15] << 14)) ^ (w[j-15] >>> 3);
          var s1 = ((w[j-2] >>> 17) | (w[j-2] << 15)) ^ ((w[j-2] >>> 19) | (w[j-2] << 13)) ^ (w[j-2] >>> 10);
          w[j] = (w[j-16] + s0 + w[j-7] + s1) | 0;
        }
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var t1 = (h + S1 + ((e & f) ^ (~e & g)) + K[j] + w[j]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = []; for (i = 0; i < 8; i++) for (j = 3; j >= 0; j--) out.push((H[i] >>> (j * 8)) & 255);
    return out;
  }
  function sha256Hex(s) { return sha256Bytes(s).map(function (x) { return (x < 16 ? "0" : "") + x.toString(16); }).join(""); }

  /* ---------- fair winner selection (same formula as ld_run_draw in SQL) ---------- */
  function pickIndex(seed, slot, n) {
    var h = sha256Bytes(seed + ":" + slot), v = 0;
    for (var k = 0; k < 6; k++) v = v * 256 + h[k];
    return v % n;
  }
  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; } // codes are ASCII, so this is byte order
  /* coupons: [{id, code, phone_key}], prizes: [{id, rank, sort_order, qty}] -> [{slot, prize, coupon}] */
  function pickWinners(seed, coupons, prizes, oneWin) {
    var rem = coupons.slice().sort(function (a, b) { return cmp(a.code, b.code); });
    var ordered = prizes.slice().sort(function (a, b) { return (a.rank - b.rank) || ((a.sort_order || 0) - (b.sort_order || 0)) || cmp(a.id, b.id); });
    var picks = [], slot = 0;
    for (var i = 0; i < ordered.length; i++) for (var k = 0; k < ordered[i].qty; k++) {
      if (!rem.length) return picks;
      var c = rem.splice(pickIndex(seed, slot, rem.length), 1)[0];
      picks.push({ slot: slot, prize: ordered[i], coupon: c });
      if (oneWin) rem = rem.filter(function (x) { return x.phone_key !== c.phone_key; });
      slot++;
    }
    return picks;
  }
  /* draw: {seed, seed_hash, one_win_per_person}; winners: [{slot, prize_id, coupon_id}] */
  function verifyDraw(draw, coupons, prizes, winners) {
    if (!draw.seed || !draw.seed_hash) return { ok: false, message: "Draw abhi hua nahi hai" };
    if (sha256Hex(draw.seed) !== draw.seed_hash) return { ok: false, message: "Seed ka hash match nahi hua!" };
    var exp = pickWinners(draw.seed, coupons, prizes, draw.one_win_per_person);
    var got = winners.slice().sort(function (a, b) { return a.slot - b.slot; });
    if (exp.length !== got.length) return { ok: false, message: "Winners ki ginti match nahi hui" };
    for (var i = 0; i < got.length; i++) if (exp[i].coupon.id !== got[i].coupon_id || exp[i].prize.id !== got[i].prize_id) return { ok: false, message: "Slot " + (i + 1) + " ka winner match nahi hua" };
    return { ok: true, message: "Draw sahi hai ✓ — sab " + got.length + " winners formula se match karte hain" };
  }
  function couponsForPurchase(d, amount) { return Math.floor(amount / d.min_purchase) * d.coupons_per_slab; }

  /* ---------- shopkeeper budget ---------- */
  var SHOP_TYPES = {
    kirana: { label: "Kirana / Grocery", minPurchase: 300, margin: 12 },
    kapde: { label: "Kapde / Garments", minPurchase: 1000, margin: 30 },
    mobile: { label: "Mobile / Electronics", minPurchase: 2000, margin: 8 },
    medical: { label: "Medical Store", minPurchase: 500, margin: 15 },
    mithai: { label: "Mithai / Bakery", minPurchase: 300, margin: 25 },
    hardware: { label: "Hardware / Paint", minPurchase: 1000, margin: 15 },
    general: { label: "General Store", minPurchase: 500, margin: 15 }
  };
  /* LoKalLo shop types -> budget types */
  var APP_TYPE = { grocery: "kirana", dairy: "kirana", fruitveg: "kirana", bakery: "mithai", sweets: "mithai" };
  var TIERS = { 1: "Bumper inaam", 2: "Weekly / chhote inaam", 3: "Consolation" };

  function line(name, unitCost, kind, tier, qty) { return { name: name, unit_cost: unitCost, kind: kind || "item", rank: tier || 2, qty: qty || 1 }; }
  function faceValue(r) { return r.unit_cost * r.qty; }
  function realCost(r, marginPct) { return r.kind === "item" ? faceValue(r) : faceValue(r) * (1 - marginPct / 100); }

  function rewardCatalog(type) {
    var v = function (c, t) { return line(rupees(c) + " ka shopping voucher", c, "store_voucher", t); };
    var disc = function (c) { return line("Agle bill par " + rupees(c) + " off", c, "discount", 3); };
    var it = function (n, c, t) { return line(n, c, "item", t); };
    var common = [v(2000, 1), v(500, 2), v(200, 2), v(100, 2), disc(50), disc(20)];
    var sp = {
      kirana: [it("Mixer grinder", 2500, 1), it("Pressure cooker 5L", 1500, 1), it("5 kg atta + 1L tel kit", 450, 2), it("Dinner set", 1200, 1)],
      kapde: [it("Saree / Shirt-pant set", 1500, 1), it("Bedsheet set", 700, 2), it("Trolley bag", 2500, 1)],
      mobile: [it("Smartphone (entry)", 7000, 1), it("Bluetooth earbuds", 900, 2), it("Power bank 10000mAh", 700, 2), it("Back cover + tempered glass", 150, 3)],
      medical: [it("BP machine", 1500, 1), it("Thermometer + first-aid kit", 400, 2), it("Steamer / vaporizer", 350, 2)],
      mithai: [it("1 kg mithai dabba", 500, 2), it("Birthday cake (1 kg)", 600, 2), it("Dry fruit gift box", 1500, 1)],
      hardware: [it("Drill machine", 2500, 1), it("Tool kit", 800, 2), it("LED bulb pack (4)", 300, 3)],
      general: [it("Mixer grinder", 2500, 1), it("Steel bottle set", 400, 2), it("Wall clock", 350, 2)]
    }[type] || [];
    return sp.concat(common);
  }

  /* i: {expectedSales, marginPct, minPurchase, couponsPerSlab, bannerCost, printPerCoupon, rewards:[...]} */
  function computeBudget(i) {
    var face = 0, real = 0, count = 0, byTier = { 1: 0, 2: 0, 3: 0 };
    i.rewards.forEach(function (r) { face += faceValue(r); var rc = realCost(r, i.marginPct); real += rc; byTier[r.rank] = (byTier[r.rank] || 0) + rc; count += r.qty; });
    var coupons = i.minPurchase <= 0 ? 0 : Math.round(i.expectedSales * 0.6 / (i.minPurchase * 1.5) * i.couponsPerSlab);
    var promo = (i.bannerCost || 0) + coupons * (i.printPerCoupon || 0);
    var total = real + promo, pct = i.expectedSales <= 0 ? 0 : total / i.expectedSales * 100;
    var margin = i.marginPct <= 0 ? 1 : i.marginPct / 100;
    return {
      prizeFaceValue: face, prizeRealCost: real, estCoupons: coupons, promoCost: promo, totalReal: total, pctOfSales: pct,
      costPerCoupon: coupons ? total / coupons : 0, breakEvenExtraSales: total / margin,
      suggestedMin: i.expectedSales * 0.02, suggestedMax: i.expectedSales * 0.03, prizeCount: count,
      verdict: pct <= 3 ? "good" : pct <= 6 ? "ok" : "high", byTier: byTier,
      oneInN: count ? Math.max(1, Math.round(coupons / count)) : 0
    };
  }
  function verdictText(b) {
    var p = b.pctOfSales.toFixed(1);
    return b.verdict === "good" ? "Achha budget — sales ka " + p + "%" : b.verdict === "ok" ? "Theek hai, par thoda zyada — " + p + "%" : "Kharcha zyada hai — " + p + "%. Inaam kam karein";
  }
  function round50(v) { return Math.max(50, Math.round(v / 50) * 50); }
  /* fills rewards so real cost lands near 2.5% of expected sales: ~40% bumper, ~40% weekly, ~20% consolation */
  function suggestRewards(i, targetBudget) {
    var target = targetBudget || i.expectedSales * 0.025, keep = 1 - i.marginPct / 100, out = [];
    var catalog = rewardCatalog(i.shopType), m = i.marginPct;
    var bumpers = catalog.filter(function (r) { return r.rank === 1; }).sort(function (a, b) { return realCost(b, m) - realCost(a, m); });
    var bumper = bumpers.filter(function (r) { return realCost(r, m) <= target * 0.45; })[0];
    if (!bumper) { var f = round50(target * 0.4 / keep); bumper = line(rupees(f) + " ka shopping voucher", f, "store_voucher", 1); }
    bumper = JSON.parse(JSON.stringify(bumper)); bumper.qty = 1; out.push(bumper);
    var weeks = Math.max(1, i.weeks || 4);
    var weeklyPool = Math.max(0, target - realCost(bumper, m)) * 0.67, perWeek = weeklyPool / weeks / keep;
    if (perWeek >= 150) {
      var big = round50(perWeek * 0.5), small = perWeek >= 400 ? 100 : 50, sq = Math.max(1, Math.floor((perWeek - big) / small));
      out.push(line(rupees(big) + " ka shopping voucher", big, "store_voucher", 2, weeks));
      out.push(line(rupees(small) + " ka shopping voucher", small, "store_voucher", 2, sq * weeks));
    }
    var used = out.reduce(function (s, r) { return s + realCost(r, m); }, 0), left = target - used;
    if (left > 0) {
      var face = target > 20000 ? 50 : 20, qty = Math.min(500, Math.floor(left / (face * keep)));
      if (qty > 0) out.push(line("Agle bill par " + rupees(face) + " off", face, "discount", 3, qty));
    }
    return out;
  }

  root.LD = { sha256Hex: sha256Hex, pickIndex: pickIndex, pickWinners: pickWinners, verifyDraw: verifyDraw, couponsForPurchase: couponsForPurchase,
    SHOP_TYPES: SHOP_TYPES, APP_TYPE: APP_TYPE, TIERS: TIERS, rewardCatalog: rewardCatalog, computeBudget: computeBudget, verdictText: verdictText,
    suggestRewards: suggestRewards, faceValue: faceValue, realCost: realCost, rupees: rupees };
})(window);
