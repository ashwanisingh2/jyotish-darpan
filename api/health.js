module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    aiConfigured: Boolean(process.env.GROQ_API_KEY),
    version: '1.2.2',
    runtime: 'vercel'
  });
};
