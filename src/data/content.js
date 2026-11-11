// ============================================================
// EDIT HERE: services, products, portfolio, industries, team, process.
// Every text field has { en, hi }. Icons are Lucide icon names.
// ============================================================

export const services = [
  {
    slug: 'android-app-development',
    icon: 'Smartphone',
    title: { en: 'Android App Development', hi: 'एंड्रॉइड ऐप डेवलपमेंट' },
    short: {
      en: 'Fast, reliable Android apps for customers, staff and field teams.',
      hi: 'ग्राहकों, स्टाफ और फील्ड टीम के लिए तेज़ और भरोसेमंद एंड्रॉइड ऐप।',
    },
    description: {
      en: 'We design and build native and cross-platform Android apps, from idea and screen design to Play Store release and ongoing updates.',
      hi: 'हम आइडिया और स्क्रीन डिज़ाइन से लेकर प्ले स्टोर रिलीज़ और अपडेट तक, नेटिव और क्रॉस-प्लेटफ़ॉर्म एंड्रॉइड ऐप बनाते हैं।',
    },
    points: {
      en: ['Customer and business apps', 'Login, payments and notifications', 'Offline-friendly design', 'Play Store publishing support'],
      hi: ['ग्राहक और बिज़नेस ऐप', 'लॉगिन, पेमेंट और नोटिफ़िकेशन', 'ऑफ़लाइन-फ्रेंडली डिज़ाइन', 'प्ले स्टोर पब्लिशिंग सहायता'],
    },
  },
  {
    slug: 'ios-app-development',
    icon: 'Apple',
    title: { en: 'iOS App Development', hi: 'आईओएस ऐप डेवलपमेंट' },
    short: {
      en: 'Polished iPhone and iPad apps that follow platform standards.',
      hi: 'प्लेटफ़ॉर्म मानकों के अनुसार बने आईफ़ोन और आईपैड ऐप।',
    },
    description: {
      en: 'We build iOS apps with clean interfaces and dependable performance, and guide you through App Store review and release.',
      hi: 'हम साफ़ इंटरफ़ेस और भरोसेमंद परफ़ॉर्मेंस वाले आईओएस ऐप बनाते हैं और ऐप स्टोर रिव्यू व रिलीज़ में मार्गदर्शन करते हैं।',
    },
    points: {
      en: ['iPhone and iPad support', 'Shared codebase with Android when suitable', 'App Store submission guidance', 'Maintenance and updates'],
      hi: ['आईफ़ोन और आईपैड सपोर्ट', 'उपयुक्त होने पर एंड्रॉइड के साथ साझा कोडबेस', 'ऐप स्टोर सबमिशन मार्गदर्शन', 'मेंटेनेंस और अपडेट'],
    },
  },
  {
    slug: 'website-development',
    icon: 'Globe',
    title: { en: 'Website Development', hi: 'वेबसाइट डेवलपमेंट' },
    short: {
      en: 'Fast, mobile-friendly websites that present your business well.',
      hi: 'तेज़, मोबाइल-फ्रेंडली वेबसाइट जो आपके बिज़नेस को बेहतर ढंग से दिखाएँ।',
    },
    description: {
      en: 'Business websites, landing pages and online catalogues built for speed, clarity and search visibility, with easy content updates.',
      hi: 'स्पीड, स्पष्टता और सर्च विज़िबिलिटी के लिए बनी बिज़नेस वेबसाइट, लैंडिंग पेज और ऑनलाइन कैटलॉग, जिनमें कंटेंट अपडेट आसान हो।',
    },
    points: {
      en: ['Responsive design', 'SEO-ready structure', 'Multilingual options', 'Contact and WhatsApp integration'],
      hi: ['रेस्पॉन्सिव डिज़ाइन', 'एसईओ-रेडी स्ट्रक्चर', 'बहुभाषी विकल्प', 'कॉन्टैक्ट और व्हाट्सऐप इंटीग्रेशन'],
    },
  },
  {
    slug: 'web-application-development',
    icon: 'AppWindow',
    title: { en: 'Web Application Development', hi: 'वेब एप्लिकेशन डेवलपमेंट' },
    short: {
      en: 'Secure web apps with dashboards, logins and workflows.',
      hi: 'डैशबोर्ड, लॉगिन और वर्कफ़्लो वाले सुरक्षित वेब एप्लिकेशन।',
    },
    description: {
      en: 'Browser-based applications with user accounts, roles, dashboards and databases, designed around how your team actually works.',
      hi: 'यूज़र अकाउंट, रोल, डैशबोर्ड और डेटाबेस वाले ब्राउज़र-आधारित एप्लिकेशन, जो आपकी टीम के काम करने के तरीके के अनुसार बनते हैं।',
    },
    points: {
      en: ['User roles and permissions', 'Dashboards and reports', 'API and database design', 'Cloud deployment'],
      hi: ['यूज़र रोल और परमिशन', 'डैशबोर्ड और रिपोर्ट', 'एपीआई और डेटाबेस डिज़ाइन', 'क्लाउड डिप्लॉयमेंट'],
    },
  },
  {
    slug: 'custom-business-software',
    icon: 'Briefcase',
    title: { en: 'Custom Business Software', hi: 'कस्टम बिज़नेस सॉफ़्टवेयर' },
    short: {
      en: 'Software shaped around your process, not the other way round.',
      hi: 'आपकी प्रक्रिया के अनुसार बना सॉफ़्टवेयर, न कि प्रक्रिया को सॉफ़्टवेयर के अनुसार ढालना।',
    },
    description: {
      en: 'When off-the-shelf tools do not fit, we build billing, inventory, scheduling and record-keeping software tailored to your operations.',
      hi: 'जब रेडीमेड टूल फ़िट न हों, तब हम आपके संचालन के अनुसार बिलिंग, इन्वेंटरी, शेड्यूलिंग और रिकॉर्ड-कीपिंग सॉफ़्टवेयर बनाते हैं।',
    },
    points: {
      en: ['Billing and invoicing', 'Inventory and stock', 'Workflow automation', 'Data import and export'],
      hi: ['बिलिंग और इनवॉइसिंग', 'इन्वेंटरी और स्टॉक', 'वर्कफ़्लो ऑटोमेशन', 'डेटा इम्पोर्ट और एक्सपोर्ट'],
    },
  },
  {
    slug: 'erp-and-crm',
    icon: 'Network',
    title: { en: 'ERP and CRM', hi: 'ईआरपी और सीआरएम' },
    short: {
      en: 'Connect sales, operations and customers in one system.',
      hi: 'सेल्स, ऑपरेशन और ग्राहकों को एक ही सिस्टम में जोड़ें।',
    },
    description: {
      en: 'Lightweight ERP and CRM systems that track leads, customers, orders and follow-ups so your team stays organised.',
      hi: 'हल्के ईआरपी और सीआरएम सिस्टम जो लीड, ग्राहक, ऑर्डर और फ़ॉलो-अप ट्रैक करते हैं ताकि आपकी टीम व्यवस्थित रहे।',
    },
    points: {
      en: ['Lead and customer tracking', 'Orders and follow-up reminders', 'Team task management', 'Reports for decisions'],
      hi: ['लीड और ग्राहक ट्रैकिंग', 'ऑर्डर और फ़ॉलो-अप रिमाइंडर', 'टीम टास्क मैनेजमेंट', 'निर्णय के लिए रिपोर्ट'],
    },
  },
  {
    slug: 'school-management-software',
    icon: 'GraduationCap',
    title: { en: 'School Management Software', hi: 'स्कूल मैनेजमेंट सॉफ़्टवेयर' },
    short: {
      en: 'Manage students, fees, attendance and communication in one place.',
      hi: 'छात्र, फ़ीस, उपस्थिति और संवाद एक ही जगह मैनेज करें।',
    },
    description: {
      en: 'Software for schools and coaching institutes covering admissions, attendance, fee records, timetables and parent communication.',
      hi: 'स्कूल और कोचिंग संस्थानों के लिए सॉफ़्टवेयर, जिसमें एडमिशन, उपस्थिति, फ़ीस रिकॉर्ड, टाइमटेबल और अभिभावक संवाद शामिल हैं।',
    },
    points: {
      en: ['Student and staff records', 'Attendance and fee tracking', 'Timetables and notices', 'Parent communication'],
      hi: ['छात्र और स्टाफ रिकॉर्ड', 'उपस्थिति और फ़ीस ट्रैकिंग', 'टाइमटेबल और सूचनाएँ', 'अभिभावक संवाद'],
    },
  },
  {
    slug: 'ai-automation-and-chatbots',
    icon: 'Bot',
    title: { en: 'AI Automation and Chatbots', hi: 'एआई ऑटोमेशन और चैटबॉट' },
    short: {
      en: 'Automate repetitive work and answer customers faster.',
      hi: 'दोहराए जाने वाले काम ऑटोमेट करें और ग्राहकों को तेज़ी से जवाब दें।',
    },
    description: {
      en: 'We build chatbots and automations for support, lead capture, document handling and internal tasks, with a human kept in the loop where it matters.',
      hi: 'हम सपोर्ट, लीड कैप्चर, डॉक्यूमेंट हैंडलिंग और आंतरिक कामों के लिए चैटबॉट और ऑटोमेशन बनाते हैं, जहाँ ज़रूरी हो वहाँ इंसानी निगरानी के साथ।',
    },
    points: {
      en: ['Website and WhatsApp chatbots', 'Lead capture and routing', 'Document and data processing', 'Workflow automation'],
      hi: ['वेबसाइट और व्हाट्सऐप चैटबॉट', 'लीड कैप्चर और रूटिंग', 'डॉक्यूमेंट और डेटा प्रोसेसिंग', 'वर्कफ़्लो ऑटोमेशन'],
    },
  },
  {
    slug: 'saas-product-development',
    icon: 'Cloud',
    title: { en: 'SaaS Product Development', hi: 'सास प्रोडक्ट डेवलपमेंट' },
    short: {
      en: 'Turn your idea into a subscription software product.',
      hi: 'अपने आइडिया को सब्सक्रिप्शन सॉफ़्टवेयर प्रोडक्ट में बदलें।',
    },
    description: {
      en: 'From MVP to launch, we help build multi-user SaaS products with accounts, subscriptions, admin tools and scalable architecture.',
      hi: 'एमवीपी से लॉन्च तक, हम अकाउंट, सब्सक्रिप्शन, एडमिन टूल और स्केलेबल आर्किटेक्चर वाले मल्टी-यूज़र सास प्रोडक्ट बनाने में मदद करते हैं।',
    },
    points: {
      en: ['MVP planning and build', 'Subscriptions and billing', 'Admin panel', 'Scalable architecture'],
      hi: ['एमवीपी प्लानिंग और बिल्ड', 'सब्सक्रिप्शन और बिलिंग', 'एडमिन पैनल', 'स्केलेबल आर्किटेक्चर'],
    },
  },
  {
    slug: 'digital-wedding-cards',
    icon: 'Gem',
    demo: '/wedding-card/',
    title: { en: 'Digital Invitation Cards', hi: 'डिजिटल निमंत्रण कार्ड' },
    short: {
      en: 'Animated invitations for weddings and every function, valid 30-45 days.',
      hi: 'शादी और हर फ़ंक्शन के एनिमेटेड निमंत्रण कार्ड, 30-45 दिन की वैधता।',
    },
    description: {
      en: 'We design animated digital invitations for weddings and every function (engagement, birthday, housewarming, mundan, katha and more), valid for 30 to 45 days. Guests get one WhatsApp link with events, venue on Google Maps and tap-to-call numbers. You also get a PDF and photo to save, and a private page showing how many people opened the card.',
      hi: 'हम शादी और हर फ़ंक्शन (सगाई, जन्मदिन, गृह प्रवेश, मुंडन, कथा आदि) के एनिमेटेड डिजिटल निमंत्रण कार्ड बनाते हैं, 30 से 45 दिन की वैधता के साथ। मेहमानों को WhatsApp पर एक लिंक मिलता है जिसमें कार्यक्रम, Google Maps पर विवाह स्थल और एक टैप में कॉल करने वाले नंबर होते हैं। आपको PDF और फ़ोटो भी मिलती है, और एक निजी पेज जिसमें दिखता है कि कितने लोगों ने कार्ड खोला।',
    },
    points: {
      en: ['Cards for any function, valid 30-45 days', 'Animated card with your names and photos', 'Google Maps venue link', 'Tap-to-call family numbers', 'PDF, photo and WhatsApp sharing', 'Private view and click insights'],
      hi: ['हर फ़ंक्शन के लिए कार्ड, 30-45 दिन की वैधता', 'आपके नाम और फ़ोटो के साथ एनिमेटेड कार्ड', 'Google Maps पर विवाह स्थल', 'एक टैप में कॉल वाले पारिवारिक नंबर', 'PDF, फ़ोटो और WhatsApp शेयर', 'निजी व्यू और क्लिक इनसाइट'],
    },
  },
];

