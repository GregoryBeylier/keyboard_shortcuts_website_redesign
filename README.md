# Le carnet des raccourcis

Template pédagogique : un site Vite en JavaScript et une API Flask. Les élèves documentent leurs raccourcis clavier dans des fichiers Markdown versionnés avec Git.

## Démarrer

Prérequis : Node.js **22.12+** (ou 24/26 LTS), npm et Python **3.10+**.

```bash
git clone <URL-DU-DEPOT>
cd raccourcis-template
```

Dans un premier terminal, à la racine du dépôt :

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
flask --app backend/app run --host 0.0.0.0 --port 5000 --debug
```

Dans un second terminal :

```bash
cd frontend
npm ci
npm run dev
```

Ouvrez **http://localhost:5173**. Vite transmet les requêtes `/api` à Flask : aucune configuration CORS supplémentaire n’est nécessaire. Le serveur Flask en mode debug est réservé au développement local.

## Les trois pages

- `#/` : sommaire et recherche par titre, description, touches ou catégorie.
- `#/nouveau` : formulaire de création. L’API écrit le fichier Markdown, puis la fiche s’ouvre.
- `#/raccourci/<slug>` : métadonnées et contenu Markdown rendu avec **Marked**, puis nettoyé avec **DOMPurify**.

## Organisation

```text
backend/
  app.py                 # Routes API, validation, lecture et création des fichiers
  requirements.txt       # Dépendances Python
content/
  *.md                   # Fiches des élèves : source de données et dossier à persister
frontend/
  index.html             # Structure commune
  vite.config.js         # Proxy vers Flask
  src/
    main.js              # Navigation, sommaire et affichage d’une fiche
    new-shortcut.js       # Formulaire
    api.js               # Appels HTTP et échappement du texte
    style.css            # Styles adaptatifs
```

Il n’y a pas de base de données. Chaque requête relit les fichiers : une modification manuelle est visible au prochain chargement de la page.

## Écrire une fiche à la main

Créez `content/mon-raccourci.md`. Le nom du fichier devient son identifiant dans l’URL : lettres minuscules ASCII, chiffres et tirets uniquement, sans espace ni accent.

```markdown
---
title: "Enregistrer le fichier"
description: "Sauvegarder le document en cours dans l’éditeur."
keys: "Ctrl + S"
category: "Éditeur"
---
## Utilisation

Appuyez sur **Ctrl + S** sous Windows/Linux, ou **Cmd + S** sous macOS.

### Illustration

![Le bouton Enregistrer](https://exemple.org/capture.png)

[Lire la documentation](https://exemple.org/documentation)
```

Les quatre métadonnées sont obligatoires, sous forme de textes non vides. Limites : `title` 120 caractères, `description` 300, `keys` 120, `category` 60. Mettez les valeurs entre guillemets pour éviter les ambiguïtés YAML, notamment avec `:`. Le corps après le second `---` contient du Markdown : listes, titres, liens, images, tableaux et blocs de code.

Remplacez les URL d’exemple par des URL réelles. Pour une image, utilisez une URL HTTPS pointant directement vers l’image ; son hébergeur doit autoriser son affichage externe. Le navigateur charge l’image : l’API ne la télécharge pas.

Une fiche invalide produit un message indiquant le fichier à corriger ; elle n’est pas ignorée silencieusement.

## Créer une fiche depuis le site

Le formulaire sépare les métadonnées du corps Markdown. Flask fabrique l’en-tête YAML, génère un nom à partir du titre et crée le fichier dans `content/`.

Par exemple, « Sélectionner tout » crée `content/selectionner-tout.md`. Si le nom existe, l’API répond `409` et demande un autre titre. Elle ne modifie ni ne supprime de fichier existant. Les requêtes sont limitées à 256 Kio.

## Contrat API

| Méthode | Route | Réponse |
| --- | --- | --- |
| GET | `/api/shortcuts` | Liste des métadonnées et des identifiants `slug` |
| GET | `/api/shortcuts/<slug>` | Métadonnées, `slug` et corps `content` |
| POST | `/api/shortcuts` | Crée une fiche ; répond `201` avec la fiche complète |

Corps JSON d’une création :

