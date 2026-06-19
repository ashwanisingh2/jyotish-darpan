const http=require('http'),fs=require('fs'),path=require('path'),{kundali,panchang}=require('./lib/vedic');
const PORT=Number(process.env.PORT||8765),HOST=process.env.HOST||'127.0.0.1',API_KEY=process.env.GEMINI_API_KEY||'',MODEL=process.env.GEMINI_MODEL||'gemini-2.5-flash';
const SYSTEM_ENGLISH = 'You are a sophisticated modern Vedic astrologer with 30 years of experience. Respond in clear, elegant English. Give detailed, personalized, spiritually insightful readings. Always cover multiple life areas. Use relevant emojis. Be warm, accurate, and empowering. Never give generic advice — make every reading feel personal and cosmic. Clearly disclose when an exact astronomical calculation cannot be made from the supplied data. Never present spiritual guidance as medical, legal, or financial certainty.';
const SYSTEM_HINGLISH = 'You are a sophisticated modern Vedic astrologer with 30 years of experience. Respond in a natural mix of Hindi and English (Hinglish) using Latin script. Give detailed, personalized, spiritually insightful readings. Always cover multiple life areas. Use relevant emojis. Be warm, accurate, and empowering. Never give generic advice — make every reading feel personal and cosmic. Clearly disclose when an exact astronomical calculation cannot be made from the supplied data. Never present spiritual guidance as medical, legal, or financial certainty.';
function getSystemInstruction(lang) {
  return lang === 'hinglish' ? SYSTEM_HINGLISH : SYSTEM_ENGLISH;
}
const buckets=new Map(),WINDOW_MS=60000,MAX_REQUESTS=Number(process.env.RATE_LIMIT||12);
function securityHeaders(type='application/json; charset=utf-8'){return {'Content-Type':type,'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Content-Security-Policy':"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'",'Cache-Control':type.startsWith('text/html')?'no-cache':'no-store'}}
function send(res,status,data){res.writeHead(status,securityHeaders());res.end(JSON.stringify(data))}
function limited(ip){const now=Date.now(),b=buckets.get(ip);if(!b||now-b.start>WINDOW_MS){buckets.set(ip,{start:now,count:1});return false}return ++b.count>MAX_REQUESTS}function getFallbackResponse(name, type, lang) {
  const isEnglish = (lang === 'en');
  const fallbacks = {
    daily: {
      en: {
        overview: `${name} ji, today Moon Dev is placed in a highly auspicious house of your birth chart. This will reduce your mental stress and make you feel energetic. You will start your day with a new resolve and high energy. This is an ideal day to complete pending work. Friends and family members will respect your decisions. A meeting with a new person may bring a positive shift in your thoughts. Control your anger and spend some peaceful time in meditation in the evening.`,
        career: `Today can prove to be highly expansive and progressive for your professional life. Your hard work and dedication will be recognized by seniors and management. For business owners, there are strong opportunities for signing new deals and expanding client base. Be slightly careful when taking financial decisions; taking major investment or transaction decisions after noon will be very auspicious. Maintain good coordination with co-workers; teamwork can bring major benefits.`,
        love: `The environment at home and in the family will be filled with love and cooperation today. Your relationship with your spouse (partner) will grow stronger. If there was any past misunderstanding, sitting down and talking today will resolve it. The blessings of elders in the family will boost your courage. The day is also highly romantic for love life; you can plan an outing with your partner. An ongoing family matter can be resolved with the support of a friend.`,
        health_remedies: `You may face slight issues related to stomach and digestion first, so completely avoid outside food today and start drinking warm water. A 10-15 minute walk in the evening will improve your physical health. **Remedy**: Offer water to the Sun in the morning and chant Hanuman Chalisa. **Lucky Tip**: Keep a yellow handkerchief or cloth with you to speed up delayed work.`,
        lucky_color: "Yellow",
        lucky_number: "5",
        lucky_time: "9 AM - 11 AM",
        confidence: "high",
        fallback: true
      },
      hinglish: {
        overview: `${name} ji, aaj Chandra Dev aapke Rashi chakra ke ek behad shubh bhav mein virajman hain. Isse aapka mansik tanaav kam hoga aur aap energetic feel karenge. Subah se hi ek naye sankalp aur urja ke saath aap apne din ki shuruwaat karenge. Purane pending kaam poore karne ke liye yeh ek aadarsh din hai. Dost aur parivaar ke log aapke faislon ka samman karenge. Kisi naye vyakti se mulaqat aapke vicharon mein ek sakaratmak badlav la sakti hai. Apne gusse par kabu rakhein aur shaam ko thoda samay shanti aur dhyan mein bitayein.`,
        career: `Professional life mein aaj ka din behad behad vistar aur tarakki dene wala siddh ho sakta hai. Aapki mehnat aur lagan ko seniors aur management recognize karenge. Business karne walo ke liye naye deals sign karne aur client base expand karne ke shubh yog bane hue hain. Financial decisions lete samay thoda dhyan rakhein, bade investments ya lene-dene ke faisle dopahar ke baad hi karein to behad shubh rahega. Co-workers ke saath coordination achha rakhein, teamwork se bada labh ho sakta hai.`,
        love: `Ghar-parivar mein aaj ka vatavaran prem aur sahyog se poora rahega. Jeevansathi (partner) ke saath aapke sambandh aur majboot honge. Agar koi purani galatfehmi thi, to aaj aapas mein baithkar baat karne se door ho jayegi. Parivar ke buzurgon ka aashirwad aapke sahas ko badhayega. Love life ke liye bhi din behad romantic hai, aap apne partner ke saath kaih ghumne ka plan bana sakte hain. Dost ke sahyog se koi ruka hua parivarik mamla sulajh sakta.`,
        health_remedies: `Pet aur digestion se related thodi pareshani ho sabse pehle ho sakti hai, isliye aaj bahar ka khana bilkul avoid karein aur thoda garam paani peena shuru karein. Shaam ke samay 10-15 minute ki walk aapki physical health ko behtar rakhegi. **Remedy**: Aaj Suraj ko jal chadhayein aur Hanuman Chalisa ka path karein. **Lucky Tip**: Ruke hue kaamo ko gati dene ke liye apne paas ek peela rumal ya kapda rakhein.`,
        lucky_color: "Peela (Yellow)",
        lucky_number: "5",
        lucky_time: "9 AM - 11 AM",
        confidence: "high",
        fallback: true
      }
    },
    kundali: {
      en: {
        overview: `${name} ji, a deep analysis of your horoscope reveals that Jupiter (Guru) and Sun (Surya) are very strongly placed in your Ascendant (Lagna) house. This strong influence of Jupiter will bring you knowledge, wisdom, and spiritual progress in life. Your attractive personality and leadership qualities set you apart from the crowd. The position of Moon makes you highly emotional and creative. Even in difficult times, your self-confidence and spiritual faith will show you the right path.`,
        career: `The 10th house (Karma Bhava) of your horoscope is very strong and active. Under this influence, you are likely to achieve great success in the government sector, administrative services, management, or teaching. In business, you possess the capability to run large ventures and startups. You will experience a major positive shift and progressive growth in your career after the age of 28. Keep improving your leadership qualities and avoid any shortcuts.`,
        love: `Your horoscope's 7th house (Marriage & Partnerships) has the auspicious influence of Venus (Shukra) and Jupiter (Guru). Because of this, your life partner will be extremely caring, loving, and spiritually inclined. There are strong indications of fortune rising (bhagyoday) after marriage. Marriage is most likely to occur between the ages of 25 and 30. Relationships will have stability. There might be minor tiffs in family life, but mutual harmony will prevail.`,
        health_remedies: `Due to the influence of Saturn (Shani), you may experience joint pain, bone weakness, or acidity issues in the future. To prevent this, focus on physical exercise and diet. **Remedy**: Donate mustard oil on Saturdays and help the needy. Surya Namaskar every morning will strengthen the Sun and provide mental energy. **Lucky Tip**: Wear green clothes to please Mercury (Budh Dev).`,
        lucky_color: "Blue",
        lucky_number: "8",
        lucky_time: "Evening 5 PM - 7 PM",
        confidence: "high",
        fallback: true
      },
      hinglish: {
        overview: `${name} ji, aapki kundali ka gahra vishleshan karne par pata chalta hai ki aapke Lagna bhav mein Guru (Jupiter) aur Surya (Sun) ki sthiti behad majboot hai. Guru ke is balwan prabhav se aapko jeevan mein gyan, buddhi aur adhyatmik unnati prapt hogi. Aapki aakarshak personality aur lead karne ki kshamta aapko bheed se alag banati hai. Chandra ki sthiti aapko behad bhavuk aur creative banati hai. Jeevan ke kathin samay mein bhi aapka atmavishwas aur dharmik vishwas aapko sahi rasta dikhayega.`,
        career: `Aapki kundali ka 10th house (Karma Bhava) behad strong aur active hai. Is prabhav se aapko government sector, administrative services, management, ya teaching ke kshetra mein behad shubh success milne ke yog hain. Business mein bhi aap bade ventures aur startup run karne ki kshamta rakhte hain. Lagbhag 28 varsh ki umar ke baad aapke career mein ek bada sakaratmak badlav aur shubh tarakki aayegi. Apni leadership quality ko improve karte rahein aur kisi bhi tarah ke shortcut se bachein.`,
        love: `Aapki kundali ke 7th house (Marriage & Partnerships) mein Shukra (Venus) aur Guru ka shubh prabhav hai. Is prabhav se aapka jeevansathi behad caring, loving, aur spiritually inclined hoga. Shaadi ke baad aapke bhagyoday (fortune) ke strong yog hain. Vivah 25 se 30 varsh ke beech hone ke sabse prabal yog hain. Prem sambandhon mein sthaitva rahega. Parivarik jeevan mein thodi nok-jhook ho sakti hai, par aapas ka samanjasya bana rahega.`,
        health_remedies: `Saturn (Shani) ke prabhav se aapko future mein joint pain, bone weakness, ya acidity ki pareshani ho sakti hai. Isse bachne ke liye physical exercise aur aahar par dhyan dena zaroori hai. **Remedy**: Shanivar ko sarso ke tel ka daan karein aur garibon ki madad karein. Roz subah surya namaskar karne se surya balwan hoga aur mansik urja milegi. **Lucky Tip**: Budh dev ko prasann karne ke liye hare rang ke kapde pehnein.`,
        lucky_color: "Neela (Blue)",
        lucky_number: "8",
        lucky_time: "Evening 5 PM - 7 PM",
        confidence: "high",
        fallback: true
      }
    }
  };
  const category = fallbacks[type] || fallbacks.daily;
  const selected = isEnglish ? category.en : category.hinglish;
  const text = `🎯 Overview:\n${selected.overview}\n\n💼 Career & Finance:\n${selected.career}\n\n💑 Love & Relationships:\n${selected.love}\n\n🌿 Health & Remedies:\n${selected.health_remedies}\n\n🍀 Lucky Parameters:\nLucky Color: ${selected.lucky_color} | Lucky Number: ${selected.lucky_number} | Lucky Time: ${selected.lucky_time}`;
  return {
    success: true,
    data: selected,
    text: text,
    source: 'fallback',
    message: isEnglish 
      ? 'AI service is temporarily slow. This is a general reading. Please try again.'
      : 'AI service temporarily slow hai. Ye general reading hai. Kripya dobara try karein.',
    timestamp: new Date().toISOString()
  };
}

