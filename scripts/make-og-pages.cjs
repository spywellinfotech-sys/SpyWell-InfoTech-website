// After the build: writes a small static page for every published Studio card (/v/<slug>, /inv/<slug>, /i/<slug>, /web/<slug>)
// carrying that card's own title, description and picture, so WhatsApp/Telegram show a rich link preview.
// People are sent on to the real viewer by a script; link-preview bots read only the meta tags.
const fs = require('fs'), path = require('path');
const B = 'https://rxhanrtoaplwphmwpgqg.supabase.co', K = 'sb_publishable_C76zU42qscFbBnfOcn5Zew_1VcRcL4d';
const ORIGIN = 'https://spywell.in', FALLBACK = ORIGIN + '/studio/vicard-icon.png';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const okImg = (u) => typeof u === 'string' && u.indexOf(B + '/storage/v1/object/public/') === 0 && u.indexOf('..') < 0 ? u : '';

function page(kind, slug, d) {
  const f = (d.content_json && d.content_json.fields) || {}, im = (d.content_json && d.content_json.images) || {};
  const inv = d.product_type === 'invitation';
  let title, desc, img;
  if (inv) {
    const who = [f.bride, f.groom].filter(Boolean).join(' संग '); // birthday / puja etc. have only one name
    const MON = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
    const dm = /^(\d{4})-(\d{2})-(\d{2})/.exec(f.date || ''), when = dm ? (+dm[3]) + ' ' + MON[+dm[2] - 1] + ' ' + dm[1] : '';
    title = clip(d.title || (f.heading && who ? f.heading.replace(/\s+/g, ' ').trim() + ' · ' + who : who) || f.heading || 'डिजिटल निमंत्रण', 90);
    desc = clip([when, f.venue, f.message || 'आप सपरिवार सादर आमंत्रित हैं।'].filter(Boolean).join(' · '), 160);
    img = okImg(im.bg && im.bg.url) || okImg(im.photo && im.photo.url) || okImg(im.cover && im.cover.url);
  } else {
    const isWeb = kind === 'web', nm = f.name || f.business || d.title || 'डिजिटल कार्ड';
    if (isWeb) { // mini website: the shop / business name leads
      title = clip(f.business || nm, 90);
      desc = clip([f.business && f.name ? f.name : '', f.designation, 'कॉल, WhatsApp, लोकेशन और सब जानकारी एक जगह'].filter(Boolean).join(' · '), 160);
    } else { // visiting card: the person's name leads
      title = clip(nm, 90);
      desc = clip([f.designation, f.business && f.name ? f.business : '', 'डिजिटल विज़िटिंग कार्ड'].filter(Boolean).join(' · '), 160);
    }
    img = okImg(im.photo && im.photo.url) || okImg(im.logo && im.logo.url);
  }
  img = img || FALLBACK;
  const t = kind === 'inv' || kind === 'i' ? 'i' : kind === 'web' ? 'w' : 'v';
  const url = ORIGIN + '/' + (kind === 'i' ? 'inv' : kind) + '/' + slug;
  const to = '/studio/view/?t=' + t + '&s=' + slug;
  const big = inv && img !== FALLBACK;
  return '<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + esc(url) + '">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="DynaMe · SpyWell"><meta property="og:url" content="' + esc(url) + '">' +
    '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:image" content="' + esc(img) + '">' +
    '<meta name="twitter:card" content="' + (big ? 'summary_large_image' : 'summary') + '"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:image" content="' + esc(img) + '">' +
    '<meta name="robots" content="noindex"><script>location.replace(' + JSON.stringify(to) + ')</script></head>' +
    '<body style="font-family:sans-serif;text-align:center;padding:40px"><p>' + esc(title) + '</p><p><a href="' + esc(to) + '">खोलें</a></p></body></html>';
}

(async () => {
  let rows = [];
  try {
    const r = await fetch(B + '/rest/v1/studio_designs?status=eq.published&slug=not.is.null&select=slug,product_type,title,content_json&limit=2000', { headers: { apikey: K, Authorization: 'Bearer ' + K } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    rows = await r.json();
  } catch (e) { console.warn('og pages skipped:', e.message); return; }
  let n = 0;
  for (const d of rows) {
    const slug = String(d.slug || '').toLowerCase();
    if (!/^[a-z0-9-]{1,60}$/.test(slug)) continue;
    const kinds = d.product_type === 'invitation' ? ['inv', 'i'] : ['v', 'web'];
    for (const k of kinds) {
      const dir = path.join('dist', k, slug);
      if (fs.existsSync(path.join(dir, 'index.html'))) continue; // never overwrite a real page
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), page(k, slug, d)); n++;
    }
  }
  console.log('og pages written:', n);
})();
