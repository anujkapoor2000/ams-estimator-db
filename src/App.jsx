import { useState, useCallback, useEffect } from "react";
import { storage } from "./storage.js";
import "./styles.css";

// ── Design tokens (only kept for truly dynamic inline values) ─────────────────
const NAVY    = "#003087";
const TEAL    = "#00a896";
const INK_SEC = "#5a6a82";
const INK_MUT = "#9aaabf";
const GREEN   = "#00875a";
const AMBER   = "#d97706";
const PURPLE  = "#7c3aed";
const RED     = "#dc2626";

// ── Data ──────────────────────────────────────────────────────────────────────
const ROLES = [
  { id:"gw_lead",   label:"GW Technical Lead",    onshore:850,  nearshore:480, offshore:320 },
  { id:"gw_config", label:"GW Config Developer",  onshore:650,  nearshore:380, offshore:250 },
  { id:"gw_int",    label:"GW Integration Dev",   onshore:750,  nearshore:420, offshore:280 },
  { id:"gw_ba",     label:"GW Business Analyst",  onshore:700,  nearshore:400, offshore:260 },
  { id:"jutro",     label:"Jutro / UI Developer", onshore:680,  nearshore:390, offshore:255 },
  { id:"qa_lead",   label:"QA Lead",              onshore:700,  nearshore:400, offshore:260 },
  { id:"qa_eng",    label:"QA Engineer",          onshore:550,  nearshore:300, offshore:200 },
  { id:"devops",    label:"DevOps / Cloud Eng",   onshore:780,  nearshore:440, offshore:290 },
  { id:"svc_mgr",   label:"Service Manager",      onshore:850,  nearshore:480, offshore:320 },
  { id:"arch",      label:"Solution Architect",   onshore:950,  nearshore:540, offshore:360 },
];

const COMPLEXITY_MULT = { low:0.75, medium:1.0, high:1.45, critical:1.9 };

const AI_ACCELERATORS = [
  { id:"ai_testing",   label:"AI-Based Test Automation",     icon:"🤖", category:"Quality",          saving:0.30, cost:25000, desc:"Self-healing scripts, AI-driven regression, anomaly detection.",                 capabilities:["Auto-generate test cases","Self-healing locators","AI regression prioritisation","Defect prediction"],          effort:"4–6 wks", maturity:"Production Ready" },
  { id:"tech_debt",    label:"Tech Debt Radar",              icon:"🔍", category:"Code Quality",      saving:0.20, cost:15000, desc:"300+ Gosu anti-pattern library. Surfaces refactoring priorities.",               capabilities:["300+ anti-pattern detection","Complexity heat maps","Upgrade risk scoring","Debt backlog generation"],         effort:"2–3 wks", maturity:"Production Ready" },
  { id:"req_analyser", label:"Requirements Analyser",        icon:"📋", category:"Delivery",          saving:0.15, cost:12000, desc:"NLP BRD parser mapping requirements to GW OOTB capabilities.",                   capabilities:["BRD-to-GW mapping","Gap & risk flagging","Auto acceptance criteria","Story point assist"],                      effort:"3–4 wks", maturity:"Production Ready" },
  { id:"datahub",      label:"Test DataHub & CDA Masking",   icon:"🛡️", category:"Compliance",        saving:0.10, cost:18000, desc:"AI-generated synthetic test data with GDPR/CDA masking.",                        capabilities:["Synthetic data generation","GDPR/CDA masking","Referential integrity","On-demand provisioning"],                effort:"3–5 wks", maturity:"Production Ready" },
  { id:"gosu_copilot", label:"Gosu Copilot",                 icon:"⚡", category:"Dev Productivity",  saving:0.25, cost:20000, desc:"AI pair programmer for Gosu/PCF — inline suggestions, deprecated API detection.", capabilities:["Gosu code completion","PCF generation assist","Deprecated API detection","Version compatibility"],            effort:"2–4 wks", maturity:"Beta" },
  { id:"incident_ai",  label:"Incident Intelligence Engine", icon:"🚨", category:"Operations",        saving:0.22, cost:22000, desc:"ML model for auto-classification, smart routing and MTTR analytics.",             capabilities:["Auto-classify P1–P4","Smart team routing","Similar incident recall","MTTR analytics"],                         effort:"6–8 wks", maturity:"Beta" },
  { id:"release_ai",   label:"Release Risk Predictor",       icon:"🚀", category:"DevOps",            saving:0.18, cost:16000, desc:"Risk-scores releases from git diff, coverage delta and history.",                  capabilities:["Pre-release risk score","Regression scope recommendation","Rollback probability","Calendar optimisation"],       effort:"4–6 wks", maturity:"Beta" },
  { id:"ootb_scorer",  label:"OOTB Utilisation Scorer",      icon:"📊", category:"Governance",        saving:0.12, cost:10000, desc:"Scans config layer for OOTB vs custom ratio per module.",                         capabilities:["OOTB vs custom ratio","Upgrade impact preview","Config health score","Refactor recommendations"],               effort:"2–3 wks", maturity:"Production Ready" },
  { id:"renewal_ai",   label:"Renewal Risk Scorer",          icon:"🔄", category:"Business Intel",    saving:0.08, cost:14000, desc:"Propensity model predicting policy renewal likelihood.",                           capabilities:["Renewal propensity scoring","Churn risk segmentation","Automated broker alerts","PolicyCenter API integration"], effort:"6–10 wks",maturity:"PoC Available" },
  { id:"knowledge_ai", label:"AMS Knowledge Assistant",      icon:"💬", category:"Service Desk",      saving:0.20, cost:18000, desc:"RAG chatbot over runbooks, KEDBs and GW docs for L1/L2 self-service.",            capabilities:["RAG over runbooks","GW documentation Q&A","Ticket deflection","Escalation handoff"],                          effort:"4–6 wks", maturity:"Beta" },
];

