import { useState, useEffect, useRef, useCallback } from 'react';
const compoundColor = (compound) => {
  const map = { SOFT: '#FF3333', MEDIUM: '#FFD700', HARD: '#F0F0F0', INTER: '#3EB83E', WET: '#3399FF' };
  return map[compound] || '#888888';
};

const OPENF1 = 'https://max-verstappen-backend.onrender.com/v1';

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

const findCurrentSession = (sessions) => {
  const now = new Date();
  const liveWindow = 30 * 60 * 1000;

  for (const s of sessions) {
    const start = new Date(s.date_start);
    const end = new Date(s.date_end);
    if (now >= new Date(start.getTime() - liveWindow) && now <= new Date(end.getTime() + liveWindow)) {
      return { session: s, isLive: true };
    }
  }

  const upcoming = sessions
    .filter((s) => new Date(s.date_start) > now)
    .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));

  if (upcoming.length > 0) {
    return { session: upcoming[0], isLive: false };
  }

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

/**
 * Rate-limit-aware fetch. On 429, pauses for Retry-After seconds (or 10s
 * default) and retries once. All other HTTP errors throw immediately.
 */
const fetchJSON = async (url, signal, retryOnce = true) => {
  const res = await fetch(url, { signal });

  if (res.status === 429 && retryOnce) {
    const retryAfter = parseInt(res.headers.get('Retry-After'), 10);
    const waitMs = (Number.isFinite(retryAfter) ? retryAfter : 10) * 1000;
    console.warn(`OpenF1 429 — backing off ${waitMs}ms`);
    await new Promise((r) => setTimeout(r, waitMs));
    // Retry exactly once
    return fetchJSON(url, signal, false);
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const useOpenF1 = ({ season = 2026, driverNumber = 1 } = {}) => {
  // 1 req/tick, 12 ticks/min, never more than 1 req/sec
  const SCHEDULER_INTERVAL_MS = 5000;
  // Tab hidden → 1 req/60s to save quota
  const HIDDEN_INTERVAL_MS = 60_000;
  const PRIMING_INTERVAL_MS = 1000;
  const RING_BUFFER_MAX = 500;
  const RE_RESOLVE_MS = 30 * 60 * 1000;
  const EMPTY_STOP_THRESHOLD = 3;
  const ERROR_STOP_THRESHOLD = 5;
  const SESSION_LIVE_WINDOW_MS = 30 * 60 * 1000;
  // Prevent burst stacking from visibility events + manual refresh + slot ticks
  const MIN_REQUEST_GAP_MS = 200;

  // 12 slots per 60s cycle. Each tick fires EXACTLY ONE request — never a
  // Promise.all bundle. car_data × 6 | intervals × 2 | laps/position/weather/pit × 1.
  const SLOTS = [
    'car_data',
    'car_data',
    'intervals',
    'car_data',
    'position',
    'car_data',
    'laps',
    'car_data',
    'weather',
    'intervals',
    'car_data',
    'pit',
  ];
  const SLOT_COUNT = SLOTS.length;

  const [state, setState] = useState({
    status: 'loading',
    session: null,
    isLive: false,
    lastUpdate: null,
    driver: null,
    positionTimeline: [],
    gaps: null,
    lap: null,
    laps: [],
    sectors: null,
    tires: null,
    carTelemetry: null,
    weather: null,
    nextSession: null,
    error: null,
  });

  const intervalRef = useRef(null);
  const abortRef = useRef(null);
  const slotRef = useRef(0);
  const emptyStreakRef = useRef(0);
  const errorStreakRef = useRef(0);
  const sessionKeyRef = useRef(null);
  const lastCarDataCursorRef = useRef(null);
  const bufferRef = useRef([]);
  const sortedPositionsRef = useRef([]);
  const sortedLapsRef = useRef([]);
  const lastRequestTimeRef = useRef(0);
  // Mirror state for callbacks outside the React render cycle so
  // schedulerTick reads latest without forcing useCallback re-creation.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // URL builders — read sessionKeyRef instead of function args so they
  // always resolve to the current live session's key.
  const base = (endpoint) =>
    `${OPENF1}/${endpoint}?session_key=${sessionKeyRef.current}&driver_number=${driverNumber}`;
  const sessionBase = (endpoint) =>
    `${OPENF1}/${endpoint}?session_key=${sessionKeyRef.current}`;
  const carDataUrl = () =>
    lastCarDataCursorRef.current
      ? `${base('car_data')}&date>=${encodeURIComponent(lastCarDataCursorRef.current)}`
      : `${base('car_data')}`;

  // --- Per-slot fetchers --------------------------------------------------
  const fetchCarData = useCallback(
    async (signal) => {
      const data = await fetchJSON(carDataUrl(), signal);
      if (!data.length) return null;
      const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
      const latest = sorted[sorted.length - 1];
      lastCarDataCursorRef.current = latest.date;
      bufferRef.current = [...bufferRef.current, ...sorted].slice(-RING_BUFFER_MAX);
      return {
        carTelemetry: {
          speed: latest.speed,
          rpm: latest.rpm,
          n_gear: latest.n_gear,
          drs: latest.drs,
          throttle: latest.throttle,
          brake: latest.brake,
          date: latest.date,
        },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const fetchIntervals = useCallback(
    async (signal) => {
      const data = await fetchJSON(base('intervals'), signal);
      if (!data.length) return null;
      const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
      const latest = sorted[sorted.length - 1];
      if (latest?.gap_to_leader == null) return { gaps: null };
      return {
        gaps: {
          gapToLeader: latest.gap_to_leader,
          gapToAhead: latest.interval,
          gapBehind: null,
        },
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const fetchLaps = useCallback(
    async (signal) => {
      const data = await fetchJSON(`${base('laps')}`, signal);
      if (!data.length) return null;
      const sorted = [...data].sort((a, b) => a.lap_number - b.lap_number);
      const latestLap = sorted[sorted.length - 1];
      const validLaps = sorted.filter((l) => l.lap_duration && !l.is_pit_out_lap);
      const bestLap = validLaps.reduce(
        (best, l) => (!best || l.lap_duration < best.lap_duration ? l : best),
        null,
      );
      return {
        lap: latestLap,
        laps: sorted,
        tires: latestLap
          ? {
              compound: latestLap.compound,
              color: compoundColor(latestLap.compound),
              age:
                latestLap.tyre_age_at_start != null
                  ? latestLap.tyre_age_at_start
                  : latestLap.lap_number,
              stint: 1,
            }
          : null,
        sectors: latestLap
          ? {
              s1: latestLap.duration_sector_1,
              s2: latestLap.duration_sector_2,
              s3: latestLap.duration_sector_3,
              bestS1: validLaps.reduce(
                (m, l) => Math.min(m, l.duration_sector_1 || Infinity),
                Infinity,
              ),
              bestS2: validLaps.reduce(
                (m, l) => Math.min(m, l.duration_sector_2 || Infinity),
                Infinity,
              ),
              bestS3: validLaps.reduce(
                (m, l) => Math.min(m, l.duration_sector_3 || Infinity),
                Infinity,
              ),
              segmentsS1: latestLap.segments_sector_1,
              segmentsS2: latestLap.segments_sector_2,
              segmentsS3: latestLap.segments_sector_3,
            }
          : null,
        bestLap,
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const fetchPosition = useCallback(
    async (signal) => {
      const data = await fetchJSON(base('position'), signal);
      if (!data.length) return null;
      const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
      const latest = sorted[sorted.length - 1];
      return { driver: latest };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const fetchWeather = useCallback(
    async (signal) => {
      const data = await fetchJSON(sessionBase('weather'), signal);
      if (!data.length) return null;
      const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
      return { weather: sorted[sorted.length - 1] };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const fetchPit = useCallback(
    async (signal) => {
      const data = await fetchJSON(sessionBase('pit'), signal);
      if (!Array.isArray(data) || !data.length) return null;
      const driverPits = data
        .filter((p) => p.driver_number === driverNumber)
        .sort((a, b) => a.lap_number - b.lap_number);
      return { pits: driverPits };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [driverNumber],
  );

  const FETCHERS = {
    car_data: fetchCarData,
    intervals: fetchIntervals,
    laps: fetchLaps,
    position: fetchPosition,
    weather: fetchWeather,
    pit: fetchPit,
  };

  // --- Scheduler lifecycle ------------------------------------------------
  // Use a ref for schedulerTick inside setInterval so startScheduler always
  // calls the latest version without a stale closure.
  const schedulerTickRef = useRef(null);

  const stopScheduler = useCallback((nextStatus = null) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    abortRef.current?.abort();
    if (nextStatus) setState((s) => ({ ...s, status: nextStatus }));
  }, []);

  const isSessionOver = useCallback(
    (session) =>
      !!session?.date_end &&
      Date.now() > new Date(session.date_end).getTime() + SESSION_LIVE_WINDOW_MS,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [SESSION_LIVE_WINDOW_MS],
  );

  // Fires EXACTLY ONE request per tick. Never a Promise.all bundle.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const schedulerTick = useCallback(async () => {
    const live = stateRef.current;

    if (isSessionOver(live.session)) {
      stopScheduler('no-session');
      return;
    }

    const now = Date.now();
    if (now - lastRequestTimeRef.current < MIN_REQUEST_GAP_MS) {
      return;
    }
    lastRequestTimeRef.current = now;

    // Cancel in-flight request before dispatching the next one
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const endpoint = SLOTS[slotRef.current];
    slotRef.current = (slotRef.current + 1) % SLOT_COUNT;

    let slice = null;
    try {
      slice = await FETCHERS[endpoint]?.(ctrl.signal);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('OpenF1 slot failed:', err.message);
        errorStreakRef.current += 1;
        if (errorStreakRef.current >= ERROR_STOP_THRESHOLD) {
          setState((s) => ({ ...s, status: 'error', error: 'Failed to fetch live data' }));
        }
      }
      return;
    }

    errorStreakRef.current = 0;

    if (!slice || Object.keys(slice).length === 0) {
      emptyStreakRef.current += 1;
      if (emptyStreakRef.current >= EMPTY_STOP_THRESHOLD) stopScheduler('no-session');
      return;
    }
    emptyStreakRef.current = 0;

    // Position timeline re-derivation
    let positionTimeline = null;
    if (endpoint === 'position' || endpoint === 'laps') {
      if (endpoint === 'position' && slice.driver) {
        sortedPositionsRef.current = [...sortedPositionsRef.current, slice.driver].slice(-500);
      }
      if (endpoint === 'laps' && slice.laps) {
        sortedLapsRef.current = slice.laps;
      }
      const laps = sortedLapsRef.current;
      const positions = sortedPositionsRef.current;
      if (laps.length && positions.length) {
        const timeline = [];
        for (const lap of laps) {
          if (!lap.date_start) continue;
          const pos = binarySearchPosition(positions, new Date(lap.date_start));
          if (pos != null) timeline.push({ lap: lap.lap_number, position: pos });
        }
        positionTimeline = timeline;
      }
    }

    setState((s) => ({
      ...s,
      ...slice,
      ...(positionTimeline ? { positionTimeline } : {}),
      status: 'live',
      isLive: true,
      lastUpdate: Date.now(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionOver, stopScheduler]);

  schedulerTickRef.current = schedulerTick;

  const startScheduler = useCallback((intervalMs) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => schedulerTickRef.current?.(), intervalMs);
  }, []);

  // --- Startup priming burst ----------------------------------------------
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const runPrimingBurst = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const order = [
      { endpoint: 'car_data', fetcher: fetchCarData },
      { endpoint: 'laps', fetcher: fetchLaps },
      { endpoint: 'intervals', fetcher: fetchIntervals },
      { endpoint: 'position', fetcher: fetchPosition },
    ];
    let hasErrors = false;
    for (const { fetcher } of order) {
      try {
        lastRequestTimeRef.current = Date.now();
        const slice = await fetcher(ctrl.signal);
        if (slice) {
          setState((s) => ({ ...s, ...slice, status: 'live', isLive: true, lastUpdate: Date.now() }));
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('priming failed:', err.message);
          hasErrors = true;
        }
      }
      await new Promise((r) => setTimeout(r, PRIMING_INTERVAL_MS));
    }

    // Show error only if actual HTTP errors occurred (empty data is valid)
    if (hasErrors) {
      setState((s) => {
        if (s.status === 'loading') {
          return { ...s, status: 'error', error: 'Failed to load live data' };
        }
        return s;
      });
    }
  }, [fetchCarData, fetchLaps, fetchIntervals, fetchPosition]);

  const applyVisibilityInterval = useCallback(() => {
    const ms = document.visibilityState === 'hidden' ? HIDDEN_INTERVAL_MS : SCHEDULER_INTERVAL_MS;
    if (!intervalRef.current) return;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => schedulerTickRef.current?.(), ms);
  }, []);

  // --- Fetch sessions (mount) ---------------------------------------------
  // Fetch ALL session types so the telemetry page can show FP, Qualifying,
  // Sprint, and Race sessions.
  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const loadSessions = async () => {
      try {
        const sessions = await fetchJSON(
          `${OPENF1}/sessions?year=${season}`,
          ctrl.signal,
        );
        const { session, isLive } = findCurrentSession(sessions);

        if (!session) {
          const raceSessions = sessions.filter((s) => s.session_name === 'Race');
          const nextRace = raceSessions
            .filter((s) => new Date(s.date_start) > new Date())
            .sort((a, b) => new Date(a.date_start) - new Date(b.date_start))[0];

          setState((s) => ({
            ...s,
            status: 'no-session',
            session: null,
            nextSession: nextRace || null,
          }));
          return;
        }

        sessionKeyRef.current = session.session_key;
        lastCarDataCursorRef.current = null;
        bufferRef.current = [];
        emptyStreakRef.current = 0;
        slotRef.current = 0;

        setState((s) => ({
          ...s,
          session,
          isLive,
          nextSession: !isLive ? session : null,
          status: isLive ? 'loading' : 'no-session',
        }));

        if (!isLive) return;

        await runPrimingBurst();
        const startMs =
          document.visibilityState === 'hidden' ? HIDDEN_INTERVAL_MS : SCHEDULER_INTERVAL_MS;
        startScheduler(startMs);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setState((s) => ({ ...s, status: 'error', error: err.message }));
        }
      }
    };

    loadSessions();

    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') schedulerTickRef.current?.();
      applyVisibilityInterval();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      ctrl.abort();
      stopScheduler();
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, driverNumber]);

  // --- Session re-resolve (every 30 minutes) ------------------------------
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const sessions = await fetchJSON(
          `${OPENF1}/sessions?year=${season}`,
        );
        const { session, isLive } = findCurrentSession(sessions);
        const newKey = session?.session_key;
        if (newKey && newKey !== sessionKeyRef.current) {
          // Rollover to a new session — clear telemetry cache and restart
          sessionKeyRef.current = newKey;
          lastCarDataCursorRef.current = null;
          bufferRef.current = [];
          slotRef.current = 0;
          emptyStreakRef.current = 0;
          setState((s) => ({
            ...s,
            session,
            isLive,
            status: isLive ? 'loading' : 'no-session',
            carTelemetry: isLive ? null : s.carTelemetry,
            laps: isLive ? [] : s.laps,
            lap: isLive ? null : s.lap,
            gaps: isLive ? null : s.gaps,
            tires: isLive ? null : s.tires,
            sectors: isLive ? null : s.sectors,
            weather: isLive ? null : s.weather,
            driver: isLive ? null : s.driver,
            positionTimeline: isLive ? [] : s.positionTimeline,
          }));
          if (isLive) {
            stopScheduler();
            await runPrimingBurst();
            startScheduler(
              document.visibilityState === 'hidden' ? HIDDEN_INTERVAL_MS : SCHEDULER_INTERVAL_MS,
            );
          } else {
            stopScheduler('no-session');
          }
        }
      } catch {
        /* transient; retry in 30 min */
      }
    }, RE_RESOLVE_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, stopScheduler, runPrimingBurst, startScheduler]);

  const refresh = useCallback(() => {
    if (!state.session || !sessionKeyRef.current) return;

    const now = Date.now();
    if (now - lastRequestTimeRef.current < MIN_REQUEST_GAP_MS) return;
    lastRequestTimeRef.current = now;

    const lastEndpoint = SLOTS[(slotRef.current - 1 + SLOT_COUNT) % SLOT_COUNT];
    let cancelled = false;
    const ctrl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctrl;
    FETCHERS[lastEndpoint]?.(ctrl.signal)
      .then((slice) => {
        if (cancelled) return;
        if (slice) {
          setState((s) => ({ ...s, ...slice, status: 'live', lastUpdate: Date.now() }));
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.warn('refresh slot failed:', err.message);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.session]);

  return {
    ...state,
    refresh,
  };
};

export { fmtLapTime, fmtGap };
