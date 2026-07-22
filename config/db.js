import Database from "better-sqlite3";

const db = new Database("database.db");

db.pragma("foreign_keys = ON");

// better-sqlite3 : db.prepare() n'accepte qu'UNE seule instruction SQL.
// Pour créer plusieurs tables d'un coup, on utilise db.exec().
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
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

export default db;
