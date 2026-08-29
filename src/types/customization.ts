export type Zone = 'front' | 'back' | 'left' | 'right';

export type ShirtSize = 'S' | 'M' | 'L' | 'XL' | '2XL';

export interface ZoneConfig {
  x: number;
  y: number;
  clipWidth: number;
  clipHeight: number;
  centerX?: number;
  centerY?: number;
}

// --- 1. Custom 3D Shirt Types ---
export interface Placement {
  zone: Zone | string;
  imageUrl: string;
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  clipWidth: number;
  clipHeight: number;
}
export interface Product {
  id: number;
  name: string;
  desc: string;
  price: number;
  type: string;
  isActive: boolean;
  image: string | null;
  
  // Optional / legacy fields
  category?: string;
  tagline?: string;
}

export interface CustomCartItem {
  type: 'custom';
  id: number; // Pure numeric ID
  size: ShirtSize | string;
  fabricColor: string;
  placements: Placement[];
  price: number;
  unitPrice?: number;
  quantity: number;
  title?: string;
  name?: string;
  image?: string;
  thumbnailUrl?: string;
}

export interface StandardCartItem {
  type: 'standard';
  id: number; // Pure numeric ID
  productId: number;
  title: string;
  name?: string;
  thumbnailUrl?: string;
  image?: string;
  price: number;
  unitPrice?: number;
  quantity: number;
  size?: ShirtSize | string;
  color?: string;
  
  // Optional fields to satisfy discriminated union checks
  fabricColor?: string;
  placements?: Placement[];
}

// --- 3. Discriminated Union ---
export type CartItem = CustomCartItem | StandardCartItem;

// --- 4. Database Checkout Payload Types ---
export interface OrderItemDatabasePayload {
  product_id?: string;
  is_custom: boolean;
  title: string;
  quantity: number;
  unit_price: number;
  size?: string;
  color?: string;

  // Custom-only fields (saved as NULL for standard items)
  fabric_color?: string | null;
  placements_json?: Placement[] | null;
  thumbnail_url?: string | null;
}

export interface ZoneImageData {
  image?: string | null;
  imageUrl?: string | null;
  x?: number;
  y?: number;
  scale?: number;
  width?: number;
  height?: number;
  centerX?: number;
  centerY?: number;
  clipWidth?: number;
  clipHeight?: number;
  [key: string]: any; // Allows dynamic zone string indexing
}

export interface CustomizationPayload {
  fabricColor: string;
  placements: Array<{
    zone: Zone | string;
    imageUrl: string;
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    clipWidth: number;
    clipHeight: number;
  }>;
}