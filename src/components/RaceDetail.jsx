import FadeIn from './FadeIn';
import { ChevronLeft, ChevronRight } from './Chevron';
import CircuitMap from './CircuitMap';
import MaxLapChart from './MaxLapChart';
import './RaceDetail.css';
import maxLapCharts from '../data/maxLapCharts2026.json';

const compoundColor = (compound) => {
  const map = { SOFT: '#FF3333', MEDIUM: '#FFD700', HARD: '#F0F0F0', INTER: '#3EB83E', WET: '#3399FF' };
  return map[compound] || '#888888';
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const StatCard = ({ label, value, className = '' }) => (
  <div className={`rd-stat-card ${className}`}>
    <span className="rd-stat-label">{label}</span>
    <span className="rd-stat-value">{value == null ? '—' : value}</span>
  </div>
);

const RaceDetail = ({ race, results, onBack, prevRace, nextRaceNav, goToRace }) => {
  if (!results) return null;
  const r = results.result;
  if (!r) return null;
  const lapChart = maxLapCharts.find((entry) => entry.round === results.round);

  return (
    <FadeIn
      y={24}
      duration={0.4}
      className="rd-hero"
    >
      <div className="cal-hero-top">
        <button className="rd-back" onClick={onBack}>
          <ChevronLeft size={16} />
          All Races
        </button>
        <div className="cal-nav-arrows">
          <button
            className="cal-nav-btn"
            disabled={!prevRace}
            onClick={() => prevRace && goToRace(prevRace)}
            aria-label="Previous race"
          >
            <ChevronLeft />
          </button>
          <button
            className="cal-nav-btn"
            disabled={!nextRaceNav}
            onClick={() => nextRaceNav && goToRace(nextRaceNav)}
            aria-label="Next race"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      <div className="rd-header">
        <div className="rd-header-left">
          <div className="rd-title-row">
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

      {r.position != null && (
        <div className="rd-summary">
          <div className={`rd-position ${r.position === 1 ? 'rd-position--win' : ''}`}>
            <span className="rd-position-label">Finished</span>
            <span className="rd-position-value">P{r.position}</span>
          </div>
          {r.points != null && <StatCard label="Points" value={r.points} />}
          {r.fastestLap && <StatCard label="Fastest Lap" value="Yes" className="rd-stat--accent" />}
          {r.driverOfTheDay && <StatCard label="Driver of the Day" value="Won" className="rd-stat--accent" />}
        </div>
      )}

      <div className="rd-section">
        <span className="rd-section-label">Weekend Performance</span>
        <div className="rd-stat-grid rd-stat-grid--4">
          <StatCard label="Qualifying" value={r.qualifyingPosition != null ? `P${r.qualifyingPosition}` : null} />
          <StatCard label="Started" value={r.gridPosition != null ? `P${r.gridPosition}` : null} />
          {r.sprintPosition != null && (
            <StatCard label="Sprint" value={`P${r.sprintPosition}`} />
          )}
          <StatCard
            label="Positions Gained"
            value={r.positionsGained != null
              ? (r.positionsGained > 0 ? `+${r.positionsGained}` : r.positionsGained === 0 ? '—' : `${r.positionsGained}`)
              : null}
          />
        </div>
      </div>

      {lapChart && lapChart.laps.length > 0 && (
        <div className="rd-section">
          <span className="rd-section-label">Position by Lap</span>
          <MaxLapChart
            raceName={race.raceName}
            laps={lapChart.laps}
            retired={r.position == null}
          />
        </div>
      )}

      <div className="rd-section">
        <span className="rd-section-label">Race Statistics</span>
        <div className="rd-stat-grid rd-stat-grid--4">
          <StatCard label="Pit Stops" value={r.pitStops != null ? r.pitStops : null} />
          <StatCard label="Best Lap" value={r.bestLapTime} />
          <StatCard label="Top Speed" value={r.topSpeed != null ? `${r.topSpeed} km/h` : null} />
          <StatCard label="Race Time" value={r.totalRaceTime} />
        </div>
      </div>

      <div className="rd-section">
        <span className="rd-section-label">Tyre Strategy</span>
        {(!r.tyreStrategy && !r.sprintStrategy) ? (
          <p className="rd-na">Data not available</p>
        ) : (
          <div className="rd-tyre-section">
            {r.sprintStrategy && r.sprintStrategy.length > 0 && (
              <div className="rd-tyre-group">
                <span className="rd-tyre-group-label">Sprint</span>
                <div className="rd-tyre-stints">
                  {r.sprintStrategy.map((stint, i) => (
                    <div key={`sprint-${i}`} className="rd-tyre-stint">
                      <span className="rd-tyre-dot" style={{ backgroundColor: compoundColor(stint.compound) }} />
                      <span className="rd-tyre-name">{stint.compound}</span>
                      <span className="rd-tyre-laps">{stint.laps} laps</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {r.tyreStrategy && r.tyreStrategy.length > 0 && (
              <div className="rd-tyre-group">
                <span className="rd-tyre-group-label">Race</span>
                <div className="rd-tyre-stints">
                  {r.tyreStrategy.map((stint, i) => (
                    <div key={`race-${i}`} className="rd-tyre-stint">
                      <span className="rd-tyre-dot" style={{ backgroundColor: compoundColor(stint.compound) }} />
                      <span className="rd-tyre-name">{stint.compound}</span>
                      <span className="rd-tyre-laps">{stint.laps} laps</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rd-section">
        <span className="rd-section-label">Race Highlights</span>
        {r.highlights && r.highlights.length > 0 ? (
          <div className="rd-highlights">
            {r.highlights.map((h) => (
              <span key={h} className="rd-highlight-badge">{h}</span>
            ))}
          </div>
        ) : (
          <p className="rd-na">No highlights recorded</p>
        )}
      </div>

      <div className="rd-section">
        <span className="rd-section-label">Championship Impact</span>
        {r.championship ? (() => {
          const gapText =
            r.championship.gapToLeader === 0
              ? 'Leader'
              : r.championship.gapToLeader > 0
                ? `+${r.championship.gapToLeader}`
                : `${r.championship.gapToLeader}`;
          return (
            <div className="rd-champ">
              <div className="rd-champ-item">
                <span className="rd-champ-label">Championship Position</span>
                <span className="rd-champ-value">P{r.championship.position}</span>
              </div>
              <div className="rd-champ-item">
                <span className="rd-champ-label">Points Total</span>
                <span className="rd-champ-value">{r.championship.points}</span>
              </div>
              <div className="rd-champ-item">
                <span className="rd-champ-label">Gap to Leader</span>
                <span className={`rd-champ-value ${r.championship.gapToLeader === 0 ? 'rd-champ-leader' : ''}`}>
                  {gapText}
                </span>
              </div>
            </div>
          );
        })() : (
          <p className="rd-na">Not available — no championship data</p>
        )}
      </div>
    </FadeIn>
  );
};

export default RaceDetail;
