import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { API_BASE } from "../config";

interface ScanSession {
  running: boolean;
  module: string;
  filiere: string;
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
    --blue: #037da7;
    --blue-dark: #025f80;
    --green: #16a34a;
    --red: #dc2626;
    --white: #fff;
    --gray-50: #f7f9fc;
    --gray-100: #eef1f6;
    --gray-200: #dde3ee;
    --gray-400: #94a3b8;
    --gray-600: #4a5568;
    --gray-800: #1a2236;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--gray-50);
    font-family: 'DM Sans', sans-serif;
    color: var(--gray-800);
  }
  .scan-header {
    background: linear-gradient(135deg, var(--blue), var(--blue-dark));
    color: var(--white);
    padding: max(20px, env(safe-area-inset-top)) 20px 24px;
  }
  .scan-header h1 {
    font-family: 'Outfit', sans-serif;
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 6px;
  }
  .scan-header p {
    margin: 0;
    font-size: 14px;
    opacity: 0.92;
    line-height: 1.45;
  }
  .scan-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }
  .scan-chip {
    background: rgba(255,255,255,0.16);
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 700;
  }
  .scan-body {
    flex: 1;
    padding: 16px 16px max(24px, env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .scan-card {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    padding: 18px;
    box-shadow: 0 8px 24px rgba(26,34,54,0.06);
  }
  .scan-card h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 17px;
    margin: 0 0 14px;
  }
  .scan-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .scan-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .scan-field label {
    color: var(--gray-600);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }
  .scan-field input {
    width: 100%;
    box-sizing: border-box;
    border: 1.5px solid var(--gray-200);
    border-radius: 12px;
    padding: 14px 14px;
    font: inherit;
    font-size: 16px;
    outline: none;
    -webkit-appearance: none;
  }
  .scan-field input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(3,125,167,0.12);
  }
  .scan-btn {
    border: none;
    border-radius: 12px;
    background: var(--blue);
    color: white;
    padding: 15px;
    font: inherit;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    min-height: 52px;
  }
  .scan-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .scan-msg {
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 14px;
    line-height: 1.45;
  }
  .scan-msg.ok {
    background: #dcfce7;
    color: var(--green);
  }
  .scan-msg.err {
    background: #fee2e2;
    color: var(--red);
  }
  .scan-success {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .scan-success strong {
    font-size: 18px;
    font-family: 'Outfit', sans-serif;
  }
  .scan-ended {
    text-align: center;
    color: var(--gray-600);
    padding: 12px 0;
    font-size: 14px;
  }
  .scan-loading {
    padding: 24px;
    text-align: center;
    color: var(--gray-400);
  }
`;

function readPreviewFromQuery(params: URLSearchParams) {
  return {
    module: params.get("module") || "",
    filiere: params.get("filiere") || "",
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
  const [name, setName] = useState("");
  const [massar, setMassar] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [student, setStudent] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
  }, [token]);

  const display = session || {
    running: true,
    module: preview.module || "Seance",
    filiere: preview.filiere || "",
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

    try {
      const res = await fetch(`${API_BASE}/scan/${token}/submit/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code_massar: massar }),
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
          <h1>Presence en cours</h1>
          <p>Scannez et validez votre presence pour cette seance.</p>
          <div className="scan-meta">
            {display.filiere && <span className="scan-chip">{display.filiere} {display.semestre}</span>}
            {display.module && <span className="scan-chip">{display.module}</span>}
            {display.cours && <span className="scan-chip">{display.cours}</span>}
            {display.date && <span className="scan-chip">{display.date}</span>}
            {display.room && <span className="scan-chip">Salle {display.room}</span>}
          </div>
        </header>

        <main className="scan-body">
          {loading ? (
            <div className="scan-loading">Chargement de la seance...</div>
          ) : (
            <section className="scan-card">
              <h2>Vos informations</h2>
              {!session && !message ? (
                <p className="scan-ended">Verification du QR code...</p>
              ) : session && !session.running ? (
                <p className="scan-ended">Cette seance est terminee. La validation n'est plus possible.</p>
              ) : (
                <form className="scan-form" onSubmit={submit}>
                  <div className="scan-field">
                    <label htmlFor="student-name">Nom complet</label>
                    <input
                      id="student-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Ex: Salma Benali"
                      autoComplete="name"
                      required
                    />
                  </div>
                  <div className="scan-field">
                    <label htmlFor="student-massar">Code Massar</label>
                    <input
                      id="student-massar"
                      value={massar}
                      onChange={(event) => setMassar(event.target.value)}
                      placeholder="Votre code Massar"
                      autoComplete="off"
                      inputMode="numeric"
                      required
                    />
                  </div>
                  <button className="scan-btn" type="submit" disabled={!session?.running || submitting}>
                    {submitting ? "Validation..." : "Valider ma presence"}
                  </button>
                </form>
              )}
            </section>
          )}

          {message && (
            <div className={`scan-msg ${ok ? "ok" : "err"}`}>
              {ok && student ? (
                <div className="scan-success">
                  <strong>{student.name}</strong>
                  <span>{message}</span>
                  <span>{student.code_massar} · {student.filiere}</span>
                </div>
              ) : (
                message
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
