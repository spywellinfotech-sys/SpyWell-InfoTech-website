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


const cube = (x, y, top, left, right) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 18L30 0l30 18-30 18z" fill={top} /><path d="M0 18l30 18v32L0 50z" fill={left} /><path d="M60 18L30 36v32l30-18z" fill={right} />
  </g>
);

const more = {
  grocery: (
    <>
      <rect x="92" y="14" width="76" height="152" rx="14" fill={W} />
      <rect x="98" y="26" width="64" height="128" rx="6" fill="#F3F6FB" />
      <rect x="104" y="32" width="52" height="12" rx="6" fill={C} />
      {[0, 1].flatMap((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={104 + c * 28} y={52 + r * 34} width="24" height="30" rx="6" fill={[Y, R, C, '#D5DDEA'][r * 2 + c]} />))}
      <rect x="104" y="124" width="52" height="20" rx="10" fill="#26101C" />
      <g transform="translate(18 78)">
        <path d="M30 0c-12 4-20 18-20 30" fill="none" stroke={W} strokeWidth="5" strokeLinecap="round" /><path d="M30 0c12 4 20 18 20 30" fill="none" stroke={W} strokeWidth="5" strokeLinecap="round" />
        <path d="M0 30h60l-8 44H8z" fill={W} />
        <rect x="14" y="40" width="5" height="26" rx="2.5" fill="#D5DDEA" /><rect x="28" y="40" width="5" height="26" rx="2.5" fill="#D5DDEA" /><rect x="42" y="40" width="5" height="26" rx="2.5" fill="#D5DDEA" />
        <circle cx="18" cy="22" r="11" fill={R} /><circle cx="42" cy="20" r="9" fill={Y} />
      </g>
      <g transform="translate(168 112)"><rect width="56" height="30" rx="15" fill={Y} /><text x="28" y="20" textAnchor="middle" fontFamily="Arial" fontWeight="700" fontSize="13" fill="#26101C">30 min</text></g>
    </>
  ),
  education: (
    <>
      <path d="M120 100c-22-12-52-12-78-4v50c26-8 56-8 78 4z" fill={W} /><path d="M120 100c22-12 52-12 78-4v50c-26-8-56-8-78 4z" fill="#E3E9F3" />
      {[0, 1, 2].map((n) => <g key={n}><rect x={54} y={108 + n * 10} width="50" height="4" rx="2" fill="#B8C3D6" /><rect x={136} y={108 + n * 10} width="50" height="4" rx="2" fill="#B8C3D6" /></g>)}
      <path d="M120 22l66 26-66 26-66-26z" fill="#26101C" /><path d="M86 62v22c0 8 15 14 34 14s34-6 34-14V62l-34 12z" fill="#3a1a29" />
      <path d="M186 48v34" stroke={Y} strokeWidth="4" strokeLinecap="round" /><circle cx="186" cy="86" r="6" fill={Y} />
      <g transform="translate(18 38)"><circle cx="22" cy="22" r="22" fill={Y} /><text x="22" y="29" textAnchor="middle" fontFamily="Arial" fontWeight="800" fontSize="19" fill="#26101C">A+</text></g>
      <path d="M200 118l10-10 8 8-10 10-12 4z" fill={C} />
    </>
  ),
  business: (
    <>
      <rect x="26" y="24" width="188" height="132" rx="12" fill={W} />
      {[0, 1, 2].map((n) => <rect key={n} x={40 + n * 60} y="38" width="52" height="30" rx="8" fill={['#FDE7EA', '#DDF5F7', '#FFF1CC'][n]} />)}
      <rect x="48" y="46" width="22" height="5" rx="2.5" fill="#B8C3D6" /><rect x="48" y="56" width="34" height="7" rx="3" fill={R} />
      <rect x="108" y="46" width="22" height="5" rx="2.5" fill="#B8C3D6" /><rect x="108" y="56" width="34" height="7" rx="3" fill={C} />
      <rect x="168" y="46" width="22" height="5" rx="2.5" fill="#B8C3D6" /><rect x="168" y="56" width="34" height="7" rx="3" fill={Y} />
      {[0, 1, 2, 3, 4].map((n) => <rect key={n} x={44} y={82 + n * 14} width={[90, 70, 100, 60, 80][n]} height="7" rx="3.5" fill="#E3E9F3" />)}
      <circle cx="172" cy="118" r="26" fill="#F3F6FB" /><path d="M172 118V92a26 26 0 0 1 24 16z" fill={R} /><path d="M172 118l24-10a26 26 0 0 1-10 26z" fill={Y} /><path d="M172 118l14 16a26 26 0 0 1-38-6z" fill={C} />
    </>
  ),
  healthcare: (
    <>
      <rect x="30" y="40" width="180" height="100" rx="14" fill={W} />
      <path d="M44 100h30l10-26 14 50 14-40 8 16h72" fill="none" stroke={R} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(150 12)"><rect width="52" height="52" rx="14" fill={R} /><path d="M26 14v24M14 26h24" stroke={W} strokeWidth="9" strokeLinecap="round" /></g>
      <g transform="translate(24 120)"><rect width="64" height="38" rx="10" fill={C} /><rect x="10" y="10" width="44" height="6" rx="3" fill={W} /><rect x="10" y="22" width="28" height="6" rx="3" fill={W} opacity=".7" /></g>
      <g transform="translate(168 118)"><circle cx="22" cy="22" r="22" fill={Y} /><path d="M22 33s-12-7-12-15a6.5 6.5 0 0 1 12-3 6.5 6.5 0 0 1 12 3c0 8-12 15-12 15z" fill="#26101C" /></g>
    </>
  ),
  transport: (
    <>
      <path d="M0 150h240" stroke={W} strokeWidth="4" opacity=".35" /><path d="M10 164h30M60 164h30M110 164h30M160 164h30M210 164h24" stroke={W} strokeWidth="4" strokeLinecap="round" opacity=".6" />
      <rect x="28" y="70" width="118" height="68" rx="8" fill={W} /><rect x="40" y="82" width="94" height="8" rx="4" fill={R} /><rect x="40" y="98" width="60" height="8" rx="4" fill="#D5DDEA" />
      <path d="M150 88h32l22 26v24h-54z" fill={Y} /><path d="M160 96h18l14 18h-32z" fill="#DDF5F7" />
      <circle cx="62" cy="140" r="15" fill="#26101C" /><circle cx="62" cy="140" r="6" fill={W} /><circle cx="176" cy="140" r="15" fill="#26101C" /><circle cx="176" cy="140" r="6" fill={W} />
      <g transform="translate(92 8)"><path d="M28 0a28 28 0 0 1 28 28c0 22-28 44-28 44S0 50 0 28A28 28 0 0 1 28 0z" fill={R} /><circle cx="28" cy="28" r="10" fill={W} /></g>
    </>
  ),
  'product-1': (
    <>
      {cube(90, 20, W, '#D5DDEA', '#B8C3D6')}
      {cube(36, 78, Y, '#E0A91F', '#C7931A')}
      {cube(144, 78, C, '#1D9BA6', '#168089')}
    </>
  ),
  'product-3': (
    <>
      {[0, 1, 2].map((n) => <path key={n} d="M30 0l90 38-90 38L-60 38z" transform={`translate(90 ${28 + n * 32})`} fill={[R, Y, C][n]} stroke={W} strokeWidth="4" strokeLinejoin="round" />)}
    </>
  ),
};
Object.assign(art, more);
art['product-2'] = art['web-application-development'];


