'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, LogOut } from 'lucide-react';

interface User {
  id?: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface NavbarProps {
  user?: User | null;
  cartCount?: number;
}

export default function Navbar({ user: propUser = null, cartCount = 0 }: NavbarProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(propUser);

  // Sync prop changes or read from localStorage on mount
  useEffect(() => {
    if (propUser) {
      setCurrentUser(propUser);
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Failed to parse user from localStorage', e);
        }
      }
    }
  }, [propUser]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    window.location.href = '/auth';
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-black tracking-wider uppercase text-black">
        OGcut
      </Link>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-700 hover:text-black">
          <ShoppingBag className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>

        {currentUser ? (
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="flex items-center gap-2 border border-gray-200 rounded-full py-1.5 px-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold uppercase">
                {currentUser.first_name?.[0] || 'U'}{currentUser.last_name?.[0] || ''}
              </div>
              <span className="text-sm font-semibold text-gray-900 pr-1">
                {currentUser.first_name}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-gray-500 hover:text-black transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Link
            href="/auth"
            className="bg-black text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}