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

export const api = {
  getHealth: () => request<{ status: string; timestamp: string }>("/health"),
  getGreeting: () => request<{ message: string }>("/api/greeting"),

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
