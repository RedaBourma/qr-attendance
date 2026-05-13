import { useEffect, useMemo, useState } from "react";
import SidebarLayout from "../components/Sidebar";

interface Enseignant {
  id: number;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: string;
  };
  cours_count: number;
}

interface EnseignantsResponse {
  enseignants: Enseignant[];
}

const css = `
  .ens-root {
    --blue: #037da7;
    --blue-soft: rgba(3,125,167,0.1);
    --white: #ffffff;
    --gray-50: #f7f9fc;
    --gray-100: #eef1f6;
    --gray-200: #dde3ee;
    --gray-400: #94a3b8;
    --gray-600: #4a5568;
    --gray-800: #1a2236;
    font-family: 'DM Sans', sans-serif;
  }

  .ens-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .ens-title {
    font-family: 'Outfit', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: var(--gray-800);
  }

  .ens-subtitle {
    margin-top: 4px;
    font-size: 13px;
    color: var(--gray-400);
  }

  .ens-search {
    background: var(--white);
    border: 1.5px solid var(--gray-200);
    border-radius: 10px;
    color: var(--gray-800);
    font-family: inherit;
    font-size: 13px;
    min-width: 260px;
    outline: none;
    padding: 10px 12px;
  }

  .ens-card {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    overflow: hidden;
  }

  .ens-table {
    width: 100%;
    border-collapse: collapse;
  }

  .ens-table th {
    background: var(--gray-50);
    border-bottom: 1px solid var(--gray-200);
    color: var(--gray-400);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
    padding: 12px 16px;
    text-align: left;
    text-transform: uppercase;
  }

  .ens-table td {
    border-bottom: 1px solid var(--gray-100);
    color: var(--gray-600);
    font-size: 13px;
    padding: 14px 16px;
  }

  .ens-table tr:last-child td {
    border-bottom: none;
  }

  .ens-name {
    color: var(--gray-800);
    font-weight: 800;
  }

  .ens-email {
    margin-top: 3px;
    color: var(--gray-400);
    font-size: 12px;
  }

  .ens-badge {
    display: inline-flex;
    border-radius: 999px;
    background: var(--blue-soft);
    color: var(--blue);
    font-size: 11px;
    font-weight: 800;
    padding: 4px 9px;
  }

  .ens-state {
    color: var(--gray-400);
    font-size: 14px;
    padding: 42px 20px;
    text-align: center;
  }

  .ens-error {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-radius: 10px;
    color: #be123c;
    font-size: 13px;
    margin-bottom: 14px;
    padding: 12px 14px;
  }
`;

export default function EnseignantsPage() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEnseignants = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("http://localhost:8000/api/enseignants/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Impossible de charger les enseignants.");
          return;
        }

        setEnseignants((data as EnseignantsResponse).enseignants);
      } catch {
        setError("Erreur de connexion avec le serveur.");
      } finally {
        setLoading(false);
      }
    };

    loadEnseignants();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return enseignants;
    }

    return enseignants.filter((enseignant) => {
      const fullName = `${enseignant.user.prenom} ${enseignant.user.nom}`.toLowerCase();
      return fullName.includes(q) || enseignant.user.email.toLowerCase().includes(q);
    });
  }, [enseignants, search]);

  return (
    <>
      <style>{css}</style>
      <SidebarLayout activePage="enseignants" pageTitle="Enseignants">
        <div className="ens-root">
          <div className="ens-header">
            <div>
              <div className="ens-title">Enseignants</div>
              <div className="ens-subtitle">Liste reservee a l'administrateur.</div>
            </div>
            <input
              className="ens-search"
              type="text"
              placeholder="Rechercher par nom ou email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {error && <div className="ens-error">{error}</div>}

          <div className="ens-card">
            {loading ? (
              <div className="ens-state">Chargement des enseignants...</div>
            ) : filtered.length === 0 ? (
              <div className="ens-state">Aucun enseignant trouve.</div>
            ) : (
              <table className="ens-table">
                <thead>
                  <tr>
                    <th>Enseignant</th>
                    <th>Email</th>
                    <th>Cours</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((enseignant) => (
                    <tr key={enseignant.id}>
                      <td>
                        <div className="ens-name">{enseignant.user.prenom} {enseignant.user.nom}</div>
                        <div className="ens-email">ID {enseignant.user.id}</div>
                      </td>
                      <td>{enseignant.user.email}</td>
                      <td>{enseignant.cours_count}</td>
                      <td><span className="ens-badge">Enseignant</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </SidebarLayout>
    </>
  );
}
