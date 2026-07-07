import React, { useEffect, useRef } from "react";
import {
  Animated,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";

type SnackbarProps = {
  visible: boolean;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
  onDismiss: () => void;
};

const COLORS = {
  success: { bg: "#166534", icon: "✅" },
  error: { bg: "#991b1b", icon: "❌" },
  info: { bg: "#1e40af", icon: "ℹ️" },
  warning: { bg: "#92400e", icon: "⚠️" },
};

const Snackbar = ({
  visible,
  message,
  type = "success",
  duration = 3000,
  onDismiss,
}: SnackbarProps) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      const timer = setTimeout(() => {
        dismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
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

  const color = COLORS[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: color.bg, transform: [{ translateY }], opacity },
      ]}
    >
      <Text style={styles.icon}>{color.icon}</Text>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity onPress={dismiss} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Snackbar;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 40 : 24,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 9999,
  },
  icon: { fontSize: 18 },
  message: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  closeBtn: { padding: 4 },
  closeText: { color: "rgba(255,255,255,0.8)", fontSize: 16 },
});
