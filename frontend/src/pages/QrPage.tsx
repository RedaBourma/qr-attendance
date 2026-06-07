import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SidebarLayout from "../components/Sidebar";
import { API_BASE, buildScanPageUrl } from "../config";

type SessionStatus = "active" | "ended";

interface StudentEntry {
  id: number;
  nom: string;
  prenom: string;
  name: string;
  code_massar: string;
  filiere: string;
  validated_at?: string | null;
}

interface QRSession {
  id: string;
  running: boolean;
  status: SessionStatus;
  date: string;
  startsAt: string;
  expiresAt: string | null;
  token: string | null;
  scanUrl: string | null;
  qrImage: string | null;
  module: string;
  filiere: string;
  niveau: string;
  semestre: string;
  cours: string;
  room: string;
  eligibleCount: number;
  presentCount: number;
  absentCount: number;
  attended: StudentEntry[];
  missed: StudentEntry[];
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("access")}` };
}

const css = `
  .qrd-root {
    --primary-hsl: 222, 89%, 60%;
    --primary: hsl(var(--primary-hsl));
    --primary-light: hsla(var(--primary-hsl), 0.08);
    --success-hsl: 142, 72%, 45%;
    --success: hsl(var(--success-hsl));
    --success-light: hsla(var(--success-hsl), 0.1);
    --warning-hsl: 32, 95%, 50%;
    --warning: hsl(var(--warning-hsl));
    --warning-light: hsla(var(--warning-hsl), 0.1);
    --danger-hsl: 346, 84%, 55%;
    --danger: hsl(var(--danger-hsl));
    --danger-light: hsla(var(--danger-hsl), 0.1);
    
    --slate-50: #f8fafc;
    --slate-100: #f1f5f9;
    --slate-200: #e2e8f0;
    --slate-300: #cbd5e1;
    --slate-600: #475569;
    --slate-800: #1e293b;
    --slate-900: #0f172a;
    
    --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.08);
    --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.08);
    
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
    color: var(--slate-800);
    background-color: var(--slate-50);
    min-height: 100vh;
  }

  .qrd-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    background: white;
    padding: 20px 24px;
    border-radius: 16px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--slate-200);
  }

  .qrd-header-title {
    font-family: 'Outfit', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: var(--slate-900);
    letter-spacing: -0.5px;
  }

  .qrd-header-meta {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
  }

  .qrd-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 700;
    background: var(--slate-100);
    color: var(--slate-600);
    border: 1px solid var(--slate-200);
  }

  .qrd-badge.blue {
    background: var(--primary-light);
    color: var(--primary);
    border-color: hsla(var(--primary-hsl), 0.2);
  }

  .qrd-badge.orange {
    background: var(--warning-light);
    color: var(--warning);
    border-color: hsla(var(--warning-hsl), 0.2);
  }

  .qrd-status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 800;
    border: 1px solid var(--slate-200);
  }

  .qrd-status-indicator.active {
    background: var(--success-light);
    color: var(--success);
    border-color: hsla(var(--success-hsl), 0.2);
  }

  .qrd-status-indicator.ended {
    background: var(--danger-light);
    color: var(--danger);
    border-color: hsla(var(--danger-hsl), 0.2);
  }

  .qrd-pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  .qrd-pulse-dot.active {
    animation: qrd-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes qrd-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: .4; transform: scale(1.25); }
  }

  .qrd-grid {
    display: grid;
    grid-template-columns: minmax(360px, 440px) 1fr;
    gap: 24px;
    align-items: start;
  }

  .qrd-panel {
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 20px;
    padding: 28px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow 0.3s ease;
  }

  .qrd-panel:hover {
    box-shadow: var(--shadow-md);
  }

  .qrd-qr-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .qrd-qr-wrapper {
    position: relative;
    padding: 16px;
    background: white;
    border-radius: 20px;
    box-shadow: var(--shadow-md);
    border: 2px solid var(--slate-100);
    transition: all 0.3s ease;
    display: inline-block;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .qrd-qr-wrapper.active {
    border-color: var(--primary);
    box-shadow: var(--shadow-xl), 0 0 0 4px hsla(var(--primary-hsl), 0.12);
  }

  .qrd-qr-image {
    display: block;
    width: 240px;
    height: 240px;
    border-radius: 10px;
    transition: opacity 0.5s ease;
  }

  .qrd-qr-wrapper.active::after {
    content: "";
    position: absolute;
    left: 16px;
    right: 16px;
    height: 3px;
    background: linear-gradient(90deg, transparent, var(--primary), transparent);
    box-shadow: 0 0 8px var(--primary), 0 0 16px var(--primary);
    animation: qrd-scan 2.5s ease-in-out infinite;
    pointer-events: none;
    z-index: 10;
  }

  @keyframes qrd-scan {
    0% { top: 16px; }
    50% { top: calc(100% - 19px); }
    100% { top: 16px; }
  }

  .qrd-countdown {
    font-family: 'Outfit', sans-serif;
    font-size: 38px;
    font-weight: 900;
    color: var(--primary);
    letter-spacing: 1px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-light);
    padding: 6px 20px;
    border-radius: 12px;
    margin: 12px 0 16px 0;
    border: 1px solid hsla(var(--primary-hsl), 0.15);
    font-variant-numeric: tabular-nums;
  }

  .qrd-instruction {
    color: var(--slate-600);
    font-size: 13.5px;
    line-height: 1.6;
    margin-bottom: 20px;
    max-width: 320px;
  }

  .qrd-btn-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;
    margin-bottom: 16px;
  }

  .qrd-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: none;
    border-radius: 12px;
    padding: 12px 16px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-sm);
  }

  .qrd-btn:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .qrd-btn:active {
    transform: translateY(1px);
  }

  .qrd-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .qrd-btn.primary-red {
    background: var(--danger);
    color: white;
  }

  .qrd-btn.primary-red:hover:not(:disabled) {
    background: hsl(346, 84%, 48%);
  }

  .qrd-btn.secondary-blue {
    background: var(--primary);
    color: white;
  }

  .qrd-btn.secondary-blue:hover:not(:disabled) {
    background: hsl(222, 89%, 54%);
  }

  .qrd-btn.primary {
    background: var(--primary);
    color: white;
  }

  .qrd-btn.primary:hover:not(:disabled) {
    background: hsl(222, 89%, 54%);
  }

  .qrd-toggle-advanced {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: none;
    border: none;
    color: var(--slate-600);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;
    transition: all 0.2s;
    margin-top: 4px;
  }

  .qrd-toggle-advanced:hover {
    color: var(--primary);
    background: var(--slate-100);
  }

  .qrd-advanced-panel {
    width: 100%;
    border-top: 1px solid var(--slate-200);
    margin-top: 12px;
    padding-top: 16px;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 14px;
    animation: qrd-slide-down 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes qrd-slide-down {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .qrd-metric-title {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--slate-600);
    margin-bottom: 4px;
  }

  .qrd-advanced-url {
    background: var(--slate-50);
    border: 1px solid var(--slate-200);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 11px;
    font-family: monospace;
    word-break: break-all;
    color: var(--slate-600);
  }

  .qrd-advanced-buttons,
  .qrd-advanced-export-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
  }

  .qrd-btn.outline {
    background: white;
    border: 1px solid var(--slate-300);
    color: var(--slate-800);
  }

  .qrd-btn.outline:hover:not(:disabled) {
    background: var(--slate-50);
    border-color: var(--slate-600);
    color: var(--slate-900);
  }

  .qrd-metrics-card {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .qrd-metric {
    background: var(--slate-50);
    border: 1px solid var(--slate-200);
    border-radius: 16px;
    padding: 16px 12px;
    text-align: center;
    transition: all 0.25s ease;
  }

  .qrd-metric:hover {
    background: white;
    border-color: var(--primary);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .qrd-metric-value {
    font-family: 'Outfit', sans-serif;
    font-size: 28px;
    font-weight: 800;
    line-height: 1.2;
    margin-top: 4px;
  }

  .qrd-metric-value.green {
    color: var(--success);
  }

  .qrd-metric-value.blue {
    color: var(--primary);
  }

  .qrd-metric-value.orange {
    color: var(--warning);
  }

  .qrd-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    background: var(--slate-100);
    padding: 4px;
    border-radius: 10px;
  }

  .qrd-tab {
    flex: 1;
    text-align: center;
    border: none;
    background: transparent;
    color: var(--slate-600);
    border-radius: 7px;
    padding: 8px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .qrd-tab:hover {
    color: var(--slate-900);
  }

  .qrd-tab.active {
    background: white;
    color: var(--primary);
    box-shadow: var(--shadow-sm);
  }

  .qrd-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 380px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .qrd-list::-webkit-scrollbar {
    width: 6px;
  }

  .qrd-list::-webkit-scrollbar-track {
    background: var(--slate-100);
    border-radius: 3px;
  }

  .qrd-list::-webkit-scrollbar-thumb {
    background: var(--slate-300);
    border-radius: 3px;
  }

  .qrd-student-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    background: white;
    transition: all 0.2s ease;
  }

  .qrd-student-row:hover {
    border-color: var(--slate-300);
    transform: translateX(2px);
  }

  .qrd-student-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--primary-light);
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
    flex-shrink: 0;
    border: 1px solid hsla(var(--primary-hsl), 0.15);
  }

  .qrd-student-info {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .qrd-student-name {
    font-weight: 700;
    font-size: 13.5px;
    color: var(--slate-900);
  }

  .qrd-student-meta {
    color: var(--slate-600);
    font-size: 11.5px;
  }

  .qrd-time {
    color: var(--slate-600);
    font-size: 11.5px;
    font-weight: 600;
    background: var(--slate-100);
    padding: 4px 8px;
    border-radius: 6px;
  }

  .qrd-empty {
    padding: 40px 20px;
    text-align: center;
    color: var(--slate-600);
    font-size: 13.5px;
    background: var(--slate-50);
    border: 2px dashed var(--slate-200);
    border-radius: 16px;
  }

  .qrd-locked {
    max-width: 500px;
    margin: 60px auto;
    text-align: center;
    padding: 40px 28px;
  }

  .qrd-locked h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: var(--slate-900);
    margin-bottom: 12px;
  }

  .qrd-locked p {
    color: var(--slate-600);
    margin-bottom: 24px;
    line-height: 1.6;
    font-size: 14.5px;
  }

  @media (max-width: 860px) {
    .qrd-grid {
      grid-template-columns: 1fr;
    }
  }
