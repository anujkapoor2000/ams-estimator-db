import { useState, useCallback, useEffect } from "react";
import { storage } from "./storage.js";

const NTT_BLUE  = "#003087";
const NTT_RED   = "#E4002B";
const NTT_LIGHT = "#E8EEF7";
const GRAY      = "#6B7280";
const MONO      = "'IBM Plex Mono','Courier New',monospace";
const SANS      = "'IBM Plex Sans','Segoe UI',sans-serif";

// ── Data ─────────────────────────────────────────────────────────────────────
const ROLES = [
  { id:"gw_lead",   label:"GW Technical Lead",     onshore:850,  nearshore:480, offshore:320 },
  { id:"gw_config", label:"GW Config Developer",   onshore:650,  nearshore:380, offshore:250 },
  { id:"gw_int",    label:"GW Integration Dev",    onshore:750,  nearshore:420, offshore:280 },
  { id:"gw_ba",     label:"GW Business Analyst",   onshore:700,  nearshore:400, offshore:260 },
  { id:"jutro",     label:"Jutro / UI Developer",  onshore:680,  nearshore:390, offshore:255 },
  { id:"qa_lead",   label:"QA Lead",               onshore:700,  nearshore:400, offshore:260 },
  { id:"qa_eng",    label:"QA Engineer",           onshore:550,  nearshore:300, offshore:200 },
  { id:"devops",    label:"DevOps / Cloud Eng",    onshore:780,  nearshore:440, offshore:290 },
  { id:"svc_mgr",   label:"Service Manager",       onshore:850,  nearshore:480, offshore:320 },
  { id:"arch",      label:"Solution Architect",    onshore:950,  nearshore:540, offshore:360 },
];

const COMPLEXITY_MULT = { low:0.75, medium:1.0, high:1.45, critical:1.9 };

const AI_ACCELERATORS = [
  { id:"ai_testing",   label:"AI-Based Test Automation",     icon:"🤖", category:"Quality",           saving:0.30, cost:25000, desc:"Self-healing scripts, AI-driven regression, anomaly detection.",          capabilities:["Auto-generate test cases","Self-healing locators","AI regression prioritisation","Defect prediction"],effort:"4–6 wks",maturity:"Production Ready" },
  { id:"tech_debt",    label:"Tech Debt Radar",              icon:"🔍", category:"Code Quality",       saving:0.20, cost:15000, desc:"300+ Gosu anti-pattern library. Surfaces refactoring priorities.",        capabilities:["300+ anti-pattern detection","Complexity heat maps","Upgrade risk scoring","Debt backlog generation"],effort:"2–3 wks",maturity:"Production Ready" },
  { id:"req_analyser", label:"Requirements Analyser",        icon:"📋", category:"Delivery",           saving:0.15, cost:12000, desc:"NLP BRD parser mapping requirements to GW OOTB capabilities.",            capabilities:["BRD-to-GW mapping","Gap & risk flagging","Auto acceptance criteria","Story point assist"],effort:"3–4 wks",maturity:"Production Ready" },
  { id:"datahub",      label:"Test DataHub & CDA Masking",   icon:"🛡️", category:"Compliance",         saving:0.10, cost:18000, desc:"AI-generated synthetic test data with GDPR/CDA masking.",                capabilities:["Synthetic data generation","GDPR/CDA masking","Referential integrity","On-demand provisioning"],effort:"3–5 wks",maturity:"Production Ready" },
  { id:"gosu_copilot", label:"Gosu Copilot",                 icon:"⚡", category:"Dev Productivity",   saving:0.25, cost:20000, desc:"AI pair programmer for Gosu/PCF — inline suggestions, deprecated API detection.", capabilities:["Gosu code completion","PCF generation assist","Deprecated API detection","Version compatibility"],effort:"2–4 wks",maturity:"Beta" },
  { id:"incident_ai",  label:"Incident Intelligence Engine", icon:"🚨", category:"Operations",         saving:0.22, cost:22000, desc:"ML model for auto-classification, smart routing and MTTR analytics.",    capabilities:["Auto-classify P1–P4","Smart team routing","Similar incident recall","MTTR analytics"],effort:"6–8 wks",maturity:"Beta" },
  { id:"release_ai",   label:"Release Risk Predictor",       icon:"🚀", category:"DevOps",             saving:0.18, cost:16000, desc:"Risk-scores releases from git diff, coverage delta and history.",         capabilities:["Pre-release risk score","Regression scope recommendation","Rollback probability","Calendar optimisation"],effort:"4–6 wks",maturity:"Beta" },
  { id:"ootb_scorer",  label:"OOTB Utilisation Scorer",      icon:"📊", category:"Governance",         saving:0.12, cost:10000, desc:"Scans config layer for OOTB vs custom ratio per module.",                 capabilities:["OOTB vs custom ratio","Upgrade impact preview","Config health score","Refactor recommendations"],effort:"2–3 wks",maturity:"Production Ready" },
  { id:"renewal_ai",   label:"Renewal Risk Scorer",          icon:"🔄", category:"Business Intel",     saving:0.08, cost:14000, desc:"Propensity model predicting policy renewal likelihood.",                  capabilities:["Renewal propensity scoring","Churn risk segmentation","Automated broker alerts","PolicyCenter API integration"],effort:"6–10 wks",maturity:"PoC Available" },
  { id:"knowledge_ai", label:"AMS Knowledge Assistant",      icon:"💬", category:"Service Desk",       saving:0.20, cost:18000, desc:"RAG chatbot over runbooks, KEDBs and GW docs for L1/L2 self-service.",    capabilities:["RAG over runbooks","GW documentation Q&A","Ticket deflection","Escalation handoff"],effort:"4–6 wks",maturity:"Beta" },
];

const SLA_TIERS = [
  { id:"standard", label:"Standard",  p1:"4hr",  p2:"8hr",  p3:"2BD", avail:"99.5%",  mult:1.0  },
  { id:"enhanced", label:"Enhanced",  p1:"2hr",  p2:"4hr",  p3:"1BD", avail:"99.9%",  mult:1.25 },
  { id:"premium",  label:"Premium",   p1:"1hr",  p2:"2hr",  p3:"4hr", avail:"99.95%", mult:1.55 },
];

