import { router } from './router.js';
import { storage } from './storage.js';
import { notify } from '../ui/notifications.js';
import { dateUtils } from '../utils/date.js';
import { horoscope } from '../features/horoscope.js';
import { kundali } from '../features/kundali.js';
import { match } from '../features/match.js';
import { numerology } from '../features/numerology.js';
import { tarot } from '../features/tarot.js';

// Search suggestions pool
const SUGGESTIONS = [
  { keywords: ['rashifal', 'horoscope', 'aaj ka rashifal', 'daily reading', 'rashi'], target: 'horoscope', scroll: null },
  { keywords: ['kundali', 'birth chart', 'janam kundali', 'planetary chart'], target: 'kundali', scroll: '#kundaliForm' },
  { keywords: ['milan', 'matchmaking', 'compatibility', 'marriage match', 'partnership'], target: 'milan', scroll: '#milanForm' },
  { keywords: ['numerology', 'ank shastra', 'life path', 'destiny number', 'soul urge'], target: 'numerology', scroll: null },
  { keywords: ['tarot', 'card reading', 'past present future', 'arcana'], target: 'tarot', scroll: '#tarotQuestion' },
  { keywords: ['manglik', 'manglik dosha', 'mars dosha', 'mangal checker'], target: 'kundali', scroll: '#manglikForm' },
  { keywords: ['rashi info', 'zodiac signs', 'archetypes', 'rashi guide'], target: 'rashi', scroll: '#rashiGrid' },
  { keywords: ['remedies', 'mantra', 'gemstones', 'fasting', 'totke'], target: 'rashi', scroll: '#remediesSection' }
];

const SIGNS = [
  ['♈', 'Aries', 'Mar 21 – Apr 19', 'Fire', 'Mars', 'Mesh'],
  ['♉', 'Taurus', 'Apr 20 – May 20', 'Earth', 'Venus', 'Vrishabh'],
  ['♊', 'Gemini', 'May 21 – Jun 20', 'Air', 'Mercury', 'Mithun'],
  ['♋', 'Cancer', 'Jun 21 – Jun 22', 'Water', 'Moon', 'Kark'],
  ['♌', 'Leo', 'Jul 23 – Aug 22', 'Fire', 'Sun', 'Singh'],
  ['♍', 'Virgo', 'Aug 23 – Sep 22', 'Earth', 'Mercury', 'Kanya'],
  ['♎', 'Libra', 'Sep 23 – Oct 22', 'Air', 'Venus', 'Tula'],
  ['♏', 'Scorpio', 'Oct 23 – Nov 21', 'Water', 'Mars', 'Vrishchik'],
  ['♐', 'Sagittarius', 'Nov 22 – Dec 21', 'Fire', 'Jupiter', 'Dhanu'],
  ['♑', 'Capricorn', 'Dec 22 – Jan 19', 'Earth', 'Saturn', 'Makar'],
  ['♒', 'Aquarius', 'Jan 20 – Feb 18', 'Air', 'Saturn', 'Kumbh'],
  ['♓', 'Pisces', 'Feb 19 – Mar 20', 'Water', 'Jupiter', 'Meen']
];

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 
  'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

