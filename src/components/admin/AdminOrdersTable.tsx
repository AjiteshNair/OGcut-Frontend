'use client';

import React, { useEffect, useState } from 'react';
import { AdminOrderInspector } from './AdminOrderInspector';

type OrderStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'PROCESSING'
  | 'PRINTING'
  | 'FULFILLED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

interface OrderSummary {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  user?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    customShirtOrder?: object;
  }>;
}

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#92400e' },
  RECEIVED: { bg: '#e0f2fe', text: '#075985' },
  PROCESSING: { bg: '#e0e7ff', text: '#3730a3' },
  PRINTING: { bg: '#fce7f3', text: '#9d174d' },
  FULFILLED: { bg: '#dcfce7', text: '#166534' },
  SHIPPED: { bg: '#ccfbf1', text: '#115e59' },
  DELIVERED: { bg: '#d1fae5', text: '#065f46' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
};

export const AdminOrdersTable: React.FC = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrders = () => {
    setLoading(true);
    const token = localStorage.getItem('token');

    fetch('http://localhost:3001/api/orders/admin/all', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data: OrderSummary[]) => {
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Error fetching admin orders:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (selectedOrderId) {
    return (
      <div style={{ background: '#121212', minHeight: '100vh', padding: '16px' }}>
        <button
          onClick={() => {
            setSelectedOrderId(null);
            fetchOrders();
          }}
          style={{
            marginBottom: '16px',
            padding: '8px 16px',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ← Back to Orders List
        </button>
        <AdminOrderInspector orderId={selectedOrderId} />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '24px',
        background: '#121212',
        color: '#fff',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '24px' }}>Admin Orders Management</h1>
        <button
          onClick={fetchOrders}
          style={{
            padding: '8px 16px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#aaa', padding: '40px 0', textAlign: 'center' }}>
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div style={{ color: '#aaa', padding: '40px 0', textAlign: 'center' }}>
          No orders found.
        </div>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: '#1e1e1e',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr style={{ background: '#2a2a2a', textAlign: 'left', fontSize: '13px', color: '#aaa' }}>
              <th style={{ padding: '14px 16px' }}>ORDER ID</th>
              <th style={{ padding: '14px 16px' }}>CUSTOMER</th>
              <th style={{ padding: '14px 16px' }}>ITEMS</th>
              <th style={{ padding: '14px 16px' }}>TOTAL</th>
              <th style={{ padding: '14px 16px' }}>STATUS</th>
              <th style={{ padding: '14px 16px' }}>DATE</th>
              <th style={{ padding: '14px 16px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const customerName = order.user
                ? `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() || order.user.email
                : 'Guest Customer';

              const customItemsCount = order.items.filter((i) => i.customShirtOrder).length;
              const statusStyle = STATUS_COLORS[order.status] || { bg: '#333', text: '#fff' };

              return (
                <tr key={order.id} style={{ borderBottom: '1px solid #2a2a2a', fontSize: '14px' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace' }}>
                    {order.id.slice(0, 8)}...
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div>{customerName}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{order.user?.email || ''}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    {customItemsCount > 0 && (
                      <span
                        style={{
                          marginLeft: '6px',
                          padding: '2px 6px',
                          background: '#1e3a8a',
                          color: '#93c5fd',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      >
                        {customItemsCount} Custom 🎨
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 'bold' }}>
                    ${Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: statusStyle.bg,
                        color: statusStyle.text,
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#aaa', fontSize: '13px' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      Inspect 🔍
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};