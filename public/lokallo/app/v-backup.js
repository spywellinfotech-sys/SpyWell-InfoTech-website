/* Shop data backup to the owner's own Google Drive (drive.file scope: the app only sees files it created). */
(function () {
  var S = LK.S, V = LK.views, esc = LK.esc;
  var SCOPE = "https://www.googleapis.com/auth/drive.file", FOLDER = "LoKalLo Backup";
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  LK.driveTok = function () { try { var t = JSON.parse(ls("lk-gtok") || "null"); if (t && t.tok && t.exp > Date.now()) return t.tok; } catch (e) {} return ""; };
  LK.driveSave = function (tok) { if (tok) ls("lk-gtok", JSON.stringify({ tok: tok, exp: Date.now() + 3300 * 1000 })); };
  function dt(t) { try { return new Date(t).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }); } catch (x) { return ""; } }
  function csvCell(v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function csv(rows) { return "﻿" + rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n"); }
  function chunk(a, n) { var o = []; for (var i = 0; i < a.length; i += n) o.push(a.slice(i, i + n)); return o; }

  function collect(prog) {
    var sid = S.shop.id, out = { app: "LoKalLo", edition: window.LK_SINGLE ? "single" : "multi", build: LK.myBuild(), saved_at: new Date().toISOString(), shop: S.shop };
    prog("Saman ki list le rahe hain…");
    return BE.sel("lk_shop_items", "shop_id=eq." + sid + "&select=*&order=name").then(function (it) {
      out.items = it || []; prog("Orders le rahe hain…");
      return BE.sel("lk_orders", "shop_id=eq." + sid + "&select=*&order=created_at.desc&limit=3000");
    }).then(function (od) {
      out.orders = od || []; var ids = out.orders.map(function (o) { return o.id; }); out.order_items = [];
      var p = Promise.resolve();
      chunk(ids, 60).forEach(function (c, i, all) { p = p.then(function () { prog("Bill ki detail " + (i + 1) + "/" + all.length + "…"); return BE.sel("lk_order_items", "order_id=in.(" + c.join(",") + ")&select=*&order=order_id,pos"); }).then(function (r) { out.order_items = out.order_items.concat(r || []); }); });
      return p;
    }).then(function () { return out; });
  }
  function ordersCsv(d) {
    var by = {}; d.order_items.forEach(function (x) { if (!x.removed) (by[x.order_id] = by[x.order_id] || []).push(x.name + " " + x.qty + (x.qty_unit || "") + " @" + x.rate); });
    var rows = [["Order", "Date", "Customer", "Phone", "Status", "Fulfilment", "Payment", "Subtotal", "Delivery", "Total", "Address", "Saman"]];
    d.orders.forEach(function (o) { rows.push([o.code, dt(o.created_at), o.customer_name, o.customer_phone, o.status, o.fulfilment, o.payment_mode, o.subtotal, o.delivery_charge, o.total, o.address, (by[o.id] || []).join("; ")]); });
    return csv(rows);
  }
  function itemsCsv(d) { var rows = [["Naam", "Unit", "Rate", "Available"]]; d.items.forEach(function (i) { rows.push([i.name, i.unit, i.rate, i.available ? "Haan" : "Nahi"]); }); return csv(rows); }

  function gfetch(url, opt, tok) {
    opt = opt || {}; opt.headers = Object.assign({ Authorization: "Bearer " + tok }, opt.headers || {});
    return fetch(url, opt).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok) {
          var m = j && j.error && (j.error.message || ""), reason = j && j.error && j.error.errors && j.error.errors[0] && j.error.errors[0].reason;
          var e = new Error(r.status === 401 ? "drive_login" : (reason === "accessNotConfigured" || /has not been used|disabled/i.test(m || "")) ? "drive_api_off" : (m || "Drive error " + r.status)); e.code = r.status; throw e;
        }
        return j;
      });
    });
  }
  function folderId(tok) {
    var q = encodeURIComponent("name='" + FOLDER + "' and mimeType='application/vnd.google-apps.folder' and trashed=false");
    return gfetch("https://www.googleapis.com/drive/v3/files?q=" + q + "&fields=files(id)&spaces=drive", null, tok).then(function (r) {
      if (r.files && r.files[0]) return r.files[0].id;
      return gfetch("https://www.googleapis.com/drive/v3/files?fields=id", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: FOLDER, mimeType: "application/vnd.google-apps.folder" }) }, tok).then(function (f) { return f.id; });
    });
  }
  function upload(tok, parent, name, mime, body) {
    var b = "lkb" + Date.now(), meta = JSON.stringify({ name: name, parents: [parent] });
    var data = "--" + b + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" + meta + "\r\n--" + b + "\r\nContent-Type: " + mime + "\r\n\r\n" + body + "\r\n--" + b + "--";
    return gfetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", { method: "POST", headers: { "Content-Type": "multipart/related; boundary=" + b }, body: new Blob([data]) }, tok);
  }

  LK.driveConnect = function () {
    ls("lk-drive-pending", "1");
    try { localStorage.removeItem("lk-drive-ok"); } catch (e) {}
    window.location.href = BE.googleUrl(window.LkNative ? "lokallo://auth" : (location.origin + location.pathname), true);
  };

  /* After login: hand the Drive refresh token to the server (nightly backup), once a shop exists. */
  LK.driveSync = function () {
    var rt = ls("lk-grt"); if (!rt || !S.shop || S.demo) return Promise.resolve();
    return BE.rpc("lk_drive_link_save", { p_refresh: rt }).then(function () { ls("lk-grt", null); ls("lk-drive-ok", "1"); }).catch(function () {});
  };
  /* New phone / reinstall: if this Google account has no shop but a backup is in its Drive, offer to restore it. */
  LK.driveRestoreCheck = function () {
    var tok = LK.driveTok(); if (!tok || S.shop || S.demo) return Promise.resolve();
    var q = encodeURIComponent("mimeType='application/json' and trashed=false and (name contains 'LoKalLo-' or name contains 'Auto-')");
    return gfetch("https://www.googleapis.com/drive/v3/files?q=" + q + "&orderBy=createdTime desc&pageSize=1&fields=files(id,name,createdTime)", null, tok).then(function (r) {
      var f = r.files && r.files[0]; if (!f) return;
      return LK.ask("Aapke Google Drive mein purani dukaan ka backup mila (" + dt(f.createdTime) + "). Restore karein? Dukaan ki jaankari aur saman ki list wapas aa jayegi.", "Haan, restore karo").then(function (ok) {
        if (!ok) return;
        return fetch("https://www.googleapis.com/drive/v3/files/" + f.id + "?alt=media", { headers: { Authorization: "Bearer " + tok } }).then(function (x) { return x.json(); }).then(function (d) {
          var s = d.shop || {}; if (!s.name || s.lat == null) throw new Error("backup_bad");
          return S.api.saveShop({ name: s.name, owner_name: s.owner_name || "", phone: s.phone || "", address: s.address || "", lat: s.lat, lng: s.lng, delivery_km: s.delivery_km || 2, min_order: s.min_order || 0, delivery_charge: s.delivery_charge || 0, free_above: s.free_above == null ? null : s.free_above, slots: s.slots || "", types: s.types || [], photos: s.photos || [], upi_id: s.upi_id || "", upi_qr: s.upi_qr || "", is_open: true }).then(function () { return LK.loadMe(); }).then(function () {
            var p = Promise.resolve(); (d.items || []).forEach(function (it) { p = p.then(function () { return S.api.saveItem({ name: it.name, unit: it.unit, rate: it.rate, available: it.available !== false, catalog_id: it.catalog_id || null }).catch(function () {}); }); });
            return p;
          }).then(function () { LK.toast("Dukaan restore ho gayi ✓"); S.mode = "shop"; try { localStorage.setItem("lk-mode", "shop"); } catch (x) {} return LK.driveSync().then(function () { LK.root("sshop"); }); });
        });
      });
    }).catch(function (x) { if (x && x.message === "backup_bad") LK.toast("Backup file sahi nahi hai.", "bad"); });
  };

  V.backup = {
    html: function (e) {
      var last = ls("lk-backup-last"), tok = !!LK.driveTok();
      return '<section class="pad"><h2>☁️ Google Drive backup</h2>' +
        '<p class="muted">Aapki dukaan ka data (saman ki list, saare orders aur bill) aapke <b>apne Google Drive</b> mein "LoKalLo Backup" folder mein save hoga. Wo file sirf aapko dikhegi.</p>' +
        '<div class="card"><div class="kv"><div><span>Aakhri backup</span><b>' + (last ? esc(dt(last)) : "Abhi tak nahi") + "</b></div><div><span>Drive se judaav</span><b>" + (tok ? "✅ Judha hai" : "Abhi nahi") + "</b></div></div></div>" +
        (e.msg2 && e.msg2.linked ? '<div class="card"><div class="kv"><div><span>Roz raat 12 baje auto backup</span><b>' + (e.msg2.active ? "✅ Chalu" : "⏸ Band") + "</b></div>" + (e.msg2.last_ok ? "<div><span>Aakhri auto backup</span><b>" + esc(dt(e.msg2.last_ok)) + " (" + (e.msg2.orders || 0) + " order)</b></div>" : "") + (e.msg2.last_error ? "<div><span>Dikkat</span><b>" + esc(e.msg2.last_error) + "</b></div>" : "") + "</div>" + (e.msg2.active ? '<button class="btn ghost sm" data-act="autooff">Auto backup band karo</button>' : '<button class="btn ghost sm" data-act="relink">Dobara chalu karne ke liye Google se judo</button>') + "</div>" : '<p class="muted sm">Auto backup chalu nahi hai. Neeche button se Google Drive jodo.</p>') +
        '<div id="bkmsg" class="muted sm">' + esc(e.msg || "") + "</div>" +
        '<button class="btn big" data-act="dobackup">' + (tok ? "⬆️ Abhi backup karo" : "🔗 Google Drive se jodo aur backup karo") + "</button>" +
        '<p class="muted sm">Har backup mein 2 file banti hain: ek poora data (.json, wapas lene ke liye) aur ek Excel/Sheets mein khulne wali orders list (.csv). Drive ka sirf wahi folder dikhta hai jo ye app banata hai.</p></section>';
    },
    init: function (e) { if (!e.auto && S.shop) { e.auto = 1; BE.rpc("lk_drive_link_status", {}).then(function (r) { e.msg2 = r; LK.redraw(e); }).catch(function () {}); } if (S.autoBackup) { S.autoBackup = false; LK.act.dobackup(); } }
  };
  LK.act.backup = function () { LK.go("backup"); };
  LK.act.relink = function () { LK.driveConnect(); };
  LK.act.autooff = function () { return BE.rpc("lk_drive_link_off", {}).then(function () { var e = LK.top(); e.msg2 = null; e.auto = 0; LK.toast("Auto backup band"); LK.redraw(e); V.backup.init(e); }); };
  LK.act.dobackup = function (el) {
    var tok = LK.driveTok(); if (!tok) return LK.driveConnect();
    var e = LK.top(), msg = function (t) { var m = document.getElementById("bkmsg"); if (m) m.textContent = t; };
    var btn = document.querySelector('[data-act="dobackup"]'); if (btn) btn.disabled = true;
    return collect(msg).then(function (d) {
      msg("Drive mein save kar rahe hain…");
      var day = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-"), nm = String(S.shop.name || "shop").replace(/[^\wऀ-ॿ]+/g, "_").slice(0, 30);
      return folderId(tok).then(function (fid) {
        return upload(tok, fid, "LoKalLo-" + nm + "-" + day + ".json", "application/json", JSON.stringify(d)).then(function () { return upload(tok, fid, "Orders-" + nm + "-" + day + ".csv", "text/csv", ordersCsv(d)); }).then(function () { return upload(tok, fid, "Saman-" + nm + "-" + day + ".csv", "text/csv", itemsCsv(d)); });
      }).then(function () { ls("lk-backup-last", new Date().toISOString()); LK.toast("Backup ho gaya ✓ (" + d.orders.length + " order, " + d.items.length + " saman)"); LK.redraw(LK.top()); });
    }).catch(function (x) {
      if (btn) btn.disabled = false;
      var m = x && x.message;
      if (m === "drive_login") { ls("lk-gtok", null); return msg("Drive ki permission purani ho gayi. Button dubara dabao."); }
      if (m === "drive_api_off") return msg("Google Drive API abhi chalu nahi hai (admin ko Google Cloud mein 'Google Drive API' enable karni hogi).");
      msg("Backup nahi hua: " + (m || "error"));
    });
  };
})();
