import { useState } from 'react';
import './CircuitMap.css';

/** Convert a circuit name to a URL-friendly slug matching the filename in public/images/circuits/ */
const toSlug = (name) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')   // spaces → hyphens
    .replace(/--+/g, '-');  // collapse multiple hyphens

const CircuitMap = ({ circuit, size = 80, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (!circuit || failed) {
    return (
      <div
        className={`circuit-map circuit-map--fallback ${className}`}
        style={{ width: size, height: size }}
        aria-label={`${circuit || 'Unknown'} circuit`}
      >
        <svg
          viewBox="0 0 24 24"
          width={size * 0.5}
          height={size * 0.5}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <path d="M8 12l2.5 2.5L16 9" />
        </svg>
      </div>
    );
  }

  const slug = toSlug(circuit);

  return (
    <div
      className={`circuit-map ${className}`}
      style={{ width: size, height: size }}
      aria-label={`${circuit} circuit layout`}
    >
      <img
        src={`/images/circuits/${slug}.svg`}
        alt={`${circuit} circuit`}
        className="circuit-map-img"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

export default CircuitMap;
