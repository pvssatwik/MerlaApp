// src/screens/HomeScreen.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';

import { FORMS } from '../config/forms';

const HomeScreen = ({ navigation }: any) => {
  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🐔 Merla Farms</Text>
        <Text style={styles.subtitle}>Select a module</Text>

        {FORMS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('DynamicForm', {
                title: item.title,
                fields: item.fields,
              })
            }
          >
            <Text style={styles.cardText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },

  container: {
    padding: 16,
    paddingBottom: 30,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 6,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,

    // Shadow (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },

    // Elevation (Android)
    elevation: 3,
  },

  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});