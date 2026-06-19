import { storage } from '../core/storage.js';
import { loader } from '../ui/loader.js';
import { notify } from '../ui/notifications.js';

export const numerology = {
  init(container) {
    if (!container) return;
    this.container = container;

    const form = container.querySelector('#numerologyForm');
    if (form) {
      form.onsubmit = (e) => this.handleNumerologySubmit(e);
    }
  },

  digit(n) {
    while (n > 9 && ![11, 22, 33].includes(n)) {
      n = String(n).split('').reduce((a, b) => a + Number(b), 0);
    }
    return n;
  },

  getLetterValue(char) {
    const charCode = char.toUpperCase().charCodeAt(0);
    if (charCode < 65 || charCode > 90) return 0; // non-alphabetic
    
    // Pythagorean System
    // A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, I=9
    // J=1, K=2, L=3, M=4, N=5, O=6, P=7, Q=8, R=9
    // S=1, T=2, U=3, V=4, W=5, X=6, Y=7, Z=8
    const val = (charCode - 64) % 9;
    return val === 0 ? 9 : val;
  },

  calculateDestiny(name) {
    const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
    const sum = letters.split('').reduce((acc, char) => acc + this.getLetterValue(char), 0);
    return this.digit(sum);
  },

  calculateSoulUrge(name) {
    const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
    const vowels = letters.split('').filter(char => ['A', 'E', 'I', 'O', 'U'].includes(char));
    const sum = vowels.reduce((acc, char) => acc + this.getLetterValue(char), 0);
    return this.digit(sum);
  },

  suggestNameOptimizations(currentName, currentDestiny) {
    const letters = ['A', 'E', 'I', 'O', 'Y', 'S'];
    const positiveNumbers = [1, 3, 5, 6, 9]; // Benefic destiny numbers in numerology
    const suggestions = [];

    letters.forEach(l => {
      const testName = currentName + l;
      const testDestiny = this.calculateDestiny(testName);
      if (testDestiny !== currentDestiny && positiveNumbers.includes(testDestiny)) {
        suggestions.push({
          letter: l,
          newName: `${currentName}${l.toLowerCase()}`,
          newNumber: testDestiny,
          meaning: this.getNumberKeyword(testDestiny)
        });
      }
    });

    return suggestions.slice(0, 3);
  },

  getNumberKeyword(n) {
    const keywords = {
      1: 'Leader, Ambitious, Independent',
      2: 'Diplomatic, Sensitive, Cooperative',
      3: 'Creative, Social, Expressive',
      4: 'Practical, Hardworking, Stable',
      5: 'Adventurous, Versatile, Free-spirited',
      6: 'Nurturing, Responsible, Harmonious',
      7: 'Analytical, Spiritual, Seeker',
      8: 'Authoritative, Financial success, Balanced',
      9: 'Humanitarian, Compassionate, Wise',
      11: 'Master Visionary, Highly Intuitive',
      22: 'Master Builder, High Achievements',
      33: 'Master Teacher, Spiritual Upliftment'
    };
    return keywords[n] || '';
  },

  async handleNumerologySubmit(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const load = e.target.closest('.card').querySelector('.loading');
    const resultDiv = document.getElementById('numerologyResult');
    const numDisplay = document.getElementById('numNumbers');
    
    loader.show(load, 'numerology');
    if (resultDiv) resultDiv.textContent = '';
    
    // Calculate Life Path
    const dobDigits = d.dob.replace(/\D/g, '');
    const dobSum = dobDigits.split('').reduce((a, b) => a + Number(b), 0);
    const lifePath = this.digit(dobSum);
    
    // Calculate Destiny
    const destiny = this.calculateDestiny(d.name);
    
    // Calculate Soul Urge
    const soulUrge = this.calculateSoulUrge(d.name);

    if (numDisplay) {
      numDisplay.innerHTML = `
        <div style="display:flex; justify-content:center; gap:16px; margin:15px 0; flex-wrap:wrap;">
          <div class="card" style="padding:10px 20px; text-align:center;">
            <small class="gold">Life Path Number</small>
            <div style="font-size:1.8rem; font-weight:800; color:var(--gold);">${lifePath}</div>
          </div>
          <div class="card" style="padding:10px 20px; text-align:center;">
            <small class="gold">Destiny Number</small>
            <div style="font-size:1.8rem; font-weight:800; color:var(--gold);">${destiny}</div>
          </div>
          <div class="card" style="padding:10px 20px; text-align:center;">
            <small class="gold">Soul Urge Number</small>
            <div style="font-size:1.8rem; font-weight:800; color:var(--gold);">${soulUrge}</div>
          </div>
        </div>
      `;
    }

    // Name spelling changes suggestions
    const spellingSugg = this.suggestNameOptimizations(d.name, destiny);
    let spellingHTML = '';
    if (spellingSugg.length) {
      spellingHTML = `
        <div class="card" style="margin-top:15px; border:1px dashed var(--gold); background:#1e102d;">
          <h4 class="gold" style="margin-top:0;">📝 Lucky Name Spelling Suggestion</h4>
          <p style="font-size:0.85rem; margin-bottom:8px;">Adding letters can adjust your name vibration to a highly benefic Destiny Number:</p>
          <ul style="padding-left:20px; font-size:0.85rem; line-height:1.6; margin:0;">
            ${spellingSugg.map(s => `
              <li>Try spelling as <b>${this.escapeHTML(s.newName)}</b> (Destiny changes to <b>${s.newNumber}</b> — <i>${s.meaning}</i>)</li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    const prompt = `Perform a detailed Numerology reading for ${d.name} (born on ${d.dob}) with:
- Life Path Number: ${lifePath} (${this.getNumberKeyword(lifePath)})
- Destiny Number: ${destiny} (${this.getNumberKeyword(destiny)})
- Soul Urge Number: ${soulUrge} (${this.getNumberKeyword(soulUrge)})

Explain:
1. What these three core numbers mean for their personality, inner desires, and life direction.
2. Strengths and Challenges they face.
3. The years ahead and key predictions.
Keep the reading engaging, structured, and informative.`;

    const settings = storage.getSettings();
    const lang = settings.lang || 'en';
    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, lang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Numerology vibrations are quiet.');

      if (resultDiv) {
        resultDiv.innerHTML = `
          <div class="card" style="text-align:left; line-height:1.7;">
            ${spellingHTML}
            <div style="white-space:pre-wrap; margin-top:15px;">${this.escapeHTML(data.text)}</div>
          </div>
        `;
      }
    } catch (e) {
      console.warn("Numerology API failed, using fallback:", e);
      if (resultDiv) {
        const fallbackText = getNumerologyFallbackText(d.name, d.dob, lifePath, destiny, soulUrge);
        resultDiv.innerHTML = `
          <div class="card" style="text-align:left; line-height:1.7;">
            ${spellingHTML}
            <div style="white-space:pre-wrap; margin-top:15px; opacity: 0.95;">${this.escapeHTML(fallbackText)}</div>
            <p class="note" style="margin-top: 15px; font-size: 0.8rem; color: var(--muted);">⚠️ Offline Numerological analysis. AI services busy.</p>
          </div>
        `;
      }
      notify.show("Offline Numerology analysis generated.", "info");
    } finally {
      loader.hide(load);
    }
  },

  escapeHTML(s) {
    return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }
};

