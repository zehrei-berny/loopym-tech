import { Router } from "express";
import db from "./db";

const router = Router();

// List team members (with optional search)
router.get("/", (req, res) => {
  const search = (req.query.search as string) || "";

  let members;
  if (search) {
    members = db
      .prepare(
        `SELECT * FROM team_members
         WHERE first_name LIKE ? OR last_name LIKE ? OR role LIKE ?
         ORDER BY created_at DESC`
      )
      .all(`%${search}%`, `%${search}%`, `%${search}%`);
  } else {
    members = db
      .prepare("SELECT * FROM team_members ORDER BY created_at DESC")
      .all();
  }

  res.json({ members });
});

// Get single team member
router.get("/:id", (req, res) => {
  const member = db
    .prepare("SELECT * FROM team_members WHERE id = ?")
    .get(req.params.id);

  if (!member) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }

  res.json(member);
});

// Add a new team member
router.post("/", (req, res) => {
  const { first_name, last_name, email, phone, role } = req.body;

  if (!first_name || !last_name) {
    res.status(400).json({ error: "First name and last name are required" });
    return;
  }

  const result = db
    .prepare(
      `INSERT INTO team_members (first_name, last_name, email, phone, role, status, booked_percentage)
       VALUES (?, ?, ?, ?, ?, 'pending', 0)`
    )
    .run(first_name, last_name, email || "", phone || "", role || "");

  const member = db
    .prepare("SELECT * FROM team_members WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(member);
});

// Resend invite (dummy)
router.post("/:id/resend-invite", (req, res) => {
  const member = db
    .prepare("SELECT * FROM team_members WHERE id = ?")
    .get(req.params.id);

  if (!member) {
    res.status(404).json({ error: "Team member not found" });
    return;
  }

  // Simulate processing delay
  setTimeout(() => {
    res.json({ success: true, message: "Invite resent successfully" });
  }, 800);
});

export default router;
