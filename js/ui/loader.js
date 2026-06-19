const PHRASES = {
  default: [
    'Consulting the cosmic intelligence…',
    'Aligning planetary coordinates…',
    'Reading the stars for you…'
  ],
  panchang: [
    'Fetching today’s sacred Panchang timings…',
    'Calculating Sunrise, Sunset and Moon phases…',
    'Deriving Rahu Kaal and Shubh Muhurtas…'
  ],
  kundali: [
    'Calculating real planetary degrees (sidereal)…',
    'Drawing the North Indian chart houses…',
    'Checking Mars position for Manglik Dosha…',
    'Constructing the Vimshottari Mahadasha timeline…'
  ],
  milan: [
    'Matching Boy and Girl Nakshatras…',
    'Calculating all 8 Ashtakoota factors…',
    'Generating compatibility score out of 36…',
    'Checking for Nadi, Bhakoot and Gana Doshas…'
  ],
  ai: [
    'Jyotish ji aapka jawab taiyar kar rahe hain…',
    'Analyzing your birth chart parameters…',
    'Writing personalized Vedic insights…',
    'Grahon ki position calculate ho rahi hai…'
  ],
  numerology: [
    'Reducing date numbers to Life Path…',
    'Adding letters in name for Destiny number…',
    'Calculating your core numbers…'
  ],
  tarot: [
    'Shuffling the sacred Tarot deck…',
    'Drawing 3 cards for Past, Present, Future…',
    'Aligning card meanings with your question…'
  ]
};

export const loader = {
  show(element, type = 'default') {
    if (!element) return;
    element.innerHTML = '';
    element.classList.add('show');
    
    const phrases = PHRASES[type] || PHRASES.default;
    let phraseIdx = 0;
    
    element.innerHTML = `
      <div class="spinner"></div>
      <div class="loader-text" style="margin-top: 12px; font-weight: 500; font-size: 0.95rem; color: var(--gold); min-height: 24px;">
        ${phrases[0]}
      </div>
    `;
    
    const textNode = element.querySelector('.loader-text');
    const intervalId = setInterval(() => {
      if (!element.classList.contains('show')) {
        clearInterval(intervalId);
        return;
      }
      phraseIdx = (phraseIdx + 1) % phrases.length;
      if (textNode) textNode.textContent = phrases[phraseIdx];
    }, 2500);
    
    element.dataset.loaderInterval = intervalId;
  },
  
  hide(element) {
    if (!element) return;
    element.classList.remove('show');
    element.innerHTML = '';
    if (element.dataset.loaderInterval) {
      clearInterval(Number(element.dataset.loaderInterval));
      delete element.dataset.loaderInterval;
    }
  }
};
