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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [inspectingItem, setInspectingItem] = useState<CustomCartItem | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<number, string>>({});

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || '';
    }
    return '';
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/orders/admin/all`, {
        headers: {
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
        // Initialize local state for tracking numbers
        const initialTracking: Record<number, string> = {};
        json.data.forEach((o: AdminOrder & { trackingNumber?: string }) => {
          initialTracking[o.id] = o.trackingNumber || '';
        });
        setTrackingInputs(initialTracking);
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
      const token = getAuthToken();
      const currentTracking = trackingInputs[orderId] || '';

      const res = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: currentTracking,
        }),
      });

      if (!res.ok) {
        console.error(`HTTP error ${res.status}`);
        return;
      }

      const json = await res.json();
      if (json.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? { ...o, status: newStatus, trackingNumber: json.data.trackingNumber }
              : o
          )
        );
      }
    } catch (err) {
      console.error('Failed to update order status and tracking:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTrackingUpdate = async (orderId: number) => {
    try {
      setUpdatingId(orderId);
      const token = getAuthToken();
      const trackingNumber = trackingInputs[orderId] || '';

      const res = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackingNumber }),
      });

      if (!res.ok) {
        console.error(`HTTP error ${res.status}`);
        return;
      }

      const json = await res.json();
      if (json.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, trackingNumber } as AdminOrder : o
          )
        );
      }
    } catch (err) {
      console.error('Failed to update tracking number:', err);
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
      title: orderItem.product?.name || `Custom Product #${orderItem.pid}`,
    };
    setInspectingItem(customPayload);
  };

  const toggleOrderDetails = (orderId: number) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
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
            <h1 className="text-2xl font-bold tracking-tight">Order Management & Fulfillment</h1>
            <p className="text-sm text-neutral-400 mt-1">
              View complete order payloads, inspect custom prints, track shipments, and update status.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-semibold rounded-xl transition"
          >
            Refresh Orders
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
                  <th className="py-4 px-4 text-center">Details</th>
                  <th className="py-4 px-4">Order Code</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Phone</th>
                  <th className="py-4 px-4 max-w-xs">Shipping Address</th>
                  <th className="py-4 px-4">Total Amount</th>
                  <th className="py-4 px-4">Tracking Number</th>
                  <th className="py-4 px-4">Order Date</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-center">Custom Prints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {orders.map((order) => {
                  const orderWithTracking = order as AdminOrder & { trackingNumber?: string };
                  const addressObj = order.address as AddressSnapshot;
                  const customerName = `${order.user.firstName} ${order.user.lastName || ''}`.trim();
                  const phone = addressObj?.phone || order.user.phone || 'N/A';
                  const isExpanded = expandedOrderId === order.id;

                  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-neutral-900/50 transition">
                        
                        {/* Expandable Toggle Button */}
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => toggleOrderDetails(order.id)}
                            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded-md text-xs font-mono font-bold transition"
                            title="Toggle order contents"
                          >
                            {isExpanded ? '▼ Hide' : '▶ Pack'}
                          </button>
                        </td>

                        {/* Order Code */}
                        <td className="py-4 px-4 font-mono font-bold text-amber-400">
                          {order.orderCode}
                          <span className="block text-[10px] text-neutral-500 font-normal">
                            {order.items.length} item(s)
                          </span>
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

                        {/* Total Price */}
                        <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                          ${Number(order.totalAmount).toFixed(2)}
                        </td>

                        {/* Tracking Number Column */}
                        <td className="py-4 px-4 font-mono">
                          {orderWithTracking.trackingNumber ? (
                            <span className="px-2 py-1 bg-neutral-900 border border-neutral-700 rounded text-amber-300 font-semibold text-[11px]">
                              {orderWithTracking.trackingNumber}
                            </span>
                          ) : (
                            <span className="text-neutral-600 italic text-[11px]">Unassigned</span>
                          )}
                        </td>

                        {/* Order Date */}
                        <td className="py-4 px-4 whitespace-nowrap text-neutral-400">
                          {formattedDate}
                        </td>

                        {/* Status Shift Selector */}
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

                        {/* 3D Inspector Actions */}
                        <td className="py-4 px-4 text-center">
                          {order.items.some((i) => i.placements && i.placements.length > 0) ? (
                            <div className="flex flex-col gap-1 items-center">
                              {order.items.map((item) =>
                                item.placements && item.placements.length > 0 ? (
                                  <button
                                    key={item.id}
                                    onClick={() => open3DInspector(item, item.color || '#ffffff')}
                                    className="px-2 py-0.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 rounded text-[10px] font-semibold transition whitespace-nowrap"
                                  >
                                    Inspect Item #{item.id} ↗
                                  </button>
                                ) : null
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-600 text-[10px]">Standard Only</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Order Fulfillment Breakdown */}
                      {isExpanded && (
                        <tr className="bg-neutral-900/40 border-b border-neutral-800">
                          <td colSpan={10} className="p-4 md:p-6">
                            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 space-y-4">
                              
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-800 pb-3 gap-3">
                                <h3 className="text-sm font-semibold text-amber-400 tracking-wide uppercase">
                                  Fulfillment & Packing Manifest — {order.orderCode}
                                </h3>
                                
                                {/* Tracking Number Input Controls */}
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <label className="text-xs text-neutral-400 font-mono">Tracking #:</label>
                                  <input
                                    type="text"
                                    value={trackingInputs[order.id] || ''}
                                    onChange={(e) =>
                                      setTrackingInputs({ ...trackingInputs, [order.id]: e.target.value })
                                    }
                                    placeholder="Enter tracking code"
                                    className="bg-neutral-950 border border-neutral-700 text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-amber-400 font-mono"
                                  />
                                  <button
                                    onClick={() => handleTrackingUpdate(order.id)}
                                    disabled={updatingId === order.id}
                                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold rounded-lg transition disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>

                              {/* Item List Table */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-neutral-300">
                                  <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono border-b border-neutral-800">
                                    <tr>
                                      <th className="py-2.5 px-3">Item ID</th>
                                      <th className="py-2.5 px-3">Product Name</th>
                                      <th className="py-2.5 px-3">Size</th>
                                      <th className="py-2.5 px-3">Color</th>
                                      <th className="py-2.5 px-3">Qty</th>
                                      <th className="py-2.5 px-3">Unit Price</th>
                                      <th className="py-2.5 px-3">Placements / Specs</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-neutral-800 font-mono">
                                    {order.items.map((item) => (
                                      <tr key={item.id} className="hover:bg-neutral-900">
                                        <td className="py-3 px-3 text-neutral-500">#{item.id}</td>
                                        <td className="py-3 px-3 font-sans font-medium text-white">
                                          {item.product?.name || `Product #${item.pid}`}
                                        </td>
                                        <td className="py-3 px-3 font-bold text-amber-300">{item.size}</td>
                                        <td className="py-3 px-3">
                                          {item.color ? (
                                            <div className="flex items-center gap-1.5">
                                              <span
                                                className="w-3.5 h-3.5 rounded-full border border-neutral-600 inline-block"
                                                style={{ backgroundColor: item.color }}
                                              />
                                              <span className="text-neutral-300 text-[11px]">{item.color}</span>
                                            </div>
                                          ) : (
                                            <span className="text-neutral-500">N/A</span>
                                          )}
                                        </td>
                                        <td className="py-3 px-3 font-bold text-white">{item.quantity}</td>
                                        <td className="py-3 px-3 text-neutral-300">${Number(item.unitPrice).toFixed(2)}</td>
                                        <td className="py-3 px-3">
                                          {item.placements && item.placements.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                              {item.placements.map((p, idx) => (
                                                <span
                                                  key={idx}
                                                  className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded text-[10px]"
                                                >
                                                  {p.place}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-neutral-500 text-[11px] font-sans">Standard Print</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Customer Shipping Snapshot */}
                              <div className="mt-3 pt-3 border-t border-neutral-800 text-xs text-neutral-400 flex flex-col md:flex-row justify-between gap-2">
                                <div>
                                  <span className="font-semibold text-neutral-200">Full Shipping Address: </span>
                                  {renderAddress(addressObj)}
                                </div>
                                {order.coupon && (
                                  <div>
                                    <span className="font-semibold text-neutral-200">Applied Coupon: </span>
                                    <span className="text-amber-400 font-mono">{order.coupon}</span>
                                  </div>
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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