const SLA_TIERS = [
  { id:"standard", label:"Standard", p1:"4hr",  p2:"8hr",  p3:"2BD", avail:"99.5%",  mult:1.0  },
  { id:"enhanced", label:"Enhanced", p1:"2hr",  p2:"4hr",  p3:"1BD", avail:"99.9%",  mult:1.25 },
  { id:"premium",  label:"Premium",  p1:"1hr",  p2:"2hr",  p3:"4hr", avail:"99.95%", mult:1.55 },
];

const MODULES = ["PolicyCenter","ClaimCenter","BillingCenter","CustomerEngage","ProducerEngage","ServiceRepEngage","Analytics / DWH"];

const MATURITY_COLORS = { "Production Ready": GREEN, "Beta": AMBER, "PoC Available": PURPLE };
const STATUS_COLORS   = { "Draft": INK_MUT, "In Review": AMBER, "Submitted": NAVY, "Won": GREEN, "Lost": RED };

const AI_CATEGORIES = ["All","Quality","Developer Productivity","Operations","DevOps","Compliance","Code Quality","Delivery","Governance","Business Intelligence","Service Desk"];

const MAIN_TABS = [
  { id:"opportunities", label:"Opportunities" },
  { id:"estimator",     label:"New Estimate"  },
];

const EST_TABS = [
  { id:0, label:"Client Details",    icon:"🏢" },
  { id:1, label:"Application Scope", icon:"📦" },
  { id:2, label:"Team & Rates",      icon:"👥" },
  { id:3, label:"Service Levels",    icon:"📋" },
  { id:4, label:"AI Accelerators",   icon:"🤖" },
  { id:5, label:"Summary & Save",    icon:"💾" },
];

// ── Unique ID ─────────────────────────────────────────────────────────────────
function generateOppId() {
  const year  = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const rand  = Math.floor(Math.random() * 9000) + 1000;
  return `AMS-${year}${month}-${rand}`;
}

// ── Format ────────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1_000_000) return "£" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return "£" + Math.round(n / 1_000) + "K";
  return "£" + Math.round(n);
}

// ── Default state ─────────────────────────────────────────────────────────────
const defaultClient   = { name:"", contact:"", email:"", region:"UK", contractYears:3, startDate:"", projectRef:"" };
const defaultModules  = { PolicyCenter:true, ClaimCenter:true, BillingCenter:true };
const defaultTeam     = { gw_lead:1, gw_config:2, gw_int:1, gw_ba:1, jutro:0, qa_lead:1, qa_eng:1, devops:1, svc_mgr:0.5, arch:0.25 };
const defaultLocation = { onshore:30, nearshore:40, offshore:30 };

// ── Shared UI primitives (defined outside App to prevent focus loss) ──────────
const STitle = ({ children }) => <div className="section-title">{children}</div>;

const Input = ({ label, value, onChange, type="text", placeholder="" }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} className="form-input" />
  </div>
);

const Sel = ({ label, value, onChange, options }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="form-select">
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);

const Slider = ({ label, value, onChange, min, max, step=1, suffix="" }) => (
  <div className="slider-group">
    <div className="slider-header">
      <label className="form-label" style={{ marginBottom:0 }}>{label}</label>
      <span className="slider-value">{value}{suffix}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))} className="range-input" />
    <div className="range-hints"><span>{min}{suffix}</span><span>{max}{suffix}</span></div>
  </div>
);

