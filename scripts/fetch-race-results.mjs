import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OPENF1 = 'https://api.openf1.org/v1';
const DRIVER = 3;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fmtLapTime = (seconds) => {
  if (seconds == null) return null;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
};

const fmtTotal = (seconds) => {
  if (seconds == null) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(3);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s.padStart(6, '0')}` : `${m}:${s.padStart(6, '0')}`;
};

const daysBetween = (a, b) => Math.abs(new Date(a) - new Date(b)) / 86400000;

let lastFetch = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchJSON = async (url, label = '') => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const wait = Math.max(0, 2100 - (Date.now() - lastFetch));
    if (wait > 0) await sleep(wait);
    lastFetch = Date.now();
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (res.status === 404) return null;
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After'), 10);
      const pause = (Number.isFinite(retryAfter) ? retryAfter : 10) * 1000;
      console.log(`  429 on ${label}, backing off ${pause / 1000}s (attempt ${attempt + 1}/3)`);
      await sleep(pause);
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${url}`);
  }
  return null;
};

const buildStrategy = (laps) => {
  const hasCompound = laps.some((l) => l.compound != null);
  if (!hasCompound) return null;
  const valid = laps.filter((l) => l.compound != null);
  if (valid.length === 0) return null;
  const stints = [];
  let current = null;
  let count = 0;
  for (const lap of valid) {
    if (lap.compound !== current) {
      if (current != null && count > 0) stints.push({ compound: current, laps: count });
      current = lap.compound;
      count = 1;
    } else {
      count++;
    }
  }
  if (current != null && count > 0) stints.push({ compound: current, laps: count });
  return stints.length > 0 ? stints : null;
};

