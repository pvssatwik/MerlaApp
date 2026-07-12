import React, { useState } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { signUp } from "../../services/authService";
import { API_BASE_URL, API_HEADERS } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

const SignUpScreen = ({ navigation }: any) => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dob: new Date(2000, 0, 1),
    email: "",
    phone: "",
    password: "",
    confirmPass: "",
    govId: "",
  });

  const [showDob, setShowDob] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [checkingEmail, setChecking] = useState(false);

  const set = (key: string, val: any) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const formatDateDisplay = (d: Date) => d.toLocaleDateString("en-IN");

  const formatDateForApi = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes("@")) return;

    setChecking(true);
    setEmailError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/auth/check-email?email=${encodeURIComponent(email)}`,
        {
          headers: API_HEADERS,
        },
      );

      const result = await res.json();

      if (result.exists) {
        setEmailError("This email is already registered.");
      }
    } catch (e) {
      console.error("Email check error:", e);
    } finally {
      setChecking(false);
    }
  };

  const validate = () => {
    if (!form.firstName) {
      Alert.alert("Validation", "First name is required");
      return false;
    }
    if (!form.lastName) {
      Alert.alert("Validation", "Last name is required");
      return false;
    }
    if (!form.email) {
      if (emailError) {
        Alert.alert("Validation", emailError);
        return false;
      }
      Alert.alert("Validation", "Email is required");
      return false;
    }
    if (!form.phone || form.phone.length < 10) {
      Alert.alert("Validation", "Valid phone number required");
      return false;
    }
    if (!form.password || form.password.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters");
      return false;
    }
    if (form.password !== form.confirmPass) {
      Alert.alert("Validation", "Passwords do not match");
      return false;
    }
    if (!form.govId) {
      Alert.alert("Validation", "Government ID is required");
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await signUp({
        farm_name: "MERLA_FARMS",
        user_firstname: form.firstName,
        user_lastname: form.lastName,
        user_dob: formatDateForApi(form.dob),
        user_email: form.email,
        user_contact_no: form.phone,
        password: form.password,
        gov_id: form.govId,
      });

      Alert.alert(
        "Registration Successful! ✅",
        `Your User ID is: ${result.userid}\n\nPlease save this ID — you'll need it for login.`,
        [{ text: "OK", onPress: () => navigation.replace("PendingApproval") }],
      );
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
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>
              Fill in your details to register
            </Text>
          </View>

          {/* ── Form card ── */}
          <View style={styles.card}>
            {/* First Name */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor="#9ca3af"
                  value={form.firstName}
                  onChangeText={(v) => set("firstName", v)}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor="#9ca3af"
                  value={form.lastName}
                  onChangeText={(v) => set("lastName", v)}
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth *</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDob(true)}
              >
                <Text style={styles.dateText}>
                  📅 {formatDateDisplay(form.dob)}
                </Text>
              </TouchableOpacity>
              {showDob && (
                <DateTimePicker
                  value={form.dob}
                  mode="date"
                  maximumDate={new Date()}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(e, d) => {
                    setShowDob(false);
                    if (d) set("dob", d);
                  }}
                />
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address *</Text>

              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="john@example.com"
                placeholderTextColor="#9ca3af"
                value={form.email}
                onChangeText={(v) => {
                  set("email", v);
                  setEmailError("");
                }}
                onBlur={() => checkEmailExists(form.email)}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {checkingEmail && (
                <Text style={styles.checkingText}>⏳ Checking...</Text>
              )}

              {emailError ? (
                <Text style={styles.errorText}>❌ {emailError}</Text>
              ) : null}
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <View style={styles.phoneBox}>
                <Text style={styles.phoneCode}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="9876543210"
                  placeholderTextColor="#9ca3af"
                  value={form.phone}
                  onChangeText={(v) => set("phone", v.replace(/[^0-9]/g, ""))}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <View style={styles.passBox}>
                <TextInput
                  style={styles.passInput}
                  placeholder="Min 6 characters"
                  placeholderTextColor="#9ca3af"
                  value={form.password}
                  onChangeText={(v) => set("password", v)}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Text style={styles.eyeIcon}>{showPass ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password *</Text>
              <View style={styles.passBox}>
                <TextInput
                  style={styles.passInput}
                  placeholder="Re-enter password"
                  placeholderTextColor="#9ca3af"
                  value={form.confirmPass}
                  onChangeText={(v) => set("confirmPass", v)}
                  secureTextEntry={!showConf}
                />
                <TouchableOpacity onPress={() => setShowConf(!showConf)}>
                  <Text style={styles.eyeIcon}>{showConf ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>
              {form.confirmPass.length > 0 && (
                <Text
                  style={[
                    styles.matchText,
                    form.password === form.confirmPass
                      ? styles.matchOk
                      : styles.matchErr,
                  ]}
                >
                  {form.password === form.confirmPass
                    ? "✅ Passwords match"
                    : "❌ Passwords do not match"}
                </Text>
              )}
            </View>

            {/* Government ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Government-Issued ID *</Text>
              <TextInput
                style={styles.input}
                placeholder="Aadhar / PAN / Passport No"
                placeholderTextColor="#9ca3af"
                value={form.govId}
                onChangeText={(v) => set("govId", v)}
                autoCapitalize="characters"
              />
              <Text style={styles.hint}>
                Aadhar card, PAN card, or Passport number
              </Text>
            </View>

            {/* Info box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Your account will be reviewed by the admin before activation.
                You will be notified once approved.
              </Text>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Create Account →</Text>
              )}
            </TouchableOpacity>

            {/* Login link */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.loginLinkText}>
                Already have an account?{" "}
                <Text style={styles.loginLinkBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1e3a5f" },
  container: { flexGrow: 1 },

  // Header
  header: {
    padding: 24,
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingBottom: 24,
  },
  backBtn: { marginBottom: 16 },
  backIcon: { fontSize: 24, color: "#fff" },
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
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  // Inputs
  row: { flexDirection: "row" },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  inputError: {
    borderColor: "#dc2626",
  },

  checkingText: {
    marginTop: 5,
    fontSize: 12,
    color: "#2563eb",
  },

  errorText: {
    marginTop: 5,
    fontSize: 12,
    color: "#dc2626",
  },
  dateText: { fontSize: 14, color: "#111827" },

  // Phone
  phoneBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    overflow: "hidden",
  },
  phoneCode: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#1e3a5f",
    backgroundColor: "#e5e7eb",
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111827",
  },

  // Password
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

  hint: { fontSize: 11, color: "#9ca3af", marginTop: 4 },

  // Info box
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  infoIcon: { fontSize: 16 },
  infoText: { flex: 1, fontSize: 12, color: "#1e40af", lineHeight: 18 },

  // Submit
  submitBtn: {
    backgroundColor: "#1e3a5f",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  submitBtnDisabled: { backgroundColor: "#93c5fd" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Login link
  loginLink: { alignItems: "center", paddingVertical: 8 },
  loginLinkText: { fontSize: 14, color: "#6b7280" },
  loginLinkBold: { color: "#1e3a5f", fontWeight: "700" },
});
