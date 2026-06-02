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
  id: number;
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
  semestre: string;
  cours: string;
  room: string;
  eligibleCount: number;
  presentCount: number;
  absentCount: number;
  attended: StudentEntry[];
  missed: StudentEntry[];
}

const css = `
  .qrd-root {
    --blue:#037da7; --blue-dark:#025f80; --blue-light:#e4f4fa; --orange:#f6931f;
    --orange-light:#fff4e5; --green:#16a34a; --green-light:#dcfce7; --red:#dc2626;
    --red-light:#fee2e2; --white:#ffffff; --gray-50:#f7f9fc; --gray-100:#eef1f6;
    --gray-200:#dde3ee; --gray-400:#94a3b8; --gray-600:#4a5568; --gray-800:#1a2236;
    font-family:'DM Sans',sans-serif; color:var(--gray-800);
  }
  .qrd-topbar { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:18px; flex-wrap:wrap; }
  .qrd-top-left { display:flex; align-items:center; gap:14px; }
  .qrd-logo-icon { width:44px; height:44px; background:var(--orange); border-radius:12px; display:flex; align-items:center; justify-content:center; }
  .qrd-session-label { font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--gray-400); }
  .qrd-session-name { font-family:'Outfit',sans-serif; font-size:22px; font-weight:800; }
  .qrd-session-sub { margin-top:3px; color:var(--gray-600); font-size:13px; }
  .qrd-status-pill { display:inline-flex; align-items:center; gap:7px; padding:7px 14px; border-radius:999px; font-size:13px; font-weight:800; border:1px solid var(--gray-200); }
  .qrd-status-pill.active { background:var(--green-light); color:var(--green); border-color:rgba(22,163,74,.3); }
  .qrd-status-pill.ended { background:var(--red-light); color:var(--red); border-color:rgba(220,38,38,.25); }
  .qrd-dot { width:8px; height:8px; border-radius:50%; background:currentColor; }
  .qrd-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
  .qrd-metric { background:var(--white); border:1px solid var(--gray-200); border-radius:10px; padding:18px; }
  .qrd-metric-label { color:var(--gray-400); font-size:12px; font-weight:800; text-transform:uppercase; margin-bottom:8px; }
  .qrd-metric-val { font-family:'Outfit',sans-serif; font-size:32px; font-weight:800; }
  .qrd-metric-val.blue { color:var(--blue); } .qrd-metric-val.orange { color:var(--orange); }
  .qrd-main { display:grid; grid-template-columns:minmax(280px,420px) 1fr; gap:18px; align-items:start; }
  .qrd-panel { background:var(--white); border:1px solid var(--gray-200); border-radius:12px; padding:22px; }
  .qrd-qr-panel { display:flex; flex-direction:column; align-items:center; gap:16px; }
  .qrd-qr-frame { position:relative; padding:14px; border:2px solid var(--blue-light); border-radius:12px; }
  .qrd-qr-frame img { display:block; width:220px; height:220px; border-radius:6px; }
  .qrd-timer { font-family:'Outfit',sans-serif; font-size:34px; font-weight:800; color:var(--blue); }
  .qrd-hint { color:var(--gray-500); font-size:13px; text-align:center; line-height:1.45; }
  .qrd-actions { display:flex; gap:10px; width:100%; flex-wrap:wrap; }
  .qrd-btn { border:none; border-radius:9px; padding:10px 12px; font-family:inherit; font-size:13px; font-weight:800; cursor:pointer; }
  .qrd-btn.primary { background:var(--blue); color:var(--white); }
  .qrd-btn.secondary { background:var(--gray-100); color:var(--gray-800); }
  .qrd-btn.danger { background:var(--red-light); color:var(--red); }
  .qrd-btn:disabled { opacity:.45; cursor:not-allowed; }
  .qrd-tabs { display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
  .qrd-tab { border:1px solid var(--gray-200); background:var(--white); color:var(--gray-600); border-radius:999px; padding:8px 12px; font-family:inherit; font-size:12px; font-weight:800; cursor:pointer; }
  .qrd-tab.active { background:var(--blue); border-color:var(--blue); color:var(--white); }
  .qrd-list { display:flex; flex-direction:column; gap:7px; max-height:520px; overflow:auto; }
  .qrd-student-row { display:grid; grid-template-columns:1fr auto; gap:8px; align-items:center; padding:11px 12px; border:1px solid var(--gray-100); border-radius:9px; background:var(--gray-50); }
  .qrd-student-name { font-weight:800; font-size:13px; }
  .qrd-student-meta { color:var(--gray-600); font-size:12px; margin-top:3px; }
  .qrd-time { color:var(--gray-400); font-size:12px; }
  .qrd-empty { padding:44px 16px; text-align:center; color:var(--gray-400); font-size:14px; background:var(--white); border:1px dashed var(--gray-200); border-radius:12px; }
  .qrd-locked { max-width:620px; margin:40px auto; text-align:center; }
  .qrd-locked h2 { font-family:'Outfit',sans-serif; font-size:22px; margin-bottom:10px; }
  .qrd-locked p { color:var(--gray-600); margin-bottom:18px; line-height:1.5; }
  @media (max-width:860px) { .qrd-main,.qrd-metrics { grid-template-columns:1fr; } }
`;

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("access")}` };
}

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

async function downloadExport(seanceId: number, type: "all" | "present" | "absent") {
  const res = await fetch(`${API_BASE}/qrcode/${seanceId}/export/?type=${type}`, {
    headers: authHeaders(),
  });

  if (!res.ok) return;

  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `presence_seance_${seanceId}_${type}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

