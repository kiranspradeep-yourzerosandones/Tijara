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

      // ─── Fetch cart ───────────────────────────────────────
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
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // ─── Add to cart (OPTIMISTIC) ─────────────────────────
      addToCart: async (productId, quantity = 1) => {
        // Save snapshot for rollback
        const snapshot = {
          items: get().items,
          totalItems: get().totalItems,
          subtotal: get().subtotal,
          total: get().total,
        };

        // Optimistic update
        const existingItem = get().items.find(
          (i) =>
            i.product?._id === productId || i.product === productId
        );

        if (existingItem) {
          const updatedItems = get().items.map((i) => {
            const id = i.product?._id || i.product;
            if (id === productId) {
              return {
                ...i,
                quantity: i.quantity + quantity,
              };
            }
            return i;
          });

          const newTotalItems = updatedItems.reduce(
            (sum, i) => sum + i.quantity,
            0
          );
          const newSubtotal = updatedItems.reduce(
            (sum, i) => sum + i.quantity * (i.priceAtAdd || 0),
            0
          );

          set({
            items: updatedItems,
            totalItems: newTotalItems,
            subtotal: newSubtotal,
            total: newSubtotal,
          });
        } else {
          // Item not in cart yet — just increment totalItems optimistically
          set((state) => ({
            totalItems: state.totalItems + quantity,
          }));
        }

        // API call
        try {
          const response = await cartAPI.addToCart(productId, quantity);
          const { cart } = response.data;

          // Sync with server response
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
          // Rollback on failure
          console.warn('Add to cart failed — rolling back');
          set(snapshot);
          throw error;
        }
      },

      // ─── Update quantity (OPTIMISTIC) ─────────────────────
      updateQuantity: async (productId, quantity) => {
        const snapshot = {
          items: get().items,
          totalItems: get().totalItems,
          subtotal: get().subtotal,
          total: get().total,
        };

        // Optimistic update
        let updatedItems;
        if (quantity === 0) {
          updatedItems = get().items.filter((i) => {
            const id = i.product?._id || i.product;
            return id !== productId;
          });
        } else {
          updatedItems = get().items.map((i) => {
            const id = i.product?._id || i.product;
            if (id === productId) {
              return { ...i, quantity };
            }
            return i;
          });
        }

        const newTotalItems = updatedItems.reduce(
          (sum, i) => sum + i.quantity,
          0
        );
        const newSubtotal = updatedItems.reduce(
          (sum, i) => sum + i.quantity * (i.priceAtAdd || 0),
          0
        );

        set({
          items: updatedItems,
          totalItems: newTotalItems,
          subtotal: newSubtotal,
          total: newSubtotal,
        });

        try {
          const response = await cartAPI.updateCartItem(productId, quantity);
          const { cart } = response.data;

          set({
            cart,
            items: cart.items || [],
            totalItems: cart.totalItems || 0,
            subtotal: cart.subtotal || 0,
            total: cart.total || 0,
            lastSyncedAt: new Date().toISOString(),
          });

          return response;
        } catch (error) {
          console.warn('Update quantity failed — rolling back');
          set(snapshot);
          throw error;
        }
      },

      // ─── Remove from cart (OPTIMISTIC) ────────────────────
      removeFromCart: async (productId) => {
        const snapshot = {
          items: get().items,
          totalItems: get().totalItems,
          subtotal: get().subtotal,
          total: get().total,
        };

        // Optimistic remove
        const updatedItems = get().items.filter((i) => {
          const id = i.product?._id || i.product;
          return id !== productId;
        });

        const newTotalItems = updatedItems.reduce(
          (sum, i) => sum + i.quantity,
          0
        );
        const newSubtotal = updatedItems.reduce(
          (sum, i) => sum + i.quantity * (i.priceAtAdd || 0),
          0
        );

        set({
          items: updatedItems,
          totalItems: newTotalItems,
          subtotal: newSubtotal,
          total: newSubtotal,
        });

        try {
          const response = await cartAPI.removeFromCart(productId);
          const { cart } = response.data;

          set({
            cart,
            items: cart.items || [],
            totalItems: cart.totalItems || 0,
            subtotal: cart.subtotal || 0,
            total: cart.total || 0,
            lastSyncedAt: new Date().toISOString(),
          });

          return response;
        } catch (error) {
          console.warn('Remove from cart failed — rolling back');
          set(snapshot);
          throw error;
        }
      },

      // ─── Clear cart ───────────────────────────────────────
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

      // ─── Validate cart ────────────────────────────────────
      validateCart: async () => {
        try {
          const response = await cartAPI.validateCart();
          return response;
        } catch (error) {
          throw error;
        }
      },

      // ─── Helpers ──────────────────────────────────────────
      getItemQuantity: (productId) => {
        const { items } = get();
        const item = items.find(
          (i) =>
            i.product?._id === productId || i.product === productId
        );
        return item?.quantity || 0;
      },

      isInCart: (productId) => {
        const { items } = get();
        return items.some(
          (i) =>
            i.product?._id === productId || i.product === productId
        );
      },

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