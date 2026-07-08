import Hero from '../components/Hero';
import HeroPanels from '../components/HeroPanels';
import FadeIn from '../components/FadeIn';
import Cars from './Cars';
import Journey from './Journey';
import Records from './Records';
import Gallery from './Gallery';
import './Home.css';

const highlights = [
  { year: '2021', caption: 'First World Championship — a dramatic final-race duel with Lewis Hamilton.', img: '/images/championships/2021-verstappen-championship.webp' },
  { year: '2022', caption: 'Second title, clinched in Japan with a record 15 wins in a season.', img: '/images/championships/2022-verstappen-championship.webp' },
  { year: '2023', caption: 'Third consecutive crown, breaking his own record with 19 wins.', img: '/images/championships/2023-verstappen-championship.webp' },
  { year: '2024', caption: 'Fourth straight championship, sealed under the Las Vegas lights.', img: '/images/championships/2024-verstappen-championship.webp' },
];

const Home = () => (
  <div className="home">
    <Hero />
    <HeroPanels />

    {/* Championship Highlights */}
    <section id="highlights" className="home-section" aria-label="Championship highlights">
        <div className="container">
          <FadeIn y={28} duration={0.6} rootMargin="-80px" className="section-head">
            <span className="eyebrow">Championships</span>
            <h2 className="section-title">Title runs</h2>
            <p className="section-lead">
              Four consecutive world championships — the seasons that made Max a legend.
            </p>
          </FadeIn>

          <div className="highlights-grid">
            {highlights.map((h, i) => (
              <FadeIn
                key={h.year}
                y={30}
                duration={0.5}
                delay={i * 0.08}
                rootMargin="-60px"
                as="article"
                className="highlight-card"
              >
                {h.img ? (
                  <img className="highlight-img" src={h.img} alt={h.caption} loading="lazy" />
                ) : (
                  <div className="highlight-img highlight-img--fallback" aria-hidden="true" />
                )}
                <span className="highlight-year">{h.year}</span>
                <span className="highlight-caption">{h.caption}</span>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Interior sections — each page becomes a scrollable section */}
      <section id="cars" className="home-section-section">
        <Cars />
      </section>

      <section id="journey" className="home-section-section">
        <Journey />
      </section>

      <section id="records" className="home-section-section">
        <Records />
      </section>

      <section id="gallery" className="home-section-section">
        <Gallery />
      </section>
    </div>
  );

export default Home;
