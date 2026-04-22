import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ProfileScreen from "./src/ProfileScreen";
import EarningsScreen from "./src/EarningsScreen";
import PaymentHistoryScreen from "./src/PaymentHistoryScreen";
import LoginSecurityScreen from "./src/screens/LoginSecurityScreen";
import AvailabilityScreen from "./src/screens/AvailabilityScreen";
import PaymentsScreen from "./src/screens/PaymentsScreen";
import PayoutMethodsScreen from "./src/screens/PayoutMethodsScreen";
import AddPayoutMethodScreen from "./src/screens/AddPayoutMethodScreen";
import AccountDetailsScreen from "./src/screens/AccountDetailsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Payments" component={PaymentsScreen} />
          <Stack.Screen name="Earnings" component={EarningsScreen} />
          <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
          <Stack.Screen name="PayoutMethods" component={PayoutMethodsScreen} />
          <Stack.Screen name="AddPayoutMethod" component={AddPayoutMethodScreen} />
          <Stack.Screen name="AccountDetails" component={AccountDetailsScreen} />
          <Stack.Screen name="LoginSecurity" component={LoginSecurityScreen} />
          <Stack.Screen name="Availability">
            {({ navigation }) => (
              <AvailabilityScreen onBack={() => navigation.goBack()} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
