import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar, Platform, FlatList, Alert,
} from 'react-native';
import { API_BASE_URL, API_HEADERS } from '../../config/api';

const FeedStockDetailScreen = ({ navigation }: any) => {
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res    = await fetch(`${API_BASE_URL}/api/transactions/godown-sylo-stock`, { headers: API_HEADERS });
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

  const totalBalance = data.reduce((s, r) => s + (r.FEED_BALANCE || 0), 0);

  const renderRow = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.syloBadge}>
          <Text style={styles.syloBadgeText}>Sylo {item.SYLO_NO}</Text>
        </View>
        <Text style={styles.feedType}>{item.FEED_TYPE}</Text>
        <Text style={[
          styles.balance,
          item.FEED_BALANCE <= 0 && styles.balanceEmpty,
        ]}>
          {item.FEED_BALANCE?.toLocaleString()} kg
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[
          styles.progressFill,
          {
            width: `${Math.min((item.FEED_BALANCE / (totalBalance || 1)) * 100, 100)}%`,
            backgroundColor: item.FEED_BALANCE <= 0 ? '#ef4444' : '#22c55e',
          },
        ]} />
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
        <Text style={styles.headerTitle}>Feed Stock (Godown)</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Total */}
      <View style={styles.totalsBar}>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Total Feed Balance</Text>
          <Text style={styles.totalValue}>{totalBalance.toLocaleString()} kg</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Total Sylos</Text>
          <Text style={styles.totalValue}>{data.length}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Empty Sylos</Text>
          <Text style={[styles.totalValue, { color: '#fca5a5' }]}>
            {data.filter(r => r.FEED_BALANCE <= 0).length}
          </Text>
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
              <Text style={styles.emptyIcon}>🌾</Text>
              <Text style={styles.emptyText}>No feed stock data</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default FeedStockDetailScreen;

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
  cardHeader:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  syloBadge:     { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 10 },
  syloBadgeText: { fontSize: 12, fontWeight: '700', color: '#166534' },
  feedType:      { flex: 1, fontSize: 15, fontWeight: '700', color: '#1e3a5f' },
  balance:       { fontSize: 14, fontWeight: '800', color: '#22c55e' },
  balanceEmpty:  { color: '#ef4444' },
  progressBg:    { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },
});