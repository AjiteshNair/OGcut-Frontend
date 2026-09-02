'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { StandardCartItem, CartItem } from '@/types/customization';

interface Product {
  id: number;
  title: string;
  price: number;
  thumbnailUrl: string;
  colors?: string[];
  sizes?: string[];
}

interface StandardProductCardProps {
  product: Product;
}

export const StandardProductCard: React.FC<StandardProductCardProps> = ({ product }) => {
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0] || 'Black');
  const [quantity, setQuantity] = useState<number>(0);

  // Sync state with LocalStorage on mount & updates
  useEffect(() => {
    const syncCartQuantity = () => {
      const storedCart = localStorage.getItem('cart_items');
      if (!storedCart) {
        setQuantity(0);
        return;
      }

      try {
        const cart: CartItem[] = JSON.parse(storedCart);
        const existingItem = cart.find(
          (item): item is StandardCartItem =>
            item.type === 'standard' &&
            item.productId === product.id &&
            item.size === selectedSize &&
            item.color === selectedColor
        );

        setQuantity(existingItem ? existingItem.quantity : 0);
      } catch (err) {
        console.error('Failed to parse cart items:', err);
      }
    };

    syncCartQuantity();
    window.addEventListener('storage', syncCartQuantity);
    window.addEventListener('cartUpdated', syncCartQuantity);

    return () => {
      window.removeEventListener('storage', syncCartQuantity);
      window.removeEventListener('cartUpdated', syncCartQuantity);
    };
  }, [product.id, selectedSize, selectedColor]);

  const updateCart = (newQuantity: number) => {
    const storedCart = localStorage.getItem('cart_items');
    let cart: CartItem[] = storedCart ? JSON.parse(storedCart) : [];

    // Unique match key for variant
    const itemIndex = cart.findIndex(
      (item): item is StandardCartItem =>
        item.type === 'standard' &&
        item.productId === product.id &&
        item.size === selectedSize &&
        item.color === selectedColor
    );

    if (newQuantity <= 0) {
      if (itemIndex > -1) cart.splice(itemIndex, 1);
    } else {
      const updatedItem: StandardCartItem = {
        type: 'standard',
        id: itemIndex > -1 ? cart[itemIndex].id : Date.now() + Math.random(),
        productId: product.id,
        title: product.title,
        thumbnailUrl: product.thumbnailUrl,
        price: product.price,
        quantity: newQuantity,
        size: selectedSize as any,
        color: selectedColor,
      };

      if (itemIndex > -1) {
        cart[itemIndex] = updatedItem;
      } else {
        cart.push(updatedItem);
      }
    }

    localStorage.setItem('cart_items', JSON.stringify(cart));
    setQuantity(newQuantity);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <div className="border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white">
      <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={product.thumbnailUrl}
          alt={product.title}
          fill
          className="object-cover"
        />
      </div>

      <h3 className="font-semibold text-lg text-gray-900">{product.title}</h3>
      <p className="text-gray-600 mb-3">${product.price.toFixed(2)}</p>

      {/* Size Selector */}
      {product.sizes && (
        <div className="flex gap-2 mb-3">
          {product.sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-2.5 py-1 text-xs font-medium rounded border ${
                selectedSize === size
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      )}

      {/* Quantity / Add to Cart Action */}
      {quantity === 0 ? (
        <button
          onClick={() => updateCart(1)}
          className="w-full py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
        >
          Add to Cart
        </button>
      ) : (
        <div className="flex items-center justify-between border rounded-lg px-3 py-1.5 bg-gray-50">
          <button
            onClick={() => updateCart(quantity - 1)}
            className="text-gray-600 hover:text-black font-bold px-2"
          >
            -
          </button>
          <span className="text-sm font-semibold">{quantity}</span>
          <button
            onClick={() => updateCart(quantity + 1)}
            className="text-gray-600 hover:text-black font-bold px-2"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};