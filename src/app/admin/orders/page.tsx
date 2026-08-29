'use client';

import React, { useState, useEffect } from 'react';
import {
  AdminOrder,
  AddressSnapshot,
  FrontendOrderStatus,
} from '@/types/admin-orders';
import Admin3DInspectorModal from '@/components/admin/Admin3DInspectorModal';
import { CustomCartItem, Placement } from '@/types/customization';

const STATUS_OPTIONS: FrontendOrderStatus[] = [
  'PENDING',
  'PROCESSING',
  'PRINTING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [inspectingItem, setInspectingItem] = useState<CustomCartItem | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // 1. Retrieve the JWT token stored after login
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

      const res = await fetch(`${API_BASE_URL}/orders/admin/all`, {
        headers: {
          // 2. Attach the Bearer token
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        console.error(`HTTP error ${res.status}`);
        return;
      }

      const json = await res.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: FrontendOrderStatus) => {
    try {
      setUpdatingId(orderId);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

      const res = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        console.error(`HTTP error ${res.status}`);
        return;
      }

      const json = await res.json();
      if (json.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const open3DInspector = (orderItem: AdminOrder['items'][0], fabricColor: string) => {
    const customPayload: CustomCartItem = {
      type: 'custom',
      id: orderItem.id,
      size: orderItem.size,
      fabricColor: fabricColor || '#ffffff',
      placements: orderItem.placements.map((p) => ({
        place: p.place,
        zone: p.place,
        imgurl: p.imgurl,
        imageUrl: p.imgurl,
        xvalue: p.xvalue,
        x: p.xvalue,
        yvalue: p.yvalue,
        y: p.yvalue,
        zoom: p.zoom,
        width: p.width || undefined,
        height: p.height || undefined,
      })) as unknown as Placement[],
      price: orderItem.unitPrice,
      quantity: orderItem.quantity,
      title: orderItem.product.name,
    };
    setInspectingItem(customPayload);
  };

  const renderAddress = (addr: AddressSnapshot) => {
    if (!addr || typeof addr !== 'object') return 'N/A';
    return `${addr.line1}, ${addr.line2 ? addr.line2 + ', ' : ''}${addr.city}, ${addr.state} - ${addr.pincode}`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
            <p className="text-sm text-neutral-400 mt-1">
              View customer orders and modify operational fulfillment statuses.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold rounded-xl transition"
          >
            Refresh
          </button>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="p-12 text-center text-neutral-500 text-sm border border-neutral-800 rounded-2xl">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 text-sm border border-dashed border-neutral-800 rounded-2xl">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto border border-neutral-800 rounded-2xl bg-neutral-950">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-900 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                <tr>
                  <th className="py-4 px-4 text-center">S.No</th>
                  <th className="py-4 px-4">Order Code</th>
                  <th className="py-4 px-4">Customer Name</th>
                  <th className="py-4 px-4">Phone</th>
                  <th className="py-4 px-4 max-w-xs">Address</th>
                  <th className="py-4 px-4">Order Date</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {orders.map((order, index) => {
                  const addressObj = order.address as AddressSnapshot;
                  const customerName = `${order.user.firstName} ${order.user.lastName || ''}`.trim();
                  const phone = addressObj?.phone || order.user.phone || 'N/A';
                  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-neutral-900/50 transition">
                      
                      {/* S.No */}
                      <td className="py-4 px-4 text-center font-mono font-medium text-neutral-500">
                        {index + 1}
                      </td>

                      {/* Order Code */}
                      <td className="py-4 px-4 font-mono font-bold text-amber-400">
                        {order.orderCode}
                      </td>

                      {/* Customer Name */}
                      <td className="py-4 px-4 font-medium text-white">
                        {customerName}
                        <span className="block text-[10px] text-neutral-500 font-mono">
                          {order.user.email}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-4 font-mono text-neutral-300">
                        {phone}
                      </td>

                      {/* Address */}
                      <td className="py-4 px-4 max-w-xs truncate text-neutral-400" title={renderAddress(addressObj)}>
                        {renderAddress(addressObj)}
                      </td>

                      {/* Order Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-neutral-400">
                        {formattedDate}
                      </td>

                      {/* Order Status Shift Selector */}
                      <td className="py-4 px-4">
                        <select
                          disabled={updatingId === order.id}
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as FrontendOrderStatus)
                          }
                          className="bg-neutral-900 border border-neutral-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400 disabled:opacity-50 cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions / Inspect Custom 3D Items */}
                      <td className="py-4 px-4 text-center">
                        {order.items.some((i) => i.placements.length > 0) ? (
                          <div className="flex items-center justify-center gap-1">
                            {order.items.map((item) =>
                              item.placements.length > 0 ? (
                                <button
                                  key={item.id}
                                  onClick={() => open3DInspector(item, item.color || '#ffffff')}
                                  className="px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded-lg text-[10px] font-semibold transition whitespace-nowrap"
                                >
                                  Inspect Item #{item.id} ↗
                                </button>
                              ) : null
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-600 text-[10px]">Standard</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3D Inspector Modal */}
      <Admin3DInspectorModal
        item={inspectingItem}
        onClose={() => setInspectingItem(null)}
      />
    </div>
  );
}