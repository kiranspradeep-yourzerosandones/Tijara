import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

const useCartStore = create((set, get) => ({
  // State
  cart: null,
  cartCount: 0,
  isLoading: false,

  // Actions
  setCart: (cart) => {
    const totalItems = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    set({ 
      cart, 
      cartCount: totalItems 
    });
  },

  updateCartCount: (count) => set({ cartCount: count }),

  clearCart: () => set({ cart: null, cartCount: 0 }),

  incrementCartCount: (quantity = 1) => {
    set({ cartCount: get().cartCount + quantity });
  },

  decrementCartCount: (quantity = 1) => {
    const newCount = Math.max(0, get().cartCount - quantity);
    set({ cartCount: newCount });
  },

  // Cache cart data locally
  cacheCart: async (cartData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CART_DATA, JSON.stringify(cartData));
    } catch (error) {
      console.error('Error caching cart:', error);
    }
  },

  loadCachedCart: async () => {
    try {
      const cachedCart = await AsyncStorage.getItem(STORAGE_KEYS.CART_DATA);
      if (cachedCart) {
        const cart = JSON.parse(cachedCart);
        get().setCart(cart);
      }
    } catch (error) {
      console.error('Error loading cached cart:', error);
    }
  },
}));

export default useCartStore;