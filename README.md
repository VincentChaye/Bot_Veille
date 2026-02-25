# 🛡️ CyberWatch - AI-Powered Cybersecurity Intelligence Feed

CyberWatch est une application complète de veille en cybersécurité. Elle collecte automatiquement des articles, extrait les entités clés (NER) grâce au Machine Learning, et génère des synthèses via une Intelligence Artificielle locale, le tout présenté sur un dashboard responsive et moderne.

## ✨ Fonctionnalités

* **Scraping Automatisé :** Collecte d'articles depuis diverses sources de Threat Intelligence.
* **Traitement NLP (spaCy) :** Extraction automatique d'entités nommées (acteurs de la menace, malwares, CVE, etc.).
* **Synthèse par IA Locale (Ollama) :** Rédaction de résumés clairs et formatés en Markdown.
* **Dashboard Responsive :** Interface front-end moderne (Tailwind CSS) optimisée pour bureau et mobile, avec traduction intégrée.
* **100% Conteneurisé :** Déploiement facile et isolé via Docker.

## 🛠️ Technologies Utilisées

* **Backend :** Python 3.11, FastAPI, LlamaIndex, spaCy, BeautifulSoup.
* **Frontend :** HTML5, Vanilla JavaScript, Tailwind CSS, Nginx.
* **IA & Modèles :** Ollama (LLM local), HuggingFace Embeddings.
* **Infrastructure :** Docker & Docker Compose.

---

## 🚀 Guide d'Installation

### 1. Prérequis

**Pour Windows :**
* Docker Desktop (avec le backend WSL 2 activé).
* Ollama pour Windows (téléchargeable sur ollama.com).
* Git.

**Pour Linux (Ubuntu/Debian) :**
* Docker Engine & Docker Compose.
* Ollama pour Linux (`curl -fsSL https://ollama.com/install.sh | sh`).
* Git.

### 2. Configuration de l'IA (Ollama)
L'application utilise un modèle local pour rédiger les synthèses. Ouvrez un terminal sur votre machine hôte (pas dans Docker) et téléchargez le modèle léger :

```bash
ollama pull llama3.2:1b
```
*(Assurez-vous qu'Ollama tourne en arrière-plan).*

### 3. Cloner le projet

```bash
git clone [https://github.com/VOTRE_NOM/CyberWatch.git](https://github.com/VOTRE_NOM/CyberWatch.git)
cd CyberWatch
```

### 4. ⚠️ Configuration Spécifique (Windows / Linux)

#### Allocation de la mémoire (Windows uniquement)
Si vous êtes sur Windows avec WSL 2, Docker a besoin de suffisamment de RAM pour faire tourner les modèles de Machine Learning (spaCy, Embeddings). 

1. Créez un fichier `.wslconfig` dans votre dossier utilisateur (`C:\Users\VotreNom\.wslconfig`).
2. Ajoutez ceci pour allouer 8 Go de RAM (ajustez selon votre PC) :

```ini
[wsl2]
memory=8GB
```
3. Redémarrez WSL en tapant `wsl --shutdown` dans votre terminal, puis relancez Docker Desktop.

#### Configuration du réseau (Windows & Linux)
Pour que l'application soit accessible depuis votre réseau local (ex: sur votre téléphone via le même Wi-Fi) :

1. Trouvez l'adresse IP locale de votre ordinateur (ex: `192.168.1.50`).
2. Créez ou modifiez le fichier `frontend/config.js` et insérez votre IP :

```javascript
const CONFIG = {
    API_URL: "[http://192.168.](http://192.168.)X.X:8000" // Remplacez par votre véritable adresse IP locale
};
```

### 5. Lancer l'application
Construisez et démarrez les conteneurs avec Docker Compose :

```bash
docker compose up --build -d
```
*(Note pour Windows : préférez utiliser l'invite de commande standard `cmd` plutôt que PowerShell si vous rencontrez des erreurs).*

---

## 📖 Utilisation

Une fois les conteneurs démarrés, les services sont accessibles aux adresses suivantes :

* **Dashboard Web (Frontend) :** `http://localhost:8080` (ou `http://VOTRE_IP:8080` depuis un appareil mobile).
* **Documentation API (Backend) :** `http://localhost:8000/docs`.

### Lancer la collecte d'articles (Ingestion)
La base de données est vide au premier lancement. Pour déclencher le scraper et l'analyse par l'IA, exécutez le script d'ingestion directement dans le conteneur backend :

```bash
docker exec -it cyberwatch_backend python ingest.py
```
*Note : Le premier lancement peut prendre du temps car le conteneur doit télécharger le modèle français de spaCy et le modèle d'embeddings.*

---

## 📂 Architecture du Projet

```text
CyberWatch/
├── docker-compose.yml       # Orchestration des conteneurs
├── backend/                 # API FastAPI & Logique d'ingestion
│   ├── api.py               # Routes de l'API
│   ├── ingest.py            # Script principal de scraping
│   ├── rag.py               # Logique d'IA (LlamaIndex / Ollama)
│   ├── scraper.py           # Logique d'extraction web
│   ├── requirements.txt     # Dépendances Python
│   └── Dockerfile           # Configuration Docker du Backend
└── frontend/                # Interface Utilisateur Nginx
    ├── index.html           # Structure de la page
    ├── app.js               # Logique dynamique et appels API
    ├── config.js            # Configuration de l'URL de l'API
    ├── style.css            # Styles personnalisés
    └── Dockerfile           # Configuration Docker du Frontend
```