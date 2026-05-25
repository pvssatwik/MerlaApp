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
import { forgotPassword } from "../../services/authServices";

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

 const handleSendOtp = async () => {
  if (!identifier) {
    Alert.alert('Validation', 'Please enter your email or phone');
    return;
  }
  setLoading(true);
  try {
    const result = await forgotPassword(identifier);
    navigation.navigate('OTP', {
      identifier: result.identifier,
      flow:       'forgot',
    });
  } catch (error: any) {
    Alert.alert('Error ❌', error.message);
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
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerIcon}>🔑</Text>
            <Text style={styles.headerTitle}>Forgot Password?</Text>
            <Text style={styles.headerSubtitle}>
              No worries! Enter your email or phone and we'll send you a reset
              OTP.
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email or Phone Number</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email or phone"
                  placeholderTextColor="#9ca3af"
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>Send OTP →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.backToLoginText}>← Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1e3a5f" },
  container: { flex: 1 },
  header: {
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 48 : 60,
    padding: 24,
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "android" ? 48 : 60,
    left: 24,
  },
  backIcon: { fontSize: 24, color: "#fff" },
  headerIcon: { fontSize: 52, marginBottom: 12 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    height: 50,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: "#111827" },
  sendBtn: {
    backgroundColor: "#1e3a5f",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  sendBtnDisabled: { backgroundColor: "#93c5fd" },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backToLogin: { alignItems: "center", paddingVertical: 8 },
  backToLoginText: { fontSize: 14, color: "#2563eb", fontWeight: "600" },
});
