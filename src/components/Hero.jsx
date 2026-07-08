import FadeIn from './FadeIn';
import heroImage from '../assets/Hero.png';
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
            <FadeIn y={24} duration={0.7}>
              <span className="hero-line hero-line--max">Max</span>
              <span className="hero-line hero-line--verstappen">Verstappen</span>
            </FadeIn>
          </div>

          <div className="hero-number hero-number--image">
            <FadeIn
              as="img"
              y={60}
              scale={0.9}
              duration={0.9}
              delay={0.15}
              src={heroImage}
              alt="Max Verstappen"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>

          <div className="hero-title hero-title-outline">
            <FadeIn y={24} duration={0.7}>
              <span className="hero-line hero-line--max">Max</span>
              <span className="hero-line hero-line--verstappen">Verstappen</span>
            </FadeIn>
          </div>
        </div>
      </div>
    </div>

    <FadeIn y={30} duration={0.7} delay={0.5} as="div" className="hero-stats">
      <div className="hero-stats-inner container">
        {heroStats.map((s) => (
          <div className="hero-stat" key={s.label}>
            <span className="hero-stat-value telemetry">{s.value}</span>
            <span className="hero-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </FadeIn>
  </section>
  );
};

export default Hero;
