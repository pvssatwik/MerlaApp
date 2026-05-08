import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { FORMS } from "../config/forms";

// ── Icon mapping ──────────────────────────────────────────
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

const CustomDrawer = (props: any) => {
  const { navigation } = props;
  const [expanded, setExpanded] = useState(true);

  const navigateToForm = (form: any) => {
    navigation.closeDrawer();
    navigation.navigate("MainStack", {
      screen: "DynamicForm",
      params: {
        title: form.title,
        fields: form.fields,
        api: form.api,
      },
    });
  };

  const navigateHome = () => {
    navigation.closeDrawer();
    navigation.navigate("MainStack", { screen: "Home" });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.logo}>🐔 Merla Farms</Text>
        <Text style={styles.subtitle}>Farm Management System</Text>
      </View>

      {/* ── Menu Items ── */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Dashboard */}
        <TouchableOpacity style={styles.menuItem} onPress={navigateHome}>
          <Text style={styles.menuIcon}>🏠</Text>
          <Text style={styles.menuText}>Dashboard</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Transactions section */}
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.sectionTitle}>📋 TRANSACTIONS</Text>
          <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {/* Form list */}
        {expanded &&
          FORMS.map((form, index) => (
            <TouchableOpacity
              key={index}
              style={styles.subMenuItem}
              onPress={() => navigateToForm(form)}
            >
              <Text style={styles.subMenuIcon}>{getFormIcon(form.api)}</Text>
              <Text style={styles.subMenuText}>{form.title}</Text>
            </TouchableOpacity>
          ))}
      </DrawerContentScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Merla Farms © 2026</Text>
      </View>
    </SafeAreaView>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1e3a5f" },

  // Header
  header: {
    padding: 24,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  logo: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "rgba(255,255,255,0.6)" },

  scrollContent: { paddingTop: 8, paddingBottom: 20 },

  // Dashboard item
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuText: { fontSize: 15, fontWeight: "600", color: "#fff" },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 8,
    marginHorizontal: 16,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.2,
  },
  chevron: { fontSize: 10, color: "rgba(255,255,255,0.5)" },

  // Form items
  subMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 10,
  },
  subMenuIcon: { fontSize: 16, marginRight: 12, width: 24 },
  subMenuText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },

  // Footer
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  footerText: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
});
