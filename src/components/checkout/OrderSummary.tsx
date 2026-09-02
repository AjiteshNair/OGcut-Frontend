'use client';

import React from 'react';
import { OrderItemPayload } from '@/types/checkout';
import { getItemPrice } from '@/utils/checkoutHelper';

interface OrderSummaryProps {
  cartItems: OrderItemPayload[];
  subtotal: number;
  shipping: number;
  grandTotal: number;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  subtotal,
  shipping,
  grandTotal,
}) => {
  return (
    <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 h-fit space-y-4">
      <h3 className="font-bold text-lg pb-3 border-b border-neutral-800">Order Summary</h3>
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {cartItems.map((item, idx) => {
          const price = getItemPrice(item);
          const qty = Number(item.quantity) || 1;
          const isCustom = item.type === 'custom' || Boolean(item.placements?.length);

          const displayTitle = isCustom
            ? 'Custom T-Shirt'
            : item.title || item.name || 'Catalog Item';

          return (
            <div key={idx} className="flex justify-between items-center text-sm">
              <div>
                <p className="font-medium text-white">
                  {displayTitle} ({item.size || 'M'})
                </p>
                <p className="text-xs text-neutral-500">
                  Qty: {qty} {isCustom ? `| Color: ${item.fabricColor || 'Standard'}` : ''}
                </p>
              </div>
              <p className="font-semibold text-neutral-300">₹{price * qty}</p>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-neutral-800 space-y-2 text-sm">
        <div className="flex justify-between text-neutral-400">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="flex justify-between text-neutral-400">
          <span>Shipping</span>
          <span>₹{shipping}</span>
        </div>
        <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-neutral-800">
          <span>Total Amount</span>
          <span className="text-amber-500">₹{grandTotal}</span>
        </div>
      </div>
    </div>
  );
};