'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CartItem, CustomCartItem, ShirtSize } from '@/types/customization';
import { normalizeCartItems } from '@/utils/normalization';
import { CustomCartItemRow } from '@/components/cart/CustomCartItemRow';
import { StandardCartItemRow } from '@/components/cart/StandardCartItemRow';

export default function CartPage() {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // User Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Auth Modal States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const loadAndNormalizeCart = async () => {
      try {
        const savedCart = localStorage.getItem('cart_items');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          const normalizedCart = normalizeCartItems(parsed);

          // 1. Instantly set items so UI renders layout structures
          setCartItems(normalizedCart);

          // 2. Only use real product IDs for backend price lookups; do not let cart row IDs or custom timestamps leak in.
          const productIds = Array.from(
            new Set(
              normalizedCart
                .map((item: any) => {
                  const rawId = item.productId ?? item.pid ?? item.id;
                  const parsed = Number(rawId);
                  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
                })
                .filter((value): value is number => value !== null)
            )
          ).join(',');

          if (productIds) {
            try {
              const res = await fetch(`${API_BASE_URL}/products/prices?ids=${productIds}`);

              if (!res.ok) {
                console.error(`Failed to fetch product prices: ${res.status} ${res.statusText}`);
              } else {
                const priceMap: Record<number, number> = await res.json();

                // Update items in state with authoritative prices where available
                setCartItems((prevItems) =>
                  prevItems.map((item) => {
                    const pId = (item as any).productId || (item as any).pid || item.id;
                    const fetchedPrice = priceMap[Number(pId)];

                    if (fetchedPrice === undefined) {
                      console.warn(`No price returned for product ID ${pId}; keeping existing price.`);
                      return item; // keep existing price
                    }

                    return {
                      ...item,
                      price: fetchedPrice,
                    };
                  })
                );
              }
            } catch (err) {
              console.error('Error fetching product prices:', err);
            }
          }
        } else {
          setCartItems([]);
        }

        const token = localStorage.getItem('token');
        if (token) {
          setIsLoggedIn(true);
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const userObj = JSON.parse(storedUser);
              setUserEmail(userObj.email);
            } catch (e) {
              /* ignore parse error */
            }
          }
        }
      } catch (err) {
        console.error('Failed to load cart items or fetch prices:', err);
      } finally {
        setIsLoaded(true);
      }
    };

    // 1. Initial Load
    loadAndNormalizeCart();

    // 2. Refresh cart state whenever window regains focus (e.g. returning from /edit)
    window.addEventListener('focus', loadAndNormalizeCart);
    return () => window.removeEventListener('focus', loadAndNormalizeCart);
  }, [API_BASE_URL]);

  const saveCartToStorage = (updatedItems: CartItem[]) => {
    setCartItems(updatedItems);
    localStorage.setItem('cart_items', JSON.stringify(updatedItems));
    window.dispatchEvent(new Event('cart-updated'));
  };

 const handleRemoveItem = (id: number) => {
  saveCartToStorage(cartItems.filter((item) => item.id !== id));
  };

  const handleQuantityChange = (id: number, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) };
      }
      return item;
    });
    saveCartToStorage(updated);
  };

  const handleSizeChange = (id: number, newSize: ShirtSize) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) return { ...item, size: newSize };
      return item;
    });
    saveCartToStorage(updated);
  };

  const handleDuplicateItem = (itemToDuplicate: CustomCartItem) => {
    const newItem: CustomCartItem = {
      ...itemToDuplicate,
      id: Date.now(), // Numeric timestamp ID
      quantity: 1,
    };
    saveCartToStorage([...cartItems, newItem]);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserEmail(null);
  };

  const handleProceedToCheckout = () => {
    localStorage.setItem('cart', JSON.stringify(cartItems));

    const token = localStorage.getItem('token');
    if (!token) {
      setShowAuthModal(true);
    } else {
      router.push('/checkout');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    const payload =
      authMode === 'login' ? { email, password } : { name, email, password };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        const token = data.access_token || data.token;
        if (token) {
          localStorage.setItem('token', token);
        }

        const userObj = data.user || { email, name };
        localStorage.setItem('user', JSON.stringify(userObj));
        setUserEmail(userObj.email);
        setIsLoggedIn(true);

        setShowAuthModal(false);
        router.push('/checkout');
      } else {
        setAuthError(data.message || `Failed to ${authMode}. Please check your details.`);
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-wider">
        Loading Cart...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shopping Cart</h1>
            <p className="text-xs text-slate-500">
              Review your customized garments, sizes, and print placements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="max-w-[140px] truncate">{userEmail || 'Logged In'}</span>
                <button
                  onClick={handleLogout}
                  className="ml-1 text-slate-400 hover:text-red-600 transition font-bold"
                  title="Logout"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
              >
                Sign In
              </button>
            )}

            <Link
              href="/edit"
              className="py-2 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              + New Design
            </Link>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
            <p className="text-sm font-semibold text-slate-500">Your cart is currently empty.</p>
            <Link
              href="/edit"
              className="inline-block py-3 px-6 bg-slate-900 text-white rounded-xl text-xs font-bold shadow hover:bg-slate-800 transition"
            >
              Start Customizing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) =>
                item.type === 'custom' ? (
                  <CustomCartItemRow
                    key={item.id}
                    item={item as CustomCartItem}
                    onQuantityChange={handleQuantityChange}
                    onSizeChange={handleSizeChange}
                    onDuplicate={handleDuplicateItem}
                    onRemove={handleRemoveItem}
                  />
                ) : (
                  <StandardCartItemRow
                    key={item.id}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onSizeChange={handleSizeChange}
                    onRemove={handleRemoveItem}
                  />
                )
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 h-fit">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Order Summary
              </h2>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">
                    ₹{calculateSubtotal().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-black text-slate-900">
                <span>Total</span>
                <span>₹{calculateSubtotal().toLocaleString()}</span>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* LOGIN & REGISTER POPUP MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl max-w-md w-full space-y-4 relative shadow-2xl">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <div className="flex border-b border-neutral-800 pb-3 gap-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                }}
                className={`text-lg font-bold transition ${
                  authMode === 'login'
                    ? 'text-white border-b-2 border-amber-500 pb-1 -mb-[13px]'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className={`text-lg font-bold transition ${
                  authMode === 'register'
                    ? 'text-white border-b-2 border-amber-500 pb-1 -mb-[13px]'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Create Account
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              {authMode === 'login'
                ? 'Log in to your account to proceed with checkout.'
                : 'Create a new account to save your custom designs and checkout.'}
            </p>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition disabled:opacity-50 mt-2 text-sm"
              >
                {authLoading
                  ? 'Processing...'
                  : authMode === 'login'
                  ? 'Login & Continue to Checkout'
                  : 'Register & Continue to Checkout'}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                }}
                className="text-xs text-neutral-400 hover:text-white underline"
              >
                {authMode === 'login'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Log in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}