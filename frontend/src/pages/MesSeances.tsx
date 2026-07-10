import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarLayout from "../components/Sidebar";
import { API_BASE } from "../config";

type WeekDay = 1 | 2 | 3 | 4 | 5 | 6;

interface TeachingSession {
  id: string;
  day: WeekDay;
  start: string;
  end: string;
  module: string;
  filiere: string;
  filiereId?: number;
  semestre?: string;
  room: string;
  temporary?: boolean;
  heure_debut_iso?: string;
  heure_fin_iso?: string;
}

interface FiliereOption {
  id: number;
  nom: string;
}

interface ModuleOption {
  id: number;
  nom: string;
  filiereId: number;
  niveau: string;
  semestre: string;
}

interface SeancesResponse {
  seances: TeachingSession[];
  owner?: {
    nom: string;
    prenom: string;
    email: string;
  } | null;
  message?: string;
}

const css = `
  .sc-root {
    --blue: #037da7;
    --blue-dark: #025f80;
    --blue-soft: rgba(3,125,167,0.1);
    --orange: #f6931f;
    --orange-soft: rgba(246,147,31,0.12);
    --green: #16a34a;
    --green-soft: rgba(22,163,74,0.1);
    --white: #ffffff;
    --gray-50: #f7f9fc;
    --gray-100: #eef1f6;
    --gray-200: #dde3ee;
    --gray-400: #94a3b8;
    --gray-600: #4a5568;
    --gray-800: #1a2236;
    font-family: 'DM Sans', sans-serif;
  }

  .sc-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
  }

  .sc-title {
    font-family: 'Outfit', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: var(--gray-800);
  }

  .sc-subtitle {
    margin-top: 4px;
    font-size: 13px;
    color: var(--gray-400);
  }

  .sc-now {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    padding: 10px 14px;
    color: var(--gray-600);
    font-size: 13px;
    white-space: nowrap;
  }

  .sc-board {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    overflow: auto;
  }

  .sc-grid {
    min-width: 780px;
    display: grid;
    grid-template-columns: 56px repeat(6, minmax(100px, 1fr));
  }

  .sc-corner,
  .sc-day-head {
    position: sticky;
    top: 0;
    z-index: 2;
    background: var(--gray-50);
    border-bottom: 1px solid var(--gray-200);
  }

  .sc-corner {
    left: 0;
    z-index: 3;
    border-right: 1px solid var(--gray-200);
  }

  .sc-day-head {
    min-height: 44px;
    padding: 8px;
    border-right: 1px solid var(--gray-200);
  }

  .sc-day-name {
    font-size: 11px;
    font-weight: 800;
    color: var(--gray-800);
    text-transform: uppercase;
  }

  .sc-day-date {
    margin-top: 2px;
    font-size: 10px;
    color: var(--gray-400);
  }

  .sc-time-col {
    position: relative;
    height: 520px;
    border-right: 1px solid var(--gray-200);
    background: var(--gray-50);
  }

  .sc-time-label {
    position: absolute;
    right: 6px;
    transform: translateY(-50%);
    font-size: 10px;
    color: var(--gray-400);
  }

  .sc-day-col {
    position: relative;
    height: 520px;
    border-right: 1px solid var(--gray-200);
    background:
      linear-gradient(to bottom, transparent 0, transparent 42px, var(--gray-100) 43px),
      var(--white);
    background-size: 100% 43px;
  }

  .sc-lunch {
    position: absolute;
    left: 0;
    right: 0;
    background: repeating-linear-gradient(
      -45deg,
      rgba(246,147,31,0.08),
      rgba(246,147,31,0.08) 8px,
      rgba(246,147,31,0.14) 8px,
      rgba(246,147,31,0.14) 16px
    );
    border-top: 1px solid rgba(246,147,31,0.2);
    border-bottom: 1px solid rgba(246,147,31,0.2);
  }

  .sc-session {
    position: absolute;
    left: 4px;
    right: 4px;
    border: 1px solid var(--gray-200);
    border-left: 3px solid var(--gray-400);
    border-radius: 7px;
    padding: 5px 6px;
    background: var(--gray-50);
    color: var(--gray-600);
    text-align: left;
    font-family: inherit;
    cursor: pointer;
    overflow: hidden;
  }

  .sc-session.is-active {
    background: var(--green-soft);
    border-color: rgba(22,163,74,0.35);
    border-left-color: var(--green);
    color: var(--gray-800);
    cursor: pointer;
    box-shadow: 0 8px 22px rgba(22,163,74,0.12);
  }

  .sc-session:not(.is-active):hover {
    background: var(--blue-soft);
    border-left-color: var(--blue);
    color: var(--gray-800);
  }

  .sc-session.is-selected {
    outline: 3px solid rgba(3,125,167,0.18);
    border-left-color: var(--blue);
  }

  .sc-session-title {
    font-size: 11px;
    font-weight: 800;
    color: var(--gray-800);
    line-height: 1.15;
  }

  .sc-session-meta,
  .sc-session-time {
    margin-top: 2px;
    font-size: 9px;
    line-height: 1.2;
  }

  .sc-session-time {
    font-weight: 700;
    color: var(--blue);
  }

  .sc-status {
    display: inline-flex;
    align-items: center;
    margin-top: 4px;
    padding: 2px 6px;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 800;
    background: var(--gray-100);
    color: var(--gray-400);
  }

  .sc-session.is-active .sc-status {
    background: var(--green);
    color: var(--white);
  }

  .sc-detail {
    margin-top: 18px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: center;
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    padding: 18px;
  }

  .sc-detail h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 18px;
    color: var(--gray-800);
    margin: 0 0 8px;
  }

  .sc-detail p {
    margin: 0;
    color: var(--gray-600);
    font-size: 13px;
  }

  .sc-action {
    border: none;
    border-radius: 10px;
    background: var(--blue);
    color: var(--white);
    padding: 11px 16px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }

  .sc-action:hover {
    background: var(--blue-dark);
  }

  .sc-action:disabled {
    background: var(--gray-200);
    color: var(--gray-400);
    cursor: not-allowed;
  }

  .sc-temp-panel {
    margin-top: 18px;
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    padding: 18px;
  }

  .sc-temp-title {
    font-family: 'Outfit', sans-serif;
    font-size: 17px;
    font-weight: 800;
    color: var(--gray-800);
    margin-bottom: 4px;
  }

  .sc-temp-subtitle {
    font-size: 13px;
    color: var(--gray-400);
    margin-bottom: 14px;
  }

  .sc-temp-form {
    display: grid;
    grid-template-columns: repeat(3, minmax(140px, 1fr));
    gap: 12px;
    align-items: end;
  }

  .sc-temp-actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
  }

  .sc-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .sc-field label {
    font-size: 11px;
    font-weight: 800;
    color: var(--gray-600);
    text-transform: uppercase;
  }

  .sc-field input,
  .sc-field select {
    width: 100%;
    border: 1.5px solid var(--gray-200);
    border-radius: 9px;
    padding: 9px 10px;
    font-family: inherit;
    font-size: 13px;
    color: var(--gray-800);
    background: var(--white);
    outline: none;
  }

  .sc-field input:focus,
  .sc-field select:focus {
    border-color: var(--blue);
  }

  .sc-session.is-temp {
    background: var(--orange-soft);
    border-color: rgba(246,147,31,0.35);
    border-left-color: var(--orange);
    color: var(--gray-800);
  }

  @media (max-width: 720px) {
    .sc-header,
    .sc-detail {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .sc-header {
      display: grid;
    }

    .sc-temp-form {
      grid-template-columns: 1fr;
    }
  }
`;

