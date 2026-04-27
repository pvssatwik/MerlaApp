// For Android emulator, use 10.0.2.2 to reach host machine
// For physical device on same network, use your machine's local IP (192.168.x.x)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4545';

console.log('🔗 Connecting to API:', API_BASE_URL);

// Default headers for all API calls
export const API_HEADERS = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',  // bypass ngrok warning page
};