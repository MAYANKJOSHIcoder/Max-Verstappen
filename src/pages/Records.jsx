import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/Card';
import recordsData from '../data/records.json';
import './Records.css';

const Records = () => {
  const grouped = useMemo(() => {
    const groups = {};
    recordsData.forEach((r) => {
      (groups[r.category] ||= []).push(r);
    });
    return groups;
  }, []);

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

      {Object.entries(grouped).map(([category, records]) => (
        <section key={category} className="record-category">
          <motion.h2
            className="category-title"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {category}
          </motion.h2>

          <div className="records-grid">
            {records.map((record, i) => (
              <Card key={record.recordName} className="record-card" delay={(i % 3) * 0.06}>
                <div className="record-top">
                  <h3 className="record-name">{record.recordName}</h3>
                  <span className="record-year telemetry">{record.yearSet}</span>
                </div>
                <p className="record-description">{record.description}</p>
                <div className="record-value">
                  <span className="record-value-number telemetry">{record.value}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Records;
