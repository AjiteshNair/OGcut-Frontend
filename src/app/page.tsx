'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Loader2, Plus, Minus, ArrowDown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Product, StandardCartItem } from '@/types/customization';
import {
  getStoredCart,
  updateStandardItemQuantity,
} from '@/utils/cartStorage';

const HERO_BG_IMAGE =
  'https://imgs.search.brave.com/PSnWaXLyixQaLtlbWLQzjBHMMpSSZQE3L1yd30GZfec/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNjcv/NjQ4Lzg1MC9zbWFs/bC9jbG9zZXVwLWRh/cmstZmFicmljLXRl/eHR1cmUtaW50ZXJ0/d2luZWQtdGhyZWFk/cy1kZXRhaWxlZC13/b3Zlbi1wYXR0ZXJu/LWJsYWNrLXRleHRp/bGUtYmFja2dyb3Vu/ZC1waG90by5qcGc';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  // 1. Sync cart quantities on mount and whenever storage/cart updates
  const syncQuantitiesFromStorage = () => {
    const cart = getStoredCart();
    const quantities: Record<string, number> = {};

    cart.forEach((item) => {
      if (item.type === 'standard') {
        quantities[item.productId] = (quantities[item.productId] || 0) + item.quantity;
      }
    });

    setCartQuantities(quantities);
  };

  useEffect(() => {
    syncQuantitiesFromStorage();

    window.addEventListener('storage', syncQuantitiesFromStorage);
    window.addEventListener('cart-updated', syncQuantitiesFromStorage);

    return () => {
      window.removeEventListener('storage', syncQuantitiesFromStorage);
      window.removeEventListener('cart-updated', syncQuantitiesFromStorage);
    };
  }, []);

  // 2. Fetch products backend API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // 3. Cart action handlers using our cartStorage helper
  const handleQuantityChange = (product: Product, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    updateStandardItemQuantity(product, delta);
  };

  const totalCartCount = Object.values(cartQuantities).reduce((a, b) => a + b, 0);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 relative">
      <Navbar cartCount={totalCartCount} />

      {/* Hero Cover */}
      <section
        className="relative w-full h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center text-center px-6"
        style={{ backgroundImage: `url(${HERO_BG_IMAGE})` }}
      >
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-5 text-white">
          <span className="text-xs tracking-widest text-gray-300 font-semibold block">
            OGcut / Streetwear Collection
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight drop-shadow-md">
            OGcut CATALOG
          </h1>
          <p className="text-sm md:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
            Heavyweight oversized tees, aesthetic graphic prints, and tech wear.
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/70 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-[10px] font-bold uppercase tracking-widest">Scroll Down</span>
          <ArrowDown className="w-4 h-4" />
        </div>
      </section>

      {/* Customization Banner */}
      <section className="max-w-6xl mx-auto my-12 px-4">
        <div className="relative overflow-hidden rounded-3xl bg-black text-white border border-gray-800 p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_BG_IMAGE})` }}
          />

          <div className="relative z-10 max-w-xl space-y-3 text-center md:text-left">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1 rounded-full inline-block">
              Custom Lab
            </span>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
              Design Your Own Drop
            </h2>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
              Upload your graphic, select placement, tweak colors, and bring your unique streetwear Vision to life.
            </p>
          </div>

          <div className="relative z-10">
            <Link
              href="/edit"
              className="inline-flex items-center gap-3 bg-white text-black hover:bg-gray-200 text-xs font-black uppercase tracking-wider px-8 py-4 rounded-2xl transition-all transform group-hover:scale-105 shadow-lg active:scale-95"
            >
              <span>Customize Now</span>
              <span className="text-base">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Catalog */}
      <section id="catalog" className="max-w-6xl mx-auto py-16 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-wider">Featured Tees</h2>
            <p className="text-xs text-gray-500">Explore our latest drops</p>
          </div>
          <span className="text-xs font-bold bg-black text-white px-3 py-1 rounded-full">
            {products.length} Products
          </span>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-black" />
            <p className="text-xs uppercase font-bold tracking-wider">Loading products...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-center text-sm my-10">
            Unable to connect to NestJS backend ({error}).
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => {
              const imageUrl =
                product.mockup_url || product.graphic_url || 'https://via.placeholder.com/400';
              const price = product.base_price;
              const qty = cartQuantities[product.id] || 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <Link
                    href={`/product/${product.id}`}
                    className="block relative w-full h-72 bg-gray-100 overflow-hidden"
                  >
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://placehold.co/600x600/png?text=Image+Not+Found';
                      }}
                    />
                    {product.category && (
                      <span className="absolute top-3 left-3 bg-black/80 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {product.category}
                      </span>
                    )}
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <Link href={`/product/${product.id}`} className="block">
                      <h3 className="font-bold text-base text-gray-900 group-hover:text-black line-clamp-1">
                        {product.name}
                      </h3>
                      {product.tagline && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {product.tagline}
                        </p>
                      )}
                    </Link>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase">
                          Price
                        </span>
                        <span className="text-lg font-black text-black">
                          ₹{Number(price).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div>
                        {qty === 0 ? (
                          <button
                            onClick={(e) => handleQuantityChange(product, 1, e)}
                            className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Add to Cart
                          </button>
                        ) : (
                          <div className="flex items-center bg-gray-100 rounded-xl border border-gray-300 p-1">
                            <button
                              onClick={(e) => handleQuantityChange(product, -1, e)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-black hover:bg-gray-200 active:scale-95 transition-all shadow-xs"
                              title="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-xs font-black text-black min-w-[20px] text-center">
                              {qty}
                            </span>
                            <button
                              onClick={(e) => handleQuantityChange(product, 1, e)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-black text-white hover:bg-gray-800 active:scale-95 transition-all shadow-xs"
                              title="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}