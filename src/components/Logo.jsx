export default function Logo({ light = false, onRed = false }) {
  return (
    <span className="inline-flex items-center gap-2">
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="SpyWell" width="44" height="44" className={`h-11 w-11 rounded-full ${onRed ? 'ring-2 ring-white' : ''}`} />
      <span className={`font-display text-lg font-bold leading-none tracking-tight ${light ? 'text-white' : 'text-navy-800'}`}>
        SpyWell <span className={onRed ? 'font-semibold text-white/85' : 'text-electric-500'}>InfoTech</span>
      </span>
    </span>
  );
}
