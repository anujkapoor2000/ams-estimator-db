# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single **Vite + React 18** single-page app (the "GW AMS Managed Service
Estimator"). There is **no backend, no database, and no test/lint tooling** — the whole
product runs client-side and persists opportunities to `localStorage` (see
`src/storage.js`, key `ams_opportunities`).

### Services

There is exactly one service: the Vite dev server.

- **Run (dev):** `npm run dev` (Vite, serves on port `5173`). Use
  `npm run dev -- --host 0.0.0.0` if you need to reach it from outside the VM.
- **Build:** `npm run build` (outputs to `dist/`).
- **Preview production build:** `npm run preview`.
- **Lint / Test:** none configured. There are no lint or test scripts in `package.json`,
  so do not expect `npm test`/`npm run lint` to exist.

### Notes / gotchas

- Node 18+ is required (`engines.node >= 18`); the VM's default Node (v22) works fine.
- The dependency install is just `npm install` (npm lockfile present).
- Since state lives only in the browser's `localStorage`, there is no server-side data to
  seed or migrate. To verify end-to-end, drive the UI in a browser: go to **New Estimate**,
  fill client details, open **Summary & Save**, click **Save Opportunity** (an ID like
  `AMS-YYYYMM-NNNN` is generated), then confirm the record appears under the
  **Opportunities** tab.
