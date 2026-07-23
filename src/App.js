import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";

const API_URL = process.env.REACT_APP_API_URL || "/api";

// ── Responsive hook ──────────────────────────────────────────
function useIsMobile(){ 
  const[mob,setMob]=useState(window.innerWidth<768);
  useEffect(()=>{
    const h=()=>setMob(window.innerWidth<768);
    window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);
  },[]);
  return mob;
}
const api = {
  token: null,
  setToken(t) { this.token = t; },
  async request(method, path, body) {
    const opts = {
      method,
      headers: { "Content-Type":"application/json", ...(this.token?{Authorization:`Bearer ${this.token}`}:{}) },
      ...(body?{body:JSON.stringify(body)}:{}),
    };
    const res  = await fetch(`${API_URL}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro na requisição.");
    return data;
  },
  get:    (path)       => api.request("GET",    path),
  post:   (path, body) => api.request("POST",   path, body),
  put:    (path, body) => api.request("PUT",    path, body),
  patch:  (path, body) => api.request("PATCH",  path, body),
  delete: (path)       => api.request("DELETE", path),
  async upload(path, formData) {
    const res  = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: api.token ? { Authorization: `Bearer ${api.token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro no upload.");
    return data;
  },
};

const C = {
  primary:"#F0A500", secondary:"#E05A00", accent:"#616161", dark:"#2D2D2D",
  sidebar:"#2E2E2E", sidebarHover:"#3A3A3A", text:"#444", textLight:"#888",
  border:"#E0E0E0", white:"#FFFFFF", success:"#27AE60", danger:"#E74C3C", bg:"#F5F5F5",
  t1bg:"#FFF8E1", t1border:"#F0A500", t2bg:"#E3F2FD", t2border:"#1976D2",
};

const Logo = ({size=36}) => (
  <svg width={size*1.6} height={size} viewBox="0 0 90 56" fill="none">
    <circle cx="8"  cy="28" r="3.5" fill="#F0A500"/>
    <circle cx="14" cy="18" r="3"   fill="#F0A500" opacity=".85"/>
    <circle cx="14" cy="38" r="3"   fill="#F0A500" opacity=".85"/>
    <circle cx="22" cy="11" r="2.5" fill="#F0A500" opacity=".7"/>
    <circle cx="22" cy="28" r="2.5" fill="#E05A00" opacity=".6"/>
    <circle cx="22" cy="45" r="2.5" fill="#F0A500" opacity=".7"/>
    <circle cx="30" cy="6"  r="2"   fill="#F8C300" opacity=".6"/>
    <circle cx="30" cy="17" r="2"   fill="#F0A500" opacity=".5"/>
    <circle cx="30" cy="39" r="2"   fill="#F0A500" opacity=".5"/>
    <circle cx="30" cy="50" r="2"   fill="#F8C300" opacity=".6"/>
    <text x="38" y="34" fontFamily="'Poppins','Segoe UI',Arial,sans-serif" fontWeight="900" fontSize="22" fill="#616161" letterSpacing="-1">SL</text>
    <text x="38" y="48" fontFamily="'Poppins','Segoe UI',Arial,sans-serif" fontWeight="500" fontSize="9"  fill="#888" letterSpacing="3">GRUPO</text>
  </svg>
);

// ── Icon SVG component (Heroicons MIT) ──────────────────────────
const _IC={
  home:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  folder:"M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  refresh:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  chart:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  user:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  users:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  building:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  team:"M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  car:"M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16H9m-5 0H3l2-7h14l2 7h-1m-1 0H9M5 9h14",
  coin:"M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  factory:"M19 21H5a2 2 0 01-2-2V8l7-5 7 5v11a2 2 0 01-2 2zM9 21V12h6v9",
  phone:"M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
  archive:"M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
  package:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  file:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  clipboard:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  mail:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  wrench:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
  clock:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  zap:"M13 10V3L4 14h7v7l9-11h-7z",
  route:"M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  contracts:"M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  signal:"M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
  monitor:"M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  history:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0zM3.05 11A9.003 9.003 0 0112 3",
  vacation:"M12 3v1m0 16v1M4.22 4.22l.71.71m12.02 12.02l.71.71M1 12h1m18 0h1M12 6a6 6 0 100 12A6 6 0 0012 6z",
  search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  trending:"M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  book:"M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  calendar:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  lock:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  edit:"M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash:"M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  download:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  upload:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  paperclip:"M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13",
  plus:"M12 4v16m8-8H4",
  send:"M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
  chevronDown:"M19 9l-7 7-7-7",
  chevronRight:"M9 5l7 7-7 7",
  eye:"M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  image:"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  x:"M6 18L18 6M6 6l12 12",
  check:"M5 13l4 4L19 7",
  warning:"M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  info:"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  globe:"M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
  server:"M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01",
  bell:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  logout:"M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  satellite:"M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0",
  network:"M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v10m0 0h10m-10 0H3m0 0v8a2 2 0 002 2h4m6-10v10m0 0h-4m4 0h2a2 2 0 002-2v-8",
  policy:"M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  folgas:"M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
};
const Icon=({name,size=16,color="currentColor",style={}})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0,...style}} aria-hidden>
    <path d={_IC[name]||_IC.info}/>
  </svg>
);

const S = {
  loginWrap:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:`linear-gradient(135deg,${C.dark} 0%,#444 100%)`},
  loginCard:{background:C.white,borderRadius:12,padding:"48px 40px",width:380,boxShadow:"0 20px 60px rgba(0,0,0,0.4)",borderTop:`4px solid ${C.primary}`},
  loginTitle:{textAlign:"center",marginBottom:8,color:C.accent,fontSize:15,fontWeight:600,letterSpacing:1},
  loginSub:{textAlign:"center",color:C.textLight,fontSize:12,marginBottom:32},
  label:{display:"block",fontSize:12,fontWeight:600,color:C.accent,marginBottom:6,letterSpacing:.5},
  input:{width:"100%",padding:"10px 14px",border:`1.5px solid ${C.border}`,borderRadius:6,fontSize:14,outline:"none",boxSizing:"border-box",color:C.text},
  select:{width:"100%",padding:"10px 14px",border:`1.5px solid ${C.border}`,borderRadius:6,fontSize:14,outline:"none",boxSizing:"border-box",color:C.text,background:C.white},
  btnPrimary:{width:"100%",padding:"12px",background:C.primary,color:C.white,border:"none",borderRadius:6,fontSize:14,fontWeight:700,cursor:"pointer",marginTop:8},
  errorMsg:{color:C.danger,fontSize:12,textAlign:"center",marginTop:8},
  layout:{display:"flex",height:"100vh",overflow:"hidden",fontFamily:"'Poppins','Segoe UI',Arial,sans-serif"},
  sidebar:{width:240,background:C.sidebar,color:C.white,display:"flex",flexDirection:"column",flexShrink:0},
  navSection:{flex:1,overflowY:"auto",padding:"8px 0"},
  navGroupBtn:{width:"100%",background:"none",border:"none",color:"#ddd",padding:"10px 16px",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"},
  navItem:{padding:"8px 16px 8px 36px",fontSize:13,cursor:"pointer",color:"#bbb",display:"flex",alignItems:"center",gap:8},
  logoutBtn:{width:"100%",background:"none",border:"1px solid #555",color:"#bbb",padding:"8px",borderRadius:6,cursor:"pointer",fontSize:12},
  main:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"},
  topbar:{background:C.white,padding:"12px 24px",borderBottom:`3px solid ${C.primary}`,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(0,0,0,.06)"},
  topbarTitle:{fontSize:16,fontWeight:700,color:C.accent},
  content:{flex:1,overflowY:"auto",padding:24,background:C.bg},
  card:{background:C.white,borderRadius:10,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.07)",border:`1px solid ${C.border}`},
  cardHeader:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,paddingBottom:16,borderBottom:`2px solid ${C.primary}`},
  cardTitle:{fontSize:18,fontWeight:700,color:C.accent},
  table:{width:"100%",borderCollapse:"collapse",fontSize:13},
  th:{background:C.bg,padding:"10px 12px",textAlign:"left",fontWeight:700,color:C.accent,borderBottom:`2px solid ${C.primary}`,fontSize:12,letterSpacing:.5},
  td:{padding:"10px 12px",borderBottom:`1px solid ${C.border}`,color:C.text,verticalAlign:"middle"},
  formRow:{marginBottom:18},
  modal:{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000},
  modalCard:{background:C.white,borderRadius:10,padding:32,width:"90%",maxWidth:600,boxShadow:"0 20px 60px rgba(0,0,0,.3)",borderTop:`4px solid ${C.primary}`,maxHeight:"90vh",overflowY:"auto"},
  modalTitle:{fontSize:17,fontWeight:700,color:C.accent,marginBottom:24},
  actionBtn:{padding:"5px 12px",border:"none",borderRadius:5,cursor:"pointer",fontSize:12,fontWeight:600,marginRight:4},
  btnEdit:{background:"#EBF5FB",color:"#2980B9"},
  btnDel:{background:"#FDEDEC",color:C.danger},
  btnAdd:{padding:"9px 18px",background:C.primary,color:C.white,border:"none",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:700},
  btnSave:{padding:"9px 18px",background:C.primary,color:C.white,border:"none",borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:700},
  btnCancel:{padding:"9px 18px",background:C.bg,color:C.text,border:`1px solid ${C.border}`,borderRadius:6,cursor:"pointer",fontSize:13},
  btnClose:{padding:"9px 18px",background:C.bg,color:C.accent,border:`1px solid ${C.border}`,borderRadius:6,cursor:"pointer",fontSize:13,fontWeight:600},
  badge:{display:"inline-block",padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:700},
  badgeActive:{background:"#D5F5E3",color:"#1E8449"},
  badgeInactive:{background:"#FDECEA",color:C.danger},
  userBadge:{width:32,height:32,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",color:C.white,fontWeight:700,fontSize:14},
  emptyState:{textAlign:"center",padding:"60px 0",color:C.textLight},
  emptyIcon:{fontSize:48,marginBottom:12,display:"block"},
  spinner:{textAlign:"center",padding:"40px 0",color:C.textLight,fontSize:13},
  homeGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:20,marginTop:8},
  homeCard:{background:C.white,borderRadius:10,padding:24,boxShadow:"0 2px 12px rgba(0,0,0,.07)",border:`1px solid ${C.border}`,cursor:"pointer",transition:"all .2s",textAlign:"center",borderTop:`3px solid ${C.primary}`},
  // Mobile extras
  hamburger:{background:"none",border:"none",cursor:"pointer",padding:"6px",display:"flex",flexDirection:"column",gap:5,alignItems:"center",justifyContent:"center"},
  mobileOverlay:{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200},
  mobileCard:{background:C.white,borderRadius:10,padding:16,boxShadow:"0 2px 12px rgba(0,0,0,.07)",border:`1px solid ${C.border}`,marginBottom:12},
};

// ── Helpers ──────────────────────────────────────────────────
const getInit = n=>(n||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
const MONTHS  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function toMinutes(t){ if(!t)return 0; const[h,m]=t.split(":").map(Number); return h*60+m; }
function minutesToHHMM(m){ if(!m||m<=0)return"00:00"; return`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`; }

function defaultTurnoTimes(dateStr, turno, isFeriado){
  const d=new Date(dateStr+"T12:00:00Z"); const dow=d.getUTCDay();
  const isWE = dow===0||dow===6||isFeriado;
  if(!isWE) return turno==="turno1"?{hi:"00:00",hf:"07:30"}:{hi:"17:30",hf:"00:00"};
  return turno==="turno1"?{hi:"00:00",hf:"12:00"}:{hi:"12:00",hf:"00:00"};
}

function parseDateBR(str){ if(!str)return null; const[d,m,y]=str.split("/"); return`${y}-${m}-${d}`; }
function formatDateBR(str){ if(!str)return""; const[y,m,d]=str.split("-"); return`${d}/${m}/${y}`; }

// ── Shared Components ─────────────────────────────────────────
function Input({label,value,onChange,type="text",placeholder,required,disabled}){
  return(
    <div style={S.formRow}>
      <label style={S.label}>{label}{required&&" *"}</label>
      <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{...S.input,background:disabled?"#f9f9f9":C.white}}
        onFocus={e=>e.target.style.borderColor=C.primary}
        onBlur={e=>e.target.style.borderColor=C.border}/>
    </div>
  );
}
function SelectField({label,value,onChange,options=[],required,disabled}){
  const[open,setOpen]=useState(false);
  const[search,setSearch]=useState("");
  const[dropPos,setDropPos]=useState({top:0,left:0,width:200});
  const triggerRef=useRef(null);
  const selectedLabel=(options.find(o=>String(o.value)===String(value||""))||{}).label||"";
  const filtered=options.filter(o=>(o.label||"").toLowerCase().includes(search.toLowerCase()));
  useEffect(()=>{
    if(!open)return;
    const h=e=>{if(triggerRef.current&&!triggerRef.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[open]);
  const handleOpen=()=>{
    if(disabled)return;
    if(triggerRef.current){
      const r=triggerRef.current.getBoundingClientRect();
      const spaceBelow=window.innerHeight-r.bottom-8;
      const spaceAbove=r.top-8;
      const openUp=spaceBelow<260&&spaceAbove>spaceBelow;
      setDropPos({
        top:openUp?undefined:r.bottom+4,
        bottom:openUp?window.innerHeight-r.top+4:undefined,
        maxH:openUp?spaceAbove:spaceBelow,
        left:r.left,width:r.width,openUp
      });
    }
    setOpen(o=>!o);
    setSearch("");
  };
  return(
    <div style={S.formRow}>
      <label style={S.label}>{label}{required&&" *"}</label>
      <div ref={triggerRef} style={{position:"relative"}}>
        <div onClick={handleOpen}
          style={{...S.select,cursor:disabled?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",userSelect:"none",minHeight:36,padding:"0 10px",background:disabled?C.bg:C.white,opacity:disabled?0.7:1}}>
          <span style={{color:value?C.text:C.textLight,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,fontSize:13}}>{selectedLabel||"Selecione..."}</span>
          <span style={{marginLeft:6,fontSize:10,color:C.textLight,flexShrink:0}}>{open?"▲":"▼"}</span>
        </div>
        {open&&(
          <div style={{position:"fixed",top:dropPos.top,bottom:dropPos.bottom,left:dropPos.left,width:Math.max(dropPos.width,320),zIndex:9999,
            maxHeight:dropPos.maxH||360,
            background:C.white,border:`1px solid ${C.border}`,borderRadius:4,boxShadow:"0 6px 24px rgba(0,0,0,.22)",display:"flex",flexDirection:dropPos.openUp?"column-reverse":"column"}}>
            <div style={{padding:"6px 8px",borderTop:dropPos.openUp?`1px solid ${C.border}`:"none",borderBottom:dropPos.openUp?"none":`1px solid ${C.border}`,flexShrink:0}}>
              <input autoFocus value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Pesquisar..." style={{...S.input,margin:0,padding:"4px 8px",fontSize:12,width:"100%",boxSizing:"border-box"}}/>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              <div style={{padding:"8px 12px",cursor:"pointer",color:C.textLight,fontSize:13}}
                onMouseDown={()=>{onChange("");setOpen(false);}}>Selecione...</div>
              {filtered.length===0
                ?<div style={{padding:"10px 12px",color:C.textLight,fontSize:13}}>Nenhum resultado</div>
                :filtered.map(o=>(
                  <div key={o.value} onMouseDown={()=>{onChange(o.value);setOpen(false);}}
                    style={{padding:"8px 12px",cursor:"pointer",fontSize:13,
                      background:String(o.value)===String(value||"")?"#EBF5FB":"none",
                      fontWeight:String(o.value)===String(value||"")?600:400}}
                    onMouseOver={e=>e.currentTarget.style.background="#f0f4f8"}
                    onMouseOut={e=>e.currentTarget.style.background=String(o.value)===String(value||"")?"#EBF5FB":"none"}>
                    {o.label}
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// mask: '9' = dígito, qualquer outro char = literal
function applyMask(raw,mask){
  const digits=(raw||"").replace(/\D/g,"");
  let out="",di=0;
  for(let i=0;i<mask.length&&di<digits.length;i++){
    out+=mask[i]==="9"?digits[di++]:mask[i];
  }
  return out;
}
const MASK_DATE  ="99/99/9999";
const MASK_CNPJ  ="99.999.999/9999-99";
const MASK_PHONE ="(99) 99999-9999";
const MASK_CEP   ="99.999-999";
const validarCPF=cpf=>{const n=cpf.replace(/\D/g,"");if(n.length!==11||/^(\d)\1+$/.test(n))return false;let s=0;for(let i=0;i<9;i++)s+=parseInt(n[i])*(10-i);let r=s%11<2?0:11-s%11;if(parseInt(n[9])!==r)return false;s=0;for(let i=0;i<10;i++)s+=parseInt(n[i])*(11-i);r=s%11<2?0:11-s%11;return parseInt(n[10])===r;};
const validarCNPJ=cnpj=>{const n=cnpj.replace(/\D/g,"");if(n.length!==14||/^(\d)\1+$/.test(n))return false;const calc=l=>{let s=0,p=l-7;for(let i=0;i<l;i++){s+=parseInt(n[i])*p--;if(p<2)p=9;}const r=s%11<2?0:11-s%11;return parseInt(n[l])===r;};return calc(12)&&calc(13);};
const parseCSVRows=text=>{const rows=[];const lines=text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n");for(const line of lines){if(!line.trim())continue;const cols=[];let i=0,cur="";while(i<line.length){if(line[i]==='"'){i++;while(i<line.length){if(line[i]==='"'&&line[i+1]==='"'){cur+='"';i+=2;}else if(line[i]==='"'){i++;break;}else{cur+=line[i++];}}if(line[i]===",")i++;}else{const end=line.indexOf(",",i);if(end===-1){cur=line.slice(i);i=line.length;}else{cur=line.slice(i,end);i=end+1;}}cols.push(cur.trim());cur="";}rows.push(cols);}return rows;};
function MaskedInput({label,value,onChange,mask,placeholder,required,disabled}){
  const handle=e=>onChange(applyMask(e.target.value,mask));
  return(
    <div style={S.formRow}>
      <label style={S.label}>{label}{required&&" *"}</label>
      <input value={value||""} onChange={handle} placeholder={placeholder} disabled={disabled}
        style={{...S.input,background:disabled?"#f9f9f9":C.white}}
        onFocus={e=>e.target.style.borderColor=C.primary}
        onBlur={e=>e.target.style.borderColor=C.border}/>
    </div>
  );
}
function Modal({title,onClose,children,wide,extraWide}){
  return(
    <div style={S.modal} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...S.modalCard,maxWidth:extraWide?1200:wide?860:520}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <span style={S.modalTitle}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.textLight}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function ConfirmModal({msg,onConfirm,onCancel}){
  return(
    <Modal title="Confirmar exclusão" onClose={onCancel}>
      <p style={{color:C.text,marginBottom:24}}>{msg}</p>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button style={S.btnCancel} onClick={onCancel}>Cancelar</button>
        <button style={{...S.actionBtn,...S.btnDel,padding:"9px 18px",fontSize:13}} onClick={onConfirm}>Excluir</button>
      </div>
    </Modal>
  );
}
function Spinner(){return <div style={S.spinner}>Carregando...</div>;}


// ── MOBILE TABLE ──────────────────────────────────────────────
// Renders a table as stacked cards on mobile
function MobileCardList({items,columns,actions}){
  return(
    <div>
      {items.map((item,idx)=>(
        <div key={item.id||idx} style={S.mobileCard}>
          {columns.filter(c=>!c.hideOnMobile).map(col=>(
            <div key={col.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,fontSize:13}}>
              <span style={{color:C.textLight,fontSize:11,fontWeight:600,minWidth:80}}>{col.label}</span>
              <span style={{textAlign:"right",flex:1,marginLeft:8}}>{col.render?col.render(item):item[col.key]||"—"}</span>
            </div>
          ))}
          {actions&&(
            <div style={{display:"flex",gap:8,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
              {actions(item)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────
function Login({onLogin}){
  const[email,setEmail]=useState("");const[password,setPassword]=useState("");
  const[error,setError]=useState("");const[loading,setLoading]=useState(false);
  const handleLogin=async()=>{
    setError("");setLoading(true);
    try{const data=await api.post("/auth/login",{email,password});api.setToken(data.token);onLogin(data.user,data.token);}
    catch(e){setError(e.message);}finally{setLoading(false);}
  };
  return(
    <div style={S.loginWrap}>
      <div style={{...S.loginCard,width:"90%",maxWidth:400,padding:window.innerWidth<480?"32px 24px":"48px 40px"}}>
        <div style={{textAlign:"center",marginBottom:28}}><Logo size={40}/></div>
        <p style={S.loginTitle}>SISTEMA DE CONTROLE DE TI</p>
        <p style={S.loginSub}>Informe suas credenciais para continuar</p>
        <Input label="E-mail" value={email} onChange={setEmail} placeholder="admin@slgrupo.com"/>
        <Input label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••"/>
        {error&&<p style={S.errorMsg}>{error}</p>}
        <button style={{...S.btnPrimary,opacity:loading?0.7:1}} onClick={handleLogin} disabled={loading}>{loading?"Entrando...":"Entrar"}</button>
      </div>
    </div>
  );
}

// ── SIMPLE LIST (Companies, Teams) ────────────────────────────
function SimpleListScreen({user,screenId,title,icon,apiPath}){
  const[items,setItems]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);const[delId,setDelId]=useState(null);
  const[saving,setSaving]=useState(false);const[form,setForm]=useState({id:null,name:"",active:true});
  const p=user.permissions?.[screenId];
  useEffect(()=>{if(!p?.view)return;api.get(apiPath).then(setItems).catch(e=>alert(e.message)).finally(()=>setLoading(false));},[]);
  const openAdd=()=>{setForm({id:null,name:"",active:true});setModal(true);};
  const openEdit=i=>{setForm({...i});setModal(true);};
  const save=async()=>{
    if(!form.name.trim())return alert("Nome é obrigatório.");setSaving(true);
    try{
      if(form.id){const u=await api.put(`${apiPath}/${form.id}`,form);setItems(is=>is.map(i=>i.id===u.id?u:i));}
      else{const c=await api.post(apiPath,form);setItems(is=>[...is,c]);}
      setModal(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`${apiPath}/${delId}`);setItems(is=>is.filter(i=>i.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  const isMob=useIsMobile();
  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>{icon} {title}</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo(a)</button>}</div>
      {items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>{icon}</span>Nenhum registro.</div>:
        isMob?(
          <MobileCardList items={items}
            columns={[
              {key:"name",label:"Nome",render:i=><strong>{i.name}</strong>},
              {key:"active",label:"Status",render:i=><span style={{...S.badge,...(i.active?S.badgeActive:S.badgeInactive)}}>{i.active?"Ativo":"Inativo"}</span>},
            ]}
            actions={item=>(
              <>
                {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit,flex:1,textAlign:"center"}} onClick={()=>openEdit(item)}><Icon name="edit" size={13}/> Editar</button>}
                {p?.delete&&<button style={{...S.actionBtn,...S.btnDel,flex:1,textAlign:"center"}} onClick={()=>setDelId(item.id)}><Icon name="trash" size={13}/> Excluir</button>}
              </>
            )}
          />
        ):(
        <table style={S.table}><thead><tr><th style={S.th}>Nome</th><th style={S.th}>Status</th><th style={S.th}>Ações</th></tr></thead>
        <tbody>{items.map(item=>(
          <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}><strong>{item.name}</strong></td>
            <td style={S.td}><span style={{...S.badge,...(item.active?S.badgeActive:S.badgeInactive)}}>{item.active?"Ativo":"Inativo"}</span></td>
            <td style={S.td}>
              {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(item)}><Icon name="edit" size={13}/> Editar</button>}
              {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}><Icon name="trash" size={13}/> Excluir</button>}
            </td>
          </tr>
        ))}</tbody></table>
        )
      }
      {modal&&(
        <Modal title={form.id?"Editar":"Novo(a)"} onClose={()=>setModal(false)}>
          <Input label="Nome" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
          <div style={S.formRow}><label style={S.label}>STATUS</label>
            <div style={{display:"flex",gap:16}}>{[{v:true,l:"Ativo"},{v:false,l:"Inativo"}].map(o=>(
              <label key={String(o.v)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                <input type="radio" checked={form.active===o.v} onChange={()=>setForm(f=>({...f,active:o.v}))} style={{accentColor:C.primary}}/>{o.l}
              </label>
            ))}</div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir este registro?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── EQUIPE ITENS MODAL ────────────────────────────────────────
function EquipeItensModal({equipe,user,onClose}){
  const[itens,setItens]=useState([]);
  const[funcionarios,setFuncionarios]=useState([]);
  const[loading,setLoading]=useState(true);
  const[form,setForm]=useState(null);   // null | {id,funcionarioId} — null=fechado
  const[delId,setDelId]=useState(null);
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState("");
  const p=user.permissions?.s4;

  const load=()=>{
    setLoading(true);
    api.get(`/teams/${equipe.id}/itens`).then(setItens).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{
    Promise.all([
      api.get(`/teams/${equipe.id}/itens`),
      api.get("/funcionarios/basic"),
    ]).then(([it,fn])=>{setItens(it);setFuncionarios(fn);}).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const openAdd=()=>{setErr("");setForm({id:null,funcionarioId:""});};
  const openEdit=it=>{setErr("");setForm({id:it.id,funcionarioId:it.funcionarioId});};

  const save=async()=>{
    if(!form.funcionarioId){setErr("Selecione um funcionário.");return;}
    setSaving(true);setErr("");
    try{
      if(form.id) await api.put(`/teams/${equipe.id}/itens/${form.id}`,{funcionarioId:form.funcionarioId});
      else        await api.post(`/teams/${equipe.id}/itens`,{funcionarioId:form.funcionarioId});
      setForm(null);load();
    }catch(e){setErr(e.message);}
    setSaving(false);
  };

  const del=async()=>{
    try{await api.delete(`/teams/${equipe.id}/itens/${delId}`);setDelId(null);load();}
    catch(e){alert(e.message);}
  };

  // Funcionários ainda não vinculados (exceto o que está sendo editado)
  const disponiveis=funcionarios.filter(f=>{
    const jaVinculado=itens.some(it=>it.funcionarioId===f.id);
    if(form?.id){
      const editando=itens.find(it=>it.id===form.id);
      if(editando?.funcionarioId===f.id)return true; // mantém o atual na lista
    }
    return!jaVinculado;
  });

  return(
    <>
      <Modal title={`👷 Itens Equipe — ${equipe.name}`} onClose={onClose} wide>
        {loading?<Spinner/>:(
          <>
            {p?.insert&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
              <button style={S.btnAdd} onClick={openAdd}>+ Adicionar Funcionário</button>
            </div>}

            {itens.length===0
              ?<div style={S.emptyState}><span style={S.emptyIcon}>👷</span>Nenhum funcionário nesta equipe.</div>
              :(
                <div style={{overflowX:"auto"}}>
                  <table style={S.table}><thead><tr>
                    {["Funcionário","Cargo","Centro de Custo","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>{itens.map(it=>(
                    <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                      <td style={{...S.td,fontWeight:600}}>{it.funcionarioNome||"—"}</td>
                      <td style={S.td}>{it.cargo||"—"}</td>
                      <td style={S.td}>{it.centroCusto||"—"}</td>
                      <td style={S.td}>
                        {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(it)}><Icon name="edit" size={13}/> Editar</button>}
                        {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/> Excluir</button>}
                      </td>
                    </tr>
                  ))}</tbody></table>
                </div>
              )
            }
          </>
        )}
        {delId&&<ConfirmModal msg="Remover este funcionário da equipe?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
      </Modal>

      {form!==null&&(
        <Modal title={form.id?"Editar Funcionário":"Adicionar Funcionário"} onClose={()=>setForm(null)}>
          <SelectField label="Funcionário *" value={form.funcionarioId}
            onChange={v=>setForm(f=>({...f,funcionarioId:v}))}
            options={disponiveis.map(f=>({value:f.id,label:f.nome}))}/>
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setForm(null)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── EQUIPES ───────────────────────────────────────────────────
function EquipesScreen({user}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const[delId,setDelId]=useState(null);
  const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({id:null,name:"",active:true,parentId:""});
  const[itensModal,setItensModal]=useState(null);
  const[expanded,setExpanded]=useState(new Set());
  const p=user.permissions?.s4;

  const reload=()=>{
    setLoading(true);
    api.get("/teams").then(setItems).catch(e=>alert(e.message)).finally(()=>setLoading(false));
  };
  useEffect(()=>{if(!p?.view)return;reload();},[]);

  const openAdd=()=>{setForm({id:null,name:"",active:true,parentId:""});setModal(true);};
  const openEdit=i=>{setForm({...i,parentId:i.parentId||""});setModal(true);};
  const save=async()=>{
    if(!form.name.trim())return alert("Nome é obrigatório.");
    setSaving(true);
    try{
      const body={...form,parentId:form.parentId||null};
      if(form.id) await api.put(`/teams/${form.id}`,body);
      else        await api.post("/teams",body);
      setModal(false);reload();
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{
    try{await api.delete(`/teams/${delId}`);setDelId(null);reload();}
    catch(e){alert(e.message);}
  };
  const toggle=id=>setExpanded(ex=>{const s=new Set(ex);s.has(id)?s.delete(id):s.add(id);return s;});
  const expandAll=()=>setExpanded(new Set(items.map(i=>i.id)));
  const collapseAll=()=>setExpanded(new Set());

  // Montar árvore a partir da lista plana
  const buildTree=list=>{
    const map={};
    list.forEach(t=>{map[t.id]={...t,children:[]};});
    const roots=[];
    list.forEach(t=>{
      if(t.parentId&&map[t.parentId]) map[t.parentId].children.push(map[t.id]);
      else roots.push(map[t.id]);
    });
    const sort=nodes=>{nodes.sort((a,b)=>a.name.localeCompare(b.name,"pt"));nodes.forEach(n=>sort(n.children));};
    sort(roots);
    return roots;
  };
  const tree=buildTree(items);

  // Renderiza nó da árvore (recursivo)
  const renderNode=(node,depth)=>{
    const hasChildren=node.children.length>0;
    const isExp=expanded.has(node.id);
    const indent=12+depth*24;
    return(
      <Fragment key={node.id}>
        <tr onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
          <td style={{...S.td,paddingLeft:indent}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
              {hasChildren
                ?<button onClick={()=>toggle(node.id)}
                    style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:C.primary,padding:"0 2px",lineHeight:1,minWidth:18}}>
                    {isExp?"▼":"▶"}
                  </button>
                :<span style={{display:"inline-block",width:18}}/>
              }
              <span style={{fontWeight:depth===0?700:600}}>{node.name}</span>
            </span>
          </td>
          <td style={S.td}><span style={{...S.badge,background:"#E3F2FD",color:"#1565C0",border:"1px solid #BBDEFB"}}>{node.membros??0} pessoa{(node.membros??0)!==1?"s":""}</span></td>
          <td style={S.td}><span style={{...S.badge,...(node.active?S.badgeActive:S.badgeInactive)}}>{node.active?"Ativo":"Inativo"}</span></td>
          <td style={S.td}>
            <button style={{...S.actionBtn,background:"#E3F2FD",color:"#1565C0",border:"1px solid #BBDEFB"}} onClick={()=>setItensModal(node)}>👷 Itens Equipe</button>
            {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(node)}><Icon name="edit" size={13}/> Editar</button>}
            {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(node.id)}><Icon name="trash" size={13}/> Excluir</button>}
          </td>
        </tr>
        {isExp&&node.children.map(child=>renderNode(child,depth+1))}
      </Fragment>
    );
  };

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>👷 Equipes</span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {items.length>0&&(
            <>
              <button style={{...S.btnCancel,fontSize:12,padding:"4px 10px"}} onClick={expandAll}>Expandir tudo</button>
              <button style={{...S.btnCancel,fontSize:12,padding:"4px 10px"}} onClick={collapseAll}>Recolher tudo</button>
            </>
          )}
          {p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Nova Equipe</button>}
        </div>
      </div>
      {items.length===0
        ?<div style={S.emptyState}><span style={S.emptyIcon}>👷</span>Nenhuma equipe cadastrada.</div>
        :(
          <table style={S.table}><thead><tr>
            {["Nome","Membros","Status","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{tree.map(node=>renderNode(node,0))}</tbody></table>
        )
      }

      {modal&&(
        <Modal title={form.id?"Editar Equipe":"Nova Equipe"} onClose={()=>setModal(false)}>
          <Input label="Nome" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
          <SelectField label="Subordinação (equipe superior)"
            value={form.parentId||""}
            onChange={v=>setForm(f=>({...f,parentId:v}))}
            options={items.filter(t=>t.id!==form.id).map(t=>({value:t.id,label:t.name}))}
            placeholder="Nenhuma (nó raiz)"/>
          <div style={S.formRow}><label style={S.label}>STATUS</label>
            <div style={{display:"flex",gap:16}}>
              {[{v:true,l:"Ativo"},{v:false,l:"Inativo"}].map(o=>(
                <label key={String(o.v)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                  <input type="radio" checked={form.active===o.v} onChange={()=>setForm(f=>({...f,active:o.v}))} style={{accentColor:C.primary}}/>{o.l}
                </label>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir esta equipe?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
      {itensModal&&<EquipeItensModal equipe={itensModal} user={user} onClose={()=>setItensModal(null)}/>}
    </div>
  );
}

// ── PROFILES ──────────────────────────────────────────────────
function ProfilesScreen({user}){
  const[profiles,setProfiles]=useState([]);const[screens,setScreens]=useState([]);
  const[loading,setLoading]=useState(true);const[modal,setModal]=useState(null);
  const[delId,setDelId]=useState(null);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({id:null,name:"",permissions:{}});
  const p=user.permissions?.s1;
  useEffect(()=>{if(!p?.view)return;Promise.all([api.get("/profiles"),api.get("/screens")]).then(([pr,sc])=>{setProfiles(pr);setScreens(sc);}).catch(e=>alert(e.message)).finally(()=>setLoading(false));},[]);
  const openAdd=()=>{const perms={};screens.forEach(s=>perms[s.id]={view:false,insert:false,edit:false,delete:false});setForm({id:null,name:"",permissions:perms});setModal("form");};
  const openEdit=pr=>{const perms={};screens.forEach(s=>{perms[s.id]=pr.permissions?.[s.id]||{view:false,insert:false,edit:false,delete:false};});setForm({...pr,permissions:perms});setModal("form");};
  const toggle=(sid,action)=>setForm(f=>({...f,permissions:{...f.permissions,[sid]:{...f.permissions[sid],[action]:!f.permissions[sid]?.[action]}}}));
  const save=async()=>{if(!form.name.trim())return alert("Nome obrigatório.");setSaving(true);try{if(form.id){const u=await api.put(`/profiles/${form.id}`,form);setProfiles(ps=>ps.map(p=>p.id===u.id?u:p));}else{const c=await api.post("/profiles",form);setProfiles(ps=>[...ps,c]);}setModal(null);}catch(e){alert(e.message);}finally{setSaving(false);}};
  const del=async()=>{try{await api.delete(`/profiles/${delId}`);setProfiles(ps=>ps.filter(p=>p.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>👤 Perfis de Acesso</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo Perfil</button>}</div>
      {profiles.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Nenhum perfil.</div>:(
        <table style={S.table}><thead><tr><th style={S.th}>Nome</th><th style={S.th}>Telas</th><th style={S.th}>Ações</th></tr></thead>
        <tbody>{profiles.map(pr=>(
          <tr key={pr.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}><strong>{pr.name}</strong></td>
            <td style={S.td}>{screens.filter(s=>pr.permissions?.[s.id]?.view).map(s=><span key={s.id} style={{...S.badge,...S.badgeActive,marginRight:4}}>{s.name}</span>)}</td>
            <td style={S.td}>{p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(pr)}><Icon name="edit" size={13}/> Editar</button>}{p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(pr.id)}><Icon name="trash" size={13}/> Excluir</button>}</td>
          </tr>
        ))}</tbody></table>
      )}
      {modal==="form"&&(
        <Modal title={form.id?"Editar Perfil":"Novo Perfil"} onClose={()=>setModal(null)} wide>
          <Input label="Nome do Perfil" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
          <label style={{...S.label,marginBottom:12}}>PERMISSÕES POR TELA</label>
          <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",marginBottom:16}}>
            <table style={S.table}><thead><tr style={{background:C.bg}}>
              <th style={{...S.th,width:"30%"}}>Tela</th>
              {["Visualizar","Incluir","Alterar","Excluir"].map(a=><th key={a} style={{...S.th,textAlign:"center"}}>{a}</th>)}
            </tr></thead><tbody>
              {screens.map(s=>(
                <tr key={s.id}><td style={S.td}>{s.name}<br/><small style={{color:C.textLight}}>{s.module}</small></td>
                  {["view","insert","edit","delete"].map(action=>(
                    <td key={action} style={{...S.td,textAlign:"center"}}>
                      <input type="checkbox" checked={!!form.permissions[s.id]?.[action]} onChange={()=>toggle(s.id,action)} style={{width:16,height:16,cursor:"pointer",accentColor:C.primary}}/>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody></table>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Excluir perfil?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── USERS ─────────────────────────────────────────────────────
function UsersScreen({user}){
  const[users,setUsers]=useState([]);const[profiles,setProfiles]=useState([]);
  const[companies,setCompanies]=useState([]);const[teams,setTeams]=useState([]);
  const[funcionarios,setFuncionarios]=useState([]);
  const[loading,setLoading]=useState(true);const[modal,setModal]=useState(false);
  const[delId,setDelId]=useState(null);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({id:null,name:"",apelido:"",email:"",password:"",profileId:"",companyId:"",teamId:"",active:true,isMaster:false,funcionarioId:""});
  const p=user.permissions?.s2;
  useEffect(()=>{if(!p?.view)return;Promise.all([api.get("/users"),api.get("/profiles"),api.get("/companies"),api.get("/teams"),api.get("/funcionarios")]).then(([u,pr,c,t,fn])=>{setUsers(u);setProfiles(pr);setCompanies(c);setTeams(t);setFuncionarios(fn);}).catch(e=>alert(e.message)).finally(()=>setLoading(false));},[]);
  const openAdd=()=>{setForm({id:null,name:"",apelido:"",email:"",password:"",profileId:"",companyId:"",teamId:"",active:true,isMaster:false,funcionarioId:""});setModal(true);};
  const openEdit=u=>{setForm({...u,apelido:u.apelido||"",password:"",funcionarioId:u.funcionarioId||""});setModal(true);};
  const save=async()=>{
    if(!form.name.trim()||!form.email.trim())return alert("Nome e e-mail obrigatórios.");
    if(!form.id&&!form.password.trim())return alert("Senha obrigatória.");
    setSaving(true);try{if(form.id){const u=await api.put(`/users/${form.id}`,form);setUsers(us=>us.map(x=>x.id===u.id?{...x,...u,funcionarioNome:funcionarios.find(f=>f.id===form.funcionarioId)?.nome||x.funcionarioNome}:x));}else{const c=await api.post("/users",form);setUsers(us=>[...us,{...c,funcionarioNome:funcionarios.find(f=>f.id===form.funcionarioId)?.nome}]);}setModal(false);}catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`/users/${delId}`);setUsers(us=>us.filter(u=>u.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  const[filterU,setFilterU]=useState({nome:"",email:"",funcionario:"",empresa:"",perfil:"",master:""});
  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  const fltU=users.filter(u=>(!filterU.nome||(u.name||"").toLowerCase().includes(filterU.nome.toLowerCase()))&&(!filterU.email||(u.email||"").toLowerCase().includes(filterU.email.toLowerCase()))&&(!filterU.funcionario||(u.funcionarioNome||"").toLowerCase().includes(filterU.funcionario.toLowerCase()))&&(!filterU.empresa||(u.companyName||"").toLowerCase().includes(filterU.empresa.toLowerCase()))&&(!filterU.perfil||(u.profileName||"").toLowerCase().includes(filterU.perfil.toLowerCase()))&&(filterU.master===""||String(!!u.isMaster)===(filterU.master==="sim"?"true":"false")));
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>👥 Usuários</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo Usuário</button>}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input placeholder="Nome" value={filterU.nome} onChange={e=>setFilterU(f=>({...f,nome:e.target.value}))} style={{...S.input,flex:"1 1 150px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="E-mail" value={filterU.email} onChange={e=>setFilterU(f=>({...f,email:e.target.value}))} style={{...S.input,flex:"1 1 170px",minWidth:140,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Funcionário Vinculado" value={filterU.funcionario} onChange={e=>setFilterU(f=>({...f,funcionario:e.target.value}))} style={{...S.input,flex:"1 1 180px",minWidth:150,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Empresa" value={filterU.empresa} onChange={e=>setFilterU(f=>({...f,empresa:e.target.value}))} style={{...S.input,flex:"1 1 140px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Perfil" value={filterU.perfil} onChange={e=>setFilterU(f=>({...f,perfil:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <select value={filterU.master} onChange={e=>setFilterU(f=>({...f,master:e.target.value}))} style={{...S.input,flex:"1 1 120px",minWidth:100,padding:"6px 10px",fontSize:13}}>
          <option value="">Master: Todos</option>
          <option value="sim">Master: Sim</option>
          <option value="nao">Master: Não</option>
        </select>
      </div>
      {users.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>👤</span>Nenhum usuário.</div>:(
        <table style={S.table}><thead><tr>
          {["Nome","E-mail","Funcionário Vinculado","Empresa","Perfil","Master","Status","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
        </tr></thead><tbody>{fltU.map(u=>(
          <tr key={u.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}><strong>{u.name}</strong></td><td style={S.td}>{u.email}</td>
            <td style={S.td}>{u.funcionarioNome||"—"}</td>
            <td style={S.td}>{u.companyName||"—"}</td><td style={S.td}>{u.profileName||"—"}</td>
            <td style={S.td}>{u.isMaster?<span style={{...S.badge,background:"#E3F2FD",color:"#1565C0"}}>✔ Master</span>:"—"}</td>
            <td style={S.td}><span style={{...S.badge,...(u.active?S.badgeActive:S.badgeInactive)}}>{u.active?"Ativo":"Inativo"}</span></td>
            <td style={S.td}>{p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(u)}><Icon name="edit" size={13}/> Editar</button>}{p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(u.id)}><Icon name="trash" size={13}/> Excluir</button>}</td>
          </tr>
        ))}</tbody></table>
      )}
      {modal&&(
        <Modal title={form.id?"Editar Usuário":"Novo Usuário"} onClose={()=>setModal(false)}>
          <Input label="Nome Completo" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
          <Input label="Apelido (exibido no sistema)" value={form.apelido||""} onChange={v=>setForm(f=>({...f,apelido:v}))} placeholder="Como deseja ser chamado"/>
          <Input label="E-mail" type="email" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} required/>
          <Input label={form.id?"Nova senha (em branco para manter)":"Senha"} type="password" value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} required={!form.id}/>
          <SelectField label="Funcionário Vinculado" value={form.funcionarioId} onChange={v=>setForm(f=>({...f,funcionarioId:v}))} options={funcionarios.map(fn=>({value:fn.id,label:fn.nome}))} placeholder="Selecione o funcionário"/>
          <SelectField label="Empresa"  value={form.companyId} onChange={v=>setForm(f=>({...f,companyId:v}))} options={companies.map(c=>({value:c.id,label:c.name}))}/>
          <SelectField label="Perfil"   value={form.profileId} onChange={v=>setForm(f=>({...f,profileId:v}))} options={profiles.map(p=>({value:p.id,label:p.name}))}/>
          <div style={S.formRow}><label style={S.label}>STATUS</label>
            <div style={{display:"flex",gap:16}}>{[{v:true,l:"Ativo"},{v:false,l:"Inativo"}].map(o=>(
              <label key={String(o.v)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                <input type="radio" checked={form.active===o.v} onChange={()=>setForm(f=>({...f,active:o.v}))} style={{accentColor:C.primary}}/>{o.l}
              </label>
            ))}</div>
          </div>
          <div style={{...S.formRow,display:"flex",alignItems:"center",gap:10,background:"#E3F2FD",borderRadius:8,padding:"10px 14px"}}>
            <input type="checkbox" id="isMaster" checked={!!form.isMaster} onChange={e=>setForm(f=>({...f,isMaster:e.target.checked}))}
              style={{width:16,height:16,accentColor:"#1565C0",cursor:"pointer"}}/>
            <label htmlFor="isMaster" style={{...S.label,marginBottom:0,cursor:"pointer",color:"#1565C0"}}>
              ✔ Usuário Master — pode editar/excluir extras avulsos de qualquer usuário
            </label>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Excluir usuário?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── CONTROLE DE HORAS ─────────────────────────────────────────
function ControleHorasScreen({user}){
  const[escalas,setEscalas]=useState([]);const[companies,setCompanies]=useState([]);const[teams,setTeams]=useState([]);
  const[loading,setLoading]=useState(true);const[modalEscala,setModalEscala]=useState(false);
  const[modalCal,setModalCal]=useState(null);const[delId,setDelId]=useState(null);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({id:null,companyId:"",teamIds:[],dataInicio:"",dataFim:""});
  const[teamOpen,setTeamOpen]=useState(false);
  const[filters,setFilters]=useState({companyId:"",teamId:"",dataFrom:"",dataTo:""});
  const isMob=useIsMobile();
  const p=user.permissions?.s5;
  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/escalas"),api.get("/companies"),api.get("/teams")])
      .then(([e,c,t])=>{setEscalas(e);setCompanies(c);setTeams(t);})
      .catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);
  const openAdd=()=>{setForm({id:null,companyId:"",teamIds:[],dataInicio:"",dataFim:""});setTeamOpen(false);setModalEscala(true);};
  const openEdit=e=>{setForm({...e,teamIds:e.teamIds||[]});setTeamOpen(false);setModalEscala(true);};
  const toggleFormTeam=id=>setForm(f=>({...f,teamIds:f.teamIds.includes(id)?f.teamIds.filter(x=>x!==id):[...f.teamIds,id]}));
  const saveEscala=async()=>{
    if(!form.companyId||!form.teamIds.length||!form.dataInicio||!form.dataFim)return alert("Todos os campos são obrigatórios.");
    setSaving(true);
    try{
      if(form.id){const u=await api.put(`/escalas/${form.id}`,form);setEscalas(es=>es.map(e=>e.id===u.id?u:e));setModalEscala(false);}
      else{const c=await api.post("/escalas",form);setEscalas(es=>[...es,c]);setModalEscala(false);setModalCal(c);}
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`/escalas/${delId}`);setEscalas(es=>es.filter(e=>e.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  const toISO5=d=>{if(!d||d.length<10)return"";const[dd,mm,yy]=d.split("/");return`${yy}-${mm}-${dd}`;};
  const filteredEscalas=escalas.filter(e=>{
    if(filters.companyId&&e.companyId!==filters.companyId)return false;
    if(filters.teamId&&!e.teamIds?.includes(filters.teamId))return false;
    if(filters.dataFrom&&toISO5(e.dataFim)<toISO5(filters.dataFrom))return false;
    if(filters.dataTo&&toISO5(e.dataInicio)>toISO5(filters.dataTo))return false;
    return true;
  });
  return(
    <div>
      <div style={{...S.card,marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:12}}>
          <SelectField label="Empresa" value={filters.companyId} onChange={v=>setFilters(f=>({...f,companyId:v}))} options={companies.map(c=>({value:c.id,label:c.name}))}/>
          <SelectField label="Equipe"  value={filters.teamId}    onChange={v=>setFilters(f=>({...f,teamId:v}))}    options={teams.map(t=>({value:t.id,label:t.name}))}/>
          <MaskedInput label="Período De" mask={MASK_DATE} value={filters.dataFrom} onChange={v=>setFilters(f=>({...f,dataFrom:v}))} placeholder="01/01/2025"/>
          <MaskedInput label="Período Até" mask={MASK_DATE} value={filters.dataTo}   onChange={v=>setFilters(f=>({...f,dataTo:v}))}   placeholder="31/01/2025"/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button style={{...S.btnCancel,marginRight:8}} onClick={()=>setFilters({companyId:"",teamId:"",dataFrom:"",dataTo:""})}>Limpar Filtros</button>
        </div>
      </div>
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>⏱️ Controle de Horas — Escalas de Sobreaviso</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Nova Escala</button>}</div>
      {filteredEscalas.length===0
        ? <div style={S.emptyState}><span style={S.emptyIcon}>📅</span>Nenhuma escala.</div>
        : isMob
          ? (
            <MobileCardList items={filteredEscalas}
              columns={[
                {key:"companyName",label:"Empresa", render:e=><strong>{e.companyName||"—"}</strong>},
                {key:"teamNamesStr",label:"Equipe",  render:e=>e.teamNamesStr||"—"},
                {key:"periodo",    label:"Período", render:e=>`${e.dataInicio} até ${e.dataFim}`},
              ]}
              actions={e=>(
                <>
                  <button style={{...S.actionBtn,background:"#E8F5E9",color:"#2E7D32",flex:1,textAlign:"center"}} onClick={()=>setModalCal(e)}>📅 Calendário</button>
                  {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit,flex:1,textAlign:"center"}} onClick={()=>openEdit(e)}>✏️</button>}
                  {p?.delete&&<button style={{...S.actionBtn,...S.btnDel,flex:1,textAlign:"center"}} onClick={()=>setDelId(e.id)}><Icon name="trash" size={13}/></button>}
                </>
              )}
            />
          )
          : (
            <table style={S.table}><thead><tr>
              <th style={S.th}>Empresa</th><th style={S.th}>Equipe</th><th style={S.th}>Período</th><th style={S.th}>Ações</th>
            </tr></thead><tbody>{filteredEscalas.map(e=>(
              <tr key={e.id} onMouseOver={ev=>ev.currentTarget.style.background=C.bg} onMouseOut={ev=>ev.currentTarget.style.background=C.white}>
                <td style={S.td}><strong>{e.companyName||"—"}</strong></td>
                <td style={S.td}>{e.teamNamesStr||"—"}</td>
                <td style={S.td}>{e.dataInicio} até {e.dataFim}</td>
                <td style={S.td}>
                  <button style={{...S.actionBtn,background:"#E8F5E9",color:"#2E7D32",marginRight:4}} onClick={()=>setModalCal(e)}>📅 Calendário</button>
                  {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(e)}><Icon name="edit" size={13}/> Editar</button>}
                  {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(e.id)}><Icon name="trash" size={13}/> Excluir</button>}
                </td>
              </tr>
            ))}</tbody></table>
          )
      }
      {modalEscala&&(
        <Modal title={form.id?"Editar Escala":"Nova Escala"} onClose={()=>setModalEscala(false)}>
          <SelectField label="Empresa" value={form.companyId} onChange={v=>setForm(f=>({...f,companyId:v}))} options={companies.map(c=>({value:c.id,label:c.name}))} required/>
          {/* Multi-select equipes — lista inline com scroll */}
          <div style={{marginBottom:12}}>
            <label style={S.label}>Equipe(s) <span style={{color:C.danger}}>*</span></label>
            <div style={{border:`1px solid ${C.border}`,borderRadius:6,maxHeight:160,overflowY:"auto"}}>
              {teams.map(t=>(
                <label key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 12px",cursor:"pointer",
                  borderBottom:`1px solid ${C.bg}`,background:form.teamIds.includes(t.id)?"#EFF6FF":C.white}}>
                  <input type="checkbox" checked={form.teamIds.includes(t.id)} onChange={()=>toggleFormTeam(t.id)} style={{accentColor:C.primary}}/>
                  <span style={{fontSize:13}}>{t.name}</span>
                </label>
              ))}
              {teams.length===0&&<div style={{padding:"10px 12px",fontSize:12,color:C.textLight}}>Sem equipes cadastradas</div>}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <MaskedInput label="Período Inicial" mask={MASK_DATE} value={form.dataInicio} onChange={v=>setForm(f=>({...f,dataInicio:v}))} placeholder="01/01/2025" required/>
            <MaskedInput label="Período Final"   mask={MASK_DATE} value={form.dataFim}    onChange={v=>setForm(f=>({...f,dataFim:v}))}    placeholder="31/01/2025" required/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModalEscala(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={saveEscala} disabled={saving}>{saving?"Salvando...":"Salvar e Abrir Calendário"}</button>
          </div>
        </Modal>
      )}
      {modalCal&&<CalendarioModal escala={modalCal} user={user} onClose={()=>setModalCal(null)}/>}
      {delId&&<ConfirmModal msg="Excluir esta escala?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
    </div>
  );
}

// ── CALENDÁRIO MODAL ──────────────────────────────────────────
function CalendarioModal({escala,user,onClose}){
  const[turnos,setTurnos]=useState({});// key: "YYYY-MM-DD_turno1"
  const[teamUsers,setTeamUsers]=useState([]);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState({});
  const[detalheModal,setDetalheModal]=useState(null);// {dateStr,turno,turnoData}

  // Build list of dates from dataInicio to dataFim
  const buildDates=()=>{
    const dates=[];
    const[di,mi,yi]=escala.dataInicio.split("/");const[df,mf,yf]=escala.dataFim.split("/");
    let cur=new Date(`${yi}-${mi}-${di}T12:00:00Z`);
    const end=new Date(`${yf}-${mf}-${df}T12:00:00Z`);
    while(cur<=end){
      const y=cur.getUTCFullYear();const m=String(cur.getUTCMonth()+1).padStart(2,"0");const d=String(cur.getUTCDate()).padStart(2,"0");
      dates.push(`${y}-${m}-${d}`);
      cur=new Date(cur.getTime()+86400000);
    }
    return dates;
  };
  const dates=buildDates();

  // Group dates by month for display
  const monthGroups=dates.reduce((acc,d)=>{
    const key=d.slice(0,7);if(!acc[key])acc[key]=[];acc[key].push(d);return acc;
  },{});

  useEffect(()=>{
    Promise.all([api.get(`/escalas/${escala.id}/turnos`),api.get(`/escalas/${escala.id}/usuarios`)])
      .then(([t,u])=>{
        const map={};t.forEach(r=>{map[`${r.turnoDate}_${r.turno}`]=r;});
        setTurnos(map);
        setTeamUsers(u.filter(usr=>!escala.companyId||usr.companyId===escala.companyId));
      }).catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  const handleUserChange=async(dateStr,turno,funcionarioId)=>{
    const key=`${dateStr}_${turno}`;setSaving(s=>({...s,[key]:true}));
    try{
      const result=await api.post(`/escalas/${escala.id}/turnos`,{turnoDate:dateStr,turno,funcionarioId:funcionarioId||null});
      setTurnos(t=>{
        const n={...t};
        if(!funcionarioId){ delete n[key]; }
        else{ n[key]={...(n[key]||{}),id:result?.id,funcionarioId,turnoDate:dateStr,turno}; }
        return n;
      });
    }catch(e){alert(e.message);}finally{setSaving(s=>({...s,[key]:false}));}
  };

  const openDetalhe=(dateStr,turno)=>{
    const key=`${dateStr}_${turno}`;
    const td=turnos[key];
    if(!td||!td.funcionarioId){alert("Selecione um responsável antes de editar os detalhes.");return;}
    setDetalheModal({dateStr,turno,turnoData:{...td}});
  };

  const saveDetalhe=async(updated)=>{
    const key=`${updated.dateStr}_${updated.turno}`;
    const td=turnos[key];
    if(!td?.id){
      alert("Erro: turno sem ID. Feche o calendário, reabra e tente novamente.");
      return;
    }
    try{
      await api.put(`/escalas/${escala.id}/turnos/${td.id}`,{
        isFeriado:updated.isFeriado,horaInicio:updated.horaInicio,horaFim:updated.horaFim,
        extraInicio:updated.extraInicio||null,extraFim:updated.extraFim||null,observacao:updated.observacao||null,
      });
      setTurnos(t=>({...t,[key]:{...t[key],...updated}}));
      setDetalheModal(null);
    }catch(e){alert("Erro ao salvar: "+e.message);}
  };

  const turnoConfig=[
    {key:"turno1",label:"Turno 1",bg:C.t1bg,border:C.t1border},
    {key:"turno2",label:"Turno 2",bg:C.t2bg,border:C.t2border},
  ];

  return(
    <div style={S.modal} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...S.modalCard,maxWidth:1100,width:"96%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <div style={S.modalTitle}>📅 Escala de Sobreaviso</div>
            <div style={{fontSize:13,color:C.textLight,marginTop:-14}}>{escala.companyName} · {escala.teamNamesStr||"—"} · {escala.dataInicio} a {escala.dataFim}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.textLight}}>✕</button>
        </div>
        <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap"}}>
          {turnoConfig.map(t=><div key={t.key} style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
            <div style={{width:14,height:14,borderRadius:3,background:t.bg,border:`2px solid ${t.border}`}}/><span>{t.label}</span>
          </div>)}
          <div style={{fontSize:12,color:C.textLight}}>· Clique em <strong>Turno 1/2</strong> após selecionar o responsável para editar horários e horas extras</div>
        </div>
        {loading?<Spinner/>:(
          <div style={{overflowY:"auto",maxHeight:"65vh"}}>
            {Object.entries(monthGroups).map(([monthKey,mDates])=>{
              const[y,m]=monthKey.split("-");
              const firstDow=new Date(`${monthKey}-01T12:00:00Z`).getUTCDay();
              // Build calendar grid for this month's dates only
              const allDaysInMonth=parseInt(new Date(parseInt(y),parseInt(m),0).getDate());
              return(
                <div key={monthKey} style={{marginBottom:24}}>
                  <div style={{fontWeight:700,color:C.accent,fontSize:14,marginBottom:8,padding:"6px 0",borderBottom:`2px solid ${C.primary}`}}>
                    {MONTHS[parseInt(m)-1]} {y}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
                    {DAYS_PT.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.accent,padding:"4px 0"}}>{d}</div>)}
                  </div>
                  {(()=>{
                    // Build rows for full month, only show dates in escala range
                    const rows=[];let week=Array(firstDow).fill(null);
                    for(let day=1;day<=allDaysInMonth;day++){
                      week.push(day);
                      if(week.length===7){rows.push([...week]);week=[];}
                    }
                    if(week.length>0){while(week.length<7)week.push(null);rows.push(week);}
                    return rows.map((week,wi)=>(
                      <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3}}>
                        {week.map((day,di)=>{
                          if(!day)return<div key={di}/>;
                          const dateStr=`${y}-${m}-${String(day).padStart(2,"0")}`;
                          const inRange=mDates.includes(dateStr);
                          const dow=new Date(dateStr+"T12:00:00Z").getUTCDay();
                          const isWE=dow===0||dow===6;
                          return(
                            <div key={di} style={{border:`1px solid ${C.border}`,borderRadius:6,padding:4,background:!inRange?"#f9f9f9":isWE?"#FFF8F0":C.white,minHeight:90,opacity:!inRange?.4:1}}>
                              <div style={{fontSize:11,fontWeight:700,color:isWE?C.secondary:C.accent,textAlign:"right",marginBottom:3}}>{day}</div>
                              {inRange&&turnoConfig.map(t=>{
                                const key=`${dateStr}_${t.key}`;
                                const td=turnos[key];
                                const isSaving=saving[key];
                                const userName=td?.funcionarioId?teamUsers.find(u=>u.funcionarioId===td.funcionarioId)?.name||"":"";
                                const hasExtra=td?.extraInicio&&td?.extraFim;
                                return(
                                  <div key={t.key} style={{marginBottom:3}}>
                                    <select value={td?.funcionarioId||""} onChange={e=>handleUserChange(dateStr,t.key,e.target.value)} disabled={isSaving}
                                      style={{width:"100%",fontSize:9,padding:"2px 3px",borderRadius:3,border:`1.5px solid ${t.border}`,background:isSaving?"#eee":t.bg,color:C.text,cursor:"pointer",outline:"none"}}>
                                      <option value="">— {t.label}</option>
                                      {teamUsers.map(u=><option key={u.funcionarioId} value={u.funcionarioId}>{u.name}</option>)}
                                    </select>
                                    {td?.funcionarioId&&(
                                      <button onClick={()=>openDetalhe(dateStr,t.key)}
                                        style={{width:"100%",fontSize:8,padding:"1px 3px",marginTop:1,border:`1px solid ${t.border}`,borderRadius:3,background:hasExtra?"#FFF3CD":t.bg,cursor:"pointer",color:C.accent,textAlign:"left",display:"flex",justifyContent:"space-between"}}>
                                        <span>{hasExtra?"⚡ Extra":t.label}</span>
                                        {td?.isFeriado&&<span>🎉</span>}
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
              );
            })}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
          <button style={S.btnSave} onClick={onClose}>Fechar</button>
        </div>
      </div>
      {detalheModal&&(
        <TurnoDetalheModal
          dateStr={detalheModal.dateStr}
          turno={detalheModal.turno}
          turnoData={detalheModal.turnoData}
          teamUsers={teamUsers}
          loggedUser={user}
          onSave={saveDetalhe}
          onClose={()=>setDetalheModal(null)}
        />
      )}
    </div>
  );
}

// ── TURNO DETALHE MODAL ───────────────────────────────────────
function TurnoDetalheModal({dateStr,turno,turnoData,teamUsers,loggedUser,onSave,onClose}){
  const d=new Date(dateStr+"T12:00:00Z");const dow=d.getUTCDay();
  const turnoLabel=turno==="turno1"?"Turno 1":"Turno 2";
  const dateLabel=`${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")}/${d.getUTCFullYear()}`;
  const dayName=DAYS_PT[dow];

  const[isFeriado,setIsFeriado]=useState(turnoData?.isFeriado||false);
  const[horaInicio,setHoraInicio]=useState(turnoData?.horaInicio||"");
  const[horaFim,setHoraFim]=useState(turnoData?.horaFim||"");
  const[extraInicio,setExtraInicio]=useState(turnoData?.extraInicio||"");
  const[extraFim,setExtraFim]=useState(turnoData?.extraFim||"");
  const[observacao,setObservacao]=useState(turnoData?.observacao||"");
  const[saving,setSaving]=useState(false);

  // Recalculate defaults when feriado changes
  useEffect(()=>{
    const isWE=dow===0||dow===6||isFeriado;
    if(!turnoData?.horaInicio){
      if(!isWE){setHoraInicio(turno==="turno1"?"00:00":"17:30");setHoraFim(turno==="turno1"?"07:30":"00:00");}
      else{setHoraInicio(turno==="turno1"?"00:00":"12:00");setHoraFim(turno==="turno1"?"12:00":"00:00");}
    }
  },[isFeriado]);

  // Only the assigned user (or Master) can edit extras
  const canEditExtra=loggedUser.id===turnoData?.userId||loggedUser.isMaster;
  const responsavel=teamUsers.find(u=>u.id===turnoData?.userId);

  // Calc extra duration
  let extraMin=0;
  if(extraInicio&&extraFim){let d=toMinutes(extraFim)-toMinutes(extraInicio);if(d<0)d+=1440;extraMin=d;}

  const handleSave=async()=>{
    setSaving(true);
    try{await onSave({dateStr,turno,isFeriado,horaInicio,horaFim,extraInicio:extraInicio||null,extraFim:extraFim||null,observacao:observacao||null});}
    finally{setSaving(false);}
  };

  return(
    <div style={{...S.modal,zIndex:1100}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...S.modalCard,maxWidth:480}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={S.modalTitle}>{turnoLabel} — {dateLabel} ({dayName})</span>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.textLight}}>✕</button>
        </div>
        <div style={{background:C.bg,borderRadius:8,padding:12,marginBottom:16,fontSize:13}}>
          <strong>Responsável:</strong> {responsavel?.name||"—"}
        </div>
        {/* Feriado */}
        <div style={{...S.formRow,display:"flex",alignItems:"center",gap:10}}>
          <input type="checkbox" id="feriado" checked={isFeriado} onChange={e=>setIsFeriado(e.target.checked)} style={{width:16,height:16,accentColor:C.primary,cursor:"pointer"}}/>
          <label htmlFor="feriado" style={{...S.label,marginBottom:0,cursor:"pointer"}}>🎉 Marcar como Feriado</label>
        </div>
        {/* Horários do turno */}
        <div style={{background:"#F8F9FA",borderRadius:8,padding:12,marginBottom:16}}>
          <div style={{fontSize:11,fontWeight:700,color:C.accent,marginBottom:10,letterSpacing:.5}}>HORÁRIO DO TURNO</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={S.formRow}><label style={S.label}>Hora Início</label><input value={horaInicio} readOnly style={{...S.input,background:"#f0f0f0",cursor:"default"}}/></div>
            <div style={S.formRow}><label style={S.label}>Hora Fim</label><input value={horaFim} readOnly style={{...S.input,background:"#f0f0f0",cursor:"default"}}/></div>
          </div>
        </div>
        {/* Horas extras - só o responsável edita */}
        <div style={{background:canEditExtra?"#FFFDE7":"#F5F5F5",borderRadius:8,padding:12,marginBottom:16,border:`1px solid ${canEditExtra?"#F9A825":C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.accent,marginBottom:10,letterSpacing:.5}}>⚡ HORAS EXTRAS {!canEditExtra&&<span style={{color:C.textLight,fontWeight:400}}>(apenas o responsável ou Master pode editar)</span>}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Início Extra" type="time" value={extraInicio} onChange={setExtraInicio} disabled={!canEditExtra}/>
            <Input label="Fim Extra"    type="time" value={extraFim}    onChange={setExtraFim}    disabled={!canEditExtra}/>
          </div>
          {extraMin>0&&<div style={{fontSize:12,color:C.success,fontWeight:700,marginTop:4}}>Total Extra: {minutesToHHMM(extraMin)}</div>}
          <div style={S.formRow}>
            <label style={S.label}>Observação / Motivo da Hora Extra</label>
            <textarea value={observacao} onChange={e=>setObservacao(e.target.value)} disabled={!canEditExtra} rows={2}
              style={{...S.input,resize:"vertical",background:!canEditExtra?"#f9f9f9":C.white}}
              placeholder={canEditExtra?"Descreva o motivo das horas extras...":""}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button style={S.btnCancel} onClick={onClose}>Cancelar</button>
          <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={handleSave} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
        </div>
      </div>
    </div>
  );
}


// ── EXTRA AVULSO ──────────────────────────────────────────────
function ExtraAvulsoScreen({user}){
  const[items,setItems]=useState([]);const[companies,setCompanies]=useState([]);
  const[teams,setTeams]=useState([]);
  const[allUsers,setAllUsers]=useState([]);
  const[loading,setLoading]=useState(true);const[modal,setModal]=useState(false);
  const[delId,setDelId]=useState(null);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({id:null,companyId:"",teamId:"",funcionarioId:"",data:"",horaInicio:"",horaFim:"",observacao:""});
  const[filters,setFilters]=useState({dataFrom:"",dataTo:"",funcionarioId:"",teamId:"",companyId:""});
  const isMob=useIsMobile();
  const p=user.permissions?.s7;

  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/extra-avulso"),api.get("/companies"),api.get("/teams"),api.get("/users/basic")])
      .then(([it,c,t,u])=>{setItems(it);setCompanies(c);setTeams(t);setAllUsers(u);})
      .catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  // Derivar usuários disponíveis: apenas quem tem funcionário vinculado e é da equipe selecionada
  const teamUsers=allUsers.filter(u=>
    u.funcionarioId&&
    (!form.companyId||u.companyId===form.companyId)&&
    (!form.teamId||u.teamId===form.teamId)&&
    u.active!==false
  );
  const myFuncId=allUsers.find(u=>u.id===user.id)?.funcionarioId||"";

  const openAdd=()=>{
    const fid=user.isMaster?"":(myFuncId||"");
    setForm({id:null,companyId:"",teamId:"",funcionarioId:fid,data:"",horaInicio:"",horaFim:"",observacao:""});
    setModal(true);
  };
  const openEdit=it=>{setForm({...it});setModal(true);};

  const save=async()=>{
    if(!form.companyId||!form.teamId||!form.funcionarioId||!form.data||!form.horaInicio||!form.horaFim)
      return alert("Preencha todos os campos obrigatórios.");
    setSaving(true);
    try{
      if(form.id){const u=await api.put(`/extra-avulso/${form.id}`,form);setItems(is=>is.map(i=>i.id===u.id?u:i));}
      else{const c=await api.post("/extra-avulso",form);setItems(is=>[c,...is]);}
      setModal(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };

  const del=async()=>{
    try{await api.delete(`/extra-avulso/${delId}`);setItems(is=>is.filter(i=>i.id!==delId));setDelId(null);}
    catch(e){alert(e.message);}
  };

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;

  const toISO7=d=>{if(!d||d.length<10)return"";const[dd,mm,yy]=d.split("/");return`${yy}-${mm}-${dd}`;};
  const filteredItems=items.filter(it=>{
    if(filters.companyId&&it.companyId!==filters.companyId)return false;
    if(filters.teamId&&it.teamId!==filters.teamId)return false;
    if(filters.funcionarioId&&it.funcionarioId!==filters.funcionarioId)return false;
    if(filters.dataFrom&&toISO7(it.data)<toISO7(filters.dataFrom))return false;
    if(filters.dataTo&&toISO7(it.data)>toISO7(filters.dataTo))return false;
    return true;
  });

  return(
    <div>
      <div style={{...S.card,marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12,marginBottom:12}}>
          <MaskedInput label="Data De" mask={MASK_DATE} value={filters.dataFrom} onChange={v=>setFilters(f=>({...f,dataFrom:v}))} placeholder="01/01/2025"/>
          <MaskedInput label="Data Até" mask={MASK_DATE} value={filters.dataTo}   onChange={v=>setFilters(f=>({...f,dataTo:v}))}   placeholder="31/01/2025"/>
          <SelectField label="Funcionário" value={filters.funcionarioId} onChange={v=>setFilters(f=>({...f,funcionarioId:v}))} options={allUsers.filter(u=>u.funcionarioId).map(u=>({value:u.funcionarioId,label:u.name}))}/>
          <SelectField label="Equipe"      value={filters.teamId}       onChange={v=>setFilters(f=>({...f,teamId:v}))}       options={teams.map(t=>({value:t.id,label:t.name}))}/>
          <SelectField label="Empresa"     value={filters.companyId}    onChange={v=>setFilters(f=>({...f,companyId:v}))}    options={companies.map(c=>({value:c.id,label:c.name}))}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button style={{...S.btnCancel,marginRight:8}} onClick={()=>setFilters({dataFrom:"",dataTo:"",funcionarioId:"",teamId:"",companyId:""})}>Limpar Filtros</button>
        </div>
      </div>
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>⚡ Extra Avulso</span>
        {p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo Extra</button>}
      </div>
      {filteredItems.length===0
        ? <div style={S.emptyState}><span style={S.emptyIcon}>⚡</span>Nenhum extra avulso lançado.</div>
        : isMob
          ? (
            <MobileCardList items={filteredItems}
              columns={[
                {key:"data",      label:"Data",    render:it=><strong>{it.data}</strong>},
                {key:"userName",  label:"Funcionário", render:it=>it.userName},
                {key:"teamName",  label:"Equipe",      render:it=>it.teamName},
                {key:"horaInicio",label:"Início",      render:it=>it.horaInicio},
                {key:"horaFim",   label:"Fim",         render:it=>it.horaFim},
                {key:"observacao",label:"Obs",         render:it=><span style={{fontSize:11,color:C.textLight}}>{it.observacao||"—"}</span>},
              ]}
              actions={it=>(
                <>
                  {(user.isMaster||it.createdBy===user.id)&&p?.edit&&<button style={{...S.actionBtn,...S.btnEdit,flex:1,textAlign:"center"}} onClick={()=>openEdit(it)}><Icon name="edit" size={13}/> Editar</button>}
                  {(user.isMaster||it.createdBy===user.id)&&p?.delete&&<button style={{...S.actionBtn,...S.btnDel,flex:1,textAlign:"center"}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/> Excluir</button>}
                </>
              )}
            />
          )
          : (
            <table style={S.table}>
              <thead><tr>
                {["Data","Funcionário","Equipe","Empresa","Início","Fim","Observação","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{filteredItems.map(it=>(
                <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                  <td style={S.td}><strong>{it.data}</strong></td>
                  <td style={S.td}>{it.userName}</td>
                  <td style={S.td}>{it.teamName}</td>
                  <td style={S.td}>{it.companyName}</td>
                  <td style={S.td}>{it.horaInicio}</td>
                  <td style={S.td}>{it.horaFim}</td>
                  <td style={S.td}><span style={{fontSize:12,color:C.textLight}}>{it.observacao||"—"}</span></td>
                  <td style={S.td}>
                    {(user.isMaster||it.createdBy===user.id)&&p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(it)}><Icon name="edit" size={13}/> Editar</button>}
                    {(user.isMaster||it.createdBy===user.id)&&p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/> Excluir</button>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          )
      }
      {modal&&(
        <Modal title={form.id?"Editar Extra Avulso":"Novo Extra Avulso"} onClose={()=>setModal(false)}>
          <SelectField label="Empresa"     value={form.companyId}    onChange={v=>setForm(f=>({...f,companyId:v,funcionarioId:user.isMaster?"":f.funcionarioId}))} options={companies.map(c=>({value:c.id,label:c.name}))} required/>
          <SelectField label="Equipe"      value={form.teamId}       onChange={v=>setForm(f=>({...f,teamId:v,funcionarioId:user.isMaster?"":f.funcionarioId}))}    options={teams.map(t=>({value:t.id,label:t.name}))} required/>
          <SelectField label="Funcionário" value={form.funcionarioId} onChange={v=>setForm(f=>({...f,funcionarioId:v}))} options={teamUsers.map(u=>({value:u.funcionarioId,label:u.name}))} required disabled={!user.isMaster}/>
          <MaskedInput label="Data" mask={MASK_DATE} value={form.data} onChange={v=>setForm(f=>({...f,data:v}))} placeholder="01/01/2025" required/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Input label="Hora Início" type="time" value={form.horaInicio} onChange={v=>setForm(f=>({...f,horaInicio:v}))} required/>
            <Input label="Hora Fim"    type="time" value={form.horaFim}    onChange={v=>setForm(f=>({...f,horaFim:v}))}    required/>
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Observação / Motivo *</label>
            <textarea value={form.observacao||""} onChange={e=>setForm(f=>({...f,observacao:e.target.value}))} rows={3}
              style={{...S.input,resize:"vertical"}} placeholder="Descreva o motivo das horas extras..."/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir este extra avulso?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
    </div>
  );
}

// ── RELATÓRIO DE HORAS ────────────────────────────────────────
function RelatorioHorasScreen({user}){
  const[companies,setCompanies]=useState([]);const[teams,setTeams]=useState([]);const[users,setUsers]=useState([]);
  const[filters,setFilters]=useState({dataInicio:"",dataFim:"",funcionarioId:"",teamIds:[],companyId:""});
  const[teamOpen,setTeamOpen]=useState(false);
  const[result,setResult]=useState(null);const[loading,setLoading]=useState(false);const[loaded,setLoaded]=useState(false);
  const p=user.permissions?.s6;
  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/companies"),api.get("/teams"),api.get("/users")])
      .then(([c,t,u])=>{setCompanies(c);setTeams(t);setUsers(u);}).catch(e=>alert(e.message));
  },[]);
  const buscar=async()=>{
    setLoading(true);setLoaded(false);
    try{
      const params=new URLSearchParams();
      if(filters.dataInicio)params.append("dataInicio",filters.dataInicio);
      if(filters.dataFim)params.append("dataFim",filters.dataFim);
      if(filters.funcionarioId)params.append("funcionarioId",filters.funcionarioId);
      if(filters.teamIds.length)params.append("teamIds",filters.teamIds.join(","));
      if(filters.companyId)params.append("companyId",filters.companyId);
      const data=await api.get(`/escalas/relatorio/horas?${params}`);
      setResult(data);setLoaded(true);
    }catch(e){alert(e.message);}finally{setLoading(false);}
  };
  const exportHorasPDF=()=>{
    if(!result||!result.length)return;
    const doc=new jsPDF({orientation:"landscape"});
    doc.setFontSize(14);doc.text("Relatório de Horas de Sobreaviso",14,14);
    const body=[];
    result.forEach(team=>{
      body.push([{content:`Equipe: ${team.teamName}`,colSpan:4,styles:{fillColor:[240,165,0],textColor:[255,255,255],fontStyle:"bold",fontSize:10}}]);
      team.users.forEach(u=>body.push([team.teamName,u.userName,u.plantoes,u.sobreavisoHHMM,u.extraHHMM]));
      body.push([{content:`TOTAL ${team.teamName}`,colSpan:2,styles:{fillColor:[255,248,225],fontStyle:"bold"}},{content:team.users.reduce((s,u)=>s+u.plantoes,0),styles:{fillColor:[255,248,225],fontStyle:"bold"}},{content:team.totalSobreavisoHHMM,styles:{fillColor:[255,248,225],fontStyle:"bold"}},{content:team.totalExtraHHMM,styles:{fillColor:[255,248,225],fontStyle:"bold"}}]);
    });
    autoTable(doc,{startY:20,head:[["Equipe","Usuário","Plantões","Total Sobreaviso","Total Extra"]],body,styles:{fontSize:9},headStyles:{fillColor:[97,97,97]}});
    doc.save("relatorio-horas.pdf");
  };
  const exportHorasExcel=()=>{
    if(!result||!result.length)return;
    const wsData=[["Equipe","Usuário","Plantões","Total Sobreaviso","Total Extra"]];
    result.forEach(team=>{
      team.users.forEach(u=>wsData.push([team.teamName,u.userName,u.plantoes,u.sobreavisoHHMM,u.extraHHMM]));
      wsData.push([`TOTAL ${team.teamName}`,"",team.users.reduce((s,u)=>s+u.plantoes,0),team.totalSobreavisoHHMM,team.totalExtraHHMM]);
    });
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(wsData),"Horas");XLSX.writeFile(wb,"relatorio-horas.xlsx");
  };
  const toggleTeamHoras=id=>setFilters(f=>({...f,teamIds:f.teamIds.includes(id)?f.teamIds.filter(x=>x!==id):[...f.teamIds,id]}));
  const teamsLabelHoras=filters.teamIds.length===0?"Todas":filters.teamIds.length===1?(teams.find(t=>t.id===filters.teamIds[0])?.name||"1 equipe"):`${filters.teamIds.length} equipes`;
  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  return(
    <div>
      {/* Filtros */}
      <div style={{...S.card,marginBottom:20}}>
        <div style={{...S.cardHeader,marginBottom:16}}><span style={S.cardTitle}>📊 Relatório de Horas de Sobreaviso</span><div style={{display:"flex",gap:8}}><button style={S.btnSave} onClick={exportHorasPDF} disabled={!result||!result.length}>⬇ PDF</button><button style={S.btnSave} onClick={exportHorasExcel} disabled={!result||!result.length}>⬇ Excel</button></div></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12,marginBottom:16}}>
          <MaskedInput label="Período Inicial" mask={MASK_DATE} value={filters.dataInicio} onChange={v=>setFilters(f=>({...f,dataInicio:v}))} placeholder="01/01/2025"/>
          <MaskedInput label="Período Final"   mask={MASK_DATE} value={filters.dataFim}    onChange={v=>setFilters(f=>({...f,dataFim:v}))}    placeholder="31/01/2025"/>
          <SelectField label="Empresa" value={filters.companyId} onChange={v=>setFilters(f=>({...f,companyId:v}))} options={companies.map(c=>({value:c.id,label:c.name}))}/>
          <div style={{flex:1,minWidth:160,position:"relative"}}>
            <label style={S.label}>Equipe</label>
            <button onClick={()=>setTeamOpen(o=>!o)}
              style={{...S.select,textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:C.white,width:"100%"}}>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{teamsLabelHoras}</span>
              <span style={{marginLeft:6,fontSize:10}}>{teamOpen?"▲":"▼"}</span>
            </button>
            {teamOpen&&(
              <div style={{position:"absolute",zIndex:200,top:"100%",left:0,right:0,background:C.white,
                border:`1px solid ${C.border}`,borderRadius:6,boxShadow:"0 4px 12px rgba(0,0,0,.12)",
                maxHeight:220,overflowY:"auto",padding:"6px 0"}}>
                {teams.map(t=>(
                  <label key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",cursor:"pointer",
                    background:filters.teamIds.includes(t.id)?"#EFF6FF":C.white}}>
                    <input type="checkbox" checked={filters.teamIds.includes(t.id)} onChange={()=>toggleTeamHoras(t.id)}/>
                    <span style={{fontSize:13}}>{t.name}</span>
                  </label>
                ))}
                {teams.length===0&&<div style={{padding:"8px 12px",fontSize:12,color:C.textLight}}>Sem equipes</div>}
              </div>
            )}
          </div>
          <SelectField label="Funcionário" value={filters.funcionarioId} onChange={v=>setFilters(f=>({...f,funcionarioId:v}))} options={users.filter(u=>u.funcionarioId).map(u=>({value:u.funcionarioId,label:u.name}))}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button style={S.btnSave} onClick={buscar} disabled={loading}>{loading?"Buscando...":<><Icon name="search" size={13}/> Pesquisar</>}</button>
        </div>
      </div>
      {/* Resultado */}
      {loaded&&result&&(
        result.length===0?(
          <div style={{...S.card,...S.emptyState}}><span style={S.emptyIcon}>📋</span>Nenhum registro encontrado para o período.</div>
        ):(
          result.map(team=>(
            <div key={team.teamId} style={{...S.card,marginBottom:16}}>
              <div style={{...S.cardHeader,marginBottom:12}}>
                <span style={{fontSize:15,fontWeight:700,color:C.accent}}>👷 {team.teamName}</span>
                <div style={{display:"flex",gap:20,fontSize:13}}>
                  <span>Total Sobreaviso: <strong style={{color:C.primary}}>{team.totalSobreavisoHHMM}</strong></span>
                  <span>Total Extra: <strong style={{color:C.danger}}>{team.totalExtraHHMM}</strong></span>
                </div>
              </div>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Usuário</th>
                  <th style={{...S.th,textAlign:"center"}}>Plantões</th>
                  <th style={{...S.th,textAlign:"center"}}>Total Sobreaviso</th>
                  <th style={{...S.th,textAlign:"center"}}>Total Extra</th>
                </tr></thead>
                <tbody>
                  {team.users.map(u=>(
                    <tr key={u.userId} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                      <td style={S.td}><strong>{u.userName}</strong></td>
                      <td style={{...S.td,textAlign:"center"}}>{u.plantoes}</td>
                      <td style={{...S.td,textAlign:"center"}}><span style={{fontWeight:700,color:C.primary}}>{u.sobreavisoHHMM}</span></td>
                      <td style={{...S.td,textAlign:"center"}}><span style={{fontWeight:700,color:u.totalExtraMins>0?C.danger:C.textLight}}>{u.extraHHMM}</span></td>
                    </tr>
                  ))}
                  {/* Totalizador */}
                  <tr style={{background:"#FFF8E1"}}>
                    <td style={{...S.td,fontWeight:700,color:C.accent}}>TOTAL {team.teamName.toUpperCase()}</td>
                    <td style={{...S.td,textAlign:"center",fontWeight:700}}>{team.users.reduce((s,u)=>s+u.plantoes,0)}</td>
                    <td style={{...S.td,textAlign:"center",fontWeight:700,color:C.primary}}>{team.totalSobreavisoHHMM}</td>
                    <td style={{...S.td,textAlign:"center",fontWeight:700,color:C.danger}}>{team.totalExtraHHMM}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))
        )
      )}
    </div>
  );
}

// ── EMPRESAS (s3) ─────────────────────────────────────────────
function EmpresasScreen({user}){
  const[items,setItems]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);const[delId,setDelId]=useState(null);
  const[saving,setSaving]=useState(false);
  const emptyEmp={id:null,name:"",razaoSocial:"",cnpj:"",inscEstadual:"",inscMunicipal:"",logradouro:"",numero:"",bairro:"",cep:"",cidade:"",estado:"",representanteLegal:"",active:true};
  const[form,setForm]=useState(emptyEmp);
  const[logoModal,setLogoModal]=useState(null);
  const[savingLogo,setSavingLogo]=useState(false);
  const p=user.permissions?.s3;
  useEffect(()=>{if(!p?.view)return;api.get("/companies").then(setItems).catch(e=>alert(e.message)).finally(()=>setLoading(false));},[]);
  const openAdd=()=>{setForm(emptyEmp);setModal(true);};
  const openEdit=i=>{setForm({...emptyEmp,...i,cnpj:i.cnpj||"",cep:i.cep||""});setModal(true);};
  const save=async()=>{
    if(!form.name.trim())return alert("Nome Fantasia é obrigatório.");
    if(form.cnpj?.replace(/\D/g,"").length===14&&!validarCNPJ(form.cnpj))return alert("CNPJ inválido.");
    setSaving(true);
    try{
      if(form.id){const u=await api.put(`/companies/${form.id}`,form);setItems(is=>is.map(i=>i.id===u.id?u:i));}
      else{const c=await api.post("/companies",form);setItems(is=>[...is,c]);}
      setModal(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`/companies/${delId}`);setItems(is=>is.filter(i=>i.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  const openLogo=async(it)=>{
    setLogoModal({id:it.id,name:it.name,logo:null,loading:true});
    try{const d=await api.get(`/companies/${it.id}/logo`);setLogoModal(m=>({...m,logo:d.logo,loading:false}));}
    catch(e){alert(e.message);setLogoModal(null);}
  };
  const handleLogoFile=e=>{
    const file=e.target.files[0];if(!file)return;
    if(!file.type.startsWith("image/"))return alert("Selecione um arquivo de imagem.");
    const reader=new FileReader();
    reader.onload=ev=>setLogoModal(m=>({...m,logo:ev.target.result}));
    reader.readAsDataURL(file);
  };
  const saveLogo=async()=>{
    setSavingLogo(true);
    try{await api.put(`/companies/${logoModal.id}/logo`,{logo:logoModal.logo||null});setLogoModal(null);}
    catch(e){alert(e.message);}finally{setSavingLogo(false);}
  };
  const[filterE,setFilterE]=useState({razaoSocial:"",fantasia:"",cnpj:""});
  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  const fltE=items.filter(it=>(!filterE.razaoSocial||(it.razaoSocial||"").toLowerCase().includes(filterE.razaoSocial.toLowerCase()))&&(!filterE.fantasia||(it.name||"").toLowerCase().includes(filterE.fantasia.toLowerCase()))&&(!filterE.cnpj||(it.cnpj||"").toLowerCase().includes(filterE.cnpj.toLowerCase())));
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>🏢 Empresas</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Nova Empresa</button>}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input placeholder="Razão Social" value={filterE.razaoSocial} onChange={e=>setFilterE(f=>({...f,razaoSocial:e.target.value}))} style={{...S.input,flex:"1 1 200px",minWidth:160,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Fantasia" value={filterE.fantasia} onChange={e=>setFilterE(f=>({...f,fantasia:e.target.value}))} style={{...S.input,flex:"1 1 180px",minWidth:150,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="CNPJ" value={filterE.cnpj} onChange={e=>setFilterE(f=>({...f,cnpj:e.target.value}))} style={{...S.input,flex:"1 1 160px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
      </div>
      {items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>🏢</span>Nenhuma empresa.</div>:(
        <table style={S.table}><thead><tr>
          {["Razão Social","Fantasia","CNPJ","Status","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
        </tr></thead>
        <tbody>{fltE.map(it=>(
          <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}>{it.razaoSocial||"—"}</td>
            <td style={S.td}><strong>{it.name}</strong></td>
            <td style={S.td}>{it.cnpj||"—"}</td>
            <td style={S.td}><span style={{...S.badge,...(it.active?S.badgeActive:S.badgeInactive)}}>{it.active?"Ativo":"Inativo"}</span></td>
            <td style={S.td}>
              {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(it)}><Icon name="edit" size={13}/> Editar</button>}
              {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/> Excluir</button>}
              <button style={{...S.actionBtn,background:"#FFF3E0",color:"#E65100"}} onClick={()=>openLogo(it)}>🖼️ Logo</button>
            </td>
          </tr>
        ))}</tbody></table>
      )}
      {modal&&(
        <Modal title={form.id?"Editar Empresa":"Nova Empresa"} onClose={()=>setModal(false)}>
          <Input label="Razão Social" value={form.razaoSocial||""} onChange={v=>setForm(f=>({...f,razaoSocial:v}))}/>
          <Input label="Fantasia" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
          <MaskedInput label="CNPJ" mask={MASK_CNPJ} value={form.cnpj} onChange={v=>setForm(f=>({...f,cnpj:v}))} placeholder="00.000.000/0000-00"/>
          <Input label="Insc. Estadual" value={form.inscEstadual||""} onChange={v=>setForm(f=>({...f,inscEstadual:v}))}/>
          <Input label="Insc. Municipal" value={form.inscMunicipal||""} onChange={v=>setForm(f=>({...f,inscMunicipal:v}))}/>
          <Input label="Logradouro" value={form.logradouro||""} onChange={v=>setForm(f=>({...f,logradouro:v}))}/>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><Input label="Número" value={form.numero||""} onChange={v=>setForm(f=>({...f,numero:v}))}/></div>
            <div style={{flex:2}}><Input label="Bairro" value={form.bairro||""} onChange={v=>setForm(f=>({...f,bairro:v}))}/></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><MaskedInput label="CEP" mask={MASK_CEP} value={form.cep||""} onChange={v=>setForm(f=>({...f,cep:v}))} placeholder="00.000-000"/></div>
            <div style={{flex:2}}><Input label="Cidade" value={form.cidade||""} onChange={v=>setForm(f=>({...f,cidade:v}))}/></div>
            <div style={{flex:1}}><Input label="Estado" value={form.estado||""} onChange={v=>setForm(f=>({...f,estado:v}))}/></div>
          </div>
          <Input label="Representante Legal" value={form.representanteLegal||""} onChange={v=>setForm(f=>({...f,representanteLegal:v}))}/>
          <div style={S.formRow}><label style={S.label}>STATUS</label>
            <div style={{display:"flex",gap:16}}>{[{v:true,l:"Ativo"},{v:false,l:"Inativo"}].map(o=>(
              <label key={String(o.v)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                <input type="radio" checked={form.active===o.v} onChange={()=>setForm(f=>({...f,active:o.v}))} style={{accentColor:C.primary}}/>{o.l}
              </label>
            ))}</div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {logoModal&&(
        <Modal title={`Logo — ${logoModal.name}`} onClose={()=>setLogoModal(null)}>
          {logoModal.loading?<Spinner/>:(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
              {logoModal.logo
                ?<img src={logoModal.logo} alt="Logo" style={{maxWidth:300,maxHeight:200,objectFit:"contain",border:`1px solid ${C.border}`,borderRadius:8,padding:8}}/>
                :<div style={{color:C.muted,fontSize:14,padding:24,border:`1px dashed ${C.border}`,borderRadius:8}}>Nenhuma logo cadastrada</div>
              }
              <label style={{...S.btnAdd,cursor:"pointer",display:"inline-block"}}>
                📁 Selecionar Imagem
                <input type="file" accept="image/*" style={{display:"none"}} onChange={handleLogoFile}/>
              </label>
              {logoModal.logo&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setLogoModal(m=>({...m,logo:null}))}>🗑️ Remover Logo</button>}
            </div>
          )}
          {!logoModal.loading&&(
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
              <button style={S.btnCancel} onClick={()=>setLogoModal(null)}>Cancelar</button>
              <button style={{...S.btnSave,opacity:savingLogo?0.7:1}} onClick={saveLogo} disabled={savingLogo}>{savingLogo?"Salvando...":"Salvar Logo"}</button>
            </div>
          )}
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir esta empresa?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── TIPO DE VEÍCULO (s8) ──────────────────────────────────────
function TipoVeiculoScreen({user}){
  const[items,setItems]=useState([]);const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);const[delId,setDelId]=useState(null);
  const[saving,setSaving]=useState(false);const[form,setForm]=useState({id:null,name:""});
  const p=user.permissions?.s8;
  useEffect(()=>{if(!p?.view)return;api.get("/vehicle-types").then(setItems).catch(e=>alert(e.message)).finally(()=>setLoading(false));},[]);
  const openAdd=()=>{setForm({id:null,name:""});setModal(true);};
  const openEdit=i=>{setForm({id:i.id,name:i.name});setModal(true);};
  const save=async()=>{
    if(!form.name.trim())return alert("Nome é obrigatório.");setSaving(true);
    try{
      if(form.id){const u=await api.put(`/vehicle-types/${form.id}`,{name:form.name});setItems(is=>is.map(i=>i.id===u.id?u:i));}
      else{const c=await api.post("/vehicle-types",{name:form.name});setItems(is=>[...is,c]);}
      setModal(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`/vehicle-types/${delId}`);setItems(is=>is.filter(i=>i.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>🚗 Tipo de Veículo</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo Tipo</button>}</div>
      {items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>🚗</span>Nenhum tipo cadastrado.</div>:(
        <table style={S.table}><thead><tr><th style={S.th}>Tipo de Veículo</th><th style={S.th}>Ações</th></tr></thead>
        <tbody>{items.map(it=>(
          <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}><strong>{it.name}</strong></td>
            <td style={S.td}>
              {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(it)}><Icon name="edit" size={13}/> Editar</button>}
              {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/> Excluir</button>}
            </td>
          </tr>
        ))}</tbody></table>
      )}
      {modal&&(
        <Modal title={form.id?"Editar Tipo de Veículo":"Novo Tipo de Veículo"} onClose={()=>setModal(false)}>
          <Input label="Tipo de Veículo" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir este tipo de veículo?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── VALOR DO KM (s9) ──────────────────────────────────────────
function ValorKmScreen({user}){
  const[items,setItems]=useState([]);const[vehicleTypes,setVehicleTypes]=useState([]);
  const[loading,setLoading]=useState(true);const[modal,setModal]=useState(false);
  const[delId,setDelId]=useState(null);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({id:null,vehicleTypeId:"",dataInicio:"",dataFim:"",valorKm:""});
  const p=user.permissions?.s9;
  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/km-values"),api.get("/vehicle-types")])
      .then(([kv,vt])=>{setItems(kv);setVehicleTypes(vt);}).catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);
  const openAdd=()=>{setForm({id:null,vehicleTypeId:"",dataInicio:"",dataFim:"",valorKm:""});setModal(true);};
  const openEdit=i=>{setForm({id:i.id,vehicleTypeId:i.vehicleTypeId,dataInicio:i.dataInicio,dataFim:i.dataFim,valorKm:String(i.valorKm)});setModal(true);};
  const save=async()=>{
    if(!form.vehicleTypeId||!form.dataInicio||!form.dataFim||!form.valorKm)return alert("Todos os campos são obrigatórios.");
    setSaving(true);
    try{
      if(form.id){const u=await api.put(`/km-values/${form.id}`,form);setItems(is=>is.map(i=>i.id===u.id?u:i));}
      else{const c=await api.post("/km-values",form);setItems(is=>[...is,c]);}
      setModal(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`/km-values/${delId}`);setItems(is=>is.filter(i=>i.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  const fmtVal=v=>v?Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"—";
  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>💰 Valor do km</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo Valor</button>}</div>
      {items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>💰</span>Nenhum valor cadastrado.</div>:(
        <table style={S.table}><thead><tr>
          {["Tipo de Veículo","Data Inicial","Data Final","Valor km","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
        </tr></thead>
        <tbody>{items.map(it=>(
          <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}><strong>{it.vehicleTypeName}</strong></td>
            <td style={S.td}>{it.dataInicio}</td>
            <td style={S.td}>{it.dataFim}</td>
            <td style={S.td}>{fmtVal(it.valorKm)}</td>
            <td style={S.td}>
              {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(it)}><Icon name="edit" size={13}/> Editar</button>}
              {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/> Excluir</button>}
            </td>
          </tr>
        ))}</tbody></table>
      )}
      {modal&&(
        <Modal title={form.id?"Editar Valor do km":"Novo Valor do km"} onClose={()=>setModal(false)}>
          <SelectField label="Tipo de Veículo" value={form.vehicleTypeId} onChange={v=>setForm(f=>({...f,vehicleTypeId:v}))}
            options={vehicleTypes.map(vt=>({value:vt.id,label:vt.name}))} required/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <MaskedInput label="Data Inicial" mask={MASK_DATE} value={form.dataInicio} onChange={v=>setForm(f=>({...f,dataInicio:v}))} placeholder="01/01/2025" required/>
            <MaskedInput label="Data Final"   mask={MASK_DATE} value={form.dataFim}   onChange={v=>setForm(f=>({...f,dataFim:v}))}   placeholder="31/12/2025" required/>
          </div>
          <Input label="Valor km (R$)" type="number" value={form.valorKm} onChange={v=>setForm(f=>({...f,valorKm:v}))} placeholder="0.00" required/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir este valor de km?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── REGISTRO DE KILOMETRAGEM (s10) ────────────────────────────
function RegistroKmScreen({user}){
  const[items,setItems]=useState([]);const[companies,setCompanies]=useState([]);
  const[teams,setTeams]=useState([]);
  const[allUsers,setAllUsers]=useState([]);
  const[vehicleTypes,setVehicleTypes]=useState([]);
  const[loading,setLoading]=useState(true);const[modal,setModal]=useState(false);
  const[delId,setDelId]=useState(null);const[saving,setSaving]=useState(false);
  const[filters,setFilters]=useState({dataFrom:"",dataTo:"",funcionarioId:"",teamId:""});
  const emptyForm={id:null,data:"",companyId:"",teamId:"",funcionarioId:"",vehicleTypeId:"",totalKm:"",valorKm:0,valorTotalKm:0,justificativa:""};
  const[form,setForm]=useState(emptyForm);
  const p=user.permissions?.s10;

  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/km-records"),api.get("/companies"),api.get("/teams"),api.get("/vehicle-types"),api.get("/users/basic")])
      .then(([it,c,t,vt,u])=>{setItems(it);setCompanies(c);setTeams(t);setVehicleTypes(vt);setAllUsers(u);})
      .catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  // Derivar usuários disponíveis: apenas quem tem funcionário vinculado e é da equipe selecionada
  const teamUsers=allUsers.filter(u=>
    u.funcionarioId&&
    (!form.companyId||u.companyId===form.companyId)&&
    (!form.teamId||u.teamId===form.teamId)&&
    u.active!==false
  );
  const myFuncIdKm=allUsers.find(u=>u.id===user.id)?.funcionarioId||"";

  useEffect(()=>{
    if(!form.vehicleTypeId||!form.data)return;
    api.get(`/km-values/lookup?vehicleTypeId=${form.vehicleTypeId}&date=${encodeURIComponent(form.data)}`)
      .then(r=>{
        const vk=parseFloat(r.valorKm)||0;
        const tk=parseFloat(form.totalKm)||0;
        setForm(f=>({...f,valorKm:vk,valorTotalKm:parseFloat((tk*vk).toFixed(2))}));
      }).catch(()=>{});
  },[form.vehicleTypeId,form.data]);

  const handleTotalKmChange=val=>{
    setForm(f=>{
      const tk=parseFloat(val)||0;
      const vk=parseFloat(f.valorKm)||0;
      return{...f,totalKm:val,valorTotalKm:parseFloat((tk*vk).toFixed(2))};
    });
  };

  const openAdd=()=>{
    const fid=user.isMaster?"":(myFuncIdKm||"");
    setForm({...emptyForm,funcionarioId:fid,companyId:user.companyId||"",teamId:user.teamId||""});
    setModal(true);
  };
  const openEdit=it=>{setForm({...it,totalKm:String(it.totalKm)});setModal(true);};
  const save=async()=>{
    if(!form.data||!form.companyId||!form.teamId||!form.funcionarioId||!form.vehicleTypeId||form.totalKm==="")
      return alert("Preencha todos os campos obrigatórios.");
    setSaving(true);
    try{
      if(form.id){const u=await api.put(`/km-records/${form.id}`,form);setItems(is=>is.map(i=>i.id===u.id?u:i));}
      else{const c=await api.post("/km-records",form);setItems(is=>[c,...is]);}
      setModal(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`/km-records/${delId}`);setItems(is=>is.filter(i=>i.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  const fmtMoney=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const canEdit=it=>user.isMaster||it.funcionarioId===myFuncIdKm;

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  const toISO10=d=>{if(!d||d.length<10)return"";const[dd,mm,yy]=d.split("/");return`${yy}-${mm}-${dd}`;};
  const filteredKm=items.filter(it=>{
    if(filters.teamId&&it.teamId!==filters.teamId)return false;
    if(filters.funcionarioId&&it.funcionarioId!==filters.funcionarioId)return false;
    if(filters.dataFrom&&toISO10(it.data)<toISO10(filters.dataFrom))return false;
    if(filters.dataTo&&toISO10(it.data)>toISO10(filters.dataTo))return false;
    return true;
  });
  return(
    <div>
      <div style={{...S.card,marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:12}}>
          <MaskedInput label="Data De" mask={MASK_DATE} value={filters.dataFrom} onChange={v=>setFilters(f=>({...f,dataFrom:v}))} placeholder="01/01/2025"/>
          <MaskedInput label="Data Até" mask={MASK_DATE} value={filters.dataTo}   onChange={v=>setFilters(f=>({...f,dataTo:v}))}   placeholder="31/01/2025"/>
          <SelectField label="Funcionário" value={filters.funcionarioId} onChange={v=>setFilters(f=>({...f,funcionarioId:v}))} options={allUsers.filter(u=>u.funcionarioId).map(u=>({value:u.funcionarioId,label:u.name}))}/>
          <SelectField label="Equipe"      value={filters.teamId}       onChange={v=>setFilters(f=>({...f,teamId:v}))}       options={teams.map(t=>({value:t.id,label:t.name}))}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button style={{...S.btnCancel,marginRight:8}} onClick={()=>setFilters({dataFrom:"",dataTo:"",funcionarioId:"",teamId:""})}>Limpar Filtros</button>
        </div>
      </div>
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>🛣️ Registro de Kilometragem</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo Registro</button>}</div>
      {filteredKm.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>🛣️</span>Nenhum registro.</div>:(
        <div style={{overflowX:"auto"}}>
        <table style={S.table}><thead><tr>
          {["Data","Funcionário","Equipe","Tipo Veículo","Total km","Valor km","Valor Total","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
        </tr></thead>
        <tbody>{filteredKm.map(it=>(
          <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}><strong>{it.data}</strong></td>
            <td style={S.td}>{it.userName}</td>
            <td style={S.td}>{it.teamName}</td>
            <td style={S.td}>{it.vehicleTypeName}</td>
            <td style={{...S.td,textAlign:"right",fontWeight:700}}>{Number(it.totalKm).toLocaleString("pt-BR")}</td>
            <td style={{...S.td,textAlign:"right"}}>{fmtMoney(it.valorKm)}</td>
            <td style={{...S.td,textAlign:"right",fontWeight:700,color:C.success}}>{fmtMoney(it.valorTotalKm)}</td>
            <td style={S.td}>
              {canEdit(it)&&p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(it)}>✏️</button>}
              {canEdit(it)&&p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/></button>}
            </td>
          </tr>
        ))}</tbody></table>
        </div>
      )}
      {modal&&(
        <Modal title={form.id?"Editar Registro de km":"Novo Registro de km"} onClose={()=>setModal(false)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <MaskedInput label="Data" mask={MASK_DATE} value={form.data} onChange={v=>setForm(f=>({...f,data:v}))} placeholder="01/01/2025" required/>
            <SelectField label="Empresa" value={form.companyId} onChange={v=>setForm(f=>({...f,companyId:v,userId:user.isMaster?"":f.userId}))} options={companies.map(c=>({value:c.id,label:c.name}))} required/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <SelectField label="Equipe"      value={form.teamId}       onChange={v=>setForm(f=>({...f,teamId:v,funcionarioId:user.isMaster?"":f.funcionarioId}))} options={teams.map(t=>({value:t.id,label:t.name}))} required/>
            <SelectField label="Funcionário" value={form.funcionarioId} onChange={v=>setForm(f=>({...f,funcionarioId:v}))}    options={teamUsers.map(u=>({value:u.funcionarioId,label:u.name}))} required disabled={!user.isMaster}/>
          </div>
          <SelectField label="Tipo de Veículo" value={form.vehicleTypeId} onChange={v=>setForm(f=>({...f,vehicleTypeId:v}))} options={vehicleTypes.map(vt=>({value:vt.id,label:vt.name}))} required/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
            <Input label="Total km *" type="number" value={String(form.totalKm)} onChange={handleTotalKmChange} placeholder="0" required/>
            <div style={S.formRow}>
              <label style={S.label}>Valor km (automático)</label>
              <input value={Number(form.valorKm).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})} disabled style={{...S.input,background:"#f9f9f9"}}/>
            </div>
            <div style={S.formRow}>
              <label style={S.label}>Valor Total km</label>
              <input value={Number(form.valorTotalKm).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})} disabled style={{...S.input,background:"#f9f9f9",fontWeight:700,color:C.success}}/>
            </div>
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Justificativa</label>
            <textarea value={form.justificativa||""} onChange={e=>setForm(f=>({...f,justificativa:e.target.value}))} rows={3}
              style={{...S.input,resize:"vertical"}} placeholder="Descreva o motivo/destino..."/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir este registro de km?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
    </div>
  );
}

// ── RELATÓRIO CONTROLE DE KILOMETRAGEM (s11) ─────────────────
function RelatorioKmScreen({user}){
  const[rows,setRows]=useState([]);const[loading,setLoading]=useState(false);
  const[companies,setCompanies]=useState([]);const[teams,setTeams]=useState([]);
  const[allUsers,setAllUsers]=useState([]);const[vehicleTypes,setVehicleTypes]=useState([]);
  const[filters,setFilters]=useState({dateFrom:"",dateTo:"",companyId:"",teamId:"",funcionarioId:"",vehicleTypeId:""});
  const p=user.permissions?.s11;

  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/companies"),api.get("/teams"),api.get("/users/basic"),api.get("/vehicle-types")])
      .then(([c,t,u,vt])=>{setCompanies(c);setTeams(t);setAllUsers(u);setVehicleTypes(vt);})
      .catch(e=>alert(e.message));
  },[]);

  const search=async()=>{
    setLoading(true);
    const q=new URLSearchParams();
    Object.entries(filters).forEach(([k,v])=>{if(v)q.set(k,v);});
    try{const r=await api.get(`/km-records/report?${q}`);setRows(r);}
    catch(e){alert(e.message);}finally{setLoading(false);}
  };

  const fmtMoney=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const fmtNum=v=>Number(v||0).toLocaleString("pt-BR");

  // Group by funcionário
  const groups=rows.reduce((acc,r)=>{
    const key=r.funcionarioId||r.userName;
    if(!acc[key]){acc[key]={userName:r.userName,rows:[],totalValorTotal:0};}
    acc[key].rows.push(r);
    acc[key].totalValorTotal+=parseFloat(r.valorTotalKm||0);
    return acc;
  },{});
  const grandTotal=rows.reduce((s,r)=>s+parseFloat(r.valorTotalKm||0),0);

  const exportKmPDF=()=>{
    const doc=new jsPDF({orientation:"landscape"});
    doc.setFontSize(14);doc.text("Controle de Km",14,14);
    const body=[];
    Object.values(groups).forEach(g=>{
      body.push([{content:`Usuário: ${g.userName}`,colSpan:5,styles:{fillColor:[240,165,0],textColor:[255,255,255],fontStyle:"bold",fontSize:10}}]);
      g.rows.forEach(r=>body.push([r.vehicleTypeName,fmtNum(r.totalKm),fmtMoney(r.valorKm),fmtMoney(r.valorTotalKm),r.justificativa||"—"]));
      body.push([{content:`Total ${g.userName}`,colSpan:3,styles:{fillColor:[255,248,225],fontStyle:"bold"}},{content:fmtMoney(g.totalValorTotal),styles:{fillColor:[255,248,225],fontStyle:"bold",halign:"right"}},{content:"",styles:{fillColor:[255,248,225]}}]);
    });
    body.push([{content:"TOTAL GERAL",colSpan:3,styles:{fillColor:[45,45,45],textColor:[255,255,255],fontStyle:"bold"}},{content:fmtMoney(grandTotal),styles:{fillColor:[240,165,0],fontStyle:"bold",halign:"right"}},{content:"",styles:{fillColor:[45,45,45]}}]);
    autoTable(doc,{startY:20,head:[["Tipo Veículo","Total km","Valor km","Valor Total km","Justificativa"]],body,styles:{fontSize:9},headStyles:{fillColor:[97,97,97]}});
    doc.save("controle-km.pdf");
  };

  const exportKmExcel=()=>{
    const ws=[["Usuário","Tipo Veículo","Total km","Valor km","Valor Total km","Justificativa"]];
    Object.values(groups).forEach(g=>{
      g.rows.forEach(r=>ws.push([g.userName,r.vehicleTypeName,Number(r.totalKm),Number(r.valorKm),Number(r.valorTotalKm),r.justificativa||""]));
      ws.push([`TOTAL ${g.userName}`,"","","",Number(g.totalValorTotal),""]);
    });
    ws.push(["TOTAL GERAL","","","",Number(grandTotal),""]);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ws),"Controle de Km");
    XLSX.writeFile(wb,"controle-km.xlsx");
  };

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>📊 Controle de Km</span><div style={{display:"flex",gap:8}}><button style={S.btnSave} onClick={exportKmPDF} disabled={rows.length===0}>⬇ PDF</button><button style={S.btnSave} onClick={exportKmExcel} disabled={rows.length===0}>⬇ Excel</button></div></div>
      {/* Filtros */}
      <div style={{background:C.bg,borderRadius:8,padding:16,marginBottom:20,border:`1px solid ${C.border}`}}>
        <div style={{fontSize:12,fontWeight:700,color:C.accent,marginBottom:12,letterSpacing:.5}}>FILTROS</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
          <MaskedInput label="Data De"  mask={MASK_DATE} value={filters.dateFrom} onChange={v=>setFilters(f=>({...f,dateFrom:v}))} placeholder="01/01/2025"/>
          <MaskedInput label="Data Até" mask={MASK_DATE} value={filters.dateTo}   onChange={v=>setFilters(f=>({...f,dateTo:v}))}   placeholder="31/12/2025"/>
          <SelectField label="Empresa"     value={filters.companyId}     onChange={v=>setFilters(f=>({...f,companyId:v}))}     options={companies.map(c=>({value:c.id,label:c.name}))}/>
          <SelectField label="Equipe"      value={filters.teamId}        onChange={v=>setFilters(f=>({...f,teamId:v}))}        options={teams.map(t=>({value:t.id,label:t.name}))}/>
          <SelectField label="Funcionário"  value={filters.funcionarioId} onChange={v=>setFilters(f=>({...f,funcionarioId:v}))} options={allUsers.filter(u=>u.funcionarioId).map(u=>({value:u.funcionarioId,label:u.name}))}/>
          <SelectField label="Tipo Veículo" value={filters.vehicleTypeId} onChange={v=>setFilters(f=>({...f,vehicleTypeId:v}))} options={vehicleTypes.map(vt=>({value:vt.id,label:vt.name}))}/>
        </div>
        <div style={{marginTop:12,display:"flex",gap:10}}>
          <button style={S.btnAdd} onClick={search}><Icon name="search" size={13}/> Pesquisar</button>
          <button style={S.btnCancel} onClick={()=>{setFilters({dateFrom:"",dateTo:"",companyId:"",teamId:"",funcionarioId:"",vehicleTypeId:""});setRows([]);}}>Limpar</button>
        </div>
      </div>
      {loading?<Spinner/>:rows.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📊</span>Nenhum resultado.</div>:(
        <div>
          {Object.values(groups).map(g=>(
            <div key={g.userName} style={{marginBottom:24}}>
              <div style={{background:C.primary,color:C.white,padding:"8px 14px",borderRadius:"6px 6px 0 0",fontWeight:700,fontSize:13}}>
                👤 {g.userName}
              </div>
              <div style={{overflowX:"auto"}}>
              <table style={{...S.table,tableLayout:"fixed",width:"100%"}}><thead><tr>
                <th style={{...S.th,width:"130px"}}>Tipo Veículo</th>
                <th style={{...S.th,width:"90px",textAlign:"right"}}>Total km</th>
                <th style={{...S.th,width:"100px",textAlign:"right"}}>Valor km</th>
                <th style={{...S.th,width:"120px",textAlign:"right"}}>Valor Total km</th>
                <th style={S.th}>Justificativa</th>
              </tr></thead>
              <tbody>
                {g.rows.map((r,i)=>(
                  <tr key={i} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                    <td style={{...S.td,fontSize:12}}>{r.vehicleTypeName}</td>
                    <td style={{...S.td,textAlign:"right",fontWeight:700,fontSize:12}}>{Number(r.totalKm).toLocaleString("pt-BR")}</td>
                    <td style={{...S.td,textAlign:"right",fontSize:12}}>{fmtMoney(r.valorKm)}</td>
                    <td style={{...S.td,textAlign:"right",fontWeight:700,color:C.success,fontSize:12}}>{fmtMoney(r.valorTotalKm)}</td>
                    <td style={{...S.td,fontSize:12,whiteSpace:"pre-wrap",wordBreak:"break-word",color:C.textLight,minWidth:160}}>{r.justificativa||"—"}</td>
                  </tr>
                ))}
                <tr style={{background:"#FFF8E1"}}>
                  <td colSpan={3} style={{...S.td,fontWeight:700,color:C.accent,fontSize:12}}>TOTAL {g.userName.toUpperCase()}</td>
                  <td style={{...S.td,textAlign:"right",fontWeight:700,color:C.primary,fontSize:12}}>{fmtMoney(g.totalValorTotal)}</td>
                  <td style={S.td}/>
                </tr>
              </tbody></table>
              </div>
            </div>
          ))}
          <div style={{background:C.dark,color:C.white,padding:"12px 16px",borderRadius:6,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:14,fontWeight:700}}>
            <span>TOTAL GERAL</span>
            <span style={{color:C.primary,fontSize:16}}>{fmtMoney(grandTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── FORNECEDORES (s12) ────────────────────────────────────────
function FornecedoresScreen({user}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const[delId,setDelId]=useState(null);
  const[saving,setSaving]=useState(false);
  const[filterF,setFilterF]=useState({razaoSocial:"",fantasia:"",cnpj:""});
  // Autocomplete "Fornecedor Base"
  const[baseQuery,setBaseQuery]=useState("");
  const[baseResults,setBaseResults]=useState([]);
  const[baseLoading,setBaseLoading]=useState(false);
  const[baseOpen,setBaseOpen]=useState(false);
  const baseTimer=useRef(null);

  const emptyForm={id:null,name:"",razaoSocial:"",tipo:"PJ",cnpj:"",inscEstadual:"",inscMunicipal:"",logradouro:"",numero:"",bairro:"",cep:"",cidade:"",estado:"",pais:"",contactName:"",contactPhone:"",contactEmail:"",observacao:""};
  const[form,setForm]=useState(emptyForm);
  const p=user.permissions?.s12;

  useEffect(()=>{if(!p?.view)return;api.get("/suppliers").then(setItems).catch(e=>alert(e.message)).finally(()=>setLoading(false));},[]);

  const openAdd=()=>{setForm(emptyForm);setBaseQuery("");setBaseResults([]);setBaseOpen(false);setModal(true);};
  const openEdit=i=>{setForm({...emptyForm,...i});setBaseQuery("");setBaseResults([]);setBaseOpen(false);setModal(true);};

  const onBaseInput=v=>{
    setBaseQuery(v);setBaseOpen(true);
    clearTimeout(baseTimer.current);
    if(v.trim().length<2){setBaseResults([]);return;}
    baseTimer.current=setTimeout(()=>{
      setBaseLoading(true);
      api.get(`/suppliers/busca-base?q=${encodeURIComponent(v.trim())}`)
        .then(r=>setBaseResults(r))
        .catch(()=>setBaseResults([]))
        .finally(()=>setBaseLoading(false));
    },400);
  };

  const selectBase=r=>{
    setForm(f=>({...f,
      razaoSocial:r.RazaoSocial||"",
      name:r.NomeFantasia||"",
      tipo:r.Tipo||"PJ",
      cnpj:r.CPF_CNPJ||"",
      inscEstadual:r.RG_CGF||"",
      logradouro:r.Endereco||"",
      bairro:r.Bairro||"",
      cep:r.CEP||"",
      cidade:r.Municipio||"",
      estado:r.Estado||"",
      pais:r.Pais||"",
      contactPhone:r.Telefone||"",
      contactEmail:r.Email||"",
    }));
    setBaseQuery((r.RazaoSocial||"")+(r.CPF_CNPJ?` — ${r.CPF_CNPJ}`:""));
    setBaseOpen(false);setBaseResults([]);
  };

  const cnpjMask=form.tipo==="PF"?"999.999.999-99":MASK_CNPJ;
  const cnpjPlaceholder=form.tipo==="PF"?"000.000.000-00":"00.000.000/0000-00";

  const save=async()=>{
    if(!form.name.trim())return alert("Nome Fantasia é obrigatório.");
    if(form.tipo==="PJ"&&form.cnpj?.replace(/\D/g,"").length===14&&!validarCNPJ(form.cnpj))return alert("CNPJ inválido.");
    setSaving(true);
    try{
      if(form.id){const u=await api.put(`/suppliers/${form.id}`,form);setItems(is=>is.map(i=>i.id===u.id?u:i));}
      else{const c=await api.post("/suppliers",form);setItems(is=>[...is,c]);}
      setModal(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`/suppliers/${delId}`);setItems(is=>is.filter(i=>i.id!==delId));setDelId(null);}catch(e){alert(e.message);}};

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  const fltF=items.filter(it=>(!filterF.razaoSocial||(it.razaoSocial||"").toLowerCase().includes(filterF.razaoSocial.toLowerCase()))&&(!filterF.fantasia||(it.name||"").toLowerCase().includes(filterF.fantasia.toLowerCase()))&&(!filterF.cnpj||(it.cnpj||"").toLowerCase().includes(filterF.cnpj.toLowerCase())));
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>🏭 Fornecedores</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo Fornecedor</button>}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input placeholder="Razão Social" value={filterF.razaoSocial} onChange={e=>setFilterF(f=>({...f,razaoSocial:e.target.value}))} style={{...S.input,flex:"1 1 180px",minWidth:140,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Fantasia" value={filterF.fantasia} onChange={e=>setFilterF(f=>({...f,fantasia:e.target.value}))} style={{...S.input,flex:"1 1 160px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="CNPJ/CPF" value={filterF.cnpj} onChange={e=>setFilterF(f=>({...f,cnpj:e.target.value}))} style={{...S.input,flex:"1 1 160px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
      </div>
      {items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>🏭</span>Nenhum fornecedor.</div>:(
        <div style={{overflowX:"auto"}}>
        <table style={S.table}><thead><tr>
          {["Razão Social","Fantasia","Tipo","CNPJ/CPF","Contato","Fone","E-mail","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
        </tr></thead>
        <tbody>{fltF.map(it=>(
          <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}>{it.razaoSocial||"—"}</td>
            <td style={S.td}><strong>{it.name}</strong></td>
            <td style={S.td}>{it.tipo||"—"}</td>
            <td style={S.td}>{it.cnpj||"—"}</td>
            <td style={S.td}>{it.contactName||"—"}</td>
            <td style={S.td}>{it.contactPhone||"—"}</td>
            <td style={S.td}>{it.contactEmail||"—"}</td>
            <td style={S.td}>
              {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(it)}><Icon name="edit" size={13}/> Editar</button>}
              {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/> Excluir</button>}
            </td>
          </tr>
        ))}</tbody></table>
        </div>
      )}
      {modal&&(
        <Modal title={form.id?"Editar Fornecedor":"Novo Fornecedor"} onClose={()=>setModal(false)}>
          {/* Fornecedor Base — somente no modo Novo */}
          {!form.id&&(
            <div style={{...S.formRow,position:"relative",marginBottom:16}}>
              <label style={S.label}>Fornecedor Base</label>
              <input value={baseQuery} onChange={e=>onBaseInput(e.target.value)}
                style={S.input} placeholder="Digite razão social ou CNPJ/CPF para buscar e preencher..."/>
              {baseLoading&&<span style={{position:"absolute",right:10,top:34,fontSize:11,color:C.textLight}}>Buscando...</span>}
              {baseOpen&&baseResults.length>0&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:C.white,
                  border:`1px solid ${C.border}`,borderRadius:6,boxShadow:"0 4px 16px rgba(0,0,0,0.13)",
                  zIndex:999,maxHeight:220,overflowY:"auto"}}>
                  {baseResults.map((r,i)=>(
                    <div key={i} onClick={()=>selectBase(r)}
                      style={{padding:"8px 14px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,fontSize:13}}
                      onMouseOver={e=>e.currentTarget.style.background=C.bg}
                      onMouseOut={e=>e.currentTarget.style.background=C.white}>
                      <div style={{fontWeight:600}}>{r.RazaoSocial}</div>
                      <div style={{fontSize:11,color:C.textLight}}>{r.CPF_CNPJ}{r.Tipo?` · ${r.Tipo}`:""}</div>
                    </div>
                  ))}
                </div>
              )}
              {baseOpen&&!baseLoading&&baseQuery.trim().length>=2&&baseResults.length===0&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:C.white,
                  border:`1px solid ${C.border}`,borderRadius:6,padding:"10px 14px",fontSize:13,
                  color:C.textLight,zIndex:999}}>Nenhum resultado encontrado.</div>
              )}
            </div>
          )}
          <Input label="Razão Social" value={form.razaoSocial||""} onChange={v=>setForm(f=>({...f,razaoSocial:v}))}/>
          <Input label="Fantasia" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
          <SelectField label="Tipo" value={form.tipo||"PJ"} onChange={v=>setForm(f=>({...f,tipo:v,cnpj:""}))}
            options={[{value:"PJ",label:"PJ - Pessoa Jurídica"},{value:"PF",label:"PF - Pessoa Física"}]}/>
          <MaskedInput label="CNPJ/CPF" mask={cnpjMask} value={form.cnpj||""}
            onChange={v=>setForm(f=>({...f,cnpj:v}))} placeholder={cnpjPlaceholder}/>
          <Input label="RG/CGF" value={form.inscEstadual||""} onChange={v=>setForm(f=>({...f,inscEstadual:v}))}/>
          <Input label="Insc. Municipal" value={form.inscMunicipal||""} onChange={v=>setForm(f=>({...f,inscMunicipal:v}))}/>
          <Input label="Logradouro" value={form.logradouro||""} onChange={v=>setForm(f=>({...f,logradouro:v}))}/>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><Input label="Número" value={form.numero||""} onChange={v=>setForm(f=>({...f,numero:v}))}/></div>
            <div style={{flex:2}}><Input label="Bairro" value={form.bairro||""} onChange={v=>setForm(f=>({...f,bairro:v}))}/></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><MaskedInput label="CEP" mask={MASK_CEP} value={form.cep||""} onChange={v=>setForm(f=>({...f,cep:v}))} placeholder="00.000-000"/></div>
            <div style={{flex:2}}><Input label="Cidade" value={form.cidade||""} onChange={v=>setForm(f=>({...f,cidade:v}))}/></div>
            <div style={{flex:1}}><Input label="Estado" value={form.estado||""} onChange={v=>setForm(f=>({...f,estado:v}))}/></div>
            <div style={{flex:1}}><Input label="País" value={form.pais||""} onChange={v=>setForm(f=>({...f,pais:v}))}/></div>
          </div>
          <Input label="Nome do Contato" value={form.contactName||""} onChange={v=>setForm(f=>({...f,contactName:v}))}/>
          <MaskedInput label="Fone do Contato" mask={MASK_PHONE} value={form.contactPhone||""} onChange={v=>setForm(f=>({...f,contactPhone:v}))} placeholder="(11) 99999-9999"/>
          <Input label="E-mail do Contato" type="email" value={form.contactEmail||""} onChange={v=>setForm(f=>({...f,contactEmail:v}))}/>
          <div style={S.formRow}>
            <label style={S.label}>Observação</label>
            <textarea value={form.observacao||""} onChange={e=>setForm(f=>({...f,observacao:e.target.value}))} rows={3}
              style={{...S.input,resize:"vertical"}} placeholder="Observações..."/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir este fornecedor?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── CONTRATOS (s13) ───────────────────────────────────────────
function ContratosScreen({user}){
  const[items,setItems]=useState([]);const[companies,setCompanies]=useState([]);
  const[suppliers,setSuppliers]=useState([]);
  const[loading,setLoading]=useState(true);const[modal,setModal]=useState(false);
  const[delId,setDelId]=useState(null);const[saving,setSaving]=useState(false);
  const[filters,setFilters]=useState({companyId:"",supplierId:"",contractNumber:"",dataFrom:"",dataTo:"",frequencia:"",status:""});
  const emptyForm={id:null,companyId:"",supplierId:"",contractNumber:"",dataInicio:"",dataFim:"",valor:"",valorAtual:"",observacao:"",frequencia:"",_newFiles:[]};
  const getStatus=dataFim=>{
    if(!dataFim)return"Ativo";
    const[d,m,y]=dataFim.split("/");
    const fim=new Date(`${y}-${m}-${d}`);
    const hoje=new Date();hoje.setHours(0,0,0,0);
    return fim<=hoje?"Inativo":"Ativo";
  };
  const[form,setForm]=useState(emptyForm);
  const[anexos,setAnexos]=useState([]);
  const[savingAnexos,setSavingAnexos]=useState(false);
  const contratoFileRef=useRef(null);
  const p=user.permissions?.s13;

  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/contracts"),api.get("/companies"),api.get("/suppliers")])
      .then(([it,c,s])=>{setItems(it);setCompanies(c);setSuppliers(s);})
      .catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  const openAdd=()=>{setForm(emptyForm);setAnexos([]);setModal(true);};
  const openEdit=async it=>{
    setForm({...it,valor:it.valor?String(it.valor):"",valorAtual:it.valorAtual?String(it.valorAtual):"",frequencia:it.frequencia||"",_newFiles:[]});
    setModal(true);
    try{const r=await api.get(`/contracts/${it.id}/anexos`);setAnexos(r);}catch{setAnexos([]);}
  };

  const downloadAnexoContrato=async(a)=>{
    try{
      const _sess=JSON.parse(localStorage.getItem("sl_session")||"{}");
      const resp=await fetch(`${API_URL}/contracts/download/${a.filename}`,{headers:{Authorization:`Bearer ${api.token||_sess.token||""}`}});
      if(!resp.ok)throw new Error("Erro ao baixar arquivo.");
      const blob=await resp.blob();
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");link.href=url;link.download=a.nomeOriginal;link.click();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
    }catch(e){alert(e.message);}
  };

  const delAnexoContrato=async(anexoId)=>{
    try{
      await api.delete(`/contracts/anexos/${anexoId}`);
      setAnexos(prev=>prev.filter(a=>a.id!==anexoId));
    }catch(e){alert(e.message);}
  };

  const uploadAnexos=async(contractId,files)=>{
    if(!files||!files.length)return;
    setSavingAnexos(true);
    try{
      const fd=new FormData();
      for(const f of files)fd.append("files",f);
      const _sess=JSON.parse(localStorage.getItem("sl_session")||"{}");
      const resp=await fetch(`${API_URL}/contracts/${contractId}/anexos`,{method:"POST",headers:{Authorization:`Bearer ${api.token||_sess.token||""}`},body:fd});
      if(!resp.ok)throw new Error("Erro ao salvar anexos.");
      const novos=await resp.json();
      setAnexos(prev=>[...prev,...novos]);
    }catch(e){alert(e.message);}
    finally{setSavingAnexos(false);}
  };

  const save=async()=>{
    if(!form.companyId||!form.supplierId)return alert("Empresa e Fornecedor são obrigatórios.");
    setSaving(true);
    try{
      let saved;
      if(form.id){saved=await api.put(`/contracts/${form.id}`,form);setItems(is=>is.map(i=>i.id===saved.id?saved:i));}
      else{saved=await api.post("/contracts",form);setItems(is=>[...is,saved]);}
      await uploadAnexos(saved.id,form._newFiles||[]);
      setModal(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`/contracts/${delId}`);setItems(is=>is.filter(i=>i.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  const fmtMoney=v=>v?Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"—";

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  const toISO13=d=>{if(!d||d.length<10)return"";const[dd,mm,yy]=d.split("/");return`${yy}-${mm}-${dd}`;};
  const filteredContratos=items.filter(it=>{
    if(filters.companyId&&it.companyId!==filters.companyId)return false;
    if(filters.supplierId&&it.supplierId!==filters.supplierId)return false;
    if(filters.contractNumber&&!((it.contractNumber||"").toLowerCase().includes(filters.contractNumber.toLowerCase())))return false;
    if(filters.dataFrom&&toISO13(it.dataInicio)<toISO13(filters.dataFrom))return false;
    if(filters.dataTo&&toISO13(it.dataFim)>toISO13(filters.dataTo))return false;
    if(filters.frequencia&&it.frequencia!==filters.frequencia)return false;
    if(filters.status&&getStatus(it.dataFim)!==filters.status)return false;
    return true;
  });
  return(
    <div>
      <div style={{background:C.bg,borderRadius:8,padding:16,marginBottom:16,border:`1px solid ${C.border}`}}>
        <div style={{fontSize:12,fontWeight:700,color:C.accent,marginBottom:12,letterSpacing:.5}}>FILTROS</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
          <SelectField label="Empresa"    value={filters.companyId}      onChange={v=>setFilters(f=>({...f,companyId:v}))}      options={companies.map(c=>({value:c.id,label:c.name}))}/>
          <SelectField label="Fornecedor" value={filters.supplierId}     onChange={v=>setFilters(f=>({...f,supplierId:v}))}     options={suppliers.map(s=>({value:s.id,label:s.name}))}/>
          <Input label="Nº Contrato"      value={filters.contractNumber} onChange={v=>setFilters(f=>({...f,contractNumber:v}))} placeholder="Buscar..."/>
          <MaskedInput label="Data Início De"   mask={MASK_DATE} value={filters.dataFrom} onChange={v=>setFilters(f=>({...f,dataFrom:v}))} placeholder="01/01/2025"/>
          <MaskedInput label="Data Término Até" mask={MASK_DATE} value={filters.dataTo}   onChange={v=>setFilters(f=>({...f,dataTo:v}))}   placeholder="31/12/2025"/>
          <SelectField label="Frequência" value={filters.frequencia} onChange={v=>setFilters(f=>({...f,frequencia:v}))} options={["Mensal","Trimestral","Semestral","Anual"].map(o=>({value:o,label:o}))}/>
          <SelectField label="Status"     value={filters.status}     onChange={v=>setFilters(f=>({...f,status:v}))}     options={["Ativo","Inativo"].map(o=>({value:o,label:o}))}/>
        </div>
        <div style={{marginTop:12,display:"flex",gap:10}}>
          <button style={S.btnCancel} onClick={()=>setFilters({companyId:"",supplierId:"",contractNumber:"",dataFrom:"",dataTo:"",frequencia:"",status:""})}>Limpar Filtros</button>
        </div>
      </div>
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>📄 Contratos</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo Contrato</button>}</div>
      {filteredContratos.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📄</span>Nenhum contrato.</div>:(
        <div style={{overflowX:"auto"}}>
        <table style={S.table}><thead><tr>
          {["Empresa","Fornecedor","Nº Contrato","Data Início","Data Término","Frequência","Status","Valor","Valor Atual","Anexos","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
        </tr></thead>
        <tbody>{filteredContratos.map(it=>{const st=getStatus(it.dataFim);return(
          <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}>{it.companyName}</td>
            <td style={S.td}><strong>{it.supplierName}</strong></td>
            <td style={S.td}>{it.contractNumber||"—"}</td>
            <td style={S.td}>{it.dataInicio||"—"}</td>
            <td style={S.td}>{it.dataFim||"—"}</td>
            <td style={S.td}>{it.frequencia||"—"}</td>
            <td style={S.td}><span style={{...S.badge,...(st==="Ativo"?S.badgeActive:S.badgeInactive)}}>{st}</span></td>
            <td style={{...S.td,textAlign:"right"}}>{fmtMoney(it.valor)}</td>
            <td style={{...S.td,textAlign:"right"}}>{fmtMoney(it.valorAtual)}</td>
            <td style={S.td}>
              {(it.anexosCount||0)>0&&(
                <span style={{...S.badge,...S.badgeActive}}>{it.anexosCount} arquivo(s)</span>
              )}
            </td>
            <td style={S.td}>
              {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(it)}><Icon name="edit" size={13}/> Editar</button>}
              {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/> Excluir</button>}
            </td>
          </tr>
        );})}</tbody></table>
        </div>
      )}
      {modal&&(
        <Modal title={form.id?"Editar Contrato":"Novo Contrato"} onClose={()=>setModal(false)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <SelectField label="Empresa"    value={form.companyId}  onChange={v=>setForm(f=>({...f,companyId:v}))}  options={companies.map(c=>({value:c.id,label:c.name}))}  required/>
            <SelectField label="Fornecedor" value={form.supplierId} onChange={v=>setForm(f=>({...f,supplierId:v}))} options={suppliers.map(s=>({value:s.id,label:s.name}))} required/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
            <Input label="Número do Contrato" value={form.contractNumber} onChange={v=>setForm(f=>({...f,contractNumber:v}))}/>
            <MaskedInput label="Data Início"  mask={MASK_DATE} value={form.dataInicio} onChange={v=>setForm(f=>({...f,dataInicio:v}))} placeholder="01/01/2025"/>
            <MaskedInput label="Data Término" mask={MASK_DATE} value={form.dataFim}    onChange={v=>setForm(f=>({...f,dataFim:v}))}    placeholder="31/12/2025"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
            <Input label="Valor (R$)"       type="number" value={form.valor}      onChange={v=>setForm(f=>({...f,valor:v}))}      placeholder="0.00"/>
            <Input label="Valor Atual (R$)" type="number" value={form.valorAtual} onChange={v=>setForm(f=>({...f,valorAtual:v}))} placeholder="0.00"/>
            <SelectField label="Frequência" value={form.frequencia} onChange={v=>setForm(f=>({...f,frequencia:v}))}
              options={["Mensal","Trimestral","Semestral","Anual"].map(o=>({value:o,label:o}))}/>
          </div>
          {form.dataFim&&(
            <div style={{...S.formRow,display:"flex",alignItems:"center",gap:10,background:getStatus(form.dataFim)==="Ativo"?"#D5F5E3":"#FDECEA",borderRadius:8,padding:"10px 14px"}}>
              <span style={{fontWeight:700,fontSize:13,color:getStatus(form.dataFim)==="Ativo"?"#1E8449":C.danger}}>
                Status: {getStatus(form.dataFim)}
              </span>
              <span style={{fontSize:12,color:C.textLight}}>(calculado automaticamente pela Data de Término)</span>
            </div>
          )}
          <div style={S.formRow}>
            <label style={S.label}>Observação</label>
            <textarea value={form.observacao||""} onChange={e=>setForm(f=>({...f,observacao:e.target.value}))} rows={4}
              style={{...S.input,resize:"vertical"}} placeholder="Observações do contrato..."/>
          </div>
          {/* Anexos */}
          <div style={S.formRow}>
            <label style={S.label}>Anexos</label>
            {anexos.map(a=>(
              <div key={a.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",border:`1px solid ${C.border}`,borderRadius:6,marginBottom:6}}>
                <span style={{fontSize:13,color:C.primary,fontWeight:600}}>📎 {a.nomeOriginal}</span>
                <div style={{display:"flex",gap:6}}>
                  <button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>downloadAnexoContrato(a)}><Icon name="download" size={13}/> Baixar</button>
                  {p?.edit&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>delAnexoContrato(a.id)}><Icon name="trash" size={13}/></button>}
                </div>
              </div>
            ))}
            {(form._newFiles||[]).map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",border:`1px dashed ${C.border}`,borderRadius:6,marginBottom:6}}>
                <span style={{fontSize:12,color:C.textLight}}>📎 {f.name}</span>
                <button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setForm(f=>({...f,_newFiles:f._newFiles.filter((_,j)=>j!==i)}))}><Icon name="trash" size={13}/></button>
              </div>
            ))}
            <input ref={contratoFileRef} type="file" multiple style={{display:"none"}} onChange={e=>{const files=Array.from(e.target.files);if(files.length)setForm(f=>({...f,_newFiles:[...(f._newFiles||[]),...files]}));e.target.value="";}}/>
            <button style={{...S.btnCancel,marginTop:4}} onClick={()=>contratoFileRef.current?.click()}><Icon name="paperclip" size={13}/> Selecionar Arquivos</button>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir este contrato?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
    </div>
  );
}

// ── RELATÓRIO CONTRATOS (s14) ─────────────────────────────────
function RelatorioContratosScreen({user}){
  const[rows,setRows]=useState([]);const[loading,setLoading]=useState(false);
  const[companies,setCompanies]=useState([]);const[suppliers,setSuppliers]=useState([]);
  const[filters,setFilters]=useState({companyId:"",supplierId:"",contractNumber:"",dateFrom:"",dateTo:"",status:"",frequencia:""});
  const p=user.permissions?.s14;

  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/companies"),api.get("/suppliers")])
      .then(([c,s])=>{setCompanies(c);setSuppliers(s);}).catch(e=>alert(e.message));
  },[]);

  const search=async()=>{
    setLoading(true);
    const q=new URLSearchParams();
    Object.entries(filters).forEach(([k,v])=>{if(v)q.set(k,v);});
    try{const r=await api.get(`/contracts/report?${q}`);setRows(r);}
    catch(e){alert(e.message);}finally{setLoading(false);}
  };

  const fmtMoney=v=>v?Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"—";

  const exportContratosPDF=()=>{
    const doc=new jsPDF({orientation:"landscape"});
    doc.setFontSize(14);doc.text("Relatório de Contratos",14,14);
    autoTable(doc,{
      startY:20,
      head:[["Fornecedor","Nº Contrato","Data Início","Data Término","Frequência","Status","Valor","Valor Atual","Observação"]],
      body:rows.map(r=>[r.supplierName,r.contractNumber||"—",r.dataInicio||"—",r.dataFim||"—",r.frequencia||"—",r.status,fmtMoney(r.valor),fmtMoney(r.valorAtual),r.observacao||"—"]),
      styles:{fontSize:8},headStyles:{fillColor:[97,97,97]},
      columnStyles:{8:{cellWidth:50}},
    });
    doc.save("relatorio-contratos.pdf");
  };

  const exportContratosExcel=()=>{
    const ws=[["Fornecedor","Nº Contrato","Data Início","Data Término","Frequência","Status","Valor","Valor Atual","Observação"]];
    rows.forEach(r=>ws.push([r.supplierName,r.contractNumber||"",r.dataInicio||"",r.dataFim||"",r.frequencia||"",r.status,Number(r.valor)||"",Number(r.valorAtual)||"",r.observacao||""]));
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(ws),"Contratos");
    XLSX.writeFile(wb,"relatorio-contratos.xlsx");
  };

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>📑 Relatório de Contratos</span><div style={{display:"flex",gap:8}}><button style={S.btnSave} onClick={exportContratosPDF} disabled={rows.length===0}>⬇ PDF</button><button style={S.btnSave} onClick={exportContratosExcel} disabled={rows.length===0}>⬇ Excel</button></div></div>
      <div style={{background:C.bg,borderRadius:8,padding:16,marginBottom:20,border:`1px solid ${C.border}`}}>
        <div style={{fontSize:12,fontWeight:700,color:C.accent,marginBottom:12,letterSpacing:.5}}>FILTROS</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
          <SelectField label="Empresa"    value={filters.companyId}      onChange={v=>setFilters(f=>({...f,companyId:v}))}      options={companies.map(c=>({value:c.id,label:c.name}))}/>
          <SelectField label="Fornecedor" value={filters.supplierId}     onChange={v=>setFilters(f=>({...f,supplierId:v}))}     options={suppliers.map(s=>({value:s.id,label:s.name}))}/>
          <Input label="Nº Contrato"      value={filters.contractNumber} onChange={v=>setFilters(f=>({...f,contractNumber:v}))} placeholder="Buscar..."/>
          <MaskedInput label="Data Início De"   mask={MASK_DATE} value={filters.dateFrom} onChange={v=>setFilters(f=>({...f,dateFrom:v}))} placeholder="01/01/2025"/>
          <MaskedInput label="Data Término Até" mask={MASK_DATE} value={filters.dateTo}   onChange={v=>setFilters(f=>({...f,dateTo:v}))}   placeholder="31/12/2025"/>
          <SelectField label="Status"     value={filters.status}         onChange={v=>setFilters(f=>({...f,status:v}))}
            options={["Ativo","Inativo"].map(o=>({value:o,label:o}))}/>
          <SelectField label="Frequência" value={filters.frequencia}     onChange={v=>setFilters(f=>({...f,frequencia:v}))}
            options={["Mensal","Trimestral","Semestral","Anual"].map(o=>({value:o,label:o}))}/>
        </div>
        <div style={{marginTop:12,display:"flex",gap:10}}>
          <button style={S.btnAdd} onClick={search}><Icon name="search" size={13}/> Pesquisar</button>
          <button style={S.btnCancel} onClick={()=>{setFilters({companyId:"",supplierId:"",contractNumber:"",dateFrom:"",dateTo:"",status:"",frequencia:""});setRows([]);}}>Limpar</button>
        </div>
      </div>
      {loading?<Spinner/>:rows.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📑</span>Nenhum resultado.</div>:(
        <div style={{overflowX:"auto"}}>
        <table style={S.table}><thead><tr>
          {["Fornecedor","Nº Contrato","Data Início","Data Término","Frequência","Status","Valor","Valor Atual","Observação"].map(h=><th key={h} style={S.th}>{h}</th>)}
        </tr></thead>
        <tbody>{rows.map(r=>{const st=r.status;return(
          <tr key={r.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}><strong>{r.supplierName}</strong></td>
            <td style={S.td}>{r.contractNumber||"—"}</td>
            <td style={S.td}>{r.dataInicio||"—"}</td>
            <td style={S.td}>{r.dataFim||"—"}</td>
            <td style={S.td}>{r.frequencia||"—"}</td>
            <td style={S.td}><span style={{...S.badge,...(st==="Ativo"?S.badgeActive:S.badgeInactive)}}>{st}</span></td>
            <td style={{...S.td,textAlign:"right"}}>{fmtMoney(r.valor)}</td>
            <td style={{...S.td,textAlign:"right"}}>{fmtMoney(r.valorAtual)}</td>
            <td style={{...S.td,minWidth:180}}><span style={{fontSize:12,color:C.textLight,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{r.observacao||"—"}</span></td>
          </tr>
        );})}</tbody></table>
        </div>
      )}
    </div>
  );
}

// ── OPERADORAS (s16) ─────────────────────────────────────────
function OperadorasScreen({user}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null); // null | {id?,name}
  const[delId,setDelId]=useState(null);
  const[err,setErr]=useState("");
  const isMobile=useIsMobile();

  const load=()=>api.get("/operadoras").then(setItems).catch(()=>{}).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const save=async()=>{
    if(!modal.name?.trim()){setErr("Nome é obrigatório.");return;}
    try{
      const payload={name:modal.name,contactName:modal.contactName||null,contactPhone:modal.contactPhone||null,contactEmail:modal.contactEmail||null,observacao:modal.observacao||null};
      if(modal.id) await api.put(`/operadoras/${modal.id}`,payload);
      else         await api.post("/operadoras",payload);
      setModal(null);load();
    }catch(e){setErr(e.message);}
  };
  const del=async()=>{
    try{await api.delete(`/operadoras/${delId}`);setDelId(null);load();}
    catch(e){alert(e.message);}
  };

  const canI=act=>user.permissions?.s16?.[act];
  const cols=[{key:"name",label:"Operadora"},{key:"contactName",label:"Contato"},{key:"contactPhone",label:"Fone"}];

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>📡 Operadoras</span>
        {canI("insert")&&<button style={S.btnAdd} onClick={()=>{setErr("");setModal({name:"",contactName:"",contactPhone:"",contactEmail:"",observacao:""});}}>+ Nova Operadora</button>}
      </div>
      {loading?<Spinner/>:items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📡</span>Nenhuma operadora cadastrada</div>:(
        isMobile
          ?<MobileCardList items={items} columns={cols} actions={item=>(
            <>{canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({id:item.id,name:item.name,contactName:item.contactName||"",contactPhone:item.contactPhone||"",contactEmail:item.contactEmail||"",observacao:item.observacao||""});}}>Editar</button>}
              {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}</>
          )}/>
          :<table style={S.table}><thead><tr><th style={S.th}>Operadora</th><th style={S.th}>Contato</th><th style={S.th}>Fone</th><th style={{...S.th,width:140}}>Ações</th></tr></thead>
            <tbody>{items.map(item=>(
              <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={S.td}>{item.name}</td>
                <td style={S.td}>{item.contactName||"—"}</td>
                <td style={S.td}>{item.contactPhone||"—"}</td>
                <td style={S.td}>
                  {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({id:item.id,name:item.name,contactName:item.contactName||"",contactPhone:item.contactPhone||"",contactEmail:item.contactEmail||"",observacao:item.observacao||""});}}>Editar</button>}
                  {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
      )}
      {modal&&(
        <Modal title={modal.id?"Editar Operadora":"Nova Operadora"} onClose={()=>setModal(null)}>
          <Input label="Operadora" value={modal.name} onChange={v=>setModal(m=>({...m,name:v}))} required/>
          <Input label="Nome do Contato" value={modal.contactName||""} onChange={v=>setModal(m=>({...m,contactName:v}))}/>
          <MaskedInput label="Fone do Contato" mask={MASK_PHONE} value={modal.contactPhone||""} onChange={v=>setModal(m=>({...m,contactPhone:v}))} placeholder="(11) 99999-9999"/>
          <Input label="E-mail do Contato" type="email" value={modal.contactEmail||""} onChange={v=>setModal(m=>({...m,contactEmail:v}))}/>
          <div style={S.formRow}>
            <label style={S.label}>Observação</label>
            <textarea value={modal.observacao||""} onChange={e=>setModal(m=>({...m,observacao:e.target.value}))} rows={3}
              style={{...S.input,resize:"vertical"}} placeholder="Observações..."/>
          </div>
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Excluir esta operadora?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// Parser genérico de CSV com cabeçalho — retorna array de objetos {header: valor}
function parseCSVGeneric(text){
  // remove BOM que o Excel adiciona em arquivos UTF-8
  const clean=text.replace(/^﻿/,"");
  const lines=clean.split(/\r?\n/).filter(l=>l.trim());
  if(lines.length<2)return{headers:[],rows:[]};
  const sep=(lines[0].split(";").length>=lines[0].split(",").length)?";":","
  const headers=lines[0].split(sep).map(h=>h.trim().replace(/^"|"$/g,""));
  const rows=lines.slice(1).map(l=>{
    const cols=l.split(sep).map(c=>c.trim().replace(/^"|"$/g,""));
    const obj={};
    headers.forEach((h,i)=>obj[h]=cols[i]||"");
    return obj;
  }).filter(r=>Object.values(r).some(v=>v));
  return{headers,rows};
}

// ── LINHAS FATURADAS (s17) ────────────────────────────────────
function parseCSV(text){
  const lines=text.split(/\r?\n/).filter(l=>l.trim());
  if(lines.length===0)return[];
  // auto-detect separator
  const sep=(lines[0].split(";").length>=lines[0].split(",").length)?";":","
  return lines.slice(1).map(l=>{
    const cols=l.split(sep).map(c=>c.trim().replace(/^"|"$/g,""));
    return{numeroLinha:cols[0]||"",plano:cols[1]||"",consumoLinha:cols[2]||"",valorLinha:cols[3]||""};
  }).filter(r=>r.numeroLinha);
}

function LinhasFaturadasScreen({user}){
  const[items,setItems]=useState([]);
  const[operadoras,setOperadoras]=useState([]);
  const[companies,setCompanies]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);      // form modal
  const[importModal,setImportModal]=useState(null); // {linha} import modal
  const[itensModal,setItensModal]=useState(null);   // {linha, itens[]}
  const[csvPreview,setCsvPreview]=useState(null);   // parsed rows before processing
  const[csvFile,setCsvFile]=useState(null);
  const[importing,setImporting]=useState(false);
  const[operadoraDetectada,setOperadoraDetectada]=useState(null);
  const[delId,setDelId]=useState(null);
  const[err,setErr]=useState("");
  const[filterItensLinha,setFilterItensLinha]=useState("");
  const[filterLF,setFilterLF]=useState({empresa:"",operadora:"",numeroLinha:""});
  const isMobile=useIsMobile();

  const[allLinhaItens,setAllLinhaItens]=useState([]);

  const load=()=>{
    setLoading(true);
    Promise.all([api.get("/linhas-faturadas"),api.get("/operadoras"),api.get("/companies"),api.get("/linhas-faturadas/itens/all")])
      .then(([lf,op,co,ai])=>{setItems(lf);setOperadoras(op);setCompanies(co);setAllLinhaItens(ai);})
      .catch(()=>{})
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const save=async()=>{
    if(!modal.operadoraId||!modal.mesAno?.trim()){setErr("Operadora e Mês/Ano são obrigatórios.");return;}
    try{
      const payload={operadoraId:modal.operadoraId,companyId:modal.companyId||null,mesAno:modal.mesAno,fatura:modal.fatura||null};
      if(modal.id) await api.put(`/linhas-faturadas/${modal.id}`,payload);
      else         await api.post("/linhas-faturadas",payload);
      setModal(null);load();
    }catch(e){setErr(e.message);}
  };

  const del=async()=>{
    try{await api.delete(`/linhas-faturadas/${delId}`);setDelId(null);load();}
    catch(e){alert(e.message);}
  };

  const handleFileChange=async e=>{
    const file=e.target.files[0];
    if(!file)return;
    setCsvFile(file);
    setCsvPreview(null);
    setOperadoraDetectada(null);
    const ext=file.name.split(".").pop().toLowerCase();
    if(ext==="csv"){
      const reader=new FileReader();
      reader.onload=ev=>{
        const rows=parseCSV(ev.target.result);
        setCsvPreview(rows);
      };
      reader.readAsText(file,"UTF-8");
    }else{
      setImporting(true);
      try{
        const fd=new FormData();
        fd.append("arquivo",file);
        const res=await api.upload(`/linhas-faturadas/${importModal.id}/itens/parsear-arquivo`,fd);
        setCsvPreview(res.itens);
        setOperadoraDetectada(res.operadoraDetectada);
      }catch(e){alert("❌ "+e.message);setCsvFile(null);}
      setImporting(false);
    }
  };

  const processar=async()=>{
    if(!csvPreview||csvPreview.length===0){alert("Nenhum dado válido no arquivo.");return;}
    setImporting(true);
    try{
      await api.post(`/linhas-faturadas/${importModal.id}/itens/importar`,{itens:csvPreview});
      setImportModal(null);setCsvPreview(null);setCsvFile(null);setOperadoraDetectada(null);load();
    }catch(e){alert(e.message);}
    setImporting(false);
  };

  const verItens=async(linha)=>{
    try{
      const itens=await api.get(`/linhas-faturadas/${linha.id}/itens`);
      setItensModal({linha,itens});
    }catch(e){alert(e.message);}
  };

  const gerarLinhasDisponiveis=async(item)=>{
    try{
      const res=await api.post(`/linhas-faturadas/${item.id}/gerar-linhas-disponiveis`,{});
      alert(`✅ Concluído!\nInseridas: ${res.inseridos}\nIgnoradas (já existiam): ${res.ignorados}\nTotal processado: ${res.total}`);
    }catch(e){alert(`❌ ${e.message}`);}
  };

  const exportItensPDF=()=>{
    if(!itensModal)return;
    const{linha,itens}=itensModal;
    const doc=new jsPDF({orientation:"landscape"});
    doc.setFontSize(13);
    doc.text(`Itens de Linhas Faturadas — ${linha.operadoraName} ${linha.mesAno}`,14,16);
    autoTable(doc,{
      head:[["Empresa","Operadora","Mês/Ano","Número Linha","Plano","Consumo Linha","Valor Linha"]],
      body:itens.map(i=>[i.companyName||"—",i.operadoraName,i.mesAno,i.numeroLinha||"—",i.plano||"—",i.consumoLinha||"—",i.valorLinha||"—"]),
      startY:24,styles:{fontSize:9},
      headStyles:{fillColor:[240,165,0],textColor:255,fontStyle:"bold"},
    });
    doc.save(`Itens_${linha.operadoraName}_${linha.mesAno}.pdf`);
  };

  const exportItensExcel=()=>{
    if(!itensModal)return;
    const{linha,itens}=itensModal;
    const ws=XLSX.utils.json_to_sheet(itens.map(i=>({
      "Empresa":i.companyName||"","Operadora":i.operadoraName,"Mês/Ano":i.mesAno,
      "Número Linha":i.numeroLinha,"Plano":i.plano,
      "Consumo Linha":i.consumoLinha,"Valor Linha":i.valorLinha,
    })));
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Itens");
    XLSX.writeFile(wb,`Itens_${linha.operadoraName}_${linha.mesAno}.xlsx`);
  };

  const canI=act=>user.permissions?.s17?.[act];
  const MASK_MESANO="99/9999";

  // Filtro da lista principal
  const idsComNumero=filterLF.numeroLinha
    ?new Set(allLinhaItens.filter(i=>(i.numeroLinha||"").toLowerCase().includes(filterLF.numeroLinha.toLowerCase())).map(i=>i.linhaFaturadaId))
    :null;
  const filteredLF=items.filter(item=>{
    if(filterLF.empresa&&item.companyId!==filterLF.empresa)return false;
    if(filterLF.operadora&&item.operadoraId!==filterLF.operadora)return false;
    if(idsComNumero&&!idsComNumero.has(item.id))return false;
    return true;
  });
  const hasLFFilter=filterLF.empresa||filterLF.operadora||filterLF.numeroLinha;

  return(
    <div>
      <div style={S.card}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>📱 Linhas Faturadas</span>
          {canI("insert")&&<button style={S.btnAdd} onClick={()=>{setErr("");setModal({operadoraId:"",companyId:"",mesAno:""});}}>+ Nova Linha</button>}
        </div>
        {/* Filtros */}
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
          <select value={filterLF.empresa} onChange={e=>setFilterLF(f=>({...f,empresa:e.target.value}))}
            style={{...S.select,width:"auto",minWidth:150}}>
            <option value="">Todas as empresas</option>
            {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterLF.operadora} onChange={e=>setFilterLF(f=>({...f,operadora:e.target.value}))}
            style={{...S.select,width:"auto",minWidth:150}}>
            <option value="">Todas as operadoras</option>
            {operadoras.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <input placeholder="Número Linha..." value={filterLF.numeroLinha}
            onChange={e=>setFilterLF(f=>({...f,numeroLinha:e.target.value}))}
            style={{...S.input,width:"auto",minWidth:150,padding:"6px 10px",fontSize:13}}/>
          {hasLFFilter&&<button style={S.btnCancel} onClick={()=>setFilterLF({empresa:"",operadora:"",numeroLinha:""})}>Limpar</button>}
        </div>
        {loading?<Spinner/>:filteredLF.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📱</span>{hasLFFilter?"Nenhum resultado para o filtro aplicado":"Nenhuma linha faturada cadastrada"}</div>:(
          isMobile?(
            <div>{filteredLF.map(item=>(
              <div key={item.id} style={S.mobileCard}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:6}}>{item.operadoraName}</div>
                <div style={{fontSize:12,color:C.textLight,marginBottom:4}}>Empresa: {item.companyName||"—"}</div>
                <div style={{fontSize:12,color:C.textLight,marginBottom:4}}>Mês/Ano: {item.mesAno}</div>
                <div style={{fontSize:12,color:C.textLight,marginBottom:4}}>Fatura: {item.fatura||"—"}</div>
                <div style={{fontSize:12,color:C.textLight,marginBottom:8}}>Itens importados: <strong>{item.totalItens}</strong></div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                  {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({id:item.id,operadoraId:item.operadoraId,companyId:item.companyId||"",mesAno:item.mesAno,fatura:item.fatura||""});}}>Editar</button>}
                  {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}
                  {canI("insert")&&<button style={{...S.actionBtn,background:"#E8F8F5",color:"#1E8449"}} onClick={()=>{setCsvPreview(null);setCsvFile(null);setOperadoraDetectada(null);setImportModal(item);}}>📥 Importar</button>}
                  <button style={{...S.actionBtn,background:"#EBF5FB",color:"#2980B9"}} onClick={()=>verItens(item)}>📋 Itens ({item.totalItens})</button>
                  {canI("insert")&&<button style={{...S.actionBtn,background:"#E8F0FF",color:"#4A235A"}} onClick={()=>gerarLinhasDisponiveis(item)}>📶 Gerar</button>}
                </div>
              </div>
            ))}</div>
          ):(
            <div style={{overflowX:"auto"}}>
              <table style={S.table}><thead><tr>
                {["Empresa","Operadora","Mês/Ano","Fatura","Itens Importados","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{filteredLF.map(item=>(
                <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                  <td style={S.td}>{item.companyName||"—"}</td>
                  <td style={{...S.td,fontWeight:600}}>{item.operadoraName}</td>
                  <td style={S.td}>{item.mesAno}</td>
                  <td style={S.td}>{item.fatura||"—"}</td>
                  <td style={S.td}><span style={{...S.badge,background:"#EBF5FB",color:"#2980B9"}}>{item.totalItens} {item.totalItens===1?"item":"itens"}</span></td>
                  <td style={S.td}>
                    {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({id:item.id,operadoraId:item.operadoraId,companyId:item.companyId||"",mesAno:item.mesAno,fatura:item.fatura||""});}}>Editar</button>}
                    {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}
                    {canI("insert")&&<button style={{...S.actionBtn,background:"#E8F8F5",color:"#1E8449"}} onClick={()=>{setCsvPreview(null);setCsvFile(null);setOperadoraDetectada(null);setImportModal(item);}}>📥 Importar</button>}
                    <button style={{...S.actionBtn,background:"#EBF5FB",color:"#2980B9"}} onClick={()=>verItens(item)}>📋 Ver Itens ({item.totalItens})</button>
                    {canI("insert")&&<button style={{...S.actionBtn,background:"#E8F0FF",color:"#4A235A"}} onClick={()=>gerarLinhasDisponiveis(item)}>📶 Gerar Linhas</button>}
                  </td>
                </tr>
              ))}</tbody></table>
            </div>
          )
        )}
      </div>

      {/* Form modal */}
      {modal&&(
        <Modal title={modal.id?"Editar Linha Faturada":"Nova Linha Faturada"} onClose={()=>setModal(null)}>
          <SelectField label="Empresa" value={modal.companyId} onChange={v=>setModal(m=>({...m,companyId:v}))}
            options={companies.filter(c=>c.active).map(c=>({value:c.id,label:c.name}))}/>
          <SelectField label="Operadora" value={modal.operadoraId} onChange={v=>setModal(m=>({...m,operadoraId:v}))} required
            options={operadoras.map(o=>({value:o.id,label:o.name}))}/>
          <MaskedInput label="Mês/Ano" value={modal.mesAno} onChange={v=>setModal(m=>({...m,mesAno:v}))} mask={MASK_MESANO} placeholder="MM/AAAA" required/>
          <Input label="Fatura" value={modal.fatura||""} onChange={v=>setModal(m=>({...m,fatura:v}))}/>
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}

      {/* Import CSV modal */}
      {importModal&&(
        <Modal title={`Importar — ${importModal.operadoraName} ${importModal.mesAno}`} onClose={()=>{setImportModal(null);setCsvPreview(null);setCsvFile(null);setOperadoraDetectada(null);}}>
          {importModal.totalItens>0&&(
            <div style={{background:"#FFF3CD",border:"1px solid #F0A500",borderRadius:6,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#7D5A00"}}>
              ⚠️ Esta linha já possui <strong>{importModal.totalItens} itens</strong> importados. Ao processar, eles serão <strong>substituídos</strong> pelos dados do novo arquivo.
            </div>
          )}
          <div style={S.formRow}>
            <label style={S.label}>Arquivo *</label>
            <div style={{fontSize:11,color:C.textLight,marginBottom:6}}>Aceita CSV ou arquivos brutos de operadora: TIM (.txt), Claro (FEBRABAN V3) e Vivo (SL_VIVO).</div>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <label style={{...S.btnAdd,display:"inline-block",cursor:"pointer",fontSize:12,padding:"8px 16px"}}>
                📂 Selecionar arquivo
                <input type="file" accept=".csv,.txt,.TXT,text/plain,text/csv" onChange={handleFileChange} style={{display:"none"}}/>
              </label>
              {csvFile&&<span style={{fontSize:12,color:C.textLight}}>{csvFile.name}</span>}
              {operadoraDetectada&&<span style={{fontSize:11,fontWeight:700,background:"#E8F8F5",color:"#1E8449",borderRadius:4,padding:"3px 8px"}}>🔍 {operadoraDetectada} detectada</span>}
              {importing&&!csvPreview&&<span style={{fontSize:12,color:C.textLight}}>Processando...</span>}
            </div>
          </div>
          {csvPreview&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:C.success,fontWeight:600,marginBottom:8}}>✅ {csvPreview.length} linha(s) encontrada(s) no arquivo</div>
              <div style={{maxHeight:200,overflowY:"auto",border:`1px solid ${C.border}`,borderRadius:6}}>
                <table style={{...S.table,fontSize:11}}><thead><tr>
                  {["Número Linha","Plano","Consumo Linha","Valor Linha"].map(h=><th key={h} style={{...S.th,fontSize:10,padding:"6px 8px"}}>{h}</th>)}
                </tr></thead>
                <tbody>{csvPreview.slice(0,10).map((r,i)=>(
                  <tr key={i}><td style={{...S.td,padding:"5px 8px"}}>{r.numeroLinha}</td><td style={{...S.td,padding:"5px 8px"}}>{r.plano}</td><td style={{...S.td,padding:"5px 8px"}}>{r.consumoLinha}</td><td style={{...S.td,padding:"5px 8px"}}>{r.valorLinha}</td></tr>
                ))}</tbody></table>
                {csvPreview.length>10&&<div style={{padding:"6px 10px",fontSize:11,color:C.textLight}}>...e mais {csvPreview.length-10} linha(s)</div>}
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>{setImportModal(null);setCsvPreview(null);setCsvFile(null);}}>Cancelar</button>
            <button style={{...S.btnSave,background:C.success}} onClick={processar} disabled={!csvPreview||importing}>
              {importing?"Processando...":"⚙️ Processar"}
            </button>
          </div>
        </Modal>
      )}

      {/* Itens modal */}
      {itensModal&&(()=>{
        const itensFilt=filterItensLinha
          ?itensModal.itens.filter(i=>(i.numeroLinha||"").toLowerCase().includes(filterItensLinha.toLowerCase()))
          :itensModal.itens;
        return(
          <Modal title={`Itens — ${itensModal.linha.operadoraName} ${itensModal.linha.mesAno}`} onClose={()=>{setItensModal(null);setFilterItensLinha("");}} extraWide>
            <div style={{marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <span style={{fontSize:12,color:C.textLight}}>{itensFilt.length}/{itensModal.itens.length} item(ns)</span>
              {itensModal.itens.length>0&&(
                <div style={{display:"flex",gap:8}}>
                  <button style={{...S.btnCancel,fontSize:12,padding:"6px 12px"}} onClick={exportItensPDF}><Icon name="file" size={13}/> PDF</button>
                  <button style={{...S.btnAdd,background:"#1D6F42",fontSize:12,padding:"6px 12px"}} onClick={exportItensExcel}><Icon name="chart" size={13}/> Excel</button>
                </div>
              )}
            </div>
            {/* Filtro por Número Linha */}
            <div style={{marginBottom:12,display:"flex",gap:8,alignItems:"center"}}>
              <input placeholder="Filtrar por Número Linha..." value={filterItensLinha}
                onChange={e=>setFilterItensLinha(e.target.value)}
                style={{...S.input,flex:1,padding:"6px 10px",fontSize:13}}/>
              {filterItensLinha&&<button style={S.btnCancel} onClick={()=>setFilterItensLinha("")}>Limpar</button>}
            </div>
            {itensFilt.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📋</span>{filterItensLinha?"Nenhum resultado para o filtro":"Nenhum item importado ainda"}</div>:(
              <div style={{overflowX:"auto",maxHeight:"55vh",overflowY:"auto"}}>
                <table style={S.table}><thead><tr>
                  {["Empresa","Operadora","Mês/Ano","Número Linha","Plano","Consumo Linha","Valor Linha"].map(h=><th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>{itensFilt.map(i=>(
                  <tr key={i.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                    <td style={S.td}>{i.companyName||"—"}</td><td style={S.td}>{i.operadoraName}</td><td style={S.td}>{i.mesAno}</td>
                    <td style={S.td}><strong>{i.numeroLinha||"—"}</strong></td>
                    <td style={S.td}>{i.plano||"—"}</td>
                    <td style={S.td}>{i.consumoLinha||"—"}</td>
                    <td style={S.td}>{i.valorLinha||"—"}</td>
                  </tr>
                ))}</tbody></table>
              </div>
            )}
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
              <button style={S.btnClose} onClick={()=>{setItensModal(null);setFilterItensLinha("");}}>Fechar</button>
            </div>
          </Modal>
        );
      })()}

      {delId&&<ConfirmModal msg="Excluir esta linha e todos os seus itens importados?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── TIPO DE ATIVOS (s18) ──────────────────────────────────────
function TipoAtivosScreen({user}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  const[delId,setDelId]=useState(null);
  const[err,setErr]=useState("");
  const isMobile=useIsMobile();

  const load=()=>api.get("/tipo-ativos").then(setItems).catch(()=>{}).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);

  const save=async()=>{
    if(!modal.name?.trim()){setErr("Nome é obrigatório.");return;}
    try{
      if(modal.id) await api.put(`/tipo-ativos/${modal.id}`,{name:modal.name});
      else         await api.post("/tipo-ativos",{name:modal.name});
      setModal(null);load();
    }catch(e){setErr(e.message);}
  };
  const del=async()=>{
    try{await api.delete(`/tipo-ativos/${delId}`);setDelId(null);load();}
    catch(e){alert(e.message);}
  };
  const canI=act=>user.permissions?.s18?.[act];

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>🗂️ Tipo de Ativo</span>
        {canI("insert")&&<button style={S.btnAdd} onClick={()=>{setErr("");setModal({name:""});}}>+ Novo Tipo</button>}
      </div>
      {loading?<Spinner/>:items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>🗂️</span>Nenhum tipo de ativo cadastrado</div>:(
        isMobile
          ?<MobileCardList items={items} columns={[{key:"name",label:"Tipo de Ativo"}]} actions={item=>(
            <>{canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({id:item.id,name:item.name});}}>Editar</button>}
              {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}</>
          )}/>
          :<table style={S.table}><thead><tr><th style={S.th}>Tipo de Ativo</th><th style={{...S.th,width:140}}>Ações</th></tr></thead>
            <tbody>{items.map(item=>(
              <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={S.td}>{item.name}</td>
                <td style={S.td}>
                  {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({id:item.id,name:item.name});}}>Editar</button>}
                  {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
      )}
      {modal&&(
        <Modal title={modal.id?"Editar Tipo de Ativo":"Novo Tipo de Ativo"} onClose={()=>setModal(null)}>
          <Input label="Tipo de Ativo" value={modal.name} onChange={v=>setModal(m=>({...m,name:v}))} required/>
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Excluir este tipo de ativo?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── LINHAS DISPONÍVEIS (s19) ──────────────────────────────────
const STATUS_LD=["Em análise","Em estoque","Em uso","Baixado"];
function LinhasDisponiveisScreen({user}){
  const[items,setItems]=useState([]);
  const[companies,setCompanies]=useState([]);
  const[operadoras,setOperadoras]=useState([]);
  const[tipoAtivos,setTipoAtivos]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  const[delId,setDelId]=useState(null);
  const[err,setErr]=useState("");
  const[filter,setFilter]=useState({status:"",operadora:"",empresa:"",numeroLinha:""});
  const[cargaModal,setCargaModal]=useState(null);
  const[csvImpModal,setCsvImpModal]=useState(false);
  const[csvImpRows,setCsvImpRows]=useState(null);
  const[csvImpBusy,setCsvImpBusy]=useState(false);
  const isMobile=useIsMobile();

  const load=()=>{
    setLoading(true);
    Promise.all([
      api.get("/linhas-disponiveis"),api.get("/companies"),
      api.get("/operadoras"),api.get("/tipo-ativos"),
    ]).then(([ld,co,op,ta])=>{setItems(ld);setCompanies(co);setOperadoras(op);setTipoAtivos(ta);})
      .catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const getTelefoniaTipo=()=>tipoAtivos.find(t=>t.name.toLowerCase()==="telefonia");

  const openNew=()=>{
    const tel=getTelefoniaTipo();
    if(!tel){alert("É necessário cadastrar um Tipo de Ativo chamado 'Telefonia' antes de inserir uma linha disponível.");return;}
    setErr("");setModal({companyId:"",operadoraId:"",tipoAtivoId:tel.id,numeroLinha:"",status:"Em análise",acesso:"",estrutura:"",iccid:"",tipoPacote:""});
  };

  const save=async()=>{
    if(!modal.numeroLinha?.trim()){setErr("Número da linha é obrigatório.");return;}
    if(modal.tipoAtivoId){
      const ta=tipoAtivos.find(t=>t.id===modal.tipoAtivoId);
      if(ta&&ta.name.toLowerCase()!=="telefonia"){
        setErr("O Tipo de Ativo deve ser 'Telefonia'.");return;
      }
    }
    try{
      if(modal.id) await api.put(`/linhas-disponiveis/${modal.id}`,modal);
      else         await api.post("/linhas-disponiveis",modal);
      setModal(null);load();
    }catch(e){setErr(e.message);}
  };
  const del=async()=>{
    try{await api.delete(`/linhas-disponiveis/${delId}`);setDelId(null);load();}
    catch(e){alert(e.message);}
  };
  const reverterBaixa=async(id)=>{
    if(!window.confirm("Reverter a baixa desta linha e retornar ao estoque?"))return;
    try{await api.post(`/linhas-disponiveis/${id}/reverter-baixa`,{});load();}
    catch(e){alert(e.message);}
  };
  const canI=act=>user.permissions?.s19?.[act];
  const handleCsvImpFile=e=>{
    const f=e.target.files[0]; e.target.value=""; if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{const{rows}=parseCSVGeneric(ev.target.result);setCsvImpRows(rows);};
    r.readAsText(f,"UTF-8");
  };
  const processarCsvImp=async()=>{
    if(!csvImpRows?.length){alert("Nenhum dado válido no arquivo.");return;}
    setCsvImpBusy(true);
    try{
      const res=await api.post("/linhas-disponiveis/importar",{linhas:csvImpRows});
      alert(`✅ Importação concluída!\nAtualizados: ${res.atualizados}\nNão encontrados: ${res.naoEncontrados}${res.naoEncontradosList?.length?"\n"+res.naoEncontradosList.join(", "):""}`);
      setCsvImpModal(false);setCsvImpRows(null);load();
    }catch(e){alert("❌ "+(e?.error||e.message));}
    setCsvImpBusy(false);
  };

  const filtered=items.filter(i=>{
    if(filter.status&&i.status!==filter.status)return false;
    if(filter.operadora&&i.operadoraId!==filter.operadora)return false;
    if(filter.empresa&&i.companyId!==filter.empresa)return false;
    if(filter.numeroLinha&&!(i.numeroLinha||"").toLowerCase().includes(filter.numeroLinha.toLowerCase()))return false;
    return true;
  });

  const statusBadge=s=>{
    if(s==="Em estoque")return<span style={{...S.badge,...S.badgeActive}}>Em estoque</span>;
    if(s==="Em uso")return<span style={{...S.badge,background:"#E3F2FD",color:"#1565C0"}}>Em uso</span>;
    if(s==="Baixado")return<span style={{...S.badge,background:"#FFEBEE",color:"#B71C1C"}}>Baixado</span>;
    return<span style={{...S.badge,background:"#FFF3CD",color:"#856404"}}>{s||"Em análise"}</span>;
  };

  return(
    <div>
      <div style={S.card}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>📶 Linhas Disponíveis</span>
          <div style={{display:"flex",gap:8}}>
            {canI("edit")&&<button style={{...S.btnAdd,background:"#5DADE2"}} onClick={()=>{setCsvImpRows(null);setCsvImpModal(true);}}>📥 Importar</button>}
            {user.isMaster&&<button style={{...S.btnAdd,background:"#7B68EE"}} onClick={()=>setCargaModal({file:null,skipHeader:true,processing:false,result:null})}>📥 Carga Inicial</button>}
            {canI("insert")&&<button style={S.btnAdd} onClick={openNew}>+ Nova Linha</button>}
          </div>
        </div>
        {/* Filtros */}
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <select value={filter.empresa} onChange={e=>setFilter(f=>({...f,empresa:e.target.value}))}
            style={{...S.select,width:"auto",minWidth:150}}>
            <option value="">Todas as empresas</option>
            {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filter.operadora} onChange={e=>setFilter(f=>({...f,operadora:e.target.value}))}
            style={{...S.select,width:"auto",minWidth:150}}>
            <option value="">Todas as operadoras</option>
            {operadoras.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <input placeholder="Número Linha..." value={filter.numeroLinha} onChange={e=>setFilter(f=>({...f,numeroLinha:e.target.value}))}
            style={{...S.input,width:"auto",minWidth:140,padding:"6px 10px",fontSize:13}}/>
          <select value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))}
            style={{...S.select,width:"auto",minWidth:140}}>
            <option value="">Todos os status</option>
            {STATUS_LD.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          {(filter.status||filter.operadora||filter.empresa||filter.numeroLinha)&&
            <button style={S.btnCancel} onClick={()=>setFilter({status:"",operadora:"",empresa:"",numeroLinha:""})}>Limpar</button>}
        </div>

        {loading?<Spinner/>:filtered.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📶</span>Nenhuma linha disponível cadastrada</div>:(
          isMobile?(
            <div>{filtered.map(item=>(
              <div key={item.id} style={S.mobileCard}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{item.numeroLinha}</div>
                <div style={{fontSize:12,color:C.textLight,marginBottom:2}}>Operadora: {item.operadoraName||"—"}</div>
                <div style={{fontSize:12,color:C.textLight,marginBottom:2}}>Empresa: {item.companyName||"—"}</div>
                <div style={{fontSize:12,marginBottom:6}}>{statusBadge(item.status)}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                  {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({...item});}}>Editar</button>}
                  {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}
                  {user.isMaster&&item.status==="Baixado"&&<button style={{...S.actionBtn,background:"#E8F5E9",color:"#2E7D32",border:"1px solid #A5D6A7"}} onClick={()=>reverterBaixa(item.id)}>↩ Reverter Baixa</button>}
                </div>
              </div>
            ))}</div>
          ):(
            <div style={{overflowX:"auto"}}>
              <table style={S.table}><thead><tr>
                {["Empresa","Operadora","Tipo de Ativo","Número Linha","Status","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{filtered.map(item=>(
                <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                  <td style={S.td}>{item.companyName||"—"}</td>
                  <td style={S.td}>{item.operadoraName||"—"}</td>
                  <td style={S.td}>{item.tipoAtivoName||"—"}</td>
                  <td style={{...S.td,fontWeight:600}}>{item.numeroLinha}</td>
                  <td style={S.td}>{statusBadge(item.status)}</td>
                  <td style={S.td}>
                    {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({...item});}}>Editar</button>}
                    {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}
                    {user.isMaster&&item.status==="Baixado"&&<button style={{...S.actionBtn,background:"#E8F5E9",color:"#2E7D32",border:"1px solid #A5D6A7"}} onClick={()=>reverterBaixa(item.id)}>↩ Reverter Baixa</button>}
                  </td>
                </tr>
              ))}</tbody></table>
            </div>
          )
        )}
      </div>

      {modal&&(
        <Modal title={modal.id?"Editar Linha Disponível":"Nova Linha Disponível"} onClose={()=>setModal(null)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <SelectField label="Empresa" value={modal.companyId} onChange={v=>setModal(m=>({...m,companyId:v}))}
              options={companies.filter(c=>c.active).map(c=>({value:c.id,label:c.name}))}/>
            <SelectField label="Operadora" value={modal.operadoraId} onChange={v=>setModal(m=>({...m,operadoraId:v}))}
              options={operadoras.map(o=>({value:o.id,label:o.name}))}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <SelectField label="Tipo de Ativo" value={modal.tipoAtivoId} onChange={v=>setModal(m=>({...m,tipoAtivoId:v}))}
              options={tipoAtivos.filter(t=>t.name.toLowerCase()==="telefonia").map(t=>({value:t.id,label:t.name}))}/>
            <Input label="Número Linha" value={modal.numeroLinha} onChange={v=>setModal(m=>({...m,numeroLinha:v}))} required/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <Input label="Acesso" value={modal.acesso||""} onChange={v=>setModal(m=>({...m,acesso:v}))}/>
            <Input label="Estrutura" value={modal.estrutura||""} onChange={v=>setModal(m=>({...m,estrutura:v}))}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <Input label="ICCID" value={modal.iccid||""} onChange={v=>setModal(m=>({...m,iccid:v}))}/>
            <SelectField label="Tipo Pacote" value={modal.tipoPacote||""} onChange={v=>setModal(m=>({...m,tipoPacote:v}))}
              options={TIPO_PACOTE_OPTS.map(s=>({value:s,label:s}))}/>
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Status</label>
            <input value={modal.status||"Em análise"} readOnly
              style={{...S.input,background:"#f5f5f5",color:C.textLight,cursor:"default"}}/>
          </div>
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Excluir esta linha disponível?" onConfirm={del} onCancel={()=>setDelId(null)}/>}

      {csvImpModal&&(
        <Modal title="Importar — Linhas Disponíveis" onClose={()=>{setCsvImpModal(false);setCsvImpRows(null);}}>
          <p style={{fontSize:12,color:C.textLight,marginBottom:12}}>CSV com colunas: <strong>Empresa</strong>, <strong>Operadora</strong>, <strong>Tipo de Ativo</strong>, <strong>Número Linha</strong>, <strong>Acesso</strong>, <strong>Estrutura</strong>, <strong>ICCID</strong>, <strong>Tipo Pacote</strong>, <strong>Status</strong><br/>Localiza a linha pelos campos de identificação e atualiza os demais.</p>
          <label style={{...S.btnAdd,cursor:"pointer",display:"inline-block",marginBottom:12}}>
            📂 Selecionar arquivo CSV
            <input type="file" accept=".csv" style={{display:"none"}} onChange={handleCsvImpFile}/>
          </label>
          {csvImpRows&&<div style={{fontSize:12,color:C.success,fontWeight:600,marginBottom:12}}>✅ {csvImpRows.length} linha(s) prontas para importar</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>{setCsvImpModal(false);setCsvImpRows(null);}}>Cancelar</button>
            <button style={{...S.btnSave,background:C.success}} onClick={processarCsvImp} disabled={!csvImpRows||csvImpBusy}>
              {csvImpBusy?"Processando...":"⚙️ Processar"}
            </button>
          </div>
        </Modal>
      )}

      {cargaModal&&(
        <Modal title="Carga Inicial — Linhas Disponíveis" onClose={()=>setCargaModal(null)}>
          <div style={{marginBottom:12,padding:12,background:"#F0F4FF",borderRadius:8,fontSize:12,color:C.text}}>
            <strong>Formato do CSV (colunas em ordem):</strong><br/>
            Col 1: Operadora · Col 2: Número da Linha · Col 3: Empresa · Col 4: Tipo de Ativo · Col 5: Status<br/>
            <span style={{color:C.textLight}}>Linhas com mesma Operadora + Número já existentes serão ignoradas.</span>
          </div>
          <div style={{marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <input type="checkbox" id="ldSkipHdr" checked={cargaModal.skipHeader}
              onChange={e=>setCargaModal(m=>({...m,skipHeader:e.target.checked}))}/>
            <label htmlFor="ldSkipHdr" style={{fontSize:13}}>Ignorar primeira linha (cabeçalho)</label>
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Arquivo CSV</label>
            <input type="file" accept=".csv,text/csv" onChange={e=>setCargaModal(m=>({...m,file:e.target.files[0]||null,result:null}))}
              style={{...S.input,padding:"6px"}}/>
          </div>
          {cargaModal.result&&(
            <div style={{marginBottom:12,padding:12,background:cargaModal.result.erros?.length?"#FFF8DC":"#F0FFF0",borderRadius:8,fontSize:12}}>
              <div>✅ <strong>{cargaModal.result.inseridos}</strong> inseridas · ⏭️ <strong>{cargaModal.result.ignorados||0}</strong> ignoradas</div>
              {cargaModal.result.erros?.length>0&&(
                <div style={{marginTop:8,maxHeight:120,overflowY:"auto"}}>
                  {cargaModal.result.erros.map((e,i)=>(
                    <div key={i} style={{color:C.danger,fontSize:11}}>Linha {e.linha}: {e.msg}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setCargaModal(null)}>Fechar</button>
            <button style={{...S.btnSave,opacity:cargaModal.processing||!cargaModal.file?0.6:1}}
              disabled={cargaModal.processing||!cargaModal.file}
              onClick={async()=>{
                if(!cargaModal.file)return;
                setCargaModal(m=>({...m,processing:true,result:null}));
                try{
                  const text=await cargaModal.file.text();
                  let rows=parseCSVRows(text);
                  if(cargaModal.skipHeader&&rows.length>0)rows=rows.slice(1);
                  const result=await api.post("/linhas-disponiveis/carga-inicial",{rows});
                  setCargaModal(m=>({...m,processing:false,result}));
                  load();
                }catch(e){alert("Erro: "+e.message);setCargaModal(m=>({...m,processing:false}));}
              }}>
              {cargaModal.processing?"Processando...":"⚙️ Processar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── LIBERAÇÃO DE LINHAS PARA ESTOQUE (s57) ────────────────────
function LiberacaoLinhasEstoqueScreen({user}){
  const[items,setItems]=useState([]);
  const[companies,setCompanies]=useState([]);
  const[operadoras,setOperadoras]=useState([]);
  const[loading,setLoading]=useState(true);
  const[err,setErr]=useState({});
  const[filter,setFilter]=useState({empresa:"",operadora:"",numeroLinha:"",iccid:""});
  const canI=act=>user.permissions?.s57?.[act];
  const load=()=>{
    setLoading(true);
    Promise.all([api.get("/linhas-disponiveis/liberacao"),api.get("/companies"),api.get("/operadoras")])
      .then(([ld,co,op])=>{setItems(Array.isArray(ld)?ld:[]);setCompanies(Array.isArray(co)?co:[]);setOperadoras(Array.isArray(op)?op:[]);})
      .catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);
  const toggle=async(item,checked)=>{
    const novoStatus=checked?"Em estoque":"Em análise";
    setErr(e=>({...e,[item.id]:""}));
    try{
      await api.patch(`/linhas-disponiveis/${item.id}/status`,{status:novoStatus});
      setItems(ls=>ls.map(l=>l.id===item.id?{...l,status:novoStatus}:l));
    }catch(e){setErr(er=>({...er,[item.id]:e?.error||"Erro ao atualizar status."}));}
  };
  const filtered=items.filter(i=>{
    if(filter.empresa&&i.companyId!==filter.empresa)return false;
    if(filter.operadora&&i.operadoraId!==filter.operadora)return false;
    if(filter.numeroLinha&&!(i.numeroLinha||"").toLowerCase().includes(filter.numeroLinha.toLowerCase()))return false;
    if(filter.iccid&&!(i.iccid||"").toLowerCase().includes(filter.iccid.toLowerCase()))return false;
    return true;
  });
  const statusBadge=s=>{
    if(s==="Em estoque")return<span style={{...S.badge,...S.badgeActive}}>Em estoque</span>;
    return<span style={{...S.badge,background:"#FFF3CD",color:"#856404"}}>{s||"Em análise"}</span>;
  };
  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>Liberação de Linhas para Estoque</span>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <select value={filter.empresa} onChange={e=>setFilter(f=>({...f,empresa:e.target.value}))}
          style={{...S.select,width:"auto",minWidth:150}}>
          <option value="">Todas as empresas</option>
          {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filter.operadora} onChange={e=>setFilter(f=>({...f,operadora:e.target.value}))}
          style={{...S.select,width:"auto",minWidth:150}}>
          <option value="">Todas as operadoras</option>
          {operadoras.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <input placeholder="Número Linha..." value={filter.numeroLinha}
          onChange={e=>setFilter(f=>({...f,numeroLinha:e.target.value}))}
          style={{...S.input,width:"auto",minWidth:140,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="ICCID..." value={filter.iccid}
          onChange={e=>setFilter(f=>({...f,iccid:e.target.value}))}
          style={{...S.input,width:"auto",minWidth:140,padding:"6px 10px",fontSize:13}}/>
        {(filter.empresa||filter.operadora||filter.numeroLinha||filter.iccid)&&
          <button style={S.btnCancel} onClick={()=>setFilter({empresa:"",operadora:"",numeroLinha:"",iccid:""})}>Limpar</button>}
      </div>
      {loading?<Spinner/>:filtered.length===0
        ?<div style={S.emptyState}><span style={S.emptyIcon}>📶</span>Nenhuma linha em análise ou estoque</div>
        :<div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Empresa","Operadora","Número Linha","ICCID","Status","Liberar Estoque"].map(h=>(
              <th key={h} style={{...S.th,whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{filtered.map(i=>(
            <tr key={i.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={S.td}>{i.companyName||"—"}</td>
              <td style={S.td}>{i.operadoraName||"—"}</td>
              <td style={{...S.td,fontWeight:600}}>{i.numeroLinha}</td>
              <td style={S.td}>{i.iccid||"—"}</td>
              <td style={S.td}>{statusBadge(i.status)}</td>
              <td style={{...S.td,textAlign:"center"}}>
                {canI("edit")
                  ?<div>
                    <input type="checkbox" checked={i.status==="Em estoque"}
                      onChange={e=>toggle(i,e.target.checked)}
                      style={{width:18,height:18,cursor:"pointer"}}/>
                    {err[i.id]&&<div style={{fontSize:11,color:"#DC2626",marginTop:2,maxWidth:200}}>{err[i.id]}</div>}
                  </div>
                  :<input type="checkbox" checked={i.status==="Em estoque"} readOnly style={{width:18,height:18}}/>}
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      }
    </div>
  );
}

// ── ATIVOS (s20) ──────────────────────────────────────────────
const CONDICAO_ATIVO_OPTS=["Novo","Usado","Danificado"];
function AtivosScreen({user}){
  const[items,setItems]=useState([]);
  const[tipoAtivos,setTipoAtivos]=useState([]);
  const[companies,setCompanies]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  const[delId,setDelId]=useState(null);
  const[err,setErr]=useState("");
  const[csvImpModal,setCsvImpModal]=useState(false);
  const[csvImpRows,setCsvImpRows]=useState(null);
  const[csvImpBusy,setCsvImpBusy]=useState(false);
  const[filterA,setFilterA]=useState({nome:"",tipoAtivo:"",empresa:"",marca:"",modelo:"",numeroSerie:"",imei:"",status:""});
  const isMobile=useIsMobile();

  const blankAtivo=()=>({nome:"",tipoAtivoId:"",companyId:"",marca:"",modelo:"",
    numeroSerie:"",sistemaOperacional:"",versao:"",processador:"",memoria:"",hd:"",
    patrimonio:"",numeroDocumento:"",valor:"",dataAquisicao:"",condicao:"",
    acessorios:"",imeiSlot1:"",imeiSlot2:"",observacao:""});

  const load=()=>{
    setLoading(true);
    Promise.all([api.get("/ativos"),api.get("/tipo-ativos"),api.get("/companies")])
      .then(([a,ta,co])=>{setItems(a);setTipoAtivos(ta);setCompanies(co);})
      .catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const save=async()=>{
    if(!modal.nome?.trim()){setErr("Nome do ativo é obrigatório.");return;}
    try{
      if(modal.id) await api.put(`/ativos/${modal.id}`,modal);
      else         await api.post("/ativos",modal);
      setModal(null);load();
    }catch(e){setErr(e.message);}
  };
  const del=async()=>{
    try{await api.delete(`/ativos/${delId}`);setDelId(null);load();}
    catch(e){alert(e.message);}
  };
  const reverterBaixaAtivo=async(id)=>{
    if(!window.confirm("Reverter a baixa deste ativo e retornar ao estoque?"))return;
    try{await api.post(`/ativos/${id}/reverter-baixa`,{});load();}
    catch(e){alert(e.message);}
  };
  const canI=act=>user.permissions?.s20?.[act];
  const handleCsvImpFile=e=>{
    const f=e.target.files[0]; e.target.value=""; if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{const{rows}=parseCSVGeneric(ev.target.result);setCsvImpRows(rows);};
    r.readAsText(f,"UTF-8");
  };
  const processarCsvImp=async()=>{
    if(!csvImpRows?.length){alert("Nenhum dado válido no arquivo.");return;}
    setCsvImpBusy(true);
    try{
      const res=await api.post("/ativos/importar",{linhas:csvImpRows});
      alert(`✅ Importação concluída!\nInseridos: ${res.inseridos}\nIgnorados (duplicados): ${res.ignorados||0}${res.erros?.length?"\nErros: "+res.erros.join(", "):""}`);
      setCsvImpModal(false);setCsvImpRows(null);load();
    }catch(e){alert("❌ "+(e?.error||e.message));}
    setCsvImpBusy(false);
  };
  const F=(label,key,type="text")=>(
    <div style={S.formRow}>
      <label style={S.label}>{label}</label>
      <input type={type} value={modal?.[key]||""} onChange={e=>setModal(m=>({...m,[key]:e.target.value}))}
        style={S.input} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
    </div>
  );
  const g2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"};

  const statusBadgeAtivo=s=>{
    if(s==="Em uso")return<span style={{...S.badge,background:"#E3F2FD",color:"#1565C0"}}>Em uso</span>;
    if(s==="Baixado")return<span style={{...S.badge,background:"#FFEBEE",color:"#B71C1C"}}>Baixado</span>;
    return<span style={{...S.badge,...S.badgeActive}}>Em Estoque</span>;
  };

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>📦 Ativos</span>
        <div style={{display:"flex",gap:8}}>
          {canI("edit")&&<button style={{...S.btnAdd,background:"#5DADE2"}} onClick={()=>{setCsvImpRows(null);setCsvImpModal(true);}}>📥 Importar</button>}
          {canI("insert")&&<button style={S.btnAdd} onClick={()=>{setErr("");setModal(blankAtivo());}}>+ Novo Ativo</button>}
        </div>
      </div>
      {!loading&&items.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input placeholder="Nome do Ativo" value={filterA.nome} onChange={e=>setFilterA(f=>({...f,nome:e.target.value}))} style={{...S.input,flex:"1 1 160px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Tipo de Ativo" value={filterA.tipoAtivo} onChange={e=>setFilterA(f=>({...f,tipoAtivo:e.target.value}))} style={{...S.input,flex:"1 1 140px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Empresa" value={filterA.empresa} onChange={e=>setFilterA(f=>({...f,empresa:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Marca" value={filterA.marca} onChange={e=>setFilterA(f=>({...f,marca:e.target.value}))} style={{...S.input,flex:"1 1 120px",minWidth:100,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Modelo" value={filterA.modelo} onChange={e=>setFilterA(f=>({...f,modelo:e.target.value}))} style={{...S.input,flex:"1 1 120px",minWidth:100,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Nº Série" value={filterA.numeroSerie} onChange={e=>setFilterA(f=>({...f,numeroSerie:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="IMEI Slot 1" value={filterA.imei} onChange={e=>setFilterA(f=>({...f,imei:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <select value={filterA.status} onChange={e=>setFilterA(f=>({...f,status:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}>
          <option value="">Todos os Status</option>
          <option value="Em Estoque">Em Estoque</option>
          <option value="Em uso">Em uso</option>
          <option value="Baixado">Baixado</option>
        </select>
      </div>}
      {loading?<Spinner/>:items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📦</span>Nenhum ativo cadastrado</div>:(()=>{
        const fltA=items.filter(item=>(!filterA.nome||(item.nome||"").toLowerCase().includes(filterA.nome.toLowerCase()))&&(!filterA.tipoAtivo||(item.tipoAtivoName||"").toLowerCase().includes(filterA.tipoAtivo.toLowerCase()))&&(!filterA.empresa||(item.companyName||"").toLowerCase().includes(filterA.empresa.toLowerCase()))&&(!filterA.marca||(item.marca||"").toLowerCase().includes(filterA.marca.toLowerCase()))&&(!filterA.modelo||(item.modelo||"").toLowerCase().includes(filterA.modelo.toLowerCase()))&&(!filterA.numeroSerie||(item.numeroSerie||"").toLowerCase().includes(filterA.numeroSerie.toLowerCase()))&&(!filterA.imei||(item.imeiSlot1||"").toLowerCase().includes(filterA.imei.toLowerCase()))&&(!filterA.status||item.status===filterA.status||(filterA.status==="Em Estoque"&&!item.status)));
        return(
        <div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Nome do Ativo","Tipo de Ativo","Empresa","Marca","Modelo","Nº Série","IMEI Slot 1","Status","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{fltA.map(item=>(
            <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={{...S.td,fontWeight:600}}>{item.nome}</td>
              <td style={S.td}>{item.tipoAtivoName||"—"}</td>
              <td style={S.td}>{item.companyName||"—"}</td>
              <td style={S.td}>{item.marca||"—"}</td>
              <td style={S.td}>{item.modelo||"—"}</td>
              <td style={S.td}>{item.numeroSerie||"—"}</td>
              <td style={S.td}>{item.imeiSlot1||"—"}</td>
              <td style={S.td}>{statusBadgeAtivo(item.status)}</td>
              <td style={S.td}>
                {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({...item});}}> ✏️</button>}
                {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}><Icon name="trash" size={13}/></button>}
                {user.isMaster&&item.status==="Baixado"&&<button style={{...S.actionBtn,background:"#E8F5E9",color:"#2E7D32",border:"1px solid #A5D6A7"}} onClick={()=>reverterBaixaAtivo(item.id)}>↩ Reverter Baixa</button>}
              </td>
            </tr>
          ))}</tbody></table>
        </div>
        );
      })()}
      {modal&&(
        <Modal title={modal.id?"Editar Ativo":"Novo Ativo"} onClose={()=>setModal(null)} extraWide>
          <div style={g2}>
            <Input label="Nome do Ativo *" value={modal.nome} onChange={v=>setModal(m=>({...m,nome:v}))} required/>
            <SelectField label="Tipo de Ativo" value={modal.tipoAtivoId||""} onChange={v=>setModal(m=>({...m,tipoAtivoId:v}))}
              options={tipoAtivos.map(t=>({value:t.id,label:t.name}))}/>
          </div>
          <div style={g2}>
            <SelectField label="Empresa" value={modal.companyId||""} onChange={v=>setModal(m=>({...m,companyId:v}))}
              options={companies.filter(c=>c.active).map(c=>({value:c.id,label:c.name}))}/>
            {F("Marca","marca")}
          </div>
          <div style={g2}>
            {F("Modelo","modelo")}
            {F("Nº de Série","numeroSerie")}
          </div>
          <div style={g2}>
            {F("Sistema Operacional","sistemaOperacional")}
            {F("Versão","versao")}
          </div>
          <div style={g2}>
            {F("Processador","processador")}
            {F("Memória","memoria")}
          </div>
          <div style={g2}>
            {F("HD","hd")}
            {F("Patrimônio","patrimonio")}
          </div>
          <div style={g2}>
            {F("Nº Documento","numeroDocumento")}
            {F("Valor","valor","number")}
          </div>
          <div style={g2}>
            <MaskedInput label="Data Aquisição" value={modal.dataAquisicao||""} onChange={v=>setModal(m=>({...m,dataAquisicao:v}))} mask={MASK_DATE} placeholder="DD/MM/AAAA"/>
            <SelectField label="Condição" value={modal.condicao||""} onChange={v=>setModal(m=>({...m,condicao:v}))}
              options={CONDICAO_ATIVO_OPTS.map(s=>({value:s,label:s}))}/>
          </div>
          <div style={g2}>
            {F("IMEI Slot 1","imeiSlot1")}
            {F("IMEI Slot 2","imeiSlot2")}
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Acessórios</label>
            <textarea value={modal.acessorios||""} onChange={e=>setModal(m=>({...m,acessorios:e.target.value}))}
              style={{...S.input,height:60,resize:"vertical"}}/>
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Observação</label>
            <textarea value={modal.observacao||""} onChange={e=>setModal(m=>({...m,observacao:e.target.value}))}
              style={{...S.input,height:60,resize:"vertical"}}/>
          </div>
          {modal.id&&(
            <div style={S.formRow}>
              <label style={S.label}>Status</label>
              <input value={modal.status||"Em Estoque"} readOnly
                style={{...S.input,background:"#f5f5f5",color:C.textLight,cursor:"default"}}/>
            </div>
          )}
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Excluir este ativo?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
      {csvImpModal&&(
        <Modal title="Importar Ativos via CSV" onClose={()=>{setCsvImpModal(false);setCsvImpRows(null);}}>
          <p style={{fontSize:12,color:C.textLight,marginBottom:12}}>CSV com colunas: <strong>Nome do Ativo</strong>, <strong>Tipo de Ativo</strong>, <strong>Empresa</strong>, Marca, Modelo, Nº de Série, Sistema Operacional, Versão, Processador, Memória, HD, Patrimônio, Nº Documento, Valor, Data Aquisição, Condição, IMEI Slot 1, IMEI Slot 2, Acessórios</p>
          <label style={{...S.btnAdd,cursor:"pointer",display:"inline-block",marginBottom:12}}>
            📂 Selecionar arquivo CSV
            <input type="file" accept=".csv" style={{display:"none"}} onChange={handleCsvImpFile}/>
          </label>
          {csvImpRows&&<div style={{fontSize:12,color:C.success,fontWeight:600,marginBottom:12}}>✅ {csvImpRows.length} ativo(s) prontos para importar</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>{setCsvImpModal(false);setCsvImpRows(null);}}>Cancelar</button>
            <button style={{...S.btnSave,background:C.success}} onClick={processarCsvImp} disabled={!csvImpRows||csvImpBusy}>
              {csvImpBusy?"Processando...":"⚙️ Processar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── FUNCIONÁRIOS (s22) ───────────────────────────────────────
const SITUACAO_OPTS=["Ativo","Inativo"];
const ESTADOS_BR=["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function FuncionariosScreen({user}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  const[delId,setDelId]=useState(null);
  const[err,setErr]=useState("");
  const[filter,setFilter]=useState({nome:"",cpf:"",situacao:"",coligada:""});
  const[syncing,setSyncing]=useState(false);
  const[syncMsg,setSyncMsg]=useState("");
  const isMobile=useIsMobile();

  const blankFunc=()=>({
    nome:"",matricula:"",centroCusto:"",cargo:"",rg:"",cpf:"",
    logradouro:"",numero:"",bairro:"",cidade:"",estado:"",cep:"",
    complemento:"",email:"",fone:"",observacao:"",situacao:"Ativo",coligada:"",
  });

  const load=()=>{
    setLoading(true);
    api.get("/funcionarios")
      .then(setItems).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const save=async()=>{
    if(!modal.nome?.trim()){setErr("Nome do funcionário é obrigatório.");return;}
    if(modal.cpf?.replace(/\D/g,"").length===11&&!validarCPF(modal.cpf)){setErr("CPF inválido.");return;}
    try{
      if(modal.id) await api.put(`/funcionarios/${modal.id}`,modal);
      else         await api.post("/funcionarios",modal);
      setModal(null);load();
    }catch(e){setErr(e.message);}
  };
  const del=async()=>{
    try{await api.delete(`/funcionarios/${delId}`);setDelId(null);load();}
    catch(e){alert(e.message);}
  };

  const canI=act=>user.permissions?.s22?.[act];
  const MASK_CPF="999.999.999-99";
  const MASK_CEP="99.999-999";

  const runSync=async()=>{
    setSyncing(true);setSyncMsg("");
    try{
      const r=await api.post("/sync/funcionarios",{});
      setSyncMsg(`✅ Sync concluído: ${r.inseridos} inseridos, ${r.atualizados} atualizados${r.erros?`, ${r.erros} erros`:""}.`);
      load();
    }catch(e){setSyncMsg(`❌ Erro: ${e.message}`);}
    setSyncing(false);
  };

  // Extrai coligadas únicas para o filtro
  const coligadas=[...new Set(items.map(i=>i.coligada).filter(Boolean))].sort();

  const filtered=items.filter(i=>{
    if(filter.nome&&!i.nome.toLowerCase().includes(filter.nome.toLowerCase()))return false;
    if(filter.cpf&&!(i.cpf||"").includes(filter.cpf))return false;
    if(filter.situacao&&i.situacao!==filter.situacao)return false;
    if(filter.coligada&&(i.coligada||"")!==filter.coligada)return false;
    return true;
  });

  const F=(label,key,type="text",req=false)=>(
    <div style={S.formRow}>
      <label style={S.label}>{label}{req&&<span style={{color:"red"}}> *</span>}</label>
      <input type={type} value={modal[key]||""} onChange={e=>setModal(m=>({...m,[key]:e.target.value}))}
        style={S.input} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
    </div>
  );
  const grid2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"};
  const grid3={display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 16px"};

  const situBadge=s=>s==="Ativo"
    ?<span style={{...S.badge,...S.badgeActive}}>Ativo</span>
    :<span style={{...S.badge,background:"#FADBD8",color:"#922B21"}}>Inativo</span>;

  return(
    <div>
      <div style={S.card}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>👤 Funcionários</span>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {canI("edit")&&<button style={{...S.btnAdd,background:"#2E86C1"}} onClick={runSync} disabled={syncing}>
              {syncing?"⏳ Sincronizando...":"🔄 Sincronizar"}
            </button>}
            {canI("insert")&&<button style={S.btnAdd} onClick={()=>{setErr("");setModal(blankFunc());}}>+ Novo Funcionário</button>}
          </div>
        </div>
        {syncMsg&&<div style={{...S.errorMsg,background:syncMsg.startsWith("✅")?"#EAF9EF":"#FDEDEC",color:syncMsg.startsWith("✅")?"#1E8449":"#922B21",marginBottom:10}}>{syncMsg}</div>}
        {/* Filtros */}
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
          <input placeholder="Buscar por nome..." value={filter.nome} onChange={e=>setFilter(f=>({...f,nome:e.target.value}))}
            style={{...S.input,flex:"1 1 180px",minWidth:150,padding:"6px 10px",fontSize:13}}/>
          <input placeholder="CPF..." value={filter.cpf} onChange={e=>setFilter(f=>({...f,cpf:e.target.value}))}
            style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
          <select value={filter.coligada} onChange={e=>setFilter(f=>({...f,coligada:e.target.value}))}
            style={{...S.select,width:"auto",minWidth:140}}>
            <option value="">Todas as coligadas</option>
            {coligadas.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filter.situacao} onChange={e=>setFilter(f=>({...f,situacao:e.target.value}))}
            style={{...S.select,width:"auto",minWidth:130}}>
            <option value="">Todas as situações</option>
            {SITUACAO_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          {(filter.nome||filter.cpf||filter.situacao||filter.coligada)&&<button style={S.btnCancel} onClick={()=>setFilter({nome:"",cpf:"",situacao:"",coligada:""})}>Limpar</button>}
        </div>

        {loading?<Spinner/>:filtered.length===0
          ?<div style={S.emptyState}><span style={S.emptyIcon}>👤</span>{(filter.nome||filter.cpf||filter.situacao)?"Nenhum resultado para o filtro":"Nenhum funcionário cadastrado"}</div>
          :(
          isMobile?(
            <div>{filtered.map(item=>(
              <div key={item.id} style={S.mobileCard}>
                <div style={{fontWeight:700,fontSize:13}}>{item.nome}</div>
                {item.matricula&&<div style={{fontSize:12,color:C.textLight}}>Matrícula: {item.matricula}</div>}
                {item.cargo&&<div style={{fontSize:12,color:C.textLight}}>Cargo: {item.cargo}</div>}
                <div style={{marginTop:4}}>{situBadge(item.situacao)}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",paddingTop:8,borderTop:`1px solid ${C.border}`,marginTop:8}}>
                  {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({...item});}}>Editar</button>}
                  {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}
                </div>
              </div>
            ))}</div>
          ):(
            <div style={{overflowX:"auto"}}>
              <table style={S.table}><thead><tr>
                {["Nome","Matrícula","Coligada","Centro de Custo","Cargo","CPF","Situação","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{filtered.map(item=>(
                <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                  <td style={{...S.td,fontWeight:600}}>{item.nome}</td>
                  <td style={S.td}>{item.matricula||"—"}</td>
                  <td style={S.td}>{item.coligada||"—"}</td>
                  <td style={S.td}>{item.centroCusto||"—"}</td>
                  <td style={S.td}>{item.cargo||"—"}</td>
                  <td style={S.td}>{item.cpf||"—"}</td>
                  <td style={S.td}>{situBadge(item.situacao)}</td>
                  <td style={S.td}>
                    {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({...item,coligada:item.coligada||""});}}>Editar</button>}
                    {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}
                  </td>
                </tr>
              ))}</tbody></table>
            </div>
          )
        )}
      </div>

      {modal&&(
        <Modal title={modal.id?"Editar Funcionário":"Novo Funcionário"} onClose={()=>setModal(null)} extraWide>
          <div style={grid2}>
            {F("Nome do Funcionário","nome","text",true)}
            {F("Matrícula","matricula")}
          </div>
          <div style={grid2}>
            {F("Centro de Custo","centroCusto")}
            {F("Cargo","cargo")}
          </div>
          <div style={grid2}>
            <MaskedInput label="CPF" value={modal.cpf} onChange={v=>setModal(m=>({...m,cpf:v}))} mask="999.999.999-99" placeholder="000.000.000-00"/>
            {F("RG","rg")}
          </div>
          <div style={grid2}>
            {F("E-mail","email","email")}
            {F("Fone","fone")}
          </div>
          <div style={{...grid3,gridTemplateColumns:"2fr 1fr 1fr"}}>
            {F("Logradouro","logradouro")}
            {F("Número","numero")}
            {F("Complemento","complemento")}
          </div>
          <div style={grid3}>
            {F("Bairro","bairro")}
            {F("Cidade","cidade")}
            <MaskedInput label="CEP" value={modal.cep} onChange={v=>setModal(m=>({...m,cep:v}))} mask="99.999-999" placeholder="00.000-000"/>
          </div>
          <div style={grid2}>
            <div style={S.formRow}>
              <label style={S.label}>Estado</label>
              <select value={modal.estado||""} onChange={e=>setModal(m=>({...m,estado:e.target.value}))} style={S.select}>
                <option value="">Selecione</option>
                {ESTADOS_BR.map(e=><option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div style={S.formRow}>
              <label style={S.label}>Situação</label>
              <select value={modal.situacao||"Ativo"} onChange={e=>setModal(m=>({...m,situacao:e.target.value}))} style={S.select}>
                {SITUACAO_OPTS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {F("Coligada","coligada")}
          <div style={S.formRow}>
            <label style={S.label}>Observação</label>
            <textarea value={modal.observacao||""} onChange={e=>setModal(m=>({...m,observacao:e.target.value}))}
              style={{...S.input,height:72,resize:"vertical"}}/>
          </div>
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}

      {delId&&<ConfirmModal msg="Excluir este funcionário?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── MODELOS DE CONTRATO (s23) ─────────────────────────────────
const CONTRATO_TOKENS=[
  // Empresa (13)
  ["[RAZSOCEMP]","Razão Social da Empresa"],["[FANTASEMP]","Fantasia da Empresa"],["[CNPJEMP]","CNPJ da Empresa"],
  ["[INSCEST]","Insc. Estadual"],["[INSCMUN]","Insc. Municipal"],
  ["[LOGREMP]","Logradouro da Empresa"],["[NRLOGREMP]","Nº Logradouro (Empresa)"],["[BAIRROEMP]","Bairro da Empresa"],
  ["[CEPEMP]","CEP da Empresa"],["[CIDEMP]","Cidade da Empresa"],["[ESTEMP]","Estado da Empresa"],
  ["[REPRLEGEMP]","Representante Legal"],["[LOGOEMP]","Logo da Empresa"],
  // Funcionário (15)
  ["[NMFUN]","Nome do Funcionário"],["[CPFFUN]","CPF do Funcionário"],["[RGFUN]","RG do Funcionário"],
  ["[CARGOFUN]","Cargo do Funcionário"],["[MATRICFUN]","Matrícula do Funcionário"],["[CCUSTOFUN]","Centro de Custo"],
  ["[FONEFUN]","Fone do Funcionário"],["[EMAILFUN]","E-mail do Funcionário"],
  ["[LOGRFUN]","Logradouro do Funcionário"],["[NRLOGRFUN]","Nº Logradouro (Funcionário)"],
  ["[COMPLEMFUN]","Complemento do Funcionário"],["[BAIRROFUN]","Bairro do Funcionário"],
  ["[CEPFUN]","CEP do Funcionário"],["[CIDFUN]","Cidade do Funcionário"],["[ESTFUN]","Estado do Funcionário"],
  // Ativo (23)
  ["[TPATIVO]","Tipo de Ativo"],["[NOMEATIVO]","Nome do Ativo"],["[MARCA]","Marca"],["[MODELO]","Modelo"],
  ["[NRSER]","Número de Série"],["[SISTOPER]","Sistema Operacional"],["[VERSAO]","Versão"],
  ["[PROCES]","Processador"],["[MEMORIA]","Memória"],["[HD]","HD"],["[PATRIMONIO]","Patrimônio"],
  ["[NRDOCUM]","Nº do Documento"],["[VALOR]","Valor"],["[CONDICAO]","Condição"],["[ACESSORIOS]","Acessórios"],
  ["[IMEI1]","IMEI Slot 1"],["[IMEI2]","IMEI Slot 2"],["[OPERADORA]","Operadora"],
  ["[NRLINHA]","Número de Linha"],["[ICCID]","ICCID"],["[ACESSO]","Acesso"],
  ["[ESTRUTURA]","Estrutura"],["[TPPACOTE]","Tipo de Pacote"],
  // Data (3)
  ["[Dia]","Dia"],["[Mes]","Mês (extenso)"],["[Ano]","Ano"],
];

function ModelosContratoScreen({user}){
  const[items,setItems]=useState([]);
  const[tipoAtivos,setTipoAtivos]=useState([]);
  const[companies,setCompanies]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const[form,setForm]=useState({id:null,nome:"",tipoAtivoId:"",empresaId:""});
  const[delId,setDelId]=useState(null);
  const[saving,setSaving]=useState(false);
  const[filterMC,setFilterMC]=useState({nome:"",tipoAtivo:"",empresa:""});
  const[modeloEditor,setModeloEditor]=useState(null);
  const[savingModelo,setSavingModelo]=useState(false);
  const editorRef=useRef(null);
  const p=user.permissions?.s23;

  const load=()=>{
    setLoading(true);
    Promise.all([api.get("/modelos-contrato"),api.get("/tipo-ativos"),api.get("/companies")])
    .then(([m,t,c])=>{setItems(m);setTipoAtivos(t);setCompanies(c.filter(x=>x.active));})
    .catch(e=>alert(e.message))
    .finally(()=>setLoading(false));
  };
  useEffect(()=>{if(!p?.view)return;load();},[]);

  const openAdd=()=>{setForm({id:null,nome:"",tipoAtivoId:"",empresaId:""});setModal(true);};
  const openEdit=it=>{setForm({id:it.id,nome:it.nome,tipoAtivoId:it.tipoAtivoId||"",empresaId:it.empresaId||""});setModal(true);};

  const save=async()=>{
    if(!form.nome.trim())return alert("Nome do modelo é obrigatório.");
    setSaving(true);
    try{
      if(form.id){const u=await api.put(`/modelos-contrato/${form.id}`,form);setItems(is=>is.map(i=>i.id===u.id?u:i));}
      else{const c=await api.post("/modelos-contrato",form);setItems(is=>[...is,c]);}
      setModal(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };

  const del=async()=>{
    try{await api.delete(`/modelos-contrato/${delId}`);setItems(is=>is.filter(i=>i.id!==delId));setDelId(null);}
    catch(e){alert(e.message);}
  };

  const openModelo=async(it)=>{
    try{
      const data=await api.get(`/modelos-contrato/${it.id}/conteudo`);
      setModeloEditor({id:it.id,nome:it.nome,conteudo:data.conteudo||""});
    }catch(e){alert(e.message);}
  };

  useEffect(()=>{
    if(modeloEditor&&editorRef.current){
      editorRef.current.innerHTML=modeloEditor.conteudo;
    }
  },[modeloEditor?.id]);

  const saveModelo=async()=>{
    if(!editorRef.current)return;
    setSavingModelo(true);
    try{
      await api.put(`/modelos-contrato/${modeloEditor.id}/conteudo`,{conteudo:editorRef.current.innerHTML});
      setModeloEditor(null);
    }catch(e){alert(e.message);}finally{setSavingModelo(false);}
  };

  const execCmd=(cmd,val)=>{editorRef.current?.focus();document.execCommand(cmd,false,val||null);};

  const insertToken=token=>{
    editorRef.current?.focus();
    document.execCommand("insertText",false,token);
  };

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>📋 Modelos de Contrato</span>
        {p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo Modelo</button>}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input placeholder="Modelo" value={filterMC.nome} onChange={e=>setFilterMC(f=>({...f,nome:e.target.value}))} style={{...S.input,flex:"1 1 180px",minWidth:140,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Tipo de Ativo" value={filterMC.tipoAtivo} onChange={e=>setFilterMC(f=>({...f,tipoAtivo:e.target.value}))} style={{...S.input,flex:"1 1 160px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Empresa" value={filterMC.empresa} onChange={e=>setFilterMC(f=>({...f,empresa:e.target.value}))} style={{...S.input,flex:"1 1 160px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
      </div>
      {(()=>{const fltMC=items.filter(it=>(!filterMC.nome||(it.nome||"").toLowerCase().includes(filterMC.nome.toLowerCase()))&&(!filterMC.tipoAtivo||(it.tipoAtivoName||"").toLowerCase().includes(filterMC.tipoAtivo.toLowerCase()))&&(!filterMC.empresa||(it.empresaName||"").toLowerCase().includes(filterMC.empresa.toLowerCase())));return fltMC.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Nenhum modelo cadastrado.</div>:(
        <table style={S.table}><thead><tr>
          {["Modelo","Tipo de Ativo","Empresa","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
        </tr></thead>
        <tbody>{fltMC.map(it=>(
          <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}><strong>{it.nome}</strong></td>
            <td style={S.td}>{it.tipoAtivoName||"—"}</td>
            <td style={S.td}>{it.empresaName||"—"}</td>
            <td style={S.td}>
              <button style={{...S.actionBtn,background:"#E8F4FD",color:"#1565C0",fontWeight:600}} onClick={()=>openModelo(it)}>📄 Modelo</button>
              {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(it)}><Icon name="edit" size={13}/> Editar</button>}
              {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/> Excluir</button>}
            </td>
          </tr>
        ))}</tbody></table>
      );})()}
      {modal&&(
        <Modal title={form.id?"Editar Modelo":"Novo Modelo de Contrato"} onClose={()=>setModal(false)}>
          <Input label="Nome do Modelo" value={form.nome} onChange={v=>setForm(f=>({...f,nome:v}))} required/>
          <SelectField label="Tipo de Ativo" value={form.tipoAtivoId} onChange={v=>setForm(f=>({...f,tipoAtivoId:v}))}
            options={tipoAtivos.map(t=>({value:t.id,label:t.name}))} placeholder="Selecione..." clearable/>
          <SelectField label="Empresa" value={form.empresaId} onChange={v=>setForm(f=>({...f,empresaId:v}))}
            options={companies.map(c=>({value:c.id,label:c.name}))} placeholder="Selecione..." clearable/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {modeloEditor&&(
        <Modal title={`Modelo: ${modeloEditor.nome}`} onClose={()=>setModeloEditor(null)}>
          <div style={{marginBottom:8}}>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>
              {[["bold","N",{fontWeight:"bold"}],["italic","I",{fontStyle:"italic"}],["underline","S",{textDecoration:"underline"}]].map(([cmd,lbl,st])=>(
                <button key={cmd} style={{...S.actionBtn,minWidth:32,...st}} onMouseDown={e=>{e.preventDefault();execCmd(cmd);}}>{lbl}</button>
              ))}
              <select style={{...S.input,width:130,height:30,padding:"0 4px",fontSize:12}} onMouseDown={e=>e.preventDefault()}
                onChange={e=>{if(e.target.value){execCmd("fontName",e.target.value);e.target.value="";}}}>
                <option value="">Fonte...</option>
                {["Arial","Times New Roman","Courier New","Georgia"].map(f=><option key={f} value={f}>{f}</option>)}
              </select>
              <select style={{...S.input,width:70,height:30,padding:"0 4px",fontSize:12}} onMouseDown={e=>e.preventDefault()}
                onChange={e=>{if(e.target.value){execCmd("fontSize",e.target.value);e.target.value="";}}}>
                <option value="">Tam.</option>
                {[1,2,3,4,5,6,7].map(s=><option key={s} value={s}>{[8,10,12,14,16,18,24][s-1]}pt</option>)}
              </select>
              {[["justifyLeft","⬅"],["justifyCenter","≡"],["justifyRight","➡"]].map(([cmd,lbl])=>(
                <button key={cmd} style={S.actionBtn} onMouseDown={e=>{e.preventDefault();execCmd(cmd);}}>{lbl}</button>
              ))}
              <button style={S.actionBtn} onMouseDown={e=>{e.preventDefault();execCmd("insertUnorderedList");}}>• Lista</button>
            </div>
            <details style={{marginBottom:8}}>
              <summary style={{cursor:"pointer",fontSize:12,color:C.primary,userSelect:"none",padding:"4px 0"}}>
                📌 Variáveis disponíveis — clique para inserir no cursor
              </summary>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6,maxHeight:120,overflowY:"auto",padding:4,background:C.bg,borderRadius:6}}>
                {CONTRATO_TOKENS.map(([tok,desc])=>(
                  <button key={tok} title={desc}
                    style={{...S.actionBtn,fontSize:11,padding:"2px 6px",background:"#EEF2FF",color:"#3730A3"}}
                    onMouseDown={e=>{e.preventDefault();insertToken(tok);}}>{tok}</button>
                ))}
              </div>
            </details>
            <div ref={editorRef} contentEditable suppressContentEditableWarning
              style={{minHeight:320,border:`1px solid ${C.border}`,borderRadius:6,padding:12,
                      outline:"none",fontSize:13,lineHeight:1.6,overflowY:"auto",
                      maxHeight:400,background:"#fff"}}/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModeloEditor(null)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:savingModelo?0.7:1}} onClick={saveModelo} disabled={savingModelo}>
              {savingModelo?"Salvando...":"💾 Salvar Modelo"}
            </button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir este modelo de contrato?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── Modal de Movimentações de Ativos ─────────────────────────
function MovimentacoesModal({movModal,onClose,itensModal,funcionarios,onDone}){
  const[tipoMov,setTipoMov]=useState("Transferência");
  const[movFuncId,setMovFuncId]=useState("");
  const[movErr,setMovErr]=useState("");
  const[movSaving,setMovSaving]=useState(false);
  const doMov=async()=>{
    if(tipoMov==="Transferência"&&!movFuncId){setMovErr("Selecione o funcionário de destino.");return;}
    setMovSaving(true);
    try{
      await api.post(`/controle-ativos/${movModal.controleId}/itens/${movModal.item.id}/movimentacao`,
        {tipoMovimentacao:tipoMov,funcionarioId:movFuncId||null});
      onDone();
    }catch(e){setMovErr(e.message);}finally{setMovSaving(false);}
  };
  return(
    <Modal title="Registrar Movimentação" onClose={onClose}>
      <div style={{marginBottom:12,padding:10,background:"#F8F9FA",borderRadius:6,fontSize:12,color:C.text}}>
        <strong>Item:</strong> {movModal.item.ativoNome||movModal.item.numeroLinha||"—"}<br/>
        <strong>Funcionário atual:</strong> {itensModal?.controle.nomeFuncionario||"—"}
      </div>
      <SelectField label="Tipo de Movimentação" value={tipoMov} onChange={v=>{setTipoMov(v);setMovFuncId("");setMovErr("");}}
        options={["Transferência","Baixa","Devolução Estoque"].map(s=>({value:s,label:s}))}/>
      {tipoMov==="Transferência"&&(
        <SelectField label="Funcionário de Destino *" value={movFuncId} onChange={setMovFuncId}
          options={funcionarios.filter(f=>f.situacao==="Ativo").map(f=>({value:f.id,label:f.nome}))}/>
      )}
      {tipoMov==="Baixa"&&<div style={{padding:"8px 12px",background:"#FFF3E0",borderRadius:6,fontSize:12,color:"#E65100",marginBottom:8}}>O ativo e a linha serão marcados como <strong>Baixado</strong> e o item será removido.</div>}
      {tipoMov==="Devolução Estoque"&&<div style={{padding:"8px 12px",background:"#E8F5E9",borderRadius:6,fontSize:12,color:"#2E7D32",marginBottom:8}}>O ativo e a linha voltarão ao status <strong>Em Estoque</strong> e o item será removido.</div>}
      {movErr&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{movErr}</div>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button style={S.btnCancel} onClick={onClose}>Cancelar</button>
        <button style={{...S.btnSave,opacity:movSaving?0.6:1}} disabled={movSaving} onClick={doMov}>
          {movSaving?"Salvando...":"Confirmar"}
        </button>
      </div>
    </Modal>
  );
}

// ── CONTROLE DE ATIVOS (s21) ──────────────────────────────────
const TIPO_PACOTE_OPTS=["Voz","Dados","Voz e Dados"];
const CONDICAO_OPTS=["Novo","Usado","Danificado"];
const STATUS_ATIVO_OPTS=["Em Estoque","Em uso","Baixado"];

function ControleAtivosScreen({user}){
  const[items,setItems]=useState([]);
  const[allItens,setAllItens]=useState([]);
  const[companies,setCompanies]=useState([]);
  const[tipoAtivos,setTipoAtivos]=useState([]);
  const[operadoras,setOperadoras]=useState([]);
  const[linhasEstoque,setLinhasEstoque]=useState([]);
  const[ativos,setAtivos]=useState([]);
  const[funcionarios,setFuncionarios]=useState([]);
  const[modelos,setModelos]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  const[itensModal,setItensModal]=useState(null);
  const[itemForm,setItemForm]=useState(null);
  const[anexosModal,setAnexosModal]=useState(null);
  const[delId,setDelId]=useState(null);
  const[delItemId,setDelItemId]=useState(null);
  const[err,setErr]=useState("");
  const[errItem,setErrItem]=useState("");
  const[filterCA,setFilterCA]=useState({empresa:"",funcionario:"",cpf:"",operadora:"",numeroLinha:"",dataAquisicao:"",numeroSerie:"",numeroDocumento:"",patrimonio:"",imeiSlot1:""});
  const[movModal,setMovModal]=useState(null); // {item, controleId}
  const[cargaModal,setCargaModal]=useState(null);
  const[sendingEmail,setSendingEmail]=useState(false);
  const[csvImpModal,setCsvImpModal]=useState(false);
  const[csvImpRows,setCsvImpRows]=useState(null);
  const[csvImpBusy,setCsvImpBusy]=useState(false);
  const[csvImpItensModal,setCsvImpItensModal]=useState(false);
  const[csvImpItensRows,setCsvImpItensRows]=useState(null);
  const[csvImpItensBusy,setCsvImpItensBusy]=useState(false);
  const isMobile=useIsMobile();

  const load=()=>{
    setLoading(true);
    Promise.all([
      api.get("/controle-ativos"),api.get("/companies"),
      api.get("/tipo-ativos"),api.get("/operadoras"),
      api.get("/linhas-disponiveis"),api.get("/ativos"),
      api.get("/controle-ativos/itens/all"),
      api.get("/funcionarios/basic"),
      api.get("/modelos-contrato"),
    ]).then(([ca,co,ta,op,ld,av,ai,func,mc])=>{
      setItems(ca);setCompanies(co);setTipoAtivos(ta);
      setOperadoras(op);
      setLinhasEstoque(ld.filter(l=>l.status==="Em estoque"));
      setAtivos(av);setAllItens(ai);setFuncionarios(func);setModelos(mc);
      // ativosEstoque exposto via closure na tela
    }).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const save=async()=>{
    if(!modal.funcionarioId){setErr("Selecione um funcionário.");return;}
    try{
      const func=funcionarios.find(f=>f.id===modal.funcionarioId);
      const payload={
        nomeFuncionario:func.nome,
        cpf:func.cpf||"",
        funcionarioId:modal.funcionarioId,
      };
      if(modal.id) await api.put(`/controle-ativos/${modal.id}`,payload);
      else         await api.post("/controle-ativos",payload);
      setModal(null);load();
    }catch(e){setErr(e.message);}
  };
  const del=async()=>{
    try{await api.delete(`/controle-ativos/${delId}`);setDelId(null);load();}
    catch(e){alert(e.message);}
  };

  const openItens=async(controle)=>{
    const itens=await api.get(`/controle-ativos/${controle.id}/itens`).catch(()=>[]);
    setItensModal({controle,itens});
  };
  const reloadItens=async()=>{
    if(!itensModal)return;
    const itens=await api.get(`/controle-ativos/${itensModal.controle.id}/itens`).catch(()=>[]);
    setItensModal(m=>({...m,itens}));
    load();
  };

  const saveItem=async()=>{
    try{
      if(itemForm.id)
        await api.put(`/controle-ativos/${itensModal.controle.id}/itens/${itemForm.id}`,itemForm);
      else
        await api.post(`/controle-ativos/${itensModal.controle.id}/itens`,itemForm);
      setItemForm(null);reloadItens();
    }catch(e){setErrItem(e.message);}
  };
  const delItem=async()=>{
    try{
      await api.delete(`/controle-ativos/${itensModal.controle.id}/itens/${delItemId}`);
      setDelItemId(null);reloadItens();
    }catch(e){alert(e.message);}
  };

  // Anexos
  const openAnexos=(controleId,item)=>setAnexosModal({controleId,itemId:item.id,attachments:item.attachments||[]});
  const removeAnexo=idx=>setAnexosModal(m=>({...m,attachments:m.attachments.filter((_,i)=>i!==idx)}));
  const handleAnexoAdd=e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      setAnexosModal(m=>({...m,attachments:[...m.attachments,{name:file.name,type:file.type,size:file.size,data:ev.target.result}]}));
    };
    reader.readAsDataURL(file);
  };
  const saveAnexos=async()=>{
    try{
      await api.put(`/controle-ativos/${anexosModal.controleId}/itens/${anexosModal.itemId}/anexos`,{attachments:anexosModal.attachments});
      setAnexosModal(null);reloadItens();
    }catch(e){alert(e.message);}
  };

  const imprimirContrato=async(item)=>{
    const modelo=modelos.find(m=>m.tipoAtivoId===item.tipoAtivoId&&m.empresaId===item.companyId);
    if(!modelo){alert("Nenhum modelo de contrato cadastrado para o Tipo de Ativo \""+( item.tipoAtivoName||"—")+"\" e a Empresa \""+( item.companyName||"—")+"\".");return;}
    let conteudo="";
    try{const d=await api.get(`/modelos-contrato/${modelo.id}/conteudo`);conteudo=d.conteudo||"";}
    catch(e){alert("Erro ao carregar modelo: "+e.message);return;}
    let logoHtml="";
    try{const ld=await api.get(`/companies/${item.companyId}/logo`);if(ld.logo)logoHtml=`<img src="${ld.logo}" style="max-width:200px;height:auto;">`;}
    catch(e){}
    const funcItem=funcionarios.find(f=>f.id===itensModal.controle.funcionarioId);
    const compItem=companies.find(c=>c.id===item.companyId);
    const now=new Date();
    const MESES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const subs={
      // Empresa
      "[RAZSOCEMP]":compItem?.razaoSocial||"",
      "[FANTASEMP]":compItem?.name||item.companyName||"",
      "[CNPJEMP]":compItem?.cnpj||"",
      "[INSCEST]":compItem?.inscEstadual||"",
      "[INSCMUN]":compItem?.inscMunicipal||"",
      "[LOGREMP]":compItem?.logradouro||"",
      "[NRLOGREMP]":compItem?.numero||"",
      "[BAIRROEMP]":compItem?.bairro||"",
      "[CEPEMP]":compItem?.cep||"",
      "[CIDEMP]":compItem?.cidade||"",
      "[ESTEMP]":compItem?.estado||"",
      "[REPRLEGEMP]":compItem?.representanteLegal||"",
      "[LOGOEMP]":logoHtml,
      // Funcionário
      "[NMFUN]":funcItem?.nome||itensModal.controle.nomeFuncionario||"",
      "[CPFFUN]":funcItem?.cpf||itensModal.controle.cpf||"",
      "[RGFUN]":funcItem?.rg||"",
      "[CARGOFUN]":funcItem?.cargo||"",
      "[MATRICFUN]":funcItem?.matricula||"",
      "[CCUSTOFUN]":funcItem?.centroCusto||"",
      "[FONEFUN]":funcItem?.fone||"",
      "[EMAILFUN]":funcItem?.email||"",
      "[LOGRFUN]":funcItem?.logradouro||"",
      "[NRLOGRFUN]":funcItem?.numero||"",
      "[COMPLEMFUN]":funcItem?.complemento||"",
      "[BAIRROFUN]":funcItem?.bairro||"",
      "[CEPFUN]":funcItem?.cep||"",
      "[CIDFUN]":funcItem?.cidade||"",
      "[ESTFUN]":funcItem?.estado||"",
      // Ativo
      "[TPATIVO]":item.tipoAtivoName||"",
      "[NOMEATIVO]":item.ativoNome||"",
      "[MARCA]":item.marca||"",
      "[MODELO]":item.modelo||"",
      "[NRSER]":item.numeroSerie||"",
      "[SISTOPER]":item.sistemaOperacional||"",
      "[VERSAO]":item.versao||"",
      "[PROCES]":item.processador||"",
      "[MEMORIA]":item.memoria||"",
      "[HD]":item.hd||"",
      "[PATRIMONIO]":item.patrimonio||"",
      "[NRDOCUM]":item.numeroDocumento||"",
      "[VALOR]":item.valor?Number(item.valor).toFixed(2):"",
      "[CONDICAO]":item.condicao||"",
      "[ACESSORIOS]":item.acessorios||"",
      "[IMEI1]":item.imeiSlot1||"",
      "[IMEI2]":item.imeiSlot2||"",
      "[OPERADORA]":item.operadoraName||"",
      "[NRLINHA]":item.numeroLinha||"",
      "[ICCID]":item.iccid||"",
      "[ACESSO]":item.acesso||"",
      "[ESTRUTURA]":item.estrutura||"",
      "[TPPACOTE]":item.tipoPacote||"",
      // Data
      "[Dia]":String(now.getDate()).padStart(2,"0"),"[Mes]":MESES[now.getMonth()],"[Ano]":String(now.getFullYear()),
    };
    let html=conteudo;
    Object.entries(subs).forEach(([k,v])=>{html=html.split(k).join(v);});
    const win=window.open("","_blank","width=900,height=700");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Contrato</title>
<style>
  @page{margin:20mm;size:A4 portrait;}
  body{font-family:Arial,sans-serif;margin:40px;font-size:12pt;color:#222;line-height:1.5;}
  img{max-width:100%;}
  @media print{.no-print{display:none;}body{margin:0;}}
</style>
</head><body>
<div class="no-print" style="margin-bottom:20px;display:flex;gap:8px;">
  <button onclick="window.print()" style="padding:8px 16px;background:#2563EB;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;">🖨️ Imprimir</button>
  <button onclick="window.close()" style="padding:8px 16px;background:#666;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:14px;">✕ Fechar</button>
</div>${html}</body></html>`);
    win.document.close();
  };

  const enviarContrato=async(item)=>{
    if(sendingEmail)return;
    const funcItem=funcionarios.find(f=>f.id===itensModal.controle.funcionarioId);
    if(!funcItem?.email?.trim()){
      alert("O funcionário "+(funcItem?.nome||itensModal.controle.nomeFuncionario||"")+" não possui e-mail cadastrado. Cadastre o e-mail na tela de Funcionários.");
      return;
    }
    setSendingEmail(true);
    const modelo=modelos.find(m=>m.tipoAtivoId===item.tipoAtivoId&&m.empresaId===item.companyId);
    if(!modelo){alert("Nenhum modelo de contrato cadastrado para o Tipo de Ativo \""+(item.tipoAtivoName||"—")+"\" e a Empresa \""+(item.companyName||"—")+"\".");return;}
    let conteudo="";
    try{const d=await api.get(`/modelos-contrato/${modelo.id}/conteudo`);conteudo=d.conteudo||"";}
    catch(e){alert("Erro ao carregar modelo: "+e.message);return;}
    let logoHtml="";
    try{const ld=await api.get(`/companies/${item.companyId}/logo`);if(ld.logo)logoHtml=`<img src="${ld.logo}" style="max-width:200px;height:auto;">`;}
    catch(e){}
    const compItem=companies.find(c=>c.id===item.companyId);
    const now=new Date();
    const MESES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const subs={
      "[RAZSOCEMP]":compItem?.razaoSocial||"","[FANTASEMP]":compItem?.name||item.companyName||"",
      "[CNPJEMP]":compItem?.cnpj||"","[INSCEST]":compItem?.inscEstadual||"","[INSCMUN]":compItem?.inscMunicipal||"",
      "[LOGREMP]":compItem?.logradouro||"","[NRLOGREMP]":compItem?.numero||"","[BAIRROEMP]":compItem?.bairro||"",
      "[CEPEMP]":compItem?.cep||"","[CIDEMP]":compItem?.cidade||"","[ESTEMP]":compItem?.estado||"",
      "[REPRLEGEMP]":compItem?.representanteLegal||"","[LOGOEMP]":logoHtml,
      "[NMFUN]":funcItem?.nome||itensModal.controle.nomeFuncionario||"","[CPFFUN]":funcItem?.cpf||itensModal.controle.cpf||"",
      "[RGFUN]":funcItem?.rg||"","[CARGOFUN]":funcItem?.cargo||"","[MATRICFUN]":funcItem?.matricula||"",
      "[CCUSTOFUN]":funcItem?.centroCusto||"","[FONEFUN]":funcItem?.fone||"","[EMAILFUN]":funcItem?.email||"",
      "[LOGRFUN]":funcItem?.logradouro||"","[NRLOGRFUN]":funcItem?.numero||"","[COMPLEMFUN]":funcItem?.complemento||"",
      "[BAIRROFUN]":funcItem?.bairro||"","[CEPFUN]":funcItem?.cep||"","[CIDFUN]":funcItem?.cidade||"","[ESTFUN]":funcItem?.estado||"",
      "[TPATIVO]":item.tipoAtivoName||"","[NOMEATIVO]":item.ativoNome||"","[MARCA]":item.marca||"","[MODELO]":item.modelo||"",
      "[NRSER]":item.numeroSerie||"","[SISTOPER]":item.sistemaOperacional||"","[VERSAO]":item.versao||"",
      "[PROCES]":item.processador||"","[MEMORIA]":item.memoria||"","[HD]":item.hd||"","[PATRIMONIO]":item.patrimonio||"",
      "[NRDOCUM]":item.numeroDocumento||"","[VALOR]":item.valor?Number(item.valor).toFixed(2):"",
      "[CONDICAO]":item.condicao||"","[ACESSORIOS]":item.acessorios||"",
      "[IMEI1]":item.imeiSlot1||"","[IMEI2]":item.imeiSlot2||"","[OPERADORA]":item.operadoraName||"",
      "[NRLINHA]":item.numeroLinha||"","[ICCID]":item.iccid||"","[ACESSO]":item.acesso||"",
      "[ESTRUTURA]":item.estrutura||"","[TPPACOTE]":item.tipoPacote||"",
      "[Dia]":String(now.getDate()).padStart(2,"0"),"[Mes]":MESES[now.getMonth()],"[Ano]":String(now.getFullYear()),
    };
    let html=conteudo;
    Object.entries(subs).forEach(([k,v])=>{html=html.split(k).join(v);});
    // Renderizar HTML em div oculta com mesmas margens da impressão A4
    const el=document.createElement("div");
    // 794px ≈ largura A4 a 96dpi; padding 57px ≈ 15mm (margem interna do conteúdo)
    el.style.cssText="position:fixed;top:-20000px;left:-20000px;width:794px;background:#fff;font-family:Arial,sans-serif;font-size:12pt;color:#222;line-height:1.5;padding:57px;box-sizing:border-box;";
    el.innerHTML=html;
    document.body.appendChild(el);
    try{
      const canvas=await html2canvas(el,{scale:2,useCORS:true,allowTaint:true,logging:false,backgroundColor:"#ffffff",windowWidth:794});
      const imgData=canvas.toDataURL("image/jpeg",0.95);
      const doc=new jsPDF({unit:"pt",format:"a4",orientation:"portrait"});
      const pdfW=doc.internal.pageSize.getWidth();   // 595.28 pt
      const pdfH=doc.internal.pageSize.getHeight();  // 841.89 pt
      const margin=56.69;  // 20mm em pt (20 * 2.8346)
      const contentW=pdfW-2*margin;
      const imgH=(canvas.height*contentW)/canvas.width;
      const contentH=pdfH-2*margin;
      let offsetY=0;
      let firstPage=true;
      while(offsetY<imgH){
        if(!firstPage)doc.addPage();
        // Posiciona a imagem de forma que a fatia correta fique dentro da área de conteúdo
        doc.addImage(imgData,"JPEG",margin,margin-offsetY,contentW,imgH);
        // Máscaras brancas para cobrir o que transborda além das margens superior e inferior
        doc.setFillColor(255,255,255);
        doc.rect(0,0,pdfW,margin,"F");                  // margem superior
        doc.rect(0,pdfH-margin,pdfW,margin+1,"F");      // margem inferior
        doc.rect(0,0,margin,pdfH,"F");                  // margem esquerda
        doc.rect(pdfW-margin,0,margin+1,pdfH,"F");      // margem direita
        offsetY+=contentH;
        firstPage=false;
      }
      const pdfBase64=doc.output("datauristring");
      await api.post("/email/enviar-contrato",{toEmail:funcItem.email,pdfBase64,funcionarioNome:funcItem.nome||itensModal.controle.nomeFuncionario});
      alert("E-mail enviado com sucesso para "+funcItem.email+"!");
    }catch(e){alert("Erro ao enviar e-mail: "+e.message);}
    finally{document.body.removeChild(el);setSendingEmail(false);}
  };


  const canI=act=>user.permissions?.s21?.[act];
  const handleCsvImpFile=e=>{
    const f=e.target.files[0]; e.target.value=""; if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{const{rows}=parseCSVGeneric(ev.target.result);setCsvImpRows(rows);};
    r.readAsText(f,"UTF-8");
  };
  const processarCsvImp=async()=>{
    if(!csvImpRows?.length){alert("Nenhum dado válido.");return;}
    setCsvImpBusy(true);
    try{
      const res=await api.post("/controle-ativos/importar-cabecalho",{linhas:csvImpRows});
      alert(`✅ Importação concluída!\nInseridos: ${res.inseridos}\nIgnorados (já existentes): ${res.ignorados}`);
      setCsvImpModal(false);setCsvImpRows(null);load();
    }catch(e){alert("❌ "+(e?.error||e.message));}
    setCsvImpBusy(false);
  };
  const handleCsvImpItensFile=e=>{
    const f=e.target.files[0]; e.target.value=""; if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{const{rows}=parseCSVGeneric(ev.target.result);setCsvImpItensRows(rows);};
    r.readAsText(f,"UTF-8");
  };
  const processarCsvImpItens=async()=>{
    if(!csvImpItensRows?.length){alert("Nenhum dado válido.");return;}
    setCsvImpItensBusy(true);
    try{
      const res=await api.post("/controle-ativos/importar-itens",{linhas:csvImpItensRows});
      alert(`✅ Importação concluída!\nInseridos: ${res.inseridos}\nAtualizados: ${res.atualizados}\nNão encontrados: ${res.naoEncontrados}${res.erros?.length?"\nErros: "+res.erros.join("\n"):""}`);
      setCsvImpItensModal(false);setCsvImpItensRows(null);
      if(itensModal){const itens=await api.get(`/controle-ativos/${itensModal.controle.id}/itens`).catch(()=>[]);setItensModal(m=>({...m,itens}));}
      load();
    }catch(e){alert("❌ "+(e?.error||e.message));}
    setCsvImpItensBusy(false);
  };
  const MASK_CPF="999.999.999-99";
  const MASK_DATA="99/99/9999";

  const isTelefonia=tipoAtivoId=>{
    const ta=tipoAtivos.find(t=>t.id===tipoAtivoId);
    return ta&&ta.name.toLowerCase()==="telefonia";
  };

  const blankItem=()=>({
    companyId:"",tipoAtivoId:"",operadoraId:"",linhaId:"",ativoId:"",
    acesso:"",estrutura:"",iccid:"",tipoPacote:"",
    marca:"",modelo:"",imeiSlot1:"",imeiSlot2:"",numeroSerie:"",
    sistemaOperacional:"",versao:"",processador:"",memoria:"",hd:"",
    patrimonio:"",numeroDocumento:"",valor:"",dataAquisicao:"",
    condicao:"",acessorios:"",statusAtivo:"",
  });

  // Filtro: campos de item criam um Set de controleAtivoIds compatíveis
  const hasItemFilter=filterCA.empresa||filterCA.operadora||filterCA.numeroLinha||filterCA.dataAquisicao||filterCA.numeroSerie||filterCA.numeroDocumento||filterCA.patrimonio||filterCA.imeiSlot1;
  const matchingIds=hasItemFilter?new Set(
    allItens.filter(i=>{
      if(filterCA.empresa&&i.companyId!==filterCA.empresa)return false;
      if(filterCA.operadora&&i.operadoraId!==filterCA.operadora)return false;
      if(filterCA.numeroLinha&&!(i.numeroLinha||"").toLowerCase().includes(filterCA.numeroLinha.toLowerCase()))return false;
      if(filterCA.dataAquisicao&&!(i.dataAquisicao||"").includes(filterCA.dataAquisicao))return false;
      if(filterCA.numeroSerie&&!(i.numeroSerie||"").toLowerCase().includes(filterCA.numeroSerie.toLowerCase()))return false;
      if(filterCA.numeroDocumento&&!(i.numeroDocumento||"").toLowerCase().includes(filterCA.numeroDocumento.toLowerCase()))return false;
      if(filterCA.patrimonio&&!(i.patrimonio||"").toLowerCase().includes(filterCA.patrimonio.toLowerCase()))return false;
      if(filterCA.imeiSlot1&&!(i.imeiSlot1||"").toLowerCase().includes(filterCA.imeiSlot1.toLowerCase()))return false;
      return true;
    }).map(i=>i.controleAtivoId)
  ):null;
  const filteredCA=items.filter(item=>{
    if(filterCA.funcionario&&!item.nomeFuncionario.toLowerCase().includes(filterCA.funcionario.toLowerCase()))return false;
    if(filterCA.cpf&&!(item.cpf||"").includes(filterCA.cpf))return false;
    if(matchingIds&&!matchingIds.has(item.id))return false;
    return true;
  });
  const hasAnyFilter=Object.values(filterCA).some(v=>v);
  const caFilterStyle={...S.input,width:"auto",flex:"1 1 160px",minWidth:130,padding:"6px 10px",fontSize:13};

  return(
    <div>
      {/* Lista principal */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>🖥️ Controle de Ativos</span>
          <div style={{display:"flex",gap:8}}>
            {canI("edit")&&<button style={{...S.btnAdd,background:"#5DADE2"}} onClick={()=>{setCsvImpRows(null);setCsvImpModal(true);}}>📥 Importar</button>}
            {canI("edit")&&<button style={{...S.btnAdd,background:"#27AE60"}} onClick={()=>{setCsvImpItensRows(null);setCsvImpItensModal(true);}}>📥 Importar Itens</button>}
            {user.isMaster&&<button style={{...S.btnAdd,background:"#7B68EE"}} onClick={()=>setCargaModal({file:null,skipHeader:true,processing:false,result:null})}>📥 Carga Inicial</button>}
            {canI("insert")&&<button style={S.btnAdd} onClick={()=>{setErr("");setModal({funcionarioId:""});}}>+ Novo Registro</button>}
          </div>
        </div>

        {/* Filtros */}
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
          <input placeholder="Nome do Funcionário" value={filterCA.funcionario} onChange={e=>setFilterCA(f=>({...f,funcionario:e.target.value}))} style={caFilterStyle}/>
          <input placeholder="CPF" value={filterCA.cpf} onChange={e=>setFilterCA(f=>({...f,cpf:e.target.value}))} style={caFilterStyle}/>
          <select value={filterCA.empresa} onChange={e=>setFilterCA(f=>({...f,empresa:e.target.value}))}
            style={{...S.select,width:"auto",flex:"1 1 160px",minWidth:130,padding:"6px 10px",fontSize:13}}>
            <option value="">Todas as empresas</option>
            {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterCA.operadora} onChange={e=>setFilterCA(f=>({...f,operadora:e.target.value}))}
            style={{...S.select,width:"auto",flex:"1 1 160px",minWidth:130,padding:"6px 10px",fontSize:13}}>
            <option value="">Todas as operadoras</option>
            {operadoras.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <input placeholder="Número Linha" value={filterCA.numeroLinha} onChange={e=>setFilterCA(f=>({...f,numeroLinha:e.target.value}))} style={caFilterStyle}/>
          <input placeholder="Data Aquisição (DD/MM/AAAA)" value={filterCA.dataAquisicao} onChange={e=>setFilterCA(f=>({...f,dataAquisicao:e.target.value}))} style={caFilterStyle}/>
          <input placeholder="Número de Série" value={filterCA.numeroSerie} onChange={e=>setFilterCA(f=>({...f,numeroSerie:e.target.value}))} style={caFilterStyle}/>
          <input placeholder="Número do Documento" value={filterCA.numeroDocumento} onChange={e=>setFilterCA(f=>({...f,numeroDocumento:e.target.value}))} style={caFilterStyle}/>
          <input placeholder="Patrimônio" value={filterCA.patrimonio} onChange={e=>setFilterCA(f=>({...f,patrimonio:e.target.value}))} style={caFilterStyle}/>
          <input placeholder="IMEI Slot 1" value={filterCA.imeiSlot1} onChange={e=>setFilterCA(f=>({...f,imeiSlot1:e.target.value}))} style={caFilterStyle}/>
          {hasAnyFilter&&<button style={{...S.btnCancel,whiteSpace:"nowrap"}} onClick={()=>setFilterCA({empresa:"",funcionario:"",cpf:"",operadora:"",numeroLinha:"",dataAquisicao:"",numeroSerie:"",numeroDocumento:"",patrimonio:"",imeiSlot1:""})}>Limpar</button>}
        </div>

        {loading?<Spinner/>:filteredCA.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>🖥️</span>{hasAnyFilter?"Nenhum resultado para o filtro aplicado":"Nenhum registro cadastrado"}</div>:(
          isMobile?(
            <div>{filteredCA.map(item=>(
              <div key={item.id} style={S.mobileCard}>
                <div style={{fontWeight:700,fontSize:13}}>{item.nomeFuncionario}</div>
                <div style={{fontSize:12,color:C.textLight,marginBottom:6}}>CPF: {item.cpf||"—"} · {item.totalItens} item(ns)</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                  {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");const func=funcionarios.find(f=>f.nome===item.nomeFuncionario);setModal({id:item.id,funcionarioId:func?.id||""});}}>Editar</button>}
                  {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}
                  <button style={{...S.actionBtn,background:"#EBF5FB",color:"#2980B9"}} onClick={()=>openItens(item)}>📋 Itens ({item.totalItens})</button>
                </div>
              </div>
            ))}</div>
          ):(
            <table style={S.table}><thead><tr>
              {["Funcionário","CPF","Itens","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>{filteredCA.map(item=>(
              <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={{...S.td,fontWeight:600}}>{item.nomeFuncionario}</td>
                <td style={S.td}>{item.cpf||"—"}</td>
                <td style={S.td}><span style={{...S.badge,background:"#EBF5FB",color:"#2980B9"}}>{item.totalItens}</span></td>
                <td style={S.td}>
                  {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");const func=funcionarios.find(f=>f.nome===item.nomeFuncionario);setModal({id:item.id,funcionarioId:func?.id||""});}}>Editar</button>}
                  {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}
                  <button style={{...S.actionBtn,background:"#EBF5FB",color:"#2980B9"}} onClick={()=>openItens(item)}>📋 Ver Itens ({item.totalItens})</button>
                </td>
              </tr>
            ))}</tbody></table>
          )
        )}
      </div>

      {/* Form principal */}
      {modal&&(
        <Modal title={modal.id?"Editar Registro":"Novo Registro"} onClose={()=>setModal(null)}>
          <SelectField label="Nome do Funcionário" value={modal.funcionarioId}
            onChange={v=>setModal(m=>({...m,funcionarioId:v}))}
            options={funcionarios.filter(f=>f.situacao==="Ativo"&&(!modal.id?!items.some(i=>i.funcionarioId===f.id):true)).map(f=>({value:f.id,label:f.nome}))}
            required/>
          {modal.funcionarioId&&(()=>{
            const func=funcionarios.find(f=>f.id===modal.funcionarioId);
            return func?.cpf?(
              <div style={{...S.formRow}}>
                <label style={S.label}>CPF</label>
                <input value={func.cpf} readOnly style={{...S.input,background:"#f5f5f5",color:C.textLight,cursor:"default"}}/>
              </div>
            ):null;
          })()}
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}

      {/* Itens modal */}
      {itensModal&&(
        <Modal title={`Itens — ${itensModal.controle.nomeFuncionario}`} onClose={()=>setItensModal(null)} extraWide>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:12,color:C.textLight}}>{itensModal.itens.length} item(ns)</span>
            <div style={{display:"flex",gap:8}}>
              {canI("insert")&&<button style={S.btnAdd} onClick={()=>{setErrItem("");setItemForm(blankItem());}}>+ Novo Item</button>}
            </div>
          </div>
          {itensModal.itens.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📦</span>Nenhum item cadastrado</div>:(
            <div style={{overflowX:"auto",maxHeight:"55vh",overflowY:"auto"}}>
              <table style={S.table}><thead><tr>
                {["Tipo de Ativo","Empresa","Operadora / Ativo","Nº Linha / Modelo","Status","Ações"].map(h=><th key={h} style={{...S.th,fontSize:11}}>{h}</th>)}
              </tr></thead>
              <tbody>{itensModal.itens.map(item=>{
                const tel=item.tipoAtivoName?.toLowerCase()==="telefonia";
                return(
                  <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                    <td style={{...S.td,fontSize:12}}>{item.tipoAtivoName||"—"}</td>
                    <td style={{...S.td,fontSize:12}}>{item.companyName||"—"}</td>
                    <td style={{...S.td,fontSize:12}}>{tel?(item.operadoraName||"—"):(item.ativoNome||"—")}</td>
                    <td style={{...S.td,fontSize:12}}>{tel?(item.numeroLinha||"—"):(item.modelo||"—")}</td>
                    <td style={{...S.td,fontSize:12}}>{item.statusAtivo?<span style={{...S.badge,background:"#EBF5FB",color:"#2980B9"}}>{item.statusAtivo}</span>:"—"}</td>
                    <td style={S.td}>
                      {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErrItem("");setItemForm({
                        id:item.id,companyId:item.companyId||"",tipoAtivoId:item.tipoAtivoId||"",
                        operadoraId:item.operadoraId||"",linhaId:item.linhaId||"",ativoId:item.ativoId||"",
                        acesso:item.acesso||"",estrutura:item.estrutura||"",iccid:item.iccid||"",tipoPacote:item.tipoPacote||"",
                        marca:item.marca||"",modelo:item.modelo||"",imeiSlot1:item.imeiSlot1||"",imeiSlot2:item.imeiSlot2||"",
                        numeroSerie:item.numeroSerie||"",sistemaOperacional:item.sistemaOperacional||"",versao:item.versao||"",
                        processador:item.processador||"",memoria:item.memoria||"",hd:item.hd||"",patrimonio:item.patrimonio||"",
                        numeroDocumento:item.numeroDocumento||"",valor:item.valor||"",dataAquisicao:item.dataAquisicao||"",
                        condicao:item.condicao||"",acessorios:item.acessorios||"",statusAtivo:item.statusAtivo||"",
                        ativoNome:item.ativoNome||"",numeroLinha:item.numeroLinha||"",operadoraName:item.operadoraName||"",
                      });}}>✏️</button>}
                      {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelItemId(item.id)}><Icon name="trash" size={13}/></button>}
                      <button style={{...S.actionBtn,background:"#FFF3E0",color:"#E65100",fontWeight:600}} onClick={()=>setMovModal({item,controleId:itensModal.controle.id})}>🔄 Mov.</button>
                      <button style={{...S.actionBtn,background:"#F0E6FF",color:"#6C3483"}} onClick={()=>openAnexos(itensModal.controle.id,item)}>
                        📎{item.attachments?.length?` (${item.attachments.length})`:""}
                      </button>
                      {item.tipoAtivoId&&<button style={{...S.actionBtn,background:"#E8F5E9",color:"#1B5E20",fontWeight:600}} onClick={()=>imprimirContrato(item)}>🖨️ Contrato</button>}
                      {item.tipoAtivoId&&<button style={{...S.actionBtn,background:"#E3F2FD",color:"#0D47A1",fontWeight:600,opacity:sendingEmail?0.7:1}} disabled={sendingEmail} onClick={()=>enviarContrato(item)}>{sendingEmail?"Enviando...":<><Icon name="send" size={13}/> Enviar</>}</button>}
                    </td>
                  </tr>
                );
              })}</tbody></table>
            </div>
          )}
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
            <button style={S.btnClose} onClick={()=>setItensModal(null)}>Fechar</button>
          </div>
        </Modal>
      )}

      {/* Form de item */}
      {itemForm&&(()=>{
        const tel=isTelefonia(itemForm.tipoAtivoId);
        const ativosEstoque=ativos.filter(a=>a.status==="Em Estoque"||(itemForm.id&&a.id===itemForm.ativoId));
        const linhasEstoqueForm=linhasEstoque.concat(
          itemForm.id&&itemForm.linhaId&&!linhasEstoque.find(l=>l.id===itemForm.linhaId)
            ?[{id:itemForm.linhaId,numeroLinha:itemForm.numeroLinha||"?",operadoraName:itemForm.operadoraName||""}]
            :[]
        );
        const RO=(label,value)=>(
          <div style={S.formRow}>
            <label style={S.label}>{label}</label>
            <input value={value||""} readOnly style={{...S.input,background:"#f5f5f5",color:C.textLight,cursor:"default"}}/>
          </div>
        );
        const g2={display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"};
        return(
          <Modal title={itemForm.id?"Editar Item":"Novo Item"} onClose={()=>setItemForm(null)} extraWide>
            <div style={g2}>
              <SelectField label="Tipo de Ativo *" value={itemForm.tipoAtivoId} onChange={v=>setItemForm(m=>({...m,tipoAtivoId:v,operadoraId:"",linhaId:"",ativoId:""}))}
                options={tipoAtivos.map(t=>({value:t.id,label:t.name}))}/>
              <SelectField label="Empresa *" value={itemForm.companyId} onChange={v=>setItemForm(m=>({...m,companyId:v}))}
                options={companies.filter(c=>c.active).map(c=>({value:c.id,label:c.name}))}/>
            </div>

            {/* Campos Telefonia */}
            {tel&&(<>
              <div style={g2}>
                {RO("Marca",itemForm.marca)}
                {RO("Modelo",itemForm.modelo)}
              </div>
              <div style={g2}>
                {RO("IMEI Slot 1",itemForm.imeiSlot1)}
                {RO("IMEI Slot 2",itemForm.imeiSlot2)}
              </div>
              {RO("Operadora",itemForm.operadoraName||operadoras.find(o=>o.id===itemForm.operadoraId)?.name)}
              <SelectField label="Número Linha (Em estoque) *" value={itemForm.linhaId} onChange={v=>{
                const l=linhasEstoqueForm.find(x=>x.id===v);
                setItemForm(m=>({...m,linhaId:v,
                  operadoraId:l?.operadoraId||m.operadoraId,
                  acesso:l?.acesso||"",estrutura:l?.estrutura||"",
                  iccid:l?.iccid||"",tipoPacote:l?.tipoPacote||"",
                }));
              }} options={linhasEstoqueForm.map(l=>({value:l.id,label:`${l.numeroLinha}${l.operadoraName?" — "+l.operadoraName:""}`}))}/>
              <div style={g2}>
                {RO("Acesso",itemForm.acesso)}
                {RO("Estrutura",itemForm.estrutura)}
              </div>
              <div style={g2}>
                {RO("ICCID",itemForm.iccid)}
                {RO("Tipo Pacote",itemForm.tipoPacote)}
              </div>
            </>)}

            {/* Campos não-Telefonia */}
            {itemForm.tipoAtivoId&&!tel&&(<>
              <SelectField label="Nome do Ativo (Em Estoque) *" value={itemForm.ativoId} onChange={v=>{
                const a=ativosEstoque.find(x=>x.id===v);
                setItemForm(m=>({...m,ativoId:v,
                  marca:a?.marca||"",modelo:a?.modelo||"",
                  numeroSerie:a?.numeroSerie||"",sistemaOperacional:a?.sistemaOperacional||"",
                  versao:a?.versao||"",processador:a?.processador||"",
                  memoria:a?.memoria||"",hd:a?.hd||"",patrimonio:a?.patrimonio||"",
                  numeroDocumento:a?.numeroDocumento||"",valor:a?.valor||"",
                  dataAquisicao:a?.dataAquisicao||"",condicao:a?.condicao||"",
                  acessorios:a?.acessorios||"",imeiSlot1:a?.imeiSlot1||"",imeiSlot2:a?.imeiSlot2||"",
                }));
              }} options={ativosEstoque.map(a=>({value:a.id,label:`${a.nome}${a.marca?" | "+a.marca:""}${a.modelo?" | "+a.modelo:""}${a.numeroSerie?" | "+a.numeroSerie:""}${a.imeiSlot1?" | "+a.imeiSlot1:""}`}))}/>
              <div style={g2}>
                {RO("Marca",itemForm.marca)}
                {RO("Modelo",itemForm.modelo)}
              </div>
              <div style={g2}>
                {RO("Nº de Série",itemForm.numeroSerie)}
                {RO("Sistema Operacional",itemForm.sistemaOperacional)}
              </div>
              <div style={g2}>
                {RO("Versão",itemForm.versao)}
                {RO("Processador",itemForm.processador)}
              </div>
              <div style={g2}>
                {RO("Memória",itemForm.memoria)}
                {RO("HD",itemForm.hd)}
              </div>
              <div style={g2}>
                {RO("Patrimônio",itemForm.patrimonio)}
                {RO("Nº Documento",itemForm.numeroDocumento)}
              </div>
              <div style={g2}>
                {RO("Valor",itemForm.valor)}
                {RO("Data Aquisição",itemForm.dataAquisicao)}
              </div>
              <div style={g2}>
                {RO("Condição",itemForm.condicao)}
                {RO("IMEI 1",itemForm.imeiSlot1)}
              </div>
              <div style={g2}>
                {RO("IMEI 2",itemForm.imeiSlot2)}
                {RO("Status",itemForm.statusAtivo||"Em Estoque")}
              </div>
              {RO("Acessórios",itemForm.acessorios)}
            </>)}

            {!itemForm.tipoAtivoId&&<div style={{color:C.textLight,fontSize:12,marginBottom:12}}>Selecione o Tipo de Ativo para ver os campos correspondentes.</div>}

            {errItem&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{errItem}</div>}
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button style={S.btnCancel} onClick={()=>setItemForm(null)}>Cancelar</button>
              <button style={S.btnSave} onClick={saveItem}>Salvar</button>
            </div>
          </Modal>
        );
      })()}

      {/* Anexos modal */}
      {anexosModal&&(
        <Modal title="Anexos" onClose={()=>setAnexosModal(null)} wide>
          <div style={{marginBottom:16}}>
            <label style={{...S.btnAdd,display:"inline-block",cursor:"pointer",fontSize:12,padding:"7px 14px"}}>
              📎 Adicionar anexo
              <input type="file" onChange={handleAnexoAdd} style={{display:"none"}}/>
            </label>
          </div>
          {anexosModal.attachments.length===0?<div style={{color:C.textLight,fontSize:13,marginBottom:16}}>Nenhum anexo.</div>:(
            <div style={{marginBottom:16}}>
              {anexosModal.attachments.map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",border:`1px solid ${C.border}`,borderRadius:6,marginBottom:6}}>
                  <div>
                    <a href={a.data} download={a.name} style={{color:C.primary,fontWeight:600,fontSize:13}}>{a.name}</a>
                  </div>
                  {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>removeAnexo(i)}>Remover</button>}
                </div>
              ))}
            </div>
          )}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setAnexosModal(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={saveAnexos}>Salvar Anexos</button>
          </div>
        </Modal>
      )}

      {delId&&<ConfirmModal msg="Excluir este registro e todos os seus itens?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
      {delItemId&&<ConfirmModal msg="Excluir este item?" onConfirm={delItem} onCancel={()=>setDelItemId(null)}/>}

      {/* Modal Movimentações */}
      {movModal&&(
        <MovimentacoesModal
          movModal={movModal} onClose={()=>setMovModal(null)}
          itensModal={itensModal} funcionarios={funcionarios}
          onDone={()=>{setMovModal(null);reloadItens();}}
        />
      )}

      {csvImpModal&&(
        <Modal title="Importar Controle de Ativos via CSV" onClose={()=>{setCsvImpModal(false);setCsvImpRows(null);}}>
          <p style={{fontSize:12,color:C.textLight,marginBottom:12}}>CSV com coluna: <strong>Nome do Funcionário</strong><br/>Registros já existentes serão ignorados.</p>
          <label style={{...S.btnAdd,cursor:"pointer",display:"inline-block",marginBottom:12}}>
            📂 Selecionar arquivo CSV
            <input type="file" accept=".csv" style={{display:"none"}} onChange={handleCsvImpFile}/>
          </label>
          {csvImpRows&&<div style={{fontSize:12,color:C.success,fontWeight:600,marginBottom:12}}>✅ {csvImpRows.length} registro(s) prontos para importar</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>{setCsvImpModal(false);setCsvImpRows(null);}}>Cancelar</button>
            <button style={{...S.btnSave,background:C.success}} onClick={processarCsvImp} disabled={!csvImpRows||csvImpBusy}>
              {csvImpBusy?"Processando...":"⚙️ Processar"}
            </button>
          </div>
        </Modal>
      )}

      {csvImpItensModal&&(
        <Modal title="Importar Itens de Controle via CSV" onClose={()=>{setCsvImpItensModal(false);setCsvImpItensRows(null);}}>
          <p style={{fontSize:12,color:C.textLight,marginBottom:12}}>CSV com colunas: <strong>Funcionário</strong>, <strong>Tipo de Ativo</strong>, <strong>Empresa</strong><br/>Para <strong>Telefonia</strong>: + <strong>Número Linha</strong><br/>Para demais tipos: + <strong>Nº de Série</strong> e/ou <strong>Imei(Slot1)</strong></p>
          <label style={{...S.btnAdd,cursor:"pointer",display:"inline-block",marginBottom:12}}>
            📂 Selecionar arquivo CSV
            <input type="file" accept=".csv" style={{display:"none"}} onChange={handleCsvImpItensFile}/>
          </label>
          {csvImpItensRows&&<div style={{fontSize:12,color:C.success,fontWeight:600,marginBottom:12}}>✅ {csvImpItensRows.length} item(ns) prontos para importar</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>{setCsvImpItensModal(false);setCsvImpItensRows(null);}}>Cancelar</button>
            <button style={{...S.btnSave,background:C.success}} onClick={processarCsvImpItens} disabled={!csvImpItensRows||csvImpItensBusy}>
              {csvImpItensBusy?"Processando...":"⚙️ Processar"}
            </button>
          </div>
        </Modal>
      )}

      {cargaModal&&(
        <Modal title="Carga Inicial — Controle de Ativos" onClose={()=>setCargaModal(null)} extraWide>
          <div style={{marginBottom:12,padding:12,background:"#F0F4FF",borderRadius:8,fontSize:11,color:C.text,lineHeight:1.7}}>
            <strong>Formato do CSV (colunas em ordem):</strong><br/>
            <strong>Col 1:</strong> CPF do Funcionário &nbsp;|&nbsp; <strong>Col 2:</strong> Tipo de Ativo &nbsp;|&nbsp; <strong>Col 3:</strong> Empresa (Fantasia)<br/>
            <em>Quando Col 2 ≠ "Telefonia":</em> Col 4=Nome Ativo · 5=Marca · 6=Modelo · 7=Nº Série · 8=Sist.Operacional · 9=Versão · 10=Processador · 11=Memória · 12=HD · 13=Patrimônio · 14=Nº Doc · 15=Valor · 16=Data Aquisição (DD/MM/AAAA) · 17=Condição · 18=Acessórios · 19=Status<br/>
            <em>Quando Col 2 = "Telefonia":</em> Col 20=Marca · 21=Modelo · 22=IMEI1 · 23=IMEI2 · 24=Operadora · 25=Nº Linha · 26=Acesso · 27=Estrutura · 28=ICCID · 29=Tipo Pacote
          </div>
          <div style={{marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
            <input type="checkbox" id="caSkipHdr" checked={cargaModal.skipHeader}
              onChange={e=>setCargaModal(m=>({...m,skipHeader:e.target.checked}))}/>
            <label htmlFor="caSkipHdr" style={{fontSize:13}}>Ignorar primeira linha (cabeçalho)</label>
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Arquivo CSV</label>
            <input type="file" accept=".csv,text/csv" onChange={e=>setCargaModal(m=>({...m,file:e.target.files[0]||null,result:null}))}
              style={{...S.input,padding:"6px"}}/>
          </div>
          {cargaModal.result&&(
            <div style={{marginBottom:12,padding:12,background:cargaModal.result.erros?.length?"#FFF8DC":"#F0FFF0",borderRadius:8,fontSize:12}}>
              <div>✅ <strong>{cargaModal.result.inseridos}</strong> registro(s) importado(s)</div>
              {cargaModal.result.erros?.length>0&&(
                <div style={{marginTop:8,maxHeight:150,overflowY:"auto"}}>
                  <div style={{fontWeight:600,marginBottom:4,color:C.danger}}>{cargaModal.result.erros.length} erro(s):</div>
                  {cargaModal.result.erros.map((e,i)=>(
                    <div key={i} style={{color:C.danger,fontSize:11}}>Linha {e.linha}: {e.msg}</div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setCargaModal(null)}>Fechar</button>
            <button style={{...S.btnSave,opacity:cargaModal.processing||!cargaModal.file?0.6:1}}
              disabled={cargaModal.processing||!cargaModal.file}
              onClick={async()=>{
                if(!cargaModal.file)return;
                setCargaModal(m=>({...m,processing:true,result:null}));
                try{
                  const text=await cargaModal.file.text();
                  let rows=parseCSVRows(text);
                  if(cargaModal.skipHeader&&rows.length>0)rows=rows.slice(1);
                  const result=await api.post("/controle-ativos/carga-inicial",{rows});
                  setCargaModal(m=>({...m,processing:false,result}));
                  load();
                }catch(e){alert("Erro: "+e.message);setCargaModal(m=>({...m,processing:false}));}
              }}>
              {cargaModal.processing?"Processando...":"⚙️ Processar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── USER PROFILE MODAL ────────────────────────────────────────
function UserProfileModal({user,onClose,onUserUpdated}){
  const[tab,setTab]=useState("dados");
  const[name,setName]=useState(user.name||"");
  const[apelido,setApelido]=useState(user.apelido||"");
  const[avatar,setAvatar]=useState(user.avatar||null);
  const[avatarPreview,setAvatarPreview]=useState(user.avatar||null);
  const[curPwd,setCurPwd]=useState("");
  const[newPwd,setNewPwd]=useState("");
  const[confPwd,setConfPwd]=useState("");
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState("");
  const[ok,setOk]=useState("");

  const handleFileChange=e=>{
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const b64=ev.target.result;
      setAvatar(b64);
      setAvatarPreview(b64);
    };
    reader.readAsDataURL(file);
  };

  const saveDados=async()=>{
    if(!name.trim()){setErr("Nome é obrigatório.");return;}
    setSaving(true);setErr("");setOk("");
    try{
      const updated=await api.put("/users/me",{name:name.trim(),apelido:apelido.trim()||null,avatar});
      onUserUpdated({...user,...updated});
      setOk("Perfil atualizado com sucesso!");
    }catch(e){setErr(e.message);}
    setSaving(false);
  };

  const saveSenha=async()=>{
    if(!curPwd||!newPwd||!confPwd){setErr("Preencha todos os campos.");return;}
    if(newPwd!==confPwd){setErr("As senhas não coincidem.");return;}
    if(newPwd.length<6){setErr("A nova senha deve ter no mínimo 6 caracteres.");return;}
    setSaving(true);setErr("");setOk("");
    try{
      await api.put("/users/me/password",{currentPassword:curPwd,newPassword:newPwd});
      setOk("Senha alterada com sucesso!");
      setCurPwd("");setNewPwd("");setConfPwd("");
    }catch(e){setErr(e.message);}
    setSaving(false);
  };

  const tabStyle=active=>({
    padding:"8px 18px",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,
    background:active?C.primary:"none",color:active?C.white:C.textLight,
    borderRadius:"6px 6px 0 0",borderBottom:active?`2px solid ${C.primary}`:"2px solid transparent"
  });

  return(
    <Modal title="Meu Perfil" onClose={onClose}>
      <div style={{display:"flex",gap:0,marginBottom:16,borderBottom:`1px solid ${C.border}`}}>
        <button style={tabStyle(tab==="dados")} onClick={()=>{setErr("");setOk("");setTab("dados");}}>👤 Dados</button>
        <button style={tabStyle(tab==="senha")} onClick={()=>{setErr("");setOk("");setTab("senha");}}>🔑 Senha</button>
      </div>

      {tab==="dados"&&(
        <div>
          {/* Avatar */}
          <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:24}}>
            <div style={{width:80,height:80,borderRadius:"50%",overflow:"hidden",border:`3px solid ${C.primary}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:C.primary}}>
              {avatarPreview
                ?<img src={avatarPreview} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                :<span style={{fontSize:28,fontWeight:700,color:C.white}}>{getInit(name)}</span>}
            </div>
            <div>
              <label style={{...S.btnAdd,display:"inline-block",cursor:"pointer",fontSize:12,padding:"7px 14px"}}>
                📷 Alterar foto
                <input type="file" accept="image/*" onChange={handleFileChange} style={{display:"none"}}/>
              </label>
              {avatarPreview&&<button style={{...S.btnCancel,marginLeft:8,fontSize:12,padding:"7px 14px"}} onClick={()=>{setAvatar(null);setAvatarPreview(null);}}>Remover</button>}
              <div style={{fontSize:11,color:C.textLight,marginTop:6}}>JPG, PNG ou GIF. Recomendado: 200×200px</div>
            </div>
          </div>
          <Input label="Nome Completo" value={name} onChange={setName} required/>
          <Input label="Apelido (exibido no sistema)" value={apelido} onChange={setApelido} placeholder="Como deseja ser chamado"/>
          <Input label="E-mail" value={user.email} onChange={()=>{}} disabled/>
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          {ok&&<div style={{color:C.success,fontSize:12,marginBottom:8}}>{ok}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={onClose}>Fechar</button>
            <button style={S.btnSave} onClick={saveDados} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </div>
      )}

      {tab==="senha"&&(
        <div>
          <Input label="Senha atual" value={curPwd} onChange={setCurPwd} type="password" required/>
          <Input label="Nova senha" value={newPwd} onChange={setNewPwd} type="password" required/>
          <Input label="Confirmar nova senha" value={confPwd} onChange={setConfPwd} type="password" required/>
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          {ok&&<div style={{color:C.success,fontSize:12,marginBottom:8}}>{ok}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={onClose}>Fechar</button>
            <button style={S.btnSave} onClick={saveSenha} disabled={saving}>{saving?"Salvando...":"Alterar Senha"}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── RELATÓRIO DE ESCALA DE SOBREAVISO ─────────────────────────
function RelatorioEscalaScreen({user}){
  const[escalas,setEscalas]=useState([]);
  const[escalaSel,setEscalaSel]=useState("");
  const[relatorio,setRelatorio]=useState(null);
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const isMobile=useIsMobile();

  useEffect(()=>{api.get("/escalas").then(setEscalas).catch(()=>{});},[]);

  const buscar=async()=>{
    if(!escalaSel){setErr("Selecione uma escala.");return;}
    setLoading(true);setErr("");setRelatorio(null);
    try{
      const data=await api.get(`/escalas/${escalaSel}/relatorio-calendario`);
      setRelatorio(data);
    }catch(e){setErr(e.message);}
    setLoading(false);
  };

  // Gera todos os dias do período da escala
  const buildCalendar=(escala,turnos)=>{
    const [d1,m1,y1]=escala.dataInicio.split("/"); const di=new Date(`${y1}-${m1}-${d1}T12:00:00Z`);
    const [d2,m2,y2]=escala.dataFim.split("/");   const df=new Date(`${y2}-${m2}-${d2}T12:00:00Z`);
    const turnoMap={};
    turnos.forEach(t=>{
      if(!turnoMap[t.turnoDate])turnoMap[t.turnoDate]={};
      turnoMap[t.turnoDate][t.turno]=t;
    });
    const days=[];
    const cur=new Date(di);
    while(cur<=df){
      const iso=cur.toISOString().slice(0,10);
      days.push({iso,date:new Date(cur),t1:turnoMap[iso]?.turno1||null,t2:turnoMap[iso]?.turno2||null});
      cur.setUTCDate(cur.getUTCDate()+1);
    }
    return days;
  };

  const exportPDF=()=>{
    if(!relatorio)return;
    const{escala,turnos}=relatorio;
    const days=buildCalendar(escala,turnos);
    const doc=new jsPDF({orientation:"landscape"});
    doc.setFontSize(14);
    doc.text(`Escala de Sobreaviso — ${escala.companyName} / ${escala.teamNamesStr||escala.teamName||""}`,14,16);
    doc.setFontSize(10);
    doc.text(`Período: ${escala.dataInicio} a ${escala.dataFim}`,14,23);
    const rows=days.map(d=>{
      const wd=DAYS_PT[d.date.getUTCDay()];
      const [,dm,dd]=d.iso.split("-");
      const feriado=(d.t1?.isFeriado||d.t2?.isFeriado)?"🎉":"";
      return[`${dd}/${dm} (${wd})${feriado}`,d.t1?.userName||"—",d.t2?.userName||"—"];
    });
    autoTable(doc,{
      head:[["Data","Turno 1 (00:00–07:30 / 00:00–12:00)","Turno 2 (17:30–00:00 / 12:00–00:00)"]],
      body:rows,startY:30,styles:{fontSize:9},
      headStyles:{fillColor:[240,165,0],textColor:255,fontStyle:"bold"},
    });
    doc.save(`Relatorio_Escala_${escala.companyName}_${escala.teamNamesStr||escala.teamName||""}.pdf`);
  };

  const exportEscalaExcel=()=>{
    if(!relatorio)return;
    const{escala,turnos}=relatorio;
    const days=buildCalendar(escala,turnos);
    const wsData=[["Data","Dia da Semana","Turno 1","Turno 2"]];
    days.forEach(d=>{
      const wd=DAYS_PT[d.date.getUTCDay()];
      const[,dm,dd]=d.iso.split("-");
      wsData.push([`${dd}/${dm}`,wd,d.t1?.userName||"",d.t2?.userName||""]);
    });
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(wsData),"Escala");
    XLSX.writeFile(wb,`Relatorio_Escala_${escala.companyName}.xlsx`);
  };

  const turnoLabel=(t,turnoKey)=>{
    if(!t)return<span style={{color:C.textLight,fontSize:11}}>—</span>;
    const bg=turnoKey==="turno1"?C.t1bg:C.t2bg;
    const border=turnoKey==="turno1"?C.t1border:C.t2border;
    return(
      <div style={{background:bg,border:`1px solid ${border}`,borderRadius:4,padding:"3px 7px",fontSize:11,fontWeight:600,color:C.accent,display:"inline-block",maxWidth:"100%",wordBreak:"break-word"}}>
        {t.userName||"?"}
        {t.isFeriado&&<span style={{marginLeft:4,fontSize:10}}>🎉</span>}
      </div>
    );
  };

  return(
    <div>
      <div style={S.card}>
        <div style={S.cardHeader}><span style={S.cardTitle}>📅 Relatório de Escala de Sobreaviso</span><div style={{display:"flex",gap:8}}><button style={S.btnSave} onClick={exportPDF} disabled={!relatorio}>⬇ PDF</button><button style={S.btnSave} onClick={exportEscalaExcel} disabled={!relatorio}>⬇ Excel</button></div></div>
        <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:220}}>
            <label style={S.label}>Escala de Sobreaviso *</label>
            <select value={escalaSel} onChange={e=>setEscalaSel(e.target.value)} style={S.select}>
              <option value="">Selecione uma escala...</option>
              {escalas.map(e=><option key={e.id} value={e.id}>{e.companyName} / {e.teamNamesStr||"—"} ({e.dataInicio} – {e.dataFim})</option>)}
            </select>
          </div>
          <button style={S.btnAdd} onClick={buscar} disabled={loading}>{loading?"Carregando...":<><Icon name="search" size={13}/> Pesquisar</>}</button>
        </div>
        {err&&<div style={{...S.errorMsg,textAlign:"left",marginTop:10}}>{err}</div>}
      </div>

      {relatorio&&(()=>{
        const{escala,turnos}=relatorio;
        const days=buildCalendar(escala,turnos);
        const preenchidos=turnos.filter(t=>t.userId).length;
        const total=days.length*2;
        return(
          <div style={{...S.card,marginTop:16}}>
            {/* Cabeçalho */}
            <div style={{...S.cardHeader,flexWrap:"wrap",gap:8}}>
              <div>
                <div style={S.cardTitle}>📋 {escala.companyName} — {escala.teamNamesStr||"—"}</div>
                <div style={{fontSize:12,color:C.textLight,marginTop:4}}>{escala.dataInicio} a {escala.dataFim} · {days.length} dias · {preenchidos}/{total} turnos preenchidos</div>
              </div>
            </div>

            {/* Legenda */}
            <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}>
                <div style={{width:14,height:14,background:C.t1bg,border:`1px solid ${C.t1border}`,borderRadius:3}}/>
                <span>Turno 1 (sem/feriado: 00:00–07:30 / 00:00–12:00)</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}>
                <div style={{width:14,height:14,background:C.t2bg,border:`1px solid ${C.t2border}`,borderRadius:3}}/>
                <span>Turno 2 (sem/feriado: 17:30–00:00 / 12:00–00:00)</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}><span>🎉</span><span>Feriado</span></div>
            </div>

            {/* Calendário */}
            {isMobile?(
              <div>
                {days.map(d=>{
                  const wd=DAYS_PT[d.date.getUTCDay()];
                  const [,dm,dd]=d.iso.split("-");
                  const isWE=d.date.getUTCDay()===0||d.date.getUTCDay()===6;
                  const feriado=d.t1?.isFeriado||d.t2?.isFeriado;
                  return(
                    <div key={d.iso} style={{...S.mobileCard,borderLeft:`3px solid ${feriado?"#E67E22":isWE?"#8E44AD":C.border}`}}>
                      <div style={{fontWeight:700,color:C.accent,marginBottom:8,fontSize:13}}>
                        {dd}/{dm} ({wd}){isWE&&<span style={{color:"#8E44AD",marginLeft:6,fontSize:11}}>Fim de semana</span>}{feriado&&<span style={{marginLeft:6}}>🎉</span>}
                      </div>
                      <div style={{display:"flex",gap:4,marginBottom:4}}><span style={{fontSize:11,color:C.textLight,minWidth:54}}>Turno 1:</span>{turnoLabel(d.t1,"turno1")}</div>
                      <div style={{display:"flex",gap:4}}><span style={{fontSize:11,color:C.textLight,minWidth:54}}>Turno 2:</span>{turnoLabel(d.t2,"turno2")}</div>
                    </div>
                  );
                })}
              </div>
            ):(
              <div style={{overflowX:"auto"}}>
                <table style={{...S.table,tableLayout:"fixed"}}>
                  <colgroup><col style={{width:140}}/><col/><col/></colgroup>
                  <thead><tr>
                    <th style={S.th}>Data</th>
                    <th style={{...S.th,color:C.t1border}}>Turno 1</th>
                    <th style={{...S.th,color:C.t2border}}>Turno 2</th>
                  </tr></thead>
                  <tbody>
                    {days.map(d=>{
                      const wd=DAYS_PT[d.date.getUTCDay()];
                      const [,dm,dd]=d.iso.split("-");
                      const isWE=d.date.getUTCDay()===0||d.date.getUTCDay()===6;
                      const feriado=d.t1?.isFeriado||d.t2?.isFeriado;
                      const rowBg=feriado?"#FFF3E0":isWE?"#F3E5F5":C.white;
                      return(
                        <tr key={d.iso} style={{background:rowBg}}
                          onMouseOver={e=>e.currentTarget.style.filter="brightness(0.97)"}
                          onMouseOut={e=>e.currentTarget.style.filter="none"}>
                          <td style={{...S.td,fontWeight:600}}>
                            {dd}/{dm} <span style={{color:C.textLight,fontWeight:400,fontSize:11}}>({wd})</span>
                            {isWE&&<span style={{color:"#8E44AD",marginLeft:6,fontSize:10,fontWeight:700}}>FDS</span>}
                            {feriado&&<span style={{marginLeft:4}}>🎉</span>}
                          </td>
                          <td style={S.td}>{turnoLabel(d.t1,"turno1")}</td>
                          <td style={S.td}>{turnoLabel(d.t2,"turno2")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── HOME ──────────────────────────────────────────────────────
function HomeScreen({user,navigate}){
  const[stats,setStats]=useState({usuarios:0,empresas:0,perfis:0,equipes:0,escalas:0});
  useEffect(()=>{
    Promise.all([api.get("/users").catch(()=>[]),api.get("/companies").catch(()=>[]),api.get("/profiles").catch(()=>[]),api.get("/teams").catch(()=>[]),api.get("/escalas").catch(()=>[])])
      .then(([u,c,p,t,e])=>setStats({usuarios:u.length,empresas:c.length,perfis:p.length,equipes:t.length,escalas:e.length}));
  },[]);
  const cards=[
    {icon:"👤",title:"Perfis",   sub:`${stats.perfis} cadastrado(s)`,  action:()=>navigate("s1"),screenId:"s1"},
    {icon:"👥",title:"Usuários", sub:`${stats.usuarios} cadastrado(s)`, action:()=>navigate("s2"),screenId:"s2"},
    {icon:"🏢",title:"Empresas", sub:`${stats.empresas} cadastrada(s)`, action:()=>navigate("s3"),screenId:"s3"},
    {icon:"👷",title:"Equipes",  sub:`${stats.equipes} cadastrada(s)`,  action:()=>navigate("s4"),screenId:"s4"},
    {icon:"⏱️",title:"Controle de Horas",sub:`${stats.escalas} escala(s)`, action:()=>navigate("s5"),screenId:"s5"},
    {icon:"📊",title:"Relatório de Horas",sub:"Ver relatório",              action:()=>navigate("s6"),screenId:"s6"},
    {icon:"⚡",title:"Extra Avulso",        sub:"Lançar hora extra",            action:()=>navigate("s7"),screenId:"s7"},
  ].filter(c=>user.permissions?.[c.screenId]?.view);
  const isMobile=useIsMobile();
  return(
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:isMobile?18:22,fontWeight:700,color:C.accent,margin:0}}>Olá, {user.name.split(" ")[0]}! 👋</h2>
        <p style={{color:C.textLight,marginTop:6,fontSize:13}}>Bem-vindo ao Sistema de Controle de TI</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(5,1fr)",gap:isMobile?10:16,marginBottom:isMobile?16:28}}>
        {[{label:"Usuários",value:stats.usuarios,icon:"👥",color:C.primary},{label:"Empresas",value:stats.empresas,icon:"🏢",color:C.secondary},{label:"Perfis",value:stats.perfis,icon:"👤",color:"#2980B9"},{label:"Equipes",value:stats.equipes,icon:"👷",color:"#8E44AD"},{label:"Escalas",value:stats.escalas,icon:"📅",color:"#27AE60"}].map(s=>(
          <div key={s.label} style={{...S.card,borderTop:`3px solid ${s.color}`,padding:isMobile?12:20,display:"flex",alignItems:"center",gap:isMobile?10:16}}>
            <span style={{fontSize:isMobile?24:32}}>{s.icon}</span>
            <div><div style={{fontSize:isMobile?20:26,fontWeight:800,color:s.color}}>{s.value}</div><div style={{fontSize:11,color:C.textLight,fontWeight:600}}>{s.label}</div></div>
          </div>
        ))}
      </div>
      {cards.length>0&&(
        <div style={S.card}>
          <div style={{...S.cardHeader,marginBottom:16}}><span style={{fontSize:15,fontWeight:700,color:C.accent}}>Acesso Rápido</span></div>
          <div style={{...S.homeGrid,gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(auto-fill,minmax(180px,1fr))"}}>
            {cards.map(c=>(
              <div key={c.title} style={S.homeCard} onClick={c.action}
                onMouseOver={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.12)";}}
                onMouseOut={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.07)";}}>
                <div style={{fontSize:32,marginBottom:12}}>{c.icon}</div>
                <div style={{fontSize:14,fontWeight:700,color:C.accent}}>{c.title}</div>
                <div style={{fontSize:12,color:C.textLight,marginTop:4}}>{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── CONFIGURAÇÃO DE E-MAIL (s28) ─────────────────────────────
function EmailFormRow({label,children}){
  return(
    <div style={S.formRow}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}
function ConfiguracaoEmailScreen({user}){
  const p=user.permissions?.s28;
  const[cfg,setCfg]=useState({host:"",port:"587",secure:false,userEmail:"",password:"",fromName:"",fromEmail:""});
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[testing,setTesting]=useState(false);
  const[showPwd,setShowPwd]=useState(false);

  useEffect(()=>{
    if(!p?.view)return;
    api.get("/email-config")
      .then(d=>{ if(d) setCfg({host:d.host||"",port:String(d.port||587),secure:d.secure||false,userEmail:d.userEmail||"",password:"",fromName:d.fromName||"",fromEmail:d.fromEmail||""}); })
      .catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  const save=async()=>{
    if(!cfg.host?.trim()||!cfg.userEmail?.trim()) return alert("Servidor SMTP e E-mail são obrigatórios.");
    setSaving(true);
    try{
      await api.put("/email-config",{host:cfg.host.trim(),port:parseInt(cfg.port)||587,secure:cfg.secure,userEmail:cfg.userEmail.trim(),password:cfg.password||undefined,fromName:cfg.fromName.trim(),fromEmail:cfg.fromEmail.trim()});
      alert("Configuração salva com sucesso!");
      setCfg(c=>({...c,password:""}));
    }catch(e){alert(e.message);}
    finally{setSaving(false);}
  };

  const testar=async()=>{
    setTesting(true);
    try{
      await api.post("/email-config/testar",{});
      alert("Teste enviado! Verifique a caixa de entrada de "+cfg.fromEmail+".");
    }catch(e){alert("Falha no teste: "+e.message);}
    finally{setTesting(false);}
  };

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;

  const F=EmailFormRow;

  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>⚙️ Configuração de E-mail</span></div>
      <div style={{maxWidth:560}}>
        <div style={{padding:"12px 16px",background:"#EBF5FB",borderRadius:8,marginBottom:20,fontSize:13,color:"#1A5276",border:"1px solid #AED6F1"}}>
          Configure o servidor SMTP para envio automático de contratos por e-mail. O sistema suporta Gmail, Outlook, e outros provedores.
        </div>

        <F label="Servidor SMTP *">
          <input value={cfg.host} onChange={e=>setCfg(c=>({...c,host:e.target.value}))} placeholder="ex: smtp.gmail.com" style={S.input}/>
        </F>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <F label="Porta *">
            <input value={cfg.port} onChange={e=>setCfg(c=>({...c,port:e.target.value}))} placeholder="587" type="number" style={S.input}/>
          </F>
          <F label="Segurança">
            <select value={cfg.secure?"ssl":"starttls"} onChange={e=>setCfg(c=>({...c,secure:e.target.value==="ssl"}))} style={S.select}>
              <option value="starttls">STARTTLS (porta 587)</option>
              <option value="ssl">SSL/TLS (porta 465)</option>
            </select>
          </F>
        </div>
        <F label="E-mail do remetente *">
          <input value={cfg.userEmail} onChange={e=>setCfg(c=>({...c,userEmail:e.target.value}))} placeholder="ti@empresa.com.br" type="email" style={S.input}/>
        </F>
        <F label="Senha / App Password">
          <div style={{position:"relative"}}>
            <input value={cfg.password} onChange={e=>setCfg(c=>({...c,password:e.target.value}))} placeholder="Deixe em branco para manter a senha atual"
              type={showPwd?"text":"password"} style={{...S.input,paddingRight:44}}/>
            <button onClick={()=>setShowPwd(s=>!s)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.textLight}}>
              {showPwd?"🙈":"👁️"}
            </button>
          </div>
        </F>
        <div style={{padding:"10px 14px",background:"#FDFEE8",border:"1px solid #F9E79F",borderRadius:8,fontSize:12,color:"#7D6608",marginBottom:12}}>
          <strong>Gmail:</strong> Ative a verificação em duas etapas e use uma <em>App Password</em> (Conta Google → Segurança → Senhas de App).<br/>
          <strong>Outlook/Hotmail:</strong> Use smtp.office365.com, porta 587, STARTTLS.
        </div>
        <F label="Nome exibido no e-mail">
          <input value={cfg.fromName} onChange={e=>setCfg(c=>({...c,fromName:e.target.value}))} placeholder="TI - Empresa" style={S.input}/>
        </F>
        <F label="E-mail de exibição">
          <input value={cfg.fromEmail} onChange={e=>setCfg(c=>({...c,fromEmail:e.target.value}))} placeholder="ti@empresa.com.br (padrão: mesmo acima)" type="email" style={S.input}/>
        </F>

        <div style={{display:"flex",gap:12,marginTop:8}}>
          {(p?.edit||p?.insert)&&<button style={S.btnSave} onClick={save} disabled={saving}>{saving?"Salvando...":"💾 Salvar"}</button>}
          <button style={{...S.btnSave,background:C.accent}} onClick={testar} disabled={testing}>{testing?"Enviando...":"📧 Testar Configuração"}</button>
        </div>
      </div>
    </div>
  );
}

// ── RELATÓRIO DE ANÁLISE DE LINHAS (s24) ─────────────────────
function RelatorioAnaliseLinhasScreen({user}){
  const p=user.permissions?.s24;
  const[allData,setAllData]=useState([]);
  const[companies,setCompanies]=useState([]);
  const[operadoras,setOperadoras]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filtEmp,setFiltEmp]=useState("");
  const[filtOp,setFiltOp]=useState("");
  const[selMeses,setSelMeses]=useState([]);
  const[filtNrLinha,setFiltNrLinha]=useState("");
  const[filtPlano,setFiltPlano]=useState("");
  const[filtConsumo,setFiltConsumo]=useState("Todos");
  const[searched,setSearched]=useState(false);

  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/linhas-faturadas/relatorio"),api.get("/companies"),api.get("/operadoras")])
      .then(([d,c,o])=>{setAllData(d);setCompanies(c);setOperadoras(o);})
      .catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  const mesesDispo=useMemo(()=>{
    let d=allData;
    if(filtEmp)d=d.filter(r=>r.companyId===filtEmp);
    if(filtOp)d=d.filter(r=>r.operadoraId===filtOp);
    return[...new Set(d.map(r=>r.mesAno))].sort();
  },[allData,filtEmp,filtOp]);

  useEffect(()=>{setSelMeses([]);},[filtEmp,filtOp]);
  const toggleMes=m=>setSelMeses(ms=>ms.includes(m)?ms.filter(x=>x!==m):[...ms,m]);

  const isZero=v=>!v||String(v).trim()===""||String(v).trim()==="0"||/^0[.,]?0*\s*(KB|MB|GB|TB|bytes|b)?$/i.test(String(v).trim());

  const activeMeses=selMeses.length>0?selMeses:mesesDispo;

  const pivotData=useMemo(()=>{
    let d=allData;
    if(filtEmp)d=d.filter(r=>r.companyId===filtEmp);
    if(filtOp)d=d.filter(r=>r.operadoraId===filtOp);
    d=d.filter(r=>activeMeses.includes(r.mesAno));
    if(filtNrLinha)d=d.filter(r=>(r.numeroLinha||"").toLowerCase().includes(filtNrLinha.toLowerCase()));
    if(filtPlano)d=d.filter(r=>(r.plano||"").toLowerCase().includes(filtPlano.toLowerCase()));
    const map=new Map();
    for(const r of d){
      const key=`${r.companyId}|${r.operadoraId}|${r.numeroLinha}|${r.plano}`;
      if(!map.has(key))map.set(key,{companyName:r.companyName,operadoraName:r.operadoraName,numeroLinha:r.numeroLinha,plano:r.plano,meses:{}});
      map.get(key).meses[r.mesAno]=r.consumoLinha;
    }
    let rows=[...map.values()];
    if(filtConsumo==="Zerados")rows=rows.filter(r=>activeMeses.every(m=>isZero(r.meses[m])));
    else if(filtConsumo==="Não zerados")rows=rows.filter(r=>activeMeses.some(m=>!isZero(r.meses[m])));
    return rows;
  },[allData,filtEmp,filtOp,activeMeses,filtNrLinha,filtPlano,filtConsumo]);

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;

  const MesChip=({m})=>(
    <label style={{display:"flex",alignItems:"center",gap:4,fontSize:13,cursor:"pointer",padding:"3px 10px",borderRadius:6,
      background:selMeses.includes(m)?C.primary:"#fff",color:selMeses.includes(m)?"#fff":C.text,border:`1px solid ${selMeses.includes(m)?C.primary:C.border}`}}>
      <input type="checkbox" checked={selMeses.includes(m)} onChange={()=>toggleMes(m)} style={{display:"none"}}/>
      {m}
    </label>
  );

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>📊 Relatório de Análise de Linhas</span>
        <div style={{display:"flex",gap:8}}>
          <button style={S.btnSave} onClick={()=>{
            const doc=new jsPDF({orientation:"landscape"});doc.setFontSize(14);doc.text("Relatório de Análise de Linhas",14,14);
            autoTable(doc,{startY:20,head:[["Empresa","Operadora","Nº Linha","Plano",...activeMeses]],body:pivotData.map(r=>[r.companyName||"",r.operadoraName||"",r.numeroLinha||"",r.plano||"",...activeMeses.map(m=>r.meses[m]||"")]),styles:{fontSize:8},headStyles:{fillColor:[97,97,97]}});
            doc.save("relatorio-analise-linhas.pdf");
          }} disabled={pivotData.length===0}>⬇ PDF</button>
          <button style={S.btnSave} onClick={()=>{
            const ws=XLSX.utils.json_to_sheet(pivotData.map(r=>({Empresa:r.companyName||"",Operadora:r.operadoraName||"","Nº Linha":r.numeroLinha||"",Plano:r.plano||"",...Object.fromEntries(activeMeses.map(m=>[m,r.meses[m]||""]))})));
            const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Análise");XLSX.writeFile(wb,"relatorio-analise-linhas.xlsx");
          }}>⬇️ Excel</button>
        </div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"flex-start"}}>
        <select value={filtEmp} onChange={e=>setFiltEmp(e.target.value)} style={{...S.select,width:"auto",minWidth:160}}>
          <option value="">Todas as empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filtOp} onChange={e=>setFiltOp(e.target.value)} style={{...S.select,width:"auto",minWidth:150}}>
          <option value="">Todas as operadoras</option>{operadoras.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <input placeholder="Nº Linha..." value={filtNrLinha} onChange={e=>setFiltNrLinha(e.target.value)} style={{...S.input,width:"auto",minWidth:130,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Plano..." value={filtPlano} onChange={e=>setFiltPlano(e.target.value)} style={{...S.input,width:"auto",minWidth:130,padding:"6px 10px",fontSize:13}}/>
        <select value={filtConsumo} onChange={e=>setFiltConsumo(e.target.value)} style={{...S.select,width:"auto",minWidth:150}}>
          {["Todos","Zerados","Não zerados"].map(v=><option key={v}>{v}</option>)}
        </select>
        <button style={S.btnSave} onClick={()=>setSearched(true)}>Filtrar</button>
      </div>
      {mesesDispo.length>0&&(
        <div style={{marginBottom:14}}>
          <div style={{...S.label,marginBottom:6}}>Mês/Ano — clique para colunar (vazio = todos)</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,padding:10,background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
            {mesesDispo.map(m=><MesChip key={m} m={m}/>)}
          </div>
        </div>
      )}
      {searched&&<div style={{fontSize:12,color:C.textLight,marginBottom:8}}>{pivotData.length} linha(s)</div>}
      {!searched?<div style={S.emptyState}><span style={S.emptyIcon}>📊</span>Use os filtros e clique em Filtrar.</div>:pivotData.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📊</span>Nenhum dado encontrado.</div>:(
        <div style={{overflowX:"auto"}}>
          <table style={{...S.table,minWidth:600}}>
            <thead><tr>{["Empresa","Operadora","Nº Linha","Plano",...activeMeses].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>{pivotData.map((r,i)=>(
              <tr key={i} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={S.td}>{r.companyName||"—"}</td>
                <td style={S.td}>{r.operadoraName||"—"}</td>
                <td style={{...S.td,fontWeight:600}}>{r.numeroLinha||"—"}</td>
                <td style={S.td}>{r.plano||"—"}</td>
                {activeMeses.map(m=><td key={m} style={{...S.td,color:isZero(r.meses[m])?C.danger:C.text}}>{r.meses[m]||"—"}</td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── RELATÓRIO DE RESUMO DE LINHAS (s25) ──────────────────────
function RelatorioResumoLinhasScreen({user}){
  const p=user.permissions?.s25;
  const[allData,setAllData]=useState([]);
  const[companies,setCompanies]=useState([]);
  const[operadoras,setOperadoras]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filtEmp,setFiltEmp]=useState("");
  const[filtOp,setFiltOp]=useState("");
  const[selMeses,setSelMeses]=useState([]);
  const[searched,setSearched]=useState(false);

  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/linhas-faturadas/relatorio"),api.get("/companies"),api.get("/operadoras")])
      .then(([d,c,o])=>{setAllData(d);setCompanies(c);setOperadoras(o);})
      .catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  const mesesDispo=useMemo(()=>{
    let d=allData;
    if(filtEmp)d=d.filter(r=>r.companyId===filtEmp);
    if(filtOp)d=d.filter(r=>r.operadoraId===filtOp);
    return[...new Set(d.map(r=>r.mesAno))].sort();
  },[allData,filtEmp,filtOp]);

  useEffect(()=>{setSelMeses([]);},[filtEmp,filtOp]);
  const toggleMes=m=>setSelMeses(ms=>ms.includes(m)?ms.filter(x=>x!==m):[...ms,m]);

  const isZero=v=>!v||String(v).trim()===""||String(v).trim()==="0"||/^0[.,]?0*\s*(KB|MB|GB|TB|bytes|b)?$/i.test(String(v).trim());
  const parseNum=v=>parseFloat(String(v||"").replace(/[^0-9.,]/g,"").replace(",","."))||0;

  const filtered=useMemo(()=>{
    let d=allData;
    if(filtEmp)d=d.filter(r=>r.companyId===filtEmp);
    if(filtOp)d=d.filter(r=>r.operadoraId===filtOp);
    const meses=selMeses.length>0?selMeses:mesesDispo;
    return d.filter(r=>meses.includes(r.mesAno));
  },[allData,filtEmp,filtOp,selMeses,mesesDispo]);

  const summary=useMemo(()=>{
    const byEmpOp=new Map(),byEmp=new Map(),byOp=new Map();
    let totLines=new Set(),totZero=new Set(),totC=0,totV=0;
    for(const r of filtered){
      const eoKey=`${r.companyId}|${r.operadoraId}`;
      const lineKey=`${r.companyId}|${r.operadoraId}|${r.numeroLinha}`;
      if(!byEmpOp.has(eoKey))byEmpOp.set(eoKey,{cn:r.companyName||"(sem empresa)",on:r.operadoraName||"(sem operadora)",lines:new Set(),zero:new Set(),c:0,v:0});
      if(!byEmp.has(r.companyId))byEmp.set(r.companyId,{n:r.companyName||"(sem empresa)",lines:new Set(),zero:new Set(),c:0,v:0});
      if(!byOp.has(r.operadoraId))byOp.set(r.operadoraId,{n:r.operadoraName||"(sem operadora)",lines:new Set(),zero:new Set(),c:0,v:0});
      const eo=byEmpOp.get(eoKey),em=byEmp.get(r.companyId),op=byOp.get(r.operadoraId);
      eo.lines.add(lineKey);em.lines.add(lineKey);op.lines.add(lineKey);totLines.add(lineKey);
      if(isZero(r.consumoLinha)){eo.zero.add(lineKey);em.zero.add(lineKey);op.zero.add(lineKey);totZero.add(lineKey);}
      const c=parseNum(r.consumoLinha),v=parseNum(r.valorLinha);
      eo.c+=c;eo.v+=v;em.c+=c;em.v+=v;op.c+=c;op.v+=v;totC+=c;totV+=v;
    }
    return{
      byEmpOp:[...byEmpOp.values()].sort((a,b)=>a.cn.localeCompare(b.cn)||a.on.localeCompare(b.on)),
      byEmp:[...byEmp.values()].sort((a,b)=>a.n.localeCompare(b.n)),
      byOp:[...byOp.values()].sort((a,b)=>a.n.localeCompare(b.n)),
      totLines:totLines.size,totZero:totZero.size,totC,totV,
    };
  },[filtered]);

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;

  const fmtNum=v=>v===0?"0":v.toLocaleString("pt-BR",{maximumFractionDigits:2});
  const TR=({lbl,val,bold})=>(
    <tr onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
      <td style={{...S.td,paddingLeft:bold?12:24,fontWeight:bold?700:400,color:bold?C.accent:C.text}}>{lbl}</td>
      <td style={{...S.td,textAlign:"right",fontWeight:bold?700:400}}>{val}</td>
    </tr>
  );

  const MesChip=({m})=>(
    <label style={{display:"flex",alignItems:"center",gap:4,fontSize:13,cursor:"pointer",padding:"3px 10px",borderRadius:6,
      background:selMeses.includes(m)?C.primary:"#fff",color:selMeses.includes(m)?"#fff":C.text,border:`1px solid ${selMeses.includes(m)?C.primary:C.border}`}}>
      <input type="checkbox" checked={selMeses.includes(m)} onChange={()=>toggleMes(m)} style={{display:"none"}}/>
      {m}
    </label>
  );

  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>📋 Relatório de Resumo de Linhas</span>
        <div style={{display:"flex",gap:8}}>
          <button style={S.btnSave} disabled={filtered.length===0} onClick={()=>{
            const doc=new jsPDF({orientation:"landscape"});doc.setFontSize(14);doc.text("Relatório de Resumo de Linhas",14,14);
            autoTable(doc,{startY:20,head:[["Empresa / Operadora","Qtde Linhas","Linhas Consumo Zero","Consumo Total","Valor Total"]],body:[...summary.byEmpOp.map(r=>[`${r.cn} / ${r.on}`,r.lines.size,r.zero.size,fmtNum(r.c),fmtNum(r.v)]),["TOTAL GERAL",summary.totLines,summary.totZero,fmtNum(summary.totC),fmtNum(summary.totV)]],styles:{fontSize:9},headStyles:{fillColor:[97,97,97]}});
            doc.save("relatorio-resumo-linhas.pdf");
          }}>⬇ PDF</button>
          <button style={S.btnSave} disabled={filtered.length===0} onClick={()=>{
            const ws=XLSX.utils.json_to_sheet([...summary.byEmpOp.map(r=>({"Empresa / Operadora":`${r.cn} / ${r.on}`,"Qtde Linhas":r.lines.size,"Linhas Consumo Zero":r.zero.size,"Consumo Total":fmtNum(r.c),"Valor Total":fmtNum(r.v)})),{"Empresa / Operadora":"TOTAL GERAL","Qtde Linhas":summary.totLines,"Linhas Consumo Zero":summary.totZero,"Consumo Total":fmtNum(summary.totC),"Valor Total":fmtNum(summary.totV)}]);
            const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Resumo Linhas");XLSX.writeFile(wb,"relatorio-resumo-linhas.xlsx");
          }}>⬇ Excel</button>
        </div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <select value={filtEmp} onChange={e=>setFiltEmp(e.target.value)} style={{...S.select,width:"auto",minWidth:160}}>
          <option value="">Todas as empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filtOp} onChange={e=>setFiltOp(e.target.value)} style={{...S.select,width:"auto",minWidth:150}}>
          <option value="">Todas as operadoras</option>{operadoras.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <button style={S.btnSave} onClick={()=>setSearched(true)}>Filtrar</button>
      </div>
      {mesesDispo.length>0&&(
        <div style={{marginBottom:14}}>
          <div style={{...S.label,marginBottom:6}}>Mês/Ano</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,padding:10,background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
            {mesesDispo.map(m=><MesChip key={m} m={m}/>)}
          </div>
        </div>
      )}
      {!searched?<div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Use os filtros e clique em Filtrar.</div>:filtered.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Nenhum dado encontrado.</div>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16}}>
          {[
            {title:"Quantidade de Linhas",rows:[...summary.byEmpOp.map(r=>({lbl:`${r.cn} / ${r.on}`,val:r.lines.size})),...summary.byEmp.map(r=>({lbl:`Empresa: ${r.n}`,val:r.lines.size})),...summary.byOp.map(r=>({lbl:`Operadora: ${r.n}`,val:r.lines.size})),{lbl:"Total",val:summary.totLines,bold:true}]},
            {title:"Linhas com Consumo Zerado",rows:[...summary.byEmpOp.map(r=>({lbl:`${r.cn} / ${r.on}`,val:r.zero.size})),...summary.byEmp.map(r=>({lbl:`Empresa: ${r.n}`,val:r.zero.size})),...summary.byOp.map(r=>({lbl:`Operadora: ${r.n}`,val:r.zero.size})),{lbl:"Total",val:summary.totZero,bold:true}]},
            {title:"Consumo Total",rows:[...summary.byEmpOp.map(r=>({lbl:`${r.cn} / ${r.on}`,val:fmtNum(r.c)})),...summary.byEmp.map(r=>({lbl:`Empresa: ${r.n}`,val:fmtNum(r.c)})),...summary.byOp.map(r=>({lbl:`Operadora: ${r.n}`,val:fmtNum(r.c)})),{lbl:"Total",val:fmtNum(summary.totC),bold:true}]},
            {title:"Valor Total (R$)",rows:[...summary.byEmpOp.map(r=>({lbl:`${r.cn} / ${r.on}`,val:fmtNum(r.v)})),...summary.byEmp.map(r=>({lbl:`Empresa: ${r.n}`,val:fmtNum(r.v)})),...summary.byOp.map(r=>({lbl:`Operadora: ${r.n}`,val:fmtNum(r.v)})),{lbl:"Total",val:fmtNum(summary.totV),bold:true}]},
          ].map(sec=>(
            <div key={sec.title}>
              <div style={{fontWeight:700,color:C.accent,marginBottom:8,paddingBottom:6,borderBottom:`2px solid ${C.primary}`}}>{sec.title}</div>
              <table style={S.table}><tbody>{sec.rows.map((r,i)=><TR key={i} lbl={r.lbl} val={r.val} bold={r.bold}/>)}</tbody></table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── RESUMO DE ATIVOS (s26) ────────────────────────────────────
function ResumoAtivosScreen({user}){
  const p=user.permissions?.s26;
  const[allData,setAllData]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filtNome,setFiltNome]=useState("");
  const[filtTipo,setFiltTipo]=useState("");
  const[filtEmp,setFiltEmp]=useState("");
  const[filtAtivo,setFiltAtivo]=useState("");
  const[filtSerie,setFiltSerie]=useState("");
  const[filtDoc,setFiltDoc]=useState("");
  const[filtStatus,setFiltStatus]=useState("");
  const[searched,setSearched]=useState(false);

  useEffect(()=>{
    if(!p?.view)return;
    api.get("/controle-ativos/itens/relatorio").then(setAllData).catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  const tipoOpts=useMemo(()=>[...new Set(allData.map(r=>r.tipoAtivoName||"").filter(Boolean))].sort(),[allData]);
  const empOpts=useMemo(()=>[...new Set(allData.map(r=>r.companyName||"").filter(Boolean))].sort(),[allData]);
  const stOpts=useMemo(()=>[...new Set(allData.map(r=>r.statusAtivo||"").filter(Boolean))].sort(),[allData]);

  const filtered=useMemo(()=>{
    let d=allData;
    if(filtNome)d=d.filter(r=>(r.nomeFuncionario||"").toLowerCase().includes(filtNome.toLowerCase()));
    if(filtTipo)d=d.filter(r=>r.tipoAtivoName===filtTipo);
    if(filtEmp)d=d.filter(r=>r.companyName===filtEmp);
    if(filtAtivo)d=d.filter(r=>(r.ativoNome||"").toLowerCase().includes(filtAtivo.toLowerCase()));
    if(filtSerie)d=d.filter(r=>(r.numeroSerie||"").toLowerCase().includes(filtSerie.toLowerCase()));
    if(filtDoc)d=d.filter(r=>(r.numeroDocumento||"").toLowerCase().includes(filtDoc.toLowerCase()));
    if(filtStatus)d=d.filter(r=>r.statusAtivo===filtStatus);
    return d;
  },[allData,filtNome,filtTipo,filtEmp,filtAtivo,filtSerie,filtDoc,filtStatus]);

  const grouped=useMemo(()=>{
    const map=new Map();
    for(const r of filtered){
      const key=`${r.tipoAtivoName||""}|${r.ativoNome||""}`;
      if(!map.has(key))map.set(key,{tipo:r.tipoAtivoName||"(sem tipo)",ativo:r.ativoNome||"(sem ativo)",count:0});
      map.get(key).count++;
    }
    return[...map.values()].sort((a,b)=>a.tipo.localeCompare(b.tipo)||a.ativo.localeCompare(b.ativo));
  },[filtered]);

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>📦 Resumo de Ativos</span>
        <div style={{display:"flex",gap:8}}>
          <button style={S.btnSave} onClick={()=>{
            const doc=new jsPDF();doc.setFontSize(14);doc.text("Resumo de Ativos",14,14);
            autoTable(doc,{startY:20,head:[["Tipo de Ativo","Nome do Ativo","Quantidade"]],body:grouped.map(r=>[r.tipo,r.ativo,r.count]),styles:{fontSize:9},headStyles:{fillColor:[97,97,97]}});
            doc.save("resumo-ativos.pdf");
          }} disabled={grouped.length===0}>⬇ PDF</button>
          <button style={S.btnSave} onClick={()=>{
            const ws=XLSX.utils.json_to_sheet(grouped.map(r=>({"Tipo de Ativo":r.tipo,"Nome do Ativo":r.ativo,"Quantidade":r.count})));
            const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Resumo");XLSX.writeFile(wb,"resumo-ativos.xlsx");
          }}>⬇️ Excel</button>
        </div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        <input placeholder="Nome Funcionário..." value={filtNome} onChange={e=>setFiltNome(e.target.value)} style={{...S.input,width:"auto",minWidth:160,padding:"6px 10px",fontSize:13}}/>
        <select value={filtTipo} onChange={e=>setFiltTipo(e.target.value)} style={{...S.select,width:"auto",minWidth:150}}>
          <option value="">Todos os tipos</option>{tipoOpts.map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={filtEmp} onChange={e=>setFiltEmp(e.target.value)} style={{...S.select,width:"auto",minWidth:150}}>
          <option value="">Todas as empresas</option>{empOpts.map(e=><option key={e}>{e}</option>)}
        </select>
        <input placeholder="Nome do Ativo..." value={filtAtivo} onChange={e=>setFiltAtivo(e.target.value)} style={{...S.input,width:"auto",minWidth:130,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Nº de Série..." value={filtSerie} onChange={e=>setFiltSerie(e.target.value)} style={{...S.input,width:"auto",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Nº Documento..." value={filtDoc} onChange={e=>setFiltDoc(e.target.value)} style={{...S.input,width:"auto",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <select value={filtStatus} onChange={e=>setFiltStatus(e.target.value)} style={{...S.select,width:"auto",minWidth:130}}>
          <option value="">Todos os status</option>{stOpts.map(s=><option key={s}>{s}</option>)}
        </select>
        <button style={S.btnSave} onClick={()=>setSearched(true)}>Filtrar</button>
      </div>
      {searched&&<div style={{fontSize:12,color:C.textLight,marginBottom:8}}>{filtered.length} item(ns) · {grouped.length} grupo(s)</div>}
      {!searched?<div style={S.emptyState}><span style={S.emptyIcon}>📦</span>Use os filtros e clique em Filtrar.</div>:grouped.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📦</span>Nenhum dado encontrado.</div>:(
        <table style={S.table}>
          <thead><tr>{["Tipo de Ativo","Nome do Ativo","Quantidade"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{grouped.map((r,i)=>{
            const showTipo=i===0||grouped[i-1].tipo!==r.tipo;
            return(
              <tr key={i} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={{...S.td,fontWeight:showTipo?700:400,color:showTipo?C.accent:C.text}}>{showTipo?r.tipo:""}</td>
                <td style={S.td}>{r.ativo}</td>
                <td style={{...S.td,textAlign:"center"}}><span style={{...S.badge,background:"#EBF5FB",color:"#2980B9",fontWeight:700}}>{r.count}</span></td>
              </tr>
            );
          })}</tbody>
        </table>
      )}
    </div>
  );
}

// ── INVENTÁRIO DE ATIVOS (s27) ────────────────────────────────
function InventarioAtivosScreen({user}){
  const p=user.permissions?.s27;
  const[allData,setAllData]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filtNome,setFiltNome]=useState("");
  const[filtTipo,setFiltTipo]=useState("");
  const[filtEmp,setFiltEmp]=useState("");
  const[filtAtivo,setFiltAtivo]=useState("");
  const[filtSerie,setFiltSerie]=useState("");
  const[filtDoc,setFiltDoc]=useState("");
  const[filtStatus,setFiltStatus]=useState("");
  const[filtOp,setFiltOp]=useState("");
  const[filtLinha,setFiltLinha]=useState("");
  const[filtIccid,setFiltIccid]=useState("");
  const[filtAcesso,setFiltAcesso]=useState("");
  const[filtEstrutura,setFiltEstrutura]=useState("");
  const[searched,setSearched]=useState(false);

  useEffect(()=>{
    if(!p?.view)return;
    api.get("/controle-ativos/itens/relatorio").then(setAllData).catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  const tipoOpts=useMemo(()=>[...new Set(allData.map(r=>r.tipoAtivoName||"").filter(Boolean))].sort(),[allData]);
  const empOpts=useMemo(()=>[...new Set(allData.map(r=>r.companyName||"").filter(Boolean))].sort(),[allData]);
  const stOpts=useMemo(()=>[...new Set(allData.map(r=>r.statusAtivo||"").filter(Boolean))].sort(),[allData]);
  const opOpts=useMemo(()=>[...new Set(allData.map(r=>r.operadoraName||"").filter(Boolean))].sort(),[allData]);

  const filtered=useMemo(()=>{
    let d=allData;
    const fi=(f,fn)=>{if(f)d=d.filter(r=>(r[fn]||"").toLowerCase().includes(f.toLowerCase()));};
    const fe=(f,fn)=>{if(f)d=d.filter(r=>r[fn]===f);};
    fi(filtNome,"nomeFuncionario");fe(filtTipo,"tipoAtivoName");fe(filtEmp,"companyName");
    fi(filtAtivo,"ativoNome");fi(filtSerie,"numeroSerie");fi(filtDoc,"numeroDocumento");
    fe(filtStatus,"statusAtivo");fe(filtOp,"operadoraName");
    fi(filtLinha,"numeroLinha");fi(filtIccid,"iccid");fi(filtAcesso,"acesso");fi(filtEstrutura,"estrutura");
    return d;
  },[allData,filtNome,filtTipo,filtEmp,filtAtivo,filtSerie,filtDoc,filtStatus,filtOp,filtLinha,filtIccid,filtAcesso,filtEstrutura]);

  const grouped=useMemo(()=>{
    const map=new Map();
    for(const r of filtered){
      const nome=r.nomeFuncionario||"(sem funcionário)";
      if(!map.has(nome))map.set(nome,[]);
      map.get(nome).push(r);
    }
    return[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  },[filtered]);

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;

  const COLS=["Tipo de Ativo","Empresa","Nome do Ativo","Nº Linha","Marca","Modelo","Nº Série","IMEI 1","ICCID","Nº Documento"];

  const exportExcel=()=>{
    const rows=[];
    for(const[nome,itens] of grouped){
      rows.push({"Funcionário":nome,...Object.fromEntries(COLS.map(c=>[c,""]))});
      for(const r of itens) rows.push({"Funcionário":"","Tipo de Ativo":r.tipoAtivoName||"","Empresa":r.companyName||"","Nome do Ativo":r.ativoNome||"","Nº Linha":r.numeroLinha||"","Marca":r.marca||"","Modelo":r.modelo||"","Nº Série":r.numeroSerie||"","IMEI 1":r.imeiSlot1||"","ICCID":r.iccid||"","Nº Documento":r.numeroDocumento||""});
    }
    const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Inventário");XLSX.writeFile(wb,"inventario-ativos.xlsx");
  };

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>📋 Inventário de Ativos</span>
        <div style={{display:"flex",gap:8}}>
          <button style={S.btnSave} onClick={()=>{
            const doc=new jsPDF({orientation:"landscape"});doc.setFontSize(14);doc.text("Inventário de Ativos",14,14);
            const body=[];
            for(const[nome,itens] of grouped){
              body.push([{content:`Funcionário: ${nome}`,colSpan:10,styles:{fillColor:[240,165,0],textColor:[255,255,255],fontStyle:"bold",fontSize:9}}]);
              itens.forEach(r=>body.push([r.tipoAtivoName||"",r.companyName||"",r.ativoNome||"",r.numeroLinha||"",r.marca||"",r.modelo||"",r.numeroSerie||"",r.imeiSlot1||"",r.iccid||"",r.numeroDocumento||""]));
            }
            autoTable(doc,{startY:20,head:[["Tipo de Ativo","Empresa","Nome do Ativo","Nº Linha","Marca","Modelo","Nº Série","IMEI 1","ICCID","Nº Documento"]],body,styles:{fontSize:7},headStyles:{fillColor:[97,97,97]}});
            doc.save("inventario-ativos.pdf");
          }} disabled={grouped.length===0}>⬇ PDF</button>
          <button style={S.btnSave} onClick={exportExcel}>⬇️ Excel</button>
        </div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        <input placeholder="Nome Funcionário..." value={filtNome} onChange={e=>setFiltNome(e.target.value)} style={{...S.input,width:"auto",minWidth:160,padding:"6px 10px",fontSize:13}}/>
        <select value={filtTipo} onChange={e=>setFiltTipo(e.target.value)} style={{...S.select,width:"auto",minWidth:140}}>
          <option value="">Todos os tipos</option>{tipoOpts.map(t=><option key={t}>{t}</option>)}
        </select>
        <select value={filtEmp} onChange={e=>setFiltEmp(e.target.value)} style={{...S.select,width:"auto",minWidth:140}}>
          <option value="">Todas as empresas</option>{empOpts.map(e=><option key={e}>{e}</option>)}
        </select>
        <input placeholder="Nome do Ativo..." value={filtAtivo} onChange={e=>setFiltAtivo(e.target.value)} style={{...S.input,width:"auto",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Nº de Série..." value={filtSerie} onChange={e=>setFiltSerie(e.target.value)} style={{...S.input,width:"auto",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Nº Documento..." value={filtDoc} onChange={e=>setFiltDoc(e.target.value)} style={{...S.input,width:"auto",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <select value={filtStatus} onChange={e=>setFiltStatus(e.target.value)} style={{...S.select,width:"auto",minWidth:120}}>
          <option value="">Todos os status</option>{stOpts.map(s=><option key={s}>{s}</option>)}
        </select>
        <select value={filtOp} onChange={e=>setFiltOp(e.target.value)} style={{...S.select,width:"auto",minWidth:140}}>
          <option value="">Todas as operadoras</option>{opOpts.map(o=><option key={o}>{o}</option>)}
        </select>
        <input placeholder="Nº Linha..." value={filtLinha} onChange={e=>setFiltLinha(e.target.value)} style={{...S.input,width:"auto",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="ICCID..." value={filtIccid} onChange={e=>setFiltIccid(e.target.value)} style={{...S.input,width:"auto",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Acesso..." value={filtAcesso} onChange={e=>setFiltAcesso(e.target.value)} style={{...S.input,width:"auto",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Estrutura..." value={filtEstrutura} onChange={e=>setFiltEstrutura(e.target.value)} style={{...S.input,width:"auto",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <button style={S.btnSave} onClick={()=>setSearched(true)}>Filtrar</button>
      </div>
      {searched&&<div style={{fontSize:12,color:C.textLight,marginBottom:8}}>{filtered.length} item(ns)</div>}
      {!searched?<div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Use os filtros e clique em Filtrar.</div>:grouped.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Nenhum dado encontrado.</div>:(
        <div style={{overflowX:"auto"}}>
          <table style={{...S.table,minWidth:900}}>
            <thead><tr>{COLS.map(h=><th key={h} style={{...S.th,fontSize:11}}>{h}</th>)}</tr></thead>
            <tbody>{grouped.flatMap(([nome,itens])=>[
              <tr key={`h-${nome}`}><td colSpan={COLS.length} style={{...S.td,background:C.primary,color:"#fff",fontWeight:700,padding:"8px 12px"}}>👤 {nome}</td></tr>,
              ...itens.map((r,j)=>(
                <tr key={`${nome}-${j}`} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                  <td style={S.td}>{r.tipoAtivoName||"—"}</td>
                  <td style={S.td}>{r.companyName||"—"}</td>
                  <td style={S.td}>{r.ativoNome||"—"}</td>
                  <td style={S.td}>{r.numeroLinha||"—"}</td>
                  <td style={S.td}>{r.marca||"—"}</td>
                  <td style={S.td}>{r.modelo||"—"}</td>
                  <td style={S.td}>{r.numeroSerie||"—"}</td>
                  <td style={S.td}>{r.imeiSlot1||"—"}</td>
                  <td style={S.td}>{r.iccid||"—"}</td>
                  <td style={S.td}>{r.numeroDocumento||"—"}</td>
                </tr>
              ))
            ])}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── HISTÓRICO DE MOVIMENTAÇÕES DE ATIVOS (s29) ────────────────
function HistoricoMovimentacoesScreen({user}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filter,setFilter]=useState({tipo:"",funcionario:"",ativo:"",linha:""});
  const isMobile=useIsMobile();

  const loadData=()=>{
    setLoading(true);
    api.get("/historico-movimentacoes")
      .then(setItems).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(()=>{loadData();},[]);

  const filtered=items.filter(i=>{
    if(filter.tipo&&i.tipoMovimentacao!==filter.tipo)return false;
    if(filter.funcionario&&!(i.funcionarioNome||"").toLowerCase().includes(filter.funcionario.toLowerCase()))return false;
    if(filter.ativo&&!(i.ativoNome||"").toLowerCase().includes(filter.ativo.toLowerCase()))return false;
    if(filter.linha&&!(i.numeroLinha||"").toLowerCase().includes(filter.linha.toLowerCase()))return false;
    return true;
  });

  const tipoBadge=t=>{
    const colors={
      "Inclusão":{bg:"#E8F5E9",cl:"#1B5E20"},
      "Edição":{bg:"#E3F2FD",cl:"#0D47A1"},
      "Exclusão":{bg:"#FFEBEE",cl:"#B71C1C"},
      "Transferência":{bg:"#FFF3E0",cl:"#E65100"},
      "Baixa":{bg:"#FCE4EC",cl:"#880E4F"},
      "Devolução Estoque":{bg:"#F3E5F5",cl:"#4A148C"},
    };
    const{bg,cl}=colors[t]||{bg:"#F5F5F5",cl:"#444"};
    return<span style={{...S.badge,background:bg,color:cl}}>{t}</span>;
  };

  const TIPOS=["Inclusão","Edição","Exclusão","Transferência","Baixa","Devolução Estoque"];

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>📜 Histórico de Movimentações de Ativos</span>
        <button style={{...S.actionBtn,background:"#EBF5FB",color:"#2980B9"}} onClick={loadData}>🔄 Atualizar</button>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <select value={filter.tipo} onChange={e=>setFilter(f=>({...f,tipo:e.target.value}))}
          style={{...S.select,width:"auto",minWidth:160}}>
          <option value="">Todos os tipos</option>
          {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <input placeholder="Funcionário..." value={filter.funcionario} onChange={e=>setFilter(f=>({...f,funcionario:e.target.value}))}
          style={{...S.input,width:"auto",minWidth:140,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Ativo..." value={filter.ativo} onChange={e=>setFilter(f=>({...f,ativo:e.target.value}))}
          style={{...S.input,width:"auto",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Nº Linha..." value={filter.linha} onChange={e=>setFilter(f=>({...f,linha:e.target.value}))}
          style={{...S.input,width:"auto",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        {(filter.tipo||filter.funcionario||filter.ativo||filter.linha)&&
          <button style={S.btnCancel} onClick={()=>setFilter({tipo:"",funcionario:"",ativo:"",linha:""})}>Limpar</button>}
      </div>
      {loading?<Spinner/>:filtered.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📜</span>Nenhuma movimentação registrada</div>:(
        <div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Data/Hora","Tipo","Funcionário","Func. Destino","Ativo / Linha","Tipo de Ativo","Empresa","Usuário"].map(h=><th key={h} style={{...S.th,fontSize:11}}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(item=>(
            <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={{...S.td,fontSize:11,whiteSpace:"nowrap"}}>{item.dataHora||"—"}</td>
              <td style={{...S.td,fontSize:11}}>{tipoBadge(item.tipoMovimentacao)}</td>
              <td style={{...S.td,fontSize:12}}><div style={{fontWeight:600}}>{item.funcionarioNome||"—"}</div><div style={{fontSize:11,color:C.textLight}}>{item.funcionarioCpf||""}</div></td>
              <td style={{...S.td,fontSize:12}}>{item.tipoMovimentacao==="Transferência"?(item.funcionarioDestinoNome||"—"):"—"}</td>
              <td style={{...S.td,fontSize:12}}>{item.ativoNome||item.numeroLinha||"—"}</td>
              <td style={{...S.td,fontSize:12}}>{item.tipoAtivoName||"—"}</td>
              <td style={{...S.td,fontSize:12}}>{item.companyName||"—"}</td>
              <td style={{...S.td,fontSize:12}}>{item.usuarioNome||"—"}</td>
            </tr>
          ))}</tbody></table>
        </div>
      )}
    </div>
  );
}

// ── FÉRIAS (s30) ─────────────────────────────────────────────

function PeriodoFeriasModal({feriasId,equipe,user,onClose,onRefresh}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[form,setForm]=useState(null);
  const[delId,setDelId]=useState(null);
  const[err,setErr]=useState("");
  const STATUS_PERIODO=["Pendente","Gozadas"];

  const calcDias=(di,df)=>{
    if(!di||!df)return 0;
    const p=s=>{const[d,m,y]=s.split("/");return new Date(`${y}-${m}-${d}`);};
    const diff=p(df)-p(di);
    return diff<0?0:Math.round(diff/86400000)+1;
  };

  const load=()=>{
    setLoading(true);
    api.get(`/ferias/${feriasId}/equipe/${equipe.id}/periodos`)
      .then(setItems).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const blankForm=()=>({dataInicial:"",dataFinal:"",status:"Pendente"});

  const save=async()=>{
    try{
      if(form.id) await api.put(`/ferias/${feriasId}/equipe/${equipe.id}/periodos/${form.id}`,form);
      else        await api.post(`/ferias/${feriasId}/equipe/${equipe.id}/periodos`,form);
      setForm(null);load();onRefresh();
    }catch(e){setErr(e.message);}
  };
  const del=async()=>{
    try{await api.delete(`/ferias/${feriasId}/equipe/${equipe.id}/periodos/${delId}`);setDelId(null);load();onRefresh();}
    catch(e){alert(e.message);}
  };

  const qtdePreview=form?calcDias(form.dataInicial,form.dataFinal):0;

  return(
    <Modal title={`Períodos de Férias — ${equipe.funcionarioNome||"—"}`} onClose={onClose} wide>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <button style={S.btnAdd} onClick={()=>{setErr("");setForm(blankForm());}}>+ Novo Período</button>
      </div>
      {loading?<Spinner/>:items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📅</span>Nenhum período cadastrado</div>:(
        <div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Data Inicial","Data Final","Qtde Dias","Status","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{items.map(it=>(
            <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={S.td}>{it.dataInicial||"—"}</td>
              <td style={S.td}>{it.dataFinal||"—"}</td>
              <td style={{...S.td,fontWeight:600,textAlign:"center"}}>{it.qtdeDias}</td>
              <td style={S.td}>
                <span style={{...S.badge,background:it.status==="Gozadas"?"#E8F5E9":"#FFF3E0",color:it.status==="Gozadas"?"#2E7D32":"#E65100"}}>
                  {it.status}
                </span>
              </td>
              <td style={S.td}>
                <button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setForm({...it});}}>✏️</button>
                <button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/></button>
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      )}
      {form&&(
        <Modal title={form.id?"Editar Período":"Novo Período"} onClose={()=>setForm(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <MaskedInput label="Data Inicial" value={form.dataInicial||""} onChange={v=>setForm(f=>({...f,dataInicial:v}))} mask={MASK_DATE} placeholder="DD/MM/AAAA"/>
            <MaskedInput label="Data Final"   value={form.dataFinal||""}   onChange={v=>setForm(f=>({...f,dataFinal:v}))}   mask={MASK_DATE} placeholder="DD/MM/AAAA"/>
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Qtde Dias (calculado)</label>
            <input readOnly value={qtdePreview} style={{...S.input,background:"#f5f5f5",color:C.textLight,cursor:"default"}}/>
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Status</label>
            <select value={form.status||"Pendente"} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={S.select}>
              {STATUS_PERIODO.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setForm(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Excluir este período?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </Modal>
  );
}

function FeriasEquipeModal({ferias,user,onClose}){
  const[items,setItems]=useState([]);
  const[funcionarios,setFuncionarios]=useState([]);
  const[loading,setLoading]=useState(true);
  const[form,setForm]=useState(null);
  const[delId,setDelId]=useState(null);
  const[err,setErr]=useState("");
  const[periodoModal,setPeriodoModal]=useState(null);

  const load=()=>{
    setLoading(true);
    Promise.all([
      api.get(`/ferias/${ferias.id}/equipe`),
      ferias.teamId ? api.get(`/teams/${ferias.teamId}/itens`) : Promise.resolve([]),
    ]).then(([eq,itens])=>{
      setItems(eq);
      // itens de equipe retornam {funcionarioId, funcionarioNome, cargo, centroCusto}
      setFuncionarios(itens.map(i=>({id:i.funcionarioId,nome:i.funcionarioNome})));
    }).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const blankForm=()=>({funcionarioId:"",dataLimite:"",dtInicFer:"",dtFinalFer:"",chamado:"",totalDias:30,diasVendidos:0});

  const save=async()=>{
    if(!form.funcionarioId){setErr("Selecione um funcionário.");return;}
    try{
      if(form.id) await api.put(`/ferias/${ferias.id}/equipe/${form.id}`,form);
      else        await api.post(`/ferias/${ferias.id}/equipe`,form);
      setForm(null);load();
    }catch(e){setErr(e.message);}
  };
  const del=async()=>{
    try{await api.delete(`/ferias/${ferias.id}/equipe/${delId}`);setDelId(null);load();}
    catch(e){alert(e.message);}
  };

  const diasGozo=f=>((parseInt(f.totalDias)||30)-(parseInt(f.diasVendidos)||0));

  const numBadge=(n,warn=false)=>(
    <span style={{fontWeight:700,color:n<0?"#B71C1C":warn&&n===0?"#E65100":"inherit"}}>{n}</span>
  );

  return(
    <Modal title={`Férias Equipe — ${ferias.teamName||ferias.companyName||""} (${ferias.ano})`} onClose={onClose} extraWide>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <button style={S.btnAdd} onClick={()=>{setErr("");setForm(blankForm());}}>+ Novo Funcionário</button>
      </div>
      {loading?<Spinner/>:items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>🏖️</span>Nenhum funcionário adicionado</div>:(
        <div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Funcionário","Data Limite","Dt Inic Fer","Dt Final Fer","Chamado","Total Dias","Dias Vendidos","Dias P/ Gozo","Dias não Programados","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{items.map(it=>(
            <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={{...S.td,fontWeight:600}}>{it.funcionarioNome||"—"}</td>
              <td style={S.td}>{it.dataLimite||"—"}</td>
              <td style={S.td}>{it.dtInicFer||"—"}</td>
              <td style={S.td}>{it.dtFinalFer||"—"}</td>
              <td style={S.td}>{it.chamado||"—"}</td>
              <td style={{...S.td,textAlign:"center"}}>{it.totalDias}</td>
              <td style={{...S.td,textAlign:"center"}}>{it.diasVendidos}</td>
              <td style={{...S.td,textAlign:"center"}}>{numBadge(it.diasGozo)}</td>
              <td style={{...S.td,textAlign:"center"}}>{numBadge(it.saldoDias,true)}</td>
              <td style={S.td}>
                <button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setForm({...it,totalDias:it.totalDias||30,diasVendidos:it.diasVendidos||0,dtInicFer:it.dtInicFer||"",dtFinalFer:it.dtFinalFer||""});}}>✏️</button>
                <button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/></button>
                <button style={{...S.actionBtn,background:"#E3F2FD",color:"#1565C0",border:"1px solid #BBDEFB",marginLeft:4}} onClick={()=>setPeriodoModal(it)}>📅 Período Férias</button>
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      )}
      {form&&(
        <Modal title={form.id?"Editar Funcionário":"Novo Funcionário"} onClose={()=>setForm(null)}>
          <SelectField label="Funcionário *" value={form.funcionarioId||""}
            onChange={v=>setForm(f=>({...f,funcionarioId:v}))}
            options={funcionarios.map(fn=>({value:fn.id,label:fn.nome}))}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <MaskedInput label="Data Limite"  value={form.dataLimite||""} onChange={v=>setForm(f=>({...f,dataLimite:v}))}  mask={MASK_DATE} placeholder="DD/MM/AAAA"/>
            <MaskedInput label="Dt Inic Fer"  value={form.dtInicFer||""}  onChange={v=>setForm(f=>({...f,dtInicFer:v}))}   mask={MASK_DATE} placeholder="DD/MM/AAAA"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <MaskedInput label="Dt Final Fer" value={form.dtFinalFer||""} onChange={v=>setForm(f=>({...f,dtFinalFer:v}))} mask={MASK_DATE} placeholder="DD/MM/AAAA"/>
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Chamado</label>
            <input value={form.chamado||""} onChange={e=>setForm(f=>({...f,chamado:e.target.value}))} style={S.input}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <div style={S.formRow}>
              <label style={S.label}>Total Dias</label>
              <input type="number" value={form.totalDias||30} onChange={e=>setForm(f=>({...f,totalDias:e.target.value}))} style={S.input}/>
            </div>
            <div style={S.formRow}>
              <label style={S.label}>Dias Vendidos</label>
              <input type="number" value={form.diasVendidos||0} onChange={e=>setForm(f=>({...f,diasVendidos:e.target.value}))} style={S.input}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            <div style={S.formRow}>
              <label style={S.label}>Dias P/ Gozo (calculado)</label>
              <input readOnly value={diasGozo(form)} style={{...S.input,background:"#f5f5f5",color:C.textLight,cursor:"default"}}/>
            </div>
          </div>
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setForm(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Excluir este funcionário da equipe?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
      {periodoModal&&(
        <PeriodoFeriasModal
          feriasId={ferias.id}
          equipe={periodoModal}
          user={user}
          onClose={()=>setPeriodoModal(null)}
          onRefresh={load}
        />
      )}
    </Modal>
  );
}

function FeriasScreen({user}){
  const[items,setItems]=useState([]);
  const[companies,setCompanies]=useState([]);
  const[teams,setTeams]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  const[delId,setDelId]=useState(null);
  const[err,setErr]=useState("");
  const[equipeModal,setEquipeModal]=useState(null);
  const[filtCompany,setFiltCompany]=useState("");
  const[filtTeams,setFiltTeams]=useState([]);
  const[filtTeamOpen,setFiltTeamOpen]=useState(false);
  const[filtAno,setFiltAno]=useState("");

  const load=()=>{
    setLoading(true);
    Promise.all([api.get("/ferias"),api.get("/companies"),api.get("/teams")])
      .then(([f,co,te])=>{setItems(f);setCompanies(co);setTeams(te);})
      .catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const blankForm=()=>({companyId:"",teamId:"",ano:new Date().getFullYear()});
  const toggleFiltTeam=id=>setFiltTeams(ts=>ts.includes(id)?ts.filter(x=>x!==id):[...ts,id]);

  const filteredItems=items.filter(it=>{
    if(filtCompany&&it.companyId!==filtCompany)return false;
    if(filtTeams.length&&!filtTeams.includes(it.teamId))return false;
    if(filtAno&&String(it.ano)!==String(filtAno))return false;
    return true;
  });

  const save=async()=>{
    if(!modal.ano){setErr("Ano é obrigatório.");return;}
    try{
      if(modal.id) await api.put(`/ferias/${modal.id}`,modal);
      else         await api.post("/ferias",modal);
      setModal(null);load();
    }catch(e){setErr(e.message);}
  };
  const del=async()=>{
    try{await api.delete(`/ferias/${delId}`);setDelId(null);load();}
    catch(e){alert(e.message);}
  };
  const p=user.permissions?.s30;

  const teamsLabel=filtTeams.length===0?"Todas"
    :filtTeams.length===1?(teams.find(t=>t.id===filtTeams[0])?.name||"1 equipe")
    :`${filtTeams.length} equipes`;

  return(
    <div>
      {/* Filtros */}
      <div style={{...S.card,marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 120px auto",gap:12,alignItems:"flex-end"}}>
          <div>
            <label style={S.label}>Empresa</label>
            <select value={filtCompany} onChange={e=>setFiltCompany(e.target.value)} style={S.select}>
              <option value="">Todas</option>
              {companies.filter(c=>c.active).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{position:"relative"}}>
            <label style={S.label}>Equipe</label>
            <button type="button" onClick={()=>setFiltTeamOpen(o=>!o)}
              style={{...S.select,textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:C.white,width:"100%"}}>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{teamsLabel}</span>
              <span style={{marginLeft:6,fontSize:10}}>{filtTeamOpen?"▲":"▼"}</span>
            </button>
            {filtTeamOpen&&(
              <div style={{position:"absolute",zIndex:200,top:"100%",left:0,right:0,background:C.white,
                border:`1px solid ${C.border}`,borderRadius:6,boxShadow:"0 4px 12px rgba(0,0,0,.12)",
                maxHeight:220,overflowY:"auto",padding:"6px 0"}}>
                {teams.map(t=>(
                  <label key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",cursor:"pointer",
                    background:filtTeams.includes(t.id)?"#EFF6FF":C.white}}>
                    <input type="checkbox" checked={filtTeams.includes(t.id)} onChange={()=>toggleFiltTeam(t.id)}/>
                    <span style={{fontSize:13}}>{t.name}</span>
                  </label>
                ))}
                {teams.length===0&&<div style={{padding:"8px 12px",fontSize:12,color:C.textLight}}>Sem equipes</div>}
              </div>
            )}
          </div>
          <div>
            <label style={S.label}>Ano</label>
            <input type="number" value={filtAno} onChange={e=>setFiltAno(e.target.value)}
              style={S.input} min="2000" max="2100" placeholder="Todos"/>
          </div>
          <button style={{...S.btnCancel,height:36,alignSelf:"flex-end"}}
            onClick={()=>{setFiltCompany("");setFiltTeams([]);setFiltAno("");setFiltTeamOpen(false);}}>
            Limpar
          </button>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>🏖️ Férias</span>
          {p?.insert&&<button style={S.btnAdd} onClick={()=>{setErr("");setModal(blankForm());}}>+ Novo</button>}
        </div>
        {loading?<Spinner/>:filteredItems.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>🏖️</span>Nenhum registro encontrado</div>:(
          <div style={{overflowX:"auto"}}>
            <table style={S.table}><thead><tr>
              {["Empresa","Equipe","Ano","Funcionários","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>{filteredItems.map(item=>(
              <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={S.td}>{item.companyName||"—"}</td>
                <td style={S.td}>{item.teamName||"—"}</td>
                <td style={{...S.td,fontWeight:600}}>{item.ano}</td>
                <td style={S.td}><span style={{...S.badge,background:"#E3F2FD",color:"#1565C0",border:"1px solid #BBDEFB"}}>{item.totalFuncionarios??0} pessoa{(item.totalFuncionarios??0)!==1?"s":""}</span></td>
                <td style={S.td}>
                  {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({...item});}}><Icon name="edit" size={13}/> Editar</button>}
                  {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}><Icon name="trash" size={13}/> Excluir</button>}
                  <button style={{...S.actionBtn,background:"#E3F2FD",color:"#1565C0",border:"1px solid #BBDEFB"}} onClick={()=>setEquipeModal(item)}>👁 Detalhe</button>
                </td>
              </tr>
            ))}</tbody></table>
          </div>
        )}
      </div>

      {modal&&(
        <Modal title={modal.id?"Editar Férias":"Novo Registro de Férias"} onClose={()=>setModal(null)} wide>
          <SelectField label="Empresa" value={modal.companyId||""} onChange={v=>setModal(m=>({...m,companyId:v}))}
            options={companies.filter(c=>c.active).map(c=>({value:c.id,label:c.name}))}/>
          <SelectField label="Equipe" value={modal.teamId||""} onChange={v=>setModal(m=>({...m,teamId:v}))}
            options={teams.map(t=>({value:t.id,label:t.name}))}/>
          <div style={S.formRow}>
            <label style={S.label}>Ano *</label>
            <input type="number" value={modal.ano||""} onChange={e=>setModal(m=>({...m,ano:e.target.value}))}
              style={S.input} min="2000" max="2100"/>
          </div>
          {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Excluir este registro de férias?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
      {equipeModal&&<FeriasEquipeModal ferias={equipeModal} user={user} onClose={()=>setEquipeModal(null)}/>}
    </div>
  );
}

// ── RELATÓRIO DE FÉRIAS ────────────────────────────────────────
function RelatorioFeriasScreen({user}){
  const p=user.permissions?.s31;
  const[companies,setCompanies]=useState([]);
  const[teams,setTeams]=useState([]);
  const[funcionarios,setFuncionarios]=useState([]);
  const[filtEmp,setFiltEmp]=useState("");
  const[filtTeams,setFiltTeams]=useState([]);   // multiselect
  const[teamOpen,setTeamOpen]=useState(false);
  const[filtAno,setFiltAno]=useState(String(new Date().getFullYear()));
  const[filtFunc,setFiltFunc]=useState("");
  const[filtChamado,setFiltChamado]=useState("");
  const[filtDnp,setFiltDnp]=useState("");             // "" | "zerado" | "naoZerado"
  const[filtDtInicFerDe,setFiltDtInicFerDe]=useState("");
  const[filtDtInicFerAte,setFiltDtInicFerAte]=useState("");
  const[filtDtInicProgrDe,setFiltDtInicProgrDe]=useState("");
  const[filtDtInicProgrAte,setFiltDtInicProgrAte]=useState("");
  const[rows,setRows]=useState(null);
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");

  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/companies"),api.get("/teams"),api.get("/funcionarios/basic")])
      .then(([c,t,f])=>{setCompanies(c);setTeams(t);setFuncionarios(f);})
      .catch(()=>{});
  },[]);

  const toggleTeam=id=>setFiltTeams(ts=>ts.includes(id)?ts.filter(x=>x!==id):[...ts,id]);

  const buscar=async()=>{
    setLoading(true);setErr("");setRows(null);setTeamOpen(false);
    try{
      const qs=new URLSearchParams();
      if(filtEmp)    qs.set("companyId",filtEmp);
      if(filtTeams.length) qs.set("teamIds",filtTeams.join(","));
      if(filtAno)    qs.set("ano",filtAno);
      if(filtFunc)   qs.set("funcionarioId",filtFunc);
      if(filtChamado.trim()) qs.set("chamado",filtChamado.trim());
      if(filtDnp)    qs.set("diasNaoProgramados",filtDnp);
      if(filtDtInicFerDe)   qs.set("dtInicFerDe",filtDtInicFerDe);
      if(filtDtInicFerAte)  qs.set("dtInicFerAte",filtDtInicFerAte);
      if(filtDtInicProgrDe)  qs.set("dtInicProgrDe",filtDtInicProgrDe);
      if(filtDtInicProgrAte) qs.set("dtInicProgrAte",filtDtInicProgrAte);
      const data=await api.get(`/ferias/relatorio?${qs}`);
      setRows(data);
    }catch(e){setErr(e.message);}
    setLoading(false);
  };

  const exportPDF=()=>{
    if(!rows||!rows.length)return;
    const doc=new jsPDF({orientation:"landscape"});
    doc.setFontSize(14);doc.text("Relatório de Férias",14,16);
    let y=24;
    for(const r of rows){
      if(y>170){doc.addPage();y=16;}
      doc.setFontSize(10);doc.setFont(undefined,"bold");
      doc.text(`${r.empresaNome||"—"} | ${r.equipeNome||"—"} | Ano ${r.ano} | ${r.funcionarioNome||"—"}`,14,y);
      y+=6;
      doc.setFont(undefined,"normal");doc.setFontSize(9);
      doc.text(`Limite: ${r.dataLimite||"—"}  Inic: ${r.dtInicFer||"—"}  Final: ${r.dtFinalFer||"—"}  Chamado: ${r.chamado||"—"}  Total: ${r.totalDias??0}  Vendidos: ${r.diasVendidos??0}  P/Gozo: ${r.diasGozo??0}  Não Prog.: ${r.saldoDias??0}`,14,y);
      y+=4;
      if(r.periodos&&r.periodos.length){
        autoTable(doc,{
          startY:y,
          head:[["Data Inicial","Data Final","Qtde Dias","Status"]],
          body:r.periodos.map(px=>[px.dataInicial||"—",px.dataFinal||"—",px.qtdeDias??0,px.status||"—"]),
          styles:{fontSize:8},margin:{left:18},
          headStyles:{fillColor:[37,99,235],textColor:255},
          tableWidth:"auto",
        });
        y=doc.lastAutoTable.finalY+6;
      }else{y+=4;}
    }
    doc.save("Relatorio_Ferias.pdf");
  };

  const exportFeriasExcel=()=>{
    if(!rows||!rows.length)return;
    const wsData=[];
    rows.forEach(r=>{
      if(r.periodos&&r.periodos.length){
        r.periodos.forEach(px=>wsData.push({"Empresa":r.empresaNome||"","Equipe":r.equipeNome||"","Funcionário":r.funcionarioNome||"","Ano":r.ano||"","Limite Dias":r.dataLimite||"","Data Inicial":px.dataInicial||"","Data Final":px.dataFinal||"","Qtde Dias":px.qtdeDias??0,"Status":px.status||""}));
      }else{
        wsData.push({"Empresa":r.empresaNome||"","Equipe":r.equipeNome||"","Funcionário":r.funcionarioNome||"","Ano":r.ano||"","Limite Dias":r.dataLimite||"","Data Inicial":"","Data Final":"","Qtde Dias":0,"Status":""});
      }
    });
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(wsData),"Férias");XLSX.writeFile(wb,"Relatorio_Ferias.xlsx");
  };

  const DtRange=({label,vDe,setDe,vAte,setAte})=>(
    <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:200}}>
      <label style={S.label}>{label}</label>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <input type="date" value={vDe} onChange={e=>setDe(e.target.value)}
          style={{...S.input,flex:1,minWidth:0}} title="De"/>
        <span style={{fontSize:11,color:C.textLight,flexShrink:0}}>até</span>
        <input type="date" value={vAte} onChange={e=>setAte(e.target.value)}
          style={{...S.input,flex:1,minWidth:0}} title="Até"/>
      </div>
    </div>
  );

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;

  const teamsLabel=filtTeams.length===0?"Todas"
    :filtTeams.length===1?(teams.find(t=>t.id===filtTeams[0])?.name||"1 equipe")
    :`${filtTeams.length} equipes`;

  return(
    <div>
      <div style={S.card}>
        <div style={S.cardHeader}><span style={S.cardTitle}>🏖️ Relatório de Férias</span><div style={{display:"flex",gap:8}}><button style={S.btnSave} onClick={exportPDF} disabled={!rows||rows.length===0}>⬇ PDF</button><button style={S.btnSave} onClick={exportFeriasExcel} disabled={!rows||rows.length===0}>⬇ Excel</button></div></div>

        {/* Linha 1: filtros principais */}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end",marginBottom:10}}>
          <div style={{flex:1,minWidth:150}}>
            <label style={S.label}>Empresa</label>
            <select value={filtEmp} onChange={e=>setFiltEmp(e.target.value)} style={S.select}>
              <option value="">Todas</option>
              {companies.filter(c=>c.active).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Equipe — multiselect dropdown */}
          <div style={{flex:1,minWidth:160,position:"relative"}}>
            <label style={S.label}>Equipe</label>
            <button onClick={()=>setTeamOpen(o=>!o)}
              style={{...S.select,textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",background:C.white}}>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{teamsLabel}</span>
              <span style={{marginLeft:6,fontSize:10}}>{teamOpen?"▲":"▼"}</span>
            </button>
            {teamOpen&&(
              <div style={{position:"absolute",zIndex:200,top:"100%",left:0,right:0,background:C.white,
                border:`1px solid ${C.border}`,borderRadius:6,boxShadow:"0 4px 12px rgba(0,0,0,.12)",
                maxHeight:220,overflowY:"auto",padding:"6px 0"}}>
                {teams.map(t=>(
                  <label key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",cursor:"pointer",
                    background:filtTeams.includes(t.id)?"#EFF6FF":C.white}}>
                    <input type="checkbox" checked={filtTeams.includes(t.id)} onChange={()=>toggleTeam(t.id)}/>
                    <span style={{fontSize:13}}>{t.name}</span>
                  </label>
                ))}
                {teams.length===0&&<div style={{padding:"8px 12px",fontSize:12,color:C.textLight}}>Sem equipes</div>}
              </div>
            )}
          </div>

          <div style={{minWidth:88}}>
            <label style={S.label}>Ano</label>
            <input type="number" value={filtAno} onChange={e=>setFiltAno(e.target.value)}
              style={{...S.input,width:88}} min="2000" max="2100" placeholder="Ano"/>
          </div>
          <div style={{flex:1,minWidth:180}}>
            <label style={S.label}>Funcionário</label>
            <select value={filtFunc} onChange={e=>setFiltFunc(e.target.value)} style={S.select}>
              <option value="">Todos</option>
              {funcionarios.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
          <div style={{flex:1,minWidth:130}}>
            <label style={S.label}>Chamado</label>
            <input value={filtChamado} onChange={e=>setFiltChamado(e.target.value)}
              style={S.input} placeholder="Número do chamado"/>
          </div>
          <div style={{minWidth:170}}>
            <label style={S.label}>Dias não Programados</label>
            <select value={filtDnp} onChange={e=>setFiltDnp(e.target.value)} style={S.select}>
              <option value="">Todos</option>
              <option value="zerado">Zerado</option>
              <option value="naoZerado">Não Zerado</option>
            </select>
          </div>
        </div>

        {/* Linha 2: filtros de data */}
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-start",marginBottom:12,
          padding:"10px 12px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`}}>
          <DtRange label="Período Inic Férias"
            vDe={filtDtInicFerDe} setDe={setFiltDtInicFerDe}
            vAte={filtDtInicFerAte} setAte={setFiltDtInicFerAte}/>
          <DtRange label="Período Inic Progr."
            vDe={filtDtInicProgrDe} setDe={setFiltDtInicProgrDe}
            vAte={filtDtInicProgrAte} setAte={setFiltDtInicProgrAte}/>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button style={S.btnAdd} onClick={buscar} disabled={loading}>{loading?"Carregando...":<><Icon name="search" size={13}/> Pesquisar</>}</button>
        </div>
        {err&&<div style={{...S.errorMsg,textAlign:"left",marginTop:8}}>{err}</div>}
      </div>

      {rows!==null&&(
        rows.length===0
          ?<div style={{...S.card,marginTop:16}}><div style={S.emptyState}><span style={S.emptyIcon}>🏖️</span>Nenhum registro encontrado para os filtros selecionados.</div></div>
          :(
            <div style={{...S.card,marginTop:16}}>
              <div style={{...S.cardHeader,flexWrap:"wrap",gap:8}}>
                <span style={S.cardTitle}>Resultados ({rows.length} registro{rows.length!==1?"s":""})</span>
              </div>
              {rows.map((r,i)=>(
                <div key={r.feriasEquipeId||i} style={{marginBottom:16,border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
                  {/* Cabeçalho do grupo */}
                  <div style={{background:C.primary,color:"#fff",padding:"8px 14px",display:"flex",flexWrap:"wrap",gap:"6px 24px",alignItems:"center"}}>
                    <span style={{fontWeight:700,fontSize:14}}>{r.funcionarioNome||"—"}</span>
                    <span style={{fontSize:12,opacity:.9}}>{r.empresaNome||"—"}</span>
                    <span style={{fontSize:12,opacity:.9}}>Equipe: {r.equipeNome||"—"}</span>
                    <span style={{fontSize:12,opacity:.9}}>Ano: {r.ano}</span>
                  </div>
                  {/* Dados do cabeçalho */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:0,background:"#f0f4ff",borderBottom:`1px solid ${C.border}`}}>
                    {[
                      ["Data Limite",    r.dataLimite||"—"],
                      ["Dt Inic Férias", r.dtInicFer||"—"],
                      ["Dt Final Férias",r.dtFinalFer||"—"],
                      ["Chamado",        r.chamado||"—"],
                      ["Total Dias",     r.totalDias??0],
                      ["Dias Vendidos",  r.diasVendidos??0],
                      ["Dias P/ Gozo",   r.diasGozo??0],
                      ["Dias não Programados", r.saldoDias??0],
                    ].map(([lbl,val])=>(
                      <div key={lbl} style={{padding:"6px 14px",borderRight:`1px solid ${C.border}`,minWidth:100}}>
                        <div style={{fontSize:10,color:C.textLight,marginBottom:2}}>{lbl}</div>
                        <div style={{fontWeight:600,fontSize:13}}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {/* Períodos */}
                  {r.periodos&&r.periodos.length>0?(
                    <div style={{overflowX:"auto"}}>
                      <table style={{...S.table,margin:0}}>
                        <thead><tr>
                          {["Data Inicial","Data Final","Qtde Dias","Status"].map(h=><th key={h} style={{...S.th,background:"#e8edf5"}}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {r.periodos.map((p,pi)=>(
                            <tr key={pi} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                              <td style={S.td}>{p.dataInicial||"—"}</td>
                              <td style={S.td}>{p.dataFinal||"—"}</td>
                              <td style={S.td}>{p.qtdeDias??0}</td>
                              <td style={S.td}>{p.status||"—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ):(
                    <div style={{padding:"10px 14px",fontSize:12,color:C.textLight}}>Nenhum período cadastrado.</div>
                  )}
                </div>
              ))}
            </div>
          )
      )}
    </div>
  );
}

const fmtDate=d=>{if(!d)return"—";const[y,m,dd]=(d||"").split("-");return y&&m&&dd?`${dd}/${m}/${y}`:d;};

// ── CONTROLE DE FOLGAS (s35) ──────────────────────────────────
function FolgasScreen({user}){
  const p=user.permissions?.s35;
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[empresas,setEmpresas]=useState([]);
  const[equipes,setEquipes]=useState([]);
  const[funcs,setFuncs]=useState([]);
  const[filters,setFilters]=useState({empresa:"",equipe:"",funcionario:"",data:"",compensado:""});
  const[form,setForm]=useState(null);
  const[delId,setDelId]=useState(null);

  const load=async(f=filters)=>{
    setLoading(true);
    const q=new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([,v])=>v))).toString();
    api.get(`/folgas${q?"?"+q:""}`).then(setItems).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/companies"),api.get("/teams")]).then(([e,eq])=>{setEmpresas(e);setEquipes(eq);});
    load();
  },[]);

  useEffect(()=>{
    if(!form?.equipeId){setFuncs([]);return;}
    api.get(`/teams/${form.equipeId}/itens`).then(its=>setFuncs(its.map(i=>({id:i.funcionarioId||i.id,nome:i.funcionarioNome||i.nome})))).catch(()=>setFuncs([]));
  },[form?.equipeId]);

  const calcTotal=(hi,hf)=>{
    if(!hi||!hf)return"";
    const[hhi,mmi]=hi.split(":").map(Number);
    const[hhf,mmf]=hf.split(":").map(Number);
    const diff=(hhf*60+mmf)-(hhi*60+mmi);
    if(diff<=0)return"";
    return`${String(Math.floor(diff/60)).padStart(2,"0")}:${String(diff%60).padStart(2,"0")}`;
  };

  const openForm=(item=null)=>{
    if(item){
      const[d,m,y]=(item.data||"").split("/");
      setForm({...item,data:y&&m&&d?`${y}-${m}-${d}`:"",equipeId:item.equipeId,funcionarioId:item.funcionarioId,empresaId:item.empresaId});
    } else {
      setForm({empresaId:"",equipeId:"",funcionarioId:"",data:"",horaInicio:"",horaFim:"",totalHoras:"",compensado:"Não",observacao:""});
    }
  };

  const save=async()=>{
    if(!form.empresaId||!form.equipeId||!form.funcionarioId||!form.data||!form.horaInicio||!form.horaFim)
      return alert("Preencha todos os campos obrigatórios.");
    const[y,m,d]=(form.data||"").split("-");
    const payload={...form,data:y&&m&&d?`${y}-${m}-${d}`:form.data,totalHoras:calcTotal(form.horaInicio,form.horaFim)};
    try{
      if(form.id)await api.put(`/folgas/${form.id}`,payload);
      else await api.post("/folgas",payload);
      setForm(null);load();
    }catch(e){alert(e.message);}
  };

  const del=async()=>{
    try{await api.delete(`/folgas/${delId}`);setDelId(null);load();}catch(e){alert(e.message);}
  };

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>🏖️ Controle de Folgas</span>
        {p?.insert&&<button style={S.btnAdd} onClick={()=>openForm()}>+ Nova Folga</button>}
      </div>
      {/* Filtros */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16,padding:12,background:C.bg,borderRadius:8}}>
        <select style={{...S.input,width:160}} value={filters.empresa} onChange={e=>setFilters(f=>({...f,empresa:e.target.value}))}>
          <option value="">Empresa</option>
          {empresas.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select style={{...S.input,width:160}} value={filters.equipe} onChange={e=>setFilters(f=>({...f,equipe:e.target.value}))}>
          <option value="">Equipe</option>
          {equipes.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select style={{...S.input,width:160}} value={filters.funcionario} onChange={e=>setFilters(f=>({...f,funcionario:e.target.value}))}>
          <option value="">Funcionário</option>
          {items.map(i=>i.funcionarioId).filter((v,i,a)=>a.indexOf(v)===i).map(id=>{
            const it=items.find(i=>i.funcionarioId===id);
            return<option key={id} value={id}>{it?.funcionarioNome}</option>;
          })}
        </select>
        <input type="date" style={{...S.input,width:150}} value={filters.data} onChange={e=>setFilters(f=>({...f,data:e.target.value}))} title="Data"/>
        <select style={{...S.input,width:130}} value={filters.compensado} onChange={e=>setFilters(f=>({...f,compensado:e.target.value}))}>
          <option value="">Compensado</option>
          <option>Sim</option><option>Não</option>
        </select>
        <button style={S.btnSave} onClick={()=>load()}><Icon name="search" size={13}/> Pesquisar</button>
        <button style={S.btnCancel} onClick={()=>{setFilters({empresa:"",equipe:"",funcionario:"",data:"",compensado:""});load({empresa:"",equipe:"",funcionario:"",data:"",compensado:""});}}><Icon name="x" size={13}/> Limpar</button>
      </div>
      {loading?<Spinner/>:items.length===0
        ?<div style={S.emptyState}><span style={S.emptyIcon}>🏖️</span>Nenhuma folga registrada.</div>
        :<div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Empresa","Equipe","Funcionário","Data","Início","Fim","Total","Compensado","Observação","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{items.map(it=>(
            <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={S.td}>{it.empresaNome}</td>
              <td style={S.td}>{it.equipeNome}</td>
              <td style={{...S.td,fontWeight:600}}>{it.funcionarioNome}</td>
              <td style={S.td}>{fmtDate(it.data)}</td>
              <td style={S.td}>{it.horaInicio}</td>
              <td style={S.td}>{it.horaFim}</td>
              <td style={{...S.td,textAlign:"center",fontWeight:600}}>{it.totalHoras||"—"}</td>
              <td style={S.td}><span style={{...S.badge,background:it.compensado==="Sim"?"#E8F5E9":"#FFEBEE",color:it.compensado==="Sim"?"#2E7D32":"#C62828"}}>{it.compensado}</span></td>
              <td style={{...S.td,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={it.observacao}>{it.observacao||"—"}</td>
              <td style={S.td}>
                {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openForm(it)}>✏️</button>}
                {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/></button>}
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      }
      {form&&(
        <Modal title={form.id?"Editar Folga":"Nova Folga"} onClose={()=>setForm(null)}>
          <SelectField label="Empresa *" value={form.empresaId} onChange={v=>setForm(f=>({...f,empresaId:v}))} options={empresas.map(e=>({value:e.id,label:e.name}))}/>
          <SelectField label="Equipe *" value={form.equipeId} onChange={v=>setForm(f=>({...f,equipeId:v,funcionarioId:""}))} options={equipes.map(e=>({value:e.id,label:e.name}))}/>
          <SelectField label="Funcionário *" value={form.funcionarioId} onChange={v=>setForm(f=>({...f,funcionarioId:v}))} options={funcs.map(f=>({value:f.id,label:f.nome}))}/>
          <div style={S.formRow}><label style={S.label}>Data *</label><input type="date" style={S.input} value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/></div>
          <div style={{display:"flex",gap:12}}>
            <div style={{flex:1,...S.formRow}}><label style={S.label}>Hora Início *</label><input type="time" style={S.input} value={form.horaInicio} onChange={e=>setForm(f=>({...f,horaInicio:e.target.value,totalHoras:calcTotal(e.target.value,f.horaFim)}))}/></div>
            <div style={{flex:1,...S.formRow}}><label style={S.label}>Hora Fim *</label><input type="time" style={S.input} value={form.horaFim} onChange={e=>setForm(f=>({...f,horaFim:e.target.value,totalHoras:calcTotal(f.horaInicio,e.target.value)}))}/></div>
            <div style={{flex:1,...S.formRow}}><label style={S.label}>Total Horas</label><input style={{...S.input,background:C.bg,color:C.primary,fontWeight:700}} value={form.totalHoras||""} readOnly/></div>
          </div>
          <SelectField label="Compensado" value={form.compensado} onChange={v=>setForm(f=>({...f,compensado:v}))} options={[{value:"Não",label:"Não"},{value:"Sim",label:"Sim"}]}/>
          <div style={S.formRow}><label style={S.label}>Observação</label><textarea style={{...S.input,minHeight:80,resize:"vertical"}} value={form.observacao||""} onChange={e=>setForm(f=>({...f,observacao:e.target.value}))}/></div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setForm(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Excluir esta folga?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── RELATÓRIO CONTROLE DE FOLGAS (s36) ────────────────────────
function RelatorioFolgasScreen({user}){
  const p=user.permissions?.s36;
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(false);
  const[empresas,setEmpresas]=useState([]);
  const[equipes,setEquipes]=useState([]);
  const[filters,setFilters]=useState({empresa:"",equipe:"",funcionario:"",data:"",compensado:""});

  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/companies"),api.get("/teams")]).then(([e,eq])=>{setEmpresas(e);setEquipes(eq);});
  },[]);

  const load=async()=>{
    setLoading(true);
    const q=new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([,v])=>v))).toString();
    api.get(`/folgas/relatorio${q?"?"+q:""}`).then(setItems).catch(()=>{}).finally(()=>setLoading(false));
  };

  const grouped=items.reduce((acc,it)=>{
    const key=`${it.funcionarioNome}||${it.equipeNome}`;
    if(!acc[key])acc[key]={funcionarioNome:it.funcionarioNome,equipeNome:it.equipeNome,rows:[]};
    acc[key].rows.push(it);
    return acc;
  },{});

  const exportPDF=()=>{
    const doc=new jsPDF();
    doc.setFontSize(14);
    doc.text("Relatório - Controle de Folgas",14,15);
    let y=25;
    for(const g of Object.values(grouped)){
      doc.setFontSize(11);doc.setFont(undefined,"bold");
      doc.text(`${g.funcionarioNome} — ${g.equipeNome}`,14,y);y+=6;
      autoTable(doc,{
        startY:y,
        head:[["Data","Início","Fim","Total","Compensado","Observação"]],
        body:g.rows.map(r=>[r.data,r.horaInicio,r.horaFim,r.totalHoras||"",r.compensado,r.observacao||""]),
        styles:{fontSize:9},margin:{left:14,right:14},
      });
      y=doc.lastAutoTable.finalY+8;
    }
    doc.save("relatorio-folgas.pdf");
  };

  const exportFolgasExcel=()=>{
    const wsData=items.map(r=>({"Equipe":r.equipeNome||"","Funcionário":r.funcionarioNome||"","Data":r.data||"","Início":r.horaInicio||"","Fim":r.horaFim||"","Total":r.totalHoras||"","Compensado":r.compensado||"","Observação":r.observacao||""}));
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(wsData),"Folgas");XLSX.writeFile(wb,"relatorio-folgas.xlsx");
  };

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;

  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>📋 Relatório — Controle de Folgas</span><div style={{display:"flex",gap:8}}><button style={S.btnSave} onClick={exportPDF} disabled={items.length===0}>⬇ PDF</button><button style={S.btnSave} onClick={exportFolgasExcel} disabled={items.length===0}>⬇ Excel</button></div></div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16,padding:12,background:C.bg,borderRadius:8}}>
        <select style={{...S.input,width:160}} value={filters.empresa} onChange={e=>setFilters(f=>({...f,empresa:e.target.value}))}>
          <option value="">Empresa</option>
          {empresas.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select style={{...S.input,width:160}} value={filters.equipe} onChange={e=>setFilters(f=>({...f,equipe:e.target.value}))}>
          <option value="">Equipe</option>
          {equipes.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input type="date" style={{...S.input,width:150}} value={filters.data} onChange={e=>setFilters(f=>({...f,data:e.target.value}))}/>
        <select style={{...S.input,width:130}} value={filters.compensado} onChange={e=>setFilters(f=>({...f,compensado:e.target.value}))}>
          <option value="">Compensado</option>
          <option>Sim</option><option>Não</option>
        </select>
        <button style={S.btnSave} onClick={load}><Icon name="search" size={13}/> Pesquisar</button>
      </div>
      {loading?<Spinner/>:Object.keys(grouped).length===0
        ?<div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Use os filtros e clique em Gerar.</div>
        :<div>{Object.values(grouped).map(g=>(
          <div key={g.funcionarioNome+g.equipeNome} style={{marginBottom:24}}>
            <div style={{fontWeight:700,fontSize:14,color:C.primary,marginBottom:8,padding:"6px 0",borderBottom:`2px solid ${C.primary}`}}>
              👤 {g.funcionarioNome} — {g.equipeNome}
            </div>
            <table style={S.table}><thead><tr>
              {["Data","Início","Fim","Total","Compensado","Observação"].map(h=><th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>{g.rows.map((r,i)=>(
              <tr key={i} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={S.td}>{fmtDate(r.data)}</td>
                <td style={S.td}>{r.horaInicio}</td>
                <td style={S.td}>{r.horaFim}</td>
                <td style={{...S.td,fontWeight:700}}>{r.totalHoras||"—"}</td>
                <td style={S.td}><span style={{...S.badge,background:r.compensado==="Sim"?"#E8F5E9":"#FFEBEE",color:r.compensado==="Sim"?"#2E7D32":"#C62828"}}>{r.compensado}</span></td>
                <td style={S.td}>{r.observacao||"—"}</td>
              </tr>
            ))}</tbody></table>
          </div>
        ))}</div>
      }
    </div>
  );
}

// ── POLÍTICAS DE TI (s37) ─────────────────────────────────────
function PoliticasScreen({user}){
  const p=user.permissions?.s37;
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[empresas,setEmpresas]=useState([]);
  const[filters,setFilters]=useState({empresa:"",nome:"",data:"",status:""});
  const[form,setForm]=useState(null);
  const[delId,setDelId]=useState(null);
  const[emailModal,setEmailModal]=useState(null);
  const[emailForm,setEmailForm]=useState({emails:"",assunto:"",descricao:"",anexoIds:[]});
  const[saving,setSaving]=useState(false);
  const[emailSending,setEmailSending]=useState(false);
  const fileInputRef=useRef(null);

  const load=async(f=filters)=>{
    setLoading(true);
    const q=new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([,v])=>v))).toString();
    api.get(`/politicas${q?"?"+q:""}`).then(setItems).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(()=>{
    if(!p?.view)return;
    api.get("/companies").then(setEmpresas).catch(()=>{});
    load();
  },[]);

  const openForm=(item=null)=>{
    if(item){
      // data vem do banco como YYYY-MM-DD (formato do input date)
      setForm({...item,_anexos:item.anexos||[]});
    } else {
      setForm({empresaId:"",nomePolitica:"",data:"",status:"Ativo",observacao:"",_anexos:[]});
    }
  };

  const save=async()=>{
    if(!form.empresaId||!form.nomePolitica?.trim()||!form.data)return alert("Empresa, Nome e Data são obrigatórios.");
    if(saving)return;
    setSaving(true);
    try{
      let id=form.id;
      if(id)await api.put(`/politicas/${id}`,form);
      else{const r=await api.post("/politicas",form);id=r.id;}
      // Upload de novos arquivos
      if(form._newFiles?.length){
        const fd=new FormData();
        for(const f of form._newFiles)fd.append("files",f);
        const _sess=JSON.parse(localStorage.getItem("sl_session")||"{}");
        const r=await fetch(`${API_URL}/politicas/${id}/anexos`,{method:"POST",headers:{Authorization:`Bearer ${api.token||_sess.token||""}`},body:fd});
        if(!r.ok)throw new Error("Erro ao salvar anexos.");
      }
      setForm(null);load();
    }catch(e){alert(e.message);}
    finally{setSaving(false);}
  };

  const delAnexo=async(politicaId,anexoId)=>{
    try{
      await api.delete(`/politicas/anexos/${anexoId}`);
      setForm(f=>({...f,_anexos:f._anexos.filter(a=>a.id!==anexoId)}));
      load();
    }catch(e){alert(e.message);}
  };

  const downloadAnexo=async(a)=>{
    try{
      const _sess=JSON.parse(localStorage.getItem("sl_session")||"{}");
      const resp=await fetch(`${API_URL}/politicas/download/${a.filename}`,{headers:{Authorization:`Bearer ${api.token||_sess.token||""}`}});
      if(!resp.ok)throw new Error("Erro ao baixar arquivo.");
      const blob=await resp.blob();
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");link.href=url;link.download=a.nomeOriginal;link.click();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
    }catch(e){alert(e.message);}
  };

  const del=async()=>{
    try{await api.delete(`/politicas/${delId}`);setDelId(null);load();}catch(e){alert(e.message);}
  };

  const openEmail=(item)=>{
    setEmailModal(item);
    setEmailForm({
      emails:"",
      assunto:`Política de TI - ${item.nomePolitica}`,
      descricao:`Bom dia!\n\nSegue Política de TI para leitura e ciência.\n\nAtenciosamente,\nEquipe de TI`,
      anexoIds:(item.anexos||[]).map(a=>a.id),
    });
  };

  const sendEmail=async()=>{
    if(!emailForm.emails.trim())return alert("Informe pelo menos um e-mail.");
    setEmailSending(true);
    try{
      const emails=emailForm.emails.split(/[,;\n]/).map(e=>e.trim()).filter(Boolean);
      await api.post(`/politicas/${emailModal.id}/enviar`,{...emailForm,emails});
      alert("E-mail enviado com sucesso!");
      setEmailModal(null);
    }catch(e){alert(e.message);}finally{setEmailSending(false);}
  };

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>📜 Políticas de TI</span>
        {p?.insert&&<button style={S.btnAdd} onClick={()=>openForm()}>+ Nova Política</button>}
      </div>
      {/* Filtros */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16,padding:12,background:C.bg,borderRadius:8}}>
        <select style={{...S.input,width:160}} value={filters.empresa} onChange={e=>setFilters(f=>({...f,empresa:e.target.value}))}>
          <option value="">Empresa</option>
          {empresas.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input style={{...S.input,width:200}} placeholder="Nome da Política" value={filters.nome} onChange={e=>setFilters(f=>({...f,nome:e.target.value}))}/>
        <input type="date" style={{...S.input,width:150}} value={filters.data} onChange={e=>setFilters(f=>({...f,data:e.target.value}))}/>
        <select style={{...S.input,width:130}} value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}>
          <option value="">Status</option>
          <option>Ativo</option><option>Inativo</option>
        </select>
        <button style={S.btnSave} onClick={()=>load()}><Icon name="search" size={13}/> Pesquisar</button>
        <button style={S.btnCancel} onClick={()=>{const f={empresa:"",nome:"",data:"",status:""};setFilters(f);load(f);}}><Icon name="x" size={13}/> Limpar</button>
      </div>
      {loading?<Spinner/>:items.length===0
        ?<div style={S.emptyState}><span style={S.emptyIcon}>📜</span>Nenhuma política registrada.</div>
        :<div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Empresa","Nome","Data","Status","Anexos","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{items.map(it=>(
            <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={S.td}>{it.empresaNome}</td>
              <td style={{...S.td,fontWeight:600}}>{it.nomePolitica}</td>
              <td style={S.td}>{fmtDate(it.data)}</td>
              <td style={S.td}><span style={{...S.badge,background:it.status==="Ativo"?"#E8F5E9":"#FFEBEE",color:it.status==="Ativo"?"#2E7D32":"#C62828"}}>{it.status}</span></td>
              <td style={S.td}>{(it.anexos||[]).length>0?<span style={S.badge}>{it.anexos.length}</span>:"—"}</td>
              <td style={S.td}>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  <button style={{...S.actionBtn,background:"#E3F2FD",color:"#1565C0",border:"1px solid #90CAF9"}} onClick={()=>openEmail(it)}>✉️ Enviar</button>
                  {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openForm(it)}>✏️</button>}
                  {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/></button>}
                </div>
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      }

      {/* Modal form */}
      {form&&(
        <Modal title={form.id?"Editar Política":"Nova Política"} onClose={()=>setForm(null)} wide>
          <SelectField label="Empresa *" value={form.empresaId} onChange={v=>setForm(f=>({...f,empresaId:v}))} options={empresas.map(e=>({value:e.id,label:e.name}))}/>
          <Input label="Nome da Política *" value={form.nomePolitica||""} onChange={v=>setForm(f=>({...f,nomePolitica:v}))}/>
          <div style={S.formRow}><label style={S.label}>Data *</label><input type="date" style={S.input} value={form.data} onChange={e=>setForm(f=>({...f,data:e.target.value}))}/></div>
          <SelectField label="Status" value={form.status} onChange={v=>setForm(f=>({...f,status:v}))} options={[{value:"Ativo",label:"Ativo"},{value:"Inativo",label:"Inativo"}]}/>
          <div style={S.formRow}><label style={S.label}>Observação</label><textarea style={{...S.input,minHeight:80,resize:"vertical"}} value={form.observacao||""} onChange={e=>setForm(f=>({...f,observacao:e.target.value}))}/></div>
          {/* Anexos existentes */}
          {(form._anexos||[]).length>0&&(
            <div style={{marginBottom:12}}>
              <label style={S.label}>Anexos</label>
              {form._anexos.map(a=>(
                <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
                  <span style={{fontSize:12}}>📎 {a.nomeOriginal}</span>
                  <button style={{...S.actionBtn,...S.btnEdit,padding:"2px 8px"}} onClick={()=>downloadAnexo(a)}><Icon name="download" size={13}/> Baixar</button>
                  <button style={{...S.actionBtn,...S.btnDel,padding:"2px 6px"}} onClick={()=>delAnexo(form.id,a.id)}><Icon name="trash" size={13}/></button>
                </div>
              ))}
            </div>
          )}
          {/* Novos anexos */}
          <div style={{marginBottom:12}}>
            <label style={S.label}>Adicionar Arquivos</label>
            <input ref={fileInputRef} type="file" multiple style={{display:"none"}} onChange={e=>setForm(f=>({...f,_newFiles:[...(f._newFiles||[]),...Array.from(e.target.files)]}))}/>
            <button style={{...S.btnCancel,marginRight:8}} onClick={()=>fileInputRef.current?.click()}><Icon name="paperclip" size={13}/> Selecionar Arquivos</button>
            {(form._newFiles||[]).map((f,i)=>(
              <div key={i} style={{fontSize:12,color:C.textLight}}>📎 {f.name}</div>
            ))}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setForm(null)} disabled={saving}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}

      {/* Modal enviar e-mail */}
      {emailModal&&(
        <Modal title={`✉️ Enviar — ${emailModal.nomePolitica}`} onClose={()=>setEmailModal(null)} wide>
          <div style={S.formRow}>
            <label style={S.label}>E-mails (separados por vírgula ou Enter) *</label>
            <textarea style={{...S.input,minHeight:60,resize:"vertical"}} value={emailForm.emails} onChange={e=>setEmailForm(f=>({...f,emails:e.target.value}))} placeholder="email1@empresa.com, email2@empresa.com"/>
          </div>
          <Input label="Assunto *" value={emailForm.assunto} onChange={v=>setEmailForm(f=>({...f,assunto:v}))}/>
          <div style={S.formRow}>
            <label style={S.label}>Descrição</label>
            <textarea style={{...S.input,minHeight:100,resize:"vertical"}} value={emailForm.descricao} onChange={e=>setEmailForm(f=>({...f,descricao:e.target.value}))}/>
          </div>
          {(emailModal.anexos||[]).length>0&&(
            <div style={{marginBottom:12}}>
              <label style={S.label}>Selecionar Anexos para Envio</label>
              {emailModal.anexos.map(a=>(
                <label key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",cursor:"pointer",fontSize:13}}>
                  <input type="checkbox" checked={emailForm.anexoIds.includes(a.id)}
                    onChange={e=>setEmailForm(f=>({...f,anexoIds:e.target.checked?[...f.anexoIds,a.id]:f.anexoIds.filter(x=>x!==a.id)}))}/>
                  📎 {a.nomeOriginal}
                </label>
              ))}
            </div>
          )}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setEmailModal(null)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:emailSending?0.7:1}} onClick={sendEmail} disabled={emailSending}>
              {emailSending?"Enviando...":"✉️ Enviar"}
            </button>
          </div>
        </Modal>
      )}

      {delId&&<ConfirmModal msg="Excluir esta política e todos os anexos?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── CONFIGURAÇÃO DE INVENTÁRIO (s33) ──────────────────────────
function ConfiguracaoInventarioScreen({user}){
  const p=user.permissions?.s33;
  const[tab,setTab]=useState("redes");
  // Redes
  const[redes,setRedes]=useState([]);
  const[redesLoading,setRedesLoading]=useState(true);
  const[redesForm,setRedesForm]=useState(null);
  // Domínio
  const[dom,setDom]=useState({domain:"",username:"",password:""});
  const[domSaving,setDomSaving]=useState(false);
  // Tenants
  const[tenants,setTenants]=useState([]);
  const[tenantsLoading,setTenantsLoading]=useState(true);
  const[tenantForm,setTenantForm]=useState(null);
  const[delTenant,setDelTenant]=useState(null);
  const[delRede,setDelRede]=useState(null);

  useEffect(()=>{
    if(!p?.view)return;
    api.get("/inventory-config/networks").then(setRedes).catch(()=>{}).finally(()=>setRedesLoading(false));
    api.get("/inventory-config/domain").then(d=>{if(d)setDom({domain:d.domain||"",username:d.username||"",password:""});}).catch(()=>{});
    api.get("/inventory-config/tenants").then(setTenants).catch(()=>{}).finally(()=>setTenantsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const saveRede=async()=>{
    if(!redesForm.name?.trim()||!redesForm.ipRange?.trim())return alert("Nome e Faixa de IP são obrigatórios.");
    try{
      if(redesForm.id){const u=await api.put(`/inventory-config/networks/${redesForm.id}`,redesForm);setRedes(rs=>rs.map(r=>r.id===u.id?u:r));}
      else{const c=await api.post("/inventory-config/networks",redesForm);setRedes(rs=>[...rs,c]);}
      setRedesForm(null);
    }catch(e){alert(e.message);}
  };
  const delRede2=async()=>{
    try{await api.delete(`/inventory-config/networks/${delRede}`);setRedes(rs=>rs.filter(r=>r.id!==delRede));setDelRede(null);}
    catch(e){alert(e.message);}
  };

  const saveDom=async()=>{
    setDomSaving(true);
    try{await api.put("/inventory-config/domain",dom);alert("Configuração de domínio salva.");}
    catch(e){alert(e.message);}finally{setDomSaving(false);}
  };

  const saveTenant=async()=>{
    if(!tenantForm.name?.trim()||!tenantForm.tenantId?.trim()||!tenantForm.clientId?.trim())
      return alert("Nome, Tenant ID e Client ID são obrigatórios.");
    if(!tenantForm.id&&!tenantForm.clientSecret?.trim())return alert("Client Secret é obrigatório.");
    try{
      if(tenantForm.id){const u=await api.put(`/inventory-config/tenants/${tenantForm.id}`,tenantForm);setTenants(ts=>ts.map(t=>t.id===u.id?u:t));}
      else{const c=await api.post("/inventory-config/tenants",tenantForm);setTenants(ts=>[...ts,c]);}
      setTenantForm(null);
    }catch(e){alert(e.message);}
  };
  const delTenant2=async()=>{
    try{await api.delete(`/inventory-config/tenants/${delTenant}`);setTenants(ts=>ts.filter(t=>t.id!==delTenant));setDelTenant(null);}
    catch(e){alert(e.message);}
  };

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;

  const tabs=[["redes","🌐 Faixas de Rede"],["dominio","🔐 Domínio (WMI)"],["tenants","☁️ Tenants M365"]];

  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>🔧 Configuração de Inventário</span></div>
      <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:20}}>
        {tabs.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"8px 20px",border:"none",cursor:"pointer",
            background:tab===id?C.white:C.bg,fontWeight:tab===id?700:400,fontSize:13,
            borderBottom:tab===id?`2px solid ${C.primary}`:"2px solid transparent",
            color:tab===id?C.primary:C.text}}>{label}</button>
        ))}
      </div>

      {/* ── Tab Redes ── */}
      {tab==="redes"&&(
        <div>
          {p?.insert&&<div style={{marginBottom:12,display:"flex",justifyContent:"flex-end"}}>
            <button style={S.btnAdd} onClick={()=>setRedesForm({name:"",ipRange:"",active:true})}>+ Nova Faixa</button>
          </div>}
          {redesLoading?<Spinner/>:redes.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>🌐</span>Nenhuma faixa configurada.</div>:(
            <table style={S.table}><thead><tr>
              {["Filial/Nome","Faixa de IP","Ativo","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>{redes.map(r=>(
              <tr key={r.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={{...S.td,fontWeight:600}}>{r.name}</td>
                <td style={S.td}><code style={{fontSize:12}}>{r.ipRange}</code></td>
                <td style={S.td}><span style={{...S.badge,background:r.active?"#E8F5E9":"#FFEBEE",color:r.active?"#2E7D32":"#C62828"}}>{r.active?"Ativo":"Inativo"}</span></td>
                <td style={S.td}>
                  {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>setRedesForm({...r})}><Icon name="edit" size={13}/> Editar</button>}
                  {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelRede(r.id)}><Icon name="trash" size={13}/></button>}
                </td>
              </tr>
            ))}</tbody></table>
          )}
          {redesForm&&(
            <Modal title={redesForm.id?"Editar Faixa":"Nova Faixa"} onClose={()=>setRedesForm(null)}>
              <Input label="Nome/Filial *" value={redesForm.name} onChange={v=>setRedesForm(f=>({...f,name:v}))}/>
              <Input label="Faixa de IP (CIDR) *" value={redesForm.ipRange} onChange={v=>setRedesForm(f=>({...f,ipRange:v}))} placeholder="ex: 192.168.1.0/24"/>
              <SelectField label="Status" value={String(redesForm.active)} onChange={v=>setRedesForm(f=>({...f,active:v==="true"}))}
                options={[{value:"true",label:"Ativo"},{value:"false",label:"Inativo"}]}/>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
                <button style={S.btnCancel} onClick={()=>setRedesForm(null)}>Cancelar</button>
                <button style={S.btnSave} onClick={saveRede}>Salvar</button>
              </div>
            </Modal>
          )}
          {delRede&&<ConfirmModal msg="Excluir esta faixa de rede?" onConfirm={delRede2} onCancel={()=>setDelRede(null)}/>}
        </div>
      )}

      {/* ── Tab Domínio ── */}
      {tab==="dominio"&&(
        <div style={{maxWidth:480}}>
          <p style={{color:C.textLight,fontSize:13,marginBottom:16}}>
            Credencial usada para consultas WMI nas máquinas Windows durante o Inventário de Software.
            A senha é armazenada criptografada.
          </p>
          <Input label="Domínio" value={dom.domain} onChange={v=>setDom(d=>({...d,domain:v}))} placeholder="EMPRESA"/>
          <Input label="Usuário" value={dom.username} onChange={v=>setDom(d=>({...d,username:v}))} placeholder="SVC_INVENTARIO"/>
          <div style={S.formRow}>
            <label style={S.label}>Senha</label>
            <input type="password" value={dom.password} onChange={e=>setDom(d=>({...d,password:e.target.value}))}
              style={S.input} placeholder="Deixe em branco para não alterar"/>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
            <button style={{...S.btnSave,opacity:domSaving?0.7:1}} onClick={saveDom} disabled={domSaving}>
              {domSaving?"Salvando...":"Salvar Configuração"}
            </button>
          </div>
          <div style={{marginTop:20,padding:12,background:"#FFF8E1",border:"1px solid #FFE082",borderRadius:8,fontSize:12,color:"#6D4C00"}}>
            <strong>Pré-requisitos WMI:</strong><br/>
            • Porta <strong>135/TCP</strong> liberada entre o servidor e as máquinas<br/>
            • Portas dinâmicas <strong>49152–65535/TCP</strong> liberadas<br/>
            • Usuário com permissão de leitura WMI (configurável via GPO)<br/>
            • Pacote <code>wmi-client</code> instalado no container Docker da API
          </div>
        </div>
      )}

      {/* ── Tab Tenants M365 ── */}
      {tab==="tenants"&&(
        <div>
          {p?.insert&&<div style={{marginBottom:12,display:"flex",justifyContent:"flex-end"}}>
            <button style={S.btnAdd} onClick={()=>setTenantForm({name:"",tenantId:"",clientId:"",clientSecret:"",active:true})}>+ Novo Tenant</button>
          </div>}
          <div style={{marginBottom:16,padding:12,background:"#E3F2FD",border:"1px solid #90CAF9",borderRadius:8,fontSize:12,color:"#0D47A1"}}>
            <strong>Como obter as credenciais:</strong> portal.azure.com → Azure Active Directory → App registrations → selecione ou crie o app →
            Permissões necessárias: <code>User.Read.All</code>, <code>Directory.Read.All</code>, <code>Organization.Read.All</code> (tipo Application).
          </div>
          {tenantsLoading?<Spinner/>:tenants.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>☁️</span>Nenhum tenant configurado.</div>:(
            <table style={S.table}><thead><tr>
              {["Nome","Tenant ID","Client ID","Ativo","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>{tenants.map(t=>(
              <tr key={t.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={{...S.td,fontWeight:600}}>{t.name}</td>
                <td style={{...S.td,fontSize:11}}><code>{t.tenantId}</code></td>
                <td style={{...S.td,fontSize:11}}><code>{t.clientId}</code></td>
                <td style={S.td}><span style={{...S.badge,background:t.active?"#E8F5E9":"#FFEBEE",color:t.active?"#2E7D32":"#C62828"}}>{t.active?"Ativo":"Inativo"}</span></td>
                <td style={S.td}>
                  {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>setTenantForm({...t,clientSecret:""})}><Icon name="edit" size={13}/> Editar</button>}
                  {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelTenant(t.id)}><Icon name="trash" size={13}/></button>}
                </td>
              </tr>
            ))}</tbody></table>
          )}
          {tenantForm&&(
            <Modal title={tenantForm.id?"Editar Tenant":"Novo Tenant M365"} onClose={()=>setTenantForm(null)}>
              <Input label="Nome/Empresa *" value={tenantForm.name||""} onChange={v=>setTenantForm(f=>({...f,name:v}))} placeholder="ex: Matriz"/>
              <Input label="Tenant ID *" value={tenantForm.tenantId||""} onChange={v=>setTenantForm(f=>({...f,tenantId:v}))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/>
              <Input label="Client ID *" value={tenantForm.clientId||""} onChange={v=>setTenantForm(f=>({...f,clientId:v}))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/>
              <div style={S.formRow}>
                <label style={S.label}>Client Secret {tenantForm.id?"(deixe em branco para não alterar)":"*"}</label>
                <input type="password" value={tenantForm.clientSecret||""} onChange={e=>setTenantForm(f=>({...f,clientSecret:e.target.value}))} style={S.input}/>
              </div>
              <SelectField label="Status" value={String(tenantForm.active)} onChange={v=>setTenantForm(f=>({...f,active:v==="true"}))}
                options={[{value:"true",label:"Ativo"},{value:"false",label:"Inativo"}]}/>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
                <button style={S.btnCancel} onClick={()=>setTenantForm(null)}>Cancelar</button>
                <button style={S.btnSave} onClick={saveTenant}>Salvar</button>
              </div>
            </Modal>
          )}
          {delTenant&&<ConfirmModal msg="Excluir este tenant M365?" onConfirm={delTenant2} onCancel={()=>setDelTenant(null)}/>}
        </div>
      )}
    </div>
  );
}

// ── INVENTÁRIO DE REDE (s34) ───────────────────────────────────
function InventarioRedeScreen({user}){
  const p=user.permissions?.s34;
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[form,setForm]=useState(null);
  const[delId,setDelId]=useState(null);
  const[detail,setDetail]=useState(null); // {collection, tab, devices, m365}
  const[detailLoading,setDetailLoading]=useState(false);
  const pollRef=useRef(null);

  const[filterInv,setFilterInv]=useState({dataInicio:"",dataFim:""});
  // Filtros aba Dispositivos
  const[devFilters,setDevFilters]=useState({ip:"",mac:"",hostname:"",os:"",cpu:"",ram:""});
  // Filtros aba M365
  const[m365Filters,setM365Filters]=useState({tenant:"",produtos:[]});

  const TIPOS=["Inventário de Ativos","Inventário de Software"];

  const load=()=>{
    api.get("/inventory/collections").then(setItems).catch(()=>{}).finally(()=>setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(()=>{if(!p?.view)return;load();},[]);

  // Polling automático para coletas em andamento
  useEffect(()=>{
    const hasRunning=items.some(i=>i.status==="Executando");
    clearInterval(pollRef.current);
    if(hasRunning){
      pollRef.current=setInterval(()=>{
        api.get("/inventory/collections").then(updated=>{
          setItems(updated);
          if(detail){
            const col=updated.find(c=>c.id===detail.collection.id);
            if(col)setDetail(d=>({...d,collection:col}));
          }
        }).catch(()=>{});
      },5000);
    }
    return()=>clearInterval(pollRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[items]);

  const save=async()=>{
    if(!form.data||!form.tipo)return alert("Data e Tipo são obrigatórios.");
    try{
      const c=await api.post("/inventory/collections",form);
      setItems(is=>[c,...is]);setForm(null);
    }catch(e){alert(e.message);}
  };

  const del=async()=>{
    try{await api.delete(`/inventory/collections/${delId}`);setItems(is=>is.filter(i=>i.id!==delId));setDelId(null);}
    catch(e){alert(e.message);}
  };

  const resetScan=async(col)=>{
    if(!window.confirm(`Cancelar e resetar a coleta "${col.tipo}"?\nEla voltará para status Erro e poderá ser re-executada.`))return;
    try{
      await api.post(`/inventory/collections/${col.id}/reset`,{});
      setItems(is=>is.map(i=>i.id===col.id?{...i,status:"Erro",errorMsg:"Cancelado manualmente pelo usuário.",finishedAt:new Date().toLocaleString("pt-BR")}:i));
    }catch(e){alert(e.message);}
  };

  const startScan=async(col)=>{
    if(!window.confirm(`Iniciar scan de "${col.tipo}"?\nIsso pode levar vários minutos.`))return;
    try{
      await api.post(`/inventory/collections/${col.id}/scan`,{});
      setItems(is=>is.map(i=>i.id===col.id?{...i,status:"Executando"}:i));
    }catch(e){alert(e.message);}
  };

  const openDetail=async(col)=>{
    setDetail({collection:col,tab:"devices",devices:[],m365:{licenses:[],users:[]}});
    setDetailLoading(true);
    try{
      if(col.tipo==="Inventário de Software"){
        const[devs,m365]=await Promise.all([
          api.get(`/inventory/collections/${col.id}/devices`),
          api.get(`/inventory/collections/${col.id}/m365`),
        ]);
        setDetail({collection:col,tab:"devices",devices:devs,m365});
      } else {
        const devs=await api.get(`/inventory/collections/${col.id}/devices`);
        setDetail({collection:col,tab:"devices",devices:devs,m365:{licenses:[],users:[]}});
      }
    }catch(e){alert(e.message);}finally{setDetailLoading(false);}
  };

  const[swModal,setSwModal]=useState(null); // {deviceId, hostname}
  const[swItems,setSwItems]=useState([]);
  const[swLoading,setSwLoading]=useState(false);
  const openSw=async(colId,dev)=>{
    setSwModal(dev);setSwLoading(true);setSwItems([]);
    try{const r=await api.get(`/inventory/collections/${colId}/devices/${dev.id}/software`);setSwItems(r);}
    catch(e){alert(e.message);}finally{setSwLoading(false);}
  };

  const statusBadge=s=>{
    const cfg={Pendente:{bg:"#F5F5F5",color:"#757575"},Executando:{bg:"#E3F2FD",color:"#1565C0"},
      Concluído:{bg:"#E8F5E9",color:"#2E7D32"},Erro:{bg:"#FFEBEE",color:"#C62828"}};
    const c=cfg[s]||cfg.Pendente;
    return<span style={{...S.badge,background:c.bg,color:c.color,fontWeight:600}}>{s==="Executando"?"⏳ Executando...":s}</span>;
  };

  // Filtragem de dispositivos
  const filteredDevices=(detail?.devices||[]).filter(d=>{
    const f=devFilters;
    if(f.ip&&!d.ip?.toLowerCase().includes(f.ip.toLowerCase()))return false;
    if(f.mac&&!d.mac?.toLowerCase().includes(f.mac.toLowerCase()))return false;
    if(f.hostname&&!d.hostname?.toLowerCase().includes(f.hostname.toLowerCase()))return false;
    if(f.os&&!d.os?.toLowerCase().includes(f.os.toLowerCase()))return false;
    if(f.cpu&&!d.cpu?.toLowerCase().includes(f.cpu.toLowerCase()))return false;
    if(f.ram&&d.ramGb!=null&&!String(d.ramGb).includes(f.ram))return false;
    return true;
  });

  // Filtragem M365 — licenças
  const allTenants=[...new Set((detail?.m365?.licenses||[]).map(l=>l.tenantName))];
  const allProdutos=[...new Set((detail?.m365?.licenses||[]).map(l=>l.skuName))].sort();
  const filteredLicenses=(detail?.m365?.licenses||[]).filter(l=>{
    if(m365Filters.tenant&&l.tenantName!==m365Filters.tenant)return false;
    if(m365Filters.produtos.length>0&&!m365Filters.produtos.includes(l.skuName))return false;
    return true;
  });
  const filteredUsers=(detail?.m365?.users||[]).filter(u=>{
    if(m365Filters.tenant&&u.tenantName!==m365Filters.tenant)return false;
    return true;
  });

  // Toggle produto no multiselect
  const toggleProduto=prod=>{
    setM365Filters(f=>{
      const arr=f.produtos.includes(prod)?f.produtos.filter(x=>x!==prod):[...f.produtos,prod];
      return{...f,produtos:arr};
    });
  };

  // Export Excel — Dispositivos
  const exportDevicesExcel=()=>{
    const rows=filteredDevices.map(d=>({
      IP:d.ip||"",MAC:d.mac||"",Hostname:d.hostname||"",OS:d.os||"",
      Fabricante:d.manufacturer||"",CPU:d.cpu||"",
      "RAM (GB)":d.ramGb!=null?d.ramGb:"","Disco (GB)":d.diskGb!=null?d.diskGb:"",
      Softwares:d.softwareCount||0
    }));
    const ws=XLSX.utils.json_to_sheet(rows);
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Dispositivos");
    XLSX.writeFile(wb,`Inventario_Dispositivos_${detail.collection.data}.xlsx`);
  };

  // Export PDF — Dispositivos
  const exportDevicesPDF=()=>{
    const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
    doc.setFontSize(14);doc.setFont(undefined,"bold");
    doc.text(`Inventário de Dispositivos — ${detail.collection.data}`,14,14);
    doc.setFontSize(8);doc.setFont(undefined,"normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,14,20);
    autoTable(doc,{
      head:[["IP","MAC","Hostname","OS","Fabricante","CPU","RAM","Disco","Softwares"]],
      body:filteredDevices.map(d=>[d.ip||"",d.mac||"",d.hostname||"",d.os||"",d.manufacturer||"",d.cpu||"",
        d.ramGb!=null?`${d.ramGb} GB`:"",d.diskGb!=null?`${d.diskGb} GB`:"",d.softwareCount||0]),
      startY:24,styles:{fontSize:7,cellPadding:2},
      headStyles:{fillColor:[37,99,235],textColor:255,fontStyle:"bold"},
      margin:{left:10,right:10},
    });
    doc.save(`Inventario_Dispositivos_${detail.collection.data}.pdf`);
  };

  // Export Excel — M365
  const exportM365Excel=()=>{
    const wbData=[];
    filteredLicenses.forEach(l=>wbData.push({
      Tenant:l.tenantName,Produto:l.skuName,Total:l.totalUnits,Usadas:l.usedUnits,Disponíveis:l.availableUnits
    }));
    const ws1=XLSX.utils.json_to_sheet(wbData);
    const ws2=XLSX.utils.json_to_sheet(filteredUsers.map(u=>({Tenant:u.tenantName,Nome:u.displayName,"E-mail":u.email||""})));
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws1,"Licenças");
    XLSX.utils.book_append_sheet(wb,ws2,"Usuários");
    XLSX.writeFile(wb,`Inventario_M365_${detail.collection.data}.xlsx`);
  };

  // Export PDF — M365
  const exportM365PDF=()=>{
    const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
    doc.setFontSize(14);doc.setFont(undefined,"bold");
    doc.text(`Microsoft 365 — ${detail.collection.data}`,14,14);
    doc.setFontSize(8);doc.setFont(undefined,"normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,14,20);
    autoTable(doc,{
      head:[["Tenant","Produto","Total","Usadas","Disponíveis"]],
      body:filteredLicenses.map(l=>[l.tenantName,l.skuName,l.totalUnits,l.usedUnits,l.availableUnits]),
      startY:24,styles:{fontSize:8,cellPadding:2},
      headStyles:{fillColor:[37,99,235],textColor:255,fontStyle:"bold"},
      margin:{left:10,right:10},
    });
    const finalY=doc.lastAutoTable.finalY+10;
    doc.setFontSize(12);doc.setFont(undefined,"bold");doc.text("Usuários Licenciados",14,finalY);
    autoTable(doc,{
      head:[["Tenant","Nome","E-mail"]],
      body:filteredUsers.map(u=>[u.tenantName,u.displayName,u.email||""]),
      startY:finalY+4,styles:{fontSize:8,cellPadding:2},
      headStyles:{fillColor:[37,99,235],textColor:255,fontStyle:"bold"},
      margin:{left:10,right:10},
    });
    doc.save(`Inventario_M365_${detail.collection.data}.pdf`);
  };

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>🔍 Inventário de Rede</span>
        {p?.insert&&<button style={S.btnAdd} onClick={()=>setForm({data:"",tipo:TIPOS[0]})}>+ Nova Coleta</button>}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
        <label style={{fontSize:13,color:C.text}}>Data início:</label>
        <input type="date" value={filterInv.dataInicio} onChange={e=>setFilterInv(f=>({...f,dataInicio:e.target.value}))} style={{...S.input,flex:"1 1 150px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
        <label style={{fontSize:13,color:C.text}}>Data fim:</label>
        <input type="date" value={filterInv.dataFim} onChange={e=>setFilterInv(f=>({...f,dataFim:e.target.value}))} style={{...S.input,flex:"1 1 150px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
      </div>
      {(()=>{const fltInv=items.filter(it=>{const p2=((it.data||"").split("/"));const iso=p2.length===3?`${p2[2]}-${p2[1]}-${p2[0]}`:"";return(!filterInv.dataInicio||iso>=filterInv.dataInicio)&&(!filterInv.dataFim||iso<=filterInv.dataFim);});return fltInv.length===0
        ?<div style={S.emptyState}><span style={S.emptyIcon}>🔍</span>Nenhuma coleta registrada.</div>
        :<div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Data","Tipo","Status","Dispositivos","Licenças M365","Início","Fim","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{fltInv.map(it=>(
            <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={{...S.td,fontWeight:600}}>{it.data}</td>
              <td style={S.td}>{it.tipo}</td>
              <td style={S.td}>{statusBadge(it.status)}{it.errorMsg&&<span title={it.errorMsg} style={{marginLeft:4,cursor:"help",color:"#C62828"}}>⚠️</span>}</td>
              <td style={{...S.td,textAlign:"center"}}>{it.totalDevices>0?<span style={S.badge}>{it.totalDevices}</span>:"—"}</td>
              <td style={{...S.td,textAlign:"center"}}>{it.totalLicenses>0?<span style={S.badge}>{it.totalLicenses}</span>:"—"}</td>
              <td style={{...S.td,fontSize:11}}>{it.startedAt||"—"}</td>
              <td style={{...S.td,fontSize:11}}>{it.finishedAt||"—"}</td>
              <td style={S.td}>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {it.status==="Executando"&&
                    <button style={{...S.actionBtn,background:"#FFF3E0",color:"#E65100",border:"1px solid #FFCC80"}}
                      onClick={()=>resetScan(it)}><Icon name="x" size={13}/> Cancelar</button>}
                  {it.status!=="Executando"&&
                    <button style={{...S.actionBtn,background:"#E8F5E9",color:"#2E7D32",border:"1px solid #A5D6A7"}}
                      onClick={()=>startScan(it)}>📡 Escanear</button>}
                  {it.status==="Concluído"&&
                    <button style={{...S.actionBtn,background:"#E3F2FD",color:"#1565C0",border:"1px solid #90CAF9"}}
                      onClick={()=>openDetail(it)}>👁 Ver Dados</button>}
                  {p?.delete&&it.status!=="Executando"&&
                    <button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/></button>}
                </div>
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      ;})()}

      {/* Modal nova coleta */}
      {form&&(
        <Modal title="Nova Coleta" onClose={()=>setForm(null)}>
          <MaskedInput label="Data *" mask={MASK_DATE} value={form.data} onChange={v=>setForm(f=>({...f,data:v}))} placeholder="DD/MM/AAAA"/>
          <SelectField label="Tipo de Inventário *" value={form.tipo} onChange={v=>setForm(f=>({...f,tipo:v}))}
            options={TIPOS.map(t=>({value:t,label:t}))}/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setForm(null)}>Cancelar</button>
            <button style={S.btnSave} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}

      {delId&&<ConfirmModal msg="Excluir esta coleta e todos os dados vinculados?" onConfirm={del} onCancel={()=>setDelId(null)}/>}

      {/* Modal de detalhes */}
      {detail&&(
        <Modal title={`${detail.collection.tipo} — ${detail.collection.data}`} onClose={()=>{setDetail(null);setDevFilters({ip:"",mac:"",hostname:"",os:"",cpu:"",ram:""});setM365Filters({tenant:"",produtos:[]});}} extraWide>
          <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.border}`,marginBottom:16}}>
            {[["devices","💻 Dispositivos"],
              ...(detail.collection.tipo==="Inventário de Software"?[["m365","☁️ Microsoft 365"]]:[])]
              .map(([id,label])=>(
              <button key={id} onClick={()=>setDetail(d=>({...d,tab:id}))} style={{
                padding:"7px 18px",border:"none",cursor:"pointer",fontSize:13,
                background:detail.tab===id?C.white:C.bg,
                borderBottom:detail.tab===id?`2px solid ${C.primary}`:"2px solid transparent",
                fontWeight:detail.tab===id?700:400,color:detail.tab===id?C.primary:C.text
              }}>{label}</button>
            ))}
          </div>

          {detailLoading?<Spinner/>:detail.tab==="devices"?(
            <div>
              {/* Filtros Dispositivos */}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,padding:10,background:C.bg,borderRadius:8}}>
                {[["ip","IP"],["mac","MAC"],["hostname","Hostname"],["os","OS"],["cpu","CPU"],["ram","RAM (GB)"]].map(([k,label])=>(
                  <input key={k} style={{...S.input,width:130}} placeholder={label}
                    value={devFilters[k]} onChange={e=>setDevFilters(f=>({...f,[k]:e.target.value}))}/>
                ))}
                <button style={S.btnCancel} onClick={()=>setDevFilters({ip:"",mac:"",hostname:"",os:"",cpu:"",ram:""})}><Icon name="x" size={13}/> Limpar</button>
                <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                  <button style={{...S.actionBtn,background:"#E8F5E9",color:"#2E7D32",border:"1px solid #A5D6A7"}} onClick={exportDevicesExcel}>📥 Excel</button>
                  <button style={{...S.actionBtn,background:"#FFEBEE",color:"#C62828",border:"1px solid #EF9A9A"}} onClick={exportDevicesPDF}><Icon name="file" size={13}/> PDF</button>
                </div>
              </div>
              {filteredDevices.length===0
                ?<div style={S.emptyState}><span style={S.emptyIcon}>💻</span>Nenhum dispositivo encontrado.</div>
                :<div style={{overflowX:"auto"}}>
                  <div style={{fontSize:12,color:C.textLight,marginBottom:6}}>{filteredDevices.length} dispositivo(s)</div>
                  <table style={S.table}><thead><tr>
                    {["IP","MAC","Hostname","OS","Fabricante","CPU","RAM","Disco","Softwares",""].map(h=><th key={h} style={S.th}>{h}</th>)}
                  </tr></thead>
                  <tbody>{filteredDevices.map(d=>(
                    <tr key={d.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                      <td style={{...S.td,fontWeight:600,fontSize:12}}>{d.ip}</td>
                      <td style={{...S.td,fontSize:11}}>{d.mac||"—"}</td>
                      <td style={{...S.td,fontSize:12}}>{d.hostname||"—"}</td>
                      <td style={{...S.td,fontSize:11}}>{d.os||"—"}</td>
                      <td style={{...S.td,fontSize:11}}>{d.manufacturer||"—"}</td>
                      <td style={{...S.td,fontSize:11}}>{d.cpu||"—"}</td>
                      <td style={{...S.td,fontSize:11,textAlign:"center"}}>{d.ramGb!=null?`${d.ramGb} GB`:"—"}</td>
                      <td style={{...S.td,fontSize:11,textAlign:"center"}}>{d.diskGb!=null?`${d.diskGb} GB`:"—"}</td>
                      <td style={{...S.td,textAlign:"center"}}>
                        {d.softwareCount>0
                          ?<span style={{...S.badge,cursor:"pointer"}} onClick={()=>openSw(detail.collection.id,d)}>{d.softwareCount}</span>
                          :"—"}
                      </td>
                      <td style={S.td}>
                        {d.softwareCount>0&&
                          <button style={{...S.actionBtn,background:"#E3F2FD",color:"#1565C0",border:"1px solid #90CAF9",fontSize:11}}
                            onClick={()=>openSw(detail.collection.id,d)}>📋 Softwares</button>}
                      </td>
                    </tr>
                  ))}</tbody></table>
                </div>
              }
            </div>
          ):detail.tab==="m365"&&(
            <div>
              {/* Filtros M365 */}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-start",marginBottom:12,padding:10,background:C.bg,borderRadius:8}}>
                <select style={{...S.input,width:180}} value={m365Filters.tenant} onChange={e=>setM365Filters(f=>({...f,tenant:e.target.value}))}>
                  <option value="">Todos os Tenants</option>
                  {allTenants.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                {/* Multiselect Produto */}
                <div style={{position:"relative"}}>
                  <div style={{...S.input,width:220,cursor:"pointer",userSelect:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                    onClick={e=>{e.currentTarget.nextSibling.style.display=e.currentTarget.nextSibling.style.display==="block"?"none":"block";}}>
                    <span style={{fontSize:12,color:m365Filters.produtos.length?C.text:C.textLight}}>
                      {m365Filters.produtos.length===0?"Todos os Produtos":m365Filters.produtos.length===1?m365Filters.produtos[0]:`${m365Filters.produtos.length} produtos`}
                    </span>
                    <span style={{fontSize:10}}>▼</span>
                  </div>
                  <div style={{display:"none",position:"absolute",top:"100%",left:0,zIndex:999,background:C.white,border:`1px solid ${C.border}`,borderRadius:6,boxShadow:"0 4px 12px rgba(0,0,0,0.12)",minWidth:220,maxHeight:200,overflowY:"auto",padding:6}}>
                    <label style={{display:"flex",alignItems:"center",gap:6,padding:"4px 6px",cursor:"pointer",fontSize:12,borderBottom:`1px solid ${C.border}`,marginBottom:4}}>
                      <input type="checkbox" checked={m365Filters.produtos.length===0} onChange={()=>setM365Filters(f=>({...f,produtos:[]}))}/>
                      <span style={{fontWeight:600}}>Todos</span>
                    </label>
                    {allProdutos.map(prod=>(
                      <label key={prod} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 6px",cursor:"pointer",fontSize:12}}>
                        <input type="checkbox" checked={m365Filters.produtos.includes(prod)} onChange={()=>toggleProduto(prod)}/>
                        {prod}
                      </label>
                    ))}
                  </div>
                </div>
                <button style={S.btnCancel} onClick={()=>setM365Filters({tenant:"",produtos:[]})}><Icon name="x" size={13}/> Limpar</button>
                <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                  <button style={{...S.actionBtn,background:"#E8F5E9",color:"#2E7D32",border:"1px solid #A5D6A7"}} onClick={exportM365Excel}>📥 Excel</button>
                  <button style={{...S.actionBtn,background:"#FFEBEE",color:"#C62828",border:"1px solid #EF9A9A"}} onClick={exportM365PDF}><Icon name="file" size={13}/> PDF</button>
                </div>
              </div>

              <h4 style={{marginBottom:8,color:C.primary}}>Licenças por Tenant</h4>
              {filteredLicenses.length===0
                ?<p style={{color:C.textLight,fontSize:13}}>Nenhuma licença coletada.</p>
                :<><div style={{fontSize:12,color:C.textLight,marginBottom:6}}>{filteredLicenses.length} licença(s)</div>
                <table style={S.table}><thead><tr>
                  {["Tenant","Produto","Total","Usadas","Disponíveis"].map(h=><th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>{filteredLicenses.map(l=>(
                  <tr key={l.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                    <td style={S.td}>{l.tenantName}</td>
                    <td style={{...S.td,fontWeight:600}}>{l.skuName}</td>
                    <td style={{...S.td,textAlign:"center"}}>{l.totalUnits}</td>
                    <td style={{...S.td,textAlign:"center"}}>{l.usedUnits}</td>
                    <td style={{...S.td,textAlign:"center"}}>
                      <span style={{...S.badge,background:l.availableUnits>0?"#E8F5E9":"#FFEBEE",color:l.availableUnits>0?"#2E7D32":"#C62828"}}>
                        {l.availableUnits}
                      </span>
                    </td>
                  </tr>
                ))}</tbody></table></>
              }
              <h4 style={{margin:"20px 0 8px",color:C.primary}}>Usuários Licenciados</h4>
              {filteredUsers.length===0
                ?<p style={{color:C.textLight,fontSize:13}}>Nenhum usuário coletado.</p>
                :<><div style={{fontSize:12,color:C.textLight,marginBottom:6}}>{filteredUsers.length} usuário(s)</div>
                <table style={S.table}><thead><tr>
                  {["Tenant","Nome","E-mail"].map(h=><th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>{filteredUsers.map(u=>(
                  <tr key={u.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                    <td style={S.td}>{u.tenantName}</td>
                    <td style={{...S.td,fontWeight:600}}>{u.displayName}</td>
                    <td style={S.td}>{u.email||"—"}</td>
                  </tr>
                ))}</tbody></table></>
              }
            </div>
          )}
        </Modal>
      )}

      {/* Modal softwares do dispositivo */}
      {swModal&&(
        <Modal title={`Softwares — ${swModal.hostname||swModal.ip}`} onClose={()=>setSwModal(null)} extraWide>
          {swLoading?<Spinner/>:swItems.length===0
            ?<div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Nenhum software encontrado.</div>
            :<div style={{overflowX:"auto"}}>
              <table style={S.table}><thead><tr>
                {["Software","Versão","Fabricante","Data Instalação"].map(h=><th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{swItems.map(s=>(
                <tr key={s.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                  <td style={{...S.td,fontWeight:600}}>{s.name}</td>
                  <td style={S.td}>{s.version||"—"}</td>
                  <td style={S.td}>{s.manufacturer||"—"}</td>
                  <td style={S.td}>{s.installDate||"—"}</td>
                </tr>
              ))}</tbody></table>
            </div>
          }
        </Modal>
      )}
    </div>
  );
}

// ── RELATÓRIO COMPOSIÇÃO DE EQUIPE ────────────────────────────
function RelatorioComposicaoScreen({user}){
  const p=user.permissions?.s32;
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[expanded,setExpanded]=useState(new Set());

  useEffect(()=>{
    if(!p?.view)return;
    api.get("/teams/relatorio-composicao")
      .then(setItems)
      .catch(e=>alert(e.message))
      .finally(()=>setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const toggle=id=>setExpanded(ex=>{const s=new Set(ex);s.has(id)?s.delete(id):s.add(id);return s;});
  const expandAll=()=>setExpanded(new Set(items.map(i=>i.id)));
  const collapseAll=()=>setExpanded(new Set());

  const buildTree=list=>{
    const map={};
    list.forEach(t=>{map[t.id]={...t,children:[]};});
    const roots=[];
    list.forEach(t=>{
      if(t.parentId&&map[t.parentId])map[t.parentId].children.push(map[t.id]);
      else roots.push(map[t.id]);
    });
    const sort=nodes=>{nodes.sort((a,b)=>a.name.localeCompare(b.name,"pt"));nodes.forEach(n=>sort(n.children));};
    sort(roots);
    return roots;
  };

  function totalMembros(node){
    return node.membros.length+node.children.reduce((s,c)=>s+totalMembros(c),0);
  }

  const tree=buildTree(items);

  const exportPDF=()=>{
    const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    doc.setFontSize(16);doc.setFont(undefined,"bold");
    doc.text("Composição de Equipe",14,16);
    doc.setFontSize(9);doc.setFont(undefined,"normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,14,23);
    const bodyRows=[];
    const flattenBody=(nodes,depth)=>{
      nodes.forEach(node=>{
        const tot=totalMembros(node);
        const pfx=" ".repeat(depth*3);
        const fill=depth===0?[224,235,255]:depth===1?[240,245,255]:[248,250,255];
        bodyRows.push([{content:`${pfx}${node.name}  (${tot} func.)`,colSpan:3,styles:{fontStyle:"bold",fillColor:fill,textColor:[30,60,120]}}]);
        node.membros.forEach(m=>{
          const mpfx=" ".repeat((depth+1)*3);
          bodyRows.push([{content:`${mpfx}${m.funcionarioNome}`,styles:{textColor:[50,50,50]}},m.cargo||"—",m.centroCusto||"—"]);
        });
        flattenBody(node.children,depth+1);
      });
    };
    flattenBody(tree,0);
    autoTable(doc,{
      head:[["Equipe / Funcionário","Cargo","Centro de Custo"]],
      body:bodyRows,
      startY:28,
      styles:{fontSize:8,cellPadding:2},
      headStyles:{fillColor:[37,99,235],textColor:255,fontStyle:"bold"},
      columnStyles:{0:{cellWidth:95},1:{cellWidth:55},2:{cellWidth:35}},
      margin:{left:14,right:14},
    });
    doc.save("Composicao_Equipe.pdf");
  };

  const renderNode=(node,depth)=>{
    const isExp=expanded.has(node.id);
    const hasChildren=node.children.length>0;
    const hasMembros=node.membros.length>0;
    const tot=totalMembros(node);
    const indent=12+depth*24;
    const bg=depth===0?"#EFF4FF":depth===1?"#F7F9FF":C.white;
    const borderColor=depth===0?C.primary:depth===1?"#6B8EE8":"#A0B4D8";
    return(
      <Fragment key={node.id}>
        <tr style={{background:bg,borderBottom:`1px solid ${C.border}`}}>
          <td colSpan={3} style={{...S.td,paddingLeft:indent,paddingTop:8,paddingBottom:8,borderLeft:`3px solid ${borderColor}`}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:8}}>
              {(hasChildren||hasMembros)
                ?<button onClick={()=>toggle(node.id)} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:C.primary,padding:"0 2px",lineHeight:1,minWidth:18,fontWeight:"bold"}}>{isExp?"▼":"▶"}</button>
                :<span style={{display:"inline-block",width:18}}/>
              }
              <span style={{fontWeight:depth===0?700:600,fontSize:depth===0?14:13,color:depth===0?C.primary:"#334"}}>{node.name}</span>
              <span style={{...S.badge,background:"#E8F0FE",color:"#1A56DB",border:"1px solid #C7D9FA",fontSize:11,marginLeft:4}}>
                {tot} {tot!==1?"funcionários":"funcionário"}
              </span>
            </span>
          </td>
        </tr>
        {isExp&&node.membros.map((m,i)=>(
          <tr key={i} style={{background:"#FAFBFF",borderBottom:`1px solid ${C.border}`}}>
            <td style={{...S.td,paddingLeft:32+indent,fontSize:12,color:"#444"}}>{m.funcionarioNome}</td>
            <td style={{...S.td,fontSize:12,color:"#555"}}>{m.cargo||"—"}</td>
            <td style={{...S.td,fontSize:12,color:"#555"}}>{m.centroCusto||"—"}</td>
          </tr>
        ))}
        {isExp&&node.children.map(child=>renderNode(child,depth+1))}
      </Fragment>
    );
  };

  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão para visualizar este relatório.</div>;
  if(loading)return<Spinner/>;

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>👥 Composição de Equipe</span>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button style={{...S.btnCancel,fontSize:12,padding:"5px 12px"}} onClick={expandAll}>▼ Expandir tudo</button>
          <button style={{...S.btnCancel,fontSize:12,padding:"5px 12px"}} onClick={collapseAll}>▶ Recolher tudo</button>
          <button style={S.btnAdd} onClick={exportPDF}>⬇ PDF</button>
        </div>
      </div>
      {items.length===0
        ?<div style={S.emptyState}><span style={S.emptyIcon}>👥</span>Nenhuma equipe cadastrada.</div>
        :<div style={{overflowX:"auto"}}>
          <table style={S.table}>
            <thead><tr>
              <th style={{...S.th,width:"55%"}}>Equipe / Funcionário</th>
              <th style={S.th}>Cargo</th>
              <th style={S.th}>Centro de Custo</th>
            </tr></thead>
            <tbody>{tree.map(node=>renderNode(node,0))}</tbody>
          </table>
        </div>
      }
    </div>
  );
}

// ── ENDEREÇOS DE REDE (s38) ────────────────────────────────────
function cidrInfo(cidr){
  try{
    const[ip,pfx]=cidr.trim().split("/");const prefix=parseInt(pfx,10);
    if(!ip||isNaN(prefix)||prefix<0||prefix>32)return null;
    const pts=ip.split(".").map(Number);
    if(pts.length!==4||pts.some(p=>isNaN(p)||p<0||p>255))return null;
    const ipInt=((pts[0]<<24)|(pts[1]<<16)|(pts[2]<<8)|pts[3])>>>0;
    const mask=prefix===0?0:(~((1<<(32-prefix))-1))>>>0;
    const net=(ipInt&mask)>>>0;const bcast=(net|(~mask>>>0))>>>0;
    const toIp=n=>[n>>>24,(n>>>16)&0xff,(n>>>8)&0xff,n&0xff].join(".");
    const hosts=prefix>=31?(1<<(32-prefix)):(1<<(32-prefix))-2;
    return{firstIp:toIp(net+(prefix<32?1:0)),lastIp:toIp(bcast-(prefix<32?1:0)),hosts,mask:toIp(mask),start:net,end:bcast};
  }catch{return null;}
}
function rangesOverlap(a,b){return a.start<=b.end&&a.end>=b.start;}

function feIpToInt(ip){const p=ip.trim().split(".").map(Number);if(p.length!==4||p.some(x=>isNaN(x)||x<0||x>255))return null;return((p[0]<<24)|(p[1]<<16)|(p[2]<<8)|p[3])>>>0;}
function feIntToIp(n){return[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join(".");}

function DhcpModal({range,onClose,onDhcpDeleted}){
  const info=cidrInfo(range.ipRange);
  const[dhcpStart,setDhcpStart]=useState("");
  const[dhcpEnd,setDhcpEnd]=useState("");
  const[grid2,setGrid2]=useState([]);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);

  useEffect(()=>{
    api.get(`/network-addresses/ranges/${range.id}/dhcp`)
      .then(d=>{
        setDhcpStart(d.dhcpStart||"");
        setDhcpEnd(d.dhcpEnd||"");
        if(d.dhcpStart&&d.dhcpEnd)buildGrid2(d.dhcpStart,d.dhcpEnd,d.statics||[]);
        else setGrid2([]);
      })
      .catch(e=>alert(e.message))
      .finally(()=>setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[range.id]);

  function buildGrid2(start,end,savedStatics){
    if(!info)return;
    const si=feIpToInt(start);const ei=feIpToInt(end);
    if(!si||!ei)return;
    const firstHost=info.start+(info.prefix<32?1:0);
    const lastHost=info.end-(info.prefix<32?1:0);
    const ips=[];
    for(let i=firstHost;i<si&&ips.length<2000;i++)ips.push(feIntToIp(i));
    for(let i=ei+1;i<=lastHost&&ips.length<2000;i++)ips.push(feIntToIp(i));
    const descMap={};savedStatics.forEach(s=>{descMap[s.ip]=s.descricao||"";});
    setGrid2(ips.map(ip=>({ip,descricao:descMap[ip]||""})));
  }

  const hasFilledDesc=()=>grid2.some(g=>g.descricao?.trim());

  const saveRange=async()=>{
    if(!dhcpStart.trim()||!dhcpEnd.trim())return alert("Informe o IP inicial e final do DHCP.");
    if(!info)return alert("Faixa pai inválida.");
    const si=feIpToInt(dhcpStart);const ei=feIpToInt(dhcpEnd);
    if(!si||!ei)return alert("IPs inválidos.");
    if(si>ei)return alert("IP inicial deve ser menor ou igual ao IP final.");
    const firstHost=info.start+(info.prefix<32?1:0);
    const lastHost=info.end-(info.prefix<32?1:0);
    if(si<firstHost||ei>lastHost)return alert("A faixa DHCP deve estar dentro da faixa de rede configurada.");
    if(hasFilledDesc())return alert("Para alterar a faixa DHCP, limpe primeiro os campos de Descrição / Alocação dos IPs estáticos.");
    setSaving(true);
    try{
      await api.put(`/network-addresses/ranges/${range.id}/dhcp/range`,{dhcpStart:dhcpStart.trim(),dhcpEnd:dhcpEnd.trim()});
      buildGrid2(dhcpStart.trim(),dhcpEnd.trim(),[]);
    }catch(err){alert(err.message);}finally{setSaving(false);}
  };

  const excluirFaixaDhcp=async()=>{
    if(hasFilledDesc())return alert("Para excluir a faixa DHCP, limpe primeiro os campos de Descrição / Alocação dos IPs estáticos.");
    setSaving(true);
    try{
      await api.delete(`/network-addresses/ranges/${range.id}/dhcp`);
      setDhcpStart("");setDhcpEnd("");setGrid2([]);
      if(onDhcpDeleted)onDhcpDeleted(range.id);
    }catch(err){alert(err.message);}finally{setSaving(false);}
  };

  const saveStatics=async()=>{
    setSaving(true);
    try{
      await api.put(`/network-addresses/ranges/${range.id}/dhcp/statics`,{statics:grid2});
    }catch(err){alert(err.message);}finally{setSaving(false);}
  };

  const hasDhcpRange=dhcpStart||dhcpEnd;

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.white,borderRadius:12,width:"min(780px,100%)",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 8px 32px rgba(0,0,0,0.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:C.text}}>Detalhes DHCP — {range.nome}</div>
            <div style={{fontSize:12,color:C.textLight,marginTop:2}}>{range.ipRange}{info?` · ${info.firstIp} – ${info.lastIp} · ${info.hosts} hosts`:""}</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Icon name="x" size={18}/></button>
        </div>

        {loading?<div style={{padding:40,textAlign:"center"}}><Spinner/></div>:<div style={{overflowY:"auto",flex:1,padding:20}}>
          {/* Grid 1 */}
          <div style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"14px 16px",marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontWeight:600,fontSize:13,color:C.text}}>Faixa DHCP</div>
              {hasDhcpRange&&<button style={{...S.actionBtn,background:"#FFEBEE",color:"#C62828",border:"0.5px solid #FFCDD2",fontSize:12}} disabled={saving} onClick={excluirFaixaDhcp}><Icon name="trash" size={12}/> Excluir Faixa DHCP</button>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div style={S.formRow}>
                <label style={S.label}>DHCP Inicial *</label>
                <input style={S.input} value={dhcpStart} onChange={e=>setDhcpStart(e.target.value)} placeholder={info?info.firstIp:"ex: 192.168.1.10"}/>
              </div>
              <div style={S.formRow}>
                <label style={S.label}>DHCP Final *</label>
                <input style={S.input} value={dhcpEnd} onChange={e=>setDhcpEnd(e.target.value)} placeholder={info?info.lastIp:"ex: 192.168.1.200"}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button style={{...S.btnSave,opacity:saving?0.7:1}} disabled={saving} onClick={saveRange}>{saving?"Salvando...":"Salvar Faixa DHCP"}</button>
            </div>
          </div>

          {/* Grid 2 */}
          {grid2.length>0&&(
            <div>
              <div style={{fontWeight:600,fontSize:13,marginBottom:8,color:C.text}}>
                IPs Estáticos ({grid2.length})
                <span style={{fontSize:11,color:C.textLight,fontWeight:400,marginLeft:8}}>IPs fora da faixa DHCP — informe a descrição de cada alocação</span>
              </div>
              <div style={{maxHeight:320,overflowY:"auto",border:`0.5px solid ${C.border}`,borderRadius:8}}>
                <table style={{...S.table,marginBottom:0}}><thead><tr>
                  <th style={S.th}>IP</th>
                  <th style={S.th}>Descrição / Alocação</th>
                </tr></thead>
                <tbody>{grid2.map((g,i)=>(
                  <tr key={g.ip}>
                    <td style={{...S.td,fontFamily:"monospace",fontSize:12,width:140}}>{g.ip}</td>
                    <td style={S.td}>
                      <input style={{...S.input,marginBottom:0,padding:"4px 8px",fontSize:12}}
                        value={g.descricao}
                        placeholder="ex: Servidor, Impressora, Câmera..."
                        onChange={e=>{const v=e.target.value;setGrid2(gs=>gs.map((x,j)=>j===i?{...x,descricao:v}:x));}}/>
                    </td>
                  </tr>
                ))}</tbody></table>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
                <button style={{...S.btnSave,opacity:saving?0.7:1}} disabled={saving} onClick={saveStatics}>{saving?"Salvando...":"Salvar Alocações"}</button>
              </div>
            </div>
          )}
        </div>}

        <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"flex-end"}}>
          <button style={S.btnCancel} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

function FiliaisScreen({user}){
  const p=user.permissions?.s39;
  const[items,setItems]=useState([]);
  const[companies,setCompanies]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const[delId,setDelId]=useState(null);
  const[saving,setSaving]=useState(false);
  const[filters,setFilters]=useState({nome:"",empresaId:"",status:""});
  const empty={id:null,nome:"",empresaId:"",logradouro:"",numero:"",bairro:"",cidade:"",estado:"",cep:"",complemento:"",active:true};
  const[form,setForm]=useState(empty);
  useEffect(()=>{
    if(!p?.view)return;
    api.get("/filiais").then(setItems).catch(e=>alert(e.message)).finally(()=>setLoading(false));
    api.get("/companies").then(r=>setCompanies(Array.isArray(r)?r:[])).catch(()=>{});
  },[]);
  const openAdd=()=>{setForm(empty);setModal(true);};
  const openEdit=i=>{setForm({...empty,...i});setModal(true);};
  const save=async()=>{
    if(!form.nome.trim())return alert("Nome é obrigatório.");
    setSaving(true);
    try{
      if(form.id){const u=await api.put(`/filiais/${form.id}`,form);setItems(is=>is.map(i=>i.id===u.id?u:i));}
      else{const c=await api.post("/filiais",form);setItems(is=>[...is,c]);}
      setModal(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`/filiais/${delId}`);setItems(is=>is.filter(i=>i.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  const filtered=items.filter(it=>{
    if(filters.nome&&!(it.nome||"").toLowerCase().includes(filters.nome.toLowerCase()))return false;
    if(filters.empresaId&&String(it.empresaId||"")!==String(filters.empresaId))return false;
    if(filters.status==="Ativo"&&!it.active)return false;
    if(filters.status==="Inativo"&&it.active)return false;
    return true;
  });
  const companyOpts=[{value:"",label:"Todas"},...companies.map(c=>({value:String(c.id),label:c.name}))];
  if(!p?.view)return<div style={S.emptyState}><Icon name="lock" size={32}/><br/>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>🏬 Filiais</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Nova Filial</button>}</div>
      <div style={{padding:"12px 20px",display:"flex",flexWrap:"wrap",gap:10,borderBottom:`1px solid ${C.border}`}}>
        <div style={S.formRow}><label style={S.label}>Nome</label><input style={{...S.input,marginBottom:0,width:180}} value={filters.nome} onChange={e=>setFilters(f=>({...f,nome:e.target.value}))} placeholder="Filtrar..."/></div>
        <SelectField label="Empresa" value={filters.empresaId} onChange={v=>setFilters(f=>({...f,empresaId:v}))} options={companyOpts}/>
        <SelectField label="Status" value={filters.status} onChange={v=>setFilters(f=>({...f,status:v}))} options={[{value:"",label:"Todos"},{value:"Ativo",label:"Ativo"},{value:"Inativo",label:"Inativo"}]}/>
      </div>
      {filtered.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>🏬</span>Nenhuma filial.</div>:(
        <table style={S.table}><thead><tr>
          {["Nome","Empresa","Cidade","Estado","CEP","Status","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
        </tr></thead>
        <tbody>{filtered.map(it=>(
          <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}><strong>{it.nome}</strong></td>
            <td style={S.td}>{it.empresaNome||"—"}</td>
            <td style={S.td}>{it.cidade||"—"}</td>
            <td style={S.td}>{it.estado||"—"}</td>
            <td style={S.td}>{it.cep||"—"}</td>
            <td style={S.td}><span style={{...S.badge,...(it.active?S.badgeActive:S.badgeInactive)}}>{it.active?"Ativo":"Inativo"}</span></td>
            <td style={S.td}>
              {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(it)}><Icon name="edit" size={13}/> Editar</button>}
              {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/> Excluir</button>}
            </td>
          </tr>
        ))}</tbody></table>
      )}
      {modal&&(
        <Modal title={form.id?"Editar Filial":"Nova Filial"} onClose={()=>setModal(false)}>
          <Input label="Nome" value={form.nome} onChange={v=>setForm(f=>({...f,nome:v}))} required/>
          <SelectField label="Empresa" value={form.empresaId||""} onChange={v=>setForm(f=>({...f,empresaId:v}))} options={[{value:"",label:"Selecione"},...companies.map(c=>({value:String(c.id),label:c.name}))]}/>
          <Input label="Logradouro" value={form.logradouro||""} onChange={v=>setForm(f=>({...f,logradouro:v}))}/>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><Input label="Número" value={form.numero||""} onChange={v=>setForm(f=>({...f,numero:v}))}/></div>
            <div style={{flex:2}}><Input label="Bairro" value={form.bairro||""} onChange={v=>setForm(f=>({...f,bairro:v}))}/></div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:2}}><Input label="Cidade" value={form.cidade||""} onChange={v=>setForm(f=>({...f,cidade:v}))}/></div>
            <div style={{flex:1}}><Input label="Estado" value={form.estado||""} onChange={v=>setForm(f=>({...f,estado:v}))}/></div>
            <div style={{flex:1}}><Input label="CEP" value={form.cep||""} onChange={v=>setForm(f=>({...f,cep:v}))}/></div>
          </div>
          <Input label="Complemento" value={form.complemento||""} onChange={v=>setForm(f=>({...f,complemento:v}))}/>
          <div style={S.formRow}><label style={S.label}>STATUS</label>
            <div style={{display:"flex",gap:16}}>{[{v:true,l:"Ativo"},{v:false,l:"Inativo"}].map(o=>(
              <label key={String(o.v)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                <input type="radio" checked={form.active===o.v} onChange={()=>setForm(f=>({...f,active:o.v}))} style={{accentColor:C.primary}}/>{o.l}
              </label>
            ))}</div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir esta filial?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

function LinksScreen({user}){
  const p=user.permissions?.s40;
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const[delId,setDelId]=useState(null);
  const[saving,setSaving]=useState(false);
  const[companies,setCompanies]=useState([]);
  const[filiais,setFiliais]=useState([]);
  const[suppliers,setSuppliers]=useState([]);
  const[contracts,setContracts]=useState([]);
  const[csvModal,setCsvModal]=useState(false);
  const[csvText,setCsvText]=useState("");
  const[csvResult,setCsvResult]=useState(null);
  const[csvSaving,setCsvSaving]=useState(false);
  const[filters,setFilters]=useState({tipo:"",empresaContratanteId:"",empresaBeneficiariaId:"",filialId:"",fornecedorId:"",numeroSerie:"",numeroConta:""});
  const emptyForm={id:null,tipo:"Link",empresaContratanteId:"",cnpjContratante:"",empresaBeneficiariaId:"",filialId:"",enderecoFilial:"",ccusto:"",fornecedorId:"",contato:"",velocidade:"",contractId:"",emailConta:"",senhaConta:"",vrEquipamento:"",vrMensal:"",numeroSerie:"",numeroConta:"",plano:"",observacao:"",status:"Ativo"};
  const[form,setForm]=useState(emptyForm);
  useEffect(()=>{
    if(!p?.view)return;
    api.get("/links").then(setItems).catch(e=>alert(e.message)).finally(()=>setLoading(false));
    api.get("/companies").then(setCompanies).catch(()=>{});
    api.get("/filiais/basic").then(setFiliais).catch(()=>{});
    api.get("/suppliers").then(setSuppliers).catch(()=>{});
    api.get("/contracts").then(setContracts).catch(()=>{});
  },[]);
  const openAdd=()=>{setForm(emptyForm);setModal(true);};
  const openEdit=i=>{setForm({...emptyForm,...i,vrEquipamento:i.vrEquipamento!=null?String(i.vrEquipamento):"",vrMensal:i.vrMensal!=null?String(i.vrMensal):""});setModal(true);};
  const setF=v=>setForm(f=>({...f,...v}));
  const handleEmpresaContratante=id=>{
    const emp=companies.find(c=>String(c.id)===String(id));
    setF({empresaContratanteId:id,cnpjContratante:emp?emp.cnpj||"":""});
  };
  const handleFilial=id=>{
    const fil=filiais.find(f=>String(f.id)===String(id));
    let end="";
    if(fil){
      end=[fil.logradouro,fil.numero,fil.bairro,fil.cidade,fil.estado,fil.cep,fil.complemento].filter(x=>x&&String(x).trim()).join(", ");
    }
    setF({filialId:id,enderecoFilial:end});
  };
  const handleFornecedor=id=>{
    const sup=suppliers.find(s=>String(s.id)===String(id));
    setF({fornecedorId:id,contato:sup?sup.contact_phone||"":""});
  };
  const reloadItems=()=>api.get("/links").then(setItems).catch(e=>alert(e.message));
  const save=async()=>{
    setSaving(true);
    try{
      const payload={...form,vrEquipamento:form.vrEquipamento!==""?parseFloat(form.vrEquipamento):null,vrMensal:form.vrMensal!==""?parseFloat(form.vrMensal):null};
      if(form.id){await api.put(`/links/${form.id}`,payload);}
      else{await api.post("/links",payload);}
      await reloadItems();
      setModal(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`/links/${delId}`);setItems(is=>is.filter(i=>i.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  const parseCsv=txt=>{
    const lines=txt.split(/\r?\n/).filter(l=>l.trim());
    if(lines.length<2)return[];
    const headers=lines[0].split(";").map(h=>h.trim());
    return lines.slice(1).map(line=>{
      const cols=line.split(";");
      const row={};
      headers.forEach((h,i)=>{row[h]=cols[i]?cols[i].trim():"";});
      return row;
    });
  };
  const importCsv=async()=>{
    const rows=parseCsv(csvText);
    if(!rows.length)return alert("Nenhuma linha encontrada no CSV.");
    setCsvSaving(true);
    try{
      const r=await api.post("/links/import",{rows});
      setCsvResult(r);
    }catch(e){alert(e.message);}finally{setCsvSaving(false);}
  };
  const filtered=items.filter(it=>{
    if(filters.tipo&&String(it.tipo||"")!==String(filters.tipo))return false;
    if(filters.empresaContratanteId&&String(it.empresaContratanteId)!==String(filters.empresaContratanteId))return false;
    if(filters.empresaBeneficiariaId&&String(it.empresaBeneficiariaId)!==String(filters.empresaBeneficiariaId))return false;
    if(filters.filialId&&String(it.filialId)!==String(filters.filialId))return false;
    if(filters.fornecedorId&&String(it.fornecedorId)!==String(filters.fornecedorId))return false;
    if(filters.numeroSerie&&!(it.numeroSerie||"").toLowerCase().includes(filters.numeroSerie.toLowerCase()))return false;
    if(filters.numeroConta&&!(it.numeroConta||"").toLowerCase().includes(filters.numeroConta.toLowerCase()))return false;
    if(filters.status&&String(it.status||"")!==String(filters.status))return false;
    return true;
  });
  const companyName=id=>{ const c=companies.find(x=>String(x.id)===String(id)); return c?c.name:"—"; };
  const filialName=id=>{ const f=filiais.find(x=>String(x.id)===String(id)); return f?f.nome:"—"; };
  const supplierName=id=>{ const s=suppliers.find(x=>String(x.id)===String(id)); return s?s.name:"—"; };
  const tipoOpts=[{value:"Link",label:"Link"},{value:"Starlink",label:"Starlink"},{value:"Telefonia",label:"Telefonia"}];
  const statusOpts=[{value:"Ativo",label:"Ativo"},{value:"Inativo",label:"Inativo"}];
  const companyOpts=[{value:"",label:"Todas"},...companies.map(c=>({value:String(c.id),label:c.name}))];
  const filialOpts=[{value:"",label:"Todas"},...filiais.map(f=>({value:String(f.id),label:f.nome}))];
  const supplierOpts=[{value:"",label:"Todos"},...suppliers.map(s=>({value:String(s.id),label:s.name}))];
  const contractOpts=[{value:"",label:"Selecione"},...contracts.map(c=>({value:String(c.id),label:(c.supplierName||"")+" — "+(c.contractNumber||"")}))];
  if(!p?.view)return<div style={S.emptyState}><Icon name="lock" size={32}/><br/>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>🔗 Links</span>
        <div style={{display:"flex",gap:8}}>
          <button style={{...S.btnAdd,background:"#1565C0"}} onClick={()=>{setCsvText("");setCsvResult(null);setCsvModal(true);}}>📥 Importar CSV</button>
          {p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo Link</button>}
        </div>
      </div>
      <div style={{padding:"12px 20px",display:"flex",flexWrap:"wrap",gap:10,borderBottom:`1px solid ${C.border}`}}>
        <SelectField label="Tipo" value={filters.tipo} onChange={v=>setFilters(f=>({...f,tipo:v}))} options={[{value:"",label:"Todos"},...tipoOpts]}/>
        <SelectField label="Empresa Contratante" value={filters.empresaContratanteId} onChange={v=>setFilters(f=>({...f,empresaContratanteId:v}))} options={companyOpts}/>
        <SelectField label="Empresa Beneficiária" value={filters.empresaBeneficiariaId} onChange={v=>setFilters(f=>({...f,empresaBeneficiariaId:v}))} options={companyOpts}/>
        <SelectField label="Filial" value={filters.filialId} onChange={v=>setFilters(f=>({...f,filialId:v}))} options={filialOpts}/>
        <SelectField label="Fornecedor" value={filters.fornecedorId} onChange={v=>setFilters(f=>({...f,fornecedorId:v}))} options={supplierOpts}/>
        <div style={S.formRow}><label style={S.label}>Nº Série</label><input style={{...S.input,marginBottom:0}} value={filters.numeroSerie} onChange={e=>setFilters(f=>({...f,numeroSerie:e.target.value}))} placeholder="Filtrar..."/></div>
        <div style={S.formRow}><label style={S.label}>Nº Conta</label><input style={{...S.input,marginBottom:0}} value={filters.numeroConta} onChange={e=>setFilters(f=>({...f,numeroConta:e.target.value}))} placeholder="Filtrar..."/></div>
        <SelectField label="Status" value={filters.status||""} onChange={v=>setFilters(f=>({...f,status:v}))} options={[{value:"",label:"Todos"},{value:"Ativo",label:"Ativo"},{value:"Inativo",label:"Inativo"}]}/>
      </div>
      {filtered.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>🔗</span>Nenhum link encontrado.</div>:(
        <div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Tipo","Empresa Contratante","CNPJ Contratante","Empresa Beneficiária","Filial","Fornecedor","Velocidade","Nº Série","Nº Conta","Status","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(it=>(
            <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={S.td}>{it.tipo||"—"}</td>
              <td style={S.td}>{companyName(it.empresaContratanteId)}</td>
              <td style={S.td}>{it.cnpjContratante||"—"}</td>
              <td style={S.td}>{companyName(it.empresaBeneficiariaId)}</td>
              <td style={S.td}>{filialName(it.filialId)}</td>
              <td style={S.td}>{supplierName(it.fornecedorId)}</td>
              <td style={S.td}>{it.velocidade||"—"}</td>
              <td style={S.td}>{it.numeroSerie||"—"}</td>
              <td style={S.td}>{it.numeroConta||"—"}</td>
              <td style={S.td}><span style={{...S.badge,...(it.status==="Ativo"?S.badgeActive:S.badgeInactive)}}>{it.status||"—"}</span></td>
              <td style={S.td}>
                {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(it)}><Icon name="edit" size={13}/> Editar</button>}
                {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/> Excluir</button>}
              </td>
            </tr>
          ))}</tbody></table>
        </div>
      )}
      {modal&&(
        <Modal title={form.id?"Editar Link":"Novo Link"} onClose={()=>setModal(false)}>
          <SelectField label="Tipo" value={form.tipo} onChange={v=>setF({tipo:v})} options={tipoOpts} required/>
          <SelectField label="Empresa Contratante" value={form.empresaContratanteId} onChange={handleEmpresaContratante} options={[{value:"",label:"Selecione"},...companies.map(c=>({value:String(c.id),label:c.name}))]}/>
          <Input label="CNPJ Contratante" value={form.cnpjContratante} onChange={()=>{}} disabled/>
          <SelectField label="Empresa Beneficiária" value={form.empresaBeneficiariaId} onChange={v=>setF({empresaBeneficiariaId:v})} options={[{value:"",label:"Selecione"},...companies.map(c=>({value:String(c.id),label:c.name}))]}/>
          <SelectField label="Filial" value={form.filialId} onChange={handleFilial} options={[{value:"",label:"Selecione"},...filiais.map(f=>({value:String(f.id),label:f.nome}))]}/>
          <Input label="Endereço Filial" value={form.enderecoFilial} onChange={()=>{}} disabled/>
          <Input label="CC Custo" value={form.ccusto||""} onChange={v=>setF({ccusto:v})}/>
          <SelectField label="Fornecedor" value={form.fornecedorId} onChange={handleFornecedor} options={[{value:"",label:"Selecione"},...suppliers.map(s=>({value:String(s.id),label:s.name}))]}/>
          <Input label="Contato" value={form.contato||""} onChange={()=>{}} disabled/>
          <Input label="Velocidade" value={form.velocidade||""} onChange={v=>setF({velocidade:v})}/>
          <SelectField label="Contrato" value={form.contractId} onChange={v=>setF({contractId:v})} options={contractOpts}/>
          <Input label="Email Conta" value={form.emailConta||""} onChange={v=>setF({emailConta:v})}/>
          <Input label="Senha Conta" value={form.senhaConta||""} onChange={v=>setF({senhaConta:v})}/>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><Input label="Vr Equipamento" type="number" value={form.vrEquipamento} onChange={v=>setF({vrEquipamento:v})}/></div>
            <div style={{flex:1}}><Input label="Vr Mensal" type="number" value={form.vrMensal} onChange={v=>setF({vrMensal:v})}/></div>
          </div>
          <Input label="Número Série" value={form.numeroSerie||""} onChange={v=>setF({numeroSerie:v})}/>
          <Input label="Número Conta" value={form.numeroConta||""} onChange={v=>setF({numeroConta:v})}/>
          <Input label="Plano" value={form.plano||""} onChange={v=>setF({plano:v})}/>
          <div style={S.formRow}><label style={S.label}>Observação</label><textarea value={form.observacao||""} onChange={e=>setF({observacao:e.target.value})} style={{...S.input,minHeight:72,resize:"vertical"}}/></div>
          <div style={S.formRow}>
            <label style={S.label}>Status *</label>
            <select style={S.input} value={form.status} onChange={e=>setF({status:e.target.value})}>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {csvModal&&(
        <Modal title="Importar Links via CSV" onClose={()=>setCsvModal(false)}>
          {!csvResult?(
            <>
              <div style={S.formRow}><label style={S.label}>Cole o CSV abaixo (separado por ponto e vírgula)</label>
                <div style={{fontSize:11,color:C.textLight,marginBottom:6}}>Cabeçalhos: Tipo; Empresa Contratante; Empresa Beneficiária; Filial; CCusto; Fornecedor; Velocidade; Email conta; Senha conta; Vr Equipamento; Vr Mensal; Numero Série; Numero Conta; Plano; Status; Observação</div>
                <textarea value={csvText} onChange={e=>setCsvText(e.target.value)} style={{...S.input,minHeight:200,resize:"vertical",fontFamily:"monospace",fontSize:12}}/>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                <button style={S.btnCancel} onClick={()=>setCsvModal(false)}>Cancelar</button>
                <button style={{...S.btnSave,opacity:csvSaving?0.7:1}} onClick={importCsv} disabled={csvSaving}>{csvSaving?"Importando...":"Importar"}</button>
              </div>
            </>
          ):(
            <>
              <div style={{padding:16,background:csvResult.errors&&csvResult.errors.length?"#FFF3E0":"#E8F5E9",borderRadius:8,marginBottom:16}}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:8}}>{csvResult.imported!=null?`✅ ${csvResult.imported} registro(s) importado(s).`:""}</div>
                {csvResult.errors&&csvResult.errors.length>0&&(
                  <div>
                    <div style={{fontWeight:600,color:"#E65100",marginBottom:4}}>⚠️ {csvResult.errors.length} erro(s):</div>
                    <ul style={{margin:0,paddingLeft:20,fontSize:12,color:"#E65100"}}>{csvResult.errors.map((e,i)=><li key={i}>{e}</li>)}</ul>
                  </div>
                )}
              </div>
              <div style={{display:"flex",justifyContent:"flex-end"}}>
                <button style={S.btnCancel} onClick={()=>{setCsvModal(false);api.get("/links").then(setItems).catch(()=>{})}}>Fechar</button>
              </div>
            </>
          )}
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir este link?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

function FirewallVlanModal({fw,user,onClose}){
  const p=user.permissions?.s41;
  const[vlans,setVlans]=useState([]);
  const[ranges,setRanges]=useState([]);
  const[usedIds,setUsedIds]=useState([]);
  const[selRange,setSelRange]=useState("");
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[delId,setDelId]=useState(null);
  useEffect(()=>{
    Promise.all([
      api.get(`/firewall/${fw.id}/vlans`),
      api.get("/network-addresses/ranges"),
      api.get("/firewall/used-ranges"),
    ]).then(([v,r,u])=>{setVlans(v);setRanges(r);setUsedIds(u);}).catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[fw.id]);
  const add=async()=>{
    if(!selRange)return alert("Selecione uma faixa de rede.");
    setSaving(true);
    try{
      const r=await api.post(`/firewall/${fw.id}/vlans`,{rangeId:selRange});
      const range=ranges.find(x=>x.id===selRange);
      setVlans(v=>[...v,{id:r.id,firewallId:fw.id,rangeId:selRange,rangeNome:range?.nome,ipRange:range?.ipRange}]);
      setUsedIds(u=>[...u,selRange]);
      setSelRange("");
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{
    const removed=vlans.find(x=>x.id===delId);
    try{
      await api.delete(`/firewall/${fw.id}/vlans/${delId}`);
      setVlans(v=>v.filter(x=>x.id!==delId));
      if(removed)setUsedIds(u=>u.filter(id=>id!==removed.rangeId));
      setDelId(null);
    }catch(e){alert(e.message);}
  };
  const info=id=>{const r=ranges.find(x=>x.id===id);if(!r)return null;return cidrInfo(r.ipRange);};
  const availableRanges=ranges.filter(r=>!usedIds.includes(r.id));
  const rangeOpts=availableRanges.map(r=>({value:r.id,label:`${r.nome} — ${r.ipRange}`}));
  const selInfo=selRange?info(selRange):null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.white,borderRadius:12,width:"min(700px,100%)",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 8px 32px rgba(0,0,0,0.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,fontSize:15,color:C.text}}>VLANs — {fw.equipamento}</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Icon name="x" size={18}/></button>
        </div>
        {loading?<div style={{padding:40,textAlign:"center"}}><Spinner/></div>:<div style={{flex:1,overflowY:"auto",padding:20}}>
          {p?.insert&&<div style={{marginBottom:16}}>
            <SelectField label="Faixa de Rede" value={selRange} onChange={setSelRange} options={[{value:"",label:"Selecione..."},...rangeOpts]}/>
            {selInfo&&<div style={{fontSize:11,color:C.textLight,marginTop:-8,marginBottom:8,paddingLeft:2}}>{selInfo.firstIp} → {selInfo.lastIp} · {selInfo.hosts} hosts</div>}
            <div style={{display:"flex",justifyContent:"flex-end"}}>
              <button style={{...S.btnSave,opacity:saving?0.7:1}} disabled={saving||!selRange} onClick={add}>+ Adicionar</button>
            </div>
          </div>}
          <table style={S.table}><thead><tr>
            {["Nome / Descrição","Faixa CIDR","Primeiro IP","Último IP","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{vlans.map(v=>{
            const i=cidrInfo(v.ipRange);
            return(<tr key={v.id}>
              <td style={{...S.td,fontWeight:600}}>{v.rangeNome}</td>
              <td style={S.td}><code style={{fontSize:11,background:C.bg,padding:"2px 6px",borderRadius:4}}>{v.ipRange}</code></td>
              <td style={{...S.td,fontFamily:"monospace",fontSize:11}}>{i?.firstIp||"—"}</td>
              <td style={{...S.td,fontFamily:"monospace",fontSize:11}}>{i?.lastIp||"—"}</td>
              <td style={S.td}>{p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(v.id)}><Icon name="trash" size={13}/></button>}</td>
            </tr>);
          })}</tbody></table>
          {vlans.length===0&&<div style={S.emptyState}><Icon name="network" size={28}/><br/>Nenhuma VLAN vinculada.</div>}
        </div>}
        {delId&&<ConfirmModal msg="Remover esta VLAN?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
        <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"flex-end"}}>
          <button style={S.btnCancel} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

function FirewallLinksModal({fw,user,onClose}){
  const p=user.permissions?.s41;
  const[items,setItems]=useState([]);
  const[allLinks,setAllLinks]=useState([]);
  const[form,setForm]=useState(null);
  const[delId,setDelId]=useState(null);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  useEffect(()=>{
    Promise.all([api.get(`/firewall/${fw.id}/links`),api.get("/links")])
      .then(([fl,l])=>{setItems(fl);setAllLinks(l);}).catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[fw.id]);
  const linkLabel=l=>l?[l.tipo,l.fornecedorNome,l.filialNome].filter(Boolean).join(" — "):"";
  const save=async()=>{
    setSaving(true);
    try{
      if(form.id){await api.put(`/firewall/${fw.id}/links/${form.id}`,form);setItems(it=>it.map(x=>x.id===form.id?{...x,...form,provedorLabel:linkLabel(allLinks.find(l=>l.id===form.linkId))}:x));}
      else{const r=await api.post(`/firewall/${fw.id}/links`,form);setItems(it=>[...it,{id:r.id,...form,provedorLabel:linkLabel(allLinks.find(l=>l.id===form.linkId))}]);}
      setForm(null);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{
    try{await api.delete(`/firewall/${fw.id}/links/${delId}`);setItems(it=>it.filter(x=>x.id!==delId));setDelId(null);}
    catch(e){alert(e.message);}
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.white,borderRadius:12,width:"min(720px,100%)",maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 8px 32px rgba(0,0,0,0.18)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,fontSize:15,color:C.text}}>Links Vinculados — {fw.equipamento}</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Icon name="x" size={18}/></button>
        </div>
        {loading?<div style={{padding:40,textAlign:"center"}}><Spinner/></div>:<div style={{flex:1,overflowY:"auto",padding:20}}>
          {p?.insert&&!form&&<div style={{marginBottom:12}}><button style={S.btnAdd} onClick={()=>setForm({id:null,linkId:"",portas:"",ipFixo:""})}>+ Adicionar Link</button></div>}
          {form&&<div style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"14px 16px",marginBottom:16}}>
            <SelectField label="Provedor" value={form.linkId||""} onChange={v=>setForm(f=>({...f,linkId:v}))}
              options={[{value:"",label:"Selecione..."},...allLinks.map(l=>({value:l.id,label:linkLabel(l)}))]}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Input label="Portas" value={form.portas||""} onChange={v=>setForm(f=>({...f,portas:v}))} placeholder="ex: WAN1, WAN2"/>
              <Input label="IP Fixo" value={form.ipFixo||""} onChange={v=>setForm(f=>({...f,ipFixo:v}))} placeholder="ex: 200.x.x.x"/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
              <button style={S.btnCancel} onClick={()=>setForm(null)}>Cancelar</button>
              <button style={{...S.btnSave,opacity:saving?0.7:1}} disabled={saving} onClick={save}>{saving?"Salvando...":"Salvar"}</button>
            </div>
          </div>}
          <table style={S.table}><thead><tr>
            {["Provedor","Portas","IP Fixo","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{items.map(it=>(
            <tr key={it.id}>
              <td style={S.td}>{it.provedorLabel||"—"}</td>
              <td style={S.td}>{it.portas||"—"}</td>
              <td style={{...S.td,fontFamily:"monospace",fontSize:11}}>{it.ipFixo||"—"}</td>
              <td style={S.td}><div style={{display:"flex",gap:4}}>
                {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>setForm({...it})}><Icon name="edit" size={13}/> Editar</button>}
                {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(it.id)}><Icon name="trash" size={13}/></button>}
              </div></td>
            </tr>
          ))}</tbody></table>
          {items.length===0&&!form&&<div style={S.emptyState}><Icon name="link" size={28}/><br/>Nenhum link vinculado.</div>}
        </div>}
        {delId&&<ConfirmModal msg="Remover este link vinculado?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
        <div style={{padding:"12px 20px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"flex-end"}}>
          <button style={S.btnCancel} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

function FirewallScreen({user}){
  const p=user.permissions?.s41;
  const[items,setItems]=useState([]);
  const[filiais,setFiliais]=useState([]);
  const[loading,setLoading]=useState(true);
  const[form,setForm]=useState(null);
  const[delId,setDelId]=useState(null);
  const[saving,setSaving]=useState(false);
  const[vlanFw,setVlanFw]=useState(null);
  const[linksFw,setLinksFw]=useState(null);
  const[filters,setFilters]=useState({equipamento:"",filialId:"",modelo:"",numeroSerie:"",firmware:"",status:""});

  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/firewall"),api.get("/filiais/basic")])
      .then(([fw,f])=>{setItems(fw);setFiliais(f);}).catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  const load=()=>{
    const q=new URLSearchParams();
    Object.entries(filters).forEach(([k,v])=>{if(v)q.set(k,v);});
    api.get(`/firewall?${q}`).then(setItems).catch(e=>alert(e.message));
  };

  const save=async()=>{
    if(!form.equipamento?.trim())return alert("Equipamento é obrigatório.");
    setSaving(true);
    try{
      if(form.id){await api.put(`/firewall/${form.id}`,form);load();}
      else{await api.post("/firewall",form);load();}
      setForm(null);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };

  const del=async()=>{
    try{await api.delete(`/firewall/${delId}`);setItems(it=>it.filter(x=>x.id!==delId));setDelId(null);}
    catch(e){alert(e.message);}
  };

  if(!p?.view)return<div style={S.emptyState}><Icon name="lock" size={32}/><br/>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}><Icon name="monitor" size={16} style={{marginRight:6}}/>Firewall</span>
        {p?.insert&&<button style={S.btnAdd} onClick={()=>setForm({id:null,equipamento:"",filialId:"",modelo:"",numeroSerie:"",firmware:"",redeNativa:"",status:"Ativo"})}>+ Novo</button>}
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14,alignItems:"flex-end"}}>
        {[["equipamento","Equipamento"],["modelo","Modelo"],["numeroSerie","Nº Série"],["firmware","Firmware"]].map(([k,lbl])=>(
          <div key={k} style={S.formRow}>
            <label style={S.label}>{lbl}</label>
            <input style={{...S.input,width:130,padding:"4px 8px",fontSize:12}} value={filters[k]} onChange={e=>setFilters(f=>({...f,[k]:e.target.value}))} placeholder={lbl}/>
          </div>
        ))}
        <div style={S.formRow}>
          <label style={S.label}>Filial</label>
          <select style={{...S.input,width:150,padding:"4px 8px",fontSize:12}} value={filters.filialId} onChange={e=>setFilters(f=>({...f,filialId:e.target.value}))}>
            <option value="">Todas</option>
            {filiais.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        <div style={S.formRow}>
          <label style={S.label}>Status</label>
          <select style={{...S.input,width:110,padding:"4px 8px",fontSize:12}} value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}>
            <option value="">Todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </div>
        <button style={S.btnAdd} onClick={load}>Filtrar</button>
        {Object.values(filters).some(v=>v)&&<button style={S.btnCancel} onClick={()=>setFilters({equipamento:"",filialId:"",modelo:"",numeroSerie:"",firmware:"",status:""})}>Limpar</button>}
      </div>
      {items.length===0?<div style={S.emptyState}><Icon name="monitor" size={32}/><br/>Nenhum firewall encontrado.</div>
        :<div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Equipamento","Filial","Modelo","Nº Série","Firmware","Rede Nativa","Status","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{items.map(fw=>(
            <tr key={fw.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={{...S.td,fontWeight:600}}>{fw.equipamento}</td>
              <td style={S.td}>{fw.filialNome?<span style={{...S.badge,background:"#E3F2FD",color:"#1565C0"}}>{fw.filialNome}</span>:"—"}</td>
              <td style={S.td}>{fw.modelo||"—"}</td>
              <td style={{...S.td,fontFamily:"monospace",fontSize:11}}>{fw.numeroSerie||"—"}</td>
              <td style={S.td}>{fw.firmware||"—"}</td>
              <td style={S.td}>{fw.redeNativa||"—"}</td>
              <td style={S.td}><span style={{...S.badge,...(fw.status==="Inativo"?S.badgeInactive:S.badgeActive)}}>{fw.status||"Ativo"}</span></td>
              <td style={S.td}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                <button style={{...S.actionBtn,background:"#E8F5E9",color:"#2E7D32",border:"0.5px solid #A5D6A7"}} onClick={()=>setVlanFw(fw)}><Icon name="network" size={13}/> Vlan</button>
                <button style={{...S.actionBtn,background:"#E3F2FD",color:"#1565C0",border:"0.5px solid #90CAF9"}} onClick={()=>setLinksFw(fw)}><Icon name="link" size={13}/> Links</button>
                {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>setForm({...fw})}><Icon name="edit" size={13}/> Editar</button>}
                {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(fw.id)}><Icon name="trash" size={13}/></button>}
              </div></td>
            </tr>
          ))}</tbody></table>
        </div>}
      {form&&<Modal title={form.id?"Editar Firewall":"Novo Firewall"} onClose={()=>setForm(null)}>
        <Input label="Equipamento *" value={form.equipamento} onChange={v=>setForm(f=>({...f,equipamento:v}))}/>
        <div style={S.formRow}>
          <label style={S.label}>Filial</label>
          <select style={S.input} value={form.filialId||""} onChange={e=>setForm(f=>({...f,filialId:e.target.value}))}>
            <option value="">Selecione...</option>
            {filiais.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Input label="Modelo" value={form.modelo||""} onChange={v=>setForm(f=>({...f,modelo:v}))}/>
          <Input label="Nº Série" value={form.numeroSerie||""} onChange={v=>setForm(f=>({...f,numeroSerie:v}))}/>
          <Input label="Firmware" value={form.firmware||""} onChange={v=>setForm(f=>({...f,firmware:v}))}/>
          <Input label="Rede Nativa" value={form.redeNativa||""} onChange={v=>setForm(f=>({...f,redeNativa:v}))}/>
        </div>
        <div style={S.formRow}><label style={S.label}>Status</label>
          <div style={{display:"flex",gap:16}}>{["Ativo","Inativo"].map(o=>(
            <label key={o} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
              <input type="radio" checked={(form.status||"Ativo")===o} onChange={()=>setForm(f=>({...f,status:o}))} style={{accentColor:C.primary}}/>{o}
            </label>
          ))}</div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
          <button style={S.btnCancel} onClick={()=>setForm(null)}>Cancelar</button>
          <button style={{...S.btnSave,opacity:saving?0.7:1}} disabled={saving} onClick={save}>{saving?"Salvando...":"Salvar"}</button>
        </div>
      </Modal>}
      {vlanFw&&<FirewallVlanModal fw={vlanFw} user={user} onClose={()=>setVlanFw(null)}/>}
      {linksFw&&<FirewallLinksModal fw={linksFw} user={user} onClose={()=>setLinksFw(null)}/>}
      {delId&&<ConfirmModal msg="Excluir este firewall?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

function EnderecosRedeScreen({user}){
  const p=user.permissions?.s38;
  const[ranges,setRanges]=useState([]);
  const[filiais,setFiliais]=useState([]);
  const[loading,setLoading]=useState(true);
  const[form,setForm]=useState(null);
  const[filialForm,setFilialForm]=useState(null);
  const[delId,setDelId]=useState(null);
  const[delFilialId,setDelFilialId]=useState(null);
  const[filterFilial,setFilterFilial]=useState("");
  const[filterSync,setFilterSync]=useState("");
  const[filterStatus,setFilterStatus]=useState("");
  const[cidrPreview,setCidrPreview]=useState(null);
  const[conflito,setConflito]=useState(null);
  const[saving,setSaving]=useState(false);
  const[dhcpRange,setDhcpRange]=useState(null);

  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/network-addresses/ranges"),api.get("/network-addresses/filiais")])
      .then(([r,f])=>{setRanges(r);setFiliais(f);})
      .catch(e=>alert(e.message))
      .finally(()=>setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    if(!form?.ipRange){setCidrPreview(null);setConflito(null);return;}
    const info=cidrInfo(form.ipRange);
    setCidrPreview(info);
    if(!info){setConflito(null);return;}
    const others=ranges.filter(r=>r.id!==form.id&&r.active!==false);
    let c=null;
    for(const r of others){
      const ri=cidrInfo(r.ipRange);
      if(ri&&rangesOverlap(info,ri)){c=r;break;}
    }
    setConflito(c||false);
  },[form?.ipRange,form?.id,ranges]);

  const openAdd=()=>setForm({id:null,filialId:filiais[0]?.id||"",nome:"",ipRange:"",vlan:"",vlanId:"",tipo:"",observacao:"",active:true,syncInventory:true,dhcp:false});
  const openEdit=r=>setForm({...r,filialId:r.filialId,syncInventory:r.syncInventory??true,_originalDhcp:r.dhcp});

  const save=async()=>{
    if(!form.filialId||!form.nome?.trim()||!form.ipRange?.trim())return alert("Filial, nome e faixa de IP são obrigatórios.");
    if(!cidrPreview)return alert("Faixa CIDR inválida. Use o formato: 192.168.1.0/24");
    if(conflito)return alert(`Conflito com a faixa "${conflito.nome}" (${conflito.ipRange}).`);
    setSaving(true);
    try{
      if(form.id){
        const u=await api.put(`/network-addresses/ranges/${form.id}`,form);
        setRanges(rs=>rs.map(r=>r.id===u.id?u:r));
      }else{
        const c=await api.post("/network-addresses/ranges",form);
        setRanges(rs=>[...rs,c]);
      }
      setForm(null);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };

  const del=async()=>{
    try{await api.delete(`/network-addresses/ranges/${delId}`);setRanges(rs=>rs.filter(r=>r.id!==delId));setDelId(null);}
    catch(e){alert(e.message);}
  };

  const saveFilial=async()=>{
    if(!filialForm.nome?.trim())return alert("Nome é obrigatório.");
    try{
      if(filialForm.id){const u=await api.put(`/network-addresses/filiais/${filialForm.id}`,filialForm);setFiliais(fs=>fs.map(f=>f.id===u.id?u:f));}
      else{const c=await api.post("/network-addresses/filiais",filialForm);setFiliais(fs=>[...fs,c]);}
      setFilialForm(null);
    }catch(e){alert(e.message);}
  };
  const delFilial=async()=>{
    try{await api.delete(`/network-addresses/filiais/${delFilialId}`);setFiliais(fs=>fs.filter(f=>f.id!==delFilialId));setDelFilialId(null);}
    catch(e){alert(e.message);}
  };

  const filtered=ranges.filter(r=>{
    if(filterFilial&&r.filialId!==filterFilial)return false;
    if(filterSync==="sim"&&!r.syncInventory)return false;
    if(filterSync==="nao"&&r.syncInventory)return false;
    if(filterStatus==="ativo"&&!r.active)return false;
    if(filterStatus==="inativo"&&r.active)return false;
    return true;
  });

  const totalHosts=filtered.reduce((acc,r)=>{const i=cidrInfo(r.ipRange);return acc+(i?.hosts||0);},0);
  const syncCount=filtered.filter(r=>r.syncInventory).length;

  if(!p?.view)return<div style={S.emptyState}><Icon name="lock" size={32}/><br/>Sem permissão.</div>;
  if(loading)return<Spinner/>;

  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}><Icon name="network" size={16} style={{marginRight:6}}/>Endereços de Rede</span>
        <div style={{display:"flex",gap:8}}>
          {p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Nova Faixa</button>}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,margin:"0 0 16px"}}>
        {[
          ["Total de faixas",filtered.length,C.primary],
          ["Sincronizadas",syncCount,C.success],
          ["Somente aqui",filtered.length-syncCount,C.text],
          ["IPs disponíveis",totalHosts.toLocaleString("pt-BR"),C.warning],
        ].map(([label,val,color])=>(
          <div key={label} style={{background:C.white,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px"}}>
            <div style={{fontSize:11,color:C.textLight,marginBottom:4}}>{label}</div>
            <div style={{fontSize:20,fontWeight:500,color}}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:11,color:C.textLight}}>Filtrar:</span>
        <select style={{...S.input,width:"auto",padding:"4px 10px",fontSize:12}} value={filterFilial} onChange={e=>setFilterFilial(e.target.value)}>
          <option value="">Todas as filiais</option>
          {filiais.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
        <select style={{...S.input,width:"auto",padding:"4px 10px",fontSize:12}} value={filterSync} onChange={e=>setFilterSync(e.target.value)}>
          <option value="">Inventário: todos</option>
          <option value="sim">Sincronizadas</option>
          <option value="nao">Não sincronizadas</option>
        </select>
        <select style={{...S.input,width:"auto",padding:"4px 10px",fontSize:12}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">Status: todos</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
        {(filterFilial||filterSync||filterStatus)&&<button style={{...S.btnCancel,fontSize:12,padding:"4px 10px"}} onClick={()=>{setFilterFilial("");setFilterSync("");setFilterStatus("");}}>Limpar</button>}
      </div>

      {filtered.length===0
        ?<div style={S.emptyState}><Icon name="network" size={32}/><br/>Nenhuma faixa encontrada.</div>
        :<div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Filial","Nome / Descrição","Faixa CIDR","Primeiro IP","Último IP","Hosts","VLAN Id","Tipo","Status","Inventário","DHCP","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(r=>{
            const info=cidrInfo(r.ipRange);
            return(
              <tr key={r.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={S.td}><span style={{...S.badge,background:"#E3F2FD",color:"#1565C0"}}>{r.filialNome}</span></td>
                <td style={{...S.td,fontWeight:600}}>{r.nome}</td>
                <td style={S.td}><code style={{fontSize:12,background:C.bg,padding:"2px 6px",borderRadius:4,border:`0.5px solid ${C.border}`}}>{r.ipRange}</code></td>
                <td style={{...S.td,fontFamily:"monospace",fontSize:11}}>{info?.firstIp||"—"}</td>
                <td style={{...S.td,fontFamily:"monospace",fontSize:11}}>{info?.lastIp||"—"}</td>
                <td style={{...S.td,textAlign:"center"}}>{info?info.hosts.toLocaleString("pt-BR"):"—"}</td>
                <td style={{...S.td,textAlign:"center"}}>{r.vlanId?<span style={{...S.badge,background:C.bg,color:C.textLight,fontFamily:"monospace"}}>{r.vlanId}</span>:"—"}</td>
                <td style={S.td}>{r.tipo?<span style={{...S.badge,background:r.tipo==="Wifi"?"#F3E5F5":"#E8EAF6",color:r.tipo==="Wifi"?"#6A1B9A":"#283593"}}>{r.tipo}</span>:"—"}</td>
                <td style={S.td}><span style={{...S.badge,background:r.active?"#E8F5E9":"#FFEBEE",color:r.active?"#2E7D32":"#C62828"}}>{r.active?"Ativo":"Inativo"}</span></td>
                <td style={{...S.td,textAlign:"center"}}>
                  {r.syncInventory
                    ?<span style={{...S.badge,background:"#E8F5E9",color:"#2E7D32",display:"flex",alignItems:"center",gap:4,width:"fit-content",margin:"auto"}}><Icon name="link" size={11}/>Sim</span>
                    :<span style={{...S.badge,background:C.bg,color:C.textLight,display:"flex",alignItems:"center",gap:4,width:"fit-content",margin:"auto"}}><Icon name="x" size={11}/>Não</span>}
                </td>
                <td style={{...S.td,textAlign:"center"}}>
                  {r.dhcp
                    ?<span style={{...S.badge,background:"#E3F2FD",color:"#1565C0"}}><Icon name="wrench" size={11}/> Sim</span>
                    :<span style={{...S.badge,background:C.bg,color:C.textLight}}>Não</span>}
                </td>
                <td style={S.td}>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {r.dhcp&&<button style={{...S.actionBtn,background:"#E3F2FD",color:"#1565C0",border:"0.5px solid #90CAF9"}} onClick={()=>setDhcpRange(r)}><Icon name="wrench" size={13}/> DHCP</button>}
                    {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(r)}><Icon name="edit" size={13}/> Editar</button>}
                    {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(r.id)}><Icon name="trash" size={13}/></button>}
                  </div>
                </td>
              </tr>
            );
          })}</tbody></table>
        </div>
      }

      {/* Modal Filial */}
      {filialForm&&(
        <Modal title={filialForm.id?"Editar Filial":"Nova Filial"} onClose={()=>setFilialForm(null)}>
          <Input label="Nome *" value={filialForm.nome} onChange={v=>setFilialForm(f=>({...f,nome:v}))} placeholder="ex: Cariri"/>
          <Input label="Cidade" value={filialForm.cidade||""} onChange={v=>setFilialForm(f=>({...f,cidade:v}))} placeholder="ex: Juazeiro do Norte"/>
          <SelectField label="Status" value={String(filialForm.active)} onChange={v=>setFilialForm(f=>({...f,active:v==="true"}))}
            options={[{value:"true",label:"Ativo"},{value:"false",label:"Inativo"}]}/>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,color:C.textLight,marginBottom:6}}>Filiais cadastradas:</div>
            {filiais.length===0?<div style={{fontSize:12,color:C.textLight}}>Nenhuma filial ainda.</div>:filiais.map(f=>(
              <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:`0.5px solid ${C.border}`}}>
                <span style={{fontSize:13}}>{f.nome}{f.cidade?` — ${f.cidade}`:""}</span>
                <div style={{display:"flex",gap:4}}>
                  <button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>setFilialForm({...f})}><Icon name="edit" size={12}/></button>
                  <button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelFilialId(f.id)}><Icon name="trash" size={12}/></button>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setFilialForm(null)}>Fechar</button>
            <button style={S.btnSave} onClick={saveFilial}>Salvar</button>
          </div>
        </Modal>
      )}

      {/* Modal Faixa */}
      {form&&(
        <Modal title={form.id?"Editar Faixa":"Nova Faixa de Rede"} onClose={()=>setForm(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={S.formRow}>
              <label style={S.label}>Filial *</label>
              <select style={S.input} value={form.filialId} onChange={e=>setForm(f=>({...f,filialId:e.target.value}))}>
                <option value="">Selecione...</option>
                {filiais.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <Input label="VLAN (opcional)" value={form.vlan||""} onChange={v=>setForm(f=>({...f,vlan:v}))} placeholder="ex: VLAN 10"/>
          </div>
          <Input label="Nome / Descrição *" value={form.nome} onChange={v=>setForm(f=>({...f,nome:v}))} placeholder="ex: Rede LAN TI"/>
          <Input label="Faixa de IP (CIDR) *" value={form.ipRange} onChange={v=>setForm(f=>({...f,ipRange:v}))} placeholder="ex: 192.168.1.0/24"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div style={S.formRow}>
              <label style={S.label}>Vlan Id</label>
              <input type="number" min="1" max="4094" style={S.input} value={form.vlanId||""} placeholder="ex: 10"
                onChange={e=>setForm(f=>({...f,vlanId:e.target.value}))}/>
            </div>
            <div style={S.formRow}>
              <label style={S.label}>Tipo</label>
              <select style={S.input} value={form.tipo||""} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
                <option value="">Selecione...</option>
                <option value="Cabeada">Cabeada</option>
                <option value="Wifi">Wifi</option>
              </select>
            </div>
          </div>

          {cidrPreview&&(
            <div style={{background:"#E3F2FD",border:"0.5px solid #90CAF9",borderRadius:6,padding:"10px 12px",marginBottom:10,fontSize:12,color:"#1565C0"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                <span><strong>Primeiro IP:</strong> {cidrPreview.firstIp}</span>
                <span><strong>Último IP:</strong> {cidrPreview.lastIp}</span>
                <span><strong>Hosts:</strong> {cidrPreview.hosts.toLocaleString("pt-BR")}</span>
                <span><strong>Máscara:</strong> {cidrPreview.mask}</span>
              </div>
            </div>
          )}
          {form.ipRange&&!cidrPreview&&<div style={{background:"#FFEBEE",border:"0.5px solid #FFCDD2",borderRadius:6,padding:"8px 12px",marginBottom:10,fontSize:12,color:"#C62828"}}>CIDR inválido — use o formato: 192.168.1.0/24</div>}
          {conflito===false&&cidrPreview&&<div style={{background:"#E8F5E9",border:"0.5px solid #A5D6A7",borderRadius:6,padding:"8px 12px",marginBottom:10,fontSize:12,color:"#2E7D32",display:"flex",alignItems:"center",gap:6}}><Icon name="check" size={14}/>Sem conflitos com as faixas existentes</div>}
          {conflito&&<div style={{background:"#FFEBEE",border:"0.5px solid #FFCDD2",borderRadius:6,padding:"8px 12px",marginBottom:10,fontSize:12,color:"#C62828",display:"flex",alignItems:"center",gap:6}}><Icon name="info" size={14}/>Conflito com <strong>{conflito.nome}</strong> ({conflito.ipRange})</div>}

          <div style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:6,padding:"10px 12px",marginBottom:10}}>
            <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}}>
              <input type="checkbox" checked={!!form.syncInventory} onChange={e=>setForm(f=>({...f,syncInventory:e.target.checked}))}
                style={{width:16,height:16,marginTop:2,accentColor:C.success,flexShrink:0}}/>
              <div>
                <div style={{fontWeight:500,fontSize:13,color:C.text,marginBottom:3}}>Usar no Inventário de Rede</div>
                <div style={{fontSize:11,color:C.textLight,lineHeight:1.5}}>
                  Cadastra/mantém esta faixa sincronizada na aba "Faixas de Rede" de Configuração de Inventário.<br/>
                  <span style={{fontFamily:"monospace",fontSize:10}}>Nome → Filial/Nome &nbsp;·&nbsp; Faixa CIDR → Faixa de IP &nbsp;·&nbsp; Status → Status</span>
                </div>
              </div>
            </label>
          </div>

          <div style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:6,padding:"10px 12px",marginBottom:10}}>
            <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}}>
              <input type="checkbox" checked={!!form.dhcp}
                onChange={e=>{
                  if(!e.target.checked&&form.id&&form._originalDhcp){
                    alert("Para desabilitar o DHCP, primeiro exclua a faixa DHCP usando o botão 'Excluir Faixa DHCP' em Detalhes DHCP.");
                    return;
                  }
                  setForm(f=>({...f,dhcp:e.target.checked}));
                }}
                style={{width:16,height:16,marginTop:2,accentColor:C.primary,flexShrink:0}}/>
              <div>
                <div style={{fontWeight:500,fontSize:13,color:C.text,marginBottom:3}}>Habilitar DHCP</div>
                <div style={{fontSize:11,color:C.textLight,lineHeight:1.5}}>Permite configurar a faixa DHCP e alocar IPs estáticos nesta rede.{form.id&&form._originalDhcp?<><br/><span style={{color:"#E65100"}}>Para desabilitar, use o botão "Excluir Faixa DHCP" em Detalhes DHCP.</span></>:""}</div>
              </div>
            </label>
          </div>
          <Input label="Observação" value={form.observacao||""} onChange={v=>setForm(f=>({...f,observacao:v}))} placeholder="ex: rede do 2º andar"/>
          <SelectField label="Status" value={String(form.active)} onChange={v=>setForm(f=>({...f,active:v==="true"}))}
            options={[{value:"true",label:"Ativo"},{value:"false",label:"Inativo"}]}/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setForm(null)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}

      {dhcpRange&&<DhcpModal range={dhcpRange} onClose={()=>setDhcpRange(null)} onDhcpDeleted={id=>{
        setRanges(rs=>rs.map(r=>r.id===id?{...r,dhcp:false}:r));
        setDhcpRange(null);
        setForm(f=>f?{...f,dhcp:false,_originalDhcp:false}:f);
      }}/>}
      {delId&&<ConfirmModal msg="Excluir esta faixa? Se sincronizada com o inventário, será removida de lá também." onConfirm={del} onCancel={()=>setDelId(null)}/>}
      {delFilialId&&<ConfirmModal msg="Excluir esta filial?" onConfirm={delFilial} onCancel={()=>setDelFilialId(null)}/>}
    </div>
  );
}

// ── RELATÓRIO LINKS (s43) ────────────────────────────────────
function RelatorioLinksScreen({user}){
  const p=user.permissions?.s40||user.permissions?.s43;
  const[filiais,setFiliais]=useState([]);
  const[companies,setCompanies]=useState([]);
  const[suppliers,setSuppliers]=useState([]);
  const tipoOpts=["Link","Starlink","Telefonia"];
  const statusOpts=["Ativo","Inativo"];
  const[filters,setFilters]=useState({tipo:"",empresaContratanteId:"",cnpjContratante:"",filialId:"",ccusto:"",fornecedorId:"",status:""});
  const[applied,setApplied]=useState(null);
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState(null);

  useEffect(()=>{
    api.get("/filiais/basic").then(r=>setFiliais(Array.isArray(r)?r:[])).catch(()=>{});
    api.get("/companies").then(r=>setCompanies(Array.isArray(r)?r:[])).catch(()=>{});
    api.get("/suppliers").then(r=>setSuppliers(Array.isArray(r)?r:[])).catch(()=>{});
  },[]);

  useEffect(()=>{
    if(applied===null)return;
    setLoading(true);setErr(null);
    const params=new URLSearchParams();
    if(applied.tipo)params.set("tipo",applied.tipo);
    if(applied.empresaContratanteId)params.set("empresaContratanteId",applied.empresaContratanteId);
    if(applied.cnpjContratante)params.set("cnpjContratante",applied.cnpjContratante);
    if(applied.filialId)params.set("filialId",applied.filialId);
    if(applied.ccusto)params.set("ccusto",applied.ccusto);
    if(applied.fornecedorId)params.set("fornecedorId",applied.fornecedorId);
    if(applied.status)params.set("status",applied.status);
    api.get("/links/report?"+params.toString())
      .then(r=>{setItems(Array.isArray(r)?r:[]);setLoading(false);})
      .catch(e=>{setErr("Erro ao carregar relatório: "+(e?.message||""));setLoading(false);});
  },[applied]);

  if(!p?.view)return<div style={{padding:32,color:C.danger}}>Sem permissão.</div>;

  const fSet=(k,v)=>setFilters(f=>({...f,[k]:v}));

  // Agrupa por filial
  function groupByFilial(list){
    const map=new Map();
    list.forEach(l=>{
      const key=l.filialId||"__sem_filial__";
      if(!map.has(key))map.set(key,{filialId:l.filialId,filialNome:l.filialNome||"Sem Filial",endereco:buildEndereco(l),links:[]});
      map.get(key).links.push(l);
    });
    return [...map.values()];
  }
  function buildEndereco(l){
    return[l.logradouro,l.filialNumero,l.bairro,l.cidade,l.estado,l.cep,l.complemento].filter(x=>x&&String(x).trim()).join(", ")||"—";
  }

  function exportPdf(){
    const doc=new jsPDF({orientation:"landscape"});
    doc.setFontSize(14);doc.text("Relatório de Links",14,15);
    let firstPage=true;
    groupByFilial(items).forEach(g=>{
      if(!firstPage){doc.addPage();}firstPage=false;
      let y=22;
      doc.setFontSize(12);doc.setFont(undefined,"bold");
      doc.text(g.filialNome,14,y);doc.setFont(undefined,"normal");
      doc.setFontSize(9);doc.text(g.endereco,14,y+5);y+=12;
      autoTable(doc,{
        startY:y,margin:{left:14},
        head:[["Tipo","Fornecedor","Contato","Velocidade","Empresa Contratante","CNPJ Contratante","CCusto","Email Conta","Senha Conta","Nº Série","Nº Conta","Status"]],
        body:g.links.map(l=>[l.tipo||"—",l.fornecedorNome||"—",l.contato||"—",l.velocidade||"—",l.empresaContratanteNome||"—",l.cnpjContratante||"—",l.ccusto||"—",l.emailConta||"—",l.senhaConta||"—",l.numeroSerie||"—",l.numeroConta||"—",l.status||"—"]),
        styles:{fontSize:7},headStyles:{fillColor:[37,99,235]},theme:"striped",
      });
    });
    doc.save("relatorio-links.pdf");
  }

  function exportExcel(){
    const wb=XLSX.utils.book_new();
    const rows=[["Filial","Endereço Filial","Tipo","Fornecedor","Contato","Velocidade","Empresa Contratante","CNPJ Contratante","CCusto","Email Conta","Senha Conta","Nº Série","Nº Conta","Status"]];
    groupByFilial(items).forEach(g=>g.links.forEach(l=>rows.push([g.filialNome,g.endereco,l.tipo||"",l.fornecedorNome||"",l.contato||"",l.velocidade||"",l.empresaContratanteNome||"",l.cnpjContratante||"",l.ccusto||"",l.emailConta||"",l.senhaConta||"",l.numeroSerie||"",l.numeroConta||"",l.status||""])));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),"Links");
    XLSX.writeFile(wb,"relatorio-links.xlsx");
  }

  const groups=groupByFilial(items);

  return(
    <div style={{padding:24,maxWidth:1200}}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>🔗 Relatório de Links</span>
        <div style={{display:"flex",gap:8}}>
          <button style={S.btnSave} onClick={exportPdf} disabled={items.length===0}>⬇ PDF</button>
          <button style={S.btnSave} onClick={exportExcel} disabled={items.length===0}>⬇ Excel</button>
        </div>
      </div>
      {/* Filtros */}
      <div style={{background:C.surface,borderRadius:8,padding:16,marginBottom:20,display:"flex",flexWrap:"wrap",gap:12,alignItems:"flex-end"}}>
        <div style={{flex:"1 1 130px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Tipo</div>
          <SelectField value={filters.tipo} onChange={v=>fSet("tipo",v)} options={[{value:"",label:"Todos"},...tipoOpts.map(t=>({value:t,label:t}))]}/>
        </div>
        <div style={{flex:"1 1 180px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Empresa Contratante</div>
          <SelectField value={filters.empresaContratanteId} onChange={v=>fSet("empresaContratanteId",v)} options={[{value:"",label:"Todas"},...companies.map(c=>({value:String(c.id),label:c.name}))]}/>
        </div>
        <div style={{flex:"1 1 150px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>CNPJ Contratante</div>
          <Input value={filters.cnpjContratante} onChange={v=>fSet("cnpjContratante",v)} placeholder="Buscar..." onKeyDown={e=>e.key==="Enter"&&setApplied({...filters})}/>
        </div>
        <div style={{flex:"1 1 160px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Filial</div>
          <SelectField value={filters.filialId} onChange={v=>fSet("filialId",v)} options={[{value:"",label:"Todas"},...filiais.map(f=>({value:String(f.id),label:f.nome}))]}/>
        </div>
        <div style={{flex:"1 1 120px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>CCusto</div>
          <Input value={filters.ccusto} onChange={v=>fSet("ccusto",v)} placeholder="Buscar..." onKeyDown={e=>e.key==="Enter"&&setApplied({...filters})}/>
        </div>
        <div style={{flex:"1 1 160px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Fornecedor</div>
          <SelectField value={filters.fornecedorId} onChange={v=>fSet("fornecedorId",v)} options={[{value:"",label:"Todos"},...suppliers.map(s=>({value:String(s.id),label:s.name}))]}/>
        </div>
        <div style={{flex:"1 1 120px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Status</div>
          <SelectField value={filters.status} onChange={v=>fSet("status",v)} options={[{value:"",label:"Todos"},...statusOpts.map(s=>({value:s,label:s}))]}/>
        </div>
        <button onClick={()=>setApplied({...filters})} style={{...S.btn,background:C.primary,color:C.white,padding:"8px 20px",whiteSpace:"nowrap"}}>Aplicar</button>
      </div>

      {loading&&<div style={{textAlign:"center",padding:32}}><Spinner/></div>}
      {err&&<div style={{color:C.danger,padding:12}}>{err}</div>}
      {applied!==null&&!loading&&!err&&groups.length===0&&(
        <div style={{color:C.muted,padding:24,textAlign:"center"}}>Nenhum resultado encontrado.</div>
      )}
      {applied===null&&!loading&&(
        <div style={{color:C.muted,padding:24,textAlign:"center"}}>Utilize os filtros acima e clique em Aplicar para gerar o relatório.</div>
      )}

      {groups.map((g,gi)=>(
        <div key={gi} style={{background:C.surface,borderRadius:8,marginBottom:20,overflow:"hidden",border:`1px solid ${C.border}`}}>
          <div style={{background:C.primary,padding:"10px 16px"}}>
            <div style={{color:C.white,fontWeight:700,fontSize:15}}>{g.filialNome}</div>
            <div style={{color:"rgba(255,255,255,0.85)",fontSize:12,marginTop:2}}>{g.endereco}</div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:C.hover}}>
                  {["Tipo","Fornecedor","Contato","Velocidade","Empresa Contratante","CNPJ Contratante","CCusto","Email Conta","Senha Conta","Nº Série","Nº Conta","Status"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.links.map((l,i)=>(
                  <tr key={i} style={{borderTop:`1px solid ${C.border}`}}>
                    <td style={{padding:"6px 10px",whiteSpace:"nowrap"}}>{l.tipo||"—"}</td>
                    <td style={{padding:"6px 10px"}}>{l.fornecedorNome||"—"}</td>
                    <td style={{padding:"6px 10px",whiteSpace:"nowrap"}}>{l.contato||"—"}</td>
                    <td style={{padding:"6px 10px"}}>{l.velocidade||"—"}</td>
                    <td style={{padding:"6px 10px"}}>{l.empresaContratanteNome||"—"}</td>
                    <td style={{padding:"6px 10px",fontFamily:"monospace"}}>{l.cnpjContratante||"—"}</td>
                    <td style={{padding:"6px 10px"}}>{l.ccusto||"—"}</td>
                    <td style={{padding:"6px 10px"}}>{l.emailConta||"—"}</td>
                    <td style={{padding:"6px 10px"}}>{l.senhaConta||"—"}</td>
                    <td style={{padding:"6px 10px",fontFamily:"monospace"}}>{l.numeroSerie||"—"}</td>
                    <td style={{padding:"6px 10px"}}>{l.numeroConta||"—"}</td>
                    <td style={{padding:"6px 10px"}}>
                      <span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,background:l.status==="Ativo"?"#dcfce7":"#fee2e2",color:l.status==="Ativo"?"#166534":"#991b1b"}}>{l.status||"—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── RELATÓRIO FIREWALL (s42) ──────────────────────────────────
function RelatorioFirewallScreen({user}){
  const p=user.permissions?.s41||user.permissions?.s42;
  const[filiais,setFiliais]=useState([]);
  const[equipamentos,setEquipamentos]=useState([]);
  const[modelos,setModelos]=useState([]);
  const[fornecedores,setFornecedores]=useState([]);
  const[filters,setFilters]=useState({equipamento:"",filialId:"",modelo:"",numeroSerie:"",fornecedorId:"",portas:"",status:""});
  const[applied,setApplied]=useState(null);
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState(null);

  useEffect(()=>{
    api.get("/filiais/basic").then(r=>setFiliais(Array.isArray(r)?r:[])).catch(()=>{});
    api.get("/firewall").then(r=>{
      const list=Array.isArray(r)?r:[];
      setEquipamentos([...new Set(list.map(f=>f.equipamento).filter(Boolean))].sort());
      setModelos([...new Set(list.map(f=>f.modelo).filter(Boolean))].sort());
    }).catch(()=>{});
    api.get("/suppliers").then(r=>setFornecedores(Array.isArray(r)?r:[])).catch(()=>{});
  },[]);

  function applyFilters(){
    setApplied({...filters});
  }

  useEffect(()=>{
    if(applied===null)return;
    setLoading(true);setErr(null);
    const params=new URLSearchParams();
    if(applied.equipamento)params.set("equipamento",applied.equipamento);
    if(applied.filialId)params.set("filialId",applied.filialId);
    if(applied.modelo)params.set("modelo",applied.modelo);
    if(applied.numeroSerie)params.set("numeroSerie",applied.numeroSerie);
    if(applied.fornecedorId){
      const s=fornecedores.find(f=>f.id===applied.fornecedorId);
      if(s)params.set("provedor",s.name);
    }
    if(applied.portas)params.set("portas",applied.portas);
    if(applied.status)params.set("status",applied.status);
    api.get("/firewall/report?"+params.toString())
      .then(r=>{setItems(Array.isArray(r)?r:[]);setLoading(false);})
      .catch(e=>{setErr("Erro ao carregar relatório: "+(e?.message||""));setLoading(false);});
  },[applied]);

  if(!p?.view)return<div style={{padding:32,color:C.danger}}>Sem permissão.</div>;

  const fSet=(k,v)=>setFilters(f=>({...f,[k]:v}));

  function exportPdf(){
    const doc=new jsPDF({orientation:"landscape"});
    doc.setFontSize(14);
    doc.text("Relatório de Firewall",14,15);
    let y=22;
    items.forEach((fw,idx)=>{
      if(idx>0){doc.addPage();y=15;}
      doc.setFontSize(11);
      doc.setFont(undefined,"bold");
      doc.text(fw.equipamento,14,y);
      doc.setFont(undefined,"normal");
      doc.setFontSize(9);
      const meta=[
        fw.filialNome&&`Filial: ${fw.filialNome}`,
        fw.modelo&&`Modelo: ${fw.modelo}`,
        fw.numeroSerie&&`Nº Série: ${fw.numeroSerie}`,
        fw.firmware&&`Firmware: ${fw.firmware}`,
        fw.redeNativa&&`Rede Nativa: ${fw.redeNativa}`,
      ].filter(Boolean).join("   ");
      if(meta){doc.text(meta,14,y+5);y+=10;}else{y+=6;}

      doc.setFontSize(10);doc.setFont(undefined,"bold");
      doc.text("VLANs",14,y+2);doc.setFont(undefined,"normal");y+=4;
      const fwVlans=fw.vlans||[];
      const fwLinks=fw.links||[];
      if(fwVlans.length===0){
        doc.setFontSize(9);doc.text("Nenhuma VLAN vinculada.",14,y+4);y+=8;
      }else{
        autoTable(doc,{
          startY:y,margin:{left:14},
          head:[["Nome / Descrição","Faixa CIDR","Primeiro IP","Último IP","Vlan Id","Tipo"]],
          body:fwVlans.map(v=>{const ci=cidrInfo(v.ipRange)||{};return[v.rangeNome||"—",v.ipRange||"—",ci.firstIp||"—",ci.lastIp||"—",v.vlanId??"—",v.tipo||"—"];}),
          styles:{fontSize:8},headStyles:{fillColor:[37,99,235]},
          theme:"striped",
        });
        y=doc.lastAutoTable.finalY+6;
      }

      doc.setFontSize(10);doc.setFont(undefined,"bold");
      doc.text("Links Vinculados",14,y+2);doc.setFont(undefined,"normal");y+=4;
      if(fwLinks.length===0){
        doc.setFontSize(9);doc.text("Nenhum link vinculado.",14,y+4);y+=8;
      }else{
        autoTable(doc,{
          startY:y,margin:{left:14},
          head:[["Provedor","Portas","IP Fixo"]],
          body:fwLinks.map(l=>[l.provedorLabel||"—",l.portas||"—",l.ipFixo||"—"]),
          styles:{fontSize:8},headStyles:{fillColor:[37,99,235]},
          theme:"striped",
        });
        y=doc.lastAutoTable.finalY+6;
      }
    });
    doc.save("relatorio-firewall.pdf");
  }

  function exportExcel(){
    const wb=XLSX.utils.book_new();
    // Aba resumo
    const resumoData=[["Equipamento","Filial","Modelo","Nº Série","Firmware","Rede Nativa","VLANs","Links"]];
    items.forEach(fw=>resumoData.push([
      fw.equipamento,fw.filialNome||"",fw.modelo||"",fw.numeroSerie||"",fw.firmware||"",fw.redeNativa||"",
      (fw.vlans||[]).length,(fw.links||[]).length,
    ]));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(resumoData),"Resumo");

    // Aba VLANs
    const vlanData=[["Equipamento","Nome / Descrição","Faixa CIDR","Primeiro IP","Último IP","Vlan Id","Tipo"]];
    items.forEach(fw=>(fw.vlans||[]).forEach(v=>{
      const ci=cidrInfo(v.ipRange)||{};
      vlanData.push([fw.equipamento,v.rangeNome||"",v.ipRange||"",ci.firstIp||"",ci.lastIp||"",v.vlanId??"",v.tipo||""]);
    }));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(vlanData),"VLANs");

    // Aba Links
    const linksData=[["Equipamento","Provedor","Portas","IP Fixo"]];
    items.forEach(fw=>(fw.links||[]).forEach(l=>{
      linksData.push([fw.equipamento,l.provedorLabel||"",l.portas||"",l.ipFixo||""]);
    }));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(linksData),"Links Vinculados");

    XLSX.writeFile(wb,"relatorio-firewall.xlsx");
  }

  return(
    <div style={{padding:24,maxWidth:1100}}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>🔥 Relatório de Firewall</span>
        <div style={{display:"flex",gap:8}}>
          <button style={S.btnSave} onClick={exportPdf} disabled={items.length===0}>⬇ PDF</button>
          <button style={S.btnSave} onClick={exportExcel} disabled={items.length===0}>⬇ Excel</button>
        </div>
      </div>
      {/* Filtros */}
      <div style={{background:C.surface,borderRadius:8,padding:16,marginBottom:20,display:"flex",flexWrap:"wrap",gap:12,alignItems:"flex-end"}}>
        <div style={{flex:"1 1 160px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Equipamento</div>
          <SelectField value={filters.equipamento} onChange={v=>fSet("equipamento",v)} options={[{value:"",label:"Todos"},...equipamentos.map(e=>({value:e,label:e}))]}/>
        </div>
        <div style={{flex:"1 1 160px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Filial</div>
          <SelectField value={filters.filialId} onChange={v=>fSet("filialId",v)} options={[{value:"",label:"Todas"},...filiais.map(f=>({value:f.id,label:f.nome}))]}/>
        </div>
        <div style={{flex:"1 1 140px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Modelo</div>
          <SelectField value={filters.modelo} onChange={v=>fSet("modelo",v)} options={[{value:"",label:"Todos"},...modelos.map(m=>({value:m,label:m}))]}/>
        </div>
        <div style={{flex:"1 1 140px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Nº Série</div>
          <Input value={filters.numeroSerie} onChange={v=>fSet("numeroSerie",v)} placeholder="Buscar..." onKeyDown={e=>e.key==="Enter"&&applyFilters()}/>
        </div>
        <div style={{flex:"1 1 160px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Provedor</div>
          <SelectField value={filters.fornecedorId} onChange={v=>fSet("fornecedorId",v)} options={[{value:"",label:"Todos"},...fornecedores.map(s=>({value:s.id,label:s.name}))]}/>
        </div>
        <div style={{flex:"1 1 120px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Portas</div>
          <Input value={filters.portas} onChange={v=>fSet("portas",v)} placeholder="Buscar..." onKeyDown={e=>e.key==="Enter"&&applyFilters()}/>
        </div>
        <div style={{flex:"1 1 120px"}}>
          <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Status</div>
          <SelectField value={filters.status} onChange={v=>fSet("status",v)} options={[{value:"",label:"Todos"},{value:"Ativo",label:"Ativo"},{value:"Inativo",label:"Inativo"}]}/>
        </div>
        <button onClick={applyFilters} style={{...S.btn,background:C.primary,color:C.white,padding:"8px 20px",whiteSpace:"nowrap"}}>Aplicar</button>
      </div>

      {loading&&<div style={{textAlign:"center",padding:32}}><Spinner/></div>}
      {err&&<div style={{color:C.danger,padding:12}}>{err}</div>}
      {applied!==null&&!loading&&!err&&items.length===0&&(
        <div style={{color:C.muted,padding:24,textAlign:"center"}}>Nenhum resultado encontrado.</div>
      )}
      {applied===null&&!loading&&(
        <div style={{color:C.muted,padding:24,textAlign:"center"}}>Utilize os filtros acima e clique em Aplicar para gerar o relatório.</div>
      )}

      {items.map(fw=>{
        const vlans=fw.vlans||[];
        const links=fw.links||[];
        return(
        <div key={fw.id} style={{background:C.surface,borderRadius:8,marginBottom:20,overflow:"hidden",border:`1px solid ${C.border}`}}>
          {/* Cabeçalho do equipamento */}
          <div style={{background:C.primary,padding:"10px 16px",display:"flex",flexWrap:"wrap",gap:16}}>
            <span style={{color:C.white,fontWeight:700,fontSize:15}}>{fw.equipamento}</span>
            {fw.filialNome&&<span style={{color:"rgba(255,255,255,0.85)",fontSize:13}}>Filial: {fw.filialNome}</span>}
            {fw.modelo&&<span style={{color:"rgba(255,255,255,0.85)",fontSize:13}}>Modelo: {fw.modelo}</span>}
            {fw.numeroSerie&&<span style={{color:"rgba(255,255,255,0.85)",fontSize:13}}>Nº Série: {fw.numeroSerie}</span>}
            {fw.firmware&&<span style={{color:"rgba(255,255,255,0.85)",fontSize:13}}>Firmware: {fw.firmware}</span>}
            {fw.redeNativa&&<span style={{color:"rgba(255,255,255,0.85)",fontSize:13}}>Rede Nativa: {fw.redeNativa}</span>}
          </div>
          <div style={{padding:16,display:"flex",flexDirection:"column",gap:16}}>
            {/* VLANs */}
            <div>
              <div style={{fontWeight:600,fontSize:13,color:C.muted,marginBottom:8}}>VLANs</div>
              {vlans.length===0
                ? <div style={{color:C.muted,fontSize:12,fontStyle:"italic"}}>Nenhuma VLAN vinculada.</div>
                : <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead>
                        <tr style={{background:C.hover}}>
                          <th style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontWeight:600}}>Nome / Descrição</th>
                          <th style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontWeight:600}}>Faixa CIDR</th>
                          <th style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontWeight:600}}>Primeiro IP</th>
                          <th style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontWeight:600}}>Último IP</th>
                          <th style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontWeight:600}}>Vlan Id</th>
                          <th style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontWeight:600}}>Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vlans.map((v,i)=>{
                          const ci=cidrInfo(v.ipRange)||{};
                          return(
                            <tr key={i} style={{borderTop:`1px solid ${C.border}`}}>
                              <td style={{padding:"6px 10px"}}>{v.rangeNome||"—"}</td>
                              <td style={{padding:"6px 10px",fontFamily:"monospace"}}>{v.ipRange||"—"}</td>
                              <td style={{padding:"6px 10px",fontFamily:"monospace"}}>{ci.firstIp||"—"}</td>
                              <td style={{padding:"6px 10px",fontFamily:"monospace"}}>{ci.lastIp||"—"}</td>
                              <td style={{padding:"6px 10px"}}>{v.vlanId??"—"}</td>
                              <td style={{padding:"6px 10px"}}>{v.tipo||"—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
            {/* Links Vinculados */}
            <div>
              <div style={{fontWeight:600,fontSize:13,color:C.muted,marginBottom:8}}>Links Vinculados</div>
              {links.length===0
                ? <div style={{color:C.muted,fontSize:12,fontStyle:"italic"}}>Nenhum link vinculado.</div>
                : <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                      <thead>
                        <tr style={{background:C.hover}}>
                          <th style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontWeight:600}}>Provedor</th>
                          <th style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontWeight:600}}>Portas</th>
                          <th style={{textAlign:"left",padding:"6px 10px",color:C.muted,fontWeight:600}}>IP Fixo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {links.map((l,i)=>(
                          <tr key={i} style={{borderTop:`1px solid ${C.border}`}}>
                            <td style={{padding:"6px 10px"}}>{l.provedorLabel||"—"}</td>
                            <td style={{padding:"6px 10px"}}>{l.portas||"—"}</td>
                            <td style={{padding:"6px 10px",fontFamily:"monospace"}}>{l.ipFixo||"—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}

// ── CADASTRO DE CCUSTO (s44) ─────────────────────────────────
function CcustoConsumoScreen({user}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  const[delId,setDelId]=useState(null);
  const[err,setErr]=useState("");
  const[csvImpModal,setCsvImpModal]=useState(false);
  const[csvImpRows,setCsvImpRows]=useState(null);
  const[csvImpBusy,setCsvImpBusy]=useState(false);
  const[filterCC,setFilterCC]=useState({centroCusto:"",descricao:""});
  const isMobile=useIsMobile();
  const load=()=>api.get("/consumo-ccusto").then(setItems).catch(()=>{}).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);
  const save=async()=>{
    if(!modal.centroCusto?.trim()){setErr("Centro de Custo é obrigatório.");return;}
    try{
      if(modal.id) await api.put(`/consumo-ccusto/${modal.id}`,{centroCusto:modal.centroCusto,descricao:modal.descricao||""});
      else         await api.post("/consumo-ccusto",{centroCusto:modal.centroCusto,descricao:modal.descricao||""});
      setModal(null);load();
    }catch(e){setErr(e?.error||e.message);}
  };
  const del=async()=>{
    try{await api.delete(`/consumo-ccusto/${delId}`);setDelId(null);load();}
    catch(e){alert(e?.error||e.message);}
  };
  const canI=act=>user.permissions?.s44?.[act];
  const handleCsvImpFile=e=>{
    const f=e.target.files[0]; e.target.value=""; if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{const{rows}=parseCSVGeneric(ev.target.result);setCsvImpRows(rows);};
    r.readAsText(f,"UTF-8");
  };
  const processarCsvImp=async()=>{
    if(!csvImpRows?.length){alert("Nenhum dado válido no arquivo.");return;}
    setCsvImpBusy(true);
    try{
      const res=await api.post("/consumo-ccusto/importar",{linhas:csvImpRows});
      alert(`✅ Importação concluída!\nInseridos: ${res.inseridos}\nIgnorados (duplicados): ${res.ignorados}`);
      setCsvImpModal(false);setCsvImpRows(null);load();
    }catch(e){alert("❌ "+( e?.error||e.message));}
    setCsvImpBusy(false);
  };
  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>Cadastro de CCusto</span>
        <div style={{display:"flex",gap:8}}>
          {canI("insert")&&<button style={{...S.btnAdd,background:"#7B68EE"}} onClick={()=>{setCsvImpRows(null);setCsvImpModal(true);}}>📥 Importar</button>}
          {canI("insert")&&<button style={S.btnAdd} onClick={()=>{setErr("");setModal({centroCusto:"",descricao:""});}}>+ Novo CCusto</button>}
        </div>
      </div>
      {!loading&&items.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input placeholder="Centro de Custo" value={filterCC.centroCusto} onChange={e=>setFilterCC(f=>({...f,centroCusto:e.target.value}))} style={{...S.input,flex:"1 1 180px",minWidth:140,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Descrição Ccusto" value={filterCC.descricao} onChange={e=>setFilterCC(f=>({...f,descricao:e.target.value}))} style={{...S.input,flex:"1 1 180px",minWidth:140,padding:"6px 10px",fontSize:13}}/>
      </div>}
      {loading?<Spinner/>:items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>💰</span>Nenhum CCusto cadastrado</div>:(()=>{
        const fltCC=items.filter(item=>(!filterCC.centroCusto||(item.centroCusto||"").toLowerCase().includes(filterCC.centroCusto.toLowerCase()))&&(!filterCC.descricao||(item.descricao||"").toLowerCase().includes(filterCC.descricao.toLowerCase())));
        return isMobile
          ?<MobileCardList items={fltCC} columns={[{key:"centroCusto",label:"Centro de Custo"},{key:"descricao",label:"Descrição Ccusto"}]} actions={item=>(
            <>{canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({id:item.id,centroCusto:item.centroCusto,descricao:item.descricao||""});}}>Editar</button>}
              {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}</>
          )}/>
          :<table style={S.table}><thead><tr>
            <th style={S.th}>Centro de Custo</th>
            <th style={S.th}>Descrição Ccusto</th>
            <th style={{...S.th,width:140}}>Ações</th>
          </tr></thead>
          <tbody>{fltCC.map(item=>(
            <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={S.td}>{item.centroCusto}</td>
              <td style={S.td}>{item.descricao||"—"}</td>
              <td style={S.td}>
                {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({id:item.id,centroCusto:item.centroCusto,descricao:item.descricao||""});}}>Editar</button>}
                {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>Excluir</button>}
              </td>
            </tr>
          ))}</tbody></table>
      ;})()}
      {modal&&<Modal title={modal.id?"Editar CCusto":"Novo CCusto"} onClose={()=>setModal(null)}>
        <Input label="Centro de Custo" value={modal.centroCusto} onChange={v=>setModal(m=>({...m,centroCusto:v}))} required/>
        <Input label="Descrição Ccusto" value={modal.descricao||""} onChange={v=>setModal(m=>({...m,descricao:v}))}/>
        {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
          <button style={S.btnSave} onClick={save}>Salvar</button>
        </div>
      </Modal>}
      {delId&&<ConfirmModal msg="Excluir este CCusto?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
      {csvImpModal&&(
        <Modal title="Importar CCustos via CSV" onClose={()=>{setCsvImpModal(false);setCsvImpRows(null);}}>
          <p style={{fontSize:12,color:C.textLight,marginBottom:12}}>CSV com colunas: <strong>Centro de Custo</strong>, <strong>Descrição Ccusto</strong></p>
          <label style={{...S.btnAdd,cursor:"pointer",display:"inline-block",marginBottom:12}}>
            📂 Selecionar arquivo CSV
            <input type="file" accept=".csv" style={{display:"none"}} onChange={handleCsvImpFile}/>
          </label>
          {csvImpRows&&<div style={{fontSize:12,color:C.success,fontWeight:600,marginBottom:12}}>✅ {csvImpRows.length} linha(s) prontas para importar</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>{setCsvImpModal(false);setCsvImpRows(null);}}>Cancelar</button>
            <button style={{...S.btnSave,background:C.success}} onClick={processarCsvImp} disabled={!csvImpRows||csvImpBusy}>
              {csvImpBusy?"Processando...":"⚙️ Processar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── CADASTRO DE ÍTENS (s45) ───────────────────────────────────
function ItensConsumoScreen({user}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  const[delId,setDelId]=useState(null);
  const[err,setErr]=useState("");
  const isMobile=useIsMobile();
  const load=()=>api.get("/consumo-itens").then(setItems).catch(()=>{}).finally(()=>setLoading(false));
  useEffect(()=>{load();},[]);
  const save=async()=>{
    if(!modal.item?.trim()){setErr("Item é obrigatório.");return;}
    try{
      if(modal.id) await api.put(`/consumo-itens/${modal.id}`,{item:modal.item});
      else         await api.post("/consumo-itens",{item:modal.item});
      setModal(null);load();
    }catch(e){setErr(e?.error||e.message);}
  };
  const del=async()=>{
    try{await api.delete(`/consumo-itens/${delId}`);setDelId(null);load();}
    catch(e){alert(e?.error||e.message);}
  };
  const[filterIt,setFilterIt]=useState({item:""});
  const canI=act=>user.permissions?.s45?.[act];
  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>Cadastro de Ítens</span>
        {canI("insert")&&<button style={S.btnAdd} onClick={()=>{setErr("");setModal({item:""});}}>+ Novo Item</button>}
      </div>
      {!loading&&items.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input placeholder="Item" value={filterIt.item} onChange={e=>setFilterIt(f=>({...f,item:e.target.value}))} style={{...S.input,flex:"1 1 220px",minWidth:180,padding:"6px 10px",fontSize:13}}/>
      </div>}
      {loading?<Spinner/>:items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📦</span>Nenhum item cadastrado</div>:(()=>{
        const fltIt=items.filter(i=>!filterIt.item||(i.item||"").toLowerCase().includes(filterIt.item.toLowerCase()));
        return isMobile
          ?<MobileCardList items={fltIt} columns={[{key:"item",label:"Item"}]} actions={i=>(
            <>{canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({id:i.id,item:i.item});}}>Editar</button>}
              {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(i.id)}>Excluir</button>}</>
          )}/>
          :<table style={S.table}><thead><tr>
            <th style={S.th}>Item</th>
            <th style={{...S.th,width:140}}>Ações</th>
          </tr></thead>
          <tbody>{fltIt.map(i=>(
            <tr key={i.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={S.td}>{i.item}</td>
              <td style={S.td}>
                {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>{setErr("");setModal({id:i.id,item:i.item});}}>Editar</button>}
                {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(i.id)}>Excluir</button>}
              </td>
            </tr>
          ))}</tbody></table>
      ;})()}
      {modal&&<Modal title={modal.id?"Editar Item":"Novo Item"} onClose={()=>setModal(null)}>
        <Input label="Item" value={modal.item} onChange={v=>setModal(m=>({...m,item:v}))} required/>
        {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
          <button style={S.btnSave} onClick={save}>Salvar</button>
        </div>
      </Modal>}
      {delId&&<ConfirmModal msg="Excluir este item?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── CADASTRO DE ESTOQUE (s46) ─────────────────────────────────
function EstoquesConsumoScreen({user}){
  const[items,setItems]=useState([]);
  const[ccustos,setCcustos]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  const[delId,setDelId]=useState(null);
  const[err,setErr]=useState("");
  const isMobile=useIsMobile();
  const load=()=>{
    Promise.all([api.get("/consumo-estoques"),api.get("/consumo-ccusto/basic")])
      .then(([e,c])=>{setItems(Array.isArray(e)?e:[]);setCcustos(Array.isArray(c)?c:[]);})
      .catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);
  const save=async()=>{
    if(!modal.estoque?.trim()){setErr("Estoque é obrigatório.");return;}
    try{
      const body={estoque:modal.estoque,ccustoEstoqueId:modal.ccustoEstoqueId||null};
      if(modal.id) await api.put(`/consumo-estoques/${modal.id}`,body);
      else         await api.post("/consumo-estoques",body);
      setModal(null);load();
    }catch(e){setErr(e?.error||e.message);}
  };
  const del=async()=>{
    try{await api.delete(`/consumo-estoques/${delId}`);setDelId(null);load();}
    catch(e){alert(e?.error||e.message);}
  };
  const canI=act=>user.permissions?.s46?.[act];
  const openEdit=i=>{setErr("");setModal({id:i.id,estoque:i.estoque,ccustoEstoqueId:i.ccustoEstoqueId||""});};
  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>Cadastro de Estoque</span>
        {canI("insert")&&<button style={S.btnAdd} onClick={()=>{setErr("");setModal({estoque:"",ccustoEstoqueId:""});}}>+ Novo Estoque</button>}
      </div>
      {loading?<Spinner/>:items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>🗄️</span>Nenhum estoque cadastrado</div>:(
        isMobile
          ?<MobileCardList items={items} columns={[{key:"estoque",label:"Estoque"},{key:"ccustoEstoque",label:"CCusto Estoque"}]} actions={i=>(
            <>{canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(i)}>Editar</button>}
              {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(i.id)}>Excluir</button>}</>
          )}/>
          :<table style={S.table}><thead><tr>
            <th style={S.th}>Estoque</th>
            <th style={S.th}>CCusto Estoque</th>
            <th style={{...S.th,width:140}}>Ações</th>
          </tr></thead>
          <tbody>{items.map(i=>(
            <tr key={i.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={S.td}>{i.estoque}</td>
              <td style={S.td}>{i.ccustoEstoque||"—"}</td>
              <td style={S.td}>
                {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(i)}>Editar</button>}
                {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(i.id)}>Excluir</button>}
              </td>
            </tr>
          ))}</tbody></table>
      )}
      {modal&&<Modal title={modal.id?"Editar Estoque":"Novo Estoque"} onClose={()=>setModal(null)}>
        <Input label="Estoque" value={modal.estoque} onChange={v=>setModal(m=>({...m,estoque:v}))} required/>
        <SelectField label="CCusto Estoque" value={modal.ccustoEstoqueId||""} onChange={v=>setModal(m=>({...m,ccustoEstoqueId:v}))}
          options={[{value:"",label:"Nenhum"},...ccustos.map(c=>({value:c.id,label:c.centroCusto}))]}/>
        {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
          <button style={S.btnSave} onClick={save}>Salvar</button>
        </div>
      </Modal>}
      {delId&&<ConfirmModal msg="Excluir este estoque?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── MOVIMENTAÇÃO DE ÍTENS (s47) — read-only ───────────────────
function MovimentacaoItensScreen({user}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[filterStatus,setFilterStatus]=useState("");
  const[filterMov,setFilterMov]=useState({numSol:"",dataInicio:"",dataFim:"",item:"",estoque:"",ccustoDespesa:""});
  const fmtDate=d=>{if(!d)return"—";const dt=new Date(d);return`${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}/${dt.getUTCFullYear()}`;};
  const load=()=>{
    setLoading(true);
    const q=filterStatus?`?status=${encodeURIComponent(filterStatus)}`:"";
    api.get(`/consumo-movimentacao${q}`).then(setItems).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);
  const statusBadge=s=>{
    if(s==="Processado")       return<span style={{...S.badge,...S.badgeActive}}>Processado</span>;
    if(s==="Aguardando Compra")return<span style={{...S.badge,background:"#DBEAFE",color:"#1D4ED8"}}>Aguardando Compra</span>;
    if(s==="Em Estoque")       return<span style={{...S.badge,background:"#D1FAE5",color:"#065F46"}}>Em Estoque</span>;
    if(s==="Consumido")        return<span style={{...S.badge,background:"#EDE9FE",color:"#5B21B6"}}>Consumido</span>;
    return<span style={{...S.badge,background:"#FEF3C7",color:"#D97706"}}>{s||"Não Processado"}</span>;
  };
  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>Movimentação de Ítens</span>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap",marginBottom:8,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
        <div style={{flex:"1 1 160px"}}>
          <SelectField label="Status" value={filterStatus} onChange={setFilterStatus}
            options={[{value:"",label:"Todos"},{value:"Não Processado",label:"Não Processado"},{value:"Aguardando Compra",label:"Aguardando Compra"},{value:"Em Estoque",label:"Em Estoque"},{value:"Consumido",label:"Consumido"},{value:"Processado",label:"Processado"}]}/>
        </div>
        <div style={{paddingBottom:18}}>
          <button style={S.btnSave} onClick={load}>Filtrar</button>
        </div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input placeholder="Num Sol." value={filterMov.numSol} onChange={e=>setFilterMov(f=>({...f,numSol:e.target.value}))} style={{...S.input,flex:"1 1 100px",minWidth:90,padding:"6px 10px",fontSize:13}}/>
        <input type="date" value={filterMov.dataInicio} onChange={e=>setFilterMov(f=>({...f,dataInicio:e.target.value}))} title="Data início" style={{...S.input,flex:"1 1 140px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input type="date" value={filterMov.dataFim} onChange={e=>setFilterMov(f=>({...f,dataFim:e.target.value}))} title="Data fim" style={{...S.input,flex:"1 1 140px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Item" value={filterMov.item} onChange={e=>setFilterMov(f=>({...f,item:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Estoque" value={filterMov.estoque} onChange={e=>setFilterMov(f=>({...f,estoque:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="CCusto Despesa" value={filterMov.ccustoDespesa} onChange={e=>setFilterMov(f=>({...f,ccustoDespesa:e.target.value}))} style={{...S.input,flex:"1 1 150px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
      </div>
      {loading?<Spinner/>:items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Nenhuma movimentação encontrada</div>:(()=>{
        const fltMov=items.filter(i=>{const d=(i.data||"").slice(0,10);return(!filterMov.numSol||String(i.numSolicitacao||"").includes(filterMov.numSol))&&(!filterMov.dataInicio||d>=filterMov.dataInicio)&&(!filterMov.dataFim||d<=filterMov.dataFim)&&(!filterMov.item||(i.item||"").toLowerCase().includes(filterMov.item.toLowerCase()))&&(!filterMov.estoque||(i.estoque||"").toLowerCase().includes(filterMov.estoque.toLowerCase()))&&(!filterMov.ccustoDespesa||(i.ccustoDespesa||"").toLowerCase().includes(filterMov.ccustoDespesa.toLowerCase()));});
        return(
        <div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Num Sol.","Data","Item","Estoque","CCusto Despesa","Desc Ccusto Despesa","Qtde Estoque","CCusto Consumidor","Desc Ccusto Consumidor","Qtde Consumida","Qtde Solicitada","Status"].map(h=>(
              <th key={h} style={{...S.th,whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{fltMov.map(i=>(
            <tr key={i.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={{...S.td,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{i.numSolicitacao||"—"}</td>
              <td style={{...S.td,whiteSpace:"nowrap"}}>{fmtDate(i.data)}</td>
              <td style={S.td}>{i.item||"—"}</td>
              <td style={S.td}>{i.estoque||"—"}</td>
              <td style={S.td}>{i.ccustoDespesa||"—"}</td>
              <td style={S.td}>{i.descCcustoDespesa||"—"}</td>
              <td style={{...S.td,textAlign:"center"}}>{i.qtdeEstoque??0}</td>
              <td style={S.td}>{i.ccustoConsumidor||"—"}</td>
              <td style={S.td}>{i.descCcustoConsumidor||"—"}</td>
              <td style={{...S.td,textAlign:"center"}}>{i.qtdeConsumida??0}</td>
              <td style={{...S.td,textAlign:"center"}}>{i.qtdeSolicitada??0}</td>
              <td style={S.td}>{statusBadge(i.status)}</td>
            </tr>
          ))}</tbody></table>
        </div>
        );
      })()}
    </div>
  );
}

// ── SOLICITAÇÃO DE ÍTENS (s48) ────────────────────────────────
function SolicitacaoItensScreen({user}){
  const[items,setItems]=useState([]);
  const[itens,setItens]=useState([]);
  const[estoques,setEstoques]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  const[err,setErr]=useState("");
  const[delId,setDelId]=useState(null);
  const today=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
  const fmtDate=d=>{if(!d)return"—";const dt=new Date(d);return`${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}/${dt.getUTCFullYear()}`;};
  const load=()=>{
    setLoading(true);
    Promise.all([api.get("/consumo-solicitacao"),api.get("/consumo-itens/basic"),api.get("/consumo-estoques/basic")])
      .then(([s,i,e])=>{setItems(Array.isArray(s)?s:[]);setItens(Array.isArray(i)?i:[]);setEstoques(Array.isArray(e)?e:[]);})
      .catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);
  const openNew=()=>{setErr("");setModal({data:today(),itemId:"",estoqueId:"",qtdeSolicitada:""});};
  const save=async()=>{
    if(!modal.data||!modal.itemId||!modal.estoqueId||!modal.qtdeSolicitada){setErr("Todos os campos são obrigatórios.");return;}
    try{
      await api.post("/consumo-solicitacao",{data:modal.data,itemId:modal.itemId,estoqueId:modal.estoqueId,qtdeSolicitada:Number(modal.qtdeSolicitada)});
      setModal(null);load();
    }catch(e){setErr(e?.error||e.message);}
  };
  const del=()=>api.delete(`/consumo-solicitacao/${delId}`).then(()=>{setDelId(null);load();}).catch(e=>alert(e?.error||e.message));
  const[filterSol,setFilterSol]=useState({numSol:"",dataInicio:"",dataFim:"",item:"",estoque:"",ccustoDespesa:""});
  const canI=act=>user.permissions?.s48?.[act];
  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>Solicitação de Ítens</span>
        {canI("insert")&&<button style={S.btnAdd} onClick={openNew}>+ Nova Solicitação</button>}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input placeholder="Num Solicitação" value={filterSol.numSol} onChange={e=>setFilterSol(f=>({...f,numSol:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input type="date" value={filterSol.dataInicio} onChange={e=>setFilterSol(f=>({...f,dataInicio:e.target.value}))} title="Data início" style={{...S.input,flex:"1 1 140px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input type="date" value={filterSol.dataFim} onChange={e=>setFilterSol(f=>({...f,dataFim:e.target.value}))} title="Data fim" style={{...S.input,flex:"1 1 140px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Item" value={filterSol.item} onChange={e=>setFilterSol(f=>({...f,item:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Estoque" value={filterSol.estoque} onChange={e=>setFilterSol(f=>({...f,estoque:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="CCusto Despesa" value={filterSol.ccustoDespesa} onChange={e=>setFilterSol(f=>({...f,ccustoDespesa:e.target.value}))} style={{...S.input,flex:"1 1 150px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
      </div>
      {loading?<Spinner/>:items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Nenhuma solicitação cadastrada</div>:(()=>{
        const fltSol=items.filter(i=>{const d=(i.data||"").slice(0,10);return(!filterSol.numSol||String(i.numero||"").includes(filterSol.numSol))&&(!filterSol.dataInicio||d>=filterSol.dataInicio)&&(!filterSol.dataFim||d<=filterSol.dataFim)&&(!filterSol.item||(i.item||"").toLowerCase().includes(filterSol.item.toLowerCase()))&&(!filterSol.estoque||(i.estoque||"").toLowerCase().includes(filterSol.estoque.toLowerCase()))&&(!filterSol.ccustoDespesa||(i.ccustoDespesa||"").toLowerCase().includes(filterSol.ccustoDespesa.toLowerCase()));});
        return(
        <div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Num Solicitação","Data","Item","Estoque","Qtde Solicitada","Qtde Atendida","Status","Ações"].map(h=>(
              <th key={h} style={{...S.th,whiteSpace:"nowrap"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{fltSol.map(i=>(
            <tr key={i.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={{...S.td,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{i.numero||"—"}</td>
              <td style={{...S.td,whiteSpace:"nowrap"}}>{fmtDate(i.data)}</td>
              <td style={S.td}>{i.item||"—"}</td>
              <td style={S.td}>{i.estoque||"—"}</td>
              <td style={{...S.td,textAlign:"center"}}>{i.qtdeSolicitada??0}</td>
              <td style={{...S.td,textAlign:"center"}}>{i.qtdeAtendida??0}</td>
              <td style={S.td}>
                <span style={{...S.badge,...S.badgeActive}}>Processado</span>
              </td>
              <td style={S.td}>
                {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(i.id)}>Excluir</button>}
              </td>
            </tr>
          ))}</tbody></table>
        </div>
        );
      })()}
      {modal&&<Modal title="Nova Solicitação" onClose={()=>setModal(null)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <div style={S.formRow}>
            <label style={S.label}>Data *</label>
            <input type="date" value={modal.data} onChange={e=>setModal(m=>({...m,data:e.target.value}))} style={S.input}/>
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Qtde Solicitada *</label>
            <input type="number" min="1" value={modal.qtdeSolicitada} onChange={e=>setModal(m=>({...m,qtdeSolicitada:e.target.value}))} style={S.input}/>
          </div>
        </div>
        <SelectField label="Item" value={modal.itemId} onChange={v=>setModal(m=>({...m,itemId:v}))} required
          options={[{value:"",label:"Selecione..."},...itens.map(i=>({value:i.id,label:i.item}))]}/>
        <SelectField label="Estoque" value={modal.estoqueId} onChange={v=>setModal(m=>({...m,estoqueId:v}))} required
          options={[{value:"",label:"Selecione..."},...estoques.map(e=>({value:e.id,label:e.estoque}))]}/>
        {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
          <button style={S.btnSave} onClick={save}>Salvar</button>
        </div>
      </Modal>}
      {delId&&<ConfirmModal msg="Excluir esta solicitação? As movimentações geradas serão removidas." onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── ENTREGA DE ÍTENS (s49) ─────────────────────────────────────
function EntregaItensScreen({user}){
  const[items,setItems]=useState([]);
  const[ccustos,setCcustos]=useState([]);
  const[funcionarios,setFuncionarios]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const[linhas,setLinhas]=useState([]);
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState("");
  const[delId,setDelId]=useState(null);
  const today=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
  const fmtDate=d=>{if(!d)return"—";const dt=new Date(d);return`${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}/${dt.getUTCFullYear()}`;};
  const load=()=>{
    setLoading(true);
    Promise.all([api.get("/consumo-entrega"),api.get("/consumo-ccusto/basic"),api.get("/relatorio-consumo/selects")])
      .then(([e,c,sl])=>{setItems(Array.isArray(e)?e:[]);setCcustos(Array.isArray(c)?c:[]);setFuncionarios(sl?.funcionarios||[]);})
      .catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);
  const openNew=()=>{
    setErr("");
    api.get("/consumo-entrega/disponiveis-agrupados").then(d=>{
      setLinhas((Array.isArray(d)?d:[]).map(l=>({...l,qtdeEntregue:"",data:today(),ccustoConsumidor:"",funcionarioId:"",observacao:""})));
      setModal(true);
    }).catch(()=>{});
  };
  const setLinha=(idx,field,val)=>setLinhas(ls=>ls.map((l,i)=>i!==idx?l:{...l,[field]:val}));
  const save=()=>{
    const itens=linhas.filter(l=>Number(l.qtdeEntregue)>0).map(l=>({itemId:l.itemId,estoqueId:l.estoqueId,qtdeEntregue:Number(l.qtdeEntregue),data:l.data,ccustoConsumidorId:ccustos.find(c=>c.centroCusto===l.ccustoConsumidor)?.id||null,funcionarioId:l.funcionarioId||null,observacao:l.observacao||null}));
    if(itens.length===0){setErr("Informe a Qtde Entregue em ao menos um item.");return;}
    const invalido=itens.find(l=>!l.data||!l.ccustoConsumidorId);
    if(invalido){setErr("Data e CCusto Consumidor são obrigatórios para cada item com Qtde Entregue.");return;}
    const excedido=linhas.find(l=>l.qtdeEntregue!==""&&Number(l.qtdeEntregue)>l.qtdeEstoque);
    if(excedido){setErr("Qtde Entregue não pode ser maior que Qtde Estoque.");return;}
    setSaving(true);setErr("");
    api.post("/consumo-entrega",{itens})
      .then(()=>{setModal(false);load();}).catch(e=>setErr(e?.error||"Erro ao salvar.")).finally(()=>setSaving(false));
  };
  const del=async()=>{
    try{await api.delete(`/consumo-entrega/${delId}`);setDelId(null);load();}
    catch(e){alert(e?.error||e.message);}
  };
  const[filterEnt,setFilterEnt]=useState({dataInicio:"",dataFim:"",item:"",estoque:"",ccustoConsumidor:"",funcionario:""});
  const canI=act=>user.permissions?.s49?.[act];
  const inputRO={...S.input,background:C.bg,cursor:"not-allowed",opacity:0.8};
  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>Entrega de Ítens</span>
        {canI("insert")&&<button style={S.btnAdd} onClick={openNew}>+ Nova Entrega</button>}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input type="date" value={filterEnt.dataInicio} onChange={e=>setFilterEnt(f=>({...f,dataInicio:e.target.value}))} title="Data início" style={{...S.input,flex:"1 1 140px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input type="date" value={filterEnt.dataFim} onChange={e=>setFilterEnt(f=>({...f,dataFim:e.target.value}))} title="Data fim" style={{...S.input,flex:"1 1 140px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Item" value={filterEnt.item} onChange={e=>setFilterEnt(f=>({...f,item:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Estoque" value={filterEnt.estoque} onChange={e=>setFilterEnt(f=>({...f,estoque:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="CCusto Consumidor" value={filterEnt.ccustoConsumidor} onChange={e=>setFilterEnt(f=>({...f,ccustoConsumidor:e.target.value}))} style={{...S.input,flex:"1 1 160px",minWidth:140,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Funcionário" value={filterEnt.funcionario} onChange={e=>setFilterEnt(f=>({...f,funcionario:e.target.value}))} style={{...S.input,flex:"1 1 150px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
      </div>
      {loading?<Spinner/>:items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📤</span>Nenhuma entrega registrada</div>:(()=>{
        const fltEnt=items.filter(i=>{const d=(i.data||"").slice(0,10);return(!filterEnt.dataInicio||d>=filterEnt.dataInicio)&&(!filterEnt.dataFim||d<=filterEnt.dataFim)&&(!filterEnt.item||(i.item||"").toLowerCase().includes(filterEnt.item.toLowerCase()))&&(!filterEnt.estoque||(i.estoque||"").toLowerCase().includes(filterEnt.estoque.toLowerCase()))&&(!filterEnt.ccustoConsumidor||(i.ccustoConsumidor||"").toLowerCase().includes(filterEnt.ccustoConsumidor.toLowerCase()))&&(!filterEnt.funcionario||(i.funcionario||"").toLowerCase().includes(filterEnt.funcionario.toLowerCase()));});
        return(
        <div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            <th style={S.th}>Data</th>
            <th style={S.th}>Item</th>
            <th style={S.th}>Estoque</th>
            <th style={S.th}>CCusto Consumidor</th>
            <th style={S.th}>Descrição Ccusto</th>
            <th style={S.th}>Funcionário</th>
            <th style={S.th}>Observação</th>
            <th style={{...S.th,width:100}}>Ações</th>
          </tr></thead>
          <tbody>{fltEnt.map(i=>(
            <tr key={i.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={{...S.td,whiteSpace:"nowrap"}}>{fmtDate(i.data)}</td>
              <td style={S.td}>{i.item||"—"}</td>
              <td style={S.td}>{i.estoque||"—"}</td>
              <td style={S.td}>{i.ccustoConsumidor||"—"}</td>
              <td style={S.td}>{i.descricaoCcusto||"—"}</td>
              <td style={S.td}>{i.funcionario||"—"}</td>
              <td style={S.td}>{i.observacao||"—"}</td>
              <td style={S.td}>
                {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(i.id)}>Excluir</button>}
              </td>
            </tr>
          ))}</tbody></table>
        </div>
        );
      })()}
      {modal&&<Modal title="Entrega de Ítens" onClose={()=>setModal(false)} extraWide>
        {linhas.length===0
          ?<div style={{padding:16,color:C.textLight,textAlign:"center"}}>Nenhum item disponível para entrega.</div>
          :<div style={{overflowX:"auto"}}>
            <table style={S.table}><thead><tr>
              {["Item","Estoque","Qtde Estoque","Qtde Entregue","Data","CCusto Consumidor","Descrição Ccusto","Funcionário","Observação"].map(h=>(
                <th key={h} style={{...S.th,whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{linhas.map((l,idx)=>(
              <tr key={`${l.itemId}-${l.estoqueId}`} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={{...S.td,minWidth:200}}><input value={l.item||""} readOnly style={{...inputRO,minWidth:180}}/></td>
                <td style={S.td}><input value={l.estoque||""} readOnly style={inputRO}/></td>
                <td style={{...S.td,textAlign:"center"}}><input value={l.qtdeEstoque} readOnly style={{...inputRO,textAlign:"center",width:70}}/></td>
                <td style={{...S.td,textAlign:"center"}}>
                  <input type="number" min="0" max={l.qtdeEstoque} value={l.qtdeEntregue}
                    onChange={e=>setLinha(idx,"qtdeEntregue",e.target.value)}
                    style={{...S.input,textAlign:"center",width:70}}/>
                </td>
                <td style={S.td}>
                  <input type="date" value={l.data}
                    onChange={e=>setLinha(idx,"data",e.target.value)}
                    style={{...S.input,width:140}}/>
                </td>
                <td style={S.td}>
                  <input value={l.ccustoConsumidor} onChange={e=>setLinha(idx,"ccustoConsumidor",e.target.value)}
                    style={{...S.input,minWidth:160}} placeholder="Digite o CCusto..."/>
                </td>
                <td style={S.td}>
                  <input value={ccustos.find(c=>c.centroCusto===l.ccustoConsumidor)?.descricao||""} readOnly style={{...inputRO,minWidth:160}}/>
                </td>
                <td style={{...S.td,minWidth:200}}>
                  <SelectField value={l.funcionarioId} onChange={v=>setLinha(idx,"funcionarioId",v)}
                    options={funcionarios.map(f=>({value:f.id,label:f.nome}))}
                    placeholder="Selecione..." label=""/>
                </td>
                <td style={S.td}>
                  <input value={l.observacao} onChange={e=>setLinha(idx,"observacao",e.target.value)}
                    style={{...S.input,minWidth:160}}/>
                </td>
              </tr>
            ))}</tbody></table>
          </div>
        }
        {err&&<div style={{...S.errorMsg,textAlign:"left",marginTop:8}}>{err}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
          <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
          <button style={S.btnSave} onClick={save} disabled={saving||linhas.length===0}>
            {saving?"Salvando...":"Salvar"}
          </button>
        </div>
      </Modal>}
      {delId&&<ConfirmModal msg="Excluir esta entrega e reverter a movimentação?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── RELATÓRIOS DE CONSUMO ─────────────────────────────────────
function useRelatorioSelects(){
  const[sl,setSl]=useState({itens:[],estoques:[],ccustos:[],funcionarios:[],ativos:[]});
  useEffect(()=>{api.get("/relatorio-consumo/selects").then(r=>setSl(r&&typeof r==="object"?r:sl)).catch(()=>{});},[]);
  return sl;
}
function FiltroBar({children,onFiltrar}){
  return(
    <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end",marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
      {children}
      <div><button style={{...S.btnSave,marginTop:20}} onClick={onFiltrar}>Filtrar</button></div>
    </div>
  );
}
function RelTabela({cols,rows,renderRow,empty="Nenhum dado encontrado"}){
  if(rows.length===0)return<div style={S.emptyState}><span style={S.emptyIcon}>📊</span>{empty}</div>;
  return(
    <div style={{overflowX:"auto"}}>
      <table style={S.table}><thead><tr>
        {cols.map(h=><th key={h} style={{...S.th,whiteSpace:"nowrap"}}>{h}</th>)}
      </tr></thead>
      <tbody>{rows.map((r,i)=>renderRow(r,i))}</tbody></table>
    </div>
  );
}

// s52 — Movimentação de Ítens - Detalhado
function RelMovDetalhadoScreen({user}){
  const sl=useRelatorioSelects();
  const[f,setF]=useState({numSol:"",dataInicio:"",dataFim:"",itemId:"",estoqueId:"",ccustoDespesaId:"",status:""});
  const[rows,setRows]=useState([]);
  const[loading,setLoading]=useState(false);
  const fmtDate=d=>{if(!d)return"—";const dt=new Date(d);return`${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}/${dt.getUTCFullYear()}`;};
  const load=()=>{setLoading(true);const q=new URLSearchParams();Object.entries(f).forEach(([k,v])=>{if(v)q.set(k,v);});api.get(`/relatorio-consumo/movimentacao-detalhado?${q}`).then(r=>setRows(Array.isArray(r)?r:[])).catch(()=>{}).finally(()=>setLoading(false));};
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const STATUSES=["Não Processado","Aguardando Compra","Em Estoque","Consumido","Processado"];
  const COLS=["Num Sol.","Data","Item","Estoque","CCusto Despesa","Status","Qtde Estoque","Qtde Consumida","Qtde Solicitada"];
  const rowArr=r=>[r.numSolicitacao||"",fmtDate(r.data),r.item||"",r.estoque||"",r.ccustoDespesa||"",r.status||"",r.qtdeEstoque??0,r.qtdeConsumida??0,r.qtdeSolicitada??0];
  const exportPDF=()=>{const doc=new jsPDF({orientation:"landscape"});doc.setFontSize(14);doc.text("Movimentação de Ítens - Detalhado",14,14);autoTable(doc,{startY:20,head:[COLS],body:rows.map(rowArr),styles:{fontSize:8},headStyles:{fillColor:[37,99,235]}});doc.save("mov-detalhado.pdf");};
  const exportExcel=()=>{const ws=XLSX.utils.aoa_to_sheet([COLS,...rows.map(rowArr)]);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Detalhado");XLSX.writeFile(wb,"mov-detalhado.xlsx");};
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>Movimentação de Ítens - Detalhado</span><div style={{display:"flex",gap:8}}><button style={S.btnSave} onClick={exportPDF} disabled={rows.length===0}>⬇ PDF</button><button style={S.btnSave} onClick={exportExcel} disabled={rows.length===0}>⬇ Excel</button></div></div>
      <FiltroBar onFiltrar={load}>
        <div><label style={S.label}>Num Sol.</label><input type="number" style={{...S.input,width:90}} value={f.numSol} onChange={e=>sf("numSol",e.target.value)}/></div>
        <div><label style={S.label}>Data De</label><input type="date" style={S.input} value={f.dataInicio} onChange={e=>sf("dataInicio",e.target.value)}/></div>
        <div><label style={S.label}>Data Até</label><input type="date" style={S.input} value={f.dataFim} onChange={e=>sf("dataFim",e.target.value)}/></div>
        <div style={{minWidth:160}}><label style={S.label}>Item</label><select style={S.input} value={f.itemId} onChange={e=>sf("itemId",e.target.value)}><option value="">Todos</option>{sl.itens.map(i=><option key={i.id} value={i.id}>{i.item}</option>)}</select></div>
        <div style={{minWidth:160}}><label style={S.label}>Estoque</label><select style={S.input} value={f.estoqueId} onChange={e=>sf("estoqueId",e.target.value)}><option value="">Todos</option>{sl.estoques.map(e=><option key={e.id} value={e.id}>{e.estoque}</option>)}</select></div>
        <div style={{minWidth:160}}><label style={S.label}>CCusto Despesa</label><select style={S.input} value={f.ccustoDespesaId} onChange={e=>sf("ccustoDespesaId",e.target.value)}><option value="">Todos</option>{sl.ccustos.map(c=><option key={c.id} value={c.id}>{c.centroCusto}</option>)}</select></div>
        <div style={{minWidth:140}}><label style={S.label}>Status</label><select style={S.input} value={f.status} onChange={e=>sf("status",e.target.value)}><option value="">Todos</option>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
      </FiltroBar>
      {loading?<Spinner/>:<RelTabela cols={["Num Sol.","Data","Item","Estoque","CCusto Despesa","Status","Qtde Estoque","Qtde Consumida","Qtde Solicitada"]} rows={rows} renderRow={(r,i)=>(
        <tr key={i} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
          <td style={{...S.td,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{r.numSolicitacao||"—"}</td>
          <td style={{...S.td,whiteSpace:"nowrap"}}>{fmtDate(r.data)}</td>
          <td style={S.td}>{r.item||"—"}</td>
          <td style={S.td}>{r.estoque||"—"}</td>
          <td style={S.td}>{r.ccustoDespesa||"—"}</td>
          <td style={S.td}>{r.status||"—"}</td>
          <td style={{...S.td,textAlign:"center"}}>{r.qtdeEstoque??0}</td>
          <td style={{...S.td,textAlign:"center"}}>{r.qtdeConsumida??0}</td>
          <td style={{...S.td,textAlign:"center"}}>{r.qtdeSolicitada??0}</td>
        </tr>
      )}/>}
    </div>
  );
}

// s53 — Movimentação de Ítens - Agr Sol
function RelMovAgrSolScreen({user}){
  const sl=useRelatorioSelects();
  const[f,setF]=useState({numSol:"",dataInicio:"",dataFim:"",itemId:"",estoqueId:"",ccustoDespesaId:"",status:""});
  const[rows,setRows]=useState([]);
  const[loading,setLoading]=useState(false);
  const fmtDate=d=>{if(!d)return"—";const dt=new Date(d);return`${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}/${dt.getUTCFullYear()}`;};
  const load=()=>{setLoading(true);const q=new URLSearchParams();Object.entries(f).forEach(([k,v])=>{if(v)q.set(k,v);});api.get(`/relatorio-consumo/movimentacao-agr-sol?${q}`).then(r=>setRows(Array.isArray(r)?r:[])).catch(()=>{}).finally(()=>setLoading(false));};
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const STATUSES=["Não Processado","Aguardando Compra","Em Estoque","Consumido","Processado"];
  const exportPDF=()=>{const doc=new jsPDF({orientation:"landscape"});doc.setFontSize(14);doc.text("Movimentação de Ítens - Agr Sol",14,14);autoTable(doc,{startY:20,head:[["Num Sol.","Data","Item","Estoque","Qtde Estoque","Qtde Consumida","Qtde Solicitada"]],body:rows.map(r=>[r.numSolicitacao||"—",fmtDate(r.data),r.item||"—",r.estoque||"—",r.qtdeEstoque??0,r.qtdeConsumida??0,r.qtdeSolicitada??0])});doc.save("mov-agr-sol.pdf");};
  const exportExcel=()=>{const ws=XLSX.utils.json_to_sheet(rows.map(r=>({"Num Sol.":r.numSolicitacao||"","Data":fmtDate(r.data),"Item":r.item||"","Estoque":r.estoque||"","Qtde Estoque":r.qtdeEstoque??0,"Qtde Consumida":r.qtdeConsumida??0,"Qtde Solicitada":r.qtdeSolicitada??0})));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Agr Sol");XLSX.writeFile(wb,"mov-agr-sol.xlsx");};
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>Movimentação de Ítens - Agr Sol</span><div style={{display:"flex",gap:8}}><button style={S.btnSave} onClick={exportPDF} disabled={rows.length===0}>⬇ PDF</button><button style={S.btnSave} onClick={exportExcel} disabled={rows.length===0}>⬇ Excel</button></div></div>
      <FiltroBar onFiltrar={load}>
        <div><label style={S.label}>Num Sol.</label><input type="number" style={{...S.input,width:90}} value={f.numSol} onChange={e=>sf("numSol",e.target.value)}/></div>
        <div><label style={S.label}>Data De</label><input type="date" style={S.input} value={f.dataInicio} onChange={e=>sf("dataInicio",e.target.value)}/></div>
        <div><label style={S.label}>Data Até</label><input type="date" style={S.input} value={f.dataFim} onChange={e=>sf("dataFim",e.target.value)}/></div>
        <div style={{minWidth:160}}><label style={S.label}>Item</label><select style={S.input} value={f.itemId} onChange={e=>sf("itemId",e.target.value)}><option value="">Todos</option>{sl.itens.map(i=><option key={i.id} value={i.id}>{i.item}</option>)}</select></div>
        <div style={{minWidth:160}}><label style={S.label}>Estoque</label><select style={S.input} value={f.estoqueId} onChange={e=>sf("estoqueId",e.target.value)}><option value="">Todos</option>{sl.estoques.map(e=><option key={e.id} value={e.id}>{e.estoque}</option>)}</select></div>
        <div style={{minWidth:160}}><label style={S.label}>CCusto Despesa</label><select style={S.input} value={f.ccustoDespesaId} onChange={e=>sf("ccustoDespesaId",e.target.value)}><option value="">Todos</option>{sl.ccustos.map(c=><option key={c.id} value={c.id}>{c.centroCusto}</option>)}</select></div>
        <div style={{minWidth:140}}><label style={S.label}>Status</label><select style={S.input} value={f.status} onChange={e=>sf("status",e.target.value)}><option value="">Todos</option>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
      </FiltroBar>
      {loading?<Spinner/>:<RelTabela cols={["Num Sol.","Data","Item","Estoque","Qtde Estoque","Qtde Consumida","Qtde Solicitada"]} rows={rows} renderRow={(r,i)=>(
        <tr key={i} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
          <td style={{...S.td,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{r.numSolicitacao||"—"}</td>
          <td style={{...S.td,whiteSpace:"nowrap"}}>{fmtDate(r.data)}</td>
          <td style={S.td}>{r.item||"—"}</td><td style={S.td}>{r.estoque||"—"}</td>
          <td style={{...S.td,textAlign:"center"}}>{r.qtdeEstoque??0}</td>
          <td style={{...S.td,textAlign:"center"}}>{r.qtdeConsumida??0}</td>
          <td style={{...S.td,textAlign:"center"}}>{r.qtdeSolicitada??0}</td>
        </tr>
      )}/>}
    </div>
  );
}

// s54 — Movimentação de Ítens - Resumo
function RelMovResumoScreen({user}){
  const sl=useRelatorioSelects();
  const[f,setF]=useState({dataInicio:"",dataFim:"",itemId:"",estoqueId:"",status:""});
  const[rows,setRows]=useState([]);
  const[loading,setLoading]=useState(false);
  const load=()=>{setLoading(true);const q=new URLSearchParams();Object.entries(f).forEach(([k,v])=>{if(v)q.set(k,v);});api.get(`/relatorio-consumo/movimentacao-resumo?${q}`).then(r=>setRows(Array.isArray(r)?r:[])).catch(()=>{}).finally(()=>setLoading(false));};
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const STATUSES=["Não Processado","Aguardando Compra","Em Estoque","Consumido","Processado"];
  const exportPDF=()=>{const doc=new jsPDF({orientation:"landscape"});doc.setFontSize(14);doc.text("Movimentação de Ítens - Resumo",14,14);autoTable(doc,{startY:20,head:[["Item","Estoque","Qtde Estoque","Qtde Consumida","Qtde Solicitada"]],body:rows.map(r=>[r.item||"—",r.estoque||"—",r.qtdeEstoque??0,r.qtdeConsumida??0,r.qtdeSolicitada??0])});doc.save("mov-resumo.pdf");};
  const exportExcel=()=>{const ws=XLSX.utils.json_to_sheet(rows.map(r=>({"Item":r.item||"","Estoque":r.estoque||"","Qtde Estoque":r.qtdeEstoque??0,"Qtde Consumida":r.qtdeConsumida??0,"Qtde Solicitada":r.qtdeSolicitada??0})));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Resumo");XLSX.writeFile(wb,"mov-resumo.xlsx");};
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>Movimentação de Ítens - Resumo</span><div style={{display:"flex",gap:8}}><button style={S.btnSave} onClick={exportPDF} disabled={rows.length===0}>⬇ PDF</button><button style={S.btnSave} onClick={exportExcel} disabled={rows.length===0}>⬇ Excel</button></div></div>
      <FiltroBar onFiltrar={load}>
        <div><label style={S.label}>Data De</label><input type="date" style={S.input} value={f.dataInicio} onChange={e=>sf("dataInicio",e.target.value)}/></div>
        <div><label style={S.label}>Data Até</label><input type="date" style={S.input} value={f.dataFim} onChange={e=>sf("dataFim",e.target.value)}/></div>
        <div style={{minWidth:160}}><label style={S.label}>Item</label><select style={S.input} value={f.itemId} onChange={e=>sf("itemId",e.target.value)}><option value="">Todos</option>{sl.itens.map(i=><option key={i.id} value={i.id}>{i.item}</option>)}</select></div>
        <div style={{minWidth:160}}><label style={S.label}>Estoque</label><select style={S.input} value={f.estoqueId} onChange={e=>sf("estoqueId",e.target.value)}><option value="">Todos</option>{sl.estoques.map(e=><option key={e.id} value={e.id}>{e.estoque}</option>)}</select></div>
        <div style={{minWidth:140}}><label style={S.label}>Status</label><select style={S.input} value={f.status} onChange={e=>sf("status",e.target.value)}><option value="">Todos</option>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
      </FiltroBar>
      {loading?<Spinner/>:<RelTabela cols={["Item","Estoque","Qtde Estoque","Qtde Consumida","Qtde Solicitada"]} rows={rows} renderRow={(r,i)=>(
        <tr key={i} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
          <td style={S.td}>{r.item||"—"}</td><td style={S.td}>{r.estoque||"—"}</td>
          <td style={{...S.td,textAlign:"center"}}>{r.qtdeEstoque??0}</td>
          <td style={{...S.td,textAlign:"center"}}>{r.qtdeConsumida??0}</td>
          <td style={{...S.td,textAlign:"center"}}>{r.qtdeSolicitada??0}</td>
        </tr>
      )}/>}
    </div>
  );
}

// s55 — Relatório Entrega de Ítens
function RelEntregaScreen({user}){
  const sl=useRelatorioSelects();
  const[f,setF]=useState({dataInicio:"",dataFim:"",itemId:"",estoqueId:"",ccustoConsumidorId:"",funcionarioId:""});
  const[rows,setRows]=useState([]);
  const[loading,setLoading]=useState(false);
  const fmtDate=d=>{if(!d)return"—";const dt=new Date(d);return`${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}/${dt.getUTCFullYear()}`;};
  const load=()=>{setLoading(true);const q=new URLSearchParams();Object.entries(f).forEach(([k,v])=>{if(v)q.set(k,v);});api.get(`/relatorio-consumo/entrega?${q}`).then(r=>setRows(Array.isArray(r)?r:[])).catch(()=>{}).finally(()=>setLoading(false));};
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const exportPDF=()=>{const doc=new jsPDF({orientation:"landscape"});doc.setFontSize(14);doc.text("Entrega de Ítens",14,14);autoTable(doc,{startY:20,head:[["Data","Item","Estoque","Qtde Entregue","CCusto Consumidor","Funcionário","Observação"]],body:rows.map(r=>[fmtDate(r.data),r.item||"—",r.estoque||"—",r.qtdeEntregue??0,r.ccustoConsumidor||"—",r.funcionario||"—",r.observacao||""])});doc.save("entrega-itens.pdf");};
  const exportExcel=()=>{const ws=XLSX.utils.json_to_sheet(rows.map(r=>({"Data":fmtDate(r.data),"Item":r.item||"","Estoque":r.estoque||"","Qtde Entregue":r.qtdeEntregue??0,"CCusto Consumidor":r.ccustoConsumidor||"","Funcionário":r.funcionario||"","Observação":r.observacao||""})));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Entrega");XLSX.writeFile(wb,"entrega-itens.xlsx");};
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>Entrega de Ítens</span><div style={{display:"flex",gap:8}}><button style={S.btnSave} onClick={exportPDF} disabled={rows.length===0}>⬇ PDF</button><button style={S.btnSave} onClick={exportExcel} disabled={rows.length===0}>⬇ Excel</button></div></div>
      <FiltroBar onFiltrar={load}>
        <div><label style={S.label}>Data De</label><input type="date" style={S.input} value={f.dataInicio} onChange={e=>sf("dataInicio",e.target.value)}/></div>
        <div><label style={S.label}>Data Até</label><input type="date" style={S.input} value={f.dataFim} onChange={e=>sf("dataFim",e.target.value)}/></div>
        <div style={{minWidth:160}}><label style={S.label}>Item</label><select style={S.input} value={f.itemId} onChange={e=>sf("itemId",e.target.value)}><option value="">Todos</option>{sl.itens.map(i=><option key={i.id} value={i.id}>{i.item}</option>)}</select></div>
        <div style={{minWidth:160}}><label style={S.label}>Estoque</label><select style={S.input} value={f.estoqueId} onChange={e=>sf("estoqueId",e.target.value)}><option value="">Todos</option>{sl.estoques.map(e=><option key={e.id} value={e.id}>{e.estoque}</option>)}</select></div>
        <div style={{minWidth:160}}><label style={S.label}>CCusto Consumidor</label><select style={S.input} value={f.ccustoConsumidorId} onChange={e=>sf("ccustoConsumidorId",e.target.value)}><option value="">Todos</option>{sl.ccustos.map(c=><option key={c.id} value={c.id}>{c.centroCusto}</option>)}</select></div>
        <div style={{minWidth:160}}><label style={S.label}>Funcionário</label><select style={S.input} value={f.funcionarioId} onChange={e=>sf("funcionarioId",e.target.value)}><option value="">Todos</option>{sl.funcionarios.map(fn=><option key={fn.id} value={fn.id}>{fn.nome}</option>)}</select></div>
      </FiltroBar>
      {loading?<Spinner/>:<RelTabela cols={["Data","Item","Estoque","Qtde Entregue","CCusto Consumidor","Funcionário","Observação"]} rows={rows} renderRow={(r,i)=>(
        <tr key={i} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
          <td style={{...S.td,whiteSpace:"nowrap"}}>{fmtDate(r.data)}</td>
          <td style={S.td}>{r.item||"—"}</td><td style={S.td}>{r.estoque||"—"}</td>
          <td style={{...S.td,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{r.qtdeEntregue??0}</td>
          <td style={S.td}>{r.ccustoConsumidor||"—"}</td>
          <td style={S.td}>{r.funcionario||"—"}</td>
          <td style={S.td}>{r.observacao||"—"}</td>
        </tr>
      )}/>}
    </div>
  );
}

// s56 — Relatório Registros de Manutenção
function RelManutencaoScreen({user}){
  const sl=useRelatorioSelects();
  const[f,setF]=useState({dataInicio:"",dataFim:"",ativoId:"",empresa:"",marca:"",modelo:"",serie:"",imei:"",funcionarioId:"",ccustoId:"",status:""});
  const[rows,setRows]=useState([]);
  const[loading,setLoading]=useState(false);
  const fmtDate=d=>{if(!d)return"—";const dt=new Date(d);return`${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}/${dt.getUTCFullYear()}`;};
  const load=()=>{setLoading(true);const q=new URLSearchParams();Object.entries(f).forEach(([k,v])=>{if(v)q.set(k,v);});api.get(`/relatorio-consumo/manutencao?${q}`).then(r=>setRows(Array.isArray(r)?r:[])).catch(()=>{}).finally(()=>setLoading(false));};
  const sf=(k,v)=>setF(p=>({...p,[k]:v}));
  const STATUSES=["Aguardando","Enviado","Disponível","Entregue","Condenado"];
  const thSub={...S.th,background:"#e8f0fe",fontSize:12};
  const exportPDF=()=>{
    const doc=new jsPDF({orientation:"landscape"});doc.setFontSize(14);doc.text("Registros de Manutenção",14,14);
    const body=[];
    rows.forEach(reg=>{
      if(reg.itens&&reg.itens.length>0){
        reg.itens.forEach(it=>body.push([fmtDate(reg.data),reg.nomeAtivo||"—",reg.empresa||"—",reg.marca||"—",reg.modelo||"—",reg.numeroSerie||"—",reg.imeiSlot1||"—",reg.funcionario||"—",reg.ccusto||"—",reg.status||"—",fmtDate(it.data),it.tipo||"—",it.fornecedor||"—",it.funcionario||"—",it.status||"—"]));
      }else{
        body.push([fmtDate(reg.data),reg.nomeAtivo||"—",reg.empresa||"—",reg.marca||"—",reg.modelo||"—",reg.numeroSerie||"—",reg.imeiSlot1||"—",reg.funcionario||"—",reg.ccusto||"—",reg.status||"—","","","","",""]);
      }
    });
    autoTable(doc,{startY:20,head:[["Data Registro","Ativo","Empresa","Marca","Modelo","Nº Série","IMEI","Funcionário","CCusto","Status Registro","Data Item","Tipo","Fornecedor","Funcionário Item","Status Item"]],body,styles:{fontSize:7}});
    doc.save("registros-manutencao.pdf");
  };
  const exportExcel=()=>{
    const wsData=[];
    rows.forEach(reg=>{
      if(reg.itens&&reg.itens.length>0){
        reg.itens.forEach(it=>wsData.push({"Data Registro":fmtDate(reg.data),"Ativo":reg.nomeAtivo||"","Empresa":reg.empresa||"","Marca":reg.marca||"","Modelo":reg.modelo||"","Nº Série":reg.numeroSerie||"","IMEI":reg.imeiSlot1||"","Funcionário":reg.funcionario||"","CCusto":reg.ccusto||"","Status Registro":reg.status||"","Data Item":fmtDate(it.data),"Tipo":it.tipo||"","Fornecedor":it.fornecedor||"","Funcionário Item":it.funcionario||"","Status Item":it.status||""}));
      }else{
        wsData.push({"Data Registro":fmtDate(reg.data),"Ativo":reg.nomeAtivo||"","Empresa":reg.empresa||"","Marca":reg.marca||"","Modelo":reg.modelo||"","Nº Série":reg.numeroSerie||"","IMEI":reg.imeiSlot1||"","Funcionário":reg.funcionario||"","CCusto":reg.ccusto||"","Status Registro":reg.status||"","Data Item":"","Tipo":"","Fornecedor":"","Funcionário Item":"","Status Item":""});
      }
    });
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(wsData),"Manutenção");XLSX.writeFile(wb,"registros-manutencao.xlsx");
  };
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>Registros de Manutenção</span><div style={{display:"flex",gap:8}}><button style={S.btnSave} onClick={exportPDF} disabled={rows.length===0}>⬇ PDF</button><button style={S.btnSave} onClick={exportExcel} disabled={rows.length===0}>⬇ Excel</button></div></div>
      <FiltroBar onFiltrar={load}>
        <div><label style={S.label}>Data De</label><input type="date" style={S.input} value={f.dataInicio} onChange={e=>sf("dataInicio",e.target.value)}/></div>
        <div><label style={S.label}>Data Até</label><input type="date" style={S.input} value={f.dataFim} onChange={e=>sf("dataFim",e.target.value)}/></div>
        <div style={{minWidth:160}}><label style={S.label}>Nome do Ativo</label><select style={S.input} value={f.ativoId} onChange={e=>sf("ativoId",e.target.value)}><option value="">Todos</option>{sl.ativos.map(a=><option key={a.id} value={a.id}>{a.nome}</option>)}</select></div>
        <div><label style={S.label}>Empresa</label><input style={S.input} value={f.empresa} onChange={e=>sf("empresa",e.target.value)} placeholder="Filtrar..."/></div>
        <div><label style={S.label}>Marca</label><input style={S.input} value={f.marca} onChange={e=>sf("marca",e.target.value)} placeholder="Filtrar..."/></div>
        <div><label style={S.label}>Modelo</label><input style={S.input} value={f.modelo} onChange={e=>sf("modelo",e.target.value)} placeholder="Filtrar..."/></div>
        <div><label style={S.label}>Nº Série</label><input style={S.input} value={f.serie} onChange={e=>sf("serie",e.target.value)} placeholder="Filtrar..."/></div>
        <div><label style={S.label}>IMEI</label><input style={S.input} value={f.imei} onChange={e=>sf("imei",e.target.value)} placeholder="Filtrar..."/></div>
        <div style={{minWidth:160}}><label style={S.label}>Funcionário</label><select style={S.input} value={f.funcionarioId} onChange={e=>sf("funcionarioId",e.target.value)}><option value="">Todos</option>{sl.funcionarios.map(fn=><option key={fn.id} value={fn.id}>{fn.nome}</option>)}</select></div>
        <div style={{minWidth:160}}><label style={S.label}>CCusto</label><select style={S.input} value={f.ccustoId} onChange={e=>sf("ccustoId",e.target.value)}><option value="">Todos</option>{sl.ccustos.map(c=><option key={c.id} value={c.id}>{c.centroCusto}</option>)}</select></div>
        <div style={{minWidth:140}}><label style={S.label}>Status</label><select style={S.input} value={f.status} onChange={e=>sf("status",e.target.value)}><option value="">Todos</option>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
      </FiltroBar>
      {loading?<Spinner/>:rows.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📊</span>Nenhum dado encontrado</div>:(
        <div style={{overflowX:"auto"}}>
          {rows.map((reg,ri)=>(
            <div key={reg.id||ri} style={{marginBottom:24,border:"2px solid #EA580C",borderRadius:8,overflow:"hidden"}}>
              <table style={{...S.table,margin:0}}><thead><tr>
                {["Data","Nome do Ativo","Empresa","Marca","Modelo","Nº Série","IMEI","Funcionário","CCusto","Observação","Status"].map(h=>(
                  <th key={h} style={{...S.th,background:"#EA580C",color:"#fff",whiteSpace:"nowrap",borderBottom:"none"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody><tr onMouseOver={e=>e.currentTarget.style.background="#FFF7ED"} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={{...S.td,whiteSpace:"nowrap",fontWeight:600}}>{fmtDate(reg.data)}</td>
                <td style={{...S.td,fontWeight:600}}>{reg.nomeAtivo||"—"}</td>
                <td style={S.td}>{reg.empresa||"—"}</td>
                <td style={S.td}>{reg.marca||"—"}</td>
                <td style={S.td}>{reg.modelo||"—"}</td>
                <td style={S.td}>{reg.numeroSerie||"—"}</td>
                <td style={S.td}>{reg.imeiSlot1||"—"}</td>
                <td style={S.td}>{reg.funcionario||"—"}</td>
                <td style={S.td}>{reg.ccusto||"—"}</td>
                <td style={S.td}>{reg.observacao||"—"}</td>
                <td style={S.td}>{reg.status||"—"}</td>
              </tr></tbody></table>
              {reg.itens&&reg.itens.length>0&&(
                <table style={{...S.table,margin:0,borderTop:`1px solid #FDBA74`}}><thead><tr>
                  {["Data","Tipo","Fornecedor","Funcionário","Observação","Status"].map(h=>(
                    <th key={h} style={{...thSub,background:"#FEF3C7",color:"#92400E",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{reg.itens.map((it,ii)=>(
                  <tr key={it.id||ii} onMouseOver={e=>e.currentTarget.style.background="#FFFBEB"} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                    <td style={{...S.td,whiteSpace:"nowrap",paddingLeft:32}}>{fmtDate(it.data)}</td>
                    <td style={S.td}>{it.tipo||"—"}</td>
                    <td style={S.td}>{it.fornecedor||"—"}</td>
                    <td style={S.td}>{it.funcionario||"—"}</td>
                    <td style={S.td}>{it.observacao||"—"}</td>
                    <td style={S.td}>{it.status||"—"}</td>
                  </tr>
                ))}</tbody></table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── RECEBIMENTO DE ESTOQUE (s50) ──────────────────────────────
function RecebimentoEstoqueScreen({user}){
  const[items,setItems]=useState([]);
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(false);
  const[linhas,setLinhas]=useState([]);
  const[saving,setSaving]=useState(false);
  const[err,setErr]=useState("");
  const[delId,setDelId]=useState(null);
  const[filterRec,setFilterRec]=useState({dataInicio:"",dataFim:"",item:"",estoque:""});
  const canI=act=>user.permissions?.s50?.[act];
  const fmtDate=d=>{if(!d)return"—";const dt=new Date(d);return`${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}/${dt.getUTCFullYear()}`;};
  const load=()=>{
    setLoading(true);
    api.get("/consumo-recebimento").then(r=>setItems(Array.isArray(r)?r:[])).catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);
  const openModal=()=>{
    setErr("");
    api.get("/consumo-recebimento/disponiveis-agrupados").then(d=>{
      setLinhas((Array.isArray(d)?d:[]).map(l=>({...l,qtdeRecebida:""})));
      setModal(true);
    }).catch(()=>{});
  };
  const setQtde=(idx,val)=>{
    setLinhas(ls=>ls.map((l,i)=>i!==idx?l:{...l,qtdeRecebida:val}));
  };
  const save=()=>{
    const itens=linhas.filter(l=>Number(l.qtdeRecebida)>0).map(l=>({itemId:l.itemId,estoqueId:l.estoqueId,qtdeRecebida:Number(l.qtdeRecebida)}));
    if(itens.length===0){setErr("Informe a Qtde Recebida em ao menos um item.");return;}
    const invalido=linhas.find(l=>l.qtdeRecebida!==""&&(Number(l.qtdeRecebida)<0||Number(l.qtdeRecebida)>l.qtdeSolicitada));
    if(invalido){setErr(`Qtde Recebida não pode ser maior que Qtde Solicitada.`);return;}
    setSaving(true);setErr("");
    api.post("/consumo-recebimento",{itens})
      .then(()=>{setModal(false);load();}).catch(e=>setErr(e?.error||"Erro ao salvar.")).finally(()=>setSaving(false));
  };
  const del=()=>api.delete(`/consumo-recebimento/${delId}`).then(()=>{setDelId(null);load();}).catch(()=>{});
  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>Recebimento de Estoque</span>
        {canI("insert")&&<button style={S.btnAdd} onClick={openModal}>+ Inserir</button>}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input type="date" value={filterRec.dataInicio} onChange={e=>setFilterRec(f=>({...f,dataInicio:e.target.value}))} title="Data início" style={{...S.input,flex:"1 1 140px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input type="date" value={filterRec.dataFim} onChange={e=>setFilterRec(f=>({...f,dataFim:e.target.value}))} title="Data fim" style={{...S.input,flex:"1 1 140px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Item" value={filterRec.item} onChange={e=>setFilterRec(f=>({...f,item:e.target.value}))} style={{...S.input,flex:"1 1 150px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Estoque" value={filterRec.estoque} onChange={e=>setFilterRec(f=>({...f,estoque:e.target.value}))} style={{...S.input,flex:"1 1 150px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
      </div>
      {loading?<Spinner/>:items.length===0
        ?<div style={S.emptyState}><span style={S.emptyIcon}>📦</span>Nenhum recebimento encontrado</div>
        :(()=>{const fltRec=items.filter(i=>{const d=(i.data||"").slice(0,10);return(!filterRec.dataInicio||d>=filterRec.dataInicio)&&(!filterRec.dataFim||d<=filterRec.dataFim)&&(!filterRec.item||(i.item||"").toLowerCase().includes(filterRec.item.toLowerCase()))&&(!filterRec.estoque||(i.estoque||"").toLowerCase().includes(filterRec.estoque.toLowerCase()));});return(
        <div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {["Data","Item","Estoque","Ações"].map(h=><th key={h} style={{...S.th,whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>{fltRec.map(i=>(
            <tr key={i.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={{...S.td,whiteSpace:"nowrap"}}>{fmtDate(i.data)}</td>
              <td style={S.td}>{i.item||"—"}</td>
              <td style={S.td}>{i.estoque||"—"}</td>
              <td style={S.td}>
                {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(i.id)}>Excluir</button>}
              </td>
            </tr>
          ))}</tbody></table>
        </div>
        );})()}
      {modal&&<Modal title="Recebimento de Estoque" onClose={()=>setModal(false)} wide>
        {linhas.length===0
          ?<div style={{padding:16,color:C.textLight,textAlign:"center"}}>Nenhum item disponível para recebimento.</div>
          :<div style={{overflowX:"auto"}}>
            <table style={S.table}><thead><tr>
              {["Item","Estoque","Qtde Solicitada","Qtde Recebida"].map(h=><th key={h} style={{...S.th,whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>{linhas.map((l,idx)=>(
              <tr key={`${l.itemId}-${l.estoqueId}`} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={S.td}><input value={l.item||""} readOnly style={{...S.input,background:C.bg,cursor:"not-allowed",opacity:0.8}}/></td>
                <td style={S.td}><input value={l.estoque||""} readOnly style={{...S.input,background:C.bg,cursor:"not-allowed",opacity:0.8}}/></td>
                <td style={{...S.td,textAlign:"center"}}><input value={l.qtdeSolicitada} readOnly style={{...S.input,background:C.bg,cursor:"not-allowed",opacity:0.8,textAlign:"center",width:80}}/></td>
                <td style={{...S.td,textAlign:"center"}}>
                  <input type="number" min="0" max={l.qtdeSolicitada} value={l.qtdeRecebida}
                    onChange={e=>setQtde(idx,e.target.value)}
                    style={{...S.input,textAlign:"center",width:80}}/>
                </td>
              </tr>
            ))}</tbody></table>
          </div>
        }
        {err&&<div style={{...S.errorMsg,textAlign:"left",marginTop:8}}>{err}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:16}}>
          <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
          <button style={S.btnSave} onClick={save} disabled={saving||linhas.length===0}>
            {saving?"Salvando...":"Salvar"}
          </button>
        </div>
      </Modal>}
      {delId&&<ConfirmModal msg="Excluir este recebimento? A movimentação será revertida para 'Aguardando Compra'." onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ── REGISTROS DE MANUTENÇÃO (s51) ────────────────────────────
function ManutencaoRegistrosScreen({user}){
  const[items,setItems]=useState([]);
  const[selects,setSelects]=useState({ativos:[],funcionarios:[],ccustos:[],fornecedores:[]});
  const[loading,setLoading]=useState(true);
  const[modal,setModal]=useState(null);
  const[modalAtivo,setModalAtivo]=useState(null);
  const[delId,setDelId]=useState(null);
  const[regRow,setRegRow]=useState(null);
  const[itens,setItens]=useState([]);
  const[itensLoading,setItensLoading]=useState(false);
  const[itemModal,setItemModal]=useState(null);
  const[delItemId,setDelItemId]=useState(null);
  const[err,setErr]=useState("");
  const[itemErr,setItemErr]=useState("");
  const[filterManu,setFilterManu]=useState({dataInicio:"",dataFim:"",nomeAtivo:"",empresa:"",numeroSerie:"",imei:"",funcionario:""});
  const canI=act=>user.permissions?.s51?.[act];
  const today=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
  const fmtDate=d=>{if(!d)return"—";const dt=new Date(d);return`${String(dt.getUTCDate()).padStart(2,"0")}/${String(dt.getUTCMonth()+1).padStart(2,"0")}/${dt.getUTCFullYear()}`;};
  const TIPO_STATUS={"Entrada do Equipamento":"Aguardando","Envio para Manutenção":"Enviado","Retorno de Manutenção":"Disponível","Entrega do Equipamento":"Entregue","Solicitação de Baixa":"Condenado"};
  const TIPOS=Object.keys(TIPO_STATUS);
  const tiposDisponiveis=(excludeId=null)=>{
    const lista=excludeId?itens.filter(it=>it.id!==excludeId):itens;
    const ultimo=lista.length>0?lista[lista.length-1].tipo:null;
    if(!ultimo)return["Entrada do Equipamento"];
    if(ultimo==="Entrada do Equipamento")return["Envio para Manutenção"];
    if(ultimo==="Envio para Manutenção")return["Retorno de Manutenção"];
    if(ultimo==="Retorno de Manutenção")return["Entrega do Equipamento","Solicitação de Baixa"];
    return[];
  };
  const statusBadge=s=>{
    if(!s)return<span style={{...S.badge,background:"#F3F4F6",color:"#6B7280"}}>—</span>;
    const cfg={Aguardando:{bg:"#FEF3C7",color:"#D97706"},Enviado:{bg:"#DBEAFE",color:"#1D4ED8"},Disponível:{bg:"#D1FAE5",color:"#065F46"},Entregue:{bg:"#EDE9FE",color:"#5B21B6"},Condenado:{bg:"#FEE2E2",color:"#991B1B"}};
    const c=cfg[s]||{bg:"#F3F4F6",color:"#374151"};
    return<span style={{...S.badge,background:c.bg,color:c.color}}>{s}</span>;
  };
  const load=()=>{
    setLoading(true);
    Promise.all([api.get("/manutencao-registros"),api.get("/manutencao-registros/selects")])
      .then(([r,sl])=>{setItems(Array.isArray(r)?r:[]);setSelects(sl&&typeof sl==="object"?sl:{ativos:[],funcionarios:[],ccustos:[],fornecedores:[]});})
      .catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);
  const onAtivoChange=v=>{
    const a=selects.ativos.find(x=>x.id===v)||null;
    setModalAtivo(a);
    setModal(m=>({...m,ativoId:v,funcionarioId:a?.funcionarioId||""}));
  };
  const openNew=()=>{setErr("");setModalAtivo(null);setModal({data:today(),ativoId:"",funcionarioId:"",ccusto:"",observacao:""});};
  const openEdit=row=>{
    setErr("");
    // Tenta achar o ativo nos selects; se não estiver (já em uso), monta a partir dos dados da linha
    const a=selects.ativos.find(x=>x.id===row.ativoId)||{
      id:row.ativoId,
      label:row.nomeAtivo||"",
      empresa:row.empresa||"",
      marca:row.marca||"",
      modelo:row.modelo||"",
      numeroSerie:row.numeroSerie||"",
      imeiSlot1:row.imeiSlot1||"",
      funcionarioId:row.funcionarioId||null,
      funcionarioNome:row.funcionario||"",
    };
    setModalAtivo(a);
    const dt=row.data?new Date(row.data):null;
    const ds=dt?`${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,"0")}-${String(dt.getUTCDate()).padStart(2,"0")}`:"";
    setModal({id:row.id,data:ds,ativoId:row.ativoId||"",funcionarioId:row.funcionarioId||"",ccusto:row.ccusto||"",observacao:row.observacao||""});
  };
  const save=async()=>{
    if(!modal.data||!modal.ativoId){setErr("Data e Ativo são obrigatórios.");return;}
    try{
      const body={data:modal.data,ativoId:modal.ativoId,funcionarioId:modal.funcionarioId||null,ccustoId:selects.ccustos.find(c=>c.centroCusto===modal.ccusto)?.id||null,observacao:modal.observacao||null};
      if(modal.id) await api.put(`/manutencao-registros/${modal.id}`,body);
      else await api.post("/manutencao-registros",body);
      setModal(null);load();
    }catch(e){setErr(e?.error||e.message);}
  };
  const del=()=>api.delete(`/manutencao-registros/${delId}`).then(()=>{setDelId(null);load();}).catch(e=>alert(e?.error||e.message));
  const openRegistros=row=>{
    setRegRow(row);setItens([]);setItemModal(null);setItemErr("");
    setItensLoading(true);
    api.get(`/manutencao-registros/${row.id}/itens`).then(r=>setItens(Array.isArray(r)?r:[])).catch(()=>{}).finally(()=>setItensLoading(false));
  };
  const loadItens=id=>{
    setItensLoading(true);
    api.get(`/manutencao-registros/${id}/itens`).then(r=>{setItens(Array.isArray(r)?r:[]);load();}).catch(()=>{}).finally(()=>setItensLoading(false));
  };
  const openNewItem=()=>{setItemErr("");setItemModal({data:today(),tipo:"",fornecedorId:"",funcionarioId:"",observacao:""});};
  const openEditItem=it=>{
    setItemErr("");
    const dt=it.data?new Date(it.data):null;
    const ds=dt?`${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,"0")}-${String(dt.getUTCDate()).padStart(2,"0")}`:"";
    setItemModal({id:it.id,data:ds,tipo:it.tipo||"",fornecedorId:it.fornecedorId||"",funcionarioId:it.funcionarioId||"",observacao:it.observacao||""});
  };
  const saveItem=async()=>{
    if(!itemModal.data||!itemModal.tipo){setItemErr("Data e Tipo são obrigatórios.");return;}
    try{
      const body={data:itemModal.data,tipo:itemModal.tipo,fornecedorId:itemModal.fornecedorId||null,funcionarioId:itemModal.funcionarioId||null,observacao:itemModal.observacao||null};
      if(itemModal.id) await api.put(`/manutencao-registros/itens/${itemModal.id}`,body);
      else await api.post(`/manutencao-registros/${regRow.id}/itens`,body);
      setItemModal(null);loadItens(regRow.id);
    }catch(e){setItemErr(e?.error||e.message);}
  };
  const delItem=()=>api.delete(`/manutencao-registros/itens/${delItemId}`).then(()=>{setDelItemId(null);loadItens(regRow.id);}).catch(e=>alert(e?.error||e.message));
  const COLS=["Data","Nome do Ativo","Empresa","Marca","Modelo","Nº Série","IMEI","Funcionário","Ccusto","Descrição Ccusto","Observação","Status","Ações"];
  return(
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>Registros de Manutenção</span>
        {canI("insert")&&<button style={S.btnAdd} onClick={openNew}>+ Novo Registro</button>}
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <input type="date" value={filterManu.dataInicio} onChange={e=>setFilterManu(f=>({...f,dataInicio:e.target.value}))} title="Data início" style={{...S.input,flex:"1 1 140px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input type="date" value={filterManu.dataFim} onChange={e=>setFilterManu(f=>({...f,dataFim:e.target.value}))} title="Data fim" style={{...S.input,flex:"1 1 140px",minWidth:120,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Nome do Ativo" value={filterManu.nomeAtivo} onChange={e=>setFilterManu(f=>({...f,nomeAtivo:e.target.value}))} style={{...S.input,flex:"1 1 160px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Empresa" value={filterManu.empresa} onChange={e=>setFilterManu(f=>({...f,empresa:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Nº Série" value={filterManu.numeroSerie} onChange={e=>setFilterManu(f=>({...f,numeroSerie:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="IMEI" value={filterManu.imei} onChange={e=>setFilterManu(f=>({...f,imei:e.target.value}))} style={{...S.input,flex:"1 1 130px",minWidth:110,padding:"6px 10px",fontSize:13}}/>
        <input placeholder="Funcionário" value={filterManu.funcionario} onChange={e=>setFilterManu(f=>({...f,funcionario:e.target.value}))} style={{...S.input,flex:"1 1 150px",minWidth:130,padding:"6px 10px",fontSize:13}}/>
      </div>
      {loading?<Spinner/>:items.length===0
        ?<div style={S.emptyState}><span style={S.emptyIcon}>🔧</span>Nenhum registro de manutenção</div>
        :(()=>{const fltManu=items.filter(i=>{const d=(i.data||"").slice(0,10);return(!filterManu.dataInicio||d>=filterManu.dataInicio)&&(!filterManu.dataFim||d<=filterManu.dataFim)&&(!filterManu.nomeAtivo||(i.nomeAtivo||"").toLowerCase().includes(filterManu.nomeAtivo.toLowerCase()))&&(!filterManu.empresa||(i.empresa||"").toLowerCase().includes(filterManu.empresa.toLowerCase()))&&(!filterManu.numeroSerie||(i.numeroSerie||"").toLowerCase().includes(filterManu.numeroSerie.toLowerCase()))&&(!filterManu.imei||(i.imeiSlot1||"").toLowerCase().includes(filterManu.imei.toLowerCase()))&&(!filterManu.funcionario||(i.funcionario||"").toLowerCase().includes(filterManu.funcionario.toLowerCase()));});return(
        <div style={{overflowX:"auto"}}>
          <table style={S.table}><thead><tr>
            {COLS.map(h=><th key={h} style={{...S.th,whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>{fltManu.map(i=>(
            <tr key={i.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <td style={{...S.td,whiteSpace:"nowrap"}}>{fmtDate(i.data)}</td>
              <td style={S.td}>{i.nomeAtivo||"—"}</td>
              <td style={S.td}>{i.empresa||"—"}</td>
              <td style={S.td}>{i.marca||"—"}</td>
              <td style={S.td}>{i.modelo||"—"}</td>
              <td style={S.td}>{i.numeroSerie||"—"}</td>
              <td style={S.td}>{i.imeiSlot1||"—"}</td>
              <td style={S.td}>{i.funcionario||"—"}</td>
              <td style={S.td}>{i.ccusto||"—"}</td>
              <td style={S.td}>{i.descricaoCcusto||"—"}</td>
              <td style={S.td}>{i.observacao||"—"}</td>
              <td style={S.td}>{statusBadge(i.status)}</td>
              <td style={{...S.td,whiteSpace:"nowrap"}}>
                {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(i)}>Editar</button>}
                {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(i.id)}>Excluir</button>}
                {canI("view")&&<button style={{...S.actionBtn,background:"#E0E7FF",color:"#3730A3"}} onClick={()=>openRegistros(i)}>Registros</button>}
              </td>
            </tr>
          ))}</tbody></table>
        </div>
        );})()}
      {modal&&<Modal title={modal.id?"Editar Registro de Manutenção":"Novo Registro de Manutenção"} onClose={()=>setModal(null)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <div style={S.formRow}>
            <label style={S.label}>Data *</label>
            <input type="date" value={modal.data} onChange={e=>setModal(m=>({...m,data:e.target.value}))} style={S.input}/>
          </div>
        </div>
        <SelectField label="Nome do Ativo *" value={modal.ativoId} onChange={onAtivoChange} required
          options={[{value:"",label:"Selecione..."},...(modal.ativoId&&!selects.ativos.find(a=>a.id===modal.ativoId)&&modalAtivo?[{value:modal.ativoId,label:modalAtivo.label||modalAtivo.nomeAtivo||""}]:[]),...selects.ativos.map(a=>({value:a.id,label:a.label}))]}/>
        {modalAtivo&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px",marginBottom:8}}>
          {[["Empresa",modalAtivo.empresa],["Marca",modalAtivo.marca],["Modelo",modalAtivo.modelo],["Nº Série",modalAtivo.numeroSerie],["IMEI",modalAtivo.imeiSlot1]].map(([lbl,val])=>(
            <div key={lbl} style={S.formRow}>
              <label style={S.label}>{lbl}</label>
              <input value={val||""} readOnly style={{...S.input,background:C.bg,color:C.textLight}}/>
            </div>
          ))}
        </div>}
        <div style={S.formRow}>
          <label style={S.label}>Funcionário</label>
          <input value={modalAtivo?.funcionarioNome||"—"} readOnly style={{...S.input,background:C.bg,color:C.textLight}}/>
        </div>
        <div style={S.formRow}>
          <label style={S.label}>Ccusto</label>
          <input value={modal.ccusto||""} onChange={e=>setModal(m=>({...m,ccusto:e.target.value}))} style={S.input} placeholder="Digite o CCusto..."/>
        </div>
        <div style={S.formRow}>
          <label style={S.label}>Descrição Ccusto</label>
          <input value={selects.ccustos.find(c=>c.centroCusto===modal.ccusto)?.descricao||""} readOnly style={{...S.input,background:C.bg,color:C.textLight}}/>
        </div>
        <div style={S.formRow}>
          <label style={S.label}>Observação</label>
          <textarea value={modal.observacao||""} onChange={e=>setModal(m=>({...m,observacao:e.target.value}))} style={{...S.input,height:72,resize:"vertical"}}/>
        </div>
        {err&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{err}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
          <button style={S.btnSave} onClick={save}>Salvar</button>
        </div>
      </Modal>}
      {regRow&&<Modal title={`Registros — ${regRow.nomeAtivo||"Ativo"}`} onClose={()=>setRegRow(null)} extraWide>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
          {canI("insert")&&tiposDisponiveis().length>0&&<button style={S.btnAdd} onClick={openNewItem}>+ Novo Registro</button>}
        </div>
        {itensLoading?<Spinner/>:itens.length===0
          ?<div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Nenhum registro lançado</div>
          :<div style={{overflowX:"auto"}}>
            <table style={S.table}><thead><tr>
              {["Data","Tipo","Fornecedor","Funcionário","Observação","Status","Ações"].map(h=><th key={h} style={{...S.th,whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>{itens.map(it=>(
              <tr key={it.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={{...S.td,whiteSpace:"nowrap"}}>{fmtDate(it.data)}</td>
                <td style={S.td}>{it.tipo||"—"}</td>
                <td style={S.td}>{it.fornecedor||"—"}</td>
                <td style={S.td}>{it.funcionario||"—"}</td>
                <td style={S.td}>{it.observacao||"—"}</td>
                <td style={S.td}>{statusBadge(it.status)}</td>
                <td style={{...S.td,whiteSpace:"nowrap"}}>
                  {canI("edit")&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEditItem(it)}>Editar</button>}
                  {canI("delete")&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelItemId(it.id)}>Excluir</button>}
                </td>
              </tr>
            ))}</tbody></table>
          </div>
        }
      </Modal>}
      {itemModal&&<Modal title={itemModal.id?"Editar Registro":"Novo Registro"} onClose={()=>setItemModal(null)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <div style={S.formRow}>
            <label style={S.label}>Data *</label>
            <input type="date" value={itemModal.data} onChange={e=>setItemModal(m=>({...m,data:e.target.value}))} style={S.input}/>
          </div>
          <div style={S.formRow}>
            <label style={S.label}>Status</label>
            <input value={TIPO_STATUS[itemModal.tipo]||"—"} readOnly style={{...S.input,background:C.bg,color:C.textLight}}/>
          </div>
        </div>
        <SelectField label="Tipo *" value={itemModal.tipo} onChange={v=>{
          const fornecOk=v==="Envio para Manutenção";
          const funcOk=v==="Entrada do Equipamento"||v==="Entrega do Equipamento";
          setItemModal(m=>({...m,tipo:v,fornecedorId:fornecOk?m.fornecedorId:"",funcionarioId:funcOk?m.funcionarioId:""}));
        }} required options={[{value:"",label:"Selecione..."},...tiposDisponiveis(itemModal.id||null).map(t=>({value:t,label:t}))]}/>
        <SelectField label="Fornecedor" value={itemModal.fornecedorId}
          onChange={v=>setItemModal(m=>({...m,fornecedorId:v}))}
          disabled={itemModal.tipo!=="Envio para Manutenção"}
          options={[{value:"",label:itemModal.tipo!=="Envio para Manutenção"?"Não aplicável":"Selecione..."},...selects.fornecedores.map(f=>({value:f.id,label:f.name}))]}/>
        <SelectField label="Funcionário" value={itemModal.funcionarioId}
          onChange={v=>setItemModal(m=>({...m,funcionarioId:v}))}
          disabled={itemModal.tipo!=="Entrada do Equipamento"&&itemModal.tipo!=="Entrega do Equipamento"}
          options={[{value:"",label:(itemModal.tipo!=="Entrada do Equipamento"&&itemModal.tipo!=="Entrega do Equipamento")?"Não aplicável":"Selecione..."},...selects.funcionarios.map(f=>({value:f.id,label:f.nome}))]}/>
        <div style={S.formRow}>
          <label style={S.label}>Observação</label>
          <textarea value={itemModal.observacao||""} onChange={e=>setItemModal(m=>({...m,observacao:e.target.value}))} style={{...S.input,height:72,resize:"vertical"}}/>
        </div>
        {itemErr&&<div style={{...S.errorMsg,textAlign:"left",marginBottom:8}}>{itemErr}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button style={S.btnCancel} onClick={()=>setItemModal(null)}>Cancelar</button>
          <button style={S.btnSave} onClick={saveItem}>Salvar</button>
        </div>
      </Modal>}
      {delId&&<ConfirmModal msg="Excluir este registro de manutenção e todos os seus registros?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
      {delItemId&&<ConfirmModal msg="Excluir este registro?" onConfirm={delItem} onCancel={()=>setDelItemId(null)}/>}
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────
const navConfig=[
  {id:"cadastros",label:"Cadastros",icon:"folder",children:[
    {id:"s1", label:"Perfis",                      icon:"user"},
    {id:"s2", label:"Usuários",                    icon:"users"},
    {id:"s3", label:"Empresas",                    icon:"building"},
    {id:"s22",label:"Funcionários",               icon:"user"},
    {id:"s12",label:"Fornecedores",               icon:"factory"},
    {id:"s39",label:"Filiais",                    icon:"building"},
    {id:"s4", label:"Equipes",                     icon:"team"},
    {id:"s44",label:"CCusto",                     icon:"coin"},
    {id:"s45",label:"Ítens",                      icon:"package"},
    {id:"s46",label:"Estoque",                    icon:"archive"},
    {id:"s8", label:"Tipo de Veículo",             icon:"car"},
    {id:"s9", label:"Valor do km",                 icon:"coin"},
    {id:"s16",label:"Operadoras",                 icon:"satellite"},
    {id:"s17",label:"Linhas Faturadas",           icon:"phone"},
    {id:"s23",label:"Modelos de Contrato",        icon:"clipboard"},
    {id:"s18",label:"Tipo de Ativo",              icon:"archive"},
    {id:"s20",label:"Ativos",                     icon:"package"},
    {id:"s28",label:"Configuração de E-mail",     icon:"mail"},
    {id:"s33",label:"Configuração de Inventário", icon:"wrench"},
  ]},
  {id:"movimentacoes",label:"Movimentações",icon:"refresh",children:[
    {id:"s5", label:"Sobreaviso/Extra",           icon:"clock"},
    {id:"s7", label:"Extra Avulso",               icon:"zap"},
    {id:"s10",label:"Registro de Km",             icon:"route"},
    {id:"s35",label:"Controle de Folgas",         icon:"folgas"},
    {id:"s30",label:"Férias",                     icon:"vacation"},
    {id:"s13",label:"Contratos",                  icon:"contracts"},
    {id:"s37",label:"Políticas de TI",            icon:"policy"},
    {id:"s19",label:"Linhas Disponíveis",               icon:"signal"},
    {id:"s57",label:"Liberação de Linhas para Estoque", icon:"signal"},
    {id:"s21",label:"Controle de Ativos",               icon:"monitor"},
    {id:"s29",label:"Histórico de Movimentações", icon:"history"},
    {id:"s38",label:"Endereços de Rede",          icon:"satellite"},
    {id:"s40",label:"Links",                      icon:"link"},
    {id:"s41",label:"Firewall",                   icon:"monitor"},
    {id:"s34",label:"Inventário de Rede",         icon:"network"},
    {id:"s47",label:"Movimentação de Ítens",      icon:"refresh"},
    {id:"s48",label:"Solicitação de Ítens",       icon:"clipboard"},
    {id:"s49",label:"Entrega de Ítens",           icon:"package"},
    {id:"s50",label:"Recebimento de Estoque",     icon:"inbox"},
    {id:"s51",label:"Registros de Manutenção",    icon:"build"},
  ]},
  {id:"relatorios",label:"Relatórios",icon:"chart",children:[
    {id:"s6", label:"Relatório de Horas",         icon:"clock"},
    {id:"s15",label:"Relatório de Escala",        icon:"calendar"},
    {id:"s11",label:"Controle de Km",             icon:"route"},
    {id:"s36",label:"Controle de Folgas",         icon:"calendar"},
    {id:"s31",label:"Relatório de Férias",        icon:"vacation"},
    {id:"s32",label:"Composição de Equipe",       icon:"users"},
    {id:"s14",label:"Relatório de Contratos",     icon:"file"},
    {id:"s24",label:"Análise de Linhas",          icon:"trending"},
    {id:"s25",label:"Resumo de Linhas",           icon:"signal"},
    {id:"s26",label:"Resumo de Ativos",           icon:"package"},
    {id:"s27",label:"Inventário de Ativos",       icon:"archive"},
    {id:"s42",label:"Firewall",                               icon:"monitor"},
    {id:"s43",label:"Links",                                  icon:"link"},
    {id:"s52",label:"Movimentação de Ítens - Detalhado",      icon:"file"},
    {id:"s53",label:"Movimentação de Ítens - Agr Sol",        icon:"file"},
    {id:"s54",label:"Movimentação de Ítens - Resumo",         icon:"file"},
    {id:"s55",label:"Entrega de Ítens",                       icon:"file"},
    {id:"s56",label:"Registros de Manutenção",                icon:"file"},
  ]},
];
function Sidebar({user,currentScreen,onNavigate,onLogout,onClose,isMobile}){
  const[expanded,setExpanded]=useState({cadastros:true,movimentacoes:true,relatorios:true});
  const toggle=id=>setExpanded(e=>({...e,[id]:!e[id]}));
  const handleNav=id=>{onNavigate(id);if(isMobile&&onClose)onClose();};
  return(
    <div style={{...S.sidebar,...(isMobile?{position:"fixed",top:0,left:0,height:"100vh",zIndex:300,overflowY:"auto"}:{height:"100vh"})}}>
      <div style={{padding:"20px 16px",borderBottom:"1px solid #444",display:"flex",alignItems:"center"}}><Logo size={28}/></div>
      <div style={{padding:"12px 16px 8px",borderBottom:"1px solid #444",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:38,height:38,borderRadius:"50%",overflow:"hidden",border:`2px solid ${C.primary}`,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:C.primary}}>
          {user.avatar
            ?<img src={user.avatar} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            :<span style={{fontSize:14,fontWeight:700,color:"#fff"}}>{getInit(user.apelido||user.name)}</span>}
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:12,color:"#aaa",marginBottom:1}}>Usuário logado</div>
          <div style={{fontSize:13,fontWeight:700,color:"#eee",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.apelido||user.name}</div>
          <div style={{fontSize:10,color:"#888",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.email}</div>
        </div>
      </div>
      <nav style={S.navSection}>
        <div style={{padding:"8px 16px 4px",fontSize:10,color:"#777",fontWeight:700,letterSpacing:1}}>NAVEGAÇÃO</div>
        <div style={{...S.navItem,background:currentScreen==="home"?C.primary:"none",color:currentScreen==="home"?C.white:"#bbb",padding:"10px 16px",fontWeight:600}}
          onClick={()=>handleNav("home")}
          onMouseOver={e=>{if(currentScreen!=="home")e.currentTarget.style.background=C.sidebarHover;}}
          onMouseOut={e=>{if(currentScreen!=="home")e.currentTarget.style.background="none";}}>
          <Icon name="home" size={15} color={currentScreen==="home"?C.white:"#bbb"}/> Início
        </div>
        {navConfig.map(group=>(
          <div key={group.id}>
            <button style={{...S.navGroupBtn,color:expanded[group.id]?"#eee":"#bbb"}} onClick={()=>toggle(group.id)}>
              <span style={{display:"flex",alignItems:"center",gap:8}}>
                <Icon name={group.icon} size={14} color={expanded[group.id]?"#eee":"#999"}/>
                {group.label}
              </span>
              <Icon name="chevronDown" size={14} color={expanded[group.id]?"#eee":"#666"}
                style={{transition:"transform .25s",transform:expanded[group.id]?"rotate(0deg)":"rotate(-90deg)"}}/>
            </button>
            {expanded[group.id]&&group.children.map(item=>{
              if(!user.permissions?.[item.id]?.view)return null;
              const active=currentScreen===item.id;
              return(
                <div key={item.id}
                  style={{...S.navItem,background:active?C.primary:"none",color:active?C.white:"#bbb",borderLeft:active?`3px solid ${C.secondary}`:"3px solid transparent"}}
                  onClick={()=>handleNav(item.id)}
                  onMouseOver={e=>{if(!active)e.currentTarget.style.background=C.sidebarHover;}}
                  onMouseOut={e=>{if(!active)e.currentTarget.style.background="none";}}>
                  <Icon name={item.icon} size={14} color={active?C.white:"#999"}/> {item.label}
                </div>
              );
            })}
          </div>
        ))}
      </nav>
      <div style={{padding:"12px 16px",borderTop:"1px solid #444"}}>
        <button style={S.logoutBtn} onClick={onLogout}
          onMouseOver={e=>{e.target.style.background="#444";e.target.style.color="#fff";}}
          onMouseOut={e=>{e.target.style.background="none";e.target.style.color="#bbb";}}>
          <Icon name="logout" size={14}/> Sair do sistema
        </button>
      </div>
    </div>
  );
}

const screenTitles={
  home:"Início",
  s1:"Cadastros › Perfis",s2:"Cadastros › Usuários",s3:"Cadastros › Empresas",s4:"Cadastros › Equipes",
  s5:"Movimentações › Sobreaviso/Extra",s6:"Relatórios › Relatório de Horas",s7:"Movimentações › Extra Avulso",
  s8:"Cadastros › Tipo de Veículo",s9:"Cadastros › Valor do km",
  s10:"Movimentações › Registro de Km",s11:"Relatórios › Controle de Km",
  s12:"Cadastros › Fornecedores",s13:"Movimentações › Contratos",s14:"Relatórios › Relatório de Contratos",
  s15:"Relatórios › Relatório de Escala",
  s16:"Cadastros › Telefonia › Operadoras",
  s17:"Cadastros › Telefonia › Linhas Faturadas",
  s18:"Cadastros › Tipo de Ativo",
  s19:"Movimentações › Linhas Disponíveis",
  s57:"Movimentações › Liberação de Linhas para Estoque",
  s20:"Cadastros › Ativos",
  s21:"Movimentações › Controle de Ativos",
  s22:"Cadastros › Funcionários",
  s23:"Cadastros › Modelos de Contrato",
  s28:"Cadastros › Configuração de E-mail",
  s24:"Relatórios › Análise de Linhas",
  s25:"Relatórios › Resumo de Linhas",
  s26:"Relatórios › Resumo de Ativos",
  s27:"Relatórios › Inventário de Ativos",
  s29:"Movimentações › Histórico de Movimentações de Ativos",
  s31:"Relatórios › Relatório de Férias",
  s32:"Relatórios › Composição de Equipe",
  s33:"Cadastros › Configuração de Inventário",
  s34:"Movimentações › Inventário de Rede",
  s38:"Movimentações › Endereços de Rede",
  s39:"Cadastros › Filiais",
  s40:"Movimentações › Links",
  s41:"Movimentações › Firewall",
  s42:"Relatórios › Firewall",
  s43:"Relatórios › Links",
  s44:"Cadastros › CCusto",
  s45:"Cadastros › Ítens",
  s46:"Cadastros › Estoque",
  s47:"Movimentações › Movimentação de Ítens",
  s48:"Movimentações › Solicitação de Ítens",
  s49:"Movimentações › Entrega de Ítens",
  s50:"Movimentações › Recebimento de Estoque",
  s51:"Movimentações › Registros de Manutenção",
  s52:"Relatórios › Movimentação de Ítens - Detalhado",
  s53:"Relatórios › Movimentação de Ítens - Agr Sol",
  s54:"Relatórios › Movimentação de Ítens - Resumo",
  s55:"Relatórios › Entrega de Ítens",
  s56:"Relatórios › Registros de Manutenção",
  s35:"Movimentações › Controle de Folgas",
  s36:"Relatórios › Controle de Folgas",
  s37:"Movimentações › Políticas de TI",
  profile:"Meu Perfil",
};

export default function App(){
  const[user,setUser]=useState(null);
  const[screen,setScreen]=useState("home");
  const isMobile=useIsMobile();
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const[profileOpen,setProfileOpen]=useState(false);
  const[sidebarCollapsed,setSidebarCollapsed]=useState(false);

  useEffect(()=>{const saved=localStorage.getItem("sl_session");if(saved){try{const{user,token}=JSON.parse(saved);api.setToken(token);setUser(user);}catch{localStorage.removeItem("sl_session");}}},[]);

  const handleLogin=(u,token)=>{localStorage.setItem("sl_session",JSON.stringify({user:u,token}));setUser(u);setScreen("home");};
  const handleLogout=()=>{localStorage.removeItem("sl_session");api.setToken(null);setUser(null);};

  const handleUserUpdated=(updated)=>{
    const saved=localStorage.getItem("sl_session");
    if(saved){
      try{
        const sess=JSON.parse(saved);
        sess.user={...sess.user,...updated};
        localStorage.setItem("sl_session",JSON.stringify(sess));
      }catch{}
    }
    setUser(u=>({...u,...updated}));
  };

  if(!user)return<Login onLogin={handleLogin}/>;

  const screenMap={
    home:<HomeScreen user={user} navigate={setScreen}/>,
    s1:<ProfilesScreen user={user}/>,s2:<UsersScreen user={user}/>,
    s3:<EmpresasScreen user={user}/>,
    s4:<EquipesScreen user={user}/>,
    s5:<ControleHorasScreen user={user}/>,s6:<RelatorioHorasScreen user={user}/>,s7:<ExtraAvulsoScreen user={user}/>,
    s8:<TipoVeiculoScreen user={user}/>,s9:<ValorKmScreen user={user}/>,
    s10:<RegistroKmScreen user={user}/>,s11:<RelatorioKmScreen user={user}/>,
    s12:<FornecedoresScreen user={user}/>,s13:<ContratosScreen user={user}/>,s14:<RelatorioContratosScreen user={user}/>,
    s15:<RelatorioEscalaScreen user={user}/>,
    s16:<OperadorasScreen user={user}/>,
    s17:<LinhasFaturadasScreen user={user}/>,
    s18:<TipoAtivosScreen user={user}/>,
    s19:<LinhasDisponiveisScreen user={user}/>,
    s57:<LiberacaoLinhasEstoqueScreen user={user}/>,
    s20:<AtivosScreen user={user}/>,
    s21:<ControleAtivosScreen user={user}/>,
    s22:<FuncionariosScreen user={user}/>,
    s23:<ModelosContratoScreen user={user}/>,
    s28:<ConfiguracaoEmailScreen user={user}/>,
    s24:<RelatorioAnaliseLinhasScreen user={user}/>,
    s25:<RelatorioResumoLinhasScreen user={user}/>,
    s26:<ResumoAtivosScreen user={user}/>,
    s27:<InventarioAtivosScreen user={user}/>,
    s29:<HistoricoMovimentacoesScreen user={user}/>,
    s30:<FeriasScreen user={user}/>,
    s31:<RelatorioFeriasScreen user={user}/>,
    s32:<RelatorioComposicaoScreen user={user}/>,
    s33:<ConfiguracaoInventarioScreen user={user}/>,
    s35:<FolgasScreen user={user}/>,
    s36:<RelatorioFolgasScreen user={user}/>,
    s37:<PoliticasScreen user={user}/>,
    s34:<InventarioRedeScreen user={user}/>,
    s38:<EnderecosRedeScreen user={user}/>,
    s39:<FiliaisScreen user={user}/>,
    s40:<LinksScreen user={user}/>,
    s41:<FirewallScreen user={user}/>,
    s42:<RelatorioFirewallScreen user={user}/>,
    s43:<RelatorioLinksScreen user={user}/>,
    s44:<CcustoConsumoScreen user={user}/>,
    s45:<ItensConsumoScreen user={user}/>,
    s46:<EstoquesConsumoScreen user={user}/>,
    s47:<MovimentacaoItensScreen user={user}/>,
    s48:<SolicitacaoItensScreen user={user}/>,
    s49:<EntregaItensScreen user={user}/>,
    s50:<RecebimentoEstoqueScreen user={user}/>,
    s51:<ManutencaoRegistrosScreen user={user}/>,
    s52:<RelMovDetalhadoScreen user={user}/>,
    s53:<RelMovAgrSolScreen user={user}/>,
    s54:<RelMovResumoScreen user={user}/>,
    s55:<RelEntregaScreen user={user}/>,
    s56:<RelManutencaoScreen user={user}/>,
  };

  const UserAvatar=({size=32,style:st={}})=>(
    user.avatar
      ?<img src={user.avatar} alt="avatar" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.primary}`,cursor:"pointer",...st}}/>
      :<div style={{...S.userBadge,width:size,height:size,fontSize:size*0.4,cursor:"pointer",...st}}>{getInit(user.name)}</div>
  );

  return(
    <div style={S.layout}>
      {/* Desktop sidebar */}
      {!isMobile&&(
        sidebarCollapsed?(
          <div style={{width:52,background:C.sidebar,display:"flex",flexDirection:"column",alignItems:"center",padding:"16px 0",flexShrink:0,gap:4}}>
            <button onClick={()=>setSidebarCollapsed(false)} title="Expandir menu"
              style={{background:"none",border:"none",color:"#bbb",cursor:"pointer",fontSize:22,lineHeight:1,padding:"4px"}}>☰</button>
          </div>
        ):(
          <div style={{position:"relative",flexShrink:0}}>
            <Sidebar user={user} currentScreen={screen} onNavigate={setScreen} onLogout={handleLogout}/>
            <button onClick={()=>setSidebarCollapsed(true)} title="Recolher menu"
              style={{position:"absolute",right:-12,top:68,background:C.primary,border:"none",color:"#fff",
                cursor:"pointer",borderRadius:"50%",width:24,height:24,fontSize:13,zIndex:200,
                boxShadow:"0 1px 4px rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              ‹
            </button>
          </div>
        )
      )}

      {/* Mobile sidebar overlay */}
      {isMobile&&sidebarOpen&&(
        <>
          <div style={S.mobileOverlay} onClick={()=>setSidebarOpen(false)}/>
          <Sidebar user={user} currentScreen={screen} onNavigate={setScreen} onLogout={()=>{setSidebarOpen(false);handleLogout();}}
            onClose={()=>setSidebarOpen(false)} isMobile/>
        </>
      )}

      <div style={S.main}>
        <div style={{...S.topbar,...(isMobile?{padding:"10px 16px"}:{})}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {isMobile&&(
              <button style={S.hamburger} onClick={()=>setSidebarOpen(v=>!v)}>
                <div style={{width:22,height:2,background:C.accent,borderRadius:2}}/>
                <div style={{width:22,height:2,background:C.accent,borderRadius:2}}/>
                <div style={{width:22,height:2,background:C.accent,borderRadius:2}}/>
              </button>
            )}
            <div>
              {!isMobile&&<div style={{fontSize:11,color:C.textLight,letterSpacing:1,fontWeight:600}}>SISTEMA DE CONTROLE DE TI</div>}
              <div style={{...S.topbarTitle,...(isMobile?{fontSize:14}:{})}}>{screenTitles[screen]||"Início"}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {screen!=="home"&&<button style={{...S.btnClose,...(isMobile?{padding:"6px 10px",fontSize:12}:{})}} onClick={()=>setScreen("home")}>✕ {!isMobile&&"Fechar"}</button>}
            <div title="Meu perfil" onClick={()=>setProfileOpen(true)}><UserAvatar/></div>
          </div>
        </div>
        <div style={{...S.content,...(isMobile?{padding:12}:{})}}>{screenMap[screen]||<div style={S.emptyState}><span style={S.emptyIcon}>🚧</span>Em desenvolvimento</div>}</div>
      </div>

      {profileOpen&&<UserProfileModal user={user} onClose={()=>setProfileOpen(false)} onUserUpdated={handleUserUpdated}/>}
    </div>
  );
}
