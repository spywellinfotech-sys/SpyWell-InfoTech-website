/* SpyWell Live Studio – template renderer.
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
      ['maplink', 'लोकेशन लिंक (Google Maps)', 'url', 300],
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
      ['industry', 'व्यवसाय का प्रकार (Industry)', 'select', 30],
      ['industry_other', 'अपना व्यवसाय लिखें', 'text', 40],
      ['designation', 'पद', 'text', 60],
      ['mobile', 'मोबाइल नंबर', 'tel', 15],
      ['whatsapp', 'WhatsApp नंबर', 'tel', 15],
      ['sms', 'मैसेज (SMS) नंबर', 'tel', 15],
      ['email', 'ईमेल', 'email', 100],
      ['address', 'व्यवसाय का पता', 'area', 200],
      ['city', 'शहर', 'text', 40],
      ['state', 'राज्य', 'text', 40],
      ['pin', 'पिन कोड', 'tel', 6],
      ['maplink', 'लोकेशन लिंक (Google Maps)', 'url', 300],
      ['website', 'वेबसाइट', 'url', 150],
      ['about', 'व्यवसाय के बारे में', 'area', 400],
      ['tagline', 'टैगलाइन: एक लाइन (मिनी वेबसाइट)', 'text', 120],
      ['hours', 'खुलने का समय (मिनी वेबसाइट)', 'text', 100],
      ['since', 'स्थापना वर्ष, जैसे 2015 (मिनी वेबसाइट)', 'text', 4],
      ['facebook', 'Facebook लिंक', 'url', 200],
      ['instagram', 'Instagram लिंक', 'url', 200],
      ['youtube', 'YouTube लिंक', 'url', 200],
      ['linkedin', 'LinkedIn लिंक', 'url', 200]
    ]
  };
  var IMAGES = {
    invitation: [['couple', 'जोड़े की फ़ोटो', 150], ['family', 'परिवार की फ़ोटो', 280], ['bg', 'बैकग्राउंड फ़ोटो', 0]],
    visiting: [['logo', 'लोगो', 56], ['photo', 'प्रोफ़ाइल फ़ोटो', 108], ['g1', 'गैलरी फ़ोटो 1 (मिनी वेबसाइट)', 0], ['g2', 'गैलरी फ़ोटो 2 (मिनी वेबसाइट)', 0], ['g3', 'गैलरी फ़ोटो 3 (मिनी वेबसाइट)', 0], ['g4', 'गैलरी फ़ोटो 4 (मिनी वेबसाइट)', 0], ['g5', 'गैलरी फ़ोटो 5 (मिनी वेबसाइट)', 0], ['g6', 'गैलरी फ़ोटो 6 (मिनी वेबसाइट)', 0]]
  };
  var EVENT_PRESETS_W = ['सगाई', 'हल्दी', 'मेहंदी', 'संगीत', 'शादी', 'रिसेप्शन'], EVENT_PRESETS = EVENT_PRESETS_W;
  var MAX_EVENTS = 8, MAX_SERVICES = 12, MAX_HIGH = 8;
  var OCCASIONS = {
    wedding: { name: 'विवाह', presets: EVENT_PRESETS_W },
    engagement: { name: 'सगाई / रोका', presets: ['रोका', 'सगाई', 'रिंग सेरेमनी', 'भोज'], labels: { heading: 'सबसे ऊपर की पंक्ति', bride: 'पहला नाम', bride_parents: 'परिवार / परिचय (पहले नाम के लिए)', groom: 'दूसरा नाम', groom_parents: 'परिवार / परिचय (दूसरे नाम के लिए)', date: 'कार्यक्रम की तारीख', time: 'कार्यक्रम का समय', venue: 'कार्यक्रम स्थल का नाम', address: 'स्थल का पता' },
      sample: { heading: '॥ सगाई समारोह ॥', bride: 'प्रिया', bride_parents: 'सुपुत्री श्री रमेश शर्मा', groom: 'राहुल', groom_parents: 'सुपुत्र श्री सुरेश वर्मा', message: 'हमारे बच्चों की सगाई में पधारकर आशीर्वाद दें।' } },
    birthday: { name: 'जन्मदिन', presets: ['केक कटिंग', 'डिनर'], hide: ['groom', 'groom_parents'], labels: { heading: 'सबसे ऊपर की पंक्ति', bride: 'जन्मदिन किसका है (नाम)', bride_parents: 'उम्र / परिचय (जैसे "पहला जन्मदिन")', date: 'जन्मदिन की तारीख', time: 'समय', venue: 'स्थल का नाम', address: 'स्थल का पता', message: 'बुलावा संदेश' },
      sample: { heading: '🎂 जन्मदिन की पार्टी 🎂', bride: 'आरव', bride_parents: 'पहला जन्मदिन', message: 'हमारे लाडले के जन्मदिन पर आप सपरिवार आमंत्रित हैं।' } },
    anniversary: { name: 'वर्षगाँठ', presets: ['पूजा', 'केक कटिंग', 'डिनर'], labels: { heading: 'सबसे ऊपर की पंक्ति', bride: 'पहला नाम', bride_parents: 'परिचय (जैसे "25वीं वर्षगाँठ")', groom: 'दूसरा नाम', groom_parents: 'परिचय', date: 'कार्यक्रम की तारीख' },
      sample: { heading: '💞 शादी की वर्षगाँठ 💞', bride: 'सुनीता', bride_parents: '25वीं वर्षगाँठ', groom: 'अनिल', message: 'हमारी खुशी में शामिल होकर इसे यादगार बनाएँ।' } },
    griha: { name: 'गृह प्रवेश', presets: ['हवन', 'पूजा', 'भोज'], hide: ['groom', 'groom_parents'], labels: { heading: 'सबसे ऊपर की पंक्ति', bride: 'परिवार / गृह स्वामी का नाम', bride_parents: 'परिचय / नए घर का नाम', date: 'गृह प्रवेश की तारीख', time: 'मुहूर्त / समय', venue: 'नए घर का नाम', address: 'नए घर का पता', message: 'बुलावा संदेश' },
      sample: { heading: '॥ श्री गणेशाय नमः ॥', bride: 'श्री रमेश शर्मा परिवार', bride_parents: 'गृह प्रवेश', message: 'हमारे नए घर के गृह प्रवेश पर आप सपरिवार पधारें।' } },
    baby: { name: 'नामकरण / मुंडन / बेबी शावर', presets: ['पूजा', 'भोज'], hide: ['groom', 'groom_parents'], labels: { heading: 'सबसे ऊपर की पंक्ति', bride: 'बच्चे का नाम (या कार्यक्रम)', bride_parents: 'माता-पिता / परिचय', date: 'कार्यक्रम की तारीख', venue: 'स्थल का नाम', message: 'बुलावा संदेश' },
      sample: { heading: '🍼 नामकरण संस्कार', bride: 'नन्हा आरव', bride_parents: 'सुपुत्र श्री अमित एवं श्रीमती नेहा', message: 'हमारे नन्हे मेहमान के नामकरण पर आशीर्वाद देने पधारें।' } },
    puja: { name: 'पूजा / जागरण / कथा', presets: ['कलश यात्रा', 'कथा', 'आरती', 'भंडारा'], hide: ['groom', 'groom_parents'], labels: { heading: 'सबसे ऊपर की पंक्ति', bride: 'कार्यक्रम का नाम (जैसे श्री सत्यनारायण कथा)', bride_parents: 'आयोजक परिवार', date: 'कार्यक्रम की तारीख', venue: 'स्थल का नाम', message: 'बुलावा संदेश' },
      sample: { heading: '॥ जय श्री राम ॥', bride: 'श्री सत्यनारायण कथा', bride_parents: 'आयोजक: श्री रमेश शर्मा परिवार', message: 'कथा श्रवण और प्रसाद ग्रहण करने पधारें।' } },
    opening: { name: 'उद्घाटन', presets: ['रिबन कटिंग', 'पूजा', 'भोज'], hide: ['groom', 'groom_parents'], labels: { heading: 'सबसे ऊपर की पंक्ति', bride: 'दुकान / संस्था का नाम', bride_parents: 'विवरण (जैसे "शुभ उद्घाटन")', date: 'उद्घाटन की तारीख', venue: 'दुकान का नाम / स्थल', address: 'पता', message: 'बुलावा संदेश' },
      sample: { heading: '॥ शुभ उद्घाटन ॥', bride: 'शर्मा इलेक्ट्रॉनिक्स', bride_parents: 'हमारे नए शोरूम का उद्घाटन', message: 'आप सभी सादर आमंत्रित हैं।' } },
    terahvi: { name: 'तेरहवीं / रस्म पगड़ी / शोक सभा', presets: ['पाठ / भजन', 'रस्म पगड़ी', 'भोज'], hide: ['groom', 'groom_parents'], labels: { heading: 'सबसे ऊपर की पंक्ति', bride: 'स्वर्गीय का नाम', bride_parents: 'परिचय (जैसे "आयु 78 वर्ष")', date: 'कार्यक्रम की तारीख', time: 'समय', venue: 'स्थल का नाम', address: 'स्थल का पता', message: 'श्रद्धांजलि संदेश' },
      sample: { heading: '॥ श्रद्धांजलि सभा ॥', bride: 'स्वर्गीय श्री रामप्रकाश शर्मा', bride_parents: 'जन्म 1949 · देहावसान 2026', message: 'ईश्वर उनकी आत्मा को शांति दें। तेरहवीं एवं रस्म पगड़ी में पधारकर श्रद्धा-सुमन अर्पित करें।' } },
    party: { name: 'पार्टी / अन्य कार्यक्रम', presets: ['स्वागत', 'डिनर'], hide: ['groom', 'groom_parents'], labels: { heading: 'सबसे ऊपर की पंक्ति', bride: 'कार्यक्रम का नाम', bride_parents: 'आयोजक', date: 'कार्यक्रम की तारीख', venue: 'स्थल का नाम', message: 'बुलावा संदेश' },
      sample: { heading: '✨ आप आमंत्रित हैं ✨', bride: 'गेट-टुगेदर पार्टी', bride_parents: 'आयोजक: शर्मा परिवार', message: 'आपके आने से रौनक बढ़ जाएगी।' } }
  };
  function occ(cfg) { var k = cfg && typeof cfg === 'object' ? cfg.occasion : ''; return OCCASIONS[k] || OCCASIONS.wedding; }
  function fieldsFor(type, cfg) {
    var base = FIELDS[type] || []; if (type !== 'invitation') return base; var o = occ(cfg); if (!o.labels && !o.hide) return base;
    return base.filter(function (d) { return !(o.hide && o.hide.indexOf(d[0]) >= 0); }).map(function (d) { return o.labels && o.labels[d[0]] ? [d[0], o.labels[d[0]], d[2], d[3]] : d; });
  }
  function presetsFor(cfg) { return occ(cfg).presets || EVENT_PRESETS_W; }
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
  var PETALS = ['none', '❀', '❦', '✦', '❤', '★'], LAYOUTS = ['frame', 'double', 'arch', 'plain', 'band', 'wave', 'side', 'diag', 'ring', 'dots', 'ribbon', 'card'],
    ORNAMENTS = ['', 'none', '❖', '❁', '❋', '✦', '❀', '❦', 'ॐ', '❤'];
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function shareBar(f, opts) {
    var url = (opts && opts.shareUrl) || (opts && opts.demo ? 'https://spywell.in/studio/' : String(location.href).split('#')[0]);
    var nm = f.business || f.name || '', msg = (nm ? nm + ' - ' : '') + T('डिजिटल कार्ड') + ': ' + url, e = encodeURIComponent;
    var box = el('div', 'sr-sharebox'); box.appendChild(el('div', 'sr-sub', T('शेयर करें')));
    var wr = el('div', 'sr-wanum'), wi = el('input'); wi.type = 'tel'; wi.setAttribute('inputmode', 'numeric'); wi.maxLength = 15; wi.placeholder = T('मोबाइल नंबर (सेव न हो तब भी)');
    var wb = el('button', '', T('💬 इस नंबर पर भेजें')); wb.type = 'button'; wb.setAttribute('data-act', 'share-wa-number');
    wb.onclick = function () { var n = wi.value.replace(/\D/g, '').slice(-10); if (n.length !== 10) { wi.style.borderColor = '#d33'; wi.placeholder = T('10 अंक का सही नंबर डालें'); wi.value = ''; return; } wi.style.borderColor = ''; window.open('https://wa.me/91' + n + '?text=' + e(msg), '_blank', 'noopener'); };
    wr.appendChild(wi); wr.appendChild(wb); box.appendChild(wr);
    var g = el('div', 'sr-act sr-share');
    function sa(label, href, act) { g.appendChild(actA(link('', label, href), act)); }
    function sb(label, act, fn) { var a = link('', label, '#'); a.onclick = function (ev) { ev.preventDefault(); try { fn(a); } catch (x) { } }; a.setAttribute('role', 'button'); g.appendChild(actA(a, act)); }
    sa('💬 WhatsApp', 'https://wa.me/?text=' + e(msg), 'share-wa');
    if (navigator.share) sb(T('📤 और विकल्प'), 'share-native', function () { navigator.share({ title: nm, text: nm, url: url }); });
    sa('✈️ Telegram', 'https://t.me/share/url?url=' + e(url) + '&text=' + e(nm), 'share-tg');
    sa('✉️ SMS', 'sms:?&body=' + e(msg), 'share-sms');
    sa('📧 ' + T('ईमेल'), 'mailto:?subject=' + e(nm) + '&body=' + e(msg), 'share-mail');
    sa('📘 Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + e(url), 'share-fb');
    sb(T('🔗 लिंक कॉपी'), 'share-copy', function (a) {
      var done = function () { var o = a.textContent; a.textContent = T('✓ कॉपी हो गया'); setTimeout(function () { a.textContent = o; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { window.prompt(url, url); });
      else { var t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (x) { } t.remove(); }
    });
    box.appendChild(g); return box;
  }
  function link(cls, text, href) { var a = el('a', cls, text); a.href = href; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } return a; }
  function act(e, k) { e.setAttribute('data-act', k); return e; }
  var actA = act;
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  var CARDL = 'hi', CLANGS = ['en', 'pa', 'mr', 'gu', 'ur'], LOC = { hi: 'hi-IN', en: 'en-IN', pa: 'pa-IN', mr: 'mr-IN', gu: 'gu-IN', ur: 'ur-IN' };
  var TW = { hi: ['सुबह', 'दोपहर', 'शाम', 'रात', 'बजे'], pa: ['ਸਵੇਰ', 'ਦੁਪਹਿਰ', 'ਸ਼ਾਮ', 'ਰਾਤ', 'ਵਜੇ'], mr: ['सकाळी', 'दुपारी', 'संध्याकाळी', 'रात्री', 'वाजता'], gu: ['સવારે', 'બપોરે', 'સાંજે', 'રાત્રે', 'વાગ્યે'], ur: ['صبح', 'دوپہر', 'شام', 'رات', 'بجے'] };
  function T(s) { return window.I18N ? window.I18N.tr(s, CARDL) : s; }
  var PA_M = ['ਜਨਵਰੀ', 'ਫ਼ਰਵਰੀ', 'ਮਾਰਚ', 'ਅਪ੍ਰੈਲ', 'ਮਈ', 'ਜੂਨ', 'ਜੁਲਾਈ', 'ਅਗਸਤ', 'ਸਤੰਬਰ', 'ਅਕਤੂਬਰ', 'ਨਵੰਬਰ', 'ਦਸੰਬਰ'], PA_D = ['ਐਤਵਾਰ', 'ਸੋਮਵਾਰ', 'ਮੰਗਲਵਾਰ', 'ਬੁੱਧਵਾਰ', 'ਵੀਰਵਾਰ', 'ਸ਼ੁੱਕਰਵਾਰ', 'ਸ਼ਨੀਵਾਰ'];
  function fmtDate(v) { if (!V.date(v)) return ''; var p = v.split('-'); if (CARDL === 'pa') { var dd = new Date(+p[0], +p[1] - 1, +p[2]); return PA_D[dd.getDay()] + ', ' + (+p[2]) + ' ' + PA_M[+p[1] - 1] + ' ' + p[0]; } try { return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(LOC[CARDL] || 'hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return p[2] + '-' + p[1] + '-' + p[0]; } }
  function fmtTime(v) { if (!V.time(v)) return ''; var h = +v.slice(0, 2), m = v.slice(3); if (CARDL === 'en') return ((h % 12) || 12) + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM'); var w = TW[CARDL] || TW.hi, s = h < 12 ? w[0] : h < 16 ? w[1] : h < 19 ? w[2] : w[3]; return s + ' ' + ((h % 12) || 12) + ':' + m + ' ' + w[4]; }
  function maps(q) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); }

  /* Tolerant normaliser: whatever is stored, the renderer only sees this safe shape. */
  var SVI = [[/repair|रिपेयर|मरम्मत|service|सर्विस|fix/i, '🛠️'], [/deliver|डिलीवरी|transport|ट्रांसपोर्ट|shipping|supply|सप्लाई/i, '🚚'], [/wholesale|थोक|bulk|trade|ट्रेड/i, '📦'], [/sale|बिक्री|buy|shop|दुकान|retail/i, '🛒'], [/design|डिज़ाइन|print|प्रिंट/i, '🎨'], [/consult|सलाह|advice|training|class|कोचिंग|शिक्षा/i, '🎓'], [/install|फिटिंग|इंस्टॉल|construction|निर्माण/i, '🏗️'], [/food|खाना|catering|कैटरिंग|restaurant|होटल/i, '🍽️'], [/medic|दवा|health|हेल्थ|clinic/i, '💊'], [/car|गाड़ी|taxi|टैक्सी|vehicle/i, '🚗'], [/home|घर|property|प्रॉपर्टी|land|ज़मीन/i, '🏠'], [/online|web|app|software|digital|डिजिटल/i, '💻'], [/charcoal|कोयला|wood|लकड़ी|coal/i, '🔥']], SVD = ['⭐', '✅', '💼', '📌', '🎯', '🌟'];
  function svIcon(name, i) { for (var k = 0; k < SVI.length; k++) if (SVI[k][0].test(name)) return SVI[k][1]; return SVD[i % SVD.length]; }
  function waveEl() { var d = document.createElement('div'); d.className = 'ws-wave'; d.innerHTML = '<svg viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 20c60 30 120 30 200 10s140-20 200 5v5H0z" fill="var(--bg)"/></svg>'; return d; }
  function svParts(x) { x = String(x || ''); var i = x.indexOf('|'); return i < 0 ? [x.trim(), ''] : [x.slice(0, i).trim(), x.slice(i + 1).trim()]; }
  function svName(x) { return svParts(x)[0]; }
  function normalize(type, c) {
    c = c && typeof c === 'object' ? c : {};
    var out = { fields: {}, events: [], services: [], highlights: [], style: {}, images: {} }, f = c.fields && typeof c.fields === 'object' ? c.fields : {};
    (FIELDS[type] || []).forEach(function (d) { out.fields[d[0]] = txt(f[d[0]], d[3]); });
    if (type === 'invitation' && Array.isArray(c.events)) c.events.slice(0, MAX_EVENTS).forEach(function (e) {
      e = e && typeof e === 'object' ? e : {}; out.events.push({ title: txt(e.title, 60), date: V.date(e.date), time: V.time(e.time), place: txt(e.place, 120) });
    });
    if (type === 'visiting' && Array.isArray(c.services)) c.services.slice(0, MAX_SERVICES).forEach(function (s) { s = txt(s, 160); if (s) out.services.push(s); });
    if (type === 'visiting' && Array.isArray(c.highlights)) c.highlights.slice(0, MAX_HIGH).forEach(function (s) { s = txt(s, 80); if (s) out.highlights.push(s); });
    var s = c.style && typeof c.style === 'object' ? c.style : {};
    out.style = { font: FONTS[s.font] ? s.font : '', nameFont: FONTS[s.nameFont] ? s.nameFont : '', size: num(s.size, 0.8, 1.4, 1),
      weight: [400, 500, 600, 700].indexOf(+s.weight) >= 0 ? +s.weight : 0, align: ['left', 'center', 'right'].indexOf(s.align) >= 0 ? s.align : '',
      fg: col(s.fg, ''), bg: col(s.bg, ''), ac: col(s.ac, ''),
      anim: ['rich', 'soft', 'none'].indexOf(s.anim) >= 0 ? s.anim : '', petal: PETALS.indexOf(s.petal) >= 0 ? s.petal : '',
      lang: CLANGS.indexOf(s.lang) >= 0 ? s.lang : '', layout: LAYOUTS.indexOf(s.layout) >= 0 ? s.layout : '', ornament: ORNAMENTS.indexOf(s.ornament) >= 0 ? s.ornament : '' };
    var im = c.images && typeof c.images === 'object' ? c.images : {};
    (IMAGES[type] || []).forEach(function (d) { var x = im[d[0]] && typeof im[d[0]] === 'object' ? im[d[0]] : {}; var u = img(x.url); if (u) out.images[d[0]] = { url: u, size: num(x.size, 40, 340, d[2]), pos: num(x.pos, 0, 100, 50) }; });
    return out;
  }
  function invalid(type, c) {
    var f = (c && c.fields) || {}, bad = [];
    (FIELDS[type] || []).forEach(function (d) { var v = String(f[d[0]] || '').trim(); if (!v) return; if (d[0] === 'pin') { if (!/^[0-9]{6}$/.test(v)) bad.push(d[0]); return; } if ((d[2] === 'tel' || d[2] === 'email' || d[2] === 'url') && !V[d[2]](v)) bad.push(d[0]); });
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
    if (f.venue || f.address || V.url(f.maplink)) {
      var v = el('div', 'sr-ven'); if (f.venue) v.appendChild(el('b', '', f.venue)); if (f.address) v.appendChild(el('div', '', f.address));
      v.appendChild(act(link('sr-btn', T('\uD83D\uDCCD मैप में देखें'), V.url(f.maplink) || maps([f.venue, f.address].filter(Boolean).join(', '))), 'map')); box.appendChild(v);
    }
    if (d.events.length) {
      var ev = el('div', 'sr-evs'); ev.appendChild(el('div', 'sr-sub', T('कार्यक्रम')));
      d.events.forEach(function (e) {
        if (!e.title && !e.date && !e.place) return;
        var c = el('div', 'sr-ev'); c.appendChild(el('b', '', e.title || T('कार्यक्रम')));
        var w = [fmtDate(e.date), fmtTime(e.time)].filter(Boolean).join(' · '); if (w) c.appendChild(el('div', '', w)); if (e.place) c.appendChild(el('div', '', e.place)); ev.appendChild(c);
      });
      if (ev.children.length > 1) box.appendChild(ev);
    }
    if (d.images.family) box.appendChild(picture('sr-fam', d.images.family, 'wide'));
    if (f.extra) box.appendChild(el('div', 'sr-msg', f.extra));
    var cs = [[f.c1_name, V.tel(f.c1_phone)], [f.c2_name, V.tel(f.c2_phone)]].filter(function (x) { return x[1]; });
    if (cs.length) { var cw = el('div', 'sr-cs'); cw.appendChild(el('div', 'sr-sub', T('संपर्क'))); cs.forEach(function (x) { cw.appendChild(act(link('sr-call', '📞 ' + (x[0] ? x[0] + ' : ' : '') + x[1].slice(0, 5) + ' ' + x[1].slice(5), 'tel:+91' + x[1]), 'call')); }); box.appendChild(cw); }
    var sw = el('div', 'sr-cs'); sw.appendChild(saveCardBtn(root, f)); box.appendChild(sw);
    root.appendChild(box);
  }

  function vesc(v) { return String(v || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1'); }
  function vcardText(f, compact) {
    var tel = V.tel(f.mobile), wa = V.tel(f.whatsapp), em = V.email(f.email), web = V.url(f.website), nm = f.name || f.business || '';
    if (!nm && !tel) return '';
    var L = ['BEGIN:VCARD', 'VERSION:3.0', 'N:' + vesc(nm) + ';;;;', 'FN:' + vesc(nm)];
    if (f.business) L.push('ORG:' + vesc(f.business));
    if (f.designation) L.push('TITLE:' + vesc(f.designation));
    if (tel) L.push('TEL;TYPE=CELL:+91' + tel);
    if (wa && wa !== tel) L.push('TEL;TYPE=WORK:+91' + wa);
    if (em) L.push('EMAIL:' + vesc(em));
    if (web) L.push('URL:' + web);
    if (f.address && !compact) L.push('ADR;TYPE=WORK:;;' + vesc(f.address) + ';;;;');
    L.push('END:VCARD'); return L.join('\r\n');
  }
  function saveVcard(f) {
    var t = vcardText(f, false); if (!t) return;
    var nm = (f.name || f.business || 'contact').replace(/[^\w\u0900-\u097F ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'contact';
    try {
      var b = new Blob([t], { type: 'text/vcard;charset=utf-8' }), a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = nm + '.vcf'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    } catch (e) { location.href = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(t); }
  }
  function qrImage(f) {
    var t = vcardText(f, true); if (!t || !window.StudioQR) return null;
    try { var cv = document.createElement('canvas'); window.StudioQR.draw(cv, unescape(encodeURIComponent(t)), 320);
      var im = el('img', 'sr-qrimg'); im.src = cv.toDataURL('image/png'); im.alt = 'कॉन्टैक्ट QR कोड'; im.width = 160; im.height = 160; return im; } catch (e) { return null; }
  }
  function deliverImage(blob, nm, done) {
    function fallbackOverlay() {
      var u = URL.createObjectURL(blob), ov = el('div', ''); ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;gap:12px';
      var im = document.createElement('img'); im.src = u; im.style.cssText = 'max-width:100%;max-height:70vh;border-radius:10px;background:#fff';
      var tx = el('div', '', T('फ़ोटो को दबाकर रखें और "इमेज सेव करें" चुनें')); tx.style.cssText = 'color:#fff;font-size:14px;text-align:center';
      var cl = el('button', '', T('बंद करें')); cl.type = 'button'; cl.style.cssText = 'padding:10px 22px;border-radius:10px;border:0;background:#fff;font-weight:600';
      cl.onclick = function () { ov.remove(); URL.revokeObjectURL(u); }; ov.appendChild(im); ov.appendChild(tx); ov.appendChild(cl); document.body.appendChild(ov);
    }
    function viaAnchor() {
      try { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nm + '.png'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); } catch (e) { fallbackOverlay(); }
    }
    var C = window.Capacitor, P = C && C.Plugins;
    if (P && P.Filesystem && P.Share) {
      var rd = new FileReader();
      rd.onload = function () {
        var b64 = String(rd.result).split(',')[1];
        P.Filesystem.writeFile({ path: nm + '.png', data: b64, directory: 'CACHE' }).then(function (r) { return P.Share.share({ title: nm, files: [r.uri], dialogTitle: T('कार्ड फ़ोटो सेव / शेयर करें') }); }).then(done, function () { fallbackOverlay(); done(); });
      };
      rd.onerror = function () { fallbackOverlay(); done(); }; rd.readAsDataURL(blob); return;
    }
    try {
      var file = new File([blob], nm + '.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) { navigator.share({ files: [file], title: nm }).then(done, function () { viaAnchor(); done(); }); return; }
    } catch (e) { }
    viaAnchor(); done();
  }
  function loadImg(src) { return new Promise(function (ok) { if (!src) return ok(null); var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src; }); }
  function wrapText(x, t, mx, font, maxLines) {
    x.font = font; var words = String(t).split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) { var tt = cur ? cur + ' ' + w : w; if (x.measureText(tt).width > mx && cur) { lines.push(cur); cur = w; } else cur = tt; });
    if (cur) lines.push(cur); if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/.{1,2}$/, '…'); } return lines;
  }
  function drawVisitingImage(root, f) {
    var hdEl = root.querySelector('.hd'), cs = hdEl ? getComputedStyle(hdEl) : null, ac = (cs && cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') ? cs.backgroundColor : '#12307f', fg = (cs && cs.color) || '#ffffff';
    var lgEl = root.querySelector('img.sr-lg'), phEl = root.querySelector('.ph img, img.ph');
    var slug = ''; try { slug = new URLSearchParams(location.search).get('s') || ''; } catch (e) { }
    var url = slug ? location.origin + '/v/' + slug : location.href.split('#')[0];
    return Promise.all([loadImg(phEl && phEl.src), loadImg(lgEl && lgEl.src)]).then(function (im) {
      var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
      var FF = '"Hind","Noto Sans Devanagari",system-ui,sans-serif';
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); x.fillStyle = ac; x.fillRect(0, 0, W, 340);
      x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      var y = (im[1] ? 50 : 105);
      if (im[1]) { var lh = 90, lw = Math.min(360, im[1].width * lh / im[1].height); x.drawImage(im[1], (W - lw) / 2, y, lw, lh); y += lh + 20; }
      x.fillStyle = fg;
      var biz = f.business || f.name || ''; var bl = wrapText(x, biz, 900, '700 60px ' + FF, 2); bl.forEach(function (l, i) { x.font = '700 60px ' + FF; x.fillText(l, W / 2, y + 60 + i * 68); });
      var cx = W / 2, cy = 340, r = 130;
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(cx, cy, r + 12, 0, Math.PI * 2); x.fill();
      if (im[0]) { x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip(); var s = Math.max(2 * r / im[0].width, 2 * r / im[0].height); x.drawImage(im[0], cx - im[0].width * s / 2, cy - im[0].height * s / 2, im[0].width * s, im[0].height * s); x.restore(); }
      else { x.fillStyle = ac; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); x.fillStyle = fg; x.font = '700 120px ' + FF; x.fillText(String(f.name || f.business || '?').trim().charAt(0).toUpperCase(), cx, cy + 42); }
      var ty = cy + r + 85; x.fillStyle = '#14203d';
      if (f.name) { x.font = '700 64px ' + FF; x.fillText(String(f.name).slice(0, 40), W / 2, ty); ty += 62; }
      if (f.designation) { x.fillStyle = '#5a6a8c'; x.font = '400 38px ' + FF; x.fillText(String(f.designation).slice(0, 50), W / 2, ty); ty += 30; }
      ty += 40; x.textAlign = 'left'; x.fillStyle = '#14203d';
      var rows = []; var tel = V.tel(f.mobile), wa = V.tel(f.whatsapp), em = V.email(f.email), web = V.url(f.website);
      if (tel) rows.push(['📞', '+91 ' + tel.slice(0, 5) + ' ' + tel.slice(5)]); if (wa && wa !== tel) rows.push(['💬', 'WhatsApp +91 ' + wa]);
      if (em) rows.push(['✉️', em]); if (web) rows.push(['🌐', String(web).replace(/^https?:\/\//, '').slice(0, 40)]);
      if (f.address) wrapText(x, f.address, 620, '400 36px ' + FF, 3).forEach(function (l, i) { rows.push([i ? '' : '📍', l]); });
      rows.forEach(function (rw) { if (ty > H - 120) return; x.font = '400 40px ' + FF; x.fillText(rw[0], 90, ty); x.font = '400 40px ' + FF; x.fillText(rw[1], 160, ty); ty += 62; });
      try { var qc = document.createElement('canvas'); window.StudioQR.draw(qc, unescape(encodeURIComponent(url)), 360); x.fillStyle = '#fff'; x.fillRect(W - 290, H - 290, 230, 230); x.drawImage(qc, W - 285, H - 285, 220, 220); } catch (e) { }
      x.fillStyle = '#5a6a8c'; x.font = '400 30px ' + FF; x.textAlign = 'left'; x.fillText('Vi-card', 90, H - 70);
      return new Promise(function (ok) { cv.toBlob(function (b) { ok(b); }, 'image/png'); });
    });
  }
  function saveCardImage(root, f, btn) {
    var old = btn.textContent; btn.textContent = T('तैयार हो रहा है…'); btn.disabled = true;
    function done() { btn.textContent = old; btn.disabled = false; }
    var nm = (f.name || f.business || f.bride || 'card').replace(/[^\wऀ-ॿ ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'card';
    if (!(f.bride || f.groom)) { drawVisitingImage(root, f).then(function (b) { if (!b) { done(); return; } deliverImage(b, nm, done); }, done); return; }
    function go() {
      try {
        window.html2canvas(root, { useCORS: true, scale: 2, backgroundColor: null, ignoreElements: function (n) { return n.classList && (n.classList.contains('sr-pw') || n.classList.contains('sr-save')); } }).then(function (cv) {
          cv.toBlob(function (b) { if (!b) { done(); return; } deliverImage(b, nm, done); }, 'image/png');
        }, done);
      } catch (e) { done(); }
    }
    if (window.html2canvas) { go(); return; }
    var sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'; sc.onload = go; sc.onerror = done; document.head.appendChild(sc);
  }
  function saveCardBtn(root, f) { var b = el('button', 'sr-save sr-savecard', T('\uD83D\uDDBC कार्ड फ़ोटो सेव करें')); b.type = 'button'; b.setAttribute('data-act', 'savecard'); b.onclick = function () { saveCardImage(root, f, b); }; return b; }
  function motifStrip(m) { var d = el('div', 'sr-mt'); for (var n = 0; n < 7; n++) { var sp = el('span', '', m); sp.style.setProperty('--n', n); d.appendChild(sp); } return d; }
  function buildVisiting(root, d, opts) {
    var f = d.fields, hd = el('div', 'hd'), bd = el('div', 'bd');
    if (d.images.logo) { var lg = picture('sr-lg', d.images.logo, 'logo'); lg.style.maxHeight = d.images.logo.size + 'px'; lg.style.width = 'auto'; hd.appendChild(lg); }
    if (f.business) hd.appendChild(el('div', 'sr-biz', f.business));
    root.appendChild(hd);
    if (d.images.photo) bd.appendChild(picture('ph', d.images.photo, 'circle')); else bd.className += ' noph';
    if (f.name) bd.appendChild(el('div', 'sr-nm', f.name));
    if (f.designation) bd.appendChild(el('div', 'sr-des', f.designation));
    if (f.about) bd.appendChild(el('div', 'sr-msg', f.about));
    var tel = V.tel(f.mobile), wa = V.tel(f.whatsapp), em = V.email(f.email), web = V.url(f.website), act = el('div', 'sr-act');
    if (tel) act.appendChild(actA(link('sr-call', T('📞 कॉल करें : ') + tel.slice(0, 5) + ' ' + tel.slice(5), 'tel:+91' + tel), 'call'));
    if (wa) act.appendChild(actA(link('', 'WhatsApp', 'https://wa.me/91' + wa), 'whatsapp'));
    if (V.tel(f.sms)) act.appendChild(actA(link('', T('💬 मैसेज'), 'sms:+91' + V.tel(f.sms)), 'sms'));
    if (em) act.appendChild(actA(link('', T('ईमेल'), 'mailto:' + em), 'email'));
    if (web) act.appendChild(actA(link('', T('वेबसाइट'), web), 'website'));
    if (vcardText(f, false)) { var sv0 = el('button', 'sr-save', T('\uD83D\uDCC7 कॉन्टैक्ट सेव करें')); sv0.type = 'button'; sv0.setAttribute('data-act', 'savecontact'); sv0.onclick = function () { saveVcard(f); }; act.appendChild(sv0); }
    act.appendChild(saveCardBtn(root, f));
    if (act.children.length) bd.appendChild(act);
    if (d.services.length) { var sv = el('div', 'sr-svs'); sv.appendChild(el('div', 'sr-sub', T('सेवाएँ'))); d.services.forEach(function (s) { sv.appendChild(el('span', 'sr-chip', svName(s))); }); bd.appendChild(sv); }
    [['मोबाइल', tel && ('+91 ' + tel)], ['ईमेल', em], ['पता', f.address], ['वेबसाइट', web && web.replace(/^https?:\/\//, '').replace(/\/$/, '')]].forEach(function (r) {
      if (!r[1]) return; var row = el('div', 'sr-row'); row.appendChild(el('small', '', T(r[0]))); if (r[0] === 'मोबाइल') row.appendChild(actA(link('', r[1], 'tel:+91' + tel), 'call')); else row.appendChild(el('div', '', r[1])); bd.appendChild(row);
    });
    var soc = el('div', 'sr-soc');
    [['Facebook', f.facebook], ['Instagram', f.instagram], ['YouTube', f.youtube], ['LinkedIn', f.linkedin]].forEach(function (s) { var u = V.url(s[1]); if (u) soc.appendChild(link('', s[0], u)); });
    if (soc.children.length) bd.appendChild(soc);
    bd.appendChild(shareBar(f, opts));
    root.appendChild(bd);
  }

  function render(mount, type, tplConfig, content, opts) {
    ensureAssets();
    opts = opts || {}; var t = tplConfig && typeof tplConfig === 'object' ? tplConfig : {}; var pal = t.palette || {};
    type = type === 'visiting' ? 'visiting' : 'invitation';
    var src = content;
    if (opts.demo && isEmpty(type, content)) { src = JSON.parse(JSON.stringify(SAMPLE[type])); if (type === 'invitation' && occ(t).sample) { var os = occ(t).sample; src.fields = Object.assign({}, src.fields, { groom: '', groom_parents: '' }, os); src.events = []; } src.style = (content && content.style) || {}; src.images = (content && content.images) || {}; }
    var d = normalize(type, src), s = d.style; CARDL = s.lang || 'hi';
    var bg = s.bg || col(pal.bg, '#ffffff'), fg = s.fg || col(pal.fg, '#222222'), ac = s.ac || col(pal.ac, '#8b1a2b');
    var layout = s.layout ? s.layout : LAYOUTS.indexOf(t.layout) >= 0 ? t.layout : (type === 'visiting' ? 'band' : 'frame');
    var root = el('div', 'sr ' + (type === 'visiting' ? 'sr-vc' : 'sr-inv') + ' l-' + layout); root.setAttribute('dir', CARDL === 'ur' ? 'rtl' : 'ltr'); root.setAttribute('lang', CARDL);
    var st = root.style;
    st.setProperty('--bg', bg); st.setProperty('--fg', fg); st.setProperty('--ac', ac);
    st.setProperty('--f', (FONTS[s.font || t.font] || FONTS.hind)[1]); st.setProperty('--nf', (FONTS[s.nameFont || t.nameFont] || FONTS.playfair)[1]);
    st.setProperty('--soft', rgba(fg, 0.14)); st.fontSize = (16 * s.size) + 'px'; if (s.weight) st.fontWeight = s.weight;
    var align = s.align || (layout === 'side' || (type === 'invitation' && layout === 'plain' && t.align === 'left') ? 'left' : 'center');
    root.className += ' a-' + align;
    var fx = ['curtain', 'aurora', 'neon', 'flip'].indexOf(s.fx || t.fx) >= 0 ? (s.fx || t.fx) : ''; if (fx && !(opts.demo && !opts.play)) root.className += ' fx-' + fx;
    if (type === 'invitation' && d.images.bg) { st.backgroundImage = 'url("' + d.images.bg.url + '")'; st.backgroundPosition = '50% ' + d.images.bg.pos + '%'; st.setProperty('--pane', rgba(bg, 0.88)); } else st.setProperty('--pane', 'transparent');
    var mo = type === 'visiting' && t.motif ? txt(t.motif, 8) : '';
    if (type === 'visiting') buildVisiting(root, d, opts); else buildInvitation(root, d, { ornament: s.ornament === 'none' ? '' : (s.ornament || (t.ornament === 'none' ? '' : txt(t.ornament, 4))) });
    if (mo) root.insertBefore(motifStrip(mo), root.firstChild);
    var anim = s.anim || (['rich', 'soft', 'none'].indexOf(t.anim) >= 0 ? t.anim : 'rich'), play = !!opts.play || !opts.demo;
    if (anim !== 'none' && play) {
      root.className += ' sr-an sr-an-' + anim;
      var kids = root.querySelector('.in') || root.querySelector('.bd'); if (kids) Array.prototype.forEach.call(kids.children, function (c, i) { c.style.setProperty('--i', Math.min(i, 14)); });
      var pc = s.petal || (PETALS.indexOf(t.petal) >= 0 ? t.petal : type === 'invitation' ? '\u2740' : 'none');
      if (anim === 'rich' && pc !== 'none') {
        var pw = el('div', 'sr-pw'); for (var n = 0; n < 14; n++) { var q = el('span', '', pc); q.style.left = (4 + (n * 7.3) % 92) + '%'; q.style.fontSize = (12 + (n * 5) % 12) + 'px';
          q.style.animationDuration = (9 + (n * 3) % 8) + 's'; q.style.animationDelay = (-(n * 1.7) % 12) + 's'; q.style.setProperty('--dx', (((n % 2) ? 1 : -1) * (20 + (n * 11) % 50)) + 'px'); pw.appendChild(q); }
        root.appendChild(pw);
      }
    }
    if (typeof opts.onAct === 'function') root.addEventListener('click', function (ev) { var t = ev.target.closest ? ev.target.closest('[data-act]') : null; if (t) { try { opts.onAct(t.getAttribute('data-act')); } catch (e) { /* ignore */ } } });
    mount.textContent = ''; mount.appendChild(root); return root;
  }

  var CSS = '.sr{font-family:var(--f);color:var(--fg);background-color:var(--bg);background-size:cover;line-height:1.5;overflow:hidden;word-break:break-word}' +
    '.sr *{box-sizing:border-box;margin:0}.sr a{color:inherit}.sr img{display:block;max-width:100%}' +
    '.sr.a-left{text-align:left}.sr.a-center{text-align:center}.sr.a-right{text-align:right}' +
    '.sr.a-center img{margin-left:auto;margin-right:auto}.sr.a-right img{margin-left:auto}' +
    '.sr-wanum{display:flex;gap:.5em;margin:.2em 0 .8em}.sr-wanum input{flex:1;min-width:0;padding:.7em .8em;border-radius:10px;border:2px solid var(--ac);background:rgba(255,255,255,.9);color:#222;font:inherit;font-size:.95em;box-sizing:border-box}.sr-wanum button{font:inherit;font-weight:700;font-size:.85em;padding:.6em .9em;border:0;border-radius:10px;background:#1f8f4e;color:#fff;cursor:pointer}' +
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
    '.sr-act{display:flex;flex-wrap:wrap;gap:.5em;margin:1em 0}' +
    '.sr-act a{flex:1 1 6.2em;min-width:0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;min-height:2.9em;background:var(--ac);color:var(--bg)!important;border-radius:10px;padding:.55em .6em;text-decoration:none;font-size:.82em;font-weight:600;text-align:center;line-height:1.25}' +
    '.sr-svs{margin:1em 0}.sr-chip{display:inline-block;border:1px solid var(--ac);color:var(--ac);border-radius:2em;padding:.15em .7em;margin:.2em;font-size:.82em}' +
    '.sr-row{text-align:left;padding:.6em 0;border-top:1px solid var(--soft);font-size:.9em}.sr-row small{display:block;opacity:.6;font-size:.75em}' +
    '.sr-soc{margin-top:.8em}.sr-soc a{display:inline-block;margin:.2em;padding:.3em .8em;border-radius:2em;border:1px solid var(--soft);text-decoration:none;font-size:.8em}' +
    '.sr-vc.l-wave .hd{border-radius:0 0 50% 50%/0 0 2.2em 2.2em;padding-bottom:4.6em}' +
    '.sr-vc.l-side .hd{background:none;color:var(--fg);border-left:6px solid var(--ac);padding:1.4em 1.1em .4em}.sr-vc.l-side .sr-biz{color:var(--ac)}' +
    '.sr-vc.l-side .bd,.sr-vc.l-side .bd.noph{border-left:6px solid var(--ac);margin-top:0;padding-top:.6em;border-radius:0;background:none}' +
    '.sr-vc.l-side .ph{margin-top:0;border-radius:16px;border:0}' +
    '.sr-vc.l-diag .hd{clip-path:polygon(0 0,100% 0,100% 74%,0 100%);padding-bottom:5.6em}.sr-vc.l-diag .ph{margin-top:-3.8em}' +
    '.sr-vc.l-ring .hd{background:none;color:var(--fg);padding:1.5em 1.1em .1em}.sr-vc.l-ring .sr-biz{color:var(--ac);letter-spacing:.14em;text-transform:uppercase;font-size:.95em}' +
    '.sr-vc.l-ring .ph{margin-top:.6em;margin-bottom:.9em;border:0;box-shadow:0 0 0 4px var(--bg),0 0 0 7px var(--ac)}.sr-vc.l-ring .bd.noph{margin-top:0;border-radius:0}' +
    '.sr-vc.l-ring .sr-nm::after{content:"";display:block;width:2.6em;height:3px;background:var(--ac);margin:.4em auto 0}' +
    '.sr-vc.l-dots .hd{background:radial-gradient(rgba(255,255,255,.28) 1.6px,transparent 1.8px) 0 0/14px 14px,var(--ac);border-radius:0 0 1.6em 1.6em;padding-bottom:4.4em}' +
    '.sr-vc.l-ribbon .hd{background:none;color:var(--ac);padding:1.3em 1.1em .2em;letter-spacing:.1em;text-transform:uppercase}.sr-vc.l-ribbon .ph{margin-top:.5em;border-radius:14px}.sr-vc.l-ribbon .bd.noph{margin-top:0;border-radius:0}' +
    '.sr-vc.l-ribbon .sr-nm{display:inline-block;background:var(--ac);color:var(--bg);padding:.3em 1.5em;margin:.2em 0 .3em;clip-path:polygon(0 0,100% 0,94% 50%,100% 100%,0 100%,6% 50%)}' +
    '.sr-vc.l-card{border:2px solid var(--ac);outline:1px solid var(--ac);outline-offset:-9px}.sr-vc.l-card .hd{background:none;color:var(--ac);padding:1.7em 1.1em .6em;border-bottom:1px solid var(--soft);margin:0 1.1em;text-transform:uppercase;letter-spacing:.16em}' +
    '.sr-vc.l-card .ph{margin-top:1em;border-radius:6px;border-width:0}.sr-vc.l-card .bd,.sr-vc.l-card .bd.noph{margin-top:0;padding-top:.8em;border-radius:0;background:none}.sr-vc.l-card .sr-nm{letter-spacing:.06em}' +
    '.sr-call{display:block;margin:.6em 0 0;padding:.8em 1em;border-radius:2em;background:#1f8f4e;color:#fff!important;text-decoration:none;font-weight:700;font-size:1.05em;text-align:center;box-shadow:0 3px 10px rgba(0,0,0,.18)}' +
    '.sr-act a.sr-call{flex:1 1 100%;border-radius:2em;font-size:1.05em;padding:.8em 1em}' +
    '.sr{position:relative}.sr-pw{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2}' +
    '.sr-pw span{position:absolute;top:-8%;color:var(--ac);opacity:0;animation:srfall linear infinite}' +
    '@keyframes srfall{0%{opacity:0;transform:translate3d(0,0,0) rotate(0)}10%{opacity:.8}100%{opacity:.5;transform:translate3d(var(--dx),115vh,0) rotate(540deg)}}' +
    '@keyframes srup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}' +
    '@keyframes srpop{0%{opacity:0;transform:scale(.6)}70%{transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}' +
    '@keyframes srflt{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}' +
    '@keyframes srshine{0%{background-position:130% 0}60%,100%{background-position:-60% 0}}' +
    '@keyframes srpls{0%,100%{box-shadow:0 0 0 0 rgba(31,143,78,.55)}70%{box-shadow:0 0 0 12px rgba(31,143,78,0)}}' +
    '.sr-an .in>*,.sr-an .bd>*,.sr-an .hd>*{opacity:0;animation:srup .8s ease forwards;animation-delay:calc(var(--i,0)*.14s)}' +
    '.sr-an .hd>*{animation-delay:.05s}.sr-an .sr-ph,.sr-an .ph{animation-name:srpop}' +
    '.sr-an .sr-or{animation:srup .8s ease forwards,srflt 3.2s ease-in-out 1.2s infinite}' +
    '.sr-an .sr-amp{animation:srpop .9s ease forwards;animation-delay:calc(var(--i,0)*.14s)}' +
    '.sr-an.sr-inv .sr-nm{background:linear-gradient(100deg,var(--ac) 40%,#fff8 50%,var(--ac) 60%) 0 0/250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:srup .8s ease forwards,srshine 4.5s ease-in-out 1.4s infinite}' +
    '.sr-an .sr-nm{animation:srup .8s ease forwards;animation-delay:calc(var(--i,0)*.14s)}' +
    '.sr-act .sr-save{flex:1 1 100%;box-sizing:border-box;font:inherit;font-weight:700;font-size:1.02em;padding:.75em 1em;border:2px solid var(--ac);border-radius:2em;background:transparent;color:var(--ac);cursor:pointer}' +
    '.sr-qr{margin:1.4em auto .4em;text-align:center}.sr-qrimg{width:10em;height:10em;margin:0 auto;padding:.5em;background:#fff;border:2px solid var(--ac);border-radius:14px;box-shadow:0 3px 10px rgba(0,0,0,.12)}' +
    '.sr-qrt{font-size:.8em;opacity:.75;margin-top:.5em}' +
    '.sr-an .sr-save{animation:srup .8s ease forwards}.sr-an .sr-qr{animation:srpop .9s ease forwards;animation-delay:calc(var(--i,0) * .12s + .2s);opacity:0}.sr-an-rich .sr-qrimg{animation:srflt 3.2s ease-in-out 1.5s infinite}' +
    '.sr-an .sr-call{animation:srup .8s ease forwards,srpls 2s ease-out 1.4s infinite}' +
    '.fx-curtain::before,.fx-curtain::after{content:"";position:absolute;top:0;bottom:0;width:51%;z-index:5;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.25),transparent 30%,transparent 70%,rgba(0,0,0,.25)),repeating-linear-gradient(90deg,var(--ac) 0 10px,color-mix(in srgb,var(--ac) 70%,#000) 10px 20px);animation:srcl 2.2s cubic-bezier(.7,0,.2,1) .5s forwards}' +
    '.fx-curtain::before{left:0}.fx-curtain::after{right:0;--d:1}@keyframes srcl{to{transform:translateX(-102%)}}.fx-curtain::after{animation-name:srcr}@keyframes srcr{to{transform:translateX(102%)}}' +
    '.fx-curtain .in{animation:srgl 3.5s ease-in-out 3s infinite}@keyframes srgl{0%,100%{box-shadow:0 0 0 0 transparent}50%{box-shadow:0 0 22px 2px var(--ac)}}' +
    '.fx-aurora{background-image:linear-gradient(125deg,var(--bg),color-mix(in srgb,var(--ac) 38%,var(--bg)),var(--bg),color-mix(in srgb,var(--ac) 22%,var(--bg)),var(--bg));background-size:400% 400%;animation:sraur 14s ease-in-out infinite}' +
    '@keyframes sraur{0%,100%{background-position:0 50%}50%{background-position:100% 50%}}' +
    '.fx-aurora .in{animation:srgl 4s ease-in-out infinite;backdrop-filter:blur(2px)}' +
    '.fx-neon{box-shadow:inset 0 0 0 2px var(--ac),inset 0 0 18px var(--ac);animation:srnb 3s ease-in-out infinite}@keyframes srnb{0%,100%{box-shadow:inset 0 0 0 2px var(--ac),inset 0 0 8px var(--ac)}50%{box-shadow:inset 0 0 0 2px var(--ac),inset 0 0 26px var(--ac)}}' +
    '.fx-neon .sr-nm{text-shadow:0 0 8px var(--ac),0 0 18px var(--ac)}.fx-neon .sr-act a{animation:srnb2 2.6s ease-in-out infinite}@keyframes srnb2{0%,100%{box-shadow:0 0 4px var(--ac)}50%{box-shadow:0 0 14px var(--ac)}}' +
    '.fx-neon::after,.fx-flip::after{content:"";position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.22) 50%,transparent 60%) -150% 0/250% 100% no-repeat;animation:srsw 4.5s ease-in-out 1s infinite}@keyframes srsw{0%{background-position:-150% 0}60%,100%{background-position:150% 0}}' +
    '.fx-flip{animation:srfl 1.3s cubic-bezier(.2,.8,.2,1) both;transform-origin:50% 0}@keyframes srfl{from{opacity:0;transform:perspective(700px) rotateX(-70deg)}to{opacity:1;transform:perspective(700px) rotateX(0)}}' +
    '.fx-flip .hd{animation:sraur 10s ease-in-out infinite;background-image:linear-gradient(120deg,var(--ac),color-mix(in srgb,var(--ac) 55%,#fff),var(--ac));background-size:300% 100%}' +
    '@media (prefers-reduced-motion:reduce){.sr-an *,.sr-pw{animation:none!important;opacity:1!important;transform:none!important}.sr-pw{display:none}.fx-curtain::before,.fx-curtain::after{display:none}}';
  var assetsDone = false;

  /* Mini website: full-page layout built from a visiting card's data. */
  function site(mount, tplConfig, content, opts) {
    ensureAssets(); opts = opts || {};
    var t = tplConfig && typeof tplConfig === 'object' ? tplConfig : {}, pal = t.palette || {};
    var d = normalize('visiting', content), s = d.style, f = d.fields; CARDL = s.lang || 'hi';
    var bg = s.bg || col(pal.bg, '#ffffff'), fg = s.fg || col(pal.fg, '#222222'), ac = s.ac || col(pal.ac, '#8b1a2b');
    var root = el('div', 'sr sr-site'), st = root.style; root.setAttribute('dir', CARDL === 'ur' ? 'rtl' : 'ltr'); root.setAttribute('lang', CARDL);
    st.setProperty('--bg', bg); st.setProperty('--fg', fg); st.setProperty('--ac', ac);
    st.setProperty('--f', (FONTS[s.font || t.font] || FONTS.hind)[1]); st.setProperty('--nf', (FONTS[s.nameFont || t.nameFont] || FONTS.playfair)[1]);
    st.setProperty('--soft', rgba(fg, 0.1)); st.fontSize = (16 * s.size) + 'px'; if (s.weight) st.fontWeight = s.weight;
    var tel = V.tel(f.mobile), wa = V.tel(f.whatsapp), em = V.email(f.email), web = V.url(f.website);
    var mapUrl = (f.address || V.url(f.maplink)) ? (V.url(f.maplink) || maps([f.business, f.address].filter(Boolean).join(', '))) : '';
    var nav = el('div', 'ws-nav'); nav.appendChild(el('b', '', f.business || f.name || 'SpyWell'));
    if (tel) nav.appendChild(actA(link('ws-navbtn', T('📞 कॉल'), 'tel:+91' + tel), 'call'));
    root.appendChild(nav);
    var hero = el('div', 'ws-hero'), hin = el('div', 'ws-in');
    if (d.images.logo) { var lg = picture('sr-lg', d.images.logo, 'logo'); lg.style.maxHeight = d.images.logo.size + 'px'; lg.style.width = 'auto'; hin.appendChild(lg); }
    if (d.images.photo) hin.appendChild(picture('ph', d.images.photo, 'circle'));
    if (f.name) hin.appendChild(el('h1', 'sr-nm', f.name));
    if (f.designation) hin.appendChild(el('div', 'sr-des', f.designation));
    if (f.tagline) hin.appendChild(el('p', 'ws-tag', f.tagline));
    var act = el('div', 'sr-act ws-act');
    if (tel) act.appendChild(actA(link('sr-call', T('📞 कॉल करें : ') + tel.slice(0, 5) + ' ' + tel.slice(5), 'tel:+91' + tel), 'call'));
    if (wa) act.appendChild(actA(link('', T('💬 WhatsApp'), 'https://wa.me/91' + wa), 'whatsapp'));
    if (V.tel(f.sms)) act.appendChild(actA(link('', T('✉️ मैसेज'), 'sms:+91' + V.tel(f.sms)), 'sms'));
    if (mapUrl) act.appendChild(actA(link('', T('📍 लोकेशन'), mapUrl), 'map'));
    if (act.children.length) hin.appendChild(act);
    hero.appendChild(hin); hero.appendChild(waveEl()); var smo = t.motif ? txt(t.motif, 8) : ''; if (smo) hero.insertBefore(motifStrip(smo), hero.firstChild); root.appendChild(hero);
    function sec(title) { var x = el('div', 'ws-sec'), i = el('div', 'ws-in'); i.appendChild(el('h2', '', title)); i.appendChild(el('div', 'ws-bar')); x.appendChild(i); root.appendChild(x); return i; }
    var yr = /^\d{4}$/.test(f.since || '') ? f.since : '';
    if (yr || f.hours || d.services.length) { var stt = el('div', 'ws-stats'); if (yr) { var a1 = el('div', 'ws-stat'); a1.appendChild(el('i', 'ws-si', '🏆')); a1.appendChild(el('b', '', String(Math.max(1, new Date().getFullYear() - (+yr)) ) + '+')); a1.appendChild(el('small', '', T('साल का अनुभव'))); stt.appendChild(a1); } if (d.services.length) { var a2 = el('div', 'ws-stat'); a2.appendChild(el('i', 'ws-si', '🧰')); a2.appendChild(el('b', '', String(d.services.length))); a2.appendChild(el('small', '', T('सेवाएँ'))); stt.appendChild(a2); } if (f.hours) { var a3 = el('div', 'ws-stat'); a3.appendChild(el('i', 'ws-si', '🕘')); a3.appendChild(el('b', 'ws-hrs', T('खुलने का समय'))); a3.appendChild(el('small', '', f.hours)); stt.appendChild(a3); } root.appendChild(stt); }
    if (f.about) sec(T('हमारे बारे में')).appendChild(el('p', 'ws-about', f.about));
    if (d.services.length) { var si = sec(T('सेवाएँ')), g = el('div', 'ws-grid'); d.services.forEach(function (x) { var c = el('div', 'ws-card ws-sv'), p2 = svParts(x); c.appendChild(el('div', 'ws-ic', svIcon(p2[0], g.children.length))); c.appendChild(el('em', 'ws-no', String(g.children.length + 1))); c.appendChild(el('b', '', p2[0])); if (p2[1]) c.appendChild(el('p', 'ws-sd', p2[1])); g.appendChild(c); }); si.appendChild(g); }
    if (d.highlights.length) { var hi = sec(T('हमें क्यों चुनें')), hg = el('div', 'ws-grid ws-hl'); d.highlights.forEach(function (x) { var c = el('div', 'ws-card ws-hi'); c.appendChild(el('div', 'ws-ic ws-ic2', '✔')); c.appendChild(el('span', '', x)); hg.appendChild(c); }); hi.appendChild(hg); }
    var gk = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'].filter(function (k) { return d.images[k]; });
    if (gk.length) { var gi = sec(T('गैलरी')), gg = el('div', 'ws-gal'); gk.forEach(function (k) { var im = picture('ws-gp', d.images[k], 'gallery'); im.style.width = '100%'; gg.appendChild(im); }); gi.appendChild(gg); }
    if (mapUrl) { var mi = sec(T('हमें यहाँ खोजें')); if (f.address) mi.appendChild(el('p', 'ws-about', f.address)); if (!opts.demo && f.address) { var fr = el('iframe', 'ws-map'); fr.setAttribute('loading', 'lazy'); fr.setAttribute('title', 'map'); fr.setAttribute('referrerpolicy', 'no-referrer-when-downgrade'); fr.src = 'https://maps.google.com/maps?q=' + encodeURIComponent([f.business, f.address].filter(Boolean).join(', ')) + '&output=embed'; mi.appendChild(fr); } var mb = actA(link('ws-navbtn ws-mapbtn', T('🧭 रास्ता देखें'), mapUrl), 'map'); mi.appendChild(mb); }
    var ci = sec(T('संपर्क करें')), cg = el('div', 'ws-grid');
    [['मोबाइल', tel && ('+91 ' + tel), tel && 'tel:+91' + tel, 'call'], ['ईमेल', em, em && 'mailto:' + em, 'email'], ['वेबसाइट', web && web.replace(/^https?:\/\//, '').replace(/\/$/, ''), web, 'website']].forEach(function (r) {
      if (!r[1]) return; var c = el('div', 'ws-card ws-ct'); c.appendChild(el('div', 'ws-ic ws-ic2', ({call: '📞', email: '✉️', map: '📍', website: '🌐'})[r[3]] || '•')); c.appendChild(el('small', '', T(r[0]))); if (r[2]) c.appendChild(actA(link('', r[1], r[2]), r[3])); else c.appendChild(el('div', '', r[1])); cg.appendChild(c);
    });
    ci.appendChild(cg);
    var soc = el('div', 'sr-soc');
    [['Facebook', f.facebook, '📘'], ['Instagram', f.instagram, '📸'], ['YouTube', f.youtube, '▶️'], ['LinkedIn', f.linkedin, '💼']].forEach(function (x) { var u = V.url(x[1]); if (u) soc.appendChild(link('', x[2] + ' ' + x[0], u)); });
    if (soc.children.length) ci.appendChild(soc);
    var tools = el('div', 'sr-act');
    if (vcardText(f, false)) { var sv0 = el('button', 'sr-save', T('📇 कॉन्टैक्ट सेव करें')); sv0.type = 'button'; sv0.setAttribute('data-act', 'savecontact'); sv0.onclick = function () { saveVcard(f); }; tools.appendChild(sv0); }
    tools.appendChild(saveCardBtn(root, f));
    ci.appendChild(tools);
    if (tel || wa) { var cb = el('div', 'ws-cta'), cin = el('div', 'ws-in'); cin.appendChild(el('h2', '', T('आज ही संपर्क करें'))); var ca = el('div', 'sr-act ws-act'); if (tel) ca.appendChild(actA(link('sr-call', T('📞 कॉल करें : ') + tel.slice(0, 5) + ' ' + tel.slice(5), 'tel:+91' + tel), 'call')); if (wa) ca.appendChild(actA(link('', T('💬 WhatsApp'), 'https://wa.me/91' + wa), 'whatsapp')); cin.appendChild(ca); cb.appendChild(cin); root.appendChild(cb); }
    if (typeof opts.onEnquiry === 'function') {
      var es = el('div', 'ws-sec'), ei = el('div', 'ws-in'); ei.appendChild(el('h2', '', T('पूछताछ भेजें'))); ei.appendChild(el('div', 'ws-bar'));
      var en = el('input', 'sr-eq'), em = el('input', 'sr-eq'), ex = el('textarea', 'sr-eq'), eb = el('button', 'sr-save', T('📩 पूछताछ भेजें')), er = el('div', 'sr-eqm');
      en.placeholder = T('आपका नाम'); en.maxLength = 60; em.placeholder = T('मोबाइल नंबर'); em.maxLength = 12; em.type = 'tel'; em.inputMode = 'numeric'; ex.placeholder = T('आप क्या जानना चाहते हैं?'); ex.maxLength = 500; ex.rows = 3; eb.type = 'button';
      eb.onclick = function () {
        var nm = en.value.trim(), mb = em.value.replace(/\D/g, '').slice(-10), ms = ex.value.trim();
        if (!nm || !/^[6-9][0-9]{9}$/.test(mb) || !ms) { er.textContent = T('नाम, सही मोबाइल नंबर और संदेश भरें।'); return; }
        eb.disabled = true; er.textContent = T('भेजा जा रहा है…');
        Promise.resolve(opts.onEnquiry(nm, mb, ms)).then(function (r) {
          eb.disabled = false;
          if (r === 'ok') { er.textContent = T('✓ आपकी पूछताछ भेज दी गई। जल्द जवाब मिलेगा।'); en.value = em.value = ex.value = ''; }
          else if (r === 'limit') er.textContent = T('बहुत ज़्यादा संदेश भेजे गए, थोड़ी देर बाद कोशिश करें।');
          else er.textContent = T('अभी नहीं भेजा जा सका। दोबारा कोशिश करें।');
        }, function () { eb.disabled = false; er.textContent = T('अभी नहीं भेजा जा सका। दोबारा कोशिश करें।'); });
      };
      [en, em, ex, eb, er].forEach(function (x) { ei.appendChild(x); }); es.appendChild(ei);
      if (opts.demo) { root.appendChild(es); } else {
        /* frozen enquiry: a fixed button + fixed bottom sheet, always in the same place */
        var ac2 = getComputedStyle(root).getPropertyValue('--ac') || '#12307f';
        var fab = el('button', '', T('📩 पूछताछ')); fab.type = 'button';
        fab.style.cssText = 'position:fixed;right:14px;bottom:18px;z-index:9000;border:0;border-radius:999px;padding:13px 20px;font:600 15px/1 system-ui,sans-serif;color:#fff;background:' + (ac2.trim() || '#12307f') + ';box-shadow:0 6px 18px rgba(0,0,0,.3);cursor:pointer';
        var sh = el('div', ''); sh.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9001;display:none;max-height:85vh;overflow:auto;background:#fff;color:#14203d;border-radius:18px 18px 0 0;box-shadow:0 -8px 28px rgba(0,0,0,.35);padding:16px 16px 22px';
        var hd2 = el('div', ''); hd2.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px';
        var hb = el('b', '', T('पूछताछ भेजें')); hb.style.fontSize = '18px'; var cx = el('button', '', '✕'); cx.type = 'button'; cx.setAttribute('aria-label', 'close');
        cx.style.cssText = 'border:0;background:#eef1f7;color:#14203d;width:36px;height:36px;border-radius:50%;font-size:18px;cursor:pointer';
        hd2.appendChild(hb); hd2.appendChild(cx); sh.appendChild(hd2);
        var h2 = ei.querySelector('h2'), bar = ei.querySelector('.ws-bar'); if (h2) h2.remove(); if (bar) bar.remove();
        eb.style.cssText = 'display:block;width:100%;margin-top:10px;border:0;border-radius:12px;padding:14px;font:600 16px/1 system-ui,sans-serif;color:#fff;background:' + (ac2.trim() || '#12307f') + ';cursor:pointer';
        sh.appendChild(ei);
        function openSh() { sh.style.display = 'block'; fab.style.display = 'none'; }
        function closeSh() { sh.style.display = 'none'; fab.style.display = ''; }
        fab.onclick = openSh; cx.onclick = closeSh;
        root.appendChild(fab); root.appendChild(sh);
      }
    }
    var shs = el('div', 'ws-sec'), shi = el('div', 'ws-in'); shi.appendChild(shareBar(f, opts)); shs.appendChild(shi); root.appendChild(shs);
    root.appendChild(el('div', 'ws-foot', '© ' + new Date().getFullYear() + ' ' + (f.business || f.name || '')));
    if (typeof opts.onAct === 'function') root.addEventListener('click', function (ev) { var x = ev.target.closest ? ev.target.closest('[data-act]') : null; if (x) { try { opts.onAct(x.getAttribute('data-act')); } catch (e) { } } });
    var wan = s.anim || (['rich', 'soft', 'none'].indexOf(t.anim) >= 0 ? t.anim : 'rich');
    if (wan !== 'none' && !opts.demo && 'IntersectionObserver' in window) {
      root.className += ' ws-an';
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('ws-on'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
      Array.prototype.forEach.call(root.querySelectorAll('.ws-sec .ws-in'), function (x) { x.classList.add('ws-rv'); io.observe(x); });
      Array.prototype.forEach.call(root.querySelectorAll('.ws-card,.sr-chip,.sr-qr'), function (x, i) { x.style.setProperty('--k', i % 6); });
      if (wan === 'rich') { var bl = el('div', 'ws-bl'); for (var n = 0; n < 6; n++) { var b = el('i', '', smo); b.style.cssText = 'left:' + (8 + n * 16) + '%;width:' + (30 + (n * 17) % 40) + 'px;height:' + (30 + (n * 17) % 40) + 'px;animation-delay:' + (-n * 1.6) + 's;animation-duration:' + (9 + n * 2) + 's'; bl.appendChild(b); } root.querySelector('.ws-hero').appendChild(bl); }
    }
    mount.textContent = ''; mount.appendChild(root); return root;
  }
  CSS += '.sr[dir=rtl] .sr-row{text-align:right}.sr[dir=rtl] .sr-save,.sr[dir=rtl] .sr-act a{direction:rtl}' +
    '.sr-site{max-width:820px;margin:0 auto;min-height:100vh;text-align:center}.ws-in{padding:0 1.2em}' +
    '.ws-nav{display:flex;justify-content:space-between;align-items:center;padding:.8em 1.2em;background:var(--bg);border-bottom:1px solid var(--soft);position:sticky;top:0;z-index:3}' +
    '.ws-navbtn{background:var(--ac);color:var(--bg)!important;text-decoration:none;padding:.4em .9em;border-radius:2em;font-size:.85em;font-weight:600}' +
    '.ws-hero{background:var(--ac);color:var(--bg);padding:2.2em 0 2.6em}.ws-hero .ph{border-radius:50%;object-fit:cover;border:4px solid var(--bg);margin:0 auto .7em}' +
    '.ws-hero .sr-nm{font-family:var(--nf);font-size:2em;font-weight:700}.ws-hero .sr-des{opacity:.85}.ws-hero .sr-lg{margin:0 auto .6em;object-fit:contain}' +
    '.ws-hero .sr-act{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}' +
    '.ws-hero .sr-act a,.ws-hero .sr-act button{width:auto;margin:0;background:var(--bg);color:var(--ac)!important}' +
    '.ws-hero .sr-act a.sr-call,.ws-cta .ws-act a.sr-call{flex:1 1 100%;max-width:none;width:100%;box-sizing:border-box;font-size:1.05em;padding:.85em 1em;white-space:nowrap}' +
    '.ws-sec{padding:1.8em 0;border-bottom:1px solid var(--soft)}.ws-sec h2{font-family:var(--nf);font-size:1.35em;margin-bottom:.7em;color:var(--ac)}' +
    '.ws-about{max-width:34em;margin:0 auto;white-space:pre-line}.ws-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(11em,1fr));gap:.7em}' +
    '.ws-card{background:var(--soft);border-radius:12px;padding:.9em;font-weight:600}.ws-card small{display:block;opacity:.65;font-weight:400;margin-bottom:.2em}' +
    '.ws-card a{text-decoration:none;word-break:break-all}' +
    '.ws-hero .ws-act a,.ws-hero .ws-act button,.ws-cta .ws-act a{flex:1 1 9em;max-width:12em;display:flex;align-items:center;justify-content:center;gap:.3em;min-height:2.8em;padding:.5em 1em;border-radius:2em;font-weight:700;text-decoration:none;box-sizing:border-box}' +
    '.ws-tag{max-width:30em;margin:.4em auto 1em;opacity:.95;font-size:1.05em}' +
    '.ws-stats{display:flex;justify-content:center;flex-wrap:wrap;gap:.8em;padding:1.2em 1em;background:var(--soft)}.ws-stat{min-width:7em;text-align:center}.ws-stat b{display:block;font-size:1.5em;color:var(--ac);font-family:var(--nf)}.ws-stat small{opacity:.75}' +
    '.ws-sv b{display:block;color:var(--ac)}.ws-sd{font-weight:400;font-size:.88em;opacity:.8;margin-top:.3em;line-height:1.4}' +
    '.ws-hl .ws-card{text-align:left}.ws-ck{color:var(--ac);font-weight:700}' +
    '.ws-gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(9em,1fr));gap:.6em}.ws-gal .ws-gp{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:12px;display:block}' +
    '.ws-map{width:100%;height:14em;border:0;border-radius:12px;margin:.8em 0}.ws-mapbtn{display:inline-block}' +
    '.ws-cta{background:var(--ac);color:var(--bg);padding:2em 0}.ws-cta h2{font-family:var(--nf);margin-bottom:.7em}.ws-cta .ws-act{display:flex;flex-wrap:wrap;justify-content:center;gap:8px}.ws-cta .ws-act a{background:var(--bg);color:var(--ac)!important}' +
    '.sr-eq{display:block;width:100%;box-sizing:border-box;margin:.5em 0;padding:.8em;border:1px solid rgba(0,0,0,.2);border-radius:10px;font:inherit}.sr-eqm{font-size:.9em;margin-top:.5em;min-height:1.2em}.ws-foot{padding:1.2em;font-size:.8em;opacity:.65}' +
    '.ws-hero{padding-bottom:3.2em}.ws-wave{position:absolute;left:0;right:0;bottom:-1px;height:2.2em;line-height:0}.ws-wave svg{width:100%;height:100%;display:block}' +
    '.ws-bar{width:3.2em;height:4px;border-radius:4px;background:var(--ac);margin:-.3em auto 1em;opacity:.8}' +
    '.ws-ic{width:2.8em;height:2.8em;border-radius:50%;background:color-mix(in srgb,var(--ac) 16%,var(--bg));display:flex;align-items:center;justify-content:center;font-size:1.4em;margin:0 auto .5em}.ws-ic2{background:var(--ac);color:var(--bg);font-size:1.1em;font-weight:700}' +
    '.ws-sv{position:relative;text-align:center}.ws-no{position:absolute;top:.5em;right:.7em;font-style:normal;font-size:.75em;font-weight:700;color:var(--ac);opacity:.7}' +
    '.ws-hi{display:flex;align-items:center;gap:.7em;text-align:left}.ws-hi .ws-ic{margin:0;flex:none;font-size:1em}' +
    '.ws-ct .ws-ic{font-size:1.1em;margin-bottom:.3em}' +
    '.ws-stats{gap:.6em;padding:1.4em .8em}.ws-stat{flex:1 1 7em;background:var(--bg);border-radius:16px;padding:.9em .5em;box-shadow:0 2px 10px rgba(0,0,0,.07)}.ws-si{display:block;font-style:normal;font-size:1.4em;margin-bottom:.1em}.ws-hrs{font-size:1em!important;font-family:var(--f)!important}' +
    '.ws-card{box-shadow:0 1px 6px rgba(0,0,0,.05)}' +
    '.ws-hero{position:relative;overflow:hidden}.ws-hero .ws-in{position:relative;z-index:1}' +
    '.ws-an .ws-hero{background-image:linear-gradient(120deg,var(--ac),color-mix(in srgb,var(--ac) 60%,#fff),var(--ac));background-size:300% 100%;animation:sraur 12s ease-in-out infinite}' +
    '.ws-an .ws-hero .ws-in>*{opacity:0;animation:srup .8s ease forwards}.ws-an .ws-hero .ws-in>*:nth-child(2){animation-delay:.15s}.ws-an .ws-hero .ws-in>*:nth-child(3){animation-delay:.3s}.ws-an .ws-hero .ws-in>*:nth-child(4){animation-delay:.45s}.ws-an .ws-hero .ws-in>*:nth-child(5){animation-delay:.6s}' +
    '.ws-an .ws-hero .ph{animation-name:srpop}.ws-an .ws-hero .sr-call{animation:srup .8s ease forwards,srpls 2s ease-out 1.4s infinite}' +
    '.ws-bl{position:absolute;inset:0;pointer-events:none}.ws-bl i{position:absolute;bottom:-60px;border-radius:50%;background:rgba(255,255,255,.14);animation:wsbl linear infinite}@keyframes wsbl{to{transform:translateY(-340px);opacity:0}}' +
    '.ws-rv{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s ease}.ws-rv.ws-on{opacity:1;transform:none}' +
    '.ws-an .ws-card,.ws-an .sr-chip{opacity:0;transform:scale(.92)}.ws-an .ws-on .ws-card,.ws-an .ws-on .sr-chip{opacity:1;transform:none;transition:opacity .5s ease,transform .5s ease,box-shadow .2s;transition-delay:calc(var(--k,0)*.08s)}' +
    '.ws-an .ws-card:hover{box-shadow:0 6px 16px rgba(0,0,0,.14);transform:translateY(-3px)}' +
    '.ws-an .ws-navbtn{animation:srpls 2s ease-out 1.5s infinite}' +
    '.sr-mt{display:flex;justify-content:space-around;align-items:center;font-size:1.25em;padding:.4em .5em;background:var(--soft);overflow:hidden}.sr-mt span{display:block}.sr-vc .sr-mt+.hd{margin-top:0}' +
    '.ws-hero .sr-mt{background:rgba(255,255,255,.18);margin:-2.2em 0 1.4em}.ws-bl i{display:flex;align-items:center;justify-content:center;background:none!important;font-style:normal;font-size:26px;width:auto!important;height:auto!important}' +
    '.sr-an .sr-mt span,.ws-an .sr-mt span{animation:srflt 3s ease-in-out infinite;animation-delay:calc(var(--n)*.25s)}' +
    '@media (prefers-reduced-motion:reduce){.ws-an .ws-hero,.ws-an .ws-hero .ws-in>*,.ws-rv,.ws-an .ws-card,.ws-an .sr-chip{animation:none!important;opacity:1!important;transform:none!important;transition:none!important}.ws-bl{display:none}}';

  function ensureAssets() {
    if (assetsDone) return; assetsDone = true;
    var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s);
    var l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Hind:wght@400;500;600;700&family=Mukta:wght@400;600;700&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Tiro+Devanagari+Hindi&family=Yatra+One&display=swap';
    document.head.appendChild(l);
  }

  window.StudioRender = { fieldsFor: fieldsFor, presetsFor: presetsFor, OCCASIONS: OCCASIONS, render: render, site: site, CLANGS: CLANGS, normalize: normalize, invalid: invalid, title: title, isEmpty: isEmpty, V: V,
    FIELDS: FIELDS, IMAGES: IMAGES, FONTS: FONTS, SAMPLE: SAMPLE, EVENT_PRESETS: EVENT_PRESETS, MAX_EVENTS: MAX_EVENTS, MAX_SERVICES: MAX_SERVICES, MAX_HIGH: MAX_HIGH, svParts: svParts, BUCKET: BUCKET };
})();
