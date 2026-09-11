import { CartItem, CustomCartItem, Placement, Zone } from '@/types/customization';

const VALID_ZONES: Zone[] = ['front', 'back', 'left', 'right'];

export function normalizeZone(rawZone?: string | null): Zone | null {
  if (rawZone == null) return null;

  const zone = String(rawZone).toString().trim().toLowerCase();

  if (zone === 'front' || zone === 'back' || zone === 'left' || zone === 'right') {
    return zone;
  }

  // Intentionally do NOT map deprecated aliases like 'leftsleeve' or 'rightsleeve'.
  // Invalid or unknown zone strings must be handled by callers.
  return null;
}

export function normalizeZoneStrict(rawZone?: string | null): Zone {
  const z = normalizeZone(rawZone);
  if (!z) throw new Error(`Invalid or missing zone: ${String(rawZone)}`);
  return z;
}

export function normalizeFabricColor(rawColor?: string | null, options?: { required?: boolean }): string | null {
  const color = rawColor == null ? '' : String(rawColor).trim();

  if (!color) {
    if (options?.required) {
      throw new Error('Missing required fabricColor');
    }
    return null;
  }

  return color;
}

export function normalizePlacement(rawPlacement: any, fallbackZone?: Zone): Placement {
  const zoneRaw = rawPlacement?.zone ?? rawPlacement?.place ?? rawPlacement?.location;
  let zone = normalizeZone(zoneRaw);
  if (!zone && fallbackZone) {
    // Only apply fallback if explicitly provided by caller.
    zone = fallbackZone;
  }
  const imageUrl = rawPlacement?.imageUrl ?? rawPlacement?.imgurl ?? rawPlacement?.image ?? '';

  const x = Number(rawPlacement?.x ?? rawPlacement?.xvalue ?? rawPlacement?.coordinates?.x ?? 0);
  const y = Number(rawPlacement?.y ?? rawPlacement?.yvalue ?? rawPlacement?.coordinates?.y ?? 0);
  const scale = Number(rawPlacement?.scale ?? rawPlacement?.zoom ?? rawPlacement?.coordinates?.scale ?? 1);

  const width = Number(rawPlacement?.width ?? rawPlacement?.coordinates?.width ?? rawPlacement?.printZoneBounds?.clipWidth ?? 0);
  const height = Number(rawPlacement?.height ?? rawPlacement?.coordinates?.height ?? rawPlacement?.printZoneBounds?.clipHeight ?? 0);

  const centerX = Number(rawPlacement?.centerX ?? rawPlacement?.printZoneBounds?.centerX ?? 0);
  const centerY = Number(rawPlacement?.centerY ?? rawPlacement?.printZoneBounds?.centerY ?? 0);
  const clipWidth = Number(rawPlacement?.clipWidth ?? rawPlacement?.printZoneBounds?.clipWidth ?? 0);
  const clipHeight = Number(rawPlacement?.clipHeight ?? rawPlacement?.printZoneBounds?.clipHeight ?? 0);

  return {
    zone,
    imageUrl,
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    scale: Number.isFinite(scale) ? scale : 1,
    width: Number.isFinite(width) ? width : 0,
    height: Number.isFinite(height) ? height : 0,
    centerX: Number.isFinite(centerX) ? centerX : 0,
    centerY: Number.isFinite(centerY) ? centerY : 0,
    clipWidth: Number.isFinite(clipWidth) ? clipWidth : 0,
    clipHeight: Number.isFinite(clipHeight) ? clipHeight : 0,
  };
}

export function normalizePlacements(rawPlacements: unknown, fallbackZone?: Zone): Placement[] {
  if (!Array.isArray(rawPlacements)) return [];

  return rawPlacements
    .filter(Boolean)
    .map((placement) => normalizePlacement(placement, fallbackZone))
    // Only keep placements with a valid, non-null zone
    .filter((placement) => placement.zone !== null && VALID_ZONES.includes(placement.zone as Zone)) as Placement[];
}

export function normalizeCartItem(rawItem: any): CartItem {
  const explicitType = rawItem?.type;
  const isExplicitCustom = explicitType === 'custom';
  const isExplicitStandard = explicitType === 'standard';

  const hasCustomSignature =
    Array.isArray(rawItem?.placements) &&
    rawItem?.placements.length > 0 &&
    typeof rawItem?.fabricColor === 'string' &&
    rawItem.fabricColor.trim() !== '';

  const isCustom = isExplicitCustom || (!isExplicitStandard && hasCustomSignature);

  if (!isCustom) {
    const normalizedImages = Array.isArray(rawItem?.images)
      ? rawItem.images.filter(Boolean)
      : [];
    const primaryImage = normalizedImages[0] || rawItem?.thumbnailUrl || undefined;

    return {
      type: 'standard',
      id: Number(rawItem?.id ?? Date.now()),
      productId: Number(rawItem?.productId ?? rawItem?.pid ?? 0),
      title: rawItem?.title ?? rawItem?.name ?? 'Standard Product',
      name: rawItem?.name ?? rawItem?.title ?? 'Standard Product',
      thumbnailUrl: primaryImage,
      images: normalizedImages.length > 0 ? normalizedImages : undefined,
      price: Number(rawItem?.price ?? rawItem?.unitPrice ?? 0),
      unitPrice: Number(rawItem?.unitPrice ?? rawItem?.price ?? 0),
      quantity: Number(rawItem?.quantity ?? 1),
      size: rawItem?.size ?? 'M',
      color: normalizeFabricColor(rawItem?.color) ?? undefined,
      fabricColor: normalizeFabricColor(rawItem?.fabricColor) ?? undefined,
      placements: [],
    };
  }

  const normalizedPlacements = normalizePlacements(rawItem?.placements ?? []);

  return {
    type: 'custom',
    id: Number(rawItem?.id ?? rawItem?.productId ?? rawItem?.pid ?? Date.now()),
    productId: Number(rawItem?.productId ?? rawItem?.pid ?? rawItem?.id ?? 1),
    size: rawItem?.size ?? 'M',
    fabricColor: normalizeFabricColor(rawItem?.fabricColor) ?? undefined,
    placements: normalizedPlacements,
    price: Number(rawItem?.price ?? rawItem?.unitPrice ?? 0),
    unitPrice: Number(rawItem?.unitPrice ?? rawItem?.price ?? 0),
    quantity: Number(rawItem?.quantity ?? 1),
    title: rawItem?.title ?? rawItem?.name ?? 'Custom T-Shirt',
    name: rawItem?.name ?? rawItem?.title ?? 'Custom T-Shirt',
    image: rawItem?.image ?? rawItem?.thumbnailUrl ?? undefined,
    thumbnailUrl: rawItem?.thumbnailUrl ?? rawItem?.image ?? undefined,
  };
}

export function normalizeCartItems(rawCartItems: unknown[]): CartItem[] {
  return Array.isArray(rawCartItems) ? rawCartItems.map((item) => normalizeCartItem(item)) : [];
}
