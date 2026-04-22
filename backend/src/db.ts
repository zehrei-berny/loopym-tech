import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "app.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ──────────────────────────────────────────────────────────
db.exec(`
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
`);

// ── Seed if empty ───────────────────────────────────────────────────
const count = db.prepare("SELECT COUNT(*) as c FROM payments").get() as { c: number };
if (count.c === 0) {
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

export default db;
