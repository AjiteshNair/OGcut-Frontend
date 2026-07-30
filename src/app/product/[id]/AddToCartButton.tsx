'use client';

import { useCart } from '@/context/CartContext';
import { useState } from 'react';

interface Props {
  product: {
    id: string;
    name: string;
    base_price: number;
    mockup_url?: string;
    graphic_url?: string;
  };
}

export default function AddToCartButton({ product }: Props) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full rounded-xl py-4 text-xs font-bold uppercase tracking-[0.2em] transition-all ${
        added
          ? 'bg-emerald-600 text-white'
          : 'bg-black text-white hover:bg-neutral-800'
      }`}
    >
      {added ? '✓ Added to Cart!' : 'Add to Cart'}
    </button>
  );
}