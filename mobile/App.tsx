import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import ProfileScreen from "./src/ProfileScreen";
import EarningsScreen from "./src/EarningsScreen";
import PaymentHistoryScreen from "./src/PaymentHistoryScreen";

type Screen = "profile" | "earnings" | "history";

export default function App() {
  const [screen, setScreen] = useState<Screen>("profile");

  return (
    <>
      {screen === "profile" && (
        <ProfileScreen onNavigatePayments={() => setScreen("earnings")} />
      )}
      {screen === "earnings" && (
        <EarningsScreen
          onBack={() => setScreen("profile")}
          onViewHistory={() => setScreen("history")}
        />
      )}
      {screen === "history" && (
        <PaymentHistoryScreen onBack={() => setScreen("earnings")} />
      )}
      <StatusBar style="dark" />
    </>
  );
}
