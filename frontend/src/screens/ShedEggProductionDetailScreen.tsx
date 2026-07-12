import React, { useState, useEffect } from "react";
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
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { API_BASE_URL, API_HEADERS } from "../config/api";
import { getAccessToken } from "../services/authService";

const FILTERS = [
  { label: "Today", value: "today" },
  { label: "1 Week", value: "week" },
  { label: "1 Month", value: "month" },
  { label: "Custom", value: "custom" },
];

const ShedEggProductionDetailScreen = ({ navigation }: any) => {
  const [filter, setFilter] = useState("today");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const fetchData = async (f = filter) => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      let url = `${API_BASE_URL}/api/transactions/shed-egg-production-summary?filter=${f}`;
      if (f === "custom")
        url += `&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;
      const res = await fetch(url, {
        headers: { ...API_HEADERS, Authorization: `Bearer ${token}` },
      });
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

  const totalEggs = data.reduce(
    (s, r) => s + (r.DAILY_EGGS_PROD_COUNT || 0),
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
        <Text style={styles.headerTitle}>Shed Egg Production</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.filterTab,
                filter === f.value && styles.filterTabActive,
              ]}
              onPress={() => {
                setFilter(f.value);
                if (f.value !== "custom") fetchData(f.value);
              }}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === f.value && styles.filterTabTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filter === "custom" && (
        <View style={styles.customDateRow}>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowStart(true)}
          >
            <Text style={styles.datePickerLabel}>From</Text>
            <Text style={styles.datePickerValue}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          <Text>→</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowEnd(true)}
          >
            <Text style={styles.datePickerLabel}>To</Text>
            <Text style={styles.datePickerValue}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.goBtn}
            onPress={() => fetchData("custom")}
          >
            <Text style={styles.goBtnText}>Go</Text>
          </TouchableOpacity>
        </View>
      )}
      {showStart && (
        <DateTimePicker
          value={startDate}
          mode="date"
          maximumDate={new Date()}
          onChange={(e, d) => {
            setShowStart(false);
            if (d) setStartDate(d);
          }}
        />
      )}
      {showEnd && (
        <DateTimePicker
          value={endDate}
          mode="date"
          maximumDate={new Date()}
          onChange={(e, d) => {
            setShowEnd(false);
            if (d) setEndDate(d);
          }}
        />
      )}

      {/* Totals bar */}
      {!loading && data.length > 0 && (
        <View style={styles.totalsBar}>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total Eggs</Text>
            <Text style={styles.totalValue}>{totalEggs.toLocaleString()}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Records</Text>
            <Text style={styles.totalValue}>{data.length}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Sheds</Text>
            <Text style={styles.totalValue}>
              {new Set(data.map((r) => r.SHED_NO)).size}
            </Text>
          </View>
        </View>
      )}

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
                {item.PRODUCTION_DATE && (
                  <Text style={styles.dateText}>
                    {item.PRODUCTION_DATE?.toString().split("T")[0]}
                  </Text>
                )}
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Egg Type</Text>
                  <Text style={styles.statValue}>{item.EGG_TYPE || "--"}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Daily Count</Text>
                  <Text style={[styles.statValue, styles.bigNumber]}>
                    {item.DAILY_EGGS_PROD_COUNT?.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>🏠</Text>
              <Text style={styles.emptyText}>No data found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default ShedEggProductionDetailScreen;
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
  filterContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  filterTabActive: { backgroundColor: "#1e3a5f" },
  filterTabText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  filterTabTextActive: { color: "#fff" },
  customDateRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  datePickerBtn: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    padding: 10,
    borderRadius: 8,
  },
  datePickerLabel: { fontSize: 10, color: "#9ca3af", marginBottom: 2 },
  datePickerValue: { fontSize: 13, fontWeight: "600", color: "#1e3a5f" },
  goBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
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
    marginBottom: 10,
    gap: 10,
  },
  shedBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  shedBadgeText: { fontSize: 12, fontWeight: "700", color: "#1e40af" },
  flockName: { flex: 1, fontSize: 14, fontWeight: "700", color: "#1e3a5f" },
  dateText: { fontSize: 12, color: "#9ca3af" },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 3 },
  statValue: { fontSize: 14, fontWeight: "700", color: "#374151" },
  bigNumber: { fontSize: 20, color: "#2563eb", fontWeight: "800" },
});
