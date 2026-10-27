import os
import psycopg
from dotenv import load_dotenv

# Charge le fichier .env dans les variables d'environnement
load_dotenv()

# Lit les identifiants depuis l'environnement (jamais écrits dans le code)
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")
db_name = os.getenv("DB_NAME")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")

try:
    # "with" ferme automatiquement la connexion à la fin du bloc
    with psycopg.connect(
        host=db_host,
        port=db_port,
        dbname=db_name,
        user=db_user,
        password=db_password,
    ) as connexion:
        # Le curseur envoie les requêtes et récupère les réponses
        with connexion.cursor() as curseur:
            curseur.execute("SELECT COUNT(*) FROM administrateurs;")
            nombre = curseur.fetchone()[0]
            print(f"Connexion réussie. Nombre d'administrateurs : {nombre}")
except psycopg.Error as erreur:
    print(f"Erreur de connexion : {erreur}")