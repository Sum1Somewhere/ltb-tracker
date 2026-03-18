import { useState, useMemo } from "react";

const REGIONS = ["US", "Canada", "LAMEX", "APAC", "EMEA"];
const CATEGORIES = ["Tools & Gadgets", "Bakeware", "Sinkware", "Cutlery", "Food Storage"];
const HIST_YEARS = [2022, 2023, 2024, 2025];
const PROJ_YEARS = [2026, 2027, 2028, 2029, 2030, 2031];
const ALL_YEARS  = [...HIST_YEARS, ...PROJ_YEARS];

const CONTRACT_MINS = {
  US:     { 2022:6700000, 2023:5900000, 2024:6100000, 2025:6200000, 2026:6300000 },
  Canada: { 2022:900000,  2023:900000,  2024:915000,  2025:930000,  2026:945000  },
  LAMEX:  { 2022:150000,  2023:160000,  2024:170000,  2025:180000,  2026:190000  },
  APAC:   { 2022:250000,  2023:170000,  2024:220000,  2025:250000,  2026:315000  },
  EMEA:   { 2022:275000,  2023:200000,  2024:270000,  2025:320000,  2026:375000  },
};

const ACTUALS_ROY = {
  US:     { "Tools & Gadgets":[8830278,9809429,8544636,8782435], "Bakeware":[135017,148103,463156,511943], "Sinkware":[902769,890301,796630,712222], "Cutlery":[502800,1034310,1123979,1239925], "Food Storage":[0,0,0,0] },
  Canada: { "Tools & Gadgets":[1140393,1001138,1051261,992373],  "Bakeware":[34646,41757,103759,102383],   "Sinkware":[86641,11623,118353,39465],   "Cutlery":[33209,76487,127670,52694],     "Food Storage":[0,0,0,0] },
  LAMEX:  { "Tools & Gadgets":[73102,83814,162339,155029],        "Bakeware":[1354,1777,86,0],              "Sinkware":[52110,59836,102242,31802],   "Cutlery":[19008,102848,31114,87502],     "Food Storage":[0,0,0,0] },
  APAC:   { "Tools & Gadgets":[207466,124692,131808,282457],       "Bakeware":[0,0,0,0],                    "Sinkware":[16796,20906,5709,38820],     "Cutlery":[24433,26842,38127,51805],      "Food Storage":[0,0,0,16800] },
  EMEA:   { "Tools & Gadgets":[249848,317508,639093,660393],       "Bakeware":[0,0,0,0],                    "Sinkware":[0,11835,84363,17072],        "Cutlery":[49387,89256,188727,142508],    "Food Storage":[0,0,0,28600] },
};

const ACTUALS_SALES = {
  US:     { "Tools & Gadgets":[73585650,81745242,71205300,73186958], "Bakeware":[1350170,1481030,4631560,5119430], "Sinkware":[11284613,11128763,9957875,8902775], "Cutlery":[5586667,11492333,12488656,13776944], "Food Storage":[0,0,0,0] },
  Canada: { "Tools & Gadgets":[9503275,8342817,8760508,8269775],     "Bakeware":[346460,417570,1037590,1023830],   "Sinkware":[1083013,145288,1479413,493313],    "Cutlery":[368989,849856,1418556,585489],      "Food Storage":[0,0,0,0] },
  LAMEX:  { "Tools & Gadgets":[584816,670512,1298712,1240232],        "Bakeware":[13540,17770,860,0],               "Sinkware":[651375,747950,1278025,397525],     "Cutlery":[211200,1142756,345711,972244],      "Food Storage":[0,0,0,0] },
  APAC:   { "Tools & Gadgets":[1659728,997536,1054464,2259656],        "Bakeware":[0,0,0,0],                        "Sinkware":[209951,261325,71363,485250],       "Cutlery":[271478,298244,423634,575611],       "Food Storage":[0,0,0,210000] },
  EMEA:   { "Tools & Gadgets":[1998784,2540064,5112744,5283144],       "Bakeware":[0,0,0,0],                        "Sinkware":[0,147938,1054538,213400],          "Cutlery":[548744,991733,2096967,1583422],     "Food Storage":[0,0,0,357500] },
};

// Growth is now per region → category → year (one rate per forecast year)
function makeDefaultGrowth() {
  const g = {};
  REGIONS.forEach(r => {
    g[r] = {};
    CATEGORIES.forEach(c => {
      const defaults = {
        US:     { "Tools & Gadgets":[3,3,3,3,3,3], "Bakeware":[7,5,3,3,3,3], "Sinkware":[3,3,3,3,3,3], "Cutlery":[0,0,0,0,0,0], "Food Storage":[150,300,50,25,5,5] },
        Canada: { "Tools & Gadgets":[0,0,0,0,0,0], "Bakeware":[0,0,0,0,0,0], "Sinkware":[0,0,0,0,0,0], "Cutlery":[0,0,0,0,0,0], "Food Storage":[0,0,0,0,0,0] },
        LAMEX:  { "Tools & Gadgets":[0,0,0,0,0,0], "Bakeware":[0,0,0,0,0,0], "Sinkware":[0,0,0,0,0,0], "Cutlery":[0,0,0,0,0,0], "Food Storage":[0,0,0,0,0,0] },
        APAC:   { "Tools & Gadgets":[0,0,0,0,0,0], "Bakeware":[0,0,0,0,0,0], "Sinkware":[0,0,0,0,0,0], "Cutlery":[0,0,0,0,0,0], "Food Storage":[0,0,0,0,0,0] },
        EMEA:   { "Tools & Gadgets":[0,0,0,0,0,0], "Bakeware":[0,0,0,0,0,0], "Sinkware":[0,0,0,0,0,0], "Cutlery":[0,0,0,0,0,0], "Food Storage":[0,0,0,0,0,0] },
      };
      g[r][c] = defaults[r]?.[c] ?? [0,0,0,0,0,0];
    });
  });
  return g;
}

