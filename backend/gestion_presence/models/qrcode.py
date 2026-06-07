from django.db import models
from django.utils import timezone

from .seance import Seance


class QRCode(models.Model):
    url_cible = models.URLField(max_length=500)
    token = models.CharField(max_length=255, unique=True)
    expiration = models.DateTimeField()
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    seance = models.OneToOneField(
        Seance,
        on_delete=models.CASCADE,
        related_name="qrcode",
    )

    class Meta:
        db_table = "qrcodes"
        ordering = ["-expiration"]

    def __str__(self) -> str:
        return f"QR {self.seance_id} - {self.token}"

    @property
    def est_expire(self) -> bool:
        return timezone.now() >= self.expiration
