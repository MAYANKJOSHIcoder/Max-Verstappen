import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import carsData from '../data/cars.json';
import './Cars.css';

const suffix = (n) => {
  if (n === null || n === undefined) return '—';
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
};
const posClass = (p) =>
  p === 1 ? 'gold' : p === 2 ? 'silver' : p === 3 ? 'bronze' : 'default';

const Card = ({ children, className = '', delay = 0 }) => (
  <motion.div
    className={`card ${className}`}
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
);

const YearSelector = ({ years, selectedYear, onYearChange }) => (
  <motion.div
    className="year-selector"
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    <span className="year-selector-label">Season</span>
    <div className="year-chips">
      <button
        className={`year-chip ${selectedYear === 'all' ? 'is-active' : ''}`}
        onClick={() => onYearChange('all')}
      >
        All
      </button>
      {years.map((year) => (
        <button
          key={year}
          className={`year-chip ${selectedYear === year ? 'is-active' : ''}`}
          onClick={() => onYearChange(year)}
        >
          {year}
        </button>
      ))}
    </div>
  </motion.div>
);

const Cars = () => {
  const [selectedYear, setSelectedYear] = useState(2026);

  const years = useMemo(
    () => [...new Set(carsData.map((c) => c.year))].sort((a, b) => b - a),
    []
  );

  const filtered = useMemo(
    () =>
      selectedYear === 'all'
        ? carsData
        : carsData.filter((c) => c.year === selectedYear),
    [selectedYear]
  );

  return (
    <div className="cars-page container">
      <header className="page-head">
        <span className="eyebrow">Red Bull Racing</span>
        <h1 className="page-title">The cars</h1>
        <p className="page-subtitle">
          Every car Max has driven for Red Bull Racing — and the seasons they
          dominated.
        </p>
      </header>

      <YearSelector
        years={years}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />

      <div className="cars-grid">
        {filtered.map((car, i) => (
          <Card
            key={`${car.year}-${car.carModel}`}
            className="car-card"
            delay={(i % 3) * 0.06}
          >
            {car.championshipPosition === 1 && (
              <div className="champion-badge">Champion</div>
            )}
            <div className="car-image-frame">
              <img
                src={car.imageUrl}
                alt={`${car.year} ${car.carModel}`}
                className="card-image"
                loading="lazy"
              />
            </div>
            <div className="car-header">
              <h3 className="card-title">{car.year}</h3>
              <span className={`position-pill ${posClass(car.championshipPosition)}`}>
                {suffix(car.championshipPosition)}
              </span>
            </div>
            <h4 className="card-subtitle">{car.carModel}</h4>
            <p className="car-team">{car.team}</p>
            <div className="card-stats">
              <div className="stat-item">
                <span className="stat-value">{car.wins ?? '—'}</span>
                <span className="stat-label">Wins</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{car.podiums ?? '—'}</span>
                <span className="stat-label">Podiums</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{car.polePositions ?? '—'}</span>
                <span className="stat-label">Poles</span>
              </div>
              <div className="stat-item">
                <span className="stat-value telemetry">{car.points ?? '—'}</span>
                <span className="stat-label">Points</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Cars;
