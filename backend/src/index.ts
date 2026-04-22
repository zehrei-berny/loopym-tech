import express from "express";
import cors from "cors";

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
