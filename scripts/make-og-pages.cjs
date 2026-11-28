// After the build: writes a small static page for every published Studio card (/v/<slug>, /inv/<slug>, /i/<slug>, /web/<slug>)
// carrying that card's own title, description and picture, so WhatsApp/Telegram show a rich link preview.
// People are sent on to the real viewer by a script; link-preview bots read only the meta tags.
const fs = require('fs'), path = require('path');
const B = 'https://rxhanrtoaplwphmwpgqg.supabase.co', K = 'sb_publishable_C76zU42qscFbBnfOcn5Zew_1VcRcL4d';
const ORIGIN = process.env.SITE_ORIGIN || 'https://spywell.in';
let FALLBACK = ORIGIN + '/studio/vicard-icon.png', BRAND = 'LiveCard'; // both can be changed from studio_settings (brand_name, brand_icon)
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const okImg = (u) => typeof u === 'string' && u.indexOf(B + '/storage/v1/object/public/') === 0 && u.indexOf('..') < 0 ? u : '';

let sharp = null; try { sharp = require('sharp'); } catch (e) { console.warn('sharp missing: small thumbnails skipped'); }
const THUMB = {}; // slug -> small square preview url (WhatsApp shows a small side thumbnail for small images)
function page(kind, slug, d) {
  const f = (d.content_json && d.content_json.fields) || {}, im = (d.content_json && d.content_json.images) || {};
  const inv = d.product_type === 'invitation';
  let title, desc, img;
  if (inv) {
    const who = [f.bride, f.groom].filter(Boolean).join(' संग '); // birthday / puja etc. have only one name
    const MON = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
    const dm = /^(\d{4})-(\d{2})-(\d{2})/.exec(f.date || ''), when = dm ? (+dm[3]) + ' ' + MON[+dm[2] - 1] + ' ' + dm[1] : '';
    title = clip((d.content_json && d.content_json.demo === true ? 'DEMO · ' : '') + (d.title || (f.heading && who ? f.heading.replace(/\s+/g, ' ').trim() + ' · ' + who : who) || f.heading || 'डिजिटल निमंत्रण'), 90);
    desc = clip([when, f.venue, f.message || 'आप सपरिवार सादर आमंत्रित हैं।'].filter(Boolean).join(' · '), 160);
    img = okImg(im.couple && im.couple.url) || okImg(im.family && im.family.url) || okImg(im.bg && im.bg.url); // the person / couple first, then family, then background
  } else {
    const isWeb = kind === 'web', nm = f.name || f.business || d.title || 'डिजिटल कार्ड';
    if (isWeb) { // mini website: the shop / business name leads
      title = clip((d.content_json && d.content_json.demo === true ? 'DEMO · ' : '') + (f.business || nm), 90);
      desc = clip([f.dealsin || f.about, f.city, 'कॉल, WhatsApp, लोकेशन और सब जानकारी एक जगह'].filter(Boolean).join(' · '), 160);
    } else { // visiting card: the person's name leads
      title = clip((d.content_json && d.content_json.demo === true ? 'DEMO · ' : '') + nm, 90);
      desc = clip([f.designation, f.business && f.name ? f.business : '', f.dealsin || 'डिजिटल विज़िटिंग कार्ड'].filter(Boolean).join(' · '), 160);
    }
    img = okImg(im.photo && im.photo.url) || okImg(im.logo && im.logo.url);
  }
  img = img || FALLBACK;
  if (!inv && THUMB[slug]) img = THUMB[slug];
  const t = kind === 'inv' || kind === 'i' ? 'i' : kind === 'web' ? 'w' : 'v';
  const url = kind === 's' ? ORIGIN + '/v/' + slug : ORIGIN + '/' + (kind === 'i' ? 'inv' : kind) + '/' + slug;
  const to = '/studio/view/?t=' + t + '&s=' + slug + '&b=' + Date.now().toString(36);
  const big = inv && img !== FALLBACK;
  return '<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + esc(url) + '">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="' + esc(BRAND) + '"><meta property="og:url" content="' + esc(url) + '">' +
    (THUMB[slug] && img === THUMB[slug] ? '<meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="200"><meta property="og:image:height" content="200">' : '') + '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:image" content="' + esc(img) + '">' +
    '<meta name="twitter:card" content="' + (big ? 'summary_large_image' : 'summary') + '"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:image" content="' + esc(img) + '">' +
    '<meta name="robots" content="noindex"><script>(function(){var u=' + JSON.stringify(to) + ';if(window.top!==window)location.replace(u);else location.replace(u)})()</script></head>' +
    '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fff4ee;font-family:sans-serif"><img src="/studio/livecard-stamp-t.png" alt="" width="96" height="96" style="width:96px;height:96px"><noscript><p style="position:fixed;bottom:30px;left:0;right:0;text-align:center"><a href="' + esc(to) + '">' + esc(title) + ' — खोलें</a></p></noscript></body></html>';
}

(async () => {
  let rows = [];
  try {
    const r = await fetch(B + '/rest/v1/studio_designs?status=eq.published&slug=not.is.null&select=slug,product_type,title,content_json&limit=2000', { headers: { apikey: K, Authorization: 'Bearer ' + K } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    rows = await r.json();
  } catch (e) { console.warn('og pages skipped:', e.message); return; }
  try {
    const br = await fetch(B + '/rest/v1/rpc/studio_brand', { method: 'POST', headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' }, body: '{}' });
    if (br.ok) { const j = await br.json(); if (j && j.name) BRAND = String(j.name).slice(0, 60); if (j && /^https:\/\//.test(j.icon || '')) FALLBACK = j.icon; }
  } catch (e) { console.warn('brand default used:', e.message); }
  if (sharp) {
    fs.mkdirSync(path.join('dist', 'og'), { recursive: true });
    for (const d of rows) {
      const slug = String(d.slug || '').toLowerCase();
      if (d.product_type === 'invitation' || !/^[a-z0-9-]{1,60}$/.test(slug)) continue;
      const im = (d.content_json && d.content_json.images) || {}, src = okImg(im.photo && im.photo.url) || okImg(im.logo && im.logo.url);
      if (!src) continue;
      try {
        const r = await fetch(src); if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        await sharp(buf).rotate().resize(200, 200, { fit: 'cover', position: 'attention' }).jpeg({ quality: 80 }).toFile(path.join('dist', 'og', slug + '.jpg'));
        THUMB[slug] = ORIGIN + '/og/' + slug + '.jpg';
      } catch (e) { console.warn('thumb skipped', slug, e.message); }
    }
  }
  let n = 0;
  for (const d of rows) {
    const slug = String(d.slug || '').toLowerCase();
    if (!/^[a-z0-9-]{1,60}$/.test(slug)) continue;
    const kinds = d.product_type === 'invitation' ? ['inv', 'i'] : ['v', 'web'];
    // short link livecard.in/<slug> as a real page (HTTP 200), so it opens everywhere and shows a preview
    if (d.product_type !== 'invitation' && /^[a-z0-9-]{3,40}$/.test(slug) && !/^(about|services|products|portfolio|industries|contact|privacy|terms|refund|studio|plans|g|c|i|v|web|inv|card|apps|og|assets|dyname|admin|app|api|static|images|img|public|favicon|robots|sitemap|index)$/.test(slug)) kinds.push('s');
    for (const k of kinds) {
      const dir = k === 's' ? path.join('dist', slug) : path.join('dist', k, slug);
      if (fs.existsSync(path.join(dir, 'index.html'))) continue; // never overwrite a real page
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), page(k, slug, d)); n++;
    }
  }
  console.log('og pages written:', n);
})();
