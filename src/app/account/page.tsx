'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/context/Navbar';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.first_name}!</h1>
      </main>
    </div>
  );
}