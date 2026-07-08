import FadeIn from '../components/FadeIn';
import journeyData from '../data/journey.json';
import './Journey.css';

const catColor = {
  'Go-Kart': 'var(--red)',
  F3: 'var(--red)',
  F4: 'var(--red)',
  F1: 'var(--red)',
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
        <FadeIn
          scaleY={0}
          duration={1.2}
          rootMargin="-100px"
          className="timeline-line"
          style={{ transformOrigin: 'top' }}
        />

        {journeyData.map((item, index) => {
          const color = catColor[item.category] || 'var(--navy)';
          const isLeft = index % 2 === 0;
          const hasImage = !!item.image;
          return (
            <FadeIn
              key={index}
              x={isLeft ? -40 : 40}
              duration={0.6}
              delay={0.05}
              rootMargin="-80px"
              className={`timeline-item ${isLeft ? 'left' : 'right'}`}
            >
              <FadeIn
                scale={0}
                duration={0.4}
                delay={0.1}
                rootMargin="-80px"
                className="timeline-marker"
                style={{ backgroundColor: color }}
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
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
};

export default Journey;
