const { kundali } = require('../lib/vedic');
const { validCoordinates, validDate, validTime } = require('../lib/validation');

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const body = req.body || {};
  if (!validDate(body.date) || (body.time && !validTime(body.time)) || !validCoordinates(body.lat, body.lon)) {
    return res.status(400).json({ error: 'A valid date, time, latitude and longitude are required' });
  }
  try {
    return res.status(200).json(kundali(body));
  } catch {
    return res.status(400).json({ error: 'Unable to calculate chart' });
  }
};
