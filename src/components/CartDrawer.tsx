'use client';

import { useCart } from '@/components/CartContext';
import Link from 'next/link';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: Props) {
  const { cart, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#fcfaf6] p-6 shadow-2xl border-l border-black/10">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em]">Your Cart ({cart.length})</h2>
          <button 
            onClick={onClose} 
            className="text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-black"
          >
            ✕ Close
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-xl border border-black/10 bg-white p-3 shadow-sm">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover bg-neutral-100" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-neutral-100 flex items-center justify-center text-[10px] text-neutral-400">No Image</div>
                )}
                
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">{item.name}</h3>
                    <p className="text-xs font-semibold text-amber-700">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-neutral-50 px-2 py-0.5">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="text-xs font-bold px-1 hover:text-amber-700"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="text-xs font-bold px-1 hover:text-amber-700"
                      >
                        +
                      </button>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-[10px] uppercase tracking-widest text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Summary */}
        {cart.length > 0 && (
          <div className="border-t border-black/10 pt-4 space-y-4">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="uppercase tracking-wider">Subtotal</span>
              <span className="text-amber-700">${totalPrice.toFixed(2)}</span>
            </div>

            <button
              onClick={() => alert('Proceeding to Phase 3 & 4 (Auth & Payments)...')}
              className="w-full rounded-xl bg-black py-4 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-neutral-800 transition-colors"
            >
              Checkout Now
            </button>

            <button 
              onClick={clearCart}
              className="w-full text-center text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-700"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}