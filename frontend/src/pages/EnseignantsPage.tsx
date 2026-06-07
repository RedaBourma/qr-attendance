import { useEffect, useMemo, useState } from "react";
import SidebarLayout from "../components/Sidebar";
import { API_BASE } from "../config";

interface Enseignant {
  id: number;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: string;
  };
  cours_count: number;
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
    max-width: 500px;
    padding: 24px;
    border: 1px solid var(--gray-200);
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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    const loadEnseignants = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/enseignants/`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Impossible de charger les enseignants.");
          return;
        }

        setEnseignants((data as EnseignantsResponse).enseignants);
      } catch {
        setError("Erreur de connexion avec le serveur.");
      } finally {
        setLoading(false);
      }
    };

    loadEnseignants();
  }, []);

  const updateForm = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateEnseignant = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/enseignants/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Impossible d'ajouter l'enseignant.");
        return;
      }

      setEnseignants((current) => [...current, data as Enseignant]);
      setForm({ nom: "", prenom: "", email: "", password: "" });
    } catch {
      setError("Erreur de connexion avec le serveur.");
    } finally {
      setCreating(false);
    }
  };

  const [editingEnseignant, setEditingEnseignant] = useState<Enseignant | null>(null);
  const [editForm, setEditForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
  });
  const [deletingEnseignantId, setDeletingEnseignantId] = useState<number | null>(null);

  const handleStartEdit = (enseignant: Enseignant) => {
    setEditingEnseignant(enseignant);
    setEditForm({
      nom: enseignant.user.nom,
      prenom: enseignant.user.prenom,
      email: enseignant.user.email,
      password: "",
    });
  };

  const handleUpdateEnseignant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnseignant) return;
    setError("");

    try {
      const res = await fetch(`${API_BASE}/enseignants/${editingEnseignant.id}/update/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify(editForm),
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
    }
  };

  const handleConfirmDelete = (id: number) => {
    setDeletingEnseignantId(id);
  };

  const handleDeleteEnseignant = async () => {
    if (!deletingEnseignantId) return;
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
            <div className="ens-form-title">Ajouter un enseignant</div>
            <form className="ens-form" onSubmit={handleCreateEnseignant}>
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
                  Optionnel (auto: prenom.nom@umi.ac.ma)
                </span>
              </div>
              <div className="ens-field">
                <label>Mot de passe</label>
                <input type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} />
                <span style={{ fontSize: "9px", color: "var(--gray-400)", marginTop: "2px", lineHeight: "1.2" }}>
                  Optionnel (auto: nom@prenom)
                </span>
              </div>
              <div className="ens-form-actions">
                <button className="ens-btn" type="submit" disabled={creating} style={{ marginBottom: "14px" }}>
                  {creating ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>

          <div className="ens-card">
            {loading ? (
              <div className="ens-state">Chargement des enseignants...</div>
            ) : filtered.length === 0 ? (
              <div className="ens-state">Aucun enseignant trouve.</div>
            ) : (
              <table className="ens-table">
                <thead>
                  <tr>
                    <th>Enseignant</th>
                    <th>Email</th>
                    <th>Cours</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((enseignant) => (
                    <tr key={enseignant.id}>
                      <td>
                        <div className="ens-name">{enseignant.user.prenom} {enseignant.user.nom}</div>
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
                  ))}
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
                  <div className="ens-modal-actions">
                    <button type="button" className="ens-btn-secondary" onClick={() => setEditingEnseignant(null)}>
                      Annuler
                    </button>
                    <button type="submit" className="ens-btn" style={{ width: "auto" }}>
                      Enregistrer
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
                  <button type="button" className="ens-btn-danger" onClick={handleDeleteEnseignant}>
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
