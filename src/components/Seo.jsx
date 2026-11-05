import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';
import { SITE } from '../data/site';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

// Sets title, description, canonical and Open Graph tags per page and language.
export default function Seo({ page }) {
  const { t, lang } = useLang();
  const { pathname } = useLocation();

  const title = t(`seo.${page}.title`);
  const description = t(`seo.${page}.description`);

  useEffect(() => {
    document.title = title;
    const url = `${SITE.url}${pathname === '/' ? '' : pathname}`;
    const image = `${SITE.url}/og-image.png`;

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:site_name', SITE.name);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:locale', lang === 'hi' ? 'hi_IN' : 'en_IN');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }, [title, description, pathname, lang]);

  return null;
}
