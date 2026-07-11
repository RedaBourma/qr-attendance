import { useEffect, useMemo, useState } from "react";
import SidebarLayout from "../components/Sidebar";
import { API_BASE } from "../config";

type WeekDay = 1 | 2 | 3 | 4 | 5 | 6;

interface FiliereOption {
  id: number;
  nom: string;
  semesters: string[];
}

interface ModuleOption {
  id: number;
  nom: string;
  filiereId: number;
  filiere: string;
  semestre: string;
}

interface TeacherOption {
  id: number;
  name: string;
  email: string;
}

interface AcademicCourse {
  id: string;
  day: WeekDay;
  start: string;
  end: string;
  module: string;
  moduleId: number;
  filiere: string;
  filiereId: number;
  semestre: string;
  room: string;
  enseignant: string;
  enseignantId: number;
}

interface SalleOption {
  id: number;
  nom: string;
}

interface AcademicResponse {
  filieres: FiliereOption[];
  modules: ModuleOption[];
  enseignants: TeacherOption[];
  cours: AcademicCourse[];
  semesters: string[];
  salles: SalleOption[];
}

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

const DURATIONS = [
  { label: "1h00", value: 60 },
  { label: "1h30", value: 90 },
  { label: "2h00", value: 120 },
  { label: "3h00", value: 180 },
  { label: "4h00", value: 240 },
];

