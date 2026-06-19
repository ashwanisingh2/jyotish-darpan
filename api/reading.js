const SYSTEM = 'You are a sophisticated modern Vedic astrologer with 30 years of experience. Respond in clear, elegant English. Give detailed, personalized, spiritually insightful readings. Always cover multiple life areas. Use relevant emojis. Be warm, accurate, and empowering. Never give generic advice. Clearly disclose when an exact astronomical calculation cannot be made from the supplied data. Never present spiritual guidance as medical, legal, or financial certainty.';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI service is not configured.' });
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (prompt.length < 5 || prompt.length > 6000) return res.status(400).json({ error: 'Please provide a valid reading request.' });
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.8 }
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: 'AI reading is temporarily unavailable.' });
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('\n').trim();
    if (!text) return res.status(502).json({ error: 'AI returned no reading. Please try again.' });
    return res.status(200).json({ text });
  } catch (error) {
    console.error('Gemini request failed', error.message);
    return res.status(502).json({ error: 'Unable to reach the AI service.' });
  }
};
