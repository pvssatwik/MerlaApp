import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { FORMS } from "../config/forms";
import SidebarMenu from "../components/sideBarMenu";
import { useAuth } from "../context/AuthContext";
import { logout, logout as logoutAPI } from "../services/authService";
import { resetToLogin } from "../navigation/rootNavigation";

// ── Greeting ──────────────────────────────────────────────
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "🌅 Good Morning";
  if (hour < 17) return "☀️ Good Afternoon";
  return "🌙 Good Evening";
};

// ── Form icon mapping ─────────────────────────────────────
const getFormIcon = (api: string) => {
  const icons: Record<string, string> = {
    eggproduction: "🥚",
    birdLiveStock: "🐔",
    eggGodownStock: "📦",
    eggSaleSummary: "💰",
    feedConsumption: "🌾",
    feedProduction: "⚙️",
    feedShedStock: "🏪",
    feedSupply: "🚚",
    rawMaterialStock: "📊",
  };
  return icons[api] || "📝";
};

// ── Summary cards ─────────────────────────────────────────
const SUMMARY_CARDS = [
  {
    id: "egg_production",
    title: "Egg Production",
    icon: "🥚",
    value: "--",
    unit: "eggs today",
    color: "#fef3c7",
    borderColor: "#f59e0b",
    screen: "EggProductionDetail",
  },
  {
    id: "bird_stock",
    title: "Bird Stock",
    icon: "🐔",
    value: "--",
    unit: "birds total",
    color: "#dbeafe",
    borderColor: "#3b82f6",
    screen: "BirdStockDetail",
  },
  {
    id: "feed_stock",
    title: "Feed Stock",
    icon: "🌾",
    value: "--",
    unit: "kg available",
    color: "#dcfce7",
    borderColor: "#22c55e",
    screen: "FeedStockDetail",
  },
  {
    id: "egg_sales",
    title: "Egg Sales",
    icon: "💰",
    value: "--",
    unit: "sold today",
    color: "#f3e8ff",
    borderColor: "#a855f7",
    screen: "EggSalesDetail",
  },
  {
    id: "godown_stock",
    title: "Godown Stock",
    icon: "📦",
    value: "--",
    unit: "eggs in stock",
    color: "#fee2e2",
    borderColor: "#ef4444",
    screen: "EggStockDetail",
  },
  {
    id: "feed_consumed",
    title: "Feed Consumed",
    icon: "⚙️",
    value: "--",
    unit: "kg today",
    color: "#fff7ed",
    borderColor: "#f97316",
    screen: null,
  },
];

// ── Quick actions ─────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: "Egg Production", api: "eggproduction", icon: "🥚" },
  { label: "Bird Stock", api: "birdLiveStock", icon: "🐔" },
  { label: "Feed Consumption", api: "feedConsumption", icon: "🌾" },
  { label: "Egg Sale", api: "eggSaleSummary", icon: "💰" },
  { label: "Shed Egg Production", api: "shedEggProduction", icon: "🏠" },
  { label: "Shed Feed Received", api: "shedFeedReceived", icon: "📥" },
];

const isAdminRole = (role: string) => {
  const adminRoles = ["SUPER_ADMIN", "SUPERADMIN", "superadmin"];
  return adminRoles.includes(role?.toUpperCase()) || role === "1";
};

const getRoleDisplayName = (role: string) => {
  const names: Record<string, string> = {
    SUPER_ADMIN: "⚙️ Super Admin",
    ADMIN: "👑 Admin",
    INCHARGE: "🏢 Incharge",
    EGG_GODOWN_INCHARGE: "🥚 Egg Godown Incharge",
    FEED_GODOWN_INCHARGE: "🌾 Feed Godown Incharge",
    SUPERVISORS: "👷 Supervisor",
    EGG_GODOWN_SUPERVISOR: "🥚 Egg Godown Supervisor",
    FEED_GODOWN_SUPERVISOR: "🌾 Feed Godown Supervisor",
    // Numeric fallbacks
    "1": "⚙️ Super Admin",
    "2": "👑 Admin",
    "3": "🏢 Incharge",
    "4": "🥚 Egg Godown Incharge",
    "5": "🌾 Feed Godown Incharge",
    "6": "👷 Supervisor",
    "7": "🥚 Egg Godown Supervisor",
    "8": "🌾 Feed Godown Supervisor",
  };
  return names[role] || `${role}`;
};

