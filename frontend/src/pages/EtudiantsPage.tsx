import { useEffect, useMemo, useState } from "react";
import SidebarLayout from "../components/Sidebar";
import { API_BASE } from "../config";

interface FiliereOption {
  id: number;
  nom: string;
}

interface ModuleItem {
  id: number;
  nom: string;
  semestre: string;
  filiere_id?: number;
}

interface Etudiant {
  id: number;
  code_massar: string;
  nom: string;
  prenom: string;
  email: string;
  filiere: FiliereOption;
  semestre?: string;
  modules: ModuleItem[];
}

interface EtudiantsResponse {
  filters: {
    filieres: FiliereOption[];
    modules: ModuleItem[];
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

  .et-form-card {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    margin-bottom: 18px;
    padding: 16px;
  }

  .et-form-title {
    color: var(--gray-800);
    font-family: 'Outfit', sans-serif;
    font-size: 16px;
    font-weight: 800;
    margin-bottom: 12px;
  }

  .et-form {
    display: grid;
    grid-template-columns: repeat(4, minmax(150px, 1fr));
    gap: 12px;
  }

  .et-form-actions {
    align-items: end;
    display: flex;
  }

  .et-btn {
    background: var(--blue);
    border: none;
    border-radius: 9px;
    color: var(--white);
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    padding: 10px 14px;
    width: 100%;
  }

  .et-btn:disabled {
    background: var(--gray-200);
    color: var(--gray-400);
    cursor: not-allowed;
  }

  @media (max-width: 760px) {
    .et-header,
    .et-filters,
    .et-form {
      grid-template-columns: 1fr;
      display: grid;
    }
  }

  .et-tabs {
    display: flex;
    gap: 8px;
    border-bottom: 2px solid var(--gray-200);
    margin-bottom: 16px;
  }
  .et-tab {
    background: transparent;
    border: none;
    padding: 8px 16px;
    font-size: 13.5px;
    font-weight: 700;
    color: var(--gray-400);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.2s;
  }
  .et-tab.active {
    color: var(--blue);
    border-bottom-color: var(--blue);
  }
  .et-tab:hover:not(.active) {
    color: var(--gray-600);
  }

  .et-import-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .et-import-results {
    background: var(--gray-50);
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    padding: 14px;
    margin-top: 14px;
  }
  .et-import-results-title {
    font-weight: 800;
    font-size: 14px;
    color: var(--gray-800);
    margin-bottom: 8px;
  }
  .et-import-success {
    color: #16a34a;
    font-weight: 700;
    font-size: 13px;
    margin-bottom: 6px;
  }
  .et-import-errors-list {
    max-height: 150px;
    overflow-y: auto;
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-radius: 8px;
    padding: 8px 12px;
    margin-top: 10px;
  }
  .et-import-error-item {
    font-size: 11.5px;
    color: #be123c;
    margin-bottom: 4px;
    line-height: 1.4;
  }
  .et-import-error-item:last-child {
    margin-bottom: 0;
  }

  .et-btn-action {
    border: none;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }
  .et-btn-action.edit {
    background: var(--blue-soft);
    color: var(--blue);
  }
  .et-btn-action.edit:hover {
    background: var(--blue);
    color: white;
  }
  .et-btn-action.delete {
    background: rgba(220,38,38,0.1);
    color: #dc2626;
  }
  .et-btn-action.delete:hover {
    background: #dc2626;
    color: white;
  }

  .et-modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15,23,42,0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .et-modal {
    background: var(--white);
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
    width: 100%;
    max-width: 500px;
    padding: 24px;
    border: 1px solid var(--gray-200);
  }
  .et-modal-title {
    font-family: 'Outfit', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: var(--gray-800);
    margin-bottom: 16px;
  }
  .et-modal-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .et-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
  .et-btn-secondary {
    background: var(--gray-100);
    color: var(--gray-600);
    border: none;
    border-radius: 9px;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    padding: 10px 14px;
  }
  .et-btn-secondary:hover {
    background: var(--gray-200);
  }
  .et-btn-danger {
    background: #dc2626;
    color: var(--white);
    border: none;
    border-radius: 9px;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    padding: 10px 14px;
  }
  .et-btn-danger:hover {
    background: #b91c1c;
  }
  .et-checkbox {
    cursor: pointer;
    width: 16px;
    height: 16px;
    accent-color: var(--blue);
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
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    code_massar: "",
    filiere_id: "",
    semestre: "",
    module_ids: [] as number[],
  });
  const role = getUserRole();

