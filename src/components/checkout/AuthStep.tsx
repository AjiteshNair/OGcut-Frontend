'use client';

import React from 'react';
import { UserProfile } from '@/types/checkout';

interface AuthStepProps {
  isActive: boolean;
  user: UserProfile | null;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  onLoginSubmit: (e: React.FormEvent) => void;
  onSwitchAccount: () => void;
}

export const AuthStep: React.FC<AuthStepProps> = ({
  isActive,
  user,
  email,
  setEmail,
  password,
  setPassword,
  loading,
  onLoginSubmit,
  onSwitchAccount,
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
            1
          </span>
          Account Authentication
        </h2>
        {!isActive && (
          <button onClick={onSwitchAccount} className="text-xs text-amber-500 underline">
            Switch Account
          </button>
        )}
      </div>

      {isActive && (
        <form onSubmit={onLoginSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

      {user && !isActive && <p className="mt-2 text-sm text-neutral-400">Logged in as: {user.email}</p>}
    </div>
  );
};