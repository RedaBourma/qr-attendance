import base64
import io
from datetime import datetime, timedelta
from urllib.parse import urlencode

import qrcode
from qrcode.constants import ERROR_CORRECT_M


def build_scan_metadata(seance, token):
    cours = seance.cours
    module = cours.module
    qr = getattr(seance, "qrcode", None)

    return {
        "v": 1,
        "token": token,
        "seance_id": seance.id,
        "cours_id": cours.id,
        "module": module.nom,
        "module_id": module.id,
        "filiere": module.filiere.nom,
        "filiere_id": module.filiere_id,
        "niveau": "",
        "semestre": module.semestre,
        "salle": cours.salle or "",
        "date": seance.date_seance.isoformat(),
        "heure": f"{cours.heure_debut.strftime('%H:%M')}-{cours.heure_fin.strftime('%H:%M')}",
        "expires_at": qr.expiration.isoformat() if qr else None,
    }


def build_scan_url(frontend_base_url, token, metadata):
    base = frontend_base_url.rstrip("/")
    path = f"{base}/scan/{token}"
    public_query = urlencode(
        {
            "seance": metadata["seance_id"],
            "module": metadata["module"],
            "filiere": metadata["filiere"],
            "niveau": metadata["niveau"],
            "semestre": metadata["semestre"],
            "date": metadata["date"],
            "heure": metadata["heure"],
            "salle": metadata["salle"],
        }
    )
    return f"{path}?{public_query}"


def build_qr_payload(seance, token, frontend_base_url):
    metadata = build_scan_metadata(seance, token)
    scan_url = build_scan_url(frontend_base_url, token, metadata)

    return {
        **metadata,
        "scan_url": scan_url,
    }


def make_qr_image_base64(content, box_size=8):
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=box_size,
        border=2,
    )
    qr.add_data(content)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def find_available_time_slot(enseignant, module, jour, start_time):
    current = start_time

    for _ in range(120):
        from gestion_presence.models import Cours

        exists = Cours.objects.filter(
            module=module,
            enseignant=enseignant,
            jour=jour,
            heure_debut=current,
            actif=True,
        ).exists()

        if not exists:
            return current

        combined = datetime.combine(datetime.today(), current) + timedelta(minutes=1)
        current = combined.time()

    return start_time
