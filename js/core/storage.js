const P = 'jyotish-profiles';
const H = 'jyotish-history';
const S = 'jyotish-settings';

export const storage = {
  read(k) {
    try {
      return JSON.parse(localStorage.getItem(k)) || null;
    } catch {
      return null;
    }
  },

  write(k, v) {
    localStorage.setItem(k, JSON.stringify(v));
  },

  getProfiles() {
    return this.read(P) || [];
  },

  saveProfile(profile) {
    const profiles = this.getProfiles();
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index > -1) {
      profiles[index] = profile;
    } else {
      profiles.unshift(profile);
    }
    this.write(P, profiles.slice(0, 30));
    return profiles;
  },

  deleteProfile(id) {
    const profiles = this.getProfiles();
    const updated = profiles.filter(p => p.id !== id);
    this.write(P, updated);
    return updated;
  },

  getHistory() {
    return this.read(H) || [];
  },

  addHistory(entry) {
    const history = this.getHistory();
    history.unshift({ ...entry, at: Date.now() });
    this.write(H, history.slice(0, 20));
    return history;
  },

  clearHistory() {
    localStorage.removeItem(H);
  },

  getSettings() {
    return this.read(S) || {
      lang: 'en',
      theme: 'dark',
      fontSize: 'medium',
      notifications: false
    };
  },

  saveSettings(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.write(S, updated);
    return updated;
  }
};
