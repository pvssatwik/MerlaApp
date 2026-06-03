import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { resetPassword } from "../../services/authService";

const ResetPasswordScreen = ({ navigation, route }: any) => {
  const { resetToken } = route.params;
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert("Validation", "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ resetToken, new_password: newPassword });
      Alert.alert("Success ✅", "Password reset successfully!", [
        {
          text: "Login",
          onPress: () =>
            navigation.reset({ index: 0, routes: [{ name: "Login" }] }),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error ❌", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🔏</Text>
            <Text style={styles.headerTitle}>Reset Password</Text>
            <Text style={styles.headerSubtitle}>Enter your new password</Text>
          </View>

          <View style={styles.card}>
            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passBox}>
                <TextInput
                  style={styles.passInput}
                  placeholder="Min 6 characters"
                  placeholderTextColor="#9ca3af"
                  value={newPassword}
                  onChangeText={setNew}
                  secureTextEntry={!showNew}
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Text style={styles.eyeIcon}>{showNew ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.passBox}>
                <TextInput
                  style={styles.passInput}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#9ca3af"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!showConf}
                />
                <TouchableOpacity onPress={() => setShowConf(!showConf)}>
                  <Text style={styles.eyeIcon}>{showConf ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
              {confirm.length > 0 && (
                <Text
                  style={[
                    styles.matchText,
                    newPassword === confirm ? styles.matchOk : styles.matchErr,
                  ]}
                >
                  {newPassword === confirm
                    ? "✅ Passwords match"
                    : "❌ Passwords do not match"}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.resetBtn, loading && styles.resetBtnDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetBtnText}>Reset Password →</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1e3a5f" },
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 60 : 70,
    padding: 24,
  },
  headerIcon: { fontSize: 52, marginBottom: 12 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.65)" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 8,
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  passBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    height: 48,
  },
  passInput: { flex: 1, fontSize: 14, color: "#111827" },
  eyeIcon: { fontSize: 16, padding: 4 },
  matchText: { fontSize: 12, marginTop: 4 },
  matchOk: { color: "#16a34a" },
  matchErr: { color: "#dc2626" },
  resetBtn: {
    backgroundColor: "#1e3a5f",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  resetBtnDisabled: { backgroundColor: "#93c5fd" },
  resetBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
