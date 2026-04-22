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

export const api = {
  getHealth: () => request<{ status: string; timestamp: string }>("/health"),
  getGreeting: () => request<{ message: string }>("/api/greeting"),
  getProfile: () => request<Profile>("/api/profile"),
  updateProfile: (data: Partial<Omit<Profile, "id">>) =>
    request<Profile>("/api/profile", { method: "PUT", body: data }),
};
