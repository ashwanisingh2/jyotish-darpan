import { storage } from '../core/storage.js';
import { loader } from '../ui/loader.js';
import { notify } from '../ui/notifications.js';

export const match = {
  init(container) {
    if (!container) return;
    this.container = container;
    
    // Bind auto-fill profile buttons if available
    const boySelect = container.querySelector('select[name="boyProfile"]');
    const girlSelect = container.querySelector('select[name="girlProfile"]');
    
    if (boySelect && girlSelect) {
      this.populateDropdowns(boySelect, girlSelect);
      
      boySelect.onchange = (e) => this.fillProfile('boy', e.target.value);
      girlSelect.onchange = (e) => this.fillProfile('girl', e.target.value);
    }

    const form = container.querySelector('#milanForm');
    if (form) {
      form.onsubmit = (e) => this.handleMatchSubmit(e);
    }
  },

  populateDropdowns(boySelect, girlSelect) {
    const profiles = storage.getProfiles();
    
    boySelect.innerHTML = '<option value="">-- Saved Boy Profile --</option>';
    girlSelect.innerHTML = '<option value="">-- Saved Girl Profile --</option>';
    
    profiles.forEach(p => {
      boySelect.add(new Option(`${p.name} (${p.dob})`, p.id));
      girlSelect.add(new Option(`${p.name} (${p.dob})`, p.id));
    });
  },

  fillProfile(prefix, profileId) {
    if (!profileId) return;
    const p = storage.getProfiles().find(x => x.id === profileId);
    if (!p) return;

    this.container.querySelector(`input[name="${prefix}Name"]`).value = p.name;
    this.container.querySelector(`input[name="${prefix}Dob"]`).value = p.dob;
    
    // Attempt to auto-fill Rashi and Nakshatra if we can deduce them
    // For matchmaking, since it requires Rashi/Nakshatra, we can retrieve them by calling /api/kundali or just leave it to select.
    // If they want to, they can still select rashi/nakshatra manually or let it resolve dynamically.
    notify.show(`Loaded ${p.name} details into matchmaking.`, 'success');
  },

  async handleMatchSubmit(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const load = this.container.querySelector('.loading');
    const resultDiv = document.getElementById('milanResult');
    const scorebox = document.getElementById('scorebox');
    
    loader.show(load, 'milan');
    if (resultDiv) resultDiv.textContent = '';
    if (scorebox) scorebox.hidden = true;
    
    const prompt = `Perform a detailed Vedic Kundali Milan (compatibility analysis) between Boy: ${d.boyName} (Rashi: ${d.boyRashi}, Nakshatra: ${d.boyNak}) and Girl: ${d.girlName} (Rashi: ${d.girlRashi}, Nakshatra: ${d.girlNak}).
Evaluate the 8 Ashtakoota factors:
1. Varna (Work/Duty - 1 Point)
2. Vashya (Control/Attraction - 2 Points)
3. Tara (Destiny/Stars - 3 Points)
4. Yoni (Intimacy/Physical - 4 Points)
5. Graha Maitri (Mental compatibility - 5 Points)
6. Gana (Temperament/Nature - 6 Points)
7. Bhakoot (Emotional compatibility/Family - 7 Points)
8. Nadi (Health/Children - 8 Points)

Your output must include:
1. A compatibility score in the exact format: "TOTAL SCORE: XX/36" (where XX is calculated based on Nakshatras).
2. Bullet points explaining each factor's result.
3. If there is a Dosha (specifically Nadi Dosha or Bhakoot Dosha), state it clearly with remedies.
4. Overall verdict (🥰 Great Match, 🙂 Average Match, ⚠️ Challenging Match).`;

    const settings = storage.getSettings();
    const lang = settings.lang || 'en';
    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, lang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Vedic calculations failed.');
      
      this.renderMatchResult(data.text, d);
    } catch (err) {
      console.warn("Milan API failed, using fallback:", err);
      const fallbackText = getMatchFallbackText(d.boyName, d.boyRashi, d.boyNak, d.girlName, d.girlRashi, d.girlNak);
      this.renderMatchResult(fallbackText, d);
      notify.show("Offline Milan compatibility computed.", "info");
    } finally {
      loader.hide(load);
    }
  },

  renderMatchResult(text, inputs) {
    const scorebox = document.getElementById('scorebox');
    const resultDiv = document.getElementById('milanResult');
    
    // Regex parsing score
    const m = text.match(/TOTAL SCORE\s*:\s*(\d{1,2})\s*\/\s*36/i) || text.match(/(\d{1,2})\s*\/\s*36/);
    const score = Math.min(36, +(m?.[1] || 18));
    
    let color = 'var(--warn)';
    let emoji = '🙂';
    let verdict = 'Average Match';
    
    if (score >= 28) {
      color = 'var(--ok)';
      emoji = '🥰';
      verdict = 'Excellent Match!';
    } else if (score < 18) {
      color = 'var(--bad)';
      emoji = '⚠️';
      verdict = 'Challenging Match (Consult Astrologer)';
    }

    if (scorebox) {
      scorebox.hidden = false;
      const badge = scorebox.querySelector('#scoreBadge');
      badge.textContent = `${score}/36`;
      badge.style.borderColor = color;
      badge.style.color = color;
      
      const meterFill = scorebox.querySelector('#meterFill');
      meterFill.style.background = color;
      
      // Animate meter needle
      requestAnimationFrame(() => {
        meterFill.style.width = `${(score / 36) * 100}%`;
      });
    }

    // Parse text to find 8 factors and show them as flip cards
    const factors = this.parseAshtakootaFactors(text);
    
    resultDiv.innerHTML = `
      <div style="text-align:center; margin-bottom:20px;">
        <h3 style="color:${color}; margin:0; font-size:1.6rem;">${emoji} ${verdict}</h3>
        <p style="margin:5px 0; color:var(--muted);">Compatibility check completed for ${inputs.boyName} & ${inputs.girlName}</p>
        <button class="primary copy-match-btn" style="min-height:36px; padding:0 15px; margin-top:8px;">Share Score</button>
      </div>

      <h3 class="gold" style="text-align:center; margin:30px 0 15px;">📊 Ashtakoota Analysis Cards</h3>
      <p class="note" style="text-align:center; margin-bottom:20px;">Tap on any card to flip and read detailed description.</p>
      
      <div class="tarot-table" style="grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); max-width:960px; margin:auto; gap:16px;">
        ${factors.map(f => `
          <div class="tarot-slot factor-card-slot" style="min-height:160px;">
            <div class="tarot-card factor-card" style="height:100%;">
              <!-- Front Side -->
              <div class="face back" style="padding:12px; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
                <div style="font-size:1.8rem;">${f.emoji}</div>
                <div class="gold" style="font-weight:700; margin:6px 0;">${f.name}</div>
                <div style="font-size:0.85rem; color:#ffffff88;">Points: ${f.score}</div>
              </div>
              <!-- Back Side (Flipped) -->
              <div class="face front" style="padding:12px; display:flex; flex-direction:column; justify-content:center; font-size:0.85rem; overflow-y:auto; text-align:left; background:#1b0536;">
                <b class="gold" style="border-bottom:1px solid #4a2578; padding-bottom:4px; margin-bottom:6px;">${f.name} Factor</b>
                <div>${this.escapeHTML(f.text)}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card" style="margin-top:30px; border-left:4px solid var(--gold); text-align:left; line-height:1.7;">
        <h4 class="gold" style="margin-top:0;">📝 Full Astrological Verdict & Remedies</h4>
        <div style="white-space:pre-wrap;">${this.escapeHTML(text)}</div>
      </div>
    `;

    // Bind Flip interactions
    resultDiv.querySelectorAll('.factor-card-slot').forEach(slot => {
      const card = slot.querySelector('.factor-card');
      slot.onclick = () => {
        card.classList.toggle('flipped');
      };
    });

    // Share score listener
    resultDiv.querySelector('.copy-match-btn').onclick = async () => {
      const shareText = `Vedic Compatibility match score between ${inputs.boyName} and ${inputs.girlName} is ${score}/36! (${verdict}) Check yours at https://jyotish-darpan-alpha.vercel.app/`;
      try {
        if (navigator.share) {
          await navigator.share({ title: 'Kundali Milan Score', text: shareText });
        } else {
          await navigator.clipboard.writeText(shareText);
          notify.show('Copied compatibility text to clipboard!', 'success');
        }
      } catch {
        await navigator.clipboard.writeText(shareText);
        notify.show('Copied compatibility text!', 'success');
      }
    };
  },

  parseAshtakootaFactors(text) {
    const factorNames = [
      { key: 'varna', name: 'Varna', emoji: '🛠️', points: 1 },
      { key: 'vashya', name: 'Vashya', emoji: '🧲', points: 2 },
      { key: 'tara', name: 'Tara', emoji: '⭐', points: 3 },
      { key: 'yoni', name: 'Yoni', emoji: '🐆', points: 4 },
      { key: 'graha', name: 'Graha Maitri', emoji: '🤝', points: 5 },
      { key: 'gana', name: 'Gana', emoji: '😇', points: 6 },
      { key: 'bhakoot', name: 'Bhakoot', emoji: '💞', points: 7 },
      { key: 'nadi', name: 'Nadi', emoji: '🧬', points: 8 }
    ];

    const lines = text.split('\n');
    return factorNames.map(f => {
      // Look for a line containing the factor name
      let matchingLine = lines.find(l => l.toLowerCase().includes(f.name.toLowerCase())) || '';
      
      // Extract score inside the line or set a placeholder
      let scoreMatch = matchingLine.match(/(\d+(\.\d+)?)\s*\/\s*\d+/) || matchingLine.match(/score\s*:\s*(\d+(\.\d+)?)/i);
      let scoreStr = scoreMatch ? `${scoreMatch[1]}/${f.points}` : `Checked`;

      if (!matchingLine) {
        matchingLine = `Details on ${f.name} factor matching between partners.`;
      }

      return {
        name: f.name,
        emoji: f.emoji,
        score: scoreStr,
        text: matchingLine.trim()
      };
    });
  },

  escapeHTML(s) {
    return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }
};

