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

export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      status: 'pending' as OrderStatus,
      createdAt: Date.now()
    });
    return docRef;
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
    const q = query(
      collection(db, 'products'), 
      where('isFeatured', '==', true),
      where('inStock', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
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
    console.error("Error fetching featured products:", error);
    throw error;
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