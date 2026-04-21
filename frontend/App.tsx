import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import DynamicFormScreen from './src/components/DynamicFormScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />

      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: '#1e3a5f',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        {/* Home */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Farm Dashboard',
          }}
        />

        {/* Dynamic Form */}
        <Stack.Screen
          name="DynamicForm"
          component={DynamicFormScreen}
          options={({ route }: any) => ({
            title: route.params?.title || 'Form',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}