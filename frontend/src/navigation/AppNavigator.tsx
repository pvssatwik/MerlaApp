import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";

import SplashScreen from "../screens/auth/SplashScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import OTPScreen from "../screens/auth/OTPScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import VerifyForgotOTPScreen from "../screens/auth/VerifyForgotOTPScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import PendingApprovalScreen from "../screens/auth/PendingApprovalScreen";

import HomeScreen from "../screens/HomeScreen";
import DynamicFormScreen from "../components/DynamicFormScreen";
import EggProductionDetailScreen from "../screens/summariesScreens/EggProductionDetailScreen";
import EggStockDetailScreen from "../screens/summariesScreens/EggStockDetailScreen";
import EggSalesDetailScreen from "../screens/summariesScreens/EggSalesDetailScreen";
import BirdStockDetailScreen from "../screens/summariesScreens/BirdStockDetailScreen";
import FeedStockDetailScreen from "../screens/summariesScreens/FeedStockDetailScreen";
import SuperAdminScreen from "../screens/superadmin/SuperAdminScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "Home" : "Login"}
      screenOptions={{ headerShown: false, animation: "fade" }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyForgotOTP" component={VerifyForgotOTPScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      <Stack.Screen
        name="SuperAdmin"
        component={SuperAdminScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="DynamicForm" component={DynamicFormScreen} />
      <Stack.Screen
        name="EggProductionDetail"
        component={EggProductionDetailScreen}
      />
      <Stack.Screen name="EggStockDetail" component={EggStockDetailScreen} />
      <Stack.Screen name="EggSalesDetail" component={EggSalesDetailScreen} />
      <Stack.Screen name="BirdStockDetail" component={BirdStockDetailScreen} />
      <Stack.Screen name="FeedStockDetail" component={FeedStockDetailScreen} />
    </Stack.Navigator>
  );
}
