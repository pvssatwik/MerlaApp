import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar, Platform, FlatList, Alert,
} from 'react-native';
import { API_BASE_URL, API_HEADERS } from '../../config/api';

const EggSalesDetailScreen = ({ navigation }: any) => {
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res    = await fetch(`${API_BASE_URL}/api/transactions/egg-sales-summary`, { headers: API_HEADERS });
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

  const totalEggs   = data.reduce((s, r) => s + (r.EGGS        || 0), 0);
  const totalDamage = data.reduce((s, r) => s + (r.DAMAGED      || 0), 0);
  const totalSales  = data.reduce((s, r) => s + (r.TOTAL        || 0), 0);

  const renderRow = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.flockName}>{item.FLOCK_NO}</Text>
        <View style={styles.shedBadge}>
          <Text style={styles.shedBadgeText}>{item.SHED_NO}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Eggs</Text>
          <Text style={styles.statValue}>{item.EGGS?.toLocaleString()}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Damaged</Text>
          <Text style={[styles.statValue, { color: '#dc2626' }]}>
            {item.DAMAGED?.toLocaleString()}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Pullets</Text>
          <Text style={styles.statValue}>{item.PULLETS?.toLocaleString()}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Medium</Text>
          <Text style={styles.statValue}>{item.MEDIUM_EGGS?.toLocaleString()}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={[styles.statValue, { color: '#1e3a5f', fontWeight: '800' }]}>
            {item.TOTAL?.toLocaleString()}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Dmg%</Text>
          <Text style={[styles.statValue, { color: '#dc2626' }]}>
            {item.DAMAGE_PCT?.toFixed(2)}%
          </Text>
        </View>
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
        <Text style={styles.headerTitle}>Egg Sales Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Totals */}
      <View style={styles.totalsBar}>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Total Eggs</Text>
          <Text style={styles.totalValue}>{totalEggs.toLocaleString()}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Damaged</Text>
          <Text style={[styles.totalValue, { color: '#fca5a5' }]}>
            {totalDamage.toLocaleString()}
          </Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Total Sales</Text>
          <Text style={styles.totalValue}>{totalSales.toLocaleString()}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Flocks</Text>
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
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyText}>No sales data found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default EggSalesDetailScreen;

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#f3f4f6', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header:        { backgroundColor: '#1e3a5f', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14 },
  backBtn:       { width: 40 },
  backIcon:      { fontSize: 22, color: '#fff', fontWeight: '600' },
  headerTitle:   { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  totalsBar:     { flexDirection: 'row', backgroundColor: '#1e3a5f', padding: 12 },
  totalItem:     { flex: 1, alignItems: 'center' },
  totalLabel:    { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  totalValue:    { fontSize: 13, fontWeight: '800', color: '#fff' },
  totalDivider:  { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4 },
  list:          { padding: 12, paddingBottom: 40 },
  centered:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyText:     { fontSize: 16, color: '#6b7280' },
  card:          { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  cardHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  flockName:     { fontSize: 15, fontWeight: '700', color: '#1e3a5f' },
  shedBadge:     { backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  shedBadgeText: { fontSize: 12, fontWeight: '600', color: '#1e40af' },
  statsRow:      { flexDirection: 'row', flexWrap: 'wrap' },
  stat:          { width: '33%', alignItems: 'center', marginBottom: 8 },
  statLabel:     { fontSize: 10, color: '#9ca3af', marginBottom: 2 },
  statValue:     { fontSize: 13, fontWeight: '700', color: '#374151' },
});