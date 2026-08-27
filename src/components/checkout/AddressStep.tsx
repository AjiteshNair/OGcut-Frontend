'use client';

import React from 'react';
import { Address } from '@/types/checkout';

interface AddressStepProps {
  isActive: boolean;
  isPaymentActive: boolean;
  addresses: Address[];
  selectedAddressId: string;
  setSelectedAddressId: (id: string) => void;
  showNewAddressForm: boolean;
  setShowNewAddressForm: (show: boolean) => void;
  newAddress: Omit<Address, 'id'>;
  setNewAddress: React.Dispatch<React.SetStateAction<Omit<Address, 'id'>>>;
  onSaveAddress: (e: React.FormEvent) => void;
  onProceedToPayment: () => void;
  onChangeStep: () => void;
}

export const AddressStep: React.FC<AddressStepProps> = ({
  isActive,
  isPaymentActive,
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  showNewAddressForm,
  setShowNewAddressForm,
  newAddress,
  setNewAddress,
  onSaveAddress,
  onProceedToPayment,
  onChangeStep,
}) => {
  return (
    <div
      className={`p-6 rounded-xl border ${
        isActive ? 'border-amber-500 bg-neutral-900' : 'border-neutral-800 bg-neutral-900/50'
      }`}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center text-sm font-bold">
            2
          </span>
          Shipping Address
        </h2>
        {isPaymentActive && (
          <button onClick={onChangeStep} className="text-xs text-amber-500 underline">
            Change
          </button>
        )}
      </div>

      {isActive && (
        <div className="mt-4 space-y-4">
          {!showNewAddressForm && addresses.length > 0 && (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`block p-4 rounded-lg border cursor-pointer transition ${
                    selectedAddressId === addr.id
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-neutral-800 bg-neutral-800/40'
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-neutral-800 text-amber-500 border border-neutral-700">
                          {addr.label}
                        </span>
                        <p className="font-semibold text-sm">
                          {addr.fullName} ({addr.phone})
                        </p>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
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
            <form onSubmit={onSaveAddress} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">
                  Address Label <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home, Office, Studio"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
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
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 text-black text-sm font-semibold rounded-lg"
                >
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
              onClick={onProceedToPayment}
              className="w-full mt-4 py-3 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition"
            >
              Proceed to Payment
            </button>
          )}
        </div>
      )}
    </div>
  );
};