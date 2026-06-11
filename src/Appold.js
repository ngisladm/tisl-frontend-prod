import { useState, useEffect, createContext, useContext, useCallback } from "react";

// ==================== API CONFIG ====================
const API_URL = "http://localhost:3001"; // troque pela URL do seu servidor em produção

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

  get:    (path)        => api.request("GET",    path),
  post:   (path, body)  => api.request("POST",   path, body),
  put:    (path, body)  => api.request("PUT",    path, body),
  delete: (path)        => api.request("DELETE", path),
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
};

// ==================== LOGO SVG ====================
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
  loginWrap:   { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: `linear-gradient(135deg, ${C.dark} 0%, #444 100%)` },
  loginCard:   { background: C.white, borderRadius: 12, padding: "48px 40px", width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.4)", borderTop: `4px solid ${C.primary}` },
  loginTitle:  { textAlign: "center", marginBottom: 8, color: C.accent, fontSize: 15, fontWeight: 600, letterSpacing: 1 },
  loginSub:    { textAlign: "center", color: C.textLight, fontSize: 12, marginBottom: 32 },
  label:       { display: "block", fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 6, letterSpacing: 0.5 },
  input:       { width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box", color: C.text },
  select:      { width: "100%", padding: "10px 14px", border: `1.5px solid ${C.border}`, borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box", color: C.text, background: C.white },
  btnPrimary:  { width: "100%", padding: "12px", background: C.primary, color: C.white, border: "none", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 8 },
  errorMsg:    { color: C.danger, fontSize: 12, textAlign: "center", marginTop: 8 },

  layout:      { display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Segoe UI', Arial, sans-serif" },
  sidebar:     { width: 240, background: C.sidebar, color: C.white, display: "flex", flexDirection: "column", flexShrink: 0 },
  navSection:  { flex: 1, overflowY: "auto", padding: "8px 0" },
  navGroupBtn: { width: "100%", background: "none", border: "none", color: "#ddd", padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" },
  navItem:     { padding: "8px 16px 8px 36px", fontSize: 13, cursor: "pointer", color: "#bbb", display: "flex", alignItems: "center", gap: 8 },
  logoutBtn:   { width: "100%", background: "none", border: `1px solid #555`, color: "#bbb", padding: "8px", borderRadius: 6, cursor: "pointer", fontSize: 12 },

  main:        { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  topbar:      { background: C.white, padding: "12px 24px", borderBottom: `3px solid ${C.primary}`, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  topbarTitle: { fontSize: 16, fontWeight: 700, color: C.accent },
  content:     { flex: 1, overflowY: "auto", padding: 24, background: C.bg },

  card:        { background: C.white, borderRadius: 10, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: `1px solid ${C.border}` },
  cardHeader:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: `2px solid ${C.primary}` },
  cardTitle:   { fontSize: 18, fontWeight: 700, color: C.accent },

  table:       { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:          { background: C.bg, padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.accent, borderBottom: `2px solid ${C.primary}`, fontSize: 12, letterSpacing: 0.5 },
  td:          { padding: "10px 12px", borderBottom: `1px solid ${C.border}`, color: C.text, verticalAlign: "middle" },

  formRow:     { marginBottom: 18 },
  modal:       { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalCard:   { background: C.white, borderRadius: 10, padding: 32, width: "90%", maxWidth: 600, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", borderTop: `4px solid ${C.primary}`, maxHeight: "85vh", overflowY: "auto" },
  modalTitle:  { fontSize: 17, fontWeight: 700, color: C.accent, marginBottom: 24 },

  actionBtn:   { padding: "5px 12px", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 600, marginRight: 4 },
  btnEdit:     { background: "#EBF5FB", color: "#2980B9" },
  btnDel:      { background: "#FDEDEC", color: C.danger },
  btnAdd:      { padding: "9px 18px", background: C.primary, color: C.white, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700 },
  btnSave:     { padding: "9px 18px", background: C.primary, color: C.white, border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 700 },
  btnCancel:   { padding: "9px 18px", background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", fontSize: 13 },
  btnClose:    { padding: "9px 18px", background: C.bg, color: C.accent, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 },

  badge:        { display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 },
  badgeActive:  { background: "#D5F5E3", color: "#1E8449" },
  badgeInactive:{ background: "#FDECEA", color: C.danger },

  userBadge:   { width: 32, height: 32, borderRadius: "50%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontSize: 14 },
  emptyState:  { textAlign: "center", padding: "60px 0", color: C.textLight },
  emptyIcon:   { fontSize: 48, marginBottom: 12, display: "block" },
  spinner:     { textAlign: "center", padding: "40px 0", color: C.textLight, fontSize: 13 },
  homeGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20, marginTop: 8 },
  homeCard:    { background: C.white, borderRadius: 10, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: `1px solid ${C.border}`, cursor: "pointer", transition: "all .2s", textAlign: "center", borderTop: `3px solid ${C.primary}` },
};

// ==================== HELPERS ====================
const genId   = () => Math.random().toString(36).slice(2, 10);
const getInit = (name) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

// ==================== SHARED COMPONENTS ====================

function Input({ label, value, onChange, type = "text", placeholder, required }) {
  return (
    <div style={S.formRow}>
      <label style={S.label}>{label}{required && " *"}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={S.input}
        onFocus={e => e.target.style.borderColor = C.primary}
        onBlur={e  => e.target.style.borderColor = C.border} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div style={S.formRow}>
      <label style={S.label}>{label}{required && " *"}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={S.select}>
        <option value="">Selecione...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modalCard, maxWidth: wide ? 800 : 520 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={S.modalTitle}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.textLight }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ConfirmModal({ msg, onConfirm, onCancel }) {
  return (
    <Modal title="Confirmar exclusão" onClose={onCancel}>
      <p style={{ color: C.text, marginBottom: 24 }}>{msg}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button style={S.btnCancel} onClick={onCancel}>Cancelar</button>
        <button style={{ ...S.actionBtn, ...S.btnDel, padding: "9px 18px", fontSize: 13 }} onClick={onConfirm}>Excluir</button>
      </div>
    </Modal>
  );
}

function Spinner() {
  return <div style={S.spinner}>Carregando...</div>;
}

// ==================== LOGIN ====================
function Login({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const data = await api.post("/auth/login", { email, password });
      api.setToken(data.token);
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={{ textAlign: "center", marginBottom: 28 }}><Logo size={40} /></div>
        <p style={S.loginTitle}>SISTEMA DE CONTROLE DE TI</p>
        <p style={S.loginSub}>Informe suas credenciais para continuar</p>
        <Input label="E-mail" value={email} onChange={setEmail} placeholder="admin@slgrupo.com" />
        <Input label="Senha" type="password" value={password} onChange={setPassword} placeholder="••••••" />
        {error && <p style={S.errorMsg}>{error}</p>}
        <button style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}

// ==================== PROFILES SCREEN ====================
function ProfilesScreen({ user }) {
  const [profiles, setProfiles] = useState([]);
  const [screens,  setScreens]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [delId,    setDelId]    = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ id: null, name: "", permissions: {} });

  const canInsert = user.permissions?.s1?.insert;
  const canEdit   = user.permissions?.s1?.edit;
  const canDelete = user.permissions?.s1?.delete;
  const canView   = user.permissions?.s1?.view;

  useEffect(() => {
    if (!canView) return;
    (async () => {
      try {
        const [p, s] = await Promise.all([api.get("/profiles"), api.get("/screens")]);
        setProfiles(p); setScreens(s);
      } catch (err) { alert(err.message); }
      finally { setLoading(false); }
    })();
  }, []);

  const openAdd = () => {
    const perms = {};
    screens.forEach(s => perms[s.id] = { view: false, insert: false, edit: false, delete: false });
    setForm({ id: null, name: "", permissions: perms });
    setModal("form");
  };

  const openEdit = (p) => {
    const perms = {};
    screens.forEach(s => { perms[s.id] = p.permissions?.[s.id] || { view: false, insert: false, edit: false, delete: false }; });
    setForm({ ...p, permissions: perms });
    setModal("form");
  };

  const togglePerm = (screenId, action) => {
    setForm(f => ({
      ...f,
      permissions: { ...f.permissions, [screenId]: { ...f.permissions[screenId], [action]: !f.permissions[screenId]?.[action] } }
    }));
  };

  const save = async () => {
    if (!form.name.trim()) return alert("Nome do perfil é obrigatório.");
    setSaving(true);
    try {
      if (form.id) {
        const updated = await api.put(`/profiles/${form.id}`, form);
        setProfiles(ps => ps.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await api.post("/profiles", form);
        setProfiles(ps => [...ps, created]);
      }
      setModal(null);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    try {
      await api.delete(`/profiles/${delId}`);
      setProfiles(ps => ps.filter(p => p.id !== delId));
      setDelId(null);
    } catch (err) { alert(err.message); }
  };

  if (!canView) return <div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão de acesso.</div>;
  if (loading)  return <Spinner />;

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>👤 Perfis de Acesso</span>
        {canInsert && <button style={S.btnAdd} onClick={openAdd}>+ Novo Perfil</button>}
      </div>

      {profiles.length === 0 ? (
        <div style={S.emptyState}><span style={S.emptyIcon}>📋</span>Nenhum perfil cadastrado.</div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Nome do Perfil</th>
              <th style={S.th}>Telas com Acesso</th>
              <th style={S.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} onMouseOver={e => e.currentTarget.style.background = C.bg} onMouseOut={e => e.currentTarget.style.background = C.white}>
                <td style={S.td}><strong>{p.name}</strong></td>
                <td style={S.td}>
                  {screens.filter(s => p.permissions?.[s.id]?.view).map(s => (
                    <span key={s.id} style={{ ...S.badge, ...S.badgeActive, marginRight: 4 }}>{s.name}</span>
                  ))}
                </td>
                <td style={S.td}>
                  {canEdit   && <button style={{ ...S.actionBtn, ...S.btnEdit }} onClick={() => openEdit(p)}>✏️ Editar</button>}
                  {canDelete && <button style={{ ...S.actionBtn, ...S.btnDel  }} onClick={() => setDelId(p.id)}>🗑️ Excluir</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal === "form" && (
        <Modal title={form.id ? "Editar Perfil" : "Novo Perfil"} onClose={() => setModal(null)} wide>
          <Input label="Nome do Perfil" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
          <div style={{ marginBottom: 16 }}>
            <label style={{ ...S.label, marginBottom: 12 }}>PERMISSÕES POR TELA</label>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
              <table style={S.table}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    <th style={{ ...S.th, width: "30%" }}>Tela</th>
                    <th style={{ ...S.th, textAlign: "center" }}>Visualizar</th>
                    <th style={{ ...S.th, textAlign: "center" }}>Incluir</th>
                    <th style={{ ...S.th, textAlign: "center" }}>Alterar</th>
                    <th style={{ ...S.th, textAlign: "center" }}>Excluir</th>
                  </tr>
                </thead>
                <tbody>
                  {screens.map(s => (
                    <tr key={s.id}>
                      <td style={S.td}>{s.name}<br /><small style={{ color: C.textLight }}>{s.module}</small></td>
                      {["view", "insert", "edit", "delete"].map(action => (
                        <td key={action} style={{ ...S.td, textAlign: "center" }}>
                          <input type="checkbox" checked={!!form.permissions[s.id]?.[action]} onChange={() => togglePerm(s.id, action)}
                            style={{ width: 16, height: 16, cursor: "pointer", accentColor: C.primary }} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button style={S.btnCancel} onClick={() => setModal(null)}>Cancelar</button>
            <button style={{ ...S.btnSave, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </Modal>
      )}

      {delId && <ConfirmModal msg="Deseja realmente excluir este perfil?" onConfirm={del} onCancel={() => setDelId(null)} />}
    </div>
  );
}

// ==================== COMPANIES SCREEN ====================
function CompaniesScreen({ user }) {
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [delId,     setDelId]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ id: null, name: "", active: true });

  const canInsert = user.permissions?.s3?.insert;
  const canEdit   = user.permissions?.s3?.edit;
  const canDelete = user.permissions?.s3?.delete;
  const canView   = user.permissions?.s3?.view;

  useEffect(() => {
    if (!canView) return;
    api.get("/companies")
      .then(setCompanies)
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openAdd  = () => { setForm({ id: null, name: "", active: true }); setModal(true); };
  const openEdit = (c) => { setForm({ ...c }); setModal(true); };

  const save = async () => {
    if (!form.name.trim()) return alert("Nome da empresa é obrigatório.");
    setSaving(true);
    try {
      if (form.id) {
        const updated = await api.put(`/companies/${form.id}`, form);
        setCompanies(cs => cs.map(c => c.id === updated.id ? updated : c));
      } else {
        const created = await api.post("/companies", form);
        setCompanies(cs => [...cs, created]);
      }
      setModal(false);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    try {
      await api.delete(`/companies/${delId}`);
      setCompanies(cs => cs.filter(c => c.id !== delId));
      setDelId(null);
    } catch (err) { alert(err.message); }
  };

  if (!canView) return <div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão de acesso.</div>;
  if (loading)  return <Spinner />;

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>🏢 Empresas</span>
        {canInsert && <button style={S.btnAdd} onClick={openAdd}>+ Nova Empresa</button>}
      </div>

      {companies.length === 0 ? (
        <div style={S.emptyState}><span style={S.emptyIcon}>🏢</span>Nenhuma empresa cadastrada.</div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Nome da Empresa</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(c => (
              <tr key={c.id} onMouseOver={e => e.currentTarget.style.background = C.bg} onMouseOut={e => e.currentTarget.style.background = C.white}>
                <td style={S.td}><strong>{c.name}</strong></td>
                <td style={S.td}><span style={{ ...S.badge, ...(c.active ? S.badgeActive : S.badgeInactive) }}>{c.active ? "Ativo" : "Inativo"}</span></td>
                <td style={S.td}>
                  {canEdit   && <button style={{ ...S.actionBtn, ...S.btnEdit }} onClick={() => openEdit(c)}>✏️ Editar</button>}
                  {canDelete && <button style={{ ...S.actionBtn, ...S.btnDel  }} onClick={() => setDelId(c.id)}>🗑️ Excluir</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <Modal title={form.id ? "Editar Empresa" : "Nova Empresa"} onClose={() => setModal(false)}>
          <Input label="Nome da Empresa" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
          <div style={S.formRow}>
            <label style={S.label}>STATUS</label>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {[{ v: true, l: "Ativo" }, { v: false, l: "Inativo" }].map(opt => (
                <label key={String(opt.v)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                  <input type="radio" checked={form.active === opt.v} onChange={() => setForm(f => ({ ...f, active: opt.v }))} style={{ accentColor: C.primary }} />
                  {opt.l}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button style={S.btnCancel} onClick={() => setModal(false)}>Cancelar</button>
            <button style={{ ...S.btnSave, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </Modal>
      )}

      {delId && <ConfirmModal msg="Deseja realmente excluir esta empresa?" onConfirm={del} onCancel={() => setDelId(null)} />}
    </div>
  );
}

// ==================== USERS SCREEN ====================
function UsersScreen({ user }) {
  const [users,     setUsers]     = useState([]);
  const [profiles,  setProfiles]  = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [delId,     setDelId]     = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [form,      setForm]      = useState({ id: null, name: "", email: "", password: "", profileId: "", companyId: "", active: true });

  const canInsert = user.permissions?.s2?.insert;
  const canEdit   = user.permissions?.s2?.edit;
  const canDelete = user.permissions?.s2?.delete;
  const canView   = user.permissions?.s2?.view;

  useEffect(() => {
    if (!canView) return;
    Promise.all([api.get("/users"), api.get("/profiles"), api.get("/companies")])
      .then(([u, p, c]) => { setUsers(u); setProfiles(p); setCompanies(c); })
      .catch(err => alert(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openAdd  = () => { setForm({ id: null, name: "", email: "", password: "", profileId: "", companyId: "", active: true }); setModal(true); };
  const openEdit = (u) => { setForm({ ...u, password: "" }); setModal(true); };

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) return alert("Nome e e-mail são obrigatórios.");
    if (!form.id && !form.password.trim()) return alert("Senha é obrigatória para novo usuário.");
    setSaving(true);
    try {
      if (form.id) {
        const updated = await api.put(`/users/${form.id}`, form);
        setUsers(us => us.map(u => u.id === updated.id ? { ...u, ...updated } : u));
      } else {
        const created = await api.post("/users", form);
        setUsers(us => [...us, created]);
      }
      setModal(false);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const del = async () => {
    try {
      await api.delete(`/users/${delId}`);
      setUsers(us => us.filter(u => u.id !== delId));
      setDelId(null);
    } catch (err) { alert(err.message); }
  };

  if (!canView) return <div style={S.emptyState}><span style={S.emptyIcon}>🔒</span>Sem permissão de acesso.</div>;
  if (loading)  return <Spinner />;

  return (
    <div style={S.card}>
      <div style={S.cardHeader}>
        <span style={S.cardTitle}>👥 Usuários</span>
        {canInsert && <button style={S.btnAdd} onClick={openAdd}>+ Novo Usuário</button>}
      </div>

      {users.length === 0 ? (
        <div style={S.emptyState}><span style={S.emptyIcon}>👤</span>Nenhum usuário cadastrado.</div>
      ) : (
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Nome</th>
              <th style={S.th}>E-mail</th>
              <th style={S.th}>Empresa</th>
              <th style={S.th}>Perfil</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} onMouseOver={e => e.currentTarget.style.background = C.bg} onMouseOut={e => e.currentTarget.style.background = C.white}>
                <td style={S.td}><strong>{u.name}</strong></td>
                <td style={S.td}>{u.email}</td>
                <td style={S.td}>{u.companyName || "—"}</td>
                <td style={S.td}>{u.profileName  || "—"}</td>
                <td style={S.td}><span style={{ ...S.badge, ...(u.active ? S.badgeActive : S.badgeInactive) }}>{u.active ? "Ativo" : "Inativo"}</span></td>
                <td style={S.td}>
                  {canEdit   && <button style={{ ...S.actionBtn, ...S.btnEdit }} onClick={() => openEdit(u)}>✏️ Editar</button>}
                  {canDelete && <button style={{ ...S.actionBtn, ...S.btnDel  }} onClick={() => setDelId(u.id)}>🗑️ Excluir</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <Modal title={form.id ? "Editar Usuário" : "Novo Usuário"} onClose={() => setModal(false)}>
          <Input label="Nome completo" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
          <Input label="E-mail" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required />
          <Input label={form.id ? "Nova senha (deixe em branco para manter)" : "Senha"} type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} required={!form.id} />
          <SelectField label="Empresa" value={form.companyId} onChange={v => setForm(f => ({ ...f, companyId: v }))} options={companies.map(c => ({ value: c.id, label: c.name }))} required />
          <SelectField label="Perfil"  value={form.profileId} onChange={v => setForm(f => ({ ...f, profileId: v }))} options={profiles.map(p => ({ value: p.id, label: p.name }))} required />
          <div style={S.formRow}>
            <label style={S.label}>STATUS</label>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {[{ v: true, l: "Ativo" }, { v: false, l: "Inativo" }].map(opt => (
                <label key={String(opt.v)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                  <input type="radio" checked={form.active === opt.v} onChange={() => setForm(f => ({ ...f, active: opt.v }))} style={{ accentColor: C.primary }} />
                  {opt.l}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button style={S.btnCancel} onClick={() => setModal(false)}>Cancelar</button>
            <button style={{ ...S.btnSave, opacity: saving ? 0.7 : 1 }} onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </Modal>
      )}

      {delId && <ConfirmModal msg="Deseja realmente excluir este usuário?" onConfirm={del} onCancel={() => setDelId(null)} />}
    </div>
  );
}

// ==================== HOME ====================
function HomeScreen({ user, navigate }) {
  const [stats, setStats] = useState({ usuarios: 0, empresas: 0, perfis: 0 });

  useEffect(() => {
    Promise.all([
      api.get("/users").catch(() => []),
      api.get("/companies").catch(() => []),
      api.get("/profiles").catch(() => []),
    ]).then(([u, c, p]) => setStats({ usuarios: u.length, empresas: c.length, perfis: p.length }));
  }, []);

  const cards = [
    { icon: "👤", title: "Perfis",   sub: `${stats.perfis} cadastrado(s)`,   action: () => navigate("s1"), screenId: "s1" },
    { icon: "👥", title: "Usuários", sub: `${stats.usuarios} cadastrado(s)`,  action: () => navigate("s2"), screenId: "s2" },
    { icon: "🏢", title: "Empresas", sub: `${stats.empresas} cadastrada(s)`,  action: () => navigate("s3"), screenId: "s3" },
  ].filter(c => user.permissions?.[c.screenId]?.view);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: C.accent, margin: 0 }}>Olá, {user.name.split(" ")[0]}! 👋</h2>
        <p style={{ color: C.textLight, marginTop: 6, fontSize: 13 }}>Bem-vindo ao Sistema de Controle de TI</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Usuários", value: stats.usuarios, icon: "👥", color: C.primary },
          { label: "Empresas", value: stats.empresas, icon: "🏢", color: C.secondary },
          { label: "Perfis",   value: stats.perfis,   icon: "👤", color: "#2980B9" },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, borderTop: `3px solid ${s.color}`, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 36 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: C.textLight, fontWeight: 600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {cards.length > 0 && (
        <div style={S.card}>
          <div style={{ ...S.cardHeader, marginBottom: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>Acesso Rápido</span>
          </div>
          <div style={S.homeGrid}>
            {cards.map(c => (
              <div key={c.title} style={S.homeCard} onClick={c.action}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
                onMouseOut={e  => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.07)"; }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{c.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{c.title}</div>
                <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>{c.sub}</div>
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
  { id: "cadastros",     label: "Cadastros",     icon: "📁", children: [
    { id: "s1", label: "Perfis",   icon: "👤" },
    { id: "s2", label: "Usuários", icon: "👥" },
    { id: "s3", label: "Empresas", icon: "🏢" },
  ]},
  { id: "movimentacoes", label: "Movimentações", icon: "🔄", children: [] },
  { id: "relatorios",    label: "Relatórios",    icon: "📊", children: [] },
];

function Sidebar({ user, currentScreen, onNavigate, onLogout }) {
  const [expanded, setExpanded] = useState({ cadastros: true });
  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  return (
    <div style={S.sidebar}>
      <div style={{ padding: "20px 16px", borderBottom: "1px solid #444", display: "flex", alignItems: "center" }}>
        <Logo size={28} />
      </div>
      <div style={{ padding: "12px 16px 8px", borderBottom: "1px solid #444" }}>
        <div style={{ fontSize: 12, color: "#aaa" }}>Usuário logado</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#eee", marginTop: 2 }}>{user.name}</div>
        <div style={{ fontSize: 11, color: "#888" }}>{user.email}</div>
      </div>

      <nav style={S.navSection}>
        <div style={{ padding: "8px 16px 4px", fontSize: 10, color: "#777", fontWeight: 700, letterSpacing: 1 }}>NAVEGAÇÃO</div>

        <div
          style={{ ...S.navItem, background: currentScreen === "home" ? C.primary : "none", color: currentScreen === "home" ? C.white : "#bbb", padding: "10px 16px", fontWeight: 600 }}
          onClick={() => onNavigate("home")}
          onMouseOver={e => { if (currentScreen !== "home") e.currentTarget.style.background = C.sidebarHover; }}
          onMouseOut={e  => { if (currentScreen !== "home") e.currentTarget.style.background = "none"; }}
        >🏠 Início</div>

        {navConfig.map(group => (
          <div key={group.id}>
            <button style={{ ...S.navGroupBtn, color: expanded[group.id] ? "#eee" : "#bbb" }} onClick={() => toggle(group.id)}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>{group.icon} {group.label}</span>
              <span style={{ fontSize: 10, transform: expanded[group.id] ? "rotate(180deg)" : "none", display: "inline-block" }}>▼</span>
            </button>
            {expanded[group.id] && group.children.length === 0 && (
              <div style={{ ...S.navItem, color: "#666", fontSize: 12, fontStyle: "italic" }}>Em desenvolvimento...</div>
            )}
            {expanded[group.id] && group.children.map(item => {
              if (!user.permissions?.[item.id]?.view) return null;
              const active = currentScreen === item.id;
              return (
                <div key={item.id}
                  style={{ ...S.navItem, background: active ? C.primary : "none", color: active ? C.white : "#bbb", borderLeft: active ? `3px solid ${C.secondary}` : "3px solid transparent" }}
                  onClick={() => onNavigate(item.id)}
                  onMouseOver={e => { if (!active) e.currentTarget.style.background = C.sidebarHover; }}
                  onMouseOut={e  => { if (!active) e.currentTarget.style.background = "none"; }}
                >{item.icon} {item.label}</div>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: "12px 16px", borderTop: "1px solid #444" }}>
        <button style={S.logoutBtn} onClick={onLogout}
          onMouseOver={e => { e.target.style.background = "#444"; e.target.style.color = "#fff"; }}
          onMouseOut={e  => { e.target.style.background = "none"; e.target.style.color = "#bbb"; }}>
          🚪 Sair do sistema
        </button>
      </div>
    </div>
  );
}

// ==================== SCREEN TITLES ====================
const screenTitles = {
  home: "Início",
  s1:   "Cadastros › Perfis",
  s2:   "Cadastros › Usuários",
  s3:   "Cadastros › Empresas",
};

// ==================== MAIN APP ====================
export default function App() {
  const [user,   setUser]   = useState(null);
  const [screen, setScreen] = useState("home");

  // Restore session from localStorage on reload
  useEffect(() => {
    const saved = localStorage.getItem("sl_session");
    if (saved) {
      try {
        const { user, token } = JSON.parse(saved);
        api.setToken(token);
        setUser(user);
      } catch { localStorage.removeItem("sl_session"); }
    }
  }, []);

  const handleLogin = (user, token) => {
    localStorage.setItem("sl_session", JSON.stringify({ user, token }));
    setUser(user);
    setScreen("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("sl_session");
    api.setToken(null);
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const screenMap = {
    home: <HomeScreen user={user} navigate={setScreen} />,
    s1:   <ProfilesScreen  user={user} />,
    s2:   <UsersScreen     user={user} />,
    s3:   <CompaniesScreen user={user} />,
  };

  return (
    <div style={S.layout}>
      <Sidebar user={user} currentScreen={screen} onNavigate={setScreen} onLogout={handleLogout} />
      <div style={S.main}>
        <div style={S.topbar}>
          <div>
            <div style={{ fontSize: 11, color: C.textLight, letterSpacing: 1, fontWeight: 600 }}>SISTEMA DE CONTROLE DE TI</div>
            <div style={S.topbarTitle}>{screenTitles[screen] || "Início"}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {screen !== "home" && (
              <button style={S.btnClose} onClick={() => setScreen("home")}>✕ Fechar</button>
            )}
            <div style={S.userBadge}>{getInit(user.name)}</div>
          </div>
        </div>
        <div style={S.content}>
          {screenMap[screen] || <div style={S.emptyState}><span style={S.emptyIcon}>🚧</span>Em desenvolvimento</div>}
        </div>
      </div>
    </div>
  );
}
