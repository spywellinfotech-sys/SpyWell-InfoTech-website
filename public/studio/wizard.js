/* SpyWell Studio – "Get Started" wizard (question-by-question). Shared by Home, Editor, card page, DynaMe and promo pages.
   SWWizard.open({mode:'new'})                       -> pick kind, answer questions, then Studio creates the draft
   SWWizard.open({mode:'fill',type,occ,fields,done}) -> asks the key questions for an existing card, calls done(fields) */
(function () {
  var KEY = 'sw_wz';
  var css = '.wz{position:fixed;inset:0;background:rgba(20,8,8,.6);z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;font-family:inherit}' +
    '.wz>div{background:#fff;width:100%;max-width:460px;border-radius:22px 22px 0 0;padding:18px 18px 22px;box-shadow:0 -8px 30px rgba(0,0,0,.3);max-height:92vh;overflow:auto;box-sizing:border-box}' +
    '@media(min-width:520px){.wz{align-items:center}.wz>div{border-radius:22px}}' +
    '.wz .bar{height:6px;border-radius:9px;background:#f3e3cc;overflow:hidden;margin-bottom:12px}.wz .bar i{display:block;height:100%;background:linear-gradient(90deg,#f59a1a,#d4141c);transition:width .25s}' +
    '.wz .st{font-size:12px;color:#7a6248;display:flex;justify-content:space-between;margin-bottom:6px}.wz .x{background:none;border:0;font-size:20px;color:#7a6248;cursor:pointer;padding:0 4px}' +
    '.wz h3{margin:4px 0 4px;font-size:20px;color:#7a0a10;line-height:1.3}.wz .hn{font-size:13px;color:#7a6248;margin:0 0 12px;line-height:1.5}' +
    '.wz input,.wz textarea{width:100%;box-sizing:border-box;font-size:17px;padding:13px;border:1.5px solid #e5cfa8;border-radius:12px;outline:0;background:#fffdf8}.wz input:focus,.wz textarea:focus{border-color:#d4141c}' +
    '.wz .ch{display:block;width:100%;text-align:left;margin:8px 0 0;padding:14px;border:1.5px solid #f0c98a;border-radius:14px;background:#fff8ec;font-size:16px;font-weight:700;color:#7a0a10;cursor:pointer}' +
    '.wz .ch small{display:block;font-weight:400;color:#7a6248;font-size:12px;margin-top:2px}' +
    '.wz .er{color:#c0182a;font-size:13px;min-height:16px;margin-top:6px}' +
    '.wz .nv{display:flex;gap:8px;margin-top:12px}.wz .nv button{flex:1;padding:14px;border-radius:99px;border:0;font-size:16px;font-weight:800;cursor:pointer}' +
    '.wz .nx{background:linear-gradient(120deg,#f59a1a,#d4141c);color:#fff}.wz .bk{background:#fff4e0;color:#7a0a10;flex:.6!important}.wz .sk{background:none;color:#7a6248;font-weight:500!important;flex:.7!important}';

  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function ensureR(cb) {
    if (window.StudioRender) return cb();
    var s = document.createElement('script'); s.src = '/studio/render.js'; s.onload = cb; s.onerror = cb; document.head.appendChild(s);
  }

  function stepsFor(type, occ, R) {
    var O = (R && R.OCCASIONS && R.OCCASIONS[occ]) || {}, L = O.labels || {}, hide = O.hide || [];
    if (type === 'invitation') {
      var s = [];
      s.push({ k: 'bride', q: (L.bride || 'दुल्हन का नाम') + ' क्या है?', h: 'जैसे: प्रिया', t: 'text', req: 1 });
      if (hide.indexOf('groom') < 0) s.push({ k: 'groom', q: (L.groom || 'दूल्हे का नाम') + ' क्या है?', h: 'जैसे: राहुल', t: 'text', req: 1 });
      s.push({ k: 'date', q: 'कार्यक्रम की तारीख?', h: 'कैलेंडर से चुनें', t: 'date', skip: 1 });
      s.push({ k: 'venue', q: 'स्थल का नाम?', h: 'जैसे: शुभ लॉन, सहारनपुर', t: 'text', skip: 1 });
      s.push({ k: 'c1_phone', q: 'संपर्क के लिए मोबाइल नंबर?', h: '10 अंक', t: 'tel', skip: 1 });
      return s;
    }
    return [
      { k: 'name', q: 'आपका नाम क्या है?', h: 'जैसे: विनीत कुमार', t: 'text', req: 1 },
      { k: 'business', q: 'दुकान / व्यवसाय का नाम?', h: 'जैसे: श्री श्याम ट्रेडर्स', t: 'text', skip: 1 },
      { k: 'designation', q: 'आपका पद या काम?', h: 'जैसे: प्रोपराइटर, डॉक्टर, इलेक्ट्रीशियन', t: 'text', skip: 1 },
      { k: 'mobile', q: 'आपका मोबाइल नंबर?', h: '10 अंक — कॉल और WhatsApp बटन इसी से बनेंगे', t: 'tel', req: 1 },
      { k: 'city', q: 'आप किस शहर में हैं?', h: 'जैसे: सहारनपुर', t: 'text', skip: 1 }
    ];
  }

  function open(o) {
    o = o || {};
    if (document.querySelector('.wz')) return;
    ensureR(function () { run(o); });
  }

  function run(o) {
    var R = window.StudioRender, mode = o.mode || 'new';
    if (!document.getElementById('wz-css')) { var st = el('style'); st.id = 'wz-css'; st.textContent = css; document.head.appendChild(st); }
    var ov = el('div', 'wz'), box = el('div'); ov.appendChild(box); document.body.appendChild(ov);
    var A = { type: o.type || '', occ: o.occ || '', site: false, fields: {} }; for (var k in (o.fields || {})) A.fields[k] = o.fields[k];
    var steps = [], i = 0, started = false;

    function close() { ov.remove(); }
    function shell(title, hint, idx, total) {
      box.textContent = '';
      var top = el('div', 'st'); top.appendChild(el('span', '', total ? 'सवाल ' + (idx + 1) + ' / ' + total : '🚀 Get Started'));
      var x = el('button', 'x', '✕'); x.type = 'button'; x.onclick = close; top.appendChild(x); box.appendChild(top);
      if (total) { var b = el('div', 'bar'), f = el('i'); f.style.width = Math.round((idx + 1) / total * 100) + '%'; b.appendChild(f); box.appendChild(b); }
      box.appendChild(el('h3', '', title)); if (hint) box.appendChild(el('p', 'hn', hint));
    }
    function choice(label, sub, fn) { var b = el('button', 'ch', label); b.type = 'button'; if (sub) b.appendChild(el('small', '', sub)); b.onclick = fn; box.appendChild(b); }

    function pickKind() {
      shell('आप क्या बनाना चाहते हैं?', 'कुछ आसान सवालों में आपका कार्ड तैयार हो जाएगा।');
      choice('📇 डिजिटल विज़िटिंग कार्ड', 'कॉल, WhatsApp, लोकेशन, QR सब एक जगह', function () { A.type = 'visiting'; begin(); });
      choice('🌐 मिनी वेबसाइट', 'दुकान / सर्विस की छोटी वेबसाइट', function () { A.type = 'visiting'; A.site = true; begin(); });
      choice('💌 इनविटेशन कार्ड', 'शादी, जन्मदिन, सगाई और हर फ़ंक्शन', function () { A.type = 'invitation'; pickOcc(); });
    }
    function pickOcc() {
      var O = (R && R.OCCASIONS) || { wedding: { name: 'विवाह' } };
      shell('कौन सा कार्यक्रम है?', '');
      Object.keys(O).forEach(function (k) { choice(O[k].name, '', function () { A.occ = k; begin(); }); });
      var b = el('div', 'nv'), bk = el('button', 'bk', '← पीछे'); bk.type = 'button'; bk.onclick = pickKind; b.appendChild(bk); box.appendChild(b);
    }
    function begin() { steps = stepsFor(A.type, A.occ, R); i = 0; started = true; ask(); }

    function ask() {
      var s = steps[i]; shell(s.q, s.h, i, steps.length);
      var inp = s.t === 'area' ? el('textarea') : el('input'); if (s.t !== 'area') inp.type = s.t === 'tel' ? 'tel' : s.t === 'date' ? 'date' : 'text';
      if (s.t === 'tel') { inp.inputMode = 'numeric'; inp.maxLength = 10; }
      inp.placeholder = s.t === 'date' ? '' : (s.h || ''); inp.value = A.fields[s.k] || ''; box.appendChild(inp);
      var er = el('div', 'er'); box.appendChild(er);
      var nv = el('div', 'nv');
      var bk = el('button', 'bk', '← पीछे'); bk.type = 'button'; bk.onclick = function () { if (i === 0) { if (mode === 'new') { A.fields = {}; pickKind(); } else close(); } else { save(); i--; ask(); } }; nv.appendChild(bk);
      var nx = el('button', 'nx', i === steps.length - 1 ? '✅ तैयार करें' : 'आगे →'); nx.type = 'button';
      function save() { var v = inp.value.trim(); if (s.t === 'tel') v = digits(v).slice(-10); if (v) A.fields[s.k] = v; else if (!s.skipKeep) delete A.fields[s.k]; return v; }
      nx.onclick = function () {
        var v = save();
        if (s.req && !v) { er.textContent = 'यह जानकारी ज़रूरी है।'; return; }
        if (s.t === 'tel' && v && v.length !== 10) { er.textContent = 'मोबाइल नंबर 10 अंकों का होना चाहिए।'; return; }
        next();
      };
      nv.appendChild(nx);
      if (s.skip) { var sk = el('button', 'sk', 'छोड़ें'); sk.type = 'button'; sk.onclick = function () { delete A.fields[s.k]; next(); }; nv.appendChild(sk); }
      box.appendChild(nv);
      inp.onkeydown = function (e) { if (e.key === 'Enter' && s.t !== 'area') { e.preventDefault(); nx.click(); } };
      setTimeout(function () { try { inp.focus(); } catch (e) { } }, 60);
    }
    function next() { if (i < steps.length - 1) { i++; ask(); } else finish(); }

    function finish() {
      if (A.type === 'visiting' && A.fields.mobile && !A.fields.whatsapp) A.fields.whatsapp = A.fields.mobile;
      if (mode === 'fill') { close(); if (o.done) o.done(A.fields); return; }
      try { localStorage.setItem(KEY, JSON.stringify({ type: A.type, occ: A.occ, site: A.site, fields: A.fields, t: Date.now() })); } catch (e) { }
      shell('🎉 बहुत बढ़िया!', 'आपका कार्ड बन रहा है…');
      if (window.SWWZ_RUN) { close(); window.SWWZ_RUN(); } else location.href = '/studio/?wz=1';
    }

    if (mode === 'fill') {
      if (!A.type) { close(); return; }
      begin();
      // skipped questions in fill mode keep what is already filled in
    } else pickKind();
  }

  function pending() { try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && Date.now() - j.t < 6 * 3600 * 1000) return j; } catch (e) { } return null; }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) { } }

  // Any element with data-wizard opens the wizard instead of following its link.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('[data-wizard]');
    if (!a) return; e.preventDefault(); open({ mode: 'new' });
  });
  window.SWWizard = { open: open, pending: pending, clear: clear };
})();