function populateGrids() {
  const zd = document.getElementById('zodiacGrid');
  const rg = document.getElementById('rashiGrid');
  
  if (zd) {
    zd.innerHTML = SIGNS.map((s, i) => `
      <div class="card zodiac ${i === 0 ? 'selected' : ''}" role="button" tabindex="0" aria-label="Select ${s[1]}" data-sign="${s[1]}">
        <div class="symbol">${s[0]}</div>
        <b>${s[1]}</b>
        <small>${s[2]}</small>
      </div>
    `).join('');
  }
  
  if (rg) {
    rg.innerHTML = SIGNS.map(s => `
      <div class="card zodiac" role="button" tabindex="0" aria-label="Read about ${s[5]}" data-rashi="${s[5]}">
        <div class="symbol">${s[0]}</div>
        <b>${s[5]}</b>
        <small>${s[3]} · ${s[4]}</small>
      </div>
    `).join('');
  }

  // Populate nakshatra dropdowns
  document.querySelectorAll('.nak-select').forEach(el => {
    el.innerHTML = NAKSHATRAS.map(n => `<option value="${n}">${n}</option>`).join('');
  });

  // Setup keydown listeners for keyboard accessibility on all zodiac items
  document.querySelectorAll('.zodiac').forEach(c => {
    c.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        c.click();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Routing & Storage
  router.init();
  const settings = storage.getSettings();
  applySettings(settings);

  // Populate Grids
  populateGrids();

  // Initialize Features
  horoscope.init(document.getElementById('horoscope'));
  kundali.init(document.getElementById('kundali'));
  match.init(document.getElementById('milan'));
  numerology.init(document.getElementById('numerology'));
  tarot.init(document.getElementById('tarot'));

  // Setup UI Hooks
  setupDashboardSearch();
  setupPreferences();
  setupGeneralEvents();
  setupRashiEncyclopedia();
  setupRemediesSearch();
  setupMobileGestures();
  setupPanchangBtn();

  // Load astronomical Panchang immediately
  loadAstronomicalPanchang(false);
});

function applySettings(s) {
  // Theme (Dark/Light)
  if (s.theme === 'light') {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  } else {
    document.body.classList.remove('light-mode');
    document.body.classList.add('dark-mode');
  }

  // Font Size
  const fontSizes = { small: '14px', medium: '16px', large: '18px' };
  document.documentElement.style.fontSize = fontSizes[s.fontSize] || '16px';

  // Language Text Swapping (V2 English/Hindi placeholder)
  const isHi = s.lang === 'hinglish';
  document.querySelectorAll('[data-hi]').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.textContent;
    el.textContent = isHi ? el.dataset.hi : el.dataset.en;
  });
  
  // Set values on elements in preference dialog
  const langToggle = document.getElementById('prefLang');
  if (langToggle) langToggle.value = s.lang;
  const themeToggle = document.getElementById('prefTheme');
  if (themeToggle) themeToggle.value = s.theme;
  const sizeToggle = document.getElementById('prefFontSize');
  if (sizeToggle) sizeToggle.value = s.fontSize;
}

function setupDashboardSearch() {
  const searchInput = document.getElementById('dashboardSearch');
  const suggestBox = document.getElementById('searchSuggestions');
  if (!searchInput || !suggestBox) return;

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      suggestBox.style.display = 'none';
      return;
    }

    const matches = SUGGESTIONS.filter(item => 
      item.keywords.some(kw => kw.includes(q))
    );

    if (matches.length) {
      suggestBox.innerHTML = matches.map((item, idx) => `
        <div class="suggest-item" style="padding:10px 14px; cursor:pointer; border-bottom:1px solid #281640;" data-idx="${idx}">
          🔮 Go to <b>${item.keywords[0].toUpperCase()}</b>
        </div>
      `).join('');
      suggestBox.style.display = 'block';

      suggestBox.querySelectorAll('.suggest-item').forEach(el => {
        el.onclick = () => {
          const target = matches[Number(el.dataset.idx)];
          router.switchTab(target.target);
          if (target.scroll) {
            setTimeout(() => {
              const elToScroll = document.querySelector(target.scroll);
              if (elToScroll) {
                elToScroll.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Briefly flash the card border
                const card = elToScroll.closest('.card');
                if (card) {
                  card.style.borderColor = 'var(--gold)';
                  setTimeout(() => card.style.borderColor = 'var(--border)', 1500);
                }
              }
            }, 100);
          }
          searchInput.value = '';
          suggestBox.style.display = 'none';
        };
      });
    } else {
      suggestBox.style.display = 'none';
    }
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestBox.contains(e.target)) {
      suggestBox.style.display = 'none';
    }
  });
}

