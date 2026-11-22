// After the build: static link-preview pages for company sites (/c/<sd>/) and employee cards (/c/<sd>/<emp>/).
// WhatsApp/Telegram bots read only the meta tags; people are sent on to the real page by a script.
const fs = require('fs'), path = require('path');
const B = 'https://rxhanrtoaplwphmwpgqg.supabase.co', K = 'sb_publishable_C76zU42qscFbBnfOcn5Zew_1VcRcL4d';
const ORIGIN = process.env.SITE_ORIGIN || 'https://livecard.in';
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const okImg = (u) => (typeof u === 'string' && u.indexOf(B + '/storage/v1/object/public/') === 0 && u.indexOf('..') < 0 ? u : '');
const FALL = ORIGIN + '/studio/vicard-icon.png';
function page(url, to, title, desc, img) {
  return '<!doctype html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + esc(url) + '">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="LiveCard"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:url" content="' + esc(url) + '"><meta property="og:image" content="' + esc(img) + '">' +
    '<meta name="twitter:card" content="summary"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:description" content="' + esc(desc) + '">' +
    '<script>location.replace(' + JSON.stringify(to) + '+(location.search?\'&\'+location.search.slice(1):\'\'))</script></head><body><p>' + esc(title) + '</p><noscript><a href="' + esc(to) + '">खोलें</a></noscript></body></html>';
}
(async () => {
  try {
    const r = await fetch(B + '/rest/v1/rpc/corp_pub_list', { method: 'POST', headers: { apikey: K, Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' }, body: '{}' });
    if (!r.ok) { console.warn('corp list failed', r.status); return; }
    const list = await r.json(); let n = 0;
    for (const o of list) {
      const sd = String(o.sd || '').toLowerCase(); if (!/^[a-z0-9-]{3,30}$/.test(sd)) continue;
      const dir = path.join('dist', 'c', sd); fs.mkdirSync(dir, { recursive: true });
      const cimg = okImg(o.logo) || FALL;
      fs.writeFileSync(path.join(dir, 'index.html'), page(ORIGIN + '/c/' + sd + '/', '/studio/company/?o=' + sd, clip(o.name, 90), clip(o.tagline || 'Official company page · Digital Identity Platform · LiveCard Corporate', 160), cimg)); n++;
      for (const e of o.employees || []) {
        const es = String(e.slug || '').toLowerCase(); if (!/^[a-z0-9-]{1,60}$/.test(es)) continue;
        const ed = path.join(dir, es); fs.mkdirSync(ed, { recursive: true });
        fs.writeFileSync(path.join(ed, 'index.html'), page(ORIGIN + '/c/' + sd + '/' + es, '/studio/view/?c=' + sd + '&e=' + es, clip(e.name + ' · ' + o.name, 90), clip([e.designation, o.name, 'डिजिटल पहचान · Digital Identity'].filter(Boolean).join(' · '), 160), okImg(e.photo) || cimg)); n++;
      }
    }
    console.log('corp pages', n);
  } catch (e) { console.warn('corp og skipped', e.message); }
})();