// Statuses: 'development' | 'planned' | 'live'. Set 'live' only for real, released products.
// Add a screenshot by placing an image in /public/images and setting image: '/images/name.webp'.
export const products = [
  {
    id: 'product-1',
    icon: 'Boxes',
    status: 'development',
    image: '',
    name: { en: 'Product Name 1 (placeholder)', hi: 'प्रोडक्ट नाम 1 (प्लेसहोल्डर)' },
    description: {
      en: 'Replace this card with your first software product: what problem it solves and who it is for.',
      hi: 'इस कार्ड को अपने पहले सॉफ़्टवेयर प्रोडक्ट से बदलें: वह कौन सी समस्या हल करता है और किसके लिए है।',
    },
    link: '',
  },
  {
    id: 'product-2',
    icon: 'LayoutDashboard',
    status: 'development',
    image: '',
    name: { en: 'Product Name 2 (placeholder)', hi: 'प्रोडक्ट नाम 2 (प्लेसहोल्डर)' },
    description: {
      en: 'Replace this card with your second product. Add a screenshot and a short, factual description.',
      hi: 'इस कार्ड को अपने दूसरे प्रोडक्ट से बदलें। स्क्रीनशॉट और संक्षिप्त, तथ्यात्मक विवरण जोड़ें।',
    },
    link: '',
  },
  {
    id: 'product-3',
    icon: 'Layers',
    status: 'planned',
    image: '',
    name: { en: 'Product Name 3 (placeholder)', hi: 'प्रोडक्ट नाम 3 (प्लेसहोल्डर)' },
    description: {
      en: 'Use this card for a product you plan to build. Keep the status as Planned until work starts.',
      hi: 'जिस प्रोडक्ट को बनाने की योजना है उसके लिए यह कार्ड उपयोग करें। काम शुरू होने तक स्टेटस "योजनाबद्ध" रखें।',
    },
    link: '',
  },
];

