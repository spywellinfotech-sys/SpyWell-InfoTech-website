# LiveCard Corporate: company subdomains (abc.livecard.in)

GitHub Pages cannot serve `*.livecard.in` by itself, so a free Cloudflare layer sits in front.

1. Add livecard.in to Cloudflare (free plan). Copy ALL existing DNS records first (website, email/MX, TXT).
2. At the domain registrar, change the nameservers to the two Cloudflare ones.
3. In Cloudflare DNS add: `*` CNAME -> `spywellinfotech-sys.github.io` (Proxied / orange cloud). Keep the existing `@` and `www` records.
4. SSL/TLS mode: Full. Universal SSL already covers `*.livecard.in`.
5. Workers -> Create -> paste `worker.js` -> Deploy. Add route `*.livecard.in/*` to it.
6. Test: `https://<subdomain>.livecard.in/` (company) and `https://<subdomain>.livecard.in/<employee>` (card).

Existing livecard.in and www.livecard.in URLs keep working (the worker passes them straight through).
Until this is done, the same pages work at `livecard.in/c/<subdomain>` and `livecard.in/c/<subdomain>/<employee>`.
