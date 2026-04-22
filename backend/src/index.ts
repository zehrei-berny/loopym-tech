import express from "express";
import cors from "cors";

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

// ── Start ──────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
