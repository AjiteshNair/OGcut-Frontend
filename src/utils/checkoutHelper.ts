import { OrderItemPayload, FormattedOrderItem } from '@/types/checkout';

export const getItemPrice = (item: OrderItemPayload): number => {
  const val = item.unitPrice ?? item.price ?? 0;
  return Number(val) || 0;
};

export const formatCartItemsForBackend = (cartItems: OrderItemPayload[]): FormattedOrderItem[] => {
  return cartItems.map((item) => {
    const isCustom =
      item.type === 'custom' ||
      Boolean(item.customShirtOrder) ||
      Boolean(item.placements && item.placements.length > 0);

    const rawPlacements = item.customShirtOrder?.placements || item.placements || [];

    const formattedPlacements = rawPlacements.map((p) => ({
      zone: p.zone || 'front',
      imageUrl: p.imageUrl || p.image || '',
      x: Number(p.coordinates?.x ?? p.x ?? 0),
      y: Number(p.coordinates?.y ?? p.y ?? 0),
      scale: Number(p.coordinates?.scale ?? p.scale ?? 1),
      width: Number(p.coordinates?.width ?? p.width ?? 400),
      height: Number(p.coordinates?.height ?? p.height ?? 400),
      centerX: Number(p.printZoneBounds?.centerX ?? p.centerX ?? 1024),
      centerY: Number(p.printZoneBounds?.centerY ?? p.centerY ?? 1024),
      clipWidth: Number(p.printZoneBounds?.clipWidth ?? p.clipWidth ?? 800),
      clipHeight: Number(p.printZoneBounds?.clipHeight ?? p.clipHeight ?? 1000),
    }));

    const rawId = item.productId ?? item.id;
    const parsedId = Number(rawId);
    const productId = !isNaN(parsedId) && parsedId > 0 ? parsedId : 1;

    return {
      productId,
      quantity: Number(item.quantity) || 1,
      size: item.size ?? 'M',
      unitPrice: getItemPrice(item),
      ...(formattedPlacements.length > 0 && { placements: formattedPlacements }),
    };
  });
};