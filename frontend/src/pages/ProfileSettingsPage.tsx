import { useEffect, useMemo, useState } from "react";
import SidebarLayout from "../components/Sidebar";
import { API_BASE } from "../config";

const css = `
  .profile-shell {
    max-width: 760px;
  }

  .profile-panel {
    background: #fff;
    border: 1px solid #dde3ee;
    border-radius: 8px;
    padding: 24px;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 22px;
    align-items: center;
  }

  .profile-avatar {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: #037da7;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Outfit', sans-serif;
    font-size: 30px;
    font-weight: 700;
    overflow: hidden;
    border: 3px solid rgba(3,125,167,0.16);
  }

  .profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .profile-title {
    margin: 0 0 6px;
    color: #1a2236;
    font-family: 'Outfit', sans-serif;
    font-size: 20px;
  }

  .profile-subtitle {
    margin: 0 0 18px;
    color: #64748b;
    font-size: 14px;
  }

  .profile-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .profile-file {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 38px;
    padding: 0 14px;
    border-radius: 8px;
    background: #037da7;
    color: #fff;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
  }

  .profile-file input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .profile-remove {
    height: 38px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid #dde3ee;
    background: #fff;
    color: #4a5568;
    font-weight: 600;
    cursor: pointer;
  }

  .profile-message {
    margin-top: 14px;
    color: #4a5568;
    font-size: 13px;
  }

  @media (max-width: 640px) {
    .profile-panel {
      grid-template-columns: 1fr;
      justify-items: start;
    }
  }
`;

interface StoredUser {
  nom?: string;
  prenom?: string;
  email?: string;
  profile_picture?: string | null;
}

function getStoredUser(): StoredUser {
  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return {};
  }

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return {};
  }
}

function getInitials(user: StoredUser) {
  return [user.prenom, user.nom]
    .filter(Boolean)
    .map((part) => part![0].toUpperCase())
    .join("") || "U";
}

export default function ProfileSettingsPage() {
  const [user, setUser] = useState<StoredUser>(() => getStoredUser());
  const [message, setMessage] = useState("");
  const initials = useMemo(() => getInitials(user), [user]);

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  const updateStoredUser = (nextUser: StoredUser) => {
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  };

  const handleUpload = async (file?: File) => {
    if (!file) {
      return;
    }

    const token = localStorage.getItem("access");
    const formData = new FormData();
    formData.append("profile_picture", file);
    setMessage("Upload en cours...");

    const res = await fetch(`${API_BASE}/me/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Impossible de mettre a jour la photo.");
      return;
    }

    updateStoredUser(data.user);
    setMessage("Photo de profil mise a jour.");
  };

  const handleRemove = async () => {
    const token = localStorage.getItem("access");
    setMessage("Suppression en cours...");

    const res = await fetch(`${API_BASE}/me/`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.message || "Impossible de supprimer la photo.");
      return;
    }

    updateStoredUser(data.user);
    setMessage("Photo de profil supprimee.");
  };

  return (
    <SidebarLayout activePage="parametres" pageTitle="Parametres">
      <style>{css}</style>
      <div className="profile-shell">
        <section className="profile-panel">
          <div className="profile-avatar">
            {user.profile_picture ? <img src={user.profile_picture} alt="" /> : initials}
          </div>

          <div>
            <h1 className="profile-title">{[user.prenom, user.nom].filter(Boolean).join(" ") || "Utilisateur"}</h1>
            <p className="profile-subtitle">{user.email || "Compte utilisateur"}</p>
            <div className="profile-actions">
              <label className="profile-file">
                Choisir une photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleUpload(event.target.files?.[0])}
                />
              </label>
              {user.profile_picture && (
                <button className="profile-remove" type="button" onClick={handleRemove}>
                  Supprimer
                </button>
              )}
            </div>
            {message && <div className="profile-message">{message}</div>}
          </div>
        </section>
      </div>
    </SidebarLayout>
  );
}
