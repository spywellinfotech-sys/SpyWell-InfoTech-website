export default function Logo({ light = false }) {
  const img = (
    <img src={`${import.meta.env.BASE_URL}logo-full.png`} alt="SpyWell InfoTech" width="180" height="73" className={`h-12 w-auto sm:h-14 ${light ? '[filter:drop-shadow(0_0_1px_#fff)_drop-shadow(0_0_1px_#fff)_drop-shadow(0_0_10px_rgba(255,255,255,.85))]' : ''}`} />
  );
  return img;
}
