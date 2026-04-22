import { Router } from "express";
import db from "./db";

const router = Router();

type PersonalInfo = {
  id: number;
  first_name: string;
  last_name: string;
  mobile_number: string;
  email: string;
};

// GET /api/personal-info
router.get("/", (_req, res) => {
  const info = db.prepare("SELECT * FROM personal_info WHERE id = 1").get() as
    | PersonalInfo
    | undefined;
  if (!info) {
    res.status(404).json({ error: "Personal info not found" });
    return;
  }
  res.json(info);
});

// PUT /api/personal-info/:field
router.put("/:field", (req, res) => {
  const { field } = req.params;
  const allowed = ["first_name", "last_name", "mobile_number", "email"];

  if (!allowed.includes(field)) {
    res.status(400).json({ error: `Invalid field: ${field}` });
    return;
  }

  const { value } = req.body as { value: string };
  if (value === undefined || value === null) {
    res.status(400).json({ error: "value is required" });
    return;
  }

  // Simulate processing delay
  setTimeout(() => {
    db.prepare(`UPDATE personal_info SET ${field} = ? WHERE id = 1`).run(value);
    const info = db.prepare("SELECT * FROM personal_info WHERE id = 1").get();
    res.json(info);
  }, 800);
});

export default router;
