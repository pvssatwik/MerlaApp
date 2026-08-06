import * as SecureStore from "expo-secure-store";

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  if (accessToken)
    await SecureStore.setItemAsync("accessToken", String(accessToken));
  if (refreshToken)
    await SecureStore.setItemAsync("refreshToken", String(refreshToken));
};

export const saveAccessToken = async (accessToken: string) => {
  await SecureStore.setItemAsync("accessToken", accessToken);
};

export const getAccessToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync("accessToken");
  } catch {
    return null;
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync("refreshToken");
  } catch {
    return null;
  }
};

export const clearTokens = async () => {
  try {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("user");
  } catch (e) {
    console.error("Clear tokens error:", e);
  }
};

export const saveUser = async (user: any) => {
  if (user) await SecureStore.setItemAsync("user", JSON.stringify(user));
};

export const getUser = async (): Promise<any> => {
  try {
    const user = await SecureStore.getItemAsync("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};
