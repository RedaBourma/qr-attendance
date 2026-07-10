import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { API_BASE } from "../config";

interface ScanSession {
  running: boolean;
  module: string;
  filiere: string;
  niveau: string;
  semestre: string;
  room: string;
  cours: string;
  date: string;
}

interface StudentResult {
  name: string;
  code_massar: string;
  filiere: string;
}

const css = `
  .scan-root {
    --primary-hsl: 222, 89%, 60%;
    --primary: hsl(var(--primary-hsl));
    --primary-light: hsla(var(--primary-hsl), 0.08);
    --success-hsl: 142, 72%, 45%;
    --success: hsl(var(--success-hsl));
    --success-light: hsla(var(--success-hsl), 0.1);
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
    
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--slate-50);
    font-family: 'DM Sans', 'Inter', system-ui, sans-serif;
    color: var(--slate-800);
  }
  .scan-header {
    background: linear-gradient(135deg, hsl(222, 89%, 52%), hsl(222, 89%, 40%));
    color: white;
    padding: max(24px, env(safe-area-inset-top) + 12px) 20px 28px;
    text-align: center;
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
  }
  .scan-header h1 {
    font-family: 'Outfit', sans-serif;
    font-size: 24px;
    font-weight: 800;
    margin: 0 0 8px;
    letter-spacing: -0.5px;
  }
  .scan-header p {
    margin: 0;
    font-size: 14px;
    opacity: 0.9;
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.5;
  }
  .scan-meta {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
  }
  .scan-chip {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 9999px;
    padding: 6px 14px;
    font-size: 11.5px;
    font-weight: 700;
    color: white;
    backdrop-filter: blur(4px);
  }
  .scan-body {
    flex: 1;
    padding: 24px 16px max(32px, env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 520px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }
  .scan-card {
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 20px;
    padding: 28px;
    box-shadow: var(--shadow-md);
    transition: box-shadow 0.3s ease;
  }
  .scan-card h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 19px;
    margin: 0 0 20px;
    font-weight: 800;
    color: var(--slate-900);
  }
  .scan-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .scan-row-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  @media (max-width: 480px) {
    .scan-row-grid {
      grid-template-columns: 1fr;
      gap: 18px;
    }
  }
  .scan-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .scan-field label {
    color: var(--slate-600);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .scan-field input {
    width: 100%;
    box-sizing: border-box;
    border: 1.5px solid var(--slate-200);
    border-radius: 12px;
    padding: 12px 14px;
    font: inherit;
    font-size: 15px;
    outline: none;
    transition: all 0.2s;
    background: var(--slate-50);
    color: var(--slate-900);
    -webkit-appearance: none;
  }
  .scan-field input:focus {
    border-color: var(--primary);
    background: white;
    box-shadow: 0 0 0 4px hsla(var(--primary-hsl), 0.12);
  }
  .scan-btn {
    border: none;
    border-radius: 12px;
    background: var(--primary);
    color: white;
    padding: 14px;
    font: inherit;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    min-height: 48px;
    box-shadow: var(--shadow-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .scan-btn:hover:not(:disabled) {
    background: hsl(222, 89%, 54%);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  .scan-btn:active:not(:disabled) {
    transform: translateY(1px);
  }
  .scan-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .scan-msg {
    border-radius: 14px;
    padding: 16px;
    font-size: 14px;
    line-height: 1.5;
    border: 1px solid transparent;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .scan-msg.ok {
    background: var(--success-light);
    color: var(--success);
    border-color: hsla(var(--success-hsl), 0.2);
  }
  .scan-msg.err {
    background: var(--danger-light);
    color: var(--danger);
    border-color: hsla(var(--danger-hsl), 0.2);
  }
  .scan-success {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-grow: 1;
    text-align: left;
  }
  .scan-success strong {
    font-size: 17px;
    font-family: 'Outfit', sans-serif;
    color: var(--slate-900);
  }
  .scan-success span {
    opacity: 0.95;
  }
  .scan-success-details {
    font-size: 12px;
    color: var(--slate-600);
    margin-top: 4px;
    border-top: 1px solid hsla(var(--success-hsl), 0.15);
    padding-top: 6px;
    display: block;
  }
  .scan-ended {
    text-align: center;
    color: var(--slate-600);
    padding: 20px 0;
    font-size: 14px;
    line-height: 1.5;
  }
  .scan-loading {
    padding: 40px;
    text-align: center;
    color: var(--slate-600);
    font-size: 15px;
    font-weight: 600;
  }
  
  .scan-geo-banner {
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 13px;
    line-height: 1.4;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1.5px solid transparent;
  }
  .scan-geo-banner.success {
    background: var(--success-light);
    color: var(--success);
    border-color: hsla(var(--success-hsl), 0.15);
  }
  .scan-geo-banner.error {
    background: var(--danger-light);
    color: var(--danger);
    border-color: hsla(var(--danger-hsl), 0.15);
  }
  .scan-geo-banner.loading {
    background: var(--primary-light);
    color: var(--primary);
    border-color: hsla(var(--primary-hsl), 0.15);
  }
  .scan-geo-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
  }
  .scan-geo-btn-retry {
    align-self: flex-start;
    border: 1.5px solid var(--danger);
    background: transparent;
    color: var(--danger);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .scan-geo-btn-retry:hover {
    background: var(--danger);
    color: white;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`;