// Statuses: 'demo' | 'verified'. Use 'verified' only after the project is confirmed real and approved for display.
export const portfolio = [
  {
    id: 'padhai-pro',
    icon: 'BookOpen',
    status: 'verified',
    image: '/apps/padhai-pro.jpg',
    category: { en: 'Education App', hi: 'एजुकेशन ऐप' },
    title: { en: 'Padhai Pro', hi: 'पढ़ाई प्रो' },
    description: {
      en: 'Learn, practice and grow: CBSE lessons and daily mock tests for KG to Class 5 in Maths, English and EVS.',
      hi: 'सीखो, अभ्यास करो, आगे बढ़ो: KG से कक्षा 5 तक गणित, अंग्रेज़ी और EVS के CBSE पाठ और रोज़ के मॉक टेस्ट।',
    },
    version: 'Android app (APK)',
    download: 'https://github.com/spywellinfotech-sys/spywell-release/releases/download/v4.42.2/PadhaiPro-v4.42.2.apk',
    link: '',
  },
  {
    id: 'cctv-promate',
    icon: 'ShieldCheck',
    status: 'verified',
    image: '',
    category: { en: 'Business App for CCTV Installers', hi: 'CCTV इंस्टॉलर के लिए बिज़नेस ऐप' },
    title: { en: 'CCTV ProMate', hi: 'CCTV प्रोमेट' },
    description: {
      en: 'Quotation, installation job, material, final bill, technician and profit tracking for CCTV installers, with PDF output.',
      hi: 'CCTV इंस्टॉलर के लिए कोटेशन, इंस्टॉलेशन जॉब, मटीरियल, फ़ाइनल बिल, टेक्नीशियन और मुनाफ़े का हिसाब, PDF के साथ।',
    },
    version: 'Android app (APK), always the latest version',
    download: 'https://github.com/spywellinfotech-sys/spywell-release/releases/download/tech-i-latest/CCTV-ProMate-latest.apk',
    link: '/cctv-promate/',
  },
  {
    id: 'promate-tech',
    icon: 'Eye',
    status: 'verified',
    image: '',
    category: { en: 'Field App for Technicians', hi: 'टेक्नीशियन के लिए फ़ील्ड ऐप' },
    title: { en: 'ProMate Tech', hi: 'प्रोमेट टेक' },
    description: {
      en: 'Installation checklist, customer details, GPS-stamped photos, customer signature and live camera view for CCTV technicians on site.',
      hi: 'साइट पर CCTV टेक्नीशियन के लिए इंस्टॉलेशन चेकलिस्ट, ग्राहक की जानकारी, GPS वाली फ़ोटो, ग्राहक के हस्ताक्षर और लाइव कैमरा व्यू।',
    },
    version: 'Android app (APK), always the latest version',
    download: 'https://github.com/spywellinfotech-sys/spywell-release/releases/download/tech-field-latest/ProMate-Tech-latest.apk',
    link: '',
  },
  {
    id: 'propdeal',
    icon: 'Briefcase',
    status: 'verified',
    image: '',
    category: { en: 'Real Estate App', hi: 'रियल एस्टेट ऐप' },
    title: { en: 'PropDeal', hi: 'प्रॉपडील' },
    description: {
      en: 'For property dealers: manage listings and clients, share on WhatsApp, and network with other dealers by call and WhatsApp.',
      hi: 'प्रॉपर्टी डीलरों के लिए: लिस्टिंग और क्लाइंट संभालें, WhatsApp पर शेयर करें और दूसरे डीलरों से कॉल और WhatsApp पर जुड़ें।',
    },
    version: 'Android app (APK), 61 MB',
    download: 'https://github.com/spywellinfotech-sys/spywell-release/releases/download/propdeal-v2.2.27/PropDeal-v2.2.27.apk',
    link: '',
  },
  {
    id: 'grocery',
    icon: 'ShoppingBasket',
    status: 'demo',
    image: '',
    category: { en: 'Grocery Delivery Applications', hi: 'ग्रॉसरी डिलीवरी एप्लिकेशन' },
    title: { en: 'Sample Grocery Delivery App', hi: 'नमूना ग्रॉसरी डिलीवरी ऐप' },
    description: {
      en: 'Demo concept showing catalogue, cart, orders and delivery tracking screens.',
      hi: 'डेमो कॉन्सेप्ट जिसमें कैटलॉग, कार्ट, ऑर्डर और डिलीवरी ट्रैकिंग स्क्रीन दिखाई गई हैं।',
    },
    link: '',
  },
  {
    id: 'education',
    icon: 'BookOpen',
    status: 'demo',
    image: '',
    category: { en: 'Education Platforms', hi: 'एजुकेशन प्लेटफ़ॉर्म' },
    title: { en: 'Sample Education Platform', hi: 'नमूना एजुकेशन प्लेटफ़ॉर्म' },
    description: {
      en: 'Demo concept with courses, students, attendance and fee screens.',
      hi: 'डेमो कॉन्सेप्ट जिसमें कोर्स, छात्र, उपस्थिति और फ़ीस स्क्रीन हैं।',
    },
    link: '',
  },
  {
    id: 'business',
    icon: 'BarChart3',
    status: 'demo',
    image: '',
    category: { en: 'Business Management Software', hi: 'बिज़नेस मैनेजमेंट सॉफ़्टवेयर' },
    title: { en: 'Sample Business Management Dashboard', hi: 'नमूना बिज़नेस मैनेजमेंट डैशबोर्ड' },
    description: {
      en: 'Demo concept for billing, inventory and reports in one dashboard.',
      hi: 'डेमो कॉन्सेप्ट जिसमें बिलिंग, इन्वेंटरी और रिपोर्ट एक ही डैशबोर्ड में हैं।',
    },
    link: '',
  },
  {
    id: 'healthcare',
    icon: 'HeartPulse',
    status: 'demo',
    image: '',
    category: { en: 'Healthcare Applications', hi: 'हेल्थकेयर एप्लिकेशन' },
    title: { en: 'Sample Clinic Appointment App', hi: 'नमूना क्लिनिक अपॉइंटमेंट ऐप' },
    description: {
      en: 'Demo concept for appointment booking and patient reminders.',
      hi: 'डेमो कॉन्सेप्ट जिसमें अपॉइंटमेंट बुकिंग और मरीज़ रिमाइंडर हैं।',
    },
    link: '',
  },
  {
    id: 'transport',
    icon: 'Truck',
    status: 'demo',
    image: '',
    category: { en: 'Transport Applications', hi: 'ट्रांसपोर्ट एप्लिकेशन' },
    title: { en: 'Sample Transport Booking App', hi: 'नमूना ट्रांसपोर्ट बुकिंग ऐप' },
    description: {
      en: 'Demo concept for trip bookings, drivers and expense records.',
      hi: 'डेमो कॉन्सेप्ट जिसमें ट्रिप बुकिंग, ड्राइवर और खर्च रिकॉर्ड हैं।',
    },
    link: '',
  },
];

