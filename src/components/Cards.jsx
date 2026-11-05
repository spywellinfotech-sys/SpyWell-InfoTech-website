import { Link } from 'react-router-dom';
import { ArrowRight, ImageOff } from 'lucide-react';
import Icon from './Icon';
import { StatusBadge } from './Section';
import { useLang } from '../i18n/LanguageContext';

export function ServiceCard({ service }) {
  const { t, tr } = useLang();
  return (
    <Link
      to={`/services#${service.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-navy-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-electric-400 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-500"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-electric-500/10 text-electric-600 transition group-hover:bg-electric-500 group-hover:text-white">
        <Icon name={service.icon} size={24} />
      </span>
      <h3 className="mt-5 font-display text-lg font-semibold text-navy-800">{tr(service.title)}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{tr(service.short)}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-electric-600">
        {t('common.learnMore')} <ArrowRight size={16} aria-hidden="true" className="transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function Shot({ image, alt, label, icon }) {
  if (image) {
    return <img src={image} alt={alt} loading="lazy" decoding="async" width="640" height="400" className="h-44 w-full object-cover" />;
  }
  return (
    <div className="flex h-44 w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-navy-800 to-navy-600 text-navy-200">
      {icon ? <Icon name={icon} size={36} className="text-electric-300" /> : <ImageOff size={32} aria-hidden="true" />}
      <span className="text-xs">{label}</span>
    </div>
  );
}

export function ProductCard({ product }) {
  const { t, tr } = useLang();
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm transition hover:shadow-xl">
      <Shot image={product.image} alt={tr(product.name)} label={t('products.screenshot')} icon={product.icon} />
      <div className="flex flex-1 flex-col p-6">
        <StatusBadge status={product.status} label={t(`common.${product.status}`)} />
        <h3 className="mt-3 font-display text-lg font-semibold text-navy-800">{tr(product.name)}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{tr(product.description)}</p>
        {product.link && (
          <a href={product.link} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-semibold text-electric-600 hover:underline">
            {t('common.visit')}
          </a>
        )}
      </div>
    </article>
  );
}

export function PortfolioCard({ item }) {
  const { t, tr } = useLang();
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm transition hover:shadow-xl">
      <Shot image={item.image} alt={tr(item.title)} label={t('portfolio.screenshot')} icon={item.icon} />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-electric-600">{tr(item.category)}</span>
          <StatusBadge status={item.status} label={item.status === 'demo' ? t('common.demo') : t('common.verified')} />
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold text-navy-800">{tr(item.title)}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{tr(item.description)}</p>
        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-4 text-sm font-semibold text-electric-600 hover:underline">
            {t('common.visit')}
          </a>
        )}
      </div>
    </article>
  );
}