const Toggle = ({ label, checked, onChange, sub }) => (
  <div className={`toggle${checked ? " toggle--on" : ""}`} onClick={() => onChange(!checked)}>
    <div className="toggle__track"><div className="toggle__thumb" /></div>
    <div>
      <div className="toggle__label">{label}</div>
      {sub && <div className="toggle__sub">{sub}</div>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [mainTab,        setMainTab]        = useState("opportunities");
  const [estTab,         setEstTab]         = useState(0);
  const [opportunities,  setOpportunities]  = useState([]);
  const [editingId,      setEditingId]      = useState(null);
  const [aiCatFilter,    setAiCatFilter]    = useState("All");
  const [searchQ,        setSearchQ]        = useState("");
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [viewOpp,        setViewOpp]        = useState(null);

  // Estimator form state
  const [client,         setClient]         = useState(defaultClient);
  const [modules,        setModules]        = useState(defaultModules);
  const [complexity,     setComplexity]     = useState("medium");
  const [integrations,   setIntegrations]   = useState(8);
  const [gosuKLOC,       setGosuKLOC]       = useState(50);
  const [monthlyTickets, setMonthlyTickets] = useState(80);
  const [monthlyChanges, setMonthlyChanges] = useState(15);
  const [releasesPA,     setReleasesPA]     = useState(6);
  const [cloudHosted,    setCloudHosted]    = useState(true);
  const [team,           setTeam]           = useState(defaultTeam);
  const [locationMix,    setLocationMix]    = useState(defaultLocation);
  const [slaTier,        setSlaTier]        = useState("standard");
  const [fts,            setFts]            = useState(false);
  const [contingency,    setContingency]    = useState(15);
  const [aiEnabled,      setAiEnabled]      = useState({});
  const [oppStatus,      setOppStatus]      = useState("Draft");
  const [notes,          setNotes]          = useState("");
  const [savedMsg,       setSavedMsg]       = useState("");

  // ── Load from storage ─────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const result = await storage.get("ams_opportunities");
        if (result?.value) setOpportunities(JSON.parse(result.value));
      } catch { /* first run */ }
    }
    load();
  }, []);

  // ── Calculations ──────────────────────────────────────────────────────────
  const workingDaysPerMonth = 21.7;
  const totalFTE  = Object.values(team).reduce((a, b) => a + b, 0);
  const sla       = SLA_TIERS.find(s => s.id === slaTier);
  const compMult  = COMPLEXITY_MULT[complexity];
  const ftsMult   = fts ? 1.15 : 1.0;
  const mixTotal  = locationMix.onshore + locationMix.nearshore + locationMix.offshore;

  const blendedDaily = useCallback(() =>
    ROLES.reduce((sum, r) => {
      const fte  = team[r.id] || 0;
      const rate = (r.onshore * locationMix.onshore + r.nearshore * locationMix.nearshore + r.offshore * locationMix.offshore) / 100;
      return sum + fte * rate;
    }, 0)
  , [team, locationMix]);

  const baseMonthly  = blendedDaily() * workingDaysPerMonth * compMult * sla.mult * ftsMult;
  const contAmount   = baseMonthly * (contingency / 100);
  const grossMonthly = baseMonthly + contAmount;
  const selectedAI   = AI_ACCELERATORS.filter(a => aiEnabled[a.id]);
  const aiSavingPct  = Math.min(selectedAI.reduce((s, a) => s + a.saving, 0), 0.65);
  const aiSavingMo   = grossMonthly * aiSavingPct;
  const aiOneOff     = selectedAI.reduce((s, a) => s + a.cost, 0);
  const netMonthly   = grossMonthly - aiSavingMo;
  const annualCost   = netMonthly * 12;
  const tcv          = annualCost * client.contractYears + aiOneOff;

  // ── Snapshot ──────────────────────────────────────────────────────────────
  function buildSnapshot(id) {
    return {
      id, oppId: id, status: oppStatus, notes,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      client: { ...client }, modules: { ...modules }, complexity,
      integrations, gosuKLOC, monthlyTickets, monthlyChanges, releasesPA,
      cloudHosted, team: { ...team }, locationMix: { ...locationMix },
      slaTier, fts, contingency, aiEnabled: { ...aiEnabled },
      financials: {
        baseMonthly:  Math.round(baseMonthly),
        grossMonthly: Math.round(grossMonthly),
        aiSavingMo:   Math.round(aiSavingMo),
        netMonthly:   Math.round(netMonthly),
        annualCost:   Math.round(annualCost),
        aiOneOff:     Math.round(aiOneOff),
        tcv:          Math.round(tcv),
        aiSavingPct:  +(aiSavingPct * 100).toFixed(1),
        totalFTE:     +totalFTE.toFixed(2),
        contingency,
      },
    };
  }

  // ── Save / Update ─────────────────────────────────────────────────────────
  async function saveOpportunity() {
    const id   = editingId || generateOppId();
    const snap = buildSnapshot(id);
    if (editingId) snap.createdAt = opportunities.find(o => o.id === editingId)?.createdAt || snap.createdAt;
    const updated = editingId
      ? opportunities.map(o => o.id === editingId ? snap : o)
      : [snap, ...opportunities];
    try {
      await storage.set("ams_opportunities", JSON.stringify(updated));
      setOpportunities(updated);
      setSavedMsg(`✓ Saved — ${id}`);
      setTimeout(() => setSavedMsg(""), 4000);
      if (!editingId) setEditingId(id);
    } catch (e) {
      setSavedMsg("⚠ Save failed: " + e.message);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function deleteOpportunity(id) {
    const updated = opportunities.filter(o => o.id !== id);
    await storage.set("ams_opportunities", JSON.stringify(updated));
    setOpportunities(updated);
    if (viewOpp?.id === id) setViewOpp(null);
  }

  // ── Load into form ────────────────────────────────────────────────────────
  function loadOpportunity(opp) {
    setEditingId(opp.id);
    setClient(opp.client);
    setModules(opp.modules);
    setComplexity(opp.complexity);
    setIntegrations(opp.integrations);
    setGosuKLOC(opp.gosuKLOC);
    setMonthlyTickets(opp.monthlyTickets);
    setMonthlyChanges(opp.monthlyChanges);
    setReleasesPA(opp.releasesPA);
    setCloudHosted(opp.cloudHosted);
    setTeam(opp.team);
    setLocationMix(opp.locationMix);
    setSlaTier(opp.slaTier);
    setFts(opp.fts);
    setContingency(opp.contingency);
    setAiEnabled(opp.aiEnabled);
    setOppStatus(opp.status);
    setNotes(opp.notes || "");
    setMainTab("estimator");
    setEstTab(0);
  }

  // ── New estimate ──────────────────────────────────────────────────────────
  function newEstimate() {
    setEditingId(null);
    setClient(defaultClient);
    setModules(defaultModules);
    setComplexity("medium");
    setIntegrations(8);
    setGosuKLOC(50);
    setMonthlyTickets(80);
    setMonthlyChanges(15);
    setReleasesPA(6);
    setCloudHosted(true);
    setTeam(defaultTeam);
    setLocationMix(defaultLocation);
    setSlaTier("standard");
    setFts(false);
    setContingency(15);
    setAiEnabled({});
    setOppStatus("Draft");
    setNotes("");
    setSavedMsg("");
    setMainTab("estimator");
    setEstTab(0);
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  function exportCSV() {
    const id  = editingId || generateOppId();
    const rows = [
      ["Guidewire AMS Managed Service Estimate"],
      ["Opportunity ID", id],
      ["Generated", new Date().toLocaleString("en-GB")],
      [],
      ["CLIENT"],
      ["Name", client.name], ["Contact", client.contact], ["Email", client.email],
      ["Region", client.region], ["Contract Years", client.contractYears],
      ["Start Date", client.startDate], ["Reference", client.projectRef],
      ["Status", oppStatus],
      [],
      ["SCOPE"],
      ["Modules", Object.entries(modules).filter(([,v])=>v).map(([k])=>k).join("; ")],
      ["Complexity", complexity], ["Cloud Hosted", cloudHosted ? "Yes" : "No"],
      ["Integrations", integrations], ["Gosu KLOC", gosuKLOC],
      ["Monthly Tickets", monthlyTickets], ["Monthly Changes", monthlyChanges],
      ["Releases p.a.", releasesPA],
      [],
      ["FINANCIALS"],
      ["Base Monthly", fmt(baseMonthly)],
      ["Gross Monthly", fmt(grossMonthly)],
      ["AI Saving /mo", fmt(aiSavingMo)],
      ["Net Monthly", fmt(netMonthly)],
      ["Annual Cost", fmt(annualCost)],
      ["AI One-Off", fmt(aiOneOff)],
      ["TCV", fmt(tcv)],
    ];
    const csv  = rows.map(r => r.map(c => `"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `AMS_${id}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Filtered opportunities ────────────────────────────────────────────────
  const filteredOpps = opportunities.filter(o => {
    const q     = searchQ.toLowerCase();
    const matchQ = !q || o.client?.name?.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.client?.region?.toLowerCase().includes(q);
    const matchS = statusFilter === "All" || o.status === statusFilter;
    return matchQ && matchS;
  });

  // ── RENDER: Opportunities ─────────────────────────────────────────────────
  const renderOpportunities = () => (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder="🔍 Search by client, region, ID…" className="toolbar__search" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="toolbar__select">
          {["All", ...Object.keys(STATUS_COLORS)].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={newEstimate} className="btn btn--primary">+ New Estimate</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label:"Total Opportunities", value: opportunities.length,                                                                                              cls:"" },
          { label:"Total Pipeline TCV",  value: fmt(opportunities.reduce((s,o)=>s+(o.financials?.tcv||0),0)),                                                     cls:"" },
          { label:"Won",                 value: opportunities.filter(o=>o.status==="Won").length,                                                                  cls:"stat-value--green" },
          { label:"In Review",           value: opportunities.filter(o=>o.status==="In Review").length,                                                            cls:"stat-value--amber" },
          { label:"Avg TCV",             value: opportunities.length ? fmt(opportunities.reduce((s,o)=>s+(o.financials?.tcv||0),0)/opportunities.length) : "£0",  cls:"" },
        ].map(k => (
          <div key={k.label} className="card stat-card">
            <div className="stat-label">{k.label}</div>
            <div className={`stat-value ${k.cls}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Table / empty */}
      {filteredOpps.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state__icon">📁</div>
            <div className="empty-state__title">No opportunities yet</div>
            <div className="empty-state__desc">Create your first AMS estimate using the estimator</div>
            <button onClick={newEstimate} className="btn btn--primary">+ New Estimate</button>
          </div>
        </div>
      ) : (
        <div className="card card--flush">
          <table className="opp-table">
            <thead>
              <tr>
                {["Opportunity ID","Client","Region","SLA","Modules","FTE","TCV","Status","Updated","Actions"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOpps.map(o => (
                <tr key={o.id} onClick={() => setViewOpp(o)}>
                  <td className="td-id">{o.id}</td>
                  <td className="td-client">{o.client?.name || "—"}</td>
                  <td className="td-muted">{o.client?.region}</td>
                  <td className="td-muted">{o.slaTier}</td>
                  <td className="td-muted">{Object.values(o.modules||{}).filter(Boolean).length}</td>
                  <td className="td-value">{o.financials?.totalFTE}</td>
                  <td className="td-value">{fmt(o.financials?.tcv||0)}</td>
                  <td>
                    <span className="status-badge"
                      style={{ color: STATUS_COLORS[o.status]||INK_MUT, background: (STATUS_COLORS[o.status]||INK_MUT)+"22" }}>
                      {o.status}
                    </span>
                  </td>
                  <td className="td-muted" style={{ fontSize:11 }}>
                    {new Date(o.updatedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"})}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => loadOpportunity(o)} className="btn btn--outline btn--sm">Edit</button>
                      <button onClick={() => { if(window.confirm("Delete "+o.id+"?")) deleteOpportunity(o.id); }} className="btn btn--danger btn--sm">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ── RENDER: Estimator tabs ────────────────────────────────────────────────
  const renderEstTab = () => {
    switch(estTab) {

      // ── Tab 0: Client Details ─────────────────────────────────────────────
      case 0: return (
        <div className="grid-2">
          <div className="card">
            <STitle>Client Information</STitle>
            <Input label="Client / Organisation Name" value={client.name} onChange={v=>setClient({...client,name:v})} placeholder="e.g. Aviva UK"/>
            <Input label="Key Contact" value={client.contact} onChange={v=>setClient({...client,contact:v})} placeholder="e.g. Jane Smith, CTO"/>
            <Input label="Contact Email" value={client.email} onChange={v=>setClient({...client,email:v})} type="email"/>
            <Sel label="Region" value={client.region} onChange={v=>setClient({...client,region:v})}
              options={["UK","EMEA","North America","APAC","Latin America","Middle East","Australia/NZ"]}/>
            <Input label="Project / Opportunity Reference" value={client.projectRef} onChange={v=>setClient({...client,projectRef:v})} placeholder="e.g. OPP-2026-0042"/>
          </div>

          <div className="col-stack">
            <div className="card">
              <STitle>Engagement Details</STitle>
              <Sel label="Contract Duration" value={client.contractYears} onChange={v=>setClient({...client,contractYears:Number(v)})}
                options={[{value:1,label:"1 Year"},{value:2,label:"2 Years"},{value:3,label:"3 Years"},{value:5,label:"5 Years"}]}/>
              <Input label="Anticipated Start Date" value={client.startDate} onChange={v=>setClient({...client,startDate:v})} type="date"/>
              <Sel label="Opportunity Status" value={oppStatus} onChange={setOppStatus} options={Object.keys(STATUS_COLORS)}/>
            </div>

            <div className="estimate-preview">
              <div className="estimate-preview__tag">
                {editingId ? `Editing: ${editingId}` : "New Opportunity"}
              </div>
              <div className="estimate-preview__name">{client.name || "[Client Name]"}</div>
              <div className="estimate-preview__sub">{client.region} · {client.contractYears}-yr AMS</div>
              <div className="estimate-preview__tcv">
                <div className="estimate-preview__tcv-label">Estimated TCV</div>
                <div className="estimate-preview__tcv-val">{fmt(tcv)}</div>
              </div>
            </div>
          </div>
        </div>
      );

      // ── Tab 1: Application Scope ──────────────────────────────────────────
      case 1: return (
        <div className="grid-2">
          <div className="card">
            <STitle>Guidewire Modules in Scope</STitle>
            {MODULES.map(m => (
              <div key={m} className={`module-item${modules[m] ? " module-item--on" : ""}`}
                onClick={() => setModules({...modules,[m]:!modules[m]})}>
                <div className="module-checkbox">{modules[m] ? "✓" : ""}</div>
                {m}
              </div>
            ))}
            <Toggle label="Guidewire Cloud (SaaS)" sub="Reduces infrastructure scope" checked={cloudHosted} onChange={setCloudHosted}/>
          </div>

          <div className="card">
            <STitle>Complexity & Run Volumes</STitle>
            <label className="form-label">Overall Complexity</label>
            <div className="complexity-grid">
              {Object.entries(COMPLEXITY_MULT).map(([c, m]) => (
                <div key={c} className={`complexity-option${complexity===c ? " complexity-option--active" : ""}`}
                  onClick={() => setComplexity(c)}>
                  {c.charAt(0).toUpperCase()+c.slice(1)}
                  <div className="complexity-mult">×{m}</div>
                </div>
              ))}
            </div>
            <Slider label="Integrations" value={integrations} onChange={setIntegrations} min={1} max={60}/>
            <Slider label="Custom Gosu (KLOC)" value={gosuKLOC} onChange={setGosuKLOC} min={0} max={500} step={5} suffix="K"/>
            <Slider label="Monthly Tickets" value={monthlyTickets} onChange={setMonthlyTickets} min={10} max={500} step={5}/>
            <Slider label="Monthly Changes" value={monthlyChanges} onChange={setMonthlyChanges} min={1} max={100}/>
            <Slider label="Releases p.a." value={releasesPA} onChange={setReleasesPA} min={1} max={26}/>
          </div>
        </div>
      );

      // ── Tab 2: Team & Rates ───────────────────────────────────────────────
      case 2: return (
        <div className="grid-2">
          <div className="card">
            <STitle>Team Composition (FTE)</STitle>
            {ROLES.map(r => (
              <div key={r.id} className="team-row">
                <span className="team-row__label">{r.label}</span>
                <button className="team-btn" onClick={() => setTeam({...team,[r.id]:Math.max(0,+(team[r.id]||0)-0.25)})}
                  aria-label={`Decrease ${r.label}`}>−</button>
                <span className="team-value">{+(team[r.id]||0)}</span>
                <button className="team-btn" onClick={() => setTeam({...team,[r.id]:+(team[r.id]||0)+0.25})}
                  aria-label={`Increase ${r.label}`}>+</button>
              </div>
            ))}
            <div className="fte-total">
              <span className="fte-total__label">Total FTE</span>
              <span className="fte-total__value">{totalFTE.toFixed(2)}</span>
            </div>
          </div>

          <div className="card">
            <STitle>Location Mix</STitle>
            {mixTotal !== 100 && (
              <div className="mix-warning">⚠ Mix = {mixTotal}% (must total 100%)</div>
            )}
            {[{k:"onshore",l:"🇬🇧 Onshore"},{k:"nearshore",l:"🌍 Nearshore"},{k:"offshore",l:"🌏 Offshore"}].map(({k,l}) => (
              <Slider key={k} label={l} value={locationMix[k]} onChange={v=>setLocationMix({...locationMix,[k]:v})} min={0} max={100} suffix="%"/>
            ))}
            <div className="mix-bar">
              {[
                { color: NAVY,    val: locationMix.onshore    },
                { color: TEAL,    val: locationMix.nearshore  },
                { color: INK_SEC, val: locationMix.offshore   },
              ].map((seg, i) => (
                <div key={i} style={{ flex: seg.val, background: seg.color, minWidth: seg.val > 0 ? 3 : 0 }} />
              ))}
            </div>
          </div>
        </div>
      );

      // ── Tab 3: Service Levels ─────────────────────────────────────────────
      case 3: return (
        <div className="grid-2">
          <div className="card">
            <STitle>SLA Tier</STitle>
            {SLA_TIERS.map(s => (
              <div key={s.id} className={`sla-card${slaTier===s.id ? " sla-card--active" : ""}`}
                onClick={() => setSlaTier(s.id)}>
                <div className="sla-card__header">
                  <span className="sla-card__name">{s.label}</span>
                  <span className="sla-card__mult">×{s.mult}</span>
                </div>
                <div className="sla-metrics">
                  {[["P1",s.p1,"#ef4444"],["P2",s.p2,"#f59e0b"],["P3",s.p3,"#10b981"],["Avail",s.avail,NAVY]].map(([k,v,c]) => (
                    <div key={k} className="sla-metric">
                      <div className="sla-metric__key" style={{ color:c }}>{k}</div>
                      <div className="sla-metric__val">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Toggle label="Follow-the-Sun (+15%)" checked={fts} onChange={setFts}/>
          </div>

          <div className="card">
            <STitle>Contingency</STitle>
            <Slider label="Buffer %" value={contingency} onChange={setContingency} min={5} max={35} suffix="%"/>
            <div className="contingency-row">
              <span className="contingency-row__label">Monthly contingency</span>
              <span className="contingency-row__value">{fmt(contAmount)}</span>
            </div>
          </div>
        </div>
      );

      // ── Tab 4: AI Accelerators ────────────────────────────────────────────
      case 4: return (
        <div>
          <div className="cat-filters">
            {AI_CATEGORIES.map(c => (
              <button key={c} className={`cat-btn${aiCatFilter===c ? " cat-btn--active" : ""}`}
                onClick={() => setAiCatFilter(c)}>{c}</button>
            ))}
          </div>

          {selectedAI.length > 0 && (
            <div className="ai-summary">
              {[
                { l:"Selected",    v: selectedAI.length },
                { l:"Saving",      v: (aiSavingPct*100).toFixed(0)+"%" },
                { l:"Monthly Save",v: fmt(aiSavingMo) },
                { l:"Annual Save", v: fmt(aiSavingMo*12) },
                { l:"One-Off",     v: fmt(aiOneOff) },
              ].map(k => (
                <div key={k.l} className="ai-summary__item">
                  <div className="ai-summary__label">{k.l}</div>
                  <div className="ai-summary__val">{k.v}</div>
                </div>
              ))}
            </div>
          )}

          <div className="accel-grid">
            {AI_ACCELERATORS.filter(a => aiCatFilter==="All" || a.category===aiCatFilter).map(a => {
              const on = !!aiEnabled[a.id];
              const matColor = MATURITY_COLORS[a.maturity];
              return (
                <div key={a.id} className={`accel-item${on ? " accel-item--on" : ""}`}
                  onClick={() => setAiEnabled({...aiEnabled,[a.id]:!on})}>
                  <div className="accel-item__header">
                    <div className="accel-item__left">
                      <div className="accel-item__icon">{a.icon}</div>
                      <div>
                        <div className="accel-item__name">{a.label}</div>
                        <div className="accel-tags">
                          <span className="accel-tag accel-tag--cat">{a.category}</span>
                          <span className="accel-tag" style={{ color: matColor, background: matColor+"22" }}>{a.maturity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="accel-check">{on ? "✓" : ""}</div>
                  </div>
                  <p className="accel-item__desc">{a.desc}</p>
                  <div className="accel-metrics">
                    <div className={`accel-metric accel-metric--saving`}>
                      <div className="accel-metric__label">Saving</div>
                      <div className="accel-metric__val">{(a.saving*100).toFixed(0)}%</div>
                    </div>
                    <div className={`accel-metric accel-metric--cost`}>
                      <div className="accel-metric__label">One-Off</div>
                      <div className="accel-metric__val">£{(a.cost/1000).toFixed(0)}K</div>
                    </div>
                    <div className={`accel-metric accel-metric--save`}>
                      <div className="accel-metric__label">Mo Save</div>
                      <div className="accel-metric__val">{fmt(grossMonthly*a.saving)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

      // ── Tab 5: Summary & Save ─────────────────────────────────────────────
      case 5: return (
        <div>
          <div className="hero-card">
            <div className="hero-card__inner">
              <div>
                <div className="hero-card__meta">
                  {editingId ? `Opportunity: ${editingId}` : "New Opportunity — unsaved"}
                </div>
                <div className="hero-card__name">{client.name || "[Client Name]"}</div>
                <div className="hero-card__sub">
                  {client.region} · {client.contractYears}-yr · {slaTier.charAt(0).toUpperCase()+slaTier.slice(1)} SLA · {totalFTE.toFixed(1)} FTE
                </div>
                <div className="hero-card__tags">
                  <span className="hero-card__tag hero-card__tag--status">{oppStatus}</span>
                  {client.projectRef && (
                    <span className="hero-card__tag hero-card__tag--ref">Ref: {client.projectRef}</span>
                  )}
                </div>
              </div>
              <div className="hero-card__tcv">
                <div className="hero-card__tcv-label">Total Contract Value</div>
                <div className="hero-card__tcv-val">{fmt(tcv)}</div>
                <div className="hero-card__tcv-sub">{client.contractYears} years incl. AI</div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="kpi-grid">
            {[
              { l:"Net Monthly",     v: fmt(netMonthly),        cls:"" },
              { l:"Annual Cost",     v: fmt(annualCost),        cls:"" },
              { l:"AI Saving/mo",    v: fmt(aiSavingMo),        cls:"stat-value--green" },
              { l:"Total FTE",       v: totalFTE.toFixed(2),    cls:"stat-value--purple" },
              { l:"AI Accelerators", v: selectedAI.length,      cls:"stat-value--amber" },
            ].map(k => (
              <div key={k.l} className="card stat-card">
                <div className="stat-label">{k.l}</div>
                <div className={`stat-value ${k.cls}`}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Cost build-up + notes */}
          <div className="grid-2" style={{ marginBottom:20 }}>
            <div className="card">
              <STitle>Cost Build-Up</STitle>
              {[
                { l:"Base Monthly",            v: fmt(baseMonthly),  cls:"" },
                { l:`Contingency (${contingency}%)`, v: fmt(contAmount),  cls:"" },
                { l:"Gross Monthly",           v: fmt(grossMonthly), cls:"cost-row--hi" },
                { l:"AI Savings",              v: "−"+fmt(aiSavingMo), cls:"cost-row--green" },
                { l:"Net Monthly",             v: fmt(netMonthly),   cls:"cost-row--hi" },
                { l:"Annual Cost",             v: fmt(annualCost),   cls:"" },
                { l:"AI One-Off",              v: fmt(aiOneOff),     cls:"" },
                { l:`TCV (${client.contractYears}yr)`, v: fmt(tcv), cls:"cost-row--hi cost-row--big" },
              ].map(r => (
                <div key={r.l} className={`cost-row ${r.cls}`}>
                  <span className="cost-row__label">{r.l}</span>
                  <span className="cost-row__val">{r.v}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <STitle>Notes</STitle>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Internal notes, key assumptions, deal context…"
                className="form-textarea" style={{ height:120, marginBottom:14 }} />
              <Sel label="Opportunity Status" value={oppStatus} onChange={setOppStatus} options={Object.keys(STATUS_COLORS)}/>
            </div>
          </div>

          {savedMsg && <div className="save-msg">{savedMsg}</div>}

          <div className="action-row">
            <button onClick={saveOpportunity} className="btn btn--primary btn--lg">
              {editingId ? "💾 Update Opportunity" : "💾 Save Opportunity"}
            </button>
            <button onClick={exportCSV} className="btn btn--outline btn--lg">📥 Export CSV</button>
            <button onClick={() => window.print()} className="btn btn--ghost btn--lg">🖨️ Print</button>
          </div>

          <div className="footer-hint">Estimate valid 30 days · Confidential</div>
        </div>
      );

      default: return null;
    }
  };

  // ── RENDER: Modal ─────────────────────────────────────────────────────────
  const renderModal = () => {
    if (!viewOpp) return null;
    const o = viewOpp;
    return (
      <div className="modal-overlay" onClick={() => setViewOpp(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          {/* Modal hero */}
          <div className="hero-card" style={{ marginBottom:18 }}>
            <div className="hero-card__meta">{o.id}</div>
            <div className="hero-card__name">{o.client?.name}</div>
            <div className="hero-card__sub">{o.client?.region} · {o.client?.contractYears}yr · {o.slaTier} SLA</div>
            <div className="hero-card__inner" style={{ marginTop:14, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.2)" }}>
              <div>
                <div className="hero-card__tcv-label">TCV</div>
                <div className="hero-card__tcv-val">{fmt(o.financials?.tcv||0)}</div>
              </div>
              <span className="status-badge" style={{ alignSelf:"flex-end", fontSize:12, padding:"4px 14px", borderRadius:20, background: STATUS_COLORS[o.status]||INK_MUT, color:"#fff" }}>
                {o.status}
              </span>
            </div>
          </div>

          <div className="modal__meta">
            {[
              { l:"Net Monthly",  v: fmt(o.financials?.netMonthly||0) },
              { l:"Annual Cost",  v: fmt(o.financials?.annualCost||0) },
              { l:"AI Saving/mo", v: fmt(o.financials?.aiSavingMo||0) },
              { l:"Total FTE",    v: o.financials?.totalFTE },
              { l:"Modules",      v: Object.values(o.modules||{}).filter(Boolean).length },
              { l:"AI Tools",     v: Object.values(o.aiEnabled||{}).filter(Boolean).length },
            ].map(k => (
              <div key={k.l} className="modal__meta-item">
                <span className="modal__meta-label">{k.l}</span>
                <span className="modal__meta-val">{k.v}</span>
              </div>
            ))}
          </div>

          {o.notes && (
            <div className="modal__notes"><strong>Notes:</strong> {o.notes}</div>
          )}

          <div className="modal__dates">
            Created: {new Date(o.createdAt).toLocaleString("en-GB")} · Updated: {new Date(o.updatedAt).toLocaleString("en-GB")}
          </div>

          <div className="modal__actions">
            <button onClick={() => { loadOpportunity(o); setViewOpp(null); }} className="btn btn--primary">Edit Estimate</button>
            <button onClick={() => setViewOpp(null)} className="btn btn--ghost">Close</button>
          </div>
        </div>
      </div>
    );
  };

  // ── MASTER LAYOUT ─────────────────────────────────────────────────────────
  return (
    <div className="app">
      {renderModal()}

      {/* Top bar */}
      <div className="topbar">
        <div className="topbar__brand">
          <div className="topbar__logo">G</div>
          <div>
            <div className="topbar__title">GW AMS Estimator</div>
            <div className="topbar__subtitle">Opportunity Database</div>
          </div>
        </div>
        <div className="topbar__right">
          <span className="badge badge--outline">{opportunities.length} Opportunities</span>
          <span className="badge badge--navy">
            Pipeline: {fmt(opportunities.reduce((s,o)=>s+(o.financials?.tcv||0),0))}
          </span>
        </div>
      </div>

      {/* Main nav */}
      <div className="main-nav">
        {MAIN_TABS.map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            className={`main-nav__tab${mainTab===t.id ? " main-nav__tab--active" : ""}`}>
            {t.label}
          </button>
        ))}
        {mainTab === "estimator" && editingId && (
          <div className="main-nav__editing">
            Editing: <strong>{editingId}</strong>
          </div>
        )}
      </div>

      {/* Estimator sub-tabs */}
      {mainTab === "estimator" && (
        <div className="sub-nav">
          {EST_TABS.map(t => (
            <button key={t.id} onClick={() => setEstTab(t.id)}
              className={`sub-nav__tab${estTab===t.id ? " sub-nav__tab--active" : ""}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="content">
        {mainTab === "opportunities" ? renderOpportunities() : renderEstTab()}
      </div>

      {/* Footer nav (estimator only) */}
      {mainTab === "estimator" && (
        <div className="footer-nav">
          <button onClick={() => setEstTab(Math.max(0, estTab-1))} disabled={estTab===0}
            className="btn btn--outline">← Prev</button>
          <div className="footer-nav__dots">
            {EST_TABS.map((_, i) => (
              <div key={i} onClick={() => setEstTab(i)}
                className={`footer-nav__dot${estTab===i ? " footer-nav__dot--active" : ""}`}
                style={{ width: estTab===i ? 22 : 8 }} />
            ))}
          </div>
          <button onClick={() => estTab < EST_TABS.length-1 ? setEstTab(estTab+1) : saveOpportunity()}
            className="btn btn--primary">
            {estTab === EST_TABS.length-1 ? "💾 Save" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}
