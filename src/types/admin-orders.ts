export type FrontendOrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PRINTING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type FrontendPaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED' | 'FAILED';

export type FrontendPlacementZone = 'front' | 'back' | 'left' | 'right';

export interface AdminOrderItemPlacement {
  id: number;
  oiid: number;
  place: FrontendPlacementZone;
  xvalue: number;
  yvalue: number;
  zoom: number;
  imgurl: string;
  height: number | null;
  width: number | null;
}

export interface AdminOrderItem {
  id: number;
  oid: number;
  pid: number;
  quantity: number;
  size: string;
  color: string | null;
  unitPrice: number;
  product: {
    id: number;
    name: string;
    type: 'STANDARD' | 'CUSTOMIZABLE';
  };
  placements: AdminOrderItemPlacement[];
}

export interface AddressSnapshot {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface AdminOrder {
  id: number;
  orderCode: string;
  uid: number;
  address: AddressSnapshot;
  coupon: string | null;
  status: FrontendOrderStatus;
  paymentStatus: FrontendPaymentStatus | null;
  totalAmount: number;
  trackingNumber: string | null;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string | null;
    email: string;
    phone: string | null;
  };
  items: AdminOrderItem[];
}