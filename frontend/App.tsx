import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import DynamicFormScreen from "./src/components/DynamicFormScreen";
import EggProductionDetailScreen from "./src/screens/summariesScreens/EggProductionDetailScreen";
import EggStockDetailScreen from "./src/screens/summariesScreens/EggStockDetailScreen";
import EggSalesDetailScreen from "./src/screens/summariesScreens/EggSalesDetailScreen";
import BirdStockDetailScreen from "./src/screens/summariesScreens/BirdStockDetailScreen";
import FeedStockDetailScreen from "./src/screens/summariesScreens/FeedStockDetailScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen
          name="EggProductionDetail"
          component={EggProductionDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="EggStockDetail" component={EggStockDetailScreen} />
        <Stack.Screen name="EggSalesDetail" component={EggSalesDetailScreen} />
        <Stack.Screen
          name="BirdStockDetail"
          component={BirdStockDetailScreen}
        />
        <Stack.Screen
          name="FeedStockDetail"
          component={FeedStockDetailScreen}
        />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="DynamicForm" component={DynamicFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}