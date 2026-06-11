import { useState, useEffect } from "react";

// ==================== API CONFIG ====================
const API_URL = "http://localhost:3001";

const api = {
  token: null,
  setToken(t) { this.token = t; },
  async request(method, path, body) {
    const opts = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
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

// ==================== COLORS ====================
const C = {
  primary:      "#F0A500",
  secondary:    "#E05A00",
  accent:       "#616161",
  dark:         "#2D2D2D",
  sidebar:      "#2E2E2E",
  sidebarHover: "#3A3A3A",
  text:         "#444",
  textLight:    "#888",
  border:       "#E0E0E0",
  white:        "#FFFFFF",
  success:      "#27AE60",
  danger:       "#E74C3C",
  bg:           "#F5F5F5",
  manha:        "#FFF3CD",
  tarde:        "#D1ECF1",
  noite:        "#E2D9F3",
  manhaBorder:  "#F0A500",
  tardeBorder:  "#17A2B8",
  noiteBorder:  "#6F42C1",
};

// ==================== LOGO ====================
const Logo = ({ size = 36 }) => (
  <svg width={size * 1.6} height={size} viewBox="0 0 90 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8"  cy="28" r="3.5" fill="#F0A500" opacity="1"/>
    <circle cx="14" cy="18" r="3"   fill="#F0A500" opacity="0.85"/>
    <circle cx="14" cy="38" r="3"   fill="#F0A500" opacity="0.85"/>
    <circle cx="22" cy="11" r="2.5" fill="#F0A500" opacity="0.7"/>
    <circle cx="22" cy="28" r="2.5" fill="#E05A00" opacity="0.6"/>
    <circle cx="22" cy="45" r="2.5" fill="#F0A500" opacity="0.7"/>
    <circle cx="30" cy="6"  r="2"   fill="#F8C300" opacity="0.6"/>
    <circle cx="30" cy="17" r="2"   fill="#F0A500" opacity="0.5"/>
    <circle cx="30" cy="39" r="2"   fill="#F0A500" opacity="0.5"/>
    <circle cx="30" cy="50" r="2"   fill="#F8C300" opacity="0.6"/>
    <text x="38" y="34" fontFamily="'Segoe UI',Arial,sans-serif" fontWeight="900" fontSize="22" fill="#616161" letterSpacing="-1">SL</text>
    <text x="38" y="48" fontFamily="'Segoe UI',Arial,sans-serif" fontWeight="500" fontSize="9"  fill="#888"    letterSpacing="3">GRUPO</text>
  </svg>
);

// ==================== STYLES ====================
const S = {
  loginWrap:    { display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:`linear-gradient(135deg,${C.dark} 0%,#444 100%)` },
  loginCard:    { background:C.white, borderRadius:12, padding:"48px 40px", width:380, boxShadow:"0 20px 60px rgba(0,0,0,0.4)", borderTop:`4px solid ${C.primary}` },
  loginTitle:   { textAlign:"center", marginBottom:8, color:C.accent, fontSize:15, fontWeight:600, letterSpacing:1 },
  loginSub:     { textAlign:"center", color:C.textLight, fontSize:12, marginBottom:32 },
  label:        { display:"block", fontSize:12, fontWeight:600, color:C.accent, marginBottom:6, letterSpacing:0.5 },
  input:        { width:"100%", padding:"10px 14px", border:`1.5px solid ${C.border}`, borderRadius:6, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text },
  select:       { width:"100%", padding:"10px 14px", border:`1.5px solid ${C.border}`, borderRadius:6, fontSize:14, outline:"none", boxSizing:"border-box", color:C.text, background:C.white },
  btnPrimary:   { width:"100%", padding:"12px", background:C.primary, color:C.white, border:"none", borderRadius:6, fontSize:14, fontWeight:700, cursor:"pointer", marginTop:8 },
  errorMsg:     { color:C.danger, fontSize:12, textAlign:"center", marginTop:8 },
  layout:       { display:"flex", height:"100vh", overflow:"hidden", fontFamily:"'Segoe UI',Arial,sans-serif" },
  sidebar:      { width:240, background:C.sidebar, color:C.white, display:"flex", flexDirection:"column", flexShrink:0 },
  navSection:   { flex:1, overflowY:"auto", padding:"8px 0" },
  navGroupBtn:  { width:"100%", background:"none", border:"none", color:"#ddd", padding:"10px 16px", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" },
  navItem:      { padding:"8px 16px 8px 36px", fontSize:13, cursor:"pointer", color:"#bbb", display:"flex", alignItems:"center", gap:8 },
  logoutBtn:    { width:"100%", background:"none", border:`1px solid #555`, color:"#bbb", padding:"8px", borderRadius:6, cursor:"pointer", fontSize:12 },
  main:         { flex:1, display:"flex", flexDirection:"column", overflow:"hidden" },
  topbar:       { background:C.white, padding:"12px 24px", borderBottom:`3px solid ${C.primary}`, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" },
  topbarTitle:  { fontSize:16, fontWeight:700, color:C.accent },
  content:      { flex:1, overflowY:"auto", padding:24, background:C.bg },
  card:         { background:C.white, borderRadius:10, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.07)", border:`1px solid ${C.border}` },
  cardHeader:   { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, paddingBottom:16, borderBottom:`2px solid ${C.primary}` },
  cardTitle:    { fontSize:18, fontWeight:700, color:C.accent },
  table:        { width:"100%", borderCollapse:"collapse", fontSize:13 },
  th:           { background:C.bg, padding:"10px 12px", textAlign:"left", fontWeight:700, color:C.accent, borderBottom:`2px solid ${C.primary}`, fontSize:12, letterSpacing:0.5 },
  td:           { padding:"10px 12px", borderBottom:`1px solid ${C.border}`, color:C.text, verticalAlign:"middle" },
  formRow:      { marginBottom:18 },
  modal:        { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 },
  modalCard:    { background:C.white, borderRadius:10, padding:32, width:"90%", maxWidth:600, boxShadow:"0 20px 60px rgba(0,0,0,0.3)", borderTop:`4px solid ${C.primary}`, maxHeight:"90vh", overflowY:"auto" },
  modalTitle:   { fontSize:17, fontWeight:700, color:C.accent, marginBottom:24 },
  actionBtn:    { padding:"5px 12px", border:"none", borderRadius:5, cursor:"pointer", fontSize:12, fontWeight:600, marginRight:4 },
  btnEdit:      { background:"#EBF5FB", color:"#2980B9" },
  btnDel:       { background:"#FDEDEC", color:C.danger },
  btnAdd:       { padding:"9px 18px", background:C.primary, color:C.white, border:"none", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:700 },
  btnSave:      { padding:"9px 18px", background:C.primary, color:C.white, border:"none", borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:700 },
  btnCancel:    { padding:"9px 18px", background:C.bg, color:C.text, border:`1px solid ${C.border}`, borderRadius:6, cursor:"pointer", fontSize:13 },
  btnClose:     { padding:"9px 18px", background:C.bg, color:C.accent, border:`1px solid ${C.border}`, borderRadius:6, cursor:"pointer", fontSize:13, fontWeight:600 },
  badge:        { display:"inline-block", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:700 },
  badgeActive:  { background:"#D5F5E3", color:"#1E8449" },
  badgeInactive:{ background:"#FDECEA", color:C.danger },
  userBadge:    { width:32, height:32, borderRadius:"50%", background:C.primary, display:"flex", alignItems:"center", justifyContent:"center", color:C.white, fontWeight:700, fontSize:14 },
  emptyState:   { textAlign:"center", padding:"60px 0", color:C.textLight },
  emptyIcon:    { fontSize:48, marginBottom:12, display:"block" },
  spinner:      { textAlign:"center", padding:"40px 0", color:C.textLight, fontSize:13 },
  homeGrid:     { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:20, marginTop:8 },
  homeCard:     { background:C.white, borderRadius:10, padding:24, boxShadow:"0 2px 12px rgba(0,0,0,0.07)", border:`1px solid ${C.border}`, cursor:"pointer", transition:"all .2s", textAlign:"center", borderTop:`3px solid ${C.primary}` },
};

// ==================== HELPERS ====================
const getInit = (name) => (name||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
const MONTHS  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

// ==================== SHARED COMPONENTS ====================
function Input({ label, value, onChange, type="text", placeholder, required }) {
  return (
    <div style={S.formRow}>
      <label style={S.label}>{label}{required && " *"}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={S.input}
        onFocus={e=>e.target.style.borderColor=C.primary}
        onBlur={e=>e.target.style.borderColor=C.border} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div style={S.formRow}>
      <label style={S.label}>{label}{required && " *"}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} style={S.select}>
        <option value="">Selecione...</option>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={S.modal} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...S.modalCard, maxWidth:wide?900:520}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <span style={S.modalTitle}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.textLight}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <Modal title="Confirmar exclusão" onClose={onCancel}>
      <p style={{color:C.text,marginBottom:24}}>{msg}</p>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button style={S.btnCancel} onClick={onCancel}>Cancelar</button>
        <button style={{...S.actionBtn,...S.btnDel,padding:"9px 18px",fontSize:13}} onClick={onConfirm}>Excluir</button>
      </div>
    </Modal>
  );
}

function Spinner() { return <div style={S.spinner}>Carregando...</div>; }

// ==================== LOGIN ====================
function Login({ onLogin }) {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const data = await api.post("/auth/login",{email,password});
      api.setToken(data.token);
      onLogin(data.user, data.token);
    } catch(err){ setError(err.message); }
    finally{ setLoading(false); }
  };

  return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={{textAlign:"center",marginBottom:28}}><Logo size={40}/></div>
        <p style={S.loginTitle}>SISTEMA DE CONTROLE DE TI</p>
        <p style={S.loginSub}>Informe suas credenciais para continuar</p>
        <Input label="E-mail" value={email} onChange={setEmail} placeholder="admin@slgrupo.com"/>
        <Input label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••"/>
        {error && <p style={S.errorMsg}>{error}</p>}
        <button style={{...S.btnPrimary,opacity:loading?0.7:1}} onClick={handleLogin} disabled={loading}>
          {loading?"Entrando...":"Entrar"}
        </button>
      </div>
    </div>
  );
}

