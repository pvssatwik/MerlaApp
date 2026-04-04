import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import EggProductionListScreen from '../screens/transactions/dailyEggProduction/EggProductionListScreen';
import EggProductionFormScreen from '../screens/transactions/dailyEggProduction/EggProductionFormScreen';

const Stack = createStackNavigator();

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1e3a5f' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="EggProductionList"
        component={EggProductionListScreen}
        options={{ title: 'Egg Production' }}
      />
      <Stack.Screen
        name="EggProductionForm"
        component={EggProductionFormScreen}
        options={{ title: 'Add Entry' }}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;