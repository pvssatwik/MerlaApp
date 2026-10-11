import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";
import { navigationRef } from "./src/navigation/rootNavigation";

export default function App() {
  // ── Backend Health Check ──────────────────────────────
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/health`, {
          method: "GET",
        });

        if (!res.ok) {
          console.warn("Backend health check failed:", res.status);
        } else {
          console.log("✅ Backend reachable");
        }
      } catch (e) {
        console.warn("⚠️ Backend not reachable:", e);
        // Don't show alert — just log. Let login screen handle it.
      }
    };

    checkBackend();
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
