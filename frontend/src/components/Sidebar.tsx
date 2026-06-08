import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import uniLogo from "../assets/uni_logo.png";

const css = `
  .sb-root {
    --blue:       #037da7;
    --blue-dark:  #025f80;
    --blue-glow:  rgba(3,125,167,0.15);
    --orange:     #f6931f;
    --orange-dim: rgba(246,147,31,0.12);
    --white:      #ffffff;
    --gray-50:    #f7f9fc;
    --gray-100:   #eef1f6;
    --gray-200:   #dde3ee;
    --gray-400:   #94a3b8;
    --gray-600:   #4a5568;
    --gray-800:   #1a2236;
    --sidebar-w:  240px;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Shell ──────────────────────────────────────────── */
  .sb-shell {
    display: flex;
    min-height: 100vh;
    background: var(--gray-50);
  }

  /* ── Sidebar ────────────────────────────────────────── */
  .sb-nav {
    width: var(--sidebar-w);
    flex-shrink: 0;
    background: var(--gray-800);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
    overflow: hidden;
    transition: width 0.25s cubic-bezier(.4,0,.2,1);
  }
  .sb-nav.collapsed { width: 68px; }

  .sb-nav::before {
    content: '';
    position: absolute;
    bottom: -80px; left: -60px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(246,147,31,0.07);
    pointer-events: none;
  }

  /* logo */
  .sb-logo {
    display: flex;
    align-items: center;
    padding: 18px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    overflow: hidden;
    white-space: nowrap;
    min-height: 84px;
  }
  .sb-logo-icon {
    width: 176px;
    max-width: 100%;
    height: 62px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 10px;
    border-radius: 9px;
    background: #fff;
    box-shadow: 0 8px 18px rgba(0,0,0,0.18);
  }
  .sb-logo-icon img {
    display: block;
    width: 100%;
    max-height: 46px;
    object-fit: contain;
    object-position: center;
    transition: width 0.2s;
  }
  .sb-nav.collapsed .sb-logo-icon {
    width: 32px;
    height: 32px;
    padding: 4px;
  }
  .sb-nav.collapsed .sb-logo-icon img {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  /* prof card */
  .sb-prof {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    overflow: hidden;
    white-space: nowrap;
  }
  .sb-avatar {
    width: 34px; height: 34px; flex-shrink: 0;
    border-radius: 50%;
    background: var(--blue);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Outfit', sans-serif;
    font-size: 13px; font-weight: 700; color: #fff;
    border: 2px solid rgba(3,125,167,0.5);
    overflow: hidden;
  }
  .sb-avatar img,
  .sb-avatar-sm img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .sb-prof-info {
    overflow: hidden;
    opacity: 1; transition: opacity 0.2s;
  }
  .sb-nav.collapsed .sb-prof-info { opacity: 0; pointer-events: none; }
  .sb-prof-name {
    font-size: 13px; font-weight: 600; color: #fff;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sb-prof-role {
    font-size: 11px; color: rgba(255,255,255,0.4);
    white-space: nowrap;
  }

  /* nav items */
  .sb-menu {
    flex: 1;
    padding: 14px 10px;
    display: flex; flex-direction: column; gap: 2px;
    overflow-y: auto; overflow-x: hidden;
  }
  .sb-section-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.25);
    padding: 10px 8px 4px;
    white-space: nowrap;
    overflow: hidden;
    transition: opacity 0.2s;
  }
  .sb-nav.collapsed .sb-section-label { opacity: 0; }

  .sb-item {
    display: flex; align-items: center; gap: 11px;
    padding: 9px 10px;
    border-radius: 9px;
    border: none; background: transparent;
    cursor: pointer; width: 100%;
    text-align: left;
    white-space: nowrap;
    color: rgba(255,255,255,0.55);
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px; font-weight: 500;
    transition: background 0.15s, color 0.15s;
    position: relative;
    overflow: hidden;
  }
  .sb-item svg { width: 17px; height: 17px; flex-shrink: 0; }
  .sb-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
  .sb-item.active {
    background: var(--blue);
    color: #fff;
    box-shadow: 0 4px 14px rgba(3,125,167,0.35);
  }
  .sb-item-label { opacity: 1; transition: opacity 0.2s; }
  .sb-nav.collapsed .sb-item-label { opacity: 0; }

  .sb-badge {
    margin-left: auto;
    background: var(--orange);
    color: #fff;
    font-size: 10px; font-weight: 700;
    padding: 2px 7px; border-radius: 20px;
    flex-shrink: 0;
    transition: opacity 0.2s;
  }
  .sb-nav.collapsed .sb-badge { opacity: 0; }

  /* collapse toggle */
  .sb-toggle {
    margin: 0 10px 16px;
    display: flex; align-items: center; gap: 11px;
    padding: 9px 10px;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.08);
    background: transparent; cursor: pointer;
    color: rgba(255,255,255,0.4);
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    white-space: nowrap; overflow: hidden;
    transition: background 0.15s, color 0.15s;
  }
  .sb-toggle svg { width: 16px; height: 16px; flex-shrink: 0; transition: transform 0.25s; }
  .sb-nav.collapsed .sb-toggle svg { transform: rotate(180deg); }
  .sb-toggle:hover { background: rgba(255,255,255,0.06); color: #fff; }
  .sb-toggle-label { opacity: 1; transition: opacity 0.2s; }
  .sb-nav.collapsed .sb-toggle-label { opacity: 0; }

  /* ── Main content ───────────────────────────────────── */
  .sb-main {
    flex: 1;
    margin-left: var(--sidebar-w);
    transition: margin-left 0.25s cubic-bezier(.4,0,.2,1);
    display: flex; flex-direction: column;
    min-height: 100vh;
  }
  .sb-main.collapsed { margin-left: 68px; }

  /* topbar */
  .sb-topbar {
    height: 60px;
    background: var(--white);
    border-bottom: 1px solid var(--gray-200);
    display: flex; align-items: center;
    padding: 0 28px;
    gap: 16px;
    position: sticky; top: 0; z-index: 50;
  }
  .sb-topbar-title {
    font-family: 'Outfit', sans-serif;
    font-size: 17px; font-weight: 700;
    color: var(--gray-800);
    flex: 1;
  }
  .sb-topbar-actions { display: flex; align-items: center; gap: 10px; }

  .sb-notif-btn {
    width: 36px; height: 36px;
    border-radius: 9px;
    border: 1.5px solid var(--gray-200);
    background: var(--white);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; position: relative;
    transition: border-color 0.15s, background 0.15s;
  }
  .sb-notif-btn svg { width: 16px; height: 16px; color: var(--gray-600); }
  .sb-notif-btn:hover { border-color: var(--blue); background: var(--gray-50); }
  .sb-notif-dot {
    position: absolute; top: 6px; right: 6px;
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--orange);
    border: 1.5px solid var(--white);
  }

  .sb-avatar-sm {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: var(--blue);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Outfit', sans-serif;
    font-size: 13px; font-weight: 700; color: #fff;
    cursor: pointer;
    border: 2px solid var(--blue-glow);
    overflow: hidden;
  }

  /* page body */
  .sb-content { flex: 1; padding: 28px; }

  @media (max-width: 768px) {
    .sb-nav { width: 68px; }
    .sb-main { margin-left: 68px; }
    .sb-logo-text, .sb-prof-info, .sb-item-label,
    .sb-section-label, .sb-badge, .sb-toggle-label { opacity: 0; pointer-events: none; }
    .sb-toggle svg { transform: rotate(180deg); }
  }
`;

