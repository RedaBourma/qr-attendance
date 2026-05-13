from .user import User


class Admin(User):
    class Meta:
        proxy = True
        verbose_name = "Admin"
        verbose_name_plural = "Admins"
        ordering = ["nom", "prenom"]
