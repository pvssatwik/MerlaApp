import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import {
  getPendingUsers,
  getAllUsers,
  getRoles,
  getSheds,
  approveUser,
  rejectUser,
  updateUserStatus,
} from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#fef3c7", text: "#92400e" },
  ACTIVE: { bg: "#dcfce7", text: "#166534" },
  APPROVED: { bg: "#dcfce7", text: "#166534" },
  REJECTED: { bg: "#fee2e2", text: "#991b1b" },
  BLOCKED: { bg: "#f3f4f6", text: "#374151" },
  INACTIVE: { bg: "#f3f4f6", text: "#6b7280" },
};

const TABS = [
  { id: "pending", label: "Pending", icon: "⏳" },
  { id: "all", label: "All Users", icon: "👥" },
];

// Roles that REQUIRE shed assignment
const SHED_REQUIRED_ROLE_IDS = ["6", "7", "8"]; // SUPERVISORS, EGG_GODOWN_SUPERVISOR, FEED_GODOWN_SUPERVISOR

type User = {
  USERID: string;
  FARM_NAME: string;
  USER_FIRSTNAME: string;
  USER_LASTNAME: string;
  USER_EMAIL: string;
  USER_CONTACT_NO: string;
  USER_DOB?: string;
  STATUS: string;
  ROLE_ID?: string;
  ROLE_NAME?: string;
  SHED_NAME?: string;
};

type Role = { ROLE_ID: string; ROLE_NAME: string; ROLE_DESCRIPTION: string };
type Shed = { SHED_NO: number; SHED_NAME: string };

const getRoleIcon = (roleName: string) => {
  const icons: Record<string, string> = {
    SUPER_ADMIN: "👑",
    ADMIN: "🛡️",
    INCHARGE: "🏢",
    EGG_GODOWN_INCHARGE: "🥚",
    FEED_GODOWN_INCHARGE: "🌾",
    SUPERVISORS: "👷",
    EGG_GODOWN_SUPERVISOR: "🥚",
    FEED_GODOWN_SUPERVISOR: "🌾",
  };
  return icons[roleName?.toUpperCase()] || "👤";
};

const SuperAdminScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Approve modal
  const [approveModal, setApproveModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [sheds, setSheds] = useState<Shed[]>([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedShed, setSelectedShed] = useState("");
  const [approving, setApproving] = useState(false);

  const isShedRequired = (roleId: string) =>
    SHED_REQUIRED_ROLE_IDS.includes(String(roleId));

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result =
        activeTab === "pending" ? await getPendingUsers() : await getAllUsers();
      setUsers(result.data || []);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadRolesAndSheds = async () => {
    try {
      const [rolesRes, shedsRes] = await Promise.all([getRoles(), getSheds()]);
      // Filter out SUPER_ADMIN from assignable roles
      const assignableRoles = (rolesRes.data || []).filter(
        (r: Role) => r.ROLE_NAME !== "SUPER_ADMIN",
      );
      setRoles(assignableRoles);
      setSheds(shedsRes.data || []);
    } catch (err) {
      console.error("Failed to load roles/sheds:", err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const openApproveModal = async (u: User) => {
    setSelectedUser(u);
    setSelectedRole("");
    setSelectedShed("");
    await loadRolesAndSheds();
    setApproveModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRole) {
      Alert.alert("Validation", "Please select a role");
      return;
    }
    if (isShedRequired(selectedRole) && !selectedShed) {
      Alert.alert("Validation", "Please select a shed for this role");
      return;
    }

    setApproving(true);
    try {
      await approveUser({
        userid: selectedUser!.USERID,
        role_id: selectedRole,
        shed_name: isShedRequired(selectedRole) ? selectedShed : undefined,
      });
      Alert.alert(
        "Success ✅",
        `${selectedUser!.USER_FIRSTNAME} approved successfully!`,
      );
      setApproveModal(false);
      setExpandedUser(null);
      loadUsers();
    } catch (err: any) {
      Alert.alert("Error ❌", err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = (u: User) => {
    Alert.alert(
      "Reject User",
      `Reject ${u.USER_FIRSTNAME} ${u.USER_LASTNAME}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await rejectUser(u.USERID);
              Alert.alert("Done", "User rejected");
              setExpandedUser(null);
              loadUsers();
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ],
    );
  };

  const handleStatusChange = (u: User, newStatus: string) => {
    Alert.alert(
      `${newStatus === "BLOCKED" ? "Block" : "Activate"} User`,
      `${newStatus === "BLOCKED" ? "Block" : "Activate"} ${u.USER_FIRSTNAME}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: newStatus === "BLOCKED" ? "destructive" : "default",
          onPress: async () => {
            try {
              await updateUserStatus(u.USERID, newStatus);
              loadUsers();
            } catch (err: any) {
              Alert.alert("Error", err.message);
            }
          },
        },
      ],
    );
  };

  const formatDOB = (dob?: string) => {
    if (!dob) return "Not provided";
    try {
      return new Date(dob).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dob;
    }
  };

  const renderUser = ({ item }: { item: User }) => {
    const statusColor = STATUS_COLORS[item.STATUS] || STATUS_COLORS.INACTIVE;
    const isExpanded = expandedUser === item.USERID;

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => setExpandedUser(isExpanded ? null : item.USERID)}
        activeOpacity={0.95}
      >
        {/* ── Card Header ── */}
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {item.USER_FIRSTNAME?.[0]?.toUpperCase() || "?"}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {item.USER_FIRSTNAME} {item.USER_LASTNAME}
            </Text>
            <Text style={styles.userId}>ID: {item.USERID}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}
            >
              <Text style={[styles.statusText, { color: statusColor.text }]}>
                {item.STATUS}
              </Text>
            </View>
            <Text style={styles.expandIcon}>{isExpanded ? "▲" : "▼"}</Text>
          </View>
        </View>

        {/* ── Expanded Details ── */}
        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.expandDivider} />

            <View style={styles.detailsGrid}>
              {[
                { label: "📧 Email", value: item.USER_EMAIL || "Not provided" },
                {
                  label: "📞 Phone",
                  value: item.USER_CONTACT_NO || "Not provided",
                },
                { label: "🎂 Date of Birth", value: formatDOB(item.USER_DOB) },
                { label: "🏡 Farm", value: item.FARM_NAME || "Not provided" },
                ...(item.ROLE_NAME
                  ? [{ label: "🎭 Role", value: item.ROLE_NAME }]
                  : []),
                ...(item.SHED_NAME
                  ? [{ label: "🏠 Shed", value: item.SHED_NAME }]
                  : []),
              ].map((detail, i) => (
                <View key={i} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{detail.label}</Text>
                  <Text style={styles.detailValue}>{detail.value}</Text>
                </View>
              ))}
            </View>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              {item.STATUS === "PENDING" && (
                <>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => openApproveModal(item)}
                  >
                    <Text style={styles.approveBtnText}>✓ Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleReject(item)}
                  >
                    <Text style={styles.rejectBtnText}>✕ Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              {(item.STATUS === "ACTIVE" || item.STATUS === "APPROVED") && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.blockBtn]}
                  onPress={() => handleStatusChange(item, "BLOCKED")}
                >
                  <Text style={styles.blockBtnText}>🚫 Block</Text>
                </TouchableOpacity>
              )}
              {(item.STATUS === "BLOCKED" || item.STATUS === "INACTIVE") && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.activateBtn]}
                  onPress={() => handleStatusChange(item, "ACTIVE")}
                >
                  <Text style={styles.activateBtnText}>✓ Activate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>
            {user?.firstname} {user?.lastname}
          </Text>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.icon} {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Stats ── */}
      {!loading && (
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            {activeTab === "pending" ? "⏳ Pending" : "👥 Total"}:{" "}
            <Text style={styles.statsCount}>{users.length}</Text>
          </Text>
          <Text style={styles.statsHint}>Tap card to expand</Text>
        </View>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.USERID}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2563eb"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>
                {activeTab === "pending" ? "✅" : "👤"}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === "pending"
                  ? "No pending requests"
                  : "No users found"}
              </Text>
            </View>
          }
        />
      )}

      {/* ── Approve Modal ── */}
      <Modal
        visible={approveModal}
        transparent
        animationType="slide"
        onRequestClose={() => setApproveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Approve User</Text>
                <TouchableOpacity onPress={() => setApproveModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* User summary */}
              {selectedUser && (
                <View style={styles.modalUserInfo}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {selectedUser.USER_FIRSTNAME?.[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalUserName}>
                      {selectedUser.USER_FIRSTNAME} {selectedUser.USER_LASTNAME}
                    </Text>
                    <Text style={styles.modalUserEmail}>
                      {selectedUser.USER_EMAIL}
                    </Text>
                    <Text style={styles.modalUserId}>
                      📞 {selectedUser.USER_CONTACT_NO}
                    </Text>
                    {selectedUser.USER_DOB && (
                      <Text style={styles.modalUserId}>
                        🎂 {formatDOB(selectedUser.USER_DOB)}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Select Role */}
              <Text style={styles.sectionLabel}>Select Role *</Text>
              <View style={styles.roleGrid}>
                {roles.map((role) => (
                  <TouchableOpacity
                    key={role.ROLE_ID}
                    style={[
                      styles.roleOption,
                      selectedRole === String(role.ROLE_ID) &&
                        styles.roleOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedRole(String(role.ROLE_ID));
                      setSelectedShed(""); // reset shed on role change
                    }}
                  >
                    <Text style={styles.roleIcon}>
                      {getRoleIcon(role.ROLE_NAME)}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.roleLabel,
                          selectedRole === String(role.ROLE_ID) &&
                            styles.roleLabelSelected,
                        ]}
                      >
                        {role.ROLE_NAME}
                      </Text>
                      {role.ROLE_DESCRIPTION ? (
                        <Text style={styles.roleDesc} numberOfLines={2}>
                          {role.ROLE_DESCRIPTION}
                        </Text>
                      ) : null}
                    </View>
                    {selectedRole === String(role.ROLE_ID) && (
                      <Text style={styles.roleCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Shed selection — ONLY for roles 6, 7, 8 */}
              {selectedRole && isShedRequired(selectedRole) && (
                <>
                  <View style={styles.shedHeader}>
                    <Text style={styles.sectionLabel}>Assign Shed *</Text>
                    <Text style={styles.shedHint}>Required for this role</Text>
                  </View>
                  <View style={styles.shedGrid}>
                    {sheds.map((shed) => (
                      <TouchableOpacity
                        key={shed.SHED_NO}
                        style={[
                          styles.shedOption,
                          selectedShed === shed.SHED_NAME &&
                            styles.shedOptionSelected,
                        ]}
                        onPress={() => setSelectedShed(shed.SHED_NAME)}
                      >
                        <Text
                          style={[
                            styles.shedLabel,
                            selectedShed === shed.SHED_NAME &&
                              styles.shedLabelSelected,
                          ]}
                        >
                          🏠 {shed.SHED_NAME}
                        </Text>
                        {selectedShed === shed.SHED_NAME && (
                          <Text style={styles.shedCheck}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Info for non-shed roles */}
              {selectedRole && !isShedRequired(selectedRole) && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    ℹ️ This role has access to all sheds. No shed assignment
                    needed.
                  </Text>
                </View>
              )}

              {/* Approve button */}
              <TouchableOpacity
                style={[
                  styles.approveConfirmBtn,
                  approving && styles.approveBtnDisabled,
                ]}
                onPress={handleApprove}
                disabled={approving}
              >
                {approving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.approveConfirmBtnText}>
                    ✓ Approve User
                  </Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SuperAdminScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: "#1e3a5f",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 22, color: "#fff", fontWeight: "600" },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.65)" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabActive: { borderBottomWidth: 3, borderBottomColor: "#1e3a5f" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#9ca3af" },
  tabTextActive: { color: "#1e3a5f" },

  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 10,
    paddingHorizontal: 16,
  },
  statsText: { fontSize: 13, color: "#1e40af" },
  statsCount: { fontWeight: "800" },
  statsHint: { fontSize: 11, color: "#93c5fd" },

  list: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 60,
  },
  loadingText: { marginTop: 12, color: "#6b7280" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#374151" },

  userCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  userHeader: { flexDirection: "row", alignItems: "center" },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#1e3a5f",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatarText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "700", color: "#1e3a5f" },
  userId: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "700" },
  expandIcon: { fontSize: 10, color: "#9ca3af" },

  expandedSection: { marginTop: 12 },
  expandDivider: { height: 1, backgroundColor: "#f3f4f6", marginBottom: 14 },
  detailsGrid: { gap: 10, marginBottom: 16 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  detailLabel: { fontSize: 13, color: "#9ca3af", flex: 1 },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    flex: 2,
    textAlign: "right",
  },

  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  approveBtn: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  approveBtnText: { color: "#166534", fontWeight: "700", fontSize: 13 },
  rejectBtn: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  rejectBtnText: { color: "#991b1b", fontWeight: "700", fontSize: 13 },
  blockBtn: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  blockBtnText: { color: "#374151", fontWeight: "700", fontSize: 13 },
  activateBtn: {
    backgroundColor: "#dbeafe",
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  activateBtnText: { color: "#1e40af", fontWeight: "700", fontSize: 13 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1e3a5f" },
  modalClose: { fontSize: 20, color: "#9ca3af", padding: 4 },
  modalUserInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1e3a5f",
    justifyContent: "center",
    alignItems: "center",
  },
  modalAvatarText: { color: "#fff", fontWeight: "700", fontSize: 20 },
  modalUserName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e3a5f",
    marginBottom: 2,
  },
  modalUserEmail: { fontSize: 13, color: "#6b7280" },
  modalUserId: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
  },
  roleGrid: { gap: 10, marginBottom: 20 },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    gap: 10,
  },
  roleOptionSelected: { borderColor: "#1e3a5f", backgroundColor: "#eff6ff" },
  roleIcon: { fontSize: 22 },
  roleLabel: { fontSize: 14, fontWeight: "600", color: "#374151" },
  roleLabelSelected: { color: "#1e3a5f" },
  roleDesc: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  roleCheck: { fontSize: 16, color: "#1e3a5f", fontWeight: "800" },

  shedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  shedHint: { fontSize: 11, color: "#f59e0b", fontWeight: "600" },
  shedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  shedOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    gap: 6,
  },
  shedOptionSelected: { borderColor: "#22c55e", backgroundColor: "#dcfce7" },
  shedLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  shedLabelSelected: { color: "#166534" },
  shedCheck: { fontSize: 14, color: "#22c55e", fontWeight: "800" },

  infoBox: {
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoText: { fontSize: 13, color: "#1e40af", lineHeight: 18 },

  approveConfirmBtn: {
    backgroundColor: "#1e3a5f",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  approveBtnDisabled: { backgroundColor: "#93c5fd" },
  approveConfirmBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
