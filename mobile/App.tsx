import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api, API_BASE_URL } from "./src/api";

export default function App() {
  const [greeting, setGreeting] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("connecting...");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const health = await api.getHealth();
      setStatus(health.status);

      const data = await api.getGreeting();
      setGreeting(data.message);
    } catch (err) {
      setStatus("offline");
      setGreeting(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>loopym-tech</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Backend Status</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: status === "ok" ? "#22c55e" : "#ef4444" },
            ]}
          />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>API Response</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#6366f1" />
        ) : (
          <Text style={styles.message}>{greeting ?? "No response"}</Text>
        )}
      </View>

      <Text style={styles.url}>{API_BASE_URL}</Text>

      <TouchableOpacity style={styles.button} onPress={fetchData}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 32,
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0f172a",
  },
  message: {
    fontSize: 16,
    color: "#334155",
  },
  url: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
