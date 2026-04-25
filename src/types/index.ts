export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  type: string; // 'Event', 'Lunch Pack', 'Retail' etc.
  price: number;
  isActive: boolean;
  createdAt?: string;
}

export interface OrderItem {
  id?: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  customerId: string;
  customer?: Customer;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryDate?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentEntry {
  id: string;
  amount: number;
  date: string;
  method: string;
}

export interface Bill {
  id: string;
  orderId: string;
  order?: Order;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  remainingAmount?: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  paymentHistory: PaymentEntry[];
  createdAt?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role: string;
}
