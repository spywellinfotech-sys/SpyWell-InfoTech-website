import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle } from 'lucide-react';
import Seo from '../components/Seo';
import Reveal from '../components/Reveal';
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
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 animate-floaty rounded-full bg-electric-500/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 animate-floaty rounded-full bg-electric-400/20 blur-3xl [animation-delay:2s]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '44px 44px' }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <p className="inline-flex animate-fade-up items-center rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-electric-300">
            {t('home.badge')}
          </p>
          <h1 className="mt-6 max-w-4xl animate-fade-up font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {t('home.title')}
          </h1>
          <p className="mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-navy-200">{t('home.subtitle')}</p>
          <p className="mt-3 animate-fade-up font-medium text-electric-300">{t('brand.tagline')}</p>
          <div className="mt-9 flex animate-fade-up flex-wrap gap-4">
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-electric-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-electric-500/30 transition hover:bg-electric-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900">
              {t('common.consult')} <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a href={whatsappLink(t('contact.waGreeting'))} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <MessageCircle size={18} aria-hidden="true" /> {t('common.whatsapp')}
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <Section className="bg-slate-50">
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
              <div className="text-center">
                <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-electric-300">
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
      <Section className="bg-slate-50">
        <SectionHeading title={t('home.productsTitle')} subtitle={t('home.productsSub')} />
        <div className="grid gap-6 md:grid-cols-3">
          {products.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}><ProductCard product={p} /></Reveal>
          ))}
        </div>
        <div className="mt-8 text-center">
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
        <div className="mt-8 text-center">
          <Link to="/portfolio" className="font-semibold text-electric-600 hover:underline">{t('common.viewAll')} →</Link>
        </div>
      </Section>

      {/* Industries */}
      <Section dark>
        <SectionHeading dark title={t('home.industriesTitle')} subtitle={t('home.industriesSub')} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((ind, i) => (
            <Reveal key={ind.icon + i} delay={(i % 3) * 80}>
              <div className="flex h-full items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-electric-500/20 text-electric-300">
                  <Icon name={ind.icon} size={22} />
                </span>
                <div>
                  <h3 className="font-display font-semibold">{tr(ind.title)}</h3>
                  <p className="mt-1 text-sm text-navy-200">{tr(ind.text)}</p>
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
      <section className="bg-gradient-to-r from-navy-800 to-electric-600 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{t('home.ctaTitle')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-lg text-white/85">{t('home.ctaText')}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/contact" className="rounded-full bg-white px-7 py-3.5 font-semibold text-navy-800 transition hover:bg-navy-50">
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
