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
  // --- Polling scheduler constants ---------------------------------------
  // One request per 5s tick. 12 ticks/min = 12 req/min (well under 30/min),
  // and never more than 1 req initiated in any one-second window.
  const SCHEDULER_INTERVAL_MS = 5000;
  // When the tab is hidden, slow to one request per 60s — saves quota and
  // laptop battery while the fan is tabbed out.
  const HIDDEN_INTERVAL_MS = 60_000;
  // Startup priming burst fires one request per second (under the 3/s limit).
  const PRIMING_INTERVAL_MS = 1000;
  const RING_BUFFER_MAX = 500; // car_data memory bound (samples, not lap history)
  const RE_RESOLVE_MS = 30 * 60 * 1000; // session re-discovery cadence
  const EMPTY_STOP_THRESHOLD = 3; // consecutive empty polls before we give up
  const SESSION_LIVE_WINDOW_MS = 30 * 60 * 1000; // grace window past date_end
  // Minimum inter-request gap to prevent burst stacking from visibility
  // events + manual refresh + slot ticks landing in the same ms window.
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
  const SLOT_COUNT = SLOTS.length; // 12

  // --- Per-slice state ----------------------------------------------------
  // Each slot commits only its owned slice keys via the reducer pattern
  // `setState(s => ({ ...s, ...slice }))`. Cross-slice reads happen in the
  // render layer, never during an update, so a stale slice is never zeroed.
  const [state, setState] = useState({
    status: 'loading', // 'loading' | 'live' | 'no-session' | 'error'
    session: null,
    isLive: false,
    lastUpdate: null, // ms timestamp; UI drives the live-dot pulse from this
    // Owned by `position` slot
    driver: null, // latest position record { position, date }
    positionTimeline: [], // [{lap, position}] — re-derived on each position slot
    // Owned by `intervals` slot
    gaps: null, // { gapToLeader, gapToAhead, gapBehind }
    // Owned by `laps` slot
    lap: null,
    laps: [],
    sectors: null, // { s1, s2, s3, bestS1, bestS2, bestS3, segments? }
    speeds: null, // { i1, i2, st } speed traps (from latest lap)
    tires: null, // { compound, color, age, stint }
    // Owned by `car_data` slot
    carTelemetry: null, // { speed, rpm, n_gear, drs, throttle, brake, date }
    carDataBuffer: [], // ring buffer (max 500) of recent samples for graphs
    // Owned by `pit` slot
    pits: [],
    // Owned by `weather` slot
    weather: null,
    nextSession: null,
    error: null,
  });

  // --- Refs (stable across renders) --------------------------------------
  const intervalRef = useRef(null); // setInterval handle for the scheduler
  const abortRef = useRef(null); // active request AbortController (one per slot tick)
  const slotRef = useRef(0); // current slot index advancing 0..SLOT_COUNT-1
  const emptyStreakRef = useRef(0); // consecutive empty responses since last good one
  const sessionKeyRef = useRef(null); // current session_key (detects rollover)
  const lastCarDataCursorRef = useRef(null); // ISO date cursor for incremental car_data
  const bufferRef = useRef([]); // ring buffer backing state.carDataBuffer
  const sortedPositionsRef = useRef([]); // position history for timeline re-derivation
  const sortedLapsRef = useRef([]); // latest laps for timeline re-derivation
  const lastRequestTimeRef = useRef(0); // timestamp of last dispatched request
  // Cross-tab dedup (Part 2)
  const channelRef = useRef(null); // BroadcastChannel('openf1-telemetry')
  const isLeaderRef = useRef(false);
  const tabIdRef = useRef(Math.random().toString(36).slice(2));
  const _heartbeatRef = useRef(null); // follower: heartbeat miss counter (Part 2)
  const stateRef = useRef(state); // mirror of `state` for callbacks that run
  // outside the React render cycle (schedulerTick reads latest without
  // forcing useCallback to re-create on every state change).
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // --- URL builders (stable within a polling lifecycle) -------------------
  // These read sessionKeyRef/sessionNumRef instead of function args because
  // they're called without arguments from the scheduler — each `base(path)`
  // resolves to the current live session's key.
  const base = (endpoint) =>
    `${OPENF1}/${endpoint}?session_key=${sessionKeyRef.current}&driver_number=${driverNumber}`;
  const sessionBase = (endpoint) =>
    `${OPENF1}/${endpoint}?session_key=${sessionKeyRef.current}`;
  const carDataUrl = () =>
    lastCarDataCursorRef.current
      ? `${base('car_data')}&date>=${encodeURIComponent(lastCarDataCursorRef.current)}`
      : `${base('car_data')}`; // first pull: full history, then cursor takes over

  // --- Per-slot fetchers --------------------------------------------------
  // Each returns ONLY the state slice keys its slot owns. Cross-slice reads
  // (e.g. tire stint needs `pits`) live in the render layer, never here.
  const fetchCarData = useCallback(
    async (signal) => {
      const data = await fetchJSON(carDataUrl(), signal);
      if (!data.length) return null;
      const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
      const latest = sorted[sorted.length - 1];
      // advance the incremental cursor
      lastCarDataCursorRef.current = latest.date;
      // append to the ring buffer, capping at RING_BUFFER_MAX
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
        carDataBuffer: bufferRef.current,
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
              stint: 1, // refined in render from `pits[]`
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
        speeds: latestLap
          ? { i1: latestLap.i1_speed, i2: latestLap.i2_speed, st: latestLap.st_speed }
          : null,
        // Best-lap times are exposed for render convenience
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

  // --- BroadcastChannel cross-tab dedup -----------------------------------
  // Defined here and wired for real in Part 2. Part 1 leaves them as safe
  // no-ops so the hook compiles and runs without any multi-tab behavior.
  const initChannel = useCallback(() => {
    // Part 2 will implement leader election, heartbeat, slice-broadcast, and
    // follower apply logic on BroadcastChannel('openf1-telemetry').
  }, []);

  const teardownChannel = useCallback(() => {
    if (!channelRef.current) return;
    try {
      channelRef.current.close();
    } catch {
      /* channel may already be closed by the browser */
    }
    channelRef.current = null;
    isLeaderRef.current = false;
  }, []);

  // --- Scheduler lifecycle ------------------------------------------------
  // Declaration order matters: stopScheduler → isSessionOver → schedulerTick
  // → startScheduler. We use a ref for schedulerTick inside setInterval so
  // startScheduler always calls the latest version without a stale closure.
  const schedulerTickRef = useRef(null);

  const stopScheduler = useCallback((nextStatus = null) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    abortRef.current?.abort();
    if (nextStatus) setState((s) => ({ ...s, status: nextStatus }));
  }, []);

  // --- Stop conditions ----------------------------------------------------
  // `date_end` has passed by >30m → the session is over, give up.
  const isSessionOver = useCallback(
    (session) =>
      !!session?.date_end &&
      Date.now() > new Date(session.date_end).getTime() + SESSION_LIVE_WINDOW_MS,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [SESSION_LIVE_WINDOW_MS],
  );

  // --- The slot tick ------------------------------------------------------
  // Fires EXACTLY ONE request per tick. Never a Promise.all bundle. Reads live
  // state via `stateRef` so the callback stays referentially stable across renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const schedulerTick = useCallback(async () => {
    const live = stateRef.current;
    // Date-based stop condition
    if (isSessionOver(live.session)) {
      stopScheduler('no-session');
      return;
    }

    // Rate-limit guard: ensure minimum gap between requests
    const now = Date.now();
    if (now - lastRequestTimeRef.current < MIN_REQUEST_GAP_MS) {
      return; // skip this tick — too close to a previous request
    }
    lastRequestTimeRef.current = now;

    // Cancel any in-flight request before dispatching the next one — this
    // also fixes the old abortRef-overwrite leak.
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const endpoint = SLOTS[slotRef.current];
    slotRef.current = (slotRef.current + 1) % SLOT_COUNT;

    let slice = null;
    try {
      slice = await FETCHERS[endpoint]?.(ctrl.signal);
    } catch (err) {
      if (err.name !== 'AbortError') console.warn('OpenF1 slot failed:', err.message);
      return; // leave state as-is; next tick retries
    }

    // Empty-response streak → stop condition
    if (!slice || Object.keys(slice).length === 0) {
      emptyStreakRef.current += 1;
      if (emptyStreakRef.current >= EMPTY_STOP_THRESHOLD) stopScheduler('no-session');
      return;
    }
    emptyStreakRef.current = 0;

    // Position timeline re-derivation.
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

  // Keep schedulerTickRef in sync so setInterval always calls the latest fn
  schedulerTickRef.current = schedulerTick;

  const startScheduler = useCallback((intervalMs) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => schedulerTickRef.current?.(), intervalMs);
  }, []);

  // --- Startup priming burst ----------------------------------------------
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const runPrimingBurst = useCallback(async () => {
    // Skip priming if not the leader (follower tabs will apply leader's
    // priming slices as they are broadcast).
    if (channelRef.current && !isLeaderRef.current) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const order = [
      { endpoint: 'car_data', fetcher: fetchCarData },
      { endpoint: 'laps', fetcher: fetchLaps },
      { endpoint: 'intervals', fetcher: fetchIntervals },
      { endpoint: 'position', fetcher: fetchPosition },
    ];
    for (const { endpoint, fetcher } of order) {
      try {
        lastRequestTimeRef.current = Date.now();
        const slice = await fetcher(ctrl.signal);
        if (slice) {
          setState((s) => ({ ...s, ...slice, status: 'live', isLive: true, lastUpdate: Date.now() }));
          if (channelRef.current && isLeaderRef.current) {
            channelRef.current.postMessage({ type: 'slice', tabId: tabIdRef.current, endpoint, slice });
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('priming failed:', err.message);
      }
      await new Promise((r) => setTimeout(r, PRIMING_INTERVAL_MS));
    }
  }, [fetchCarData, fetchLaps, fetchIntervals, fetchPosition]);

  // --- Visibility API throttling ------------------------------------------
  const applyVisibilityInterval = useCallback(() => {
    const ms = document.visibilityState === 'hidden' ? HIDDEN_INTERVAL_MS : SCHEDULER_INTERVAL_MS;
    if (!intervalRef.current) return;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => schedulerTickRef.current?.(), ms);
  }, []);

  // --- Fetch sessions (mount) ---------------------------------------------
  // Fetch ALL session types for the current meeting (not just Race) so the
  // telemetry page can show FP, Qualifying, Sprint, and Race sessions.
  useEffect(() => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const loadSessions = async () => {
      try {
        // Fetch all sessions for this season (all types)
        const sessions = await fetchJSON(
          `${OPENF1}/sessions?year=${season}`,
          ctrl.signal,
        );
        const { session, isLive } = findCurrentSession(sessions);

        if (!session) {
          // No session at all — try to find the next upcoming race for display
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

        initChannel();

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
      // Returning to the tab: fire an immediate catch-up tick, then restore.
      if (document.visibilityState !== 'hidden') schedulerTickRef.current?.();
      applyVisibilityInterval();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      ctrl.abort();
      stopScheduler();
      document.removeEventListener('visibilitychange', onVisibility);
      teardownChannel();
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
          // Rollover to a new session. Clear telemetry cache and restart.
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
            carDataBuffer: isLive ? [] : s.carDataBuffer,
            laps: isLive ? [] : s.laps,
            lap: isLive ? null : s.lap,
            gaps: isLive ? null : s.gaps,
            tires: isLive ? null : s.tires,
            sectors: isLive ? null : s.sectors,
            speeds: isLive ? null : s.speeds,
            weather: isLive ? null : s.weather,
            pits: isLive ? [] : s.pits,
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

  // --- Manual refresh -----------------------------------------------------
  const refresh = useCallback(() => {
    if (!state.session || !sessionKeyRef.current) return;

    // Rate-limit guard
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
          setState((s) => ({ ...s, ...slice, lastUpdate: Date.now() }));
          if (channelRef.current && isLeaderRef.current) {
            channelRef.current.postMessage({
              type: 'slice',
              tabId: tabIdRef.current,
              endpoint: lastEndpoint,
              slice,
            });
          }
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

export { fmtLapTime, fmtGap, compoundColor };
