import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { login } from "../../services/authService";

const LoginScreen = ({ navigation }: any) => {
  console.log("LOGIN SCREEN RENDERED");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const showSnackbar = (message: string, type: "success" | "error") => {
    Alert.alert(type === "error" ? "Error" : "Success", message);
  };

  const validateLogin = () => {
    const value = identifier.trim();

    if (!value) {
      showSnackbar("Please enter your email or phone number", "error");
      return false;
    }

    if (!password) {
      showSnackbar("Please enter your password", "error");
      return false;
    }

    if (password.length < 6) {
      showSnackbar("Password must be at least 6 characters", "error");
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    setLoading(true);

    try {
      const result = await login({
        identifier: identifier.trim(),
        password,
      });

      navigation.navigate("OTP", {
        userId: result.userId,
        identifier: result.identifier || identifier.trim(),
        flow: "login",
      });
    } catch (error: any) {
      if (error.message?.toLowerCase().includes("pending")) {
        navigation.navigate("PendingApproval");
      } else {
        showSnackbar(error.message || "Login failed", "error");
      }
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
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🐔</Text>
            <Text style={styles.headerTitle}>Merla Farms</Text>
            <Text style={styles.headerSubtitle}>Sign in to your account</Text>
          </View>

          {/* ── Form card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back!</Text>
            <Text style={styles.cardSubtitle}>
              Enter your credentials to continue
            </Text>

            {/* Email / Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email or Phone Number</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email or phone"
                  placeholderTextColor="#9ca3af"
                  onChangeText={(text) => setIdentifier(text)}
                  keyboardType="default"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity
                  onPress={() => setShowPass(!showPass)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeText}>
                    {showPass ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Login →</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign up */}
            <TouchableOpacity
              style={styles.signupBtn}
              onPress={() => navigation.navigate("SignUp")}
            >
              <Text style={styles.signupBtnText}>Create New Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>
            By signing in, you agree to our Terms & Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1e3a5f" },
  container: { flexGrow: 1, paddingBottom: 30 },

  // Header
  header: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerIcon: { fontSize: 48, marginBottom: 10 },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.65)" },

  // Card
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
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e3a5f",
    marginBottom: 4,
  },
  cardSubtitle: { fontSize: 13, color: "#9ca3af", marginBottom: 24 },

  // Input
  inputGroup: { marginBottom: 16 },
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
  showPass: { fontSize: 16, padding: 4 },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  eyeText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },

  // Forgot
  forgotBtn: { alignSelf: "flex-end", marginBottom: 20 },
  forgotText: { fontSize: 13, color: "#2563eb", fontWeight: "600" },

  // Login button
  loginBtn: {
    backgroundColor: "#1e3a5f",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  loginBtnDisabled: { backgroundColor: "#93c5fd" },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: "#9ca3af" },

  // Sign up
  signupBtn: {
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1e3a5f",
    justifyContent: "center",
    alignItems: "center",
  },
  signupBtnText: { color: "#1e3a5f", fontSize: 15, fontWeight: "700" },

  footer: {
    textAlign: "center",
    marginTop: 20,
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    paddingHorizontal: 40,
  },
});
