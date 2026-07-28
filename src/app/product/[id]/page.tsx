'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  tagline: string;
};

const CART_STORAGE_KEY = 'OGcut-cart';

const productCatalog: Product[] = [
  {
    id: 1,
    name: 'Oversized Signature Tee',
    price: 120,
    category: 'T-Shirts',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    tagline: 'Soft structure / sculpted drape',
  },
  {
    id: 2,
    name: 'Monarch Hoodie',
    price: 220,
    category: 'Hoodies',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
    tagline: 'Heavyweight cotton / elevated volume',
  },
  {
    id: 3,
    name: 'Contour Jacket',
    price: 310,
    category: 'Outerwear',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
    tagline: 'Minimal shell / clean geometry',
  },
  {
    id: 4,
    name: 'Chrome Cap',
    price: 90,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1521369909024-2d4437f4c0f2?auto=format&fit=crop&w=900&q=80',
    tagline: 'Precision finish / brushed texture',
  },
  {
    id: 5,
    name: 'Block Tee',
    price: 110,
    category: 'T-Shirts',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    tagline: 'Architectural cut / premium cotton',
  },
  {
    id: 6,
    name: 'Shadow Pullover',
    price: 260,
    category: 'Hoodies',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    tagline: 'Sculpted line / effortless drape',
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const productId = Number(params?.id);
    const foundProduct = productCatalog.find((item) => item.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
    }
  }, [params]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart) as Array<Product & { quantity: number }>;
        setCartCount(parsed.reduce((sum, item) => sum + item.quantity, 0));
      } catch {
        console.warn('Unable to parse saved cart');
      }
    }
  }, []);

  const addToCart = () => {
    if (!product) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    const currentCart = savedCart ? (JSON.parse(savedCart) as Array<Product & { quantity: number }>) : [];
    const existing = currentCart.find((item) => item.id === product.id);
    const nextCart = existing
      ? currentCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      : [...currentCart, { ...product, quantity: 1 }];

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
    setCartCount(nextCart.reduce((sum, item) => sum + item.quantity, 0));
  };

  if (!product) {
    return <div className="min-h-screen bg-[#f5f0e8] p-8 text-center text-sm uppercase tracking-[0.25em]">Loading product…</div>;
  }

  return (
    <main className="min-h-screen bg-[#f5f0e8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="rounded-full border border-black/10 px-4 py-2 text-[0.7rem] uppercase tracking-[0.3em]">
            Back to shop
          </Link>
          <a href="/cart" className="rounded-full bg-black px-4 py-2 text-[0.7rem] uppercase tracking-[0.3em] text-white">
            Cart ({cartCount})
          </a>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white/85 shadow-[0_20px_80px_rgba(0,0,0,0.08)]">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <img src={product.image} alt={product.name} className="h-full min-h-[420px] w-full object-cover" />
            <div className="flex flex-col justify-between p-8 sm:p-10">
              <div className="space-y-4">
                <p className="text-[0.7rem] uppercase tracking-[0.35em] text-black/55">{product.category}</p>
                <h1 className="text-3xl font-semibold uppercase tracking-[0.2em] sm:text-4xl">{product.name}</h1>
                <p className="text-sm leading-7 text-black/70">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <p className="text-2xl font-semibold uppercase tracking-[0.2em]">${product.price}</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={addToCart} className="rounded-full bg-black px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-white transition hover:opacity-90">
                  Add to cart
                </button>
                <a href="/cart" className="rounded-full border border-black/10 px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.3em] transition hover:bg-black/5">
                  View cart
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
