import { useState, useEffect } from 'react';
import calendarData from '../data/calendar2026.json';

const findNextRace = (currentRace) => {
  if (currentRace) {
    return (
      calendarData
        .filter((r) => !r.isCancelled && r.round > currentRace.round)
        .sort((a, b) => a.round - b.round)[0] || null
    );
  }

  const now = new Date();
  return (
    calendarData
      .filter((r) => {
        if (r.isCancelled) return false;
        const firstSession = r.sessions[0];
        if (!firstSession) return false;
        return new Date(firstSession.date) > now;
      })
      .sort((a, b) => a.round - b.round)[0] || null
  );
};

const computeRaceWeekend = () => {
  const now = new Date();

  for (const race of calendarData) {
    if (race.isCancelled) continue;
    const firstSession = race.sessions[0];
    if (!firstSession) continue;

    const windowStart = new Date(firstSession.date);
    const raceDate = new Date(race.date);
    const windowEnd = new Date(raceDate);
    windowEnd.setDate(windowEnd.getDate() + 1);
    windowEnd.setUTCHours(0, 0, 0, 0);

    if (now >= windowStart && now < windowEnd) {
      return {
        currentRace: race,
        nextRace: findNextRace(race),
      };
    }
  }

  return {
    currentRace: null,
    nextRace: findNextRace(null),
  };
};

const useRaceWeekend = () => {
  const [raceWeekend, setRaceWeekend] = useState(computeRaceWeekend);

  useEffect(() => {
    const id = setInterval(() => {
      setRaceWeekend(computeRaceWeekend());
    }, 60000);
    return () => clearInterval(id);
  }, []);

  return raceWeekend;
};

export default useRaceWeekend;
