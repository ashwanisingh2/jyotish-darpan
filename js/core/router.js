import { notify } from '../ui/notifications.js';

export const router = {
  init() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    
    nav.onclick = (e) => {
      const btn = e.target.closest('.nav-btn');
      if (!btn) return;
      this.switchTab(btn.dataset.tab);
    };

    // Quick links / search redirection
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        this.switchTab(hash);
      }
    });

    // Handle home hash loading
    const hash = window.location.hash.slice(1);
    if (hash) {
      this.switchTab(hash);
    }
  },

  switchTab(tabId) {
    const validTabs = ['horoscope', 'kundali', 'milan', 'numerology', 'rashi', 'tarot'];
    if (!validTabs.includes(tabId)) {
      // Fallback
      if (tabId === 'gyaan') tabId = 'rashi';
      else return;
    }

    // Deactivate all nav buttons and tabs
    document.querySelectorAll('.nav-btn, .tab').forEach(x => {
      x.classList.remove('active');
    });

    // Activate the selected tab
    const tabEl = document.getElementById(tabId);
    const navBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    
    if (tabEl) tabEl.classList.add('active');
    if (navBtn) navBtn.classList.add('active');

    // Scroll to top of tab smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close any open space modal if open
    const d = document.getElementById('spaceModal');
    if (d && typeof d.close === 'function' && d.open) {
      d.close();
    }
  }
};
