import './MaxLapChart.css';

const PADDING = { top: 62, right: 74, bottom: 74, left: 74 };
const WIDTH = 1000;
const HEIGHT = 470;

const plotW = WIDTH - PADDING.left - PADDING.right;
const plotH = HEIGHT - PADDING.top - PADDING.bottom;

const MaxLapChart = ({ raceName, year = 2026, laps, retired = false }) => {
  if (!laps || laps.length === 0) return null;

  const maxLap = Math.max(...laps.map((l) => l.lap));
  const maxPos = Math.max(...laps.map((l) => l.position));
  const xMax = Math.max(10, Math.ceil(maxLap / 10) * 10);
  const yMax = Math.max(20, Math.ceil(maxPos / 2) * 2);

  const xOf = (lap) => PADDING.left + (lap / xMax) * plotW;
  const yOf = (pos) => PADDING.top + ((pos - 1) / (yMax - 1)) * plotH;

  // Only one point per lap, so the line breaks whenever a lap is missing (pit stop / retirement).
  const segments = [];
  let current = [];
  let prevLap = null;
  for (const l of laps) {
    if (prevLap != null && l.lap !== prevLap + 1) {
      segments.push(current);
      current = [];
    }
    current.push(`${xOf(l.lap).toFixed(2)},${yOf(l.position).toFixed(2)}`);
    prevLap = l.lap;
  }
  if (current.length) segments.push(current);

  // Small cross markers where the position changed on that lap
  const changes = laps.filter((l, i) => i > 0 && l.position !== laps[i - 1].position);

  const finalLap = maxLap;

  // Axis numbers every 10 laps plus the final lap of the race (which gets its own
  // thicker end line + 🏁). Numbers too close to the final lap are dropped so they
  // never overlap.
  const xTicks = [];
  for (let lap = 0; lap <= xMax; lap += 10) {
    if (Math.abs(lap - finalLap) < 3) continue;
    xTicks.push(lap);
  }
  if (!xTicks.includes(finalLap)) xTicks.push(finalLap);
  xTicks.sort((a, b) => a - b);

  // Every position is labelled (P1 at the top down to the back of the grid).
  const yTicks = [];
  for (let pos = 1; pos <= yMax; pos++) yTicks.push(pos);
  const lapLines = [];
  for (let lap = 1; lap <= maxLap; lap++) lapLines.push(lap);

  const last = laps[laps.length - 1];
  const first = laps[0];

  return (
    <div className="mlc">
      <svg
        className="mlc-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${year} ${raceName} — Max Verstappen lap-by-lap position chart`}
      >
        <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#000000" />

        <text className="mlc-title" x={WIDTH / 2} y={32} textAnchor="middle">
          {`${year} ${raceName} - Race`}
        </text>
        <text className="mlc-subtitle" x={WIDTH / 2} y={50} textAnchor="middle">
          Max Verstappen · Position per lap
        </text>

        {/* Grid */}
        {yTicks.map((pos) => (
          <line
            key={`gy-${pos}`}
            className="mlc-grid"
            x1={PADDING.left}
            x2={PADDING.left + plotW}
            y1={yOf(pos)}
            y2={yOf(pos)}
          />
        ))}
        {/* Vertical lines — one per lap, brighter/thicker every 10 laps,
            and thicker again on the final lap of the race */}
        {lapLines.map((lap) => (
          <line
            key={`gx-${lap}`}
            className={`mlc-grid ${
              lap === finalLap
                ? 'mlc-grid--final'
                : lap % 10 === 0
                  ? 'mlc-grid--major'
                  : 'mlc-grid--lap'
            }`}
            x1={xOf(lap)}
            x2={xOf(lap)}
            y1={PADDING.top}
            y2={PADDING.top + plotH}
          />
        ))}

        {/* Axes */}
        <line
          className="mlc-axis"
          x1={PADDING.left}
          x2={PADDING.left}
          y1={PADDING.top}
          y2={PADDING.top + plotH}
        />
        <line
          className="mlc-axis"
          x1={PADDING.left}
          x2={PADDING.left + plotW}
          y1={PADDING.top + plotH}
          y2={PADDING.top + plotH}
        />

        {/* Y ticks + labels */}
        {yTicks.map((pos) => (
          <g key={`ty-${pos}`}>
            <line
              className="mlc-tick"
              x1={PADDING.left - 6}
              x2={PADDING.left}
              y1={yOf(pos)}
              y2={yOf(pos)}
            />
            <text
              className="mlc-tick-label mlc-tick-label--y"
              x={PADDING.left - 14}
              y={yOf(pos) + 4}
              textAnchor="end"
            >
              {pos}
            </text>
          </g>
        ))}

        {/* X ticks + labels */}
        {xTicks.map((lap) => (
          <g key={`tx-${lap}`}>
            <line
              className={`mlc-tick${lap === finalLap ? ' mlc-tick--final' : ''}`}
              x1={xOf(lap)}
              x2={xOf(lap)}
              y1={PADDING.top + plotH}
              y2={PADDING.top + plotH + 6}
            />
            <text
              className={`mlc-tick-label${lap === finalLap ? ' mlc-tick-label--final' : ''}`}
              x={xOf(lap)}
              y={PADDING.top + plotH + 24}
              textAnchor="middle"
            >
              {lap}
            </text>
            {lap === finalLap && (
              <text
                className="mlc-flag"
                x={xOf(lap)}
                y={PADDING.top + plotH + 48}
                textAnchor="middle"
              >
                🏁
              </text>
            )}
          </g>
        ))}

        {/* Axis titles */}
        <text
          className="mlc-axis-title"
          transform={`translate(22 ${PADDING.top + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          Position
        </text>
        <text className="mlc-axis-title" x={PADDING.left + plotW / 2} y={HEIGHT - 12} textAnchor="middle">
          LapNumber
        </text>

        {/* Max's position line */}
        {segments.map((seg, i) =>
          seg.length > 1 ? (
            <polyline key={`seg-${i}`} className="mlc-line" points={seg.join(' ')} />
          ) : (
            <circle key={`seg-${i}`} className="mlc-dot" cx={seg[0].split(',')[0]} cy={seg[0].split(',')[1]} r="3" />
          ),
        )}

        {/* Position-change markers */}
        {changes.map((l) => (
          <g key={`ch-${l.lap}`} className="mlc-change">
            <line x1={xOf(l.lap) - 4} y1={yOf(l.position) - 4} x2={xOf(l.lap) + 4} y2={yOf(l.position) + 4} />
            <line x1={xOf(l.lap) - 4} y1={yOf(l.position) + 4} x2={xOf(l.lap) + 4} y2={yOf(l.position) - 4} />
          </g>
        ))}

        {/* Start / end points */}
        <circle className="mlc-dot" cx={xOf(first.lap)} cy={yOf(first.position)} r="4" />
        <circle className="mlc-dot" cx={xOf(last.lap)} cy={yOf(last.position)} r="4" />

        {/* Driver tag at line end */}
        <text className="mlc-driver-tag" x={xOf(last.lap) + 10} y={yOf(last.position) + 4}>
          VER
        </text>
        {retired && (
          <text className="mlc-dnf" x={xOf(last.lap) + 10} y={yOf(last.position) + 20}>
            DNF
          </text>
        )}
      </svg>
    </div>
  );
};

export default MaxLapChart;