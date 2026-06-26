import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import recordsData from '../data/records.json';
import './Records.css';

const CATEGORY_LABELS = {
  debut: 'Debut & Age',
  season: 'Season',
  consecutive: 'Consecutive',
  career: 'Career Milestones',
  percentage: 'Percentage',
  other: 'Other',
};

const CATEGORY_COLORS = {
  debut: 'var(--red)',
  season: 'var(--yellow)',
  consecutive: 'var(--navy-soft)',
  career: 'var(--signal)',
  percentage: 'oklch(60% 0.12 280)',
  other: 'var(--mist)',
};

const Records = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = useMemo(
    () => ['all', ...new Set(recordsData.map((r) => r.category))],
    []
  );

  const filteredRecords = useMemo(() => {
    const term = search.toLowerCase().trim();
    return recordsData.filter((r) => {
      if (activeCategory !== 'all' && r.category !== activeCategory) return false;
      if (!term) return true;
      return (
        r.recordName.toLowerCase().includes(term) ||
        (r.description || '').toLowerCase().includes(term) ||
        (r.value || '').toLowerCase().includes(term)
      );
    });
  }, [search, activeCategory]);

  const filteredBySection = useMemo(() => {
    const sects = {};
    categories
      .filter((c) => c !== 'all')
      .forEach((c) => {
        sects[c] = [];
      });
    filteredRecords.forEach((r) => {
      if (!sects[r.category]) sects[r.category] = [];
      sects[r.category].push(r);
    });
    return Object.fromEntries(
      Object.entries(sects).filter(([, arr]) => arr.length)
    );
  }, [filteredRecords, categories]);

  const renderRow = (r) => (
    <li key={r.id} className="stat-row">
      <span
        className="stat-row__cat"
        style={{ background: CATEGORY_COLORS[r.category] || 'var(--red)' }}
        aria-hidden
      />
      <div className="stat-row__body">
        <h3 className="stat-row__name">{r.recordName}</h3>
        <p className="stat-row__desc">{r.description}</p>
      </div>
      {r.yearSet !== null ? (
        <span className="stat-row__year telemetry">{r.yearSet}</span>
      ) : (
        <span className="stat-row__year telemetry is-ongoing">ONGOING</span>
      )}
      <span className="stat-row__value telemetry">{r.value}</span>
    </li>
  );

  return (
    <div className="records-page container">
      <header className="page-head">
        <span className="eyebrow">Record Books</span>
        <h1 className="page-title">Records</h1>
        <p className="page-subtitle">
          The records Max Verstappen holds — from youngest-ever milestones to
          single-season dominance.
        </p>
      </header>

      <div className="records-toolbar">
        <div className="filter-row">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-button${
                cat === activeCategory ? ' is-active' : ''
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        <div className="records-search">
          <svg
            className="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search records"
          />
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="records-empty">No records match your search.</div>
      ) : activeCategory === 'all' ? (
        Object.entries(filteredBySection).map(([cat, records]) => (
          <section key={cat} className="record-category">
            <motion.h2
              className="category-title"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {CATEGORY_LABELS[cat] || cat}
            </motion.h2>
            <ul className="stat-rows">
              <AnimatePresence mode="wait">
                {records.map(renderRow)}
              </AnimatePresence>
            </ul>
          </section>
        ))
      ) : (
        <section className="record-category">
          <ul className="stat-rows">
            <AnimatePresence mode="wait">
              {filteredRecords.map(renderRow)}
            </AnimatePresence>
          </ul>
        </section>
      )}
    </div>
  );
};

export default Records;
