'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Plus, Minus, Loader2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  desc: string;
  price: number;
  type: string;
  isActive: boolean;
  primaryImage: string | null;
  images: string[];
}

export default function ProductDetailPage() {
  const routeParams = useParams();
  const productId = routeParams?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/products/${productId}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const data = await response.json();
        setProduct(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">{error || "The requested item couldn't be located."}</p>
        <Link
          href="/"
          className="bg-black text-white text-xs font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const currentImageUrl = 
    product.images && product.images.length > 0 
      ? product.images[activeImageIndex] || product.primaryImage 
      : 'https://via.placeholder.com/600';

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>

        {/* Product Container */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 shadow-sm">
          {/* Product Image Gallery Section */}
          <div className="space-y-4">
            {/* Main Active Image */}
            <div className="relative bg-gray-100 rounded-2xl overflow-hidden h-96 md:h-[400px]">
              <img
                src={currentImageUrl || 'https://via.placeholder.com/600'}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/png?text=Image+Not+Found';
                }}
              />
              {product.type && (
                <span className="absolute top-4 left-4 bg-black/80 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.type}
                </span>
              )}
            </div>

            {/* Thumbnail Row */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      activeImageIndex === index ? 'border-black ring-2 ring-black/20' : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
                {product.name}
              </h1>
              <p className="text-2xl font-black text-black mt-2">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </p>
              {product.desc && (
                <p className="text-gray-600 text-sm mt-4 leading-relaxed">
                  {product.desc}
                </p>
              )}
            </div>

            {/* Size Selector */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-3">
                Select Size
              </label>
              <div className="flex gap-2">
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 rounded-xl border text-sm font-bold transition-all ${
                      selectedSize === size
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector & Add to Cart */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-gray-100 border border-gray-200 rounded-xl p-1">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-black hover:bg-gray-200 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-black text-black min-w-[30px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-black text-white hover:bg-gray-800 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  className="flex-1 bg-black text-white text-sm font-bold py-3.5 px-6 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-md active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Bag (₹{(product.price * quantity).toLocaleString('en-IN')})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}