import { create } from 'zustand';

export interface CartProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string | null;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (product: CartProduct) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  addToCart: (product) => set((state) => {
    const existing = state.items.find((item) => item.id === product.id);
    if (existing) {
      return {
        items: state.items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    }
    return { items: [...state.items, { ...product, quantity: 1 }] };
  }),
  removeFromCart: (productId) => set((state) => ({
    items: state.items.filter((item) => item.id !== productId),
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    items: state.items.map((item) =>
      item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
    ).filter(item => item.quantity > 0),
  })),
  clearCart: () => set({ items: [] }),
  total: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}));