  const [activeTab, setActiveTab] = useState<"manual" | "import">("manual");
  const [importFiliere, setImportFiliere] = useState("");
  const [importSemester, setImportSemester] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    total: number;
    errors: string[];
  } | null>(null);

  const handleImportExcel = async () => {
    if (!importFile || !importFiliere || !importSemester) return;
    setImporting(true);
    setError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("filiere_id", importFiliere);
    formData.append("semestre", importSemester);

    try {
      const res = await fetch(`${API_BASE}/etudiants/import/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setImportResult({
          success: data.success,
          total: data.total,
          errors: data.errors || [],
        });
        
        const params = new URLSearchParams();
        if (selectedFiliere) {
          params.set("filiere", selectedFiliere);
        }
        const refreshRes = await fetch(`${API_BASE}/etudiants/?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setEtudiants(refreshData.etudiants);
        }
      } else {
        setError(data.message || "Erreur lors de l'importation.");
        if (data.errors) {
          setImportResult({
            success: data.success || 0,
            total: data.total || 0,
            errors: data.errors,
          });
        }
      }
    } catch {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(`${API_BASE}/etudiants/template/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_etudiants.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Impossible de télécharger le modèle.");
    }
  };

  const [editingStudent, setEditingStudent] = useState<Etudiant | null>(null);
  const [editForm, setEditForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    code_massar: "",
    filiere_id: "",
    semestre: "",
    module_ids: [] as number[],
  });
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const handleStartEdit = (etudiant: Etudiant) => {
    setEditingStudent(etudiant);
    setEditForm({
      nom: etudiant.nom,
      prenom: etudiant.prenom,
      email: etudiant.email,
      password: "",
      code_massar: etudiant.code_massar,
      filiere_id: String(etudiant.filiere.id),
      semestre: etudiant.semestre || "",
      module_ids: etudiant.modules.map((m) => m.id),
    });
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setUpdating(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/etudiants/${editingStudent.id}/update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          ...editForm,
          filiere_id: Number(editForm.filiere_id),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Impossible de modifier l'étudiant.");
        return;
      }

      setEtudiants((current) =>
        current.map((et) => (et.id === editingStudent.id ? (data as Etudiant) : et))
      );
      setEditingStudent(null);
    } catch {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelete = (id: number) => {
    setDeletingStudentId(id);
  };

  const handleDeleteStudent = async () => {
    if (!deletingStudentId) return;
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/etudiants/${deletingStudentId}/delete/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Impossible de supprimer l'étudiant.");
        return;
      }

      setEtudiants((current) => current.filter((et) => et.id !== deletingStudentId));
      setDeletingStudentId(null);
      // Clean selectedIds if the deleted student was selected
      setSelectedIds((prev) => prev.filter((id) => id !== deletingStudentId));
    } catch {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const visibleIds = filteredEtudiants.map((et) => et.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => {
        const newSelection = [...prev];
        visibleIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkDeleting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/etudiants/bulk-delete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Impossible de supprimer les étudiants sélectionnés.");
        return;
      }

      setEtudiants((current) => current.filter((et) => !selectedIds.includes(et.id)));
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
    } catch {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setBulkDeleting(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedFiliere) {
      params.set("filiere", selectedFiliere);
    }

    const loadEtudiants = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/etudiants/?${params.toString()}`, {
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
        setModules(payload.filters.modules || []);
        setEtudiants(payload.etudiants);
      } catch {
        setError("Erreur de connexion avec le serveur.");
      } finally {
        setLoading(false);
      }
    };

    loadEtudiants();
  }, [selectedFiliere]);

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/etudiants/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          ...form,
          filiere_id: Number(form.filiere_id),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Impossible d'ajouter l'etudiant.");
        return;
      }

      setEtudiants((current) => [...current, data as Etudiant]);
      setForm({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        code_massar: "",
        filiere_id: "",
        semestre: "",
        module_ids: [],
      });
    } catch {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setCreating(false);
    }
  };

  const filteredEtudiants = useMemo(() => {
    let result = etudiants;

    if (selectedModule) {
      const modId = Number(selectedModule);
      result = result.filter((et) => et.modules.some((m) => m.id === modId));
    }

    const q = search.trim().toLowerCase();
    if (!q) {
      return result;
    }

    return result.filter((etudiant) => {
      const fullName = `${etudiant.prenom} ${etudiant.nom}`.toLowerCase();
      return (
        fullName.includes(q) ||
        etudiant.email.toLowerCase().includes(q) ||
        etudiant.code_massar.toLowerCase().includes(q)
      );
    });
  }, [etudiants, search, selectedModule]);

  return (
    <>
      <style>{css}</style>
      <SidebarLayout activePage="etudiants" pageTitle="Étudiants">
        <div className="et-root">
          <div className="et-header">
            <div>
              <div className="et-title">Liste des étudiants</div>
              <div className="et-subtitle">
                {role === "admin"
                  ? "Vue globale de toutes les filières et tous les semestres."
                  : "Étudiants liés aux filières et modules que vous enseignez."}
              </div>
            </div>
            <div className="et-count">{filteredEtudiants.length} étudiants</div>
          </div>

          {error && <div className="et-error">{error}</div>}

          {role === "admin" && (
            <div className="et-form-card">
              <div className="et-tabs">
                <button
                  type="button"
                  className={`et-tab ${activeTab === "manual" ? "active" : ""}`}
                  onClick={() => { setActiveTab("manual"); setError(""); setImportResult(null); }}
                >
                  Saisie manuelle
                </button>
                <button
                  type="button"
                  className={`et-tab ${activeTab === "import" ? "active" : ""}`}
                  onClick={() => { setActiveTab("import"); setError(""); setImportResult(null); }}
                >
                  Import Excel / CSV
                </button>
              </div>

              {activeTab === "manual" ? (
                <form className="et-form" onSubmit={handleCreateStudent}>
                  <div className="et-filter">
                    <label>Nom</label>
                    <input value={form.nom} onChange={(event) => updateForm("nom", event.target.value)} required />
                  </div>
                  <div className="et-filter">
                    <label>Prénom</label>
                    <input value={form.prenom} onChange={(event) => updateForm("prenom", event.target.value)} required />
                  </div>
                  <div className="et-filter">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
                    <span style={{ fontSize: "9px", color: "var(--gray-400)", marginTop: "2px", lineHeight: "1.2" }}>
                      Optionnel (auto: p.nom@edu.umi.ac.ma)
                    </span>
                  </div>
                  <div className="et-filter">
                    <label>Mot de passe</label>
                    <input type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} />
                    <span style={{ fontSize: "9px", color: "var(--gray-400)", marginTop: "2px", lineHeight: "1.2" }}>
                      Optionnel (auto: prenom+nom[0]+@+massar[:4])
                    </span>
                  </div>
                  <div className="et-filter">
                    <label>Code Massar</label>
                    <input value={form.code_massar} onChange={(event) => updateForm("code_massar", event.target.value)} required />
                  </div>
                  <div className="et-filter">
                    <label>Filière</label>
                    <select
                      value={form.filiere_id}
                      onChange={(event) => {
                        const fid = event.target.value;
                        setForm((prev) => ({ ...prev, filiere_id: fid, semestre: "", module_ids: [] }));
                      }}
                      required
                    >
                      <option value="">Choisir une filière</option>
                      {filieres.map((filiere) => (
                        <option value={filiere.id} key={filiere.id}>{filiere.nom}</option>
                      ))}
                    </select>
                  </div>
                  {form.filiere_id && (
                    <div className="et-filter">
                      <label>Semestre</label>
                      <select
                        value={form.semestre}
                        onChange={(event) => {
                          const sem = event.target.value;
                          const semesterModules = modules
                            .filter((m) => String(m.filiere_id) === form.filiere_id && m.semestre === sem)
                            .map((m) => m.id);
                          setForm((prev) => ({ ...prev, semestre: sem, module_ids: semesterModules }));
                        }}
                        required
                      >
                        <option value="">Choisir un semestre</option>
                        {filieres
                          .find((f) => String(f.id) === form.filiere_id)
                          ?.semesters.map((sem) => (
                            <option value={sem} key={sem}>{sem}</option>
                          ))}
                      </select>
                    </div>
                  )}
                  {form.filiere_id && form.semestre && (
                    <div style={{ gridColumn: "1 / -1", marginTop: "8px", borderTop: "1px solid var(--gray-200)", paddingTop: "12px", marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--gray-800)" }}>Modules du semestre</span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="et-btn-action edit"
                            style={{ padding: "2px 8px", fontSize: "10px", height: "auto" }}
                            onClick={() => {
                              const semesterModules = modules
                                .filter((m) => String(m.filiere_id) === form.filiere_id && m.semestre === form.semestre)
                                .map((m) => m.id);
                              setForm((prev) => ({ ...prev, module_ids: semesterModules }));
                            }}
                          >
                            Tout cocher
                          </button>
                          <button
                            type="button"
                            className="et-btn-action delete"
                            style={{ padding: "2px 8px", fontSize: "10px", height: "auto" }}
                            onClick={() => setForm((prev) => ({ ...prev, module_ids: [] }))}
                          >
                            Tout décocher
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
                        {modules
                          .filter((m) => String(m.filiere_id) === form.filiere_id && m.semestre === form.semestre)
                          .map((m) => (
                            <label key={m.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--gray-600)", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                className="et-checkbox"
                                checked={form.module_ids.includes(m.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setForm((prev) => ({ ...prev, module_ids: [...prev.module_ids, m.id] }));
                                  } else {
                                    setForm((prev) => ({ ...prev, module_ids: prev.module_ids.filter((id) => id !== m.id) }));
                                  }
                                }}
                              />
                              <span>{m.nom}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="et-form-actions">
                    <button className="et-btn" type="submit" disabled={creating} style={{ marginBottom: "14px" }}>
                      {creating ? (
                        <>
                          <span className="spinner"></span>
                          Ajout...
                        </>
                      ) : "Ajouter l'étudiant"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="et-import-panel">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                    <div className="et-filter">
                      <label>Filière de destination</label>
                      <select
                        value={importFiliere}
                        onChange={(event) => {
                          setImportFiliere(event.target.value);
                          setImportSemester("");
                        }}
                        required
                      >
                        <option value="">Choisir une filière</option>
                        {filieres.map((filiere) => (
                          <option value={filiere.id} key={filiere.id}>{filiere.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div className="et-filter">
                      <label>Semestre</label>
                      <select
                        value={importSemester}
                        onChange={(event) => setImportSemester(event.target.value)}
                        required
                        disabled={!importFiliere}
                      >
                        <option value="">Choisir un semestre</option>
                        {filieres
                          .find((f) => String(f.id) === importFiliere)
                          ?.semesters.map((sem) => (
                            <option value={sem} key={sem}>{sem}</option>
                          ))}
                      </select>
                    </div>
                    <div className="et-filter" style={{ justifyContent: "center", border: "none", background: "transparent", padding: 0 }}>
                      <label style={{ marginBottom: "4px" }}>Fichier (.xlsx ou .csv)</label>
                      <input
                        type="file"
                        accept=".xlsx,.csv"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        style={{ fontSize: "12px" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                    <button
                      className="et-btn"
                      type="button"
                      disabled={importing || !importFiliere || !importSemester || !importFile}
                      onClick={handleImportExcel}
                    >
                      {importing ? (
                        <>
                          <span className="spinner"></span>
                          Importation...
                        </>
                      ) : "Importer les étudiants"}
                    </button>
                    <button
                      className="et-btn-secondary"
                      type="button"
                      onClick={handleDownloadTemplate}
                    >
                      Télécharger le modèle
                    </button>
                  </div>

                  {importResult && (
                    <div className="et-import-results">
                      <div className="et-import-results-title">Rapport d'importation</div>
                      <div className="et-import-success">
                        ✅ {importResult.success} / {importResult.total} étudiants importés avec succès.
                      </div>
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: "bold", color: "#be123c", marginTop: "10px" }}>
                            Erreurs rencontrées ({importResult.errors.length}) :
                          </div>
                          <div className="et-import-errors-list">
                            {importResult.errors.map((err, i) => (
                              <div className="et-import-error-item" key={i}>
                                • {err}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="et-filters">
            <div className="et-filter">
              <label>Filière</label>
              <select
                value={selectedFiliere}
                onChange={(event) => {
                  setSelectedFiliere(event.target.value);
                  setSelectedModule("");
                }}
              >
                <option value="">Toutes les filières</option>
                {filieres.map((filiere) => (
                  <option value={filiere.id} key={filiere.id}>
                    {filiere.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="et-filter">
              <label>Module</label>
              <select
                value={selectedModule}
                onChange={(event) => setSelectedModule(event.target.value)}
              >
                <option value="">Tous les modules</option>
                {modules
                  .filter((m) => !selectedFiliere || String(m.filiere_id) === selectedFiliere)
                  .map((module) => (
                    <option value={module.id} key={module.id}>
                      {module.nom} ({module.semestre})
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

          {/* Selection Banner */}
          {role === "admin" && selectedIds.length > 0 && (
            <div className="et-selection-banner" style={{
              background: "rgba(220,38,38,0.05)",
              border: "1px solid rgba(220,38,38,0.2)",
              borderRadius: "10px",
              padding: "12px 16px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#dc2626" }}>
                {selectedIds.length} étudiant{selectedIds.length > 1 ? "s" : ""} sélectionné{selectedIds.length > 1 ? "s" : ""}
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="et-btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                  onClick={() => setSelectedIds([])}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="et-btn-danger"
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                  onClick={() => setShowBulkDeleteConfirm(true)}
                >
                  Supprimer la sélection
                </button>
              </div>
            </div>
          )}

          <div className="et-table-card">
            {loading ? (
              <div className="et-state" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                <div className="spinner" style={{ width: "30px", height: "30px", borderWidth: "3px", borderColor: "rgba(3,125,167,0.2)", borderTopColor: "var(--blue)" }}></div>
                <p style={{ marginTop: "12px", color: "var(--gray-400)", fontSize: "14px" }}>Chargement des etudiants...</p>
              </div>
            ) : filteredEtudiants.length === 0 ? (
              <div className="et-state">Aucun etudiant trouve.</div>
            ) : (
              <div className="et-table-wrap">
                <table className="et-table">
                  <thead>
                    <tr>
                      {role === "admin" && (
                        <th style={{ width: "40px", paddingRight: 0 }}>
                          <input
                            type="checkbox"
                            className="et-checkbox"
                            checked={
                              filteredEtudiants.length > 0 &&
                              filteredEtudiants.every((et) => selectedIds.includes(et.id))
                            }
                            onChange={handleToggleSelectAll}
                          />
                        </th>
                      )}
                      <th>Etudiant</th>
                      <th>Code Massar</th>
                      <th>Filiere</th>
                      {role === "admin" && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEtudiants.map((etudiant) => (
                      <tr key={etudiant.id}>
                        {role === "admin" && (
                          <td style={{ width: "40px", paddingRight: 0, verticalAlign: "middle" }}>
                            <input
                              type="checkbox"
                              className="et-checkbox"
                              checked={selectedIds.includes(etudiant.id)}
                              onChange={() => handleToggleSelect(etudiant.id)}
                            />
                          </td>
                        )}
                        <td>
                          <div className="et-name">{etudiant.prenom} {etudiant.nom}</div>
                          <div className="et-email">{etudiant.email}</div>
                        </td>
                        <td>{etudiant.code_massar}</td>
                        <td>
                          <span className="et-badge">{etudiant.filiere.nom}</span>
                          {etudiant.semestre && (
                            <span className="et-badge" style={{ marginLeft: "6px", background: "rgba(246, 147, 31, 0.1)", color: "#f6931f" }}>
                              {etudiant.semestre}
                            </span>
                          )}
                        </td>
                        {role === "admin" && (
                          <td>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                className="et-btn-action edit"
                                onClick={() => handleStartEdit(etudiant)}
                              >
                                Modifier
                              </button>
                              <button
                                className="et-btn-action delete"
                                onClick={() => handleConfirmDelete(etudiant.id)}
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Edit Student Modal */}
          {editingStudent && (
            <div className="et-modal-backdrop">
              <div className="et-modal">
                <div className="et-modal-title">Modifier l'étudiant</div>
                <form className="et-modal-form" onSubmit={handleUpdateStudent}>
                  <div className="et-filter">
                    <label>Nom</label>
                    <input
                      value={editForm.nom}
                      onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="et-filter">
                    <label>Prénom</label>
                    <input
                      value={editForm.prenom}
                      onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="et-filter">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="et-filter">
                    <label>Mot de passe</label>
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      placeholder="Laisser vide pour ne pas modifier"
                    />
                    <span style={{ fontSize: "9px", color: "var(--gray-400)", marginTop: "2px", lineHeight: "1.2" }}>
                      Laisser vide pour conserver le mot de passe actuel.
                    </span>
                  </div>
                  <div className="et-filter">
                    <label>Code Massar</label>
                    <input
                      value={editForm.code_massar}
                      onChange={(e) => setEditForm({ ...editForm, code_massar: e.target.value })}
                      required
                    />
                  </div>
                  <div className="et-filter">
                    <label>Filière</label>
                    <select
                      value={editForm.filiere_id}
                      onChange={(e) => setEditForm({ ...editForm, filiere_id: e.target.value, semestre: "", module_ids: [] })}
                      required
                    >
                      <option value="">Choisir une filière</option>
                      {filieres.map((filiere) => (
                        <option value={filiere.id} key={filiere.id}>
                          {filiere.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  {editForm.filiere_id && (
                    <div className="et-filter">
                      <label>Semestre</label>
                      <select
                        value={editForm.semestre}
                        onChange={(e) => {
                          const sem = e.target.value;
                          const semesterModules = modules
                            .filter((m) => String(m.filiere_id) === editForm.filiere_id && m.semestre === sem)
                            .map((m) => m.id);
                          setEditForm({ ...editForm, semestre: sem, module_ids: semesterModules });
                        }}
                        required
                      >
                        <option value="">Choisir un semestre</option>
                        {filieres
                          .find((f) => String(f.id) === editForm.filiere_id)
                          ?.semesters.map((sem) => (
                            <option value={sem} key={sem}>
                              {sem}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  {editForm.filiere_id && editForm.semestre && (
                    <div style={{ marginTop: "8px", borderTop: "1px solid var(--gray-200)", paddingTop: "12px", marginBottom: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--gray-800)" }}>Modules du semestre</span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="et-btn-action edit"
                            style={{ padding: "2px 8px", fontSize: "10px", height: "auto" }}
                            onClick={() => {
                              const semesterModules = modules
                                .filter((m) => String(m.filiere_id) === editForm.filiere_id && m.semestre === editForm.semestre)
                                .map((m) => m.id);
                              setEditForm({ ...editForm, module_ids: semesterModules });
                            }}
                          >
                            Tout cocher
                          </button>
                          <button
                            type="button"
                            className="et-btn-action delete"
                            style={{ padding: "2px 8px", fontSize: "10px", height: "auto" }}
                            onClick={() => setEditForm({ ...editForm, module_ids: [] })}
                          >
                            Tout décocher
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                        {modules
                          .filter((m) => String(m.filiere_id) === editForm.filiere_id && m.semestre === editForm.semestre)
                          .map((m) => (
                            <label key={m.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--gray-600)", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                className="et-checkbox"
                                checked={editForm.module_ids.includes(m.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditForm({ ...editForm, module_ids: [...editForm.module_ids, m.id] });
                                  } else {
                                    setEditForm({ ...editForm, module_ids: editForm.module_ids.filter((id) => id !== m.id) });
                                  }
                                }}
                              />
                              <span>{m.nom}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="et-modal-actions">
                    <button type="button" className="et-btn-secondary" onClick={() => setEditingStudent(null)}>
                      Annuler
                    </button>
                    <button type="submit" className="et-btn" disabled={updating} style={{ width: "auto" }}>
                      {updating ? (
                        <>
                          <span className="spinner"></span>
                          Enregistrement...
                        </>
                      ) : "Enregistrer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deletingStudentId !== null && (
            <div className="et-modal-backdrop">
              <div className="et-modal" style={{ maxWidth: "400px" }}>
                <div className="et-modal-title">Confirmer la suppression</div>
                <p style={{ fontSize: "14px", color: "var(--gray-600)", marginBottom: "20px" }}>
                  Êtes-vous sûr de vouloir supprimer cet étudiant ? Cette action est irréversible et supprimera tout son historique de présence.
                </p>
                <div className="et-modal-actions">
                  <button type="button" className="et-btn-secondary" onClick={() => setDeletingStudentId(null)}>
                    Annuler
                  </button>
                  <button type="button" className="et-btn-danger" disabled={deleting} onClick={handleDeleteStudent}>
                    {deleting ? (
                      <>
                        <span className="spinner" style={{ borderTopColor: "#fff" }}></span>
                        Suppression...
                      </>
                    ) : "Supprimer"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Delete Confirmation Modal */}
          {showBulkDeleteConfirm && (
            <div className="et-modal-backdrop">
              <div className="et-modal" style={{ maxWidth: "400px" }}>
                <div className="et-modal-title">Confirmer la suppression en masse</div>
                <p style={{ fontSize: "14px", color: "var(--gray-600)", marginBottom: "20px" }}>
                  Êtes-vous sûr de vouloir supprimer les <strong>{selectedIds.length}</strong> étudiants sélectionnés ? Cette action est irréversible et supprimera tout leur historique de présence.
                </p>
                <div className="et-modal-actions">
                  <button type="button" className="et-btn-secondary" onClick={() => setShowBulkDeleteConfirm(false)}>
                    Annuler
                  </button>
                  <button type="button" className="et-btn-danger" disabled={bulkDeleting} onClick={handleBulkDelete}>
                    {bulkDeleting ? (
                      <>
                        <span className="spinner" style={{ borderTopColor: "#fff" }}></span>
                        Suppression...
                      </>
                    ) : "Supprimer"}
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
