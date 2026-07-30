'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useCart } from '../context/CartContext';
import AddToCartButton from '@/context/AddToCartButton';

type DesignType = 'graphic_only' | 'human_mockup' | 'hybrid';
type TargetZone = 'front' | 'back' | 'leftSleeve' | 'rightSleeve';

type Product = {
  id: string;
  name: string;
  slug?: string;
  base_price: number;
  default_color?: string;
  design_type: DesignType;
  graphic_url?: string | null;
  mockup_url?: string | null;
  target_zone?: TargetZone;
  category?: string;
  tagline?: string;
  description?: string;
};

type CategoryFilter = 'All' | string;

type Theme = {
  backgroundColor: string;
  surfaceColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  accentColor: string;
  borderColor: string;
  titleFontWeight: string;
  subtitleFontWeight: string;
  buttonFontWeight: string;
};

const theme: Theme = {
  backgroundColor: '#f3efe7',
  surfaceColor: '#fcfaf6',
  primaryTextColor: '#121212',
  secondaryTextColor: '#6c665e',
  accentColor: '#b88b58',
  borderColor: '#11111122',
  titleFontWeight: '800',
  subtitleFontWeight: '500',
  buttonFontWeight: '600',
} as const;

const sectionOrder = ['hero', 'categories', 'productGrid'] as const;

type HeroSectionAlignment = 'left' | 'center';

type HeroSectionConfig = {
  isActive: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  buttonText: string;
  secondaryButtonText: string;
  backgroundImage: string;
  titleAlign: HeroSectionAlignment;
  buttonAlign: HeroSectionAlignment;
  titleFontWeight: string;
  subtitleFontWeight: string;
  buttonFontWeight: string;
};

const heroSection: HeroSectionConfig = {
  isActive: true,
  eyebrow: 'DROP WINTER 2026',
  title: 'OGcut',
  subtitle: 'Quiet minimalism in motion, shaped for the city after dark.',
  buttonText: 'EXPLORE DROPS',
  secondaryButtonText: 'Design your own',
  backgroundImage:
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=80',
  titleAlign: 'left',
  buttonAlign: 'left',
  titleFontWeight: '800',
  subtitleFontWeight: '500',
  buttonFontWeight: '600',
};

const categoriesSection = {
  isActive: true,
  title: 'SHOP BY CATEGORY',
  items: ['T-Shirts', 'Hoodies', 'Outerwear', 'Accessories'],
};

const productGridSection = {
  isActive: true,
  title: 'NEW ARRIVALS',
  emptyState: 'No products match this filter.',
};

