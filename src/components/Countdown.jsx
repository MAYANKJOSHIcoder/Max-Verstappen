import { useState, useEffect } from 'react';

const Countdown = ({ date, precision = 'minutes' }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = precision === 'seconds' ? 1000 : 60000;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [precision]);

  const diff = new Date(date) - now;
  if (diff <= 0) return <span className="cal-countdown-live">RACE WEEK</span>;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = precision === 'seconds' ? Math.floor((diff % 60000) / 1000) : null;

  return (
    <div className="cal-countdown-grid">
      <div className="cal-countdown-cell">
        <span className="cal-countdown-value telemetry">{days}</span>
        <span className="cal-countdown-label">Days</span>
      </div>
      <div className="cal-countdown-cell">
        <span className="cal-countdown-value telemetry">{hours}</span>
        <span className="cal-countdown-label">Hrs</span>
      </div>
      <div className="cal-countdown-cell">
        <span className="cal-countdown-value telemetry">{mins}</span>
        <span className="cal-countdown-label">Min</span>
      </div>
      {secs !== null && (
        <div className="cal-countdown-cell">
          <span className="cal-countdown-value telemetry">{String(secs).padStart(2, '0')}</span>
          <span className="cal-countdown-label">Sec</span>
        </div>
      )}
    </div>
  );
};

export default Countdown;
