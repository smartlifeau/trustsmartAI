# TrustSmart AI — Netlify Deployment

Australia's genuineness checker. Part of the SmartLife AU suite.

## Structure

```
trustsmart-ai/
├── netlify.toml                  # Netlify config — publish dir + function routing
├── package.json
├── .env.example                  # Copy to .env for local dev
├── public/
│   └── index.html                # Full frontend app
└── netlify/
    └── functions/
        └── check.js              # Serverless function — holds API key securely
```

## How it works

The frontend calls `/api/check` → `netlify.toml` routes this to `/.netlify/functions/check` → the function adds your Anthropic API key and calls the Claude API. Your key never touches the browser.

---

## Deploy to Netlify (5 minutes)

### Option A — Netlify Drop (fastest, no GitHub needed)

1. Zip the entire `trustsmart-ai` folder
2. Go to [netlify.com](https://netlify.com) → **Add new site → Deploy manually**
3. Drag and drop the zip
4. Go to **Site Settings → Environment Variables → Add variable**
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from [console.anthropic.com](https://console.anthropic.com)
5. Go to **Deploys → Trigger deploy → Deploy site**

### Option B — GitHub (recommended for ongoing updates)

1. Push this folder to a new GitHub repo
2. In Netlify: **Add new site → Import from Git → connect your repo**
3. Build settings will be auto-detected from `netlify.toml`
4. Add `ANTHROPIC_API_KEY` under **Site Settings → Environment Variables**
5. Click **Deploy**

---

## Connect your domain

1. Register `trustsmartai.com.au` (or your chosen domain) via Crazy Domains / VentraIP
2. In Netlify: **Site Settings → Domain Management → Add custom domain**
3. Follow Netlify's DNS instructions (add CNAME or A record at your registrar)
4. Netlify auto-provisions SSL (free)

---

## Add GA4

1. Create a new GA4 property under your SmartLife AU account
2. Copy your Measurement ID (format: G-XXXXXXXXXX)
3. Uncomment the GA4 snippet in `public/index.html` and replace `G-XXXXXXXXXX`
4. Redeploy

---

## Add to Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property → URL prefix → enter your domain
3. Verify via HTML tag (add to `<head>` in `public/index.html`) or DNS TXT record

---

## Local development (optional)

Install [Netlify CLI](https://docs.netlify.com/cli/get-started/):

```bash
npm install -g netlify-cli
cp .env.example .env
# Add your API key to .env
netlify dev
```

Then open http://localhost:8888

localStorage.setItem('ts_guest_usage', JSON.stringify({date: new Date().toLocaleDateString('en-AU', {timeZone:'Australia/Sydney'}), count: 3})); 

location.reload();


Test signed-in limit (5 checks):local


localStorage.setItem('ts_usage', JSON.stringify({date: new Date().toLocaleDateString('en-AU', {timeZone:'Australia/Sydney'}), count: 5}));

 location.reload();