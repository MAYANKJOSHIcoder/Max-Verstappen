import { motion } from 'framer-motion';
import CircuitMap from './CircuitMap';
import './RaceDetail.css';

const flagEmoji = (code) => {
  if (!code) return '';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const compoundColor = (compound) => {
  const map = {
    SOFT: '#FF3333',
    MEDIUM: '#FFD700',
    HARD: '#F0F0F0',
    INTER: '#3EB83E',
    WET: '#3399FF',
  };
  return map[compound] || '#888888';
};

const HIGHLIGHT_ICONS = {
  'Win': '🏁',
  'Podium': '🥉',
  'Pole Position': '🏆',
  'Fastest Lap': '⚡',
  'Driver of the Day': '🗳️',
  'Sprint Win': '🏁',
  'Sprint Podium': '🥉',
  'Overtakes': '🚗',
  'Safety Car': '🚨',
  'Rain Race': '🌧️',
  'Penalty': '🟡',
  'Retirement': '🔴',
};

const PositionDisplay = ({ position }) => {
  const isWin = position === 1;
  return (
    <div className={`rd-position ${isWin ? 'rd-position--win' : ''}`}>
      <span className="rd-position-label">Finished</span>
      <span className="rd-position-value">
        P{position}
        {isWin && <span className="rd-trophy">🏆</span>}
      </span>
    </div>
  );
};

const StatCard = ({ label, value, className = '' }) => (
  <div className={`rd-stat-card ${className}`}>
    <span className="rd-stat-label">{label}</span>
    <span className="rd-stat-value">{value}</span>
  </div>
);

const TyreTimeline = ({ strategy, sprintStrategy }) => {
  if (!strategy || strategy.length === 0) return null;
  return (
    <div className="rd-tyre-section">
      {sprintStrategy && sprintStrategy.length > 0 && (
        <div className="rd-tyre-group">
          <span className="rd-tyre-group-label">Sprint</span>
          <div className="rd-tyre-stints">
            {sprintStrategy.map((stint, i) => (
              <div key={`sprint-${i}`} className="rd-tyre-stint">
                <span
                  className="rd-tyre-dot"
                  style={{ backgroundColor: compoundColor(stint.compound) }}
                />
                <span className="rd-tyre-name">{stint.compound}</span>
                <span className="rd-tyre-laps">{stint.laps} laps</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="rd-tyre-group">
        <span className="rd-tyre-group-label">Race</span>
        <div className="rd-tyre-stints">
          {strategy.map((stint, i) => (
            <div key={`race-${i}`} className="rd-tyre-stint">
              <span
                className="rd-tyre-dot"
                style={{ backgroundColor: compoundColor(stint.compound) }}
              />
              <span className="rd-tyre-name">{stint.compound}</span>
              <span className="rd-tyre-laps">{stint.laps} laps</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HighlightsRow = ({ highlights }) => {
  if (!highlights || highlights.length === 0) return null;
  return (
    <div className="rd-highlights">
      {highlights.map((h) => (
        <span key={h} className="rd-highlight-badge">
          {HIGHLIGHT_ICONS[h] && <span className="rd-highlight-icon">{HIGHLIGHT_ICONS[h]}</span>}
          {h}
        </span>
      ))}
    </div>
  );
};

const ChampImpact = ({ championship }) => {
  if (!championship) return null;
  const gapText =
    championship.gapToLeader === 0
      ? 'Leader'
      : championship.gapToLeader > 0
        ? `+${championship.gapToLeader}`
        : `${championship.gapToLeader}`;
  return (
    <div className="rd-champ">
      <div className="rd-champ-item">
        <span className="rd-champ-label">Championship Position</span>
        <span className="rd-champ-value">P{championship.position}</span>
      </div>
      <div className="rd-champ-item">
        <span className="rd-champ-label">Points Total</span>
        <span className="rd-champ-value">{championship.points}</span>
      </div>
      <div className="rd-champ-item">
        <span className="rd-champ-label">Gap to Leader</span>
        <span className={`rd-champ-value ${championship.gapToLeader === 0 ? 'rd-champ-leader' : ''}`}>
          {gapText}
        </span>
      </div>
    </div>
  );
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const RaceDetail = ({ race, results, onBack }) => {
  if (!results) return null;
  const r = results.result;
  if (!r) return null;

  return (
    <motion.div
      className="rd-hero"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <button className="rd-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        All Races
      </button>

      <div className="rd-header">
        <div className="rd-header-left">
          <div className="rd-title-row">
            <span className="rd-flag">{flagEmoji(race.countryCode)}</span>
            <h2 className="rd-gp-name">{race.raceName}</h2>
            {results.isSprint && <span className="rd-sprint-badge">Sprint Weekend</span>}
          </div>
          <p className="rd-circuit-name">
            {race.circuit} · {formatDate(race.date)}
          </p>
        </div>
        <div className="rd-header-right">
          <CircuitMap circuit={race.circuit} size={100} className="circuit-map--hero" />
        </div>
      </div>

      <div className="rd-summary">
        <PositionDisplay position={r.position} />
        <StatCard label="Points" value={r.points} />
        {r.fastestLap && <StatCard label="Fastest Lap" value="Yes" className="rd-stat--accent" />}
        {r.driverOfTheDay && <StatCard label="Driver of the Day" value="Won" className="rd-stat--accent" />}
      </div>

      <div className="rd-section">
        <span className="rd-section-label">Weekend Performance</span>
        <div className="rd-stat-grid rd-stat-grid--4">
          <StatCard label="Qualifying" value={`P${r.qualifyingPosition}`} />
          <StatCard label="Started" value={`P${r.gridPosition}`} />
          {r.sprintPosition != null && (
            <StatCard label="Sprint" value={`P${r.sprintPosition}`} />
          )}
          <StatCard
            label="Positions Gained"
            value={r.positionsGained > 0 ? `+${r.positionsGained}` : r.positionsGained === 0 ? '—' : `${r.positionsGained}`}
          />
        </div>
      </div>

      <div className="rd-section">
        <span className="rd-section-label">Race Statistics</span>
        <div className="rd-stat-grid rd-stat-grid--4">
          <StatCard label="Pit Stops" value={r.pitStops} />
          <StatCard label="Best Lap" value={r.bestLapTime} />
          <StatCard label="Top Speed" value={`${r.topSpeed} km/h`} />
          <StatCard label="Race Time" value={r.totalRaceTime} />
        </div>
      </div>

      <div className="rd-section">
        <span className="rd-section-label">Tyre Strategy</span>
        <TyreTimeline strategy={r.tyreStrategy} sprintStrategy={r.sprintStrategy} />
      </div>

      <div className="rd-section">
        <span className="rd-section-label">Race Highlights</span>
        <HighlightsRow highlights={r.highlights} />
      </div>

      <div className="rd-section">
        <span className="rd-section-label">Championship Impact</span>
        <ChampImpact championship={r.championship} />
      </div>
    </motion.div>
  );
};

export default RaceDetail;
