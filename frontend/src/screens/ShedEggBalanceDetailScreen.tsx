import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Platform,
  FlatList,
  Alert,
} from "react-native";
import { API_BASE_URL, API_HEADERS } from "../config/api";
import { getAccessToken } from "../services/authService";

const ShedEggBalanceDetailScreen = ({ navigation }: any) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(
        `${API_BASE_URL}/api/transactions/shed-egg-balance`,
        { headers: { ...API_HEADERS, Authorization: `Bearer ${token}` } },
      );
      const result = await res.json();
      if (result.success) setData(result.data);
      else Alert.alert("Error", result.error);
    } catch {
      Alert.alert("Error", "Could not fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBalance = data.reduce(
    (s, r) => s + (r.SHED_BALANCE_EGG_COUNT || 0),
    0,
  );

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shed Egg Balance</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.totalsBar}>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalValue}>{totalBalance.toLocaleString()}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Sheds</Text>
          <Text style={styles.totalValue}>{data.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.shedBadge}>
                  <Text style={styles.shedBadgeText}>{item.SHED_NO}</Text>
                </View>
                <Text style={styles.flockName}>{item.FLOCK_NAME}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>🥚 Balance Eggs</Text>
                <Text
                  style={[
                    styles.balanceValue,
                    item.SHED_BALANCE_EGG_COUNT < 0 && styles.negative,
                  ]}
                >
                  {item.SHED_BALANCE_EGG_COUNT?.toLocaleString()}
                </Text>
              </View>
              <View style={styles.progressBg}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(Math.abs((item.SHED_BALANCE_EGG_COUNT / (totalBalance || 1)) * 100), 100)}%`,
                      backgroundColor:
                        item.SHED_BALANCE_EGG_COUNT >= 0
                          ? "#22c55e"
                          : "#ef4444",
                    },
                  ]}
                />
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>🥚</Text>
              <Text style={styles.emptyText}>No data found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default ShedEggBalanceDetailScreen;

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
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  backBtn: { width: 40 },
  backIcon: { fontSize: 22, color: "#fff", fontWeight: "600" },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  totalsBar: { flexDirection: "row", backgroundColor: "#1e3a5f", padding: 12 },
  totalItem: { flex: 1, alignItems: "center" },
  totalLabel: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 2 },
  totalValue: { fontSize: 14, fontWeight: "800", color: "#fff" },
  totalDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 2,
  },
  list: { padding: 12, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#374151" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  shedBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  shedBadgeText: { fontSize: 12, fontWeight: "700", color: "#166534" },
  flockName: { flex: 1, fontSize: 14, fontWeight: "700", color: "#1e3a5f" },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: { fontSize: 13, color: "#6b7280" },
  balanceValue: { fontSize: 20, fontWeight: "800", color: "#22c55e" },
  negative: { color: "#ef4444" },
  progressBg: {
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: 6, borderRadius: 3 },
});
