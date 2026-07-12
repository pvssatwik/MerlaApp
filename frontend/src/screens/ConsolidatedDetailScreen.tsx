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

const ConsolidatedDetailScreen = ({ navigation }: any) => {
  const [filter, setFilter] = useState("today");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const fmt = (n?: number) => n?.toLocaleString() ?? "--";
  const fmtPct = (n?: number) =>
    n != null ? `${Number(n).toFixed(2)}%` : "--";

  const fetchData = async (f = filter) => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      let url = `${API_BASE_URL}/api/transactions/consolidated-summary?filter=${f}`;
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

  const totalEggs = data.reduce((s, r) => s + (r.EGGS_PROD_COUNT || 0), 0);
  const totalFeed = data.reduce((s, r) => s + (r.FEED_USED || 0), 0);
  const totalMort = data.reduce((s, r) => s + (r.MORTALITY_LOSS || 0), 0);

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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Consolidated Summary</Text>
          <Text style={styles.headerSubtitle}>⚙️ Super Admin View</Text>
        </View>
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

      {/* Summary totals */}
      {!loading && data.length > 0 && (
        <View style={styles.totalsContainer}>
          {[
            { label: "Total Eggs", value: fmt(totalEggs), icon: "🥚" },
            { label: "Feed Used", value: `${fmt(totalFeed)} kg`, icon: "🌾" },
            { label: "Mortality", value: fmt(totalMort), icon: "📉" },
            { label: "Records", value: `${data.length}`, icon: "📋" },
          ].map((s, i) => (
            <View key={i} style={styles.totalCard}>
              <Text style={styles.totalCardIcon}>{s.icon}</Text>
              <Text style={styles.totalCardValue}>{s.value}</Text>
              <Text style={styles.totalCardLabel}>{s.label}</Text>
            </View>
          ))}
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
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.shedBadge}>
                  <Text style={styles.shedBadgeText}>{item.SHED_NO}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.flockName}>{item.FLOCK_NAME}</Text>
                  <Text style={styles.dateText}>
                    {item.PRODUCTION_DATE?.toString().split("T")[0]}
                  </Text>
                </View>
                <View style={styles.ageBadge}>
                  <Text style={styles.ageText}>Wk {item.AGE_WEEK}</Text>
                </View>
              </View>

              {/* Production */}
              <Text style={styles.sectionLabel}>🥚 Production</Text>
              <View style={styles.statsGrid}>
                {[
                  { label: "Eggs", value: fmt(item.EGGS_PROD_COUNT) },
                  { label: "Target%", value: fmtPct(item.TARGET_PCT) },
                  { label: "Actual%", value: fmtPct(item.ACTUAL_PCT) },
                  {
                    label: "Diff%",
                    value: fmtPct(item.DIFF_PCT),
                    color: (item.DIFF_PCT || 0) >= 0 ? "#16a34a" : "#dc2626",
                  },
                ].map((s, i) => (
                  <View key={i} style={styles.gridStat}>
                    <Text style={styles.gridStatLabel}>{s.label}</Text>
                    <Text
                      style={[
                        styles.gridStatValue,
                        s.color ? { color: s.color } : null,
                      ]}
                    >
                      {s.value}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Birds */}
              <Text style={styles.sectionLabel}>🐔 Bird Count</Text>
              <View style={styles.statsGrid}>
                {[
                  {
                    label: "Previous",
                    value: fmt(item.PREVIOUS_DAY_BIRD_COUNT),
                  },
                  {
                    label: "Mortality",
                    value: fmt(item.MORTALITY_LOSS),
                    color: "#dc2626",
                  },
                  { label: "Counter", value: fmt(item.COUNTER_LOSS) },
                  { label: "Current", value: fmt(item.CURRENT_DAY_BIRD_COUNT) },
                ].map((s, i) => (
                  <View key={i} style={styles.gridStat}>
                    <Text style={styles.gridStatLabel}>{s.label}</Text>
                    <Text
                      style={[
                        styles.gridStatValue,
                        s.color ? { color: s.color } : null,
                      ]}
                    >
                      {s.value}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Feed */}
              <Text style={styles.sectionLabel}>🌾 Feed</Text>
              <View style={styles.statsGrid}>
                {[
                  { label: "Used", value: `${fmt(item.FEED_USED)} kg` },
                  { label: "g/Bird", value: fmt(item.FEED_GRAMS_PER_BIRD) },
                  {
                    label: "Eggs/Ton",
                    value: fmt(item.DAILY_EGGS_PER_TON_FEED),
                  },
                  {
                    label: "Avg g/Bird (Mon)",
                    value: fmt(item.AVG_MONTHLY_FEED_GRAMS_PER_BIRD),
                  },
                ].map((s, i) => (
                  <View key={i} style={styles.gridStat}>
                    <Text style={styles.gridStatLabel}>{s.label}</Text>
                    <Text style={styles.gridStatValue}>{s.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No consolidated data</Text>
              <Text style={styles.emptySubText}>Try a different filter</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default ConsolidatedDetailScreen;

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
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
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
  totalsContainer: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    padding: 12,
    gap: 8,
  },
  totalCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 8,
  },
  totalCardIcon: { fontSize: 18, marginBottom: 4 },
  totalCardValue: { fontSize: 13, fontWeight: "800", color: "#fff" },
  totalCardLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
    textAlign: "center",
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
  emptySubText: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  shedBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  shedBadgeText: { fontSize: 12, fontWeight: "700", color: "#1e40af" },
  flockName: { fontSize: 14, fontWeight: "700", color: "#1e3a5f" },
  dateText: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  ageBadge: {
    backgroundColor: "#f3e8ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ageText: { fontSize: 12, fontWeight: "600", color: "#7e22ce" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    marginTop: 10,
    marginBottom: 6,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  gridStat: {
    width: "22%",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 8,
    borderRadius: 8,
  },
  gridStatLabel: {
    fontSize: 9,
    color: "#9ca3af",
    marginBottom: 3,
    textAlign: "center",
  },
  gridStatValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
  },
});
