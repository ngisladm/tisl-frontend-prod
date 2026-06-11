import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001";
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
  delete: (path)       => api.request("DELETE", path),
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
    <text x="38" y="34" fontFamily="'Segoe UI',Arial,sans-serif" fontWeight="900" fontSize="22" fill="#616161" letterSpacing="-1">SL</text>
    <text x="38" y="48" fontFamily="'Segoe UI',Arial,sans-serif" fontWeight="500" fontSize="9"  fill="#888" letterSpacing="3">GRUPO</text>
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
  layout:{display:"flex",height:"100vh",overflow:"hidden",fontFamily:"'Segoe UI',Arial,sans-serif"},
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
function SelectField({label,value,onChange,options,required}){
  return(
    <div style={S.formRow}>
      <label style={S.label}>{label}{required&&" *"}</label>
      <select value={value||""} onChange={e=>onChange(e.target.value)} style={S.select}>
        <option value="">Selecione...</option>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
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
      <div style={S.loginCard}>
        <div style={{textAlign:"center",marginBottom:28}}><Logo size={40}/></div>
        <p style={S.loginTitle}>SISTEMA DE CONTROLE DE TI</p>
        <p style={S.loginSub}>Informe suas credenciais para continuar</p>
        <Input label="E-mail" value={email} onChange={setEmail} placeholder="admin@slgrupo.com"/>
        <Input label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••"/>
        {error&&<p style={S.errorMsg}>{error}</p>}
        <button style={{...S.btnPrimary,opacity:loading?.7:1}} onClick={handleLogin} disabled={loading}>{loading?"Entrando...":"Entrar"}</button>
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
  useEffect(()=>{if(!p?.view)return;api.get(apiPath).then(setItems).catch(e=>alert(e.message)).finally(()=>setLoading(false));});
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
  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>{icon} {title}</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo(a)</button>}</div>
      {items.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>{icon}</span>Nenhum registro.</div>:(
        <table style={S.table}><thead><tr><th style={S.th}>Nome</th><th style={S.th}>Status</th><th style={S.th}>Ações</th></tr></thead>
        <tbody>{items.map(item=>(
          <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}><strong>{item.name}</strong></td>
            <td style={S.td}><span style={{...S.badge,...(item.active?S.badgeActive:S.badgeInactive)}}>{item.active?"Ativo":"Inativo"}</span></td>
            <td style={S.td}>
              {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(item)}>✏️ Editar</button>}
              {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>🗑️ Excluir</button>}
            </td>
          </tr>
        ))}</tbody></table>
      )}
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
            <button style={{...S.btnSave,opacity:saving?.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId&&<ConfirmModal msg="Deseja excluir este registro?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
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
  useEffect(()=>{if(!p?.view)return;Promise.all([api.get("/profiles"),api.get("/screens")]).then(([pr,sc])=>{setProfiles(pr);setScreens(sc);}).catch(e=>alert(e.message)).finally(()=>setLoading(false));});
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
            <td style={S.td}>{p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(pr)}>✏️ Editar</button>}{p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(pr.id)}>🗑️ Excluir</button>}</td>
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
            <button style={{...S.btnSave,opacity:saving?.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
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
  const[loading,setLoading]=useState(true);const[modal,setModal]=useState(false);
  const[delId,setDelId]=useState(null);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState({id:null,name:"",email:"",password:"",profileId:"",companyId:"",teamId:"",active:true});
  const p=user.permissions?.s2;
  useEffect(()=>{if(!p?.view)return;Promise.all([api.get("/users"),api.get("/profiles"),api.get("/companies"),api.get("/teams")]).then(([u,pr,c,t])=>{setUsers(u);setProfiles(pr);setCompanies(c);setTeams(t);}).catch(e=>alert(e.message)).finally(()=>setLoading(false));});
  const openAdd=()=>{setForm({id:null,name:"",email:"",password:"",profileId:"",companyId:"",teamId:"",active:true});setModal(true);};
  const openEdit=u=>{setForm({...u,password:""});setModal(true);};
  const save=async()=>{
    if(!form.name.trim()||!form.email.trim())return alert("Nome e e-mail obrigatórios.");
    if(!form.id&&!form.password.trim())return alert("Senha obrigatória.");
    setSaving(true);try{if(form.id){const u=await api.put(`/users/${form.id}`,form);setUsers(us=>us.map(x=>x.id===u.id?{...x,...u}:x));}else{const c=await api.post("/users",form);setUsers(us=>[...us,c]);}setModal(false);}catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`/users/${delId}`);setUsers(us=>us.filter(u=>u.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>👥 Usuários</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Novo Usuário</button>}</div>
      {users.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>👤</span>Nenhum usuário.</div>:(
        <table style={S.table}><thead><tr>
          {["Nome","E-mail","Empresa","Equipe","Perfil","Status","Ações"].map(h=><th key={h} style={S.th}>{h}</th>)}
        </tr></thead><tbody>{users.map(u=>(
          <tr key={u.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
            <td style={S.td}><strong>{u.name}</strong></td><td style={S.td}>{u.email}</td>
            <td style={S.td}>{u.companyName||"—"}</td><td style={S.td}>{u.teamName||"—"}</td><td style={S.td}>{u.profileName||"—"}</td>
            <td style={S.td}><span style={{...S.badge,...(u.active?S.badgeActive:S.badgeInactive)}}>{u.active?"Ativo":"Inativo"}</span></td>
            <td style={S.td}>{p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(u)}>✏️ Editar</button>}{p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(u.id)}>🗑️ Excluir</button>}</td>
          </tr>
        ))}</tbody></table>
      )}
      {modal&&(
        <Modal title={form.id?"Editar Usuário":"Novo Usuário"} onClose={()=>setModal(false)}>
          <Input label="Nome completo" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
          <Input label="E-mail" type="email" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} required/>
          <Input label={form.id?"Nova senha (em branco para manter)":"Senha"} type="password" value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} required={!form.id}/>
          <SelectField label="Empresa"  value={form.companyId} onChange={v=>setForm(f=>({...f,companyId:v}))} options={companies.map(c=>({value:c.id,label:c.name}))}/>
          <SelectField label="Equipe"   value={form.teamId}    onChange={v=>setForm(f=>({...f,teamId:v}))}    options={teams.map(t=>({value:t.id,label:t.name}))}/>
          <SelectField label="Perfil"   value={form.profileId} onChange={v=>setForm(f=>({...f,profileId:v}))} options={profiles.map(p=>({value:p.id,label:p.name}))}/>
          <div style={S.formRow}><label style={S.label}>STATUS</label>
            <div style={{display:"flex",gap:16}}>{[{v:true,l:"Ativo"},{v:false,l:"Inativo"}].map(o=>(
              <label key={String(o.v)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                <input type="radio" checked={form.active===o.v} onChange={()=>setForm(f=>({...f,active:o.v}))} style={{accentColor:C.primary}}/>{o.l}
              </label>
            ))}</div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
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
  const[form,setForm]=useState({id:null,companyId:"",teamId:"",dataInicio:"",dataFim:""});
  const p=user.permissions?.s5;
  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/escalas"),api.get("/companies"),api.get("/teams")])
      .then(([e,c,t])=>{setEscalas(e);setCompanies(c);setTeams(t);})
      .catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);
  const openAdd=()=>{setForm({id:null,companyId:"",teamId:"",dataInicio:"",dataFim:""});setModalEscala(true);};
  const openEdit=e=>{setForm({...e});setModalEscala(true);};
  const saveEscala=async()=>{
    if(!form.companyId||!form.teamId||!form.dataInicio||!form.dataFim)return alert("Todos os campos são obrigatórios.");
    setSaving(true);
    try{
      if(form.id){const u=await api.put(`/escalas/${form.id}`,form);setEscalas(es=>es.map(e=>e.id===u.id?u:e));setModalEscala(false);}
      else{const c=await api.post("/escalas",form);setEscalas(es=>[...es,c]);setModalEscala(false);setModalCal(c);}
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{try{await api.delete(`/escalas/${delId}`);setEscalas(es=>es.filter(e=>e.id!==delId));setDelId(null);}catch(e){alert(e.message);}};
  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  if(loading)return<Spinner/>;
  return(
    <div style={S.card}>
      <div style={S.cardHeader}><span style={S.cardTitle}>⏱️ Controle de Horas — Escalas de Sobreaviso</span>{p?.insert&&<button style={S.btnAdd} onClick={openAdd}>+ Nova Escala</button>}</div>
      {escalas.length===0?<div style={S.emptyState}><span style={S.emptyIcon}>📅</span>Nenhuma escala.</div>:(
        <table style={S.table}><thead><tr>
          <th style={S.th}>Empresa</th><th style={S.th}>Equipe</th><th style={S.th}>Período</th><th style={S.th}>Ações</th>
        </tr></thead><tbody>{escalas.map(e=>(
          <tr key={e.id} onMouseOver={ev=>ev.currentTarget.style.background=C.bg} onMouseOut={ev=>ev.currentTarget.style.background=C.white}>
            <td style={S.td}><strong>{e.companyName||"—"}</strong></td>
            <td style={S.td}>{e.teamName||"—"}</td>
            <td style={S.td}>{e.dataInicio} até {e.dataFim}</td>
            <td style={S.td}>
              <button style={{...S.actionBtn,background:"#E8F5E9",color:"#2E7D32",marginRight:4}} onClick={()=>setModalCal(e)}>📅 Calendário</button>
              {p?.edit&&<button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(e)}>✏️ Editar</button>}
              {p?.delete&&<button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(e.id)}>🗑️ Excluir</button>}
            </td>
          </tr>
        ))}</tbody></table>
      )}
      {modalEscala&&(
        <Modal title={form.id?"Editar Escala":"Nova Escala"} onClose={()=>setModalEscala(false)}>
          <SelectField label="Empresa" value={form.companyId} onChange={v=>setForm(f=>({...f,companyId:v}))} options={companies.map(c=>({value:c.id,label:c.name}))} required/>
          <SelectField label="Equipe"  value={form.teamId}    onChange={v=>setForm(f=>({...f,teamId:v}))}    options={teams.map(t=>({value:t.id,label:t.name}))} required/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Input label="Período Inicial (dd/mm/aaaa)" value={form.dataInicio} onChange={v=>setForm(f=>({...f,dataInicio:v}))} placeholder="01/01/2025" required/>
            <Input label="Período Final (dd/mm/aaaa)"   value={form.dataFim}    onChange={v=>setForm(f=>({...f,dataFim:v}))}    placeholder="31/01/2025" required/>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <button style={S.btnCancel} onClick={()=>setModalEscala(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?.7:1}} onClick={saveEscala} disabled={saving}>{saving?"Salvando...":"Salvar e Abrir Calendário"}</button>
          </div>
        </Modal>
      )}
      {modalCal&&<CalendarioModal escala={modalCal} user={user} onClose={()=>setModalCal(null)}/>}
      {delId&&<ConfirmModal msg="Excluir esta escala?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
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
    Promise.all([api.get(`/escalas/${escala.id}/turnos`),api.get(`/teams/${escala.teamId}/users`)])
      .then(([t,u])=>{
        const map={};t.forEach(r=>{map[`${r.turnoDate}_${r.turno}`]=r;});
        setTurnos(map);setTeamUsers(u);
      }).catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  const handleUserChange=async(dateStr,turno,userId)=>{
    const key=`${dateStr}_${turno}`;setSaving(s=>({...s,[key]:true}));
    try{
      await api.post(`/escalas/${escala.id}/turnos`,{turnoDate:dateStr,turno,userId:userId||null});
      setTurnos(t=>{const n={...t};if(!userId){delete n[key];}else{n[key]={...(n[key]||{}),userId,turnoDate:dateStr,turno};}return n;});
    }catch(e){alert(e.message);}finally{setSaving(s=>({...s,[key]:false}));}
  };

  const openDetalhe=(dateStr,turno)=>{
    const key=`${dateStr}_${turno}`;
    const td=turnos[key];
    if(!td||!td.userId){alert("Selecione um responsável antes de editar os detalhes.");return;}
    setDetalheModal({dateStr,turno,turnoData:{...td}});
  };

  const saveDetalhe=async(updated)=>{
    const key=`${updated.dateStr}_${updated.turno}`;
    // Find turnoId from turnos map
    const td=turnos[key];if(!td?.id)return;
    try{
      await api.put(`/escalas/${escala.id}/turnos/${td.id}`,{
        isFeriado:updated.isFeriado,horaInicio:updated.horaInicio,horaFim:updated.horaFim,
        extraInicio:updated.extraInicio,extraFim:updated.extraFim,observacao:updated.observacao,
      });
      setTurnos(t=>({...t,[key]:{...t[key],...updated}}));
      setDetalheModal(null);
    }catch(e){alert(e.message);}
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
            <div style={{fontSize:13,color:C.textLight,marginTop:-14}}>{escala.companyName} · {escala.teamName} · {escala.dataInicio} a {escala.dataFim}</div>
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
                                const userName=td?.userId?teamUsers.find(u=>u.id===td.userId)?.name||"":"";
                                const hasExtra=td?.extraInicio&&td?.extraFim;
                                return(
                                  <div key={t.key} style={{marginBottom:3}}>
                                    <select value={td?.userId||""} onChange={e=>handleUserChange(dateStr,t.key,e.target.value)} disabled={isSaving}
                                      style={{width:"100%",fontSize:9,padding:"2px 3px",borderRadius:3,border:`1.5px solid ${t.border}`,background:isSaving?"#eee":t.bg,color:C.text,cursor:"pointer",outline:"none"}}>
                                      <option value="">— {t.label}</option>
                                      {teamUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                    {td?.userId&&(
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

  // Only the assigned user can edit extras
  const isOwner=loggedUser.id===turnoData?.userId;
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
            <Input label="Hora Início" type="time" value={horaInicio} onChange={setHoraInicio}/>
            <Input label="Hora Fim"    type="time" value={horaFim}    onChange={setHoraFim}/>
          </div>
        </div>
        {/* Horas extras - só o responsável edita */}
        <div style={{background:isOwner?"#FFFDE7":"#F5F5F5",borderRadius:8,padding:12,marginBottom:16,border:`1px solid ${isOwner?"#F9A825":C.border}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.accent,marginBottom:10,letterSpacing:.5}}>⚡ HORAS EXTRAS {!isOwner&&<span style={{color:C.textLight,fontWeight:400}}>(apenas o responsável pode editar)</span>}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Início Extra" type="time" value={extraInicio} onChange={setExtraInicio} disabled={!isOwner}/>
            <Input label="Fim Extra"    type="time" value={extraFim}    onChange={setExtraFim}    disabled={!isOwner}/>
          </div>
          {extraMin>0&&<div style={{fontSize:12,color:C.success,fontWeight:700,marginTop:4}}>Total Extra: {minutesToHHMM(extraMin)}</div>}
          <div style={S.formRow}>
            <label style={S.label}>Observação / Motivo da Hora Extra</label>
            <textarea value={observacao} onChange={e=>setObservacao(e.target.value)} disabled={!isOwner} rows={2}
              style={{...S.input,resize:"vertical",background:!isOwner?"#f9f9f9":C.white}}
              placeholder={isOwner?"Descreva o motivo das horas extras...":""}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button style={S.btnCancel} onClick={onClose}>Cancelar</button>
          <button style={{...S.btnSave,opacity:saving?.7:1}} onClick={handleSave} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
        </div>
      </div>
    </div>
  );
}

// ── RELATÓRIO DE HORAS ────────────────────────────────────────
function RelatorioHorasScreen({user}){
  const[companies,setCompanies]=useState([]);const[teams,setTeams]=useState([]);const[users,setUsers]=useState([]);
  const[filters,setFilters]=useState({dataInicio:"",dataFim:"",userId:"",teamId:"",companyId:""});
  const[result,setResult]=useState(null);const[loading,setLoading]=useState(false);const[loaded,setLoaded]=useState(false);
  const p=user.permissions?.s6;
  useEffect(()=>{
    if(!p?.view)return;
    Promise.all([api.get("/companies"),api.get("/teams"),api.get("/users")])
      .then(([c,t,u])=>{setCompanies(c);setTeams(t);setUsers(u);}).catch(e=>alert(e.message));
  },[]);
  const buscar=async()=>{
    if(!filters.dataInicio||!filters.dataFim)return alert("Informe o período.");
    setLoading(true);setLoaded(false);
    try{
      const params=new URLSearchParams({dataInicio:filters.dataInicio,dataFim:filters.dataFim});
      if(filters.userId)params.append("userId",filters.userId);
      if(filters.teamId)params.append("teamId",filters.teamId);
      if(filters.companyId)params.append("companyId",filters.companyId);
      const data=await api.get(`/escalas/relatorio/horas?${params}`);
      setResult(data);setLoaded(true);
    }catch(e){alert(e.message);}finally{setLoading(false);}
  };
  if(!p?.view)return<div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão.</div>;
  return(
    <div>
      {/* Filtros */}
      <div style={{...S.card,marginBottom:20}}>
        <div style={{...S.cardHeader,marginBottom:16}}><span style={S.cardTitle}>📊 Relatório de Horas de Sobreaviso</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:16,marginBottom:16}}>
          <Input label="Período Inicial (dd/mm/aaaa)" value={filters.dataInicio} onChange={v=>setFilters(f=>({...f,dataInicio:v}))} placeholder="01/01/2025" required/>
          <Input label="Período Final (dd/mm/aaaa)"   value={filters.dataFim}    onChange={v=>setFilters(f=>({...f,dataFim:v}))}    placeholder="31/01/2025" required/>
          <SelectField label="Empresa" value={filters.companyId} onChange={v=>setFilters(f=>({...f,companyId:v}))} options={companies.map(c=>({value:c.id,label:c.name}))}/>
          <SelectField label="Equipe"  value={filters.teamId}    onChange={v=>setFilters(f=>({...f,teamId:v}))}    options={teams.map(t=>({value:t.id,label:t.name}))}/>
          <SelectField label="Usuário" value={filters.userId}    onChange={v=>setFilters(f=>({...f,userId:v}))}    options={users.map(u=>({value:u.id,label:u.name}))}/>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button style={S.btnSave} onClick={buscar} disabled={loading}>{loading?"Buscando...":"🔍 Gerar Relatório"}</button>
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
                      <td style={{...S.td,textAlign:"center"}}><span style={{fontWeight:700,color:u.extraMins>0?C.danger:C.textLight}}>{u.extraHHMM}</span></td>
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
  ].filter(c=>user.permissions?.[c.screenId]?.view);
  return(
    <div>
      <div style={{marginBottom:28}}>
        <h2 style={{fontSize:22,fontWeight:700,color:C.accent,margin:0}}>Olá, {user.name.split(" ")[0]}! 👋</h2>
        <p style={{color:C.textLight,marginTop:6,fontSize:13}}>Bem-vindo ao Sistema de Controle de TI</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16,marginBottom:28}}>
        {[{label:"Usuários",value:stats.usuarios,icon:"👥",color:C.primary},{label:"Empresas",value:stats.empresas,icon:"🏢",color:C.secondary},{label:"Perfis",value:stats.perfis,icon:"👤",color:"#2980B9"},{label:"Equipes",value:stats.equipes,icon:"👷",color:"#8E44AD"},{label:"Escalas",value:stats.escalas,icon:"📅",color:"#27AE60"}].map(s=>(
          <div key={s.label} style={{...S.card,borderTop:`3px solid ${s.color}`,padding:20,display:"flex",alignItems:"center",gap:16}}>
            <span style={{fontSize:32}}>{s.icon}</span>
            <div><div style={{fontSize:26,fontWeight:800,color:s.color}}>{s.value}</div><div style={{fontSize:11,color:C.textLight,fontWeight:600}}>{s.label}</div></div>
          </div>
        ))}
      </div>
      {cards.length>0&&(
        <div style={S.card}>
          <div style={{...S.cardHeader,marginBottom:16}}><span style={{fontSize:15,fontWeight:700,color:C.accent}}>Acesso Rápido</span></div>
          <div style={S.homeGrid}>
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

// ── SIDEBAR ───────────────────────────────────────────────────
const navConfig=[
  {id:"cadastros",label:"Cadastros",icon:"📁",children:[
    {id:"s1",label:"Perfis",  icon:"👤"},{id:"s2",label:"Usuários",icon:"👥"},
    {id:"s3",label:"Empresas",icon:"🏢"},{id:"s4",label:"Equipes",  icon:"👷"},
  ]},
  {id:"movimentacoes",label:"Movimentações",icon:"🔄",children:[
    {id:"s5",label:"Controle de Horas",icon:"⏱️"},
  ]},
  {id:"relatorios",label:"Relatórios",icon:"📊",children:[
    {id:"s6",label:"Relatório de Horas",icon:"📋"},
  ]},
];
function Sidebar({user,currentScreen,onNavigate,onLogout}){
  const[expanded,setExpanded]=useState({cadastros:true,movimentacoes:true,relatorios:true});
  const toggle=id=>setExpanded(e=>({...e,[id]:!e[id]}));
  return(
    <div style={S.sidebar}>
      <div style={{padding:"20px 16px",borderBottom:"1px solid #444",display:"flex",alignItems:"center"}}><Logo size={28}/></div>
      <div style={{padding:"12px 16px 8px",borderBottom:"1px solid #444"}}>
        <div style={{fontSize:12,color:"#aaa"}}>Usuário logado</div>
        <div style={{fontSize:13,fontWeight:700,color:"#eee",marginTop:2}}>{user.name}</div>
        <div style={{fontSize:11,color:"#888"}}>{user.email}</div>
      </div>
      <nav style={S.navSection}>
        <div style={{padding:"8px 16px 4px",fontSize:10,color:"#777",fontWeight:700,letterSpacing:1}}>NAVEGAÇÃO</div>
        <div style={{...S.navItem,background:currentScreen==="home"?C.primary:"none",color:currentScreen==="home"?C.white:"#bbb",padding:"10px 16px",fontWeight:600}}
          onClick={()=>onNavigate("home")}
          onMouseOver={e=>{if(currentScreen!=="home")e.currentTarget.style.background=C.sidebarHover;}}
          onMouseOut={e=>{if(currentScreen!=="home")e.currentTarget.style.background="none";}}>
          🏠 Início
        </div>
        {navConfig.map(group=>(
          <div key={group.id}>
            <button style={{...S.navGroupBtn,color:expanded[group.id]?"#eee":"#bbb"}} onClick={()=>toggle(group.id)}>
              <span style={{display:"flex",alignItems:"center",gap:8}}>{group.icon} {group.label}</span>
              <span style={{fontSize:10,transform:expanded[group.id]?"rotate(180deg)":"none",display:"inline-block"}}>▼</span>
            </button>
            {expanded[group.id]&&group.children.map(item=>{
              if(!user.permissions?.[item.id]?.view)return null;
              const active=currentScreen===item.id;
              return(
                <div key={item.id}
                  style={{...S.navItem,background:active?C.primary:"none",color:active?C.white:"#bbb",borderLeft:active?`3px solid ${C.secondary}`:"3px solid transparent"}}
                  onClick={()=>onNavigate(item.id)}
                  onMouseOver={e=>{if(!active)e.currentTarget.style.background=C.sidebarHover;}}
                  onMouseOut={e=>{if(!active)e.currentTarget.style.background="none";}}>
                  {item.icon} {item.label}
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
          🚪 Sair do sistema
        </button>
      </div>
    </div>
  );
}

const screenTitles={home:"Início",s1:"Cadastros › Perfis",s2:"Cadastros › Usuários",s3:"Cadastros › Empresas",s4:"Cadastros › Equipes",s5:"Movimentações › Controle de Horas",s6:"Relatórios › Relatório de Horas"};

export default function App(){
  const[user,setUser]=useState(null);const[screen,setScreen]=useState("home");
  useEffect(()=>{const saved=localStorage.getItem("sl_session");if(saved){try{const{user,token}=JSON.parse(saved);api.setToken(token);setUser(user);}catch{localStorage.removeItem("sl_session");}}});
  const handleLogin=(user,token)=>{localStorage.setItem("sl_session",JSON.stringify({user,token}));setUser(user);setScreen("home");};
  const handleLogout=()=>{localStorage.removeItem("sl_session");api.setToken(null);setUser(null);};
  if(!user)return<Login onLogin={handleLogin}/>;
  const screenMap={
    home:<HomeScreen user={user} navigate={setScreen}/>,
    s1:<ProfilesScreen user={user}/>,s2:<UsersScreen user={user}/>,
    s3:<SimpleListScreen user={user} screenId="s3" title="Empresas" icon="🏢" apiPath="/companies"/>,
    s4:<SimpleListScreen user={user} screenId="s4" title="Equipes"  icon="👷" apiPath="/teams"/>,
    s5:<ControleHorasScreen user={user}/>,s6:<RelatorioHorasScreen user={user}/>,
  };
  return(
    <div style={S.layout}>
      <Sidebar user={user} currentScreen={screen} onNavigate={setScreen} onLogout={handleLogout}/>
      <div style={S.main}>
        <div style={S.topbar}>
          <div>
            <div style={{fontSize:11,color:C.textLight,letterSpacing:1,fontWeight:600}}>SISTEMA DE CONTROLE DE TI</div>
            <div style={S.topbarTitle}>{screenTitles[screen]||"Início"}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {screen!=="home"&&<button style={S.btnClose} onClick={()=>setScreen("home")}>✕ Fechar</button>}
            <div style={S.userBadge}>{getInit(user.name)}</div>
          </div>
        </div>
        <div style={S.content}>{screenMap[screen]||<div style={S.emptyState}><span style={S.emptyIcon}>🚧</span>Em desenvolvimento</div>}</div>
      </div>
    </div>
  );
}
