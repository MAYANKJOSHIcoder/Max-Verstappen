import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import HeroPanels from '../components/HeroPanels';
import Cars from './Cars';
import Journey from './Journey';
import Records from './Records';
import Gallery from './Gallery';
import './Home.css';

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const highlights = [
  { year: '2021', caption: 'First World Championship — a dramatic final-race duel with Lewis Hamilton.', img: '/images/championships/2021-verstappen-championship.webp' },
  { year: '2022', caption: 'Second title, clinched in Japan with a record 15 wins in a season.', img: '/images/championships/2022-verstappen-championship.webp' },
  { year: '2023', caption: 'Third consecutive crown, breaking his own record with 19 wins.', img: '/images/championships/2023-verstappen-championship.webp' },
  { year: '2024', caption: 'Fourth straight championship, sealed under the Las Vegas lights.', img: '/images/championships/2024-verstappen-championship.webp' },
  { year: '2025', caption: 'Runner-up in one of the closest modern battles, pushing to the final rounds.' },
];

const Home = () => (
  <div className="home">
    <Hero />
    <HeroPanels />

    <div className="home-lead container">
      <p>
        From go-kart prodigy at four years old to the most dominant force
        in modern Formula 1. Four consecutive world championships and a
        record books rewritten.
      </p>
    </div>

    {/* Championship Highlights */}
    <section id="highlights" className="home-section" aria-label="Championship highlights">
        <div className="container">
          <motion.div className="section-head" {...fadeUp}>
            <span className="eyebrow">Championships</span>
            <h2 className="section-title">Title runs</h2>
            <p className="section-lead">
              Four consecutive world championships — the seasons that made Max a legend.
            </p>
          </motion.div>

          <div className="highlights-grid">
            {highlights.map((h, i) => (
              <motion.article
                key={h.year}
                className="highlight-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                {h.img ? (
                  <img className="highlight-img" src={h.img} alt={h.caption} loading="lazy" />
                ) : (
                  <div className="highlight-img highlight-img--fallback" aria-hidden="true" />
                )}
                <span className="highlight-year">{h.year}</span>
                <span className="highlight-caption">{h.caption}</span>
              </motion.article>
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
