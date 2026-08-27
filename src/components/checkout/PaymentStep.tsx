'use client';

import React from 'react';

interface PaymentStepProps {
  isActive: boolean;
  grandTotal: number;
  submittingOrder: boolean;
  onPlaceOrder: () => void;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  isActive,
  grandTotal,
  submittingOrder,
  onPlaceOrder,
}) => {
  return (
    <div
      className={`p-6 rounded-xl border ${
        isActive ? 'border-amber-500 bg-neutral-900' : 'border-neutral-800 bg-neutral-900/50'
      }`}
    >
      <h2 className="text-xl font-bold flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center text-sm font-bold">
          3
        </span>
        Payment Method
      </h2>

      {isActive && (
        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 text-sm">
            ⚡ <strong>Mock Payment Mode:</strong> Order will be recorded instantly on your database.
          </div>
          <button
            onClick={onPlaceOrder}
            disabled={submittingOrder}
            className="w-full py-4 bg-amber-500 text-black font-bold text-lg rounded-xl hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
          >
            {submittingOrder ? 'Processing Order...' : `Pay ₹${grandTotal} & Place Order`}
          </button>
        </div>
      )}
    </div>
  );
};