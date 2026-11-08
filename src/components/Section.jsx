import Reveal from './Reveal';

export function Section({ children, className = '', dark = false, id }) {
  return (
    <section
      id={id}
      className={`py-16 sm:py-20 ${dark ? 'bg-navy-50' : ''} ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({ title, subtitle, dark = false, center = false }) {
  return (
    <Reveal className={`mb-10 max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      <h2 className={`font-display text-3xl font-bold tracking-tight sm:text-4xl text-navy-800`}>
        {title}
      </h2>
      {subtitle && <p className={`mt-3 text-base sm:text-lg text-slate-600`}>{subtitle}</p>}
    </Reveal>
  );
}

export function PageHero({ title, subtitle }) {
  return (
    <div className="border-b-4 border-electric-500 bg-navy-50 text-navy-800">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-navy-500">{subtitle}</p>}
      </div>
    </div>
  );
}

const badgeStyles = {
  demo: 'bg-amber-100 text-amber-800 ring-amber-300',
  development: 'bg-electric-500/10 text-electric-600 ring-electric-500/30',
  planned: 'bg-slate-100 text-slate-700 ring-slate-300',
  live: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  verified: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
};

export function StatusBadge({ status, label }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset ${badgeStyles[status] || badgeStyles.planned}`}>
      {label}
    </span>
  );
}
