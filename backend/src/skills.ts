import { Router } from "express";
import db from "./db";

const router = Router();

type Skill = { id: number; name: string; created_at: string };

// GET /api/skills — list all skills
router.get("/", (_req, res) => {
  const skills = db.prepare("SELECT * FROM skills ORDER BY id").all();
  res.json(skills);
});

// POST /api/skills — add a skill (dummy delay to simulate server processing)
router.post("/", (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Skill name is required" });
    return;
  }

  const trimmed = name.trim();

  const existing = db
    .prepare("SELECT id FROM skills WHERE LOWER(name) = LOWER(?)")
    .get(trimmed) as Skill | undefined;

  if (existing) {
    res.status(409).json({ error: "Skill already exists" });
    return;
  }

  // Simulate processing delay
  setTimeout(() => {
    const result = db
      .prepare("INSERT INTO skills (name) VALUES (?)")
      .run(trimmed);

    const skill = db
      .prepare("SELECT * FROM skills WHERE id = ?")
      .get(result.lastInsertRowid) as Skill;

    res.status(201).json(skill);
  }, 800);
});

// DELETE /api/skills/:id — remove a skill
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const skill = db.prepare("SELECT * FROM skills WHERE id = ?").get(id);

  if (!skill) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }

  db.prepare("DELETE FROM skills WHERE id = ?").run(id);
  res.json({ success: true });
});

export default router;
