import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ScrollView, TouchableOpacity, Modal, FlatList,
  ActivityIndicator, Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const DynamicFormScreen = ({ route }: any) => {
  const { title, fields } = route.params;

  const [form, setForm] = useState<any>({});
  const [showDate, setShowDate] = useState<any>({});
  const [dropdown, setDropdown] = useState<any>({ visible: false, field: null });
  const [loading, setLoading] = useState(false);

  const setValue = (key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const formatDate = (date: Date) =>
    date.toISOString().split('T')[0];

  // Validation
  const validate = () => {
    for (let field of fields) {
      if (field.required && !form[field.name]) {
        Alert.alert('Validation ⚠️', `${field.label} is required`);
        return false;
      }
    }
    return true;
  };

  // Submit (frontend only)
  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    setTimeout(() => {
      console.log('FORM DATA:', form);
      Alert.alert('Success ✅', 'Form submitted (frontend only)');
      setLoading(false);
    }, 1000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>

      {fields.map((field: any) => {

        // CONDITIONAL LOGIC (TRANSFER FIELDS)
        if (
          (field.name === 'transfer_date' || field.name === 'transfer_volume') &&
          form.current_status !== 'TRANSFERRED'
        ) {
          return null;
        }

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
                  if (field.type === 'number') {
                    val = val.replace(/[^0-9]/g, '');
                  }
                  setValue(field.name, val);
                }}
              />
            )}

            {/* DATE PICKER */}
            {field.type === 'date' && (
              <>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() =>
                    setShowDate((prev: any) => ({ ...prev, [field.name]: true }))
                  }
                >
                  <Text>
                    {form[field.name]
                      ? formatDate(form[field.name])
                      : 'Select Date'}
                  </Text>
                </TouchableOpacity>

                {showDate[field.name] && (
                  <DateTimePicker
                    value={form[field.name] || new Date()}
                    mode="date"
                    maximumDate={new Date()}
                    onChange={(e, date) => {
                      setShowDate((prev: any) => ({
                        ...prev,
                        [field.name]: false,
                      }));
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
                <Text>
                  {form[field.name] || 'Select option'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* SUBMIT BUTTON */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Submit</Text>
        }
      </TouchableOpacity>

      {/* FIXED DROPDOWN MODAL */}
      <Modal visible={dropdown.visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setDropdown({ visible: false, field: null })}
        >
          <View style={styles.modalBox}>
            <FlatList
              data={dropdown.field?.options || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    setValue(dropdown.field.name, item);
                    setDropdown({ visible: false, field: null });
                  }}
                >
                  <Text>{item}</Text>
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
  container: { padding: 16, backgroundColor: '#f3f4f6' },

  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },

  field: { marginBottom: 14 },

  label: { marginBottom: 4, fontWeight: '500' },
  required: { color: 'red' },

  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },

  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    marginTop: 20,
    borderRadius: 10,
    alignItems: 'center',
  },

  buttonText: { color: '#fff', fontWeight: '600' },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },

  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    maxHeight: 300,
  },

  option: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
});