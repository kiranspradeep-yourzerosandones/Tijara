// src/utils/networkUtils.js
import NetInfo from '@react-native-community/netinfo';

class NetworkUtils {
  constructor() {
    this.isConnected = true; // ✅ Default true — assume connected
    this.connectionType = 'unknown';
    this.listeners = [];
    this.unsubscribe = null;
  }

  startMonitoring() {
    this.unsubscribe = NetInfo.addEventListener((state) => {
      const wasConnected = this.isConnected;

      // ✅ null isInternetReachable = not yet determined = treat as connected
      this.isConnected =
        state.isConnected === true &&
        state.isInternetReachable !== false;

      this.connectionType = state.type;

      if (wasConnected !== this.isConnected) {
        this.listeners.forEach((listener) => listener(this.isConnected));
      }
    });
  }

  stopMonitoring() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  async checkConnection() {
    const state = await NetInfo.fetch();
    // ✅ null isInternetReachable = treat as connected
    this.isConnected =
      state.isConnected === true &&
      state.isInternetReachable !== false;
    this.connectionType = state.type;
    return this.isConnected;
  }

  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      connectionType: this.connectionType,
    };
  }
}

export const networkUtils = new NetworkUtils();
export default networkUtils;