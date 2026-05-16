import React, { useEffect } from "react";
import { View, Text, StyleSheet, StatusBar, Animated } from "react-native";

const SplashScreen = ({ navigation }: any) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Animate logo in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to Login after 2.5s
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />

      <Animated.View
        style={[
          styles.logoBox,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.logoIcon}>🐔</Text>
        <Text style={styles.logoText}>Merla Farms</Text>
        <Text style={styles.logoSubtitle}>Farm Management System</Text>
      </Animated.View>

      <Animated.Text style={[styles.version, { opacity: fadeAnim }]}>
        v1.0.0
      </Animated.Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e3a5f",
    justifyContent: "center",
    alignItems: "center",
  },
  logoBox: { alignItems: "center" },
  logoIcon: { fontSize: 72, marginBottom: 16 },
  logoText: { fontSize: 32, fontWeight: "800", color: "#fff", marginBottom: 8 },
  logoSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1,
  },
  version: {
    position: "absolute",
    bottom: 40,
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
  },
});
