import { OrderItemPayload, FormattedOrderItem, FormattedPlacement } from '@/types/checkout';

export const getItemPrice = (item: OrderItemPayload): number => {
  const val = item.unitPrice ?? item.price ?? 0;
  return Number(val) || 0;
};

// Helper to normalize zone strings into allowed backend placement values
const normalizePlace = (zone?: string): 'front' | 'back' | 'left' | 'right' => {
  if (!zone) {
    throw new Error('Placement zone is missing. Valid zones are: front, back, left, right.');
  }

  const lower = zone.trim().toLowerCase();

  if (lower === 'front') return 'front';
  if (lower === 'back') return 'back';
  if (lower === 'left' || lower === 'leftsleeve') return 'left';
  if (lower === 'right' || lower === 'rightsleeve') return 'right';

  throw new Error(`Invalid placement zone "${zone}". Must be one of: front, back, left, right.`);
};

export const formatCartItemsForBackend = (cartItems: OrderItemPayload[]): FormattedOrderItem[] => {
  return cartItems.map((item) => {
    const rawPlacements = item.placements || [];
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>")
console.log(item)
    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>")

    const formattedPlacements: FormattedPlacement[] = rawPlacements.map((p: any) => {
      const imageUrl = p.imgurl || p.imageUrl || p.image || '';
      // Check p.place first, then fallback to p.zone
      const rawZone = p.place || p.zone;
      alert(p.fabricColor)
      
      return {
        place: normalizePlace(rawZone),
        imgurl: imageUrl,
        color : p.color,
        fabricColor: p.fabricColor,
        xvalue: Number(p.xvalue ?? p.coordinates?.x ?? p.x ?? 0),
        yvalue: Number(p.yvalue ?? p.coordinates?.y ?? p.y ?? 0),
        zoom: Number(p.zoom ?? p.coordinates?.scale ?? p.scale ?? 1),
      };
    });

    const rawId = item.productId ?? item.id;
    const parsedId = Number(rawId);
    const productId = !isNaN(parsedId) && parsedId > 0 ? parsedId : 1;

    return {
      productId,
      quantity: Number(item.quantity) || 1,
      size: item.size ?? 'M',
      color: item.fabricColor || undefined,
      unitPrice: getItemPrice(item),
      ...(formattedPlacements.length > 0 && { placements: formattedPlacements }),
    };
  });
};