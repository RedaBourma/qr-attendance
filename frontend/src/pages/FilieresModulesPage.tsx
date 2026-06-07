import { useEffect, useState, useMemo } from "react";
import SidebarLayout from "../components/Sidebar";
import { API_BASE } from "../config";

interface Filiere {
  id: number;
  nom: string;
  semesters: string[];
}

interface Module {
  id: number;
  nom: string;
  filiereId: number;
  filiere: string;
  semestre: string;
}

const css = `
  .fm-root {
    --blue: #037da7;
    --blue-soft: rgba(3,125,167,0.1);
    --blue-soft-active: rgba(3,125,167,0.2);
    --orange: #f6931f;
    --orange-soft: rgba(246,147,31,0.1);
    --white: #ffffff;
    --gray-50: #f7f9fc;
    --gray-100: #eef1f6;
    --gray-200: #dde3ee;
    --gray-400: #94a3b8;
    --gray-600: #4a5568;
    --gray-800: #1a2236;
    font-family: 'DM Sans', sans-serif;
  }

  .fm-header {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 24px;
  }

  .fm-title {
    font-family: 'Outfit', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: var(--gray-800);
  }

  .fm-subtitle {
    font-size: 13px;
    color: var(--gray-400);
  }

  .fm-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
  }

  @media (max-width: 900px) {
    .fm-grid {
      grid-template-columns: 1fr;
    }
  }

  .fm-card {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
  }

  .fm-card-title {
    font-family: 'Outfit', sans-serif;
    font-size: 16px;
    font-weight: 800;
    color: var(--gray-800);
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .fm-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .fm-item {
    background: var(--gray-50);
    border: 1.5px solid var(--gray-100);
    border-radius: 10px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .fm-item:hover {
    border-color: var(--blue-soft);
    background: rgba(3,125,167,0.02);
  }

  .fm-item.active {
    background: var(--blue-soft);
    border-color: var(--blue);
  }

  .fm-item-main {
    flex: 1;
    min-width: 0;
  }

  .fm-item-name {
    font-size: 14px;
    font-weight: 800;
    color: var(--gray-800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fm-item-detail {
    font-size: 12px;
    color: var(--gray-400);
    margin-top: 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .fm-sem-badge {
    background: var(--gray-200);
    color: var(--gray-600);
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 4px;
  }

  .fm-item.active .fm-sem-badge {
    background: rgba(3,125,167,0.15);
    color: var(--blue);
  }

  .fm-actions {
    display: flex;
    gap: 6px;
  }

  .fm-btn-icon {
    background: transparent;
    border: none;
    border-radius: 6px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--gray-400);
    transition: all 0.15s;
  }

  .fm-btn-icon:hover {
    background: var(--gray-200);
    color: var(--gray-800);
  }

  .fm-btn-icon.delete:hover {
    background: rgba(220,38,38,0.1);
    color: #dc2626;
  }

  .fm-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .fm-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .fm-field label {
    font-size: 11px;
    font-weight: 800;
    color: var(--gray-400);
    text-transform: uppercase;
  }

  .fm-field input,
  .fm-field select {
    background: var(--white);
    border: 1.5px solid var(--gray-200);
    border-radius: 10px;
    padding: 10px 12px;
    font-family: inherit;
    font-size: 13.5px;
    color: var(--gray-800);
    outline: none;
    transition: border-color 0.15s;
  }

  .fm-field input:focus,
  .fm-field select:focus {
    border-color: var(--blue);
  }

  .fm-checkbox-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .fm-checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--gray-600);
    cursor: pointer;
  }

  .fm-btn {
    background: var(--blue);
    color: var(--white);
    border: none;
    border-radius: 9px;
    padding: 10px 16px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    transition: background 0.15s;
  }

  .fm-btn:hover {
    background: #026b90;
  }

  .fm-btn:disabled {
    background: var(--gray-200);
    color: var(--gray-400);
    cursor: not-allowed;
  }

  .fm-state-empty {
    font-size: 13px;
    color: var(--gray-400);
    text-align: center;
    padding: 40px 10px;
  }

  .fm-error {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    border-radius: 10px;
    color: #be123c;
    font-size: 13px;
    padding: 12px;
    margin-bottom: 16px;
  }

  /* Modals */
  .fm-modal-backdrop {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15,23,42,0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .fm-modal {
    background: var(--white);
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    width: 100%;
    max-width: 460px;
    padding: 24px;
    border: 1px solid var(--gray-200);
  }

  .fm-modal-title {
    font-family: 'Outfit', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: var(--gray-800);
    margin-bottom: 18px;
  }

  .fm-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }

  .fm-btn-secondary {
    background: var(--gray-100);
    color: var(--gray-600);
    border: none;
    border-radius: 9px;
    padding: 10px 16px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }

  .fm-btn-secondary:hover {
    background: var(--gray-200);
  }

  .fm-btn-danger {
    background: #dc2626;
    color: var(--white);
    border: none;
    border-radius: 9px;
    padding: 10px 16px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
  }

  .fm-btn-danger:hover {
    background: #b91c1c;
  }
`;