function HeroSection({
  theme,
  section,
}: {
  theme: Theme;
  section: typeof heroSection;
}) {
  const alignItems =
    section.titleAlign === 'center' ? 'items-center' : 'items-start';
  const textAlign = section.titleAlign === 'center' ? 'center' : 'left';

  return (
    <section
      id="hero"
      className="overflow-hidden rounded-[2rem] border border-black/10 shadow-[0_20px_80px_rgba(0,0,0,0.08)]"
      style={{
        backgroundColor: theme.surfaceColor,
        color: theme.primaryTextColor,
      }}
    >
      <div className="relative min-h-[560px] overflow-hidden">
        <img
          src={section.backgroundImage}
          alt={section.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/10" />
        <div
          className={`relative flex h-full min-h-[560px] flex-col justify-between p-8 text-left md:p-12 lg:p-16 ${alignItems}`}
          style={{ textAlign }}
        >
          <div className="max-w-2xl space-y-5">
            <p
              className="text-[0.7rem] uppercase tracking-[0.6em]"
              style={{
                color: theme.accentColor,
                fontWeight: section.subtitleFontWeight,
              }}
            >
              {section.eyebrow}
            </p>
            <h1
              className="text-4xl font-black uppercase leading-[0.9] tracking-[0.2em] sm:text-5xl lg:text-7xl"
              style={{ color: '#fff', fontWeight: section.titleFontWeight }}
            >
              {section.title}
            </h1>
            <p
              className="max-w-xl text-base leading-8 text-white/85 sm:text-lg"
              style={{ fontWeight: section.subtitleFontWeight }}
            >
              {section.subtitle}
            </p>
          </div>
          <div
            className="mt-8 flex flex-wrap gap-3"
            style={{
              justifyContent:
                section.buttonAlign === 'center' ? 'center' : 'flex-start',
            }}
          >
            <Link
              href="/customize"
              className="rounded-full border border-white/20 px-6 py-3 text-sm uppercase tracking-[0.35em] text-white transition duration-300 hover:opacity-90"
              style={{
                backgroundColor: theme.accentColor,
                fontWeight: section.buttonFontWeight,
              }}
            >
              {section.buttonText}
            </Link>
            <Link
              href="/customize"
              className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm uppercase tracking-[0.35em] text-white backdrop-blur transition duration-300 hover:bg-white/20"
              style={{ fontWeight: section.buttonFontWeight }}
            >
              {section.secondaryButtonText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoriesSection({
  theme,
  section,
}: {
  theme: Theme;
  section: typeof categoriesSection;
}) {
  return (
    <section
      id="categories"
      className="rounded-[1.5rem] border border-black/10 p-6"
      style={{ backgroundColor: theme.surfaceColor }}
    >
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2
          className="text-sm font-semibold uppercase tracking-[0.45em]"
          style={{ color: theme.primaryTextColor }}
        >
          {section.title}
        </h2>
        <div className="flex flex-wrap gap-3">
          {section.items?.map((item) => (
            <span
              key={item}
              className="rounded-full border border-black/10 px-4 py-2 text-[0.7rem] uppercase tracking-[0.3em] transition duration-300 hover:translate-y-[-1px]"
              style={{
                color: theme.primaryTextColor,
                borderColor: theme.borderColor,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductGridSection({
  theme,
  section,
  activeCategory,
  setActiveCategory,
  visibleProducts,
  cartCount,
  lastAdded,
  addToCart,
  quickView,
  loading,
  categoryOptions,
}: {
  theme: Theme;
  section: typeof productGridSection;
  activeCategory: CategoryFilter;
  setActiveCategory: (category: CategoryFilter) => void;
  visibleProducts: Product[];
  cartCount: number;
  lastAdded: string | null;
  addToCart: (product: Product) => void;
  quickView: (product: Product) => void;
  loading: boolean;
  categoryOptions: CategoryFilter[];
}) {
  const activeLabel = activeCategory === 'All' ? 'All' : activeCategory;

  return (
    <section
      id="productGrid"
      className="space-y-5 rounded-[1.5rem] border border-black/10 p-6"
      style={{ backgroundColor: theme.surfaceColor }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2
            className="text-sm font-semibold uppercase tracking-[0.45em]"
            style={{ color: theme.primaryTextColor }}
          >
            {section.title}
          </h2>
          <p
            className="text-xs uppercase tracking-[0.3em]"
            style={{ color: theme.secondaryTextColor }}
          >
            Viewing: {activeLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className="rounded-full border px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.25em] transition duration-300"
                style={{
                  backgroundColor: isActive ? theme.accentColor : 'transparent',
                  color: isActive ? '#fff' : theme.primaryTextColor,
                  borderColor: theme.borderColor,
                }}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div
            className="col-span-full rounded-[1.25rem] border border-dashed border-black/10 p-8 text-center text-sm uppercase tracking-[0.3em]"
            style={{ color: theme.secondaryTextColor }}
          >
            Loading products from server...
          </div>
        ) : visibleProducts.length === 0 ? (
          <div
            className="col-span-full rounded-[1.25rem] border border-dashed border-black/10 p-8 text-center text-sm uppercase tracking-[0.3em]"
            style={{ color: theme.secondaryTextColor }}
          >
            {section.emptyState}
          </div>
        ) : (
          visibleProducts.map((product) => {
            const displayImage =
              product.mockup_url ||
              product.graphic_url ||
              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
            const is3DDesign = product.design_type === 'graphic_only';

            return (
              <article
                key={product.id}
                className="group relative overflow-hidden rounded-[1.25rem] border border-black/10 bg-white/80 shadow-[0_10px_35px_rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
              >
                <div className="absolute left-3 top-3 z-10 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.2em] backdrop-blur">
                  {is3DDesign ? '3D Graphic' : 'Model Shot'}
                </div>

                <Link
                  href={`/product/${product.slug || product.id}`}
                  className="block overflow-hidden bg-slate-100"
                >
                  <img
                    src={displayImage}
                    alt={product.name}
                    className={`h-72 w-full transition duration-500 group-hover:scale-[1.03] ${
                      is3DDesign ? 'object-contain p-6' : 'object-cover'
                    }`}
                  />
                </Link>

                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="text-[0.65rem] uppercase tracking-[0.4em]"
                        style={{ color: theme.secondaryTextColor }}
                      >
                        {product.category || 'T-Shirts'}
                      </p>
                      <h3
                        className="mt-2 text-base font-semibold uppercase tracking-[0.2em]"
                        style={{ color: theme.primaryTextColor }}
                      >
                        {product.name}
                      </h3>
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: theme.accentColor }}
                    >
                      ${product.base_price}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-6"
                    style={{ color: theme.secondaryTextColor }}
                  >
                    {product.tagline || 'Heavyweight cotton / custom fit'}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex-1">
                      <AddToCartButton product={product} />
                    </div>
                    <button
                      type="button"
                      onClick={() => quickView(product)}
                      className="rounded-full border border-black/10 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.25em] transition duration-300"
                      style={{ color: theme.primaryTextColor }}
                    >
                      Quick View
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div
        className="flex flex-col gap-2 border-t border-black/10 pt-3 text-sm uppercase tracking-[0.2em] md:flex-row md:items-center md:justify-between"
        style={{ color: theme.primaryTextColor }}
      >
        <span>Cart items: {cartCount}</span>
        <span>Showing {visibleProducts.length} products</span>
        {lastAdded ? (
          <span style={{ color: theme.accentColor }}>Last Added: {lastAdded}</span>
        ) : null}
      </div>
    </section>
  );
}

function QuickViewModal({
  product,
  onClose,
  onAddToCart,
  theme,
}: {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  theme: Theme;
}) {
  if (!product) return null;

  const images = [product.mockup_url, product.graphic_url].filter(
    Boolean
  ) as string[];
  const fallbackImage =
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
  const displayImages = images.length > 0 ? images : [fallbackImage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-black/10 p-6 shadow-2xl md:p-8"
        style={{ backgroundColor: theme.surfaceColor }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-xs font-bold uppercase transition hover:bg-black/5"
        >
          ×
        </button>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <div className="overflow-hidden rounded-[1rem] border border-black/10 bg-slate-100">
              <img
                src={displayImages[0]}
                alt={product.name}
                className="h-64 w-full object-cover md:h-80"
              />
            </div>
            {displayImages.length > 1 && (
              <div className="grid grid-cols-2 gap-2">
                {displayImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${product.name} - view ${idx + 1}`}
                    className="h-20 w-full rounded-[0.5rem] border border-black/10 object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <p
                className="text-[0.65rem] uppercase tracking-[0.4em]"
                style={{ color: theme.secondaryTextColor }}
              >
                {product.category || 'T-Shirts'}
              </p>
              <h3
                className="text-2xl font-bold uppercase tracking-[0.15em]"
                style={{ color: theme.primaryTextColor }}
              >
                {product.name}
              </h3>
              <p
                className="text-lg font-semibold"
                style={{ color: theme.accentColor }}
              >
                ${product.base_price}
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: theme.secondaryTextColor }}
              >
                {product.description ||
                  product.tagline ||
                  'Heavyweight premium cotton blend with modern drop shoulders.'}
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="w-full rounded-full py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition duration-300 hover:opacity-90"
                style={{ backgroundColor: theme.accentColor }}
              >
                Add To Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartSidebar({
  isOpen,
  isMinimized,
  onToggleMinimize,
  onClose,
  cartItems,
  subtotal,
  removeFromCart,
}: {
  isOpen: boolean;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
  cartItems: any[];
  subtotal: number;
  removeFromCart: (productId: string) => void;
}) {
  return (
    <aside
      className={`fixed right-0 top-0 z-40 flex h-full flex-col border-l border-black/10 bg-[#f8f2e8] shadow-[0_20px_80px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } ${isMinimized ? 'w-16' : 'w-[92vw] max-w-sm'}`}
    >
      <div className="flex items-center justify-between border-b border-black/10 px-3 py-3">
        {!isMinimized ? (
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-black/55">
              Your bag
            </p>
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">
              Cart
            </p>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMinimize}
            aria-label={isMinimized ? 'Expand Cart' : 'Minimize Cart'}
            className="rounded-full border border-black/10 px-2 py-1 text-[0.7rem] uppercase tracking-[0.25em]"
          >
            {isMinimized ? '▸' : '◂'}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Cart"
            className="rounded-full border border-black/10 px-2 py-1 text-[0.7rem] uppercase tracking-[0.25em]"
          >
            ×
          </button>
        </div>
      </div>

      {!isMinimized ? (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3">
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-black/60">
              Subtotal
            </p>
            <p className="text-lg font-semibold uppercase tracking-[0.2em]">
              ${subtotal.toFixed(0)}
            </p>
          </div>

          {cartItems.length === 0 ? (
            <p className="text-sm uppercase tracking-[0.25em] text-black/60">
              No items in your bag yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {cartItems.map((item) => (
                <li
                  key={item.id}
                  className="rounded-[1rem] border border-black/10 bg-white/70 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-[0.25em] text-black/70">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-black/50">
                        Qty {item.quantity}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="text-[0.65rem] uppercase tracking-[0.25em] text-black/60 transition hover:text-black"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {!isMinimized ? (
        <div className="border-t border-black/10 p-4">
          <Link
            href="/cart"
            className="flex w-full items-center justify-center rounded-full bg-black px-4 py-3 text-center text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-white transition hover:opacity-90"
          >
            View Cart
          </Link>
        </div>
      ) : null}
    </aside>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Consume cart state and methods directly from the CartContext
  const { cartItems, addToCart: addToCartContext, removeFromCart, cartCount, subtotal } = useCart();

  const categoryOptions = useMemo(
    () => ['All', ...categoriesSection.items] as CategoryFilter[],
    []
  );

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to load products from API:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const visibleProducts = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter((p) => p.category === activeCategory);
  }, [activeCategory, products]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartMinimized, setIsCartMinimized] = useState(false);
  const cartTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (cartTimerRef.current) clearTimeout(cartTimerRef.current);
    };
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCartContext(product);
    setLastAdded(product.name);
    setIsCartOpen(true);
    setIsCartMinimized(false);

    if (cartTimerRef.current) clearTimeout(cartTimerRef.current);

    cartTimerRef.current = setTimeout(() => {
      setIsCartOpen(false);
    }, 3000);
  };

  const handleQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  return (
    <main
      className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {sectionOrder
          .filter((key) => {
            if (key === 'hero') return heroSection.isActive;
            if (key === 'categories') return categoriesSection.isActive;
            if (key === 'productGrid') return productGridSection.isActive;
            return false;
          })
          .map((sectionKey) => {
            if (sectionKey === 'hero') {
              return (
                <HeroSection key={sectionKey} theme={theme} section={heroSection} />
              );
            }
            if (sectionKey === 'categories') {
              return (
                <CategoriesSection
                  key={sectionKey}
                  theme={theme}
                  section={categoriesSection}
                />
              );
            }
            if (sectionKey === 'productGrid') {
              return (
                <ProductGridSection
                  key={sectionKey}
                  theme={theme}
                  section={productGridSection}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  visibleProducts={visibleProducts}
                  cartCount={cartCount}
                  lastAdded={lastAdded}
                  addToCart={handleAddToCart}
                  quickView={handleQuickView}
                  loading={loading}
                  categoryOptions={categoryOptions}
                />
              );
            }
            return null;
          })}
      </div>

      <CartSidebar
        isOpen={isCartOpen}
        isMinimized={isCartMinimized}
        onToggleMinimize={() => setIsCartMinimized((current) => !current)}
        onClose={() => {
          setIsCartOpen(false);
          setIsCartMinimized(false);
        }}
        cartItems={cartItems}
        subtotal={subtotal}
        removeFromCart={removeFromCart}
      />

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        theme={theme}
      />
    </main>
  );
}