function getOrCreateDeviceUUID(): string {
  let uuid = localStorage.getItem("device_uuid");
  if (!uuid) {
    uuid = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("device_uuid", uuid);
  }
  return uuid;
}

function readPreviewFromQuery(params: URLSearchParams) {
  return {
    module: params.get("module") || "",
    filiere: params.get("filiere") || "",
    niveau: params.get("niveau") || "",
    semestre: params.get("semestre") || "",
    date: params.get("date") || "",
    heure: params.get("heure") || "",
    salle: params.get("salle") || "",
  };
}

export default function ScanPage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const preview = useMemo(() => readPreviewFromQuery(searchParams), [searchParams]);

  const [session, setSession] = useState<ScanSession | null>(null);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [massar, setMassar] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [student, setStudent] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [requestingGeo, setRequestingGeo] = useState(false);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setRequestingGeo(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeoError(null);
        setRequestingGeo(false);
      },
      (error) => {
        console.error("Error obtaining location:", error);
        let msg = "Erreur de géolocalisation.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "L'accès à la position a été refusé. Veuillez l'activer dans les paramètres de votre navigateur.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "La position géographique est indisponible. Assurez-vous d'avoir activé votre GPS.";
        } else if (error.code === error.TIMEOUT) {
          msg = "La demande de localisation a expiré. Veuillez réessayer.";
        }
        setGeoError(msg);
        setCoords(null);
        setRequestingGeo(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/scan/${token}/`);
        const data = await res.json();

        if (res.ok) {
          setSession(data.seance);
        } else {
          setMessage(data.message || "QR code invalide.");
        }
      } catch {
        setMessage("Erreur de connexion au serveur.");
      } finally {
        setLoading(false);
      }
    };

    load();
    requestLocation();
  }, [token]);

  const display = session || {
    running: true,
    module: preview.module || "Seance",
    filiere: preview.filiere || "",
    niveau: preview.niveau || "",
    semestre: preview.semestre || "",
    room: preview.salle || "—",
    cours: preview.heure || "",
    date: preview.date || "",
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setOk(false);
    setStudent(null);

    const fullName = `${prenom.trim()} ${nom.trim()}`;
    const device_uuid = getOrCreateDeviceUUID();

    const payload: any = {
      name: fullName,
      prenom: prenom.trim(),
      nom: nom.trim(),
      code_massar: massar.trim(),
      device_uuid,
    };

    if (coords) {
      payload.latitude = coords.latitude;
      payload.longitude = coords.longitude;
    }

    try {
      const res = await fetch(`${API_BASE}/scan/${token}/submit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      setOk(res.ok);
      setMessage(data.message || (res.ok ? "Presence enregistree." : "Impossible d'enregistrer la presence."));
      if (res.ok && data.student) {
        setStudent(data.student);
      }
    } catch {
      setMessage("Erreur de connexion au serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="scan-root">
        <header className="scan-header">
          <h1>Présence en cours</h1>
          <p>Scannez et validez votre présence pour cette séance.</p>
          <div className="scan-meta">
            {display.filiere && <span className="scan-chip">{display.filiere} {display.niveau} {display.semestre}</span>}
            {display.module && <span className="scan-chip">{display.module}</span>}
            {display.cours && <span className="scan-chip">{display.cours}</span>}
            {display.date && <span className="scan-chip">{display.date}</span>}
            {display.room && (
              <span className="scan-chip">
                {display.room ? (/^salle\b/i.test(display.room.trim()) ? display.room : `Salle ${display.room}`) : ""}
              </span>
            )}
          </div>
        </header>

        <main className="scan-body">
          {loading ? (
            <div className="scan-loading">Chargement de la séance...</div>
          ) : (
            <section className="scan-card">
              <h2>Vos informations</h2>
              {!session && !message ? (
                <p className="scan-ended">Vérification du QR code...</p>
              ) : session && !session.running ? (
                <p className="scan-ended">Cette séance est terminée. La validation n'est plus possible.</p>
              ) : (
                <form className="scan-form" onSubmit={submit}>
                  {/* Localisation status */}
                  {requestingGeo && (
                    <div className="scan-geo-banner loading">
                      <div className="scan-geo-header">
                        <svg className="animate-spin" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <line x1="12" y1="2" x2="12" y2="6" />
                          <line x1="12" y1="18" x2="12" y2="22" />
                          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                          <line x1="2" y1="12" x2="6" y2="12" />
                          <line x1="18" y1="12" x2="22" y2="12" />
                          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                        </svg>
                        <span>Recherche de votre position...</span>
                      </div>
                    </div>
                  )}

                  {!requestingGeo && coords && (
                    <div className="scan-geo-banner success">
                      <div className="scan-geo-header">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>📍 Position géographique détectée.</span>
                      </div>
                    </div>
                  )}

                  {!requestingGeo && geoError && (
                    <div className="scan-geo-banner error">
                      <div className="scan-geo-header">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>Géolocalisation requise</span>
                      </div>
                      <div style={{ fontSize: '12.5px' }}>{geoError}</div>
                      <button type="button" className="scan-geo-btn-retry" onClick={requestLocation}>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                        </svg>
                        Réessayer
                      </button>
                    </div>
                  )}

                  {!requestingGeo && !coords && !geoError && (
                    <div className="scan-geo-banner error">
                      <div className="scan-geo-header">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>Géolocalisation non obtenue</span>
                      </div>
                      <div style={{ fontSize: '12.5px' }}>
                        L'autorisation de géolocalisation est obligatoire pour valider votre présence.
                      </div>
                      <button type="button" className="scan-geo-btn-retry" onClick={requestLocation}>
                        Obtenir la position
                      </button>
                    </div>
                  )}

                  <div className="scan-row-grid">
                    <div className="scan-field">
                      <label htmlFor="student-prenom">Prénom</label>
                      <input
                        id="student-prenom"
                        value={prenom}
                        onChange={(event) => setPrenom(event.target.value)}
                        placeholder="Votre prénom"
                        autoComplete="given-name"
                        required
                      />
                    </div>
                    <div className="scan-field">
                      <label htmlFor="student-nom">Nom</label>
                      <input
                        id="student-nom"
                        value={nom}
                        onChange={(event) => setNom(event.target.value)}
                        placeholder="Votre nom"
                        autoComplete="family-name"
                        required
                      />
                    </div>
                  </div>
                  <div className="scan-field">
                    <label htmlFor="student-massar">Code Massar</label>
                    <input
                      id="student-massar"
                      value={massar}
                      onChange={(event) => setMassar(event.target.value)}
                      placeholder="Votre code Massar"
                      autoComplete="off"
                      required
                    />
                  </div>
                  <button className="scan-btn" type="submit" disabled={!session?.running || submitting || !coords}>
                    {submitting ? "Validation..." : "Valider ma présence"}
                  </button>
                </form>
              )}
            </section>
          )}

          {message && (
            <div className={`scan-msg ${ok ? "ok" : "err"}`}>
              {ok ? (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              {ok && student ? (
                <div className="scan-success">
                  <strong>{student.name}</strong>
                  <span>{message}</span>
                  <span className="scan-success-details">
                    Code Massar: {student.code_massar} · Filière: {student.filiere}
                  </span>
                </div>
              ) : (
                <div style={{ alignSelf: "center" }}>{message}</div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