function getNumerologyFallbackText(name, dob, lifePath, destiny, soulUrge) {
  const meanings = {
    1: 'You are highly independent, ambitious, and a natural leader. You thrive when taking initiative and creating new paths.',
    2: 'You are sensitive, cooperative, and diplomatic. You work best in partnerships and seek peace and harmony.',
    3: 'You are creative, expressive, and social. You have a gift for communication, art, and bringing joy to others.',
    4: 'You are practical, hardworking, and grounded. You value structure, honesty, and building secure foundations.',
    5: 'You are adventurous, versatile, and freedom-loving. You adapt quickly to change and seek diverse experiences.',
    6: 'You are nurturing, responsible, and caring. You focus on family, service, and creating beauty around you.',
    7: 'You are analytical, spiritual, and a seeker of truth. You value solitude, deep research, and inner wisdom.',
    8: 'You are powerful, career-oriented, and financially savvy. You seek material success and balance it with justice.',
    9: 'You are compassionate, humanitarian, and wise. You feel a calling to serve humanity and let go of ego.',
    11: 'Master Number 11: You possess high intuitive vision, spiritual awareness, and serve as an inspirer to others.',
    22: 'Master Number 22: You are the Master Builder, capable of turning grand spiritual ideas into practical reality.',
    33: 'Master Number 33: You are the Master Teacher, dedicating yourself to the spiritual upliftment of humanity.'
  };

  return `🌌 CORE VIBRATIONAL PATH
For ${name} (Born: ${dob}):

🔢 LIFE PATH NUMBER (${lifePath}):
The Life Path indicates your primary purpose and the journey you take in this lifetime.
👉 ${meanings[lifePath] || 'A path of personal growth and exploration.'}

🔢 DESTINY NUMBER (${destiny}):
The Destiny Number represents your natural talents, capabilities, and what you are destined to manifest.
👉 ${meanings[destiny] || 'A destiny centered on utilizing your unique skills.'}

🔢 SOUL URGE NUMBER (${soulUrge}):
The Soul Urge represents your inner desires, what makes your soul truly happy, and your hidden motivations.
👉 ${meanings[soulUrge] || 'An inner desire to seek truth, purpose, and deep connections.'}

💡 Practical Advice:
Align your actions with these numbers to experience more harmony. Use your destiny talents to fulfill your life path purpose.`;
}
