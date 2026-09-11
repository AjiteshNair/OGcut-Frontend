'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import OrderDetailView, { OrderDetail } from '@/components/OrderDetailView';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Address {
  id: number;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tabs & State
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses'>('orders');
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullName: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  // Auth Check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/auth');
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error(e);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch Orders or Addresses based on active tab
  useEffect(() => {
    if (!loading && user) {
      if (activeTab === 'orders') fetchOrders();
      if (activeTab === 'addresses') fetchAddresses();
    }
  }, [activeTab, loading]);

  const fetchOrders = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error(`Orders request failed with status: ${res.status}`);
        return;
      }

      const result = await res.json();
      if (result.success) {
        setOrders(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSelectOrder = async (orderCode: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/orders/${orderCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error(`Order detail request failed with status: ${res.status}`);
        return;
      }

      const result = await res.json();
      if (result.success) {
        setSelectedOrder(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    }
  };

  const fetchAddresses = async () => {
    setLoadingData(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error(`Addresses request failed with status: ${res.status}`);
        return;
      }

      const result = await res.json();
      setAddresses(Array.isArray(result) ? result : result.data || []);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      if (res.ok) {
        setShowAddressForm(false);
        setAddressForm({
          label: 'Home',
          fullName: '',
          line1: '',
          line2: '',
          city: '',
          state: '',
          pincode: '',
          phone: '',
        });
        fetchAddresses();
      }
    } catch (err) {
      console.error('Failed to create address:', err);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAddresses();
      }
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Welcome, {user?.firstName || user?.first_name || 'Customer'}!
          </h1>
          <p className="text-sm text-zinc-500">{user?.email}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 mb-6">
          <button
            onClick={() => {
              setActiveTab('orders');
              setSelectedOrder(null);
            }}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-black text-black'
                : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            Order History
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'addresses'
                ? 'border-black text-black'
                : 'border-transparent text-zinc-500 hover:text-black'
            }`}
          >
            Saved Addresses
          </button>
        </div>

        {/* TAB 1: ORDER HISTORY */}
        {activeTab === 'orders' && (
          <div>
            {selectedOrder ? (
              /* Modularized Order Detail Component */
              <OrderDetailView
                order={selectedOrder}
                onBack={() => setSelectedOrder(null)}
              />
            ) : (
              /* Single-Column Full Width Order Tiles */
              <div className="space-y-3">
                {loadingData ? (
                  <p className="text-xs text-zinc-500">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-zinc-500">No orders placed yet.</p>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => handleSelectOrder(order.orderCode)}
                      className="w-full border border-zinc-200 rounded-lg p-4 bg-white hover:border-black transition-all cursor-pointer shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm">#{order.orderCode}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700 uppercase">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">
                          Placed on {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
                        <span className="font-bold text-base">₹{order.totalAmount}</span>
                        <span className="text-xs font-semibold text-black underline">View details →</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAVED ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold">Your Saved Addresses</h2>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-zinc-800"
              >
                {showAddressForm ? 'Cancel' : '+ Add New Address'}
              </button>
            </div>

            {/* Create Address Form */}
            {showAddressForm && (
              <form onSubmit={handleCreateAddress} className="bg-white border border-zinc-200 rounded-lg p-5 space-y-4 shadow-sm">
                <h3 className="font-semibold text-sm">Add Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Label (e.g. Home, Work)"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    required
                    className="p-2 border rounded border-zinc-300"
                  />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    required
                    className="p-2 border rounded border-zinc-300"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={addressForm.line1}
                    onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                    required
                    className="p-2 border rounded border-zinc-300 sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2 (Optional)"
                    value={addressForm.line2}
                    onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                    className="p-2 border rounded border-zinc-300 sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    required
                    className="p-2 border rounded border-zinc-300"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    required
                    className="p-2 border rounded border-zinc-300"
                  />
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    required
                    className="p-2 border rounded border-zinc-300"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    required
                    className="p-2 border rounded border-zinc-300"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white text-xs font-medium rounded hover:bg-zinc-800"
                >
                  Save Address
                </button>
              </form>
            )}

            {/* Single-Column Full Width Address Tiles */}
            <div className="space-y-3">
              {loadingData ? (
                <p className="text-xs text-zinc-500">Loading addresses...</p>
              ) : addresses.length === 0 ? (
                <p className="text-sm text-zinc-500">No saved addresses found.</p>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="w-full border border-zinc-200 rounded-lg p-4 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 rounded">
                          {addr.label}
                        </span>
                        <span className="font-semibold text-sm">{addr.fullName}</span>
                      </div>
                      <p className="text-xs text-zinc-600">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs text-zinc-500">Phone: {addr.phone}</p>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}