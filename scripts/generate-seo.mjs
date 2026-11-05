// Generates public/sitemap.xml and public/robots.txt using your real domain.
// Set VITE_SITE_URL in .env (local) or in Vercel Environment Variables (production).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

function envFromFile() {
  if (!existsSync('.env')) return {};
  return Object.fromEntries(
    readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      })
  );
}

const site = (process.env.VITE_SITE_URL || envFromFile().VITE_SITE_URL || 'https://your-domain.example').replace(/\/$/, '');
const paths = ['/', '/about', '/services', '/products', '/portfolio', '/industries', '/contact', '/privacy', '/terms'];
const today = new Date().toISOString().slice(0, 10);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map((p) => `  <url>\n    <loc>${site}${p === '/' ? '' : p}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${p === '/' ? '1.0' : '0.7'}</priority>\n  </url>`)
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${site}/sitemap.xml
`;

writeFileSync('public/sitemap.xml', sitemap);
writeFileSync('public/robots.txt', robots);
console.log(`SEO files generated for ${site}`);
if (site.includes('your-domain.example')) {
  console.warn('WARNING: VITE_SITE_URL is not set. sitemap/robots/canonical use a placeholder domain.');
}
