import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(__dirname, "..", "data", "app.db");

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db: DatabaseType = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    company TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    rating REAL NOT NULL DEFAULT 0,
    total_earnings REAL NOT NULL DEFAULT 0,
    jobs_completed INTEGER NOT NULL DEFAULT 0,
    push_notifications INTEGER NOT NULL DEFAULT 1,
    face_id INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS payout_methods (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL DEFAULT 'bank',
    label       TEXT NOT NULL,
    last_four   TEXT NOT NULL DEFAULT '',
    is_default  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    payer_name  TEXT NOT NULL,
    amount      REAL NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    date        TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS skills (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed default profile if empty
const existing = db.prepare("SELECT id FROM profile WHERE id = 1").get();
if (!existing) {
  db.prepare(`
    INSERT INTO profile (id, name, company, avatar_url, rating, total_earnings, jobs_completed, push_notifications, face_id)
    VALUES (1, 'Jim Johnson', 'Jims Fabulous Pool Services, LLC.', '', 4.86, 4389.56, 232, 1, 0)
  `).run();
}

// Seed payments if empty
const paymentCount = db.prepare("SELECT COUNT(*) as c FROM payments").get() as { c: number };
if (paymentCount.c === 0) {
  const insert = db.prepare(
    "INSERT INTO payments (payer_name, amount, status, date) VALUES (?, ?, ?, ?)"
  );

  const seedPayments = db.transaction(() => {
    // April 2026
    insert.run("Robert Power", 1567.89, "pending", "2026-04-04");
    insert.run("Robert Power", 2324.50, "cleared", "2026-04-04");
    insert.run("Robert Power", 982.55, "cleared", "2026-04-03");
    insert.run("Robert Power", 1952.50, "cleared", "2026-04-02");
    insert.run("Sarah Mitchell", 1245.00, "cleared", "2026-04-01");
    insert.run("Sarah Mitchell", 875.25, "cleared", "2026-04-01");

    // March 2026
    insert.run("Robert Power", 2100.00, "cleared", "2026-03-28");
    insert.run("Sarah Mitchell", 1450.75, "cleared", "2026-03-22");
    insert.run("Robert Power", 980.00, "cleared", "2026-03-15");
    insert.run("Sarah Mitchell", 1675.50, "cleared", "2026-03-08");
    insert.run("Robert Power", 845.50, "cleared", "2026-03-01");

    // February 2026
    insert.run("Robert Power", 1320.00, "cleared", "2026-02-25");
    insert.run("Sarah Mitchell", 960.00, "cleared", "2026-02-18");
    insert.run("Robert Power", 1100.50, "cleared", "2026-02-10");

    // January 2026
    insert.run("Robert Power", 2050.00, "cleared", "2026-01-28");
    insert.run("Sarah Mitchell", 1500.00, "cleared", "2026-01-20");
    insert.run("Robert Power", 839.56, "cleared", "2026-01-12");
  });

  seedPayments();
}

// Seed skills if empty
const skillCount = db.prepare("SELECT COUNT(*) as c FROM skills").get() as { c: number };
if (skillCount.c === 0) {
  const insertSkill = db.prepare("INSERT INTO skills (name) VALUES (?)");
  const seedSkills = db.transaction(() => {
    insertSkill.run("Chemical maintenance");
    insertSkill.run("Heating specialist");
    insertSkill.run("Equipment installation & repairs");
    insertSkill.run("Pool cleaning");
    insertSkill.run("Algae removal");
  });
  seedSkills();
}

export default db;
