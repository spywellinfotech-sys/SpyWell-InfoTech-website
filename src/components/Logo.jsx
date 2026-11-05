export default function Logo({ light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="9" fill="#0a8bff" />
        <path d="M10 22.5c1.4 1.6 3.4 2.5 6 2.5 3.3 0 5.4-1.5 5.4-3.8 0-2.2-1.6-3.1-5-3.9-3.5-.8-5.1-2.1-5.1-4.5 0-2.3 2-4.3 5.5-4.3 2.4 0 4.2.7 5.6 2" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span className={`font-display text-lg font-bold leading-none tracking-tight ${light ? 'text-white' : 'text-navy-800'}`}>
        SpyWell <span className="text-electric-500">InfoTech</span>
      </span>
    </span>
  );
}
