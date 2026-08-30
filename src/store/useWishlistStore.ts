import { create } from 'zustand';

interface WishlistState {
  productIds: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WISHLIST_STORAGE_KEY = "dream_fashion_wishlist";

const loadInitialWishlist = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const saveWishlist = (ids: string[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
    } catch {}
  }
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  productIds: [],

  toggleWishlist: (productId) => {
    set((state) => {
      const exists = state.productIds.includes(productId);
      const updated = exists
        ? state.productIds.filter((id) => id !== productId)
        : [...state.productIds, productId];

      saveWishlist(updated);
      return { productIds: updated };
    });
  },

  isInWishlist: (productId) => {
    return get().productIds.includes(productId);
  },

  clearWishlist: () => {
    saveWishlist([]);
    set({ productIds: [] });
  },
}));

if (typeof window !== "undefined") {
  const initial = loadInitialWishlist();
  if (initial.length > 0) {
    useWishlistStore.setState({ productIds: initial });
  }
}
