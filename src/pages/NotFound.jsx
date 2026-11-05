import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useLang } from '../i18n/LanguageContext';

export default function NotFound() {
  const { t } = useLang();
  return (
    <>
      <Seo page="notFound" />
      <section className="mx-auto flex max-w-2xl flex-col items-center px-4 py-28 text-center">
        <p className="font-display text-7xl font-extrabold text-electric-500">404</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-navy-800">{t('notFound.title')}</h1>
        <p className="mt-3 text-slate-600">{t('notFound.text')}</p>
        <Link to="/" className="mt-8 rounded-full bg-navy-800 px-7 py-3 font-semibold text-white transition hover:bg-electric-600">
          {t('common.backHome')}
        </Link>
      </section>
    </>
  );
}
