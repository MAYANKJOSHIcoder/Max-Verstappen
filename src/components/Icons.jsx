/* Lightweight SVG line icons — stroke-based, inherit currentColor.
   Replaces the emoji used in the old scaffold. */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const CarIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5" />
    <path d="M3 13h18v4a1 1 0 0 1-1 1h-1a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H4a1 1 0 0 1-1-1z" />
  </svg>
);

export const JourneyIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const TrophyIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
    <path d="M7 6H4a2 2 0 0 0 2 4h1" />
    <path d="M17 6h3a2 2 0 0 1-2 4h-1" />
    <path d="M12 14v3" />
    <path d="M9 20h6" />
    <path d="M8 17h8" />
  </svg>
);

export const CameraIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="12.5" r="3.5" />
  </svg>
);

export const ChevronIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M5 12l7-7 7 7" />
    <path d="M5 19l7-7 7 7" />
  </svg>
);

export const FlagIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M5 21V4" />
    <path d="M5 4h12l-2 4 2 4H5" />
  </svg>
);
