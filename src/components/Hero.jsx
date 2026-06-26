import { motion } from 'framer-motion';
import './Hero.css';

/* -----------------------------
   Speed chevron streak behind 3
   ----------------------------- */
const ChevronStreak = () => (
  <svg
    className="hero-streak"
    viewBox="0 0 600 200"
    aria-hidden="true"
    preserveAspectRatio="none"
  >
    <defs>
      <linearGradient id="streak-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="var(--yellow)" stopOpacity="0" />
        <stop offset="40%" stopColor="var(--yellow)" stopOpacity="0.9" />
        <stop offset="100%" stopColor="var(--red)" stopOpacity="0" />
      </linearGradient>
    </defs>
    {/* three layered chevrons fanning right */}
    <path
      d="M-40 110 L220 110 L180 70 L360 70"
      fill="none"
      stroke="url(#streak-grad)"
      strokeWidth="14"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M-20 130 L200 130 L160 170 L340 170"
      fill="none"
      stroke="url(#streak-grad)"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.6"
    />
  </svg>
);

const heroStats = [
  { value: '240', label: 'Grands Prix Entered' },
  { value: '3,499.5', label: 'Career Points' },
  { value: '71', label: 'Highest Race Finish' },
  { value: '128', label: 'Podiums' },
  { value: '48', label: 'Highest Grid Position' },
  { value: '48', label: 'Pole Positions' },
  { value: '4', label: 'World Championships' },
];

const Hero = () => (
  <section className="hero" aria-label="Max Verstappen">
    <div className="hero-bg" aria-hidden="true">
      <div className="hero-vignette" />
    </div>

    <div className="hero-inner container">
      <motion.div
        className="hero-copy"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="eyebrow">4× World Champion · Red Bull Racing</span>
        <h1 className="hero-title">
          Max
          <br />
          Verstappen
        </h1>
        <p className="hero-lead">
          From go-kart prodigy at four years old to the most dominant force
          in modern Formula 1. Four consecutive world championships and a
          record books rewritten.
        </p>

        <div className="hero-cta">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => document.getElementById('records')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            See the records
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            Follow the journey
          </button>
        </div>
      </motion.div>

      <div className="hero-number-wrap" aria-hidden="true">
        <ChevronStreak />
        <motion.span
          className="hero-number"
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.9,
            delay: 0.15,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          3
        </motion.span>
      </div>
    </div>

    {/* career stats */}
    <motion.div
      className="hero-stats"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="hero-stats-inner container">
        {heroStats.map((s) => (
          <div className="hero-stat" key={s.label}>
            <span className="hero-stat-value telemetry">{s.value}</span>
            <span className="hero-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  </section>
);

export default Hero;
