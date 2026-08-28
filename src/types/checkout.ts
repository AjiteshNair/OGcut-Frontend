export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface Placement {
  zone?: string;
  imageUrl?: string;
  image?: string;
  x?: number;
  y?: number;
  scale?: number;
  width?: number;
  height?: number;
  centerX?: number;
  centerY?: number;
  clipWidth?: number;
  clipHeight?: number;
  coordinates?: {
    x?: number;
    y?: number;
    scale?: number;
    width?: number;
    height?: number;
  };
  printZoneBounds?: {
    centerX?: number;
    centerY?: number;
    clipWidth?: number;
    clipHeight?: number;
  };
}

export interface OrderItemPayload {
  id?: string | number;
  productId?: string | number;
  designId?: string;
  type?: 'custom' | 'standard';
  title?: string;
  name?: string;
  thumbnailUrl?: string;
  image?: string;
  quantity: number;
  size?: string;
  unitPrice?: number;
  price?: number;
  color?: string;
  placements?: Placement[];
}

export interface FormattedPlacement {
  place: 'front' | 'back' | 'left' | 'right';
  imgurl: string;
  xvalue: number;
  yvalue: number;
  zoom: number;
}

export interface FormattedOrderItem {
  productId: number;
  quantity: number;
  size: string;
  color?: string;
  unitPrice: number;
  placements?: FormattedPlacement[];
}