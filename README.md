# Jyotish Darpan 🔮

Secure production baseline. The Groq key remains on the server and is never sent to the browser. Numerology calculations and the complete interface work locally; Groq supplies personalized narrative readings.

## Key Features 🚀

- **Dual-Language Mode**: Native support for **English** and **Hinglish** (Vedic mix of Hindi and English written in Latin script) for both the AI readings and the app UI. No Devanagari characters are used, keeping the typography clean and readable.
- **Vedic AI Astrologer**: Personalised Kundali chart analysis, daily horoscopes, Panchang-guided weather summaries, numerology readings, and Tarot interpretations using Groq API.
- **Fail-Safe Robustness**: Integrated validation checks ensuring complete paragraph responses (`overview`, `career`, `love`, `health_remedies`) and parameters (`lucky_color`, `lucky_number`, `lucky_time`).
- **Offline Fallback**: In case of server timeouts or quota limit triggers, the backend instantly falls back to language-specific detailed template readings to provide uninterrupted user experience.
- **Privacy First**: Guest profiles and settings are stored locally in the browser (`localStorage`).
- **Fast Caching**: Identical horoscope requests are cached locally for 6 hours (`jd:horo:v3:${lang}:...`) to minimize API requests and conserve provider quota.

## Free-use policy 🛡️

Jyotish Darpan is a free portal. It contains no payment gateway, subscription, premium tier, checkout, invoice generation, or paid feature lock. Infrastructure and Gemini provider usage may still create costs for the site owner, but visitors are never charged by the application.

## Local run 💻

Requires Node.js 18+. In PowerShell:

```powershell
$env:GROQ_API_KEY='your-groq-api-key'
npm start
```

Open `http://127.0.0.1:8765`. For production hosting, set `HOST=0.0.0.0`, `PORT`, and `GROQ_API_KEY` in the platform environment and put the service behind HTTPS. Never commit `.env` or configuration secrets.

## Deploy to Vercel ⚡

Import the GitHub repository in Vercel, leave Framework Preset as `Other`, and add `GROQ_API_KEY` plus optional `GROQ_MODEL=llama-3.3-70b-versatile` under Project Settings → Environment Variables. Deploy; `vercel.json` routes the static portal and `/api/*` uses serverless functions.

---

*The displayed Kundali and planetary table are illustrative. Exact charts, Panchang timings, dashas, and dosha calculations require a trusted sidereal ephemeris and geocoded birth-place integration. The included service worker provides a basic offline application shell.*
