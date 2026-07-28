import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function GET() {
  const response = await fetch(`${BACKEND_API_URL}/products`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Unable to fetch products from backend' }, { status: 502 });
  }

  const products = await response.json();
  return NextResponse.json(products);
}
