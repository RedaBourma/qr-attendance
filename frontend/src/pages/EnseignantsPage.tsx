import { useEffect, useMemo, useState } from "react";
import SidebarLayout from "../components/Sidebar";
import { API_BASE } from "../config";

function EnseignantAvatar({ src, initials }: { src?: string | null; initials: string }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={() => setImgError(true)}
      />
    );
  }

  return <>{initials}</>;
}

interface Enseignant {
  id: number;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    profile_picture?: string | null;
  };
  cours_count: number;
  filieres?: Array<{ id: number; nom: string }>;
  modules?: Array<{ id: number; nom: string; filiere_id: number; semestre: string }>;
}

interface AcademicFiliere {
  id: number;
  nom: string;
  semesters: string[];
}

interface AcademicModule {
  id: number;
  nom: string;
  filiereId: number;
  filiere: string;
  semestre: string;
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

  .ens-form-card {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 14px;
    margin-bottom: 18px;
    padding: 16px;
  }

  .ens-form-title {
    color: var(--gray-800);
    font-family: 'Outfit', sans-serif;
    font-size: 16px;
    font-weight: 800;
    margin-bottom: 12px;
  }

  .ens-form {
    display: grid;
    grid-template-columns: repeat(5, minmax(140px, 1fr));
    gap: 12px;
  }

  .ens-field {
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 10px 12px;
  }

