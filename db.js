const Database = require('better-sqlite3');
const db = new Database('database.db');

// Active le respect des clés étrangères (désactivé par défaut dans SQLite)
db.pragma('foreign_keys = ON');

// Création de la table avec `username` UNIQUE
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  )
`).run();

// Table des rapports de mission, liée à l'utilisateur qui les envoie (Phase 3.1)
db.prepare(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`).run();

module.exports = db;