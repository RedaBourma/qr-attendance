import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "../components/Sidebar";
import { API_BASE } from "../config";

type Tab = "students" | "courses" | "teachers";
type SeanceStatus = "active" | "expired";

interface DashboardStats {
  totalSeances: number;
  activeSeances: number;
  totalPresences: number;
  avgPresences: number;
  attendanceRate: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalEligible: number;
}

interface StudentStat {
  id: number;
  name: string;
  email: string;
  codeMassar: string;
  filiere: string;
  niveau: string;
  semestre: string;
  eligibleSessions: number;
  presences: number;
  absences: number;
  attendanceRate: number;
}

interface CourseStat {
  id: number;
  module: string;
  filiere: string;
  niveau: string;
  semestre: string;
  enseignant: string;
  sessions: number;
  presences: number;
  eligible: number;
  attendanceRate: number;
}

interface TeacherStat {
  id: number;
  name: string;
  email: string;
  courses: number;
  sessions: number;
  temporarySessions: number;
  presences: number;
  eligible: number;
  attendanceRate: number;
}

interface Seance {
  id: string;
  module: string;
  filiere: string;
  niveau?: string;
  cours: string;
  date: string;
  expiresAt: string;
  status: SeanceStatus;
  presences: number;
  isTemporary?: boolean;
  enseignant?: string;
  professor?: {
    nom: string;
    prenom: string;
    email: string;
  } | null;
}

interface DashboardResponse {
  stats: DashboardStats;
  analytics: {
    students: StudentStat[];
    courses: CourseStat[];
    teachers: TeacherStat[];
  };
  seances: Seance[];
}

const EMPTY_STATS: DashboardStats = {
  totalSeances: 0,
  activeSeances: 0,
  totalPresences: 0,
  avgPresences: 0,
  attendanceRate: 0,
  totalStudents: 0,
  totalTeachers: 0,
  totalCourses: 0,
  totalEligible: 0,
};

const css = `
  .st-root {
    --blue:#037da7; --blue-dark:#025f80; --blue-soft:rgba(3,125,167,.1);
    --orange:#f6931f; --orange-soft:rgba(246,147,31,.13);
    --green:#16a34a; --green-soft:rgba(22,163,74,.1);
    --red:#dc2626; --red-soft:rgba(220,38,38,.09);
    --white:#fff; --gray-50:#f7f9fc; --gray-100:#eef1f6; --gray-200:#dde3ee;
    --gray-400:#94a3b8; --gray-600:#4a5568; --gray-800:#1a2236;
    color:var(--gray-800); font-family:'DM Sans',sans-serif;
  }
  .st-hero { display:grid; grid-template-columns:minmax(0,1.4fr) minmax(220px,.6fr); gap:18px; margin-bottom:18px; }
  .st-panel { background:var(--white); border:1px solid var(--gray-200); border-radius:12px; padding:18px; }
  .st-title { font-family:'Outfit',sans-serif; font-size:26px; font-weight:800; margin-bottom:6px; }
  .st-sub { color:var(--gray-600); font-size:13px; line-height:1.45; max-width:760px; }
  .st-rate { align-items:center; display:flex; gap:16px; justify-content:space-between; }
  .st-rate-num { color:var(--blue); font-family:'Outfit',sans-serif; font-size:42px; font-weight:800; }
  .st-rate-label { color:var(--gray-400); font-size:12px; font-weight:800; text-transform:uppercase; }
  .st-ring { width:84px; height:84px; border-radius:50%; display:grid; place-items:center; background:conic-gradient(var(--blue) var(--rate), var(--gray-100) 0); }
  .st-ring::before { content:""; width:58px; height:58px; border-radius:50%; background:var(--white); }
  .st-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
  .st-metric { background:var(--white); border:1px solid var(--gray-200); border-radius:12px; padding:16px; }
  .st-label { color:var(--gray-400); font-size:11px; font-weight:800; text-transform:uppercase; }
  .st-value { font-family:'Outfit',sans-serif; font-size:30px; font-weight:800; margin-top:8px; }
  .st-meta { color:var(--gray-600); font-size:12px; margin-top:4px; }
  .st-main { display:grid; grid-template-columns:minmax(0,1fr) 360px; gap:18px; align-items:start; }
  .st-toolbar { align-items:center; display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
  .st-tabs { display:flex; gap:8px; flex:1; flex-wrap:wrap; }
  .st-tab { background:var(--white); border:1px solid var(--gray-200); border-radius:999px; color:var(--gray-600); cursor:pointer; font-family:inherit; font-size:12px; font-weight:800; padding:8px 12px; }
  .st-tab.active { background:var(--blue); border-color:var(--blue); color:var(--white); }
  .st-search { background:var(--white); border:1.5px solid var(--gray-200); border-radius:10px; color:var(--gray-800); font-family:inherit; font-size:13px; min-width:250px; outline:none; padding:9px 12px; }
  .st-table-wrap { overflow-x:auto; }
  .st-table { border-collapse:collapse; min-width:820px; width:100%; }
  .st-table th { background:var(--gray-50); border-bottom:1px solid var(--gray-200); color:var(--gray-400); font-size:11px; font-weight:800; padding:12px 14px; text-align:left; text-transform:uppercase; }
  .st-table td { border-bottom:1px solid var(--gray-100); color:var(--gray-600); font-size:13px; padding:13px 14px; vertical-align:middle; }
  .st-table tr:last-child td { border-bottom:none; }
  .st-name { color:var(--gray-800); font-weight:800; }
  .st-small { color:var(--gray-400); font-size:12px; margin-top:3px; }
  .st-progress { align-items:center; display:flex; gap:9px; min-width:150px; }
  .st-bar { background:var(--gray-100); border-radius:999px; height:8px; overflow:hidden; width:86px; }
  .st-fill { background:var(--green); border-radius:999px; height:100%; min-width:2px; }
  .st-fill.warn { background:var(--orange); }
  .st-fill.low { background:var(--red); }
  .st-rate-text { color:var(--gray-800); font-weight:800; min-width:38px; }
  .st-recent-list { display:flex; flex-direction:column; gap:9px; margin-top:12px; max-height:560px; overflow:auto; }
  .st-session { border:1px solid var(--gray-200); border-left:4px solid var(--blue); border-radius:10px; padding:11px; }
  .st-session.temp { border-left-color:var(--orange); }
  .st-session-head { align-items:center; display:flex; gap:8px; justify-content:space-between; }
  .st-badge { background:var(--blue-soft); border-radius:999px; color:var(--blue); display:inline-flex; font-size:10px; font-weight:800; padding:4px 8px; text-transform:uppercase; white-space:nowrap; }
  .st-badge.temp { background:var(--orange-soft); color:var(--orange); }
  .st-badge.active { background:var(--green-soft); color:var(--green); }
  .st-empty,.st-error { border-radius:10px; color:var(--gray-400); font-size:14px; padding:32px 16px; text-align:center; }
  .st-error { background:#fff1f2; border:1px solid #fecdd3; color:#be123c; margin-bottom:14px; padding:12px 14px; text-align:left; }
  .st-link { background:var(--gray-100); border:none; border-radius:8px; color:var(--gray-800); cursor:pointer; font-family:inherit; font-size:12px; font-weight:800; padding:7px 9px; }
  @media (max-width:1100px) { .st-main,.st-hero { grid-template-columns:1fr; } .st-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width:640px) { .st-grid { grid-template-columns:1fr; } .st-search { min-width:100%; } }
`;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function fillClass(rate: number) {
  if (rate < 50) return "low";
  if (rate < 75) return "warn";
  return "";
}

