/* Hindi (Devanagari) layer: the app is written in Hinglish; this translates what is shown, and can be switched off. */
(function () {
  "use strict";
  var LK = window.LK, $ = LK.$;
  var D = {
    "Budget ke niyam — pehle padho": "बजट के नियम — पहले पढ़ो",
    "Naya Lucky Draw banao": "नया लकी ड्रॉ बनाओ",
    "Mere Lucky Draw coupon": "मेरे लकी ड्रॉ कूपन",
    "Samajh gaya, plan banao": "समझ गया, प्लान बनाओ",
    "Samajh gaya, aage badho": "समझ गया, आगे बढ़ो",
    "Budget planner": "बजट प्लानर",
    "Draft banao": "ड्राफ्ट बनाओ",
    "Live karo": "लाइव करो",
    "Coupon do": "कूपन दो",
    "Draw nikalo": "ड्रॉ निकालो",
    "Result jaanchein": "रिज़ल्ट जाँचें",
    "Winners dekho": "विजेता देखो",
    "Fair draw": "निष्पक्ष ड्रॉ",
    "Auto plan": "ऑटो प्लान",
    "Apni gali ki dukaan se, ghar baithe saman mangao.": "अपनी गली की दुकान से, घर बैठे सामान मंगाओ।",
    "Pehle demo dekho (bina login)": "पहले डेमो देखो (बिना लॉगिन)",
    "Ye prototype hai: saare button demo data ke saath chalte hain.": "यह प्रोटोटाइप है: सारे बटन डेमो डेटा के साथ चलते हैं।",
    "Naye number par isi PIN se account ban jayega. PIN yaad rakhna.": "नए नंबर पर इसी PIN से अकाउंट बन जाएगा। PIN याद रखना।",
    "Google login phone ke app mein chalta hai. Yahan mobile + PIN use karo.": "Google लॉगिन फ़ोन के ऐप में चलता है। यहाँ मोबाइल + PIN इस्तेमाल करो।",
    "Google se login": "Google से लॉगिन",
    "ya mobile number se": "या मोबाइल नंबर से",
    "Login / Naya account": "लॉगिन / नया अकाउंट",
    "10 ank ka sahi mobile number daalo.": "10 अंक का सही मोबाइल नंबर डालो।",
    "10 ank ka number": "10 अंक का नंबर",
    "6 ank ka PIN": "6 अंक का PIN",
    "PIN 6 ank ka hona chahiye.": "PIN 6 अंक का होना चाहिए।",
    "PIN galat hai. Dobara koshish karo.": "PIN गलत है। दोबारा कोशिश करो।",
    "Bahut baar galat PIN. 15 minute baad koshish karo.": "बहुत बार गलत PIN। 15 मिनट बाद कोशिश करो।",
    "Account nahi ban paaya. Thodi der baad koshish karo.": "अकाउंट नहीं बन पाया। थोड़ी देर बाद कोशिश करो।",
    "Dobara login karo.": "दोबारा लॉगिन करो।",
    "Sahi naam likho.": "सही नाम लिखो।",
    "Dukaan ka naam likho.": "दुकान का नाम लिखो।",
    "Dukaan ki location lo (GPS button dabao).": "दुकान की लोकेशन लो (GPS बटन दबाओ)।",
    "Dukaan ka type chuno (Kirana, Dairy...).": "दुकान का प्रकार चुनो (किराना, डेयरी...)।",
    "Pehle apni dukaan register karo.": "पहले अपनी दुकान रजिस्टर करो।",
    "Sahi rate likho.": "सही रेट लिखो।",
    "Pehle apna naam aur mobile number bharo.": "पहले अपना नाम और मोबाइल नंबर भरो।",
    "Ye dukaan abhi order nahi le rahi.": "यह दुकान अभी ऑर्डर नहीं ले रही।",
    "Dukaan abhi band hai.": "दुकान अभी बंद है।",
    "Apni hi dukaan par order nahi kar sakte.": "अपनी ही दुकान पर ऑर्डर नहीं कर सकते।",
    "List khaali hai. Kuch saman jodo.": "लिस्ट खाली है। कुछ सामान जोड़ो।",
    "Ek list mein 80 se zyada saman nahi.": "एक लिस्ट में 80 से ज़्यादा सामान नहीं।",
    "Aapke 5 order pehle se chal rahe hain. Unka bill aane do.": "आपके 5 ऑर्डर पहले से चल रहे हैं। उनका बिल आने दो।",
    "List mein kuch galat hai.": "लिस्ट में कुछ गलत है।",
    "Order nahi mila.": "ऑर्डर नहीं मिला।",
    "Customer confirm kar chuka hai, bill ab nahi badal sakta.": "ग्राहक कन्फ़र्म कर चुका है, बिल अब नहीं बदल सकता।",
    "Home delivery ya pickup mein se kam se kam ek chuno.": "होम डिलीवरी या पिकअप में से कम से कम एक चुनो।",
    "Home delivery ya pickup mein se ek chuno.": "होम डिलीवरी या पिकअप में से एक चुनो।",
    "Delivery charge sahi likho.": "डिलीवरी चार्ज सही लिखो।",
    "Har saman ka rate bharo, ya jo nahi hai use hatao.": "हर सामान का रेट भरो, या जो नहीं है उसे हटाओ।",
    "Is saman ki unit alag hai, total rupaye khud likho.": "इस सामान की इकाई अलग है, कुल रुपये खुद लिखो।",
    "Ye order ab is step par nahi hai.": "यह ऑर्डर अब इस चरण पर नहीं है।",
    "Comment likho.": "कमेंट लिखो।",
    "Dukaan home delivery nahi de rahi.": "दुकान होम डिलीवरी नहीं दे रही।",
    "Is order par pickup nahi hai.": "इस ऑर्डर पर पिकअप नहीं है।",
    "Delivery ke liye pata likho.": "डिलीवरी के लिए पता लिखो।",
    "Delivery ka pata likho.": "डिलीवरी का पता लिखो।",
    "Confirm hone ke baad order cancel nahi hota. Dukaandaar se baat karo.": "कन्फ़र्म होने के बाद ऑर्डर कैंसल नहीं होता। दुकानदार से बात करो।",
    "Ye status abhi nahi badal sakta.": "यह स्टेटस अभी नहीं बदल सकता।",
    "Is order par refund nahi ho sakta.": "इस ऑर्डर पर रिफ़ंड नहीं हो सकता।",
    "Refund ki raqam sahi likho.": "रिफ़ंड की रकम सही लिखो।",
    "Ad ka title likho.": "विज्ञापन का शीर्षक लिखो।",
    "Photo ya video sahi nahi hai.": "फ़ोटो या वीडियो सही नहीं है।",
    "Ek saath 5 ad chal sakte hain. Purana band karo.": "एक साथ 5 विज्ञापन चल सकते हैं। पुराना बंद करो।",
    "Sirf admin ye kar sakta hai.": "सिर्फ़ एडमिन यह कर सकता है।",
    "File upload nahi hui. Chhoti file try karo.": "फ़ाइल अपलोड नहीं हुई। छोटी फ़ाइल आज़माओ।",
    "Google login poora nahi hua. Dobara koshish karo.": "Google लॉगिन पूरा नहीं हुआ। दोबारा कोशिश करो।",
    "Google login abhi chalu nahi hai. Mobile + PIN se login karo.": "Google लॉगिन अभी चालू नहीं है। मोबाइल + PIN से लॉगिन करो।",
    "Google login abhi server par chalu nahi hai. Mobile + PIN se login karo.": "Google लॉगिन अभी सर्वर पर चालू नहीं है। मोबाइल + PIN से लॉगिन करो।",
    "Sahi umar likho (10 se 110).": "सही उम्र लिखो (10 से 110)।",
    "UPI ID sahi likho, jaise naam@okaxis.": "UPI ID सही लिखो, जैसे naam@okaxis।",
    "Dukaan ki 6 photo tak laga sakte ho.": "दुकान की 6 फ़ोटो तक लगा सकते हो।",
    "Is dukaan ki UPI ID nahi hai. Cash chuno.": "इस दुकान की UPI ID नहीं है। कैश चुनो।",
    "Payment ka tarika chuno.": "पेमेंट का तरीका चुनो।",
    "Is order par abhi payment nahi.": "इस ऑर्डर पर अभी पेमेंट नहीं।",
    "Ling chuno.": "लिंग चुनो।",
    "Nahi mila.": "नहीं मिला।",
    "Internet nahi hai. Connection dekho aur dobara koshish karo.": "इंटरनेट नहीं है। कनेक्शन देखो और दोबारा कोशिश करो।",
    "File bahut badi hai (50 MB tak).": "फ़ाइल बहुत बड़ी है (50 MB तक)।",
    "Kuch gadbad hui": "कुछ गड़बड़ हुई",
    ". Dobara koshish karo.": "। दोबारा कोशिश करो।",
    "Dobara koshish karo.": "दोबारा कोशिश करो।",
    "Apni jaankari bharo": "अपनी जानकारी भरो",
    "Ye sab zaroori hai. Dukaandaar ko order ke liye aapka naam, number aur pata chahiye.": "ये सब ज़रूरी है। दुकानदार को ऑर्डर के लिए आपका नाम, नंबर और पता चाहिए।",
    "Poora naam *": "पूरा नाम *", "Jaise: Ramesh Kumar": "जैसे: रमेश कुमार",
    "Mobile number *": "मोबाइल नंबर *", "Mobile number": "मोबाइल नंबर",
    "Umar *": "उम्र *", "Saal": "साल", "Ling *": "लिंग *", "Umar / Ling": "उम्र / लिंग",
    "Purush": "पुरुष", "Mahila": "महिला", "Anya": "अन्य",
    "Location *": "लोकेशन *",
    "📍 GPS se meri location lo": "📍 GPS से मेरी लोकेशन लो",
    "📍 Location dobara lo": "📍 लोकेशन दोबारा लो",
    "📍 Location dhoondh raha hoon…": "📍 लोकेशन ढूँढ रहा हूँ…",
    "✓ Location mil gayi": "✓ लोकेशन मिल गई",
    "Abhi location nahi li. 📍 dabao.": "अभी लोकेशन नहीं ली। 📍 दबाओ।",
    "Map par dekho": "मैप पर देखो",
    "Ghar ka pata *": "घर का पता *",
    "Gali, mohalla, landmark": "गली, मोहल्ला, लैंडमार्क",
    "Main yahan kaun hoon?": "मैं यहाँ कौन हूँ?",
    "Saman mangana hai": "सामान मंगाना है", "Meri dukaan hai": "मेरी दुकान है",
    "Customer": "ग्राहक", "Dukaandaar": "दुकानदार", "Dukaandaar (": "दुकानदार (", "Customers (": "ग्राहक (", "Koi customer nahi.": "कोई ग्राहक नहीं।", "Naya order aaya": "नया ऑर्डर आया", "📷 Photo lagao": "📷 फ़ोटो लगाओ", "🎥 Video lagao": "🎥 वीडियो लगाओ", " saal · ": " साल · ", " order": " ऑर्डर",
    "Aage badho": "आगे बढ़ो",
    "Location update ho gayi ✓": "लोकेशन अपडेट हो गई ✓",
    "Location ki permission do (Phone Settings → Apps → LoKalLo → Permissions → Location).": "लोकेशन की अनुमति दो (फ़ोन सेटिंग्स → ऐप्स → LoKalLo → अनुमतियाँ → लोकेशन)।",
    "Location nahi mil rahi. GPS on karo, khule mein jaakar dobara 📍 dabao.": "लोकेशन नहीं मिल रही। GPS चालू करो, खुले में जाकर दोबारा 📍 दबाओ।",
    "Dukaanein": "दुकानें", "Dukaanein dekho": "दुकानें देखो",
    "Dhoondh raha hoon…": "ढूँढ रहा हूँ…",
    "ke andar (paas wali pehle)": "के अंदर (पास वाली पहले)",
    "Is range mein koi dukaan nahi mili.": "इस दायरे में कोई दुकान नहीं मिली।",
    "4 km tak dhoondho": "4 km तक ढूँढो",
    "Sab": "सब",
    "Kirana": "किराना", "Dairy": "डेयरी", "Bakery": "बेकरी", "Fal-Sabzi": "फल-सब्ज़ी", "Mithai": "मिठाई",
    "Khula": "खुला", "Band": "बंद",
    "🟢 Khula": "🟢 खुला", "🔴 Band": "🔴 बंद",
    "Dukaan abhi band hai": "दुकान अभी बंद है",
    "Aapke ghar tak delivery nahi (sirf pickup)": "आपके घर तक डिलीवरी नहीं (सिर्फ़ पिकअप)",
    "Koi nahi": "कोई नहीं", "Meri dukaan": "मेरी दुकान",
    "📝 Saman ki list banao": "📝 सामान की लिस्ट बनाओ",
    "Saman ki list banao": "सामान की लिस्ट बनाओ",
    "Saman tick karke list banao": "सामान टिक करके लिस्ट बनाओ",
    "Sirf saman aur matra chuno. Rate dukaandaar bill mein bhejega.": "सिर्फ़ सामान और मात्रा चुनो। रेट दुकानदार बिल में भेजेगा।",
    "Saman dhoondho (aata, doodh, tamatar…)": "सामान ढूँढो (आटा, दूध, टमाटर…)",
    "Saman dhoondho": "सामान ढूँढो",
    "Apna saman likho": "अपना सामान लिखो",
    "Apna saman (list mein nahi hai)": "अपना सामान (लिस्ट में नहीं है)",
    "Nahi mila. Neeche \"Apna saman likho\" se jodo.": "नहीं मिला। नीचे \"अपना सामान लिखो\" से जोड़ो।",
    "Catalog mein nahi mila?": "लिस्ट में नहीं मिला?",
    "Abhi kuch nahi chuna. Upar se category kholo aur saman tick karo.": "अभी कुछ नहीं चुना। ऊपर से श्रेणी खोलो और सामान टिक करो।",
    "Dukaan ko bhejo": "दुकान को भेजो", "✅ Dukaan ko bhejo": "✅ दुकान को भेजो",
    "Dukaandaar ke liye note (optional)": "दुकानदार के लिए नोट (वैकल्पिक)",
    "Jaise: aata chakki wala dena": "जैसे: चक्की वाला आटा देना",
    "← Aur saman jodo": "← और सामान जोड़ो", "← Saman chuno": "← सामान चुनो",
    "Order bhej diya ✓ Dukaandaar bill banayega.": "ऑर्डर भेज दिया ✓ दुकानदार बिल बनाएगा।",
    "Naya order bhej diya ✓": "नया ऑर्डर भेज दिया ✓",
    "saman chune": "सामान चुने", "✓ Chuna hua": "✓ चुना हुआ",
    "Order dekho →": "ऑर्डर देखो →",
    "Mere orders": "मेरे ऑर्डर", "Orders": "ऑर्डर", "Rate": "रेट", "Ads": "विज्ञापन", "Report": "रिपोर्ट", "Dukaan": "दुकान", "Profile": "प्रोफ़ाइल",
    "Abhi koi order nahi.": "अभी कोई ऑर्डर नहीं।",
    "Abhi koi order nahi aaya. Customer ko apni dukaan ke baare mein batao 📣": "अभी कोई ऑर्डर नहीं आया। ग्राहकों को अपनी दुकान के बारे में बताओ 📣",
    "Is filter mein koi order nahi.": "इस फ़िल्टर में कोई ऑर्डर नहीं।",
    "Naye": "नए", "Bill bheja": "बिल भेजा", "Chal rahe": "चल रहे", "Poore": "पूरे",
    "Bill ka intezaar": "बिल का इंतज़ार", "Bill aa gaya": "बिल आ गया", "Confirm": "कन्फ़र्म",
    "Pickup ready": "पिकअप तैयार", "Delivery pe": "डिलीवरी पर", "Poora hua": "पूरा हुआ", "Cancel": "कैंसल",
    "Dukaan ne mana kiya": "दुकान ने मना किया", "Naya order": "नया ऑर्डर",
    "Customer ne cancel kiya": "ग्राहक ने कैंसल किया", "Aapne mana kiya": "आपने मना किया",
    "💬 Customer ne rate par comment kiya": "💬 ग्राहक ने रेट पर कमेंट किया",
    "📲 UPI se pay kiya": "📲 UPI से पे किया",
    "Rate bharo aur bill bhejo": "रेट भरो और बिल भेजो",
    "Bill (customer ke jawab ka intezaar)": "बिल (ग्राहक के जवाब का इंतज़ार)",
    "Nahi hai": "नहीं है",
    "Customer ko kya option dena hai?": "ग्राहक को क्या विकल्प देना है?",
    "🚚 Home delivery": "🚚 होम डिलीवरी", "🚶 Pickup": "🚶 पिकअप",
    "Delivery charge (₹)": "डिलीवरी चार्ज (₹)",
    "Bill par note (optional)": "बिल पर नोट (वैकल्पिक)", "Jaise: aaj aata kam hai": "जैसे: आज आटा कम है",
    "📤 Bill bhejo": "📤 बिल भेजो", "📤 Bill update karke bhejo": "📤 बिल अपडेट करके भेजो",
    "Order mana karo": "ऑर्डर मना करो",
    "Bill customer ko bhej diya ✓": "बिल ग्राहक को भेज दिया ✓",
    "Kam se kam ek saman ka rate bharo.": "कम से कम एक सामान का रेट भरो।",
    "Ye order mana karna hai? Customer ko bata diya jayega.": "यह ऑर्डर मना करना है? ग्राहक को बता दिया जाएगा।",
    "Haan, mana karo": "हाँ, मना करो", "Order mana kar diya": "ऑर्डर मना कर दिया",
    "Jawab likho (optional)": "जवाब लिखो (वैकल्पिक)",
    "Customer ka kul bill": "ग्राहक का कुल बिल", "Kul bill": "कुल बिल", "Saman ka total": "सामान का कुल",
    "Platform fee (customer ki)": "प्लेटफ़ॉर्म फ़ीस (ग्राहक की)", "Platform fee (per order)": "प्लेटफ़ॉर्म फ़ीस (प्रति ऑर्डर)", "Platform fee": "प्लेटफ़ॉर्म फ़ीस",
    "Platform ko dena:": "प्लेटफ़ॉर्म को देना:", "Platform ko dena": "प्लेटफ़ॉर्म को देना", "Platform kamai": "प्लेटफ़ॉर्म कमाई",
    "(customer fee": "(ग्राहक फ़ीस", "+ aapki fee": "+ आपकी फ़ीस",
    "Tarika": "तरीका", "🚚 Ghar tak delivery": "🚚 घर तक डिलीवरी", "🚶 Dukaan se pickup": "🚶 दुकान से पिकअप", "🚶 Sirf pickup": "🚶 सिर्फ़ पिकअप",
    "Payment": "पेमेंट", "UPI status": "UPI स्थिति", "✓ Customer ne pay kiya": "✓ ग्राहक ने पे किया", "Abhi pay nahi kiya": "अभी पे नहीं किया",
    "Delivery kaun karega? (optional)": "डिलीवरी कौन करेगा? (वैकल्पिक)", "Jaise: Raju": "जैसे: राजू",
    "🚚 Delivery pe nikla": "🚚 डिलीवरी पर निकला", "🛍️ Pickup ke liye ready": "🛍️ पिकअप के लिए तैयार",
    "💰 Paisa mil gaya": "💰 पैसा मिल गया", "✅ Order poora hua": "✅ ऑर्डर पूरा हुआ",
    "Refund note karo": "रिफ़ंड नोट करो", "Refund note:": "रिफ़ंड नोट:", "Refund:": "रिफ़ंड:",
    "Paisa customer ko aap seedha lauta do. Yahan sirf hisaab ke liye likho.": "पैसा ग्राहक को आप सीधा लौटा दो। यहाँ सिर्फ़ हिसाब के लिए लिखो।",
    "Raqam (₹)": "रकम (₹)", "Raqam likho.": "रकम लिखो।", "Kaaran": "कारण", "Kaaran:": "कारण:", "Jaise: rate galat laga tha": "जैसे: रेट गलत लगा था",
    "Refund note ho gaya ✓": "रिफ़ंड नोट हो गया ✓", "Status badal gaya ✓": "स्टेटस बदल गया ✓",
    "Order ka safar": "ऑर्डर का सफ़र",
    "Order aaya": "ऑर्डर आया", "Aapne bill bheja": "आपने बिल भेजा", "Bill update kiya": "बिल अपडेट किया", "Customer ne comment kiya": "ग्राहक ने कमेंट किया", "Customer ne confirm kiya": "ग्राहक ने कन्फ़र्म किया", "Customer ne UPI se pay kiya": "ग्राहक ने UPI से पे किया", "Refund note hua": "रिफ़ंड नोट हुआ", "Order poora hua": "ऑर्डर पूरा हुआ",
    "Delivery pe nikla": "डिलीवरी पर निकला",
    "Profile photo badlo": "प्रोफ़ाइल फ़ोटो बदलो", "📷 Profile photo badlo": "📷 प्रोफ़ाइल फ़ोटो बदलो", "Profile photo lag gayi ✓": "प्रोफ़ाइल फ़ोटो लग गई ✓",
    "🗑️ Mera account aur data delete karo": "🗑️ मेरा अकाउंट और डेटा डिलीट करो", "Haan, sab delete karo": "हाँ, सब डिलीट करो", "Haan, delete": "हाँ, डिलीट",
    "Account delete karne par aapka profile, dukaan, photos, ads aur login hamesha ke liye hat jayenge. Purane orders dukaandaar ke record mein bina naam-number ke rahenge. Ye wapas nahi hoga. Pakka delete karna hai?": "अकाउंट डिलीट करने पर आपकी प्रोफ़ाइल, दुकान, फ़ोटो, विज्ञापन और लॉगिन हमेशा के लिए हट जाएँगे। पुराने ऑर्डर दुकानदार के रिकॉर्ड में बिना नाम-नंबर के रहेंगे। यह वापस नहीं होगा। पक्का डिलीट करना है?",
    "Aakhri baar puchh rahe hain — account delete kar dein?": "आख़िरी बार पूछ रहे हैं — अकाउंट डिलीट कर दें?", "Aapka account aur data delete ho gaya ✓": "आपका अकाउंट और डेटा डिलीट हो गया ✓",
    "Order confirm ho gaya ✓ Delivery location dukaandaar ko bhej di": "ऑर्डर कन्फ़र्म हो गया ✓ डिलीवरी लोकेशन दुकानदार को भेज दी", "🧭 Pate se Map me dhoondo": "🧭 पते से मैप में ढूँढो",
    "📲 UPI app kholo (sab apps)": "📲 UPI ऐप खोलो (सभी ऐप)", "Ye app phone mein nahi hai. Doosra chuno ya UPI ID copy karo.": "यह ऐप फ़ोन में नहीं है। दूसरा चुनो या UPI ID कॉपी करो।",
    "📤 LoKalLo app share karo": "📤 LoKalLo ऐप शेयर करो",
    "✉️ Contact Support: spywellinfotech@gmail.com": "✉️ सपोर्ट से संपर्क: spywellinfotech@gmail.com", "Madad chahiye?": "मदद चाहिए?",
    "Session khatam ho gaya. Dobara login karo.": "सेशन ख़त्म हो गया। दोबारा लॉगिन करो।",
    "Naya order aaya — dukaandaar mode khul gaya 🏪": "नया ऑर्डर आया — दुकानदार मोड खुल गया 🏪",
    "Dukaan ko dena": "दुकान को देना", "Customer se lena hai": "ग्राहक से लेना है", "Maine fee pay kar di": "मैंने फ़ीस पे कर दी", "Shukriya ✓": "शुक्रिया ✓",
    "Naye user offer: platform fee FREE": "नए यूज़र ऑफ़र: प्लेटफ़ॉर्म फ़ीस फ़्री", "Naye dukaandaar offer: platform fee FREE": "नए दुकानदार ऑफ़र: प्लेटफ़ॉर्म फ़ीस फ़्री",
    "Is order par platform fee FREE hai.": "इस ऑर्डर पर प्लेटफ़ॉर्म फ़ीस फ़्री है।", "Ye fee dukaan ko nahi, LoKalLo ko alag UPI se deni hai.": "यह फ़ीस दुकान को नहीं, LoKalLo को अलग UPI से देनी है।",
    "Naye user ko free (din) — badha sakte ho": "नए यूज़र को फ़्री (दिन) — बढ़ा सकते हो", "Aapki UPI ID (customer fee yahin aayegi)": "आपकी UPI ID (ग्राहक की फ़ीस यहीं आएगी)", "Save karo": "सेव करो", "Save ho gaya ✓": "सेव हो गया ✓",
    "din baaki": "दिन बाकी", "Platform fee (alag UPI se, aap LoKalLo ko do)": "प्लेटफ़ॉर्म फ़ीस (अलग UPI से, आप LoKalLo को दो)",
    "Aapki platform fee:": "आपकी प्लेटफ़ॉर्म फ़ीस:", "(customer apni fee LoKalLo ko alag se deta hai)": "(ग्राहक अपनी फ़ीस LoKalLo को अलग से देता है)",
    "Apne Google account se login karo. Alag se PIN ya password nahi chahiye.": "अपने Google अकाउंट से लॉगिन करो। अलग से PIN या पासवर्ड नहीं चाहिए।",
    "Google login phone ke LoKalLo app mein chalta hai.": "Google लॉगिन फ़ोन के LoKalLo ऐप में चलता है।", "Google login abhi server par chalu nahi hai. Thodi der baad koshish karo.": "Google लॉगिन अभी सर्वर पर चालू नहीं है। थोड़ी देर बाद कोशिश करो।",
    "🔔 Notifications": "🔔 सूचनाएँ", "Abhi koi notification nahi.": "अभी कोई सूचना नहीं।", "Saaf karo": "साफ़ करो", "Band karo": "बंद करो", "ki dukaan kholo": "की दुकान खोलो",
    "Dukaan kab khulti hai": "दुकान कब खुलती है", "Kab band hoti hai": "कब बंद होती है",
    "🎁 Refer & Earn / Wallet": "🎁 रेफ़र और कमाओ / वॉलेट", "🎁 Refer & Earn": "🎁 रेफ़र और कमाओ", "Wallet balance": "वॉलेट बैलेंस", "Aapka referral code": "आपका रेफ़रल कोड",
    "📤 Dost ko code bhejo": "📤 दोस्त को कोड भेजो", "Dost jude": "दोस्त जुड़े", "Reward mila": "रिवॉर्ड मिला", "Intezaar me": "इंतज़ार में", "Hisaab": "हिसाब", "Abhi koi lenden nahi.": "अभी कोई लेन-देन नहीं।",
    "Referral code (agar kisi dost ne diya ho)": "रेफ़रल कोड (अगर किसी दोस्त ने दिया हो)", "Referral code lag gaya ✓": "रेफ़रल कोड लग गया ✓",
    "✓ Wallet chalu hai: ab aapki platform fee yahin se apne aap kategi.": "✓ वॉलेट चालू है: अब आपकी प्लेटफ़ॉर्म फ़ीस यहीं से अपने आप कटेगी।",
    "jama. Abhi": "जमा। अभी", "aur — phir ye wallet platform fee me apne aap adjust hoga.": "और — फिर यह वॉलेट प्लेटफ़ॉर्म फ़ीस में अपने आप एडजस्ट होगा।",
    "Har dost jo is code se judkar apna pehla order poora kare, uske liye aapko": "हर दोस्त जो इस कोड से जुड़कर अपना पहला ऑर्डर पूरा करे, उसके लिए आपको", "milenge.": "मिलेंगे।",
    "aapke wallet se kat gayi. Kuch dena nahi.": "आपके वॉलेट से कट गई। कुछ देना नहीं।", "Wallet se": "वॉलेट से", "kat chuka hai.": "कट चुका है।",
    "Naya order aaya 🛒": "नया ऑर्डर आया 🛒", "Online Order aaya hai 🛒": "ऑनलाइन ऑर्डर आया है 🛒", "Order confirm ✓": "ऑर्डर कन्फ़र्म ✓", "Customer ka comment 💬": "ग्राहक का कमेंट 💬", "UPI payment 📲": "UPI पेमेंट 📲", "Bill aa gaya 🧾": "बिल आ गया 🧾", "Pickup ready 🛍️": "पिकअप तैयार 🛍️", "Delivery pe nikla 🚚": "डिलीवरी पर निकला 🚚", "Order poora hua ✅": "ऑर्डर पूरा हुआ ✅",
    "ne bill bheja": "ने बिल भेजा", "ke rate par": "के रेट पर", "ka customer ne pay kiya": "का ग्राहक ने पे किया", "ka order #": "का ऑर्डर #",
    "Saman aur rate": "सामान और रेट", "＋ Saman jodo": "＋ सामान जोड़ो", "Saman jodo": "सामान जोड़ो",
    "Yahan rate ek baar daalo. Bill banate waqt rate apne aap bhar jayega (aap badal sakte ho).": "यहाँ रेट एक बार डालो। बिल बनाते समय रेट अपने आप भर जाएगा (आप बदल सकते हो)।",
    "Abhi koi saman nahi.": "अभी कोई सामान नहीं।", "Stock mein hai": "स्टॉक में है", "Hai": "है", "Khatam": "खत्म",
    "Rate save ✓": "रेट सेव ✓", "Haan, hatao": "हाँ, हटाओ", "hata dein?": "हटा दें?",
    "Tick karo aur rate daalo.": "टिक करो और रेट डालो।", "Saman tick karke rate daalo": "सामान टिक करके रेट डालो",
    "Pehle se list mein hai": "पहले से लिस्ट में है", "Naam": "नाम",
    "Jud gaya ✓ — matra chuno": "जुड़ गया ✓ — मात्रा चुनो", "Jud gaya ✓": "जुड़ गया ✓",
    "Rate likho.": "रेट लिखो।", "Saman ka naam likho.": "सामान का नाम लिखो।", "saman jud gaye ✓": "सामान जुड़ गए ✓", "Save karo": "सेव करो",
    "Ads / Offers": "विज्ञापन / ऑफ़र",
    "Aapki dukaan ke 5 km ke customer ko home screen par dikhega. Photo ya chhota video lagao.": "आपकी दुकान के 5 km के ग्राहकों को होम स्क्रीन पर दिखेगा। फ़ोटो या छोटा वीडियो लगाओ।",
    "Title *": "शीर्षक *", "Jaise: Diwali Sale": "जैसे: दिवाली सेल", "Kya offer hai?": "क्या ऑफ़र है?", "Photo ya video": "फ़ोटो या वीडियो",
    "＋ Photo / video chuno": "＋ फ़ोटो / वीडियो चुनो", "📢 Ad lagao": "📢 विज्ञापन लगाओ", "Chal rahe ads": "चल रहे विज्ञापन",
    "Abhi koi ad nahi.": "अभी कोई विज्ञापन नहीं।", "Band karo": "बंद करो", "Ad lag gaya ✓": "विज्ञापन लग गया ✓", "Ad band ho gaya": "विज्ञापन बंद हो गया",
    "Ad ka title likho.": "विज्ञापन का शीर्षक लिखो।", "Video 50 MB se chhota chuno.": "वीडियो 50 MB से छोटा चुनो।",
    "Bikri report": "बिक्री रिपोर्ट", "Pichhle 30 din (poore hue orders)": "पिछले 30 दिन (पूरे हुए ऑर्डर)",
    "Kul bikri": "कुल बिक्री", "Refund": "रिफ़ंड", "Din": "दिन", "Bikri": "बिक्री",
    "Abhi koi poora hua order nahi.": "अभी कोई पूरा हुआ ऑर्डर नहीं।",
    "Dukaan ki photos": "दुकान की फ़ोटो", "Dukaan ka UPI QR": "दुकान का UPI QR",
    "Dukaan register karo": "दुकान रजिस्टर करो", "🏪 Apni dukaan register karo": "🏪 अपनी दुकान रजिस्टर करो", "Apni dukaan register karo": "अपनी दुकान रजिस्टर करो",
    "Dukaan ka naam *": "दुकान का नाम *", "Jaise: Gupta Kirana Store": "जैसे: गुप्ता किराना स्टोर", "Malik ka naam": "मालिक का नाम", "Aapka naam": "आपका नाम",
    "Dukaan ka mobile number *": "दुकान का मोबाइल नंबर *", "Dukaan ka type * (ek ya zyada)": "दुकान का प्रकार * (एक या ज़्यादा)",
    "Dukaan ki location *": "दुकान की लोकेशन *", "Dukaan ka pata *": "दुकान का पता *",
    "📍 GPS se dukaan ki location lo": "📍 GPS से दुकान की लोकेशन लो",
    "Customer aapko tab dekhenge jab dukaan 500 m se 4 km ke andar hogi. Isliye dukaan par khade hoke 📍 dabao.": "ग्राहक आपको तभी देखेंगे जब दुकान 500 m से 4 km के अंदर होगी। इसलिए दुकान पर खड़े होकर 📍 दबाओ।",
    "Kitni door tak delivery?": "कितनी दूर तक डिलीवरी?", "Kam se kam order (₹)": "कम से कम ऑर्डर (₹)", "Kam se kam order": "कम से कम ऑर्डर",
    "Itne ₹ se upar delivery free (optional)": "इतने ₹ से ऊपर डिलीवरी फ़्री (वैकल्पिक)", "Jaise 500": "जैसे 500",
    "Delivery ke samay": "डिलीवरी का समय", "Subah 8-12, Shaam 5-9": "सुबह 8-12, शाम 5-9",
    "UPI ID": "UPI ID", "UPI ID:": "UPI ID:", "UPI QR code (optional)": "UPI QR कोड (वैकल्पिक)", "＋ UPI QR ki photo lagao": "＋ UPI QR की फ़ोटो लगाओ",
    "Customer bill par seedha aapki UPI ID ko pay kar sakega.": "ग्राहक बिल पर सीधा आपकी UPI ID पर पे कर सकेगा।",
    "6 tak. Customer ko dukaan ke card par dikhengi.": "6 तक। ग्राहक को दुकान के कार्ड पर दिखेंगी।",
    "Dukaan save ho gayi ✓": "दुकान सेव हो गई ✓", "Photo upload ho rahi hai…": "फ़ोटो अपलोड हो रही है…", "Photo lag gayi ✓": "फ़ोटो लग गई ✓", "QR upload ho raha hai…": "QR अपलोड हो रहा है…", "QR lag gaya ✓": "QR लग गया ✓",
    "✏️ Jaankari badlo": "✏️ जानकारी बदलो", "📍 Meri location GPS se update karo": "📍 मेरी लोकेशन GPS से अपडेट करो",
    "🏪 Dukaandaar mode": "🏪 दुकानदार मोड", "🛍️ Customer mode mein jao": "🛍️ ग्राहक मोड में जाओ", "🛡️ Admin panel": "🛡️ एडमिन पैनल", "🛡️ Admin": "🛡️ एडमिन",
    "Haan, logout": "हाँ, लॉगआउट", "Logout karna hai?": "लॉगआउट करना है?", "Logout": "लॉगआउट",
    "Mera profile": "मेरा प्रोफ़ाइल", "Dukaan abhi band hai.": "दुकान अभी बंद है।",
    "Dukaan band 🔴": "दुकान बंद 🔴", "Dukaan khul gayi 🟢": "दुकान खुल गई 🟢",
    "Saari dukaanein": "सारी दुकानें", "Block karo": "ब्लॉक करो", "Chalu karo": "चालू करो", "Active dukaan": "सक्रिय दुकानें", "Customer se (₹)": "ग्राहक से (₹)", "Shopkeeper se (₹)": "दुकानदार से (₹)",
    "Fee save karo": "फ़ीस सेव करो", "Fee badal gayi ✓": "फ़ीस बदल गई ✓", "Fee 0 se 100 ke beech likho.": "फ़ीस 0 से 100 के बीच लिखो।", "Poore": "पूरे", "Ho gaya ✓": "हो गया ✓",
    "Bill dekho aur confirm karo →": "बिल देखो और कन्फ़र्म करो →",
    "⏳ Dukaandaar aapki list dekh kar bill bana raha hai. Bill aate hi yahan dikhega.": "⏳ दुकानदार आपकी लिस्ट देखकर बिल बना रहा है। बिल आते ही यहाँ दिखेगा।",
    "Aapki list": "आपकी लिस्ट", "Bill": "बिल",
    "Rate par comment": "रेट पर कमेंट", "Jaise: pichli baar ₹55 tha": "जैसे: पिछली बार ₹55 था", "Comment likho.": "कमेंट लिखो।",
    "Dukaandaar ko bhej diya ✓": "दुकानदार को भेज दिया ✓", "Dukaandaar ko bata diya ✓": "दुकानदार को बता दिया ✓",
    "Delivery ka pata *": "डिलीवरी का पता *", "Delivery / pickup par": "डिलीवरी / पिकअप पर", "Seedha dukaan ko": "सीधा दुकान को",
    "📲 UPI se pay": "📲 UPI से पे", "💵 Cash": "💵 कैश", "Cash": "कैश",
    "✅ Confirm karo": "✅ कन्फ़र्म करो", "Order confirm karo": "ऑर्डर कन्फ़र्म करो",
    "Confirm ke baad order cancel nahi hota. Rate galat lage to pehle 💬 se comment karo, ya dukaandaar se baat karke refund lo.": "कन्फ़र्म के बाद ऑर्डर कैंसल नहीं होता। रेट गलत लगे तो पहले 💬 से कमेंट करो, या दुकानदार से बात करके रिफ़ंड लो।",
    "Order confirm ho gaya ✓": "ऑर्डर कन्फ़र्म हो गया ✓",
    "UPI se": "UPI से", "pay karo": "पे करो", "📲 UPI app kholo (PhonePe / GPay / Paytm)": "📲 UPI ऐप खोलो (PhonePe / GPay / Paytm)",
    "Ya dusre phone se ye QR scan karo": "या दूसरे फ़ोन से यह QR स्कैन करो",
    "Maine pay kar diya": "मैंने पे कर दिया", "✓ Aapne UPI se pay kar diya. Dukaandaar ko dikh raha hai.": "✓ आपने UPI से पे कर दिया। दुकानदार को दिख रहा है।",
    "Order cancel karo": "ऑर्डर कैंसल करो", "Ye order cancel karna hai?": "यह ऑर्डर कैंसल करना है?", "Haan, cancel": "हाँ, कैंसल", "Order cancel ho gaya": "ऑर्डर कैंसल हो गया",
    "Aapne ye order cancel kiya.": "आपने यह ऑर्डर कैंसल किया।", "Dukaandaar ne ye order nahi liya.": "दुकानदार ने यह ऑर्डर नहीं लिया।",
    "🔁 Yehi saman dobara mangao": "🔁 यही सामान दोबारा मंगाओ", "ko dobara bhejna hai?": "को दोबारा भेजना है?", "Haan, bhejo": "हाँ, भेजो",
    "📞 Call": "📞 कॉल", "📞 Dukaan ko call": "📞 दुकान को कॉल", "💬 WhatsApp": "💬 WhatsApp", "🗺️ Map": "🗺️ मैप",
    "Dukaan ko call": "दुकान को कॉल",
    "Customer:": "ग्राहक:", "Aap:": "आप:", "Dukaan:": "दुकान:", "Note:": "नोट:", "Aapka note:": "आपका नोट:",
    "Delivery": "डिलीवरी", "Pickup": "पिकअप", "Free": "फ़्री", "Min": "न्यूनतम",
    "Order #": "ऑर्डर #", "Order": "ऑर्डर",
    "Ruko…": "रुको…", "Haan": "हाँ", "Nahi": "नहीं",
    "DEMO": "डेमो", "abhi": "अभी", "Kam": "कम", "Zyada": "ज़्यादा", "Hatao": "हटाओ",
    "Jodo": "जोड़ो", "📋 UPI ID copy karo": "📋 UPI ID कॉपी करो", "UPI ID copy ho gayi ✓": "UPI ID कॉपी हो गई ✓", "Raqam": "रकम", "Phone mein koi UPI app nahi mila. UPI ID copy karke apne UPI app mein pay karo.": "फ़ोन में कोई UPI ऐप नहीं मिला। UPI ID कॉपी करके अपने UPI ऐप में पे करो।", "UPI app nahi khul paya. UPI ID copy karke pay karo.": "UPI ऐप नहीं खुल पाया। UPI ID कॉपी करके पे करो।", "📍 Delivery location GPS se lo": "📍 डिलीवरी लोकेशन GPS से लो", "✓ Abhi ki location li gayi": "✓ अभी की लोकेशन ली गई", "Bina GPS ke aapke profile ki location use hogi.": "बिना GPS के आपके प्रोफ़ाइल की लोकेशन इस्तेमाल होगी।", "🧭 Delivery location par chalo (Map)": "🧭 डिलीवरी लोकेशन पर चलो (मैप)", "Pata": "पता", "🖨️ Bill print karo": "🖨️ बिल प्रिंट करो", "⚙️ Printer chuno": "⚙️ प्रिंटर चुनो", "Printer chuno": "प्रिंटर चुनो",
    "Pehle printer ko phone ki Bluetooth settings mein pair karo, phir yahan chuno.": "पहले प्रिंटर को फ़ोन की ब्लूटूथ सेटिंग्स में पेयर करो, फिर यहाँ चुनो।",
    "58 mm (chhota)": "58 mm (छोटा)", "80 mm (bada)": "80 mm (बड़ा)",
    "Koi paired printer nahi mila. Phone Settings → Bluetooth mein printer pair karo.": "कोई पेयर्ड प्रिंटर नहीं मिला। फ़ोन सेटिंग्स → ब्लूटूथ में प्रिंटर पेयर करो।",
    "Printer chun liya ✓": "प्रिंटर चुन लिया ✓", "Print ho raha hai…": "प्रिंट हो रहा है…", "Bill print ho gaya ✓": "बिल प्रिंट हो गया ✓",
    "Print nahi hua. Printer on aur paas hai? Dobara printer chuno.": "प्रिंट नहीं हुआ। प्रिंटर चालू और पास है? दोबारा प्रिंटर चुनो।",
    "Print phone ke LoKalLo app mein chalta hai.": "प्रिंट फ़ोन के LoKalLo ऐप में चलता है।", "Bluetooth ki permission do, phir dobara dabao.": "ब्लूटूथ की अनुमति दो, फिर दोबारा दबाओ।",
    "Bluetooth chalu karo.": "ब्लूटूथ चालू करो।", "Is phone mein Bluetooth nahi hai.": "इस फ़ोन में ब्लूटूथ नहीं है।", "Printer list nahi mili. Dobara koshish karo.": "प्रिंटर लिस्ट नहीं मिली। दोबारा कोशिश करो।", "UPI se payment": "UPI से पेमेंट", "Photo": "फ़ोटो", "packet": "पैकेट", "Delivery lene par customer ka total:": "डिलीवरी लेने पर ग्राहक का कुल:",
    "Dukaan": "दुकान", "Photo": "फ़ोटो", "Andar se": "अंदर से"
  };
  var CAT = {"Gehu Aata": "गेहूँ का आटा", "Chakki Aata": "चक्की आटा", "Maida": "मैदा", "Suji (Rava)": "सूजी (रवा)", "Besan": "बेसन", "Basmati Chawal": "बासमती चावल", "Chawal (Sada)": "चावल (सादा)", "Poha": "पोहा", "Dalia": "दलिया", "Makka Aata": "मक्का आटा", "Bajra Aata": "बाजरा आटा", "Arhar / Toor Daal": "अरहर / तूर दाल", "Moong Daal": "मूँग दाल", "Masoor Daal": "मसूर दाल", "Chana Daal": "चना दाल", "Urad Daal": "उड़द दाल", "Rajma": "राजमा", "Kabuli Chana": "काबुली चना", "Kala Chana": "काला चना", "Sabut Moong": "साबुत मूँग", "Sarson Tel": "सरसों तेल", "Refined Tel": "रिफ़ाइंड तेल", "Desi Ghee": "देसी घी", "Vanaspati": "वनस्पति", "Mungfali Tel": "मूँगफली तेल", "Haldi": "हल्दी", "Lal Mirch": "लाल मिर्च", "Dhaniya Powder": "धनिया पाउडर", "Jeera": "जीरा", "Garam Masala": "गरम मसाला", "Rai / Sarson": "राई / सरसों", "Kali Mirch": "काली मिर्च", "Ajwain": "अजवाइन", "Hing": "हींग", "Methi Dana": "मेथी दाना", "Elaichi": "इलायची", "Laung": "लौंग", "Sabzi Masala": "सब्ज़ी मसाला", "Chhole Masala": "छोले मसाला", "Namak": "नमक", "Cheeni": "चीनी", "Gud": "गुड़", "Kala Namak": "काला नमक", "Mishri": "मिश्री", "Chai Patti": "चाय पत्ती", "Coffee": "कॉफ़ी", "Bournvita / Horlicks": "बॉर्नविटा / हॉर्लिक्स", "Biscuit": "बिस्कुट", "Namkeen": "नमकीन", "Maggi / Noodles": "मैगी / नूडल्स", "Chips": "चिप्स", "Cornflakes": "कॉर्नफ़्लेक्स", "Sewai": "सेवइयाँ", "Macaroni / Pasta": "मैकरोनी / पास्ता", "Achaar": "अचार", "Sauce / Ketchup": "सॉस / केचप", "Jam": "जैम", "Kaju": "काजू", "Badam": "बादाम", "Kishmish": "किशमिश", "Akhrot": "अखरोट", "Makhana": "मखाना", "Mungfali": "मूँगफली", "Kapde ka Sabun": "कपड़े का साबुन", "Washing Powder": "वॉशिंग पाउडर", "Bartan Sabun / Vim": "बर्तन साबुन / विम", "Phenyl": "फिनाइल", "Harpic": "हार्पिक", "Jhaadu": "झाड़ू", "Pocha": "पोछा", "Agarbatti": "अगरबत्ती", "Machis": "माचिस", "Nahane ka Sabun": "नहाने का साबुन", "Shampoo": "शैम्पू", "Toothpaste": "टूथपेस्ट", "Toothbrush": "टूथब्रश", "Baalon ka Tel": "बालों का तेल", "Cream / Lotion": "क्रीम / लोशन", "Shaving Blade": "शेविंग ब्लेड", "Sanitary Pad": "सैनिटरी पैड", "Bhains ka Doodh": "भैंस का दूध", "Gaay ka Doodh": "गाय का दूध", "Packet Doodh (Full Cream)": "पैकेट दूध (फ़ुल क्रीम)", "Packet Doodh (Toned)": "पैकेट दूध (टोन्ड)", "Dahi": "दही", "Paneer": "पनीर", "Chhachh": "छाछ", "Lassi": "लस्सी", "Khoya / Mawa": "खोया / मावा", "Makhan (Safed)": "मक्खन (सफ़ेद)", "Butter (Packet)": "बटर (पैकेट)", "Malai": "मलाई", "Cheese": "चीज़", "Ande": "अंडे", "Bread (Safed)": "ब्रेड (सफ़ेद)", "Brown Bread": "ब्राउन ब्रेड", "Pav": "पाव", "Bun": "बन", "Rusk": "रस्क", "Cake (Slice)": "केक (स्लाइस)", "Cake (Pound)": "केक (पाउंड)", "Birthday Cake": "बर्थडे केक", "Pastry": "पेस्ट्री", "Muffin": "मफ़िन", "Nankhatai": "नानखटाई", "Cookies": "कुकीज़", "Khari": "खारी", "Toast": "टोस्ट", "Patties": "पैटीज़", "Puff": "पफ़", "Pizza Base": "पिज़्ज़ा बेस", "Burger": "बर्गर", "Aloo": "आलू", "Pyaaz": "प्याज़", "Tamatar": "टमाटर", "Hari Mirch": "हरी मिर्च", "Adrak": "अदरक", "Lehsun": "लहसुन", "Dhaniya Patta": "धनिया पत्ता", "Nimbu": "नींबू", "Palak": "पालक", "Bhindi": "भिंडी", "Lauki": "लौकी", "Tori": "तोरी", "Karela": "करेला", "Baingan": "बैंगन", "Phool Gobhi": "फूलगोभी", "Patta Gobhi": "पत्तागोभी", "Shimla Mirch": "शिमला मिर्च", "Matar": "मटर", "Kheera": "खीरा", "Gajar": "गाजर", "Mooli": "मूली", "Kaddu": "कद्दू", "Arbi": "अरबी", "Methi": "मेथी", "Pudina": "पुदीना", "Kela": "केला", "Seb": "सेब", "Santra": "संतरा", "Angoor": "अंगूर", "Papita": "पपीता", "Anaar": "अनार", "Aam": "आम", "Tarbooz": "तरबूज़", "Kharbooja": "खरबूज़ा", "Amrood": "अमरूद", "Chiku": "चीकू", "Nariyal": "नारियल", "Mausambi": "मौसमी", "Ananas": "अनानास", "Rasgulla": "रसगुल्ला", "Gulab Jamun": "गुलाब जामुन", "Barfi": "बर्फ़ी", "Kaju Katli": "काजू कतली", "Laddu (Besan)": "लड्डू (बेसन)", "Laddu (Motichoor)": "लड्डू (मोतीचूर)", "Peda": "पेड़ा", "Jalebi": "जलेबी", "Imarti": "इमरती", "Rasmalai": "रसमलाई", "Soan Papdi": "सोन पापड़ी", "Milk Cake": "मिल्क केक", "Kalakand": "कलाकंद", "Balushahi": "बालूशाही", "Samosa": "समोसा", "Kachori": "कचौड़ी", "Pakode": "पकौड़े", "Dhokla": "ढोकला", "Namkeen (Khula)": "नमकीन (खुला)", "Mathri": "मठरी", "Rabri": "रबड़ी", "Kheer": "खीर", "Kulfi": "कुल्फ़ी", "Shrikhand": "श्रीखंड", "Aata-Chawal": "आटा-चावल", "Biscuit-Cookies": "बिस्कुट-कुकीज़", "Bread": "ब्रेड", "Cake": "केक", "Chai-Coffee": "चाय-कॉफ़ी", "Daal": "दाल", "Dahi-Paneer": "दही-पनीर", "Doodh": "दूध", "Doodh ki Cheezein": "दूध की चीज़ें", "Dry Fruits": "सूखे मेवे", "Fal": "फल", "Hari Sabzi": "हरी सब्ज़ी", "Makhan-Ghee": "मक्खन-घी", "Masale": "मसाले", "Mithai": "मिठाई", "Nahana-Dhona": "नहाना-धोना", "Namak-Cheeni": "नमक-चीनी", "Namkeen-Nashta": "नमकीन-नाश्ता", "Nashta": "नाश्ता", "Roz ki Sabzi": "रोज़ की सब्ज़ी", "Saaf-Safai": "साफ़-सफ़ाई", "Snacks": "स्नैक्स", "Tel-Ghee": "तेल-घी"};
  for (var ck in CAT) if (!(ck in D)) D[ck] = CAT[ck];
  var KEYS = Object.keys(D).sort(function (a, b) { return b.length - a.length; });
  var RX = [
    [/(\d+) min pehle/g, "$1 मिनट पहले"], [/(\d+) ghante pehle/g, "$1 घंटे पहले"], [/(\d+) dukaanein/g, "$1 दुकानें"], [/(\d+) order\b/g, "$1 ऑर्डर"],
    [/\bsaman chune\b/g, "सामान चुने"], [/(\d+(?:\.\d+)?) packet\b/g, "$1 पैकेट"], [/\/packet\b/g, "/पैकेट"], [/(\d) pcs\b/g, "$1 नग"], [/\/pc\b/g, "/नग"],
    [/(\d+) ghante/g, "$1 घंटे"], [/\bMin\b/g, "न्यूनतम"], [/\b[Ff]ree\b/g, "फ़्री"], [/\bJan\b/, "जन"], [/\bFeb\b/, "फ़र"], [/\bMar\b/, "मार्च"], [/\bApr\b/, "अप्रै"], [/\bMay\b/, "मई"], [/\bJun\b/, "जून"], [/\bJul\b/, "जुला"], [/\bAug\b/, "अग"], [/\bSep\b/, "सित"], [/\bOct\b/, "अक्टू"], [/\bNov\b/, "नव"], [/\bDec\b/, "दिस"]
  ];
  function t(s) {
    if (!s || !/[A-Za-z]/.test(s)) return s;
    var tr = s.trim(), lead = s.slice(0, s.length - s.replace(/^\s+/, "").length), trail = s.slice(s.replace(/\s+$/, "").length);
    if (D[tr] !== undefined) return lead + D[tr] + trail;
    if (/^(Kirana|Dairy|Bakery|Fal-Sabzi|Mithai)( · (Kirana|Dairy|Bakery|Fal-Sabzi|Mithai))*$/.test(tr)) return lead + tr.split(" · ").map(function (x) { return D[x]; }).join(" · ") + trail;
    var em = tr.match(/^(\S+) (Kirana|Dairy|Bakery|Fal-Sabzi|Mithai)$/); if (em) return lead + em[1] + " " + D[em[2]] + trail;
    var o = s, i, k;
    for (i = 0; i < KEYS.length; i++) { k = KEYS[i]; if (k.length >= 7 && o.indexOf(k) > -1) o = o.split(k).join(D[k]); }
    for (i = 0; i < RX.length; i++) o = o.replace(RX[i][0], RX[i][1]);
    return o;
  }
  LK.t = function (s) { return LK.hi ? t(s) : s; };
  var ATTR = ["placeholder", "title", "aria-label"], busy = false;
  function tx(node) {
    if (node.nodeType === 3) {
      var p = node.parentNode; if (p && /^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)) return;
      if (node.__o === undefined) { var n = t(node.nodeValue); if (n !== node.nodeValue) { node.__o = node.nodeValue; node.nodeValue = n; } }
    } else if (node.nodeType === 1) {
      if (/^(SCRIPT|STYLE)$/.test(node.nodeName)) return;
      ATTR.forEach(function (a) { if (node.hasAttribute && node.hasAttribute(a) && !node["__o_" + a]) { var v = node.getAttribute(a), n = t(v); if (n !== v) { node["__o_" + a] = v; node.setAttribute(a, n); } } });
      for (var c = node.firstChild; c; c = c.nextSibling) tx(c);
    }
  }
  function undo(node) {
    if (node.nodeType === 3) { if (node.__o !== undefined) { node.nodeValue = node.__o; delete node.__o; } }
    else if (node.nodeType === 1) {
      ATTR.forEach(function (a) { if (node["__o_" + a]) { node.setAttribute(a, node["__o_" + a]); delete node["__o_" + a]; } });
      for (var c = node.firstChild; c; c = c.nextSibling) undo(c);
    }
  }
  var mo = new MutationObserver(function (ml) {
    if (!LK.hi || busy) return; busy = true;
    ml.forEach(function (m) {
      if (m.type === "childList") m.addedNodes.forEach(tx);
      else if (m.type === "characterData") { delete m.target.__o; tx(m.target); }
      else if (m.type === "attributes") { tx(m.target); }
    });
    busy = false;
  });
  function arm() { ["top", "screen", "nav", "toast", "modal"].forEach(function (id) { var e = document.getElementById(id); if (e) mo.observe(e, { childList: true, subtree: true, characterData: true }); }); }
  LK.setLang = function (hi) {
    LK.hi = !!hi; try { localStorage.setItem("lk-lang", hi ? "hi" : "en"); } catch (e) {}
    document.documentElement.lang = hi ? "hi" : "en";
    ["top", "screen", "nav", "toast", "modal"].forEach(function (id) { var e = document.getElementById(id); if (e) { busy = true; if (hi) tx(e); else undo(e); busy = false; } });
    if (window.LK.syncWatch) LK.syncWatch();
    var b = $("#top .lang"); if (b) b.textContent = hi ? "EN" : "हिं";
  };
  LK.act.lang = function () { LK.setLang(!LK.hi); };
  var nat = LK.notify;
  LK.notify = function (a, b) { return nat(LK.t(a), b ? LK.t(b) : b); };
  var saved = null; try { saved = localStorage.getItem("lk-lang"); } catch (e) {}
  LK.hi = saved !== "en";
  document.documentElement.lang = LK.hi ? "hi" : "en";
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arm); else arm();
})();
