import { notify } from '../ui/notifications.js';
import { loader } from '../ui/loader.js';
import { storage } from '../core/storage.js';

let selectedSign = 'Aries';
let period = 'Today';
let speechUtterance = null;

export const horoscope = {
  init(container) {
    if (!container) return;
    
    // Set up sign click listeners
    container.addEventListener('click', e => {
      const z = e.target.closest('.zodiac');
      if (!z || z.closest('#rashiGrid')) return; // ignore rashi encyclopedia grid
      
      container.querySelectorAll('#zodiacGrid .zodiac').forEach(el => el.classList.remove('selected'));
      z.classList.add('selected');
      selectedSign = z.dataset.sign;
      
      this.getReading();
    });

    // Set up period tab listeners
    const periods = container.querySelector('#periods');
    if (periods) {
      periods.addEventListener('click', e => {
        const btn = e.target.closest('.period');
        if (!btn) return;
        periods.querySelectorAll('.period').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        period = btn.textContent;
        
        this.getReading();
      });
    }

    // Horoscope reveal button
    const revealBtn = container.querySelector('#horoscopeBtn');
    if (revealBtn) {
      revealBtn.onclick = () => this.getReading();
    }
  },

  async getReading() {
    const loadEl = document.getElementById('horoscopeLoading');
    const outEl = document.getElementById('horoscopeResult');
    
    loader.show(loadEl, 'default');
    if (outEl) outEl.innerHTML = '';
    this.stopSpeaking();
    
    const profiles = storage.getProfiles();
    const p = profiles.find(x => x.relation === 'Self') || profiles[0];
    const settings = storage.getSettings();
    const lang = settings.lang || 'en';
    
    const payload = p ? {
      name: p.name,
      date: p.dob,
      time: p.time || '12:00',
      place: p.place,
      type: 'daily',
      moonSign: selectedSign,
      dasha: 'Jupiter',
      lang: lang
    } : {
      name: 'Guest',
      date: new Date().toISOString().split('T')[0],
      time: '12:00',
      place: 'Delhi',
      type: 'daily',
      moonSign: selectedSign,
      dasha: 'Jupiter',
      lang: lang
    };
    
    try {
      const result = await this.askAI(payload, loadEl, outEl);
      if (result && outEl) {
        this.renderResult(outEl, result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      loader.hide(loadEl);
    }
  },

  async askAI(payload, loadEl, outEl) {
    const lang = payload.lang || 'en';
    const cacheKey = `jd:horo:v3:${lang}:` + btoa(unescape(encodeURIComponent(`${payload.name}:${payload.moonSign}:${period}`))).slice(0, 180);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.at < 3600000 * 6) { // 6 hours cache for horoscopes
        return parsed.result;
      }
    }

    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Stars are silent.');
      
      // LAYER 4: FRONTEND VALIDATION
      if (!data || !data.success || !data.data) {
        throw new Error('Invalid response structure from server.');
      }
      
      const paragraphs = ['overview', 'career', 'love', 'health_remedies'];
      const parameters = ['lucky_color', 'lucky_number', 'lucky_time'];
      const missingParagraphs = paragraphs.filter(f => !data.data[f] || String(data.data[f]).trim().length < 5);
      const missingParameters = parameters.filter(f => !data.data[f] || String(data.data[f]).trim().length < 1);
      if (missingParagraphs.length > 0 || missingParameters.length > 0) {
        throw new Error(`Response missing required fields: ${[...missingParagraphs, ...missingParameters].join(', ')}`);
      }
      
      localStorage.setItem(cacheKey, JSON.stringify({ result: data, at: Date.now() }));
      return data;
    } catch (e) {
      const msg = `Cosmic connection interrupted: ${e.message}`;
      if (outEl) outEl.textContent = msg;
      notify.show(msg, 'error');
      throw e;
    }
  },

  renderResult(outEl, result) {
    let htmlContent = '';
    let plainText = '';
    const settings = storage.getSettings();
    const lang = settings.lang || 'en';
    const speakBtnText = lang === 'en' ? '🔊 Read' : '🔊 Padhein';
    const stopBtnText = lang === 'en' ? '🛑 Stop' : '🛑 Rokey';
    const titleText = lang === 'en' ? `♈ ${selectedSign} Horoscope (${period})` : `♈ ${selectedSign} Rashifal (${period})`;
    
    if (result && result.data && typeof result.data === 'object') {
      const d = result.data;
      plainText = result.text || `${d.overview}\n\n${d.career}\n\n${d.love}\n\n${d.health_remedies}`;
      htmlContent = `
        <div class="horoscope-card card" style="border-left: 4px solid var(--gold);">
          <div style="float: right; display: flex; gap: 8px;">
            <button class="period speak-btn" style="min-height: 32px; padding: 4px 10px;">${speakBtnText}</button>
            <button class="period copy-btn" style="min-height: 32px; padding: 4px 10px;">📋 Copy</button>
          </div>
          <h3 class="gold" style="margin-top: 0;">${titleText}</h3>
          
          <div class="horo-section" style="margin-top: 15px;">
            <h4 class="gold">🎯 Overview</h4>
            <p style="line-height: 1.6; opacity: 0.95; white-space: pre-wrap;">${this.escapeHTML(d.overview)}</p>
          </div>
          <div class="horo-section" style="margin-top: 15px;">
            <h4 class="gold">💼 Career & Finance</h4>
            <p style="line-height: 1.6; opacity: 0.95; white-space: pre-wrap;">${this.escapeHTML(d.career)}</p>
          </div>
          <div class="horo-section" style="margin-top: 15px;">
            <h4 class="gold">💑 Love & Relationships</h4>
            <p style="line-height: 1.6; opacity: 0.95; white-space: pre-wrap;">${this.escapeHTML(d.love)}</p>
          </div>
          <div class="horo-section" style="margin-top: 15px;">
            <h4 class="gold">🌿 Health & Remedies</h4>
            <p style="line-height: 1.6; opacity: 0.95; white-space: pre-wrap;">${this.escapeHTML(d.health_remedies)}</p>
          </div>

          <div style="display:flex; justify-content:center; gap:12px; margin-top:20px; flex-wrap:wrap; font-size:0.88rem;">
            <div class="card" style="padding:6px 12px; margin:0; text-align:center;">🌈 Color: <b>${this.escapeHTML(d.lucky_color)}</b></div>
            <div class="card" style="padding:6px 12px; margin:0; text-align:center;">🔢 Number: <b>${this.escapeHTML(d.lucky_number)}</b></div>
            <div class="card" style="padding:6px 12px; margin:0; text-align:center;">⏰ Time: <b>${this.escapeHTML(d.lucky_time)}</b></div>
          </div>
        </div>
      `;
    } else {
      const text = typeof result === 'string' ? result : (result.text || '');
      plainText = text;
      htmlContent = `
        <div class="horoscope-card card" style="border-left: 4px solid var(--gold);">
          <div style="float: right; display: flex; gap: 8px;">
            <button class="period speak-btn" style="min-height: 32px; padding: 4px 10px;">${speakBtnText}</button>
            <button class="period copy-btn" style="min-height: 32px; padding: 4px 10px;">📋 Copy</button>
          </div>
          <h3 class="gold" style="margin-top: 0;">${titleText}</h3>
          <div class="horo-body" style="white-space: pre-wrap; margin-top: 12px; line-height: 1.6;">${this.escapeHTML(text)}</div>
        </div>
      `;
    }

    outEl.innerHTML = htmlContent;

    // Copy listener
    outEl.querySelector('.copy-btn').onclick = () => {
      navigator.clipboard.writeText(`${selectedSign} Horoscope (${period}):\n\n${plainText}`);
      notify.show('Copied to clipboard!', 'success');
    };

    // Speak listener
    outEl.querySelector('.speak-btn').onclick = (e) => {
      const btn = e.target;
      if (window.speechSynthesis.speaking) {
        this.stopSpeaking();
        btn.textContent = speakBtnText;
      } else {
        btn.textContent = stopBtnText;
        this.speakText(plainText, () => {
          btn.textContent = speakBtnText;
        });
      }
    };
  },

  speakText(text, onEnd) {
    this.stopSpeaking();
    if (!window.speechSynthesis) {
      notify.show('Text-to-speech not supported in this browser.', 'warning');
      if (onEnd) onEnd();
      return;
    }
    // Strip emojis for cleaner speech
    const cleanText = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '');
    speechUtterance = new SpeechSynthesisUtterance(cleanText);
    speechUtterance.lang = 'en-IN';
    speechUtterance.rate = 1.0;
    speechUtterance.onend = () => {
      speechUtterance = null;
      if (onEnd) onEnd();
    };
    speechUtterance.onerror = () => {
      speechUtterance = null;
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(speechUtterance);
  },

  stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  },

  escapeHTML(s) {
    return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }
};
