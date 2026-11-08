// Hand-drawn SVG illustrations for the hero slideshow, one per service slug.
// Palette: white on the slide gradient, with yellow and cyan accents from the logo family.
const W = '#fff';
const Y = '#FFC83D';
const C = '#2AC4D0';
const R = '#E4172B';

const Dots = () => (
  <>
    <circle cx="22" cy="34" r="3" fill={W} opacity=".5" />
    <circle cx="214" cy="24" r="4" fill={Y} />
    <circle cx="226" cy="150" r="3" fill={W} opacity=".5" />
    <circle cx="16" cy="140" r="5" fill={C} opacity=".9" />
    <path d="M200 60l5 5m0-5l-5 5" stroke={W} strokeWidth="2" strokeLinecap="round" opacity=".6" />
  </>
);

const art = {
  'android-app-development': (
    <>
      <rect x="82" y="14" width="76" height="152" rx="14" fill={W} />
      <rect x="88" y="26" width="64" height="128" rx="6" fill="#F3F6FB" />
      <rect x="94" y="32" width="52" height="14" rx="4" fill={R} />
      <rect x="94" y="52" width="24" height="24" rx="6" fill={C} />
      <rect x="122" y="52" width="24" height="24" rx="6" fill={Y} />
      <rect x="94" y="82" width="52" height="10" rx="3" fill="#D5DDEA" />
      <rect x="94" y="98" width="38" height="10" rx="3" fill="#D5DDEA" />
      <rect x="94" y="116" width="52" height="26" rx="6" fill="#E3E9F3" />
      <circle cx="120" cy="20" r="2" fill="#B8C3D6" />
      <g transform="translate(26 60)"><circle r="20" cx="20" cy="20" fill={Y} /><path d="M11 21l7 7 12-14" fill="none" stroke="#26101C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g>
      <g transform="translate(176 96)"><rect width="42" height="34" rx="10" fill={C} /><path d="M21 9a8 8 0 0 0-8 8v6l-3 3h22l-3-3v-6a8 8 0 0 0-8-8z" fill={W} /></g>
    </>
  ),
  'ios-app-development': (
    <>
      <rect x="80" y="12" width="80" height="156" rx="20" fill={W} />
      <rect x="86" y="18" width="68" height="144" rx="15" fill="#26101C" />
      <rect x="108" y="23" width="24" height="7" rx="3.5" fill="#000" />
      {[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => (
        <rect key={`${r}${c}`} x={94 + c * 20} y={44 + r * 22} width="16" height="16" rx="5" fill={[R, C, Y, W, R, C, Y, W, R][r * 3 + c]} opacity={r * 3 + c === 4 ? 1 : 0.9} />
      )))}
      <rect x="94" y="132" width="52" height="20" rx="8" fill={W} opacity=".25" />
      <g transform="translate(28 40)"><rect width="38" height="38" rx="11" fill={Y} /><path d="M19 9l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#26101C" /></g>
      <g transform="translate(176 110)"><circle cx="20" cy="20" r="20" fill={C} /><path d="M12 22l6 6 11-12" fill="none" stroke={W} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g>
    </>
  ),
  'website-development': (
    <>
      <rect x="24" y="28" width="192" height="124" rx="12" fill={W} />
      <path d="M24 40a12 12 0 0 1 12-12h168a12 12 0 0 1 12 12v8H24z" fill="#E3E9F3" />
      <circle cx="38" cy="38" r="3.5" fill={R} /><circle cx="50" cy="38" r="3.5" fill={Y} /><circle cx="62" cy="38" r="3.5" fill={C} />
      <rect x="80" y="33" width="110" height="10" rx="5" fill="#fff" />
      <rect x="36" y="58" width="168" height="40" rx="8" fill={R} />
      <rect x="46" y="68" width="80" height="8" rx="4" fill={W} />
      <rect x="46" y="82" width="52" height="8" rx="4" fill={W} opacity=".6" />
      <rect x="150" y="66" width="44" height="24" rx="12" fill={Y} />
      {[0, 1, 2].map((n) => <rect key={n} x={36 + n * 58} y="106" width="52" height="34" rx="7" fill="#E3E9F3" />)}
      <path d="M170 112l0 26 7-6 5 12 6-3-5-11 9-1z" fill="#26101C" stroke={W} strokeWidth="2" strokeLinejoin="round" />
    </>
  ),
  'web-application-development': (
    <>
      <rect x="20" y="24" width="200" height="132" rx="12" fill={W} />
      <rect x="20" y="24" width="48" height="132" rx="12" fill="#26101C" />
      {[0, 1, 2, 3].map((n) => <rect key={n} x="30" y={40 + n * 22} width="28" height="8" rx="4" fill={n === 0 ? R : W} opacity={n === 0 ? 1 : 0.5} />)}
      <rect x="80" y="36" width="60" height="30" rx="7" fill="#F3F6FB" /><rect x="148" y="36" width="60" height="30" rx="7" fill="#F3F6FB" />
      <rect x="88" y="44" width="26" height="6" rx="3" fill="#B8C3D6" /><rect x="88" y="54" width="40" height="8" rx="3" fill={R} />
      <rect x="156" y="44" width="26" height="6" rx="3" fill="#B8C3D6" /><rect x="156" y="54" width="40" height="8" rx="3" fill={C} />
      <rect x="80" y="74" width="128" height="72" rx="8" fill="#F3F6FB" />
      {[0, 1, 2, 3, 4, 5].map((n) => <rect key={n} x={92 + n * 19} y={138 - [20, 34, 26, 44, 36, 54][n]} width="11" height={[20, 34, 26, 44, 36, 54][n]} rx="3" fill={n % 2 ? C : R} />)}
      <path d="M90 108l22-16 20 10 28-26 36 6" fill="none" stroke={Y} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'custom-business-software': (
    <>
      <rect x="30" y="20" width="108" height="140" rx="10" fill={W} />
      <rect x="42" y="34" width="50" height="9" rx="4.5" fill={R} />
      {[0, 1, 2, 3].map((n) => (
        <g key={n}><rect x="42" y={56 + n * 20} width="60" height="7" rx="3.5" fill="#D5DDEA" /><rect x="110" y={56 + n * 20} width="18" height="7" rx="3.5" fill={n === 3 ? Y : C} /></g>
      ))}
      <rect x="42" y="138" width="86" height="12" rx="6" fill="#26101C" />
      <g transform="translate(150 28)"><circle cx="34" cy="34" r="34" fill={W} /><path d="M34 34V0a34 34 0 0 1 32 24z" fill={R} /><path d="M34 34l32-10a34 34 0 0 1-8 40z" fill={Y} /><path d="M34 34l24 30a34 34 0 0 1-48-6z" fill={C} /></g>
      <g transform="translate(150 112)"><rect width="68" height="42" rx="10" fill={Y} /><text x="34" y="29" textAnchor="middle" fontFamily="Arial" fontWeight="700" fontSize="22" fill="#26101C">₹</text></g>
    </>
  ),
  'erp-and-crm': (
    <>
      {[[44, 40], [196, 40], [30, 120], [210, 124], [120, 160]].map(([x, y], n) => <line key={n} x1="120" y1="88" x2={x} y2={y} stroke={W} strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" opacity=".7" />)}
      <circle cx="120" cy="88" r="34" fill={W} /><circle cx="120" cy="88" r="22" fill={R} />
      <path d="M110 88h20m-10-10v20" stroke={W} strokeWidth="5" strokeLinecap="round" />
      {[[44, 40, C], [196, 40, Y], [30, 120, Y], [210, 124, C], [120, 160, R]].map(([x, y, f], n) => (
        <g key={n}><circle cx={x} cy={y} r="18" fill={W} /><circle cx={x} cy={y} r="10" fill={f} /></g>
      ))}
    </>
  ),
};

export default function SlideArt({ slug }) {
  const body = art[slug];
  if (!body) return null;
  return (
    <svg viewBox="0 0 240 180" className="h-full w-full" role="presentation" aria-hidden="true">
      <Dots />
      {body}
    </svg>
  );
}
export const hasArt = (slug) => Boolean(art[slug]);
