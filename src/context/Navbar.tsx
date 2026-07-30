'use client';

import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useState } from 'react';
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const { totalItems } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-black/10 bg-[#f3efe7]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-black uppercase tracking-[0.3em] text-neutral-900">
            STORE
          </Link>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="relative rounded-full bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800 transition-colors"
          >
            Cart
            {totalItems > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <CartDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}