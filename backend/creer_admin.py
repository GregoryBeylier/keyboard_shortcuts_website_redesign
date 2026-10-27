import os
import getpass
import psycopg
from dotenv import load_dotenv
from argon2 import PasswordHasher

# Charge le fichier .env dans les variables d'environnement
load_dotenv()

# Lit les identifiants de connexion depuis l'environnement
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")
db_name = os.getenv("DB_NAME")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")

# Saisie de l'identifiant et du mot de passe
identifiant = input("Identifiant du nouvel administrateur : ").strip()
# getpass ne fait pas apparaître le mot de passe à l'écran
mot_de_passe = getpass.getpass("Mot de passe : ")

if not identifiant or not mot_de_passe:
    print("L'identifiant et le mot de passe sont obligatoires.")
    raise SystemExit(1)

# Le mot de passe est haché AVANT d'aller dans la base.
# Seul le hachage sera enregistré, jamais le mot de passe en clair.
mot_de_passe_hash = PasswordHasher().hash(mot_de_passe)

try:
    # "with" ferme automatiquement la connexion à la fin du bloc
    with psycopg.connect(
        host=db_host,
        port=db_port,
        dbname=db_name,
        user=db_user,
        password=db_password,
    ) as connexion:
        # Le curseur envoie la requête à la base
        with connexion.cursor() as curseur:
            # %s est remplacé par les valeurs du tuple : pas d'injection SQL
            curseur.execute(
                "INSERT INTO administrateurs (identifiant, mot_de_passe_hash) VALUES (%s, %s)",
                (identifiant, mot_de_passe_hash),
            )
        # Valide l'insertion : sans commit, rien n'est enregistré
        connexion.commit()
        print(f"Administrateur '{identifiant}' créé.")
except psycopg.errors.UniqueViolation:
    # Cas où l'identifiant est déjà pris (contrainte UNIQUE)
    print("Cet identifiant existe déjà.")
except psycopg.Error as erreur:
    print(f"Erreur de base de données : {erreur}")
