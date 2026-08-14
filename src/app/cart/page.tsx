"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { CartItem, ShirtSize, Zone, ZoneConfig } from '@/types/customization';

const CANVAS_SIZE = 2048;
const AVAILABLE_SIZES: ShirtSize[] = ['S', 'M', 'L', 'XL', '2XL'];

const DEFAULT_ZONES: Record<Zone, ZoneConfig> = {
  front: { x: 598, y: 1420, clipWidth: 620, clipHeight: 784 },
  back: { x: 1536, y: 1325, clipWidth: 620, clipHeight: 911 },
  leftSleeve: { x: 625, y: 280, clipWidth: 310, clipHeight: 300 },
  rightSleeve: { x: 1450, y: 280, clipWidth: 330, clipHeight: 300 },
};

function MiniTshirt({ texture }: { texture: THREE.CanvasTexture | null }) {
  const gltf = useGLTF('/oversized_t-shirt-optimized.glb');

  const clonedScene = React.useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    if (clonedScene && texture) {
      clonedScene.traverse((child: any) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.map = texture;
          child.material.roughness = 1;
          child.material.metalness = 0;
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [clonedScene, texture]);

  if (!clonedScene) return null;
  return <primitive object={clonedScene} />;
}

function CartItemModel({ item }: { item: CartItem }) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    ctx.fillStyle = item.fabricColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!item.placements || item.placements.length === 0) {
      setTexture(tex);
      return;
    }

    const imagePromises = item.placements.map((p) => {
      return new Promise<void>((resolve) => {
        if (!p.image) return resolve();

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const zoneKey = p.zone;
          const config = p.printZoneBounds || DEFAULT_ZONES[zoneKey];
          const coords = p.coordinates;

          ctx.save();
          const rx = config.centerX - config.clipWidth / 2;
          const ry = config.centerY - config.clipHeight / 2;
          ctx.beginPath();
          ctx.rect(rx, ry, config.clipWidth, config.clipHeight);
          ctx.clip();

          const drawW = (coords.width || 400) * (coords.scale || 1);
          const drawH = (coords.height || 400) * (coords.scale || 1);
          const drawX = config.centerX + (coords.x || 0) - drawW / 2;
          const drawY = config.centerY + (coords.y || 0) - drawH / 2;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          ctx.restore();
          resolve();
        };
        img.onerror = () => resolve();
        img.src = p.image;
      });
    });

    Promise.all(imagePromises).then(() => {
      tex.needsUpdate = true;
      setTexture(tex);
    });

    return () => {
      tex.dispose();
    };
  }, [item]);

  return (
    <div className="w-28 h-28 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden relative shrink-0">
      <Canvas camera={{ position: [0, 0.2, 1], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <Center top position={[0, -0.35, 0]}>
            <MiniTshirt texture={texture} />
          </Center>
        </Suspense>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
      </Canvas>
    </div>
  );
}

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
    try {
      const savedCart = localStorage.getItem('cart_items');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }

      // Check login status
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUserEmail(parsed.email);
          } catch (e) {
            /* ignore parse error */
          }
        }
      }
    } catch (err) {
      console.error('Failed to load cart items:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveCartToStorage = (updatedItems: CartItem[]) => {
    setCartItems(updatedItems);
    localStorage.setItem('cart_items', JSON.stringify(updatedItems));
  };

  const handleRemoveItem = (id: string) => {
    saveCartToStorage(cartItems.filter((item) => item.id !== id));
  };

  const handleQuantityChange = (id: string, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) };
      }
      return item;
    });
    saveCartToStorage(updated);
  };

  const handleSizeChange = (id: string, newSize: ShirtSize) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) return { ...item, size: newSize };
      return item;
    });
    saveCartToStorage(updated);
  };

  const handleDuplicateItem = (itemToDuplicate: CartItem) => {
    const newItem: CartItem = {
      ...itemToDuplicate,
      id: `cart_${Date.now()}`,
      quantity: 1,
    };
    saveCartToStorage([...cartItems, newItem]);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + (item.price || 499) * (item.quantity || 1), 0);
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
            {/* Logged-In Badge / Sign In Trigger */}
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
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center"
                >
                  <CartItemModel item={item} />

                  <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <h2 className="text-sm font-bold text-slate-800">Custom Oversized T-Shirt</h2>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0"
                        style={{ backgroundColor: item.fabricColor }}
                        title={`Color: ${item.fabricColor}`}
                      />
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <p>
                        Placements:{' '}
                        <span className="font-semibold text-slate-700">
                          {item.placements?.map((p) => p.zone).join(', ') || 'None'}
                        </span>
                      </p>

                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <label className="text-xs text-slate-600 font-medium">Size:</label>
                        <select
                          value={item.size || 'L'}
                          onChange={(e) => handleSizeChange(item.id, e.target.value as ShirtSize)}
                          className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded-md px-2 py-1 focus:outline-none"
                        >
                          {AVAILABLE_SIZES.map((sz) => (
                            <option key={sz} value={sz}>
                              {sz}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-4 pt-1">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="px-2 py-1 text-slate-600 font-bold hover:bg-slate-200 text-xs"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-bold text-slate-800">
                          {item.quantity || 1}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="px-2 py-1 text-slate-600 font-bold hover:bg-slate-200 text-xs"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-900">
                        ₹{(item.price || 499) * (item.quantity || 1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-3 pt-2 text-[11px] font-semibold border-t border-slate-100">
                      <button
                        onClick={() => router.push(`/edit?editId=${item.id}`)}
                        className="text-slate-700 hover:text-slate-900 underline"
                      >
                        Edit Design
                      </button>
                      <button
                        onClick={() => handleDuplicateItem(item)}
                        className="text-emerald-600 hover:text-emerald-700 underline"
                      >
                        Add Another Size
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 h-fit">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Order Summary
              </h2>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">₹{calculateSubtotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="font-bold text-emerald-600">FREE</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between text-sm font-black text-slate-900">
                <span>Total</span>
                <span>₹{calculateSubtotal()}</span>
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
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            {/* Mode Switch Tabs */}
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