import express from "express";
import cors from "cors";
import db from "./db";
import paymentsRouter from "./payments";
import skillsRouter from "./skills";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Example API route
app.get("/api/greeting", (_req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Get profile
app.get("/api/profile", (_req, res) => {
  const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(profile);
});

// Update profile
app.put("/api/profile", (req, res) => {
  const allowed = [
    "name",
    "company",
    "avatar_url",
    "rating",
    "total_earnings",
    "jobs_completed",
    "push_notifications",
    "face_id",
  ];

  const updates: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (key in req.body) {
      updates.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }

  if (updates.length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  values.push(1); // WHERE id = 1
  db.prepare(`UPDATE profile SET ${updates.join(", ")} WHERE id = ?`).run(
    ...values
  );

  const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
  res.json(profile);
});

// Payments
app.use("/api/payments", paymentsRouter);

// Skills
app.use("/api/skills", skillsRouter);

// --- Security / Auth dummy routes ---

// Update password (dummy)
app.put("/api/security/password", (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    res.status(400).json({ error: "Both password fields are required" });
    return;
  }
  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: "Passwords do not match" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  // Simulate processing delay
  setTimeout(() => {
    res.json({ success: true, message: "Password successfully updated" });
  }, 1200);
});

// Deactivate account (dummy)
app.post("/api/security/deactivate", (_req, res) => {
  // Simulate processing delay
  setTimeout(() => {
    res.json({ success: true, message: "Account deactivation requested" });
  }, 800);
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