const css = `
  .am-root { --blue:#037da7; --blue-soft:rgba(3,125,167,.1); --orange:#f6931f; --orange-soft:rgba(246,147,31,.12); --green:#16a34a; --white:#fff; --gray-50:#f7f9fc; --gray-100:#eef1f6; --gray-200:#dde3ee; --gray-400:#94a3b8; --gray-600:#4a5568; --gray-800:#1a2236; color:var(--gray-800); font-family:'DM Sans',sans-serif; }
  .am-header { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:18px; }
  .am-title { font-family:'Outfit',sans-serif; font-size:24px; font-weight:800; }
  .am-sub { color:var(--gray-600); font-size:13px; line-height:1.45; margin-top:4px; max-width:780px; }
  .am-error,.am-success { border-radius:10px; font-size:13px; margin-bottom:14px; padding:12px 14px; }
  .am-error { background:#fff1f2; border:1px solid #fecdd3; color:#be123c; }
  .am-success { background:#ecfdf5; border:1px solid #bbf7d0; color:#15803d; }
  .am-panel { background:var(--white); border:1px solid var(--gray-200); border-radius:12px; padding:16px; }
  .am-panel-title { font-family:'Outfit',sans-serif; font-size:17px; font-weight:800; margin-bottom:12px; }
  .am-form { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; align-items:end; }
  .am-span-2 { grid-column: span 2; }
  .am-form-actions { grid-column: span 4; display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
  .am-field { display:flex; flex-direction:column; gap:5px; }
  .am-field.full { grid-column:1 / -1; }
  .am-field label { color:var(--gray-600); font-size:11px; font-weight:800; text-transform:uppercase; }
  .am-field input,.am-field select { background:var(--white); border:1.5px solid var(--gray-200); border-radius:9px; color:var(--gray-800); font-family:inherit; font-size:13px; outline:none; padding:9px 10px; width:100%; }
  .am-field input:focus,.am-field select:focus { border-color:var(--blue); }
  .am-btn { background:var(--blue); border:none; border-radius:9px; color:var(--white); cursor:pointer; font-family:inherit; font-size:13px; font-weight:800; padding:10px 12px; }
  .am-btn:disabled { background:var(--gray-200); color:var(--gray-400); cursor:not-allowed; }
  .am-board { background:var(--white); border:1px solid var(--gray-200); border-radius:12px; overflow:auto; position:relative; }
  .am-schedule { display:grid; grid-template-columns:56px repeat(6,minmax(100px,1fr)); min-width:780px; position:relative; }
  .am-head,.am-corner { background:var(--gray-50); border-bottom:1px solid var(--gray-200); padding:8px; font-size:10px; font-weight:800; text-transform:uppercase; text-align:center; }
  .am-corner { border-right:1px solid var(--gray-200); }
  .am-time-col,.am-day-col { border-right:1px solid var(--gray-200); height:520px; position:relative; }
  .am-time-col { background:var(--gray-50); }
  .am-day-col { background:linear-gradient(to bottom, transparent 0, transparent 42px, var(--gray-100) 43px), var(--white); background-size:100% 43px; cursor:crosshair; }
  .am-day-col:hover { background-color: rgba(3,125,167,0.02); }
  .am-time { color:var(--gray-400); font-size:10px; position:absolute; right:6px; transform:translateY(-50%); }
  .am-course { background:#f8fbfd; border:1px solid rgba(3,125,167,.24); border-left:3px solid var(--blue); border-radius:6px; color:var(--gray-800); left:4px; overflow:hidden; padding:5px 6px; position:absolute; right:4px; box-shadow:0 4px 10px rgba(26,34,54,.06); }
  .am-course.dragging { opacity: 0.35; border: 1.5px dashed var(--gray-400); cursor: grabbing; box-shadow: none; }
  .am-course-title { font-size:10px; font-weight:800; line-height:1.15; }
  .am-course-meta { color:var(--gray-600); font-size:9px; margin-top:2px; line-height:1.2; }
  .am-chip { background:var(--orange-soft); border-radius:999px; color:var(--orange); display:inline-flex; font-size:8px; font-weight:800; margin-top:3px; padding:2px 5px; }
  .am-schedule-wrap { background:var(--white); border:1px solid var(--gray-200); border-radius:12px; overflow:hidden; }
  .am-schedule-head { padding:16px 16px 0; }
  .am-schedule-head .am-panel-title { margin-bottom:6px; }
  .am-schedule-toolbar { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:0; padding:12px 16px 14px; border-bottom:1px solid var(--gray-100); }
  .am-schedule-add { border-top:1px solid var(--gray-200); padding:16px; }
  .am-schedule-add .am-panel-title { font-size:15px; margin-bottom:10px; }
  .am-hint { color:var(--gray-600); font-size:12px; line-height:1.4; margin-top:6px; }
  .am-duration-row { display:flex; gap:8px; margin: 10px 0 14px; align-items:center; }
  .am-duration-btn { background:var(--gray-50); border:1px solid var(--gray-200); border-radius:8px; color:var(--gray-800); cursor:pointer; font-family:inherit; font-size:12px; font-weight:700; padding:7px 14px; transition: all 0.15s; }
  .am-duration-btn:hover { border-color:var(--blue); }
  .am-duration-btn.active { background:var(--blue); border-color:var(--blue); color:var(--white); }
  .am-duration-label { font-size:12px; font-weight:800; color:var(--gray-600); text-transform:uppercase; margin-right:4px; }
  .am-badge-info { background:var(--blue-soft); border:1px dashed var(--blue); color:var(--blue); padding:10px 12px; border-radius:8px; font-size:13px; font-weight:700; display:inline-flex; align-items:center; gap:6px; margin-bottom:10px; width:100%; }
  @media (max-width:1100px) { .am-grid { grid-template-columns:1fr; } .am-form { grid-template-columns:repeat(2,minmax(0,1fr)); } .am-span-2,.am-form-actions { grid-column: span 2; } .am-schedule-toolbar { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width:720px) { .am-header { display:grid; } .am-form { grid-template-columns:1fr; } .am-span-2,.am-form-actions { grid-column: span 1; } .am-schedule-toolbar { grid-template-columns:1fr; } }
  .am-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(26, 34, 54, 0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: am-fade-in 0.2s ease-out; }
  @keyframes am-fade-in { from { opacity: 0; } to { opacity: 1; } }
  .am-modal { background: var(--white); border: 1px solid var(--gray-200); border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); width: 100%; max-width: 480px; padding: 24px; animation: am-scale-up 0.2s cubic-bezier(0.16,1,0.3,1); }
  @keyframes am-scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .am-modal-header { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 12px; color: var(--gray-800); }
  .am-modal-body { font-size: 13px; color: var(--gray-600); line-height: 1.5; margin-bottom: 20px; }
  .am-modal-details { background: var(--gray-50); border: 1.5px solid var(--gray-200); border-radius: 10px; padding: 14px; margin-top: 12px; }
  .am-modal-course-title { font-weight: 800; font-size: 14px; color: var(--blue); margin-bottom: 10px; }
  .am-modal-comparison { display: flex; flex-direction: column; gap: 8px; }
  .am-modal-slot { display: flex; justify-content: space-between; font-size: 12px; }
  .am-modal-slot .label { color: var(--gray-400); }
  .am-modal-arrow { align-self: center; color: var(--gray-400); font-size: 14px; font-weight: bold; }
  .am-modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
  .am-btn.cancel { background: var(--gray-100); color: var(--gray-800); border: 1px solid var(--gray-200); }
  .am-btn.cancel:hover { background: var(--gray-200); }
  .am-btn.confirm { background: var(--blue); }
`;

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTimeStr(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function courseStyle(course: { start: string; end: string }) {
  const start = toMinutes(course.start);
  const end = toMinutes(course.end);
  return {
    top: `${(start - START_MINUTES) * PIXELS_PER_MINUTE}px`,
    height: `${Math.max((end - start) * PIXELS_PER_MINUTE - 6, 36)}px`,
  };
}

function getRole() {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser).role : "";
  } catch {
    return "";
  }
}

