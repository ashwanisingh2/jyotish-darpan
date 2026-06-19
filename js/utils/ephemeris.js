// Wrapper representing Vedic Ephemeris calculation references.
// Core Lahiri calculations are performed securely on the Vercel backend using Astronomy Engine.
export const ephemeris = {
  async fetchKundali(date, time, lat, lon) {
    const res = await fetch('/api/kundali', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ date, time, lat, lon })
    });
    return res.json();
  }
};