function buildAstrologyPrompt({ name, date, time, place, type, moonSign, dasha, lang }) {
  const isEnglish = (lang === 'en');
  const langRule = isEnglish
    ? `Write the response in clear, elegant, modern English. No Hindi/Hinglish words.`
    : `Plain Hindi/English mix (Hinglish) mein likho`;

  if (type === 'kundali') {
    return `Tum ek experienced Vedic astrologer ho. User ke details:
Name: ${name}
Birth Date: ${date}
Birth Time: ${time}
Birth Place: ${place}
Moon Sign: ${moonSign || 'Not Known'}
Current Dasha: ${dasha || 'Not Known'}
STRICT RULES:
Response EXACTLY 4 sections mein divide karo — koi section skip mat karna
Har section minimum 80 words, maximum 150 words
${langRule}
No markdown headings inside sections
No bullet points — flowing paragraphs mein likho
No "etc", "aur bhi", "aadi" — complete sentences likho
REQUIRED SECTIONS (Sab mandatory hain):
SECTION 1 — OVERVIEW: User ki kundali aur lagna chart ka analysis
SECTION 2 — CAREER/FINANCE: Job, business, money matters and career path details
SECTION 3 — LOVE/RELATIONS: Marriage, partner details, family life
SECTION 4 — HEALTH/REMEDIES: Health issues + specific remedies for weak planets + lucky tip
OUTPUT FORMAT:
Return ONLY valid JSON. No text before or after JSON.
{
"overview": "complete text here...",
"career": "complete text here...",
"love": "complete text here...",
"health_remedies": "complete text here...",
"lucky_color": "one color name",
"lucky_number": "one number",
"lucky_time": "time range like 9 AM - 11 AM",
"confidence": "high/medium/low"
}`;
  } else {
    return `Tum ek experienced Vedic astrologer ho. User ke details:
Name: ${name}
Birth Date: ${date}
Birth Time: ${time}
Birth Place: ${place}
Moon Sign: ${moonSign || 'Aries'}
Current Dasha: ${dasha || 'Jupiter'}
STRICT RULES:
Response EXACTLY 4 sections mein divide karo — koi section skip mat karna
Har section minimum 80 words, maximum 150 words
${langRule}
No markdown headings inside sections
No bullet points — flowing paragraphs mein likho
No "etc", "aur bhi", "aadi" — complete sentences likho
REQUIRED SECTIONS (Sab mandatory hain):
SECTION 1 — OVERVIEW: User ka general mood aur din ka summary
SECTION 2 — CAREER/FINANCE: Job, business, money matters
SECTION 3 — LOVE/RELATIONS: Family, friends, romantic life
SECTION 4 — HEALTH/REMEDIES: Health + 1 specific remedy + lucky tip
OUTPUT FORMAT:
Return ONLY valid JSON. No text before or after JSON.
{
"overview": "complete text here...",
"career": "complete text here...",
"love": "complete text here...",
"health_remedies": "complete text here...",
"lucky_color": "one color name",
"lucky_number": "one number",
"lucky_time": "time range like 9 AM - 11 AM",
"confidence": "high/medium/low"
}`;
  }
}

