const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "geartrack.sqlite");
const db = new Database(DB_PATH);

function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, "utf-8");
  db.exec(sql);
}

function initDbIfNeeded() {
  // Create tables if not exist
  const initPath = path.join(__dirname, "init.sql");
  runSqlFile(initPath);

  // Seed if empty
  const userCount = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  const equipmentCount = db.prepare("SELECT COUNT(*) AS c FROM equipment").get().c;

  if (userCount === 0 && equipmentCount === 0) {
    const seedPath = path.join(__dirname, "seed.sql");
    runSqlFile(seedPath);
    console.log("DB seeded with mock data.");
  }
}

module.exports = { db, initDbIfNeeded };