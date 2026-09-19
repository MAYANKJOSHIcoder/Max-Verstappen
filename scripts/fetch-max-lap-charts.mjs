import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OPENF1 = 'https://api.openf1.org/v1';
const DRIVER = 3; // Max Verstappen

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// One position sample per lap. OpenF1 /laps has no position field, so lap
// positions are derived from the timestamped /position stream: each lap is
// assigned the last position in effect before the next lap began (i.e. the
// position at the end of that lap).
const buildLaps = (laps, positions) => {
  const orderedLaps = (laps || [])
    .filter((l) => l.lap_number != null && l.date_start)
    .sort((a, b) => a.lap_number - b.lap_number);
  if (!orderedLaps.length) return [];

  const samples = (positions || [])
    .filter((p) => p.position != null && p.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  if (!samples.length) return [];

  const positionAt = (iso) => {
    let found = null;
    for (const s of samples) {
      if (new Date(s.date) <= new Date(iso)) found = s.position;
      else break;
    }
    return found;
  };

  const built = [];
  for (let i = 0; i < orderedLaps.length; i++) {
    const lap = orderedLaps[i];
    const next = orderedLaps[i + 1];
    const position = next ? positionAt(next.date_start) : samples[samples.length - 1].position;
    if (position == null) continue;
    built.push({ lap: lap.lap_number, position });
  }
  return built;
};

const main = async () => {
  const force = process.argv.includes('--force');
  const calendarPath = path.resolve(__dirname, '..', 'src', 'data', 'calendar2026.json');
  const outputPath = path.resolve(__dirname, '..', 'src', 'data', 'maxLapCharts2026.json');
  const calendar = JSON.parse(fs.readFileSync(calendarPath, 'utf-8'));

  const existing = fs.existsSync(outputPath)
    ? JSON.parse(fs.readFileSync(outputPath, 'utf-8'))
    : [];
  const cached = new Map(existing.map((e) => [e.round, e]));

  const writeOutput = (fetched) => {
    const output = calendar.map((entry) => {
      const found = fetched.find((e) => e.round === entry.round);
      return found || { round: entry.round, raceName: entry.raceName, totalLaps: null, laps: [] };
    });
    output.sort((a, b) => a.round - b.round);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    return output;
  };

  console.log('Fetching all 2026 sessions...');
  const allSessions = await fetchJSON(`${OPENF1}/sessions?year=2026`, 'sessions');
  console.log(`  ${allSessions.length} sessions`);

  const raceSessions = allSessions.filter((s) => s.session_name === 'Race' && !s.is_cancelled);
  console.log(`  ${raceSessions.length} race sessions\n`);

  const entries = [];
  const now = new Date();

  for (const session of raceSessions) {
    const raceDate = new Date(session.date_start);
    const match = calendar.find((r) => !r.isCancelled && daysBetween(r.date, raceDate) <= 2);
    if (!match) {
      console.log(`No calendar match for ${session.circuit_short_name} (${session.date_start})`);
      continue;
    }
    const round = match.round;

    if (raceDate > now) {
      console.log(`R${round}: ${match.raceName} — upcoming`);
      continue;
    }

    const prior = cached.get(round);
    if (!force && prior?.laps?.length) {
      console.log(`R${round}: ${match.raceName} — cached (${prior.laps.length} laps)`);
      entries.push(prior);
      continue;
    }

    const laps = await fetchJSON(
      `${OPENF1}/laps?session_key=${session.session_key}&driver_number=${DRIVER}`,
      `laps R${round}`,
    );

    const positions = await fetchJSON(
      `${OPENF1}/position?session_key=${session.session_key}&driver_number=${DRIVER}`,
      `position R${round}`,
    );

    const chartLaps = buildLaps(laps, positions);
    const totalLaps = chartLaps.length ? chartLaps[chartLaps.length - 1].lap : null;

    console.log(
      `R${round}: ${match.raceName} — ${chartLaps.length} laps P${chartLaps[0]?.position ?? '?'} → P${chartLaps[chartLaps.length - 1]?.position ?? '?'}`,
    );

    const entry = {
      round,
      raceName: match.raceName,
      totalLaps,
      laps: chartLaps,
    };
    entries.push(entry);
    writeOutput(entries); // incremental save so a re-run resumes where it stopped
  }

  const output = writeOutput(entries);
  console.log(`\nDone — ${output.length} entries written (${entries.length} with lap data)`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});