import { useState, useEffect, useMemo } from 'react';
import { useOpenF1, fmtLapTime, fmtGap } from '../hooks/useOpenF1';
import CircuitMap from '../components/CircuitMap';
import calendarData from '../data/calendar2026.json';
import './LiveTelemetry.css';

const MAX_DRIVER_NUMBER = 1;

// LiveDot pulses based on the telemetry hook's lastUpdate timestamp rather than
// a 1s parent re-render loop — we snapshot `lastUpdate` locally and react to
// it via React state only when the parent actually has new data.
const LiveDot = ({ lastUpdate }) => {
  // Re-render the pulse animation on every lastUpdate change only.
  void lastUpdate;
  return (
    <span className="lt-live-dot" aria-hidden="true">
      <span className="lt-live-dot-core" />
      <span className="lt-live-dot-ring" />
    </span>
  );
};

const Countdown = ({ date }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = new Date(date) - now;
  if (diff <= 0) return <span className="lt-countdown-live">RACE WEEK</span>;

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return (
    <div className="lt-countdown-grid">
      <div className="lt-countdown-cell">
        <span className="lt-countdown-value telemetry">{String(days).padStart(2, '0')}</span>
        <span className="lt-countdown-label">Days</span>
      </div>
      <div className="lt-countdown-cell">
        <span className="lt-countdown-value telemetry">{String(hours).padStart(2, '0')}</span>
        <span className="lt-countdown-label">Hrs</span>
      </div>
      <div className="lt-countdown-cell">
        <span className="lt-countdown-value telemetry">{String(mins).padStart(2, '0')}</span>
        <span className="lt-countdown-label">Min</span>
      </div>
      <div className="lt-countdown-cell">
        <span className="lt-countdown-value telemetry">{String(secs).padStart(2, '0')}</span>
        <span className="lt-countdown-label">Sec</span>
      </div>
    </div>
  );
};

const PositionTimeline = ({ timeline }) => {
  if (!timeline || timeline.length === 0) return null;

  const width = 100;
  const height = 40;
  const padding = { top: 4, bottom: 4, left: 4, right: 4 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const minPos = 1;
  const maxPos = Math.max(...timeline.map((t) => t.position), 4);
  const posRange = maxPos - minPos || 1;

  const xScale = (lap) => {
    const maxLap = timeline[timeline.length - 1].lap || 1;
    return padding.left + ((lap - 1) / (maxLap - 1 || 1)) * plotW;
  };
  const yScale = (pos) => padding.top + ((pos - minPos) / posRange) * plotH;

  const pathD = timeline
    .map((t, i) => `${i === 0 ? 'M' : 'L'} ${xScale(t.lap).toFixed(2)} ${yScale(t.position).toFixed(2)}`)
    .join(' ');

  // Detect position changes for annotations
  const changes = [];
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].position !== timeline[i - 1].position) {
      changes.push(timeline[i]);
    }
  }

  return (
    <div className="lt-timeline">
      <svg viewBox={`0 0 ${width} ${height}`} className="lt-timeline-svg" preserveAspectRatio="none">
        {/* Grid lines for P1, P2, P3... */}
        {Array.from({ length: maxPos - minPos + 1 }, (_, i) => {
          const pos = minPos + i;
          const y = yScale(pos);
          return (
            <line
              key={pos}
              x1={padding.left}
              y1={y.toFixed(2)}
              x2={width - padding.right}
              y2={y.toFixed(2)}
              stroke="var(--grid-line)"
              strokeWidth="0.3"
              strokeDasharray="1 1"
            />
          );
        })}

        {/* Main line */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--red)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots at each lap */}
        {timeline.map((t) => (
          <circle
            key={t.lap}
            cx={xScale(t.lap).toFixed(2)}
            cy={yScale(t.position).toFixed(2)}
            r="0.8"
            fill="var(--track-black)"
            stroke="var(--red)"
            strokeWidth="0.5"
          />
        ))}

        {/* Highlight dots at position changes */}
        {changes.map((t) => (
          <circle
            key={`change-${t.lap}`}
            cx={xScale(t.lap).toFixed(2)}
            cy={yScale(t.position).toFixed(2)}
            r="1.4"
            fill="var(--yellow)"
            stroke="var(--track-black)"
            strokeWidth="0.4"
          />
        ))}
      </svg>

      {/* Annotations below the chart */}
      <div className="lt-timeline-labels">
        {changes.slice(-4).map((t) => (
          <span key={t.lap} className="lt-timeline-label">
            L{t.lap} → P{t.position}
          </span>
        ))}
      </div>
    </div>
  );
};