```json
{
  "title": "Sélectionner tout",
  "description": "Sélectionner le contenu du document actif.",
  "keys": "Ctrl + A",
  "category": "Éditeur",
  "content": "## Utilisation\n\nSur macOS, utilisez **Cmd + A**."
}
```

Les erreurs retournent `{ "error": "message" }` : notamment `400` pour un JSON incorrect, `404` pour une fiche absente, `409` pour un doublon, `413` pour un corps trop volumineux, `415` pour un contenu non JSON et `422` pour des champs invalides.

## Travail avec Git

Chaque élève peut créer sa branche, ajouter une fiche, puis proposer son travail :

```bash
git switch -c fiche/selectionner-tout
# Créer la fiche depuis le site ou dans un éditeur.
git status
git add content/selectionner-tout.md
git commit -m "Ajoute le raccourci sélectionner tout"
git push -u origin fiche/selectionner-tout
```

Ouvrez ensuite une merge request ou une pull request sur la plateforme choisie. En équipe, deux fiches distinctes donnent des changements indépendants ; modifier la même fiche permet de travailler la résolution de conflits.

Les fiches créées par l’API sont des fichiers locaux : leur création ne lance aucun commit et ne les envoie pas sur le dépôt distant.

## Démarrer avec Docker

Prérequis : Docker avec Docker Compose. Depuis la racine du dépôt :

```bash
docker compose up --build
```

Ouvrez **http://localhost:5173**. Pour arrêter les services et supprimer les conteneurs :

```bash
docker compose down
```

La configuration fournie est destinée au développement local :

- **frontend** : Node et Vite sur le port 5173, accessible uniquement depuis la machine hôte. Les dépendances sont installées avec `npm ci` à partir du fichier de verrouillage.
- **api** : Python et Flask sur le port interne 5000. Le frontend transmet `/api` à `http://api:5000` grâce à `API_PROXY_TARGET`. Dans un conteneur, `localhost` désigne ce conteneur lui-même.
- **Persistance** : `./content` est monté dans `/app/content` en lecture-écriture côté API. Les fiches créées restent présentes après suppression des conteneurs et sont visibles à Git sur l’hôte. Ce dossier doit rester accessible en écriture dans le conteneur.
- **Build** : les deux Dockerfiles utilisent la racine du dépôt comme contexte. Le backend conserve `/app/backend` et `/app/content` côte à côte. Le `.dockerignore` exclut notamment Git, les environnements locaux et les dépendances installées sur l’hôte.

Les sources sont copiées dans les images : après une modification du code ou des dépendances, relancez `docker compose up --build`. Les modifications des fiches Markdown sont visibles au prochain chargement, sans reconstruire les images.

Pour prolonger l’exercice, les élèves peuvent ajouter des montages des sources et le rechargement automatique. Un montage du frontend devra préserver les dépendances installées dans le conteneur, par exemple avec un volume séparé pour `/app/frontend/node_modules`.

`npm run build` produit `frontend/dist/`. `npm run preview` sert à prévisualiser ce build et ne reprend pas le proxy de développement configuré ici. Un déploiement de production nécessite un serveur de fichiers statiques, un reverse proxy `/api` et un serveur WSGI pour Flask ; cette configuration reste un prolongement possible du cours.

Le template n’inclut pas d’authentification : utilisez-le localement pour l’atelier. Un déploiement accessible à tous nécessiterait un contrôle d’accès à la création.

## Publier ce dépôt

Le dossier est déjà un dépôt Git local avec un commit initial. Depuis sa racine, après avoir créé un dépôt **vide** sur GitHub ou GitLab :

```bash
git remote add origin <URL-DU-DEPOT>
git push -u origin main
```

Les élèves pourront alors cloner cette URL. Ne publiez pas de secrets ni de données personnelles dans les fiches.

## Bibliothèques

- [Vite](https://vite.dev/guide/) pour le développement du frontend.
- [Flask](https://flask.palletsprojects.com/) pour l’API.
- [python-frontmatter](https://pypi.org/project/python-frontmatter/) pour lire et écrire les métadonnées YAML.
- [Marked](https://marked.js.org/) pour convertir le Markdown en HTML et [DOMPurify](https://github.com/cure53/DOMPurify) pour nettoyer le HTML avant affichage.
