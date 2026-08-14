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

  // 1. Clone the scene so each cart item gets its own distinct 3D object
  const clonedScene = React.useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    if (clonedScene && texture) {
      clonedScene.traverse((child: any) => {
        if (child.isMesh) {
          // Clone material so texture changes on item A don't bleed onto item B
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

    // Fill fabric color
    ctx.fillStyle = item.fabricColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!item.placements || item.placements.length === 0) {
      setTexture(tex);
      return;
    }

    // Preload placement artwork asynchronously onto 2D canvas
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart_items');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
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
          <Link
            href="/edit"
            className="py-2 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            + New Design
          </Link>
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
                  {/* Interactive 3D Model Thumbnail */}
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
                onClick={() => alert('Proceeding to checkout...')}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}