Object.assign(art, {
  'cctv-promate': (
    <>
      <rect x="40" y="28" width="150" height="46" rx="14" fill={W} />
      <circle cx="152" cy="51" r="17" fill="#26101C" /><circle cx="152" cy="51" r="9" fill={C} /><circle cx="148" cy="47" r="3" fill={W} />
      <rect x="54" y="43" width="52" height="8" rx="4" fill="#D5DDEA" /><rect x="54" y="57" width="34" height="6" rx="3" fill="#E3E9F3" />
      <path d="M115 74v22l-30 14" fill="none" stroke={W} strokeWidth="6" strokeLinecap="round" />
      <rect x="150" y="96" width="62" height="76" rx="10" fill={W} />
      <rect x="158" y="106" width="46" height="10" rx="4" fill={R} />
      {[0, 1, 2].map((n) => <rect key={n} x="158" y={124 + n * 14} width={[46, 36, 40][n]} height="6" rx="3" fill="#D5DDEA" />)}
      <g transform="translate(24 104)"><rect width="84" height="56" rx="10" fill="#26101C" /><rect x="8" y="8" width="68" height="40" rx="6" fill="#3a1a29" /><circle cx="22" cy="22" r="5" fill={R} /><path d="M12 44l18-14 14 8 14-12 14 10v8H12z" fill={C} opacity=".8" /></g>
    </>
  ),
  'promate-tech': (
    <>
      <rect x="82" y="14" width="76" height="152" rx="14" fill={W} />
      <rect x="88" y="26" width="64" height="128" rx="6" fill="#F3F6FB" />
      <rect x="94" y="32" width="52" height="12" rx="6" fill={R} />
      {[0, 1, 2, 3].map((n) => <g key={n}><rect x="94" y={52 + n * 20} width="12" height="12" rx="3" fill={n < 3 ? C : '#D5DDEA'} />{n < 3 && <path d={`M97 ${58 + n * 20}l2 2 4-4`} fill="none" stroke={W} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}<rect x="112" y={55 + n * 20} width="34" height="6" rx="3" fill="#D5DDEA" /></g>)}
      <g transform="translate(16 46)"><circle cx="24" cy="24" r="24" fill={Y} /><path d="M24 12a8 8 0 0 0-8 8c0 7 8 16 8 16s8-9 8-16a8 8 0 0 0-8-8z" fill="#26101C" /><circle cx="24" cy="20" r="3" fill={Y} /></g>
      <g transform="translate(170 100)"><rect width="56" height="40" rx="10" fill={C} /><path d="M10 28c6-14 12 4 18-8s12 4 18-4" fill="none" stroke={W} strokeWidth="4" strokeLinecap="round" /></g>
    </>
  ),
  propdeal: (
    <>
      <rect x="36" y="70" width="84" height="92" rx="6" fill={W} /><rect x="120" y="42" width="84" height="120" rx="6" fill="#E3E9F3" />
      {[0, 1, 2].flatMap((r) => [0, 1].map((c) => <rect key={`a${r}${c}`} x={48 + c * 36} y={82 + r * 26} width="22" height="16" rx="3" fill={r === 1 && c === 0 ? Y : C} />))}
      {[0, 1, 2, 3].flatMap((r) => [0, 1].map((c) => <rect key={`b${r}${c}`} x={132 + c * 36} y={54 + r * 26} width="22" height="16" rx="3" fill="#B8C3D6" />))}
      <rect x="64" y="132" width="28" height="30" rx="4" fill={R} />
      <g transform="translate(164 8)"><path d="M0 0h50a8 8 0 0 1 8 8v24a8 8 0 0 1-8 8H18l-12 10V40a6 6 0 0 1-6-6z" fill={Y} /><text x="29" y="26" textAnchor="middle" fontFamily="Arial" fontWeight="700" fontSize="13" fill="#26101C">SOLD</text></g>
      <path d="M20 164h200" stroke={W} strokeWidth="4" strokeLinecap="round" opacity=".6" />
    </>
  ),
});

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
