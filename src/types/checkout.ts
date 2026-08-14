export interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface OrderItemPayload {
  id: string;
  size: string;
  fabricColor: string;
  price: number;
  quantity: number;
  placements: any; // Canvas texture or zone design payload
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  shippingAddress: Address;
  items: OrderItemPayload[];
  totalAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  orderStatus: 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  createdAt: string;
}