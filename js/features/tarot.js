import { storage } from '../core/storage.js';
import { loader } from '../ui/loader.js';
import { notify } from '../ui/notifications.js';

export const tarot = {
  init(container) {
    if (!container) return;
    this.container = container;

    const revealBtn = container.querySelector('#tarotBtn');
    if (revealBtn) {
      revealBtn.onclick = () => this.drawTarot();
    }
  },

  resetDeck() {
    const cards = this.container.querySelectorAll('.tarot-card');
    cards.forEach(c => {
      c.classList.remove('flipped');
      c.querySelector('.front').textContent = 'Mystery awaits';
    });
  },

  async drawTarot() {
    const qInput = this.container.querySelector('#tarotQuestion');
    const q = qInput ? qInput.value.trim() : '';
    if (!q) {
      notify.show('Please enter your question before drawing the cards.', 'warning');
      return;
    }

    const load = this.container.querySelector('.loading');
    const resultDiv = document.getElementById('tarotResult');
    
    this.resetDeck();
    loader.show(load, 'tarot');
    if (resultDiv) resultDiv.textContent = '';

    const prompt = `Perform a 3-card Tarot reading for this question: "${q}".
You must:
1. Draw exactly 3 Tarot cards representing Past, Present, and Future.
2. Begin the response with a line matching this exact format: "CARDS: Card One | Card Two | Card Three".
3. Provide the detailed reading explaining each card's image representation and meaning in its respective position.
4. Conclude with a clear, encouraging overall spiritual guidance message.`;

    const settings = storage.getSettings();
    const lang = settings.lang || 'en';
    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, lang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The tarot cards are stuck.');
      
      this.animateAndRenderResult(data.text, resultDiv);
    } catch (e) {
      console.warn("Tarot API failed, using client-side fallback:", e);
      const fallbackText = getTarotFallbackText(q);
      this.animateAndRenderResult(fallbackText, resultDiv);
      notify.show("Offline Tarot reading generated.", "info");
    } finally {
      loader.hide(load);
    }
  },

  animateAndRenderResult(text, resultDiv) {
    const cardLine = text.match(/CARDS:\s*([^\n]+)/i)?.[1];
    const cardNames = cardLine ? cardLine.split('|').map(x => x.trim()) : ['Past Card', 'Present Card', 'Future Card'];
    
    // Animate Card Flips
    const cardElements = this.container.querySelectorAll('.tarot-card');
    cardElements.forEach((c, idx) => {
      setTimeout(() => {
        const nameEl = c.querySelector('.front');
        if (nameEl) {
          nameEl.innerHTML = `
            <div style="font-size:0.8rem; text-transform:uppercase; color:var(--muted);">${['Past', 'Present', 'Future'][idx]}</div>
            <div style="font-size:3rem; margin:10px 0;">🃏</div>
            <div style="font-weight:700; font-size:0.95rem; color:var(--gold); line-height:1.2;">
              ${cardNames[idx]}
            </div>
          `;
        }
        c.classList.add('flipped');
      }, idx * 550);
    });

    // Render text output below
    setTimeout(() => {
      if (resultDiv) {
        resultDiv.innerHTML = `
          <div class="card" style="margin-top:25px; text-align:left; border-left:4px solid var(--gold); line-height:1.7;">
            <h3 class="gold" style="margin-top:0;">🃏 Tarot Reading Guidance</h3>
            <div style="white-space:pre-wrap;">${this.escapeHTML(text)}</div>
            <div style="text-align:center; margin-top:20px;">
              <button class="period reset-tarot-btn" style="min-height:36px; padding:0 15px;">Draw Again</button>
            </div>
          </div>
        `;

        resultDiv.querySelector('.reset-tarot-btn').onclick = () => {
          this.resetDeck();
          if (resultDiv) resultDiv.innerHTML = '';
          const qInput = this.container.querySelector('#tarotQuestion');
          if (qInput) qInput.value = '';
        };
      }
    }, 1800);
  },

  escapeHTML(s) {
    return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }
};

const TAROT_POOL = [
  { name: "The Fool", meaning: "New beginnings, optimism, trust in life, spontaneous actions." },
  { name: "The Magician", meaning: "Manifestation, resourcefulness, power, inspired action." },
  { name: "The High Priestess", meaning: "Intuition, sacred knowledge, divine feminine, subconscious mind." },
  { name: "The Empress", meaning: "Abundance, creativity, nurturing, connection to nature." },
  { name: "The Emperor", meaning: "Authority, structure, solid foundations, protective leadership." },
  { name: "The Hierophant", meaning: "Tradition, spiritual guidance, seeking knowledge, conformity." },
  { name: "The Lovers", meaning: "Harmony, choices, relationships, alignment of values." },
  { name: "The Chariot", meaning: "Determination, willpower, victory through focus and control." },
  { name: "Strength", meaning: "Inner strength, courage, patience, compassion, quiet influence." },
  { name: "The Hermit", meaning: "Solitude, inner reflection, spiritual journey, guidance from within." },
  { name: "Wheel of Fortune", meaning: "Changes, destiny, turning points, cycles of life." },
  { name: "Justice", meaning: "Truth, fairness, cause and effect, clear decision-making." },
  { name: "The Hanged Man", meaning: "New perspective, letting go, patience, temporary pause." },
  { name: "Death", meaning: "Transformation, endings and new beginnings, transition, renewal." },
  { name: "Temperance", meaning: "Balance, patience, moderation, blending opposites." },
  { name: "The Devil", meaning: "Shadow self, attachment, material focus, breaking free of chains." },
  { name: "The Tower", meaning: "Sudden change, upheaval, revelation, dismantling old structures." },
  { name: "The Star", meaning: "Hope, faith, healing, spiritual guidance, rejuvenation." },
  { name: "The Moon", meaning: "Illusions, dreams, intuition, navigating uncertainty." },
  { name: "The Sun", meaning: "Success, happiness, vitality, clarity, joyful abundance." },
  { name: "Judgement", meaning: "Self-evaluation, awakening, calling, critical decision." },
  { name: "The World", meaning: "Completion, integration, travel, achievement, wholeness." }
];

function getTarotFallbackText(question) {
  const shuffled = [...TAROT_POOL].sort(() => 0.5 - Math.random());
  const past = shuffled[0];
  const present = shuffled[1];
  const future = shuffled[2];
  
  return `CARDS: ${past.name} | ${present.name} | ${future.name}

Question: "${question}"

📜 PAST: ${past.name}
This card shows that your past influences were defined by: ${past.meaning} You have recently completed a phase related to this energy.

🌟 PRESENT: ${present.name}
Right now, you are navigating the energy of: ${present.meaning} Look closely at how this is manifesting in your daily decisions.

🔮 FUTURE: ${future.name}
As you move forward, the path leads towards: ${future.meaning} Embrace this energy to align with your highest potential.

✨ Spiritual Guidance:
Remember that the cards reflect the energies around you, but your free will determines your final path. Maintain focus, trust your intuition, and proceed with courage.`;
}
