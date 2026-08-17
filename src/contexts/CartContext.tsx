import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'shapewear_cart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sanitize: ensure quantity is always a valid positive integer
        const sanitized = (Array.isArray(parsed) ? parsed : []).map((item: CartItem) => ({
          ...item,
          quantity: Math.max(1, parseInt(String(item.quantity), 10) || 1),
        }));
        setCartItems(sanitized);
      }
    } catch (e) {
      console.error('Error loading cart from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on every change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  const addItem = (newItem: CartItem) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(
        item => item.productId === newItem.productId && item.size === newItem.size && item.color === newItem.color
      );

      if (existingItemIndex >= 0) {
        // Immutable update: create a new array with a new item object
        return prev.map((item, idx) =>
          idx === existingItemIndex
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }

      return [...prev, newItem];
    });
  };

  const removeItem = (productId: string, size: string, color: string) => {
    setCartItems(prev => prev.filter(
      item => !(item.productId === productId && item.size === size && item.color === color)
    ));
  };

  const updateQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size, color);
      return;
    }
    setCartItems(prev => prev.map(item => {
      if (item.productId === productId && item.size === size && item.color === color) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotal,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