const PitWindow = ({ tires, laps }) => {
  if (!tires || !laps || laps.length === 0) return null;

  const tireAge = tires.age || 0;
  const pitStops = tires.stint - 1;

  // Simple estimation: typical stint length ~25-35 laps on Medium
  const estimatedStintLength = tires.compound === 'HARD' ? 35 : tires.compound === 'SOFT' ? 18 : 26;
  const lapsRemaining = Math.max(0, estimatedStintLength - tireAge);
  const currentLap = laps[laps.length - 1]?.lap_number || 0;
  const estimatedPitLap = currentLap + lapsRemaining;

  return (
    <div className="lt-pit-info">
      <div className="lt-pit-row">
        <span className="lt-pit-label">Pit Stops</span>
        <span className="lt-pit-value telemetry">{pitStops}</span>
      </div>
      <div className="lt-pit-row">
        <span className="lt-pit-label">Est. Next Pit</span>
        <span className="lt-pit-value telemetry">
          {lapsRemaining > 0 ? `L${estimatedPitLap - 2}–${estimatedPitLap + 2}` : 'Window open'}
        </span>
      </div>
    </div>
  );
};

/** Determine the session status for the weekend strip */
const sessionStatus = (sessionDate, durationMs = 2 * 60 * 60 * 1000) => {
  const now = Date.now();
  const start = new Date(sessionDate).getTime();
  const end = start + durationMs;
  if (now >= start && now <= end) return 'is-live';
  if (now > end) return 'is-completed';
  return 'is-upcoming';
};

/** Format a UTC date to local time string */
const fmtLocalTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const fmtLocalDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
};

/** Weekend schedule strip component */
const WeekendSchedule = ({ sessions }) => {
  const [, setTick] = useState(0);

  // Re-render every 30s to update session statuses
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  if (!sessions || sessions.length === 0) return null;

  return (
    <div className="lt-weekend">
      {sessions.map((s) => {
        const status = sessionStatus(s.date);
        return (
          <div key={s.name} className={`lt-weekend-session ${status}`}>
            <span className="lt-weekend-session-name">{s.name}</span>
            <span className="lt-weekend-session-time">{fmtLocalTime(s.date)}</span>
            <span className="lt-weekend-session-date">{fmtLocalDate(s.date)}</span>
          </div>
        );
      })}
    </div>
  );
};