// ─── Nav items config ─────────────────────────────────────────────────────────

interface NavItem {
  key?: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string;
  path?: string;
  action?: "logout";
}

interface NavSection {
  section?: string;
  items: NavItem[];
}

const SeanceIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="14" height="13" rx="1.5"/>
    <line x1="3" y1="8" x2="17" y2="8"/>
    <line x1="7" y1="2" x2="7" y2="6"/><line x1="13" y1="2" x2="13" y2="6"/>
    <line x1="7" y1="12" x2="10" y2="12"/><line x1="7" y1="14.5" x2="13" y2="14.5"/>
  </svg>
);
const QrIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/>
    <rect x="2" y="11" width="7" height="7" rx="1"/>
    <rect x="11.5" y="11.5" width="2" height="2"/><rect x="15.5" y="11.5" width="2" height="2"/>
    <rect x="11.5" y="15.5" width="2" height="2"/><rect x="15.5" y="15.5" width="2" height="2"/>
  </svg>
);
const StudentsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="7" r="3"/><path d="M2 18c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
    <circle cx="15" cy="7" r="2"/><path d="M18 18c0-2.5-1.3-4.5-3-5.4"/>
  </svg>
);
const StatsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="18" x2="18" y2="18"/>
    <rect x="3" y="10" width="3" height="8" rx="1"/>
    <rect x="8.5" y="6" width="3" height="12" rx="1"/>
    <rect x="14" y="2" width="3" height="16" rx="1"/>
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="3"/>
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/>
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 10H3M6 7l-3 3 3 3"/>
    <path d="M8 5V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-1"/>
  </svg>
);
const BellIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2a6 6 0 0 1 6 6c0 3.5 1 5 1 5H3s1-1.5 1-5a6 6 0 0 1 6-6z"/>
    <path d="M8.5 17a1.5 1.5 0 0 0 3 0"/>
  </svg>
);
const BookIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const CollapseIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="13 5 7 10 13 15"/>
  </svg>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface SidebarLayoutProps {
  /** Professor full name */
  profName?: string;
  /** Currently active page key */
  activePage?: "dashboard" | "seances" | "academic" | "qr" | "etudiants" | "enseignants" | "statistiques" | "parametres" | "filieres-modules";
  /** Page title shown in topbar */
  pageTitle?: string;
  children: React.ReactNode;
}

