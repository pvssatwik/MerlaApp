import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity,
  View, Modal, FlatList, ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { insertEggProduction } from '../../../services/eggProductionService';

// ─── Static Options ───────────────────────────────────────
const FARM_NAME = 'MERLA';
const SHED_OPTIONS = ['LAYER-1', 'LAYER-2', 'LAYER-3'];
const FLOCK_MAP: Record<string, string[]> = {
  'LAYER-1': ['FLOCK12', 'FLOCK13'],
  'LAYER-2': ['FLOCK14', 'FLOCK15'],
  'LAYER-3': ['FLOCK16'],
};
const TRANSACTION_TYPES = ['PRODUCTION', 'ADJUSTMENT', 'DAMAGE'];
const EGG_TYPES         = ['NORMAL', 'BROKEN', 'JUMBO', 'SMALL'];

// ─── Reusable Dropdown ────────────────────────────────────
type DropdownProps = {
  label: string;
  required?: boolean;
  value: string;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  onSelect: (val: string) => void;
};

const Dropdown: React.FC<DropdownProps> = ({
  label, required, value, options, placeholder, disabled, onSelect,
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.dropdownBtn, disabled && styles.dropdownDisabled]}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={value ? styles.dropdownText : styles.dropdownPlaceholder}>
          {value || placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, value === item && styles.optionSelected]}
                  onPress={() => { onSelect(item); setVisible(false); }}
                >
                  <Text style={[styles.optionText, value === item && styles.optionTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── Form Screen ──────────────────────────────────────────
type FormValues = {
  shedName: string;
  flockName: string;
  productionDate: Date;
  transactionType: string;
  eggType: string;
  eggCount: string;
  tripNo: string;
  comments: string;
};

const INITIAL_FORM: FormValues = {
  shedName: '', flockName: '', productionDate: new Date(),
  transactionType: '', eggType: '', eggCount: '', tripNo: '', comments: '',
};

const EggProductionFormScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [values, setValues]         = useState<FormValues>(INITIAL_FORM);
  const [showDatePicker, setShowDP] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof FormValues, value: any) =>
    setValues(prev => ({ ...prev, [field]: value }));

  const handleShedChange = (shed: string) => {
    setValues(prev => ({ ...prev, shedName: shed, flockName: '' }));
  };

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!values.shedName || !values.flockName || !values.eggType || !values.eggCount) {
      Alert.alert('Validation ⚠️', 'Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await insertEggProduction({
        farm_name:        FARM_NAME,
        shed_name:        values.shedName,
        flock_name:       values.flockName,
        production_date:  formatDate(values.productionDate),
        transaction_type: values.transactionType,
        egg_type:         values.eggType,
        egg_count:        parseInt(values.eggCount),
        trip_no:          values.tripNo,
        commnets:         values.comments,
        who_created:      'APP_USER',
      });
      Alert.alert('Success ✅', result.message, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      setValues(INITIAL_FORM);
    } catch (error: any) {
      Alert.alert('Error ❌', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Daily Egg Production</Text>

          {/* Farm - Read Only */}
          <View style={styles.field}>
            <Text style={styles.label}>Farm</Text>
            <View style={styles.readOnly}>
              <Text style={styles.readOnlyText}>{FARM_NAME}</Text>
            </View>
          </View>

          {/* Shed */}
          <Dropdown
            label="Shed Name" required
            value={values.shedName} options={SHED_OPTIONS}
            placeholder="Select shed" onSelect={handleShedChange}
          />

          {/* Flock - cascading */}
          <Dropdown
            label="Flock Name" required
            value={values.flockName}
            options={values.shedName ? FLOCK_MAP[values.shedName] || [] : []}
            placeholder={values.shedName ? 'Select flock' : 'Select shed first'}
            disabled={!values.shedName}
            onSelect={val => set('flockName', val)}
          />

          {/* Production Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Production Date<Text style={styles.required}> *</Text></Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDP(true)}>
              <Text style={styles.dateText}>📅  {formatDate(values.productionDate)}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={values.productionDate} mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, date) => { setShowDP(false); if (date) set('productionDate', date); }}
              />
            )}
          </View>

          {/* Transaction Type */}
          <Dropdown
            label="Transaction Type"
            value={values.transactionType} options={TRANSACTION_TYPES}
            placeholder="Select transaction type"
            onSelect={val => set('transactionType', val)}
          />

          {/* Egg Type */}
          <Dropdown
            label="Egg Type" required
            value={values.eggType} options={EGG_TYPES}
            placeholder="Select egg type"
            onSelect={val => set('eggType', val)}
          />

          {/* Egg Count */}
          <View style={styles.field}>
            <Text style={styles.label}>Egg Count<Text style={styles.required}> *</Text></Text>
            <TextInput
              style={styles.input} keyboardType="numeric"
              value={values.eggCount} placeholder="Enter egg count"
              onChangeText={t => set('eggCount', t.replace(/[^0-9]/g, ''))}
            />
          </View>

          {/* Trip No */}
          <View style={styles.field}>
            <Text style={styles.label}>Trip No</Text>
            <TextInput
              style={styles.input} value={values.tripNo}
              placeholder="Enter trip number"
              onChangeText={t => set('tripNo', t)}
            />
          </View>

          {/* Comments */}
          <View style={styles.field}>
            <Text style={styles.label}>Comments</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={values.comments} placeholder="Optional comments"
              multiline numberOfLines={3}
              onChangeText={t => set('comments', t)}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit} disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Save Entry</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EggProductionFormScreen;

const styles = StyleSheet.create({
  container:          { flexGrow: 1, padding: 16, backgroundColor: '#f3f4f6' },
  card:               { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  title:              { fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center', color: '#1e3a5f' },
  field:              { marginBottom: 14 },
  label:              { fontSize: 14, fontWeight: '500', marginBottom: 4, color: '#374151' },
  required:           { color: '#ef4444' },
  input:              { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, backgroundColor: '#f9fafb' },
  multiline:          { height: 80, textAlignVertical: 'top' },
  readOnly:           { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#f3f4f6' },
  readOnlyText:       { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  dateBtn:            { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#f9fafb' },
  dateText:           { fontSize: 14, color: '#111827' },
  dropdownBtn:        { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#f9fafb', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownDisabled:   { backgroundColor: '#e5e7eb', borderColor: '#e5e7eb' },
  dropdownText:       { fontSize: 14, color: '#111827' },
  dropdownPlaceholder:{ fontSize: 14, color: '#9ca3af' },
  arrow:              { fontSize: 12, color: '#6b7280' },
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalBox:           { backgroundColor: '#fff', borderRadius: 12, padding: 16, maxHeight: 320 },
  modalTitle:         { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#1e3a5f', textAlign: 'center' },
  option:             { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, marginBottom: 4 },
  optionSelected:     { backgroundColor: '#dbeafe' },
  optionText:         { fontSize: 14, color: '#111827' },
  optionTextSelected: { color: '#2563eb', fontWeight: '600' },
  button:             { marginTop: 24, backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonDisabled:     { backgroundColor: '#93c5fd' },
  buttonText:         { color: '#fff', fontSize: 16, fontWeight: '600' },
});