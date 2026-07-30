'use client';

import React from 'react';
import { useCart } from '../context/CartContext';

type ProductInput = {
  id: string;
  name: string;
  base_price?: number;
  price?: number;
  mockup_url?: string | null;
  graphic_url?: string | null;
  image?: string;
};

type AddToCartButtonProps = {
  product: ProductInput;
  /** Optional custom button label when qty is 0 (default: "Add To Cart") */
  label?: string;
  /** Pass 'compact' for tight layouts like cart drawers, 'default' for grids/product pages */
  variant?: 'default' | 'compact';
};

export default function AddToCartButton({
  product,
  label = 'Add To Cart',
  variant = 'default',
}: AddToCartButtonProps) {
  const { getItemQuantity, addToCart, updateQuantity } = useCart();
  const quantity = getItemQuantity(product.id);

  const price = product.base_price ?? product.price ?? 0;

  // 1. Initial State: "Add To Cart"
  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={() =>
          addToCart({
            id: product.id,
            name: product.name,
            base_price: price,
            mockup_url: product.mockup_url || product.image,
            graphic_url: product.graphic_url,
          })
        }
        className={`w-full rounded-full bg-[#b88b58] text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-white transition duration-300 hover:opacity-90 ${
          variant === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-4'
        }`}
      >
        {label}
      </button>
    );
  }

  // 2. Active State: Minus / Qty / Plus
  return (
    <div
      className={`flex w-full items-center justify-between rounded-full border border-black/10 bg-white/90 p-1 shadow-sm ${
        variant === 'compact' ? 'h-8' : 'h-10'
      }`}
    >
      <button
        type="button"
        onClick={() => updateQuantity(product.id, -1)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-xs font-bold transition hover:bg-black/15 active:scale-95"
        aria-label="Decrease quantity"
      >
        −
      </button>

      <span className="text-xs font-bold tracking-wider text-black">
        {quantity}
      </span>

      <button
        type="button"
        onClick={() => updateQuantity(product.id, 1)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-xs font-bold transition hover:bg-black/15 active:scale-95"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}