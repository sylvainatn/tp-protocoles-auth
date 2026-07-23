import Database from "better-sqlite3";

const db = new Database("database.db");

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    two_factor_secret TEXT,
    two_factor_enabled INTEGER DEFAULT 0
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

const userColumns = db
  .prepare("PRAGMA table_info(users)")
  .all()
  .map((c) => c.name);

if (!userColumns.includes("two_factor_secret")) {
  db.exec("ALTER TABLE users ADD COLUMN two_factor_secret TEXT");
}
if (!userColumns.includes("two_factor_enabled")) {
  db.exec("ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0");
}

export default db;
