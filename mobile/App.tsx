import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import EarningsScreen from "./src/EarningsScreen";
import PaymentHistoryScreen from "./src/PaymentHistoryScreen";

type Screen = "earnings" | "history";

export default function App() {
  const [screen, setScreen] = useState<Screen>("earnings");

  return (
    <>
      {screen === "earnings" && (
        <EarningsScreen
          onBack={() => {
            // In a full app this would navigate back to Profile
          }}
          onViewHistory={() => setScreen("history")}
        />
      )}
      {screen === "history" && (
        <PaymentHistoryScreen onBack={() => setScreen("earnings")} />
      )}
      <StatusBar style="auto" />
    </>
  );
}
