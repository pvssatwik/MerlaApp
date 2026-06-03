import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { authGet } from "../../config/api";

// ── Filter options ────────────────────────────────────────
const FILTERS = [
  { label: "Today", value: "today" },
  { label: "1 Week", value: "week" },
  { label: "1 Month", value: "month" },
  { label: "1 Year", value: "year" },
  { label: "Custom", value: "custom" },
];

type SummaryRow = {
  PRODUCTION_DATE: string;
  FLOCK_NAME: string;
  SHED_NO: string;
  AGE_WEEK: number;
  AGE_DAY: number;
  EGGS_PROD_COUNT: number;
  EGG_PRODUCTION_CHANGE: number;
  TARGET_PCT: number;
  ACTUAL_PCT: number;
  DIFF_PCT: number;
};

const EggProductionDetailScreen = ({ navigation }: any) => {
  const [filter, setFilter] = useState("today");
  const [data, setData] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // ── Fetch data ────────────────────────────────────────
  const fetchData = async (selectedFilter = filter) => {
    setLoading(true);
    try {
      let url = `/api/transactions/egg-production-summary?filter=${selectedFilter}`;

      if (selectedFilter === "custom") {
        url += `&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;
      }

      const result = await authGet(url);
      setData(result.data);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Totals ────────────────────────────────────────────
  const totalEggs = data.reduce((sum, r) => sum + (r.EGGS_PROD_COUNT || 0), 0);
  const avgActual =
    data.length > 0
      ? (
          data.reduce((sum, r) => sum + (r.ACTUAL_PCT || 0), 0) / data.length
        ).toFixed(2)
      : "0";
  const avgTarget =
    data.length > 0
      ? (
          data.reduce((sum, r) => sum + (r.TARGET_PCT || 0), 0) / data.length
        ).toFixed(2)
      : "0";

  // ── Render row ────────────────────────────────────────
  const renderRow = ({ item }: { item: SummaryRow }) => {
    const diffColor = (item.DIFF_PCT || 0) >= 0 ? "#16a34a" : "#dc2626";

    return (
      <View style={styles.row}>
        {/* Date + Flock */}
        <View style={styles.rowHeader}>
          <Text style={styles.rowDate}>
            {item.PRODUCTION_DATE?.toString().split("T")[0]}
          </Text>
          <View style={styles.shedBadge}>
            <Text style={styles.shedBadgeText}>{item.SHED_NO}</Text>
          </View>
        </View>

        <Text style={styles.flockName}>{item.FLOCK_NAME}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Eggs</Text>
            <Text style={styles.statValue}>
              {item.EGGS_PROD_COUNT?.toLocaleString()}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Age (Wk)</Text>
            <Text style={styles.statValue}>{item.AGE_WEEK}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Target %</Text>
            <Text style={styles.statValue}>{item.TARGET_PCT || "--"}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Actual %</Text>
            <Text style={styles.statValue}>{item.ACTUAL_PCT?.toFixed(2)}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Diff %</Text>
            <Text style={[styles.statValue, { color: diffColor }]}>
              {item.DIFF_PCT?.toFixed(2) || "--"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Egg Production Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Filter tabs ── */}
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

      {/* ── Custom date pickers ── */}
      {filter === "custom" && (
        <View style={styles.customDateRow}>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowStart(true)}
          >
            <Text style={styles.datePickerLabel}>From</Text>
            <Text style={styles.datePickerValue}>{formatDate(startDate)}</Text>
          </TouchableOpacity>

          <Text style={styles.dateArrow}>→</Text>

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
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={new Date()}
          onChange={(e, date) => {
            setShowStart(false);
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEnd && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={new Date()}
          onChange={(e, date) => {
            setShowEnd(false);
            if (date) setEndDate(date);
          }}
        />
      )}

      {/* ── Summary totals ── */}
      {!loading && data.length > 0 && (
        <View style={styles.totalsBar}>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total Eggs</Text>
            <Text style={styles.totalValue}>{totalEggs.toLocaleString()}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Avg Target %</Text>
            <Text style={styles.totalValue}>{avgTarget}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Avg Actual %</Text>
            <Text style={styles.totalValue}>{avgActual}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Records</Text>
            <Text style={styles.totalValue}>{data.length}</Text>
          </View>
        </View>
      )}

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🥚</Text>
          <Text style={styles.emptyText}>No data found</Text>
          <Text style={styles.emptySubText}>Try a different filter</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default EggProductionDetailScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  // ── Header ──
  header: {
    backgroundColor: "#1e3a5f",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  backBtn: { width: 40, justifyContent: "center" },
  backIcon: { fontSize: 22, color: "#fff", fontWeight: "600" },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },

  // ── Filter tabs ──
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

  // ── Custom date ──
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
  dateArrow: { fontSize: 16, color: "#9ca3af" },
  goBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // ── Totals bar ──
  totalsBar: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    padding: 12,
  },
  totalItem: { flex: 1, alignItems: "center" },
  totalLabel: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 2 },
  totalValue: { fontSize: 14, fontWeight: "800", color: "#fff" },
  totalDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 2,
  },

  // ── List ──
  list: { padding: 12, paddingBottom: 40 },

  // ── Row card ──
  row: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  rowDate: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  shedBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  shedBadgeText: { fontSize: 12, fontWeight: "600", color: "#1e40af" },
  flockName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e3a5f",
    marginBottom: 10,
  },

  // Stats
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  stat: { alignItems: "center", flex: 1 },
  statLabel: { fontSize: 10, color: "#9ca3af", marginBottom: 3 },
  statValue: { fontSize: 13, fontWeight: "700", color: "#374151" },

  // ── States ──
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: { marginTop: 12, color: "#6b7280", fontSize: 14 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#374151" },
  emptySubText: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
});
