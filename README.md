# Max Verstappen — Unofficial Fan Site

An unofficial fan website dedicated to 4-time Formula 1 World Champion Max Verstappen. Built with React + Vite and deployed to Vercel. Features an F1 broadcast-inspired design with Red Bull Racing branding, his complete Red Bull car collection, career timeline, records, and a 3D dome photo gallery.

**Live site:** deployed to Vercel (auto-deploys from `main`)

---

## ✨ Features

| Section | Description |
|---------|-------------|
| 🏁 **Hero** | Animated **#33** number with lap-counter stats, chevron speed streak, and championship CTAs |
| 🎥 **Championship Highlights** | Embedded YouTube highlight videos for each title run (2021–2024) plus the 2025 runner-up season |
| 🏎️ **Red Bull Cars** | Interactive year selector + card grid for every car Max drove (2016–2025), with season stats (position, wins, podiums, points, poles) |
| 🚀 **Career Journey** | Scroll-animated vertical timeline from go-kart prodigy (2005) through Toro Rosso to 4-time world champion |
| 🏆 **Records** | Categorized record cards — Age Records, Season Records, Win Records, Lap Records, Grand Prix Records, Championship Records |
| 🌐 **Dome Gallery** | 3D interactive dome photo viewer (drag/swipe to orbit) with filterable categories and lightbox |

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
| **React 19** | UI framework |
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
│   │   ├── Navbar.jsx       # Sticky top nav with smooth-scroll links
│   │   ├── Footer.jsx       # Site disclaimer, quick links, credits
│   │   ├── Hero.jsx         # #33 hero with lap-counter stats + chevron streak
│   │   ├── Card.jsx         # Reusable card (cars, records, timeline)
│   │   ├── YearSelector.jsx # Dropdown for filtering cars by season
│   │   ├── VideoEmbed.jsx   # Responsive 16:9 YouTube embed
│   │   ├── DomeGallery.jsx  # 3D dome photo viewer with drag interaction
│   │   └── Icons.jsx        # SVG icon components
│   ├── pages/               # Page sections (rendered by Home as scroll sections)
│   │   ├── Home.jsx         # Orchestrator — renders all sections in scroll order
│   │   ├── Cars.jsx         # Interactive car grid
│   │   ├── Journey.jsx      # Animated career timeline
│   │   ├── Records.jsx      # Categorized record cards
│   │   └── Gallery.jsx      # Filterable gallery with dome viewer
│   ├── data/                # Static JSON data
│   │   ├── cars.json        # Cars & season stats (2016–2025)
│   │   ├── journey.json     # Career timeline events (2005–2025)
│   │   ├── records.json     # Record entries by category
│   │   └── gallery.json     # Image URLs, captions, categories, credits
│   ├── styles/
│   │   └── theme.css        # Global tokens: palette, type, spacing, motion
│   ├── App.jsx              # Root component (Navbar → Home → Footer)
│   ├── App.css              # Layout shell styles
│   └── index.css            # Reset & base styles
├── public/                  # Static assets (favicon, icons sprite)
├── .oxlintrc.json           # OxLint config (React + oxc plugins)
├── vite.config.js           # Vite + React plugin
└── package.json
```

---

## 🎨 Theme Tokens

Colors use **oklch** perceptual uniformity for consistent contrast across lightness ranges:

| Token | Value | Role |
|-------|-------|------|
| `--track-black` | oklch(9% 0.02 250) | Page background |
| `--navy` | oklch(18% 0.06 250) | Deep navy surface |
| `--red` | oklch(58% 0.19 35) | Hot orange-red accent |
| `--yellow` | oklch(92% 0.04 70) | Warm gold highlight |

Full token set lives in `src/styles/theme.css`.

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