export default function QRSessionDashboard() {
  const { seanceId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<QRSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"present" | "absent">("present");
  const [nowTick, setNowTick] = useState(0);

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
              {error && <div className="qrd-empty">{error}</div>}
              <div className="qrd-topbar">
                <div className="qrd-top-left">
                  <div className="qrd-logo-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="2.2">
                      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" /><path d="M15 15h2v2h-2zM20 15h1v1M15 20h1v1M20 20h1v1" />
                    </svg>
                  </div>
                  <div>
                    <div className="qrd-session-label">{session.running ? "Session en cours" : "Session terminee"}</div>
                    <div className="qrd-session-name">{session.module}</div>
                    <div className="qrd-session-sub">{session.filiere} {session.semestre} | {session.cours} | Salle {session.room}</div>
                  </div>
                </div>
                <div className={`qrd-status-pill ${session.running ? "active" : "ended"}`}>
                  <span className="qrd-dot" />
                  {session.running ? "Active" : "Terminee"}
                </div>
              </div>

              <div className="qrd-metrics">
                <div className="qrd-metric"><div className="qrd-metric-label">Presents</div><div className="qrd-metric-val blue">{session.presentCount}</div></div>
                <div className="qrd-metric"><div className="qrd-metric-label">Inscrits</div><div className="qrd-metric-val">{session.eligibleCount}</div></div>
                <div className="qrd-metric"><div className="qrd-metric-label">Taux</div><div className="qrd-metric-val orange">{rate}%</div></div>
              </div>

              <div className="qrd-main">
                <div className="qrd-panel qrd-qr-panel">
                  {session.qrImage && (
                    <div className="qrd-qr-frame">
                      <img src={session.qrImage} alt="QR code session" style={{ opacity: session.running ? 1 : 0.35 }} />
                    </div>
                  )}
                  <div className="qrd-timer">{session.running ? remaining : "Terminee"}</div>
                  <div className="qrd-hint">
                    {session.running
                      ? "Les etudiants ouvrent ce lien (ou scannent le QR) pour valider leur presence."
                      : "La seance est terminee. Les resultats et exports sont disponibles."}
                  </div>
                  {studentScanUrl && (
                    <div className="qrd-hint" style={{ wordBreak: "break-all", fontSize: 12 }}>
                      {studentScanUrl}
                    </div>
                  )}
                  <div className="qrd-actions">
                    <button
                      className="qrd-btn secondary"
                      onClick={() => navigator.clipboard.writeText(studentScanUrl)}
                      disabled={!studentScanUrl}
                    >
                      Copier le lien etudiant
                    </button>
                    <a className="qrd-btn secondary" href={studentScanUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", textAlign: "center" }}>
                      Ouvrir page etudiant
                    </a>
                    <button className="qrd-btn danger" onClick={closeSession} disabled={!session.running}>Terminer</button>
                  </div>
                  <div className="qrd-actions">
                    <button className="qrd-btn secondary" onClick={() => downloadExport(session.id, "present")}>Exporter presents</button>
                    <button className="qrd-btn secondary" onClick={() => downloadExport(session.id, "absent")}>Exporter absents</button>
                    <button className="qrd-btn secondary" onClick={() => downloadExport(session.id, "all")}>Exporter tout</button>
                  </div>
                </div>

                <div className="qrd-panel">
                  <div className="qrd-tabs">
                    <button className={`qrd-tab ${tab === "present" ? "active" : ""}`} onClick={() => setTab("present")}>Presents ({session.presentCount})</button>
                    <button className={`qrd-tab ${tab === "absent" ? "active" : ""}`} onClick={() => setTab("absent")}>Absents ({session.absentCount})</button>
                  </div>
                  <div className="qrd-list">
                    {visibleStudents.length === 0 ? (
                      <div className="qrd-empty">{tab === "present" ? "Aucune presence pour le moment." : "Aucun absent."}</div>
                    ) : visibleStudents.map((student) => (
                      <div className="qrd-student-row" key={student.id}>
                        <div>
                          <div className="qrd-student-name">{student.name}</div>
                          <div className="qrd-student-meta">{student.code_massar} | {student.filiere}</div>
                        </div>
                        <div className="qrd-time">{formatDateTime(student.validated_at)}</div>
                      </div>
                    ))}
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
