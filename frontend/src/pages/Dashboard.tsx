import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "../components/Sidebar";
import { API_BASE } from "../config";

type SeanceStatus = "active" | "expired";

interface DashboardStats {
  totalSeances: number;
  activeSeances: number;
  totalPresences: number;
  avgPresences: number;
}

interface Seance {
  id: string;
  module: string;
  filiere: string;
  cours: string;
  date: string;
  startsAt: string;
  expiresAt: string;
  status: SeanceStatus;
  presences: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  seances: Seance[];
}

const EMPTY_STATS: DashboardStats = {
  totalSeances: 0,
  activeSeances: 0,
  totalPresences: 0,
  avgPresences: 0,
};

const css = `
  .db-root {
    --blue: #037da7;
    --blue-dark: #025f80;
    --blue-soft: rgba(3,125,167,0.1);
    --orange: #f6931f;
    --orange-soft: rgba(246,147,31,0.12);
    --green: #16a34a;
    --green-soft: rgba(22,163,74,0.1);
    --red: #dc2626;
    --red-soft: rgba(220,38,38,0.09);
    --white: #ffffff;
    --gray-50: #f7f9fc;
    --gray-100: #eef1f6;
    --gray-200: #dde3ee;
    --gray-400: #94a3b8;
    --gray-600: #4a5568;
    --gray-800: #1a2236;
    font-family: 'DM Sans', sans-serif;
  }

  .db-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .db-stat-card {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    padding: 18px;
  }

  .db-stat-label {
    color: var(--gray-400);
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .db-stat-value {
    color: var(--gray-800);
    font-family: 'Outfit', sans-serif;
    font-size: 30px;
    font-weight: 800;
  }

  .db-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .db-toolbar-title {
    color: var(--gray-800);
    flex: 1;
    font-family: 'Outfit', sans-serif;
    font-size: 18px;
    font-weight: 800;
  }

  .db-search,
  .db-filter {
    background: var(--white);
    border: 1.5px solid var(--gray-200);
    border-radius: 10px;
    color: var(--gray-800);
    font-family: inherit;
    font-size: 13px;
    outline: none;
    padding: 9px 12px;
  }

  .db-search {
    min-width: 240px;
  }

  .db-table-card {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    overflow: hidden;
  }

  .db-table-wrap {
    overflow-x: auto;
  }

  .db-table {
    border-collapse: collapse;
    min-width: 900px;
    width: 100%;
  }

  .db-table th {
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

  .db-table td {
    border-bottom: 1px solid var(--gray-100);
    color: var(--gray-600);
    font-size: 13px;
    padding: 14px 16px;
    vertical-align: middle;
  }

  .db-table tr:last-child td {
    border-bottom: none;
  }

  .db-module {
    color: var(--gray-800);
    font-weight: 800;
  }

  .db-badge {
    background: var(--blue-soft);
    border-radius: 999px;
    color: var(--blue);
    display: inline-flex;
    font-size: 11px;
    font-weight: 800;
    padding: 4px 9px;
    white-space: nowrap;
  }

  .db-status {
    align-items: center;
    border-radius: 999px;
    display: inline-flex;
    font-size: 11px;
    font-weight: 800;
    padding: 5px 10px;
    white-space: nowrap;
  }

  .db-status.active {
    background: var(--green-soft);
    color: var(--green);
  }

  .db-status.expired {
    background: var(--red-soft);
    color: var(--red);
  }

  .db-state {
    color: var(--gray-400);
    font-size: 14px;
    padding: 46px 20px;
    text-align: center;
  }

  .db-error {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-radius: 10px;
    color: #be123c;
    font-size: 13px;
    margin-bottom: 14px;
    padding: 12px 14px;
  }

  .db-qr-btn {
    background: var(--blue);
    border: none;
    border-radius: 8px;
    color: var(--white);
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    font-weight: 800;
    padding: 8px 12px;
  }

  .db-qr-btn:disabled {
    background: var(--gray-100);
    color: var(--gray-400);
    cursor: not-allowed;
  }

  @media (max-width: 900px) {
    .db-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 560px) {
    .db-stats {
      grid-template-columns: 1fr;
    }

    .db-search {
      min-width: 100%;
    }
  }
`;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | SeanceStatus>("all");
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/dashboard/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });

        const data = await res.json();

        if (res.status === 401) {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          localStorage.removeItem("user");
          window.location.replace("/login");
          return;
        }

        if (!res.ok) {
          setError(data.message || "Impossible de charger le dashboard.");
          return;
        }

        const payload = data as DashboardResponse;
        setStats(payload.stats);
        setSeances(payload.seances);
      } catch {
        setError("Erreur de connexion avec le serveur.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return seances.filter((seance) => {
      const matchSearch =
        !q ||
        seance.module.toLowerCase().includes(q) ||
        seance.filiere.toLowerCase().includes(q) ||
        seance.cours.toLowerCase().includes(q);
      const matchFilter = filter === "all" || seance.status === filter;

      return matchSearch && matchFilter;
    });
  }, [filter, search, seances]);

  return (
    <>
      <style>{css}</style>
      <SidebarLayout activePage="dashboard" pageTitle="Tableau de bord">
        <div className="db-root">
          {error && <div className="db-error">{error}</div>}

          <div className="db-stats">
            <div className="db-stat-card">
              <div className="db-stat-label">Seances generees</div>
              <div className="db-stat-value">{stats.totalSeances}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Seances actives</div>
              <div className="db-stat-value">{stats.activeSeances}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Presences totales</div>
              <div className="db-stat-value">{stats.totalPresences}</div>
            </div>
            <div className="db-stat-card">
              <div className="db-stat-label">Presences moyennes / seance</div>
              <div className="db-stat-value">{stats.avgPresences}</div>
            </div>
          </div>

          <div className="db-toolbar">
            <div className="db-toolbar-title">Mes seances recentes</div>
            <input
              className="db-search"
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="db-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value as typeof filter)}
            >
              <option value="all">Toutes</option>
              <option value="active">Actives</option>
              <option value="expired">Expirees</option>
            </select>
          </div>

          <div className="db-table-card">
            {loading ? (
              <div className="db-state">Chargement du dashboard...</div>
            ) : filtered.length === 0 ? (
              <div className="db-state">Aucune seance trouvee.</div>
            ) : (
              <div className="db-table-wrap">
                <table className="db-table">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Filiere</th>
                      <th>Cours</th>
                      <th>Date</th>
                      <th>Statut</th>
                      <th>Presences</th>
                      <th>QR Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((seance) => (
                      <tr key={seance.id}>
                        <td><div className="db-module">{seance.module}</div></td>
                        <td><span className="db-badge">{seance.filiere}</span></td>
                        <td>{seance.cours}</td>
                        <td>
                          {formatDate(seance.date)}
                          <br />
                          <span>Expire a {formatTime(seance.expiresAt)}</span>
                        </td>
                        <td>
                          <span className={`db-status ${seance.status}`}>
                            {seance.status === "active" ? "Active" : "Expiree"}
                          </span>
                        </td>
                        <td>{seance.presences} etudiants</td>
                        <td>
                          <button
                            className="db-qr-btn"
                            onClick={() => navigate(`/qr/${seance.id}`)}
                          >
                            {seance.status === "active" ? "Voir QR" : "Resultats"}
                          </button>
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