export const industries = [
  {
    icon: 'GraduationCap',
    title: { en: 'Education', hi: 'शिक्षा' },
    text: {
      en: 'Schools, coaching institutes and training centres that need records, fees and communication handled smoothly.',
      hi: 'स्कूल, कोचिंग संस्थान और ट्रेनिंग सेंटर जिन्हें रिकॉर्ड, फ़ीस और संवाद सुचारू रूप से चाहिए।',
    },
  },
  {
    icon: 'HeartPulse',
    title: { en: 'Healthcare', hi: 'हेल्थकेयर' },
    text: {
      en: 'Clinics and practitioners looking for appointment, record and reminder tools.',
      hi: 'क्लिनिक और चिकित्सक जिन्हें अपॉइंटमेंट, रिकॉर्ड और रिमाइंडर टूल चाहिए।',
    },
  },
  {
    icon: 'ShoppingCart',
    title: { en: 'Retail and E-commerce', hi: 'रिटेल और ई-कॉमर्स' },
    text: {
      en: 'Shops and online sellers who want catalogues, ordering and delivery workflows.',
      hi: 'दुकानें और ऑनलाइन विक्रेता जिन्हें कैटलॉग, ऑर्डरिंग और डिलीवरी वर्कफ़्लो चाहिए।',
    },
  },
  {
    icon: 'Truck',
    title: { en: 'Transport and Logistics', hi: 'ट्रांसपोर्ट और लॉजिस्टिक्स' },
    text: {
      en: 'Transport operators who need trip, expense and document management software.',
      hi: 'ट्रांसपोर्ट ऑपरेटर जिन्हें ट्रिप, खर्च और डॉक्यूमेंट मैनेजमेंट सॉफ़्टवेयर चाहिए।',
    },
  },
  {
    icon: 'Factory',
    title: { en: 'Manufacturing and Trading', hi: 'मैन्युफैक्चरिंग और ट्रेडिंग' },
    text: {
      en: 'Manufacturers and traders managing stock, orders, billing and customers.',
      hi: 'निर्माता और व्यापारी जो स्टॉक, ऑर्डर, बिलिंग और ग्राहकों का प्रबंधन करते हैं।',
    },
  },
  {
    icon: 'Rocket',
    title: { en: 'Startups and Small Businesses', hi: 'स्टार्टअप और छोटे बिज़नेस' },
    text: {
      en: 'Early-stage teams that need an MVP, a website or practical automation on a sensible budget.',
      hi: 'शुरुआती टीमें जिन्हें समझदारी भरे बजट में एमवीपी, वेबसाइट या व्यावहारिक ऑटोमेशन चाहिए।',
    },
  },
];