function Progress({ value }: { value: number }) {
  return (
    <div className="st-progress">
      <div className="st-bar"><div className={`st-fill ${fillClass(value)}`} style={{ width: `${Math.min(value, 100)}%` }} /></div>
      <span className="st-rate-text">{value}%</span>
    </div>
  );
}

export default function StatistiquesPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [students, setStudents] = useState<StudentStat[]>([]);
  const [courses, setCourses] = useState<CourseStat[]>([]);
  const [teachers, setTeachers] = useState<TeacherStat[]>([]);
  const [seances, setSeances] = useState<Seance[]>([]);
  const [tab, setTab] = useState<Tab>("students");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/dashboard/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
        });
        const data = await res.json();

        if (res.status === 401) {
          localStorage.clear();
          window.location.replace("/login");
          return;
        }

        if (!res.ok) {
          setError(data.message || "Impossible de charger les statistiques.");
          return;
        }

        const payload = data as DashboardResponse;
        setStats(payload.stats);
        setStudents(payload.analytics.students);
        setCourses(payload.analytics.courses);
        setTeachers(payload.analytics.teachers);
        setSeances(payload.seances);
      } catch {
        setError("Erreur de connexion avec le serveur.");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((item) => !q || item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q) || item.codeMassar.toLowerCase().includes(q));
  }, [search, students]);

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((item) => !q || item.module.toLowerCase().includes(q) || item.filiere.toLowerCase().includes(q) || item.enseignant.toLowerCase().includes(q));
  }, [courses, search]);

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((item) => !q || item.name.toLowerCase().includes(q) || item.email.toLowerCase().includes(q));
  }, [search, teachers]);

  return (
    <>
      <style>{css}</style>
      <SidebarLayout activePage="statistiques" pageTitle="Statistiques">
        <div className="st-root">
          {error && <div className="st-error">{error}</div>}

          <div className="st-hero">
            <div className="st-panel">
              <div className="st-title">Statistiques de presence</div>
              <div className="st-sub">
                Vue admin pour suivre le taux de presence global, reperer les etudiants a risque, comparer les cours et mesurer l'activite par enseignant.
              </div>
            </div>
            <div className="st-panel st-rate">
              <div>
                <div className="st-rate-label">Taux global</div>
                <div className="st-rate-num">{stats.attendanceRate}%</div>
                <div className="st-meta">{stats.totalPresences} presences / {stats.totalEligible} attendues</div>
              </div>
              <div className="st-ring" style={{ "--rate": `${stats.attendanceRate}%` } as CSSProperties} />
            </div>
          </div>

          <div className="st-grid">
            <div className="st-metric"><div className="st-label">Etudiants</div><div className="st-value">{stats.totalStudents}</div><div className="st-meta">inscrits dans les filieres</div></div>
            <div className="st-metric"><div className="st-label">Enseignants</div><div className="st-value">{stats.totalTeachers}</div><div className="st-meta">{stats.totalCourses} cours actifs</div></div>
            <div className="st-metric"><div className="st-label">Seances</div><div className="st-value">{stats.totalSeances}</div><div className="st-meta">{stats.activeSeances} actives maintenant</div></div>
            <div className="st-metric"><div className="st-label">Moyenne / seance</div><div className="st-value">{stats.avgPresences}</div><div className="st-meta">presences validees</div></div>
          </div>

          <div className="st-main">
            <div className="st-panel">
              <div className="st-toolbar">
                <div className="st-tabs">
                  <button className={`st-tab ${tab === "students" ? "active" : ""}`} onClick={() => setTab("students")}>Par etudiant</button>
                  <button className={`st-tab ${tab === "courses" ? "active" : ""}`} onClick={() => setTab("courses")}>Par cours</button>
                  <button className={`st-tab ${tab === "teachers" ? "active" : ""}`} onClick={() => setTab("teachers")}>Par enseignant</button>
                </div>
                <input className="st-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher..." />
              </div>

              {loading ? (
                <div className="st-empty">Chargement des statistiques...</div>
              ) : tab === "students" ? (
                <div className="st-table-wrap">
                  <table className="st-table">
                    <thead><tr><th>Etudiant</th><th>Classe</th><th>Presences</th><th>Absences</th><th>Taux</th></tr></thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id}>
                          <td><div className="st-name">{student.name}</div><div className="st-small">{student.codeMassar} | {student.email}</div></td>
                          <td>{student.filiere} {student.niveau} {student.semestre}</td>
                          <td>{student.presences} / {student.eligibleSessions}</td>
                          <td>{student.absences}</td>
                          <td><Progress value={student.attendanceRate} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : tab === "courses" ? (
                <div className="st-table-wrap">
                  <table className="st-table">
                    <thead><tr><th>Cours</th><th>Enseignant</th><th>Seances</th><th>Presences</th><th>Taux</th></tr></thead>
                    <tbody>
                      {filteredCourses.map((course) => (
                        <tr key={course.id}>
                          <td><div className="st-name">{course.module}</div><div className="st-small">{course.filiere} {course.niveau} {course.semestre}</div></td>
                          <td>{course.enseignant}</td>
                          <td>{course.sessions}</td>
                          <td>{course.presences} / {course.eligible}</td>
                          <td><Progress value={course.attendanceRate} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="st-table-wrap">
                  <table className="st-table">
                    <thead><tr><th>Enseignant</th><th>Cours</th><th>Seances</th><th>Presences</th><th>Taux</th></tr></thead>
                    <tbody>
                      {filteredTeachers.map((teacher) => (
                        <tr key={teacher.id}>
                          <td><div className="st-name">{teacher.name}</div><div className="st-small">{teacher.email}</div></td>
                          <td>{teacher.courses}</td>
                          <td>{teacher.sessions}<div className="st-small">{teacher.temporarySessions} temporaires</div></td>
                          <td>{teacher.presences} / {teacher.eligible}</td>
                          <td><Progress value={teacher.attendanceRate} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="st-panel">
              <div className="st-label">Seances recentes</div>
              <div className="st-recent-list">
                {seances.length === 0 ? (
                  <div className="st-empty">Aucune seance recente.</div>
                ) : seances.map((seance) => (
                  <div className={`st-session ${seance.isTemporary ? "temp" : ""}`} key={seance.id}>
                    <div className="st-session-head">
                      <div className="st-name">{seance.module}</div>
                      <span className={`st-badge ${seance.status === "active" ? "active" : seance.isTemporary ? "temp" : ""}`}>
                        {seance.isTemporary ? "Temp" : seance.status === "active" ? "Active" : "Expiree"}
                      </span>
                    </div>
                    <div className="st-small">{seance.filiere} | {seance.cours}</div>
                    <div className="st-small">
                      {formatDate(seance.date)} | expire a {formatTime(seance.expiresAt)}
                    </div>
                    <div className="st-small">
                      {seance.professor ? `${seance.professor.prenom} ${seance.professor.nom}` : seance.enseignant || "Professeur non precise"} | {seance.presences} presences
                    </div>
                    <button className="st-link" onClick={() => navigate(`/qr/${seance.id}`)}>Voir resultats</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SidebarLayout>
    </>
  );
}
