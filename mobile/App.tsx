import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./src/screens/HomeScreen";
import AvailabilityScreen from "./src/screens/AvailabilityScreen";

type RootStackParamList = {
  Home: undefined;
  Availability: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home">
          {({ navigation }) => (
            <HomeScreen
              onNavigateToAvailability={() =>
                navigation.navigate("Availability")
              }
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Availability">
          {({ navigation }) => (
            <AvailabilityScreen onBack={() => navigation.goBack()} />
          )}
        </Stack.Screen>
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