export const process = [
  {
    icon: 'MessageSquare',
    title: { en: 'Discover', hi: 'समझना' },
    text: { en: 'We listen to your goals, users and constraints.', hi: 'हम आपके लक्ष्य, यूज़र और सीमाओं को सुनते हैं।' },
  },
  {
    icon: 'PenTool',
    title: { en: 'Plan and Design', hi: 'योजना और डिज़ाइन' },
    text: { en: 'We agree scope, timeline and screen designs.', hi: 'हम स्कोप, समय-सीमा और स्क्रीन डिज़ाइन तय करते हैं।' },
  },
  {
    icon: 'Code2',
    title: { en: 'Build', hi: 'निर्माण' },
    text: { en: 'We develop in small steps and share progress often.', hi: 'हम छोटे चरणों में विकास करते हैं और प्रगति साझा करते हैं।' },
  },
  {
    icon: 'ShieldCheck',
    title: { en: 'Test', hi: 'परीक्षण' },
    text: { en: 'We test on real devices and fix issues before release.', hi: 'हम रिलीज़ से पहले असली डिवाइस पर टेस्ट करके समस्याएँ ठीक करते हैं।' },
  },
  {
    icon: 'Rocket',
    title: { en: 'Launch and Support', hi: 'लॉन्च और सपोर्ट' },
    text: { en: 'We deploy, train your team and keep improving.', hi: 'हम डिप्लॉय करते हैं, आपकी टीम को सिखाते हैं और सुधार जारी रखते हैं।' },
  },
];

