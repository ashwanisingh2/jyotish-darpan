const { panchang } = require('../lib/vedic');
const { validCoordinates } = require('../lib/validation');

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const date = new Date(req.query.date || new Date().toISOString());
  if (!Number.isFinite(date.getTime()) || !validCoordinates(req.query.lat, req.query.lon)) {
    return res.status(400).json({ error: 'A valid date, latitude and longitude are required' });
  }
  try {
    return res.status(200).json(panchang({ date, lat: Number(req.query.lat), lon: Number(req.query.lon) }));
  } catch {
    return res.status(400).json({ error: 'Unable to calculate Panchang' });
  }
};
