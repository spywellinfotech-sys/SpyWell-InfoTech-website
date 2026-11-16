// Link previews that look like the real card: screenshots every published visiting card (/v) and mini website (/web)
// from the built site, puts the picture on a 1200x630 canvas, and points og:image of the preview pages at it.
// Needs playwright + chromium (installed by the workflow). Any failure just leaves the old small photo preview in place.
const fs = require('fs'), path = require('path'), http = require('http');
const ORIGIN = 'https://spywell.in', DIST = 'dist', LIMIT = 400;
let chromium, sharp;
try { chromium = require('playwright').chromium; } catch (e) { console.warn('playwright missing, shots skipped'); process.exit(0); }
try { sharp = require('sharp'); } catch (e) { console.warn('sharp missing, shots skipped'); process.exit(0); }
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DIST, p); if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(8799, r));
  const jobs = [];
  for (const k of ['v', 'web', 'inv']) {
    const dir = path.join(DIST, k); if (!fs.existsSync(dir)) continue;
    for (const slug of fs.readdirSync(dir)) { if (fs.existsSync(path.join(dir, slug, 'index.html')) && /^[a-z0-9-]+$/.test(slug)) jobs.push([k, slug]); }
  }
  const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2, locale: 'hi-IN' });
  fs.mkdirSync(path.join(DIST, 'og'), { recursive: true });
  let ok = 0;
  for (const [k, slug] of jobs.slice(0, LIMIT)) {
    const page = await ctx.newPage();
    try {
      await page.goto('http://localhost:8799/studio/view/?t=' + (k === 'web' ? 'w' : k === 'inv' ? 'i' : 'v') + '&s=' + slug + '&nt=1', { waitUntil: 'networkidle', timeout: 25000 });
      await page.waitForFunction(() => { const b = document.getElementById('sheet'); return b && b.children.length > 0 && !/उपलब्ध नहीं|नहीं खुल|चालू नहीं/.test(b.innerText); }, { timeout: 15000 });
      await page.waitForTimeout(1200);
      await page.evaluate(() => { document.querySelectorAll('*').forEach((e) => { const s = getComputedStyle(e); if (s.position === 'fixed') e.style.display = 'none'; }); window.scrollTo(0, 0); });
      if (k === 'inv') { // invitations: a small square preview of the cover
        await page.waitForTimeout(1800);
        const sq = await page.screenshot({ clip: { x: 0, y: 0, width: 408, height: 408 } });
        await sharp(sq).resize(360, 360, { fit: 'cover' }).jpeg({ quality: 80 }).toFile(path.join(DIST, 'og', 'inv-' + slug + '.jpg'));
        const u2 = ORIGIN + '/og/inv-' + slug + '.jpg';
        for (const kk of ['inv', 'i']) { const pf2 = path.join(DIST, kk, slug, 'index.html'); if (!fs.existsSync(pf2)) continue; let h2 = fs.readFileSync(pf2, 'utf8');
          h2 = h2.replace(/(<meta property="og:image" content=")[^"]*(">)/, '$1' + u2 + '$2<meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="360"><meta property="og:image:height" content="360">')
            .replace(/(<meta name="twitter:image" content=")[^"]*(">)/, '$1' + u2 + '$2').replace(/(<meta name="twitter:card" content=")[^"]*(">)/, '$1summary$2'); fs.writeFileSync(pf2, h2); }
        ok++; await page.close(); continue;
      }
      let buf;
      if (k === 'v') { const el = await page.$('#sheet .sr-vc, #sheet .sr'); if (!el) throw new Error('no card'); buf = await el.screenshot(); const mt = await sharp(buf).metadata(); const ch = Math.min(mt.height - 8, 700); buf = await sharp(buf).extract({ left: 6, top: 4, width: mt.width - 12, height: ch }).toBuffer(); }
      else buf = await page.screenshot({ clip: { x: 0, y: 0, width: 408, height: 500 } });
      const card = await sharp(buf).resize({ height: 600, fit: 'inside' }).png().toBuffer(); const m = await sharp(card).metadata();
      const bg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a0a10"/><stop offset="1" stop-color="#d4141c"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>');
      await sharp(bg).composite([{ input: card, left: Math.round((1200 - m.width) / 2), top: Math.round((630 - m.height) / 2) }]).jpeg({ quality: 82 }).toFile(path.join(DIST, 'og', k + '-' + slug + '.jpg'));
      const pf = path.join(DIST, k, slug, 'index.html'); let h = fs.readFileSync(pf, 'utf8'); const u = ORIGIN + '/og/' + k + '-' + slug + '.jpg';
      h = h.replace(/<meta property="og:image:type"[^>]*><meta property="og:image:width"[^>]*><meta property="og:image:height"[^>]*>/, '')
        .replace(/(<meta property="og:image" content=")[^"]*(">)/, '$1' + u + '$2<meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">')
        .replace(/(<meta name="twitter:image" content=")[^"]*(">)/, '$1' + u + '$2').replace(/(<meta name="twitter:card" content=")[^"]*(">)/, '$1summary_large_image$2');
      fs.writeFileSync(pf, h); ok++;
    } catch (e) { console.warn('shot skipped', k, slug, String(e.message).split('\n')[0]); }
    await page.close();
  }
  await browser.close(); server.close(); console.log('card shots:', ok, '/', jobs.length);
})().catch((e) => { console.warn('og shots failed:', e.message); try { server.close(); } catch (x) { } process.exit(0); });
