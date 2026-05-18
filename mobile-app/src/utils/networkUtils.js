// src/utils/networkUtils.js
import NetInfo from '@react-native-community/netinfo';

class NetworkUtils {
  constructor() {
    this.isConnected = true;
    this.connectionType = 'unknown';
    this.listeners = [];
    this.unsubscribe = null;
  }

  // Start monitoring
  startMonitoring() {
    this.unsubscribe = NetInfo.addEventListener((state) => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected && state.isInternetReachable !== false;
      this.connectionType = state.type;

      // Notify listeners when connection changes
      if (wasConnected !== this.isConnected) {
        this.listeners.forEach((listener) => listener(this.isConnected));
      }
    });
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  // Add connection change listener
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  // Check current connection
  async checkConnection() {
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected && state.isInternetReachable !== false;
    this.connectionType = state.type;
    return this.isConnected;
  }

  // Get connection info
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      connectionType: this.connectionType,
    };
  }
}

export const networkUtils = new NetworkUtils();
export default networkUtils;