`;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatRemaining(expiresAt: string | null) {
  if (!expiresAt) return "--:--";
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
}

async function downloadExport(seanceId: string, type: "all" | "present" | "absent") {
  const res = await fetch(`${API_BASE}/qrcode/${seanceId}/export/?type=${type}`, {
    headers: authHeaders(),
  });

  if (!res.ok) return;

  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `presence_seance_${seanceId}_${type}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}



function getInitials(name: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0]?.toUpperCase() || "";
}

export default function QRSessionDashboard() {
  const { seanceId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<QRSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"present" | "absent">("present");
  const [nowTick, setNowTick] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const studentScanUrl = session?.token ? buildScanPageUrl(session.token) : "";

  const remaining = useMemo(() => formatRemaining(session?.expiresAt || null), [session?.expiresAt, nowTick]);
  const rate = session?.eligibleCount ? Math.round((session.presentCount / session.eligibleCount) * 100) : 0;
  const visibleStudents = tab === "present" ? session?.attended || [] : session?.missed || [];

  const loadSession = async () => {
    setError("");
    const url = seanceId ? `${API_BASE}/qrcode/${seanceId}/` : `${API_BASE}/qrcode/current/`;

    try {
      const res = await fetch(url, { headers: authHeaders() });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Impossible de charger le QR code.");
        return;
      }

      setSession(data.seance || null);
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [seanceId]);

  useEffect(() => {
    if (!session?.running || !session.expiresAt) {
      return;
    }

    const tickTimer = window.setInterval(() => {
      setNowTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(tickTimer);
  }, [session?.running, session?.expiresAt]);

  useEffect(() => {
    if (!session?.running) {
      return;
    }

    const refreshTimer = window.setInterval(() => {
      loadSession();
    }, 5000);

    return () => window.clearInterval(refreshTimer);
  }, [session?.running, seanceId]);

  const closeSession = async () => {
    if (!session) return;

    const res = await fetch(`${API_BASE}/qrcode/${session.id}/close/`, {
      method: "POST",
      headers: authHeaders(),
    });
    const data = await res.json();

    if (res.ok) {
      setSession(data.seance);
    } else {
      setError(data.message || "Impossible de terminer la seance.");
    }
  };

  return (
    <>
      <style>{css}</style>
      <SidebarLayout activePage="qr" pageTitle="QR code">
        <div className="qrd-root">
          {loading ? (
            <div className="qrd-empty">Chargement du QR code...</div>
          ) : !session ? (
            <div className="qrd-panel qrd-locked">
              <h2>QR code non disponible</h2>
              <p>
                Cette page reste fermee tant qu'un enseignant n'a pas genere un QR code depuis une seance active dans Mes seances.
              </p>
              <button className="qrd-btn primary" onClick={() => navigate("/seances")}>Aller a Mes seances</button>
            </div>
          ) : (
            <>
              {error && <div className="db-error" style={{ marginBottom: "16px" }}>{error}</div>}
              
              <div className="qrd-header">
                <div>
                  <div className="qrd-header-title">{session.module}</div>
                  <div className="qrd-header-meta">
                    <span className="qrd-badge blue">{session.filiere} {session.semestre}</span>
                    <span className="qrd-badge">{session.cours}</span>
                    <span className="qrd-badge orange">
                      {session.room ? (/^salle\b/i.test(session.room.trim()) ? session.room : `Salle ${session.room}`) : ""}
                    </span>
                  </div>
                </div>
                <div className={`qrd-status-indicator ${session.running ? "active" : "ended"}`}>
                  <span className={`qrd-pulse-dot ${session.running ? "active" : ""}`} />
                  {session.running ? "Session Active" : "Session Terminée"}
                </div>
              </div>

              <div className="qrd-grid">
                {/* Left Column: QR Code Display & Primary Actions */}
                <div className="qrd-panel qrd-qr-section">
                  <div className={`qrd-qr-wrapper ${session.running ? "active" : ""}`}>
                    {session.qrImage && (
                      <img 
                        className="qrd-qr-image" 
                        src={session.qrImage} 
                        alt="QR code session" 
                        style={{ opacity: session.running ? 1 : 0.2 }} 
                      />
                    )}
                  </div>
                  
                  {session.running && (
                    <div className="qrd-countdown">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px", verticalAlign: "middle" }}>
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {remaining}
                    </div>
                  )}

                  <div className="qrd-instruction">
                    {session.running
                      ? "Les étudiants peuvent scanner ce QR code pour valider instantanément leur présence au cours."
                      : "La session de présence est terminée. Les statistiques d'exportation de présence sont compilées ci-dessous."}
                  </div>

                  {/* ONLY Terminer and Exporter tout show up by default */}
                  <div className="qrd-btn-row">
                    <button 
                      className="qrd-btn primary-red" 
                      onClick={closeSession} 
                      disabled={!session.running}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      </svg>
                      Terminer
                    </button>
                    <button 
                      className="qrd-btn secondary-blue" 
                      onClick={() => downloadExport(session.id, "all")}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                      </svg>
                      Exporter tout
                    </button>
                  </div>

                  {/* Toggle link for advanced actions */}
                  <button 
                    type="button" 
                    className="qrd-toggle-advanced"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <span>{showAdvanced ? "Masquer les options avancées" : "Afficher les options avancées"}</span>
                    <svg 
                      viewBox="0 0 24 24" 
                      width="14" 
                      height="14" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      style={{ 
                        transform: showAdvanced ? "rotate(180deg)" : "rotate(0deg)", 
                        transition: "transform 0.2s" 
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {/* Hidden panel for advanced actions */}
                  {showAdvanced && (
                    <div className="qrd-advanced-panel">
                      {studentScanUrl && (
                        <>
                          <div className="qrd-metric-title" style={{ textAlign: "left", fontSize: "9px" }}>Lien direct étudiant</div>
                          <div className="qrd-advanced-url">{studentScanUrl}</div>
                        </>
                      )}
                      
                      <div className="qrd-advanced-buttons">
                        <button
                          className="qrd-btn outline"
                          onClick={() => navigator.clipboard.writeText(studentScanUrl)}
                          disabled={!studentScanUrl}
                        >
                          Copier le lien
                        </button>
                        <a 
                          className="qrd-btn outline" 
                          href={studentScanUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          style={{ textDecoration: "none" }}
                        >
                          Ouvrir la page
                        </a>
                      </div>

                      <div className="qrd-advanced-export-row">
                        <button 
                          className="qrd-btn outline" 
                          onClick={() => downloadExport(session.id, "present")}
                        >
                          Exporter présents
                        </button>
                        <button 
                          className="qrd-btn outline" 
                          onClick={() => downloadExport(session.id, "absent")}
                        >
                          Exporter absents
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Attendance Statistics & Student List */}
                <div className="qrd-panel">
                  <div className="qrd-metrics-card">
                    <div className="qrd-metric">
                      <div className="qrd-metric-title">Présents</div>
                      <div className="qrd-metric-value green">{session.presentCount}</div>
                    </div>
                    <div className="qrd-metric">
                      <div className="qrd-metric-title">Inscrits</div>
                      <div className="qrd-metric-value blue">{session.eligibleCount}</div>
                    </div>
                    <div className="qrd-metric">
                      <div className="qrd-metric-title">Taux global</div>
                      <div className="qrd-metric-value orange">{rate}%</div>
                    </div>
                  </div>

                  <div className="qrd-tabs">
                    <button 
                      className={`qrd-tab ${tab === "present" ? "active" : ""}`} 
                      onClick={() => setTab("present")}
                    >
                      Presents ({session.presentCount})
                    </button>
                    <button 
                      className={`qrd-tab ${tab === "absent" ? "active" : ""}`} 
                      onClick={() => setTab("absent")}
                    >
                      Absents ({session.absentCount})
                    </button>
                  </div>

                  <div className="qrd-list">
                    {visibleStudents.length === 0 ? (
                      <div className="qrd-empty">
                        {tab === "present" 
                          ? "Aucune présence enregistrée pour le moment." 
                          : "Aucun absent répertorié."}
                      </div>
                    ) : (
                      visibleStudents.map((student) => (
                        <div className="qrd-student-row" key={student.id}>
                          <div className="qrd-student-avatar">
                            {getInitials(student.name)}
                          </div>
                          <div className="qrd-student-info">
                            <div className="qrd-student-name">{student.name}</div>
                            <div className="qrd-student-meta">
                              {student.code_massar} | {student.filiere}
                            </div>
                          </div>
                          <div className="qrd-time">
                            {formatDateTime(student.validated_at)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SidebarLayout>
    </>
  );
}
