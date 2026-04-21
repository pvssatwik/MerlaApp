import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { fetchEggProductions, EggProductionRecord } from '../../../services/eggProductionService';

const EggProductionListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [records, setRecords]     = useState<EggProductionRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRecords = useCallback(async () => {
    try {
      const data = await fetchEggProductions();
      setRecords(data);
    } catch (error: any) {
      Alert.alert('Error ❌', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadRecords(); }, []);

  // Refresh list when coming back from form
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadRecords);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => { setRefreshing(true); loadRecords(); };

  const renderItem = ({ item }: { item: EggProductionRecord }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      {/* Show SHED_NAME and FLOCK_NAME instead of SHED_NO/FLOCK_NO */}
      <Text style={styles.cardTitle}>
        {item.SHED_NAME} — {item.FLOCK_NAME}
      </Text>
      <View style={[
        styles.badge,
        item.TRANSACTION_TYPE === 'PRODUCTION' ? styles.badgeGreen :
        item.TRANSACTION_TYPE === 'DAMAGE'     ? styles.badgeRed   : styles.badgeBlue
      ]}>
        <Text style={styles.badgeText}>{item.TRANSACTION_TYPE || 'N/A'}</Text>
      </View>
    </View>

    <View style={styles.row}>
      <View style={styles.col}>
        <Text style={styles.colLabel}>Farm</Text>
        <Text style={styles.colValue}>{item.FARM_NAME}</Text>
      </View>
      <View style={styles.col}>
        <Text style={styles.colLabel}>Date</Text>
        <Text style={styles.colValue}>{item.PRODUCTION_DATE?.split('T')[0]}</Text>
      </View>
      <View style={styles.col}>
        <Text style={styles.colLabel}>Egg Count</Text>
        <Text style={[styles.colValue, styles.countText]}>
          {item.EGG_COUNT?.toLocaleString()}
        </Text>
      </View>
    </View>

    <View style={styles.row}>
      <View style={styles.col}>
        <Text style={styles.colLabel}>Egg Type</Text>
        <Text style={styles.colValue}>{item.EGG_TYPE || '-'}</Text>
      </View>
      <View style={styles.col}>
        <Text style={styles.colLabel}>Trip No</Text>
        <Text style={styles.colValue}>{item.TRIP_NO || '-'}</Text>
      </View>
    </View>

    {item.COMMNETS ? (
      <Text style={styles.comments} numberOfLines={1}>💬 {item.COMMNETS}</Text>
    ) : null}

    <Text style={styles.createdBy}>Added by: {item.WHO_CREATED}</Text>
  </View>
);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          Total Records: <Text style={styles.summaryCount}>{records.length}</Text>
        </Text>
        <Text style={styles.summaryText}>
          Total Eggs:{' '}
          <Text style={styles.summaryCount}>
            {records.reduce((sum, r) => sum + (r.EGG_COUNT || 0), 0).toLocaleString()}
          </Text>
        </Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No records found</Text>
            <Text style={styles.emptySubText}>Tap + to add a new entry</Text>
          </View>
        }
      />

      {/* FAB - Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('EggProductionForm')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

    </View>
  );
};

export default EggProductionListScreen;

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f3f4f6' },
  centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText:  { marginTop: 10, color: '#6b7280', fontSize: 14 },
  emptyText:    { fontSize: 18, fontWeight: '600', color: '#374151' },
  emptySubText: { fontSize: 14, color: '#9ca3af', marginTop: 4 },

  // Summary
  summaryBar:   { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1e3a5f', padding: 12, paddingHorizontal: 16 },
  summaryText:  { color: '#93c5fd', fontSize: 13 },
  summaryCount: { color: '#fff', fontWeight: '700' },

  // List
  list:         { padding: 16, paddingBottom: 100 },

  // Card
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle:    { fontSize: 16, fontWeight: '700', color: '#1e3a5f' },

  // Badge
  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeGreen:   { backgroundColor: '#dcfce7' },
  badgeBlue:    { backgroundColor: '#dbeafe' },
  badgeRed:     { backgroundColor: '#fee2e2' },
  badgeText:    { fontSize: 11, fontWeight: '600', color: '#374151' },

  // Row cols
  row:          { flexDirection: 'row', marginBottom: 8 },
  col:          { flex: 1 },
  colLabel:     { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  colValue:     { fontSize: 14, color: '#374151', fontWeight: '500' },
  countText:    { color: '#2563eb', fontWeight: '700', fontSize: 16 },

  tripText:     { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  comments:     { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginBottom: 4 },
  createdBy:    { fontSize: 11, color: '#d1d5db', textAlign: 'right', marginTop: 4 },

  // FAB
  fab:          { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#2563eb', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  fabText:      { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});