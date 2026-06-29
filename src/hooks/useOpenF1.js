import { useState, useEffect, useRef, useCallback } from 'react';

const OPENF1 = 'https://api.openf1.org/v1';

const fmtLapTime = (seconds) => {
  if (seconds == null) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
};

const fmtGap = (seconds) => {
  if (seconds == null) return '—';
  if (seconds <= 0) return 'LEADER';
  return `+${seconds.toFixed(3)}s`;
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

const findCurrentSession = (sessions) => {
  const now = new Date();
  const liveWindow = 30 * 60 * 1000; // 30 minutes

  // Check for a session currently in its live window
  for (const s of sessions) {
    const start = new Date(s.date_start);
    const end = new Date(s.date_end);
    if (now >= new Date(start.getTime() - liveWindow) && now <= new Date(end.getTime() + liveWindow)) {
      return { session: s, isLive: true };
    }
  }

  // Otherwise find the next upcoming session
  const upcoming = sessions
    .filter((s) => new Date(s.date_start) > now)
    .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));

  if (upcoming.length > 0) {
    return { session: upcoming[0], isLive: false };
  }

  // Fallback: most recent completed session
  const completed = sessions
    .filter((s) => new Date(s.date_end) < now)
    .sort((a, b) => new Date(b.date_end) - new Date(a.date_end));

  if (completed.length > 0) {
    return { session: completed[0], isLive: false };
  }

  return { session: null, isLive: false };
};

