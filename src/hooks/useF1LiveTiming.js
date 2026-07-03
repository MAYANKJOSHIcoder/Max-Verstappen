import { useCallback, useEffect, useRef, useState } from 'react';
import { inflateSync, strFromU8 } from 'fflate';

const STATIC_BASE = '/api/f1-static';
const POLL_MS = 10_000;
const CAR_DATA_POLL_MS = 30_000;
const LIVE_WINDOW_MS = 30 * 60 * 1000;

const fmtLapTime = (seconds) => {
  if (seconds == null) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
};

const fmtGap = (gap) => {
  if (gap == null || gap === '') return '—';
  if (typeof gap === 'string') return gap.startsWith('+') ? `${gap}s` : gap;
  if (gap <= 0) return 'LEADER';
  return `+${gap.toFixed(3)}s`;
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

const parseLapTime = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (!value.includes(':')) return Number.parseFloat(value) || null;
  const [mins, secs] = value.split(':');
  const parsed = Number(mins) * 60 + Number.parseFloat(secs);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseGap = (value) => {
  if (value == null || value === '') return null;
  if (typeof value === 'object') return parseGap(value.Value);
  if (typeof value !== 'string') return Number.isFinite(value) ? value : null;
  if (value.toUpperCase().includes('LAP')) return value;
  const parsed = Number.parseFloat(value.replace('+', '').replace('s', ''));
  return Number.isFinite(parsed) ? parsed : value;
};

const offsetDate = (date, offset) => {
  if (!date) return null;
  if (!offset) return `${date}Z`;
  const sign = offset.startsWith('-') ? '-' : '+';
  const clean = offset.replace('-', '').split(':').slice(0, 2).join(':');
  return `${date}${sign}${clean}`;
};

const pathSlug = (value) => value.replace(/ /g, '_');

const deriveSessionPath = (session) => {
  if (session.Path) return session.Path;
  const meetingSessions = session.Meeting?.Sessions || [];
  const raceSession = meetingSessions.find((s) => s.Type === 'Race' && s.Name === 'Race');
  const meetingDate = (raceSession?.StartDate || meetingSessions[meetingSessions.length - 1]?.StartDate || session.StartDate)
    ?.slice(0, 10);
  const sessionDate = session.StartDate?.slice(0, 10);
  if (!meetingDate || !sessionDate || !session.Meeting?.Name || !session.Name) return null;
  return `${meetingDate.slice(0, 4)}/${meetingDate}_${pathSlug(session.Meeting.Name)}/${sessionDate}_${pathSlug(session.Name)}/`;
};

const sprintQualifyingPhase = (session) => {
  if (session?.Name !== 'Sprint Qualifying') return null;
  const start = new Date(offsetDate(session.StartDate, session.GmtOffset)).getTime();
  const elapsedMin = (Date.now() - start) / 60000;
  if (elapsedMin >= 0 && elapsedMin < 12) return 'SQ1';
  if (elapsedMin >= 19 && elapsedMin < 29) return 'SQ2';
  if (elapsedMin >= 36 && elapsedMin <= 44) return 'SQ3';
  if (elapsedMin >= 12 && elapsedMin < 19) return 'SQ1/SQ2 Break';
  if (elapsedMin >= 29 && elapsedMin < 36) return 'SQ2/SQ3 Break';
  return null;
};

const displaySessionName = (sessionInfo, session) => {
  const name = sessionInfo?.Name || session?.Name || 'Session';
  const phase = sprintQualifyingPhase(session);
  return phase ? `${name} (${phase})` : name;
};

const buildSessionShell = (session, sessionInfo = null) => ({
  session_name: displaySessionName(sessionInfo, session),
  circuit_short_name: sessionInfo?.Meeting?.Circuit?.ShortName || session.Meeting?.Circuit?.ShortName,
  raceName: sessionInfo?.Meeting?.Name || session.Meeting?.Name,
  date_start: offsetDate(session.StartDate, session.GmtOffset),
  date_end: offsetDate(session.EndDate, session.GmtOffset),
});

const readJSON = async (url, signal) => {
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
};

const readText = async (url, signal) => {
  const res = await fetch(url, { signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
};

const decodeBase64 = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const inflateTimingPayload = (value) => {
  const inflated = inflateSync(decodeBase64(value));
  return JSON.parse(strFromU8(inflated));
};

const mergeDeep = (target, patch) => {
  for (const [key, value] of Object.entries(patch || {})) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      mergeDeep(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
};

const parseJsonStream = (text, transformPayload = (payload) => payload) => {
  const state = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const jsonStart = trimmed.search(/[{"]/);
    if (jsonStart < 0) continue;
    try {
      const payload = JSON.parse(trimmed.slice(jsonStart));
      mergeDeep(state, transformPayload(payload));
    } catch {
      // Skip incomplete or malformed stream lines from an in-progress session.
    }
  }
  return state;
};

const findSession = (index) => {
  const sessions = index.Meetings.flatMap((meeting) =>
    meeting.Sessions.map((session) => ({ ...session, Meeting: meeting })),
  );
  const now = Date.now();

  const withDates = sessions.map((session) => {
    const start = new Date(offsetDate(session.StartDate, session.GmtOffset)).getTime();
    const end = new Date(offsetDate(session.EndDate, session.GmtOffset)).getTime();
    return { ...session, Path: deriveSessionPath(session), start, end };
  });

  const current = withDates.find(
    (session) => now >= session.start - LIVE_WINDOW_MS && now <= session.end + LIVE_WINDOW_MS,
  );
  if (current) return { session: current, isCurrent: true };

  const completed = withDates
    .filter((session) => session.end < now)
    .sort((a, b) => b.end - a.end)[0];
  if (completed) return { session: completed, isCurrent: false };

  const upcoming = withDates
    .filter((session) => session.start > now)
    .sort((a, b) => a.start - b.start)[0];
  return { session: upcoming || null, isCurrent: false };
};

const findMaxDriverNumber = (drivers) => {
  const entry = Object.entries(drivers || {}).find(([, driver]) =>
    driver.Reference === 'MAXVER01' || driver.Tla === 'VER' || driver.FullName?.includes('VERSTAPPEN'),
  );
  return entry?.[0] || '3';
};

const normalizeSectors = (line) => {
  const sectors = Array.isArray(line?.Sectors)
    ? line.Sectors
    : Object.values(line?.Sectors || {});
  const values = sectors.map((sector) => parseLapTime(sector?.Value || sector?.PreviousValue));
  const segments = sectors.map((sector) => {
    const raw = Array.isArray(sector?.Segments)
      ? sector.Segments
      : Object.values(sector?.Segments || {});
    return raw.map((segment) => segment.Status);
  });
  return {
    s1: values[0],
    s2: values[1],
    s3: values[2],
    bestS1: values[0],
    bestS2: values[1],
    bestS3: values[2],
    segmentsS1: segments[0],
    segmentsS2: segments[1],
    segmentsS3: segments[2],
  };
};

const normalizeCarData = (carData, driverNumber) => {
  const entries = carData?.Entries || [];
  const latest = [...entries].reverse().find((entry) => entry.Cars?.[driverNumber]?.Channels);
  const channels = latest?.Cars?.[driverNumber]?.Channels;
  if (!channels) return null;
  return {
    speed: channels['2'] ?? null,
    rpm: channels['0'] ?? null,
    n_gear: channels['3'] ?? null,
    throttle: channels['4'] ?? null,
    brake: channels['5'] ?? null,
    drs: channels['45'] ?? 0,
    date: latest.Utc,
  };
};

const parseCarDataStream = (text, driverNumber) => {
  let latest = null;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const jsonStart = trimmed.indexOf('"');
    if (jsonStart < 0) continue;
    try {
      const payload = inflateTimingPayload(JSON.parse(trimmed.slice(jsonStart)));
      latest = normalizeCarData(payload, driverNumber) || latest;
    } catch {
      // Skip incomplete chunks from an in-progress live stream.
    }
  }
  return latest;
};

const normalizeState = ({ session, sessionInfo, drivers, timing, weather, stints, carTelemetry }) => {
  const driverNumber = findMaxDriverNumber(drivers);
  const line = timing?.Lines?.[driverNumber];
  if (!line) return null;

  const bestLapDuration = parseLapTime(line.BestLapTime?.Value);
  const lastLapDuration = parseLapTime(line.LastLapTime?.Value);
  const lapNumber = Number(line.NumberOfLaps) || 0;
  const maxStints = stints?.Stints?.[driverNumber] || [];
  const currentStint = maxStints[maxStints.length - 1];
  const latestLap = {
    lap_number: lapNumber,
    lap_duration: lastLapDuration,
    compound: currentStint?.Compound,
    tyre_age_at_start: currentStint?.TotalLaps,
    segments_sector_1: normalizeSectors(line).segmentsS1,
    segments_sector_2: normalizeSectors(line).segmentsS2,
    segments_sector_3: normalizeSectors(line).segmentsS3,
  };
  const bestLap = bestLapDuration
    ? { lap_number: Number(line.BestLapTime?.Lap) || lapNumber, lap_duration: bestLapDuration }
    : null;
  const laps = [bestLap, latestLap].filter(Boolean);

  return {
    status: 'live',
    isLive: true,
    lastUpdate: Date.now(),
    session: {
      ...buildSessionShell(session, sessionInfo),
    },
    driver: {
      position: Number(line.Position) || line.Position,
      date: new Date().toISOString(),
    },
    gaps: {
      gapToLeader: parseGap(line.GapToLeader || line.TimeDiffToFastest),
      gapToAhead: parseGap(line.IntervalToPositionAhead || line.TimeDiffToPositionAhead),
      gapBehind: null,
    },
    lap: latestLap,
    laps,
    sectors: normalizeSectors(line),
    tires: currentStint
      ? {
          compound: currentStint.Compound,
          color: compoundColor(currentStint.Compound),
          age: currentStint.TotalLaps,
          stint: maxStints.length,
        }
      : null,
    pits: [],
    carTelemetry,
    weather: weather
      ? {
          air_temperature: weather.AirTemp,
          track_temperature: weather.TrackTemp,
          humidity: weather.Humidity,
          wind_speed: weather.WindSpeed,
          wind_direction: weather.WindDirection,
          rainfall: weather.Rainfall,
        }
      : null,
    positionTimeline: lapNumber ? [{ lap: lapNumber, position: Number(line.Position) || 0 }] : [],
    nextSession: null,
    error: null,
  };
};

export const useF1LiveTiming = ({ season = 2026 } = {}) => {
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
  const lastCarDataFetchRef = useRef(0);
  const carTelemetryRef = useRef(null);

  const load = useCallback(async (signal) => {
    const index = await readJSON(`${STATIC_BASE}/${season}/Index.json`, signal);
    const { session } = findSession(index);
    if (!session) {
      setState((s) => ({ ...s, status: 'no-session', isLive: false }));
      return;
    }

    if (!session.Path) {
      setState((s) => ({
        ...s,
        status: 'no-session',
        isLive: false,
        session: buildSessionShell(session),
        error: 'Session path is not available yet.',
      }));
      return;
    }

    const base = `${STATIC_BASE}/${session.Path}`;
    const [sessionInfo, drivers, timing, weather, stints] = await Promise.all([
      readJSON(`${base}SessionInfo.json`, signal).catch(() => null),
      readJSON(`${base}DriverList.json`, signal).catch(() => null),
      readJSON(`${base}TimingData.json`, signal).catch(async () => {
        const stream = await readText(`${base}TimingData.jsonStream`, signal);
        return parseJsonStream(stream);
      }).catch(() => null),
      readJSON(`${base}WeatherData.json`, signal).catch(() => null),
      readJSON(`${base}TyreStintSeries.json`, signal).catch(() => null),
    ]);

    if (!drivers || !timing) {
      setState((s) => ({
        ...s,
        status: 'no-session',
        isLive: false,
        session: buildSessionShell(session, sessionInfo),
        nextSession: null,
        error: sessionInfo?.ArchiveStatus?.Status === 'Generating'
          ? 'Live timing files are still generating.'
          : 'Live timing files are not available yet.',
      }));
      return;
    }

    const driverNumber = findMaxDriverNumber(drivers);
    const now = Date.now();
    if (now - lastCarDataFetchRef.current > CAR_DATA_POLL_MS) {
      lastCarDataFetchRef.current = now;
      try {
        const stream = await readText(`${base}CarData.z.jsonStream`, signal);
        carTelemetryRef.current = parseCarDataStream(stream, driverNumber);
      } catch {
        try {
          const encoded = await readJSON(`${base}CarData.z.json`, signal);
          carTelemetryRef.current = normalizeCarData(inflateTimingPayload(encoded), driverNumber);
        } catch {
          // Timing-only mode is still useful when car channels are unavailable.
        }
      }
    }

    const normalized = normalizeState({
      session,
      sessionInfo,
      drivers,
      timing,
      weather,
      stints,
      carTelemetry: carTelemetryRef.current,
    });

    if (!normalized) {
      setState((s) => ({
        ...s,
        status: 'no-session',
        isLive: false,
        session: buildSessionShell(session, sessionInfo),
        nextSession: null,
      }));
      return;
    }

    setState(normalized);
  }, [season]);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal).catch((err) => {
      if (err.name !== 'AbortError') {
        setState((s) => ({ ...s, status: 'error', error: err.message }));
      }
    });
    const id = setInterval(() => {
      const tickCtrl = new AbortController();
      load(tickCtrl.signal).catch((err) => {
        if (err.name !== 'AbortError') {
          setState((s) => ({ ...s, status: 'error', error: err.message }));
        }
      });
    }, POLL_MS);
    return () => {
      ctrl.abort();
      clearInterval(id);
    };
  }, [load]);

  const refresh = useCallback(() => {
    const ctrl = new AbortController();
    load(ctrl.signal).catch((err) => {
      if (err.name !== 'AbortError') setState((s) => ({ ...s, status: 'error', error: err.message }));
    });
  }, [load]);

  return {
    ...state,
    refresh,
  };
};

export { fmtLapTime, fmtGap };
