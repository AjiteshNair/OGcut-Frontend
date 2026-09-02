import { CartItem, StandardCartItem, Product } from '@/types/customization';

export const getStoredCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('cart_items');
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to parse cart items:', err);
    return [];
  }
};

export const saveStoredCart = (cart: CartItem[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cart_items', JSON.stringify(cart));
  window.dispatchEvent(new Event('cart-updated'));
};

export const updateStandardItemQuantity = (
  product: Product,
  delta: number
): CartItem[] => {
  const currentCart = getStoredCart();
  
  // Find standard item matching this product ID
  const itemIndex = currentCart.findIndex(
    (item): item is StandardCartItem =>
      item.type === 'standard' && item.productId === product.id
  );

  if (itemIndex > -1) {
    const item = currentCart[itemIndex] as StandardCartItem;
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      currentCart.splice(itemIndex, 1);
    } else {
      currentCart[itemIndex] = { ...item, quantity: newQty };
    }
  } else if (delta > 0) {
    // Add new standard cart item: keep a unique row id, but preserve the real productId for price lookups.
    const newItem: StandardCartItem = {
      type: 'standard',
      id: Date.now() + Math.random(),
      productId: product.id,
      title: product.name,
      thumbnailUrl: product.image || '',
      price: product.price,
      quantity: delta,
    };
    currentCart.push(newItem);
  }

  saveStoredCart(currentCart);
  return currentCart;
};