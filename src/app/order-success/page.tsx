'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { normalizeFabricColor, normalizePlacements } from '@/utils/normalization';

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

interface OrderPlacement {
  place?: string;
  zone?: string;
}

interface OrderItem {
  id?: number | string;
  size?: string;
  quantity: number;
  unitPrice?: number | string;
  price?: number | string;
  color?: string;
  fabricColor?: string;
  placements?: OrderPlacement[];
  product?: {
    title?: string;
    name?: string;
    images?: Array<{ url: string }>;
  };
}

interface OrderDetails {
  id: number | string;
  orderCode?: string;
  totalAmount: number | string;
  status: string;
  paymentStatus?: string;
  address?: OrderAddress;
  shippingAddress?: OrderAddress;
  items: OrderItem[];
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Accept orderCode, id, or orderId query parameters
  const orderIdentifier =
    searchParams.get('orderCode') ||
    searchParams.get('id') ||
    searchParams.get('orderId');

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!orderIdentifier) {
      setLoading(false);
      return;
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token');

    // Fetch order directly from backend database
    fetch(`${API_BASE_URL}/orders/${orderIdentifier}`, {
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
        // 2. Safely unwrap data.order returned by NestJS
        setOrder(data.order || data);
      })
      .catch((err) => {
        console.error('Error fetching order:', err);
        setErrorMsg(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderIdentifier]);

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
            Order Code:{' '}
            <span className="text-amber-500 font-mono">
              {order.orderCode || order.id}
            </span>
          </p>
        </div>

        {/* Shipping Summary */}
        {shipping && (
          <div className="bg-neutral-800/50 p-4 rounded-xl text-left space-y-2 text-xs">
            <p className="text-neutral-400 uppercase font-semibold tracking-wider">
              Shipping To
            </p>
            {shipping.fullName && (
              <p className="font-semibold text-sm text-white">{shipping.fullName}</p>
            )}
            <p className="text-neutral-300">
              {shipping.line1 || shipping.street}, {shipping.city}, {shipping.state} -{' '}
              {shipping.pincode}
            </p>
            {shipping.phone && (
              <p className="text-neutral-400">Phone: {shipping.phone}</p>
            )}
          </div>
        )}

        {/* Items Summary */}
        <div className="bg-neutral-800/40 p-4 rounded-xl text-left space-y-3">
          <p className="text-neutral-400 uppercase font-semibold tracking-wider text-xs border-b border-neutral-800 pb-2">
            Ordered Items
          </p>

          {(order.items ?? []).map((item: OrderItem, idx: number) => {
            const placements = normalizePlacements(item.placements ?? []);
            const isCustom = placements.length > 0;

            const title = isCustom
              ? 'Custom Oversized T-Shirt'
              : item.product?.title || item.product?.name || 'Catalog T-Shirt';

            const itemPrice = Number(item.unitPrice ?? item.price ?? 0);
            const qty = Number(item.quantity) || 1;
            let fabricColor: string | null = null;
            try {
              const rawColor = placements.length > 0 ? (item.fabricColor ?? item.color) : item.color;
              fabricColor = normalizeFabricColor(rawColor) ?? null;
            } catch (err) {
              console.warn('Missing fabric color for order item; skipping badge:', err);
              fabricColor = null;
            }
            const imageSrc = item.product?.images?.[0]?.url;

            return (
              <div
                key={item.id || idx}
                className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-none"
              >
                <div className="flex items-center gap-3">
                  {/* Color Badge for Custom Shirts */}
                  {fabricColor && (
                    <span
                      className="w-4 h-4 rounded-full border border-neutral-600 inline-block shrink-0"
                      style={{ backgroundColor: fabricColor }}
                      title={`Fabric Color: ${fabricColor}`}
                    />
                  )}

                  {/* Image Preview for Catalog Shirts */}
                  {!isCustom && imageSrc && (
                    <img
                      src={imageSrc}
                      alt={title}
                      className="w-10 h-10 object-cover rounded-lg border border-neutral-700 shrink-0"
                    />
                  )}

                  <div>
                    <p className="text-sm font-bold text-white">
                      {title}{' '}
                      <span className="text-xs font-normal text-neutral-400">
                        ({item.size || 'M'}) × {qty}
                      </span>
                    </p>

                    {/* Print Details Tag for Custom Shirts */}
                    {isCustom && (
                      <p className="text-[11px] text-neutral-400">
                        Prints:{' '}
                        {placements.map((p) => p.zone).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-sm font-bold text-neutral-200">
                  ₹{itemPrice * qty}
                </span>
              </div>
            );
          })}
        </div>

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