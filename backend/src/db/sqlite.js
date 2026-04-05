const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

let db;

const ensureDb = () => {
  if (db) return db;

  const varDir = path.resolve(__dirname, '..', '..', 'var');
  fs.mkdirSync(varDir, { recursive: true });

  const dbPath = process.env.SQLITE_DB_PATH || path.join(varDir, 'truckspot.db');
  db = new DatabaseSync(dbPath);

  // Pragmas
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Migrations (minimal, idempotent)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS truck_profiles (
      user_id TEXT PRIMARY KEY,
      truck_name TEXT NOT NULL,
      cuisine TEXT,
      description TEXT,
      phone TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      location_id TEXT NOT NULL,
      spot_number INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(date, location_id, spot_number),
      UNIQUE(date, location_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'EUR',
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_menu_items_user
      ON menu_items(user_id);

    CREATE INDEX IF NOT EXISTS idx_reservations_lookup
      ON reservations(date, location_id);
  `);

  return db;
};

module.exports = {
  getDb: ensureDb
};
