// ============================================================
// EDIT HERE: core company settings used across the whole site.
// ============================================================
export const SITE = {
  name: 'SpyWell InfoTech',
  email: 'info@spywell.in',
  whatsapp: '919837900303', // digits only, used for wa.me links
  whatsappDisplay: '+919837900303',
  location: {
    en: 'Near Ram Mandir, Meerpur Gandevar, Saharanpur, Uttar Pradesh 247121, India',
    hi: 'राम मंदिर के पास, मीरपुर गंडेवर, सहारनपुर, उत्तर प्रदेश 247121, भारत',
  },
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=' + '30.204429,77.601002',
  // Set VITE_SITE_URL in .env (or Vercel) once you have a domain.
  url: (import.meta.env.VITE_SITE_URL || 'https://your-domain.example').replace(/\/$/, ''),
  // Optional form service endpoint (e.g. Formspree). Leave empty until configured.
  formEndpoint: import.meta.env.VITE_FORM_ENDPOINT || 'https://formsubmit.co/ajax/b52cf02d0e3bc6c11ccc828e9505b717',
  // Add real links here when they exist, e.g. { label: 'LinkedIn', href: 'https://...' }
  social: [],
};

export const whatsappLink = (text = '') =>
  `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const mailLink = (subject = '') =>
  `mailto:${SITE.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

// Set to true once the apps are on Google Play, and put each Play Store link in portfolio[].download.
export const APPS_LAUNCHED = false;