// ==================== GENERIC CRUD SCREEN ====================
// Used for Profiles, Companies, Teams
function SimpleListScreen({ user, screenId, title, icon, apiPath, fields, canProtect }) {
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(false);
  const [delId,setDelId]=useState(null);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({});

  const canInsert = user.permissions?.[screenId]?.insert;
  const canEdit   = user.permissions?.[screenId]?.edit;
  const canDelete = user.permissions?.[screenId]?.delete;
  const canView   = user.permissions?.[screenId]?.view;

  const emptyForm = () => fields.reduce((a,f)=>({...a,[f.key]:f.default??""})  ,{id:null});

  useEffect(()=>{
    if(!canView) return;
    api.get(apiPath).then(setItems).catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  const openAdd  = ()=>{ setForm(emptyForm()); setModal(true); };
  const openEdit = (item)=>{ setForm({...item}); setModal(true); };

  const save = async ()=>{
    const required = fields.filter(f=>f.required);
    for(const f of required){ if(!form[f.key]?.toString().trim()) return alert(`${f.label} é obrigatório.`); }
    setSaving(true);
    try {
      if(form.id){
        const up = await api.put(`${apiPath}/${form.id}`,form);
        setItems(is=>is.map(i=>i.id===up.id?up:i));
      } else {
        const cr = await api.post(apiPath,form);
        setItems(is=>[...is,cr]);
      }
      setModal(false);
    } catch(e){ alert(e.message); }
    finally{ setSaving(false); }
  };

  const del = async ()=>{
    try{ await api.delete(`${apiPath}/${delId}`); setItems(is=>is.filter(i=>i.id!==delId)); setDelId(null); }
    catch(e){ alert(e.message); }
  };

  if(!canView) return <div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão de acesso.</div>;
  if(loading)  return <Spinner/>;

  const displayFields = fields.filter(f=>f.showInList!==false);

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>{icon} {title}</span>
        {canInsert && <button style={S.btnAdd} onClick={openAdd}>+ Novo(a)</button>}
      </div>
      {items.length===0 ? (
        <div style={S.emptyState}><span style={S.emptyIcon}>{icon}</span>Nenhum registro cadastrado.</div>
      ):(
        <table style={S.table}>
          <thead><tr>
            {displayFields.map(f=><th key={f.key} style={S.th}>{f.label}</th>)}
            <th style={S.th}>Ações</th>
          </tr></thead>
          <tbody>
            {items.map(item=>(
              <tr key={item.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                {displayFields.map(f=>(
                  <td key={f.key} style={S.td}>
                    {f.type==="status"
                      ? <span style={{...S.badge,...(item[f.key]?S.badgeActive:S.badgeInactive)}}>{item[f.key]?"Ativo":"Inativo"}</span>
                      : <span>{f.bold?<strong>{item[f.key]}</strong>:item[f.key]||"—"}</span>}
                  </td>
                ))}
                <td style={S.td}>
                  {canEdit   && <button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(item)}>✏️ Editar</button>}
                  {canDelete && (!canProtect||!canProtect(item)) && <button style={{...S.actionBtn,...S.btnDel}} onClick={()=>setDelId(item.id)}>🗑️ Excluir</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <Modal title={form.id?"Editar":"Novo(a)"} onClose={()=>setModal(false)}>
          {fields.filter(f=>f.type!=="status"||true).map(f=>{
            if(f.type==="status") return (
              <div key={f.key} style={S.formRow}>
                <label style={S.label}>STATUS</label>
                <div style={{display:"flex",gap:16,alignItems:"center"}}>
                  {[{v:true,l:"Ativo"},{v:false,l:"Inativo"}].map(opt=>(
                    <label key={String(opt.v)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                      <input type="radio" checked={form[f.key]===opt.v} onChange={()=>setForm(fm=>({...fm,[f.key]:opt.v}))} style={{accentColor:C.primary}}/>
                      {opt.l}
                    </label>
                  ))}
                </div>
              </div>
            );
            return <Input key={f.key} label={f.label} value={form[f.key]||""} onChange={v=>setForm(fm=>({...fm,[f.key]:v}))} required={f.required}/>;
          })}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId && <ConfirmModal msg="Deseja realmente excluir este registro?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ==================== PROFILES SCREEN ====================
function ProfilesScreen({ user }) {
  const [profiles,setProfiles]=useState([]);
  const [screens,setScreens]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(null);
  const [delId,setDelId]=useState(null);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({id:null,name:"",permissions:{}});

  const canInsert=user.permissions?.s1?.insert;
  const canEdit  =user.permissions?.s1?.edit;
  const canDelete=user.permissions?.s1?.delete;
  const canView  =user.permissions?.s1?.view;

  useEffect(()=>{
    if(!canView) return;
    Promise.all([api.get("/profiles"),api.get("/screens")])
      .then(([p,s])=>{setProfiles(p);setScreens(s);})
      .catch(e=>alert(e.message))
      .finally(()=>setLoading(false));
  },[]);

  const openAdd=()=>{
    const perms={};
    screens.forEach(s=>perms[s.id]={view:false,insert:false,edit:false,delete:false});
    setForm({id:null,name:"",permissions:perms}); setModal("form");
  };
  const openEdit=(p)=>{
    const perms={};
    screens.forEach(s=>{perms[s.id]=p.permissions?.[s.id]||{view:false,insert:false,edit:false,delete:false};});
    setForm({...p,permissions:perms}); setModal("form");
  };
  const togglePerm=(sid,action)=>setForm(f=>({...f,permissions:{...f.permissions,[sid]:{...f.permissions[sid],[action]:!f.permissions[sid]?.[action]}}}));

  const save=async()=>{
    if(!form.name.trim()) return alert("Nome do perfil é obrigatório.");
    setSaving(true);
    try{
      if(form.id){ const up=await api.put(`/profiles/${form.id}`,form); setProfiles(ps=>ps.map(p=>p.id===up.id?up:p)); }
      else{ const cr=await api.post("/profiles",form); setProfiles(ps=>[...ps,cr]); }
      setModal(null);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{
    try{ await api.delete(`/profiles/${delId}`); setProfiles(ps=>ps.filter(p=>p.id!==delId)); setDelId(null); }
    catch(e){alert(e.message);}
  };

  if(!canView) return <div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão de acesso.</div>;
  if(loading)  return <Spinner/>;

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>👤 Perfis de Acesso</span>
        {canInsert && <button style={S.btnAdd} onClick={openAdd}>+ Novo Perfil</button>}
      </div>
      {profiles.length===0 ? <div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Nenhum perfil cadastrado.</div> : (
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Nome do Perfil</th>
            <th style={S.th}>Telas com Acesso</th>
            <th style={S.th}>Ações</th>
          </tr></thead>
          <tbody>
            {profiles.map(p=>(
              <tr key={p.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={S.td}><strong>{p.name}</strong></td>
                <td style={S.td}>{screens.filter(s=>p.permissions?.[s.id]?.view).map(s=>(
                  <span key={s.id} style={{...S.badge,...S.badgeActive,marginRight:4}}>{s.name}</span>
                ))}</td>
                <td style={S.td}>
                  {canEdit   && <button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(p)}>✏️ Editar</button>}
                  {canDelete && <button style={{...S.actionBtn,...S.btnDel}}  onClick={()=>setDelId(p.id)}>🗑️ Excluir</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {modal==="form" && (
        <Modal title={form.id?"Editar Perfil":"Novo Perfil"} onClose={()=>setModal(null)} wide>
          <Input label="Nome do Perfil" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
          <div style={{marginBottom:16}}>
            <label style={{...S.label,marginBottom:12}}>PERMISSÕES POR TELA</label>
            <div style={{border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden"}}>
              <table style={S.table}>
                <thead><tr style={{background:C.bg}}>
                  <th style={{...S.th,width:"30%"}}>Tela</th>
                  <th style={{...S.th,textAlign:"center"}}>Visualizar</th>
                  <th style={{...S.th,textAlign:"center"}}>Incluir</th>
                  <th style={{...S.th,textAlign:"center"}}>Alterar</th>
                  <th style={{...S.th,textAlign:"center"}}>Excluir</th>
                </tr></thead>
                <tbody>
                  {screens.map(s=>(
                    <tr key={s.id}>
                      <td style={S.td}>{s.name}<br/><small style={{color:C.textLight}}>{s.module}</small></td>
                      {["view","insert","edit","delete"].map(action=>(
                        <td key={action} style={{...S.td,textAlign:"center"}}>
                          <input type="checkbox" checked={!!form.permissions[s.id]?.[action]} onChange={()=>togglePerm(s.id,action)}
                            style={{width:16,height:16,cursor:"pointer",accentColor:C.primary}}/>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId && <ConfirmModal msg="Deseja realmente excluir este perfil?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ==================== COMPANIES SCREEN ====================
function CompaniesScreen({ user }) {
  return <SimpleListScreen user={user} screenId="s3" title="Empresas" icon="🏢" apiPath="/companies"
    fields={[
      {key:"name",  label:"Nome da Empresa", required:true, bold:true},
      {key:"active",label:"Status",           type:"status", default:true},
    ]}
  />;
}

// ==================== TEAMS SCREEN ====================
function TeamsScreen({ user }) {
  return <SimpleListScreen user={user} screenId="s4" title="Equipes" icon="👷" apiPath="/teams"
    fields={[
      {key:"name",  label:"Nome da Equipe", required:true, bold:true},
      {key:"active",label:"Status",          type:"status", default:true},
    ]}
  />;
}

// ==================== USERS SCREEN ====================
function UsersScreen({ user }) {
  const [users,setUsers]=useState([]);
  const [profiles,setProfiles]=useState([]);
  const [companies,setCompanies]=useState([]);
  const [teams,setTeams]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(false);
  const [delId,setDelId]=useState(null);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({id:null,name:"",email:"",password:"",profileId:"",companyId:"",teamId:"",active:true});

  const canInsert=user.permissions?.s2?.insert;
  const canEdit  =user.permissions?.s2?.edit;
  const canDelete=user.permissions?.s2?.delete;
  const canView  =user.permissions?.s2?.view;

  useEffect(()=>{
    if(!canView) return;
    Promise.all([api.get("/users"),api.get("/profiles"),api.get("/companies"),api.get("/teams")])
      .then(([u,p,c,t])=>{setUsers(u);setProfiles(p);setCompanies(c);setTeams(t);})
      .catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  const openAdd=()=>{ setForm({id:null,name:"",email:"",password:"",profileId:"",companyId:"",teamId:"",active:true}); setModal(true); };
  const openEdit=(u)=>{ setForm({...u,password:""}); setModal(true); };

  const save=async()=>{
    if(!form.name.trim()||!form.email.trim()) return alert("Nome e e-mail são obrigatórios.");
    if(!form.id&&!form.password.trim()) return alert("Senha é obrigatória para novo usuário.");
    setSaving(true);
    try{
      if(form.id){ const up=await api.put(`/users/${form.id}`,form); setUsers(us=>us.map(u=>u.id===up.id?{...u,...up}:u)); }
      else{ const cr=await api.post("/users",form); setUsers(us=>[...us,cr]); }
      setModal(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };
  const del=async()=>{
    try{ await api.delete(`/users/${delId}`); setUsers(us=>us.filter(u=>u.id!==delId)); setDelId(null); }
    catch(e){alert(e.message);}
  };

  if(!canView) return <div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão de acesso.</div>;
  if(loading)  return <Spinner/>;

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>👥 Usuários</span>
        {canInsert && <button style={S.btnAdd} onClick={openAdd}>+ Novo Usuário</button>}
      </div>
      {users.length===0 ? <div style={S.emptyState}><span style={S.emptyIcon}>👤</span>Nenhum usuário cadastrado.</div> : (
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Nome</th>
            <th style={S.th}>E-mail</th>
            <th style={S.th}>Empresa</th>
            <th style={S.th}>Equipe</th>
            <th style={S.th}>Perfil</th>
            <th style={S.th}>Status</th>
            <th style={S.th}>Ações</th>
          </tr></thead>
          <tbody>
            {users.map(u=>(
              <tr key={u.id} onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
                <td style={S.td}><strong>{u.name}</strong></td>
                <td style={S.td}>{u.email}</td>
                <td style={S.td}>{u.companyName||"—"}</td>
                <td style={S.td}>{u.teamName||"—"}</td>
                <td style={S.td}>{u.profileName||"—"}</td>
                <td style={S.td}><span style={{...S.badge,...(u.active?S.badgeActive:S.badgeInactive)}}>{u.active?"Ativo":"Inativo"}</span></td>
                <td style={S.td}>
                  {canEdit   && <button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(u)}>✏️ Editar</button>}
                  {canDelete && <button style={{...S.actionBtn,...S.btnDel}}  onClick={()=>setDelId(u.id)}>🗑️ Excluir</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {modal && (
        <Modal title={form.id?"Editar Usuário":"Novo Usuário"} onClose={()=>setModal(false)}>
          <Input label="Nome completo" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} required/>
          <Input label="E-mail" type="email" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} required/>
          <Input label={form.id?"Nova senha (deixe em branco para manter)":"Senha"} type="password" value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} required={!form.id}/>
          <SelectField label="Empresa"  value={form.companyId||""} onChange={v=>setForm(f=>({...f,companyId:v}))} options={companies.map(c=>({value:c.id,label:c.name}))}/>
          <SelectField label="Equipe"   value={form.teamId||""}    onChange={v=>setForm(f=>({...f,teamId:v}))}    options={teams.map(t=>({value:t.id,label:t.name}))}/>
          <SelectField label="Perfil"   value={form.profileId||""} onChange={v=>setForm(f=>({...f,profileId:v}))} options={profiles.map(p=>({value:p.id,label:p.name}))}/>
          <div style={S.formRow}>
            <label style={S.label}>STATUS</label>
            <div style={{display:"flex",gap:16,alignItems:"center"}}>
              {[{v:true,l:"Ativo"},{v:false,l:"Inativo"}].map(opt=>(
                <label key={String(opt.v)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13}}>
                  <input type="radio" checked={form.active===opt.v} onChange={()=>setForm(f=>({...f,active:opt.v}))} style={{accentColor:C.primary}}/>
                  {opt.l}
                </label>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setModal(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={save} disabled={saving}>{saving?"Salvando...":"Salvar"}</button>
          </div>
        </Modal>
      )}
      {delId && <ConfirmModal msg="Deseja realmente excluir este usuário?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ==================== CONTROLE DE HORAS ====================
function ControleHorasScreen({ user }) {
  const [escalas,setEscalas]=useState([]);
  const [companies,setCompanies]=useState([]);
  const [teams,setTeams]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modalEscala,setModalEscala]=useState(false);
  const [modalCalendario,setModalCalendario]=useState(null); // escala selecionada
  const [delId,setDelId]=useState(null);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({id:null,companyId:"",teamId:"",month:"",year:""});

  const canInsert=user.permissions?.s5?.insert;
  const canEdit  =user.permissions?.s5?.edit;
  const canDelete=user.permissions?.s5?.delete;
  const canView  =user.permissions?.s5?.view;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({length:5},(_,i)=>({value:String(currentYear-1+i),label:String(currentYear-1+i)}));
  const monthOptions= MONTHS.map((m,i)=>({value:String(i+1),label:m}));

  useEffect(()=>{
    if(!canView) return;
    Promise.all([api.get("/escalas"),api.get("/companies"),api.get("/teams")])
      .then(([e,c,t])=>{setEscalas(e);setCompanies(c);setTeams(t);})
      .catch(e=>alert(e.message)).finally(()=>setLoading(false));
  },[]);

  const openAdd=()=>{ setForm({id:null,companyId:"",teamId:"",month:String(new Date().getMonth()+1),year:String(currentYear)}); setModalEscala(true); };
  const openEdit=(e)=>{ setForm({...e,month:String(e.month),year:String(e.year)}); setModalEscala(true); };

  const saveEscala=async()=>{
    if(!form.companyId||!form.teamId||!form.month||!form.year) return alert("Todos os campos são obrigatórios.");
    setSaving(true);
    try{
      if(form.id){
        const up=await api.put(`/escalas/${form.id}`,form);
        setEscalas(es=>es.map(e=>e.id===up.id?up:e));
      } else {
        const cr=await api.post("/escalas",form);
        setEscalas(es=>[...es,cr]);
        setModalEscala(false);
        setModalCalendario(cr);
        return;
      }
      setModalEscala(false);
    }catch(e){alert(e.message);}finally{setSaving(false);}
  };

  const del=async()=>{
    try{ await api.delete(`/escalas/${delId}`); setEscalas(es=>es.filter(e=>e.id!==delId)); setDelId(null); }
    catch(e){alert(e.message);}
  };

  if(!canView) return <div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão de acesso.</div>;
  if(loading)  return <Spinner/>;

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>⏱️ Controle de Horas — Escalas de Sobreaviso</span>
        {canInsert && <button style={S.btnAdd} onClick={openAdd}>+ Nova Escala</button>}
      </div>

      {escalas.length===0 ? <div style={S.emptyState}><span style={S.emptyIcon}>📅</span>Nenhuma escala cadastrada.</div> : (
        <table style={S.table}>
          <thead><tr>
            <th style={S.th}>Empresa</th>
            <th style={S.th}>Equipe</th>
            <th style={S.th}>Mês/Ano</th>
            <th style={S.th}>Ações</th>
          </tr></thead>
          <tbody>
            {escalas.map(e=>(
              <tr key={e.id} onMouseOver={ev=>ev.currentTarget.style.background=C.bg} onMouseOut={ev=>ev.currentTarget.style.background=C.white}>
                <td style={S.td}><strong>{e.companyName||"—"}</strong></td>
                <td style={S.td}>{e.teamName||"—"}</td>
                <td style={S.td}>{MONTHS[(e.month||1)-1]} / {e.year}</td>
                <td style={S.td}>
                  <button style={{...S.actionBtn,background:"#E8F5E9",color:"#2E7D32",marginRight:4}} onClick={()=>setModalCalendario(e)}>📅 Calendário</button>
                  {canEdit   && <button style={{...S.actionBtn,...S.btnEdit}} onClick={()=>openEdit(e)}>✏️ Editar</button>}
                  {canDelete && <button style={{...S.actionBtn,...S.btnDel}}  onClick={()=>setDelId(e.id)}>🗑️ Excluir</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal Nova/Editar Escala */}
      {modalEscala && (
        <Modal title={form.id?"Editar Escala":"Nova Escala"} onClose={()=>setModalEscala(false)}>
          <SelectField label="Empresa" value={form.companyId} onChange={v=>setForm(f=>({...f,companyId:v}))} options={companies.map(c=>({value:c.id,label:c.name}))} required/>
          <SelectField label="Equipe"  value={form.teamId}    onChange={v=>setForm(f=>({...f,teamId:v}))}    options={teams.map(t=>({value:t.id,label:t.name}))} required/>
          <SelectField label="Mês"     value={form.month}     onChange={v=>setForm(f=>({...f,month:v}))}     options={monthOptions} required/>
          <SelectField label="Ano"     value={form.year}      onChange={v=>setForm(f=>({...f,year:v}))}      options={yearOptions} required/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
            <button style={S.btnCancel} onClick={()=>setModalEscala(false)}>Cancelar</button>
            <button style={{...S.btnSave,opacity:saving?0.7:1}} onClick={saveEscala} disabled={saving}>{saving?"Salvando...":"Salvar e Abrir Calendário"}</button>
          </div>
        </Modal>
      )}

      {/* Modal Calendário */}
      {modalCalendario && (
        <CalendarioModal
          escala={modalCalendario}
          user={user}
          onClose={()=>setModalCalendario(null)}
        />
      )}

      {delId && <ConfirmModal msg="Deseja realmente excluir esta escala?" onConfirm={del} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

// ==================== CALENDARIO MODAL ====================
function CalendarioModal({ escala, user, onClose }) {
  const [turnos,setTurnos]=useState({});       // { "2024-01-05_manha": userId, ... }
  const [teamUsers,setTeamUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState({});

  const month = parseInt(escala.month);
  const year  = parseInt(escala.year);

  // Build calendar days
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay    = new Date(year, month-1, 1).getDay();
  const days = Array.from({length:daysInMonth},(_,i)=>i+1);

  const turnoConfig = [
    {key:"manha", label:"☀️ Manhã",   bg:C.manha,  border:C.manhaBorder},
    {key:"tarde", label:"🌤️ Tarde",   bg:C.tarde,  border:C.tardeBorder},
    {key:"noite", label:"🌙 Noite",   bg:C.noite,  border:C.noiteBorder},
  ];

  useEffect(()=>{
    Promise.all([
      api.get(`/escalas/${escala.id}/turnos`),
      api.get(`/teams/${escala.teamId}/users`),
    ]).then(([t,u])=>{
      const map={};
      t.forEach(r=>{ map[`${r.day}_${r.turno}`]=r.userId; });
      setTurnos(map);
      setTeamUsers(u);
    }).catch(e=>alert(e.message))
    .finally(()=>setLoading(false));
  },[]);

  const handleChange=async(day,turno,userId)=>{
    const key=`${day}_${turno}`;
    setSaving(s=>({...s,[key]:true}));
    try{
      await api.post(`/escalas/${escala.id}/turnos`,{day,turno,userId:userId||null});
      setTurnos(t=>({...t,[key]:userId||null}));
    }catch(e){alert(e.message);}
    finally{setSaving(s=>({...s,[key]:false}));}
  };

  const getUserName=(uid)=>{
    if(!uid) return "";
    const u=teamUsers.find(u=>u.id===uid);
    return u?u.name:"";
  };

  // Calendar grid: weeks rows
  const weeks=[];
  let week=Array(firstDay).fill(null);
  days.forEach(d=>{
    week.push(d);
    if(week.length===7){ weeks.push(week); week=[]; }
  });
  if(week.length>0){ while(week.length<7) week.push(null); weeks.push(week); }

  return (
    <div style={S.modal} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{...S.modalCard, maxWidth:1100, width:"96%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={S.modalTitle}>📅 Escala de Sobreaviso</div>
            <div style={{fontSize:13,color:C.textLight,marginTop:-16}}>
              {escala.companyName} · {escala.teamName} · {MONTHS[month-1]} / {year}
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.textLight}}>✕</button>
        </div>

        {/* Legend */}
        <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap"}}>
          {turnoConfig.map(t=>(
            <div key={t.key} style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>
              <div style={{width:14,height:14,borderRadius:3,background:t.bg,border:`2px solid ${t.border}`}}/>
              <span>{t.label}</span>
            </div>
          ))}
        </div>

        {loading ? <Spinner/> : (
          <div style={{overflowX:"auto"}}>
            {/* Day headers */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
              {DAYS_PT.map(d=>(
                <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:C.accent,padding:"4px 0"}}>{d}</div>
              ))}
            </div>
            {/* Weeks */}
            {weeks.map((week,wi)=>(
              <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
                {week.map((day,di)=>{
                  if(!day) return <div key={di}/>;
                  const isWeekend = [0,6].includes((firstDay+day-1)%7);
                  return (
                    <div key={di} style={{
                      border:`1px solid ${C.border}`,
                      borderRadius:8,
                      padding:6,
                      background:isWeekend?"#FFF8F0":C.white,
                      minHeight:120,
                    }}>
                      <div style={{fontSize:12,fontWeight:700,color:isWeekend?C.secondary:C.accent,marginBottom:4,textAlign:"right"}}>{day}</div>
                      {turnoConfig.map(t=>{
                        const key=`${day}_${t.key}`;
                        const val=turnos[key]||"";
                        const isSaving=saving[key];
                        return (
                          <div key={t.key} style={{marginBottom:4}}>
                            <div style={{fontSize:9,fontWeight:700,color:C.textLight,letterSpacing:0.3,marginBottom:2}}>{t.label}</div>
                            <select
                              value={val}
                              onChange={e=>handleChange(day,t.key,e.target.value)}
                              disabled={isSaving}
                              style={{
                                width:"100%",
                                fontSize:10,
                                padding:"2px 4px",
                                borderRadius:4,
                                border:`1.5px solid ${t.border}`,
                                background:isSaving?"#eee":t.bg,
                                color:C.text,
                                cursor:"pointer",
                                outline:"none",
                              }}
                            >
                              <option value="">—</option>
                              {teamUsers.map(u=>(
                                <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
          <button style={S.btnSave} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ==================== HOME ====================
function HomeScreen({ user, navigate }) {
  const [stats,setStats]=useState({usuarios:0,empresas:0,perfis:0,equipes:0,escalas:0});

  useEffect(()=>{
    Promise.all([
      api.get("/users").catch(()=>[]),
      api.get("/companies").catch(()=>[]),
      api.get("/profiles").catch(()=>[]),
      api.get("/teams").catch(()=>[]),
      api.get("/escalas").catch(()=>[]),
    ]).then(([u,c,p,t,e])=>setStats({usuarios:u.length,empresas:c.length,perfis:p.length,equipes:t.length,escalas:e.length}));
  },[]);

  const cards=[
    {icon:"👤",title:"Perfis",   sub:`${stats.perfis} cadastrado(s)`,   action:()=>navigate("s1"),screenId:"s1"},
    {icon:"👥",title:"Usuários", sub:`${stats.usuarios} cadastrado(s)`,  action:()=>navigate("s2"),screenId:"s2"},
    {icon:"🏢",title:"Empresas", sub:`${stats.empresas} cadastrada(s)`,  action:()=>navigate("s3"),screenId:"s3"},
    {icon:"👷",title:"Equipes",  sub:`${stats.equipes} cadastrada(s)`,   action:()=>navigate("s4"),screenId:"s4"},
    {icon:"⏱️",title:"Controle de Horas",sub:`${stats.escalas} escala(s)`,action:()=>navigate("s5"),screenId:"s5"},
  ].filter(c=>user.permissions?.[c.screenId]?.view);

  return (
    <div>
      <div style={{marginBottom:28}}>
        <h2 style={{fontSize:22,fontWeight:700,color:C.accent,margin:0}}>Olá, {user.name.split(" ")[0]}! 👋</h2>
        <p style={{color:C.textLight,marginTop:6,fontSize:13}}>Bem-vindo ao Sistema de Controle de TI</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:16,marginBottom:28}}>
        {[
          {label:"Usuários",value:stats.usuarios,icon:"👥",color:C.primary},
          {label:"Empresas",value:stats.empresas,icon:"🏢",color:C.secondary},
          {label:"Perfis",  value:stats.perfis,  icon:"👤",color:"#2980B9"},
          {label:"Equipes", value:stats.equipes, icon:"👷",color:"#8E44AD"},
          {label:"Escalas", value:stats.escalas, icon:"📅",color:"#27AE60"},
        ].map(s=>(
          <div key={s.label} style={{...S.card,borderTop:`3px solid ${s.color}`,padding:20,display:"flex",alignItems:"center",gap:16}}>
            <span style={{fontSize:32}}>{s.icon}</span>
            <div>
              <div style={{fontSize:26,fontWeight:800,color:s.color}}>{s.value}</div>
              <div style={{fontSize:11,color:C.textLight,fontWeight:600}}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      {cards.length>0 && (
        <div style={S.card}>
          <div style={{...S.cardHeader,marginBottom:16}}>
            <span style={{fontSize:15,fontWeight:700,color:C.accent}}>Acesso Rápido</span>
          </div>
          <div style={S.homeGrid}>
            {cards.map(c=>(
              <div key={c.title} style={S.homeCard} onClick={c.action}
                onMouseOver={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.12)";}}
                onMouseOut={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.07)";}}>
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

// ==================== SIDEBAR ====================
const navConfig = [
  { id:"cadastros",     label:"Cadastros",     icon:"📁", children:[
    {id:"s1",label:"Perfis",          icon:"👤"},
    {id:"s2",label:"Usuários",        icon:"👥"},
    {id:"s3",label:"Empresas",        icon:"🏢"},
    {id:"s4",label:"Equipes",         icon:"👷"},
  ]},
  { id:"movimentacoes", label:"Movimentações", icon:"🔄", children:[
    {id:"s5",label:"Controle de Horas",icon:"⏱️"},
  ]},
  { id:"relatorios",    label:"Relatórios",    icon:"📊", children:[] },
];

function Sidebar({ user, currentScreen, onNavigate, onLogout }) {
  const [expanded,setExpanded]=useState({cadastros:true,movimentacoes:true});
  const toggle=(id)=>setExpanded(e=>({...e,[id]:!e[id]}));

  return (
    <div style={S.sidebar}>
      <div style={{padding:"20px 16px",borderBottom:"1px solid #444",display:"flex",alignItems:"center"}}>
        <Logo size={28}/>
      </div>
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
            {expanded[group.id] && group.children.length===0 && (
              <div style={{...S.navItem,color:"#666",fontSize:12,fontStyle:"italic"}}>Em desenvolvimento...</div>
            )}
            {expanded[group.id] && group.children.map(item=>{
              if(!user.permissions?.[item.id]?.view) return null;
              const active=currentScreen===item.id;
              return (
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

// ==================== SCREEN TITLES ====================
const screenTitles = {
  home:"Início",
  s1:"Cadastros › Perfis",
  s2:"Cadastros › Usuários",
  s3:"Cadastros › Empresas",
  s4:"Cadastros › Equipes",
  s5:"Movimentações › Controle de Horas",
};

// ==================== MAIN APP ====================
export default function App() {
  const [user,setUser]=useState(null);
  const [screen,setScreen]=useState("home");

  useEffect(()=>{
    const saved=localStorage.getItem("sl_session");
    if(saved){ try{ const {user,token}=JSON.parse(saved); api.setToken(token); setUser(user); }catch{ localStorage.removeItem("sl_session"); } }
  },[]);

  const handleLogin=(user,token)=>{ localStorage.setItem("sl_session",JSON.stringify({user,token})); setUser(user); setScreen("home"); };
  const handleLogout=()=>{ localStorage.removeItem("sl_session"); api.setToken(null); setUser(null); };

  if(!user) return <Login onLogin={handleLogin}/>;

  const screenMap={
    home:<HomeScreen user={user} navigate={setScreen}/>,
    s1:  <ProfilesScreen       user={user}/>,
    s2:  <UsersScreen          user={user}/>,
    s3:  <CompaniesScreen      user={user}/>,
    s4:  <TeamsScreen          user={user}/>,
    s5:  <ControleHorasScreen  user={user}/>,
  };

  return (
    <div style={S.layout}>
      <Sidebar user={user} currentScreen={screen} onNavigate={setScreen} onLogout={handleLogout}/>
      <div style={S.main}>
        <div style={S.topbar}>
          <div>
            <div style={{fontSize:11,color:C.textLight,letterSpacing:1,fontWeight:600}}>SISTEMA DE CONTROLE DE TI</div>
            <div style={S.topbarTitle}>{screenTitles[screen]||"Início"}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {screen!=="home" && <button style={S.btnClose} onClick={()=>setScreen("home")}>✕ Fechar</button>}
            <div style={S.userBadge}>{getInit(user.name)}</div>
          </div>
        </div>
        <div style={S.content}>
          {screenMap[screen]||<div style={S.emptyState}><span style={S.emptyIcon}>🚧</span>Em desenvolvimento</div>}
        </div>
      </div>
    </div>
  );
}