// Team placeholders: replace with real people only. Leave photo empty to show initials icon.
export const team = [
  {
    id: 'founder',
    photo: '',
    name: { en: '[Founder Name]', hi: '[संस्थापक का नाम]' },
    role: { en: 'Founder', hi: 'संस्थापक' },
    bio: {
      en: '[Add a short, accurate introduction here.]',
      hi: '[यहाँ संक्षिप्त और सही परिचय जोड़ें।]',
    },
  },
  {
    id: 'member-2',
    photo: '',
    name: { en: '[Team Member Name]', hi: '[टीम सदस्य का नाम]' },
    role: { en: '[Role]', hi: '[भूमिका]' },
    bio: { en: '[Optional short description.]', hi: '[वैकल्पिक संक्षिप्त विवरण।]' },
  },
  {
    id: 'member-3',
    photo: '',
    name: { en: '[Team Member Name]', hi: '[टीम सदस्य का नाम]' },
    role: { en: '[Role]', hi: '[भूमिका]' },
    bio: { en: '[Optional short description.]', hi: '[वैकल्पिक संक्षिप्त विवरण।]' },
  },
];

export const values = [
  {
    icon: 'Eye',
    title: { en: 'Transparency', hi: 'पारदर्शिता' },
    text: { en: 'Clear scope, honest timelines and open communication.', hi: 'स्पष्ट स्कोप, ईमानदार समय-सीमा और खुला संवाद।' },
  },
  {
    icon: 'Gem',
    title: { en: 'Quality', hi: 'गुणवत्ता' },
    text: { en: 'Clean code, careful testing and attention to detail.', hi: 'साफ़ कोड, सावधान परीक्षण और बारीकियों पर ध्यान।' },
  },
  {
    icon: 'Handshake',
    title: { en: 'Partnership', hi: 'साझेदारी' },
    text: { en: 'We treat your business goals as our own.', hi: 'हम आपके बिज़नेस लक्ष्यों को अपना मानकर काम करते हैं।' },
  },
  {
    icon: 'Lightbulb',
    title: { en: 'Practical Innovation', hi: 'व्यावहारिक नवाचार' },
    text: { en: 'Modern tools used where they solve real problems.', hi: 'आधुनिक टूल वहीं जहाँ वे असली समस्याएँ हल करें।' },
  },
];

