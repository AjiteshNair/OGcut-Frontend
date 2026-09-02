import { OrderItemPayload, FormattedOrderItem, FormattedPlacement } from '@/types/checkout';
import { normalizeFabricColor, normalizePlacements, normalizeZone, normalizeZoneStrict } from '@/utils/normalization';

export const getItemPrice = (item: OrderItemPayload): number => {
  const val = item.unitPrice ?? item.price ?? 0;
  return Number(val) || 0;
};

export const formatCartItemsForBackend = (cartItems: OrderItemPayload[]): FormattedOrderItem[] => {
  return cartItems.map((item) => {
    const normalizedPlacements = normalizePlacements(item.placements ?? []);

    const formattedPlacements: FormattedPlacement[] = normalizedPlacements.map((placement) => ({
      place: normalizeZoneStrict(placement.zone),
      imgurl: placement.imageUrl || '',
      xvalue: Number(placement.x ?? 0),
      yvalue: Number(placement.y ?? 0),
      zoom: Number(placement.scale ?? 1),
    }));

    const rawId = item.productId ?? item.id;
    const parsedId = Number(rawId);
    const productId = !isNaN(parsedId) && parsedId > 0 ? parsedId : 1;

    let colorField: string | null = null;
    if (formattedPlacements.length > 0) {
      // Custom item: fabric color is required
      colorField = normalizeFabricColor(item.fabricColor, { required: true });
    } else {
      // Standard item: optional color
      colorField = normalizeFabricColor(item.color) ?? null;
    }

    return {
      productId,
      quantity: Number(item.quantity) || 1,
      size: item.size ?? 'M',
      color: colorField ?? undefined,
      unitPrice: getItemPrice(item),
      ...(formattedPlacements.length > 0 && { placements: formattedPlacements }),
    };
  });
};