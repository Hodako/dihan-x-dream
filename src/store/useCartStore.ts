import { create } from 'zustand';
import { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  setSingleItem: (item: CartItem) => void;
  removeItem: (sku: string) => void;
  updateQuantity: (sku: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

const CART_STORAGE_KEY = "dream_fashion_cart";

const loadInitialCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  addItem: (newItem) => {
    set((state) => {
      const existingIndex = state.items.findIndex((item) => item.variantSku === newItem.variantSku);
      let updatedItems: CartItem[];

      if (existingIndex > -1) {
        updatedItems = [...state.items];
        const currentQty = updatedItems[existingIndex].quantity;
        const newQty = Math.min(currentQty + newItem.quantity, newItem.stock || 99);
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: newQty,
        };
      } else {
        updatedItems = [...state.items, newItem];
      }

      saveCart(updatedItems);
      return { items: updatedItems, isOpen: true };
    });
  },

  setSingleItem: (singleItem) => {
    saveCart([singleItem]);
    set({ items: [singleItem], isOpen: false });
  },

  removeItem: (sku) => {
    set((state) => {
      const updated = state.items.filter((item) => item.variantSku !== sku);
      saveCart(updated);
      return { items: updated };
    });
  },

  updateQuantity: (sku, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        const updated = state.items.filter((item) => item.variantSku !== sku);
        saveCart(updated);
        return { items: updated };
      }

      const updated = state.items.map((item) => {
        if (item.variantSku === sku) {
          const maxStock = item.stock || 99;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      });

      saveCart(updated);
      return { items: updated };
    });
  },

  clearCart: () => {
    saveCart([]);
    set({ items: [] });
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
}));

// Client-side initialization helper
if (typeof window !== "undefined") {
  const initial = loadInitialCart();
  if (initial.length > 0) {
    useCartStore.setState({ items: initial });
  }
}
