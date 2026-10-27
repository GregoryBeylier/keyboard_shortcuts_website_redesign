# Keyboard Shortcuts Website Redesign

Site de raccourcis clavier avec un back-office permettant de gérer les comptes administrateurs.

## Prérequis

- **Git**
- **Docker Desktop** (sous Windows, activer l'intégration WSL : Settings > Resources > WSL Integration > Ubuntu)
- Pour un lancement hors Docker : **Python 3.12+** et **Node 22**

## Installation

1. Cloner le dépôt :

   ```bash
   git clone <url-du-depot>
   cd keyboard_shortcuts_website_redesign
   ```

2. Créer le fichier de configuration à partir de l'exemple :

   ```bash
   cp .env.example .env
   ```

3. Renseigner les valeurs dans `.env` (voir la section Configuration).

4. Lancer l'ensemble des services :

   ```bash
   docker compose up -d --build
   ```

5. Vérifier que les services tournent :

   ```bash
   docker compose ps
   ```

   Les services `db`, `api` et `frontend` doivent être `running`.

Le frontend est accessible sur `http://127.0.0.1:5173`.

## Configuration

Le fichier `.env` (à la racine) contient les variables de connexion. Il n'est **jamais versionné** : il est ignoré par Git.

| Variable      | Rôle                                                              |
|---------------|-------------------------------------------------------------------|
| `DB_NAME`     | Nom de la base de données (`backoffice`)                          |
| `DB_USER`     | Rôle de connexion à la base                                       |
| `DB_PASSWORD` | Mot de passe du rôle (à choisir, long et unique)                  |
| `DB_HOST`     | Adresse de la base. `localhost` hors Docker, `db` dans Docker     |
| `DB_PORT`     | Port PostgreSQL (`5432`)                                          |

Dans Docker, le service `api` reçoit `DB_HOST=db` directement dans `compose.yaml`.

## Base de données

- Le moteur est **PostgreSQL 16**, lancé par le service `db` de Docker Compose.
- Au premier démarrage, le script `db/init.sql` crée la table `administrateurs` :
  - `id` : identifiant auto-incrémenté (clé primaire) ;
  - `identifiant` : texte unique ;
  - `mot_de_passe_hash` : mot de passe **haché** (jamais en clair) ;
  - `created_at` : date de création, remplie automatiquement.
- Les données sont conservées dans le volume Docker `db_data`, même si les conteneurs sont arrêtés.

## Créer le premier administrateur

Le compte administrateur ne se crée pas depuis le site. Il se crée avec le script `creer_admin.py`, lancé en local, la base étant démarrée :

```bash
python creer_admin.py
```

Le script demande l'identifiant, puis le mot de passe (saisi sans affichage). Le mot de passe est haché avec **argon2** avant d'être enregistré.

## Commandes utiles

| Action                                  | Commande                       |
|-----------------------------------------|--------------------------------|
| Lancer les services                     | `docker compose up -d --build` |
| Voir l'état                             | `docker compose ps`            |
| Voir les logs d'un service              | `docker compose logs api`      |
| Arrêter sans supprimer                  | `docker compose stop`          |
| Redémarrer après un arrêt               | `docker compose start`         |
| Arrêter et supprimer les conteneurs     | `docker compose down`          |

> **Attention** : `docker compose down -v` supprime aussi le volume `db_data`, donc **toutes les données de la base**. À utiliser seulement pour repartir de zéro.

## Dépannage

- **Le port 5432 est déjà utilisé** : PostgreSQL tourne peut-être sur WSL. L'arrêter avec `sudo systemctl stop postgresql`.
- **`docker` est introuvable dans WSL** : activer l'intégration WSL dans Docker Desktop, puis redémarrer Docker Desktop.
- **Erreur de connexion à la base depuis l'API** : vérifier que `DB_HOST` vaut `db` dans Docker, et que les valeurs de `.env` correspondent à celles de la base.
- **Mot de passe refusé (`password authentication failed`)** : le volume a été créé avec un ancien mot de passe. Le mot de passe du rôle se modifie avec `ALTER ROLE`, ou le volume se recrée avec `docker compose down -v` (cela efface les données).

## Structure du projet

- `backend/` : API Flask (Python), avec son `Dockerfile` et `requirements.txt`.
- `frontend/` : interface (Node), avec son `Dockerfile`.
- `db/` : script SQL d'initialisation de la base.
- `content/` : contenu monté dans l'API.
- `compose.yaml` : définition des services `db`, `api` et `frontend`.