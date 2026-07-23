import Database from "better-sqlite3";

const db = new Database("database.db");

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    password_hash TEXT,
    two_factor_secret TEXT,
    two_factor_enabled INTEGER DEFAULT 0,
    provider TEXT,
    provider_id TEXT
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Migration : ajoute les colonnes manquantes aux bases déjà existantes.
const userColumns = db
  .prepare("PRAGMA table_info(users)")
  .all()
  .map((c) => c.name);

const columnsToAdd = {
  two_factor_secret: "TEXT",
  two_factor_enabled: "INTEGER DEFAULT 0",
  email: "TEXT",
  provider: "TEXT",
  provider_id: "TEXT",
};

for (const [name, type] of Object.entries(columnsToAdd)) {
  if (!userColumns.includes(name)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${name} ${type}`);
  }
}

// Un compte est identifié par le COUPLE (provider, provider_id) :
// GitHub 12345 ≠ Facebook 12345. Cet index unique rend possible l'upsert
// ON CONFLICT(provider, provider_id) du login OAuth.
db.exec(
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id)",
);

// Les comptes locaux (provider NULL) gardent un username unique.
db.exec(
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_local_username ON users(username) WHERE provider IS NULL",
);

export default db;