interface StoredUser {
  nom?: string;
  prenom?: string;
  role?: string;
  profile_picture?: string | null;
}

function getStoredUser(): StoredUser | null {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
}

function formatRole(role?: string) {
  if (role === "enseignant") {
    return "Professeur";
  }

  if (role === "admin") {
    return "Administrateur";
  }

  if (role === "etudiant") {
    return "Etudiant";
  }

  return "Utilisateur";
}

function Avatar({ src, initials, className }: { src?: string | null; initials: string; className: string }) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <div className={className}>
        <img src={src} alt="" onError={() => setImgError(true)} />
      </div>
    );
  }

  return <div className={className}>{initials}</div>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SidebarLayout({
  profName,
  activePage = "dashboard",
  pageTitle = "Tableau de bord",
  children,
}: SidebarLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = getStoredUser();
  const displayName =
    profName ||
    [storedUser?.prenom, storedUser?.nom].filter(Boolean).join(" ") ||
    "Utilisateur";
  const displayRole = formatRole(storedUser?.role);
  const isAdmin = storedUser?.role === "admin";

  const initials = displayName
    .split(" ")
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "U";
  const profilePicture = storedUser?.profile_picture;
  const isActivePath = (path?: string) => {
    if (!path) {
      return false;
    }

    if (path === "/qr") {
      return location.pathname === "/qr" || location.pathname.startsWith("/qr/");
    }

    return location.pathname === path;
  };

  const navSections: NavSection[] = [
    {
      section: "PRINCIPAL",
      items: [
        ...(isAdmin ? [{ label: "Statistiques", icon: <StatsIcon />, active: activePage === "statistiques", path: "/statistiques" }] : []),
        ...(!isAdmin ? [{ label: "Tableau de bord", icon: <StatsIcon />, active: activePage === "dashboard", path: "/dashboard" }] : []),
        {
          label: isAdmin ? "Gestion emploi" : "Mes seances",
          icon: <SeanceIcon />,
          active: isAdmin ? activePage === "academic" : activePage === "seances",
          path: isAdmin ? "/gestion-academique" : "/seances",
        },
        ...(!isAdmin ? [{ label: "QR Codes", icon: <QrIcon />, active: activePage === "qr", path: "/qr" }] : []),
      ],
    },
    {
      section: "GESTION",
      items: [
        { label: "Etudiants", icon: <StudentsIcon />, active: activePage === "etudiants", path: "/etudiants" },
        ...(isAdmin ? [{ label: "Enseignants", icon: <StudentsIcon />, active: activePage === "enseignants", path: "/enseignants" }] : []),
        ...(isAdmin ? [{ label: "Filières & Modules", icon: <BookIcon />, active: activePage === "filieres-modules", path: "/filieres-modules" }] : []),
      ],
    },
    {
      section: "COMPTE",
      items: [
        { label: "Parametres", icon: <SettingsIcon />, active: activePage === "parametres", path: "/parametres" },
        { label: "Deconnexion", icon: <LogoutIcon /> },
      ],
    },
  ];

  const handleNavItemClick = (item: NavItem) => {
    if (item.action === "logout" || item.label.includes("connexion")) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
      window.location.replace("/login");
      return;
    }

    if (item.path) {
      navigate(item.path);
      return;
    }

    if (item.label === "Tableau de bord") {
      navigate("/dashboard");
      return;
    }

    if (item.label.includes("academique") || item.label.includes("emploi")) {
      navigate("/gestion-academique");
      return;
    }

    if (item.label.includes("ances")) {
      navigate(isAdmin ? "/gestion-academique" : "/seances");
      return;
    }

    if (item.label.includes("tudiants")) {
      navigate("/etudiants");
      return;
    }

    if (item.label.includes("Enseignants")) {
      navigate("/enseignants");
      return;
    }

    if (item.label.includes("Filières")) {
      navigate("/filieres-modules");
      return;
    }

    if (item.label.toLowerCase().includes("qr")) {
      navigate("/qr");
      return;
    }

    // if (item.label.includes("qr") || item.label.includes("QR")) {
    //   navigate("/qr");
    //   return;
    // }

    if (item.label.includes("Param")) {
      navigate("/parametres");
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="sb-root">
        <div className={`sb-shell`}>

          {/* ── Sidebar ── */}
          <nav className={`sb-nav${collapsed ? " collapsed" : ""}`}>
            {/* Logo */}
            <div className="sb-logo">
              <div className="sb-logo-icon">
                <img src={uniLogo} alt="Universite Moulay Ismail - Faculte des Sciences" />
              </div>
            </div>

            {/* Prof card */}
            <div className="sb-prof">
              <Avatar className="sb-avatar" src={profilePicture} initials={initials} />
              <div className="sb-prof-info">
                <div className="sb-prof-name">{displayName}</div>
                <div className="sb-prof-role">{displayRole}</div>
              </div>
            </div>

            {/* Nav */}
            <div className="sb-menu">
              {navSections.map((sec) => (
                <div key={sec.section}>
                  {sec.section && (
                    <div className="sb-section-label">{sec.section}</div>
                  )}
                  {sec.items.map((item) => (
                    <button
                      key={item.label}
                      className={`sb-item${item.path ? isActivePath(item.path) ? " active" : "" : item.active ? " active" : ""}`}
                      onClick={() => handleNavItemClick(item)}
                    >
                      {item.icon}
                      <span className="sb-item-label">{item.label}</span>
                      {item.badge && (
                        <span className="sb-badge">{item.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Collapse toggle */}
            <button className="sb-toggle" onClick={() => setCollapsed(!collapsed)}>
              <CollapseIcon />
              <span className="sb-toggle-label">Réduire</span>
            </button>
          </nav>

          {/* ── Main ── */}
          <div className={`sb-main${collapsed ? " collapsed" : ""}`}>
            {/* Topbar */}
            <header className="sb-topbar">
              <div className="sb-topbar-title">{pageTitle}</div>
              <div className="sb-topbar-actions">
                <button className="sb-notif-btn">
                  <BellIcon />
                  <span className="sb-notif-dot" />
                </button>
                <Avatar className="sb-avatar-sm" src={profilePicture} initials={initials} />
              </div>
            </header>

            {/* Page content */}
            <div className="sb-content">{children}</div>
          </div>

        </div>
      </div>
    </>
  );
}
