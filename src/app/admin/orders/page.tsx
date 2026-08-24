'use client';

import React, { useEffect, useState } from 'react';
import AdminShirtInspector3D from '@/components/admin/Admin3DTshirtModel';
import { Placement } from '@/types/customization';


export interface CustomShirtOrder {
  id?: string;
  fabricColor: string;
  placements?: Placement[];
}

export interface OrderItem {
  id: string;
  size?: string;
  quantity: number;
  unitPrice: number | string;
  productId?: string | null;
  designId?: string | null;
  customShirtOrderId?: string | null;
  customShirtOrder?: CustomShirtOrder | null;
}

export interface Address {
  fullName?: string;
  phone?: string;
  street?: string;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Order {
  id: string;
  userId?: string | null;
  addressId?: string;
  address?: Address | null;
  shippingAddress?: Address | null;
  status: 'RECEIVED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: string;
  totalAmount: number | string;
  createdAt: string;
  items?: OrderItem[];
}

const ORDER_STATUSES = ['RECEIVED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // 1. Point to /orders/admin/all instead of /orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/orders/admin/all`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch admin orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 2. Point to /orders/admin/:id/status for status updates
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  // 3. Inspect button fetches detailed record from /orders/admin/:id
  const handleInspect = async (orderId: string) => {
    setInspectLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/orders/admin/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch order details');
      const detailedOrder = await res.json();
      setSelectedOrder(detailedOrder);
    } catch (err) {
      console.error('Error inspecting order:', err);
      // Fallback to table item if detail fetch fails
      const fallback = orders.find((o) => o.id === orderId);
      if (fallback) setSelectedOrder(fallback);
    } finally {
      setInspectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="text-neutral-400">Loading Admin Orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
        <h1 className="text-2xl font-bold">Admin Order Management</h1>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-neutral-800 text-xs font-semibold rounded-lg hover:bg-neutral-700 transition"
        >
          Refresh List
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-800/60 text-neutral-400 text-xs uppercase font-semibold">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Date</th>
              <th className="p-4">Items Count</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-neutral-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const itemsCount = order.items?.length ?? 0;

                return (
                  <tr key={order.id} className="hover:bg-neutral-800/40 transition">
                    <td className="p-4 font-mono text-xs text-amber-500">{order.id}</td>
                    <td className="p-4 text-xs text-neutral-400">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">{itemsCount}</td>
                    <td className="p-4 font-semibold text-white">₹{order.totalAmount}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs rounded-full">
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="bg-neutral-800 border border-neutral-700 text-xs rounded-lg px-2 py-1 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleInspect(order.id)}
                        disabled={inspectLoading}
                        className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-semibold rounded-lg transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <AdminOrderInspector order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

function AdminOrderInspector({ order, onClose }: { order: Order; onClose: () => void }) {
  const address = order.address || order.shippingAddress;
  const items = order.items ?? [];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 border border-neutral-800 max-w-2xl w-full rounded-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div>
            <h2 className="text-lg font-bold">Inspect Order</h2>
            <p className="text-xs text-amber-500 font-mono">{order.id}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white text-xl font-bold">
            ✕
          </button>
        </div>

        {address && (
          <div className="bg-neutral-800/40 p-4 rounded-xl space-y-1 text-xs text-neutral-300">
            <p className="text-neutral-400 uppercase font-semibold">Shipping Details</p>
            {address.fullName && <p className="text-sm font-semibold text-white">{address.fullName}</p>}
            <p>
              {address.line1 || address.street}, {address.city}, {address.state} - {address.pincode}
            </p>
            {address.phone && <p className="text-neutral-400">Phone: {address.phone}</p>}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">
            Order Items ({items.length})
          </h3>

          {items.length === 0 ? (
            <p className="text-xs text-neutral-500">No item details found for this order.</p>
          ) : (
            items.map((item, idx) => {
              const placements = item.customShirtOrder?.placements ?? [];

              return (
                <div key={item.id || idx} className="bg-neutral-800/30 border border-neutral-800 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-white">
                      Item #{idx + 1} — Size: <span className="text-amber-400">{item.size || 'M'}</span>
                    </span>
                    <span className="text-xs text-neutral-400">
                      Qty: {item.quantity} × ₹{item.unitPrice}
                    </span>
                  </div>

                  {item.customShirtOrder && (
                    <div className="text-xs space-y-2 border-t border-neutral-800/60 pt-2">
                      <p className="text-neutral-400">
                        Fabric Color: <span className="font-semibold text-white">{item.customShirtOrder.fabricColor}</span>
                      </p>

                      {placements.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-neutral-400 font-semibold">Custom Placements:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {placements.map((p, pIdx) => (
                              <div 
                                key={`${p.zone}_${pIdx}`} 
                                className="bg-neutral-900 p-2 rounded border border-neutral-800 text-[11px] space-y-1"
                              >
                                <p className="text-amber-500 font-bold capitalize">{p.zone} Zone</p>
                                {p.imageUrl && (
                                  <a 
                                    href={p.imageUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="text-xs text-blue-400 underline block truncate"
                                  >
                                    View Image Asset
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl text-sm transition"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
}