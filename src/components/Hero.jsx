import { motion, useReducedMotion } from 'framer-motion';
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

const Hero = () => {
  const reduced = useReducedMotion();
  const noAnim = reduced ? { initial: false } : {};

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
  </section>
  );
};

export default Hero;
