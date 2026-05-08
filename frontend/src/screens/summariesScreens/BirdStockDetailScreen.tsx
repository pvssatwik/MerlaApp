import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar, Platform,
  FlatList, Alert, ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_BASE_URL, API_HEADERS } from '../../config/api';

const FILTERS = [
  { label: 'Today',   value: 'today'  },
  { label: '1 Week',  value: 'week'   },
  { label: '1 Month', value: 'month'  },
  { label: '1 Year',  value: 'year'   },
  { label: 'Custom',  value: 'custom' },
];

const BirdStockDetailScreen = ({ navigation }: any) => {
  const [filter, setFilter]   = useState('today');
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate]     = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd]     = useState(false);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const fetchData = async (selectedFilter = filter) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/transactions/cull-birds-summary?filter=${selectedFilter}`;
      if (selectedFilter === 'custom') {
        url += `&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}`;
      }
      const res    = await fetch(url, { headers: API_HEADERS });
      const result = await res.json();
      if (result.success) setData(result.data);
      else Alert.alert('Error', result.error);
    } catch {
      Alert.alert('Error', 'Could not fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalClosing = data.reduce((s, r) => s + (r.CLOSING_BALANCE || 0), 0);
  const totalDeath   = data.reduce((s, r) => s + (r.DEATH           || 0), 0);
  const totalSales   = data.reduce((s, r) => s + (r.TOTAL_SALES     || 0), 0);

  const renderRow = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.flockName}>{item.FLOCK_NO}</Text>
          <Text style={styles.rowDate}>{item.REPORTING_DATE?.toString().split('T')[0]}</Text>
        </View>
        <View style={styles.shedBadge}>
          <Text style={styles.shedBadgeText}>{item.SHED_NO}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        {[
          { label: 'Opening', value: item.OPENING_BALANCE },
          { label: 'Counter', value: item.COUNTER },
          { label: 'Total',   value: item.TOTAL },
          { label: 'Sales',   value: item.TOTAL_SALES },
          { label: 'Death',   value: item.DEATH, red: true },
          { label: 'Closing', value: item.CLOSING_BALANCE },
        ].map((s, i) => (
          <View key={i} style={styles.stat}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={[styles.statValue, s.red && { color: '#dc2626' }]}>
              {s.value?.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bird Stock Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterTab, filter === f.value && styles.filterTabActive]}
              onPress={() => { setFilter(f.value); if (f.value !== 'custom') fetchData(f.value); }}
            >
              <Text style={[styles.filterTabText, filter === f.value && styles.filterTabTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Custom date */}
      {filter === 'custom' && (
        <View style={styles.customDateRow}>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowStart(true)}>
            <Text style={styles.datePickerLabel}>From</Text>
            <Text style={styles.datePickerValue}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          <Text style={styles.dateArrow}>→</Text>
          <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowEnd(true)}>
            <Text style={styles.datePickerLabel}>To</Text>
            <Text style={styles.datePickerValue}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.goBtn} onPress={() => fetchData('custom')}>
            <Text style={styles.goBtnText}>Go</Text>
          </TouchableOpacity>
        </View>
      )}

      {showStart && (
        <DateTimePicker value={startDate} mode="date" maximumDate={new Date()}
          onChange={(e, d) => { setShowStart(false); if (d) setStartDate(d); }} />
      )}
      {showEnd && (
        <DateTimePicker value={endDate} mode="date" maximumDate={new Date()}
          onChange={(e, d) => { setShowEnd(false); if (d) setEndDate(d); }} />
      )}

      {/* Totals */}
      {!loading && data.length > 0 && (
        <View style={styles.totalsBar}>
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Closing Balance</Text>
            <Text style={styles.totalValue}>{totalClosing.toLocaleString()}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total Deaths</Text>
            <Text style={[styles.totalValue, { color: '#fca5a5' }]}>{totalDeath.toLocaleString()}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Total Sales</Text>
            <Text style={styles.totalValue}>{totalSales.toLocaleString()}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Records</Text>
            <Text style={styles.totalValue}>{data.length}</Text>
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
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>🐔</Text>
              <Text style={styles.emptyText}>No data found</Text>
              <Text style={styles.emptySubText}>Try a different filter</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default BirdStockDetailScreen;

const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#f3f4f6', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header:            { backgroundColor: '#1e3a5f', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  backBtn:           { width: 40 },
  backIcon:          { fontSize: 22, color: '#fff', fontWeight: '600' },
  headerTitle:       { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  filterContainer:   { backgroundColor: '#fff', paddingVertical: 10, paddingLeft: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  filterTab:         { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f3f4f6', marginRight: 8 },
  filterTabActive:   { backgroundColor: '#1e3a5f' },
  filterTabText:     { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTabTextActive:{ color: '#fff' },
  customDateRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  datePickerBtn:     { flex: 1, backgroundColor: '#f3f4f6', padding: 10, borderRadius: 8 },
  datePickerLabel:   { fontSize: 10, color: '#9ca3af', marginBottom: 2 },
  datePickerValue:   { fontSize: 13, fontWeight: '600', color: '#1e3a5f' },
  dateArrow:         { fontSize: 16, color: '#9ca3af' },
  goBtn:             { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  goBtnText:         { color: '#fff', fontWeight: '700', fontSize: 13 },
  totalsBar:         { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: 12 },
  totalItem:         { flex: 1, alignItems: 'center' },
  totalLabel:        { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  totalValue:        { fontSize: 13, fontWeight: '800', color: '#fff' },
  totalDivider:      { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  list:              { padding: 12, paddingBottom: 40 },
  centered:          { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon:         { fontSize: 48, marginBottom: 12 },
  emptyText:         { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptySubText:      { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  card:              { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  flockName:         { fontSize: 15, fontWeight: '700', color: '#1e3a5f' },
  rowDate:           { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  shedBadge:         { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  shedBadgeText:     { fontSize: 12, fontWeight: '600', color: '#1e40af' },
  statsRow:          { flexDirection: 'row', flexWrap: 'wrap' },
  stat:              { width: '33%', alignItems: 'center', marginBottom: 8 },
  statLabel:         { fontSize: 10, color: '#9ca3af', marginBottom: 2 },
  statValue:         { fontSize: 13, fontWeight: '700', color: '#374151' },
});