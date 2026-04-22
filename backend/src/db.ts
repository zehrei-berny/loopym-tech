import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(__dirname, "..", "data", "app.db");

// Ensure data directory exists
import fs from "fs";
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
  )
`);

// Seed default profile if empty
const existing = db.prepare("SELECT id FROM profile WHERE id = 1").get();
if (!existing) {
  db.prepare(`
    INSERT INTO profile (id, name, company, avatar_url, rating, total_earnings, jobs_completed, push_notifications, face_id)
    VALUES (1, 'Jim Johnson', 'Jims Fabulous Pool Services, LLC.', '', 4.86, 4389.56, 232, 1, 0)
  `).run();
}

export default db;