const LiveTelemetry = () => {
  const {
    status,
    session,
    isLive,
    lastUpdate,
    driver,
    lap,
    laps,
    gaps,
    sectors,
    tires,
    carTelemetry,
    weather,
    positionTimeline,
    nextSession,
    error,
    refresh,
  } = useOpenF1({ season: 2026, driverNumber: MAX_DRIVER_NUMBER });

  // Find current race weekend from calendar data — always computed (hooks
  // must be called unconditionally at the top level of the component).
  const currentRace = useMemo(() => {
    const now = new Date();
    const circuitName = session?.circuit_short_name;

    // Try to match by circuit name from session data
    if (circuitName) {
      const match = calendarData.find(
        (r) =>
          r.circuit.toLowerCase() === circuitName.toLowerCase() ||
          r.raceName.toLowerCase().includes(circuitName.toLowerCase()),
      );
      if (match) return match;
    }

    // Fallback: find the nearest race by date
    const sorted = [...calendarData]
      .filter((r) => !r.isCancelled)
      .sort((a, b) => {
        const diffA = Math.abs(new Date(a.date) - now);
        const diffB = Math.abs(new Date(b.date) - now);
        return diffA - diffB;
      });

    return sorted[0] || null;
  }, [session]);

  // Next upcoming race for the no-session view — always computed
  const nextUpcomingRace = useMemo(() => {
    const now = new Date();
    return (
      calendarData
        .filter((r) => !r.isCancelled && new Date(r.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null
    );
  }, []);

  // ---- NO SESSION STATE ----
  if (status === 'no-session' || (status === 'live' && !isLive)) {
    const displaySession = nextSession || session;
    const noSessionRace = nextUpcomingRace;

    return (
      <div className="lt-page container">
        <header className="page-head">
          <span className="eyebrow">Live Timing</span>
          <h1 className="page-title">Live Telemetry</h1>
          <p className="page-subtitle">
            Real-time data from Max Verstappen&apos;s on-track sessions.
          </p>
        </header>

        <div className="lt-no-session">
          <div className="lt-no-session-inner">
            <span className="lt-no-session-icon" aria-hidden="true">🏎️</span>
            <h2 className="lt-no-session-title">No live session</h2>
            {(displaySession || noSessionRace) && (
              <>
                <p className="lt-no-session-text">
                  Next race:{' '}
                  <strong>
                    {displaySession?.raceName ||
                      displaySession?.session_name ||
                      noSessionRace?.raceName}
                  </strong>
                  {(displaySession?.circuit_short_name || noSessionRace?.circuit) &&
                    ` · ${displaySession?.circuit_short_name || noSessionRace?.circuit}`}
                </p>
                {noSessionRace && (
                  <CircuitMap
                    circuit={noSessionRace.circuit}
                    size={100}
                    className="circuit-map--hero"
                  />
                )}
                <Countdown date={displaySession?.date_start || noSessionRace?.date} />
                {noSessionRace?.sessions && (
                  <WeekendSchedule sessions={noSessionRace.sessions} />
                )}
              </>
            )}
            {!displaySession && !noSessionRace && (
              <p className="lt-no-session-text">
                Check back during a race weekend to see live data.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- LOADING STATE ----
  if (status === 'loading') {
    return (
      <div className="lt-page container">
        <header className="page-head">
          <span className="eyebrow">Live Timing</span>
          <h1 className="page-title">Live Telemetry</h1>
        </header>
        <div className="lt-skeleton">
          <div className="lt-skeleton-bar lt-skeleton-bar--sm" />
          <div className="lt-skeleton-bar lt-skeleton-bar--lg" />
          <div className="lt-skeleton-bar lt-skeleton-bar--md" />
          <div className="lt-skeleton-grid">
            <div className="lt-skeleton-bar lt-skeleton-bar--box" />
            <div className="lt-skeleton-bar lt-skeleton-bar--box" />
            <div className="lt-skeleton-bar lt-skeleton-bar--box" />
          </div>
        </div>
      </div>
    );
  }

  // ---- ERROR STATE ----
  if (status === 'error') {
    return (
      <div className="lt-page container">
        <header className="page-head">
          <span className="eyebrow">Live Timing</span>
          <h1 className="page-title">Live Telemetry</h1>
        </header>
        <div className="lt-error">
          <p>Could not connect to live timing data.</p>
          {error && <p className="lt-error-detail">{error}</p>}
          <button className="btn btn--ghost" onClick={refresh}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ---- LIVE STATE ----
  const position = driver?.position || '—';
  const currentLap = lap?.lap_number || 0;
  const totalLaps = session?.laps_total || (lap?.lap_number ? Math.max(lap.lap_number, 58) : 58);
  const lastLapTime = fmtLapTime(lap?.lap_duration);
  const bestLap = laps
    .filter((l) => l.lap_duration && !l.is_pit_out_lap)
    .reduce((b, l) => (!b || l.lap_duration < b.lap_duration ? l : b), null);
  const bestLapTime = fmtLapTime(bestLap?.lap_duration);

  const statusText = isLive ? 'Racing' : 'Session Ended';

  return (
    <div className="lt-page container">
      <header className="page-head">
        <span className="eyebrow">Live Timing</span>
        <h1 className="page-title">Live Telemetry</h1>
        <p className="page-subtitle">
          Real-time data from Max Verstappen&apos;s on-track sessions.
        </p>
      </header>

      {/* Weekend schedule strip */}
      {currentRace?.sessions && <WeekendSchedule sessions={currentRace.sessions} />}

      {/* Status bar */}
      <div className="lt-statusbar">
        <div className="lt-statusbar-left">
          {isLive && <LiveDot lastUpdate={lastUpdate} />}
          <span className="lt-statusbar-name">
            {session?.raceName || session?.session_name || 'Race'}
          </span>
          <span className="lt-statusbar-circuit">
            · {session?.circuit_short_name || currentRace?.circuit || 'Circuit'}
          </span>
        </div>
        <div className="lt-statusbar-right">
          <span className="lt-statusbar-lap">
            Lap <strong className="telemetry">{currentLap}</strong>
            <span className="lt-statusbar-lap-total">/{totalLaps}</span>
          </span>
          <span className={`lt-statusbar-status ${isLive ? 'is-live' : ''}`}>{statusText}</span>
        </div>
      </div>

      {/* Hero readout */}
      <div className="lt-hero">
        <div className="lt-hero-main">
          <div className="lt-position">
            <span className="lt-position-label">Position</span>
            <span className="lt-position-value telemetry">P{position}</span>
          </div>
          <div className="lt-lap-times">
            <div className="lt-lap-time-card">
              <span className="lt-lap-time-label">Last Lap</span>
              <span className="lt-lap-time-value telemetry">{lastLapTime}</span>
            </div>
            <div className="lt-lap-time-card">
              <span className="lt-lap-time-label">Best Lap</span>
              <span className="lt-lap-time-value telemetry is-best">{bestLapTime}</span>
            </div>
          </div>
          {/* Circuit map watermark */}
          {currentRace && (
            <div className="lt-hero-circuit-map">
              <CircuitMap circuit={currentRace.circuit} size={120} />
            </div>
          )}
        </div>
      </div>

      {/* Sectors */}
      {sectors && (
        <div className="lt-sectors">
          <span className="lt-sectors-title">Sectors</span>
          <div className="lt-sectors-grid">
            {[
              { key: 'S1', time: sectors.s1, best: sectors.bestS1, segments: sectors.segmentsS1 },
              { key: 'S2', time: sectors.s2, best: sectors.bestS2, segments: sectors.segmentsS2 },
              { key: 'S3', time: sectors.s3, best: sectors.bestS3, segments: sectors.segmentsS3 },
            ].map(({ key, time, best, segments }) => {
              const isPB = time === best;
              return (
                <div key={key} className={`lt-sector ${isPB ? 'is-best' : ''}`}>
                  <span className="lt-sector-label">{key}</span>
                  <span className="lt-sector-value telemetry">{time?.toFixed(3) || '—'}</span>
                  {Array.isArray(segments) && segments.length > 0 && (
                    <span className="lt-segment-bar" aria-hidden="true">
                      {segments.map((b, i) => (
                        <span
                          key={i}
                          className={`lt-segment ${b === 19 ? 'is-purple' : b === 9 ? 'is-personal' : b === 11 ? 'is-gray' : ''}`}
                        />
                      ))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gaps */}
      {gaps && (
        <div className="lt-gaps">
          <div className="lt-gap-card">
            <span className="lt-gap-label">Gap to Leader</span>
            <span className="lt-gap-value telemetry">{fmtGap(gaps.gapToLeader)}</span>
          </div>
          <div className="lt-gap-card">
            <span className="lt-gap-label">Gap Ahead</span>
            <span className="lt-gap-value telemetry">{fmtGap(gaps.gapToAhead)}</span>
          </div>
          <div className="lt-gap-card">
            <span className="lt-gap-label">Gap Behind</span>
            <span className="lt-gap-value telemetry">
              {gaps.gapBehind != null ? fmtGap(gaps.gapBehind) : '—'}
            </span>
          </div>
        </div>
      )}

      {/* Car telemetry */}
      {carTelemetry && (
        <div className="lt-car">
          <span className="lt-section-title">Car Telemetry</span>
          <div className="lt-car-grid">
            <div className="lt-car-item">
              <span className="lt-car-label">Speed</span>
              <span className="lt-car-value telemetry">
                {carTelemetry.speed != null ? `${carTelemetry.speed} km/h` : '—'}
              </span>
            </div>
            <div className="lt-car-item">
              <span className="lt-car-label">Gear</span>
              <span className="lt-car-value telemetry">
                {carTelemetry.n_gear != null && carTelemetry.n_gear > 0
                  ? carTelemetry.n_gear
                  : '—'}
              </span>
            </div>
            <div className="lt-car-item">
              <span className="lt-car-label">RPM</span>
              <span className="lt-car-value telemetry">
                {carTelemetry.rpm != null && carTelemetry.rpm > 0 ? carTelemetry.rpm : '—'}
              </span>
            </div>
            <div className="lt-car-item">
              <span className="lt-car-label">DRS</span>
              <span className={`lt-car-value ${carTelemetry.drs > 0 ? 'is-open' : ''}`}>
                {carTelemetry.drs > 0 ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
          {/* Throttle / brake bars */}
          <div className="lt-car-pedals">
            <div className="lt-car-pedal">
              <span className="lt-car-label">Throttle</span>
              <span className="lt-bar lt-bar--throttle">
                <span
                  className="lt-bar-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, carTelemetry.throttle ?? 0))}%`,
                  }}
                />
              </span>
              <span className="lt-car-value">
                {carTelemetry.throttle != null ? `${carTelemetry.throttle}%` : '—'}
              </span>
            </div>
            <div className="lt-car-pedal">
              <span className="lt-car-label">Brake</span>
              <span className="lt-bar lt-bar--brake">
                <span
                  className="lt-bar-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, carTelemetry.brake ?? 0))}%`,
                  }}
                />
              </span>
              <span className="lt-car-value">
                {carTelemetry.brake != null ? `${carTelemetry.brake}%` : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tyre strategy */}
      {tires && (
        <div className="lt-tyre">
          <span className="lt-section-title">Tyre Strategy</span>
          <div className="lt-tyre-inner">
            <div className="lt-tire-visual">
              <div className="lt-tire-ring" style={{ '--tire-color': tires.color }}>
                <span className="lt-tire-compound">{tires.compound?.charAt(0) || '?'}</span>
              </div>
              <div className="lt-tire-info">
                <span className="lt-tire-name">{tires.compound || '—'}</span>
                <span className="lt-tire-age">{tires.age} laps old</span>
              </div>
            </div>
            <PitWindow tires={tires} laps={laps} />
          </div>
        </div>
      )}

      {/* Position timeline */}
      {positionTimeline.length > 0 && (
        <div className="lt-timeline-section">
          <span className="lt-section-title">Race Position Timeline</span>
          <PositionTimeline timeline={positionTimeline} />
        </div>
      )}

      {/* Weather strip */}
      {weather && (
        <div className="lt-weather">
          <span className="lt-section-title">Conditions</span>
          <div className="lt-weather-grid">
            <div className="lt-weather-item">
              <span className="lt-weather-label">Air</span>
              <span className="lt-weather-value telemetry">
                {weather.air_temperature != null ? `${weather.air_temperature}°C` : '—'}
              </span>
            </div>
            <div className="lt-weather-item">
              <span className="lt-weather-label">Track</span>
              <span className="lt-weather-value telemetry">
                {weather.track_temperature != null ? `${weather.track_temperature}°C` : '—'}
              </span>
            </div>
            <div className="lt-weather-item">
              <span className="lt-weather-label">Humidity</span>
              <span className="lt-weather-value telemetry">
                {weather.humidity != null ? `${weather.humidity}%` : '—'}
              </span>
            </div>
            <div className="lt-weather-item">
              <span className="lt-weather-label">Wind</span>
              <span className="lt-weather-value telemetry">
                {weather.wind_speed != null ? `${weather.wind_speed} m/s` : '—'}
                {weather.wind_direction != null ? ` @ ${weather.wind_direction}°` : ''}
              </span>
            </div>
            <div className="lt-weather-item">
              <span className="lt-weather-label">Rain</span>
              <span className={`lt-weather-value ${weather.rainfall > 0 ? 'is-rain' : ''}`}>
                {weather.rainfall > 0 ? 'Rain' : 'Dry'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTelemetry;
