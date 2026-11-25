// Generates one SEO landing page per LiveCard service into public/dyname/<slug>/index.html
// and rewrites public/dyname/sitemap.xml. Run: node scripts/make-landing.mjs
import fs from 'fs';
const ROOT = new URL('../public/dyname/', import.meta.url).pathname;
const O = 'https://livecard.in';
const DATE = new Date().toISOString().slice(0, 10);

const S = [
{slug:'digital-visiting-card',name:'Digital Visiting Card',
 title:'Digital Visiting Card Maker – Free Online Visiting Card | LiveCard',
 desc:'Create a free digital visiting card with your own link and QR. Call, WhatsApp, email and map buttons. Share on WhatsApp, update any time. डिजिटल विज़िटिंग कार्ड बनाएँ।',
 kw:'digital visiting card, online visiting card, QR visiting card, free digital business card, डिजिटल विज़िटिंग कार्ड',
 h1:'Digital Visiting Card that opens with one tap',
 hi:'छपे कार्ड की जगह एक लाइव लिंक: नाम, फ़ोन, WhatsApp, पता और काम सब एक जगह। नंबर या पता बदले तो कार्ड दोबारा छपवाने की ज़रूरत नहीं।',
 lead:'LiveCard turns your business details into a clean, mobile-friendly card with its own link and QR code. Anyone can call, message you on WhatsApp, email you or open your location straight from the card.',
 feats:['Your own short link, for example livecard.in/v/yourname','Call, WhatsApp, email and Google Maps buttons','QR code you can download and print on shop boards, bills and packaging','Add products, services, photos, social links and a gallery','Change details any time: the same link always shows the latest card','Save to phone contacts in one tap','Works on every phone, no app needed to view'],
 steps:['Sign up with your mobile number','Pick a design and fill in your details','Publish and share the link or QR'],
 faq:[['Is the digital visiting card free?','Yes. You can create a live card with your own link for free and try every plan for 7 days. See the plans page for details.'],['Do people need to install an app to see my card?','No. The card opens in any phone browser from a link, QR code or NFC tap.'],['Can I change my details after publishing?','Yes. Edit the card any time and the same link and QR show the updated details immediately.'],['Can I print the QR code?','Yes. Open My card, tap the QR button, then download or print it.']],
 rel:['mini-website','nfc-visiting-card','corporate-visiting-cards','how-it-works']},

{slug:'mini-website',name:'Mini Website',
 title:'Mini Website Maker for Small Business – One-Page Website | LiveCard',
 desc:'Build a one-page mini website for your shop or service in minutes. Products, gallery, contact buttons and QR on your own link. मिनी वेबसाइट बनाएँ।',
 kw:'mini website, one page website, small business website, free mini website maker, मिनी वेबसाइट',
 h1:'Mini Website for your business, ready in minutes',
 hi:'दुकान, सर्विस या प्रोफ़ेशन के लिए एक पेज की वेबसाइट। प्रोडक्ट, फ़ोटो, ऑफ़र और कॉल/WhatsApp बटन, सब एक लिंक पर।',
 lead:'A mini website is a fast one-page site for local businesses. Show who you are, what you sell, where you are and how to reach you, without hiring a developer.',
 feats:['One page with about, products or services, gallery and contact','Call, WhatsApp and map buttons for instant enquiries','Loads fast on mobile data','Your own link and QR code for counters, vehicles and flyers','Edit text, photos and offers from your phone','Optional own domain on the website plan'],
 steps:['Open the Studio and choose Mini Website','Add your business details, photos and offers','Publish and share your link'],
 faq:[['What is a mini website?','It is a simple one-page website that carries your business details, offers and contact buttons, built to be shared by link or QR.'],['Do I need technical skills?','No. Everything is filled in from forms on your phone.'],['Can I use my own domain name?','Yes, the Full Website plan supports your own domain. Check the plans page.'],['Is it good for Google search?','Each site is a normal public page with your business name, so people searching your name can find it.']],
 rel:['digital-visiting-card','business-directory','corporate-visiting-cards','pricing']},

{slug:'digital-invitation',name:'Digital Invitation Card',
 title:'Digital Wedding Invitation Card Maker – Online Invitation | LiveCard',
 desc:'Make a digital wedding, birthday or puja invitation card and share it on WhatsApp with a link. Event details, map, gallery and RSVP. ऑनलाइन निमंत्रण कार्ड बनाएँ।',
 kw:'digital invitation card, wedding invitation online, online shaadi card, birthday invitation card, डिजिटल निमंत्रण कार्ड, ऑनलाइन शादी कार्ड',
 h1:'Digital Invitation Cards for wedding and every function',
 hi:'शादी, सगाई, जन्मदिन, पूजा और हर समारोह का ऑनलाइन कार्ड। एक लिंक WhatsApp पर भेजिए, मेहमान तारीख़, जगह और मैप एक ही जगह देखें।',
 lead:'Skip printing and delivering hundreds of cards. Create a beautiful invitation, send it as a link on WhatsApp and let guests see the schedule, venue map and photos on their phone.',
 feats:['Designs for wedding, engagement, birthday, puja and other functions','Event schedule, venue and Google Maps link','Photo gallery and family names','Shows a proper preview when shared on WhatsApp','See how many guests opened the invitation','Edit date or venue later: guests always see the latest details'],
 steps:['Choose an invitation design','Add names, date, venue and photos','Publish and send the link on WhatsApp'],
 faq:[['Can I send the invitation on WhatsApp?','Yes. Each invitation has a link that shows a preview card in WhatsApp.'],['Can I change the venue or time after sending?','Yes. Edit the invitation and the same link shows the new details.'],['Which functions are supported?','Wedding, engagement, birthday, puja and other functions.'],['Can I see who opened my invitation?','Yes, the insights page shows how many times the invitation was opened.']],
 rel:['greeting-cards','digital-visiting-card','pricing','how-it-works']},

{slug:'car-call-qr',name:'Car Call QR',
 title:'Car Call QR Sticker – Contact Owner Without Sharing Number | LiveCard',
 desc:'Put a QR on your car or bike so anyone can call you if it is wrongly parked. Get a call QR for your vehicle. गाड़ी पर लगाने वाला कॉल QR।',
 kw:'car QR code, car parking QR, call owner QR sticker, vehicle QR, गाड़ी पर QR',
 h1:'Car Call QR: let people reach you when your vehicle blocks the way',
 hi:'गाड़ी के शीशे पर QR लगाइए। गलत पार्किंग या ज़रूरत पर कोई भी स्कैन करके आपको कॉल कर सकता है।',
 lead:'Print a QR sticker for your car, bike or auto. Anyone who needs to reach the owner scans it and gets a simple call page, so you do not have to leave your number on the dashboard.',
 feats:['One QR per vehicle with your vehicle number','Scanner gets a clear call button','Download and print the QR as a sticker','Works with any phone camera','Update your contact number without changing the sticker'],
 steps:['Open Car Call QR in the app','Enter vehicle number and contact','Download, print and stick the QR on your vehicle'],
 faq:[['Does the person scanning need an app?','No. Any phone camera opens the call page.'],['Can I change my phone number later?','Yes. The QR stays the same and the page shows your updated contact.'],['Is it only for cars?','No. Use it for bikes, autos, trucks and any vehicle.'],['Can I print it myself?','Yes. Download the QR and print it on a sticker or lamination.']],
 rel:['digital-visiting-card','nfc-visiting-card','how-it-works','pricing']},

{slug:'business-directory',name:'Business Directory',
 title:'Business Directory India – List Your Business Free | LiveCard',
 desc:'List your business in the LiveCard directory and be found by category and city. Free listing with call and WhatsApp buttons. बिज़नेस डायरेक्टरी में अपना बिज़नेस जोड़ें।',
 kw:'business directory, local business listing, free business listing India, बिज़नेस डायरेक्टरी',
 h1:'Business Directory: get found by customers near you',
 hi:'अपना बिज़नेस श्रेणी और शहर के हिसाब से डायरेक्टरी में जोड़िए, ताकि ग्राहक आपको ढूँढ सकें और सीधे कॉल या WhatsApp करें।',
 lead:'The LiveCard directory lists businesses by category and city. Your listing links to your live card or mini website so customers can call or message you straight away.',
 feats:['Listing by business category and city','Direct call and WhatsApp buttons','Links to your digital card or mini website','Search for businesses and save useful contacts','Update your details any time'],
 steps:['Create your digital card','Choose a category and city','Publish to appear in the directory'],
 faq:[['Is directory listing free?','Basic listing is available on the free plan. See plans for details.'],['How do customers find me?','They browse or search by category and city and open your card.'],['Can I edit my listing?','Yes, edit your card and the listing shows the latest details.'],['Do I need a website?','No. Your LiveCard is enough.']],
 rel:['digital-visiting-card','mini-website','my-network','pricing']},

{slug:'my-network',name:'My Network',
 title:'My Network – Save Business Cards and Contacts Digitally | LiveCard',
 desc:'Scan, save and organise business cards and contacts in one place. Add from your phone contacts, call or WhatsApp in one tap. अपना नेटवर्क एक जगह।',
 kw:'save business cards, business card scanner contacts, digital contact book, network contacts, बिज़नेस कार्ड सेव',
 h1:'My Network: every business contact in one place',
 hi:'जिनसे मिलते हैं उनके कार्ड स्कैन करके या फ़ोन कॉन्टैक्ट से जोड़कर सेव करें। नाम, काम और शहर से ढूँढें, एक टैप में कॉल या WhatsApp।',
 lead:'Stop losing paper cards. Save the digital cards you scan, add people from your phone contacts and keep notes, so your network is searchable and ready to call.',
 feats:['Save any LiveCard you scan or open','Add new contacts, with a picker from your phone contact list','One-tap call and WhatsApp','Search by name, business or city','Notes and follow-up reminders on each contact'],
 steps:['Scan or open a LiveCard and save it','Or add a contact from your phone book','Call, message or set a follow-up'],
 faq:[['Can I import from my phone contacts?','Yes, on supported Android phones you can pick a contact from your phone list while adding a new one.'],['Do saved cards update by themselves?','Yes. Saved LiveCards show the latest details the owner publishes.'],['Is my network private?','Your saved list is visible only to you.'],['Can I set reminders?','Yes, use FollowUp to schedule calls and tasks.']],
 rel:['followup','business-directory','digital-visiting-card','how-it-works']},

{slug:'followup',name:'FollowUp',
 title:'FollowUp – Call and Follow-up Reminder for Small Business | LiveCard',
 desc:'Track calls, set follow-up reminders and note outcomes for every lead and contact. Simple call and WhatsApp tracker. फॉलो-अप रिमाइंडर।',
 kw:'follow up reminder app, lead follow up, call tracker, small business CRM, फॉलो अप',
 h1:'FollowUp: never miss a customer call back',
 hi:'हर ग्राहक के लिए कॉल का नतीजा लिखिए, अगली कॉल की तारीख़ तय कीजिए और रिमाइंडर पाइए। छोटा, आसान CRM।',
 lead:'FollowUp is a light CRM inside LiveCard. After each call you record how it went and set the next follow-up, so no enquiry goes cold.',
 feats:['Call outcome after every call: interested, call later, busy and more','Schedule the next follow-up date and time','Open task list of everything due','Call and WhatsApp from the same screen','Works with your saved network and leads'],
 steps:['Pick a contact from My Network or Leads','Call and record the outcome','Set the next follow-up and get reminded'],
 faq:[['Is FollowUp free for every user?','It is available to every logged-in LiveCard user.'],['Can I track outcomes?','Yes, choose an outcome after each call and add a note.'],['Does it replace a full CRM?','It is built for small businesses that need simple call tracking, not enterprise CRM.'],['Where do my contacts come from?','From your saved network, leads and manually added contacts.']],
 rel:['my-network','business-directory','digital-visiting-card','how-it-works']},

{slug:'nfc-visiting-card',name:'NFC Visiting Card',
 title:'NFC Visiting Card – Tap to Share Your Digital Card | LiveCard',
 desc:'Write your LiveCard link to an NFC tag and share it with one tap. Works with NTAG213 tags on Android. NFC विज़िटिंग कार्ड।',
 kw:'NFC visiting card, NFC business card, tap to share card, NTAG213 business card, NFC कार्ड',
 h1:'NFC Visiting Card: tap a tag, your card opens',
 hi:'NFC टैग/कार्ड पर अपना LiveCard लिंक लिखिए। सामने वाला फ़ोन छुआए तो आपका कार्ड खुल जाए।',
 lead:'Write your LiveCard link onto an inexpensive NFC tag or card from inside the app. When someone taps it with their phone, your live card opens, and you can see how many taps came from NFC.',
 feats:['Write the link to an NFC tag from the app on supported Android phones','Works with common NTAG213 tags','NFC taps are counted separately in insights','QR code as a backup for phones without NFC','Update the card without rewriting the tag'],
 steps:['Open My card and tap the NFC button','Hold a blank NFC tag near the back of your phone','Share: anyone tapping the tag opens your card'],
 faq:[['Which phones can write NFC tags?','Android phones with NFC using Chrome. iPhones can read tags but writing is done from Android.'],['Which tags work?','Common NTAG213 tags work well.'],['If I change my details, do I rewrite the tag?','No. The tag holds your link, which always shows the latest card.'],['What if the other phone has no NFC?','Show the QR code instead.']],
 rel:['digital-visiting-card','corporate-visiting-cards','car-call-qr','how-it-works']},

{slug:'corporate-visiting-cards',name:'Corporate Digital Cards',
 title:'Corporate Digital Visiting Cards for Employees | LiveCard Corporate',
 desc:'Branded digital visiting cards for every employee, a company mini website, employee panel and reports. कंपनी और कर्मचारियों के डिजिटल कार्ड।',
 kw:'corporate digital business card, employee digital cards, company digital identity, कंपनी डिजिटल कार्ड',
 h1:'Corporate Digital Cards: one identity for your whole team',
 hi:'कंपनी के ब्रांड वाले कार्ड हर कर्मचारी को, कंपनी की मिनी वेबसाइट और एक कंट्रोल पैनल। कर्मचारी बदले तो कार्ड बदलना आसान।',
 lead:'Give every employee a consistent, branded digital card while the company keeps control. Add or remove staff, update the brand once and manage everything from one panel.',
 feats:['Company-branded card for each employee','Company mini website','Control panel to add and manage employees','Each employee can share their own link, QR or NFC tap','Reports on views and activity'],
 steps:['Create the company profile','Add employees to the panel','Each employee shares their card'],
 faq:[['How many employees can I add?','The number depends on your plan. See the plans page or contact us for large teams.'],['Can an employee leave and the card be removed?','Yes. The company admin controls employee cards.'],['Do employees need separate accounts?','Each employee signs in with their own mobile number.'],['Can we use our own domain?','Company subdomain and own domain options are available. Contact us.']],
 rel:['digital-visiting-card','mini-website','nfc-visiting-card','pricing']},

{slug:'greeting-cards',name:'Greeting and Offer Cards',
 title:'Online Greeting and Festival Offer Cards for Business | LiveCard',
 desc:'Create greeting and offer cards with your business name and contact for festivals and sales. Share on WhatsApp. ग्रीटिंग और ऑफ़र कार्ड।',
 kw:'greeting card maker, festival offer card, business offer poster, WhatsApp offer card, ग्रीटिंग कार्ड',
 h1:'Greeting and Offer Cards that carry your contact',
 hi:'त्योहार की शुभकामना या ऑफ़र का कार्ड अपने नाम और नंबर के साथ बनाइए और WhatsApp पर भेजिए।',
 lead:'Turn festivals and sales into marketing. Make a greeting or offer card that shows your business name, contact buttons and link, and send it to customers on WhatsApp.',
 feats:['Festival greetings and shop offers','Your name, logo and contact on every card','Shareable link with WhatsApp preview','Edit text and offer details quickly'],
 steps:['Open Greeting / Offer in the Studio','Write your message and offer','Share the link with customers'],
 faq:[['Can I add my logo?','Yes, add your business name and logo to the card.'],['Can I use it for a sale announcement?','Yes. It works for offers, discounts and announcements.'],['Is it shareable on WhatsApp?','Yes, the link shows a preview card.'],['Is it free?','Basic use is free. See plans for limits.']],
 rel:['digital-invitation','digital-visiting-card','mini-website','pricing']},

{slug:'how-it-works',name:'How LiveCard Works',
 title:'How LiveCard Works – Create, Share and Track Your Card | LiveCard',
 desc:'See how to create a digital visiting card, mini website or invitation with LiveCard in three simple steps and share by link, QR or NFC.',
 kw:'how digital visiting card works, create digital card, LiveCard guide, डिजिटल कार्ड कैसे बनाएँ',
 h1:'How LiveCard works',
 hi:'तीन कदम: साइन-अप, कार्ड बनाइए, लिंक/QR/NFC से शेयर कीजिए। कौन देख रहा है, यह भी पता चलता है।',
 lead:'LiveCard gives you one identity that works across a card, website, invitation and more. Here is the whole flow from sign-up to sharing and tracking.',
 feats:['Sign up with your mobile number','Pick a template and add your details','Publish to get your own link and QR','Share on WhatsApp, print the QR or write an NFC tag','See views, QR scans and NFC taps in insights','Save and manage contacts in My Network and FollowUp'],
 steps:['Sign up and choose what to make','Fill details and publish','Share and track'],
 faq:[['How long does it take to make a card?','Usually a few minutes.'],['What can I make with LiveCard?','Visiting cards, mini websites, invitations, greeting cards, address cards and car call QR.'],['Do I need to install an app?','You can use the web app or the Android app. People viewing your card need nothing.'],['Is there a free plan?','Yes. See the plans page.']],
 rel:['digital-visiting-card','mini-website','digital-invitation','pricing']},
];
const NAMES = Object.fromEntries(S.map(s => [s.slug, s.name]));
NAMES.pricing = 'Plans and Pricing';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const CSS = `:root{--r:#ED1C24;--rd:#b8121a;--k:#1a1a1a;--m:#6b6b6b;--l:#e6e8ec}*{box-sizing:border-box}body{margin:0;font:16px/1.65 system-ui,-apple-system,Segoe UI,Roboto,'Noto Sans Devanagari',sans-serif;color:var(--k);background:#fff}header{background:var(--r);color:#fff;padding:12px 16px;display:flex;align-items:center;gap:10px}header img{border-radius:50%;background:#fff}header a{color:#fff;text-decoration:none;font-weight:700}header .sp{margin-left:auto}main{max-width:860px;margin:0 auto;padding:18px 16px 40px}h1{font-size:28px;line-height:1.25;margin:8px 0;color:var(--rd)}h2{font-size:21px;margin:30px 0 8px;color:var(--rd)}.hi{background:#fff4f4;border:1px solid #f4c4c6;border-radius:12px;padding:12px 14px;margin:14px 0}.bc{font-size:13px;color:var(--m)}.bc a{color:var(--m)}ul.f{padding-left:20px}ul.f li{margin:7px 0}ol li{margin:7px 0}.cta{display:inline-block;background:var(--r);color:#fff;text-decoration:none;font-weight:800;padding:13px 28px;border-radius:999px;margin:10px 8px 0 0}.cta.o{background:#fff;color:var(--r);border:2px solid var(--r)}details{border:1px solid var(--l);border-radius:12px;padding:10px 14px;margin:8px 0}summary{font-weight:700;cursor:pointer}.rel{display:flex;flex-wrap:wrap;gap:8px}.rel a{border:1.5px solid var(--r);color:var(--r);text-decoration:none;border-radius:999px;padding:7px 14px;font-weight:700;font-size:14px}footer{background:#111;color:#bbb;text-align:center;padding:18px 14px;font-size:13px}footer a{color:#fff;margin:0 6px}`;

