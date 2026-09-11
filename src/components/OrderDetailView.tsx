'use client';

import Image from 'next/image';
import OrderTracker from './OrderTracker';

interface ProductImage {
  imgurl: string;
}

interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  size: string;
  color?: string;
  product: {
    id: number;
    name: string;
    images?: ProductImage[];
  };
}

export interface OrderDetail {
  id: number;
  orderCode: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  trackingNumber?: string;
  address?: Record<string, any>;
  items: OrderItem[];
}

interface OrderDetailViewProps {
  order: OrderDetail;
  onBack: () => void;
}

export default function OrderDetailView({ order, onBack }: OrderDetailViewProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-6 shadow-sm">
      {/* Back Header */}
      <button
        onClick={onBack}
        className="text-xs font-semibold text-zinc-600 hover:text-black transition-colors"
      >
        ← Back to all orders
      </button>

      {/* Title & Top Badges */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 border-b border-zinc-100 pb-4">
        <div>
          <h2 className="text-lg font-bold">Order #{order.orderCode}</h2>
          <p className="text-xs text-zinc-500">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="sm:text-right">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 uppercase">
            {order.status}
          </span>
          <p className="text-xs text-zinc-500 mt-1">
            Payment:{' '}
            <span className="font-semibold uppercase text-emerald-600">
              {order.paymentStatus}
            </span>
          </p>
        </div>
      </div>

      {/* Progress Map Tracker */}
      <div className="py-2">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
          Order Progress
        </p>
        <OrderTracker status={order.status} />
      </div>

      {/* Dispatch Tracking Info */}
      <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-md">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
          Tracking Number
        </p>
        <p className="text-sm font-mono font-semibold text-black mt-0.5">
          {order.trackingNumber || 'Pending dispatch'}
        </p>
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">Items</h3>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 border-b border-zinc-100 pb-4 last:border-0"
          >
            {item.product.images?.[0]?.imgurl && (
              <div className="relative w-16 h-16 bg-zinc-100 rounded overflow-hidden flex-shrink-0">
                <Image
                  src={item.product.images[0].imgurl}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">{item.product.name}</p>
              <p className="text-xs text-zinc-500">
                Size: {item.size} {item.color ? `| Color: ${item.color}` : ''} | Qty:{' '}
                {item.quantity}
              </p>
              <p className="text-sm font-semibold mt-1">₹{item.unitPrice}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="border-t border-zinc-100 pt-4 flex justify-between font-bold">
        <span>Total Amount</span>
        <span>₹{order.totalAmount}</span>
      </div>
    </div>
  );
}