function setupPreferences() {
  const prefBtn = document.getElementById('mySpaceBtn');
  const spaceModal = document.getElementById('spaceModal');
  const closeSpace = document.getElementById('closeSpace');
  if (!spaceModal) return;

  if (prefBtn) {
    prefBtn.onclick = () => {
      kundali.refreshProfiles();
      spaceModal.showModal();
    };
  }

  if (closeSpace) {
    closeSpace.onclick = () => spaceModal.close();
  }

  // Preferences controls
  const langSel = document.getElementById('prefLang');
  const themeSel = document.getElementById('prefTheme');
  const sizeSel = document.getElementById('prefFontSize');

  const onSettingChange = () => {
    const updated = storage.saveSettings({
      lang: langSel.value,
      theme: themeSel.value,
      fontSize: sizeSel.value
    });
    applySettings(updated);
    notify.show('Preferences updated!', 'success');
  };

  if (langSel) langSel.onchange = onSettingChange;
  if (themeSel) themeSel.onchange = onSettingChange;
  if (sizeSel) sizeSel.onchange = onSettingChange;

  // Clear data
  const clearDataBtn = document.getElementById('clearAllData');
  if (clearDataBtn) {
    clearDataBtn.onclick = () => {
      if (confirm('Are you sure you want to delete all saved profiles and history from this browser?')) {
        localStorage.clear();
        notify.show('All local data cleared.', 'info');
        setTimeout(() => window.location.reload(), 800);
      }
    };
  }
}

function setupGeneralEvents() {
  // Support clicking legal buttons
  document.querySelectorAll('.legal-btn').forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.legal;
      const dialog = document.getElementById('legalDialog');
      const content = document.getElementById('legalContent');
      
      const legalTexts = {
        privacy: `<h2 class="gold">Privacy Notice</h2><p>Your profiles, birth dates, times, and places are stored only in this local browser's storage. Nothing is saved on our servers. API calls send birth coordinates directly to generate readings and calculations without linking to your identity.</p>`,
        terms: `<h2 class="gold">Terms of Use</h2><p>Jyotish Darpan is 100% free with no commercial transactions. Readings and chart summaries are interpretive insights and not scientifically verified forecasts. Use responsibly.</p>`,
        disclaimer: `<h2 class="gold">Astrology Disclaimer</h2><p>Spiritual tools like Vedic charts and Tarot readings serve personal introspection. Do not substitute them for professional medical, legal, relationship, or financial consults.</p>`
      };

      if (dialog && content) {
        content.innerHTML = legalTexts[type] || 'Spiritual terms context';
        dialog.showModal();
        dialog.querySelector('#closeLegal').onclick = () => dialog.close();
      }
    };
  });
}

