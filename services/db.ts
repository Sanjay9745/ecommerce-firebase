import { db } from '../firebase';
import { 
  collection, getDocs, addDoc, updateDoc, doc, deleteDoc, 
  query, orderBy, where, limit
} from 'firebase/firestore';
import { Product, Order, OrderStatus, Category } from '../types';

// --- Products ---

export const getProducts = async (): Promise<Product[]> => {
  try {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt || Date.now()
      } as Product;
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: Date.now()
    });
    return docRef;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

export const updateProduct = async (id: string, data: Partial<Product>) => {
  try {
    const ref = doc(db, 'products', id);
    await updateDoc(ref, data);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// --- Orders ---

// Get next order number from counter
const getNextOrderNumber = async (): Promise<number> => {
  try {
    const counterRef = doc(db, 'counters', 'orderNumber');
    const counterDoc = await getDocs(query(collection(db, 'counters'), where('__name__', '==', 'orderNumber'), limit(1)));
    
    if (counterDoc.empty) {
      // Initialize counter if it doesn't exist
      await addDoc(collection(db, 'counters'), {
        currentNumber: 1001
      });
      const newCounterRef = doc(db, 'counters', 'orderNumber');
      await updateDoc(newCounterRef, { currentNumber: 1001 });
      return 1001;
    }
    
    const currentNumber = counterDoc.docs[0].data().currentNumber || 1000;
    const nextNumber = currentNumber + 1;
    
    // Update counter
    await updateDoc(doc(db, 'counters', 'orderNumber'), {
      currentNumber: nextNumber
    });
    
    return nextNumber;
  } catch (error) {
    console.error("Error getting order number:", error);
    // Fallback to timestamp-based number
    return 1000 + Math.floor(Date.now() / 1000) % 100000;
  }
};

export const createOrder = async (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'paymentStatus'>) => {
  try {
    const orderNumber = await getNextOrderNumber();
    
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      orderNumber,
      status: 'pending' as OrderStatus,
      paymentStatus: 'unpaid',
      createdAt: Date.now()
    });
    return { docRef, orderNumber };
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt || Date.now()
      } as Order;
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  try {
    const ref = doc(db, 'orders', id);
    await updateDoc(ref, { 
      status,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

export const updatePaymentStatus = async (id: string, paymentStatus: 'paid' | 'unpaid') => {
  try {
    const ref = doc(db, 'orders', id);
    await updateDoc(ref, { 
      paymentStatus,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
};

export const updateEstimatedDeliveryDate = async (id: string, estimatedDeliveryDate: string) => {
  try {
    const ref = doc(db, 'orders', id);
    await updateDoc(ref, { 
      estimatedDeliveryDate,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error("Error updating estimated delivery date:", error);
    throw error;
  }
};

// --- Categories ---

export const getCategories = async (): Promise<Category[]> => {
  try {
    const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt || Date.now()
      } as Category;
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const addCategory = async (categoryData: Omit<Category, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'categories'), {
      ...categoryData,
      createdAt: Date.now()
    });
    return docRef;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

export const updateCategory = async (id: string, data: Partial<Category>) => {
  try {
    const ref = doc(db, 'categories', id);
    await updateDoc(ref, data);
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

// --- Featured Products ---

export const getFeaturedProducts = async (limitCount: number = 8): Promise<Product[]> => {
  try {
    // Simplified query to avoid composite index requirement
    // We'll filter inStock products in memory after fetching
    const q = query(
      collection(db, 'products'), 
      where('isFeatured', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount * 2) // Fetch more to account for out-of-stock filtering
    );
    const snapshot = await getDocs(q);
    const products = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt || Date.now()
        } as Product;
      })
      .filter(product => product.inStock) // Filter in-stock products in memory
      .slice(0, limitCount); // Limit to requested count
    
    return products;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    // Fallback: if there's still an error, return empty array instead of throwing
    return [];
  }
};

// --- Contact Messages ---

export const getContactMessages = async (): Promise<import('../types').ContactMessage[]> => {
  try {
    const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt || Date.now()
      } as import('../types').ContactMessage;
    });
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    throw error;
  }
};

export const addContactMessage = async (messageData: Omit<import('../types').ContactMessage, 'id' | 'createdAt' | 'status'>) => {
  try {
    const docRef = await addDoc(collection(db, 'contacts'), {
      ...messageData,
      status: 'new',
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding contact message:", error);
    throw error;
  }
};

export const updateContactStatus = async (id: string, status: import('../types').ContactStatus) => {
  try {
    const docRef = doc(db, 'contacts', id);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error("Error updating contact status:", error);
    throw error;
  }
};

export const deleteContactMessage = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'contacts', id));
  } catch (error) {
    console.error("Error deleting contact message:", error);
    throw error;
  }
};