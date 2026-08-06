import React, { useEffect, useRef } from "react";
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  View,
} from "react-native";

type SnackbarType = "success" | "error" | "warning" | "info";

type Props = {
  visible: boolean;
  message: string;
  type?: SnackbarType;
  duration?: number;
  onDismiss: () => void;
};

const CONFIG: Record<
  SnackbarType,
  { bg: string; icon: string; accent: string }
> = {
  success: { bg: "#0f4c35", icon: "✅", accent: "#22c55e" },
  error: { bg: "#4c0f0f", icon: "❌", accent: "#ef4444" },
  warning: { bg: "#4c3a0f", icon: "⚠️", accent: "#f59e0b" },
  info: { bg: "#0f2d4c", icon: "ℹ️", accent: "#3b82f6" },
};

const Snackbar = ({
  visible,
  message,
  type = "success",
  duration = 3500,
  onDismiss,
}: Props) => {
  const slideY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const config = CONFIG[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(dismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: 120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderLeftColor: config.accent,
          transform: [{ translateY: slideY }],
          opacity,
        },
      ]}
    >
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>
      <TouchableOpacity onPress={dismiss} style={styles.dismissBtn}>
        <Text style={[styles.dismissText, { color: config.accent }]}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Snackbar;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 30,
    left: 16,
    right: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 9999,
  },
  icon: { fontSize: 20 },
  message: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  dismissBtn: { padding: 4 },
  dismissText: { fontSize: 16, fontWeight: "700" },
});