const main = async () => {
  const calendarPath = path.resolve(__dirname, '..', 'src', 'data', 'calendar2026.json');
  const outputPath = path.resolve(__dirname, '..', 'src', 'data', 'raceResults2026.json');
  const calendar = JSON.parse(fs.readFileSync(calendarPath, 'utf-8'));

  console.log('Fetching all 2026 sessions...');
  const allSessions = await fetchJSON(`${OPENF1}/sessions?year=2026`, 'sessions');
  console.log(`  ${allSessions.length} sessions`);

  const meetings = {};
  for (const s of allSessions) {
    if (!meetings[s.meeting_key]) meetings[s.meeting_key] = [];
    meetings[s.meeting_key].push(s);
  }

  const raceSessions = allSessions.filter((s) => s.session_name === 'Race' && !s.is_cancelled);
  console.log(`  ${raceSessions.length} race sessions\n`);

  const results = [];
  const processedRounds = new Set();

  for (const session of raceSessions) {
    const raceDate = new Date(session.date_start);
    const match = calendar.find((r) => !r.isCancelled && daysBetween(r.date, raceDate) <= 2);
    if (!match) {
      console.log(`No calendar match for ${session.circuit_short_name} (${session.date_start})`);
      continue;
    }
    const round = match.round;
    processedRounds.add(round);
    const isCompleted = raceDate < new Date('2026-07-01');

    if (!isCompleted) {
      console.log(`R${round}: ${match.raceName} — upcoming`);
      results.push({ round, hasResults: false, isSprint: false, result: null });
      continue;
    }

    console.log(`R${round}: ${match.raceName}`);

    const meetingSessions = meetings[session.meeting_key] || [];
    const qualiSesh = meetingSessions.find((s) => s.session_name === 'Qualifying' && s.session_type === 'Qualifying');
    const sprintSesh = meetingSessions.find((s) => s.session_name === 'Sprint' && s.session_type === 'Race');
    const isSprint = !!sprintSesh;

    // --- Fetch race data sequentially to stay under rate limits ---
    const laps = await fetchJSON(
      `${OPENF1}/laps?session_key=${session.session_key}&driver_number=${DRIVER}`,
      `laps R${round}`,
    );
    console.log(`  laps: ${laps?.length || 0}`);

    const positions = await fetchJSON(
      `${OPENF1}/position?session_key=${session.session_key}&driver_number=${DRIVER}`,
      `position R${round}`,
    );
    console.log(`  positions: ${positions?.length || 0}`);

    const pits = await fetchJSON(
      `${OPENF1}/pit?session_key=${session.session_key}&driver_number=${DRIVER}`,
      `pit R${round}`,
    );
    console.log(`  pits: ${pits?.length || 0}`);

    // Qualifying
    let qualiPos = null;
    if (qualiSesh) {
      const qp = await fetchJSON(
        `${OPENF1}/position?session_key=${qualiSesh.session_key}&driver_number=${DRIVER}`,
        `quali R${round}`,
      );
      if (qp && qp.length) {
        qp.sort((a, b) => new Date(a.date) - new Date(b.date));
        qualiPos = qp[qp.length - 1].position;
      }
    }

    // Sprint
    let sprintPos = null;
    let sprintLaps = [];
    let sprintStrategy = null;
    if (sprintSesh) {
      const sp = await fetchJSON(
        `${OPENF1}/position?session_key=${sprintSesh.session_key}&driver_number=${DRIVER}`,
        `sprint-pos R${round}`,
      );
      if (sp && sp.length) {
        sp.sort((a, b) => new Date(a.date) - new Date(b.date));
        sprintPos = sp[sp.length - 1].position;
      }
      const sl = await fetchJSON(
        `${OPENF1}/laps?session_key=${sprintSesh.session_key}&driver_number=${DRIVER}`,
        `sprint-laps R${round}`,
      );
      sprintLaps = sl || [];
      sprintStrategy = buildStrategy(sprintLaps);
    }

    // --- Compute derived values ---
    const sortedPos = positions?.length
      ? [...positions].sort((a, b) => new Date(a.date) - new Date(b.date))
      : [];
    const finalPosition = sortedPos.length ? sortedPos[sortedPos.length - 1].position : null;
    const gridPosition = sortedPos.length ? sortedPos[0].position : null;

    const validLaps = (laps || []).filter((l) => l.lap_duration && !l.is_pit_out_lap);
    const bestLap = validLaps.length
      ? validLaps.reduce((b, l) => (l.lap_duration < b.lap_duration ? l : b), validLaps[0])
      : null;
    const bestLapTime = bestLap ? fmtLapTime(bestLap.lap_duration) : null;

    // Top speed from lap speed traps
    const speeds = (laps || []).flatMap((l) => [l.i1_speed, l.i2_speed, l.st_speed].filter((s) => s != null));
    const topSpeed = speeds.length ? Math.max(...speeds) : null;

    // Race time from session bounds
    const raceDuration = (new Date(session.date_end) - new Date(session.date_start)) / 1000;
    const totalRaceTime = fmtTotal(raceDuration);

    const pitStops = pits?.length || 0;
    const positionsGained =
      gridPosition != null && finalPosition != null ? gridPosition - finalPosition : null;

    const tyreStrategy = (laps || []).length ? buildStrategy(laps) : null;

    const highlights = [];
    if (finalPosition === 1) highlights.push('Win');
    if (finalPosition != null && finalPosition > 1 && finalPosition <= 3) highlights.push('Podium');
    if (qualiPos === 1) highlights.push('Pole Position');
    if (sprintPos === 1) highlights.push('Sprint Win');
    if (positionsGained != null && positionsGained > 0) highlights.push(`${positionsGained} Overtakes`);

    console.log(`  → P${finalPosition} | Best: ${bestLapTime} | Stops: ${pitStops} | Grid: P${gridPosition} | Quali: P${qualiPos} | Sprint: P${sprintPos}`);

    results.push({
      round,
      hasResults: true,
      isSprint,
      result: {
        position: finalPosition,
        points: null,
        gridPosition,
        qualifyingPosition: qualiPos,
        sprintPosition: sprintPos,
        sprintPoints: null,
        fastestLap: null,
        driverOfTheDay: null,
        pitStops,
        bestLapTime,
        totalRaceTime,
        topSpeed,
        positionsGained,
        tyreStrategy,
        sprintStrategy,
        highlights,
        championship: null,
      },
    });
  }

  // Add remaining calendar entries
  for (const entry of calendar) {
    if (!processedRounds.has(entry.round)) {
      const nearby = allSessions.filter((s) => {
        const sd = new Date(s.date_start);
        const ed = new Date(entry.date);
        return Math.abs(sd - ed) < 3 * 86400000;
      });
      results.push({
        round: entry.round,
        hasResults: false,
        isSprint: nearby.some((s) => s.session_name === 'Sprint' && s.session_type === 'Race'),
        result: null,
      });
    }
  }

  results.sort((a, b) => a.round - b.round);
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nDone — ${results.length} entries written`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
