'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Address, UserProfile, OrderItemPayload } from '@/types/checkout';
import { getItemPrice, formatCartItemsForBackend } from '@/utils/checkoutHelper';
import { AuthStep } from '@/components/checkout/AuthStep';
import { AddressStep } from '@/components/checkout/AddressStep';
import { PaymentStep } from '@/components/checkout/PaymentStep';
import { OrderSummary } from '@/components/checkout/OrderSummary';

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
    label: 'Home',
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

  // Totals
  const subtotal = cartItems.reduce((acc, item) => {
    const qty = Number(item.quantity) || 1;
    return acc + getItemPrice(item) * qty;
  }, 0);

  const shipping = subtotal > 0 ? 50 : 0;
  const grandTotal = subtotal + shipping;

  // Load Session & Cart
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

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!newAddress.label.trim()) {
      alert('Please enter an address label (e.g. Home, Work)');
      return;
    }

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
          label: 'Home',
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

  const handlePlaceOrder = async () => {
    const token = localStorage.getItem('token');
    if (!token || !selectedAddressId) return;

    setSubmittingOrder(true);
    try {
      const formattedItems = formatCartItemsForBackend(cartItems);

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
        localStorage.removeItem('cart');
        localStorage.removeItem('cart_items');
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
        <div className="lg:col-span-2 space-y-6">
          <AuthStep
            isActive={step === 'auth'}
            user={user}
            email={authEmail}
            setEmail={setAuthEmail}
            password={authPassword}
            setPassword={setAuthPassword}
            loading={loading}
            onLoginSubmit={handleAuthSubmit}
            onSwitchAccount={() => setStep('auth')}
          />

          <AddressStep
            isActive={step === 'address'}
            isPaymentActive={step === 'payment'}
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            setSelectedAddressId={setSelectedAddressId}
            showNewAddressForm={showNewAddressForm}
            setShowNewAddressForm={setShowNewAddressForm}
            newAddress={newAddress}
            setNewAddress={setNewAddress}
            onSaveAddress={handleSaveAddress}
            onProceedToPayment={() => setStep('payment')}
            onChangeStep={() => setStep('address')}
          />

          <PaymentStep
            isActive={step === 'payment'}
            grandTotal={grandTotal}
            submittingOrder={submittingOrder}
            onPlaceOrder={handlePlaceOrder}
          />
        </div>

        <OrderSummary
          cartItems={cartItems}
          subtotal={subtotal}
          shipping={shipping}
          grandTotal={grandTotal}
        />
      </div>
    </div>
  );
}