import circuitPaths from '../data/circuitPaths';
import './CircuitMap.css';

const CircuitMap = ({ circuit, size = 80, className = '' }) => {
  const data = circuitPaths[circuit];

  if (!data) {
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

  return (
    <div
      className={`circuit-map ${className}`}
      style={{ width: size, height: size }}
      aria-label={`${data.name} circuit layout`}
    >
      <svg
        viewBox={data.viewBox}
        className="circuit-map-svg"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`circuit-grad-${circuit}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--red)" />
            <stop offset="100%" stopColor="var(--yellow)" />
          </linearGradient>
          <filter id={`circuit-glow-${circuit}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Glow layer */}
        <path
          d={data.path}
          fill="none"
          stroke="var(--red)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.15"
          filter={`url(#circuit-glow-${circuit})`}
        />

        {/* Main track outline */}
        <path
          d={data.path}
          fill="none"
          stroke={`url(#circuit-grad-${circuit})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="circuit-map-track"
        />

        {/* Start/finish dot — first coordinate of the path */}
        <circle
          cx={data.path.match(/M\s*(\d+)/)?.[1] || 0}
          cy={data.path.match(/M\s*\d+\s+(\d+)/)?.[1] || 0}
          r="4"
          fill="var(--red)"
          className="circuit-map-start"
        />
      </svg>
    </div>
  );
};

export default CircuitMap;
