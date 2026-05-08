import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar, Platform, ScrollView, Alert,
} from 'react-native';
import { API_BASE_URL, API_HEADERS } from '../../config/api';

const EggStockDetailScreen = ({ navigation }: any) => {
  const [data, setData]     = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res    = await fetch(`${API_BASE_URL}/api/transactions/egg-stock-summary`, { headers: API_HEADERS });
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

  // Totals
  const totals = data.reduce((acc, row) => ({
    opening:   acc.opening   + (row.OPENING_BAL       || 0),
    production:acc.production + (row.PRODUCTION        || 0),
    total:     acc.total     + (row.TOTAL              || 0),
    sales:     acc.sales     + (row.SALES              || 0),
    closing:   acc.closing   + (row.CLOSING_BALANCE    || 0),
    medium:    acc.medium    + (row.MEDIUM_EGGS        || 0),
    pullets:   acc.pullets   + (row.PULLETS            || 0),
  }), { opening: 0, production: 0, total: 0, sales: 0, closing: 0, medium: 0, pullets: 0 });

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Egg Stock Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>

          {/* Totals bar */}
          <View style={styles.totalsCard}>
            <Text style={styles.totalsTitle}>Overall Stock Summary</Text>
            <View style={styles.totalsGrid}>
              {[
                { label: 'Opening',    value: totals.opening },
                { label: 'Production', value: totals.production },
                { label: 'Total',      value: totals.total },
                { label: 'Sales',      value: totals.sales },
                { label: 'Closing',    value: totals.closing },
                { label: 'Medium',     value: totals.medium },
                { label: 'Pullets',    value: totals.pullets },
              ].map((item, i) => (
                <View key={i} style={styles.totalItem}>
                  <Text style={styles.totalLabel}>{item.label}</Text>
                  <Text style={[
                    styles.totalValue,
                    item.value < 0 && styles.negative,
                  ]}>
                    {item.value.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Row cards */}
          {data.map((row, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardStat}>
                  <Text style={styles.statLabel}>Opening</Text>
                  <Text style={styles.statValue}>{row.OPENING_BAL?.toLocaleString()}</Text>
                </View>
                <View style={styles.cardStat}>
                  <Text style={styles.statLabel}>Production</Text>
                  <Text style={styles.statValue}>{row.PRODUCTION?.toLocaleString()}</Text>
                </View>
                <View style={styles.cardStat}>
                  <Text style={styles.statLabel}>Total</Text>
                  <Text style={styles.statValue}>{row.TOTAL?.toLocaleString()}</Text>
                </View>
              </View>
              <View style={[styles.cardRow, { marginTop: 10 }]}>
                <View style={styles.cardStat}>
                  <Text style={styles.statLabel}>Sales</Text>
                  <Text style={styles.statValue}>{row.SALES?.toLocaleString()}</Text>
                </View>
                <View style={styles.cardStat}>
                  <Text style={styles.statLabel}>Closing</Text>
                  <Text style={[styles.statValue, row.CLOSING_BALANCE < 0 && styles.negative]}>
                    {row.CLOSING_BALANCE?.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.cardStat}>
                  <Text style={styles.statLabel}>Medium</Text>
                  <Text style={styles.statValue}>{row.MEDIUM_EGGS?.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          ))}

          {data.length === 0 && (
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No stock data found</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

export default EggStockDetailScreen;

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f3f4f6', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header:       { backgroundColor: '#1e3a5f', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  backBtn:      { width: 40 },
  backIcon:     { fontSize: 22, color: '#fff', fontWeight: '600' },
  headerTitle:  { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  container:    { padding: 16 },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText:  { marginTop: 12, color: '#6b7280' },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyText:    { fontSize: 16, color: '#6b7280' },
  totalsCard:   { backgroundColor: '#1e3a5f', borderRadius: 14, padding: 16, marginBottom: 16 },
  totalsTitle:  { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 12 },
  totalsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  totalItem:    { width: '30%', alignItems: 'center' },
  totalLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  totalValue:   { fontSize: 14, fontWeight: '800', color: '#fff' },
  negative:     { color: '#fca5a5' },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2 },
  cardRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  cardStat:     { flex: 1, alignItems: 'center' },
  statLabel:    { fontSize: 11, color: '#9ca3af', marginBottom: 3 },
  statValue:    { fontSize: 14, fontWeight: '700', color: '#374151' },
});