import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import calendarData from '../data/calendar2026.json';
import CircuitMap from '../components/CircuitMap';
import Countdown from '../components/Countdown';
import RaceDetail from '../components/RaceDetail';
import { formatDate } from '../utils/format';
import useRaceWeekend from '../hooks/useRaceWeekend';
import raceResults from '../data/raceResults2026.json';
import './Calendar.css';

const statusOf = (race, now) => {
  if (race.isCancelled) return 'cancelled';
  const firstSession = race.sessions[0];
  if (!firstSession) return 'upcoming';
  const sessionStart = new Date(firstSession.date);
  const diff = sessionStart - now;
  if (diff < 0) {
    const raceDate = new Date(race.date);
    const weekendEnd = new Date(raceDate);
    weekendEnd.setDate(weekendEnd.getDate() + 1);
    weekendEnd.setUTCHours(0, 0, 0, 0);
    if (now >= weekendEnd) return 'completed';
    return 'current';
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) return 'soon';
  return 'upcoming';
};

/** Format a session time to local */
const fmtSessionTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const fmtSessionDay = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short' });
};

const Calendar = () => {
  const now = new Date();
  const [selectedRound, setSelectedRound] = useState(null);
  const [previewRound, setPreviewRound] = useState(null);
  const calendarRef = useRef(null);

  const { currentRace, nextRace } = useRaceWeekend();
  const heroRace = currentRace || nextRace;

  const sortedRaces = useMemo(
    () => [...calendarData].sort((a, b) => a.round - b.round),
    [],
  );

  const viewingRound = selectedRound || previewRound || heroRace?.round;

  const prevRace = useMemo(() => {
    if (!viewingRound) return null;
    const idx = sortedRaces.findIndex((r) => r.round === viewingRound);
    return idx > 0 ? sortedRaces[idx - 1] : null;
  }, [viewingRound, sortedRaces]);

  const nextRaceNav = useMemo(() => {
    if (!viewingRound) return null;
    const idx = sortedRaces.findIndex((r) => r.round === viewingRound);
    return idx < sortedRaces.length - 1 ? sortedRaces[idx + 1] : null;
  }, [viewingRound, sortedRaces]);

  const goToRace = (race) => {
    const raceResult = raceResults.find((r) => r.round === race.round);
    if (raceResult?.hasResults) {
      setSelectedRound(race.round);
      setPreviewRound(null);
    } else {
      setPreviewRound(race.round);
      setSelectedRound(null);
    }
    calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const selectedRaceData = useMemo(() => {
    if (!selectedRound) return null;
    const race = sortedRaces.find((r) => r.round === selectedRound);
    const results = raceResults.find((r) => r.round === selectedRound);
    if (!race || !results?.hasResults) return null;
    return { race, results };
  }, [selectedRound, sortedRaces]);

  const previewRace = useMemo(
    () => (previewRound ? sortedRaces.find((r) => r.round === previewRound) : null),
    [previewRound, sortedRaces],
  );

  return (
    <div className="calendar-page container" ref={calendarRef}>
      <header className="page-head">
        <span className="eyebrow">2026 Season</span>
        <h1 className="page-title">Calendar</h1>
        <p className="page-subtitle">
          Max Verstappen&apos;s 2026 Formula 1 season — every round, every circuit.
        </p>
      </header>

      {selectedRaceData ? (
        <RaceDetail
          race={selectedRaceData.race}
          results={selectedRaceData.results}
          onBack={() => setSelectedRound(null)}
          prevRace={prevRace}
          nextRaceNav={nextRaceNav}
          goToRace={goToRace}
        />
      ) : previewRace ? (
        <motion.div
          className="cal-hero cal-hero--preview"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="cal-hero-top">
            <button className="rd-back" onClick={() => setPreviewRound(null)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              All Races
            </button>
            <div className="cal-nav-arrows">
              <button
                className="cal-nav-btn"
                disabled={!prevRace}
                onClick={() => prevRace && goToRace(prevRace)}
                aria-label="Previous race"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                className="cal-nav-btn"
                disabled={!nextRaceNav}
                onClick={() => nextRaceNav && goToRace(nextRaceNav)}
                aria-label="Next race"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="cal-hero-inner">
            <div className="cal-hero-left">
              <span className="cal-hero-eyebrow">Round {previewRace.round}</span>
              <h2 className="cal-hero-name">{previewRace.raceName}</h2>
              <p className="cal-hero-circuit">
                {previewRace.country} · {previewRace.circuit}
              </p>
              <p className="cal-hero-date">{formatDate(previewRace.date)}</p>

              {previewRace.sessions && (
                <div className="cal-hero-sessions">
                  {previewRace.sessions.map((s) => (
                    <span key={s.name} className="cal-hero-session-chip">
                      <span className="cal-hero-session-name">{s.name}</span>
                      <span className="cal-hero-session-time">
                        {fmtSessionDay(s.date)} {fmtSessionTime(s.date)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="cal-hero-right">
              <CircuitMap
                circuit={previewRace.circuit}
                size={220}
                className="circuit-map--hero"
              />
              <div className="cal-hero-countdown">
                <Countdown date={previewRace.date} />
              </div>
            </div>
          </div>
        </motion.div>
      ) : heroRace && (
        <motion.div
          className={`cal-hero ${currentRace ? 'cal-hero--current' : ''}`}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="cal-hero-top">
            <span />
            <div className="cal-nav-arrows">
              <button
                className="cal-nav-btn"
                disabled={!prevRace}
                onClick={() => prevRace && goToRace(prevRace)}
                aria-label="Previous race"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                className="cal-nav-btn"
                disabled={!nextRaceNav}
                onClick={() => nextRaceNav && goToRace(nextRaceNav)}
                aria-label="Next race"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="cal-hero-inner">
            <div className="cal-hero-left">
              <span className="cal-hero-eyebrow">{currentRace ? 'This Week' : 'Next Race'}</span>
              <h2 className="cal-hero-name">{heroRace.raceName}</h2>
              <p className="cal-hero-circuit">
                {heroRace.country} · {heroRace.circuit}
              </p>
              <p className="cal-hero-date">{formatDate(heroRace.date)}</p>
              {heroRace.sessions && (
                <div className="cal-hero-sessions">
                  {heroRace.sessions.map((s) => (
                    <span key={s.name} className="cal-hero-session-chip">
                      <span className="cal-hero-session-name">{s.name}</span>
                      <span className="cal-hero-session-time">
                        {fmtSessionDay(s.date)} {fmtSessionTime(s.date)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="cal-hero-right">
              <CircuitMap
                circuit={heroRace.circuit}
                size={220}
                className="circuit-map--hero"
              />
              <div className="cal-hero-countdown">
                <Countdown date={heroRace.date} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="cal-grid">
        {sortedRaces.map((race, i) => {
          const status = statusOf(race, now);
          const raceResult = raceResults.find((r) => r.round === race.round);
          const isSelected = selectedRound === race.round;
          return (
            <motion.div
              key={race.round}
              className={`cal-card cal-card--${status} ${isSelected ? 'cal-card--selected' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (i % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => {
                if (raceResult?.hasResults) {
                  setSelectedRound((prev) => (prev === race.round ? null : race.round));
                  setPreviewRound(null);
                } else {
                  setPreviewRound((prev) => (prev === race.round ? null : race.round));
                  setSelectedRound(null);
                }
                calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <div className="cal-card-top">
                <span className="cal-round">R{race.round}</span>
                <span className={`cal-status-badge cal-status-badge--${status}`}>
                  {status === 'cancelled' && 'Cancelled'}
                  {status === 'current' && 'This Week'}
                  {status === 'completed' && (raceResult?.hasResults
                    ? `P${raceResult.result.position}`
                    : 'TBD')}
                  {status === 'soon' && 'Soon'}
                  {status === 'upcoming' && 'Upcoming'}
                </span>
              </div>
              <div className="cal-card-body">
                <div className="cal-card-info">
                  <h3 className="cal-race-name">{race.raceName}</h3>
                  <p className="cal-circuit-name">
                    {race.country} · {race.circuit}
                  </p>
                  <p className="cal-date">{formatDate(race.date)}</p>
                </div>
                <div className="cal-card-map">
                  <CircuitMap circuit={race.circuit} size={90} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
