# Updating calendar data

How to keep the 2026 calendar, race results, and lap charts in sync as the season progresses.

## Data files

| File | Contents | Updated by |
|------|----------|------------|
| `src/data/calendar2026.json` | Rounds, circuits, race dates, session times | Hand-edited |
| `src/data/raceResults2026.json` | Max's per-race result and weekend stats | `fetch-race-results.mjs` |
| `src/data/maxLapCharts2026.json` | Position-by-lap data for the detail chart | `fetch-max-lap-charts.mjs` |

All three files are keyed by `round`. Round numbers **must match across all three**.

## Prerequisites

- Node.js 22+
- Network access to the OpenF1 API (`https://api.openf1.org/v1`)
- Both scripts target driver `3` (Max Verstappen). Change `DRIVER` in the script if needed.

## Update the schedule (`calendar2026.json`)

The schedule is edited by hand. Each round looks like:

```json
{
  "round": 1,
  "raceName": "Australian Grand Prix",
  "circuit": "Melbourne",
  "country": "Australia",
  "date": "2026-03-08",
  "isCancelled": false,
  "sessions": [
    { "name": "FP1", "date": "2026-03-06T01:30:00Z" },
    { "name": "FP2", "date": "2026-03-06T05:00:00Z" },
    { "name": "FP3", "date": "2026-03-07T01:30:00Z" },
    { "name": "Qualifying", "date": "2026-03-07T05:00:00Z" },
    { "name": "Race", "date": "2026-03-08T04:00:00Z" }
  ]
}
```

Conventions:

- `date` is the race day in **UTC** (used for countdown and current/completed status).
- Session `date` values are ISO-8601 in **UTC**, ending in `Z`. Convert track-local times to UTC.
- Sprint weekends list `FP1`, `Sprint Qualifying`, `Sprint`, `Qualifying`, `Race` — not FP2/FP3.
- Set `isCancelled: true` for withdrawn rounds.
- Rounds are sequential and must line up with the results and lap-chart files.

> This project runs a **22-round** calendar and intentionally omits the Oct 4 Malaysia/Bahrain round. If you add or remove a round, renumber the affected rounds in **all three** JSON files. Both fetch scripts match OpenF1 sessions to `calendar2026.json` by date (±2 days) and skip anything without a match.

## Update completed race results

```bash
node scripts/fetch-race-results.mjs
```

What it does:

- Pulls all 2026 sessions from OpenF1 and matches each race to a calendar round by date.
- Reuses any round already marked `hasResults: true` (so completed rounds are not overwritten or refetched).
- Fills newly completed rounds with position, points, grid, qualifying, sprint position/points, pit stops, best lap, top speed, positions gained, and highlights.
- Leaves future rounds as `hasResults: false`.
- Skips OpenF1 sessions with no calendar match (e.g. Kuala Lumpur).

Use `--force` to refetch every round:

```bash
node scripts/fetch-race-results.mjs --force
```

Fields that stay `null` when the data is unavailable:

- `tyreStrategy` / `sprintStrategy` — OpenF1 laps have no compound data.
- `totalRaceTime` — OpenF1 only exposes the scheduled session window, not real race time.
- `fastestLap`, `driverOfTheDay`, `championship` — not sourced by the script.

## Update lap charts

```bash
node scripts/fetch-max-lap-charts.mjs
```

- Caches rounds that already have lap data and only fetches missing completed rounds.
- Skips future rounds and sessions with no calendar match.
- `--force` rebuilds every chart.

## Validate

```bash
node -e "for (const f of ['calendar2026','raceResults2026','maxLapCharts2026']) JSON.parse(require('fs').readFileSync('src/data/'+f+'.json','utf8')); console.log('ok')"
npm run lint
npm run dev
```

Open `/calendar` and spot-check the newest completed round's detail panel.

## Troubleshooting

- **429 responses** — the script backs off automatically; just re-run if it gives up.
- **`No calendar match for Kuala Lumpur`** — expected; that round is not in the 22-round calendar.
- **Results appear on the wrong race** — round numbers drifted between the three JSON files. Ensure they match.
