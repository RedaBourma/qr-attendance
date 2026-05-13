import { useEffect, useMemo, useState } from "react";
import SidebarLayout from "../components/Sidebar";

interface FiliereOption {
  id: number;
  nom: string;
}

interface ModuleItem {
  id: number;
  nom: string;
  semestre: string;
}

interface Etudiant {
  id: number;
  code_massar: string;
  nom: string;
  prenom: string;
  email: string;
  filiere: FiliereOption;
  semester: string;
  niveau: string;
  modules: ModuleItem[];
}

interface EtudiantsResponse {
  filters: {
    filieres: FiliereOption[];
    semesters: string[];
  };
  etudiants: Etudiant[];
}

const css = `
  .et-root {
    --blue: #037da7;
    --blue-dark: #025f80;
    --blue-soft: rgba(3,125,167,0.1);
    --orange: #f6931f;
    --white: #ffffff;
    --gray-50: #f7f9fc;
    --gray-100: #eef1f6;
    --gray-200: #dde3ee;
    --gray-400: #94a3b8;
    --gray-600: #4a5568;
    --gray-800: #1a2236;
    font-family: 'DM Sans', sans-serif;
  }

  .et-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .et-title {
    font-family: 'Outfit', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: var(--gray-800);
  }

  .et-subtitle {
    margin-top: 4px;
    font-size: 13px;
    color: var(--gray-400);
  }

  .et-count {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    padding: 10px 14px;
    color: var(--gray-600);
    font-size: 13px;
    white-space: nowrap;
  }

  .et-filters {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) minmax(160px, 220px) minmax(220px, 1.2fr);
    gap: 12px;
    margin-bottom: 18px;
  }

  .et-filter {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .et-filter label {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--gray-400);
  }

  .et-filter select,
  .et-filter input {
    border: none;
    outline: none;
    background: transparent;
    color: var(--gray-800);
    font-family: inherit;
    font-size: 14px;
  }

  .et-table-card {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    overflow: hidden;
  }

  .et-table-wrap {
    overflow-x: auto;
  }

  .et-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 860px;
  }

  .et-table th {
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

  .et-table td {
    border-bottom: 1px solid var(--gray-100);
    color: var(--gray-600);
    font-size: 13px;
    padding: 14px 16px;
    vertical-align: top;
  }

  .et-table tr:last-child td {
    border-bottom: none;
  }

  .et-name {
    color: var(--gray-800);
    font-weight: 800;
  }

  .et-email {
    margin-top: 3px;
    color: var(--gray-400);
    font-size: 12px;
  }

  .et-badge {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    background: var(--blue-soft);
    color: var(--blue);
    font-size: 11px;
    font-weight: 800;
    padding: 4px 9px;
    white-space: nowrap;
  }

  .et-modules {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .et-module {
    display: inline-flex;
    align-items: center;
    border-radius: 8px;
    background: var(--gray-100);
    color: var(--gray-600);
    font-size: 11px;
    font-weight: 700;
    padding: 4px 8px;
  }

  .et-state {
    padding: 42px 20px;
    text-align: center;
    color: var(--gray-400);
    font-size: 14px;
  }

  .et-error {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    color: #be123c;
    border-radius: 10px;
    margin-bottom: 14px;
    padding: 12px 14px;
    font-size: 13px;
  }

  @media (max-width: 760px) {
    .et-header,
    .et-filters {
      grid-template-columns: 1fr;
      display: grid;
    }
  }
`;

function getUserRole() {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return "enseignant";
  }

  try {
    return JSON.parse(rawUser).role || "enseignant";
  } catch {
    return "enseignant";
  }
}

export default function EtudiantsPage() {
  const [filieres, setFilieres] = useState<FiliereOption[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const role = getUserRole();

  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedFiliere) {
      params.set("filiere", selectedFiliere);
    }

    if (selectedSemester) {
      params.set("semester", selectedSemester);
    }

    const loadEtudiants = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`http://localhost:8000/api/etudiants/?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Impossible de charger les etudiants.");
          return;
        }

        const payload = data as EtudiantsResponse;
        setFilieres(payload.filters.filieres);
        setSemesters(payload.filters.semesters);
        setEtudiants(payload.etudiants);
      } catch {
        setError("Erreur de connexion avec le serveur.");
      } finally {
        setLoading(false);
      }
    };

    loadEtudiants();
  }, [selectedFiliere, selectedSemester]);

  const filteredEtudiants = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return etudiants;
    }

    return etudiants.filter((etudiant) => {
      const fullName = `${etudiant.prenom} ${etudiant.nom}`.toLowerCase();
      return (
        fullName.includes(q) ||
        etudiant.email.toLowerCase().includes(q) ||
        etudiant.code_massar.toLowerCase().includes(q)
      );
    });
  }, [etudiants, search]);

  return (
    <>
      <style>{css}</style>
      <SidebarLayout activePage="etudiants" pageTitle="Etudiants">
        <div className="et-root">
          <div className="et-header">
            <div>
              <div className="et-title">Liste des etudiants</div>
              <div className="et-subtitle">
                {role === "admin"
                  ? "Vue globale de toutes les filieres et tous les semestres."
                  : "Etudiants lies aux filieres et modules que vous enseignez."}
              </div>
            </div>
            <div className="et-count">{filteredEtudiants.length} etudiants</div>
          </div>

          {error && <div className="et-error">{error}</div>}

          <div className="et-filters">
            <div className="et-filter">
              <label>Filiere</label>
              <select value={selectedFiliere} onChange={(event) => setSelectedFiliere(event.target.value)}>
                <option value="">Toutes les filieres</option>
                {filieres.map((filiere) => (
                  <option value={filiere.id} key={filiere.id}>
                    {filiere.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="et-filter">
              <label>Semestre</label>
              <select value={selectedSemester} onChange={(event) => setSelectedSemester(event.target.value)}>
                <option value="">Tous les semestres</option>
                {semesters.map((semester) => (
                  <option value={semester} key={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </div>

            <div className="et-filter">
              <label>Recherche</label>
              <input
                type="text"
                placeholder="Nom, email ou code Massar"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="et-table-card">
            {loading ? (
              <div className="et-state">Chargement des etudiants...</div>
            ) : filteredEtudiants.length === 0 ? (
              <div className="et-state">Aucun etudiant trouve.</div>
            ) : (
              <div className="et-table-wrap">
                <table className="et-table">
                  <thead>
                    <tr>
                      <th>Etudiant</th>
                      <th>Code Massar</th>
                      <th>Filiere</th>
                      <th>Semestre</th>
                      <th>Niveau</th>
                      <th>Modules</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEtudiants.map((etudiant) => (
                      <tr key={etudiant.id}>
                        <td>
                          <div className="et-name">{etudiant.prenom} {etudiant.nom}</div>
                          <div className="et-email">{etudiant.email}</div>
                        </td>
                        <td>{etudiant.code_massar}</td>
                        <td><span className="et-badge">{etudiant.filiere.nom}</span></td>
                        <td>{etudiant.semester}</td>
                        <td>{etudiant.niveau}</td>
                        <td>
                          <div className="et-modules">
                            {etudiant.modules.map((module) => (
                              <span className="et-module" key={module.id}>
                                {module.nom} ({module.semestre})
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </SidebarLayout>
    </>
  );
}
