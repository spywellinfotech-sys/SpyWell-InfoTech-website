// LiveCard Corporate: wildcard subdomain router (Cloudflare Worker).
// Route: *.livecard.in/*  (DNS: proxied wildcard record  *  ->  livecard.in)
// <sd>.livecard.in/        -> company site     (/studio/company/)
// <sd>.livecard.in/<emp>   -> employee card    (/studio/view/)
// Everything else (assets, /studio/*, /dyname/* ...) passes through to the normal livecard.in site.
// The company is resolved from the request HOSTNAME and verified by the database (corp_pub_company / corp_pub_card).
// A browser-supplied organisation id is never used.
const ORIGIN = 'https://livecard.in';
const SB = 'https://rxhanrtoaplwphmwpgqg.supabase.co';
const KEY = 'sb_publishable_C76zU42qscFbBnfOcn5Zew_1VcRcL4d';
const RESERVED = new Set(['www', 'app', 'api', 'admin', 'studio', 'mail']);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

async function rpc(fn, body) {
  const r = await fetch(SB + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body), cf: { cacheTtl: 60, cacheEverything: false } });
  return r.ok ? r.json() : null;
}

export default {
  async fetch(req) {
    const url = new URL(req.url);
    const m = url.hostname.toLowerCase().match(/^([a-z0-9-]+)\.livecard\.in$/);
    if (!m || RESERVED.has(m[1])) return fetch(ORIGIN + url.pathname + url.search, req); // plain livecard.in behaviour
    const sd = m[1], seg = url.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    const isPage = seg === '' || /^[a-z0-9-]{1,60}$/.test(seg);
    if (!isPage || seg === 'studio' || seg === 'dyname' || seg === 'assets') return fetch(ORIGIN + url.pathname + url.search, req); // static files
    const target = seg === '' ? '/studio/company/' : '/studio/view/';
    const res = await fetch(ORIGIN + target, { headers: { 'User-Agent': req.headers.get('User-Agent') || '' } });
    // link-preview tags from the database (WhatsApp / Google read these)
    let title = '', desc = '', img = '';
    if (seg === '') {
      const d = await rpc('corp_pub_company', { p_sd: sd });
      if (!d || d.state !== 'ok') return new Response('Company not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      title = d.name; desc = d.tagline || d.description || 'Official company page'; img = d.logo_url || '';
    } else {
      const d = await rpc('corp_pub_card', { p_sd: sd, p_emp: seg });
      if (!d || d.state === 'notfound' || d.state === 'suspended') return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      title = (d.name || 'Card') + (d.company ? ' · ' + d.company : ''); desc = clip([d.designation, d.company].filter(Boolean).join(' · '), 160) || 'Digital visiting card';
      img = d.photo || d.logo_url || '';
      if (d.state === 'inactive') { title = d.company || 'Company'; desc = 'यह कार्ड अब सक्रिय नहीं है'; img = ''; }
    }
    const canon = 'https://' + sd + '.livecard.in/' + seg;
    const tags = '<title>' + esc(title) + '</title><meta name="description" content="' + esc(clip(desc, 160)) + '"><link rel="canonical" href="' + esc(canon) + '">' +
      '<meta property="og:type" content="website"><meta property="og:site_name" content="LiveCard"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(clip(desc, 160)) + '"><meta property="og:url" content="' + esc(canon) + '">' +
      (img ? '<meta property="og:image" content="' + esc(img) + '">' : '<meta property="og:image" content="https://livecard.in/studio/vicard-icon.png">') + '<meta name="twitter:card" content="summary">';
    const out = new HTMLRewriter()
      .on('title', { element(e) { e.remove(); } })
      .on('meta[name="description"]', { element(e) { e.remove(); } })
      .on('head', { element(e) { e.append(tags, { html: true }); } })
      .transform(res);
    const h = new Response(out.body, out);
    h.headers.set('Cache-Control', 'public, max-age=60');
    return h;
  },
};
