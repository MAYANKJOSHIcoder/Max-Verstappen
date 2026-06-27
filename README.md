# Max Verstappen — Unofficial Fan Site

An unofficial fan website dedicated to 4-time Formula 1 World Champion Max Verstappen. Built with React + Vite and deployed to Vercel. Features an F1 broadcast-inspired design with Red Bull Racing branding, his complete Red Bull car collection, career timeline, records, and an interactive sphere photo gallery.

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
│   ├── pages/               # Page sections (rendered by Home as scroll sections)
│   │   ├── Home.jsx / .css         # Orchestrator — renders all sections in scroll order
│   │   ├── Cars.jsx / .css         # Interactive car grid (includes Card + YearSelector)
│   │   ├── Journey.jsx / .css      # Animated career timeline
│   │   ├── Records.jsx / .css      # Categorized record rows with search + filter
│   │   └── Gallery.jsx / .css      # Filterable gallery with sphere viewer
│   ├── data/                # Static JSON data
│   │   ├── cars.json        # Cars & season stats (2016–2025)
│   │   ├── journey.json     # Career timeline events (2005–2025)
│   │   ├── records.json     # Record entries by category
│   │   └── gallery.json     # Image URLs, captions, categories, credits
│   ├── styles/
│   │   └── theme.css        # Global tokens: palette, type, spacing, motion, reset
│   ├── assets/              # Static images bundled by Vite
│   │   └── Hero.png         # Hero background image
│   ├── main.jsx             # React DOM entry point
│   └── App.jsx / .css       # Root component (Navbar → Home → Footer)
├── public/                  # Static assets served as-is
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

---

## 📸 Image Credits & Copyright

This is an **unofficial fan website**. All images are sourced from official Formula 1 and Red Bull Racing media libraries, used under fair use for non-commercial fan purposes. All images remain the property of their respective owners.

If you are the owner of any image and would like it removed, please contact the project maintainers.

---

## 🤝 Contributing

Contributions are welcome — data corrections, new features, or design improvements. Please open an issue or submit a pull request.

## ⚠️ Disclaimer

This site is not affiliated with Max Verstappen, Red Bull Racing, Oracle Red Bull Racing, or Formula 1. All trademarks and copyrights are property of their respective owners.
