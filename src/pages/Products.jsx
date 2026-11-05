import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import { PageHero, Section } from '../components/Section';
import { ProductCard } from '../components/Cards';
import { useLang } from '../i18n/LanguageContext';
import { products } from '../data/content';

export default function Products() {
  const { t } = useLang();
  return (
    <>
      <Seo page="products" />
      <PageHero title={t('products.title')} subtitle={t('products.sub')} />
      <Section>
        <p className="mb-8 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{t('products.note')}</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 80}><ProductCard product={p} /></Reveal>
          ))}
        </div>
      </Section>
    </>
  );
}
