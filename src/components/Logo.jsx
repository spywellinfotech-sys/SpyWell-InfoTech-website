export default function Logo({ light = false }) {
  return (
    <span className="inline-flex items-center gap-2">
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="SpyWell" width="44" height="44" className="h-11 w-11 rounded-full" />
      <span className={`font-display text-lg font-bold leading-none tracking-tight ${light ? 'text-white' : 'text-navy-800'}`}>
        SpyWell <span className="text-electric-500">InfoTech</span>
      </span>
    </span>
  );
}