const STATUS_OPTIONS = ["Not Started","In Discussion","Draft Submitted","Under Review","Agreed","Escalated"];
const STATUS_COLORS  = { "Not Started":"#64748b","In Discussion":"#f59e0b","Draft Submitted":"#3b82f6","Under Review":"#8b5cf6","Agreed":"#10b981","Escalated":"#ef4444" };
const TABS = ["Dashboard","Growth Model","Min Analysis","Projections","Negotiation","Exec Summary"];

const fmt    = n => (n==null||isNaN(n)) ? "—" : "$"+Math.round(n).toLocaleString();
const fmtM   = n => (!n&&n!==0)||isNaN(n)||n===0 ? "—" : "$"+(n/1e6).toFixed(2)+"M";
const clamp  = (v,lo,hi) => Math.max(lo,Math.min(hi,v));

function pillStyle(pct) {
  if (pct<=60) return {background:"#dcfce7",color:"#15803d"};
  if (pct<=90) return {background:"#fef9c3",color:"#a16207"};
  return {background:"#fee2e2",color:"#dc2626"};
}

// Projection engine — now uses per-year growth rates
function buildProjections(growth) {
  const proj = {};
  REGIONS.forEach(r => {
    proj[r] = {};
    CATEGORIES.forEach(c => {
      const roy   = [...ACTUALS_ROY[r][c]];
      const sales = [...ACTUALS_SALES[r][c]];
      PROJ_YEARS.forEach((_, i) => {
        const g = (growth[r]?.[c]?.[i] ?? 0) / 100;
        roy.push(  (i===0 ? roy[3]   : roy[4+i-1])   * (1+g));
        sales.push((i===0 ? sales[3] : sales[4+i-1]) * (1+g));
      });
      proj[r][c] = { roy, sales };
    });
  });
  return proj;
}

function sumRegion(proj, r) {
  return ALL_YEARS.map((_,i) => ({
    roy:   CATEGORIES.reduce((s,c)=>s+proj[r][c].roy[i],  0),
    sales: CATEGORIES.reduce((s,c)=>s+proj[r][c].sales[i],0),
  }));
}

function sumGlobal(proj) {
  return ALL_YEARS.map((_,i) => ({
    roy:   REGIONS.reduce((s,r)=>s+CATEGORIES.reduce((ss,c)=>ss+proj[r][c].roy[i],  0),0),
    sales: REGIONS.reduce((s,r)=>s+CATEGORIES.reduce((ss,c)=>ss+proj[r][c].sales[i],0),0),
  }));
}

