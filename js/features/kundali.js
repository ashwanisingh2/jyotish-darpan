import { storage } from '../core/storage.js';
import { charts } from '../ui/charts.js';
import { notify } from '../ui/notifications.js';
import { loader } from '../ui/loader.js';
import { dateUtils } from '../utils/date.js';

let activeChartData = null;

export const kundali = {
  init(container) {
    if (!container) return;
    this.container = container;
    
    // Bind profile switch dropdowns
    const profileSelects = document.querySelectorAll('.profile-select');
    profileSelects.forEach(sel => {
      sel.onchange = (e) => this.loadProfileToForm(e.target.value);
    });

    // Populate "Current Time" buttons
    const nowTimeBtns = container.querySelectorAll('.now-time-btn');
    nowTimeBtns.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const form = btn.closest('form');
        if (form) {
          const timeInput = form.querySelector('input[type="time"]');
          if (timeInput) timeInput.value = dateUtils.getCurrentTime();
          const dateInput = form.querySelector('input[type="date"]');
          if (dateInput) dateInput.value = dateUtils.getCurrentDate();
        }
      };
    });

    // Handle geocoding input autocomplete
    const placeInputs = container.querySelectorAll('input[name="place"]');
    placeInputs.forEach(input => {
      this.setupGeocoding(input);
    });

    // Main Birth Chart Submit
    const form = container.querySelector('#kundaliForm');
    if (form) {
      form.onsubmit = (e) => this.handleKundaliSubmit(e);
    }

    // Save profile from form
    const saveProfileBtn = container.querySelector('#saveProfileBtn');
    if (saveProfileBtn) {
      saveProfileBtn.onclick = (e) => {
        e.preventDefault();
        this.saveProfileFromForm();
      };
    }

    // Manglik Dosha Checker
    const manglikForm = container.querySelector('#manglikForm');
    if (manglikForm) {
      manglikForm.onsubmit = (e) => this.handleManglikSubmit(e);
    }

    // Initial profiles loading
    this.refreshProfiles();
  },

  refreshProfiles() {
    const profiles = storage.getProfiles();
    
    // Update all profile dropdowns
    const profileSelects = document.querySelectorAll('.profile-select');
    profileSelects.forEach(sel => {
      sel.innerHTML = '<option value="">-- Choose Profile --</option>';
      profiles.forEach(p => {
        sel.add(new Option(`${p.name} (${p.relation || 'Self'})`, p.id));
      });
    });

    // Update list inside dialog
    const listEl = document.getElementById('profilesList');
    if (listEl) {
      listEl.innerHTML = profiles.length 
        ? profiles.map(p => `
          <div class="card" style="margin: 8px 0; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <b>${this.escapeHTML(p.name)}</b> (${p.relation || 'Self'})<br>
              <small>${p.dob} ${p.time} · ${this.escapeHTML(p.place)}</small>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="period load-p" data-id="${p.id}" type="button">Load</button>
              <button class="period del-p" data-id="${p.id}" style="color: var(--bad);" type="button">Delete</button>
            </div>
          </div>
        `).join('')
        : '<p class="note">No saved profiles.</p>';

      // Bind list action buttons
      listEl.querySelectorAll('.load-p').forEach(btn => {
        btn.onclick = () => {
          this.loadProfileToForm(btn.dataset.id);
          const modal = document.getElementById('spaceModal');
          if (modal && typeof modal.close === 'function') modal.close();
        };
      });

      listEl.querySelectorAll('.del-p').forEach(btn => {
        btn.onclick = () => {
          storage.deleteProfile(btn.dataset.id);
          this.refreshProfiles();
          notify.show('Profile deleted', 'success');
        };
      });
    }
  },

  loadProfileToForm(profileId) {
    if (!profileId) return;
    const profiles = storage.getProfiles();
    const p = profiles.find(x => x.id === profileId);
    if (!p) return;

    const form = this.container.querySelector('#kundaliForm');
    if (form) {
      form.querySelector('input[name="name"]').value = p.name;
      form.querySelector('input[name="dob"]').value = p.dob;
      form.querySelector('input[name="time"]').value = p.time || '12:00';
      form.querySelector('input[name="place"]').value = p.place;
      if (form.querySelector('select[name="relation"]')) {
        form.querySelector('select[name="relation"]').value = p.relation || 'Self';
      }
    }
    notify.show(`Loaded ${p.name}'s profile`, 'success');
  },

  saveProfileFromForm() {
    const form = this.container.querySelector('#kundaliForm');
    if (!form) return;
    const fd = new FormData(form);
    const name = fd.get('name').trim();
    const dob = fd.get('dob');
    const time = fd.get('time');
    const place = fd.get('place').trim();
    const relation = fd.get('relation') || 'Self';

    if (!name || !dob || !place) {
      notify.show('Name, Date, and Place are required to save profile.', 'warning');
      return;
    }

    const profiles = storage.getProfiles();
    // Check if duplicate name to overwrite
    const existing = profiles.find(p => p.name.toLowerCase() === name.toLowerCase());
    const id = existing ? existing.id : String(Date.now());

    storage.saveProfile({ id, name, dob, time, place, relation });
    this.refreshProfiles();
    notify.show(`Profile '${name}' saved locally!`, 'success');
  },

  setupGeocoding(input) {
    let wrap = input.parentNode;
    if (wrap.style.position !== 'relative') {
      wrap.style.position = 'relative';
    }
    
    // Create suggesions container
    const suggest = document.createElement('div');
    suggest.className = 'card suggest-box';
    suggest.style.cssText = 'position:absolute; left:0; right:0; top:100%; z-index:100; max-height:200px; overflow-y:auto; display:none; background:#180b2a; border:1px solid var(--border); border-radius:8px;';
    wrap.appendChild(suggest);

    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const q = input.value.trim();
      if (q.length < 3) {
        suggest.style.display = 'none';
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
          const data = await res.json();
          if (Array.isArray(data) && data.length) {
            suggest.innerHTML = data.map((item, idx) => `
              <div class="suggest-item" style="padding:10px; cursor:pointer; border-bottom:1px solid #281640;" data-idx="${idx}">
                ${this.escapeHTML(item.name)}
              </div>
            `).join('');
            suggest.style.display = 'block';

            suggest.querySelectorAll('.suggest-item').forEach(item => {
              item.onclick = () => {
                const selected = data[Number(item.dataset.idx)];
                input.value = selected.name;
                input.dataset.lat = selected.lat;
                input.dataset.lon = selected.lon;
                suggest.style.display = 'none';
              };
            });
          } else {
            suggest.style.display = 'none';
          }
        } catch {
          suggest.style.display = 'none';
        }
      }, 400);
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) {
        suggest.style.display = 'none';
      }
    });
  },

  async handleKundaliSubmit(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const load = this.container.querySelector('.card .loading');
    const resultDiv = document.getElementById('kundaliResult');
    
    loader.show(load, 'kundali');
    if (resultDiv) resultDiv.textContent = '';
    document.querySelector('.chart-wrap').style.display = 'none';
    
    try {
      let lat = e.target.querySelector('input[name="place"]').dataset.lat;
      let lon = e.target.querySelector('input[name="place"]').dataset.lon;
      
      if (!lat || !lon) {
        // If not selected from suggestions, do a quick geocode lookup
        const places = await fetch('/api/geocode?q=' + encodeURIComponent(d.place)).then(r => r.json());
        if (!Array.isArray(places) || !places.length) {
          throw new Error('Birth place coordinates could not be resolved. Please type your city name and choose a suggestion.');
        }
        lat = places[0].lat;
        lon = places[0].lon;
      }
      
      const chart = await fetch('/api/kundali', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date: d.dob, time: d.time, lat: Number(lat), lon: Number(lon) })
      }).then(r => r.json());
      
      if (chart.error) throw new Error(chart.error);
      
      activeChartData = chart;
      this.renderKundaliResult(chart, d);
      
    } catch (err) {
      if (resultDiv) resultDiv.textContent = 'Calculation Error: ' + err.message;
      notify.show(err.message, 'error');
    } finally {
      loader.hide(load);
    }
  },

  renderKundaliResult(chart, inputs) {
    document.querySelector('.chart-wrap').style.display = 'grid';
    
    // Draw SVG Chart
    const svg = document.querySelector('.chart');
    charts.drawKundali(svg, chart, (planet, info) => this.showPlanetPopup(planet, info));
    charts.setupPinchZoom(svg);

    // Populate planet table
    const tab = document.getElementById('planetTable');
    const emojiMap = { 'Sun':'☀','Moon':'☾','Mars':'♂','Mercury':'☿','Jupiter':'♃','Venus':'♀','Saturn':'♄','Rahu':'☊','Ketu':'☋' };
    tab.innerHTML = '<tr><th>Graha</th><th>Rashi</th><th>Degree</th><th>House</th></tr>' +
      chart.planets.map(p => `
        <tr style="cursor:pointer;" class="table-row-planet">
          <td>${emojiMap[p.body] || ''} <b>${p.body}</b></td>
          <td>${p.sign}</td>
          <td>${p.degree}°</td>
          <td>House ${p.house}</td>
        </tr>
      `).join('');
    
    // Attach click triggers to table rows for remedies popup
    tab.querySelectorAll('.table-row-planet').forEach((row, idx) => {
      row.onclick = () => {
        const p = chart.planets[idx];
        const info = charts.PLANET_INFO || {}; // Use planet info from charts or define locally
        const mockInfo = {
          name: p.body,
          emoji: emojiMap[p.body] || '✦',
          color: 'var(--gold)',
          desc: 'Positioned in sign ' + p.sign + ', degree ' + p.degree + '° in House ' + p.house,
          remedy: 'Consult AI Guru or details inside Planet Chart.'
        };
        const activeInfo = (charts.PLANET_INFO && charts.PLANET_INFO[p.body]) ? charts.PLANET_INFO[p.body] : mockInfo;
        this.showPlanetPopup(p, activeInfo);
      };
    });

    // Populate Dasha progress timeline
    const dasha = chart.mahadasha;
    const timelineEl = document.getElementById('dashaTimeline');
    if (timelineEl) {
      timelineEl.innerHTML = `
        <div class="card" style="margin-top:20px; border-left:4px solid ${dasha.color};">
          <h4 class="gold" style="margin-top:0;">🌌 Vimshottari Mahadasha Timeline</h4>
          <p style="margin:6px 0;">Current Period: <b>${dasha.name} Mahadasha</b> (${dasha.status})</p>
          <div class="meter" style="margin:12px 0;">
            <span style="width: ${dasha.completedPercent}%; background: ${dasha.color};"></span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.82rem; color:var(--muted);">
            <span>${dasha.completedPercent}% Completed</span>
            <span>${dasha.remainingYears} Years Remaining</span>
          </div>
        </div>
      `;
    }

    // Call AI for chart reading
    this.askAIConsultation(chart, inputs);
  },

  showPlanetPopup(planet, info) {
    const dialog = document.getElementById('planetDetailDialog');
    if (!dialog) {
      alert(`${info.name}:\n${info.desc}\nRemedy: ${info.remedy}`);
      return;
    }
    
    dialog.querySelector('#planetName').textContent = `${info.emoji} ${info.name}`;
    dialog.querySelector('#planetName').style.color = info.color;
    dialog.querySelector('#planetDesc').textContent = info.desc;
    dialog.querySelector('#planetRemedy').innerHTML = `<b>Remedy:</b> ${info.remedy}`;
    
    dialog.showModal();
    dialog.querySelector('#closePlanetDialog').onclick = () => dialog.close();
  },

  async askAIConsultation(chart, inputs) {
    const resultDiv = document.getElementById('kundaliResult');
    if (!resultDiv) return;
    
    resultDiv.innerHTML = '<div class="spinner"></div><div>Vedic AI Astrologer is analyzing your planetary chart alignments…</div>';
    
    const facts = `Lagna ${chart.lagna.sign} ${chart.lagna.degree}°, Moon sign ${chart.moonSign}, Nakshatra ${chart.nakshatra} Pada ${chart.nakshatraPada}. Mahadasha: ${chart.mahadasha.name} (${chart.mahadasha.completedPercent}% complete). Mars in House ${chart.planets.find(p=>p.body==='Mars').house}. Manglik Dosha: ${chart.manglik.severity} (${chart.manglik.percentage}%). Planets placements: ${chart.planets.map(p => `${p.body} in house ${p.house} (${p.sign} ${p.degree}°)`).join('; ')}`;

    const prompt = `Perform a highly detailed, personalized, spiritually insightful Vedic birth chart analysis for ${inputs.name}, born on ${inputs.dob} at ${inputs.time} in ${inputs.place}.
Using these accurate calculations:
${facts}

Please structure the reading exactly as follows:
1. 🎯 SUMMARY (A quick 2-line cosmic theme of their chart).
2. 📊 DETAILED ANALYSIS (Deep explanation of Lagna personality, Moon sign emotions, and key planetary strengths in their houses).
3. 💡 PLANETARY REMEDIES & SUGGESTIONS (Practical remedies for weak placements and current Dasha: Hanuman Chalisa, Peepal Tree lamp, charity, etc.).
4. ⚠️ CAUTIONS (Potential challenges or areas of life to guard over the next 12 months).
Format nicely with relevant emojis and warm encouraging Vedic tone.`;

    const settings = storage.getSettings();
    const lang = settings.lang || 'en';
    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, lang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Vedic intelligence was silent.');
      
      const askLabel = lang === 'en' ? 'Ask follow-up questions about your Kundali chart below:' : '<b>Puchiye:</b> Ask follow-up questions about your Kundali chart below:';
      const placeholderText = lang === 'en' ? 'E.g., When will my career change happen? How will my health be?' : 'E.g., Career change kab hoga? Meri health kaisi rahegi?';
      const askBtnText = lang === 'en' ? 'Ask' : 'Ask';

      resultDiv.innerHTML = `
        <div class="card" style="border-top:3px solid var(--gold); margin-top:20px; line-height:1.7; text-align:left;">
          <h3 class="gold" style="margin-top:0;">🔮 Astrologer AI Consultation</h3>
          <div style="white-space:pre-wrap;">${this.escapeHTML(data.text)}</div>
          <hr style="border-color:#2c174d; margin:15px 0;">
          <div style="margin-top:12px;">
            <p class="note">${askLabel}</p>
            <div style="display:flex; gap:10px; margin-top:8px;">
              <input type="text" id="chartQuestion" placeholder="${placeholderText}" style="flex:1;">
              <button class="primary" id="chartAskBtn" style="min-height:36px; padding:0 15px;">${askBtnText}</button>
            </div>
            <div class="loading" id="chartAskLoading"></div>
            <div id="chartAskResult" class="result" style="margin-top:10px; font-size:0.92rem; border-left:2px solid var(--gold); padding-left:12px;"></div>
          </div>
        </div>
      `;

      // Set up follow-up chat click
      resultDiv.querySelector('#chartAskBtn').onclick = () => {
        const q = resultDiv.querySelector('#chartQuestion').value.trim();
        if (q) this.askChartFollowUp(q, facts);
      };
      
    } catch (e) {
      resultDiv.textContent = `Cosmic consultation failed: ${e.message}`;
    }
  },

  async askChartFollowUp(question, facts) {
    const loadEl = document.getElementById('chartAskLoading');
    const outEl = document.getElementById('chartAskResult');
    
    loader.show(loadEl, 'ai');
    if (outEl) outEl.textContent = '';
    
    const prompt = `The user is asking a follow-up question regarding their Vedic Birth Chart.
Chart data: ${facts}
Question: "${question}"

Provide a warm, empowering, spiritually wise, and accurate answer based on their chart placements. Clearly explain the astrological houses or planets related to their question (e.g. 10th house for career, 7th house for marriage, etc.) and suggest practical Vedic remedies. Limit response to 150-200 words.`;

    const settings = storage.getSettings();
    const lang = settings.lang || 'en';
    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, lang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI not responding.');
      if (outEl) outEl.textContent = data.text;
    } catch (e) {
      if (outEl) outEl.textContent = `Error: ${e.message}`;
    } finally {
      loader.hide(loadEl);
    }
  },

  async handleManglikSubmit(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const load = e.target.closest('.card').querySelector('.loading');
    const resultDiv = document.getElementById('manglikResult');
    
    loader.show(load, 'default');
    if (resultDiv) resultDiv.textContent = '';
    
    const prompt = `Based on Date of Birth ${d.dob} and Lagna (Ascendant) sign ${d.lagna}, analyze whether this person has Manglik Dosha (Mars in 1st, 4th, 7th, 8th, or 12th house). Explain the type (partial/full), its effects on marriage, and Vedic remedies to neutralize it. Since exact Mars placement cannot be derived from only DOB and Lagna without birth time/place and ephemeris, clearly state this limitation before offering a conditional analysis. Begin the final assessment with exactly one label: MANGLIK, NON-MANGLIK, PARTIAL, or INDETERMINATE.`;
    
    const settings = storage.getSettings();
    const lang = settings.lang || 'en';
    try {
      const res = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, lang })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      
      if (resultDiv) {
        resultDiv.textContent = data.text;
        resultDiv.style.borderColor = /NON-MANGLIK/i.test(data.text) ? 'var(--ok)' : /PARTIAL|INDETERMINATE/i.test(data.text) ? 'var(--warn)' : 'var(--bad)';
      }
    } catch (err) {
      if (resultDiv) resultDiv.textContent = `Error: ${err.message}`;
      notify.show(err.message, 'error');
    } finally {
      loader.hide(load);
    }
  },

  escapeHTML(s) {
    return String(s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }
};
