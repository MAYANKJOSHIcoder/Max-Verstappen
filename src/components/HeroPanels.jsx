import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useOpenF1, fmtLapTime } from '../hooks/useOpenF1';
import Countdown from './Countdown';
import LiveDot from './LiveDot';
import useRaceWeekend from '../hooks/useRaceWeekend';
import './HeroPanels.css';

const HeroPanels = () => {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const noAnim = reduced ? { initial: false } : {};

  const { status, isLive, driver, lap } = useOpenF1({ season: 2026, driverNumber: 1 });
  const { currentRace, nextRace } = useRaceWeekend();

  return (
    <motion.div
      className="hero-panels container"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      {...noAnim}
    >
      <div
        className="hp-card hp-card--telem"
        onClick={() => navigate('/telemetry')}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/telemetry')}
        role="button"
        tabIndex={0}
        aria-label="Live Telemetry"
      >
        <div className="hp-card-body">
          <div className="hp-card-left">
            <span className="eyebrow">Live Timing</span>
            <h3 className="hp-card-title">See Live Race</h3>
          </div>
          <div className="hp-card-right">
            {status === 'live' && isLive ? (
              <div className="hp-telem-live">
                <LiveDot />
                <span className="hp-telem-pos">P{driver?.position || '—'}</span>
                {lap?.lap_duration && (
                  <span className="hp-telem-laptime">{fmtLapTime(lap.lap_duration)}</span>
                )}
              </div>
            ) : currentRace ? (
              <div className="hp-telem-next">
                <span className="hp-telem-next-label">This Week:</span>
                <span className="hp-telem-next-name">{currentRace.raceName}</span>
                <span className="hp-telem-next-circuit">{currentRace.circuit}</span>
                <div className="hp-countdown"><Countdown date={currentRace.date} /></div>
              </div>
            ) : nextRace ? (
              <div className="hp-telem-next">
                <span className="hp-telem-next-label">Next:</span>
                <span className="hp-telem-next-name">{nextRace.raceName}</span>
                <span className="hp-telem-next-circuit">{nextRace.circuit}</span>
                <div className="hp-countdown"><Countdown date={nextRace.date} /></div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className="hp-card hp-card--cal"
        onClick={() => navigate('/calendar')}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/calendar')}
        role="button"
        tabIndex={0}
        aria-label="2026 Calendar"
      >
        <div className="hp-card-body">
          <div className="hp-card-left">
            <span className="eyebrow">2026 Season</span>
            <h3 className="hp-card-title">Calendar</h3>
          </div>
          <div className="hp-card-right">
            <div className="hp-cal-info">
              <span className="hp-cal-next-label">Next Race</span>
              <span className="hp-cal-next-name">{(nextRace || currentRace)?.raceName || '—'}</span>
              {(nextRace || currentRace) && <div className="hp-countdown"><Countdown date={(nextRace || currentRace).date} /></div>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroPanels;
