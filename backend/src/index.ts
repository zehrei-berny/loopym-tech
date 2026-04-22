import express from "express";
import cors from "cors";
import db from "./db";
import paymentsRouter from "./payments";
import teamRouter from "./team";
import skillsRouter from "./skills";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Types ──────────────────────────────────────────────────────────

type DaySlot = {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

type TimeOff = {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
};

// ── In-memory dummy data ───────────────────────────────────────────

let weeklyAvailability: DaySlot[] = [
  { day: "Sunday", enabled: false, startTime: "9:00 AM", endTime: "5:00 PM" },
  { day: "Monday", enabled: true, startTime: "10:30 AM", endTime: "5:00 PM" },
  { day: "Tuesday", enabled: true, startTime: "10:30 AM", endTime: "5:00 PM" },
  { day: "Wednesday", enabled: true, startTime: "9:00 AM", endTime: "5:00 PM" },
  { day: "Thursday", enabled: true, startTime: "9:00 AM", endTime: "5:00 PM" },
  { day: "Friday", enabled: true, startTime: "9:00 AM", endTime: "5:00 PM" },
  { day: "Saturday", enabled: false, startTime: "9:00 AM", endTime: "5:00 PM" },
];

let timeOffs: TimeOff[] = [];
let nextTimeOffId = 1;

function generateSummary(slots: DaySlot[]): string {
  const enabled = slots.filter((s) => s.enabled);
  if (enabled.length === 0) return "--";

  const groups: { days: string[]; time: string }[] = [];
  for (const slot of enabled) {
    const time = `${slot.startTime} - ${slot.endTime}`;
    const last = groups[groups.length - 1];
    if (last && last.time === time) {
      last.days.push(slot.day);
    } else {
      groups.push({ days: [slot.day], time });
    }
  }

  return groups
    .map((g) => {
      const dayStr =
        g.days.length === 1
          ? g.days[0].slice(0, 3)
          : `${g.days[0].slice(0, 3)} - ${g.days[g.days.length - 1].slice(0, 3)}`;
      return `${dayStr}, ${g.time}`;
    })
    .join("\n");
}

// ── Health check ───────────────────────────────────────────────────

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

// Team
app.use("/api/team", teamRouter);

// Skills
app.use("/api/skills", skillsRouter);

// --- Face ID dummy routes ---

// Check Face ID enrollment status
app.get("/api/security/face-id/status", (_req, res) => {
  const profile = db.prepare("SELECT face_id FROM profile WHERE id = 1").get() as
    | { face_id: number }
    | undefined;
  res.json({
    enrolled: !!profile?.face_id,
    device_supported: true,
  });
});

// Enroll Face ID (dummy — just flips the flag)
app.post("/api/security/face-id/enroll", (_req, res) => {
  setTimeout(() => {
    db.prepare("UPDATE profile SET face_id = 1 WHERE id = 1").run();
    res.json({ success: true, message: "Face ID enrolled successfully" });
  }, 600);
});

// Disable Face ID
app.post("/api/security/face-id/disable", (_req, res) => {
  db.prepare("UPDATE profile SET face_id = 0 WHERE id = 1").run();
  res.json({ success: true, message: "Face ID disabled" });
});

// Verify Face ID (dummy — always succeeds if enrolled)
app.post("/api/security/face-id/verify", (_req, res) => {
  const profile = db.prepare("SELECT face_id FROM profile WHERE id = 1").get() as
    | { face_id: number }
    | undefined;
  if (!profile?.face_id) {
    res.status(400).json({ success: false, error: "Face ID not enrolled" });
    return;
  }
  setTimeout(() => {
    res.json({ success: true, message: "Face ID verified" });
  }, 400);
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

// ── Availability routes ────────────────────────────────────────────

app.get("/api/availability", (_req, res) => {
  res.json({
    slots: weeklyAvailability,
    summary: generateSummary(weeklyAvailability),
    timeOffs,
  });
});

app.put("/api/availability", (req, res) => {
  const { slots } = req.body as { slots: DaySlot[] };
  if (!Array.isArray(slots)) {
    res.status(400).json({ error: "slots array required" });
    return;
  }
  weeklyAvailability = slots;
  res.json({
    slots: weeklyAvailability,
    summary: generateSummary(weeklyAvailability),
    timeOffs,
  });
});

app.put("/api/availability/:day", (req, res) => {
  const { day } = req.params;
  const update = req.body as Partial<DaySlot>;
  const slot = weeklyAvailability.find(
    (s) => s.day.toLowerCase() === day.toLowerCase()
  );
  if (!slot) {
    res.status(404).json({ error: "Day not found" });
    return;
  }
  if (update.enabled !== undefined) slot.enabled = update.enabled;
  if (update.startTime) slot.startTime = update.startTime;
  if (update.endTime) slot.endTime = update.endTime;

  res.json({
    slots: weeklyAvailability,
    summary: generateSummary(weeklyAvailability),
    timeOffs,
  });
});

app.post("/api/availability/time-off", (req, res) => {
  const { startDate, endDate, days } = req.body as {
    startDate: string;
    endDate: string;
    days: number;
  };
  if (!startDate || !endDate) {
    res.status(400).json({ error: "startDate and endDate required" });
    return;
  }
  const timeOff: TimeOff = {
    id: String(nextTimeOffId++),
    startDate,
    endDate,
    days: days || 1,
  };
  timeOffs.push(timeOff);
  res.status(201).json({
    slots: weeklyAvailability,
    summary: generateSummary(weeklyAvailability),
    timeOffs,
  });
});

app.delete("/api/availability/time-off/:id", (req, res) => {
  const { id } = req.params;
  timeOffs = timeOffs.filter((t) => t.id !== id);
  res.json({
    slots: weeklyAvailability,
    summary: generateSummary(weeklyAvailability),
    timeOffs,
  });
});
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