export const whyUs = [
  {
    icon: 'Target',
    title: { en: 'Built Around Your Business', hi: 'आपके बिज़नेस के अनुसार' },
    text: { en: 'Solutions designed for your process, not a generic template.', hi: 'आपकी प्रक्रिया के अनुसार बने समाधान, सामान्य टेम्पलेट नहीं।' },
  },
  {
    icon: 'Languages',
    title: { en: 'Hindi and English Ready', hi: 'हिंदी और अंग्रेज़ी तैयार' },
    text: { en: 'Products that work for local users and international audiences.', hi: 'ऐसे प्रोडक्ट जो स्थानीय यूज़र और अंतरराष्ट्रीय दर्शकों दोनों के लिए काम करें।' },
  },
  {
    icon: 'MessagesSquare',
    title: { en: 'Direct Communication', hi: 'सीधा संवाद' },
    text: { en: 'A small team means you talk directly to the people building your product.', hi: 'छोटी टीम का मतलब है कि आप सीधे उन्हीं से बात करते हैं जो आपका प्रोडक्ट बना रहे हैं।' },
  },
  {
    icon: 'Zap',
    title: { en: 'Fast and Practical', hi: 'तेज़ और व्यावहारिक' },
    text: { en: 'We start small, ship early and improve with your feedback.', hi: 'हम छोटे से शुरू करते हैं, जल्दी रिलीज़ करते हैं और आपके फ़ीडबैक से सुधारते हैं।' },
  },
];
