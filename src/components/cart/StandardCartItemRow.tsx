'use client';

import React from 'react';
import Image from 'next/image';
import { StandardCartItem, ShirtSize } from '@/types/customization';

const AVAILABLE_SIZES: ShirtSize[] = ['S', 'M', 'L', 'XL', '2XL'];

interface StandardCartItemRowProps {
  item: StandardCartItem;
  onQuantityChange: (id: number, delta: number) => void;
  onSizeChange: (id: number, newSize: ShirtSize) => void;
  onRemove: (id: number) => void;
}

export const StandardCartItemRow: React.FC<StandardCartItemRowProps> = ({
  item,
  onQuantityChange,
  onSizeChange,
  onRemove,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
      {/* 2D Image Thumbnail */}
      <div className="w-28 h-28 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden relative shrink-0">
        <Image
          src={item.thumbnailUrl || 'https://placehold.co/200x200/png?text=No+Image'}
          alt={item.title}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-1 space-y-2 text-center sm:text-left w-full">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <h2 className="text-sm font-bold text-slate-800">{item.title}</h2>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
            Catalog Item
          </span>
        </div>

        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <label className="text-xs text-slate-600 font-medium">Size:</label>
            <select
              value={item.size || 'M'}
              onChange={(e) => onSizeChange(item.id, e.target.value as ShirtSize)}
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
              onClick={() => onQuantityChange(item.id, -1)}
              className="px-2 py-1 text-slate-600 font-bold hover:bg-slate-200 text-xs"
            >
              -
            </button>
            <span className="px-3 text-xs font-bold text-slate-800">
              {item.quantity || 1}
            </span>
            <button
              onClick={() => onQuantityChange(item.id, 1)}
              className="px-2 py-1 text-slate-600 font-bold hover:bg-slate-200 text-xs"
            >
              +
            </button>
          </div>

          <span className="text-xs font-bold text-slate-900">
            ₹{(item.price) * (item.quantity)}
          </span>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-3 pt-2 text-[11px] font-semibold border-t border-slate-100">
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700 underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};