type FormationType = "licence" | "master" | "licence_excellence" | "master_excellence";

const formationPresets: Record<FormationType, { label: string; semesters: string[] }> = {
  licence: {
    label: "Licence",
    semesters: ["S1", "S2", "S3", "S4", "S5", "S6"]
  },
  master: {
    label: "Master",
    semesters: ["S1", "S2", "S3", "S4"]
  },
  licence_excellence: {
    label: "Licence (parcours d'excellence)",
    semesters: ["S5", "S6"]
  },
  master_excellence: {
    label: "Master (parcours d'excellence)",
    semesters: ["S1", "S2", "S3", "S4"]
  }
};

const parseFiliereNameAndType = (nom: string, semesters: string[]): { baseNom: string; type: FormationType } => {
  const suffixes: { type: FormationType; label: string }[] = [
    { type: "licence_excellence", label: "Licence (parcours d'excellence)" },
    { type: "master_excellence", label: "Master (parcours d'excellence)" },
    { type: "licence", label: "Licence" },
    { type: "master", label: "Master" },
  ];

  for (const s of suffixes) {
    const withSpace = ` - ${s.label}`;
    const withoutSpace = `-${s.label}`;
    if (nom.endsWith(withSpace)) {
      return {
        baseNom: nom.slice(0, -withSpace.length).trim(),
        type: s.type
      };
    }
    if (nom.endsWith(withoutSpace)) {
      return {
        baseNom: nom.slice(0, -withoutSpace.length).trim(),
        type: s.type
      };
    }
  }

  // Fallback if no matching suffix found
  let type: FormationType = "licence";
  if (semesters && semesters.length === 2 && semesters.includes("S5") && semesters.includes("S6")) {
    type = "licence_excellence";
  } else if (semesters && semesters.length <= 4) {
    type = "master";
  }
  return { baseNom: nom.trim(), type };
};