function page(s) {
  const url = `${O}/${s.slug}/`;
  const ld = {'@context':'https://schema.org','@graph':[
    {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'LiveCard',item:O+'/'},{'@type':'ListItem',position:2,name:s.name,item:url}]},
    {'@type':'WebPage','@id':url,url,name:s.title,description:s.desc,inLanguage:['en','hi'],isPartOf:{'@id':O+'/#site'}},
    {'@type':'FAQPage',mainEntity:s.faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}]};
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(s.title)}</title>
<meta name="description" content="${esc(s.desc)}">
<meta name="keywords" content="${esc(s.kw)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(s.title)}"><meta property="og:description" content="${esc(s.desc)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${O}/dyname/og.jpg"><meta property="og:site_name" content="LiveCard">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(s.title)}"><meta name="twitter:image" content="${O}/dyname/og.jpg">
<meta name="theme-color" content="#ED1C24"><link rel="icon" href="/dyname/logo.png">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>${CSS}</style></head><body>
<header><img src="/dyname/logo.png" width="32" height="32" alt="LiveCard"><a href="/">LiveCard</a><a class="sp" href="/studio/">Login</a></header>
<main>
<div class="bc"><a href="/">Home</a> › ${esc(s.name)}</div>
<h1>${esc(s.h1)}</h1>
<p>${esc(s.lead)}</p>
<div class="hi" lang="hi">${esc(s.hi)}</div>
<a class="cta" href="/studio/">Start free</a><a class="cta o" href="/dyname/plans/">See plans</a>
<h2>What you get</h2>
<ul class="f">${s.feats.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
<h2>How to get started</h2>
<ol>${s.steps.map(f => `<li>${esc(f)}</li>`).join('')}</ol>
<h2>Frequently asked questions</h2>
${s.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
<h2>Explore more LiveCard services</h2>
<div class="rel">${s.rel.map(r => `<a href="/dyname/${r === 'pricing' ? 'plans' : r}/">${esc(NAMES[r])}</a>`).join('')}</div>
</main>
<footer><a href="/">Home</a><a href="/dyname/plans/">Plans</a><a href="/dyname/privacy/">Privacy</a><a href="/dyname/terms/">Terms</a><a href="/dyname/refund/">Refund</a><div style="margin-top:8px">© LiveCard by SpyWell InfoTech</div></footer>
</body></html>`;
}

for (const s of S) {
  fs.mkdirSync(ROOT + s.slug, {recursive: true});
  fs.writeFileSync(`${ROOT}${s.slug}/index.html`, page(s));
}
const urls = [['/',1.0,'weekly'],...S.map(s => [`/${s.slug}/`,0.8,'monthly']),['/privacy/',0.3,'yearly'],['/terms/',0.3,'yearly'],['/refund/',0.3,'yearly'],['/disclaimer/',0.3,'yearly']];
fs.writeFileSync(ROOT + 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` + urls.map(([p,pr,cf]) => `<url><loc>${O}${p}</loc><lastmod>${DATE}</lastmod><changefreq>${cf}</changefreq><priority>${pr}</priority></url>`).join('\n') + `\n</urlset>\n`);
console.log('pages', S.length);
