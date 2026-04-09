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
      status TEXT NOT NULL DEFAULT 'confirmed',
      expires_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(date, location_id, spot_number),
      UNIQUE(date, location_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS reservation_payments (
      id TEXT PRIMARY KEY,
      reservation_id TEXT NOT NULL UNIQUE,
      provider TEXT NOT NULL,
      session_id TEXT NOT NULL UNIQUE,
      amount_ron INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
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

    CREATE INDEX IF NOT EXISTS idx_reservation_payments_session
      ON reservation_payments(session_id);
  `);

  // Backfill schema on existing DBs (SQLite doesn't support IF NOT EXISTS for ADD COLUMN reliably)
  const addColumnIfMissing = (table, column, definition) => {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
    if (cols.includes(column)) return;
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  };

  const getColumns = (table) => {
    try {
      return db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
    } catch {
      return [];
    }
  };

  const migrateReservationPaymentsToRon = () => {
    // Early versions used amount_cents; we store whole RON now.
    const cols = getColumns('reservation_payments');
    if (!cols.includes('amount_cents')) return;

    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec('BEGIN');
    try {
      db.exec('DROP TABLE IF EXISTS reservation_payments_new;');

      db.exec(`
        CREATE TABLE reservation_payments_new (
          id TEXT PRIMARY KEY,
          reservation_id TEXT NOT NULL UNIQUE,
          provider TEXT NOT NULL,
          session_id TEXT NOT NULL UNIQUE,
          amount_ron INTEGER NOT NULL,
          currency TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY(reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
        );
      `);

      const hasAmountRon = cols.includes('amount_ron');
      const selectAmountRon = hasAmountRon
        ? `COALESCE(amount_ron, CAST(ROUND(amount_cents / 100.0) AS INTEGER), 0)`
        : `CAST(ROUND(amount_cents / 100.0) AS INTEGER)`;

      db.exec(`
        INSERT INTO reservation_payments_new
          (id, reservation_id, provider, session_id, amount_ron, currency, status, created_at, updated_at)
        SELECT
          id, reservation_id, provider, session_id,
          ${selectAmountRon} as amount_ron,
          currency, status, created_at, updated_at
        FROM reservation_payments;
      `);

      db.exec('DROP TABLE reservation_payments;');
      db.exec('ALTER TABLE reservation_payments_new RENAME TO reservation_payments;');
      db.exec('CREATE INDEX IF NOT EXISTS idx_reservation_payments_session ON reservation_payments(session_id);');

      db.exec('COMMIT');
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch { /* ignore */ }
      throw e;
    } finally {
      db.exec('PRAGMA foreign_keys = ON;');
    }
  };

  try {
    addColumnIfMissing('reservations', 'status', "TEXT NOT NULL DEFAULT 'confirmed'");
    addColumnIfMissing('reservations', 'expires_at', 'TEXT');

    migrateReservationPaymentsToRon();
  } catch {
    // If this fails on some environments, the app can still run using confirmed-only reservations.
  }

  return db;
};

module.exports = {
  getDb: ensureDb
};
