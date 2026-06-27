import { motion } from 'framer-motion';
import journeyData from '../data/journey.json';
import './Journey.css';

const catColor = {
  'Go-Kart': 'var(--yellow)',
  F3: 'var(--red)',
  F4: 'var(--navy-soft)',
  F1: 'var(--navy)',
};

const Journey = () => {
  return (
    <div className="journey-page container">
      <header className="page-head">
        <span className="eyebrow">Career Timeline</span>
        <h1 className="page-title">The journey</h1>
        <p className="page-subtitle">
          From a four-year-old in a go-kart in Hasselt to four consecutive
          Formula 1 world titles.
        </p>
      </header>

      <div className="timeline">
        <motion.div
          className="timeline-line"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'top' }}
        />

        {journeyData.map((item, index) => {
          const color = catColor[item.category] || 'var(--navy)';
          const isLeft = index % 2 === 0;
          const hasImage = !!item.image;
          return (
            <motion.div
              key={index}
              className={`timeline-item ${isLeft ? 'left' : 'right'}`}
              initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{
                duration: 0.6,
                delay: 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.div
                className="timeline-marker"
                style={{ backgroundColor: color }}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
              <div
                className={`timeline-card ${hasImage ? 'has-image' : ''}`}
                style={{ borderColor: `${color}` }}
              >
                {hasImage && (
                  <div className={`timeline-card-image ${isLeft ? 'image-left' : 'image-right'}`}>
                    <img src={item.image} alt={item.title} loading="lazy" />
                  </div>
                )}
                <div className="timeline-card-content">
                  <span className="timeline-category" style={{ color }}>
                    {item.category}
                  </span>
                  <h3 className="timeline-year telemetry">{item.year}</h3>
                  <h4 className="timeline-title">{item.title}</h4>
                  <p className="timeline-description">{item.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Journey;
