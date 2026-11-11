import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';
import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
import HeroSlideshow from '../components/HeroSlideshow';
import Icon from '../components/Icon';
import { Section, SectionHeading } from '../components/Section';
import { ServiceCard, ProductCard, PortfolioCard } from '../components/Cards';
import { useLang } from '../i18n/LanguageContext';
import { whatsappLink } from '../data/site';
import { services, products, portfolio, industries, process, whyUs } from '../data/content';

export default function Home() {
  const { t, tr } = useLang();

  return (
    <>
      <Seo page="home" />

      {/* Hero */}
      <section className="overflow-hidden bg-gradient-to-b from-navy-50 to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-24">
          <div>
            <p className="inline-flex rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-electric-600 ring-1 ring-electric-500/25">
              {t('home.badge')}
            </p>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-navy-800 sm:text-5xl lg:text-6xl">
              {t('home.title')}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-500">{t('home.subtitle')}</p>
            <p className="mt-3 font-display text-lg font-bold text-electric-500">{t('brand.tagline')}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-electric-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-electric-500/30 transition hover:bg-electric-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 focus-visible:ring-offset-2">
                {t('common.consult')} <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a href={whatsappLink(t('contact.waGreeting'))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border-2 border-navy-800 px-7 py-3 font-semibold text-navy-800 transition hover:bg-navy-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-800">
                <MessageCircle size={18} aria-hidden="true" /> {t('common.whatsapp')}
              </a>
            </div>
          </div>
          <HeroSlideshow />
        </div>
      </section>

      {/* Services */}
      <Section className="bg-navy-50/60">
        <SectionHeading title={t('home.servicesTitle')} subtitle={t('home.servicesSub')} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 3) * 80}><ServiceCard service={s} /></Reveal>
          ))}
        </div>
      </Section>

      {/* Why us */}
      <Section>
        <SectionHeading title={t('home.whyTitle')} subtitle={t('home.whySub')} />
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {whyUs.map((w, i) => (
            <Reveal key={w.icon + i} delay={i * 80}>
              <div>
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-electric-500 text-white">
                  <Icon name={w.icon} size={26} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-navy-800">{tr(w.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{tr(w.text)}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Products */}
      <Section className="bg-navy-50/60">
        <SectionHeading title={t('home.productsTitle')} subtitle={t('home.productsSub')} />
        <div className="grid gap-6 md:grid-cols-3">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}><ProductCard product={p} /></Reveal>
          ))}
        </div>
        <div className="mt-8">
          <Link to="/products" className="font-semibold text-electric-600 hover:underline">{t('common.viewAll')} →</Link>
        </div>
      </Section>

      {/* Portfolio */}
      <Section>
        <SectionHeading title={t('home.portfolioTitle')} subtitle={t('home.portfolioSub')} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={i * 80}><PortfolioCard item={p} /></Reveal>
          ))}
        </div>
        <div className="mt-8">
          <Link to="/portfolio" className="font-semibold text-electric-600 hover:underline">{t('common.viewAll')} →</Link>
        </div>
      </Section>

      {/* Industries */}
      <Section dark>
        <SectionHeading dark title={t('home.industriesTitle')} subtitle={t('home.industriesSub')} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((ind, i) => (
            <Reveal key={ind.icon + i} delay={(i % 3) * 80}>
              <div className="flex h-full items-start gap-4 rounded-xl border border-navy-100 bg-white p-5 shadow-sm">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-electric-500/10 text-electric-600">
                  <Icon name={ind.icon} size={22} />
                </span>
                <div>
                  <h3 className="font-display font-semibold text-navy-800">{tr(ind.title)}</h3>
                  <p className="mt-1 text-sm text-slate-600">{tr(ind.text)}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section>
        <SectionHeading title={t('home.processTitle')} subtitle={t('home.processSub')} />
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {process.map((p, i) => (
            <li key={p.icon + i}>
              <Reveal delay={i * 80}>
                <div className="relative h-full rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
                  <span className="absolute -top-3 left-5 rounded-full bg-electric-500 px-3 py-0.5 text-xs font-bold text-white">{i + 1}</span>
                  <span className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-electric-500/10 text-electric-600">
                    <Icon name={p.icon} size={22} />
                  </span>
                  <h3 className="mt-4 font-display font-semibold text-navy-800">{tr(p.title)}</h3>
                  <p className="mt-2 text-sm text-slate-600">{tr(p.text)}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      {/* CTA */}
      <section className="bg-electric-500 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('home.ctaTitle')}</h2>
            <p className="mt-3 max-w-xl text-lg text-white/90">{t('home.ctaText')}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/contact" className="rounded-full bg-white px-7 py-3.5 font-semibold text-electric-600 transition hover:bg-navy-50">
                {t('common.consult')}
              </Link>
              <a href={whatsappLink(t('contact.waGreeting'))} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/60 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
                {t('common.whatsapp')}
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
