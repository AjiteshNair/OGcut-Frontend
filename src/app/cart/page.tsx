'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  tagline: string;
};

type CartItem = Product & {
  quantity: number;
};

const CART_STORAGE_KEY = 'OGcut-cart';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') {
      return;
    }

    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart) as CartItem[]);
      } catch {
        console.warn('Unable to parse saved cart');
      }
    }
  }, []);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
  const itemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const updateQuantity = (productId: number, delta: number) => {
    setCartItems((current) =>
      current.flatMap((item) => {
        if (item.id !== productId) {
          return [item];
        }

        const updatedQuantity = item.quantity + delta;
        return updatedQuantity > 0 ? [{ ...item, quantity: updatedQuantity }] : [];
      }),
    );
  };

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems, mounted]);

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.4em] text-black/55">OGcut</p>
            <h1 className="text-3xl font-semibold uppercase tracking-[0.2em]">Your Cart</h1>
          </div>
          <Link href="/" className="rounded-full border border-black/10 px-4 py-2 text-[0.7rem] uppercase tracking-[0.3em]">
            Back to shop
          </Link>
        </div>

        <section className="rounded-[2rem] border border-black/10 bg-white/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.06)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.35em] text-black/55">Summary</p>
              <p className="text-sm uppercase tracking-[0.2em]">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
            </div>
            <div className="text-right">
              <p className="text-[0.7rem] uppercase tracking-[0.35em] text-black/55">Subtotal</p>
              <p className="text-xl font-semibold uppercase tracking-[0.2em]">${subtotal.toFixed(0)}</p>
            </div>
          </div>

          {cartItems.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-black/10 p-8 text-center text-sm uppercase tracking-[0.25em] text-black/60">
              Your cart is empty. Add a piece from the shop to continue.
            </div>
          ) : (
            <ul className="space-y-3">
              {cartItems.map((item) => (
                <li key={item.id} className="flex flex-col gap-3 rounded-[1.25rem] border border-black/10 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <img src={item.image} alt={item.name} className="h-20 w-20 rounded-[1rem] object-cover" />
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-[0.3em] text-black/55">{item.category}</p>
                      <p className="mt-1 text-base font-semibold uppercase tracking-[0.2em]">{item.name}</p>
                      <p className="mt-1 text-sm text-black/60">${item.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => updateQuantity(item.id, -1)} className="rounded-full border border-black/10 px-3 py-1 text-sm">−</button>
                    <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, 1)} className="rounded-full border border-black/10 px-3 py-1 text-sm">+</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
