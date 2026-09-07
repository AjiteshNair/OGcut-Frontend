'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingBag, LogOut, Shirt, Menu, X } from 'lucide-react';

interface User {
  id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
}

interface NavbarProps {
  cartCount?: number;
}

export default function Navbar({ cartCount: propCartCount }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const checkUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  const updateCartCount = () => {
    if (typeof propCartCount === 'number') {
      setCartCount(propCartCount);
      return;
    }

    try {
      const rawCart = localStorage.getItem('cart_items');
      if (rawCart) {
        const parsedCart = JSON.parse(rawCart);
        if (Array.isArray(parsedCart)) {
          const totalQty = parsedCart.reduce((sum: number, item: any) => {
            return sum + (Number(item.quantity) || 1);
          }, 0);
          setCartCount(totalQty);
          return;
        }
      }
      setCartCount(0);
    } catch (e) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    if (typeof propCartCount === 'number') {
      setCartCount(propCartCount);
    }
  }, [propCartCount]);

  useEffect(() => {
    checkUser();
    updateCartCount();

    window.addEventListener('storage', checkUser);
    window.addEventListener('user-logged-in', checkUser);
    window.addEventListener('auth-change', checkUser);
    window.addEventListener('cart-updated', updateCartCount);

    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('user-logged-in', checkUser);
      window.removeEventListener('auth-change', checkUser);
      window.removeEventListener('cart-updated', updateCartCount);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  const firstName = user?.first_name || user?.firstName || '';
  const lastName = user?.last_name || user?.lastName || '';
  const initials =
    `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U';
  const displayName = firstName || user?.email?.split('@')[0] || 'Account';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md text-white border-b border-gray-800 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="font-black tracking-widest text-lg uppercase hover:text-amber-500 transition-colors"
        >
          OGcut
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <Link
            href="/edit"
            className={`flex items-center gap-1.5 hover:text-white transition-colors ${
              pathname === '/edit' ? 'text-amber-500' : ''
            }`}
          >
            <Shirt className="w-4 h-4" />
            3D Builder
          </Link>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/cart"
            className="relative p-2 text-gray-300 hover:text-white transition-colors flex items-center justify-center"
            title="Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-black text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/account"
                  className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-full px-2.5 py-1 hover:border-amber-500/50 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-black font-bold text-xs flex items-center justify-center">
                    {initials}
                  </div>
                  <span className="text-xs font-semibold pr-1 max-w-[120px] truncate">
                    {displayName}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="bg-amber-500 text-black hover:bg-amber-400 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              >
                Sign In
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 border-b border-neutral-800 px-6 py-5 space-y-4">
          <div className="flex flex-col gap-3 text-sm font-semibold uppercase tracking-wider text-neutral-300">
            <Link
              href="/edit"
              className={`flex items-center gap-2 py-2 border-b border-neutral-800/50 ${
                pathname === '/edit' ? 'text-amber-500' : ''
              }`}
            >
              <Shirt className="w-4 h-4" />
              3D Builder
            </Link>
            <Link
              href="/cart"
              className={`flex items-center justify-between py-2 border-b border-neutral-800/50 ${
                pathname === '/cart' ? 'text-amber-500' : ''
              }`}
            >
              <span>Shopping Cart</span>
              {cartCount > 0 && (
                <span className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {cartCount} items
                </span>
              )}
            </Link>
          </div>

          <div className="pt-2">
            {user ? (
              <div className="flex items-center justify-between bg-neutral-900 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-black font-bold text-xs flex items-center justify-center">
                    {initials}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{displayName}</p>
                    <p className="text-[10px] text-neutral-400 truncate max-w-[150px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs text-red-400 font-semibold px-2 py-1 rounded hover:bg-neutral-800"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="block w-full text-center bg-amber-500 text-black py-2.5 rounded-xl text-xs font-bold"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}