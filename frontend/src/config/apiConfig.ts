// For Android emulator, use 10.0.2.2 to reach host machine
// For physical device on same network, use your machine's local IP (192.168.x.x)
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://merlaapp-production.up.railway.app"; //http://10.0.2.2:4545

console.log("🔗 Connecting to API:", API_BASE_URL);

export const API_HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
};
