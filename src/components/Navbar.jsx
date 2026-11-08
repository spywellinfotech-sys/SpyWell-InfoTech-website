import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from './Logo';

const links = [
  ['/', 'nav.home'],
  ['/about', 'nav.about'],
  ['/services', 'nav.services'],
  ['/products', 'nav.products'],
  ['/portfolio', 'nav.portfolio'],
  ['/industries', 'nav.industries'],
  ['/contact', 'nav.contact'],
];

export default function Navbar() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const linkClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
      isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <header className={`sticky top-0 z-40 bg-electric-500 text-white transition-shadow ${scrolled ? 'shadow-lg shadow-navy-900/20' : ''}`}>
      <nav aria-label="Main" className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="SpyWell InfoTech" className="rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <Logo light onRed />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map(([to, key]) => (
            <li key={to}>
              <NavLink to={to} end={to === '/'} className={linkClass}>{t(key)}</NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher onRed />
          <Link to="/contact" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-electric-600 shadow-sm transition hover:bg-navy-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-electric-500">
            {t('nav.cta')}
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher onRed />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t('nav.close') : t('nav.menu')}
            className="rounded-md p-2 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <div id="mobile-menu" className={`lg:hidden ${open ? 'block' : 'hidden'} border-t border-white/20 bg-electric-600`}>
        <ul className="mx-auto max-w-7xl space-y-1 px-4 py-3 sm:px-6">
          {links.map(([to, key]) => (
            <li key={to}>
              <NavLink to={to} end={to === '/'} className={({ isActive }) => `block rounded-md px-3 py-3 text-base font-medium ${isActive ? 'bg-white/20 text-white' : 'text-white/90 hover:bg-white/10'}`}>
                {t(key)}
              </NavLink>
            </li>
          ))}
          <li className="pt-2">
            <Link to="/contact" className="block rounded-full bg-white px-5 py-3 text-center font-bold text-electric-600">
              {t('nav.cta')}
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
