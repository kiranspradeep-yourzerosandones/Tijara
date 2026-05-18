// src/services/analyticsService.js
import ENV from '../config/env';

class AnalyticsService {
  constructor() {
    this.isEnabled = ENV.FEATURES.ANALYTICS;
    this.sessionStart = new Date();
    this.currentScreen = null;
  }

  // ============================================================
  // SCREEN TRACKING
  // ============================================================
  trackScreen(screenName, params = {}) {
    if (!this.isEnabled) {
      if (ENV.DEBUG) {
        console.log(`📊 [Analytics] Screen: ${screenName}`, params);
      }
      return;
    }

    this.currentScreen = screenName;

    // Later: Firebase Analytics
    // analytics().logScreenView({
    //   screen_name: screenName,
    //   screen_class: screenName,
    // });
  }

  // ============================================================
  // EVENT TRACKING
  // ============================================================
  trackEvent(eventName, params = {}) {
    if (!this.isEnabled) {
      if (ENV.DEBUG) {
        console.log(`📊 [Analytics] Event: ${eventName}`, params);
      }
      return;
    }

    // Later: Firebase Analytics
    // analytics().logEvent(eventName, params);
  }

  // ============================================================
  // COMMERCE EVENTS
  // ============================================================
  trackAddToCart(product, quantity) {
    this.trackEvent('add_to_cart', {
      item_id: product._id,
      item_name: product.title,
      item_category: product.category,
      price: product.price,
      quantity,
    });
  }

  trackRemoveFromCart(product) {
    this.trackEvent('remove_from_cart', {
      item_id: product._id,
      item_name: product.title,
    });
  }

  trackCheckoutStart(cartTotal, itemCount) {
    this.trackEvent('begin_checkout', {
      value: cartTotal,
      num_items: itemCount,
      currency: 'INR',
    });
  }

  trackOrderPlaced(order) {
    this.trackEvent('purchase', {
      transaction_id: order.orderNumber,
      value: order.totalAmount,
      currency: 'INR',
      num_items: order.items?.length,
    });
  }

  trackSearch(query, resultCount) {
    this.trackEvent('search', {
      search_term: query,
      results: resultCount,
    });
  }

  trackLogin(method) {
    this.trackEvent('login', { method });
  }

  trackSignUp() {
    this.trackEvent('sign_up', { method: 'phone_otp' });
  }

  trackProductView(product) {
    this.trackEvent('view_item', {
      item_id: product._id,
      item_name: product.title,
      item_category: product.category,
      price: product.price,
    });
  }

  // ============================================================
  // USER PROPERTIES
  // ============================================================
  setUser(userId, properties = {}) {
    if (!this.isEnabled) return;

    // Later: Firebase Analytics
    // analytics().setUserId(userId);
    // analytics().setUserProperties(properties);
  }

  clearUser() {
    if (!this.isEnabled) return;
    // analytics().setUserId(null);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;