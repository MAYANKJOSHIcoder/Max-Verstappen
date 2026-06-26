import { motion } from 'framer-motion';
import './YearSelector.css';

const YearSelector = ({ years, selectedYear, onYearChange }) => {
  return (
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
};

export default YearSelector;
