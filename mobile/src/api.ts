import { Platform } from "react-native";

// Android emulator uses 10.0.2.2 to reach host machine's localhost.
// iOS simulator and web use localhost directly.
const LOCAL_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${LOCAL_HOST}:3000`;

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", headers = {}, body } = options;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ── Profile Types ───────────────────────────────────────────────────
export type Profile = {
  id: number;
  name: string;
  company: string;
  avatar_url: string;
  rating: number;
  total_earnings: number;
  jobs_completed: number;
  push_notifications: number;
  face_id: number;
};

// ── Payment Types ───────────────────────────────────────────────────
export type EarningsData = {
  today_earnings: number;
  current_month_earnings: number;
  last_month_earnings: number;
  current_month: number;
  current_year: number;
  has_payout_method: boolean;
};

export type MonthlySummary = {
  year: number;
  months: { month: number; total: number }[];
};

export type DailySummary = {
  year: number;
  month: number;
  days: { day: string; total: number }[];
  month_total: number;
};

export type Payment = {
  id: number;
  payer_name: string;
  amount: number;
  status: string;
  date: string;
};

export type PaymentHistoryData = {
  year: number;
  month: number;
  dates: { date: string; payments: Payment[] }[];
};

// ── Availability Types ──────────────────────────────────────────────
export type DaySlot = {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

export type TimeOff = {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
};

export type AvailabilityResponse = {
  slots: DaySlot[];
  summary: string;
  timeOffs: TimeOff[];
};

// ── API ─────────────────────────────────────────────────────────────
export const api = {
  getHealth: () => request<{ status: string; timestamp: string }>("/health"),
  getGreeting: () => request<{ message: string }>("/api/greeting"),

  // Profile
  getProfile: () => request<Profile>("/api/profile"),
  updateProfile: (data: Partial<Omit<Profile, "id">>) =>
    request<Profile>("/api/profile", { method: "PUT", body: data }),

  // Payments
  getEarnings: () => request<EarningsData>("/api/payments/earnings"),

  getMonthlySummary: (year?: number) =>
    request<MonthlySummary>(
      `/api/payments/monthly-summary${year ? `?year=${year}` : ""}`
    ),

  getDailySummary: (year: number, month: number) =>
    request<DailySummary>(
      `/api/payments/daily-summary?year=${year}&month=${month}`
    ),

  getPaymentHistory: (year: number, month: number) =>
    request<PaymentHistoryData>(
      `/api/payments/history?year=${year}&month=${month}`
    ),

  addPayoutMethod: (
    data: { type?: string; label?: string; last_four?: string } = {}
  ) =>
    request<{ id: number }>("/api/payments/payout-method", {
      method: "POST",
      body: data,
    }),

  // Security
  updatePassword: (newPassword: string, confirmPassword: string) =>
    request<{ success: boolean; message: string }>("/api/security/password", {
      method: "PUT",
      body: { newPassword, confirmPassword },
    }),

  deactivateAccount: () =>
    request<{ success: boolean; message: string }>("/api/security/deactivate", {
      method: "POST",
    }),

  // Availability
  getAvailability: () => request<AvailabilityResponse>("/api/availability"),

  updateAvailability: (slots: DaySlot[]) =>
    request<AvailabilityResponse>("/api/availability", {
      method: "PUT",
      body: { slots },
    }),

  updateDay: (day: string, update: Partial<DaySlot>) =>
    request<AvailabilityResponse>(`/api/availability/${day}`, {
      method: "PUT",
      body: update,
    }),

  createTimeOff: (startDate: string, endDate: string, days: number) =>
    request<AvailabilityResponse>("/api/availability/time-off", {
      method: "POST",
      body: { startDate, endDate, days },
    }),

  cancelTimeOff: (id: string) =>
    request<AvailabilityResponse>(`/api/availability/time-off/${id}`, {
      method: "DELETE",
    }),
};
