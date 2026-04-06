const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { hashPassword } = require("../utils/security");

const DB_PATH = path.join(__dirname, "geartrack.sqlite");
const db = new Database(DB_PATH);

function runSqlFile(filePath) {
  let sql = fs.readFileSync(filePath, "utf-8");

  if (path.basename(filePath) === "seed.sql") {
    const defaultHash = hashPassword("geartrack123");
    sql = sql.replaceAll("__HASH__", defaultHash);
  }

  db.exec(sql);
}

function columnExists(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

function runMigrations() {
  if (!columnExists("users", "password_hash")) {
    db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_serial_unique
    ON equipment(serial)
  `);

  const usersMissingPassword = db
    .prepare("SELECT id FROM users WHERE password_hash IS NULL OR trim(password_hash) = ''")
    .all();

  if (usersMissingPassword.length > 0) {
    const updateStmt = db.prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    const defaultHash = hashPassword("geartrack123");

    const tx = db.transaction((rows) => {
      for (const row of rows) {
        updateStmt.run(defaultHash, row.id);
      }
    });

    tx(usersMissingPassword);
    console.log('Assigned default password "geartrack123" to existing users without a password.');
  }
}

function initDbIfNeeded() {
  const initPath = path.join(__dirname, "init.sql");
  runSqlFile(initPath);
  runMigrations();

  const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  const equipmentCount = db.prepare("SELECT COUNT(*) AS c FROM equipment").get().c;

  if (userCount === 0 && equipmentCount === 0) {
    const seedPath = path.join(__dirname, "seed.sql");
    runSqlFile(seedPath);
    console.log("DB seeded with mock data.");
    console.log('Seeded account password: geartrack123');
  }
}

module.exports = { db, initDbIfNeeded };
