import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";

const PendingApprovalScreen = ({ navigation }: any) => {
  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />

      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconBox}>
          <Text style={styles.icon}>⏳</Text>
        </View>

        {/* Message */}
        <Text style={styles.title}>Account Pending Approval</Text>
        <Text style={styles.subtitle}>
          Your account has been created successfully!
        </Text>
        <Text style={styles.description}>
          Our admin team is reviewing your registration. You will be notified
          once your account is approved and activated.
        </Text>

        {/* Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>What happens next?</Text>

          {[
            {
              step: "1",
              text: "Admin reviews your registration details",
              done: true,
            },
            {
              step: "2",
              text: "Admin verifies your Government ID",
              done: false,
            },
            { step: "3", text: "Account gets activated", done: false },
            {
              step: "4",
              text: "You receive an approval notification",
              done: false,
            },
          ].map((item, index) => (
            <View key={index} style={styles.stepRow}>
              <View
                style={[styles.stepBadge, item.done && styles.stepBadgeDone]}
              >
                <Text style={styles.stepNum}>
                  {item.done ? "✓" : item.step}
                </Text>
              </View>
              <Text style={[styles.stepText, item.done && styles.stepTextDone]}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Contact */}
        <View style={styles.contactBox}>
          <Text style={styles.contactText}>
            📞 Need help? Contact admin at{"\n"}
            <Text style={styles.contactLink}>admin@merlafarms.com</Text>
          </Text>
        </View>

        {/* Back to login */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.replace("Login")}
        >
          <Text style={styles.backBtnText}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PendingApprovalScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#1e3a5f" },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  // Icon
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  icon: { fontSize: 48 },

  // Text
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },

  // Steps card
  stepsCard: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e3a5f",
    marginBottom: 16,
  },
  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepBadgeDone: { backgroundColor: "#22c55e" },
  stepNum: { fontSize: 12, fontWeight: "700", color: "#6b7280" },
  stepText: { flex: 1, fontSize: 13, color: "#6b7280" },
  stepTextDone: { color: "#374151", fontWeight: "600" },

  // Contact
  contactBox: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 14,
    width: "100%",
    marginBottom: 20,
  },
  contactText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 20,
  },
  contactLink: { color: "#fff", fontWeight: "700" },

  // Back button
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  backBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
