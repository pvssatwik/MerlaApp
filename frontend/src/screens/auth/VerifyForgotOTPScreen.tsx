import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { verifyForgotOTP, resendOTP } from "../../services/authService";

const VerifyForgotOTPScreen = ({ navigation, route }: any) => {
  const { userId, identifier } = route.params;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(30);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      Alert.alert("Validation", "Please enter 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyForgotOTP({ userId, otp: otpCode });
      navigation.navigate("ResetPassword", { resetToken: result.resetToken });
    } catch (error: any) {
      Alert.alert("Error ❌", error.message);
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    try {
      await resendOTP({ userId, otpType: "FORGOT_PASSWORD" });
      setOtp(["", "", "", "", "", ""]);
      setTimer(30);
      Alert.alert("OTP Sent ✅", "New OTP sent to your email");
    } catch (error: any) {
      Alert.alert("Error ❌", error.message);
    } finally {
      setResending(false);
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
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerIcon}>🔐</Text>
            <Text style={styles.headerTitle}>Verify OTP</Text>
            <Text style={styles.headerSubtitle}>
              Enter the 6-digit code sent to
            </Text>
            <Text style={styles.identifier}>{identifier}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enter OTP</Text>

            <View style={styles.otpRow}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputs.current[index] = ref;
                  }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={(v) =>
                    handleOtpChange(v.replace(/[^0-9]/g, ""), index)
                  }
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <View style={styles.timerRow}>
              {timer > 0 ? (
                <Text style={styles.timerText}>
                  Resend in{" "}
                  <Text style={styles.timerCount}>
                    00:{timer.toString().padStart(2, "0")}
                  </Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={resending}>
                  {resending ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <Text style={styles.resendText}>Resend OTP</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.verifyBtn, loading && styles.verifyBtnDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyBtnText}>Verify OTP ✓</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default VerifyForgotOTPScreen;

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
    padding: 4,
  },
  backIcon: { fontSize: 24, color: "#fff" },
  headerIcon: { fontSize: 52, marginBottom: 12 },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 4,
  },
  identifier: { fontSize: 15, fontWeight: "700", color: "#fff" },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e3a5f",
    textAlign: "center",
    marginBottom: 24,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 6,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    fontSize: 22,
    fontWeight: "700",
    color: "#1e3a5f",
    backgroundColor: "#f9fafb",
    textAlign: "center",
  },
  otpBoxFilled: { borderColor: "#1e3a5f", backgroundColor: "#eff6ff" },
  timerRow: { alignItems: "center", marginBottom: 24 },
  timerText: { fontSize: 13, color: "#6b7280" },
  timerCount: { color: "#1e3a5f", fontWeight: "700" },
  resendText: { fontSize: 14, color: "#2563eb", fontWeight: "700" },
  verifyBtn: {
    backgroundColor: "#1e3a5f",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  verifyBtnDisabled: { backgroundColor: "#93c5fd" },
  verifyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
