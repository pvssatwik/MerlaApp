import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { FORMS } from "../config/forms";

const { width, height } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.78;

// ── Role helpers (same as HomeScreen) ────────────────
const SUPERVISOR_ROLES = [
  "SUPERVISORS",
  "EGG_GODOWN_SUPERVISOR",
  "FEED_GODOWN_SUPERVISOR",
  "6",
  "7",
  "8",
];
const ADMIN_VIEW_ROLES = ["ADMIN", "2"];
const SUPERADMIN_ROLES = ["SUPER_ADMIN", "1"];

const isSupervisor = (role: string) => SUPERVISOR_ROLES.includes(role);
const isAdminViewOnly = (role: string) => ADMIN_VIEW_ROLES.includes(role);
const isSuperAdmin = (role: string) => SUPERADMIN_ROLES.includes(role);
const canViewSummaries = (role: string) => !isSupervisor(role);
const canEnterData = (role: string) => !isAdminViewOnly(role);

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
    shedEggProduction: "🏠",
    shedFeedReceived: "📥",
  };
  return icons[api] || "📝";
};

// ── Summary links for roles that can view ────────────
const SUMMARY_LINKS = [
  { label: "Egg Production", screen: "EggProductionDetail", icon: "🥚" },
  { label: "Bird Stock", screen: "BirdStockDetail", icon: "🐔" },
  { label: "Feed Stock", screen: "FeedStockDetail", icon: "🌾" },
  { label: "Egg Sales", screen: "EggSalesDetail", icon: "💰" },
  { label: "Godown Stock", screen: "EggStockDetail", icon: "📦" },
  {
    label: "Shed Egg Production",
    screen: "ShedEggProductionDetail",
    icon: "🏠",
  },
  { label: "Shed Egg Balance", screen: "ShedEggBalanceDetail", icon: "🥚" },
  { label: "Shed Feed Balance", screen: "ShedFeedBalanceDetail", icon: "🌾" },
];

const SUPERADMIN_SUMMARY_LINKS = [
  ...SUMMARY_LINKS,
  { label: "Consolidated Report", screen: "ConsolidatedDetail", icon: "📊" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  userRole?: string;
  onLogout?: () => void;
};

const SidebarMenu = ({
  visible,
  onClose,
  navigation,
  userRole = "",
  onLogout,
}: Props) => {
  const [formsExpanded, setFormsExpanded] = useState(true);
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -SIDEBAR_WIDTH,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start(() => setModalVisible(false));
    }
  }, [visible]);

  const navigateTo = (screenName: string, params?: any) => {
    onClose();
    setTimeout(() => navigation.navigate(screenName, params), 280);
  };

  const navigateToForm = (form: any) => {
    onClose();
    setTimeout(
      () =>
        navigation.navigate("DynamicForm", {
          title: form.title,
          fields: form.fields,
          api: form.api,
        }),
      280,
    );
  };

  // Determine what summaries to show
  const summaryLinks = isSuperAdmin(userRole)
    ? SUPERADMIN_SUMMARY_LINKS
    : SUMMARY_LINKS;

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Sidebar */}
        <Animated.View
          style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.logo}>🐔 Merla Farms</Text>
              <Text style={styles.subtitle}>
                {isSuperAdmin(userRole)
                  ? "⚙️ Super Admin"
                  : isAdminViewOnly(userRole)
                    ? "👑 Admin"
                    : isSupervisor(userRole)
                      ? "👷 Supervisor"
                      : "Farm Management"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Dashboard ── */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("Home")}
            >
              <Text style={styles.menuIcon}>🏠</Text>
              <Text style={styles.menuText}>Dashboard</Text>
            </TouchableOpacity>

            {/* ── Admin Panel — SuperAdmin only ── */}
            {isSuperAdmin(userRole) && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={[styles.menuItem, styles.adminMenuItem]}
                  onPress={() => navigateTo("SuperAdmin")}
                >
                  <Text style={styles.menuIcon}>⚙️</Text>
                  <Text style={styles.menuText}>Admin Panel</Text>
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>SA</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuItem, styles.adminMenuItem]}
                  onPress={() => navigateTo("SessionAudit")}
                >
                  <Text style={styles.menuIcon}>📊</Text>
                  <Text style={styles.menuText}>Session Audit</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.divider} />

            {/* ── Data Entry — hidden for admin-only roles ── */}
            {canEnterData(userRole) && (
              <>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setFormsExpanded(!formsExpanded)}
                >
                  <Text style={styles.sectionTitle}>✍️ DATA ENTRY</Text>
                  <Text style={styles.chevron}>
                    {formsExpanded ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>

                {formsExpanded &&
                  FORMS.map((form, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.subMenuItem}
                      onPress={() => navigateToForm(form)}
                    >
                      <Text style={styles.subMenuIcon}>
                        {getFormIcon(form.api)}
                      </Text>
                      <Text style={styles.subMenuText}>{form.title}</Text>
                    </TouchableOpacity>
                  ))}

                <View style={styles.divider} />
              </>
            )}

            {/* ── Summaries — hidden for supervisors ── */}
            {canViewSummaries(userRole) && (
              <>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => setSummaryExpanded(!summaryExpanded)}
                >
                  <Text style={styles.sectionTitle}>📊 SUMMARIES</Text>
                  <Text style={styles.chevron}>
                    {summaryExpanded ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>

                {summaryExpanded &&
                  summaryLinks.map((link, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.subMenuItem}
                      onPress={() => navigateTo(link.screen)}
                    >
                      <Text style={styles.subMenuIcon}>{link.icon}</Text>
                      <Text style={styles.subMenuText}>{link.label}</Text>
                    </TouchableOpacity>
                  ))}

                <View style={styles.divider} />
              </>
            )}

            {/* ── Empty state for admin view-only ── */}
            {isAdminViewOnly(userRole) && !canEnterData(userRole) && (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>
                  ℹ️ You have view-only access. Use Summaries above to view
                  reports.
                </Text>
              </View>
            )}

            {/* ── Empty state for supervisors ── */}
            {isSupervisor(userRole) && !canViewSummaries(userRole) && (
              <View style={styles.emptySection}>
                <Text style={styles.emptySectionText}>
                  ℹ️ You have data entry access only. Contact your admin for
                  reports.
                </Text>
              </View>
            )}

            <View style={{ height: 60 }} />
          </ScrollView>

          {/* Logout */}
          <View style={styles.footer}>
            {onLogout && (
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  onClose();
                  setTimeout(() => onLogout(), 300);
                }}
              >
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.footerVersion}>Merla Farms v1.0.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default SidebarMenu;

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#1e3a5f",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 44,
    elevation: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 4, height: 0 },
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  logo: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  closeBtn: { padding: 4, marginLeft: 8 },
  closeText: { color: "#fff", fontSize: 20, fontWeight: "300" },
  scroll: { flex: 1, paddingTop: 8 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  adminMenuItem: { backgroundColor: "rgba(255,255,255,0.08)" },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuText: { fontSize: 15, fontWeight: "600", color: "#fff", flex: 1 },
  adminBadge: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  adminBadgeText: { fontSize: 10, fontWeight: "800", color: "#1e3a5f" },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 8,
    marginHorizontal: 16,
  },
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
  subMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 10,
  },
  subMenuIcon: { fontSize: 15, marginRight: 12, width: 24 },
  subMenuText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  emptySection: {
    margin: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
  },
  emptySectionText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  logoutIcon: { fontSize: 18 },
  logoutText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
  },
  footerVersion: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
  },
});
