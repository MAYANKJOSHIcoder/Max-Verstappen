/**
 * Simplified SVG path outlines for every circuit on the 2026 F1 calendar.
 *
 * Keys match the `circuit` field in calendar2026.json.
 * Each entry: { viewBox, path, name }
 *   - viewBox: "minX minY width height" for the <svg>
 *   - path:    a single <path d="..."> string (stroke outline, no fill)
 *   - name:    human-readable circuit name
 */
const circuitPaths = {
  Melbourne: {
    viewBox: '0 0 200 140',
    path: 'M40 120 L25 100 L20 70 L30 40 L55 20 L90 15 L130 20 L160 30 L175 55 L180 80 L170 105 L150 120 L120 125 L90 120 L70 115 L55 118 Z',
    name: 'Albert Park',
  },
  Shanghai: {
    viewBox: '0 0 200 160',
    path: 'M30 80 L40 50 L70 30 L100 25 L130 30 L150 45 L155 70 L140 90 L120 85 L110 70 L100 75 L110 95 L130 110 L150 120 L160 140 L130 145 L90 140 L60 130 L40 110 L35 90 Z',
    name: 'Shanghai International',
  },
  Suzuka: {
    viewBox: '0 0 200 180',
    path: 'M30 130 L25 90 L35 60 L60 40 L90 30 L120 35 L140 50 L130 70 L110 80 L100 70 L80 65 L70 75 L85 90 L110 95 L140 85 L160 70 L175 85 L170 110 L155 130 L130 145 L100 150 L70 145 L45 135 Z',
    name: 'Suzuka',
  },
  Miami: {
    viewBox: '0 0 200 140',
    path: 'M30 70 L35 40 L60 25 L100 20 L140 25 L165 40 L175 65 L170 90 L155 110 L130 120 L100 118 L75 115 L55 105 L40 90 Z',
    name: 'Miami International',
  },
  Montreal: {
    viewBox: '0 0 220 120',
    path: 'M20 60 L40 30 L80 20 L120 15 L160 20 L190 35 L200 60 L195 85 L175 100 L140 105 L100 100 L60 95 L35 85 L25 70 Z',
    name: 'Circuit Gilles Villeneuve',
  },
  Monaco: {
    viewBox: '0 0 200 160',
    path: 'M30 100 L25 70 L40 45 L70 30 L100 25 L130 30 L155 45 L170 70 L175 95 L165 120 L140 135 L110 140 L80 135 L50 120 L35 110 Z',
    name: 'Circuit de Monaco',
  },
  'Barcelona-Catalunya': {
    viewBox: '0 0 200 160',
    path: 'M40 110 L30 80 L40 50 L70 30 L100 20 L135 25 L160 40 L170 65 L165 90 L150 110 L130 120 L100 125 L70 120 L50 115 Z',
    name: 'Circuit de Barcelona-Catalunya',
  },
  Spielberg: {
    viewBox: '0 0 200 140',
    path: 'M30 100 L25 65 L45 35 L80 20 L120 15 L155 25 L175 50 L180 80 L170 105 L145 120 L110 125 L75 120 L45 110 Z',
    name: 'Red Bull Ring',
  },
  Silverstone: {
    viewBox: '0 0 200 160',
    path: 'M30 100 L25 65 L45 35 L80 20 L110 15 L145 20 L170 40 L180 70 L175 100 L155 125 L120 140 L85 138 L55 125 L38 112 Z',
    name: 'Silverstone',
  },
  'Spa-Francorchamps': {
    viewBox: '0 0 220 180',
    path: 'M30 130 L25 90 L40 55 L70 30 L110 15 L150 20 L180 40 L195 70 L190 100 L170 130 L145 150 L110 160 L75 155 L45 140 Z',
    name: 'Spa-Francorchamps',
  },
  Budapest: {
    viewBox: '0 0 200 160',
    path: 'M35 110 L28 75 L45 42 L80 22 L115 18 L150 25 L172 48 L178 78 L170 108 L148 130 L115 142 L80 138 L52 125 L38 115 Z',
    name: 'Hungaroring',
  },
  Sakhir: {
    viewBox: '0 0 200 160',
    path: 'M40 120 L30 80 L45 45 L80 25 L120 20 L155 30 L170 55 L175 85 L165 115 L140 135 L105 140 L70 135 L48 125 Z',
    name: 'Bahrain International',
  },
  Jeddah: {
    viewBox: '0 0 180 200',
    path: 'M90 15 L120 25 L140 50 L150 80 L148 115 L135 145 L115 170 L90 185 L65 170 L45 145 L35 115 L38 80 L50 50 L70 25 Z',
    name: 'Jeddah Corniche',
  },
  Zandvoort: {
    viewBox: '0 0 200 140',
    path: 'M35 100 L28 68 L42 38 L75 20 L115 15 L150 22 L172 42 L178 72 L168 100 L142 118 L108 125 L72 120 L48 110 Z',
    name: 'Circuit Zandvoort',
  },
  Monza: {
    viewBox: '0 0 200 180',
    path: 'M40 130 L30 90 L40 55 L70 30 L105 18 L140 22 L165 40 L178 68 L175 100 L160 130 L135 150 L100 158 L68 152 L45 140 Z',
    name: 'Autodromo di Monza',
  },
  Madrid: {
    viewBox: '0 0 200 140',
    path: 'M30 90 L28 55 L50 30 L85 18 L125 15 L158 25 L175 48 L180 78 L170 105 L145 122 L110 128 L75 125 L48 112 L35 100 Z',
    name: 'Circuit de Madrid',
  },
  Baku: {
    viewBox: '0 0 180 200',
    path: 'M85 15 L115 28 L138 55 L148 88 L145 125 L132 155 L110 178 L85 188 L60 175 L42 150 L35 118 L38 85 L52 55 L68 30 Z',
    name: 'Baku City Circuit',
  },
  Singapore: {
    viewBox: '0 0 200 160',
    path: 'M30 100 L28 65 L48 35 L85 18 L125 15 L158 28 L175 55 L178 88 L168 115 L145 135 L110 142 L75 138 L48 122 L35 110 Z',
    name: 'Marina Bay',
  },
  Austin: {
    viewBox: '0 0 200 160',
    path: 'M40 120 L30 82 L42 48 L75 25 L112 18 L148 25 L172 48 L180 82 L172 112 L148 132 L112 140 L75 135 L48 125 Z',
    name: 'Circuit of the Americas',
  },
  'Mexico City': {
    viewBox: '0 0 200 150',
    path: 'M35 105 L28 72 L45 40 L80 22 L120 18 L155 25 L172 48 L178 78 L168 108 L142 128 L108 135 L72 130 L48 118 Z',
    name: 'Autódromo Hermanos Rodríguez',
  },
  'Las Vegas': {
    viewBox: '0 0 200 160',
    path: 'M40 115 L30 78 L45 42 L82 22 L125 15 L162 25 L178 52 L182 85 L172 115 L148 135 L112 142 L75 138 L48 125 Z',
    name: 'Las Vegas Strip',
  },
  'Yas Marina': {
    viewBox: '0 0 200 160',
    path: 'M35 108 L28 72 L42 38 L78 20 L118 15 L155 22 L175 45 L180 78 L172 108 L148 130 L112 138 L78 135 L48 122 Z',
    name: 'Yas Marina',
  },
};

export default circuitPaths;