function setupRashiEncyclopedia() {
  const rashiGrid = document.getElementById('rashiGrid');
  const rashiResult = document.getElementById('rashiResult');
  const rashiLoad = document.getElementById('rashiLoading');
  if (!rashiGrid) return;

  rashiGrid.onclick = async (e) => {
    const card = e.target.closest('.zodiac');
    if (!card) return;

    rashiGrid.querySelectorAll('.zodiac').forEach(el => el.classList.remove('selected'));
    card.classList.add('selected');
    
    if (rashiLoad) {
      rashiLoad.innerHTML = '<div class="spinner"></div><div>Consulting Rashi encyclopedia archives…</div>';
      rashiLoad.classList.add('show');
    }
    if (rashiResult) rashiResult.textContent = '';

    const prompt = `Give a comprehensive Vedic profile of the sign "${card.dataset.rashi}".
Include:
1. Core Archetype, Element, and Ruling Planet.
2. 5 Key Strengths & 3 Challenges.
3. Love Compatibility (Best & Difficult Matches).
4. Best Careers and Lucky Colors/Numbers/Gemstones.
5. A brief inspiring guidance message.
Use bullet points and emojis to make it clear and engaging.`;

    const settings = storage.getSettings();
    const lang = settings.lang || 'en';
    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, lang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Encyclopedia database offline.');

      if (rashiResult) {
        rashiResult.innerHTML = `
          <div class="card" style="text-align:left; border-left:4px solid var(--gold); line-height:1.7;">
            <h3 class="gold" style="margin-top:0;">📚 ${card.dataset.rashi} (Zodiac Guide)</h3>
            <div style="white-space:pre-wrap;">${data.text}</div>
          </div>
        `;
      }
    } catch (err) {
      console.warn("Rashi Encyclopedia API failed, using fallback:", err);
      if (rashiResult) {
        rashiResult.innerHTML = `
          <div class="card" style="text-align:left; border-left:4px solid var(--gold); line-height:1.7;">
            <h3 class="gold" style="margin-top:0;">📚 ${card.dataset.rashi} (Zodiac Guide)</h3>
            <div style="white-space:pre-wrap; opacity: 0.95;">${getRashiFallbackText(card.dataset.rashi)}</div>
            <p class="note" style="margin-top: 15px; font-size: 0.8rem; color: var(--muted);">⚠️ Offline Guide: AI services are currently busy.</p>
          </div>
        `;
      }
    } finally {
      if (rashiLoad) rashiLoad.classList.remove('show');
    }
  };

  // Lucky Details
  const luckyBtn = document.getElementById('luckyBtn');
  if (luckyBtn) {
    luckyBtn.onclick = async () => {
      const selected = document.getElementById('luckyRashi').value;
      const load = document.querySelector('#rashi .card .loading');
      const result = document.getElementById('luckyResult');
      
      if (load) {
        load.innerHTML = '<div class="spinner"></div><div>Calculating today’s lucky coordinates…</div>';
        load.classList.add('show');
      }
      if (result) result.innerHTML = '';

      const prompt = `For the zodiac sign ${selected} today, calculate and list:
1. Lucky Color
2. Lucky Number (1-9)
3. Lucky Direction
4. Power Mantra (one line Sanskrit/English translation)
5. Power Hour Time Window
6. One line advice for today.
Make each item clear and formatted with an emoji.`;

      const settings = storage.getSettings();
      const lang = settings.lang || 'en';
      try {
        const res = await fetch('/api/reading', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prompt, lang })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (result) {
          result.innerHTML = `
            <div class="card" style="width:100%; text-align:left; line-height:1.6;">
              <h4 class="gold" style="margin-top:0;">🍀 Lucky Parameters for ${selected}</h4>
              <div style="white-space:pre-wrap;">${data.text}</div>
            </div>
          `;
        }
      } catch (err) {
        console.warn("Lucky Details API failed, using fallback:", err);
        if (result) {
          result.innerHTML = `
            <div class="card" style="width:100%; text-align:left; line-height:1.6;">
              <h4 class="gold" style="margin-top:0;">🍀 Lucky Parameters for ${selected}</h4>
              <div style="white-space:pre-wrap; opacity: 0.95;">${getLuckyFallbackText(selected)}</div>
              <p class="note" style="margin-top: 15px; font-size: 0.8rem; color: var(--muted);">⚠️ Offline parameters calculated based on planetary cycles.</p>
            </div>
          `;
        }
      } finally {
        if (load) load.classList.remove('show');
      }
    };
  }
}

function setupRemediesSearch() {
  const searchInput = document.getElementById('remedyKeyword');
  const searchBtn = document.getElementById('remedySearchBtn');
  const resultDiv = document.getElementById('remedySearchResult');
  const load = document.getElementById('remedySearchLoading');
  if (!searchBtn || !searchInput) return;

  const performSearch = async () => {
    const q = searchInput.value.trim();
    if (!q) {
      notify.show('Please type a keyword (e.g. Manglik, Saturn, Shani, Rahu, Job).', 'warning');
      return;
    }

    if (load) {
      load.innerHTML = '<div class="spinner"></div><div>Searching sacred Vedic remedy database…</div>';
      load.classList.add('show');
    }
    if (resultDiv) resultDiv.innerHTML = '';

    const prompt = `Provide a list of Vedic Remedies, gemstone advice, charity, fasts, and powerful Mantras related to the keyword: "${q}".
Include:
- 3 Mantras with meanings.
- Easy practical acts of charity (Daan).
- Fasting or lifestyle restrictions.
Structure with clear headings and emojis.`;

    const settings = storage.getSettings();
    const lang = settings.lang || 'en';
    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, lang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (resultDiv) {
        resultDiv.innerHTML = `
          <div class="card" style="text-align:left; line-height:1.7; border-left:4px solid var(--ok);">
            <h4 class="gold" style="margin-top:0;">🛡️ Remedies for "${q}"</h4>
            <div style="white-space:pre-wrap;">${data.text}</div>
          </div>
        `;
      }
    } catch (e) {
      console.warn("Remedies API failed, using fallback:", e);
      if (resultDiv) {
        resultDiv.innerHTML = `
          <div class="card" style="text-align:left; line-height:1.7; border-left:4px solid var(--ok);">
            <h4 class="gold" style="margin-top:0;">🛡️ Remedies for "${q}"</h4>
            <div style="white-space:pre-wrap; opacity: 0.95;">${getRemedyFallbackText(q)}</div>
            <p class="note" style="margin-top: 15px; font-size: 0.8rem; color: var(--muted);">⚠️ General Vedic remedial guidance. AI services busy.</p>
          </div>
        `;
      }
    } finally {
      if (load) load.classList.remove('show');
    }
  };

  searchBtn.onclick = performSearch;
  searchInput.onkeydown = (e) => {
    if (e.key === 'Enter') performSearch();
  };
}

