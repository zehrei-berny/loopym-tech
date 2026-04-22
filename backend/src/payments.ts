import { Router } from "express";
import db from "./db";

const router = Router();

// ── Types ───────────────────────────────────────────────────────────
type PaymentRow = {
  id: number;
  payer_name: string;
  amount: number;
  status: string;
  date: string;
};

type MonthlyTotal = {
  month: string;
  total: number;
};

// ── GET /api/payments/earnings ──────────────────────────────────────
// Returns today's earnings, current month, last month, and payout method status
router.get("/earnings", (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const todayEarnings = db
    .prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE date = ?")
    .get(today) as { total: number };

  const currentMonthEarnings = db
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?"
    )
    .get(String(currentYear), String(currentMonth).padStart(2, "0")) as { total: number };

  const lastMonthEarnings = db
    .prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?"
    )
    .get(String(lastMonthYear), String(lastMonth).padStart(2, "0")) as { total: number };

  const hasPayoutMethod =
    (db.prepare("SELECT COUNT(*) as c FROM payout_methods").get() as { c: number }).c > 0;

  res.json({
    today_earnings: todayEarnings.total,
    current_month_earnings: currentMonthEarnings.total,
    last_month_earnings: lastMonthEarnings.total,
    current_month: currentMonth,
    current_year: currentYear,
    has_payout_method: hasPayoutMethod,
  });
});

// ── GET /api/payments/monthly-summary?year=2026 ────────────────────
// Returns per-month totals for the bar chart
router.get("/monthly-summary", (req, res) => {
  const year = String(req.query.year || new Date().getFullYear());

  const rows = db
    .prepare(
      `SELECT strftime('%m', date) as month, SUM(amount) as total
       FROM payments
       WHERE strftime('%Y', date) = ?
       GROUP BY strftime('%m', date)
       ORDER BY month`
    )
    .all(year) as MonthlyTotal[];

  // Fill all 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    const found = rows.find((r) => r.month === m);
    return { month: i + 1, total: found ? found.total : 0 };
  });

  res.json({ year: Number(year), months });
});

// ── GET /api/payments/daily-summary?year=2026&month=4 ──────────────
// Returns per-day totals for the day chips
router.get("/daily-summary", (req, res) => {
  const year = String(req.query.year || new Date().getFullYear());
  const month = String(req.query.month || new Date().getMonth() + 1).padStart(2, "0");

  const rows = db
    .prepare(
      `SELECT strftime('%d', date) as day, SUM(amount) as total
       FROM payments
       WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?
       GROUP BY strftime('%d', date)
       ORDER BY day`
    )
    .all(year, month) as { day: string; total: number }[];

  const monthTotal = rows.reduce((sum, r) => sum + r.total, 0);

  res.json({ year: Number(year), month: Number(month), days: rows, month_total: monthTotal });
});

// ── GET /api/payments/history?year=2026&month=4 ────────────────────
// Returns payment list grouped by date for the history screen
router.get("/history", (req, res) => {
  const year = String(req.query.year || new Date().getFullYear());
  const month = String(req.query.month || new Date().getMonth() + 1).padStart(2, "0");

  const rows = db
    .prepare(
      `SELECT id, payer_name, amount, status, date
       FROM payments
       WHERE strftime('%Y', date) = ? AND strftime('%m', date) = ?
       ORDER BY date DESC, id DESC`
    )
    .all(year, month) as PaymentRow[];

  // Group by date
  const grouped: Record<string, PaymentRow[]> = {};
  for (const row of rows) {
    if (!grouped[row.date]) grouped[row.date] = [];
    grouped[row.date].push(row);
  }

  const dates = Object.keys(grouped)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({ date, payments: grouped[date] }));

  res.json({ year: Number(year), month: Number(month), dates });
});

// ── POST /api/payments/payout-method ───────────────────────────────
// Dummy: add a payout method
router.post("/payout-method", (req, res) => {
  const { type = "bank", label = "Bank Account", last_four = "4242" } = req.body || {};

  const result = db
    .prepare("INSERT INTO payout_methods (type, label, last_four, is_default) VALUES (?, ?, ?, 1)")
    .run(type, label, last_four);

  res.json({ id: result.lastInsertRowid, type, label, last_four, is_default: true });
});

// ── GET /api/payments/payout-methods ───────────────────────────────
router.get("/payout-methods", (_req, res) => {
  const rows = db.prepare("SELECT * FROM payout_methods ORDER BY is_default DESC").all();
  res.json(rows);
});

export default router;
