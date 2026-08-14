'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Order } from '@/types/checkout';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (orderId) {
      try {
        const storedOrders = JSON.parse(localStorage.getItem('order_history') || '[]');
        const found = storedOrders.find((o: Order) => o.id === orderId);
        if (found) setOrder(found);
      } catch (error) {
        console.error('Error loading order history:', error);
      }
    }
    setIsLoaded(true);
  }, [orderId]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-neutral-400">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-xl font-bold">Order Not Found</h1>
          <p className="text-sm text-neutral-400">We couldn't find details for this order.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition text-sm"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-6">
        
        {/* Success Icon */}
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
          ✓
        </div>

        <div>
          <h1 className="text-2xl font-bold">Order Confirmed!</h1>
          <p className="text-sm text-neutral-400 mt-1">Order ID: <span className="text-amber-500 font-mono">{order.id}</span></p>
        </div>

        {/* Shipping Summary */}
        <div className="bg-neutral-800/50 p-4 rounded-xl text-left space-y-2 text-xs">
          <p className="text-neutral-400 uppercase font-semibold tracking-wider">Shipping To</p>
          <p className="font-semibold text-sm text-white">{order.shippingAddress.fullName}</p>
          <p className="text-neutral-300">{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
          <p className="text-neutral-400">Phone: {order.shippingAddress.phone}</p>
        </div>

        {/* Items Summary */}
        <div className="border-t border-neutral-800 pt-4 space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <span className="text-neutral-300">Custom T-Shirt ({item.size}) x{item.quantity}</span>
              <span className="font-semibold">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-800">
            <span>Total Paid</span>
            <span className="text-amber-500">₹{order.totalAmount}</span>
          </div>
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition"
        >
          Continue Customizing
        </button>

      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
          <p className="text-neutral-400">Loading order details...</p>
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}