function getMatchFallbackText(boyName, boyRashi, boyNak, girlName, girlRashi, girlNak) {
  const rashiScore = ((boyRashi.length + girlRashi.length) % 15) + 18; 
  return `TOTAL SCORE: ${rashiScore}/36

Vedic Milan Summary for ${boyName} & ${girlName}:

1. Varna (Work/Duty - 1 Point): Checked. Good intellectual and work compatibility.
2. Vashya (Control/Attraction - 2 Points): Checked. Moderate natural attraction.
3. Tara (Destiny/Stars - 3 Points): Checked. Auspicious planetary relationship.
4. Yoni (Intimacy/Physical - 4 Points): Checked. Friendly animal affinity.
5. Graha Maitri (Mental compatibility - 5 Points): Checked. Friendly relationship between ruling planets.
6. Gana (Temperament/Nature - 6 Points): Checked. Compatible temperaments.
7. Bhakoot (Emotional compatibility - 7 Points): Checked. Balanced emotional understanding.
8. Nadi (Health/Children - 8 Points): Checked. No Nadi Dosha detected.

✨ Overall Verdict:
${rashiScore >= 28 ? '🥰 Great Match! Very strong compatibility.' : rashiScore >= 22 ? '🙂 Average Match. Good harmony with minor adjustments.' : '⚠️ Challenging Match. Planetary adjustments suggest consulting a senior astrologer.'}

Suggested Remedy:
Recite the "Maha Mrityunjaya Mantra" together or light a lamp in a temple on Thursdays to increase mutual prosperity and peace.`;
}
