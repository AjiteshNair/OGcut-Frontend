'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface OrderItemPayload {
  productId?: string;
  designId?: string;
  type?: 'custom' | 'standard';
  title?: string;
  name?: string;
  thumbnailUrl?: string;
  image?: string;
  customShirtOrder?: {
    fabricColor: string;
    placements: Array<{
      zone: string;
      imageUrl: string;
      x: number;
      y: number;
      scale: number;
      width: number;
      height: number;
      centerX: number;
      centerY: number;
      clipWidth: number;
      clipHeight: number;
    }>;
  };
  quantity: number;
  size?: string;
  unitPrice?: number;
  price?: number;
  fabricColor?: string;
  placements?: any[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // State
  const [step, setStep] = useState<'auth' | 'address' | 'payment'>('auth');
  const [cartItems, setCartItems] = useState<OrderItemPayload[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<Address, 'id'>>({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  const [loading, setLoading] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Helper to safely extract price regardless of key name
  const getItemPrice = (item: OrderItemPayload): number => {
    const val = item.unitPrice ?? item.price ?? 0;
    return Number(val) || 0;
  };

  // Calculate Order Total safely
  const subtotal = cartItems.reduce((acc, item) => {
    const qty = Number(item.quantity) || 1;
    return acc + getItemPrice(item) * qty;
  }, 0);

  const shipping = subtotal > 0 ? 50 : 0;
  const grandTotal = subtotal + shipping;

  // Load Cart & User Session (Handles both 'cart' and 'cart_items')
  useEffect(() => {
    const rawCartItems = localStorage.getItem('cart_items');
    
    let parsedCart: OrderItemPayload[] = [];

    if (rawCartItems) {
      try {
        parsedCart = JSON.parse(rawCartItems);
      } catch (e) {
        console.error('Failed to parse cart_items', e);
      }
    }
    setCartItems(parsedCart);

    const token = localStorage.getItem('token');
    if (token) {
      fetchUserAndAddresses(token);
    }
  }, []);

  const fetchUserAndAddresses = async (token: string) => {
    setLoading(true);
    try {
      const addrRes = await fetch(`${API_BASE_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (addrRes.ok) {
        const fetchedAddresses: Address[] = await addrRes.json();
        setAddresses(fetchedAddresses);
        if (fetchedAddresses.length > 0) {
          const defaultAddr = fetchedAddresses.find((a) => a.isDefault) || fetchedAddresses[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setShowNewAddressForm(true);
        }
      }

      setStep('address');
    } catch (e) {
      console.error('Failed to load user or addresses', e);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Login API Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        await fetchUserAndAddresses(data.access_token);
      } else {
        alert('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Save New Address via Backend API
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddress),
      });

      if (res.ok) {
        const createdAddress: Address = await res.json();
        setAddresses((prev) => [createdAddress, ...prev]);
        setSelectedAddressId(createdAddress.id);
        setShowNewAddressForm(false);
        setNewAddress({
          fullName: '',
          phone: '',
          line1: '',
          line2: '',
          city: '',
          state: '',
          pincode: '',
          isDefault: false,
        });
      } else {
        alert('Failed to save address');
      }
    } catch (error) {
      console.error('Save address error:', error);
    }
  };

  // Handler: Place Order via Backend API
  const handlePlaceOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token || !selectedAddressId) return;

    setSubmittingOrder(true);
    try {
      const formattedItems = cartItems.map((item: any) => {
      const isCustom = item.type === 'custom' || Boolean(item.customShirtOrder) || Boolean(item.placements && item.placements.length > 0);
      const rawPlacements = item.customShirtOrder?.placements || item.placements || [];

      const formattedPlacements = rawPlacements.map((p: any) => ({
        zone: p.zone || 'front',
        imageUrl: p.imageUrl || p.image,
        x: Number(p.coordinates?.x ?? p.x ?? 0),
        y: Number(p.coordinates?.y ?? p.y ?? 0),
        scale: Number(p.coordinates?.scale ?? p.scale ?? 1),
        width: Number(p.coordinates?.width ?? p.width ?? 400),
        height: Number(p.coordinates?.height ?? p.height ?? 400),
        centerX: Number(p.printZoneBounds?.centerX ?? p.centerX ?? 1024),
        centerY: Number(p.printZoneBounds?.centerY ?? p.centerY ?? 1024),
        clipWidth: Number(p.printZoneBounds?.clipWidth ?? p.clipWidth ?? 800),
        clipHeight: Number(p.printZoneBounds?.clipHeight ?? p.clipHeight ?? 1000),
      }));

      const itemTitle = isCustom
        ? 'Custom T-Shirt'
        : item.title || item.name || 'Catalog Item';

      return {
        productId: item.productId ?? item.id ?? null,
        designId: item.designId ?? null,
        type: isCustom ? 'custom' : 'standard',
        title: itemTitle,
        name: itemTitle,
        customShirtOrder: isCustom
          ? {
              fabricColor: item.customShirtOrder?.fabricColor || item.fabricColor || '#ffffff',
              placements: formattedPlacements,
            }
          : null,
        quantity: Number(item.quantity) || 1,
        size: item.size ?? 'M',
        unitPrice: getItemPrice(item),
      };
    });

    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        addressId: selectedAddressId,
        items: formattedItems,
      }),
    });

      if (res.ok) {
        const order = await res.json();
        // Clear both keys from storage
        localStorage.removeItem('cart');
        localStorage.removeItem('cart_items');
        // Redirect with ?id= to align with the order success page route reader
        router.push(`/order-success?id=${order.id}`);
      } else {
        const err = await res.json();
        alert(`Order placement failed: ${err.message || 'Error occurred'}`);
      }
    } catch (error) {
      console.error('Place order error:', error);
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Steps */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: AUTHENTICATION */}
          <div className={`p-6 rounded-xl border ${step === 'auth' ? 'border-amber-500 bg-neutral-900' : 'border-neutral-800 bg-neutral-900/50'}`}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center text-sm font-bold">1</span>
                Account Authentication
              </h2>
              {step !== 'auth' && (
                <button onClick={() => setStep('auth')} className="text-xs text-amber-500 underline">Switch Account</button>
              )}
            </div>

            {step === 'auth' && (
              <form onSubmit={handleAuthSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Enter password"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Login & Continue'}
                </button>
              </form>
            )}

            {user && step !== 'auth' && (
              <p className="mt-2 text-sm text-neutral-400">Logged in as: {user.email}</p>
            )}
          </div>

          {/* STEP 2: SHIPPING ADDRESS */}
          <div className={`p-6 rounded-xl border ${step === 'address' ? 'border-amber-500 bg-neutral-900' : 'border-neutral-800 bg-neutral-900/50'}`}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center text-sm font-bold">2</span>
                Shipping Address
              </h2>
              {step === 'payment' && (
                <button onClick={() => setStep('address')} className="text-xs text-amber-500 underline">Change</button>
              )}
            </div>

            {step === 'address' && (
              <div className="mt-4 space-y-4">
                {!showNewAddressForm && addresses.length > 0 && (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`block p-4 rounded-lg border cursor-pointer transition ${
                          selectedAddressId === addr.id ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-800 bg-neutral-800/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="address"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 accent-amber-500"
                          />
                          <div>
                            <p className="font-semibold text-sm">{addr.fullName} ({addr.phone})</p>
                            <p className="text-xs text-neutral-400">
                              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                    <button
                      onClick={() => setShowNewAddressForm(true)}
                      className="text-xs text-amber-500 font-semibold hover:underline"
                    >
                      + Add New Address
                    </button>
                  </div>
                )}

                {showNewAddressForm && (
                  <form onSubmit={handleSaveAddress} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={newAddress.fullName}
                          onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">Phone</label>
                        <input
                          type="text"
                          required
                          value={newAddress.phone}
                          onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Address Line 1</label>
                      <input
                        type="text"
                        required
                        value={newAddress.line1}
                        onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        value={newAddress.line2 || ''}
                        onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">State</label>
                        <input
                          type="text"
                          required
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">Pincode</label>
                        <input
                          type="text"
                          required
                          value={newAddress.pincode}
                          onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-black text-sm font-semibold rounded-lg">
                        Save Address
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(false)}
                          className="px-4 py-2.5 bg-neutral-800 text-neutral-400 text-sm rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {!showNewAddressForm && selectedAddressId && (
                  <button
                    onClick={() => setStep('payment')}
                    className="w-full mt-4 py-3 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition"
                  >
                    Proceed to Payment
                  </button>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: PAYMENT */}
          <div className={`p-6 rounded-xl border ${step === 'payment' ? 'border-amber-500 bg-neutral-900' : 'border-neutral-800 bg-neutral-900/50'}`}>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center text-sm font-bold">3</span>
              Payment Method
            </h2>

            {step === 'payment' && (
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 text-sm">
                  ⚡ <strong>Mock Payment Mode:</strong> Order will be recorded instantly on your database.
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={submittingOrder}
                  className="w-full py-4 bg-amber-500 text-black font-bold text-lg rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                >
                  {submittingOrder ? 'Processing Order...' : `Pay ₹${grandTotal} & Place Order`}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Order Summary */}
        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 h-fit space-y-4">
          <h3 className="font-bold text-lg pb-3 border-b border-neutral-800">Order Summary</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {cartItems.map((item, idx) => {
              const price = getItemPrice(item);
              const qty = Number(item.quantity) || 1;
              const isCustom = item.type === 'custom' || Boolean(item.customShirtOrder) || Boolean(item.placements?.length);
              const displayTitle = isCustom
                ? 'Custom T-Shirt'
                : item.title || item.name || 'Catalog Item';

              return (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-white">{displayTitle} ({item.size || 'M'})</p>
                    <p className="text-xs text-neutral-500">
                      Qty: {qty} {isCustom ? `| Color: ${item.fabricColor || 'Standard'}` : ''}
                    </p>
                  </div>
                  <p className="font-semibold text-neutral-300">₹{price * qty}</p>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-neutral-800 space-y-2 text-sm">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Shipping</span>
              <span>₹{shipping}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-neutral-800">
              <span>Total Amount</span>
              <span className="text-amber-500">₹{grandTotal}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}