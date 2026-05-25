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

//authscreens imports
import SplashScreen          from './src/screens/auth/SplashScreen';
import LoginScreen           from './src/screens/auth/LoginScreen';
import SignUpScreen          from './src/screens/auth/SignUpScreen';
import OTPScreen             from './src/screens/auth/OTPScreen';
import ForgotPasswordScreen  from './src/screens/auth/ForgotPasswordScreen';
import PendingApprovalScreen from './src/screens/auth/PendingApprovalScreen';
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        {/* ── Auth Flow ── */}
        <Stack.Screen name="Splash"          component={SplashScreen} />
        <Stack.Screen name="Login"           component={LoginScreen} />
        <Stack.Screen name="SignUp"          component={SignUpScreen} />
        <Stack.Screen name="OTP"             component={OTPScreen} />
        <Stack.Screen name="ForgotPassword"  component={ForgotPasswordScreen} />
        <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        {/* ── App Flow ── */}
        <Stack.Screen name="Home"                  component={HomeScreen} />
        <Stack.Screen name="DynamicForm"           component={DynamicFormScreen} />
        <Stack.Screen name="EggProductionDetail"   component={EggProductionDetailScreen} />
        <Stack.Screen name="EggStockDetail"        component={EggStockDetailScreen} />
        <Stack.Screen name="EggSalesDetail"        component={EggSalesDetailScreen} />
        <Stack.Screen name="BirdStockDetail"       component={BirdStockDetailScreen} />
        <Stack.Screen name="FeedStockDetail"       component={FeedStockDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}