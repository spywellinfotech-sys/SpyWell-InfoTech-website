# SpyWell InfoTech Website

Bilingual (English / Hindi) company website for **SpyWell InfoTech**, a software development and IT solutions company in Saharanpur, Uttar Pradesh, India.

**Stack:** React 18, Vite 5, Tailwind CSS 3, React Router 6, Lucide icons. Vercel-ready.

> Status: all source files are written, but the project has **not yet been installed, built or browser-tested**. Run the steps below once and fix anything that appears.

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
cp .env.example .env     # then edit values (Windows: copy .env.example .env)
npm run dev              # http://localhost:5173
npm run build            # production build into dist/
npm run preview          # serve the production build
```

## Folder structure

```
spywell-infotech/
├── index.html                  # base HTML, fonts, default meta tags
├── vercel.json                 # SPA rewrites, cache and security headers
├── tailwind.config.js          # navy / electric blue palette
├── .env.example                # environment variables (copy to .env)
├── scripts/generate-seo.mjs    # builds sitemap.xml + robots.txt from VITE_SITE_URL
├── public/                     # favicon, og-image.png, sitemap.xml, robots.txt
└── src/
    ├── main.jsx, App.jsx       # entry + routes (non-home pages are lazy-loaded)
    ├── index.css
    ├── data/
    │   ├── site.js             # EDIT: email, WhatsApp, location, form endpoint
    │   └── content.js          # EDIT: services, products, portfolio, industries, team, process
    ├── i18n/
    │   ├── ui.js               # EDIT: English + Hindi UI text, SEO titles, legal templates
    │   └── LanguageContext.jsx # language state (saved in localStorage, default English)
    ├── components/             # Navbar, Footer, ContactForm, Cards, Seo, etc.
    └── pages/                  # Home, About, Services, Products, Portfolio, Industries, Contact, Legal, NotFound
```

## Editing content

| What | File |
| --- | --- |
| Email, WhatsApp number, location | `src/data/site.js` |
| Services, products, portfolio, industries, team, values | `src/data/content.js` (every text has `en` and `hi`) |
| Navigation, buttons, forms, validation messages, SEO titles, legal text | `src/i18n/ui.js` |
| Colours | `tailwind.config.js` |

- **Products:** edit the cards in `content.js`. Status `development` shows "Under development". Use `live` only for released products. Put screenshots in `public/images/` (use `.webp`) and set `image: '/images/name.webp'`.
- **Portfolio:** all cards are labelled **DEMO**. Change `status` to `verified` only for real, verified projects you have permission to show.
- **Team / Founder:** placeholders only. Add real, accurate details yourself.
- **New icons:** import them in `src/components/Icon.jsx` first.

## Contact form

The form validates in English and Hindi. It **does not claim delivery** unless a form service is configured:

- With no `VITE_FORM_ENDPOINT`: after validation it shows a notice that the request was *not* sent and offers "Send via WhatsApp" / "Send via Email" buttons with the details prefilled.
- With `VITE_FORM_ENDPOINT` set (for example a [Formspree](https://formspree.io) form URL, free tier available): it POSTs JSON and shows success or error based on the real response.

The endpoint is a public URL, not a secret. Do **not** put API keys in any `VITE_` variable: they are bundled into the public site. If you later need secret keys, use a Vercel serverless function in an `api/` folder.

## SEO

- Per-page title, description, canonical and Open Graph tags (`src/components/Seo.jsx`, text in `ui.js`).
- `sitemap.xml` and `robots.txt` are regenerated on every build from `VITE_SITE_URL`.
- Because pages are rendered in the browser, the per-page tags are set by JavaScript. Google handles this, but some social previews (WhatsApp, Facebook) read only the static tags in `index.html`. If rich link previews matter, add prerendering later.
- `public/og-image.png` is a simple generated placeholder. Replace it with a designed 1200x630 image.

## Deploy to GitHub and Vercel

```bash
git init
git add .
git commit -m "Initial SpyWell InfoTech website"
git branch -M main
git remote add origin https://github.com/<your-username>/spywell-infotech.git
git push -u origin main
```

1. Create an empty repository on GitHub (private or public) first.
2. In Vercel: **Add New → Project → Import** the GitHub repository. Framework preset: **Vite** (build `npm run build`, output `dist`).
3. Add Environment Variables: `VITE_SITE_URL` and (optional) `VITE_FORM_ENDPOINT`.
4. Deploy. Without a domain, Vercel gives a free `*.vercel.app` address. Set `VITE_SITE_URL` to that address until you buy a domain, then update it and redeploy.
5. Submit `https://<your-site>/sitemap.xml` in Google Search Console.

## Still needs your input

- [ ] Real domain, then set `VITE_SITE_URL`
- [ ] Form service endpoint (`VITE_FORM_ENDPOINT`) or another delivery method
- [ ] Founder name, role details and photo (placeholders now)
- [ ] Real team members, if any
- [ ] Real products with descriptions and screenshots
- [ ] Verified portfolio projects (current cards are demos)
- [ ] Designed Open Graph image
- [ ] Legal review of Privacy Policy and Terms (they are templates, not legal advice)
- [ ] Company registration details (none are shown; add only if you want them displayed)
- [ ] GitHub repository and Vercel project (need your accounts)

## Accessibility notes

Skip link, semantic landmarks, labelled form fields with inline errors, visible focus rings, keyboard-operable menu (Escape closes it), reduced-motion support, and `lang` attribute that follows the selected language.
