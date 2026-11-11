/* SpyWell Digital Studio – template renderer.
   One engine for editor preview, template chooser and public pages.
   Input: product type + template config (studio_templates.config) + customer content (studio_designs.content_json).
   content_json shape: { fields:{}, events:[], services:[], style:{}, images:{} }
   Only text nodes are written (never innerHTML); colours, links and image URLs are validated. */
(function () {
  'use strict';
  var BUCKET = 'https://rxhanrtoaplwphmwpgqg.supabase.co/storage/v1/object/public/studio-assets/';
  var FONTS = {
    hind: ['Hind', "'Hind',sans-serif"],
    poppins: ['Poppins', "'Poppins','Hind',sans-serif"],
    mukta: ['Mukta', "'Mukta',sans-serif"],
    playfair: ['Playfair Display', "'Playfair Display','Tiro Devanagari Hindi',serif"],
    tiro: ['Tiro Devanagari Hindi', "'Tiro Devanagari Hindi',serif"],
    yatra: ['Yatra One', "'Yatra One','Tiro Devanagari Hindi',serif"],
    vibes: ['Great Vibes', "'Great Vibes','Tiro Devanagari Hindi',cursive"]
  };
  var FIELDS = {
    invitation: [
      ['heading', 'सबसे ऊपर की पंक्ति', 'text', 60],
      ['bride', 'दुल्हन का नाम', 'text', 60],
      ['bride_parents', 'दुल्हन के माता-पिता', 'area', 200],
      ['groom', 'दूल्हे का नाम', 'text', 60],
      ['groom_parents', 'दूल्हे के माता-पिता', 'area', 200],
      ['date', 'शादी की तारीख', 'date', 10],
      ['time', 'शादी का समय', 'time', 5],
      ['venue', 'विवाह स्थल का नाम', 'text', 100],
      ['address', 'स्थल का पता', 'area', 200],
      ['message', 'निमंत्रण संदेश', 'area', 500],
      ['c1_name', 'संपर्क 1 का नाम', 'text', 50],
      ['c1_phone', 'संपर्क 1 का मोबाइल', 'tel', 15],
      ['c2_name', 'संपर्क 2 का नाम', 'text', 50],
      ['c2_phone', 'संपर्क 2 का मोबाइल', 'tel', 15],
      ['extra', 'अन्य जानकारी', 'area', 400]
    ],
    visiting: [
      ['name', 'आपका नाम', 'text', 60],
      ['business', 'व्यवसाय / दुकान का नाम', 'text', 80],
      ['designation', 'पद', 'text', 60],
      ['mobile', 'मोबाइल नंबर', 'tel', 15],
      ['whatsapp', 'WhatsApp नंबर', 'tel', 15],
      ['email', 'ईमेल', 'email', 100],
      ['address', 'व्यवसाय का पता', 'area', 200],
      ['website', 'वेबसाइट', 'url', 150],
      ['about', 'व्यवसाय के बारे में', 'area', 400],
      ['facebook', 'Facebook लिंक', 'url', 200],
      ['instagram', 'Instagram लिंक', 'url', 200],
      ['youtube', 'YouTube लिंक', 'url', 200],
      ['linkedin', 'LinkedIn लिंक', 'url', 200]
    ]
  };
  var IMAGES = {
    invitation: [['couple', 'जोड़े की फ़ोटो', 150], ['family', 'परिवार की फ़ोटो', 280], ['bg', 'बैकग्राउंड फ़ोटो', 0]],
    visiting: [['logo', 'लोगो', 56], ['photo', 'प्रोफ़ाइल फ़ोटो', 108]]
  };
  var EVENT_PRESETS = ['सगाई', 'हल्दी', 'मेहंदी', 'संगीत', 'शादी', 'रिसेप्शन'];
  var MAX_EVENTS = 8, MAX_SERVICES = 12;
  var SAMPLE = {
    invitation: {
      fields: { heading: '॥ शुभ विवाह ॥', bride: 'प्रिया', bride_parents: 'सुपुत्री श्री रमेश शर्मा', groom: 'राहुल', groom_parents: 'सुपुत्र श्री सुरेश वर्मा',
        date: '2027-02-14', time: '19:00', venue: 'आनंद वाटिका', address: 'स्टेशन रोड, सहारनपुर', message: 'आपकी उपस्थिति हमारे लिए सौभाग्य की बात होगी।',
        c1_name: 'रमेश शर्मा', c1_phone: '9876543210' },
      events: [{ title: 'हल्दी', date: '2027-02-13', time: '10:00', place: 'निवास स्थान' }, { title: 'शादी', date: '2027-02-14', time: '19:00', place: 'आनंद वाटिका' }]
    },
    visiting: {
      fields: { name: 'राजेश शर्मा', business: 'शर्मा इलेक्ट्रॉनिक्स', designation: 'प्रोपराइटर', mobile: '9876543210', whatsapp: '9876543210',
        email: 'rajesh@example.com', address: 'मेन बाज़ार, सहारनपुर', website: 'https://example.com', about: 'टीवी, फ्रिज और मोबाइल की बिक्री और सर्विस।' },
      services: ['बिक्री', 'रिपेयर', 'होम सर्विस']
    }
  };

  var V = {
    tel: function (v) { var d = String(v || '').replace(/\D/g, ''); if (d.length === 12 && d.indexOf('91') === 0) d = d.slice(2); if (d.length === 11 && d[0] === '0') d = d.slice(1); return /^[6-9]\d{9}$/.test(d) ? d : ''; },
    email: function (v) { v = String(v || '').trim(); return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 100 ? v : ''; },
    url: function (v) {
      v = String(v || '').trim(); if (!v) return '';
      if (!/^[a-z][a-z0-9+.-]*:/i.test(v)) v = 'https://' + v;
      try { var u = new URL(v); return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.indexOf('.') > 0 ? u.href : ''; } catch (e) { return ''; }
    },
    date: function (v) { return /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : ''; },
    time: function (v) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(v || '') ? v : ''; }
  };
  function col(v, d) { return /^#[0-9a-fA-F]{6}$/.test(v || '') ? v : d; }
  function img(u) { return typeof u === 'string' && u.indexOf(BUCKET) === 0 && u.indexOf('..') < 0 ? u : ''; }
  function txt(v, n) { return (v == null ? '' : String(v)).slice(0, n || 200).trim(); }
  function num(v, lo, hi, d) { v = Number(v); return isFinite(v) && v >= lo && v <= hi ? v : d; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function link(cls, text, href) { var a = el('a', cls, text); a.href = href; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } return a; }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function fmtDate(v) { if (!V.date(v)) return ''; var p = v.split('-'); try { return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return p[2] + '-' + p[1] + '-' + p[0]; } }
  function fmtTime(v) { if (!V.time(v)) return ''; var h = +v.slice(0, 2), m = v.slice(3); var s = h < 12 ? 'सुबह' : h < 16 ? 'दोपहर' : h < 19 ? 'शाम' : 'रात'; return s + ' ' + ((h % 12) || 12) + ':' + m + ' बजे'; }
  function maps(q) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); }

  /* Tolerant normaliser: whatever is stored, the renderer only sees this safe shape. */
  function normalize(type, c) {
    c = c && typeof c === 'object' ? c : {};
    var out = { fields: {}, events: [], services: [], style: {}, images: {} }, f = c.fields && typeof c.fields === 'object' ? c.fields : {};
    (FIELDS[type] || []).forEach(function (d) { out.fields[d[0]] = txt(f[d[0]], d[3]); });
    if (type === 'invitation' && Array.isArray(c.events)) c.events.slice(0, MAX_EVENTS).forEach(function (e) {
      e = e && typeof e === 'object' ? e : {}; out.events.push({ title: txt(e.title, 60), date: V.date(e.date), time: V.time(e.time), place: txt(e.place, 120) });
    });
    if (type === 'visiting' && Array.isArray(c.services)) c.services.slice(0, MAX_SERVICES).forEach(function (s) { s = txt(s, 60); if (s) out.services.push(s); });
    var s = c.style && typeof c.style === 'object' ? c.style : {};
    out.style = { font: FONTS[s.font] ? s.font : '', nameFont: FONTS[s.nameFont] ? s.nameFont : '', size: num(s.size, 0.8, 1.4, 1),
      weight: [400, 500, 600, 700].indexOf(+s.weight) >= 0 ? +s.weight : 0, align: ['left', 'center', 'right'].indexOf(s.align) >= 0 ? s.align : '',
      fg: col(s.fg, ''), bg: col(s.bg, ''), ac: col(s.ac, '') };
    var im = c.images && typeof c.images === 'object' ? c.images : {};
    (IMAGES[type] || []).forEach(function (d) { var x = im[d[0]] && typeof im[d[0]] === 'object' ? im[d[0]] : {}; var u = img(x.url); if (u) out.images[d[0]] = { url: u, size: num(x.size, 40, 340, d[2]), pos: num(x.pos, 0, 100, 50) }; });
    return out;
  }
  function invalid(type, c) {
    var f = (c && c.fields) || {}, bad = [];
    (FIELDS[type] || []).forEach(function (d) { var v = String(f[d[0]] || '').trim(); if (!v) return; if ((d[2] === 'tel' || d[2] === 'email' || d[2] === 'url') && !V[d[2]](v)) bad.push(d[0]); });
    return bad;
  }
  function title(type, c) {
    var f = (c && c.fields) || {};
    if (type === 'invitation') { var a = txt(f.bride, 40), b = txt(f.groom, 40); return a && b ? a + ' & ' + b : a || b || 'नया शादी कार्ड'; }
    return txt(f.name, 60) || txt(f.business, 60) || 'नया विज़िटिंग कार्ड';
  }
  function isEmpty(type, c) { var f = (c && c.fields) || {}; return !(FIELDS[type] || []).some(function (d) { return String(f[d[0]] || '').trim(); }); }

  function picture(cls, im, shape) {
    var i = el('img', cls); i.src = im.url; i.alt = ''; i.loading = 'lazy';
    i.style.width = im.size + 'px'; if (shape === 'circle') i.style.height = im.size + 'px';
    i.style.objectPosition = '50% ' + im.pos + '%'; return i;
  }

  function buildInvitation(root, d, t) {
    var f = d.fields, box = el('div', 'in');
    if (f.heading) box.appendChild(el('div', 'sr-h', f.heading));
    if (t.ornament) box.appendChild(el('div', 'sr-or', t.ornament));
    if (d.images.couple) box.appendChild(picture('sr-ph', d.images.couple, 'circle'));
    if (f.bride) box.appendChild(el('div', 'sr-nm', f.bride));
    if (f.bride_parents) box.appendChild(el('div', 'sr-par', f.bride_parents));
    if (f.bride && f.groom) box.appendChild(el('div', 'sr-amp', '&'));
    if (f.groom) box.appendChild(el('div', 'sr-nm', f.groom));
    if (f.groom_parents) box.appendChild(el('div', 'sr-par', f.groom_parents));
    if (f.message) box.appendChild(el('div', 'sr-msg', f.message));
    var dt = [fmtDate(f.date), fmtTime(f.time)].filter(Boolean);
    if (dt.length) { var b = el('div', 'sr-dt'); dt.forEach(function (x) { b.appendChild(el('div', '', x)); }); box.appendChild(b); }
    if (f.venue || f.address) {
      var v = el('div', 'sr-ven'); if (f.venue) v.appendChild(el('b', '', f.venue)); if (f.address) v.appendChild(el('div', '', f.address));
      v.appendChild(link('sr-btn', 'मैप में देखें', maps([f.venue, f.address].filter(Boolean).join(', ')))); box.appendChild(v);
    }
    if (d.events.length) {
      var ev = el('div', 'sr-evs'); ev.appendChild(el('div', 'sr-sub', 'कार्यक्रम'));
      d.events.forEach(function (e) {
        if (!e.title && !e.date && !e.place) return;
        var c = el('div', 'sr-ev'); c.appendChild(el('b', '', e.title || 'कार्यक्रम'));
        var w = [fmtDate(e.date), fmtTime(e.time)].filter(Boolean).join(' · '); if (w) c.appendChild(el('div', '', w)); if (e.place) c.appendChild(el('div', '', e.place)); ev.appendChild(c);
      });
      if (ev.children.length > 1) box.appendChild(ev);
    }
    if (d.images.family) box.appendChild(picture('sr-fam', d.images.family, 'wide'));
    if (f.extra) box.appendChild(el('div', 'sr-msg', f.extra));
    var cs = [[f.c1_name, V.tel(f.c1_phone)], [f.c2_name, V.tel(f.c2_phone)]].filter(function (x) { return x[1]; });
    if (cs.length) { var cw = el('div', 'sr-cs'); cw.appendChild(el('div', 'sr-sub', 'संपर्क')); cs.forEach(function (x) { cw.appendChild(link('sr-btn', (x[0] ? x[0] + ' · ' : '') + x[1], 'tel:+91' + x[1])); }); box.appendChild(cw); }
    root.appendChild(box);
  }

  function buildVisiting(root, d) {
    var f = d.fields, hd = el('div', 'hd'), bd = el('div', 'bd');
    if (d.images.logo) { var lg = picture('sr-lg', d.images.logo, 'logo'); lg.style.maxHeight = d.images.logo.size + 'px'; lg.style.width = 'auto'; hd.appendChild(lg); }
    if (f.business) hd.appendChild(el('div', 'sr-biz', f.business));
    root.appendChild(hd);
    if (d.images.photo) bd.appendChild(picture('ph', d.images.photo, 'circle')); else bd.className += ' noph';
    if (f.name) bd.appendChild(el('div', 'sr-nm', f.name));
    if (f.designation) bd.appendChild(el('div', 'sr-des', f.designation));
    if (f.about) bd.appendChild(el('div', 'sr-msg', f.about));
    var tel = V.tel(f.mobile), wa = V.tel(f.whatsapp), em = V.email(f.email), web = V.url(f.website), act = el('div', 'sr-act');
    if (tel) act.appendChild(link('', 'कॉल', 'tel:+91' + tel));
    if (wa) act.appendChild(link('', 'WhatsApp', 'https://wa.me/91' + wa));
    if (em) act.appendChild(link('', 'ईमेल', 'mailto:' + em));
    if (web) act.appendChild(link('', 'वेबसाइट', web));
    if (f.address) act.appendChild(link('', 'मैप', maps([f.business, f.address].filter(Boolean).join(', '))));
    if (act.children.length) bd.appendChild(act);
    if (d.services.length) { var sv = el('div', 'sr-svs'); sv.appendChild(el('div', 'sr-sub', 'सेवाएँ')); d.services.forEach(function (s) { sv.appendChild(el('span', 'sr-chip', s)); }); bd.appendChild(sv); }
    [['मोबाइल', tel && ('+91 ' + tel)], ['ईमेल', em], ['पता', f.address], ['वेबसाइट', web && web.replace(/^https?:\/\//, '').replace(/\/$/, '')]].forEach(function (r) {
      if (!r[1]) return; var row = el('div', 'sr-row'); row.appendChild(el('small', '', r[0])); row.appendChild(el('div', '', r[1])); bd.appendChild(row);
    });
    var soc = el('div', 'sr-soc');
    [['Facebook', f.facebook], ['Instagram', f.instagram], ['YouTube', f.youtube], ['LinkedIn', f.linkedin]].forEach(function (s) { var u = V.url(s[1]); if (u) soc.appendChild(link('', s[0], u)); });
    if (soc.children.length) bd.appendChild(soc);
    root.appendChild(bd);
  }

  function render(mount, type, tplConfig, content, opts) {
    ensureAssets();
    opts = opts || {}; var t = tplConfig && typeof tplConfig === 'object' ? tplConfig : {}; var pal = t.palette || {};
    type = type === 'visiting' ? 'visiting' : 'invitation';
    var src = content;
    if (opts.demo && isEmpty(type, content)) { src = JSON.parse(JSON.stringify(SAMPLE[type])); src.style = (content && content.style) || {}; src.images = (content && content.images) || {}; }
    var d = normalize(type, src), s = d.style;
    var bg = s.bg || col(pal.bg, '#ffffff'), fg = s.fg || col(pal.fg, '#222222'), ac = s.ac || col(pal.ac, '#8b1a2b');
    var layout = ['frame', 'double', 'arch', 'plain', 'band', 'wave', 'side'].indexOf(t.layout) >= 0 ? t.layout : (type === 'visiting' ? 'band' : 'frame');
    var root = el('div', 'sr ' + (type === 'visiting' ? 'sr-vc' : 'sr-inv') + ' l-' + layout);
    var st = root.style;
    st.setProperty('--bg', bg); st.setProperty('--fg', fg); st.setProperty('--ac', ac);
    st.setProperty('--f', (FONTS[s.font || t.font] || FONTS.hind)[1]); st.setProperty('--nf', (FONTS[s.nameFont || t.nameFont] || FONTS.playfair)[1]);
    st.setProperty('--soft', rgba(fg, 0.14)); st.fontSize = (16 * s.size) + 'px'; if (s.weight) st.fontWeight = s.weight;
    var align = s.align || (layout === 'side' || (type === 'invitation' && layout === 'plain' && t.align === 'left') ? 'left' : 'center');
    root.className += ' a-' + align;
    if (type === 'invitation' && d.images.bg) { st.backgroundImage = 'url("' + d.images.bg.url + '")'; st.backgroundPosition = '50% ' + d.images.bg.pos + '%'; st.setProperty('--pane', rgba(bg, 0.88)); } else st.setProperty('--pane', 'transparent');
    if (type === 'visiting') buildVisiting(root, d); else buildInvitation(root, d, { ornament: txt(t.ornament, 4) });
    mount.textContent = ''; mount.appendChild(root); return root;
  }

  var CSS = '.sr{font-family:var(--f);color:var(--fg);background-color:var(--bg);background-size:cover;line-height:1.5;overflow:hidden;word-break:break-word}' +
    '.sr *{box-sizing:border-box;margin:0}.sr a{color:inherit}.sr img{display:block;max-width:100%}' +
    '.sr.a-left{text-align:left}.sr.a-center{text-align:center}.sr.a-right{text-align:right}' +
    '.sr.a-center img{margin-left:auto;margin-right:auto}.sr.a-right img{margin-left:auto}' +
    '.sr-sub{font-size:.75em;letter-spacing:.12em;opacity:.7;margin-bottom:.5em;text-transform:uppercase}' +
    '.sr-btn{display:inline-block;margin:.5em .25em 0;padding:.55em 1em;border-radius:2em;background:var(--ac);color:var(--bg)!important;text-decoration:none;font-size:.85em;font-weight:600}' +
    '.sr-msg{margin:1.1em 0;font-size:.95em;white-space:pre-line}' +
    '.sr-inv{padding:1.6em 1em 2em;min-height:34em}.sr-inv .in{border:1.5px solid var(--ac);border-radius:14px;padding:1.7em 1em;background:var(--pane)}' +
    '.sr-inv.l-double .in{border:5px double var(--ac)}.sr-inv.l-arch .in{border-radius:11em 11em 14px 14px;padding-top:3.2em}' +
    '.sr-inv.l-plain .in{border:0;border-top:4px solid var(--ac);border-radius:0;padding:1.6em .4em}' +
    '.sr-h{font-size:.9em;color:var(--ac);letter-spacing:.06em}.sr-or{color:var(--ac);font-size:1.3em;margin:.2em 0}' +
    '.sr-ph{border-radius:50%;object-fit:cover;border:3px solid var(--ac);margin-top:1em;margin-bottom:1em}' +
    '.sr-inv .sr-nm{font-family:var(--nf);font-size:2.4em;line-height:1.2;color:var(--ac)}.sr-amp{font-family:var(--nf);font-size:1.4em;margin:.15em 0}' +
    '.sr-par{font-size:.82em;opacity:.85;white-space:pre-line}' +
    '.sr-dt{margin:1em 0;padding:.75em 0;border-top:1px solid var(--ac);border-bottom:1px solid var(--ac);font-weight:600;font-size:1.05em}' +
    '.sr-ven b{display:block;font-size:1.05em}.sr-evs{margin-top:1.4em}.sr-ev{border:1px solid var(--soft);border-radius:10px;padding:.6em .8em;margin:.5em 0;font-size:.9em}.sr-ev b{display:block;color:var(--ac)}' +
    '.sr-fam{border-radius:12px;object-fit:cover;aspect-ratio:4/3;margin-top:1.2em}.sr-cs{margin-top:1.4em}' +
    '.sr-vc .hd{background:var(--ac);color:var(--bg);padding:1.6em 1.1em 4em}.sr-biz{font-weight:700;font-size:1.15em}.sr-lg{object-fit:contain;margin-bottom:.5em}' +
    '.sr-vc .bd{padding:0 1.1em 1.6em}.sr-vc .bd.noph{padding-top:1.2em;margin-top:-2.4em;background:var(--bg);border-radius:18px 18px 0 0}' +
    '.sr-vc .ph{border-radius:50%;object-fit:cover;border:4px solid var(--bg);background:var(--bg);margin-top:-3.4em;margin-bottom:.5em}' +
    '.sr-vc .sr-nm{font-family:var(--nf);font-size:1.5em;font-weight:700}.sr-des{opacity:.75;font-size:.9em}' +
    '.sr-act{display:grid;grid-template-columns:repeat(auto-fit,minmax(4.6em,1fr));gap:.5em;margin:1em 0}' +
    '.sr-act a{background:var(--ac);color:var(--bg)!important;border-radius:10px;padding:.65em .2em;text-decoration:none;font-size:.82em;font-weight:600;text-align:center}' +
    '.sr-svs{margin:1em 0}.sr-chip{display:inline-block;border:1px solid var(--ac);color:var(--ac);border-radius:2em;padding:.15em .7em;margin:.2em;font-size:.82em}' +
    '.sr-row{text-align:left;padding:.6em 0;border-top:1px solid var(--soft);font-size:.9em}.sr-row small{display:block;opacity:.6;font-size:.75em}' +
    '.sr-soc{margin-top:.8em}.sr-soc a{display:inline-block;margin:.2em;padding:.3em .8em;border-radius:2em;border:1px solid var(--soft);text-decoration:none;font-size:.8em}' +
    '.sr-vc.l-wave .hd{border-radius:0 0 50% 50%/0 0 2.2em 2.2em;padding-bottom:4.6em}' +
    '.sr-vc.l-side .hd{background:none;color:var(--fg);border-left:6px solid var(--ac);padding:1.4em 1.1em .4em}.sr-vc.l-side .sr-biz{color:var(--ac)}' +
    '.sr-vc.l-side .bd,.sr-vc.l-side .bd.noph{border-left:6px solid var(--ac);margin-top:0;padding-top:.6em;border-radius:0;background:none}' +
    '.sr-vc.l-side .ph{margin-top:0;border-radius:16px;border:0}';
  var assetsDone = false;
  function ensureAssets() {
    if (assetsDone) return; assetsDone = true;
    var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
    var l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Hind:wght@400;500;600;700&family=Mukta:wght@400;600;700&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Tiro+Devanagari+Hindi&family=Yatra+One&display=swap';
    document.head.appendChild(l);
  }

  window.StudioRender = { render: render, normalize: normalize, invalid: invalid, title: title, isEmpty: isEmpty, V: V,
    FIELDS: FIELDS, IMAGES: IMAGES, FONTS: FONTS, SAMPLE: SAMPLE, EVENT_PRESETS: EVENT_PRESETS, MAX_EVENTS: MAX_EVENTS, MAX_SERVICES: MAX_SERVICES, BUCKET: BUCKET };
})();
