// Builds dist/404.html: the React app plus a redirect for Studio public links (/i/<slug>, /v/<slug>).
const fs = require('fs');
const h = fs.readFileSync('dist/index.html', 'utf8');
const s = "<script>(function(){var m=location.pathname.toLowerCase().match(/^\\/(i|inv|v|web)\\/([a-z0-9-]+)\\/?$/);if(m)location.replace('/studio/view/?t='+(m[1]==='inv'?'i':m[1]==='web'?'w':m[1])+'&s='+m[2])})()</script>";
if (!/<head[^>]*>/.test(h)) throw new Error('no <head> in dist/index.html');
fs.writeFileSync('dist/404.html', h.replace(/<head[^>]*>/, (x) => x + s));