const MODULES = ["PolicyCenter","ClaimCenter","BillingCenter","CustomerEngage","ProducerEngage","ServiceRepEngage","Analytics / DWH"];
const MATURITY_COLORS = { "Production Ready":"#16A34A", "Beta":"#D97706", "PoC Available":"#7C3AED" };
const STATUS_COLORS   = { "Draft":"#6B7280", "In Review":"#D97706", "Submitted":"#003087", "Won":"#16A34A", "Lost":"#DC2626" };
const AI_CATEGORIES   = ["All","Quality","Developer Productivity","Operations","DevOps","Compliance","Code Quality","Delivery","Governance","Business Intelligence","Service Desk"];

const MAIN_TABS = [
  { id:"opportunities", label:"📁 Opportunities",   icon:"📁" },
  { id:"estimator",     label:"🧮 New Estimate",     icon:"🧮" },
];

const EST_TABS = [
  { id:0, label:"Client Details",    icon:"🏢" },
  { id:1, label:"Application Scope", icon:"📦" },
  { id:2, label:"Team & Rates",      icon:"👥" },
  { id:3, label:"Service Levels",    icon:"📋" },
  { id:4, label:"AI Accelerators",   icon:"🤖" },
  { id:5, label:"Summary & Save",    icon:"💾" },
];

// ── Unique ID generator ───────────────────────────────────────────────────────
function generateOppId() {
  const year   = new Date().getFullYear();
  const month  = String(new Date().getMonth() + 1).padStart(2, "0");
  const rand   = Math.floor(Math.random() * 9000) + 1000;
  return `NTT-AMS-${year}${month}-${rand}`;
}

// ── Format ────────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1_000_000) return "£" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return "£" + Math.round(n / 1_000) + "K";
  return "£" + Math.round(n);
}