const WEEK_DAYS: Array<{ value: WeekDay; label: string }> = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
];

const START_MINUTES = toMinutes("08:30");
const END_MINUTES = toMinutes("18:30");
const SCHEDULE_HEIGHT = 520;
const PIXELS_PER_MINUTE = SCHEDULE_HEIGHT / (END_MINUTES - START_MINUTES);

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getWeekStart(date: Date) {
  const current = new Date(date);
  const day = current.getDay() || 7;
  current.setDate(current.getDate() - day + 1);
  current.setHours(0, 0, 0, 0);
  return current;
}

function getDateForDay(weekStart: Date, day: WeekDay) {
  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + day - 1);
  return date;
}

function isSessionActive(session: TeachingSession, now: Date) {
  const today = (now.getDay() || 7) as WeekDay;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    session.day === today &&
    currentMinutes >= toMinutes(session.start) &&
    currentMinutes <= toMinutes(session.end)
  );
}

function isSessionSelectable(session: TeachingSession, now: Date) {
  if (session.temporary) {
    return isSessionActive(session, now);
  }

  return isSessionActive(session, now);
}

function sessionStyle(session: TeachingSession) {
  const start = toMinutes(session.start);
  const end = toMinutes(session.end);

  return {
    top: `${(start - START_MINUTES) * PIXELS_PER_MINUTE}px`,
    height: `${Math.max((end - start) * PIXELS_PER_MINUTE - 6, 36)}px`,
  };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function formatNow(date: Date) {
  return date.toLocaleString("fr-FR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function processSingleSession(session: any): TeachingSession {
  if (session.temporary && session.heure_debut_iso && session.heure_fin_iso) {
    const dStart = new Date(session.heure_debut_iso);
    const dEnd = new Date(session.heure_fin_iso);
    
    const pad = (n: number) => String(n).padStart(2, "0");
    const startStr = `${pad(dStart.getHours())}:${pad(dStart.getMinutes())}`;
    const endStr = `${pad(dEnd.getHours())}:${pad(dEnd.getMinutes())}`;
    const dayVal = (dStart.getDay() || 7) as WeekDay;

    return {
      ...session,
      day: dayVal,
      start: startStr,
      end: endStr,
    };
  }
  return session;
}

function processSessions(rawSessions: any[]): TeachingSession[] {
  return rawSessions.map(processSingleSession);
}

export default function MesSeancesPage() {
  return <ProfessorMesSeancesPage />;
}

function ProfessorMesSeancesPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [creatingTemp, setCreatingTemp] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  
  // Timetable Filters
  const [filterFiliereId, setFilterFiliereId] = useState("");
  const [filterSemester, setFilterSemester] = useState("");
  const [semestersByFiliere, setSemestersByFiliere] = useState<Record<string, string[]>>({});

  const [filieres, setFilieres] = useState<FiliereOption[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [tempModuleId, setTempModuleId] = useState("");
  const [tempFiliereId, setTempFiliereId] = useState("");
  const [tempRoom, setTempRoom] = useState("");
  const [tempDuration, setTempDuration] = useState("120");
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [tempMaxDistance, setTempMaxDistance] = useState<string>("20");
  const weekStart = useMemo(() => getWeekStart(now), [now]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (filterFiliereId && String(session.filiereId) !== filterFiliereId) {
        return false;
      }
      if (filterSemester && session.semestre !== filterSemester) {
        return false;
      }
      return true;
    });
  }, [sessions, filterFiliereId, filterSemester]);

  const selectedSession = filteredSessions.find((session) => session.id === selectedId);

  const availableSemestersForFilter = useMemo(() => {
    if (filterFiliereId) {
      return semestersByFiliere[filterFiliereId] || [];
    }
    const allSems = new Set<string>();
    Object.values(semestersByFiliere).forEach((sems) => {
      sems.forEach((s) => allSems.add(s));
    });
    return Array.from(allSems).sort();
  }, [semestersByFiliere, filterFiliereId]);

  useEffect(() => {
    if (selectedId && !filteredSessions.some((s) => s.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredSessions, selectedId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      const token = localStorage.getItem("access");

      try {
        const res = await fetch(`${API_BASE}/seances/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = (await res.json()) as SeancesResponse;

        if (!res.ok) {
          setError(data.message || "Impossible de charger les seances.");
          return;
        }

        setSessions(processSessions(data.seances));
        setOwnerName(data.owner ? `${data.owner.prenom} ${data.owner.nom}` : "");
      } catch {
        setError("Erreur de connexion au serveur.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    const fetchFilters = async () => {
      const token = localStorage.getItem("access");

      try {
        const res = await fetch(`${API_BASE}/seances/filters/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) {
          setFilieres(data.filieres || []);
          setModules(data.modules || []);
          setSemestersByFiliere(data.semestersByFiliere || {});
        }
      } catch {
        // Filters are optional; the form will stay disabled until they load.
      }
    };

    fetchFilters();
  }, []);

  useEffect(() => {
    if (selectedSession && !isSessionSelectable(selectedSession, now)) {
      setSelectedId(null);
    }
  }, [now, selectedSession]);

  useEffect(() => {
    setSessions((current) => current.filter((session) => !session.temporary || isSessionActive(session, now)));
  }, [now]);

  const availableModules = useMemo(() => {
    if (!tempFiliereId) {
      return [];
    }

    return modules.filter((module) => String(module.filiereId) === tempFiliereId);
  }, [modules, tempFiliereId]);

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("La géolocalisation n'est pas supportée par votre navigateur."));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      }
    });
  };

  const handleCreateTemporarySession = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!tempFiliereId || !tempModuleId) {
      setError("Filiere et module sont obligatoires.");
      return;
    }

    setCreatingTemp(true);
    setError("");

    try {
      let lat: number | null = null;
      let lng: number | null = null;

      try {
        const position = await getCurrentLocation();
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (err: any) {
        setError("L'autorisation de géolocalisation est requise pour créer une séance temporaire.");
        setCreatingTemp(false);
        return;
      }

      const res = await fetch(`${API_BASE}/seances/temporary/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          module_id: Number(tempModuleId),
          filiere_id: Number(tempFiliereId),
          salle: tempRoom.trim(),
          validite_min: Number(tempDuration),
          max_distance: Number(tempMaxDistance),
          latitude: lat,
          longitude: lng,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Impossible de créer la séance temporaire.");
        return;
      }

      const created = processSingleSession(data.seance as TeachingSession);
      setSessions((current) => [...current, created]);
      setSelectedId(created.id);
      setTempModuleId("");
      setTempFiliereId("");
      setTempRoom("");
      setTempDuration("120");
      setTempMaxDistance("20");
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setCreatingTemp(false);
    }
  };

  const handleGenerateQr = async () => {
    if (!selectedSession) {
      return;
    }

    setGenerating(true);
    setError("");

    try {
      let lat: number | null = null;
      let lng: number | null = null;

      try {
        const position = await getCurrentLocation();
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (err: any) {
        setError("L'autorisation de géolocalisation est requise pour démarrer la séance.");
        setGenerating(false);
        return;
      }

      const res = await fetch(`${API_BASE}/seances/generate-qr/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          cours_id: selectedSession.id,
          validite_min: 10,
          latitude: lat,
          longitude: lng,
          max_distance: maxDistance,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Impossible de generer le QR code.");
        return;
      }

      navigate(`/qr/${data.seance.id}`);
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <SidebarLayout activePage="seances" pageTitle="Mes seances">
        <div className="sc-root">
          <div className="sc-header">
            <div>
              <div className="sc-title">Emploi du temps hebdomadaire</div>
              <div className="sc-subtitle">
                {loading
                  ? "Chargement des séances..."
                  : error || `${ownerName ? `Séances de ${ownerName}. ` : ""}Sélectionnez un cours puis générez son QR code.`}
              </div>
            </div>
            <div className="sc-now">Maintenant: {formatNow(now)}</div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "18px", flexWrap: "wrap" }}>
            <div className="sc-field" style={{ minWidth: "200px" }}>
              <label>Filière</label>
              <select
                value={filterFiliereId}
                onChange={(e) => {
                  setFilterFiliereId(e.target.value);
                  setFilterSemester("");
                }}
              >
                <option value="">Toutes les filières</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
            </div>
            <div className="sc-field" style={{ minWidth: "150px" }}>
              <label>Semestre</label>
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
              >
                <option value="">Tous les semestres</option>
                {availableSemestersForFilter.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="sc-board">
            <div className="sc-grid">
              <div className="sc-corner" />
              {WEEK_DAYS.map((day) => (
                <div className="sc-day-head" key={day.value}>
                  <div className="sc-day-name">{day.label}</div>
                  <div className="sc-day-date">{formatDate(getDateForDay(weekStart, day.value))}</div>
                </div>
              ))}

              <div className="sc-time-col">
                {["08:30", "10:30", "12:30", "14:30", "16:30", "18:30"].map((time) => (
                  <div
                    className="sc-time-label"
                    key={time}
                    style={{ top: `${(toMinutes(time) - START_MINUTES) * PIXELS_PER_MINUTE}px` }}
                  >
                    {time}
                  </div>
                ))}
              </div>

              {WEEK_DAYS.map((day) => (
                <div className="sc-day-col" key={day.value}>
                  <div
                    className="sc-lunch"
                    style={{
                      top: `${(toMinutes("12:30") - START_MINUTES) * PIXELS_PER_MINUTE}px`,
                      height: `${(toMinutes("14:30") - toMinutes("12:30")) * PIXELS_PER_MINUTE}px`,
                    }}
                  />
                  {filteredSessions.filter((session) => session.day === day.value).map((session) => {
                    const active = isSessionSelectable(session, now);
                    const selected = selectedId === session.id;

                    return (
                      <button
                        className={`sc-session${active ? " is-active" : ""}${selected ? " is-selected" : ""}${session.temporary ? " is-temp" : ""}`}
                        key={session.id}
                        onClick={() => setSelectedId(session.id)}
                        style={sessionStyle(session)}
                      >
                        <div className="sc-session-title">{session.module}</div>
                        <div className="sc-session-time">{session.start} - {session.end}</div>
                        <div className="sc-session-meta">
                          {session.filiere} | {session.room ? (/^salle\b/i.test(session.room.trim()) ? session.room : `Salle ${session.room}`) : ""}
                        </div>
                        <span className="sc-status">
                          {active ? (session.temporary ? "Temporaire active" : "Disponible maintenant") : "Planifiée"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="sc-detail">
            <div>
              <h2>{selectedSession ? selectedSession.module : "Aucune séance sélectionnée"}</h2>
              <p>
                {selectedSession
                  ? `${selectedSession.filiere} | ${selectedSession.start} - ${selectedSession.end} | ${selectedSession.room ? (/^salle\b/i.test(selectedSession.room.trim()) ? selectedSession.room : `Salle ${selectedSession.room}`) : ""}${selectedSession.temporary ? " | Séance temporaire" : ""}`
                  : "Cliquez sur une séance pour la sélectionner."}
              </p>
              
              {selectedSession && isSessionSelectable(selectedSession, now) && (
                <div style={{ marginTop: "14px", display: "flex", gap: "16px", alignItems: "center" }}>
                  <div className="sc-field" style={{ margin: 0, minWidth: "220px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--gray-600)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                      Distance autorisée
                    </label>
                    <select
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(Number(e.target.value))}
                      style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--gray-200)", fontSize: "12px", width: "100%", height: "36px", background: "var(--white)" }}
                    >
                      <option value="20">20 mètres (Par défaut)</option>
                      <option value="50">50 mètres</option>
                      <option value="100">100 mètres</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <button
              className="sc-action"
              disabled={!selectedSession || !isSessionSelectable(selectedSession, now) || generating}
              onClick={handleGenerateQr}
            >
              {generating ? "Génération..." : "Générer le QR code"}
            </button>
          </div>

          <div className="sc-temp-panel">
            <div className="sc-temp-title">Séance temporaire</div>
            <div className="sc-temp-subtitle">
              Pour un cours non planifié, ajoutez une séance active maintenant puis générez son QR code.
            </div>

            <form className="sc-temp-form" onSubmit={handleCreateTemporarySession}>
              <div className="sc-field">
                <label>Filière</label>
                <select
                  value={tempFiliereId}
                  onChange={(event) => {
                    setTempFiliereId(event.target.value);
                    setTempModuleId("");
                  }}
                  required
                >
                  <option value="">Choisir une filière</option>
                  {filieres.map((filiere) => (
                    <option key={filiere.id} value={filiere.id}>
                      {filiere.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sc-field">
                <label>Module</label>
                <select
                  value={tempModuleId}
                  onChange={(event) => setTempModuleId(event.target.value)}
                  disabled={!tempFiliereId || availableModules.length === 0}
                  required
                >
                  <option value="">
                    {tempFiliereId
                      ? availableModules.length > 0
                        ? "Choisir un module"
                        : "Aucun module dans cette filière"
                      : "Choisir une filière d'abord"}
                  </option>
                  {availableModules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.nom} ({module.niveau} {module.semestre})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sc-field">
                <label>Salle</label>
                <input
                  type="text"
                  placeholder="Ex: Lab 1"
                  value={tempRoom}
                  onChange={(event) => setTempRoom(event.target.value)}
                />
              </div>

              <div className="sc-field">
                <label>Durée</label>
                <select value={tempDuration} onChange={(event) => setTempDuration(event.target.value)}>
                  <option value="60">1h</option>
                  <option value="120">2h</option>
                  <option value="240">4h</option>
                </select>
              </div>

              <div className="sc-field">
                <label>Distance autorisée</label>
                <select value={tempMaxDistance} onChange={(event) => setTempMaxDistance(event.target.value)}>
                  <option value="20">20 mètres (Par défaut)</option>
                  <option value="50">50 mètres</option>
                  <option value="100">100 mètres</option>
                </select>
              </div>

              <div className="sc-temp-actions">
                <button className="sc-action" type="submit" disabled={creatingTemp}>
                  {creatingTemp ? "Création..." : "Ajouter et sélectionner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </SidebarLayout>
    </>
  );
}
