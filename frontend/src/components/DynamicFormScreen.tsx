import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ScrollView, TouchableOpacity, Modal, FlatList,
  ActivityIndicator, Alert, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_BASE_URL, API_HEADERS} from '../config/api';

// ─── API Route Mapping ────────────────────────────────────
const API_ROUTES: Record<string, string> = {
  eggproduction:    '/api/transactions/egg-production',
  birdLiveStock:    '/api/transactions/bird-live-stock',
  feedConsumption:  '/api/transactions/feed-consumption',
  flockMaster:      '/api/masters/flock',
  feedShedStock:    '/api/transactions/feed-shed-stock',
  rawMaterialStock: '/api/transactions/raw-material-stock',
  feedProduction:   '/api/transactions/feed-production',
  feedSupply:       '/api/transactions/feed-supply',
  eggGodownStock:   '/api/transactions/egg-godown-stock',
  eggSaleSummary:   '/api/transactions/egg-sale-summary',
};

const DynamicFormScreen = ({ route }: any) => {
  const { title, fields, api } = route.params;

  const [form, setForm]         = useState<any>({});
  const [showDate, setShowDate] = useState<any>({});
  const [dropdown, setDropdown] = useState<any>({ visible: false, field: null });
  const [loading, setLoading]   = useState(false);

  const setValue = (key: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [key]: value }));

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // ─── Validation ───────────────────────────────────────
  const validate = () => {
    for (let field of fields) {
      if (field.required && !form[field.name]) {
        Alert.alert('Validation ⚠️', `${field.label} is required`);
        return false;
      }
    }
    return true;
  };

  // ─── Submit → Backend → SP → Snowflake ───────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      // Format all dates
      const formattedForm: any = {};
      for (let field of fields) {
        if (field.type === 'date' && form[field.name] instanceof Date) {
          formattedForm[field.name] = formatDate(form[field.name]);
        } else {
          formattedForm[field.name] = form[field.name];
        }
      }

      // Auto fields
      formattedForm['farm_name']   = 'MERLA';
      formattedForm['who_created'] = 'APP_USER';

      const endpoint = API_ROUTES[api];
      if (!endpoint) {
        Alert.alert('Error ❌', `No API mapped for: ${api}`);
        return;
      }

      console.log('POST →', `${API_BASE_URL}${endpoint}`);
      console.log('Body →', formattedForm);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method:  'POST',
        headers: API_HEADERS,
        body:    JSON.stringify(formattedForm),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert('Success ✅', result.message || 'Saved successfully!');
        setForm({});
      } else {
        Alert.alert('Error ❌', result.error || 'Something went wrong');
      }

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error ❌', 'Could not connect to server.\nMake sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {fields.map((field: any) => {
        // Hide transfer fields unless TRANSFERRED
        if (
          (field.name === 'transfer_date' || field.name === 'transfer_volume') &&
          form.current_status !== 'TRANSFERRED'
        ) return null;

        return (
          <View key={field.name} style={styles.field}>
            <Text style={styles.label}>
              {field.label}
              {field.required && <Text style={styles.required}> *</Text>}
            </Text>

            {/* TEXT / NUMBER */}
            {(field.type === 'text' || field.type === 'number') && (
              <TextInput
                style={styles.input}
                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                placeholder={`Enter ${field.label}`}
                value={form[field.name] || ''}
                onChangeText={(val) => {
                  if (field.type === 'number') val = val.replace(/[^0-9]/g, '');
                  setValue(field.name, val);
                }}
              />
            )}

            {/* DATE */}
            {field.type === 'date' && (
              <>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() =>
                    setShowDate((prev: any) => ({ ...prev, [field.name]: true }))
                  }
                >
                  <Text style={form[field.name] ? styles.dateText : styles.placeholder}>
                    {form[field.name] ? formatDate(form[field.name]) : '📅 Select Date'}
                  </Text>
                </TouchableOpacity>

                {showDate[field.name] && (
                  <DateTimePicker
                    value={form[field.name] || new Date()}
                    mode="date"
                    maximumDate={new Date()}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(e, date) => {
                      setShowDate((prev: any) => ({ ...prev, [field.name]: false }));
                      if (date) setValue(field.name, date);
                    }}
                  />
                )}
              </>
            )}

            {/* DROPDOWN */}
            {field.type === 'dropdown' && (
              <TouchableOpacity
                style={styles.input}
                onPress={() => setDropdown({ visible: true, field })}
              >
                <Text style={form[field.name] ? styles.dateText : styles.placeholder}>
                  {form[field.name] || 'Select option ▼'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* SUBMIT */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Submit</Text>
        }
      </TouchableOpacity>

      {/* DROPDOWN MODAL */}
      <Modal visible={dropdown.visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setDropdown({ visible: false, field: null })}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {dropdown.field?.label}
            </Text>
            <FlatList
              data={dropdown.field?.options || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    form[dropdown.field?.name] === item && styles.optionSelected,
                  ]}
                  onPress={() => {
                    setValue(dropdown.field.name, item);
                    setDropdown({ visible: false, field: null });
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    form[dropdown.field?.name] === item && styles.optionTextSelected,
                  ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

export default DynamicFormScreen;

const styles = StyleSheet.create({
  container:          { padding: 16, backgroundColor: '#f3f4f6', paddingBottom: 40 },
  title:              { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#1e3a5f' },
  field:              { marginBottom: 14 },
  label:              { marginBottom: 4, fontWeight: '500', color: '#374151' },
  required:           { color: '#ef4444' },
  input:              { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  dateText:           { color: '#111827' },
  placeholder:        { color: '#9ca3af' },
  button:             { backgroundColor: '#2563eb', padding: 14, marginTop: 20, borderRadius: 10, alignItems: 'center' },
  buttonDisabled:     { backgroundColor: '#93c5fd' },
  buttonText:         { color: '#fff', fontWeight: '600', fontSize: 16 },
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalBox:           { backgroundColor: '#fff', borderRadius: 12, padding: 10, maxHeight: 300 },
  modalTitle:         { fontSize: 16, fontWeight: '600', padding: 10, color: '#1e3a5f', textAlign: 'center' },
  option:             { padding: 14, borderBottomWidth: 1, borderColor: '#eee', borderRadius: 8 },
  optionSelected:     { backgroundColor: '#dbeafe' },
  optionText:         { color: '#111827' },
  optionTextSelected: { color: '#2563eb', fontWeight: '600' },
});