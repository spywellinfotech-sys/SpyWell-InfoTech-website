export default function Logo({ light = false }) {
  const img = (
    <img src={`${import.meta.env.BASE_URL}logo-full.png`} alt="SpyWell InfoTech" width="180" height="73" className="h-12 w-auto sm:h-14" />
  );
  return light ? <span className="inline-block rounded-xl bg-white px-3 py-2">{img}</span> : img;
}
