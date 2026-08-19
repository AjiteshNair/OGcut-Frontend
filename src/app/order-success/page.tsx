'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface OrderAddress {
  fullName?: string;
  phone?: string;
  line1?: string;
  street?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface OrderItem {
  id?: string;
  size?: string;
  quantity: number;
  unitPrice?: number | string;
  price?: number | string;
}

interface OrderDetails {
  id: string;
  totalAmount: number | string;
  status: string;
  paymentStatus?: string;
  address?: OrderAddress;
  shippingAddress?: OrderAddress;
  items?: OrderItem[];
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Accept both ?id= and ?orderId= parameter formats
  const orderId = searchParams.get('id') || searchParams.get('orderId');

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token');

    // Fetch order directly from backend database
    fetch(`${API_BASE_URL}/orders/${orderId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Failed to fetch order details');
        }
        return res.json();
      })
      .then((data) => {
        setOrder(data);
      })
      .catch((err) => {
        console.error('Error fetching order:', err);
        setErrorMsg(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <p className="text-neutral-400">Loading order details...</p>
      </div>
    );
  }

  if (!order || errorMsg) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
          <h1 className="text-xl font-bold">Order Not Found</h1>
          <p className="text-sm text-neutral-400">
            {errorMsg || "We couldn't find details for this order."}
          </p>
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

  const shipping = order.address || order.shippingAddress;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-6">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
          ✓
        </div>

        <div>
          <h1 className="text-2xl font-bold">Order Confirmed!</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Order ID: <span className="text-amber-500 font-mono">{order.id}</span>
          </p>
        </div>

        {/* Shipping Summary */}
        {shipping && (
          <div className="bg-neutral-800/50 p-4 rounded-xl text-left space-y-2 text-xs">
            <p className="text-neutral-400 uppercase font-semibold tracking-wider">Shipping To</p>
            {shipping.fullName && (
              <p className="font-semibold text-sm text-white">{shipping.fullName}</p>
            )}
            <p className="text-neutral-300">
              {shipping.line1 || shipping.street}, {shipping.city}, {shipping.state} - {shipping.pincode}
            </p>
            {shipping.phone && <p className="text-neutral-400">Phone: {shipping.phone}</p>}
          </div>
        )}

        {/* Items Summary */}
        {order.items && order.items.length > 0 && (
          <div className="border-t border-neutral-800 pt-4 space-y-3">
            {order.items.map((item, idx) => {
              const itemPrice = Number(item.unitPrice ?? item.price ?? 0);
              const qty = Number(item.quantity) || 1;
              return (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-neutral-300">
                    Custom T-Shirt ({item.size || 'M'}) x{qty}
                  </span>
                  <span className="font-semibold">₹{itemPrice * qty}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-800">
          <span>Total Paid</span>
          <span className="text-amber-500">₹{order.totalAmount}</span>
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