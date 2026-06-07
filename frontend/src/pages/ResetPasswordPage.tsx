import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import uniLogo from "../assets/uni_logo.png";

const FONT_LINK = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Outfit:wght@500;600;700;800&display=swap";

const css = `
  .qrp-root *, .qrp-root *::before, .qrp-root *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .qrp-root {
    --blue:        #037da7;
    --blue-dark:   #025f80;
    --blue-mid:    #0494c4;
    --blue-light:  #e4f4fa;
    --orange:      #f6931f;
    --orange-dark: #d97a10;
    --orange-light:#fff4e5;
    --white:       #ffffff;
    --gray-50:     #f7f9fc;
    --gray-100:    #eef1f6;
    --gray-200:    #dde3ee;
    --gray-400:    #94a3b8;
    --gray-600:    #4a5568;
    --gray-800:    #1a2236;
    font-family: 'DM Sans', sans-serif;
    background: var(--gray-50);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .qrp-card {
    display: flex;
    width: 100%;
    max-width: 820px;
    min-height: 540px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(3,125,167,0.12), 0 4px 16px rgba(0,0,0,0.07);
    background: var(--white);
    animation: qrp-fadein 0.4s ease;
  }

  @keyframes qrp-fadein {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .qrp-sidebar {
    width: 320px;
    flex-shrink: 0;
    background: var(--blue);
    position: relative;
    padding: 36px 32px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .qrp-sidebar::before {
    content: '';
    position: absolute;
    top: -90px; right: -90px;
    width: 260px; height: 260px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    pointer-events: none;
  }
  .qrp-sidebar::after {
    content: '';
    position: absolute;
    bottom: -70px; left: -50px;
    width: 220px; height: 220px;
    border-radius: 50%;
    background: rgba(246,147,31,0.15);
    pointer-events: none;
  }

  .qrp-logo {
    display: flex; align-items: center;
    margin-bottom: 44px;
    position: relative; z-index: 1;
    width: fit-content;
    max-width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 10px 24px rgba(0,0,0,0.12);
  }
  .qrp-logo-img {
    display: block;
    width: min(220px, 100%);
    max-height: 72px;
    object-fit: contain;
    object-position: left center;
  }

  .qrp-tagline {
    font-family: 'Outfit', sans-serif;
    font-size: 26px; font-weight: 800;
    color: #fff; line-height: 1.25;
    margin-bottom: 14px;
    position: relative; z-index: 1;
  }
  .qrp-tagline em { font-style: normal; color: var(--orange); }

  .qrp-tagline-sub {
    font-size: 13.5px; line-height: 1.7;
    color: rgba(255,255,255,0.68);
    margin-bottom: 36px;
    position: relative; z-index: 1;
  }

  .qrp-features {
    list-style: none;
    display: flex; flex-direction: column; gap: 13px;
    margin-top: auto;
    position: relative; z-index: 1;
  }
  .qrp-feature {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: rgba(255,255,255,0.85);
  }
  .qrp-feat-icon {
    width: 22px; height: 22px; flex-shrink: 0;
    border-radius: 50%;
    background: rgba(246,147,31,0.2);
    border: 1.5px solid rgba(246,147,31,0.7);
    display: flex; align-items: center; justify-content: center;
  }
  .qrp-feat-icon svg { width: 11px; height: 11px; stroke: var(--orange); }

  .qrp-form-panel {
    flex: 1;
    padding: 40px 44px;
    display: flex; flex-direction: column;
    justify-content: center;
  }

  .qrp-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: var(--orange-light); color: var(--orange-dark);
    font-size: 11.5px; font-weight: 600;
    padding: 4px 10px; border-radius: 20px; margin-bottom: 14px;
    width: fit-content;
  }
  .qrp-badge svg { width: 11px; height: 11px; }

  .qrp-form-title {
    font-family: 'Outfit', sans-serif;
    font-size: 24px; font-weight: 700;
    color: var(--gray-800); margin-bottom: 4px;
  }
  .qrp-form-sub {
    font-size: 13.5px; color: var(--gray-400); margin-bottom: 28px;
  }

  .qrp-fields { display: flex; flex-direction: column; gap: 16px; }

  .qrp-field { display: flex; flex-direction: column; gap: 5px; }
  .qrp-field label {
    font-size: 12px; font-weight: 500; letter-spacing: 0.02em;
    color: var(--gray-600); text-transform: uppercase;
  }

  .qrp-input-wrap { position: relative; display: flex; align-items: center; }
  .qrp-input-wrap .qrp-icon {
    position: absolute; left: 11px;
    width: 15px; height: 15px; color: var(--gray-400); pointer-events: none;
  }
  .qrp-input-wrap input {
    width: 100%; padding: 11px 12px 11px 36px;
    border: 1.5px solid var(--gray-200); border-radius: 9px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--gray-800);
    background: var(--white); outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .qrp-input-wrap input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(3,125,167,0.1);
  }
  .qrp-input-wrap input::placeholder { color: var(--gray-400); }

  .qrp-btn-primary {
    width: 100%; padding: 13px;
    background: var(--blue); color: var(--white);
    border: none; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 14.5px; font-weight: 600;
    cursor: pointer; margin-top: 20px;
    transition: background 0.18s, transform 0.1s;
    letter-spacing: 0.01em;
  }
  .qrp-btn-primary:hover { background: var(--blue-dark); }
  .qrp-btn-primary:disabled { background: var(--gray-200); color: var(--gray-400); cursor: not-allowed; }

  .qrp-forgot-row {
    display: flex; justify-content: flex-end;
    margin-top: 4px;
  }
  .qrp-forgot {
    font-size: 12.5px; color: var(--blue); font-weight: 500;
    cursor: pointer; background: none; border: none;
    font-family: 'DM Sans', sans-serif;
  }
  .qrp-forgot:hover { text-decoration: underline; }

  @media (max-width: 620px) {
    .qrp-sidebar { display: none; }
    .qrp-card { max-width: 420px; }
    .qrp-form-panel { padding: 32px 24px; }
  }
`;

const LockIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="10" height="8" rx="1.5" />
    <path d="M5 7V5a3 3 0 0 1 6 0v2" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 8 6.5 11.5 13 5" />
  </svg>
);

function Sidebar() {
  const features = [
    "Génération instantanée de sessions QR",
    "Suivi des présences en temps réel",
    "Tableau de bord & rapports analytiques",
    "Contrôle d'accès par rôle",
  ];

  return (
    <aside className="qrp-sidebar">
      <div className="qrp-logo">
        <img className="qrp-logo-img" src={uniLogo} alt="Universite Moulay Ismail" />
      </div>

      <h2 className="qrp-tagline">
        Choisissez un<br />nouveau <em>mot de passe</em>.
      </h2>
      <p className="qrp-tagline-sub">
        Sécurisez votre compte en définissant un mot de passe robuste de 6 caractères ou plus.
      </p>

      <ul className="qrp-features">
        {features.map((f) => (
          <li key={f} className="qrp-feature">
            <span className="qrp-feat-icon"><CheckIcon /></span>
            {f}
          </li>
        ))}
      </ul>
    </aside>
  );
}

interface FieldProps {
  label: string;
  icon: React.ReactNode;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}

function Field({ label, icon, type = "text", placeholder, value, onChange }: FieldProps) {
  return (
    <div className="qrp-field">
      <label>{label}</label>
      <div className="qrp-input-wrap">
        <span className="qrp-icon">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!uid || !token) {
      setStatusMsg({ type: "error", message: "Lien de réinitialisation invalide. Les paramètres obligatoires sont manquants." });
    }
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !token) return;

    if (password.length < 6) {
      setStatusMsg({ type: "error", message: "Le mot de passe doit contenir au moins 6 caractères." });
      return;
    }

    if (password !== confirmPassword) {
      setStatusMsg({ type: "error", message: "Les mots de passe ne correspondent pas." });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`${API_BASE}/auth/password-reset-confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: "error", message: data.message || "Une erreur est survenue." });
        return;
      }
      setStatusMsg({ type: "success", message: data.message || "Votre mot de passe a été réinitialisé." });
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch {
      setStatusMsg({ type: "error", message: "Erreur de connexion avec le serveur." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <style>{css}</style>

      <div className="qrp-root">
        <div className="qrp-card">
          <Sidebar />

          <main className="qrp-form-panel">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
              <div className="qrp-badge">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6" />
                  <line x1="8" y1="5" x2="8" y2="8" />
                  <circle cx="8" cy="11" r="0.5" fill="currentColor" />
                </svg>
                Réinitialisation
              </div>

              <h1 className="qrp-form-title">Nouveau mot de passe</h1>
              <p className="qrp-form-sub">Veuillez saisir votre nouveau mot de passe institutionnel.</p>

              {statusMsg && (
                <div style={{
                  padding: "12px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  marginBottom: "20px",
                  background: statusMsg.type === "success" ? "rgba(3,125,167,0.1)" : "#fff1f2",
                  border: `1px solid ${statusMsg.type === "success" ? "var(--blue)" : "#fecdd3"}`,
                  color: statusMsg.type === "success" ? "var(--blue-dark)" : "#be123c",
                  lineHeight: "1.4"
                }}>
                  {statusMsg.message}
                </div>
              )}

              <div className="qrp-fields">
                <Field
                  label="Nouveau mot de passe"
                  icon={<LockIcon />}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                />
                <Field
                  label="Confirmer le mot de passe"
                  icon={<LockIcon />}
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
              </div>

              <button type="submit" className="qrp-btn-primary" disabled={submitting || !uid || !token}>
                {submitting ? (
                  <>
                    <span className="spinner"></span>
                    Mise à jour...
                  </>
                ) : "Mettre à jour le mot de passe"}
              </button>

              <div className="qrp-forgot-row" style={{ marginTop: "16px", justifyContent: "center" }}>
                <button
                  type="button"
                  className="qrp-forgot"
                  onClick={() => navigate("/login")}
                >
                  Retour à la connexion
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </>
  );
}
