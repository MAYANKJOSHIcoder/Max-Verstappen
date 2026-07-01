import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useOpenF1, fmtLapTime } from '../hooks/useOpenF1';
import calendarData from '../data/calendar2026.json';
import heroImage from '../assets/hero.png';
import './Hero.css';

const heroStats = [
  { value: '240', label: 'Grands Prix Entered' },
  { value: '3499.5', label: 'Career Points' },
  { value: '71', label: 'Highest Race Finish' },
  { value: '128', label: 'Podiums' },
  { value: '48', label: 'Highest Grid Position' },
  { value: '48', label: 'Pole Positions' },
  { value: '4', label: 'World Championships' },
];

const Countdown = ({ date }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const diff = new Date(date) - now;
  if (diff <= 0) return <span className="hp-countdown-live">RACE WEEK</span>;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);

  return (
    <div className="hp-countdown-grid">
      <div className="hp-countdown-cell">
        <span className="hp-countdown-value">{String(days).padStart(2, '0')}</span>
        <span className="hp-countdown-label">Days</span>
      </div>
      <div className="hp-countdown-cell">
        <span className="hp-countdown-value">{String(hours).padStart(2, '0')}</span>
        <span className="hp-countdown-label">Hrs</span>
      </div>
      <div className="hp-countdown-cell">
        <span className="hp-countdown-value">{String(mins).padStart(2, '0')}</span>
        <span className="hp-countdown-label">Min</span>
      </div>
    </div>
  );
};

const LiveDot = () => (
  <span className="hp-live-dot" aria-hidden="true">
    <span className="hp-live-dot-core" />
    <span className="hp-live-dot-ring" />
  </span>
);

const Hero = () => {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const noAnim = reduced ? { initial: false } : {};

  const { status, isLive, driver, lap } = useOpenF1({ season: 2026, driverNumber: 1 });

  const nextRace = useMemo(() => {
    const now = new Date();
    return (
      calendarData
        .filter((r) => !r.isCancelled && new Date(r.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null
    );
  }, []);

  return (
  <section className="hero" aria-label="Max Verstappen">
    <h1 className="sr-only">Max Verstappen</h1>

    <div className="hero-bg" aria-hidden="true">
      <div className="hero-vignette" />
    </div>

    <div className="hero-inner container">
      <div className="hero-top">
        <span className="eyebrow">4× World Champion · Red Bull Racing</span>

        <div className="hero-overlap" aria-hidden="true">
          <div className="hero-title hero-title-fill">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              {...noAnim}
            >
              <span className="hero-line hero-line--max">Max</span>
              <span className="hero-line hero-line--verstappen">Verstappen</span>
            </motion.div>
          </div>

          <div className="hero-number hero-number--image">
            <motion.img
              src={heroImage}
              alt="Max Verstappen"
              style={{ width: '100%', height: 'auto', display: 'block' }}
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.9,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              {...noAnim}
            />
          </div>

          <div className="hero-title hero-title-outline">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              {...noAnim}
            >
              <span className="hero-line hero-line--max">Max</span>
              <span className="hero-line hero-line--verstappen">Verstappen</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>

    <motion.div
      className="hero-stats"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      {...noAnim}
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

    <motion.div
      className="hero-panels container"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      {...noAnim}
    >
      <div
        className="hp-card hp-card--telem"
        onClick={() => navigate('/telemetry')}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/telemetry')}
        role="button"
        tabIndex={0}
        aria-label="Live Telemetry"
      >
        <div className="hp-card-body">
          <div className="hp-card-left">
            <span className="eyebrow">Live Timing</span>
            <h3 className="hp-card-title">See Live Race</h3>
          </div>
          <div className="hp-card-right">
            {status === 'live' && isLive ? (
              <div className="hp-telem-live">
                <LiveDot />
                <span className="hp-telem-pos">P{driver?.position || '—'}</span>
                {lap?.lap_duration && (
                  <span className="hp-telem-laptime">{fmtLapTime(lap.lap_duration)}</span>
                )}
              </div>
            ) : nextRace ? (
              <div className="hp-telem-next">
                <span className="hp-telem-next-label">Next:</span>
                <span className="hp-telem-next-name">{nextRace.raceName}</span>
                <span className="hp-telem-next-circuit">{nextRace.circuit}</span>
                <Countdown date={nextRace.date} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="hp-card hp-card--cal"
        onClick={() => navigate('/calendar')}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/calendar')}
        role="button"
        tabIndex={0}
        aria-label="2026 Calendar"
      >
        <div className="hp-card-body">
          <div className="hp-card-left">
            <span className="eyebrow">2026 Season</span>
            <h3 className="hp-card-title">Calendar</h3>
          </div>
          <div className="hp-card-right">
            <div className="hp-cal-info">
              <span className="hp-cal-next-label">Next Race</span>
              <span className="hp-cal-next-name">{nextRace?.raceName || '—'}</span>
              {nextRace && <Countdown date={nextRace.date} />}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  </section>
  );
};

export default Hero;
