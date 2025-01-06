import * as SecureStore from "expo-secure-store";

export async function storeAuthToken(token) {
  await SecureStore.setItemAsync("auth_token", token);
}

export async function getAuthToken() {
  return await SecureStore.getItemAsync("auth_token");
}
