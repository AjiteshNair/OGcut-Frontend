import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function GET() {
  const response = await fetch(`${BACKEND_API_URL}/categories`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Unable to fetch categories from backend' }, { status: 502 });
  }

  const categories = await response.json();
  return NextResponse.json(categories);
}
