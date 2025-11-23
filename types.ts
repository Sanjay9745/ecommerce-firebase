export interface Category {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  mrp: number; // Maximum Retail Price
  price: number; // Discounted/Selling Price
  category: string;
  description: string;
  imageUrl: string; // Main product image
  images?: string[]; // Additional product images (sub-images)
  inStock: boolean;
  isFeatured: boolean; // For home page featured products
  createdAt: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  createdAt: number;
}

export type OrderStatus = Order['status'];
export type PaymentStatus = Order['paymentStatus'];

export interface AdminUser {
  email: string;
  uid: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: number;
}

export type ContactStatus = ContactMessage['status'];

// Helper to format Indian currency
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper to calculate discount percentage
export const calculateDiscount = (mrp: number, price: number): number => {
  if (mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
};