// src/store/cartStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cartAPI } from '../api';

export const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      cart: null,
      items: [],
      totalItems: 0,
      subtotal: 0,
      total: 0,
      isLoading: false,
      error: null,
      warnings: [],
      lastSyncedAt: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Fetch cart from server (sync)
      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await cartAPI.getCart();
          const { cart, warnings } = response.data;

          set({
            cart,
            items: cart.items || [],
            totalItems: cart.totalItems || 0,
            subtotal: cart.subtotal || 0,
            total: cart.total || 0,
            warnings: warnings || [],
            isLoading: false,
            lastSyncedAt: new Date().toISOString(),
          });

          return response;
        } catch (error) {
          // ✅ On network error - keep local cart data
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // Add to cart
      addToCart: async (productId, quantity = 1) => {
        set({ isLoading: true, error: null });
        try {
          const response = await cartAPI.addToCart(productId, quantity);
          const { cart } = response.data;

          set({
            cart,
            items: cart.items || [],
            totalItems: cart.totalItems || 0,
            subtotal: cart.subtotal || 0,
            total: cart.total || 0,
            isLoading: false,
            lastSyncedAt: new Date().toISOString(),
          });

          return response;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // Update item quantity
      updateQuantity: async (productId, quantity) => {
        set({ isLoading: true, error: null });
        try {
          const response = await cartAPI.updateCartItem(productId, quantity);
          const { cart } = response.data;

          set({
            cart,
            items: cart.items || [],
            totalItems: cart.totalItems || 0,
            subtotal: cart.subtotal || 0,
            total: cart.total || 0,
            isLoading: false,
            lastSyncedAt: new Date().toISOString(),
          });

          return response;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // Remove from cart
      removeFromCart: async (productId) => {
        set({ isLoading: true, error: null });
        try {
          const response = await cartAPI.removeFromCart(productId);
          const { cart } = response.data;

          set({
            cart,
            items: cart.items || [],
            totalItems: cart.totalItems || 0,
            subtotal: cart.subtotal || 0,
            total: cart.total || 0,
            isLoading: false,
            lastSyncedAt: new Date().toISOString(),
          });

          return response;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // Clear cart
      clearCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await cartAPI.clearCart();

          set({
            cart: null,
            items: [],
            totalItems: 0,
            subtotal: 0,
            total: 0,
            isLoading: false,
            lastSyncedAt: new Date().toISOString(),
          });

          return response;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // Validate cart
      validateCart: async () => {
        try {
          const response = await cartAPI.validateCart();
          return response;
        } catch (error) {
          throw error;
        }
      },

      // Get item quantity for a product
      getItemQuantity: (productId) => {
        const { items } = get();
        const item = items.find(
          (i) => i.product?._id === productId || i.product === productId
        );
        return item?.quantity || 0;
      },

      // Check if product is in cart
      isInCart: (productId) => {
        const { items } = get();
        return items.some(
          (i) => i.product?._id === productId || i.product === productId
        );
      },

      // Reset cart state
      resetCart: () => {
        set({
          cart: null,
          items: [],
          totalItems: 0,
          subtotal: 0,
          total: 0,
          error: null,
          warnings: [],
          lastSyncedAt: null,
        });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // ✅ Only persist what matters
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        subtotal: state.subtotal,
        total: state.total,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
);

export default useCartStore;