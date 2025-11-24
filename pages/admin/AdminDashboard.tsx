import React, { useEffect, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  getOrders, getProducts, updateOrderStatus, addProduct, deleteProduct, updateProduct,
  getCategories, addCategory, deleteCategory, updateCategory, getContactMessages, updateContactStatus, deleteContactMessage,
  updatePaymentStatus, updateEstimatedDeliveryDate
} from '../../services/db';
import { generateProductDescription } from '../../services/gemini';
import { Order, Product, Category, ContactMessage, ContactStatus, formatINR, calculateDiscount } from '../../types';
import { Package, Plus, Trash2, LogOut, Sparkles, ShoppingBag, FolderOpen, Star, Mail, ChevronLeft, ChevronRight, MessageCircle, Settings, Edit3 } from 'lucide-react';
import ImageUpload from '../../components/ImageUpload';
import { getWebsiteSettings, updateWebsiteSettings, WebsiteSettings } from '../../services/websiteSettings';
import LottieLoader from '../../components/LottieLoader';

type TabType = 'orders' | 'products' | 'categories' | 'contacts' | 'whatsapp' | 'settings';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  
  // WhatsApp Templates
  const [whatsappTemplates, setWhatsappTemplates] = useState({
    orderConfirmation: `Hello {customerName}! 🎉

Thank you for your order at Wisania!

*Order ID:* {orderId}
*Total Amount:* {totalAmount}
*Status:* {status}

Track your order: {trackingLink}

We'll keep you updated on your order status.

For any questions, feel free to reach out!

Best regards,
Wisania Team`,
    orderShipped: `Hello {customerName}! 📦

Great news! Your order has been shipped.

*Order ID:* {orderId}
*Items:* {items}

Track your order: {trackingLink}

Your package is on its way and will be delivered soon.

Thank you for shopping with Wisania!`,
    orderDelivered: `Hello {customerName}! ✅

Your order has been delivered successfully!

*Order ID:* {orderId}

Track your order: {trackingLink}

We hope you love your purchase. Please share your feedback with us.

Thank you for choosing Wisania!`,
    contactReply: `Hello {name}! 👋

Thank you for contacting Wisania.

We received your message regarding: *{subject}*

Our team will get back to you shortly.

Best regards,
Wisania Team`
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Order filters
  const [orderStatusFilter, setOrderStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderDateFilter, setOrderDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Product filters
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  
  // Product Form State (for both add and edit)
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    mrp: '',
    price: '',
    category: '',
    imageUrl: '',
    images: [] as string[],
    description: '',
    inStock: true,
    isFeatured: false
  });
  
  // New Category Form State
  const [newCategory, setNewCategory] = useState({
    name: '',
    imageUrl: '',
    description: ''
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Website Settings State
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
    setCurrentPage(1); // Reset pagination when tab changes
  }, [activeTab]);

  useEffect(() => {
    // Load saved templates from localStorage
    const saved = localStorage.getItem('whatsappTemplates');
    if (saved) {
      try {
        setWhatsappTemplates(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load WhatsApp templates');
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      if (activeTab === 'orders') {
        const data = await getOrders();
        setOrders(data);
      } else if (activeTab === 'products') {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
        // Set default category if exists
        if (categoriesData.length > 0 && !newProduct.category) {
          setNewProduct(prev => ({ ...prev, category: categoriesData[0].name }));
        }
      } else if (activeTab === 'categories') {
        const data = await getCategories();
        setCategories(data);
      } else if (activeTab === 'contacts') {
        const data = await getContactMessages();
        setContacts(data);
      } else if (activeTab === 'settings') {
        setIsLoadingSettings(true);
        const settings = await getWebsiteSettings();
        setWebsiteSettings(settings);
        setIsLoadingSettings(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoadingSettings(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin');
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      fetchData();
    } catch (error) {
      alert('Failed to update order status');
    }
  };

  const handlePaymentStatusUpdate = async (orderId: string, newPaymentStatus: 'paid' | 'unpaid') => {
    try {
      await updatePaymentStatus(orderId, newPaymentStatus);
      fetchData();
    } catch (error) {
      alert('Failed to update payment status');
    }
  };

  const handleDeliveryDateUpdate = async (orderId: string, date: string) => {
    try {
      await updateEstimatedDeliveryDate(orderId, date);
      fetchData();
    } catch (error) {
      alert('Failed to update estimated delivery date');
    }
  };

  const handleGenerateDescription = async () => {
    if (!newProduct.name) return alert("Enter a product name first");
    setIsGenerating(true);
    const desc = await generateProductDescription(
      newProduct.name, 
      newProduct.category, 
      "Luxury, Chic, High-quality material, Women's Fashion"
    );
    setNewProduct(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const mrp = parseFloat(newProduct.mrp);
    const price = parseFloat(newProduct.price);
    
    if (price > mrp) {
      alert('Discounted price cannot be greater than MRP');
      return;
    }
    
    try {
      if (editingProductId) {
        // Update existing product
        await updateProduct(editingProductId, {
          name: newProduct.name,
          mrp,
          price,
          category: newProduct.category,
          imageUrl: newProduct.imageUrl,
          images: newProduct.images.filter(img => img.trim() !== ''),
          description: newProduct.description,
          inStock: newProduct.inStock,
          isFeatured: newProduct.isFeatured
        });
      } else {
        // Add new product
        await addProduct({
          name: newProduct.name,
          mrp,
          price,
          category: newProduct.category,
          imageUrl: newProduct.imageUrl,
          images: newProduct.images.filter(img => img.trim() !== ''),
          description: newProduct.description,
          inStock: newProduct.inStock,
          isFeatured: newProduct.isFeatured
        });
      }
      
      // Reset form
      setEditingProductId(null);
      setNewProduct({ 
        name: '', 
        mrp: '',
        price: '', 
        category: categories[0]?.name || '', 
        imageUrl: '', 
        images: [],
        description: '', 
        inStock: true,
        isFeatured: false
      });
      fetchData();
    } catch (error) {
      alert(editingProductId ? 'Failed to update product' : 'Failed to add product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name,
      mrp: product.mrp.toString(),
      price: product.price.toString(),
      category: product.category,
      imageUrl: product.imageUrl,
      images: product.images || [],
      description: product.description,
      inStock: product.inStock,
      isFeatured: product.isFeatured
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setNewProduct({ 
      name: '', 
      mrp: '',
      price: '', 
      category: categories[0]?.name || '', 
      imageUrl: '', 
      images: [],
      description: '', 
      inStock: true,
      isFeatured: false
    });
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to remove this item from the catalog?')) {
      try {
        await deleteProduct(id);
        fetchData();
      } catch (error) {
        alert('Failed to delete product');
      }
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await updateProduct(product.id, { isFeatured: !product.isFeatured });
      fetchData();
    } catch (error) {
      alert('Failed to update product');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      alert('Category name is required');
      return;
    }
    
    try {
      if (editingCategoryId) {
        // Update existing category
        await updateCategory(editingCategoryId, {
          name: newCategory.name.trim(),
          imageUrl: newCategory.imageUrl,
          description: newCategory.description.trim()
        });
        setEditingCategoryId(null);
      } else {
        await addCategory({
          name: newCategory.name.trim(),
          imageUrl: newCategory.imageUrl,
          description: newCategory.description.trim()
        });
      }

      setNewCategory({ name: '', imageUrl: '', description: '' });
      fetchData();
    } catch (error) {
      alert(editingCategoryId ? 'Failed to update category' : 'Failed to add category');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setNewCategory({ name: category.name, imageUrl: category.imageUrl, description: category.description || '' });
    // Scroll to the add/edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setNewCategory({ name: '', imageUrl: '', description: '' });
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    // Check if any products use this category
    const productsUsingCategory = products.filter(p => p.category === name);
    
    if (productsUsingCategory.length > 0) {
      alert(`Cannot delete category "${name}". It is being used by ${productsUsingCategory.length} product(s).`);
      return;
    }
    
    if (confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        await deleteCategory(id);
        fetchData();
      } catch (error) {
        alert('Failed to delete category');
      }
    }
  };

  const sendWhatsAppMessage = (phoneNumber: string, message: string) => {
    // Remove non-numeric characters from phone
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    // Open in new window
    window.open(whatsappUrl, '_blank');
  };

  const generateOrderMessage = (order: Order, template: string) => {
    const itemsList = order.items.map(item => `${item.quantity}x ${item.name}`).join(', ');
    
    // Use orderNumber if available, otherwise fall back to shortened document ID
    const orderIdDisplay = order.orderNumber ? order.orderNumber.toString() : order.id.slice(0, 8);
    
    // For tracking link, use orderNumber (numeric) if available, otherwise use document ID
    const trackingId = order.orderNumber ? order.orderNumber.toString() : order.id;
    const trackingLink = `${window.location.origin}/track-order?id=${trackingId}`;
    
    let message = template
      .replace('{customerName}', order.customerName)
      .replace('{orderId}', orderIdDisplay)
      .replace('{totalAmount}', formatINR(order.totalAmount))
      .replace('{status}', order.status.charAt(0).toUpperCase() + order.status.slice(1))
      .replace('{items}', itemsList)
      .replace('{trackingLink}', trackingLink);
    
    // Add estimated delivery date if available
    if (order.estimatedDeliveryDate) {
      const deliveryDate = new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      message += `\n\n*Estimated Delivery:* ${deliveryDate}`;
    }
    
    return message;
  };

  const generateContactMessage = (contact: ContactMessage, template: string) => {
    return template
      .replace('{name}', contact.name)
      .replace('{subject}', contact.subject);
  };

  const handleSaveSettings = async () => {
    if (!websiteSettings) return;
    
    setIsSavingSettings(true);
    try {
      await updateWebsiteSettings(websiteSettings);
      alert('Website settings saved successfully! ✅');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      {/* Admin Nav */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between gap-4 py-4">
            <h1 className="text-xl font-serif font-bold text-gray-900 tracking-wide uppercase">Wisania Admin</h1>
            
            <div className="flex items-center">
              <button 
                onClick={handleLogout} 
                className="text-gray-500 hover:text-red-600 flex items-center text-sm font-medium transition-colors"
              >
                <LogOut size={16} className="mr-2" /> Logout
              </button>
            </div>
          </div>

          {/* Tab Navigation - Mobile Responsive */}
          <div className="flex flex-wrap gap-2 pb-4">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'orders' 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center"><ShoppingBag size={14} className="mr-1 sm:mr-2"/> <span className="hidden xs:inline">Orders</span></div>
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'products' 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center"><Package size={14} className="mr-1 sm:mr-2"/> <span className="hidden xs:inline">Products</span></div>
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'categories' 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center"><FolderOpen size={14} className="mr-1 sm:mr-2"/> <span className="hidden xs:inline">Categories</span></div>
            </button>
            <button 
              onClick={() => setActiveTab('contacts')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'contacts' 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center"><Mail size={14} className="mr-1 sm:mr-2"/> <span className="hidden xs:inline">Contacts</span></div>
            </button>
            <button 
              onClick={() => setActiveTab('whatsapp')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'whatsapp' 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center"><MessageCircle size={14} className="mr-1 sm:mr-2"/> <span className="hidden xs:inline">WhatsApp</span></div>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'settings' 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center"><Settings size={14} className="mr-1 sm:mr-2"/> <span className="hidden xs:inline">Settings</span></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        
        {/* ORDERS TAB */}
        {activeTab === 'orders' && (() => {
          // Apply filters
          const filteredOrders = orders.filter(order => {
            const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
            const matchesSearch = orderSearchTerm === '' || 
              order.customerName.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
              order.email.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
              order.phone.includes(orderSearchTerm) ||
              order.id.toLowerCase().includes(orderSearchTerm.toLowerCase());
            
            // Date filter
            let matchesDate = true;
            if (orderDateFilter !== 'all') {
              const orderDate = new Date(order.createdAt);
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              
              if (orderDateFilter === 'today') {
                matchesDate = orderDate >= today;
              } else if (orderDateFilter === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                matchesDate = orderDate >= weekAgo;
              } else if (orderDateFilter === 'month') {
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                matchesDate = orderDate >= monthAgo;
              }
            }
            
            return matchesStatus && matchesSearch && matchesDate;
          });

          // Apply pagination
          const paginatedOrders = filteredOrders.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
          );

          const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

          return (
            <div className="bg-white shadow-md border border-gray-200 rounded-xl overflow-hidden">
              {/* Header with filters */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">Orders Management</h2>
                    <span className="text-xs text-gray-500">
                      {filteredOrders.length} of {orders.length} orders
                    </span>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={orderSearchTerm}
                      onChange={(e) => {
                        setOrderSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent w-full sm:w-auto"
                    />

                    {/* Date Filter */}
                    <select
                      value={orderDateFilter}
                      onChange={(e) => {
                        setOrderDateFilter(e.target.value as typeof orderDateFilter);
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => {
                        setOrderStatusFilter(e.target.value as Order['status'] | 'all');
                        setCurrentPage(1); // Reset to first page
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Orders List */}
              <ul className="divide-y divide-gray-200">
                {paginatedOrders.map((order) => (
                <li key={order.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900">Order #{order.orderNumber || order.id.slice(0, 8)}</h3>
                        <span className="text-xs text-gray-500 font-mono">{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600 flex flex-col gap-1">
                        <span><span className="font-medium">{order.customerName}</span> <span className="text-gray-400">|</span> <a href={`mailto:${order.email}`} className="text-blue-600 hover:underline">{order.email}</a></span>
                        <span>{order.phone}</span>
                        <p className="text-sm text-gray-500 mt-1">{order.address}</p>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-2xl font-bold text-gray-900 mb-2">{formatINR(order.totalAmount)}</p>
                      <div className="mt-2 space-y-2">
                        <select 
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                          className={`block w-full pl-3 pr-8 py-1.5 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-black cursor-pointer
                          ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <select 
                          value={order.paymentStatus}
                          onChange={(e) => handlePaymentStatusUpdate(order.id, e.target.value as 'paid' | 'unpaid')}
                          className={`block w-full pl-3 pr-8 py-1.5 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-black cursor-pointer
                          ${order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}
                        >
                          <option value="unpaid">💳 Unpaid</option>
                          <option value="paid">✅ Paid</option>
                        </select>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Delivery Date</label>
                          <input
                            type="date"
                            value={order.estimatedDeliveryDate || ''}
                            onChange={(e) => handleDeliveryDateUpdate(order.id, e.target.value)}
                            className="block w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const template = order.status === 'shipped' 
                            ? whatsappTemplates.orderShipped 
                            : order.status === 'delivered'
                            ? whatsappTemplates.orderDelivered
                            : whatsappTemplates.orderConfirmation;
                          const message = generateOrderMessage(order, template);
                          sendWhatsAppMessage(order.phone, message);
                        }}
                        className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                        title="Send WhatsApp message with tracking link"
                      >
                        <MessageCircle size={14} />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 mt-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Items Ordered</h4>
                    <ul className="space-y-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between text-sm items-center">
                          <div className="flex items-center">
                            <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold mr-3 text-gray-700">
                              {item.quantity}
                            </span>
                            <span className="text-gray-800 font-medium">{item.name}</span>
                            <span className="ml-2 text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">({item.category})</span>
                          </div>
                          <span className="font-semibold text-gray-900">{formatINR(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
              {paginatedOrders.length === 0 && filteredOrders.length === 0 && (
                <li className="p-12 text-center text-gray-500">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium mb-2">No orders match your filters.</p>
                  <p className="text-sm text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
                  <button
                    onClick={() => {
                      setOrderStatusFilter('all');
                      setOrderSearchTerm('');
                      setOrderDateFilter('all');
                      setCurrentPage(1);
                    }}
                    className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Clear All Filters
                  </button>
                </li>
              )}
              {orders.length === 0 && (
                <li className="p-12 text-center text-gray-500">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                  <p>No orders found.</p>
                </li>
              )}
            </ul>

            {/* Pagination - More Prominent */}
            {filteredOrders.length > itemsPerPage && (
              <div className="bg-gray-50 border-t-2 border-gray-300 px-4 sm:px-6 py-4 sm:py-5">
                <div className="flex flex-col gap-4">
                  <div className="text-xs sm:text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-center">
                    Showing <span className="font-bold text-black">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-black">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="font-bold text-black">{filteredOrders.length}</span> orders
                  </div>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 flex items-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm transition-all shadow-sm"
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    <div className="px-3 sm:px-5 py-2 sm:py-2.5 bg-black text-white rounded-lg font-bold text-xs sm:text-sm shadow-md">
                      {currentPage} / {totalPages}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 flex items-center gap-1 sm:gap-2 font-medium text-xs sm:text-sm transition-all shadow-sm"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Add/Edit Product Form */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow-md border border-gray-200 rounded-xl p-6 lg:sticky lg:top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Plus size={20} className="mr-2"/> {editingProductId ? 'Edit Product' : 'New Product'}
                  </h3>
                  {editingProductId && (
                    <button
                      onClick={handleCancelEdit}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Product Name *</label>
                    <input 
                      placeholder="e.g. Silk Evening Dress" 
                      required 
                      value={newProduct.name} 
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2.5"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">MRP (₹) *</label>
                      <input 
                        placeholder="0" 
                        type="number" 
                        step="1" 
                        required 
                        value={newProduct.mrp} 
                        onChange={e => setNewProduct({...newProduct, mrp: e.target.value})} 
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹) *</label>
                      <input 
                        placeholder="0" 
                        type="number" 
                        step="1" 
                        required 
                        value={newProduct.price} 
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})} 
                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2.5"
                      />
                    </div>
                  </div>
                  
                  {newProduct.mrp && newProduct.price && parseFloat(newProduct.price) < parseFloat(newProduct.mrp) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                      <p className="text-xs font-semibold text-green-700">
                        {calculateDiscount(parseFloat(newProduct.mrp), parseFloat(newProduct.price))}% OFF
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                    <select 
                      value={newProduct.category} 
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2.5"
                      required
                    >
                      {categories.length === 0 ? (
                        <option value="">No categories available</option>
                      ) : (
                        categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                      )}
                    </select>
                    {categories.length === 0 && (
                      <p className="text-xs text-orange-600 mt-1">⚠️ Create a category first</p>
                    )}
                  </div>
                  
                  <ImageUpload
                    value={newProduct.imageUrl}
                    onChange={(base64) => setNewProduct({...newProduct, imageUrl: base64})}
                    label="Main Product Image *"
                  />
                  
                  <div className="border-t pt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Additional Images (Optional)</label>
                    <p className="text-xs text-gray-500 mb-3">Upload up to 4 additional product images</p>
                    
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className="mb-3">
                        <ImageUpload
                          value={newProduct.images[index] || ''}
                          onChange={(base64) => {
                            const updatedImages = [...newProduct.images];
                            updatedImages[index] = base64;
                            setNewProduct({...newProduct, images: updatedImages});
                          }}
                          label={`Image ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
                    <textarea 
                      placeholder="Product description..." 
                      required 
                      value={newProduct.description} 
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})} 
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2.5 h-32"
                    />
                    <button 
                      type="button" 
                      onClick={handleGenerateDescription}
                      disabled={isGenerating}
                      className="absolute bottom-2 right-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center hover:from-purple-200 hover:to-pink-200 transition-all disabled:opacity-50"
                    >
                      <Sparkles size={12} className="mr-1"/> {isGenerating ? 'Generating...' : 'AI Write'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                      <input 
                        type="checkbox" 
                        checked={newProduct.inStock} 
                        onChange={e => setNewProduct({...newProduct, inStock: e.target.checked})} 
                        className="mr-3 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700 font-medium">Available in Stock</label>
                    </div>
                    
                    <div className="flex items-center bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <input 
                        type="checkbox" 
                        checked={newProduct.isFeatured} 
                        onChange={e => setNewProduct({...newProduct, isFeatured: e.target.checked})} 
                        className="mr-3 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700 font-medium flex items-center">
                        <Star size={14} className="mr-1 text-yellow-600" /> Featured Product
                      </label>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={categories.length === 0}
                    className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingProductId ? 'Update Product' : 'Create Product'}
                  </button>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* Product List */}
            <div className="lg:col-span-2">
              {(() => {
                // Apply filters
                const filteredProducts = products.filter(product => {
                  const matchesCategory = productCategoryFilter === 'all' || product.category === productCategoryFilter;
                  const matchesSearch = productSearchTerm === '' ||
                    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                    product.category.toLowerCase().includes(productSearchTerm.toLowerCase());
                  return matchesCategory && matchesSearch;
                });

                // Apply pagination
                const paginatedProducts = filteredProducts.slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                );

                const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

                return (
                  <div className="bg-white shadow-md border border-gray-200 rounded-xl overflow-hidden">
                    {/* Header with filters */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">Current Catalog</h2>
                          <span className="text-xs text-gray-500">
                            {filteredProducts.length} of {products.length} products
                          </span>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          {/* Search */}
                          <input
                            type="text"
                            placeholder="Search products..."
                            value={productSearchTerm}
                            onChange={(e) => {
                              setProductSearchTerm(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent"
                          />

                          {/* Category Filter */}
                          <select
                            value={productCategoryFilter}
                            onChange={(e) => {
                              setProductCategoryFilter(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                          >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <ul className="divide-y divide-gray-200">
                      {paginatedProducts.map(product => {
                    const discount = calculateDiscount(product.mrp, product.price);
                    return (
                      <li key={product.id} className="p-4 flex items-center justify-between hover:bg-gray-50 group transition-colors">
                        <div className="flex items-center flex-1">
                          <div className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            <img className="h-full w-full object-cover" src={product.imageUrl} alt={product.name} />
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                              {product.isFeatured && (
                                <Star size={14} className="text-yellow-500 fill-yellow-500 flex-shrink-0" title="Featured" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs flex-shrink-0">{product.category}</span>
                              {discount > 0 && (
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0">
                                  {discount}% OFF
                                </span>
                              )}
                              {!product.inStock && (
                                <span className="text-red-500 text-[10px] uppercase font-bold flex-shrink-0">Out of Stock</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {discount > 0 && (
                                <span className="text-xs text-gray-400 line-through">{formatINR(product.mrp)}</span>
                              )}
                              <span className="text-sm font-semibold text-gray-900">{formatINR(product.price)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleFeatured(product)}
                            className={`p-2 rounded-lg transition-colors ${
                              product.isFeatured 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-gray-300 hover:bg-gray-100'
                            }`}
                            title={product.isFeatured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <Star size={18} className={product.isFeatured ? 'fill-yellow-500' : ''} />
                          </button>
                          <button 
                            onClick={() => handleEditProduct(product)} 
                            className="text-gray-300 hover:text-blue-600 p-2 transition-colors rounded-lg hover:bg-blue-50"
                            title="Edit product"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                              <path d="m15 5 4 4"/>
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)} 
                            className="text-gray-300 hover:text-red-600 p-2 transition-colors rounded-lg hover:bg-red-50"
                            title="Delete product"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                      {paginatedProducts.length === 0 && filteredProducts.length === 0 && (
                        <li className="p-12 text-center text-gray-500">
                          <Package size={48} className="mx-auto text-gray-300 mb-3" />
                          <p>No products match your filters.</p>
                          <button
                            onClick={() => {
                              setProductCategoryFilter('all');
                              setProductSearchTerm('');
                            }}
                            className="mt-3 text-sm text-blue-600 hover:underline"
                          >
                            Clear filters
                          </button>
                        </li>
                      )}
                      {products.length === 0 && (
                        <li className="p-12 text-center text-gray-500">
                          <Package size={48} className="mx-auto text-gray-300 mb-3" />
                          <p>No products added yet.</p>
                        </li>
                      )}
                    </ul>

                    {/* Pagination - More Prominent */}
                    {filteredProducts.length > itemsPerPage && (
                      <div className="bg-gray-50 border-t-2 border-gray-300 px-6 py-5">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                            Showing <span className="font-bold text-black">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-black">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="font-bold text-black">{filteredProducts.length}</span> products
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 flex items-center gap-2 font-medium text-sm transition-all shadow-sm"
                            >
                              <ChevronLeft size={18} />
                              <span className="hidden sm:inline">Previous</span>
                            </button>
                            <div className="px-5 py-2.5 bg-black text-white rounded-lg font-bold text-sm shadow-md">
                              Page {currentPage} of {totalPages}
                            </div>
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage >= totalPages}
                              className="px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 flex items-center gap-2 font-medium text-sm transition-all shadow-sm"
                            >
                              <span className="hidden sm:inline">Next</span>
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Add Category Form */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow-md border border-gray-200 rounded-xl p-6 lg:sticky lg:top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Plus size={20} className="mr-2"/> New Category
                </h3>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category Name *</label>
                    <input 
                      placeholder="e.g. Dresses" 
                      required 
                      value={newCategory.name} 
                      onChange={e => setNewCategory({...newCategory, name: e.target.value})} 
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2.5"
                    />
                  </div>
                  
                  <ImageUpload
                    value={newCategory.imageUrl}
                    onChange={(base64) => setNewCategory({...newCategory, imageUrl: base64})}
                    label="Category Image *"
                  />
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea 
                      placeholder="Brief category description..." 
                      value={newCategory.description} 
                      onChange={e => setNewCategory({...newCategory, description: e.target.value})} 
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2.5 h-24"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition shadow-lg"
                  >
                    {editingCategoryId ? 'Save Changes' : 'Create Category'}
                  </button>
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={handleCancelCategoryEdit}
                      className="w-full mt-2 bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* Categories List */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow-md border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex justify-between items-center">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-gray-700">Categories</h2>
                  <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">{categories.length} categories</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                  {categories.map(category => {
                    const productCount = products.filter(p => p.category === category.name).length;
                    return (
                      <div key={category.id} className="group relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                        <div className="aspect-video w-full bg-gray-100 overflow-hidden">
                          {category.imageUrl ? (
                            <img 
                              src={category.imageUrl} 
                              alt={category.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FolderOpen size={48} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 text-lg">{category.name}</h3>
                          {category.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{category.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">{productCount} product{productCount !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="bg-white/90 backdrop-blur-sm text-gray-500 hover:text-black p-2 rounded-full shadow-md transition-colors hover:bg-gray-50"
                            title="Edit category"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            className="bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-600 p-2 rounded-full shadow-md transition-colors hover:bg-red-50"
                            title="Delete category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {categories.length === 0 && (
                    <div className="col-span-2 p-12 text-center text-gray-500">
                      <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
                      <p>No categories created yet.</p>
                      <p className="text-xs mt-1">Create your first category to organize products</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Contact Messages</h2>
                  <p className="text-sm text-gray-600 mt-1">Total: {contacts.length} messages</p>
                </div>
              </div>

              {/* Contact Messages Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contacts
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {new Date(contact.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">{contact.name}</div>
                            {contact.phone && (
                              <div className="text-xs text-gray-500 break-all">{contact.phone}</div>
                            )}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 break-all">
                            {contact.email}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="text-xs sm:text-sm text-gray-900 max-w-xs truncate">{contact.subject}</div>
                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">{contact.message}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <select
                              value={contact.status}
                              onChange={(e) => {
                                updateContactStatus(contact.id, e.target.value as ContactStatus);
                                fetchData();
                              }}
                              className={`text-xs font-semibold px-2 sm:px-3 py-1 rounded-full border-0 ${
                                contact.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                contact.status === 'read' ? 'bg-gray-100 text-gray-800' :
                                contact.status === 'replied' ? 'bg-green-100 text-green-800' :
                                'bg-gray-200 text-gray-600'
                              }`}
                            >
                              <option value="new">New</option>
                              <option value="read">Read</option>
                              <option value="replied">Replied</option>
                              <option value="archived">Archived</option>
                            </select>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-blue-600 hover:text-blue-800"
                                title="Reply via email"
                              >
                                <Mail size={16} />
                              </a>
                              {contact.phone && (
                                <button
                                  onClick={() => {
                                    const message = generateContactMessage(contact, whatsappTemplates.contactReply);
                                    sendWhatsAppMessage(contact.phone!, message);
                                  }}
                                  className="text-green-600 hover:text-green-800"
                                  title="Reply via WhatsApp"
                                >
                                  <MessageCircle size={16} />
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (confirm('Delete this message?')) {
                                    await deleteContactMessage(contact.id);
                                    fetchData();
                                  }
                                }}
                                className="text-red-600 hover:text-red-800"
                                title="Delete message"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {contacts.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Mail size={48} className="mx-auto text-gray-300 mb-3" />
                    <p>No contact messages yet.</p>
                    <p className="text-xs mt-1">Messages from the contact form will appear here</p>
                  </div>
                )}
              </div>

              {/* Pagination - More Prominent */}
              {contacts.length > itemsPerPage && (
                <div className="bg-gray-50 border-t-2 border-gray-300 px-6 py-5 mt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                      Showing <span className="font-bold text-black">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-black">{Math.min(currentPage * itemsPerPage, contacts.length)}</span> of <span className="font-bold text-black">{contacts.length}</span> messages
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 flex items-center gap-2 font-medium text-sm transition-all shadow-sm"
                      >
                        <ChevronLeft size={18} />
                        <span className="hidden sm:inline">Previous</span>
                      </button>
                      <div className="px-5 py-2.5 bg-black text-white rounded-lg font-bold text-sm shadow-md">
                        Page {currentPage} of {Math.ceil(contacts.length / itemsPerPage)}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(Math.ceil(contacts.length / itemsPerPage), prev + 1))}
                        disabled={currentPage >= Math.ceil(contacts.length / itemsPerPage)}
                        className="px-5 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 flex items-center gap-2 font-medium text-sm transition-all shadow-sm"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* WHATSAPP TAB */}
        {activeTab === 'whatsapp' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                  <MessageCircle size={24} className="text-green-500" />
                  WhatsApp Message Templates
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  Customize message templates for sending WhatsApp notifications to customers. 
                  Use placeholders like {'{customerName}'}, {'{orderId}'}, {'{totalAmount}'}, etc.
                </p>
              </div>

              <div className="space-y-6">
                {/* Order Confirmation Template */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Order Confirmation</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                      Pending Orders
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Sent when order is placed or in pending/processing status
                  </p>
                  <textarea
                    value={whatsappTemplates.orderConfirmation}
                    onChange={(e) => setWhatsappTemplates({...whatsappTemplates, orderConfirmation: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-4 text-sm font-mono focus:ring-2 focus:ring-black focus:border-transparent"
                    rows={12}
                  />
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <strong>Available placeholders:</strong> {'{customerName}'}, {'{orderId}'}, {'{totalAmount}'}, {'{status}'}
                  </div>
                </div>

                {/* Order Shipped Template */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Order Shipped</h3>
                    <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-semibold">
                      Shipped Orders
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Sent when order status is changed to shipped
                  </p>
                  <textarea
                    value={whatsappTemplates.orderShipped}
                    onChange={(e) => setWhatsappTemplates({...whatsappTemplates, orderShipped: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-4 text-sm font-mono focus:ring-2 focus:ring-black focus:border-transparent"
                    rows={10}
                  />
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <strong>Available placeholders:</strong> {'{customerName}'}, {'{orderId}'}, {'{items}'}
                  </div>
                </div>

                {/* Order Delivered Template */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Order Delivered</h3>
                    <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">
                      Delivered Orders
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Sent when order status is changed to delivered
                  </p>
                  <textarea
                    value={whatsappTemplates.orderDelivered}
                    onChange={(e) => setWhatsappTemplates({...whatsappTemplates, orderDelivered: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-4 text-sm font-mono focus:ring-2 focus:ring-black focus:border-transparent"
                    rows={10}
                  />
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <strong>Available placeholders:</strong> {'{customerName}'}, {'{orderId}'}
                  </div>
                </div>

                {/* Contact Reply Template */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Contact Reply</h3>
                    <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold">
                      Contact Messages
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Sent when replying to contact form submissions via WhatsApp
                  </p>
                  <textarea
                    value={whatsappTemplates.contactReply}
                    onChange={(e) => setWhatsappTemplates({...whatsappTemplates, contactReply: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg p-4 text-sm font-mono focus:ring-2 focus:ring-black focus:border-transparent"
                    rows={10}
                  />
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded">
                    <strong>Available placeholders:</strong> {'{name}'}, {'{subject}'}
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      localStorage.setItem('whatsappTemplates', JSON.stringify(whatsappTemplates));
                      alert('WhatsApp templates saved successfully!');
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg"
                  >
                    <MessageCircle size={18} />
                    Save Templates
                  </button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <MessageCircle size={18} />
                    How to Use WhatsApp Messaging
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">1.</span>
                      <span>Go to <strong>Orders</strong> tab and click the green <strong>WhatsApp</strong> button next to any order</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">2.</span>
                      <span>The appropriate template will be used based on order status (pending/shipped/delivered)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">3.</span>
                      <span>For <strong>Contacts</strong>, click the WhatsApp icon to send a reply message</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">4.</span>
                      <span>WhatsApp Web will open with the pre-filled message - review and send</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold mt-0.5">5.</span>
                      <span>Make sure customer phone numbers include country code (e.g., 91 for India)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-8 text-white">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Settings size={28} />
                  Website Settings
                </h2>
                <p className="text-purple-100">Customize all content displayed on your website</p>
              </div>

              {isLoadingSettings ? (
                <div className="p-12 text-center">
                  <LottieLoader size="lg" text="Loading settings..." />
                </div>
              ) : websiteSettings ? (
                <div className="p-6 space-y-8">
                  {/* Logo & Title Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Logo & Site Title</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Site Logo</label>
                        <div className="flex flex-col gap-4">
                          {websiteSettings.siteLogo && (
                            <div className="w-full bg-gray-100 rounded-lg p-4 flex items-center justify-center h-32">
                              <img 
                                src={websiteSettings.siteLogo} 
                                alt="Site Logo" 
                                className="max-h-28 max-w-xs object-contain"
                              />
                            </div>
                          )}
                          <ImageUpload
                            value={websiteSettings.siteLogo}
                            onChange={(url) => setWebsiteSettings({...websiteSettings, siteLogo: url})}
                            label="Upload Logo"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Site Title</label>
                        <input
                          type="text"
                          value={websiteSettings.siteTitle}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, siteTitle: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., Wisania - Women's Fashion"
                        />
                        <p className="text-xs text-gray-500 mt-2">This appears in browser tab and search results</p>
                      </div>
                    </div>
                  </div>

                  {/* Hero Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Hero Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Title</label>
                        <textarea
                          value={websiteSettings.heroTitle}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, heroTitle: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={2}
                          placeholder="e.g., Elegance is an attitude."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Subtitle</label>
                        <input
                          type="text"
                          value={websiteSettings.heroSubtitle}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, heroSubtitle: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., New Season Collection"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Description</label>
                        <textarea
                          value={websiteSettings.heroDescription}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, heroDescription: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Button Text</label>
                        <input
                          type="text"
                          value={websiteSettings.heroButtonText}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, heroButtonText: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="e.g., Shop Now"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Image URL</label>
                        <ImageUpload
                          value={websiteSettings.heroImage}
                          onChange={(url) => setWebsiteSettings({...websiteSettings, heroImage: url})}
                          label="Upload Hero Image"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Brand Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Brand Section</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Quote</label>
                        <input
                          type="text"
                          value={websiteSettings.brandQuote}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, brandQuote: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Tagline</label>
                        <input
                          type="text"
                          value={websiteSettings.brandTagline}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, brandTagline: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email 1</label>
                        <input
                          type="email"
                          value={websiteSettings.contactEmail1}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, contactEmail1: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email 2</label>
                        <input
                          type="email"
                          value={websiteSettings.contactEmail2}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, contactEmail2: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={websiteSettings.contactPhone}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, contactPhone: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="+919876543210"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Display Format</label>
                        <input
                          type="text"
                          value={websiteSettings.contactPhoneDisplay}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, contactPhoneDisplay: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                        <input
                          type="text"
                          value={websiteSettings.contactAddress}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, contactAddress: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={websiteSettings.contactCity}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, contactCity: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                        <input
                          type="text"
                          value={websiteSettings.contactState}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, contactState: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                        <input
                          type="text"
                          value={websiteSettings.contactZip}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, contactZip: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                        <input
                          type="text"
                          value={websiteSettings.contactCountry}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, contactCountry: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Hours */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Business Hours</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Monday - Friday</label>
                        <input
                          type="text"
                          value={websiteSettings.mondayFriday}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, mondayFriday: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Saturday</label>
                        <input
                          type="text"
                          value={websiteSettings.saturday}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, saturday: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Sunday</label>
                        <input
                          type="text"
                          value={websiteSettings.sunday}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, sunday: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Holidays</label>
                        <input
                          type="text"
                          value={websiteSettings.holidays}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, holidays: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Page Sections */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Page Section Titles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Featured Products Title</label>
                        <input
                          type="text"
                          value={websiteSettings.featuredTitle}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, featuredTitle: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Featured Products Subtitle</label>
                        <input
                          type="text"
                          value={websiteSettings.featuredSubtitle}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, featuredSubtitle: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Categories Title</label>
                        <input
                          type="text"
                          value={websiteSettings.categoriesTitle}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, categoriesTitle: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Categories Subtitle</label>
                        <input
                          type="text"
                          value={websiteSettings.categoriesSubtitle}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, categoriesSubtitle: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Section Title</label>
                        <input
                          type="text"
                          value={websiteSettings.contactTitle}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, contactTitle: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Section Description</label>
                        <textarea
                          value={websiteSettings.contactDescription}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, contactDescription: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEO & Meta */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">SEO & Meta Tags</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Site Description</label>
                        <textarea
                          value={websiteSettings.siteDescription}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, siteDescription: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Keywords (comma-separated)</label>
                        <input
                          type="text"
                          value={websiteSettings.siteKeywords}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, siteKeywords: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Social Media Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Facebook</label>
                        <input
                          type="url"
                          value={websiteSettings.facebook}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, facebook: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="https://facebook.com/wisania"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram</label>
                        <input
                          type="url"
                          value={websiteSettings.instagram}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, instagram: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="https://instagram.com/wisania"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Twitter</label>
                        <input
                          type="url"
                          value={websiteSettings.twitter}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, twitter: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="https://twitter.com/wisania"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Pinterest</label>
                        <input
                          type="url"
                          value={websiteSettings.pinterest}
                          onChange={(e) => setWebsiteSettings({...websiteSettings, pinterest: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="https://pinterest.com/wisania"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cache Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Cache Version:</span>
                      <span className="font-mono font-semibold text-gray-800">{websiteSettings.version}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-mono text-gray-800">
                        {new Date(websiteSettings.lastUpdated).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg"
                    >
                      {isSavingSettings ? (
                        <>
                          <LottieLoader size="lg" className="inline-block" />
                          <span className="ml-2">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Settings size={18} />
                          Save Settings
                        </>
                      )}
                    </button>
                  </div>

                  {/* Instructions */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <Settings size={18} />
                      How Website Settings Work
                    </h4>
                    <ul className="space-y-2 text-sm text-purple-800">
                      <li className="flex items-start gap-2">
                        <span className="font-bold mt-0.5">•</span>
                        <span>All content is cached in localStorage for fast loading</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold mt-0.5">•</span>
                        <span>When you save, a unique hash is generated to invalidate old cache</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold mt-0.5">•</span>
                        <span>Changes are synced across all devices automatically</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold mt-0.5">•</span>
                        <span>Refresh your website after saving to see the changes</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <p>Failed to load settings. Please try refreshing the page.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
