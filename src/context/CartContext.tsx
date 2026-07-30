'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  cartItems: CartItem[]; // <--- Added for page compatibility
  addToCart: (product: { id: string; name: string; base_price: number; mockup_url?: string | null; graphic_url?: string | null }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  getItemQuantity: (id: string) => number;
  totalPrice: number;
  subtotal: number; // <--- Added for page compatibility
  totalItems: number;
  cartCount: number; // <--- Added for page compatibility
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const getItemQuantity = (id: string) => {
    return cart.find((item) => item.id === id)?.quantity || 0;
  };

  // Load cart from localStorage on start
  useEffect(() => {
    const saved = localStorage.getItem('shopping_cart');
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sync cart changes to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('shopping_cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  const addToCart = (product: { id: string; name: string; base_price: number; mockup_url?: string | null; graphic_url?: string | null }) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: Number(product.base_price),
          image: product.mockup_url || product.graphic_url || '',
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => setCart([]);

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems: cart, // Aliased to fix the error
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getItemQuantity,
        totalPrice,
        subtotal: totalPrice, // Aliased to fix the error
        totalItems,
        cartCount: totalItems, // Aliased to fix the error
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}