const binarySearchPosition = (positions, targetDate) => {
  let lo = 0;
  let hi = positions.length - 1;
  let result = null;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const midDate = new Date(positions[mid].date);
    if (midDate <= targetDate) {
      result = positions[mid].position;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result;
};

const fetchJSON = async (url, signal) => {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const useOpenF1 = ({ season = 2026, driverNumber = 1, pollMs = 4000 } = {}) => {
  const [state, setState] = useState({
    status: 'loading', // 'loading' | 'live' | 'no-session' | 'error'
    session: null,
    isLive: false,
    driver: null,
    lap: null,
    laps: [],
    gaps: null,
    sectors: null,
    speeds: null,
    tires: null,
    weather: null,
    pits: [],
    positionTimeline: [],
    nextSession: null,
    error: null,
  });

  const intervalRef = useRef(null);
  const abortRef = useRef(null);
  const lastPollRef = useRef(0);

  // Fetch sessions list (once on mount)
  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const loadSessions = async () => {
      try {
        const sessions = await fetchJSON(
          `${OPENF1}/sessions?year=${season}&session_name=Race`,
          ctrl.signal,
        );

        const { session, isLive } = findCurrentSession(sessions);

        if (!session) {
          setState((s) => ({ ...s, status: 'no-session', session: null }));
          return;
        }

        setState((s) => ({
          ...s,
          session,
          isLive,
          nextSession: !isLive ? session : null,
          status: isLive ? 'loading' : 'no-session',
        }));

        // If not live, don't start polling
        if (!isLive) return;

        // Fetch initial data
        await pollData(session.session_key, driverNumber);

        // Start polling
        intervalRef.current = setInterval(() => {
          pollData(session.session_key, driverNumber);
        }, pollMs);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setState((s) => ({ ...s, status: 'error', error: err.message }));
        }
      }
    };

    loadSessions();

    return () => {
      ctrl.abort();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [season, driverNumber, pollMs]);

  // Poll data from all endpoints
  const pollData = useCallback(
    async (sessionKey, driverNum) => {
      // Rate-limit guard: ensure at least 350ms between poll batches
      const now = Date.now();
      const elapsed = now - lastPollRef.current;
      if (elapsed < 350) {
        await new Promise((r) => setTimeout(r, 350 - elapsed));
      }
      lastPollRef.current = Date.now();

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const baseUrl = `${OPENF1}?session_key=${sessionKey}&driver_number=${driverNum}`;

      try {
        const [laps, positions, intervals, carData, weather, pits] = await Promise.all([
          fetchJSON(`${baseUrl}&lap_number>=0`, ctrl.signal),
          fetchJSON(`${baseUrl}`, ctrl.signal),
          fetchJSON(`${baseUrl}`, ctrl.signal),
          fetchJSON(`${baseUrl}`, ctrl.signal),
          fetchJSON(`${baseUrl}`, ctrl.signal),
          fetchJSON(`${baseUrl}`, ctrl.signal),
        ]);

        // Sort laps by lap_number
        const sortedLaps = [...laps].sort((a, b) => a.lap_number - b.lap_number);
        const latestLap = sortedLaps[sortedLaps.length - 1] || null;

        // Best lap (min lap_duration, excluding pit out laps)
        const validLaps = sortedLaps.filter((l) => l.lap_duration && !l.is_pit_out_lap);
        const bestLap = validLaps.reduce(
          (best, l) => (!best || l.lap_duration < best.lap_duration ? l : best),
          null,
        );

        // Latest position
        const sortedPositions = [...positions].sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
        const latestPosition = sortedPositions[sortedPositions.length - 1] || null;

        // Latest intervals
        const sortedIntervals = [...intervals].sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
        const latestInterval = sortedIntervals[sortedIntervals.length - 1] || null;

        // Latest car data
        const sortedCar = [...carData].sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
        const latestCar = sortedCar[sortedCar.length - 1] || null;

        // Latest weather
        const sortedWeather = [...weather].sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        );
        const latestWeather = sortedWeather[sortedWeather.length - 1] || null;

        // Pit stops for this driver
        const driverPits = pits
          .filter((p) => p.driver_number === driverNum)
          .sort((a, b) => a.lap_number - b.lap_number);

        // Build position timeline: map each lap's start time to a position
        const timeline = [];
        if (sortedLaps.length > 0 && sortedPositions.length > 0) {
          for (const lap of sortedLaps) {
            if (!lap.date_start) continue;
            const lapStart = new Date(lap.date_start);
            const pos = binarySearchPosition(sortedPositions, lapStart);
            if (pos != null) {
              timeline.push({ lap: lap.lap_number, position: pos });
            }
          }
        }

        // Compute gap to behind (from next driver's gap_to_leader)
        let gapBehind = null;
        if (latestInterval && latestInterval.gap_to_leader != null) {
          // We need the next driver's gap — fetch all intervals for this session
          // This is a best-effort approximation
          try {
            const allIntervalsCtrl = new AbortController();
            const allIntervals = await fetchJSON(
              `${OPENF1}/intervals?session_key=${sessionKey}&date>=${latestInterval.date}`,
              allIntervalsCtrl.signal,
            );
            const nextDriverGap = allIntervals
              .filter((i) => i.driver_number !== driverNum && i.gap_to_leader != null)
              .sort((a, b) => a.gap_to_leader - b.gap_to_leader)[0];
            if (nextDriverGap) {
              gapBehind = nextDriverGap.gap_to_leader - latestInterval.gap_to_leader;
            }
            allIntervalsCtrl.abort();
          } catch {
            // Silently skip gap-behind if this extra fetch fails
          }
        }

        // Tire info
        const tires = latestLap
          ? {
              compound: latestLap.compound,
              color: compoundColor(latestLap.compound),
              age: driverPits.length > 0
                ? latestLap.lap_number - driverPits[driverPits.length - 1].lap_number
                : latestLap.lap_number,
              stint: driverPits.length + 1,
            }
          : null;

        // Sectors with PB/best coding
        const sectors = latestLap
          ? {
              s1: latestLap.duration_sector_1,
              s2: latestLap.duration_sector_2,
              s3: latestLap.duration_sector_3,
              bestS1: validLaps.reduce((m, l) => Math.min(m, l.duration_sector_1 || Infinity), Infinity),
              bestS2: validLaps.reduce((m, l) => Math.min(m, l.duration_sector_2 || Infinity), Infinity),
              bestS3: validLaps.reduce((m, l) => Math.min(m, l.duration_sector_3 || Infinity), Infinity),
            }
          : null;

        // Speeds
        const speeds = latestLap
          ? {
              i1: latestLap.i1_speed,
              i2: latestLap.i2_speed,
              st: latestLap.st_speed,
            }
          : null;

        setState((s) => ({
          ...s,
          status: 'live',
          isLive: true,
          driver: latestPosition,
          lap: latestLap,
          laps: sortedLaps,
          gaps: latestInterval
            ? {
                gapToLeader: latestInterval.gap_to_leader,
                gapToAhead: latestInterval.interval,
                gapBehind,
              }
            : null,
          sectors,
          speeds,
          tires,
          weather: latestWeather,
          pits: driverPits,
          positionTimeline: timeline,
          error: null,
        }));
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Don't flip to error on transient failures during polling
          console.warn('OpenF1 poll failed:', err.message);
        }
      }
    },
    [],
  );

  // Manual refresh
  const refresh = useCallback(() => {
    if (state.session) {
      pollData(state.session.session_key, driverNumber);
    }
  }, [state.session, driverNumber, pollData]);

  return { ...state, refresh };
};

export { fmtLapTime, fmtGap, compoundColor };
