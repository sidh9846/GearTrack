PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  serial TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('available','checked_out')) DEFAULT 'available',
  condition TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS checkouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  checkout_at TEXT NOT NULL DEFAULT (datetime('now')),
  return_at TEXT,
  checkout_condition TEXT NOT NULL,
  return_condition TEXT,
  checkout_notes TEXT,
  return_notes TEXT,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_checkout_per_equipment
ON checkouts(equipment_id)
WHERE return_at IS NULL;


