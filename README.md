# QR-Attendance System (Système de Gestion des Présences par QR Code)

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Django](https://img.shields.io/badge/Django-5.0-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

A modern, secure, real-time student attendance tracking application. Designed to simplify institutional attendance management using dynamic QR codes and anti-cheating verification mechanisms.

Un système moderne et sécurisé de suivi de présence des étudiants en temps réel. Conçu pour simplifier la gestion des présences dans les établissements via des QR codes dynamiques et des mécanismes anti-triche avancés.

---

## 🌐 Language Navigation (Navigation)
* [🇬🇧 English README](#-english)
* [🇫🇷 Version Française](#-français)

---

## 🇬🇧 English

### Table of Contents
1. [About the Project](#about-the-project)
2. [Tech Stack](#tech-stack)
3. [Key Features](#key-features)
4. [Security & Anti-Cheating Mechanisms](#security--anti-cheating-mechanisms)
5. [Repository Structure](#repository-structure)
6. [Prerequisites](#prerequisites)
7. [Installation & Setup](#installation--setup)
8. [Available Commands (Makefile)](#available-commands-makefile)
9. [API Endpoints Summary](#api-endpoints-summary)

---

### About the Project
**QR-Attendance** automates and secures student attendance tracking. Instructors generate dynamic, time-limited QR codes projected in the classroom. Students scan the QR code using their smartphones, which registers their attendance instantly in the database. 

To ensure the integrity of the data, the system includes multiple security layers that prevent students from sharing QR codes or checking in for their absent classmates.

---

### Tech Stack
* **Frontend:** React 19 (TypeScript), Vite, Tailwind CSS, Axios, Recharts (for dashboard analytics)
* **Backend:** Django 5.0, Django REST Framework (DRF), Django Channels & Daphne (for real-time WebSockets communication), SimpleJWT (Token Authentication)
* **Database:** PostgreSQL 15
* **Containerization:** Docker & Docker Compose

---

### Key Features
* **Role-Based Access Control (RBAC):**
  * **Administrators:** Can manage students, teachers, majors/departments (Filières), modules, and courses. They also manage global academic settings (such as transitioning semesters/years) and access overall attendance dashboards.
  * **Teachers (Enseignants):** Plan sessions, initiate QR code generation, toggle and customize geolocation constraints (max distance), track present/absent students in real-time, and download attendance lists as Excel/CSV.
  * **Students (Etudiants):** Access the scanning page to submit their presence.
* **Real-time Live Attendance Monitoring:** Displays live updates of students checking into class via WebSocket connections.
* **Import/Export Data:** Seamlessly import student or teacher databases via Excel templates.

---

### Security & Anti-Cheating Mechanisms
* **Dynamic & Short-Lived QR Codes:** The QR code rotates or expires after a configurable duration (default: 10 minutes) preventing post-class registration.
* **Geofencing (GPS Verification):** When activated, the system calculates the distance (using the Haversine formula) between the student's and the teacher's current coordinates. Registration is blocked if the student is outside the specified radius (e.g. 20 meters).
* **One Scan Per Device (Device Binding):** Attaches a unique `device_uuid` to each check-in. If a device has already registered a student, it is blocked from registering anyone else during that session.
* **Academic Enrolment Checks:** Validates that the student is enrolled in the matching major, semester, and registered in the specific module.
* **Massar Code & Name Verification:** Ensures the user's name matches the provided institutional Massar code.

---

### Repository Structure
```
qr-attendance/
├── backend/             # Django Backend API
│   ├── core/            # Django main configuration
│   ├── gestion_presence/# Core business logic, models, views, and services
│   └── requirements.txt # Python dependencies
├── frontend/            # React + Vite Frontend
│   ├── src/             # Application source code
│   └── package.json     # Node packages & scripts
├── docker-compose.yml   # Production Docker setup
├── docker-compose.dev.yml # Development Docker setup (volumes mapping, hot reload)
├── Makefile             # Shorthand commands for development tasks
└── .env.exemple         # Environment variables template
```

---

### Prerequisites
Make sure you have the following installed on your machine:
* [Docker](https://www.docker.com/) (with Docker Compose)
* [GNU Make](https://www.gnu.org/software/make/) (optional, but highly recommended for using the Makefile shortcuts)

---

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/RedaBourma/qr-attendance.git
cd qr-attendance
```

#### 2. Configure Environment Variables
Copy `.env.exemple` to `.env` and fill in the values:
```bash
cp .env.exemple .env
```
Ensure you change the placeholder credentials for production:
* `POSTGRES_PASSWORD`
* `DJANGO_SECRET_KEY` (minimum 50 random characters)
* `HMAC_KEY` (minimum 32 characters, used for secure hashing)

#### 3. Start Development Environment
Build and run the containers using the Makefile shortcut:
```bash
make build
```
This command starts three containers:
* **Frontend:** Accessible at `http://localhost:3000`
* **Backend:** Accessible at `http://localhost:8000`
* **PostgreSQL Database:** Accessible on host port `5433`

#### 4. Run Database Migrations
Apply Django migrations inside the running backend container:
```bash
make migrate
```

#### 5. Create an Admin Account
To access the administrator features, generate a Django superuser:
```bash
make superuser
```
Follow the prompt in your terminal to set the email and password.

---

### Available Commands (Makefile)
The project includes a `Makefile` to simplify command execution:

| Command | Action |
|---|---|
| `make dev` | Spin up dev containers. |
| `make build` | Rebuild and spin up dev containers. |
| `make down` | Stop all running containers. |
| `make reset` | Stop containers and remove PostgreSQL volumes (Warning: resets database). |
| `make migrate` | Run database migrations. |
| `make superuser`| Create a Django administrator. |
| `make shell` | Open Python terminal inside Django environment. |
| `make psql` | Open PostgreSQL client terminal. |
| `make logs` | Stream logs from all containers. |
| `make logs-back`| Stream logs from the backend container only. |
| `make logs-front`| Stream logs from the frontend container only. |
| `make ps` | List status of all active containers. |

---

### API Endpoints Summary

#### Authentication
* `POST /api/login/` - User authentication (returns JWT access/refresh tokens).
* `GET /api/me/` - Retrieve logged-in user profile details.
* `POST /api/me/change-password/` - Update user password.
* `POST /api/me/switch-role/` - Toggle active user role.

#### Attendance & QR Sessions
* `POST /api/seances/generate-qr/` - Initialize a QR attendance session for a course.
* `GET /api/qrcode/current/` - Get active session QR information.
* `GET /api/qrcode/<seance_id>/` - Fetch details & real-time present/absent student list for a session.
* `POST /api/qrcode/<seance_id>/close/` - Close a QR code attendance session.
* `GET /api/qrcode/<seance_id>/export/` - Export attendance sheets.
* `GET /api/scan/<token>/` - Fetch active lesson details before scanning.
* `POST /api/scan/<token>/submit/` - Student scans QR and registers presence (location & device uuid validated here).

#### Management
* `/api/etudiants/` - CRUD endpoints for student accounts & Massar profiles, batch import.
* `/api/enseignants/` - CRUD endpoints for teachers, template downloads, batch import.
* `/api/seances/academic/` - Manage majors, course modules, schedules, and semester resets.

---
---

## 🇫🇷 Français

### Table des matières
1. [À propos du projet](#à-propos-du-projet-1)
2. [Stack Technique](#stack-technique-1)
3. [Fonctionnalités principales](#fonctionnalités-principales-1)
4. [Mécanismes de sécurité & Anti-triche](#mécanismes-de-sécurité--anti-triche-1)
5. [Structure du Projet](#structure-du-projet)
6. [Prérequis](#prérequis-1)
7. [Installation & Configuration](#installation--configuration-1)
8. [Commandes Disponibles (Makefile)](#commandes-disponibles-makefile)
9. [Résumé des Points d'Accès API](#résumé-des-points-daccès-api)

---

### À propos du projet
**QR-Attendance** automatise et sécurise l'enregistrement de la présence des étudiants. Les enseignants génèrent un QR code dynamique, projeté dans la salle de classe pour une durée limitée. Les étudiants scannent ce code à l'aide de leur smartphone pour valider instantanément leur présence dans la base de données.

Afin de garantir l'authenticité des feuilles de présence, le système intègre plusieurs barrières de sécurité empêchant le partage de codes et la validation à distance.

---

### Stack Technique
* **Frontend :** React 19 (TypeScript), Vite, Tailwind CSS, Axios, Recharts (analyses graphiques)
* **Backend :** Django 5.0, Django REST Framework (DRF), Django Channels & Daphne (communication WebSocket temps réel), SimpleJWT (authentification)
* **Base de données :** PostgreSQL 15
* **Conteneurisation :** Docker & Docker Compose

---

### Fonctionnalités principales
* **Gestion des Rôles (RBAC) :**
  * **Administrateurs :** Gestion complète des étudiants, enseignants, filières, modules et cours. Ils gèrent également les transitions de semestres et années, et ont accès aux statistiques globales.
  * **Enseignants :** Création de séances de cours, génération de codes QR, activation/configuration des contraintes géographiques, suivi en temps réel des arrivées et exportation des fiches de présence sous Excel/CSV.
  * **Étudiants :** Accès à l'interface de numérisation pour valider leur présence.
* **Suivi en temps réel :** Mise à jour instantanée de la liste de présence via WebSockets dès qu'un étudiant valide son scan.
* **Import/Export de données :** Importation massive d'étudiants ou d'enseignants via des fichiers modèles Excel.

---

### Mécanismes de sécurité & Anti-triche
* **QR Codes Dynamiques et Temporaires :** Les QR codes expirent automatiquement après une durée définie (par défaut : 10 minutes), empêchant les scans tardifs hors de la classe.
* **Géolocalisation & Geofencing :** Si activé, le système calcule la distance géographique (formule de Haversine) entre l'étudiant et l'enseignant. Si la distance dépasse le rayon limite (ex: 20 mètres), la présence est refusée.
* **Appareil unique (Device Binding) :** Chaque scan est lié à un `device_uuid` unique. Si un téléphone a déjà validé la présence d'un étudiant, il ne pourra pas en valider un autre pour la même séance.
* **Vérification d'Inscription :** L'application vérifie si l'étudiant appartient bien à la filière, au semestre et au module correspondant au cours.
* **Validation d'Identité :** Normalisation et comparaison des noms saisis avec le code Massar fourni pour éviter l'usurpation d'identité.

---

### Structure du Projet
```
qr-attendance/
├── backend/             # API Django
│   ├── core/            # Configuration générale Django
│   ├── gestion_presence/# Modèles, vues et services (logique métier)
│   └── requirements.txt # Dépendances Python
├── frontend/            # Application React + Vite
│   ├── src/             # Code source de l'interface
│   └── package.json     # Scripts et modules npm
├── docker-compose.yml   # Configuration Docker
├── docker-compose.dev.yml # Volumes et hot-reload pour le développement
├── Makefile             # Raccourcis de commandes pour faciliter le développement
└── .env.exemple         # Modèle pour les variables d'environnement
```

---

### Prérequis
Assurez-vous d'avoir installé sur votre machine :
* [Docker](https://www.docker.com/) (avec Docker Compose)
* [GNU Make](https://www.gnu.org/software/make/) (optionnel, mais fortement recommandé pour utiliser le Makefile)

---

### Installation & Configuration

#### 1. Cloner le dépôt
```bash
git clone https://github.com/RedaBourma/qr-attendance.git
cd qr-attendance
```

#### 2. Configurer les variables d'environnement
Copiez le fichier `.env.exemple` vers `.env` et ajustez les valeurs :
```bash
cp .env.exemple .env
```
Assurez-vous de modifier ces variables pour vos environnements :
* `POSTGRES_PASSWORD`
* `DJANGO_SECRET_KEY` (minimum 50 caractères aléatoires)
* `HMAC_KEY` (minimum 32 caractères, pour la sécurisation des signatures de jetons)

#### 3. Lancer l'environnement de développement
Construisez et lancez les conteneurs :
```bash
make build
```
Cette commande lance les trois services essentiels :
* **Frontend :** Accessible sur `http://localhost:3000`
* **Backend :** Accessible sur `http://localhost:8000`
* **Base de données :** PostgreSQL écoute sur le port hôte `5433`

#### 4. Exécuter les migrations de base de données
Appliquez les schémas dans la base PostgreSQL :
```bash
make migrate
```

#### 5. Créer un compte administrateur
Créez un compte superutilisateur pour accéder au panel d'administration :
```bash
make superuser
```
Saisissez l'e-mail et le mot de passe demandés dans la console.

---

### Commandes Disponibles (Makefile)
Le fichier `Makefile` contient plusieurs alias utiles :

| Commande | Action |
|---|---|
| `make dev` | Démarre les services de développement. |
| `make build` | Reconstruit les images et démarre les services. |
| `make down` | Arrête et supprime les conteneurs en cours d'exécution. |
| `make reset` | Supprime les conteneurs et vide la base de données (Volume PostgreSQL). |
| `make migrate` | Applique les migrations de base de données. |
| `make superuser`| Crée un administrateur Django. |
| `make shell` | Ouvre une console Python interactive Django. |
| `make psql` | Ouvre un terminal client PostgreSQL. |
| `make logs` | Affiche les logs de tous les conteneurs en temps réel. |
| `make logs-back`| Affiche uniquement les logs du backend. |
| `make logs-front`| Affiche uniquement les logs du frontend. |
| `make ps` | Affiche l'état des conteneurs actifs. |

---

### Résumé des Points d'Accès API

#### Authentification
* `POST /api/login/` - Connexion de l'utilisateur (retourne les jetons JWT).
* `GET /api/me/` - Informations sur le profil utilisateur connecté.
* `POST /api/me/change-password/` - Modification du mot de passe.
* `POST /api/me/switch-role/` - Commutation du rôle actif de l'utilisateur.

#### Présence & Sessions QR Code
* `POST /api/seances/generate-qr/` - Initialise une séance de présence par QR Code pour un cours.
* `GET /api/qrcode/current/` - Récupère les données de la séance QR active.
* `GET /api/qrcode/<seance_id>/` - Détails de la séance et liste en temps réel des présents/absents.
* `POST /api/qrcode/<seance_id>/close/` - Clôture de la séance de présence.
* `GET /api/qrcode/<seance_id>/export/` - Exporte les feuilles de présence.
* `GET /api/scan/<token>/` - Récupère les métadonnées du cours avant validation.
* `POST /api/scan/<token>/submit/` - Validation de présence (vérification de la position et de l'appareil unique).

#### Administration
* `/api/etudiants/` - CRUD, importation de profils étudiants (fichiers Excel), gestion Massar.
* `/api/enseignants/` - CRUD, téléchargement de modèles Excel, importation d'enseignants.
* `/api/seances/academic/` - Gestion des filières, modules, cours et transitions de semestres.