// ── Main component ────────────────────────────────────────
const HomeScreen = ({ navigation }: any) => {
  const greeting = getGreeting();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { user, signOut } = useAuth();

  const navigateToForm = (api: string) => {
    const form = FORMS.find((f: any) => f.api === api);
    if (form) {
      navigation.navigate("DynamicForm", {
        title: form.title,
        fields: form.fields,
        api: form.api,
      });
    }
  };
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutAPI();
          } catch (e) {
            console.error("Logout error:", e);
          }

          await signOut();
          resetToLogin();
        },
      },
    ]);
  };

  const handleCardPress = (card: any) => {
    if (card.screen) {
      navigation.navigate(card.screen);
    }
  };

  return (
    <View style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1e3a5f"
        translucent={false}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => setSidebarVisible(true)}
          >
            <View style={styles.hamburger} />
            <View style={styles.hamburger} />
            <View style={styles.hamburger} />
          </TouchableOpacity>

          <View style={styles.greetingBox}>
            <Text style={styles.greeting}>
              {greeting}, {user?.firstname || "Admin"}!
            </Text>

            <Text style={styles.greetingSubtitle}>
              {getRoleDisplayName(user?.role || "")}
            </Text>
          </View>

          {/* SUPER ADMIN BUTTON */}
          <TouchableOpacity style={styles.avatar} onPress={handleLogout}>
            <Text style={styles.avatarText}>
              {user?.firstname?.[0]?.toUpperCase() || "U"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Date strip ── */}
        <View style={styles.dateStrip}>
          <Text style={styles.dateText}>
            📅{" "}
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
        {isAdminRole(user?.role || "") && (
          <TouchableOpacity
            style={styles.adminBanner}
            onPress={() => navigation.navigate("SuperAdmin")}
          >
            <Text style={styles.adminBannerIcon}>👑</Text>

            <View style={styles.adminBannerText}>
              <Text style={styles.adminBannerTitle}>Admin Panel</Text>
              <Text style={styles.adminBannerSubtitle}>
                Manage user requests, approve accounts
              </Text>
            </View>

            <Text style={styles.adminBannerArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* ── Summary Cards ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <Text style={styles.sectionHint}>Tap for details</Text>
        </View>

        <View style={styles.cardsGrid}>
          {SUMMARY_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.summaryCard,
                {
                  backgroundColor: card.color,
                  borderLeftColor: card.borderColor,
                },
                !card.screen && styles.summaryCardDisabled,
              ]}
              activeOpacity={card.screen ? 0.8 : 1}
              onPress={() => handleCardPress(card)}
            >
              <Text style={styles.summaryCardIcon}>{card.icon}</Text>
              <Text style={styles.summaryCardValue}>{card.value}</Text>
              <Text style={styles.summaryCardTitle}>{card.title}</Text>
              <Text style={styles.summaryCardUnit}>{card.unit}</Text>
              {card.screen && <Text style={styles.summaryCardArrow}>→</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Quick Entry ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Quick Entry</Text>
        </View>

        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickCard}
              activeOpacity={0.8}
              onPress={() => navigateToForm(action.api)}
            >
              <Text style={styles.quickIcon}>{action.icon}</Text>
              <Text style={styles.quickLabel}>{action.label}</Text>
              <Text style={styles.quickArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── All Modules ── */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>All Modules</Text>
        </View>

        <View style={styles.modulesGrid}>
          {FORMS.map((form, index) => (
            <TouchableOpacity
              key={index}
              style={styles.moduleCard}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate("DynamicForm", {
                  title: form.title,
                  fields: form.fields,
                  api: form.api,
                })
              }
            >
              <Text style={styles.moduleIcon}>{getFormIcon(form.api)}</Text>
              <Text style={styles.moduleText}>{form.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Sidebar ── */}
      <SidebarMenu
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
        userRole={user?.role}
        onLogout={handleLogout}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#1e3a5f",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, backgroundColor: "#f3f4f6" },

  // ── Header ──
  header: {
    backgroundColor: "#1e3a5f",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuBtn: { padding: 6, justifyContent: "center" },
  hamburger: {
    width: 24,
    height: 3,
    backgroundColor: "#fff",
    borderRadius: 2,
    marginBottom: 5,
  },
  greetingBox: { flex: 1 },
  greeting: { fontSize: 17, fontWeight: "700", color: "#fff" },
  greetingSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  adminBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  adminBtnText: {
    fontSize: 18,
  },

  // ── Date strip ──
  dateStrip: {
    backgroundColor: "#163060",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dateText: { color: "rgba(255,255,255,0.75)", fontSize: 12 },

  // ── Section rows ──
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1e3a5f" },
  sectionHint: { fontSize: 12, color: "#9ca3af" },

  adminBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e3a5f",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    elevation: 3,
  },

  adminBannerIcon: {
    fontSize: 28,
  },

  adminBannerText: {
    flex: 1,
  },

  adminBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },

  adminBannerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
  },

  adminBannerArrow: {
    fontSize: 18,
    color: "rgba(255,255,255,0.6)",
  },

  // ── Summary cards ──
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
  },
  summaryCard: {
    width: "47%",
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryCardDisabled: { opacity: 0.7 },
  summaryCardIcon: { fontSize: 26, marginBottom: 8 },
  summaryCardValue: { fontSize: 26, fontWeight: "800", color: "#1e3a5f" },
  summaryCardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginTop: 2,
  },
  summaryCardUnit: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  summaryCardArrow: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 6,
    textAlign: "right",
  },

  // ── Quick actions ──
  quickGrid: { paddingHorizontal: 12, gap: 10 },
  quickCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  quickIcon: { fontSize: 22, marginRight: 12 },
  quickLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "#374151" },
  quickArrow: { fontSize: 16, color: "#9ca3af" },

  // ── All modules ──
  modulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
  },
  moduleCard: {
    width: "47%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  moduleIcon: { fontSize: 28, marginBottom: 8 },
  moduleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
});
