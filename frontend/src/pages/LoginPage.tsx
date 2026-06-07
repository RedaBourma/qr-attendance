import { useState } from "react";
import { API_BASE } from "../config";
import { useNavigate } from "react-router-dom";
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

  .qrp-qr-deco {
    position: absolute; bottom: 24px; right: 24px;
    width: 60px; height: 60px; opacity: 0.14; z-index: 0;
  }

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
  .qrp-btn-primary:active { transform: scale(0.985); }

  .qrp-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 20px 0; color: var(--gray-400); font-size: 12px;
  }
  .qrp-divider::before, .qrp-divider::after {
    content: ''; flex: 1; height: 0.5px; background: var(--gray-200);
  }

  .qrp-btn-google {
    width: 100%; padding: 11px;
    background: var(--white); border: 1.5px solid var(--gray-200); border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500;
    color: var(--gray-800); cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: border-color 0.18s, background 0.18s;
  }
  .qrp-btn-google:hover { background: var(--gray-50); border-color: var(--gray-400); }
  .qrp-btn-google svg { width: 18px; height: 18px; }

  @media (max-width: 620px) {
    .qrp-sidebar { display: none; }
    .qrp-card { max-width: 420px; }
    .qrp-form-panel { padding: 32px 24px; }
  }
`;

// ─── Icons ────────────────────────────────────────────────────────────────────

const MailIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="14" height="10" rx="1.5" />
    <polyline points="1 3 8 9 15 3" />
  </svg>
);

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

// const GoogleIcon = () => (
//   <svg viewBox="0 0 24 24">
//     <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
//     <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
//     <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
//     <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
//   </svg>
// );

// ─── Sidebar ──────────────────────────────────────────────────────────────────

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
        <img className="qrp-logo-img" src={uniLogo} alt="Universite Moulay Ismail - Faculte des Sciences" />
      </div>

      <h2 className="qrp-tagline">
        Suivez les présences<br />avec <em>précision</em>.
      </h2>
      <p className="qrp-tagline-sub">
        Le système de présence QR moderne conçu pour les universités et les établissements académiques.
      </p>

      <ul className="qrp-features">
        {features.map((f) => (
          <li key={f} className="qrp-feature">
            <span className="qrp-feat-icon"><CheckIcon /></span>
            {f}
          </li>
        ))}
      </ul>

      <svg className="qrp-qr-deco" viewBox="0 0 64 64" fill="white">
        <rect x="2" y="2" width="26" height="26" rx="3" />
        <rect x="8" y="8" width="14" height="14" rx="1" fill="#037da7" />
        <rect x="36" y="2" width="26" height="26" rx="3" />
        <rect x="42" y="8" width="14" height="14" rx="1" fill="#037da7" />
        <rect x="2" y="36" width="26" height="26" rx="3" />
        <rect x="8" y="42" width="14" height="14" rx="1" fill="#037da7" />
        <rect x="36" y="36" width="8" height="8" rx="1" /><rect x="48" y="36" width="8" height="8" rx="1" />
        <rect x="36" y="48" width="8" height="8" rx="1" /><rect x="48" y="48" width="8" height="8" rx="1" />
      </svg>
    </aside>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

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
          autoComplete="off"
        />
      </div>
    </div>
  );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password}),
      });

      const data = await res.json();

      if (!res.ok){
        alert(data.message || "Identifiants incorrects.")
        return;
      }

      //store the token and redirect
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));

      const role = data.user?.role;
      const destination = role === "admin" ? "/statistiques" : role === "enseignant" ? "/dashboard" : "/seances";
      navigate(destination, { replace: true });

    }catch(err) {
      alert("Erreur de connexion. Veuillez réessayer.");
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
                Portail académique
              </div>

              <h1 className="qrp-form-title">Bon retour</h1>
              <p className="qrp-form-sub">Connectez-vous à votre compte institutionnel</p>

              <div className="qrp-fields">
                <Field
                  label="Adresse e-mail institutionnelle"
                  icon={<MailIcon />}
                  type="email"
                  placeholder="vous@universite.ma"
                  value={email}
                  onChange={setEmail}
                />
                <Field
                  label="Mot de passe"
                  icon={<LockIcon />}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                />
              </div>

              <div className="qrp-forgot-row">
                <button type="button" className="qrp-forgot">Mot de passe oublié ?</button>
              </div>

              <button type="submit" className="qrp-btn-primary">
                Se connecter à QR Présence
              </button>

              {/* <div className="qrp-divider">ou continuer avec</div>

              <button type="button" className="qrp-btn-google">
                <GoogleIcon />
                Continuer avec Google
              </button> */}
            </form>
          </main>
        </div>
      </div>
    </>
  );
}
