import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "../components/Sidebar";
import { API_BASE } from "../config";

type Tab = "students" | "courses" | "teachers" | "export";
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
  
  /* Export form styling */
  .ext-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 600px;
    margin: 20px auto;
  }
  .ext-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .ext-label {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    color: var(--gray-400);
  }
  .ext-scopes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .ext-scope-btn {
    border: 1px solid var(--gray-200);
    background: var(--white);
    border-radius: 10px;
    padding: 12px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
    color: var(--gray-600);
    transition: all 0.2s ease;
  }
  .ext-scope-btn.active {
    border-color: var(--blue);
    background: var(--blue-soft);
    color: var(--blue);
  }
  .ext-select, .ext-input {
    border: 1.5px solid var(--gray-200);
    border-radius: 10px;
    padding: 11px 14px;
    font-family: inherit;
    font-size: 14px;
    color: var(--gray-800);
    outline: none;
    background: var(--white);
    transition: border-color 0.2s;
    width: 100%;
  }
  .ext-select:focus, .ext-input:focus {
    border-color: var(--blue);
  }
  .ext-btn {
    background: var(--blue);
    color: var(--white);
    border: none;
    border-radius: 10px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 800;
    padding: 12px 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background-color 0.2s;
    margin-top: 10px;
  }
  .ext-btn:hover {
    background: var(--blue-dark);
  }
  .ext-btn:disabled {
    background: var(--gray-200);
    color: var(--gray-400);
    cursor: not-allowed;
  }
  .ext-search-results {
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    max-height: 200px;
    overflow-y: auto;
    background: var(--white);
    margin-top: 4px;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .ext-search-item {
    padding: 10px 14px;
    cursor: pointer;
    font-size: 13px;
    color: var(--gray-800);
    border-bottom: 1px solid var(--gray-100);
  }
  .ext-search-item:last-child {
    border-bottom: none;
  }
  .ext-search-item:hover {
    background: var(--gray-50);
  }
  .ext-search-item.selected {
    background: var(--blue-soft);
    color: var(--blue);
    font-weight: 700;
  }
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
  const [academicData, setAcademicData] = useState<{
    filieres: { id: number; nom: string; semesters: string[] }[];
    enseignants: { id: number; nom: string; prenom: string; email: string; name: string }[];
    semesters: string[];
  } | null>(null);

  const [exportScope, setExportScope] = useState<"student" | "class" | "teacher">("student");
  const [exportType, setExportType] = useState<"all" | "present" | "absent">("all");
  const [exportSemester, setExportSemester] = useState("Tous");
  
  const [selectedStudent, setSelectedStudent] = useState<StudentStat | null>(null);
  const [studentFiliereFilter, setStudentFiliereFilter] = useState("");
  
  const [selectedFiliereId, setSelectedFiliereId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  
  const [exporting, setExporting] = useState(false);

  const availableSemesters = useMemo(() => {
    if (!academicData) return [];
    
    let targetFiliere = null;
    if (exportScope === "student" && studentFiliereFilter) {
      targetFiliere = academicData.filieres.find((f) => f.nom === studentFiliereFilter);
    } else if (exportScope === "class" && selectedFiliereId) {
      targetFiliere = academicData.filieres.find((f) => String(f.id) === selectedFiliereId);
    }
    
    if (targetFiliere) {
      return targetFiliere.semesters;
    }
    
    return academicData.semesters;
  }, [academicData, exportScope, studentFiliereFilter, selectedFiliereId]);

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

        // Fetch academic info for exports
        const acadRes = await fetch(`${API_BASE}/seances/academic/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
        });
        if (acadRes.ok) {
          const acadPayload = await acadRes.json();
          setAcademicData(acadPayload);
        }
      } catch {
        setError("Erreur de connexion avec le serveur.");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);



  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.append("scope", exportScope);
      params.append("type", exportType);
      if (exportSemester && exportSemester !== "Tous") {
        params.append("semestre", exportSemester);
      }
      if (exportScope === "student" && selectedStudent) {
        params.append("student_id", String(selectedStudent.id));
      } else if (exportScope === "class" && selectedFiliereId) {
        params.append("filiere_id", selectedFiliereId);
      } else if (exportScope === "teacher" && selectedTeacherId) {
        params.append("enseignant_id", selectedTeacherId);
      }

      const res = await fetch(`${API_BASE}/dashboard/export/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Erreur lors de l'exportation.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const disp = res.headers.get("content-disposition");
      let filename = `export_${exportScope}_${exportType}.xlsx`;
      if (disp && disp.includes("filename=")) {
        const match = disp.match(/filename="(.+?)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'exportation.");
    } finally {
      setExporting(false);
    }
  };

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
              <div className="st-title">Statistiques de présence</div>
              <div className="st-sub">
                Vue admin pour suivre le taux de présence global, repérer les étudiants à risque, comparer les cours et mesurer l'activité par enseignant.
              </div>
            </div>
            <div className="st-panel st-rate">
              <div>
                <div className="st-rate-label">Taux global</div>
                <div className="st-rate-num">{stats.attendanceRate}%</div>
                <div className="st-meta">{stats.totalPresences} présences / {stats.totalEligible} attendues</div>
              </div>
              <div className="st-ring" style={{ "--rate": `${stats.attendanceRate}%` } as CSSProperties} />
            </div>
          </div>

          <div className="st-grid">
            <div className="st-metric"><div className="st-label">Étudiants</div><div className="st-value">{stats.totalStudents}</div><div className="st-meta">inscrits dans les filières</div></div>
            <div className="st-metric"><div className="st-label">Enseignants</div><div className="st-value">{stats.totalTeachers}</div><div className="st-meta">{stats.totalCourses} cours actifs</div></div>
            <div className="st-metric"><div className="st-label">Séances</div><div className="st-value">{stats.totalSeances}</div><div className="st-meta">{stats.activeSeances} actives maintenant</div></div>
            <div className="st-metric"><div className="st-label">Moyenne / séance</div><div className="st-value">{stats.avgPresences}</div><div className="st-meta">présences validées</div></div>
          </div>

          <div className="st-main">
            <div className="st-panel">
              <div className="st-toolbar">
                <div className="st-tabs">
                  <button className={`st-tab ${tab === "students" ? "active" : ""}`} onClick={() => setTab("students")}>Par étudiant</button>
                  <button className={`st-tab ${tab === "courses" ? "active" : ""}`} onClick={() => setTab("courses")}>Par cours</button>
                  <button className={`st-tab ${tab === "teachers" ? "active" : ""}`} onClick={() => setTab("teachers")}>Par enseignant</button>
                  <button className={`st-tab ${tab === "export" ? "active" : ""}`} onClick={() => setTab("export")}>Exportation</button>
                </div>
                {tab !== "export" && (
                  <input className="st-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher..." />
                )}
              </div>

              {loading ? (
                <div className="st-empty">Chargement des statistiques...</div>
              ) : tab === "students" ? (
                <div className="st-table-wrap">
                  <table className="st-table">
                    <thead><tr><th>Étudiant</th><th>Classe</th><th>Présences</th><th>Absences</th><th>Taux</th><th>Action</th></tr></thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id}>
                          <td><div className="st-name">{student.name}</div><div className="st-small">{student.codeMassar} | {student.email}</div></td>
                          <td>{student.filiere} {student.niveau} {student.semestre}</td>
                          <td>{student.presences} / {student.eligibleSessions}</td>
                          <td>{student.absences}</td>
                          <td><Progress value={student.attendanceRate} /></td>
                          <td>
                            <button
                              className="st-link"
                              style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
                              onClick={() => {
                                setTab("export");
                                setExportScope("student");
                                setSelectedStudent(student);
                                setStudentFiliereFilter(student.filiere);
                                const targetFiliere = academicData?.filieres.find((f) => f.nom === student.filiere);
                                if (targetFiliere && exportSemester !== "Tous" && !targetFiliere.semesters.includes(exportSemester)) {
                                  setExportSemester("Tous");
                                }
                              }}
                            >
                              Exporter
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : tab === "courses" ? (
                <div className="st-table-wrap">
                  <table className="st-table">
                    <thead><tr><th>Cours</th><th>Enseignant</th><th>Séances</th><th>Présences</th><th>Taux</th><th>Action</th></tr></thead>
                    <tbody>
                      {filteredCourses.map((course) => (
                        <tr key={course.id}>
                          <td><div className="st-name">{course.module}</div><div className="st-small">{course.filiere} {course.niveau} {course.semestre}</div></td>
                          <td>{course.enseignant}</td>
                          <td>{course.sessions}</td>
                          <td>{course.presences} / {course.eligible}</td>
                          <td><Progress value={course.attendanceRate} /></td>
                          <td>
                            <button
                              className="st-link"
                              style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
                              onClick={() => {
                                setTab("export");
                                setExportScope("class");
                                const fil = academicData?.filieres.find(f => f.nom === course.filiere);
                                if (fil) {
                                  setSelectedFiliereId(String(fil.id));
                                  if (course.semestre !== "Tous" && !fil.semesters.includes(course.semestre)) {
                                    setExportSemester("Tous");
                                  } else {
                                    setExportSemester(course.semestre);
                                  }
                                } else {
                                  setExportSemester("Tous");
                                }
                              }}
                            >
                              Exporter
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : tab === "teachers" ? (
                <div className="st-table-wrap">
                  <table className="st-table">
                    <thead><tr><th>Enseignant</th><th>Cours</th><th>Séances</th><th>Présences</th><th>Taux</th><th>Action</th></tr></thead>
                    <tbody>
                      {filteredTeachers.map((teacher) => (
                        <tr key={teacher.id}>
                          <td><div className="st-name">{teacher.name}</div><div className="st-small">{teacher.email}</div></td>
                          <td>{teacher.courses}</td>
                          <td>{teacher.sessions}<div className="st-small">{teacher.temporarySessions} temporaires</div></td>
                          <td>{teacher.presences} / {teacher.eligible}</td>
                          <td><Progress value={teacher.attendanceRate} /></td>
                          <td>
                            <button
                              className="st-link"
                              style={{ background: "var(--blue-soft)", color: "var(--blue)" }}
                              onClick={() => {
                                setTab("export");
                                setExportScope("teacher");
                                setSelectedTeacherId(String(teacher.id));
                                setExportSemester("Tous");
                              }}
                            >
                              Exporter
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ext-form">
                  <div className="ext-section">
                    <span className="ext-label">Type d'extraction</span>
                    <div className="ext-scopes">
                      <button
                        className={`ext-scope-btn ${exportScope === "student" ? "active" : ""}`}
                        onClick={() => {
                          setExportScope("student");
                          setSelectedStudent(null);
                          setStudentFiliereFilter("");
                          setExportSemester("Tous");
                        }}
                      >
                        👤 Étudiant
                      </button>
                      <button
                        className={`ext-scope-btn ${exportScope === "class" ? "active" : ""}`}
                        onClick={() => {
                          setExportScope("class");
                          setSelectedFiliereId("");
                          setExportSemester("Tous");
                        }}
                      >
                        🏫 Classe / Filière
                      </button>
                      <button
                        className={`ext-scope-btn ${exportScope === "teacher" ? "active" : ""}`}
                        onClick={() => {
                          setExportScope("teacher");
                          setSelectedTeacherId("");
                          setExportSemester("Tous");
                        }}
                      >
                        🧑‍🏫 Enseignant
                      </button>
                    </div>
                  </div>

                  {exportScope === "student" && (
                    <>
                      <div className="ext-section">
                        <span className="ext-label">Filière de l'étudiant</span>
                        <select
                          className="ext-select"
                          value={studentFiliereFilter}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStudentFiliereFilter(val);
                            setSelectedStudent(null);
                            const targetFiliere = academicData?.filieres.find((f) => f.nom === val);
                            if (targetFiliere && exportSemester !== "Tous" && !targetFiliere.semesters.includes(exportSemester)) {
                              setExportSemester("Tous");
                            }
                          }}
                        >
                          <option value="">-- Choisir une filière --</option>
                          {academicData?.filieres.map((f) => (
                            <option key={f.id} value={f.nom}>
                              {f.nom}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="ext-section">
                        <span className="ext-label">Sélectionner l'étudiant</span>
                        <select
                          className="ext-select"
                          value={selectedStudent?.id || ""}
                          onChange={(e) => {
                            const id = Number(e.target.value);
                            const s = students.find((std) => std.id === id) || null;
                            setSelectedStudent(s);
                          }}
                          disabled={!studentFiliereFilter}
                        >
                          <option value="">
                            {studentFiliereFilter 
                              ? "-- Choisir un étudiant --" 
                              : "-- Veuillez choisir une filière d'abord --"}
                          </option>
                          {students
                            .filter((s) => !studentFiliereFilter || s.filiere === studentFiliereFilter)
                            .slice()
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.codeMassar})
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}

                  {exportScope === "class" && (
                    <div className="ext-section">
                      <span className="ext-label">Sélectionner la classe / filière</span>
                      <select
                        className="ext-select"
                        value={selectedFiliereId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedFiliereId(val);
                          const targetFiliere = academicData?.filieres.find((f) => String(f.id) === val);
                          if (targetFiliere && exportSemester !== "Tous" && !targetFiliere.semesters.includes(exportSemester)) {
                            setExportSemester("Tous");
                          }
                        }}
                      >
                        <option value="">-- Choisir une filière --</option>
                        {academicData?.filieres.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {exportScope === "teacher" && (
                    <div className="ext-section">
                      <span className="ext-label">Sélectionner l'enseignant</span>
                      <select
                        className="ext-select"
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                      >
                        <option value="">-- Choisir un enseignant --</option>
                        {academicData?.enseignants.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name || `${t.prenom} ${t.nom}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="ext-section">
                    <span className="ext-label">Semestre</span>
                    <select
                      className="ext-select"
                      value={exportSemester}
                      onChange={(e) => setExportSemester(e.target.value)}
                    >
                      <option value="Tous">Tous les semestres</option>
                      {availableSemesters.map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ext-section">
                    <span className="ext-label">Type de données</span>
                    <select
                      className="ext-select"
                      value={exportType}
                      onChange={(e) => setExportType(e.target.value as "all" | "present" | "absent")}
                    >
                      <option value="all">Présences & Absences</option>
                      <option value="present">Présences uniquement</option>
                      <option value="absent">Absences uniquement</option>
                    </select>
                  </div>

                  <button
                    className="ext-btn"
                    onClick={handleExport}
                    disabled={
                      exporting ||
                      (exportScope === "student" && !selectedStudent) ||
                      (exportScope === "class" && !selectedFiliereId) ||
                      (exportScope === "teacher" && !selectedTeacherId)
                    }
                  >
                    {exporting ? (
                      <>Génération de l'export...</>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                        </svg>
                        Exporter vers Excel (XLSX)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="st-panel">
              <div className="st-label">Séances récentes</div>
              <div className="st-recent-list">
                {seances.length === 0 ? (
                  <div className="st-empty">Aucune séance récente.</div>
                ) : seances.map((seance) => (
                  <div className={`st-session ${seance.isTemporary ? "temp" : ""}`} key={seance.id}>
                    <div className="st-session-head">
                      <div className="st-name">{seance.module}</div>
                      <span className={`st-badge ${seance.status === "active" ? "active" : seance.isTemporary ? "temp" : ""}`}>
                        {seance.isTemporary ? "Temp" : seance.status === "active" ? "Active" : "Expirée"}
                      </span>
                    </div>
                    <div className="st-small">{seance.filiere} | {seance.cours}</div>
                    <div className="st-small">
                      {formatDate(seance.date)} | expiré à {formatTime(seance.expiresAt)}
                    </div>
                    <div className="st-small">
                      {seance.professor ? `${seance.professor.prenom} ${seance.professor.nom}` : seance.enseignant || "Professeur non précisé"} | {seance.presences} présences
                    </div>
                    <button className="st-link" onClick={() => navigate(`/qr/${seance.id}`)}>Voir résultats</button>
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
