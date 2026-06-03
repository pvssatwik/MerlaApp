import * as SecureStore from "expo-secure-store";

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync("accessToken", accessToken);
  await SecureStore.setItemAsync("refreshToken", refreshToken);
};

export const saveAccessToken = async (accessToken: string) => {
  await SecureStore.setItemAsync("accessToken", accessToken);
};

export const getAccessToken = () => SecureStore.getItemAsync("accessToken");

export const getRefreshToken = () => SecureStore.getItemAsync("refreshToken");

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
  await SecureStore.deleteItemAsync("user");
};

export const saveUser = async (user: any) => {
  await SecureStore.setItemAsync("user", JSON.stringify(user));
};

export const getUser = async () => {
  const user = await SecureStore.getItemAsync("user");
  return user ? JSON.parse(user) : null;
};