function setupMobileGestures() {
  // Yesterday/Tomorrow swipe switching on Horoscope result
  const resultDiv = document.getElementById('horoscopeResult');
  if (!resultDiv) return;

  let startX = 0;
  resultDiv.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  resultDiv.addEventListener('touchend', (e) => {
    const endX = e.clientX || e.changedTouches[0].clientX;
    const diff = startX - endX;

    const periodsDiv = document.getElementById('periods');
    if (!periodsDiv) return;
    const activeBtn = periodsDiv.querySelector('.period.active');
    const allBtns = [...periodsDiv.querySelectorAll('.period')];
    if (!activeBtn) return;
    
    const activeIdx = allBtns.indexOf(activeBtn);

    if (diff > 80) { // Swipe Left -> Go to Next Period
      if (activeIdx < allBtns.length - 1) {
        allBtns[activeIdx + 1].click();
      }
    } else if (diff < -80) { // Swipe Right -> Go to Prev Period
      if (activeIdx > 0) {
        allBtns[activeIdx - 1].click();
      }
    }
  }, { passive: true });
}

function setupPanchangBtn() {
  const panchangBtn = document.getElementById('panchangBtn');
  if (!panchangBtn) return;
  panchangBtn.onclick = () => loadAstronomicalPanchang(true);
}

