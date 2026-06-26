import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import './Hero.css';

/* -----------------------------
   Live lap-time-style counter
   Counts up like a timing board
   ----------------------------- */
const useLapCounter = (target, duration = 2200, start = 0) => {
  const [value, setValue] = useState(start);
  useEffect(() => {
    let raf;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (reduce) {
      setValue(target);
      return;
    }
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      // ease-out quint
      const e = 1 - Math.pow(1 - p, 5);
      setValue((target - start) * e + start);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
};

const fmtInt = (n) => Math.floor(n).toLocaleString('en-US');
const fmtFloat = (n) => n.toFixed(1);

/* -----------------------------
   Speed chevron streak behind 33
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
  { target: 4, suffix: '×', label: 'World Championships', decimals: false },
  { target: 71, suffix: '', label: 'Race Wins', decimals: false },
  { target: 133, suffix: '', label: 'Podium Finishes', decimals: false },
  { target: 4015, suffix: '+', label: 'Career Points', decimals: false },
];

const Hero = () => {
  const wins = useLapCounter(71, 2400, 0);
  const podiums = useLapCounter(133, 2600, 0);

  return (
    <section className="hero" aria-label="Max Verstappen">
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-grid" />
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
            33
          </motion.span>
        </div>
      </div>

      {/* timing-board stat strip */}
      <motion.div
        className="hero-stats"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="hero-stats-inner container">
          {heroStats.map((s, i) => (
            <div className="hero-stat" key={s.label}>
              <span className="hero-stat-value telemetry">
                {s.decimals ? fmtFloat(
                  // wins/podiums animate; others snap in
                  i === 1 ? wins : i === 2 ? podiums : s.target
                ) : fmtInt(
                  i === 1 ? wins : i === 2 ? podiums : s.target
                )}
                <span className="hero-stat-suffix">{s.suffix}</span>
              </span>
              <span className="hero-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
