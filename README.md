# Max Verstappen — Unofficial Fan Site

An unofficial fan website dedicated to 4-time Formula 1 World Champion Max Verstappen. Built with React + Vite and deployed to Vercel. Features an F1 broadcast-inspired design with Red Bull Racing branding, his complete Red Bull car collection, career timeline, records, an interactive sphere photo gallery, live F1 telemetry, and the 2026 race calendar.

**Live site:** deployed to Vercel (auto-deploys from `main`)

---

## ✨ Features

| Section | Description |
|---------|-------------|
| 🏁 **Hero** | Poster-style text composition with masked image overlay, eyebrow tag, and career stats strip |
| 🏆 **Championship Highlights** | Captioned highlight cards for each title run (2021–2024) plus the 2025 runner-up season |
| 🏎️ **Red Bull Cars** | Interactive year selector + card grid for every car Max drove (2015–2025), with season stats (position, wins, podiums, points, poles) |
| 🚀 **Career Journey** | Scroll-animated vertical timeline from go-kart prodigy (2005) through Toro Rosso to 4-time world champion |
| 🏆 **Records** | Categorized record cards — Age Records, Season Records, Win Records, Lap Records, Grand Prix Records, Championship Records |
| 🌐 **Sphere Gallery** | Interactive sphere photo wall (drag/swipe to orbit) with filterable categories and lightbox |
| 📡 **Live Telemetry** (`/telemetry`) | F1 broadcast-style live race dashboard powered by the OpenF1 API — speed, gear, RPM, throttle, brake, DRS, gaps (leader/ahead/behind), last + best lap, sector times with PB coloring, tyre compound/age, pit windows, weather (air/track temp, humidity, wind, rain), and a race-long position timeline. All data is for Max Verstappen (driver #1). |
| 📅 **2026 Calendar** (`/calendar`) | Full 22-round 2026 F1 season calendar with dates, circuits, and results |

### Design

- **F1 broadcast aesthetic** — dark track-surface backgrounds, telemetry-style counters, chevron speed lines
- **Red Bull Racing palette** — navy, hot orange-red accent, warm gold highlights (oklch perceptual color tokens)
- **Typography** — Formula1 Display (official F1 CDN typeface) for headings/numbers, Inter for body copy
- **Fully responsive** — mobile-first from 360px up through tablet (768px) and desktop (1280px)
- **`prefers-reduced-motion`** respected — animations gracefully degrade

---

## 🛠 Tech Stack

| Tool | Purpose |
|------|---------|
| **React 18** | UI framework |
| **Vite 8** | Build & dev server |
| **React Router 6** | SPA routing (`/`, `/telemetry`, `/calendar`) |
| **Framer Motion** | Scroll & layout animations |
| **@use-gesture/react** | Drag/swipe interaction for dome gallery |
| **OxLint** | Fast linting (React rules, hooks enforcement) |
| **CSS3** | Custom properties, oklch color tokens, responsive layout |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install & Run

```bash
# Clone the repository
git clone <repository-url>
cd max-verstappen-site

# Install dependencies
npm install

# Start the dev server
npm run dev
# → http://localhost:5173

# Lint
npm run lint

# Build for production
npm run build
# Output → dist/

# Preview the production build
npm run preview
```

---

## 📁 Project Structure

```
max-verstappen-site/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx / .css       # Sticky top nav with smooth-scroll links
│   │   ├── Footer.jsx / .css       # Site disclaimer, quick links, credits
│   │   ├── Hero.jsx / .css         # Poster-style hero with masked text + stats
│   │   └── DomeGallery.jsx / .css  # Sphere photo wall with drag interaction
│   ├── pages/               # Route pages
│   │   ├── Home.jsx / .css         # Orchestrator — renders all scroll sections
│   │   ├── LiveTelemetry.jsx/.css  # F1 broadcast-style live dashboard (/telemetry)
│   │   ├── Calendar.jsx/.css       # 2026 F1 season calendar (/calendar)
│   │   ├── Cars.jsx / .css         # Interactive car grid (includes Card + YearSelector)
│   │   ├── Journey.jsx / .css      # Animated career timeline
│   │   ├── Records.jsx / .css      # Categorized record rows with search + filter
│   │   └── Gallery.jsx / .css      # Filterable gallery with sphere viewer
│   ├── hooks/               # Custom React hooks
│   │   └── useOpenF1.js     # OpenF1 API telemetry hook (5s slot scheduler, cursor
│   │                          #  fetching, rate-limit-safe per-endpoint cadence, 
│   │                          #  visibility throttling, 30-min session rollover)
│   ├── data/                # Static JSON data
│   │   ├── cars.json        # Cars & season stats (2016–2026)
│   │   ├── journey.json     # Career timeline events (2005–2025)
│   │   ├── records.json     # Record entries by category
│   │   ├── gallery.json     # Image URLs, captions, categories, credits
│   │   └── calendar2026.json # 2026 F1 calendar (22 rounds)
│   ├── styles/
│   │   └── theme.css        # Global tokens: palette, type, spacing, motion, reset
│   ├── assets/              # Static images bundled by Vite
│   │   └── Hero.png         # Hero background image
│   ├── main.jsx             # React DOM entry point (BrowserRouter)
│   └── App.jsx / .css       # Root component (Navbar → Routes → Footer)
├── public/                  # Static assets served as-is
│   ├── _redirects           # Vercel SPA redirect rule
│   ├── favicon.svg
│   └── images/              # Gallery images by category
│       ├── championships/
│       ├── races/
│       ├── podiums/
│       ├── cars/
│       └── behind-the-scenes/
├── .oxlintrc.json           # OxLint config (React + oxc plugins)
├── vite.config.js           # Vite + React plugin
└── package.json
```

---

## 🎨 Theme Tokens

Colors use **oklch** perceptual uniformity for consistent contrast across lightness ranges. The seven canonical Red Bull brand hex values are defined as the source of truth; the oklch tokens are the perceptually-uniform variants used in the UI.

| Token | Value | Role |
|-------|-------|------|
| `--navy-blue` | `#0600EF` | Brand navy |
| `--dark-navy` | `#040099` | Brand dark navy |
| `--light-navy` | `#3a3aff` | Brand light navy |
| `--red` | `#FF0000` / oklch(58% 0.19 35) | Brand red / hot orange-red accent |
| `--yellow` | `#FFD700` / oklch(92% 0.04 70) | Brand yellow / warm gold highlight |
| `--track-black` | oklch(12% 0.015 250) | Page background |
| `--asphalt` | oklch(16% 0.02 250) | Card / section surfaces |
| `--carbon` | oklch(20% 0.02 250) | Raised surfaces |

Full token set (including type, spacing, motion, and shadows) lives in `src/styles/theme.css`.

---

## 📡 Live Telemetry — How It Works

The `/telemetry` dashboard is built on the public [OpenF1 API](https://openf1.org), called
**directly from the visitor's browser** — there is no server, proxy, or auth token. Vercel
serves only the static bundle; every client hits `api.openf1.org` on its own IP.

OpenF1's free tier allows **3 requests/second and 30 requests/minute per IP**. A naïve
implementation (polling every 4 seconds a bundle of 6–7 endpoints at once) trips 429s
immediately. The telemetry hook (`src/hooks/useOpenF1.js`) is therefore designed around a
**deterministic slot scheduler** that keeps every visitor safely under both limits:

- **One request every 5 seconds**, round-robin across a 12-slot / 60-second cycle.
- **Per-endpoint cadence matches how fast the data actually changes:**
  `car_data` (speed / gear / RPM / DRS / throttle / brake) × 6/min — keeps a
  "live feel"; `intervals` (gaps) × 2/min; `laps` / `position` / `weather` / `pit`
  × 1/min — they only change per-lap or slower. Total: **12 requests/min**, one-third
  of the free-tier ceiling, with 3× headroom left for user-triggered manual
  refreshes.
- **Cursor-based incremental fetching** for `car_data` (the heaviest endpoint, ~34k
  samples for a full race): the first pull fetches the history, every subsequent pull
  sends `date>=<lastSampleTime>` so only the new samples come back. This drops
  bandwidth from hundreds of MB per race to a few KB per poll.
- **Ring buffer caps `car_data` at 500 samples** so memory stays bounded over a long
  weekend.
- **Startup priming burst** (4 sequential requests, 1 per second, under the 3/s limit)
  draws the dashboard into a ready state in ~3 seconds instead of waiting for the
  next slow-slot cycle.
- **Visibility-aware throttling**: when the tab is backgrounded, cadence drops to 1
  request / 60 seconds; returning fires an instant catch-up tick and restores 5s.
- **Session management**: the hook discovers the current/recent race session on
  mount, re-resolves the session list every 30 minutes to pick up rollovers, and
  automatically stops polling when a session is more than 30 minutes past its end
  or returns 3 consecutive empty responses.
- **Per-slot AbortController** with an unused-slot carry trap — each tick cancels any
  in-flight request before dispatching the next, fixing the stale-abort leak that
  existed in the original polling design.

End result for the visitor: one request landing every 5 seconds on their own IP,
never bulldozing OpenF1's free tier.

---

## 🚢 Deployment

### Vercel (recommended)

1. Push to a GitHub repository
2. Import the repo at [vercel.com](https://vercel.com)
3. Vercel auto-detects Vite — no manual config needed
4. Click **Deploy**

Or via the Vercel CLI:

```bash
npm install -g vercel
vercel
```

Build command: `npm run build` · Output directory: `dist`

The `public/_redirects` file ensures Vercel serves `index.html` for all routes (required for SPA client-side routing).

---

## 📸 Image Credits & Copyright

This is an **unofficial fan website**. All images are sourced from official Formula 1 and Red Bull Racing media libraries, used under fair use for non-commercial fan purposes. All images remain the property of their respective owners.

If you are the owner of any image and would like it removed, please contact the project maintainers.

---

## 🤝 Contributing

Contributions are welcome — data corrections, new features, or design improvements. Please open an issue or submit a pull request.

## ⚠️ Disclaimer

This site is not affiliated with Max Verstappen, Red Bull Racing, Oracle Red Bull Racing, or Formula 1. All trademarks and copyrights are property of their respective owners.
