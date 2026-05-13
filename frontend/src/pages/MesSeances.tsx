import { useEffect, useMemo, useState } from "react";
import SidebarLayout from "../components/Sidebar";

type WeekDay = 1 | 2 | 3 | 4 | 5 | 6;

interface TeachingSession {
  id: string;
  day: WeekDay;
  start: string;
  end: string;
  module: string;
  filiere: string;
  room: string;
  temporary?: boolean;
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
    min-width: 920px;
    display: grid;
    grid-template-columns: 76px repeat(6, minmax(130px, 1fr));
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
    min-height: 58px;
    padding: 12px;
    border-right: 1px solid var(--gray-200);
  }

  .sc-day-name {
    font-size: 12px;
    font-weight: 800;
    color: var(--gray-800);
    text-transform: uppercase;
  }

  .sc-day-date {
    margin-top: 3px;
    font-size: 12px;
    color: var(--gray-400);
  }

  .sc-time-col {
    position: relative;
    height: 720px;
    border-right: 1px solid var(--gray-200);
    background: var(--gray-50);
  }

  .sc-time-label {
    position: absolute;
    right: 10px;
    transform: translateY(-50%);
    font-size: 11px;
    color: var(--gray-400);
  }

  .sc-day-col {
    position: relative;
    height: 720px;
    border-right: 1px solid var(--gray-200);
    background:
      linear-gradient(to bottom, transparent 0, transparent 59px, var(--gray-100) 60px),
      var(--white);
    background-size: 100% 60px;
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
    left: 8px;
    right: 8px;
    border: 1px solid var(--gray-200);
    border-left: 4px solid var(--gray-400);
    border-radius: 10px;
    padding: 10px;
    background: var(--gray-50);
    color: var(--gray-600);
    text-align: left;
    font-family: inherit;
    cursor: not-allowed;
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

  .sc-session.is-selected {
    outline: 3px solid rgba(3,125,167,0.18);
    border-left-color: var(--blue);
  }

  .sc-session-title {
    font-size: 13px;
    font-weight: 800;
    color: var(--gray-800);
    line-height: 1.2;
  }

  .sc-session-meta,
  .sc-session-time {
    margin-top: 5px;
    font-size: 11px;
    line-height: 1.25;
  }

  .sc-session-time {
    font-weight: 700;
    color: var(--blue);
  }

  .sc-status {
    display: inline-flex;
    align-items: center;
    margin-top: 8px;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 10px;
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
    grid-template-columns: repeat(4, minmax(120px, 1fr)) auto;
    gap: 12px;
    align-items: end;
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

const SESSIONS: TeachingSession[] = [
  { id: "s1", day: 1, start: "08:30", end: "10:30", module: "Algorithmique", filiere: "GI S4", room: "B12" },
  { id: "s2", day: 1, start: "10:30", end: "12:30", module: "Structures de donnees", filiere: "GI S4", room: "B12" },
  { id: "s3", day: 2, start: "14:30", end: "18:30", module: "Base de donnees", filiere: "GL S6", room: "Lab 2" },
  { id: "s4", day: 3, start: "08:30", end: "12:30", module: "Reseaux", filiere: "SE S4", room: "C04" },
  { id: "s5", day: 4, start: "14:30", end: "16:30", module: "Genie logiciel", filiere: "GL S6", room: "A21" },
  { id: "s6", day: 5, start: "08:30", end: "10:30", module: "Intelligence artificielle", filiere: "DS S6", room: "Lab IA" },
  { id: "s7", day: 5, start: "14:30", end: "18:30", module: "Projet encadre", filiere: "GI S6", room: "Lab 1" },
];

const START_MINUTES = toMinutes("08:30");
const END_MINUTES = toMinutes("18:30");
const PIXELS_PER_MINUTE = 720 / (END_MINUTES - START_MINUTES);

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

function sessionStyle(session: TeachingSession) {
  const start = toMinutes(session.start);
  const end = toMinutes(session.end);

  return {
    top: `${(start - START_MINUTES) * PIXELS_PER_MINUTE}px`,
    height: `${(end - start) * PIXELS_PER_MINUTE - 10}px`,
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

function toTimeInput(date: Date) {
  return date.toTimeString().slice(0, 5);
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const total = toMinutes(time) + minutesToAdd;
  const hours = Math.floor(total / 60).toString().padStart(2, "0");
  const minutes = (total % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getCurrentWeekDay(date: Date): WeekDay {
  const day = date.getDay() || 7;
  return Math.min(day, 6) as WeekDay;
}

export default function MesSeancesPage() {
  const [sessions, setSessions] = useState<TeachingSession[]>(SESSIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [tempModule, setTempModule] = useState("");
  const [tempFiliere, setTempFiliere] = useState("");
  const [tempRoom, setTempRoom] = useState("");
  const [tempDuration, setTempDuration] = useState("120");
  const weekStart = useMemo(() => getWeekStart(now), [now]);
  const selectedSession = sessions.find((session) => session.id === selectedId);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedSession && !isSessionActive(selectedSession, now)) {
      setSelectedId(null);
    }
  }, [now, selectedSession]);

  const handleCreateTemporarySession = (event: React.FormEvent) => {
    event.preventDefault();

    if (!tempModule.trim() || !tempFiliere.trim()) {
      return;
    }

    const start = toTimeInput(now);
    const temporarySession: TeachingSession = {
      id: `temp-${Date.now()}`,
      day: getCurrentWeekDay(now),
      start,
      end: addMinutesToTime(start, Number(tempDuration)),
      module: tempModule.trim(),
      filiere: tempFiliere.trim(),
      room: tempRoom.trim() || "Non precisee",
      temporary: true,
    };

    setSessions((current) => [...current, temporarySession]);
    setSelectedId(temporarySession.id);
    setTempModule("");
    setTempFiliere("");
    setTempRoom("");
    setTempDuration("120");
  };

  const handleGenerateQr = () => {
    if (!selectedSession) {
      return;
    }

    alert(`Generer le QR code pour: ${selectedSession.module}`);
  };

  return (
    <>
      <style>{css}</style>
      <SidebarLayout activePage="seances" pageTitle="Mes seances">
        <div className="sc-root">
          <div className="sc-header">
            <div>
              <div className="sc-title">Emploi du temps hebdomadaire</div>
              <div className="sc-subtitle">Selection possible uniquement pendant le creneau de la seance.</div>
            </div>
            <div className="sc-now">Maintenant: {formatNow(now)}</div>
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
                  {sessions.filter((session) => session.day === day.value).map((session) => {
                    const active = isSessionActive(session, now);
                    const selected = selectedId === session.id;

                    return (
                      <button
                        className={`sc-session${active ? " is-active" : ""}${selected ? " is-selected" : ""}${session.temporary ? " is-temp" : ""}`}
                        disabled={!active}
                        key={session.id}
                        onClick={() => setSelectedId(session.id)}
                        style={sessionStyle(session)}
                      >
                        <div className="sc-session-title">{session.module}</div>
                        <div className="sc-session-time">{session.start} - {session.end}</div>
                        <div className="sc-session-meta">{session.filiere} | Salle {session.room}</div>
                        <span className="sc-status">
                          {active ? (session.temporary ? "Temporaire active" : "Disponible maintenant") : "Hors creneau"}
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
              <h2>{selectedSession ? selectedSession.module : "Aucune seance selectionnee"}</h2>
              <p>
                {selectedSession
                  ? `${selectedSession.filiere} | ${selectedSession.start} - ${selectedSession.end} | Salle ${selectedSession.room}${selectedSession.temporary ? " | Seance temporaire" : ""}`
                  : "Clique sur une seance active pour la selectionner."}
              </p>
            </div>
            <button className="sc-action" disabled={!selectedSession} onClick={handleGenerateQr}>
              Generer le QR code
            </button>
          </div>

          <div className="sc-temp-panel">
            <div className="sc-temp-title">Seance temporaire</div>
            <div className="sc-temp-subtitle">
              Pour un cours non planifie, ajoute une seance active maintenant puis genere son QR code.
            </div>

            <form className="sc-temp-form" onSubmit={handleCreateTemporarySession}>
              <div className="sc-field">
                <label>Module</label>
                <input
                  type="text"
                  placeholder="Ex: Programmation Web"
                  value={tempModule}
                  onChange={(event) => setTempModule(event.target.value)}
                />
              </div>

              <div className="sc-field">
                <label>Filiere</label>
                <input
                  type="text"
                  placeholder="Ex: GI S4"
                  value={tempFiliere}
                  onChange={(event) => setTempFiliere(event.target.value)}
                />
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
                <label>Duree</label>
                <select value={tempDuration} onChange={(event) => setTempDuration(event.target.value)}>
                  <option value="60">1h</option>
                  <option value="120">2h</option>
                  <option value="240">4h</option>
                </select>
              </div>

              <button className="sc-action" type="submit">
                Ajouter et selectionner
              </button>
            </form>
          </div>
        </div>
      </SidebarLayout>
    </>
  );
}
