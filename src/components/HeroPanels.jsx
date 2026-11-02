import { useNavigate } from 'react-router-dom';
import Countdown from './Countdown';
import useRaceWeekend from '../hooks/useRaceWeekend';
import FadeIn from './FadeIn';
import './HeroPanels.css';

const HeroPanels = () => {
  const navigate = useNavigate();

  const { currentRace, nextRace } = useRaceWeekend();

  return (
    <FadeIn
      y={24}
      duration={0.7}
      delay={0.7}
      className="hero-panels container"
    >
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
    </FadeIn>
  );
};

export default HeroPanels;