export default function FilieresModulesPage() {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedFiliereId, setSelectedFiliereId] = useState<number | null>(null);

  // Forms
  const [newFiliereNom, setNewFiliereNom] = useState("");
  const [newFiliereType, setNewFiliereType] = useState<FormationType>("licence");
  const [filiereSubmitting, setFiliereSubmitting] = useState(false);

  const [newModuleNom, setNewModuleNom] = useState("");
  const [newModuleSemestre, setNewModuleSemestre] = useState("");
  const [moduleSubmitting, setModuleSubmitting] = useState(false);

  // Edit states
  const [editingFiliere, setEditingFiliere] = useState<Filiere | null>(null);
  const [editFiliereNom, setEditFiliereNom] = useState("");
  const [editFiliereType, setEditFiliereType] = useState<FormationType>("licence");
  const [filiereUpdating, setFiliereUpdating] = useState(false);

  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editModuleNom, setEditModuleNom] = useState("");
  const [editModuleSemestre, setEditModuleSemestre] = useState("");
  const [moduleUpdating, setModuleUpdating] = useState(false);

  // Deletion states
  const [deletingFiliereId, setDeletingFiliereId] = useState<number | null>(null);
  const [deletingModuleId, setDeletingModuleId] = useState<number | null>(null);


  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/seances/academic/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Impossible de charger les données académiques.");
        return;
      }
      setFilieres(data.filieres || []);
      setModules(data.modules || []);
    } catch {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter modules based on selected filiere
  const filteredModules = useMemo(() => {
    if (selectedFiliereId === null) {
      return modules;
    }
    return modules.filter((m) => m.filiereId === selectedFiliereId);
  }, [modules, selectedFiliereId]);

  const selectedFiliereObj = useMemo(() => {
    return filieres.find((f) => f.id === selectedFiliereId) || null;
  }, [filieres, selectedFiliereId]);

  // Semester dropdown options for new module form
  const availableSemestersForNewModule = useMemo(() => {
    if (selectedFiliereId === null) return [];
    return selectedFiliereObj?.semesters || [];
  }, [selectedFiliereId, selectedFiliereObj]);

  // Set default semester when filiere changes
  useEffect(() => {
    if (availableSemestersForNewModule.length > 0) {
      setNewModuleSemestre(availableSemestersForNewModule[0]);
    } else {
      setNewModuleSemestre("");
    }
  }, [availableSemestersForNewModule]);


  // Filiere Create
  const handleCreateFiliere = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFiliereNom.trim()) return;
    setFiliereSubmitting(true);
    setError("");

    const preset = formationPresets[newFiliereType];
    const semesters = preset.semesters;
    const finalNom = `${newFiliereNom.trim()}-${preset.label}`;

    try {
      const res = await fetch(`${API_BASE}/seances/academic/filieres/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          nom: finalNom,
          semesters: semesters,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Impossible de créer la filière.");
        return;
      }
      setFilieres((prev) => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)));
      setNewFiliereNom("");
    } catch {
      setError("Erreur lors de la création de la filière.");
    } finally {
      setFiliereSubmitting(false);
    }
  };

  // Filiere Update Modal triggers
  const startEditFiliere = (filiere: Filiere) => {
    setEditingFiliere(filiere);
    const { baseNom, type } = parseFiliereNameAndType(filiere.nom, filiere.semesters);
    setEditFiliereNom(baseNom);
    setEditFiliereType(type);
  };

  const handleUpdateFiliere = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFiliere || !editFiliereNom.trim()) return;
    setFiliereUpdating(true);
    setError("");

    const preset = formationPresets[editFiliereType];
    const semesters = preset.semesters;
    const finalNom = `${editFiliereNom.trim()}-${preset.label}`;

    try {
      const res = await fetch(`${API_BASE}/seances/academic/filieres/${editingFiliere.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          nom: finalNom,
          semesters: semesters,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Impossible de modifier la filière.");
        return;
      }
      setFilieres((prev) =>
        prev.map((f) => (f.id === editingFiliere.id ? data : f)).sort((a, b) => a.nom.localeCompare(b.nom))
      );
      setEditingFiliere(null);
    } catch {
      setError("Erreur lors de la modification de la filière.");
    } finally {
      setFiliereUpdating(false);
    }
  };

  // Filiere Delete
  const handleDeleteFiliere = async () => {
    if (!deletingFiliereId) return;
    setError("");

    try {
      const res = await fetch(`${API_BASE}/seances/academic/filieres/${deletingFiliereId}/delete/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Impossible de supprimer la filière.");
        setDeletingFiliereId(null);
        return;
      }
      setFilieres((prev) => prev.filter((f) => f.id !== deletingFiliereId));
      if (selectedFiliereId === deletingFiliereId) {
        setSelectedFiliereId(null);
      }
      setDeletingFiliereId(null);
    } catch {
      setError("Erreur lors de la suppression de la filière.");
    }
  };

  // Module Create
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleNom.trim() || selectedFiliereId === null || !newModuleSemestre) return;
    setModuleSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/seances/academic/modules/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          nom: newModuleNom,
          filiere_id: selectedFiliereId,
          semestre: newModuleSemestre,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Impossible de créer le module.");
        return;
      }
      setModules((prev) => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)));
      setNewModuleNom("");
    } catch {
      setError("Erreur lors de la création du module.");
    } finally {
      setModuleSubmitting(false);
    }
  };

  // Module Edit Modal trigger
  const startEditModule = (module: Module) => {
    setEditingModule(module);
    setEditModuleNom(module.nom);
    setEditModuleSemestre(module.semestre);
  };

  const handleUpdateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || !editModuleNom.trim() || !editModuleSemestre) return;
    setModuleUpdating(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/seances/academic/modules/${editingModule.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          nom: editModuleNom,
          semestre: editModuleSemestre,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Impossible de modifier le module.");
        return;
      }
      setModules((prev) => prev.map((m) => (m.id === editingModule.id ? data : m)));
      setEditingModule(null);
    } catch {
      setError("Erreur lors de la modification du module.");
    } finally {
      setModuleUpdating(false);
    }
  };

  // Module Delete
  const handleDeleteModule = async () => {
    if (!deletingModuleId) return;
    setError("");

    try {
      const res = await fetch(`${API_BASE}/seances/academic/modules/${deletingModuleId}/delete/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Impossible de supprimer le module.");
        setDeletingModuleId(null);
        return;
      }
      setModules((prev) => prev.filter((m) => m.id !== deletingModuleId));
      setDeletingModuleId(null);
    } catch {
      setError("Erreur lors de la suppression du module.");
    }
  };

  const semestersForEditingModule = useMemo(() => {
    if (!editingModule) return [];
    const fil = filieres.find((f) => f.id === editingModule.filiereId);
    return fil?.semesters || [];
  }, [editingModule, filieres]);

  return (
    <>
      <style>{css}</style>
      <SidebarLayout activePage="filieres-modules" pageTitle="Filières & Modules">
        <div className="fm-root">
          <div className="fm-header">
            <h1 className="fm-title">Gestion des Filières & Modules</h1>
            <p className="fm-subtitle">Configurez les filières de formation et les modules correspondants de l'établissement.</p>
          </div>

          {error && <div className="fm-error">{error}</div>}

          {loading ? (
            <div className="fm-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
              <div className="spinner" style={{ width: "30px", height: "30px", borderWidth: "3px", borderColor: "rgba(3,125,167,0.2)", borderTopColor: "var(--blue)" }}></div>
              <p style={{ marginTop: "12px", color: "var(--gray-400)", fontSize: "14px" }}>Chargement des structures académiques...</p>
            </div>
          ) : (
            <div className="fm-grid">
              
              {/* FILIERES SECTION */}
              <div>
                <div className="fm-card">
                  <div className="fm-card-title">
                    <span>Filières ({filieres.length})</span>
                  </div>
                  
                  <div className="fm-list">
                    {filieres.map((filiere) => (
                      <div
                        key={filiere.id}
                        className={`fm-item ${selectedFiliereId === filiere.id ? "active" : ""}`}
                        onClick={() => setSelectedFiliereId(filiere.id)}
                      >
                        <div className="fm-item-main">
                          <div className="fm-item-name">{filiere.nom}</div>
                          <div className="fm-item-detail">
                            {filiere.semesters && filiere.semesters.length > 0 ? (
                              filiere.semesters.map((s) => (
                                <span key={s} className="fm-sem-badge">{s}</span>
                              ))
                            ) : (
                              <span style={{ fontSize: "11px", fontStyle: "italic", color: "var(--gray-400)" }}>Aucun semestre</span>
                            )}
                          </div>
                        </div>
                        <div className="fm-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="fm-btn-icon"
                            onClick={() => startEditFiliere(filiere)}
                            title="Modifier"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button
                            className="fm-btn-icon delete"
                            onClick={() => setDeletingFiliereId(filiere.id)}
                            title="Supprimer"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {filieres.length === 0 && (
                      <div className="fm-state-empty">Aucune filière trouvée.</div>
                    )}
                  </div>
                </div>

                <div className="fm-card">
                  <div className="fm-card-title">Ajouter une filière</div>
                  <form onSubmit={handleCreateFiliere} className="fm-form">
                    <div className="fm-field">
                      <label>Nom de la filière</label>
                      <input
                        placeholder="Ex: Licence Génie Logiciel"
                        value={newFiliereNom}
                        onChange={(e) => setNewFiliereNom(e.target.value)}
                        required
                      />
                    </div>
                    <div className="fm-field">
                      <label>Type de formation</label>
                      <select
                        value={newFiliereType}
                        onChange={(e) => setNewFiliereType(e.target.value as FormationType)}
                      >
                        <option value="licence">Licence (S1, S2, S3, S4, S5, S6)</option>
                        <option value="master">Master (S1, S2, S3, S4)</option>
                        <option value="licence_excellence">Licence (parcours d'excellence) (S5, S6)</option>
                        <option value="master_excellence">Master (parcours d'excellence) (S1, S2, S3, S4)</option>
                      </select>
                    </div>
                    <button type="submit" className="fm-btn" disabled={filiereSubmitting}>
                      {filiereSubmitting ? (
                        <>
                          <span className="spinner"></span>
                          Création...
                        </>
                      ) : "Créer la filière"}
                    </button>
                  </form>
                </div>
              </div>

              {/* MODULES SECTION */}
              <div>
                <div className="fm-card">
                  <div className="fm-card-title">
                    <span>
                      Modules {selectedFiliereObj ? `de "${selectedFiliereObj.nom}"` : "(Affiche Tout)"} ({filteredModules.length})
                    </span>
                    {selectedFiliereId !== null && (
                      <button
                        className="fm-btn-secondary"
                        style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "6px" }}
                        onClick={() => setSelectedFiliereId(null)}
                      >
                        Affiche Tout
                      </button>
                    )}
                  </div>

                  <div className="fm-list">
                    {filteredModules.map((module) => (
                      <div key={module.id} className="fm-item" style={{ cursor: "default" }}>
                        <div className="fm-item-main">
                          <div className="fm-item-name">{module.nom}</div>
                          <div className="fm-item-detail">
                            <span className="fm-sem-badge" style={{ background: "rgba(246,147,31,0.12)", color: "var(--orange)" }}>
                              {module.semestre}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--gray-400)", marginLeft: "4px" }}>
                              • {module.filiere}
                            </span>
                          </div>
                        </div>
                        <div className="fm-actions">
                          <button
                            className="fm-btn-icon"
                            onClick={() => startEditModule(module)}
                            title="Modifier"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button
                            className="fm-btn-icon delete"
                            onClick={() => setDeletingModuleId(module.id)}
                            title="Supprimer"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredModules.length === 0 && (
                      <div className="fm-state-empty">
                        {selectedFiliereId === null
                          ? "Aucun module enregistré."
                          : "Aucun module enregistré pour cette filière."}
                      </div>
                    )}
                  </div>
                </div>

                {selectedFiliereId !== null ? (
                  <div className="fm-card">
                    <div className="fm-card-title">Ajouter un module à "{selectedFiliereObj?.nom}"</div>
                    <form onSubmit={handleCreateModule} className="fm-form">
                      <div className="fm-field">
                        <label>Nom du module</label>
                        <input
                          placeholder="Ex: Analyse Numérique"
                          value={newModuleNom}
                          onChange={(e) => setNewModuleNom(e.target.value)}
                          required
                        />
                      </div>
                      <div className="fm-field">
                        <label>Semestre</label>
                        <select
                          value={newModuleSemestre}
                          onChange={(e) => setNewModuleSemestre(e.target.value)}
                          required
                        >
                          {availableSemestersForNewModule.map((sem) => (
                            <option key={sem} value={sem}>{sem}</option>
                          ))}
                          {availableSemestersForNewModule.length === 0 && (
                            <option value="">(Aucun semestre défini pour cette filière)</option>
                          )}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="fm-btn"
                        disabled={moduleSubmitting || availableSemestersForNewModule.length === 0}
                      >
                        {moduleSubmitting ? (
                          <>
                            <span className="spinner"></span>
                            Création...
                          </>
                        ) : "Créer le module"}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="fm-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "150px", background: "var(--gray-50)", borderStyle: "dashed" }}>
                    <p style={{ color: "var(--gray-400)", fontSize: "13.5px", textAlign: "center", maxWidth: "260px" }}>
                      Sélectionnez une filière à gauche pour pouvoir y ajouter de nouveaux modules.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* EDIT FILIERE MODAL */}
          {editingFiliere && (
            <div className="fm-modal-backdrop">
              <div className="fm-modal">
                <div className="fm-modal-title">Modifier la filière</div>
                <form onSubmit={handleUpdateFiliere} className="fm-form">
                  <div className="fm-field">
                    <label>Nom de la filière</label>
                    <input
                      value={editFiliereNom}
                      onChange={(e) => setEditFiliereNom(e.target.value)}
                      required
                    />
                  </div>
                  <div className="fm-field">
                    <label>Type de formation</label>
                    <select
                      value={editFiliereType}
                      onChange={(e) => setEditFiliereType(e.target.value as FormationType)}
                    >
                      <option value="licence">Licence (S1, S2, S3, S4, S5, S6)</option>
                      <option value="master">Master (S1, S2, S3, S4)</option>
                      <option value="licence_excellence">Licence (parcours d'excellence) (S5, S6)</option>
                      <option value="master_excellence">Master (parcours d'excellence) (S1, S2, S3, S4)</option>
                    </select>
                  </div>
                  <div className="fm-modal-actions">
                    <button type="button" className="fm-btn-secondary" onClick={() => setEditingFiliere(null)}>
                      Annuler
                    </button>
                    <button type="submit" className="fm-btn" disabled={filiereUpdating}>
                      {filiereUpdating ? (
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

          {/* EDIT MODULE MODAL */}
          {editingModule && (
            <div className="fm-modal-backdrop">
              <div className="fm-modal">
                <div className="fm-modal-title">Modifier le module</div>
                <form onSubmit={handleUpdateModule} className="fm-form">
                  <div className="fm-field">
                    <label>Nom du module</label>
                    <input
                      value={editModuleNom}
                      onChange={(e) => setEditModuleNom(e.target.value)}
                      required
                    />
                  </div>
                  <div className="fm-field">
                    <label>Semestre</label>
                    <select
                      value={editModuleSemestre}
                      onChange={(e) => setEditModuleSemestre(e.target.value)}
                      required
                    >
                      {semestersForEditingModule.map((sem) => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                  <div className="fm-modal-actions">
                    <button type="button" className="fm-btn-secondary" onClick={() => setEditingModule(null)}>
                      Annuler
                    </button>
                    <button type="submit" className="fm-btn" disabled={moduleUpdating}>
                      {moduleUpdating ? (
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

          {/* DELETE FILIERE CONFIRM MODAL */}
          {deletingFiliereId !== null && (
            <div className="fm-modal-backdrop">
              <div className="fm-modal" style={{ maxWidth: "400px" }}>
                <div className="fm-modal-title">Supprimer la filière</div>
                <p style={{ fontSize: "14px", color: "var(--gray-600)", lineHeight: "1.5" }}>
                  Êtes-vous sûr de vouloir supprimer cette filière ? Cette action est irréversible et échouera si des modules ou des étudiants y sont associés.
                </p>
                <div className="fm-modal-actions">
                  <button type="button" className="fm-btn-secondary" onClick={() => setDeletingFiliereId(null)}>
                    Annuler
                  </button>
                  <button type="button" className="fm-btn-danger" onClick={handleDeleteFiliere}>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DELETE MODULE CONFIRM MODAL */}
          {deletingModuleId !== null && (
            <div className="fm-modal-backdrop">
              <div className="fm-modal" style={{ maxWidth: "400px" }}>
                <div className="fm-modal-title">Supprimer le module</div>
                <p style={{ fontSize: "14px", color: "var(--gray-600)", lineHeight: "1.5" }}>
                  Êtes-vous sûr de vouloir supprimer ce module ? Cette action est irréversible et échouera si des séances de cours y sont associées.
                </p>
                <div className="fm-modal-actions">
                  <button type="button" className="fm-btn-secondary" onClick={() => setDeletingModuleId(null)}>
                    Annuler
                  </button>
                  <button type="button" className="fm-btn-danger" onClick={handleDeleteModule}>
                    Supprimer
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