// Fallbacks and Astronomical Calculations Helper Functions
async function loadAstronomicalPanchang(fetchAI = false) {
  const textEl = document.getElementById('panchangText');
  const labelEl = document.getElementById('todayLabel');
  if (!textEl) return;
  
  if (labelEl) {
    labelEl.textContent = `📅 ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
  }
  
  const load = document.querySelector('#horoscope .panchang .loading');
  if (load) {
    load.innerHTML = '<div class="spinner"></div><div>Calculating today’s sacred timings…</div>';
    load.classList.add('show');
  }
  
  let lat = 28.6139, lon = 77.209; // Delhi defaults
  if (navigator.geolocation) {
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 2000 }));
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    } catch (e) {
      console.log("Using default coordinates.");
    }
  }
  
  try {
    const res = await fetch(`/api/panchang?date=${new Date().toISOString()}&lat=${lat}&lon=${lon}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to calculate.');
    
    const formattedSunrise = data.sunrise ? new Date(data.sunrise).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '05:30 AM';
    const formattedSunset = data.sunset ? new Date(data.sunset).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '07:10 PM';
    
    let html = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 15px; text-align: left;">
        <div class="card" style="padding: 10px; margin: 0; background: rgba(255,255,255,0.02); border: 1px solid var(--border); text-align: center;">
          <small style="color: var(--gold); text-transform: uppercase; font-size: 0.72rem;">🌑 Tithi</small><br>
          <span style="font-weight: bold; font-size: 0.95rem;">${data.tithi.paksha} ${data.tithi.number}</span>
        </div>
        <div class="card" style="padding: 10px; margin: 0; background: rgba(255,255,255,0.02); border: 1px solid var(--border); text-align: center;">
          <small style="color: var(--gold); text-transform: uppercase; font-size: 0.72rem;">⭐ Nakshatra</small><br>
          <span style="font-weight: bold; font-size: 0.95rem;">${data.nakshatra}</span>
        </div>
        <div class="card" style="padding: 10px; margin: 0; background: rgba(255,255,255,0.02); border: 1px solid var(--border); text-align: center;">
          <small style="color: var(--gold); text-transform: uppercase; font-size: 0.72rem;">🌙 Moon Sign</small><br>
          <span style="font-weight: bold; font-size: 0.95rem;">${data.moonSign}</span>
        </div>
        <div class="card" style="padding: 10px; margin: 0; background: rgba(255,255,255,0.02); border: 1px solid var(--border); text-align: center;">
          <small style="color: var(--gold); text-transform: uppercase; font-size: 0.72rem;">🌅 Sun Timings</small><br>
          <span style="font-weight: bold; font-size: 0.88rem;">🌅 ${formattedSunrise}<br>🌇 ${formattedSunset}</span>
        </div>
      </div>
    `;

    if (fetchAI) {
      const prompt = `Calculate today's Vedic Panchang for date: ${new Date().toLocaleDateString('en-IN')}.
Include:
1. Shubh Muhurtas (Abhijit, etc.) & Rahu Kaal.
2. A 1-sentence guidance summary for today's auspiciousness.
Format clearly with emojis. Present standard Indian timings.`;

      const settings = storage.getSettings();
      const lang = settings.lang || 'en';
      try {
        const aiRes = await fetch('/api/reading', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prompt, lang })
        });
        const aiData = await aiRes.json();
        if (aiRes.ok && aiData.text) {
          html += `
            <div class="card" style="margin-top: 20px; border-left: 4px solid var(--gold); text-align: left; padding: 12px; font-size: 0.9rem;">
              <h4 class="gold" style="margin-top: 0; margin-bottom: 8px;">✨ Today's Auspicious Muhurta & Guidance</h4>
              <div style="white-space: pre-wrap; line-height: 1.6; opacity: 0.95;">${aiData.text}</div>
            </div>
          `;
        }
      } catch (aiErr) {
        console.warn("Gemini AI failed for Panchang:", aiErr);
      }
    }

    textEl.innerHTML = html;
  } catch (err) {
    textEl.textContent = `Calculation failed: ${err.message}`;
  } finally {
    if (load) load.classList.remove('show');
  }
}

function getRashiFallbackText(rashiName) {
  const sign = SIGNS.find(s => s[5] === rashiName || s[1] === rashiName);
  if (!sign) return "Vedic profile information is temporarily unavailable.";
  
  return `✨ Core Archetype: ${sign[1]} (${sign[5]})
🔥 Element: ${sign[3]}
🪐 Ruling Planet: ${sign[4]}

Key Traits:
- Strong connection to the ${sign[3]} element.
- Influenced by the cosmic energy of ${sign[4]}.
- Personality is characterized by strength, wisdom, and dynamic energy.

Guidance Quote:
"Trust the cosmic timing of your life and keep moving forward with confidence."`;
}

function getLuckyFallbackText(rashiName) {
  const colors = ["Peela (Yellow)", "Neela (Blue)", "Safed (White)", "Lal (Red)", "Hara (Green)", "Naranja (Orange)"];
  const directions = ["Uttar (North)", "Dakshin (South)", "Purva (East)", "Paschim (West)", "Ishanya (North-East)", "Agneya (South-East)"];
  
  const day = new Date().getDate();
  const seed = day + rashiName.length;
  
  const luckyColor = colors[seed % colors.length];
  const luckyNumber = (seed % 9) + 1;
  const luckyDirection = directions[seed % directions.length];
  const powerHour = `${(8 + (seed % 4))} AM - ${(10 + (seed % 4))} AM`;
  
  return `🌈 Lucky Color: ${luckyColor}
🔢 Lucky Number: ${luckyNumber}
🧭 Lucky Direction: ${luckyDirection}
⏰ Power Hour: ${powerHour}
🕉️ Mantra: "Om Namah Shivaya" (Recite 11 times for focus and peace)
💡 Advice: Focus on self-discipline and maintain patience in communication today.`;
}

function getRemedyFallbackText(keyword) {
  return `🛡️ General Remedies for "${keyword}":
1. Mantras: Recite "Om Namah Shivaya" or the Gayatri Mantra 108 times daily in the morning.
2. Acts of Charity (Daan): Offer food or water to birds, dogs, or those in need on Saturdays.
3. Fasting / Lifestyle: Keep a light vegetarian diet on Saturdays or Thursdays to align your planetary energies.
4. Gemstones: Consult a professional before wearing any stones. Meditating with transparent quartz helps clear mental confusion.`;
}