// ── Default state ─────────────────────────────────────────────────────────────
const defaultClient      = { name:"", contact:"", email:"", region:"UK", contractYears:3, startDate:"", projectRef:"" };
const defaultModules     = { PolicyCenter:true, ClaimCenter:true, BillingCenter:true };
const defaultTeam        = { gw_lead:1, gw_config:2, gw_int:1, gw_ba:1, jutro:0, qa_lead:1, qa_eng:1, devops:1, svc_mgr:0.5, arch:0.25 };
const defaultLocation    = { onshore:30, nearshore:40, offshore:30 };

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [mainTab,      setMainTab]      = useState("opportunities");
  const [estTab,       setEstTab]       = useState(0);
  const [opportunities, setOpportunities] = useState([]);
  const [editingId,    setEditingId]    = useState(null);   // null = new
  const [aiCatFilter,  setAiCatFilter]  = useState("All");
  const [searchQ,      setSearchQ]      = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewOpp,      setViewOpp]      = useState(null);   // detail modal

  // Estimator form state
  const [client,       setClient]       = useState(defaultClient);
  const [modules,      setModules]      = useState(defaultModules);
  const [complexity,   setComplexity]   = useState("medium");
  const [integrations, setIntegrations] = useState(8);
  const [gosuKLOC,     setGosuKLOC]     = useState(50);
  const [monthlyTickets,setMonthlyTickets]=useState(80);
  const [monthlyChanges,setMonthlyChanges]=useState(15);
  const [releasesPA,   setReleasesPA]   = useState(6);
  const [cloudHosted,  setCloudHosted]  = useState(true);
  const [team,         setTeam]         = useState(defaultTeam);
  const [locationMix,  setLocationMix]  = useState(defaultLocation);
  const [slaTier,      setSlaTier]      = useState("standard");
  const [fts,          setFts]          = useState(false);
  const [contingency,  setContingency]  = useState(15);
  const [aiEnabled,    setAiEnabled]    = useState({});
  const [oppStatus,    setOppStatus]    = useState("Draft");
  const [notes,        setNotes]        = useState("");
  const [savedMsg,     setSavedMsg]     = useState("");

  // ── Load from storage on mount ────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const result = await storage.get("ams_opportunities");
        if (result && result.value) {
          setOpportunities(JSON.parse(result.value));
        }
      } catch {
        // first run — no data yet
      }
    }
    load();
  }, []);

  // ── Calculations ──────────────────────────────────────────────────────────
  const workingDaysPerMonth = 21.7;
  const totalFTE = Object.values(team).reduce((a, b) => a + b, 0);
  const sla      = SLA_TIERS.find(s => s.id === slaTier);
  const compMult = COMPLEXITY_MULT[complexity];
  const ftsMult  = fts ? 1.15 : 1.0;

  const blendedDaily = useCallback(() =>
    ROLES.reduce((sum, r) => {
      const fte  = team[r.id] || 0;
      const rate = (r.onshore * locationMix.onshore + r.nearshore * locationMix.nearshore + r.offshore * locationMix.offshore) / 100;
      return sum + fte * rate;
    }, 0)
  , [team, locationMix]);

  const baseMonthly   = blendedDaily() * workingDaysPerMonth * compMult * sla.mult * ftsMult;
  const contAmount    = baseMonthly * (contingency / 100);
  const grossMonthly  = baseMonthly + contAmount;
  const selectedAI    = AI_ACCELERATORS.filter(a => aiEnabled[a.id]);
  const aiSavingPct   = Math.min(selectedAI.reduce((s, a) => s + a.saving, 0), 0.65);
  const aiSavingMo    = grossMonthly * aiSavingPct;
  const aiOneOff      = selectedAI.reduce((s, a) => s + a.cost, 0);
  const netMonthly    = grossMonthly - aiSavingMo;
  const annualCost    = netMonthly * 12;
  const tcv           = annualCost * client.contractYears + aiOneOff;
  const moduleCount   = Object.values(modules).filter(Boolean).length;
  const mixTotal      = locationMix.onshore + locationMix.nearshore + locationMix.offshore;

  // ── Build snapshot for saving ─────────────────────────────────────────────
  function buildSnapshot(id) {
    return {
      id,
      oppId:          id,
      status:         oppStatus,
      notes,
      createdAt:      new Date().toISOString(),
      updatedAt:      new Date().toISOString(),
      client:         { ...client },
      modules:        { ...modules },
      complexity,
      integrations,
      gosuKLOC,
      monthlyTickets,
      monthlyChanges,
      releasesPA,
      cloudHosted,
      team:           { ...team },
      locationMix:    { ...locationMix },
      slaTier,
      fts,
      contingency,
      aiEnabled:      { ...aiEnabled },
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
    const id  = editingId || generateOppId();
    const snap = buildSnapshot(id);
    if (editingId) {
      snap.createdAt = opportunities.find(o => o.id === editingId)?.createdAt || snap.createdAt;
    }
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

  // ── Load opportunity into form ────────────────────────────────────────────
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
    const id = editingId || generateOppId();
    const rows = [
      ["NTT DATA — Guidewire AMS Managed Service Estimate"],
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
      ["Complexity", complexity], ["Cloud Hosted", cloudHosted?"Yes":"No"],
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

  // ── UI helpers ────────────────────────────────────────────────────────────
  const Card = ({ children, style={} }) => (
    <div style={{ background:"#fff", borderRadius:10, border:"1px solid #E5E7EB", padding:18, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", ...style }}>{children}</div>
  );

  const STitle = ({ children }) => (
    <div style={{ fontSize:10, fontWeight:800, color:NTT_BLUE, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12, paddingBottom:6, borderBottom:`2px solid ${NTT_BLUE}` }}>{children}</div>
  );

  const Label = ({ children }) => (
    <div style={{ fontSize:10, fontWeight:700, color:GRAY, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{children}</div>
  );

  const Input = ({ label, value, onChange, type="text", placeholder="" }) => (
    <div style={{ marginBottom:14 }}>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", padding:"9px 11px", border:"1.5px solid #D1D5DB", borderRadius:7, fontSize:13, color:"#111827", background:"#fff", fontFamily:SANS }} />
    </div>
  );

  const Sel = ({ label, value, onChange, options }) => (
    <div style={{ marginBottom:14 }}>
      <Label>{label}</Label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width:"100%", padding:"9px 11px", border:"1.5px solid #D1D5DB", borderRadius:7, fontSize:13, color:"#111827", background:"#fff", fontFamily:SANS }}>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
    </div>
  );

  const Slider = ({ label, value, onChange, min, max, step=1, suffix="" }) => (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <Label>{label}</Label>
        <span style={{ fontSize:13, fontWeight:800, color:NTT_BLUE, fontFamily:MONO }}>{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width:"100%", accentColor:NTT_BLUE }} />
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#9CA3AF", marginTop:2 }}>
        <span>{min}{suffix}</span><span>{max}{suffix}</span>
      </div>
    </div>
  );

  const Toggle = ({ label, checked, onChange, sub }) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, padding:"8px 10px", background:checked ? NTT_LIGHT:"#F9FAFB", borderRadius:7, cursor:"pointer", border:`1px solid ${checked ? NTT_BLUE:"#E5E7EB"}` }}
      onClick={() => onChange(!checked)}>
      <div style={{ width:40, height:22, borderRadius:11, background:checked ? NTT_BLUE:"#D1D5DB", flexShrink:0, position:"relative", transition:"background 0.2s" }}>
        <div style={{ position:"absolute", top:3, left:checked ? 20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
      </div>
      <div>
        <div style={{ fontSize:13, color:checked ? NTT_BLUE:"#374151", fontWeight:600 }}>{label}</div>
        {sub && <div style={{ fontSize:10, color:"#9CA3AF" }}>{sub}</div>}
      </div>
    </div>
  );

  // ── OPPORTUNITIES LIST ────────────────────────────────────────────────────
  const filteredOpps = opportunities.filter(o => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || o.client?.name?.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.client?.region?.toLowerCase().includes(q);
    const matchS = statusFilter === "All" || o.status === statusFilter;
    return matchQ && matchS;
  });

  const renderOpportunities = () => (
    <div>
      {/* Toolbar */}
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center" }}>
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="🔍 Search by client, region, ID..."
          style={{ flex:1, minWidth:200, padding:"9px 12px", border:"1.5px solid #D1D5DB", borderRadius:7, fontSize:13, fontFamily:SANS }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding:"9px 12px", border:"1.5px solid #D1D5DB", borderRadius:7, fontSize:13, fontFamily:SANS }}>
          {["All", ...Object.keys(STATUS_COLORS)].map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={newEstimate}
          style={{ padding:"9px 18px", background:NTT_BLUE, color:"#fff", border:"none", borderRadius:7, fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:SANS }}>
          + New Estimate
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:18 }}>
        {[
          { label:"Total Opportunities", value:opportunities.length, color:NTT_BLUE },
          { label:"Total Pipeline TCV",  value:fmt(opportunities.reduce((s,o)=>s+(o.financials?.tcv||0),0)), color:NTT_BLUE },
          { label:"Won",                 value:opportunities.filter(o=>o.status==="Won").length, color:"#16A34A" },
          { label:"In Review",           value:opportunities.filter(o=>o.status==="In Review").length, color:"#D97706" },
          { label:"Avg TCV",             value:opportunities.length ? fmt(opportunities.reduce((s,o)=>s+(o.financials?.tcv||0),0)/opportunities.length) : "£0", color:NTT_BLUE },
        ].map(k => (
          <Card key={k.label} style={{ textAlign:"center", padding:"12px 8px" }}>
            <div style={{ fontSize:9, color:GRAY, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{k.label}</div>
            <div style={{ fontSize:18, fontWeight:900, color:k.color, fontFamily:MONO }}>{k.value}</div>
          </Card>
        ))}
      </div>

      {/* Opportunities table */}
      {filteredOpps.length === 0 ? (
        <Card style={{ textAlign:"center", padding:40 }}>
          <div style={{ fontSize:32, marginBottom:10 }}>📁</div>
          <div style={{ fontSize:16, fontWeight:700, color:NTT_BLUE, marginBottom:6 }}>No opportunities yet</div>
          <div style={{ fontSize:13, color:GRAY, marginBottom:16 }}>Create your first AMS estimate using the estimator</div>
          <button onClick={newEstimate}
            style={{ padding:"10px 22px", background:NTT_BLUE, color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontFamily:SANS }}>
            + New Estimate
          </button>
        </Card>
      ) : (
        <Card style={{ padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:NTT_LIGHT }}>
                {["Opportunity ID","Client","Region","SLA","Modules","FTE","TCV","Status","Updated","Actions"].map(h => (
                  <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontWeight:800, color:NTT_BLUE, fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`2px solid ${NTT_BLUE}`, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOpps.map((o, i) => (
                <tr key={o.id} style={{ background:i%2===0?"#fff":"#F9FAFB", cursor:"pointer" }}
                  onClick={() => setViewOpp(o)}>
                  <td style={{ padding:"10px 12px", fontFamily:MONO, fontSize:11, color:NTT_BLUE, fontWeight:700 }}>{o.id}</td>
                  <td style={{ padding:"10px 12px", fontWeight:600, color:"#111827" }}>{o.client?.name || "—"}</td>
                  <td style={{ padding:"10px 12px", color:GRAY }}>{o.client?.region}</td>
                  <td style={{ padding:"10px 12px", color:GRAY }}>{o.slaTier}</td>
                  <td style={{ padding:"10px 12px", color:GRAY }}>{Object.values(o.modules||{}).filter(Boolean).length}</td>
                  <td style={{ padding:"10px 12px", fontFamily:MONO, color:NTT_BLUE, fontWeight:700 }}>{o.financials?.totalFTE}</td>
                  <td style={{ padding:"10px 12px", fontFamily:MONO, fontWeight:800, color:NTT_BLUE }}>{fmt(o.financials?.tcv||0)}</td>
                  <td style={{ padding:"10px 12px" }}>
                    <span style={{ fontSize:10, fontWeight:800, color:STATUS_COLORS[o.status]||GRAY, background:(STATUS_COLORS[o.status]||GRAY)+"20", padding:"2px 8px", borderRadius:10 }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding:"10px 12px", color:GRAY, fontSize:11 }}>{new Date(o.updatedAt).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"})}</td>
                  <td style={{ padding:"10px 12px" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => loadOpportunity(o)}
                        style={{ padding:"3px 9px", background:NTT_LIGHT, color:NTT_BLUE, border:`1px solid ${NTT_BLUE}40`, borderRadius:5, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:SANS }}>
                        Edit
                      </button>
                      <button onClick={() => { if(window.confirm("Delete "+o.id+"?")) deleteOpportunity(o.id); }}
                        style={{ padding:"3px 9px", background:"#FEE2E2", color:"#DC2626", border:"1px solid #DC262630", borderRadius:5, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:SANS }}>
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );

  // ── ESTIMATOR TABS ────────────────────────────────────────────────────────
  const renderEstTab = () => {
    switch(estTab) {
      case 0: return (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Card>
            <STitle>Client Information</STitle>
            <Input label="Client / Organisation Name" value={client.name} onChange={v=>setClient({...client,name:v})} placeholder="e.g. Aviva UK"/>
            <Input label="Key Contact" value={client.contact} onChange={v=>setClient({...client,contact:v})} placeholder="e.g. Jane Smith, CTO"/>
            <Input label="Contact Email" value={client.email} onChange={v=>setClient({...client,email:v})} type="email"/>
            <Sel label="Region" value={client.region} onChange={v=>setClient({...client,region:v})}
              options={["UK","EMEA","North America","APAC","Latin America","Middle East","Australia/NZ"]}/>
            <Input label="Project / Opportunity Reference" value={client.projectRef} onChange={v=>setClient({...client,projectRef:v})} placeholder="e.g. OPP-2026-0042"/>
          </Card>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Card>
              <STitle>Engagement Details</STitle>
              <Sel label="Contract Duration" value={client.contractYears} onChange={v=>setClient({...client,contractYears:Number(v)})}
                options={[{value:1,label:"1 Year"},{value:2,label:"2 Years"},{value:3,label:"3 Years"},{value:5,label:"5 Years"}]}/>
              <Input label="Anticipated Start Date" value={client.startDate} onChange={v=>setClient({...client,startDate:v})} type="date"/>
              <Sel label="Opportunity Status" value={oppStatus} onChange={setOppStatus}
                options={Object.keys(STATUS_COLORS)}/>
            </Card>
            <Card style={{ background:`linear-gradient(135deg,${NTT_BLUE},#00509E)`, color:"#fff", border:"none" }}>
              <div style={{ fontSize:10, opacity:0.65, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>
                {editingId ? `Editing: ${editingId}` : "New Opportunity"}
              </div>
              <div style={{ fontSize:18, fontWeight:900 }}>{client.name || "[Client Name]"}</div>
              <div style={{ fontSize:12, opacity:0.75, marginTop:4 }}>{client.region} · {client.contractYears}-yr AMS</div>
              <div style={{ marginTop:12, borderTop:"1px solid rgba(255,255,255,0.2)", paddingTop:12 }}>
                <div style={{ fontSize:10, opacity:0.65 }}>Estimated TCV</div>
                <div style={{ fontSize:26, fontWeight:900, fontFamily:MONO }}>{fmt(tcv)}</div>
              </div>
            </Card>
          </div>
        </div>
      );

      case 1: return (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Card>
            <STitle>Guidewire Modules in Scope</STitle>
            {MODULES.map(m => (
              <div key={m} onClick={() => setModules({...modules,[m]:!modules[m]})}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", marginBottom:6, borderRadius:7, cursor:"pointer",
                  background:modules[m] ? NTT_BLUE:"#F9FAFB", border:`1.5px solid ${modules[m] ? NTT_BLUE:"#E5E7EB"}` }}>
                <div style={{ width:17, height:17, borderRadius:4, background:modules[m] ? "rgba(255,255,255,0.2)":"#E5E7EB", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {modules[m] && <span style={{ color:"#fff", fontSize:11, fontWeight:900 }}>✓</span>}
                </div>
                <span style={{ fontSize:13, fontWeight:600, color:modules[m] ? "#fff":"#374151" }}>{m}</span>
              </div>
            ))}
            <Toggle label="Guidewire Cloud (SaaS)" sub="Reduces infrastructure scope" checked={cloudHosted} onChange={setCloudHosted}/>
          </Card>
          <Card>
            <STitle>Complexity & Run Volumes</STitle>
            <div style={{ marginBottom:16 }}>
              <Label>Overall Complexity</Label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {Object.entries(COMPLEXITY_MULT).map(([c, m]) => (
                  <div key={c} onClick={() => setComplexity(c)}
                    style={{ padding:"9px 12px", borderRadius:7, cursor:"pointer", textAlign:"center", fontWeight:700, fontSize:12,
                      background:complexity===c ? NTT_BLUE:"#F9FAFB", color:complexity===c ? "#fff":"#374151",
                      border:`1.5px solid ${complexity===c ? NTT_BLUE:"#E5E7EB"}` }}>
                    {c.charAt(0).toUpperCase()+c.slice(1)}
                    <div style={{ fontSize:10, fontWeight:400, opacity:0.75 }}>×{m}</div>
                  </div>
                ))}
              </div>
            </div>
            <Slider label="Integrations" value={integrations} onChange={setIntegrations} min={1} max={60}/>
            <Slider label="Custom Gosu (KLOC)" value={gosuKLOC} onChange={setGosuKLOC} min={0} max={500} step={5} suffix="K"/>
            <Slider label="Monthly Tickets" value={monthlyTickets} onChange={setMonthlyTickets} min={10} max={500} step={5}/>
            <Slider label="Monthly Changes" value={monthlyChanges} onChange={setMonthlyChanges} min={1} max={100}/>
            <Slider label="Releases p.a." value={releasesPA} onChange={setReleasesPA} min={1} max={26}/>
          </Card>
        </div>
      );

      case 2: return (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Card>
            <STitle>Team Composition (FTE)</STitle>
            {ROLES.map(r => (
              <div key={r.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9, padding:"6px 8px", borderRadius:6, background:"#F9FAFB" }}>
                <div style={{ flex:1, fontSize:12, color:"#374151" }}>{r.label}</div>
                <button onClick={() => setTeam({...team,[r.id]:Math.max(0,+(team[r.id]||0)-0.25)})}
                  style={{ width:26,height:26,borderRadius:5,border:"1px solid #D1D5DB",background:"#fff",cursor:"pointer",fontSize:16,fontFamily:SANS }}>−</button>
                <span style={{ width:36,textAlign:"center",fontWeight:800,fontSize:13,color:NTT_BLUE,fontFamily:MONO }}>{+(team[r.id]||0)}</span>
                <button onClick={() => setTeam({...team,[r.id]:+(team[r.id]||0)+0.25})}
                  style={{ width:26,height:26,borderRadius:5,border:"1px solid #D1D5DB",background:"#fff",cursor:"pointer",fontSize:16,fontFamily:SANS }}>+</button>
              </div>
            ))}
            <div style={{ padding:"10px 14px", background:NTT_LIGHT, borderRadius:8, display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:11, color:GRAY, fontWeight:700 }}>TOTAL FTE</span>
              <span style={{ fontSize:20, fontWeight:900, color:NTT_BLUE, fontFamily:MONO }}>{totalFTE.toFixed(2)}</span>
            </div>
          </Card>
          <Card>
            <STitle>Location Mix</STitle>
            {!( mixTotal===100) && <div style={{ padding:"6px 10px",background:"#FEF3C7",borderRadius:6,marginBottom:10,fontSize:11,color:"#92400E",fontWeight:600 }}>⚠ Mix = {mixTotal}% (must be 100%)</div>}
            {[{k:"onshore",l:"🇬🇧 Onshore"},{k:"nearshore",l:"🌍 Nearshore"},{k:"offshore",l:"🌏 Offshore"}].map(({k,l}) => (
              <Slider key={k} label={l} value={locationMix[k]} onChange={v=>setLocationMix({...locationMix,[k]:v})} min={0} max={100} suffix="%"/>
            ))}
            <div style={{ display:"flex",height:12,borderRadius:6,overflow:"hidden",marginTop:4 }}>
              {[["003087",locationMix.onshore],["E4002B",locationMix.nearshore],["6B7280",locationMix.offshore]].map(([c,v],i) => (
                <div key={i} style={{ flex:v, background:`#${c}`, minWidth:v>0?3:0 }}/>
              ))}
            </div>
          </Card>
        </div>
      );

      case 3: return (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
          <Card>
            <STitle>SLA Tier</STitle>
            {SLA_TIERS.map(s => (
              <div key={s.id} onClick={() => setSlaTier(s.id)}
                style={{ padding:14,borderRadius:9,marginBottom:10,cursor:"pointer",border:`2px solid ${slaTier===s.id ? NTT_BLUE:"#E5E7EB"}`,background:slaTier===s.id ? NTT_LIGHT:"#fff" }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                  <span style={{ fontWeight:800,fontSize:14,color:slaTier===s.id ? NTT_BLUE:"#111827" }}>{s.label}</span>
                  <span style={{ fontSize:11,fontWeight:700,color:"#fff",background:slaTier===s.id ? NTT_BLUE:"#9CA3AF",padding:"2px 10px",borderRadius:12 }}>×{s.mult}</span>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5 }}>
                  {[["P1",s.p1,"#EF4444"],["P2",s.p2,"#F59E0B"],["P3",s.p3,"#10B981"],["Avail",s.avail,NTT_BLUE]].map(([k,v,c]) => (
                    <div key={k} style={{ textAlign:"center",padding:"6px 4px",background:"#fff",borderRadius:6,border:"1px solid #E5E7EB" }}>
                      <div style={{ fontSize:9,color:c,fontWeight:800 }}>{k}</div>
                      <div style={{ fontSize:12,fontWeight:800,color:"#111827",fontFamily:MONO }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Toggle label="Follow-the-Sun (+15%)" checked={fts} onChange={setFts}/>
          </Card>
          <Card>
            <STitle>Contingency</STitle>
            <Slider label="Buffer %" value={contingency} onChange={setContingency} min={5} max={35} suffix="%"/>
            <div style={{ padding:"8px 12px",background:NTT_LIGHT,borderRadius:7,display:"flex",justifyContent:"space-between" }}>
              <span style={{ fontSize:12,color:GRAY }}>Monthly contingency</span>
              <span style={{ fontSize:14,fontWeight:800,color:NTT_BLUE,fontFamily:MONO }}>{fmt(contAmount)}</span>
            </div>
          </Card>
        </div>
      );

      case 4: return (
        <div>
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:14 }}>
            {AI_CATEGORIES.map(c => (
              <button key={c} onClick={() => setAiCatFilter(c)}
                style={{ padding:"4px 12px",borderRadius:16,border:`1.5px solid ${aiCatFilter===c ? NTT_BLUE:"#E5E7EB"}`,
                  background:aiCatFilter===c ? NTT_BLUE:"#fff",color:aiCatFilter===c ? "#fff":GRAY,
                  fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:SANS }}>
                {c}
              </button>
            ))}
          </div>
          {selectedAI.length > 0 && (
            <div style={{ background:`linear-gradient(135deg,${NTT_BLUE},#00509E)`,borderRadius:10,padding:"14px 18px",marginBottom:14,display:"flex",justifyContent:"space-around",color:"#fff" }}>
              {[{l:"Selected",v:selectedAI.length},{l:"Saving",v:(aiSavingPct*100).toFixed(0)+"%"},{l:"Monthly Save",v:fmt(aiSavingMo)},{l:"Annual Save",v:fmt(aiSavingMo*12)},{l:"One-Off",v:fmt(aiOneOff)}].map(k => (
                <div key={k.l} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:9,opacity:0.65,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2 }}>{k.l}</div>
                  <div style={{ fontSize:18,fontWeight:900,fontFamily:MONO }}>{k.v}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            {AI_ACCELERATORS.filter(a => aiCatFilter==="All" || a.category===aiCatFilter).map(a => {
              const on = !!aiEnabled[a.id];
              return (
                <div key={a.id} onClick={() => setAiEnabled({...aiEnabled,[a.id]:!on})}
                  style={{ background:"#fff",borderRadius:10,padding:14,cursor:"pointer",
                    border:`2px solid ${on ? NTT_BLUE:"#E5E7EB"}`,boxShadow:on ? `0 4px 12px ${NTT_BLUE}20`:"0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontSize:20 }}>{a.icon}</span>
                      <div>
                        <div style={{ fontWeight:800,fontSize:12,color:on ? NTT_BLUE:"#111827" }}>{a.label}</div>
                        <div style={{ display:"flex",gap:4,marginTop:2 }}>
                          <span style={{ fontSize:8,fontWeight:700,color:"#fff",background:GRAY,padding:"1px 6px",borderRadius:8 }}>{a.category}</span>
                          <span style={{ fontSize:8,fontWeight:700,color:MATURITY_COLORS[a.maturity],background:MATURITY_COLORS[a.maturity]+"20",padding:"1px 6px",borderRadius:8 }}>{a.maturity}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ width:20,height:20,borderRadius:4,border:`2px solid ${on ? NTT_BLUE:"#D1D5DB"}`,background:on ? NTT_BLUE:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      {on && <span style={{ color:"#fff",fontSize:11,fontWeight:900 }}>✓</span>}
                    </div>
                  </div>
                  <p style={{ fontSize:10,color:GRAY,marginBottom:8,lineHeight:1.5 }}>{a.desc}</p>
                  <div style={{ display:"flex",gap:5 }}>
                    <div style={{ flex:1,textAlign:"center",padding:"5px 3px",background:on ? "#DCFCE7":"#F3F4F6",borderRadius:5 }}>
                      <div style={{ fontSize:8,color:GRAY,fontWeight:700 }}>SAVING</div>
                      <div style={{ fontSize:13,fontWeight:900,color:on ? "#16A34A":GRAY,fontFamily:MONO }}>{(a.saving*100).toFixed(0)}%</div>
                    </div>
                    <div style={{ flex:1,textAlign:"center",padding:"5px 3px",background:on ? NTT_LIGHT:"#F3F4F6",borderRadius:5 }}>
                      <div style={{ fontSize:8,color:GRAY,fontWeight:700 }}>ONE-OFF</div>
                      <div style={{ fontSize:13,fontWeight:900,color:on ? NTT_BLUE:GRAY,fontFamily:MONO }}>£{(a.cost/1000).toFixed(0)}K</div>
                    </div>
                    <div style={{ flex:1,textAlign:"center",padding:"5px 3px",background:on ? "#FEF9C3":"#F3F4F6",borderRadius:5 }}>
                      <div style={{ fontSize:8,color:GRAY,fontWeight:700 }}>MO SAVE</div>
                      <div style={{ fontSize:13,fontWeight:900,color:on ? "#B45309":GRAY,fontFamily:MONO }}>{fmt(grossMonthly*a.saving)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

      case 5: return (
        <div>
          {/* Hero */}
          <div style={{ background:`linear-gradient(135deg,${NTT_BLUE},#00509E)`,borderRadius:12,padding:22,marginBottom:18,color:"#fff" }}>
            <div style={{ display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12 }}>
              <div>
                <div style={{ fontSize:10,opacity:0.6,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4 }}>
                  {editingId ? `Opportunity: ${editingId}` : "New Opportunity — unsaved"}
                </div>
                <div style={{ fontSize:22,fontWeight:900 }}>{client.name || "[Client Name]"}</div>
                <div style={{ fontSize:12,opacity:0.75,marginTop:3 }}>{client.region} · {client.contractYears}-yr · {slaTier.charAt(0).toUpperCase()+slaTier.slice(1)} SLA · {totalFTE.toFixed(1)} FTE</div>
                <div style={{ marginTop:8,display:"flex",gap:8,flexWrap:"wrap" }}>
                  <span style={{ fontSize:10,background:NTT_RED,color:"#fff",padding:"2px 10px",borderRadius:10,fontWeight:700 }}>{oppStatus}</span>
                  {client.projectRef && <span style={{ fontSize:10,background:"rgba(255,255,255,0.15)",color:"#fff",padding:"2px 10px",borderRadius:10 }}>Ref: {client.projectRef}</span>}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10,opacity:0.65 }}>Total Contract Value</div>
                <div style={{ fontSize:36,fontWeight:900,fontFamily:MONO }}>{fmt(tcv)}</div>
                <div style={{ fontSize:11,opacity:0.6 }}>{client.contractYears} years incl. AI</div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:18 }}>
            {[
              {l:"Net Monthly",v:fmt(netMonthly),c:NTT_BLUE},{l:"Annual Cost",v:fmt(annualCost),c:NTT_BLUE},
              {l:"AI Saving/mo",v:fmt(aiSavingMo),c:"#16A34A"},{l:"Total FTE",v:totalFTE.toFixed(2),c:"#7C3AED"},
              {l:"AI Accelerators",v:selectedAI.length,c:"#D97706"},
            ].map(k => (
              <Card key={k.l} style={{ textAlign:"center",padding:"12px 8px" }}>
                <div style={{ fontSize:9,color:GRAY,fontWeight:700,textTransform:"uppercase",marginBottom:3 }}>{k.l}</div>
                <div style={{ fontSize:20,fontWeight:900,color:k.c,fontFamily:MONO }}>{k.v}</div>
              </Card>
            ))}
          </div>

          {/* Cost build-up + notes */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18 }}>
            <Card>
              <STitle>Cost Build-Up</STitle>
              {[
                {l:"Base Monthly",v:fmt(baseMonthly),hi:false},
                {l:`Contingency (${contingency}%)`,v:fmt(contAmount),hi:false},
                {l:"Gross Monthly",v:fmt(grossMonthly),hi:true},
                {l:"AI Savings",v:"−"+fmt(aiSavingMo),hi:false,green:true},
                {l:"Net Monthly",v:fmt(netMonthly),hi:true},
                {l:"Annual Cost",v:fmt(annualCost),hi:false},
                {l:"AI One-Off",v:fmt(aiOneOff),hi:false},
                {l:`TCV (${client.contractYears}yr)`,v:fmt(tcv),hi:true,big:true},
              ].map(r => (
                <div key={r.l} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",marginBottom:3,borderRadius:6,background:r.hi ? NTT_LIGHT:"#fff",borderLeft:r.hi ? `3px solid ${NTT_BLUE}`:"3px solid transparent" }}>
                  <span style={{ fontSize:r.big?13:11,color:"#374151" }}>{r.l}</span>
                  <span style={{ fontSize:r.big?16:12,fontWeight:r.hi||r.big ? 900:600,fontFamily:MONO,color:r.green ? "#16A34A":r.hi||r.big ? NTT_BLUE:"#374151" }}>{r.v}</span>
                </div>
              ))}
            </Card>
            <Card>
              <STitle>Notes</STitle>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes, key assumptions, deal context..."
                style={{ width:"100%",height:120,padding:10,border:"1.5px solid #D1D5DB",borderRadius:7,fontSize:12,fontFamily:SANS,resize:"vertical",color:"#374151" }}/>
              <Sel label="Opportunity Status" value={oppStatus} onChange={setOppStatus} options={Object.keys(STATUS_COLORS)}/>
            </Card>
          </div>

          {/* Save / Export */}
          {savedMsg && (
            <div style={{ padding:"10px 14px",background:"#DCFCE7",border:"1px solid #16A34A30",borderRadius:8,marginBottom:12,fontSize:12,fontWeight:700,color:"#166534" }}>
              {savedMsg}
            </div>
          )}
          <div style={{ display:"flex",gap:12 }}>
            <button onClick={saveOpportunity}
              style={{ flex:2,padding:"14px 20px",background:NTT_BLUE,color:"#fff",border:"none",borderRadius:9,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:SANS }}>
              {editingId ? "💾 Update Opportunity" : "💾 Save Opportunity"}
            </button>
            <button onClick={exportCSV}
              style={{ flex:1,padding:"14px 20px",background:"#fff",color:NTT_BLUE,border:`2px solid ${NTT_BLUE}`,borderRadius:9,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:SANS }}>
              📥 Export CSV
            </button>
            <button onClick={() => window.print()}
              style={{ flex:1,padding:"14px 20px",background:"#fff",color:GRAY,border:"2px solid #E5E7EB",borderRadius:9,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:SANS }}>
              🖨️ Print
            </button>
          </div>
          <div style={{ textAlign:"center",marginTop:10,fontSize:10,color:"#9CA3AF" }}>
            Estimate valid 30 days · NTT DATA Confidential
          </div>
        </div>
      );

      default: return null;
    }
  };

  // ── OPPORTUNITY DETAIL MODAL ──────────────────────────────────────────────
  const renderModal = () => {
    if (!viewOpp) return null;
    const o = viewOpp;
    return (
      <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}
        onClick={() => setViewOpp(null)}>
        <div style={{ background:"#fff",borderRadius:14,padding:24,maxWidth:680,width:"100%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}
          onClick={e => e.stopPropagation()}>
          <div style={{ background:`linear-gradient(135deg,${NTT_BLUE},#00509E)`,borderRadius:10,padding:18,marginBottom:18,color:"#fff" }}>
            <div style={{ fontSize:10,opacity:0.6,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4,fontFamily:MONO }}>{o.id}</div>
            <div style={{ fontSize:20,fontWeight:900 }}>{o.client?.name}</div>
            <div style={{ fontSize:12,opacity:0.75,marginTop:3 }}>{o.client?.region} · {o.client?.contractYears}yr · {o.slaTier} SLA</div>
            <div style={{ display:"flex",justifyContent:"space-between",marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.2)" }}>
              <div>
                <div style={{ fontSize:10,opacity:0.6 }}>TCV</div>
                <div style={{ fontSize:28,fontWeight:900,fontFamily:MONO }}>{fmt(o.financials?.tcv||0)}</div>
              </div>
              <span style={{ fontSize:12,fontWeight:800,background:STATUS_COLORS[o.status]||GRAY,color:"#fff",padding:"4px 14px",borderRadius:20,alignSelf:"flex-end" }}>{o.status}</span>
            </div>
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
            {[
              {l:"Net Monthly",v:fmt(o.financials?.netMonthly||0)},
              {l:"Annual Cost",v:fmt(o.financials?.annualCost||0)},
              {l:"AI Saving/mo",v:fmt(o.financials?.aiSavingMo||0)},
              {l:"Total FTE",v:o.financials?.totalFTE},
              {l:"Modules",v:Object.values(o.modules||{}).filter(Boolean).length},
              {l:"AI Tools",v:Object.values(o.aiEnabled||{}).filter(Boolean).length},
            ].map(k => (
              <div key={k.l} style={{ padding:"10px 14px",background:NTT_LIGHT,borderRadius:8,display:"flex",justifyContent:"space-between" }}>
                <span style={{ fontSize:11,color:GRAY }}>{k.l}</span>
                <span style={{ fontSize:14,fontWeight:900,color:NTT_BLUE,fontFamily:MONO }}>{k.v}</span>
              </div>
            ))}
          </div>

          {o.notes && (
            <div style={{ padding:"10px 14px",background:"#F9FAFB",borderRadius:8,border:"1px solid #E5E7EB",marginBottom:14,fontSize:12,color:"#374151",lineHeight:1.6 }}>
              <strong>Notes:</strong> {o.notes}
            </div>
          )}

          <div style={{ fontSize:10,color:"#9CA3AF",marginBottom:14 }}>
            Created: {new Date(o.createdAt).toLocaleString("en-GB")} · Updated: {new Date(o.updatedAt).toLocaleString("en-GB")}
          </div>

          <div style={{ display:"flex",gap:10 }}>
            <button onClick={() => { loadOpportunity(o); setViewOpp(null); }}
              style={{ flex:1,padding:"10px",background:NTT_BLUE,color:"#fff",border:"none",borderRadius:8,fontWeight:700,cursor:"pointer",fontFamily:SANS }}>
              Edit Estimate
            </button>
            <button onClick={() => setViewOpp(null)}
              style={{ flex:1,padding:"10px",background:"#fff",color:GRAY,border:"1px solid #E5E7EB",borderRadius:8,fontWeight:700,cursor:"pointer",fontFamily:SANS }}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── MASTER LAYOUT ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh",background:"#F0F2F5",fontFamily:SANS }}>
      {renderModal()}

      {/* Top bar */}
      <div style={{ background:NTT_BLUE,height:56,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,0.2)" }}>
        <div style={{ display:"flex",alignItems:"center",gap:14 }}>
          <div style={{ display:"flex",gap:3 }}>
            <div style={{ width:6,height:40,background:NTT_RED,borderRadius:2 }}/>
            <div style={{ width:6,height:40,background:"#fff",borderRadius:2 }}/>
          </div>
          <div>
            <div style={{ color:"#fff",fontWeight:900,fontSize:15 }}>NTT DATA</div>
            <div style={{ color:"rgba(255,255,255,0.55)",fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase" }}>GW AMS Estimator · Opportunity DB</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <div style={{ padding:"3px 12px",background:"rgba(255,255,255,0.12)",borderRadius:16,fontSize:11,color:"#fff",fontWeight:600 }}>
            {opportunities.length} Opportunities
          </div>
          <div style={{ padding:"3px 12px",background:NTT_RED,borderRadius:16,fontSize:11,color:"#fff",fontWeight:800,fontFamily:MONO }}>
            Pipeline: {fmt(opportunities.reduce((s,o)=>s+(o.financials?.tcv||0),0))}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div style={{ background:"#fff",borderBottom:"1px solid #E5E7EB",padding:"0 24px",display:"flex",gap:0 }}>
        {MAIN_TABS.map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)}
            style={{ padding:"13px 20px",border:"none",background:"none",cursor:"pointer",fontSize:13,fontWeight:700,
              color:mainTab===t.id ? NTT_BLUE:GRAY,borderBottom:mainTab===t.id ? `3px solid ${NTT_BLUE}`:"3px solid transparent",
              fontFamily:SANS }}>
            {t.label}
          </button>
        ))}
        {mainTab==="estimator" && editingId && (
          <div style={{ display:"flex",alignItems:"center",marginLeft:"auto",fontSize:11,color:GRAY,fontFamily:MONO }}>
            Editing: <strong style={{ color:NTT_BLUE,marginLeft:4 }}>{editingId}</strong>
          </div>
        )}
      </div>

      {/* Estimator sub-tabs */}
      {mainTab === "estimator" && (
        <div style={{ background:"#fff",borderBottom:"1px solid #E5E7EB",padding:"0 24px",display:"flex",gap:0,overflowX:"auto" }}>
          {EST_TABS.map(t => (
            <button key={t.id} onClick={() => setEstTab(t.id)}
              style={{ padding:"11px 16px",border:"none",background:"none",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap",
                color:estTab===t.id ? NTT_BLUE:GRAY,borderBottom:estTab===t.id ? `3px solid ${NTT_BLUE}`:"3px solid transparent",
                fontFamily:SANS }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth:1200,margin:"0 auto",padding:22 }}>
        {mainTab === "opportunities" ? renderOpportunities() : renderEstTab()}
      </div>

      {/* Footer nav for estimator */}
      {mainTab === "estimator" && (
        <div style={{ background:"#fff",borderTop:"1px solid #E5E7EB",padding:"11px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",bottom:0,zIndex:99 }}>
          <button onClick={() => setEstTab(Math.max(0,estTab-1))} disabled={estTab===0}
            style={{ padding:"8px 20px",border:`1.5px solid ${NTT_BLUE}`,borderRadius:7,background:"#fff",color:NTT_BLUE,fontWeight:700,fontSize:13,cursor:estTab===0?"not-allowed":"pointer",opacity:estTab===0?0.4:1,fontFamily:SANS }}>
            ← Prev
          </button>
          <div style={{ display:"flex",gap:6 }}>
            {EST_TABS.map((_,i) => (
              <div key={i} onClick={() => setEstTab(i)}
                style={{ width:i===estTab?22:8,height:8,borderRadius:4,cursor:"pointer",background:estTab===i ? NTT_BLUE:"#D1D5DB",transition:"width 0.2s" }}/>
            ))}
          </div>
          <button onClick={() => estTab < EST_TABS.length-1 ? setEstTab(estTab+1) : saveOpportunity()}
            style={{ padding:"8px 20px",border:"none",borderRadius:7,background:NTT_BLUE,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:SANS }}>
            {estTab === EST_TABS.length-1 ? "💾 Save" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}
