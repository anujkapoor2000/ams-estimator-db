Here's your GW AMS Managed Service Estimator — a full 6-tab React app. Here's what's included:
Tab 1 — Client Details
Client name, contact, email, region, contract duration, start date. Shows a live reference card.
Tab 2 — Application Scope
Guidewire module selector (7 modules), Guidewire Cloud toggle, complexity picker (Low/Medium/High/Critical with multipliers), sliders for integrations, Gosu KLOC, monthly tickets, changes, and releases p.a.
Tab 3 — Team & Rates
FTE composition with ±0.25 steppers for all 10 roles. Onshore / Nearshore (Spain/Morocco) / Offshore (India) location mix sliders. Live blended rate card table.
Tab 4 — Service Levels
Standard / Enhanced / Premium SLA tier selector with P1–P3 response times and availability targets. Follow-the-Sun toggle (+15%). Contingency buffer slider with auto-calculated risk flags.
Tab 5 — AI Accelerators
All 4 NTT DATA accelerators (Testing, Tech Debt Radar, Requirements Analyser, DataHub). Toggle on/off with live monthly saving and one-off cost shown per tool. Combined saving panel.
Tab 6 — Summary & Export
Full cost build-up (base → contingency → gross → AI saving → net → TCV). KPI cards, scope summary, location mix bar. CSV export and Print/PDF buttons.
The TCV is always live in the top-right header as you build. Ready to push to GitHub/Vercel using your standard workflow.


AMS Estimator v2.0 with a full opportunity database.

🗄️ What's new
Unique Opportunity IDs
Auto-generated on every save in the format NTT-AMS-202605-4821 — year + month + 4-digit random. Shown persistently in the header and on every record.
Opportunities Database (📁 tab)
A full pipeline dashboard with:

Search by client name, region, or ID
Filter by status (Draft / In Review / Submitted / Won / Lost)
Pipeline KPIs: total count, total TCV, won count, in-review count, average TCV
Sortable table: ID · Client · Region · SLA · Modules · FTE · TCV · Status · Updated
Click any row to open a detail modal
Edit / Delete per row

Save & Update flow

"Save Opportunity" creates a new record with a fresh ID
"Update Opportunity" when editing an existing one — preserves createdAt, updates updatedAt
Green confirmation banner shows the saved ID
Last tab "Next →" button becomes "💾 Save" on the final step

Status workflow
Draft → In Review → Submitted → Won / Lost — selectable at any point in the estimator
Storage

In Claude (this view): uses the persistent artifact storage API — survives across sessions
On Vercel: src/storage.js automatically falls back to localStorage — data persists in the browser

unzip gw-ams-estimator-db.zip
cd ams-estimator-db
git init && git add . && git commit -m "AMS Estimator v2 with DB"
# Push to GitHub → vercel.com → Import → Vite → Deploy
