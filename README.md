# Jyotish Darpan

Secure production baseline. The Gemini key remains on the server and is never sent to the browser. Numerology calculations and the complete interface work locally; Gemini supplies personalized narrative readings.

## Free-use policy

Jyotish Darpan is a free portal. It contains no payment gateway, subscription, premium tier, checkout, invoice generation, or paid feature lock. Infrastructure and Gemini provider usage may still create costs for the site owner, but visitors are never charged by the application.

## Local run

Requires Node.js 18+. In PowerShell:

```powershell
$env:GEMINI_API_KEY='your-google-ai-studio-key'
npm start
```

Open `http://127.0.0.1:8765`. For production hosting, set `HOST=0.0.0.0`, `PORT`, and `GEMINI_API_KEY` in the platform environment and put the service behind HTTPS. Never commit `.env`.

## Deploy to Vercel

Import the GitHub repository in Vercel, leave Framework Preset as `Other`, and add `GEMINI_API_KEY` plus optional `GEMINI_MODEL=gemini-2.5-flash` under Project Settings → Environment Variables. Deploy; `vercel.json` routes the static portal and `/api/*` uses serverless functions.

The displayed Kundali and planetary table are illustrative. Exact charts, Panchang timings, dashas, and dosha calculations require a trusted sidereal ephemeris and geocoded birth-place integration.

Guest profiles and the last 20 readings are stored only in the visitor's browser. Repeated identical AI requests are cached locally for 24 hours to conserve the Gemini free-tier quota. The included service worker provides a basic offline application shell.