function exportCSV(proj, minThresh) {
  const rows = [["Region","Category","Metric",...ALL_YEARS]];
  REGIONS.forEach(r => CATEGORIES.forEach(c => {
    rows.push([r,c,"Sales",    ...proj[r][c].sales.map(Math.round)]);
    rows.push([r,c,"Royalties",...proj[r][c].roy.map(Math.round)]);
  }));
  rows.push([]);
  rows.push(["Region","2022 Min","2023 Min","2024 Min","2025 Min","2026 Min","Implied Min","Threshold%"]);
  REGIONS.forEach(r => {
    const avg2yr = CATEGORIES.reduce((s,c)=>s+proj[r][c].roy[2]+proj[r][c].roy[3],0)/2;
    rows.push([r,...[2022,2023,2024,2025,2026].map(y=>CONTRACT_MINS[r][y]),Math.round(avg2yr*minThresh/100),minThresh+"%"]);
  });
  const a = Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"})),download:"ltb_tracker.csv"});
  a.click();
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]             = useState("Dashboard");
  const [growth, setGrowth]       = useState(() => makeDefaultGrowth());
  const [minThresh, setMinThresh] = useState(54);
  const [neg, setNeg]             = useState(() => Object.fromEntries(REGIONS.map(r=>[r,{status:"Not Started",notes:"",proposed:"",agreed:"",position:"",submittedBy:"",rationale:"",risks:""}])));
  const [execMemo, setExecMemo]   = useState("");
  const [memoLoading, setMemoLoading] = useState(false);

  const proj         = useMemo(()=>buildProjections(growth),[growth]);
  const global       = useMemo(()=>sumGlobal(proj),[proj]);
  const regionTotals = useMemo(()=>Object.fromEntries(REGIONS.map(r=>[r,sumRegion(proj,r)])),[proj]);
  const impliedMins  = useMemo(()=>Object.fromEntries(REGIONS.map(r=>{
    const avg2yr = CATEGORIES.reduce((s,c)=>s+proj[r][c].roy[2]+proj[r][c].roy[3],0)/2;
    return [r, avg2yr*minThresh/100];
  })),[proj,minThresh]);

  const updateGrowth = (r,c,yi,v) => setGrowth(p => {
    const next = JSON.parse(JSON.stringify(p));
    next[r][c][yi] = parseFloat(v)||0;
    return next;
  });

  // Apply a flat rate across all 6 forecast years for a category
  const applyFlat = (r,c,v) => setGrowth(p => {
    const next = JSON.parse(JSON.stringify(p));
    next[r][c] = PROJ_YEARS.map(()=>parseFloat(v)||0);
    return next;
  });

  const updateNeg = (r,f,v) => setNeg(p=>({...p,[r]:{...p[r],[f]:v}}));

  const totalFcstSales = PROJ_YEARS.reduce((s,_,i)=>s+global[4+i].sales,0);
  const totalFcstRoy   = PROJ_YEARS.reduce((s,_,i)=>s+global[4+i].roy,  0);
  const totalFcstMktg  = totalFcstSales*0.04;
  const totalImplied   = Object.values(impliedMins).reduce((a,b)=>a+b,0);

  const generateMemo = async () => {
    setMemoLoading(true); setExecMemo("");
    const regionData = REGIONS.map(r => {
      const t = regionTotals[r];
      return { region:r+(r==="APAC"?" (incl. ANZ)":""), act24:t[2].roy, act25:t[3].roy, fcst26:t[4].roy,
        fcstRoy6yr:PROJ_YEARS.reduce((s,_,i)=>s+t[4+i].roy,0), mktg6yr:PROJ_YEARS.reduce((s,_,i)=>s+t[4+i].sales,0)*0.04,
        curMin:CONTRACT_MINS[r][2026], implied:impliedMins[r], status:neg[r].status,
        rationale:neg[r].rationale||"Not entered", risks:neg[r].risks||"None noted",
        position:neg[r].position||"Not set", proposed:neg[r].proposed||"TBD" };
    });
    const prompt = `You are a senior licensing strategist. Draft a sharp executive briefing memo for Lifetime Brands (LTB) leadership for a KitchenAid/Whirlpool contract extension negotiation (2026–2031). Whirlpool requires a new 4% marketing commitment (LTB does not have this today). Historical minimums averaged 54% of actual royalties — the defensible anchor.

Global 6-yr: Sales ${fmtM(totalFcstSales)} | Royalties ${fmtM(totalFcstRoy)} | 4% Mktg ${fmtM(totalFcstMktg)} | Implied Min at ${minThresh}% = ${fmtM(totalImplied)} | Current 2026 contract total = ${fmt(REGIONS.reduce((s,r)=>s+CONTRACT_MINS[r][2026],0))}

${regionData.map(r=>`${r.region}: 2024=${fmt(r.act24)} 2025=${fmt(r.act25)} 2026fcst=${fmt(r.fcst26)} 6yrRoy=${fmtM(r.fcstRoy6yr)} mktg=${fmtM(r.mktg6yr)} curMin=${fmt(r.curMin)} impliedMin=${fmt(r.implied)} delta=${r.implied>=r.curMin?"+":""}${fmt(r.implied-r.curMin)} status=${r.status} rationale=${r.rationale} risks=${r.risks} position=${r.position}`).join("\n")}

Sections: 1.SITUATION OVERVIEW 2.GLOBAL FINANCIAL OUTLOOK 3.MARKETING COMMITMENT EXPOSURE 4.MINIMUM ROYALTIES ANALYSIS & RECOMMENDED POSITION 5.REGION-BY-REGION SUMMARY 6.RISKS & OPEN ITEMS 7.NEXT STEPS. Precise, C-suite tone, dollar figures throughout.`;
    try {
      const res  = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,messages:[{role:"user",content:prompt}]})});
      const data = await res.json();
      setExecMemo(data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"No response.");
    } catch(e) { setExecMemo("Error: "+e.message); }
    setMemoLoading(false);
  };

  return (
    <div style={{fontFamily:"system-ui,sans-serif",background:"#f8f8f7",minHeight:"100vh",color:"#1a1a1a"}}>
      <div style={{background:"linear-gradient(135deg,#C41230,#8B0C22)",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.7)",letterSpacing:2,textTransform:"uppercase"}}>Lifetime Brands × KitchenAid</div>
          <div style={{fontSize:17,fontWeight:700,color:"#fff"}}>Contract Extension Tracker</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>2026–2031 · 5 Regions · 5 Categories · YoY growth per year</div>
        </div>
        <button onClick={()=>exportCSV(proj,minThresh)} style={{padding:"7px 16px",background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.4)",borderRadius:7,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600}}>↓ Export CSV</button>
      </div>

      <div style={{display:"flex",background:"#fff",borderBottom:"1px solid #e5e5e3",overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"10px 14px",border:"none",background:"none",cursor:"pointer",fontWeight:tab===t?700:400,fontSize:12,color:tab===t?"#C41230":"#666",borderBottom:tab===t?"2px solid #C41230":"2px solid transparent",marginBottom:-1,whiteSpace:"nowrap"}}>{t}</button>
        ))}
      </div>

      <div style={{padding:"16px 20px",maxWidth:1400,margin:"0 auto"}}>
        {tab==="Dashboard"    && <Dashboard    global={global} regionTotals={regionTotals} impliedMins={impliedMins} neg={neg} totals={{totalFcstSales,totalFcstRoy,totalFcstMktg,totalImplied}}/>}
        {tab==="Growth Model" && <GrowthModel  growth={growth} updateGrowth={updateGrowth} applyFlat={applyFlat} proj={proj} regionTotals={regionTotals}/>}
        {tab==="Min Analysis" && <MinAnalysis  proj={proj} impliedMins={impliedMins} minThresh={minThresh} setMinThresh={setMinThresh} neg={neg} updateNeg={updateNeg}/>}
        {tab==="Projections"  && <Projections  global={global} regionTotals={regionTotals} proj={proj}/>}
        {tab==="Negotiation"  && <NegTab       neg={neg} updateNeg={updateNeg} impliedMins={impliedMins} regionTotals={regionTotals}/>}
        {tab==="Exec Summary" && <ExecTab      execMemo={execMemo} memoLoading={memoLoading} generateMemo={generateMemo} neg={neg}/>}
      </div>
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Card({title,children}) {
  return (
    <div style={{background:"#fff",border:"1px solid #e5e5e3",borderRadius:10,overflow:"hidden",marginBottom:14}}>
      {title&&<div style={{padding:"11px 16px",borderBottom:"1px solid #e5e5e3",fontWeight:700,fontSize:13}}>{title}</div>}
      <div style={{padding:14}}>{children}</div>
    </div>
  );
}
function KPIs({items}) {
  return (
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
      {items.map(k=>(
        <div key={k.label} style={{background:"#fff",border:"1px solid #e5e5e3",borderRadius:10,padding:"12px 16px",flex:1,minWidth:120}}>
          <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1}}>{k.label}</div>
          <div style={{fontSize:19,fontWeight:700,color:k.color||"#1a1a1a",marginTop:3}}>{k.val}</div>
        </div>
      ))}
    </div>
  );
}
const TH = ({c}) => <th style={{padding:"7px 10px",textAlign:"left",fontWeight:600,fontSize:11,borderBottom:"1px solid #e5e5e3",whiteSpace:"nowrap",color:"#555",background:"#fafaf9"}}>{c}</th>;
const TD = ({c,style}) => <td style={{padding:"6px 10px",borderBottom:"1px solid #f1f1ef",fontSize:12,...style}}>{c}</td>;

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({global,regionTotals,impliedMins,neg,totals}) {
  const {totalFcstSales,totalFcstRoy,totalFcstMktg,totalImplied}=totals;
  const agreed=Object.values(neg).filter(n=>n.status==="Agreed").length;
  return (
    <div>
      <KPIs items={[
        {label:"6-Yr Forecast Sales",    val:fmtM(totalFcstSales),color:"#C41230"},
        {label:"6-Yr Forecast Royalties",val:fmtM(totalFcstRoy)},
        {label:"6-Yr Mktg Commit (4%)",  val:fmtM(totalFcstMktg), color:"#f59e0b"},
        {label:"Total Implied Mins",     val:fmtM(totalImplied),  color:"#10b981"},
        {label:"Regions Agreed",         val:`${agreed}/${REGIONS.length}`},
      ]}/>
      <Card title="Region Summary">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>{["Region","2025 Actual Roy.","2026 Fcst Roy.","6-Yr Mktg Commit","Implied Min","Status"].map(h=><TH key={h} c={h}/>)}</tr></thead>
            <tbody>{REGIONS.map((r,i)=>{
              const t=regionTotals[r];
              const m6=PROJ_YEARS.reduce((s,_,j)=>s+t[4+j].sales,0)*0.04;
              return <tr key={r} style={{background:i%2?"#fafaf9":"#fff"}}>
                <TD c={<><strong>{r}</strong>{r==="APAC"&&<span style={{fontSize:10,color:"#888",marginLeft:3}}>(ANZ)</span>}</>}/>
                <TD c={fmt(t[3].roy)}/><TD c={fmt(t[4].roy)}/>
                <TD c={fmtM(m6)} style={{color:"#f59e0b",fontWeight:600}}/>
                <TD c={fmt(impliedMins[r])} style={{color:"#10b981",fontWeight:600}}/>
                <TD c={<span style={{background:STATUS_COLORS[neg[r].status]+"22",color:STATUS_COLORS[neg[r].status],padding:"2px 7px",borderRadius:99,fontSize:11,fontWeight:600}}>{neg[r].status}</span>}/>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </Card>
      <Card title="Global Year-by-Year">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>
              <TH c="Metric"/>
              {ALL_YEARS.map(y=><th key={y} style={{padding:"7px 10px",textAlign:"left",fontWeight:600,fontSize:11,borderBottom:"1px solid #e5e5e3",whiteSpace:"nowrap",color:y>=2026?"#C41230":"#555",background:"#fafaf9"}}>{y}{y>=2026?" ▸":""}</th>)}
            </tr></thead>
            <tbody>
              {[["Sales","sales"],["Royalties","roy"]].map(([l,f])=>(
                <tr key={l}><TD c={l} style={{fontWeight:600}}/>{global.map((g,i)=><TD key={i} c={fmtM(g[f])}/>)}</tr>
              ))}
              <tr><TD c="Mktg 4%" style={{fontWeight:600,color:"#f59e0b"}}/>{global.map((g,i)=><TD key={i} c={fmtM(g.sales*0.04)} style={{color:i>=4?"#f59e0b":"#ccc"}}/>)}</tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Growth Model ─────────────────────────────────────────────────────────────
function GrowthModel({growth,updateGrowth,applyFlat,proj,regionTotals}) {
  const [ar,setAr] = useState("US");
  const [ac,setAc] = useState("Tools & Gadgets");

  return (
    <div>
      <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:9,padding:12,marginBottom:14,fontSize:12}}>
        <strong>Per-Year Growth Engine</strong> — Each forecast year has its own growth rate. Use the flat-apply field to set all 6 years at once, or tune them individually. Compounds from 2025 actuals.
      </div>

      {/* Region selector */}
      <div style={{display:"flex",gap:7,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:1}}>Region</span>
        {REGIONS.map(r=><button key={r} onClick={()=>setAr(r)} style={{padding:"6px 13px",borderRadius:7,border:"1px solid #e5e5e3",background:ar===r?"#C41230":"#fff",color:ar===r?"#fff":"#1a1a1a",fontWeight:ar===r?700:400,cursor:"pointer",fontSize:12}}>{r}{r==="APAC"?" (ANZ)":""}</button>)}
      </div>

      {/* Category selector */}
      <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:1}}>Category</span>
        {CATEGORIES.map(c=><button key={c} onClick={()=>setAc(c)} style={{padding:"5px 12px",borderRadius:7,border:"1px solid #e5e5e3",background:ac===c?"#1a1a1a":"#fff",color:ac===c?"#fff":"#1a1a1a",fontWeight:ac===c?700:400,cursor:"pointer",fontSize:11}}>{c}</button>)}
      </div>

      {/* Per-year growth inputs for selected region + category */}
      <Card title={`${ar} — ${ac} — YoY growth rates`}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:14}}>
          {PROJ_YEARS.map((y,i)=>{
            const g = growth[ar]?.[ac]?.[i] ?? 0;
            const prev = i===0 ? proj[ar][ac].roy[3] : proj[ar][ac].roy[4+i-1];
            const curr = proj[ar][ac].roy[4+i];
            return (
              <div key={y} style={{background:"#fafaf9",border:"1px solid #e5e5e3",borderRadius:8,padding:10}}>
                <div style={{fontSize:11,fontWeight:700,color:"#C41230",marginBottom:6}}>{y}</div>
                <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
                  <input type="range" min={-30} max={300} step={1} value={g}
                    onChange={e=>updateGrowth(ar,ac,i,e.target.value)}
                    style={{flex:1,accentColor:"#C41230"}}/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:6}}>
                  <input type="number" value={g} onChange={e=>updateGrowth(ar,ac,i,e.target.value)}
                    style={{width:"100%",padding:"4px 6px",border:"1px solid #e5e5e3",borderRadius:5,fontSize:13,textAlign:"center",fontWeight:700,color:g>0?"#10b981":g<0?"#ef4444":"#888"}}/>
                  <span style={{fontSize:11,color:"#888"}}>%</span>
                </div>
                <div style={{fontSize:10,color:"#888"}}>
                  <div>{fmt(prev)} →</div>
                  <div style={{fontWeight:600,color:g>0?"#10b981":g<0?"#ef4444":"#555"}}>{fmt(curr)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Flat apply shortcut */}
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderTop:"1px solid #f1f1ef"}}>
          <span style={{fontSize:12,color:"#555"}}>Apply flat rate to all 6 years:</span>
          <input type="number" placeholder="e.g. 3" id={`flat-${ar}-${ac}`}
            style={{width:70,padding:"5px 8px",border:"1px solid #e5e5e3",borderRadius:6,fontSize:13,textAlign:"center"}}/>
          <span style={{fontSize:12,color:"#888"}}>%</span>
          <button onClick={()=>{
            const el=document.getElementById(`flat-${ar}-${ac}`);
            if(el) { applyFlat(ar,ac,el.value); el.value=""; }
          }} style={{padding:"5px 14px",background:"#f0fdf4",border:"1px solid #10b981",borderRadius:6,color:"#10b981",fontWeight:700,fontSize:12,cursor:"pointer"}}>
            Apply
          </button>
          <span style={{fontSize:11,color:"#aaa",marginLeft:4}}>Sets same % for 2026–2031</span>
        </div>
      </Card>

      {/* Summary table: all categories for active region */}
      <Card title={`${ar} — All categories at a glance`}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>
              <TH c="Category"/>
              {PROJ_YEARS.map(y=><th key={y} style={{padding:"7px 10px",textAlign:"left",fontWeight:600,fontSize:11,borderBottom:"1px solid #e5e5e3",color:"#C41230",background:"#fafaf9"}}>{y}</th>)}
              <th style={{padding:"7px 10px",textAlign:"left",fontWeight:600,fontSize:11,borderBottom:"1px solid #e5e5e3",background:"#fef3c7",color:"#92400e"}}>6-Yr Roy.</th>
            </tr></thead>
            <tbody>
              {CATEGORIES.map((c,ci)=>{
                const rates = growth[ar]?.[c] ?? [0,0,0,0,0,0];
                const tot   = PROJ_YEARS.reduce((s,_,i)=>s+proj[ar][c].roy[4+i],0);
                const isActive = c===ac;
                return <tr key={c} style={{background:isActive?"#fef9f9":ci%2?"#fafaf9":"#fff",cursor:"pointer"}} onClick={()=>setAc(c)}>
                  <TD c={<span style={{fontWeight:isActive?700:400,color:isActive?"#C41230":"inherit"}}>{c}{isActive&&" ✎"}</span>}/>
                  {rates.map((g,i)=>(
                    <td key={i} style={{padding:"6px 10px",borderBottom:"1px solid #f1f1ef",fontSize:12}}>
                      <div style={{fontWeight:600,color:g>0?"#10b981":g<0?"#ef4444":"#888",fontSize:11}}>{g>0?"+":""}{g}%</div>
                      <div style={{fontSize:10,color:"#888"}}>{fmt(proj[ar][c].roy[4+i])}</div>
                    </td>
                  ))}
                  <TD c={fmtM(tot)} style={{background:"#fef3c7",fontWeight:600}}/>
                </tr>;
              })}
              <tr style={{fontWeight:700,borderTop:"2px solid #e5e5e3",background:"#f0fdf4"}}>
                <TD c="TOTAL" style={{fontWeight:700}}/>
                {PROJ_YEARS.map((_,i)=><TD key={i} c={fmt(regionTotals[ar][4+i].roy)} style={{fontWeight:700}}/>)}
                <TD c={fmtM(PROJ_YEARS.reduce((s,_,i)=>s+regionTotals[ar][4+i].roy,0))} style={{background:"#fef3c7",fontWeight:700}}/>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Min Analysis ─────────────────────────────────────────────────────────────
function MinAnalysis({proj,impliedMins,minThresh,setMinThresh,neg,updateNeg}) {
  const [active, setActive] = useState(() => new Set(REGIONS));

  const toggle = r => setActive(prev => {
    const next = new Set(prev);
    if (next.has(r)) { if (next.size > 1) next.delete(r); }
    else next.add(r);
    return next;
  });

  // Fix: true select all / deselect all
  const allOn = active.size === REGIONS.length;
  const toggleAll = () => setActive(allOn ? new Set([REGIONS[0]]) : new Set(REGIONS));

  const visible = REGIONS.filter(r=>active.has(r));

  const histPcts = useMemo(()=>{
    const out={};
    REGIONS.forEach(r=>{
      out[r]=HIST_YEARS.map((y,i)=>{
        const actual=CATEGORIES.reduce((s,c)=>s+ACTUALS_ROY[r][c][i],0);
        return actual>0?CONTRACT_MINS[r][y]/actual*100:0;
      });
    });
    return out;
  },[]);

  const globalAvg = useMemo(()=>{
    const all=[]; REGIONS.forEach(r=>histPcts[r].forEach(p=>all.push(p)));
    return all.reduce((a,b)=>a+b,0)/all.length;
  },[histPcts]);

  const visibleAvg = useMemo(()=>{
    const all=[]; visible.forEach(r=>histPcts[r].forEach(p=>all.push(p)));
    return all.length ? all.reduce((a,b)=>a+b,0)/all.length : 0;
  },[histPcts,visible]);

  const totalCur  = visible.reduce((s,r)=>s+CONTRACT_MINS[r][2026],0);
  const totalImpl = visible.reduce((s,r)=>s+impliedMins[r],0);
  const maxBar    = Math.max(...visible.map(r=>Math.max(impliedMins[r],CONTRACT_MINS[r][2026])),1);

  return (
    <div>
      {/* Region toggles */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:1,marginRight:2}}>Filter regions</span>
        {REGIONS.map(r=>{
          const on=active.has(r);
          return <button key={r} onClick={()=>toggle(r)} style={{
            padding:"5px 13px",borderRadius:99,fontSize:12,fontWeight:600,cursor:"pointer",
            border:on?"1.5px solid #C41230":"1.5px solid #e5e5e3",
            background:on?"#C41230":"#fff",color:on?"#fff":"#888",transition:"all 0.1s"
          }}>{r}{r==="APAC"?" (ANZ)":""}</button>;
        })}
        <button onClick={toggleAll} style={{padding:"5px 13px",borderRadius:99,fontSize:11,cursor:"pointer",border:"1px solid #e5e5e3",background:"#fafaf9",color:"#555"}}>
          {allOn ? "Deselect all" : "Select all"}
        </button>
        <span style={{marginLeft:"auto",fontSize:11,color:"#888"}}>{visible.length}/{REGIONS.length} regions</span>
      </div>

      {/* Slider + live KPIs */}
      <Card>
        <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Minimum threshold model</div>
        <div style={{fontSize:12,color:"#555",marginBottom:12}}>
          All-region historical avg: <strong style={{color:"#888"}}>{globalAvg.toFixed(1)}%</strong>
          &nbsp;·&nbsp; Selected avg: <strong style={{color:"#C41230"}}>{visibleAvg.toFixed(1)}%</strong>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <span style={{fontSize:12,color:"#555",whiteSpace:"nowrap"}}>Threshold %</span>
          <input type="range" min={40} max={100} step={1} value={minThresh} onChange={e=>setMinThresh(+e.target.value)} style={{flex:1,accentColor:"#C41230"}}/>
          <strong style={{minWidth:38,fontSize:15,color:"#C41230"}}>{minThresh}%</strong>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {[
            {label:"Selected implied total",   val:fmtM(totalImpl),  color:"#10b981"},
            {label:"Selected cur 2026 total",  val:fmt(totalCur),    color:"#3b82f6"},
            {label:"Delta",                    val:(totalImpl>=totalCur?"+":"")+fmtM(totalImpl-totalCur), color:totalImpl>=totalCur?"#10b981":"#ef4444"},
          ].map(k=>(
            <div key={k.label} style={{background:"#fafaf9",border:"1px solid #e5e5e3",borderRadius:8,padding:"8px 14px",flex:1,minWidth:120}}>
              <div style={{fontSize:10,color:"#888",textTransform:"uppercase",letterSpacing:1,marginBottom:3}}>{k.label}</div>
              <div style={{fontSize:16,fontWeight:700,color:k.color}}>{k.val}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Historical pct table */}
      <Card title="Contract min as % of actual royalties (2022–2025)">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr><TH c="Region"/>{HIST_YEARS.map(y=><TH key={y} c={y}/>)}<TH c="Avg"/><TH c="Signal"/></tr></thead>
            <tbody>
              {visible.map((r,i)=>{
                const pcts=histPcts[r];
                const avg=pcts.reduce((a,b)=>a+b,0)/pcts.length;
                const sig=avg<=60?"Conservative floor":avg<=90?"Moderate floor":"Tight — near min";
                return <tr key={r} style={{background:i%2?"#fafaf9":"#fff"}}>
                  <TD c={<><strong>{r}</strong>{r==="APAC"&&<span style={{fontSize:10,color:"#888",marginLeft:3}}>(ANZ)</span>}</>}/>
                  {pcts.map((p,j)=><TD key={j} c={<span style={{...pillStyle(p),padding:"2px 7px",borderRadius:99,fontSize:11,fontWeight:500}}>{p.toFixed(0)}%</span>}/>)}
                  <TD c={avg.toFixed(0)+"%"} style={{fontWeight:600}}/>
                  <TD c={<span style={{...pillStyle(avg),padding:"2px 7px",borderRadius:99,fontSize:11,fontWeight:500}}>{sig}</span>}/>
                </tr>;
              })}
              {visible.length>1&&(()=>{
                const gp=HIST_YEARS.map((_,i)=>{
                  const a=visible.reduce((s,r)=>s+CATEGORIES.reduce((ss,c)=>ss+ACTUALS_ROY[r][c][i],0),0);
                  const m=visible.reduce((s,r)=>s+CONTRACT_MINS[r][HIST_YEARS[i]],0);
                  return a>0?m/a*100:0;
                });
                const avg=gp.reduce((a,b)=>a+b,0)/gp.length;
                return <tr style={{fontWeight:700,borderTop:"2px solid #e5e5e3",background:"#f0fdf4"}}>
                  <TD c={`TOTAL (${visible.length})`} style={{fontWeight:700}}/>
                  {gp.map((p,j)=><TD key={j} c={<span style={{...pillStyle(p),padding:"2px 7px",borderRadius:99,fontSize:11,fontWeight:500}}>{p.toFixed(0)}%</span>}/>)}
                  <TD c={avg.toFixed(0)+"%"} style={{fontWeight:700}}/><TD c=""/>
                </tr>;
              })()}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bar comparison */}
      <Card title={`Implied min (${minThresh}%) vs current 2026 floor`}>
        {visible.map(r=>{
          const imp=impliedMins[r],cur=CONTRACT_MINS[r][2026],delta=imp-cur;
          return (
            <div key={r} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                <strong>{r}{r==="APAC"&&<span style={{fontSize:10,color:"#888",marginLeft:3}}>(ANZ)</span>}</strong>
                <span>
                  <span style={{color:"#888"}}>Implied: </span><strong>{fmt(imp)}</strong>&nbsp;&nbsp;
                  <span style={{color:"#888"}}>Cur 2026: </span><strong>{fmt(cur)}</strong>&nbsp;&nbsp;
                  <span style={{color:delta>=0?"#10b981":"#ef4444",fontWeight:700}}>{delta>=0?"+":""}{fmt(delta)}</span>
                </span>
              </div>
              {[{label:"Implied",val:imp,color:"#10b981"},{label:"Cur 2026",val:cur,color:"#cbd5e1"}].map(b=>(
                <div key={b.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{fontSize:11,color:"#888",width:64}}>{b.label}</span>
                  <div style={{flex:1,height:7,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}>
                    <div style={{width:`${clamp(b.val/maxBar*100,0,100)}%`,height:"100%",background:b.color,borderRadius:4,transition:"width 0.2s"}}/>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </Card>

      {/* Negotiation positions */}
      <Card title="LTB negotiation positions">
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>{["Region","Cur 2026 Min","Implied Min","LTB Proposed","Agreed","Position"].map(h=><TH key={h} c={h}/>)}</tr></thead>
            <tbody>{visible.map((r,i)=>(
              <tr key={r} style={{background:i%2?"#fafaf9":"#fff"}}>
                <TD c={<strong>{r}</strong>}/>
                <TD c={fmt(CONTRACT_MINS[r][2026])} style={{color:"#3b82f6",fontWeight:600}}/>
                <TD c={fmt(impliedMins[r])} style={{color:"#10b981",fontWeight:600}}/>
                <TD c={<input value={neg[r].proposed} onChange={e=>updateNeg(r,"proposed",e.target.value)} placeholder="$" style={{width:85,padding:"3px 6px",border:"1px solid #e5e5e3",borderRadius:4,fontSize:11}}/>}/>
                <TD c={<input value={neg[r].agreed}   onChange={e=>updateNeg(r,"agreed",e.target.value)}   placeholder="TBD" style={{width:85,padding:"3px 6px",border:"1px solid #e5e5e3",borderRadius:4,fontSize:11,color:"#10b981"}}/>}/>
                <TD c={<input value={neg[r].position} onChange={e=>updateNeg(r,"position",e.target.value)} placeholder="e.g. hold at implied" style={{width:150,padding:"3px 6px",border:"1px solid #e5e5e3",borderRadius:4,fontSize:11}}/>}/>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Projections ──────────────────────────────────────────────────────────────
function Projections({global,regionTotals,proj}) {
  const [view,setView]=useState("Global");
  return (
    <div>
      <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
        {["Global",...REGIONS].map(o=><button key={o} onClick={()=>setView(o)} style={{padding:"6px 13px",borderRadius:7,border:"1px solid #e5e5e3",background:view===o?"#C41230":"#fff",color:view===o?"#fff":"#1a1a1a",cursor:"pointer",fontSize:12,fontWeight:view===o?700:400}}>{o}{o==="APAC"?" (ANZ)":""}</button>)}
      </div>
      {view==="Global" ? (
        <Card title="Global totals">
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr><TH c="Metric"/>{ALL_YEARS.map(y=><th key={y} style={{padding:"7px 10px",textAlign:"left",fontWeight:600,fontSize:11,borderBottom:"1px solid #e5e5e3",color:y>=2026?"#C41230":"#555",background:"#fafaf9"}}>{y}{y>=2026?" ▸":""}</th>)}</tr></thead>
              <tbody>
                {[["Sales","sales"],["Royalties","roy"]].map(([l,f])=>(
                  <tr key={l}><TD c={l} style={{fontWeight:600}}/>{global.map((g,i)=><TD key={i} c={fmt(g[f])}/>)}</tr>
                ))}
                <tr><TD c="Mktg 4%" style={{fontWeight:600,color:"#f59e0b"}}/>{global.map((g,i)=><TD key={i} c={fmt(g.sales*0.04)} style={{color:i>=4?"#f59e0b":"#ccc"}}/>)}</tr>
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card title={`${view}${view==="APAC"?" (incl. ANZ)":""} — category breakdown`}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr><TH c="Category"/><TH c="Field"/>{ALL_YEARS.map(y=><th key={y} style={{padding:"7px 10px",textAlign:"left",fontWeight:600,fontSize:11,borderBottom:"1px solid #e5e5e3",color:y>=2026?"#C41230":"#555",background:"#fafaf9"}}>{y}</th>)}</tr></thead>
              <tbody>
                {CATEGORIES.map((c,ci)=>
                  [["Royalties","roy"],["Sales","sales"]].map(([l,f],fi)=>(
                    <tr key={c+f} style={{background:(ci%2===0&&fi===0)||(ci%2===1&&fi===1)?"#fafaf9":"#fff"}}>
                      {fi===0&&<td style={{padding:"6px 10px",fontWeight:700,fontSize:12,borderBottom:"1px solid #f1f1ef"}} rowSpan={2}>{c}</td>}
                      <TD c={l} style={{color:"#888"}}/>
                      {ALL_YEARS.map((_,i)=><TD key={i} c={fmt(proj[view][c][f][i])} style={{color:i>=4?"#C41230":"inherit"}}/>)}
                    </tr>
                  ))
                )}
                {[["Sales","sales"],["Royalties","roy"]].map(([l,f])=>(
                  <tr key={"tot"+l} style={{fontWeight:700,borderTop:"2px solid #e5e5e3",background:"#f0fdf4"}}>
                    <td style={{padding:"6px 10px",fontWeight:700,fontSize:12}} colSpan={2}>Total — {l}</td>
                    {regionTotals[view].map((t,i)=><TD key={i} c={fmt(t[f])} style={{fontWeight:700}}/>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Negotiation ──────────────────────────────────────────────────────────────
function NegTab({neg,updateNeg,impliedMins,regionTotals}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {REGIONS.map(r=>(
        <div key={r} style={{background:"#fff",border:`1px solid ${STATUS_COLORS[neg[r].status]}44`,borderRadius:10,padding:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
            <strong style={{fontSize:14}}>{r}{r==="APAC"&&<span style={{fontSize:11,color:"#888",marginLeft:3}}>(ANZ)</span>}</strong>
            <select value={neg[r].status} onChange={e=>updateNeg(r,"status",e.target.value)} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${STATUS_COLORS[neg[r].status]}`,background:STATUS_COLORS[neg[r].status]+"18",color:STATUS_COLORS[neg[r].status],fontWeight:700,fontSize:12}}>
              {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
            </select>
            <div style={{marginLeft:"auto",display:"flex",gap:14,fontSize:12,flexWrap:"wrap"}}>
              <span>2025: <strong>{fmt(regionTotals[r][3].roy)}</strong></span>
              <span>Implied min: <strong style={{color:"#10b981"}}>{fmt(impliedMins[r])}</strong></span>
              <span>2026 mktg: <strong style={{color:"#f59e0b"}}>{fmt(regionTotals[r][4].sales*0.04)}</strong></span>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            {[["submittedBy","Submitted by"],["rationale","Projection rationale"]].map(([f,l])=>(
              <div key={f}>
                <div style={{fontSize:10,color:"#888",marginBottom:3,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
                <input value={neg[r][f]} onChange={e=>updateNeg(r,f,e.target.value)} placeholder={l+"..."} style={{width:"100%",padding:"6px 9px",border:"1px solid #e5e5e3",borderRadius:6,fontSize:12,boxSizing:"border-box"}}/>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:"#888",marginBottom:3,textTransform:"uppercase",letterSpacing:1}}>Discussion notes</div>
          <textarea value={neg[r].notes} onChange={e=>updateNeg(r,"notes",e.target.value)} placeholder="Open items, escalations, outstanding asks..." rows={2}
            style={{width:"100%",padding:"6px 9px",border:"1px solid #e5e5e3",borderRadius:6,fontSize:12,resize:"vertical",boxSizing:"border-box"}}/>
        </div>
      ))}
    </div>
  );
}

// ─── Exec Summary ─────────────────────────────────────────────────────────────
function ExecTab({execMemo,memoLoading,generateMemo,neg}) {
  const done=REGIONS.filter(r=>neg[r].rationale).length;
  return (
    <div>
      <Card>
        <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>AI-Generated Executive Briefing</div>
        <div style={{fontSize:12,color:"#666",marginBottom:12}}>Drafts a C-suite memo from all live data. <strong>{done}/{REGIONS.length}</strong> regions have rationale entered.</div>
        <button onClick={generateMemo} disabled={memoLoading} style={{padding:"9px 22px",background:memoLoading?"#94a3b8":"#C41230",color:"#fff",border:"none",borderRadius:7,fontWeight:700,fontSize:13,cursor:memoLoading?"not-allowed":"pointer"}}>
          {memoLoading?"Drafting...":execMemo?"Regenerate Memo":"Generate Exec Summary"}
        </button>
      </Card>
      {memoLoading&&<Card><div style={{textAlign:"center",color:"#888",fontSize:13,padding:20}}>Analyzing all regions and drafting briefing...</div></Card>}
      {execMemo&&!memoLoading&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <strong style={{fontSize:13}}>Executive Briefing Memo</strong>
            <button onClick={()=>navigator.clipboard.writeText(execMemo).catch(()=>{})} style={{padding:"4px 12px",background:"#f8f8f7",border:"1px solid #e5e5e3",borderRadius:5,fontSize:12,cursor:"pointer"}}>Copy</button>
          </div>
          <div style={{whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.75}}>{execMemo}</div>
        </Card>
      )}
    </div>
  );
}