  .ens-field label {
    color: var(--gray-400);
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .ens-field input {
    background: transparent;
    border: none;
    color: var(--gray-800);
    font-family: inherit;
    font-size: 14px;
    outline: none;
  }

  .ens-form-actions {
    align-items: end;
    display: flex;
  }

  .ens-btn {
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

  .ens-btn:disabled {
    background: var(--gray-200);
    color: var(--gray-400);
    cursor: not-allowed;
  }

  @media (max-width: 860px) {
    .ens-header,
    .ens-form {
      display: grid;
      grid-template-columns: 1fr;
    }

    .ens-search {
      min-width: 100%;
    }
  }

  .ens-btn-action {
    border: none;
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 11.5px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }
  .ens-btn-action.edit {
    background: var(--blue-soft);
    color: var(--blue);
  }
  .ens-btn-action.edit:hover {
    background: var(--blue);
    color: white;
  }
  .ens-btn-action.delete {
    background: rgba(220,38,38,0.1);
    color: #dc2626;
  }
  .ens-btn-action.delete:hover {
    background: #dc2626;
    color: white;
  }

  .ens-modal-backdrop {
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
  .ens-modal {
    background: var(--white);
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 24px;
    border: 1px solid var(--gray-200);
  }

  .ens-form-inputs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }
  .ens-academic-sections {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 8px;
    border-top: 1px solid var(--gray-100);
    padding-top: 16px;
  }
  .ens-checkbox-group {
    background: var(--gray-50);
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    padding: 12px;
    max-height: 180px;
    overflow-y: auto;
  }
  .ens-checkbox-group-title {
    font-size: 11px;
    font-weight: 800;
    color: var(--gray-400);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .ens-checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ens-checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--gray-600);
    cursor: pointer;
  }
  .ens-checkbox-item input {
    cursor: pointer;
  }
  .ens-filiere-badge {
    display: inline-flex;
    border-radius: 999px;
    background: rgba(3,125,167,0.06);
    color: var(--blue);
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    margin-right: 4px;
    margin-bottom: 4px;
    border: 1px solid rgba(3,125,167,0.15);
  }
  .ens-modal-title {
    font-family: 'Outfit', sans-serif;
    font-size: 18px;
    font-weight: 800;
    color: var(--gray-800);
    margin-bottom: 16px;
  }
  .ens-modal-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .ens-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
  .ens-btn-secondary {
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
  .ens-btn-secondary:hover {
    background: var(--gray-200);
  }
  .ens-btn-danger {
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
  .ens-btn-danger:hover {
    background: #b91c1c;
  }
`;

export default function EnseignantsPage() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [allFilieres, setAllFilieres] = useState<AcademicFiliere[]>([]);
  const [allModules, setAllModules] = useState<AcademicModule[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Creation States
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
  });
  const [activeTab, setActiveTab] = useState<"manual" | "import">("manual");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    total: number;
    errors: string[];
  } | null>(null);
  const [selectedFilieres, setSelectedFilieres] = useState<number[]>([]);
  const [selectedModules, setSelectedModules] = useState<number[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  // Filtering for creation
  const filteredModules = useMemo(() => {
    if (selectedFilieres.length === 0) return [];
    return allModules.filter((m) => selectedFilieres.includes(m.filiereId));
  }, [allModules, selectedFilieres]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access");

      try {
        const [resEns, resAcad] = await Promise.all([
          fetch(`${API_BASE}/enseignants/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_BASE}/seances/academic/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const dataEns = await resEns.json();
        if (!resEns.ok) {
          setError(dataEns.message || "Impossible de charger les enseignants.");
          return;
        }
        setEnseignants((dataEns as EnseignantsResponse).enseignants);

        if (resAcad.ok) {
          const dataAcad = await resAcad.json();
          setAllFilieres(dataAcad.filieres || []);
          setAllModules(dataAcad.modules || []);
        }
      } catch {
        setError("Erreur de connexion avec le serveur.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFiliereToggle = (filiereId: number) => {
    setSelectedFilieres((prev) => {
      const isChecked = prev.includes(filiereId);
      if (isChecked) {
        const newFilieres = prev.filter((id) => id !== filiereId);
        setSelectedModules((prevModules) =>
          prevModules.filter((modId) => {
            const modObj = allModules.find((m) => m.id === modId);
            return modObj ? modObj.filiereId !== filiereId : true;
          })
        );
        return newFilieres;
      } else {
        return [...prev, filiereId];
      }
    });
  };

  const handleModuleToggle = (moduleId: number) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleImportExcel = async () => {
    if (!importFile) return;
    setImporting(true);
    setError("");
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const res = await fetch(`${API_BASE}/enseignants/import/`, {
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
        
        const token = localStorage.getItem("access");
        const refreshRes = await fetch(`${API_BASE}/enseignants/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setEnseignants(refreshData.enseignants);
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
      const res = await fetch(`${API_BASE}/enseignants/template/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_enseignants.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Impossible de télécharger le modèle.");
    }
  };

  const handleCreateEnseignant = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError("");

    const formData = new FormData();
    formData.append("nom", form.nom);
    formData.append("prenom", form.prenom);
    formData.append("email", form.email);
    formData.append("password", form.password);
    selectedFilieres.forEach((id) => formData.append("filiere_ids", id.toString()));
    selectedModules.forEach((id) => formData.append("module_ids", id.toString()));
    if (profilePicture) {
      formData.append("profile_picture", profilePicture);
    }

    try {
      const res = await fetch(`${API_BASE}/enseignants/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Impossible d'ajouter l'enseignant.");
        return;
      }

      setEnseignants((current) => [...current, data as Enseignant]);
      setForm({ nom: "", prenom: "", email: "", password: "" });
      setSelectedFilieres([]);
      setSelectedModules([]);
      setProfilePicture(null);
      
      // Reset file input element
      const fileInput = document.getElementById("profile-pic-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setCreating(false);
    }
  };

  // Editing States
  const [editingEnseignant, setEditingEnseignant] = useState<Enseignant | null>(null);
  const [editForm, setEditForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
  });
  const [editSelectedFilieres, setEditSelectedFilieres] = useState<number[]>([]);
  const [editSelectedModules, setEditSelectedModules] = useState<number[]>([]);
  const [editProfilePicture, setEditProfilePicture] = useState<File | null>(null);
  const [editRemovePicture, setEditRemovePicture] = useState(false);
  const [deletingEnseignantId, setDeletingEnseignantId] = useState<number | null>(null);

  // Filtering for editing
  const editFilteredModules = useMemo(() => {
    if (editSelectedFilieres.length === 0) return [];
    return allModules.filter((m) => editSelectedFilieres.includes(m.filiereId));
  }, [allModules, editSelectedFilieres]);

  const handleStartEdit = (enseignant: Enseignant) => {
    setEditingEnseignant(enseignant);
    setEditForm({
      nom: enseignant.user.nom,
      prenom: enseignant.user.prenom,
      email: enseignant.user.email,
      password: "",
    });
    setEditSelectedFilieres(enseignant.filieres ? enseignant.filieres.map((f) => f.id) : []);
    setEditSelectedModules(enseignant.modules ? enseignant.modules.map((m) => m.id) : []);
    setEditProfilePicture(null);
    setEditRemovePicture(false);
  };

  const handleEditFiliereToggle = (filiereId: number) => {
    setEditSelectedFilieres((prev) => {
      const isChecked = prev.includes(filiereId);
      if (isChecked) {
        const newFilieres = prev.filter((id) => id !== filiereId);
        setEditSelectedModules((prevModules) =>
          prevModules.filter((modId) => {
            const modObj = allModules.find((m) => m.id === modId);
            return modObj ? modObj.filiereId !== filiereId : true;
          })
        );
        return newFilieres;
      } else {
        return [...prev, filiereId];
      }
    });
  };

  const handleEditModuleToggle = (moduleId: number) => {
    setEditSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleUpdateEnseignant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnseignant) return;
    setUpdating(true);
    setError("");

    const formData = new FormData();
    formData.append("nom", editForm.nom);
    formData.append("prenom", editForm.prenom);
    formData.append("email", editForm.email);
    formData.append("password", editForm.password);
    editSelectedFilieres.forEach((id) => formData.append("filiere_ids", id.toString()));
    editSelectedModules.forEach((id) => formData.append("module_ids", id.toString()));
    if (editProfilePicture) {
      formData.append("profile_picture", editProfilePicture);
    }
    if (editRemovePicture) {
      formData.append("remove_profile_picture", "true");
    }

    try {
      const res = await fetch(`${API_BASE}/enseignants/${editingEnseignant.id}/update/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Impossible de modifier l'enseignant.");
        return;
      }

      setEnseignants((current) =>
        current.map((ens) => (ens.id === editingEnseignant.id ? (data as Enseignant) : ens))
      );
      setEditingEnseignant(null);
    } catch {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelete = (id: number) => {
    setDeletingEnseignantId(id);
  };

  const handleDeleteEnseignant = async () => {
    if (!deletingEnseignantId) return;
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/enseignants/${deletingEnseignantId}/delete/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Impossible de supprimer l'enseignant.");
        return;
      }

      setEnseignants((current) => current.filter((ens) => ens.id !== deletingEnseignantId));
      setDeletingEnseignantId(null);
    } catch {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setDeleting(false);
    }
  };

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

          <div className="ens-form-card">
            <div className="ens-tabs" style={{ display: "flex", gap: "16px", marginBottom: "18px", borderBottom: "1px solid var(--gray-200)", paddingBottom: "10px" }}>
              <button
                type="button"
                className={`ens-tab-btn ${activeTab === "manual" ? "active" : ""}`}
                onClick={() => setActiveTab("manual")}
                style={{
                  background: "none",
                  border: "none",
                  padding: "6px 12px",
                  fontSize: "14px",
                  fontWeight: activeTab === "manual" ? "800" : "500",
                  color: activeTab === "manual" ? "var(--blue)" : "var(--gray-600)",
                  borderBottom: activeTab === "manual" ? "2.5px solid var(--blue)" : "none",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Ajout manuel
              </button>
              <button
                type="button"
                className={`ens-tab-btn ${activeTab === "import" ? "active" : ""}`}
                onClick={() => setActiveTab("import")}
                style={{
                  background: "none",
                  border: "none",
                  padding: "6px 12px",
                  fontSize: "14px",
                  fontWeight: activeTab === "import" ? "800" : "500",
                  color: activeTab === "import" ? "var(--blue)" : "var(--gray-600)",
                  borderBottom: activeTab === "import" ? "2.5px solid var(--blue)" : "none",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Importation par liste
              </button>
            </div>

            {activeTab === "manual" ? (
              <form onSubmit={handleCreateEnseignant} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="ens-form-inputs">
                  <div className="ens-field">
                    <label>Nom</label>
                    <input value={form.nom} onChange={(event) => updateForm("nom", event.target.value)} required />
                  </div>
                  <div className="ens-field">
                    <label>Prenom</label>
                    <input value={form.prenom} onChange={(event) => updateForm("prenom", event.target.value)} required />
                  </div>
                  <div className="ens-field">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} />
                    <span style={{ fontSize: "9px", color: "var(--gray-400)", marginTop: "2px", lineHeight: "1.2" }}>
                      Optionnel (auto: p.nom@umi.ac.ma)
                    </span>
                  </div>
                  <div className="ens-field">
                    <label>Mot de passe</label>
                    <input type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} />
                    <span style={{ fontSize: "9px", color: "var(--gray-400)", marginTop: "2px", lineHeight: "1.2" }}>
                      Optionnel (auto: nom@prenom)
                    </span>
                  </div>
                  <div className="ens-field">
                    <label>Photo de profil</label>
                    <input
                      id="profile-pic-input"
                      type="file"
                      accept="image/*"
                      onChange={(event) => setProfilePicture(event.target.files?.[0] || null)}
                      style={{ fontSize: "12px", padding: "5px 0 0" }}
                    />
                  </div>
                </div>

                <div className="ens-academic-sections">
                  <div className="ens-checkbox-group">
                    <div className="ens-checkbox-group-title">Filières</div>
                    <div className="ens-checkbox-list">
                      {allFilieres.map((filiere) => (
                        <label key={filiere.id} className="ens-checkbox-item">
                          <input
                            type="checkbox"
                            checked={selectedFilieres.includes(filiere.id)}
                            onChange={() => handleFiliereToggle(filiere.id)}
                          />
                          {filiere.nom}
                        </label>
                      ))}
                      {allFilieres.length === 0 && (
                        <span style={{ fontSize: "12px", color: "var(--gray-400)" }}>Aucune filière disponible</span>
                      )}
                    </div>
                  </div>

                  <div className="ens-checkbox-group">
                    <div className="ens-checkbox-group-title">Modules</div>
                    <div className="ens-checkbox-list">
                      {filteredModules.map((module) => (
                        <label key={module.id} className="ens-checkbox-item">
                          <input
                            type="checkbox"
                            checked={selectedModules.includes(module.id)}
                            onChange={() => handleModuleToggle(module.id)}
                          />
                          <span>
                            {module.nom}{" "}
                            <span style={{ fontSize: "11px", color: "var(--gray-400)", fontWeight: "normal" }}>
                              ({module.filiere} - {module.semestre})
                            </span>
                          </span>
                        </label>
                      ))}
                      {filteredModules.length === 0 && (
                        <span style={{ fontSize: "12px", color: "var(--gray-400)" }}>
                          {selectedFilieres.length === 0
                            ? "Sélectionnez une filière pour voir ses modules"
                            : "Aucun module trouvé pour les filières sélectionnées"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="ens-btn" type="submit" disabled={creating} style={{ width: "auto", minWidth: "150px" }}>
                    {creating ? (
                      <>
                        <span className="spinner"></span>
                        Ajout...
                      </>
                    ) : "Ajouter"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="ens-import-panel">
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                  <div className="ens-field" style={{ border: "none", background: "transparent", padding: 0 }}>
                    <label style={{ marginBottom: "4px" }}>Fichier (.xlsx ou .csv)</label>
                    <input
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      style={{ fontSize: "12px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                  <button
                    className="ens-btn"
                    type="button"
                    disabled={importing || !importFile}
                    onClick={handleImportExcel}
                    style={{ width: "auto", minWidth: "150px" }}
                  >
                    {importing ? (
                      <>
                        <span className="spinner"></span>
                        Importation...
                      </>
                    ) : "Importer les enseignants"}
                  </button>
                  <button
                    className="ens-btn-secondary"
                    type="button"
                    onClick={handleDownloadTemplate}
                    style={{
                      border: "1px solid var(--gray-200)",
                      borderRadius: "9px",
                      background: "var(--white)",
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "800",
                      color: "var(--gray-600)"
                    }}
                  >
                    Télécharger le modèle
                  </button>
                </div>

                {importResult && (
                  <div className="et-import-results" style={{ marginTop: "18px", padding: "14px", border: "1px solid var(--gray-200)", borderRadius: "10px", background: "var(--gray-50)" }}>
                    <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--gray-800)", marginBottom: "8px" }}>Rapport d'importation</div>
                    <div style={{ fontSize: "13px", color: "var(--blue)" }}>
                      ✅ {importResult.success} / {importResult.total} enseignants importés avec succès.
                    </div>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "bold", color: "#be123c", marginTop: "10px" }}>
                          Erreurs rencontrées ({importResult.errors.length}) :
                        </div>
                        <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid rgba(220,38,38,0.1)", borderRadius: "6px", padding: "8px", background: "#fff1f2", marginTop: "6px" }}>
                          {importResult.errors.map((err, i) => (
                            <div style={{ fontSize: "11px", color: "#be123c", marginBottom: "4px" }} key={i}>
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

          <div className="ens-card">
            {loading ? (
              <div className="ens-state" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                <div className="spinner" style={{ width: "30px", height: "30px", borderWidth: "3px", borderColor: "rgba(3,125,167,0.2)", borderTopColor: "var(--blue)" }}></div>
                <p style={{ marginTop: "12px", color: "var(--gray-400)", fontSize: "14px" }}>Chargement des enseignants...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ens-state">Aucun enseignant trouve.</div>
            ) : (
              <table className="ens-table">
                <thead>
                  <tr>
                    <th>Enseignant</th>
                    <th>Filières</th>
                    <th>Email</th>
                    <th>Cours</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((enseignant) => {
                    const initials = [enseignant.user.prenom, enseignant.user.nom]
                      .filter(Boolean)
                      .map((part) => part[0].toUpperCase())
                      .join("") || "U";
                    return (
                      <tr key={enseignant.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: "var(--blue)",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                              overflow: "hidden",
                              border: "2.5px solid rgba(3,125,167,0.12)",
                              flexShrink: 0
                            }}>
                              <EnseignantAvatar src={enseignant.user.profile_picture} initials={initials} />
                            </div>
                            <div>
                              <div className="ens-name">{enseignant.user.prenom} {enseignant.user.nom}</div>
                            </div>
                          </div>
                        </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "250px" }}>
                          {enseignant.filieres && enseignant.filieres.length > 0 ? (
                            enseignant.filieres.map((f) => (
                              <span key={f.id} className="ens-filiere-badge">
                                {f.nom}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: "12px", color: "var(--gray-400)", fontStyle: "italic" }}>
                              Aucune filière
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{enseignant.user.email}</td>
                      <td>{enseignant.cours_count}</td>
                      <td><span className="ens-badge">Enseignant</span></td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="ens-btn-action edit"
                            onClick={() => handleStartEdit(enseignant)}
                          >
                            Modifier
                          </button>
                          <button
                            className="ens-btn-action delete"
                            onClick={() => handleConfirmDelete(enseignant.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          {/* Edit Teacher Modal */}
          {editingEnseignant && (
            <div className="ens-modal-backdrop">
              <div className="ens-modal">
                <div className="ens-modal-title">Modifier l'enseignant</div>
                <form className="ens-modal-form" onSubmit={handleUpdateEnseignant}>
                  <div className="ens-field">
                    <label>Nom</label>
                    <input
                      value={editForm.nom}
                      onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="ens-field">
                    <label>Prénom</label>
                    <input
                      value={editForm.prenom}
                      onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="ens-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="ens-field">
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
                  <div className="ens-field" style={{ gridColumn: "span 2" }}>
                    <label>Photo de profil</label>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "4px" }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          setEditProfilePicture(e.target.files?.[0] || null);
                          setEditRemovePicture(false);
                        }}
                        style={{ fontSize: "12px" }}
                      />
                      {editingEnseignant?.user.profile_picture && (
                        <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", textTransform: "none", color: "var(--gray-600)", fontWeight: "normal", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={editRemovePicture}
                            onChange={(e) => {
                              setEditRemovePicture(e.target.checked);
                              if (e.target.checked) setEditProfilePicture(null);
                            }}
                          />
                          Supprimer la photo actuelle
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Edit Checkbox Lists for academic details */}
                  <div className="ens-academic-sections">
                    <div className="ens-checkbox-group">
                      <div className="ens-checkbox-group-title">Filières</div>
                      <div className="ens-checkbox-list">
                        {allFilieres.map((filiere) => (
                          <label key={filiere.id} className="ens-checkbox-item">
                            <input
                              type="checkbox"
                              checked={editSelectedFilieres.includes(filiere.id)}
                              onChange={() => handleEditFiliereToggle(filiere.id)}
                            />
                            {filiere.nom}
                          </label>
                        ))}
                        {allFilieres.length === 0 && (
                          <span style={{ fontSize: "12px", color: "var(--gray-400)" }}>Aucune filière disponible</span>
                        )}
                      </div>
                    </div>

                    <div className="ens-checkbox-group">
                      <div className="ens-checkbox-group-title">Modules</div>
                      <div className="ens-checkbox-list">
                        {editFilteredModules.map((module) => (
                          <label key={module.id} className="ens-checkbox-item">
                            <input
                              type="checkbox"
                              checked={editSelectedModules.includes(module.id)}
                              onChange={() => handleEditModuleToggle(module.id)}
                            />
                            <span>
                              {module.nom}{" "}
                              <span style={{ fontSize: "11px", color: "var(--gray-400)", fontWeight: "normal" }}>
                                ({module.filiere} - {module.semestre})
                              </span>
                            </span>
                          </label>
                        ))}
                        {editFilteredModules.length === 0 && (
                          <span style={{ fontSize: "12px", color: "var(--gray-400)" }}>
                            {editSelectedFilieres.length === 0
                              ? "Sélectionnez une filière pour voir ses modules"
                              : "Aucun module trouvé pour les filières sélectionnées"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ens-modal-actions">
                    <button type="button" className="ens-btn-secondary" onClick={() => setEditingEnseignant(null)}>
                      Annuler
                    </button>
                    <button type="submit" className="ens-btn" disabled={updating} style={{ width: "auto" }}>
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
          {deletingEnseignantId !== null && (
            <div className="ens-modal-backdrop">
              <div className="ens-modal" style={{ maxWidth: "400px" }}>
                <div className="ens-modal-title">Confirmer la suppression</div>
                <p style={{ fontSize: "14px", color: "var(--gray-600)", marginBottom: "20px" }}>
                  Êtes-vous sûr de vouloir supprimer cet enseignant ? Cette action est irréversible et supprimera tous ses cours associés.
                </p>
                <div className="ens-modal-actions">
                  <button type="button" className="ens-btn-secondary" onClick={() => setDeletingEnseignantId(null)}>
                    Annuler
                  </button>
                  <button type="button" className="ens-btn-danger" disabled={deleting} onClick={handleDeleteEnseignant}>
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
        </div>
      </SidebarLayout>
    </>
  );
}
