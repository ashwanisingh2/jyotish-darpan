const { cleanText } = require('../lib/validation');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const q = cleanText(req.query.q, 120);
  if (q.length < 3) return res.status(400).json({ error: 'Enter at least 3 characters' });
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'JyotishDarpan/1.2 (contact via deployed website)', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('Geocoder error');
    const data = await response.json();
    return res.status(200).json(data.map(x => ({ name: x.display_name, lat: Number(x.lat), lon: Number(x.lon) })));
  } catch {
    return res.status(502).json({ error: 'Place search unavailable' });
  }
};
