'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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
};

type CartItem = Product & {
  quantity: number;
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

const CART_STORAGE_KEY = 'OGcut-cart';

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
  backgroundImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=80',
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
  const alignItems = section.titleAlign === 'center' ? 'items-center' : 'items-start';
  const textAlign = section.titleAlign === 'center' ? 'center' : 'left';

  return (
    <section
      id="hero"
      className="overflow-hidden rounded-[2rem] border border-black/10 shadow-[0_20px_80px_rgba(0,0,0,0.08)]"
      style={{ backgroundColor: theme.surfaceColor, color: theme.primaryTextColor }}
    >
      <div className="relative min-h-[560px] overflow-hidden">
        <img src={section.backgroundImage} alt={section.title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/10" />
        <div className={`relative flex h-full min-h-[560px] flex-col justify-between p-8 text-left md:p-12 lg:p-16 ${alignItems}`} style={{ textAlign }}>
          <div className="max-w-2xl space-y-5">
            <p className="text-[0.7rem] uppercase tracking-[0.6em]" style={{ color: theme.accentColor, fontWeight: section.subtitleFontWeight }}>
              {section.eyebrow}
            </p>
            <h1
              className="text-4xl font-black uppercase leading-[0.9] tracking-[0.2em] sm:text-5xl lg:text-7xl"
              style={{ color: '#fff', fontWeight: section.titleFontWeight }}
            >
              {section.title}
            </h1>
            <p className="max-w-xl text-base leading-8 text-white/85 sm:text-lg" style={{ fontWeight: section.subtitleFontWeight }}>
              {section.subtitle}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3" style={{ justifyContent: section.buttonAlign === 'center' ? 'center' : 'flex-start' }}>
            <Link
              href="/customize"
              className="rounded-full border border-white/20 px-6 py-3 text-sm uppercase tracking-[0.35em] text-white transition duration-300 hover:opacity-90"
              style={{ backgroundColor: theme.accentColor, fontWeight: section.buttonFontWeight }}
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
    <section id="categories" className="rounded-[1.5rem] border border-black/10 p-6" style={{ backgroundColor: theme.surfaceColor }}>
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.45em]" style={{ color: theme.primaryTextColor }}>
          {section.title}
        </h2>
        <div className="flex flex-wrap gap-3">
          {section.items?.map((item) => (
            <span
              key={item}
              className="rounded-full border border-black/10 px-4 py-2 text-[0.7rem] uppercase tracking-[0.3em] transition duration-300 hover:translate-y-[-1px]"
              style={{ color: theme.primaryTextColor, borderColor: theme.borderColor }}
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
    <section id="productGrid" className="space-y-5 rounded-[1.5rem] border border-black/10 p-6" style={{ backgroundColor: theme.surfaceColor }}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.45em]" style={{ color: theme.primaryTextColor }}>
            {section.title}
          </h2>
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: theme.secondaryTextColor }}>
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
          <div className="col-span-full rounded-[1.25rem] border border-dashed border-black/10 p-8 text-center text-sm uppercase tracking-[0.3em]" style={{ color: theme.secondaryTextColor }}>
            Loading products from server...
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="col-span-full rounded-[1.25rem] border border-dashed border-black/10 p-8 text-center text-sm uppercase tracking-[0.3em]" style={{ color: theme.secondaryTextColor }}>
            {section.emptyState}
          </div>
        ) : (
          visibleProducts.map((product) => {
            // Determine image preview URL based on design type distinction
            const displayImage = product.mockup_url || product.graphic_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';
            const is3DDesign = product.design_type === 'graphic_only';

            return (
              <article
                key={product.id}
                className="group relative overflow-hidden rounded-[1.25rem] border border-black/10 bg-white/80 shadow-[0_10px_35px_rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]"
              >
                {/* Visual Distinction Tag */}
                <div className="absolute left-3 top-3 z-10 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.2em] backdrop-blur">
                  {is3DDesign ? '3D Customizable' : 'Model Shot'}
                </div>

                <div className="overflow-hidden bg-slate-100">
                  <img
                    src={displayImage}
                    alt={product.name}
                    className={`h-72 w-full transition duration-500 group-hover:scale-[1.03] ${is3DDesign ? 'object-contain p-6' : 'object-cover'}`}
                  />
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.4em]" style={{ color: theme.secondaryTextColor }}>
                        {product.category || 'T-Shirts'}
                      </p>
                      <h3 className="mt-2 text-base font-semibold uppercase tracking-[0.2em]" style={{ color: theme.primaryTextColor }}>
                        {product.name}
                      </h3>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: theme.accentColor }}>
                      ${product.base_price}
                    </span>
                  </div>
                  <p className="text-sm leading-6" style={{ color: theme.secondaryTextColor }}>
                    {product.tagline || 'Heavyweight cotton / custom fit'}
                  </p>
                  <div className="flex gap-2 pt-2">
                    {is3DDesign ? (
                      <Link
                        href={`/customize?graphic=${encodeURIComponent(product.graphic_url || '')}&zone=${product.target_zone || 'front'}`}
                        className="flex-1 rounded-full text-center px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-white transition duration-300 hover:opacity-90"
                        style={{ backgroundColor: theme.accentColor }}
                      >
                        Customize in 3D
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="flex-1 rounded-full px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-white transition duration-300 hover:opacity-90"
                        style={{ backgroundColor: theme.accentColor }}
                      >
                        Add To Cart
                      </button>
                    )}
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

      <div className="flex flex-col gap-2 border-t border-black/10 pt-3 text-sm uppercase tracking-[0.2em] md:flex-row md:items-center md:justify-between" style={{ color: theme.primaryTextColor }}>
        <span>Cart items: {cartCount}</span>
        <span>Showing {visibleProducts.length} products</span>
        {lastAdded ? <span style={{ color: theme.accentColor }}>Last Added: {lastAdded}</span> : null}
      </div>
    </section>
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
  cartItems: CartItem[];
  subtotal: number;
  removeFromCart: (productId: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <aside
      className={`fixed right-0 top-0 z-40 flex h-full flex-col border-l border-black/10 bg-[#f8f2e8] shadow-[0_20px_80px_rgba(0,0,0,0.15)] transition-all duration-300 ${isMinimized ? 'w-16' : 'w-[92vw] max-w-sm'}`}
    >
      <div className="flex items-center justify-between border-b border-black/10 px-3 py-3">
        {!isMinimized ? (
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.35em] text-black/55">Your bag</p>
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">Cart</p>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMinimize}
            className="rounded-full border border-black/10 px-2 py-1 text-[0.7rem] uppercase tracking-[0.25em]"
          >
            {isMinimized ? '▸' : '◂'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 px-2 py-1 text-[0.7rem] uppercase tracking-[0.25em]"
          >
            ×
          </button>
        </div>
      </div>

      {!isMinimized ? (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3">
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-black/60">Subtotal</p>
            <p className="text-lg font-semibold uppercase tracking-[0.2em]">${subtotal.toFixed(0)}</p>
          </div>

          {cartItems.length === 0 ? (
            <p className="text-sm uppercase tracking-[0.25em] text-black/60">No items in your bag yet.</p>
          ) : (
            <ul className="space-y-2">
              {cartItems.map((item) => (
                <li key={item.id} className="rounded-[1rem] border border-black/10 bg-white/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-[0.25em] text-black/70">{item.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-black/50">Qty {item.quantity}</p>
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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartMinimized, setIsCartMinimized] = useState(false);

  const categoryOptions = useMemo(() => ['All', ...categoriesSection.items] as CategoryFilter[], []);

  // FETCH PRODUCTS FROM NEON BACKEND API
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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart) as CartItem[]);
      } catch {
        console.warn('Unable to parse saved cart');
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const visibleProducts = useMemo(() => {
    if (activeCategory === 'All') return products;
    return products.filter((p) => p.category === activeCategory);
  }, [activeCategory, products]);

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.base_price * item.quantity, 0), [cartItems]);

  const addToCart = (product: Product) => {
    setCartItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { ...product, quantity: 1 }];
    });
    setLastAdded(product.name);
    setIsCartOpen(true);
    setIsCartMinimized(false);
  };

  const removeFromCart = (productId: string) => {
    setCartItems((current) => current.filter((item) => item.id !== productId));
  };

  const quickView = (product: Product) => {
    if (typeof window !== 'undefined') {
      window.open(`/product/${product.id}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8" style={{ backgroundColor: theme.backgroundColor }}>
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
              return <HeroSection key={sectionKey} theme={theme} section={heroSection} />;
            }
            if (sectionKey === 'categories') {
              return <CategoriesSection key={sectionKey} theme={theme} section={categoriesSection} />;
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
                  addToCart={addToCart}
                  quickView={quickView}
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
    </main>
  );
}