export default function GestionEmploiPage() {
  const [filieres, setFilieres] = useState<FiliereOption[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [courses, setCourses] = useState<AcademicCourse[]>([]);
  const [salles, setSalles] = useState<SalleOption[]>([]);

  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Selected duration in minutes (default 2h = 120 min)
  const [selectedDuration, setSelectedDuration] = useState<number>(120);

  // Hover states for grid preview
  const [hoveredDay, setHoveredDay] = useState<WeekDay | null>(null);
  const [hoveredStartMinutes, setHoveredStartMinutes] = useState<number | null>(null);

  // Add Course Form state
  const [courseForm, setCourseForm] = useState({
    module_id: "",
    enseignant_id: "",
    jour: "1",
    heure_debut: "08:30",
    heure_fin: "10:30",
    salle: "",
  });

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [draggingCourseId, setDraggingCourseId] = useState<string | null>(null);

  const [pendingMove, setPendingMove] = useState<{
    courseId: string;
    day: WeekDay;
    start: string;
    end: string;
  } | null>(null);

  const pendingCourse = useMemo(() => {
    if (!pendingMove) return null;
    return courses.find((c) => c.id === pendingMove.courseId) || null;
  }, [pendingMove, courses]);

  const activeDuration = useMemo(() => {
    if (draggingCourseId) {
      const course = courses.find((c) => c.id === draggingCourseId);
      if (course) {
        return toMinutes(course.end) - toMinutes(course.start);
      }
    }
    return selectedDuration;
  }, [draggingCourseId, courses, selectedDuration]);

  const handleEditCourse = (course: AcademicCourse) => {
    setEditingCourseId(course.id);
    setCourseForm({
      module_id: String(course.moduleId),
      enseignant_id: String(course.enseignantId),
      jour: String(course.day),
      heure_debut: course.start,
      heure_fin: course.end,
      salle: course.room === "Non precisee" ? "" : course.room,
    });
    setSuccess(`Modification de la séance : ${course.module} (${course.start} - ${course.end})`);
    const formEl = document.getElementById("add-course-form");
    if (formEl) {
      formEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const cancelEdit = () => {
    setEditingCourseId(null);
    setCourseForm((prev) => ({
      ...prev,
      module_id: "",
      salle: "",
    }));
  };

  const deleteCourse = async () => {
    if (!editingCourseId) return;
    if (!window.confirm("Voulez-vous vraiment supprimer cette séance ?")) return;
    const result = await post(`${API_BASE}/seances/academic/cours/${editingCourseId}/delete/`, {});
    if (result === null) return;
    setCourses((current) => current.filter((c) => c.id !== editingCourseId));
    setSuccess("Séance supprimée de l'emploi du temps.");
    cancelEdit();
  };

  const isAdmin = getRole() === "admin";

  const selectedFiliereOption = useMemo(() => {
    return filieres.find((f) => String(f.id) === selectedFiliere);
  }, [filieres, selectedFiliere]);

  const availableSemesters = useMemo(() => {
    return selectedFiliereOption?.semesters || [];
  }, [selectedFiliereOption]);

  const loadAcademic = async () => {
    setError("");

    try {
      const res = await fetch(`${API_BASE}/seances/academic/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      });
      const data = await parseJsonResponse(res);

      if (!res.ok) {
        setError(data?.message || data?.detail || `Impossible de charger la gestion academique (${res.status}).`);
        return;
      }

      if (!data) {
        setError("Reponse serveur invalide. Verifie que les migrations Django sont appliquees.");
        return;
      }

      const payload = data as AcademicResponse;
      const loadedFilieres = payload.filieres || [];
      const loadedTeachers = payload.enseignants || [];

      setFilieres(loadedFilieres);
      setModules(payload.modules || []);
      setTeachers(loadedTeachers);
      setCourses(payload.cours || []);
      setSalles(payload.salles || []);

      // Set defaults dynamically (No "Tous" option allowed)
      if (loadedFilieres.length > 0) {
        const firstFiliere = loadedFilieres[0];
        setSelectedFiliere(String(firstFiliere.id));
        if (firstFiliere.semesters && firstFiliere.semesters.length > 0) {
          setSelectedSemester(firstFiliere.semesters[0]);
        }
      }
      if (loadedTeachers.length > 0) {
        setSelectedTeacher(String(loadedTeachers[0].id));
      }
    } catch {
      setError("Impossible de joindre le serveur. Verifie que le backend tourne sur le port 8000.");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAcademic();
    }
  }, [isAdmin]);

  const handleFiliereChange = (filiereId: string) => {
    setSelectedFiliere(filiereId);
    const filiere = filieres.find((f) => String(f.id) === filiereId);
    if (filiere && filiere.semesters && filiere.semesters.length > 0) {
      setSelectedSemester(filiere.semesters[0]);
    } else {
      setSelectedSemester("");
    }
  };

  // Filter modules based on current filters to prevent cross-scheduling errors
  const eligibleModules = useMemo(() => {
    return modules.filter(
      (m) => String(m.filiereId) === selectedFiliere && m.semestre === selectedSemester
    );
  }, [modules, selectedFiliere, selectedSemester]);

  // Timetable display filtered by selected teacher, filiere, and semester
  const visibleCourses = useMemo(() => {
    return courses.filter((course) => {
      return (
        String(course.enseignantId) === selectedTeacher &&
        String(course.filiereId) === selectedFiliere &&
        course.semestre === selectedSemester
      );
    });
  }, [courses, selectedFiliere, selectedSemester, selectedTeacher]);

  const post = async (url: string, body: unknown) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify(body),
      });
      const data = await parseJsonResponse(res);

      if (!res.ok) {
        setError(data?.message || data?.detail || `Operation impossible (${res.status}).`);
        return null;
      }

      return data;
    } catch {
      setError("Impossible de joindre le serveur. Verifie que le backend tourne.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const addCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!courseForm.module_id) {
      setError("Le module est obligatoire.");
      return;
    }

    if (editingCourseId) {
      const updated = await post(`${API_BASE}/seances/academic/cours/${editingCourseId}/`, {
        module_id: Number(courseForm.module_id),
        enseignant_id: Number(selectedTeacher),
        jour: Number(courseForm.jour),
        heure_debut: courseForm.heure_debut,
        heure_fin: courseForm.heure_fin,
        salle: courseForm.salle,
      });
      if (!updated) return;
      setCourses((current) => current.map((c) => (c.id === editingCourseId ? updated : c)));
      setSuccess("Séance modifiée avec succès.");
      cancelEdit();
    } else {
      const created = await post(`${API_BASE}/seances/academic/cours/`, {
        module_id: Number(courseForm.module_id),
        enseignant_id: Number(selectedTeacher), // schedule for the currently selected teacher
        jour: Number(courseForm.jour),
        heure_debut: courseForm.heure_debut,
        heure_fin: courseForm.heure_fin,
        salle: courseForm.salle,
      });
      if (!created) return;
      setCourses((current) => [...current, created]);
      setCourseForm((prev) => ({
        ...prev,
        module_id: "",
        salle: "",
      }));
      setSuccess("Séance planifiée avec succès.");
    }
  };

  // Snapped grid hover calculations
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>, dayValue: WeekDay) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;
    const minutesFromTop = relativeY / PIXELS_PER_MINUTE;
    const rawMinutes = minutesFromTop + START_MINUTES;
    
    // Snap to 30-minute blocks
    const snappedMinutes = Math.floor(rawMinutes / 30) * 30;
    const maxStartMinutes = END_MINUTES - selectedDuration;
    const startMins = Math.max(START_MINUTES, Math.min(snappedMinutes, maxStartMinutes));
    
    setHoveredDay(dayValue);
    setHoveredStartMinutes(startMins);
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
    setHoveredStartMinutes(null);
  };

  const handleGridClick = () => {
    if (hoveredDay !== null && hoveredStartMinutes !== null) {
      if (editingCourseId) {
        setEditingCourseId(null);
        setCourseForm((prev) => ({
          ...prev,
          module_id: "",
          salle: "",
          jour: String(hoveredDay),
          heure_debut: minutesToTimeStr(hoveredStartMinutes),
          heure_fin: minutesToTimeStr(hoveredStartMinutes + selectedDuration),
        }));
      } else {
        setCourseForm((prev) => ({
          ...prev,
          jour: String(hoveredDay),
          heure_debut: minutesToTimeStr(hoveredStartMinutes),
          heure_fin: minutesToTimeStr(hoveredStartMinutes + selectedDuration),
        }));
      }
      setSuccess(
        `Créneau choisi : ${WEEK_DAYS.find((d) => d.value === hoveredDay)?.label} de ${minutesToTimeStr(
          hoveredStartMinutes
        )} à ${minutesToTimeStr(hoveredStartMinutes + selectedDuration)}. Remplissez le module ci-dessous.`
      );

      const formEl = document.getElementById("add-course-form");
      if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, courseId: string) => {
    setDraggingCourseId(courseId);
    event.dataTransfer.setData("text/plain", courseId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingCourseId(null);
    setHoveredDay(null);
    setHoveredStartMinutes(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, dayValue: WeekDay) => {
    event.preventDefault();
    const course = courses.find((c) => c.id === draggingCourseId);
    const duration = course ? toMinutes(course.end) - toMinutes(course.start) : selectedDuration;

    const rect = event.currentTarget.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;
    const minutesFromTop = relativeY / PIXELS_PER_MINUTE;
    const rawMinutes = minutesFromTop + START_MINUTES;
    
    const snappedMinutes = Math.floor(rawMinutes / 30) * 30;
    const maxStartMinutes = END_MINUTES - duration;
    const startMins = Math.max(START_MINUTES, Math.min(snappedMinutes, maxStartMinutes));

    setHoveredDay(dayValue);
    setHoveredStartMinutes(startMins);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, dayValue: WeekDay) => {
    event.preventDefault();
    const courseId = event.dataTransfer.getData("text/plain") || draggingCourseId;
    if (!courseId) return;

    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const relativeY = event.clientY - rect.top;
    const minutesFromTop = relativeY / PIXELS_PER_MINUTE;
    const rawMinutes = minutesFromTop + START_MINUTES;
    const snappedMinutes = Math.floor(rawMinutes / 30) * 30;

    const duration = toMinutes(course.end) - toMinutes(course.start);
    const maxStartMinutes = END_MINUTES - duration;
    const startMins = Math.max(START_MINUTES, Math.min(snappedMinutes, maxStartMinutes));
    const endMins = startMins + duration;

    const startStr = minutesToTimeStr(startMins);
    const endStr = minutesToTimeStr(endMins);

    if (course.day === dayValue && course.start === startStr) {
      handleDragEnd();
      return;
    }

    // Check overlap with any existing courses (excluding the course itself)
    const conflictingCourse = courses.find((c) => {
      if (c.id === course.id) return false;
      if (c.day !== dayValue) return false;

      const cStart = toMinutes(c.start);
      const cEnd = toMinutes(c.end);
      const overlaps = startMins < cEnd && cStart < endMins;
      if (!overlaps) return false;

      // Conflict 1: Same teacher
      if (c.enseignantId === course.enseignantId) {
        return true;
      }
      // Conflict 2: Same class (filiere + semester)
      if (c.filiereId === course.filiereId && c.semestre === course.semestre) {
        return true;
      }
      // Conflict 3: Same room (if not empty / "Non precisee")
      if (course.room && course.room !== "Non precisee" && c.room === course.room) {
        return true;
      }

      return false;
    });

    if (conflictingCourse) {
      setError(`Conflit détecté avec le cours "${conflictingCourse.module}" (${conflictingCourse.start} - ${conflictingCourse.end}).`);
      handleDragEnd();
      return;
    }

    setPendingMove({
      courseId,
      day: dayValue,
      start: startStr,
      end: endStr,
    });
  };

  const confirmPendingMove = async () => {
    if (!pendingMove || !pendingCourse) return;
    const { courseId, day, start, end } = pendingMove;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/seances/academic/cours/${courseId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          module_id: pendingCourse.moduleId,
          enseignant_id: pendingCourse.enseignantId,
          jour: day,
          heure_debut: start,
          heure_fin: end,
          salle: pendingCourse.room === "Non precisee" ? "" : pendingCourse.room,
        }),
      });
      const data = await parseJsonResponse(res);

      if (!res.ok) {
        setError(data?.message || `Impossible de déplacer le cours (${res.status}).`);
        return;
      }

      setCourses((current) => current.map((c) => (c.id === courseId ? data : c)));
      setSuccess("Séance déplacée avec succès.");
    } catch {
      setError("Impossible d'enregistrer le déplacement.");
    } finally {
      setSaving(false);
      setPendingMove(null);
      handleDragEnd();
    }
  };

  async function parseJsonResponse(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  if (!isAdmin) {
    return null;
  }

  const selectedTeacherName = teachers.find(t => String(t.id) === selectedTeacher)?.name || "Sélectionné";

  return (
    <>
      <style>{css}</style>
      <SidebarLayout activePage="academic" pageTitle="Gestion de l'emploi du temps">
        <div className="am-root">
          <div className="am-header">
            <div>
              <div className="am-title">Gestion de l'emploi du temps</div>
              <div className="am-sub">
                Visualisez et planifiez l'emploi du temps hebdomadaire. Sélectionnez une filière, un semestre et un enseignant pour afficher ou insérer des séances.
              </div>
            </div>
          </div>

          {error && <div className="am-error">{error}</div>}
          {success && <div className="am-success">{success}</div>}

          <div className="am-schedule-wrap">
            <div className="am-schedule-head">
              <div className="am-panel-title">Emploi du temps</div>
              <div className="am-hint">Filtrez pour afficher le planning. Tous les filtres sont obligatoires.</div>
            </div>

            <div className="am-schedule-toolbar">
              <div className="am-field">
                <label>Filière *</label>
                <select value={selectedFiliere} onChange={(event) => handleFiliereChange(event.target.value)}>
                  {filieres.map((filiere) => (
                    <option key={filiere.id} value={filiere.id}>{filiere.nom}</option>
                  ))}
                </select>
              </div>
              <div className="am-field">
                <label>Semestre *</label>
                <select value={selectedSemester} onChange={(event) => setSelectedSemester(event.target.value)}>
                  {availableSemesters.map((semester) => (
                    <option key={semester} value={semester}>{semester}</option>
                  ))}
                </select>
              </div>
              <div className="am-field">
                <label>Enseignant *</label>
                <select value={selectedTeacher} onChange={(event) => setSelectedTeacher(event.target.value)}>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ padding: "0 16px 4px" }}>
              <div className="am-duration-row">
                <span className="am-duration-label">Durée de la séance :</span>
                {DURATIONS.map((dur) => (
                  <button
                    key={dur.value}
                    type="button"
                    className={`am-duration-btn${selectedDuration === dur.value ? " active" : ""}`}
                    onClick={() => setSelectedDuration(dur.value)}
                  >
                    {dur.label}
                  </button>
                ))}
                <span className="am-hint" style={{ marginTop: 0, marginLeft: "auto" }}>
                  💡 Survolez et cliquez sur la grille pour planifier un cours.
                </span>
              </div>
            </div>

            <div className="am-board" style={{ border: "none", borderRadius: 0 }}>
              <div className="am-schedule">
                <div className="am-corner" />
                {WEEK_DAYS.map((day) => <div className="am-head" key={day.value}>{day.label}</div>)}
                <div className="am-time-col">
                  {["08:30", "10:30", "12:30", "14:30", "16:30", "18:30"].map((time) => (
                    <div className="am-time" key={time} style={{ top: `${(toMinutes(time) - START_MINUTES) * PIXELS_PER_MINUTE}px` }}>{time}</div>
                  ))}
                </div>
                {WEEK_DAYS.map((day) => (
                  <div
                    className="am-day-col"
                    key={day.value}
                    onMouseMove={(e) => handleMouseMove(e, day.value)}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleGridClick}
                    onDragOver={(e) => handleDragOver(e, day.value)}
                    onDragLeave={handleMouseLeave}
                    onDrop={(e) => handleDrop(e, day.value)}
                  >
                    {visibleCourses.filter((course) => course.day === day.value).map((course) => (
                      <div
                        className={`am-course${draggingCourseId === course.id ? " dragging" : ""}`}
                        key={course.id}
                        style={{ ...courseStyle(course), cursor: "grab" }}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, course.id)}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCourse(course);
                        }}
                      >
                        <div className="am-course-title">{course.module}</div>
                        <div className="am-course-meta">{course.start} - {course.end} | {course.room ? (/^salle\b/i.test(course.room.trim()) ? course.room : `Salle ${course.room}`) : ""}</div>
                        <div className="am-course-meta">{course.enseignant}</div>
                        <span className="am-chip">{course.filiere}</span>
                      </div>
                    ))}

                    {/* Snap Preview Ghost Card */}
                    {hoveredDay === day.value && hoveredStartMinutes !== null && (
                      <div
                        className="am-course"
                        style={{
                          ...courseStyle({
                            start: minutesToTimeStr(hoveredStartMinutes),
                            end: minutesToTimeStr(hoveredStartMinutes + activeDuration),
                          }),
                          opacity: 0.7,
                          background: "rgba(3, 125, 167, 0.12)",
                          border: "2px dashed var(--blue)",
                          pointerEvents: "none",
                          zIndex: 10,
                          color: "var(--blue)",
                        }}
                      >
                        <div className="am-course-title" style={{ fontWeight: 800 }}>
                          {draggingCourseId ? "[Déplacer séance]" : "[Placer séance]"}
                        </div>
                        <div className="am-course-meta">
                          {minutesToTimeStr(hoveredStartMinutes)} - {minutesToTimeStr(hoveredStartMinutes + activeDuration)}
                        </div>
                        <div className="am-course-meta" style={{ fontStyle: "italic", fontSize: "8px" }}>
                          {draggingCourseId ? "Relâcher pour déplacer" : "Cliquer pour valider"}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="am-schedule-add" id="add-course-form">
              <div className="am-panel-title">
                {editingCourseId ? "Modifier la séance planifiée" : "Ajouter une séance planifiée"}
              </div>
              <div className="am-hint" style={{ marginBottom: 12 }}>
                {editingCourseId
                  ? "Modifiez les détails de la séance ci-dessous ou cliquez sur un autre créneau de la grille pour changer d'horaire."
                  : "Sélectionnez un créneau horaire sur la grille ou définissez-le ci-dessous. La séance sera planifiée pour l'enseignant "
                } <strong>{selectedTeacherName}</strong>.
              </div>

              {courseForm.heure_debut && (
                <div className="am-badge-info">
                  📅 Créneau sélectionné : {WEEK_DAYS.find(d => String(d.value) === courseForm.jour)?.label} de {courseForm.heure_debut} à {courseForm.heure_fin}
                </div>
              )}

              <form className="am-form" onSubmit={addCourse}>
                <div className="am-field am-span-2">
                  <label>Module *</label>
                  <select
                    value={courseForm.module_id}
                    onChange={(event) => setCourseForm((v) => ({ ...v, module_id: event.target.value }))}
                    required
                  >
                    <option value="">Choisir</option>
                    {eligibleModules.map((module) => (
                      <option key={module.id} value={module.id}>{module.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="am-field">
                  <label>Jour *</label>
                  <select
                    value={courseForm.jour}
                    onChange={(event) => setCourseForm((v) => ({ ...v, jour: event.target.value }))}
                    required
                  >
                    {WEEK_DAYS.map((day) => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>
                <div className="am-field">
                  <label>Salle</label>
                  <select
                    value={courseForm.salle}
                    onChange={(event) => setCourseForm((v) => ({ ...v, salle: event.target.value }))}
                  >
                    <option value="">Non précisée</option>
                    {salles.map((s) => (
                      <option key={s.id} value={s.nom}>{s.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="am-field">
                  <label>Début *</label>
                  <input
                    type="time"
                    value={courseForm.heure_debut}
                    onChange={(event) => setCourseForm((v) => ({ ...v, heure_debut: event.target.value }))}
                    required
                  />
                </div>
                <div className="am-field">
                  <label>Fin *</label>
                  <input
                    type="time"
                    value={courseForm.heure_fin}
                    onChange={(event) => setCourseForm((v) => ({ ...v, heure_fin: event.target.value }))}
                    required
                  />
                </div>
                
                <div className="am-form-actions">
                  <button className="am-btn" style={{ flex: 1, height: "42px" }} disabled={saving}>
                    {editingCourseId ? "Enregistrer les modifications" : "Planifier la séance"}
                  </button>
                  {editingCourseId && (
                    <>
                      <button
                        type="button"
                        className="am-btn"
                        style={{ background: "#dc2626", height: "42px" }}
                        onClick={deleteCourse}
                        disabled={saving}
                      >
                        Supprimer la séance
                      </button>
                      <button
                        type="button"
                        className="am-btn"
                        style={{ background: "#64748b", height: "42px" }}
                        onClick={cancelEdit}
                        disabled={saving}
                      >
                        Annuler
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
          {pendingMove && pendingCourse && (
            <div className="am-modal-overlay">
              <div className="am-modal">
                <div className="am-modal-header">Confirmer le déplacement</div>
                <div className="am-modal-body">
                  <p>Voulez-vous modifier l'horaire de la séance suivante ?</p>
                  <div className="am-modal-details">
                    <div className="am-modal-course-title">{pendingCourse.module}</div>
                    <div className="am-modal-comparison">
                      <div className="am-modal-slot">
                        <span className="label">Ancien créneau :</span>
                        <strong>
                          {WEEK_DAYS.find((d) => d.value === pendingCourse.day)?.label} {" "}
                          {pendingCourse.start} - {pendingCourse.end}
                        </strong>
                      </div>
                      <div className="am-modal-arrow">➔</div>
                      <div className="am-modal-slot">
                        <span className="label">Nouveau créneau :</span>
                        <strong>
                          {WEEK_DAYS.find((d) => d.value === pendingMove.day)?.label} {" "}
                          {pendingMove.start} - {pendingMove.end}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="am-modal-actions">
                  <button
                    type="button"
                    className="am-btn cancel"
                    onClick={() => {
                      setPendingMove(null);
                      handleDragEnd();
                    }}
                    disabled={saving}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="am-btn confirm"
                    onClick={confirmPendingMove}
                    disabled={saving}
                  >
                    {saving ? "Enregistrement..." : "Confirmer le déplacement"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarLayout>
    </>
  );
}
