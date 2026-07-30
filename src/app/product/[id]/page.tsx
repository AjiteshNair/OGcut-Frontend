import Link from 'next/link';
import { notFound } from 'next/navigation';
import AddToCartButton from '@/context/AddToCartButton';

type Props = {
  params: Promise<{ id: string }>;
};

// Interface matching your NestJS JSON response exactly
interface Product {
  id: string;
  name: string;
  base_price: number;
  category: string;
  tagline?: string;
  description?: string;
  design_type?: string;
  graphic_url?: string;
  mockup_url?: string;
  target_zone?: string;
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    // Falls back to port 3001 if env variable is not set
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    
    const res = await fetch(`${baseUrl}/products/${id}`, {
      cache: 'no-store', // Ensures fresh DB data
    });

    if (!res.ok) {
      console.error(`[NestJS Fetch Error] Status: ${res.status}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('[NestJS Fetch Error] Could not connect:', error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // Fallback chain for image display
  const displayImage = product.mockup_url || product.graphic_url;

  return (
    <main className="min-h-screen bg-[#f3efe7] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-8 inline-block text-xs font-semibold uppercase tracking-[0.3em] text-neutral-600 hover:text-black transition-colors"
        >
          ← Back to Shop
        </Link>

        <div className="grid gap-8 rounded-[2rem] border border-black/10 bg-[#fcfaf6] p-6 shadow-xl md:grid-cols-2 md:p-10">
          
          {/* Product Image Section */}
          <div className="overflow-hidden rounded-[1.5rem] bg-slate-100 border border-black/10 flex items-center justify-center min-h-[350px]">
            {displayImage ? (
              <img
                src={displayImage}
                alt={product.name}
                className="h-full w-full object-cover rounded-[1.5rem]"
              />
            ) : (
              <div className="text-neutral-400 text-sm">No Image Available</div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              
              {/* Category & Design Badges */}
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-[0.3em] font-semibold text-neutral-500">
                  {product.category || 'Graphic Tees'}
                </span>
                {product.design_type && (
                  <span className="rounded-full bg-neutral-200/60 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-700">
                    {product.design_type.replace('_', ' ')}
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <h1 className="text-3xl font-black uppercase tracking-[0.1em] text-neutral-900 leading-tight">
                {product.name}
              </h1>
              
              <p className="text-2xl font-bold text-[#b88b58]">
                ${Number(product.base_price).toFixed(2)}
              </p>

              {/* Tagline / Description */}
              {(product.tagline || product.description) && (
                <p className="text-sm leading-relaxed text-neutral-600">
                  {product.tagline || product.description}
                </p>
              )}

              {/* Target Zone Info */}
              {product.target_zone && (
                <div className="pt-2 border-t border-black/10 text-xs text-neutral-500 uppercase tracking-widest">
                  Print Location: <span className="font-semibold text-neutral-800">{product.target_zone}</span>
                </div>
              )}
            </div>

            {/* Context Add to Cart Button */}
            <div className="pt-4">
              <AddToCartButton product={product} />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}