import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageCircle } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { SITE, mailLink, whatsappLink } from '../data/site';
import { services } from '../data/content';
import Logo from './Logo';

export default function Footer() {
  const { t, tr } = useLang();
  const year = new Date().getFullYear();
  const company = [
    ['/about', 'nav.about'], ['/products', 'nav.products'], ['/portfolio', 'nav.portfolio'],
    ['/industries', 'nav.industries'], ['/contact', 'nav.contact'],
  ];

  return (
    <footer className="bg-navy-950 text-navy-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo light />
          <p className="mt-4 text-sm font-medium text-electric-300">{t('brand.tagline')}</p>
          <p className="mt-3 text-sm leading-relaxed">{t('footer.about')}</p>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-white">{t('footer.company')}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {company.map(([to, key]) => (
              <li key={to}><Link className="hover:text-white" to={to}>{t(key)}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-white">{t('footer.services')}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {services.slice(0, 6).map((s) => (
              <li key={s.slug}><Link className="hover:text-white" to={`/services#${s.slug}`}>{tr(s.title)}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-white">{t('footer.contact')}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-electric-400" aria-hidden="true" />
              <a className="break-all hover:text-white" href={mailLink()}>{SITE.email}</a>
            </li>
            <li className="flex items-start gap-2">
              <MessageCircle size={16} className="mt-0.5 shrink-0 text-electric-400" aria-hidden="true" />
              <a className="hover:text-white" href={whatsappLink()} target="_blank" rel="noopener noreferrer">{SITE.whatsappDisplay}</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-electric-400" aria-hidden="true" />
              <span>{tr(SITE.location)}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs sm:flex-row sm:px-6 lg:px-8">
          <p>© {year} {SITE.name}. {t('footer.rights')}</p>
          <p className="flex gap-4">
            <Link className="hover:text-white" to="/privacy">{t('footer.privacy')}</Link>
            <Link className="hover:text-white" to="/terms">{t('footer.terms')}</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
