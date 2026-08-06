'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, CheckCircle, Phone } from 'lucide-react';

interface Address {
  id: string;
  label: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Address Form State
  const [label, setLabel] = useState('Home');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !storedUser) {
      router.push('/auth?redirect=/checkout');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchAddresses(parsedUser.id);
  }, [router]);

  const fetchAddresses = async (userId: string) => {
    try {
      const res = await fetch('http://localhost:3001/addresses', {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        if (data.length > 0) {
          setSelectedAddressId(data[0].id);
        } else {
          setShowAddForm(true);
        }
      }
    } catch (e) {
      console.error('Failed to fetch addresses', e);
    }
  };

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPincode(val);

    if (val.length === 6) {
      setLoadingPincode(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
        const data = await res.json();
        if (data[0]?.Status === 'Success') {
          const details = data[0].PostOffice[0];
          setCity(details.District);
          setState(details.State);
        }
      } catch (err) {
        console.error('Failed to fetch pincode details', err);
      } finally {
        setLoadingPincode(false);
      }
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);

    try {
      const res = await fetch('http://localhost:3001/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          label,
          phone,
          line1,
          line2,
          pincode,
          city,
          state,
        }),
      });

      if (res.ok) {
        const newAddress = await res.json();
        setAddresses([newAddress, ...addresses]);
        setSelectedAddressId(newAddress.id);
        setShowAddForm(false);
        // Reset inputs
        setLine1('');
        setLine2('');
        setPincode('');
        setPhone('');
      }
    } catch (err) {
      console.error('Failed to save address', err);
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black uppercase tracking-wider mb-6">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Section: Addresses */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-black" /> Delivery Address
              </h2>
              {addresses.length > 0 && !showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-xs font-bold text-black flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add New Address
                </button>
              )}
            </div>

            {/* List Saved Addresses */}
            {!showAddForm && (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                      selectedAddressId === addr.id
                        ? 'border-black bg-gray-50 ring-1 ring-black'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {addr.label}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {addr.phone}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{addr.line1}</p>
                      {addr.line2 && <p className="text-xs text-gray-600">{addr.line2}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        {addr.city}, {addr.state} - <span className="font-bold text-gray-800">{addr.pincode}</span>
                      </p>
                    </div>
                    {selectedAddressId === addr.id && (
                      <CheckCircle className="w-5 h-5 text-black shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add New Address Form */}
            {showAddForm && (
              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="flex gap-2 mb-2">
                  {['Home', 'Work', 'Other'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setLabel(tag)}
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        label === tag
                          ? 'bg-black text-white border-black'
                          : 'bg-gray-50 text-gray-700 border-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Recipient Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">PIN Code (Autofills City & State)</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={pincode}
                    onChange={handlePincodeChange}
                    placeholder="e.g. 110001"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  {loadingPincode && <p className="text-xs text-gray-500 mt-1">Fetching region details...</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Flat / Building / House No.</label>
                  <input
                    type="text"
                    required
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Street / Area / Landmark (Optional)</label>
                  <input
                    type="text"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 border bg-gray-50 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 border bg-gray-50 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="flex-1 bg-black text-white py-2.5 rounded-lg text-xs font-bold uppercase"
                  >
                    {savingAddress ? 'Saving...' : 'Save & Select Address'}
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2.5 border rounded-lg text-xs font-bold text-gray-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 h-fit space-y-4">
          <h2 className="font-bold text-lg border-b pb-3">Order Summary</h2>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Customer</span>
            <span className="font-semibold text-black">{user?.first_name} {user?.last_name}</span>
          </div>
          <button
            disabled={!selectedAddressId}
            onClick={() => alert(`Proceeding to payment with Address ID: ${selectedAddressId}`)}
            className="w-full bg-black text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}