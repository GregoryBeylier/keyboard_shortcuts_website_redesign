CREATE TABLE IF NOT EXISTS administrateurs (
    id                SERIAL PRIMARY KEY,
    identifiant       VARCHAR(50) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    created_at        TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
