import "react-native-reanimated";
import React from "react";
import { useColorScheme } from "react-native";
import { Provider as ReduxProvider } from "react-redux";
import { Provider as PaperProvider } from "react-native-paper";
import { ThemeProvider } from "styled-components/native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";

import { store } from "./src/store";
import { CustomLightTheme, CustomDarkTheme } from "./src/theme/theme";
import { queryClient } from "./src/utils/queryClient";
import NotificationHandler from "./src/components/NotificationHandler";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import AdminDashboard from "./src/screens/AdminDashboard";
import EmployeeDashboard from "./src/screens/EmployeeDashboard";
import FloorPlanEditor from "./src/screens/FloorPlanEditor";
import BookingScreen from "./src/screens/BookingScreen";
import MyBookings from "./src/screens/MyBookingsScreen";
import UserProfileScreen from "./src/screens/UserProfileScreen";
import CompanyRegistrationScreen from "./src/screens/CompanyRegistrationScreen";
import InviteEmployeesScreen from "./src/screens/InviteEmployeesScreen";
import ShareInbox from "./src/screens/ShareInbox";
import ShareScheduler from "./src/screens/ShareScheduler";
import CustomHeader from "./src/components/CustomHeader";

const Stack = createNativeStackNavigator();

export default function App() {
  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";
  const theme = isDarkMode ? CustomDarkTheme : CustomLightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <PaperProvider theme={theme}>
              <ThemeProvider theme={theme}>
                <NavigationContainer>
                  <NotificationHandler />

                  <Stack.Navigator
                    initialRouteName="Login"
                    screenOptions={{
                      header: (props) => <CustomHeader {...props} />,
                    }}
                  >
                    <Stack.Screen
                      name="Login"
                      component={LoginScreen}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen
                      name="AdminDashboard"
                      component={AdminDashboard}
                      options={{ title: "Admin Dashboard" }}
                    />
                    <Stack.Screen
                      name="EmployeeDashboard"
                      component={EmployeeDashboard}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="FloorPlanEditor"
                      component={FloorPlanEditor}
                    />
                    <Stack.Screen
                      name="BookingScreen"
                      component={BookingScreen}
                    />
                    <Stack.Screen name="MyBookings" component={MyBookings} />
                    <Stack.Screen
                      name="UserProfile"
                      component={UserProfileScreen}
                    />
                    <Stack.Screen
                      name="CompanyRegistration"
                      component={CompanyRegistrationScreen}
                    />
                    <Stack.Screen
                      name="InviteEmployees"
                      component={InviteEmployeesScreen}
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen name="ShareInbox" component={ShareInbox} />
                    <Stack.Screen
                      name="ShareScheduler"
                      component={ShareScheduler}
                    />
                  </Stack.Navigator>
                </NavigationContainer>
              </ThemeProvider>
            </PaperProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