function readBody(req){return new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>20000){reject(new Error('Request too large'));req.destroy()}});req.on('end',()=>resolve(s));req.on('error',reject)})}
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{ok:true,aiConfigured:Boolean(API_KEY),version:'1.0.0'});
if(req.method==='GET'&&url.pathname==='/api/panchang')return send(res,200,panchang({date:url.searchParams.get('date')||new Date().toISOString(),lat:+url.searchParams.get('lat'),lon:+url.searchParams.get('lon')}));
if(req.method==='GET'&&url.pathname==='/api/geocode'){const q=String(url.searchParams.get('q')||'').trim();if(q.length<3)return send(res,400,{error:'Enter at least 3 characters'});try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`,{headers:{'User-Agent':'JyotishDarpan/1.0'}}),d=await r.json();return send(res,200,d.map(x=>({name:x.display_name,lat:+x.lat,lon:+x.lon})))}catch{return send(res,502,{error:'Place search unavailable'})}}
if(req.method==='POST'&&url.pathname==='/api/kundali'){try{const b=JSON.parse(await readBody(req));if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||!Number.isFinite(+b.lat)||!Number.isFinite(+b.lon))return send(res,400,{error:'Valid date, latitude and longitude required'});return send(res,200,kundali(b))}catch{return send(res,400,{error:'Unable to calculate chart'})}}
if(req.method==='POST'&&url.pathname==='/api/reading'){if(limited(req.socket.remoteAddress||'unknown'))return send(res,429,{error:'Too many readings. Please wait one minute.'});if(!API_KEY)return send(res,503,{error:'AI service is not configured. Set GEMINI_API_KEY on the server.'});let body;try{body=JSON.parse(await readBody(req));const isStructured=body.type==='daily'||body.type==='kundali';let prompt;if(isStructured){if(!body.name||!body.date||!body.time||!body.place){return send(res,400,{error:'Sab details bhariye: naam, date, time, place'})}prompt=buildAstrologyPrompt(body)}else{prompt=typeof body.prompt==='string'?body.prompt.trim():'';if(prompt.length<5||prompt.length>6000)return send(res,400,{error:'Please provide a valid reading request.'})}let responseText='';let attempts=0;const maxAttempts=3;while(attempts<maxAttempts){try{const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;const schema={type:"OBJECT",properties:{overview:{type:"STRING"},career:{type:"STRING"},love:{type:"STRING"},health_remedies:{type:"STRING"},lucky_color:{type:"STRING"},lucky_number:{type:"STRING"},lucky_time:{type:"STRING"},confidence:{type:"STRING"}},required:["overview","career","love","health_remedies","lucky_color","lucky_number","lucky_time","confidence"]};const genConfig=isStructured?{temperature:0.3,maxOutputTokens:2048,responseMimeType:'application/json',responseSchema:schema}:{maxOutputTokens:1000,temperature:0.8};const upstream=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:getSystemInstruction(body.lang)}]},contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:genConfig,safetySettings:[{category:'HARM_CATEGORY_HARASSMENT',threshold:'BLOCK_NONE'},{category:'HARM_CATEGORY_HATE_SPEECH',threshold:'BLOCK_NONE'},{category:'HARM_CATEGORY_SEXUALLY_EXPLICIT',threshold:'BLOCK_NONE'},{category:'HARM_CATEGORY_DANGEROUS_CONTENT',threshold:'BLOCK_NONE'}]})}),data=await upstream.json();if(!upstream.ok)throw new Error(data.error?.message||'Upstream API error');responseText=(data.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('\n').trim();if(!responseText)throw new Error('AI returned empty response.');break}catch(err){attempts++;if(attempts>=maxAttempts)throw err;await new Promise(r=>setTimeout(r,1000*attempts))}}if(isStructured){const cleanJson=responseText.replace(/```json\s*/g,'').replace(/```\s*$/g,'').trim();let parsed;try{parsed=JSON.parse(cleanJson)}catch(parseError){console.error('JSON parse error, falling back. Raw response:',responseText,parseError);return send(res,200,getFallbackResponse(body.name,body.type,body.lang))}const paragraphs = ['overview', 'career', 'love', 'health_remedies'];const parameters = ['lucky_color', 'lucky_number', 'lucky_time'];const missingParagraphs = paragraphs.filter(f => !parsed[f] || String(parsed[f]).trim().length < 5);const missingParameters = parameters.filter(f => !parsed[f] || String(parsed[f]).trim().length < 1);if (missingParagraphs.length > 0 || missingParameters.length > 0) {console.warn('Missing fields in AI response, falling back. Parsed content:', parsed);return send(res, 200, getFallbackResponse(body.name, body.type, body.lang))}const text=`🎯 Overview:\n${parsed.overview}\n\n💼 Career & Finance:\n${parsed.career}\n\n💑 Love & Relationships:\n${parsed.love}\n\n🌿 Health & Remedies:\n${parsed.health_remedies}\n\n🍀 Lucky Parameters:\nLucky Color: ${parsed.lucky_color} | Lucky Number: ${parsed.lucky_number} | Lucky Time: ${parsed.lucky_time}`;return send(res,200,{success:true,data:parsed,text:text,source:'ai',timestamp:new Date().toISOString()})}else{return send(res,200,{text:responseText})}}catch(err){console.error('API execution failed:',err.message);if(body&&body.type){return send(res,200,getFallbackResponse(body.name||'Guest',body.type,body.lang))}return send(res,502,{error:'Unable to process this request.'})}}
if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'Method not allowed'});const requested=url.pathname==='/'?'index.html':url.pathname.slice(1),file=path.resolve(__dirname,requested),ext=path.extname(file),mimes={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.ico':'image/x-icon'};if(!file.startsWith(path.resolve(__dirname))||!mimes[ext])return send(res,404,{error:'Not found'});fs.readFile(file,(err,data)=>{if(err)return send(res,404,{error:'Not found'});res.writeHead(200,securityHeaders(mimes[ext]));res.end(req.method==='HEAD'?'':data)})});
server.listen(PORT,HOST,()=>console.log(`Jyotish Darpan running on http://${HOST}:${PORT}`));
