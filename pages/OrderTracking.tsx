import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Order } from '../types';
import { Package, Truck, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get('id') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const trackOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const ordersRef = collection(db, 'orders');
      const orderNumberInt = parseInt(orderId.trim());
      
      // Search by orderNumber (new format with incremental numbers)
      if (!isNaN(orderNumberInt)) {
        const q = query(ordersRef, where('orderNumber', '==', orderNumberInt));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const orderData = querySnapshot.docs[0].data() as Order;
          setOrder({ ...orderData, id: querySnapshot.docs[0].id });
          setLoading(false);
          return;
        }
      }

      // If not found, search by document ID (for old orders without orderNumber)
      const allOrdersSnapshot = await getDocs(ordersRef);
      const foundOrder = allOrdersSnapshot.docs.find(doc => doc.id === orderId.trim());

      if (foundOrder) {
        const orderData = foundOrder.data() as Order;
        setOrder({ ...orderData, id: foundOrder.id });
      } else {
        setError('Order not found. Please check your order number.');
        setOrder(null);
      }
    } catch (err) {
      console.error('Error tracking order:', err);
      setError('Failed to track order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-track when ID is in URL
  useEffect(() => {
    if (orderId) {
      trackOrder();
    }
  }, []);

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'processing':
        return <Package className="w-6 h-6 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-6 h-6 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-500" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
    }
  };

  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    return status === 'paid' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-orange-100 text-orange-800';
  };

  const statusTimeline = [
    { status: 'pending', label: 'Order Placed' },
    { status: 'processing', label: 'Processing' },
    { status: 'shipped', label: 'Shipped' },
    { status: 'delivered', label: 'Delivered' },
  ];

  const getStatusIndex = (status: Order['status']) => {
    if (status === 'cancelled') return -1;
    return statusTimeline.findIndex(s => s.status === status);
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Track Your Order</h1>

      <form onSubmit={trackOrder} className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter Order Number (e.g., 1001)"
            className="flex-1 px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-emerald-600 text-white text-sm sm:text-base rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {loading ? 'Tracking...' : 'Track Order'}
          </button>
        </div>
        {error && (
          <p className="text-red-600 mt-2 text-xs sm:text-sm">{error}</p>
        )}
      </form>

      {order && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order Header */}
          <div className="border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 break-words">Order #{order.orderNumber || order.id.slice(0, 8)}</h2>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                {order.estimatedDeliveryDate && (
                  <p className="text-emerald-600 text-xs sm:text-sm mt-1 font-medium">
                    Est. Delivery: {new Date(order.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 whitespace-nowrap ${getPaymentStatusColor(order.paymentStatus)}`}>
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                  {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          {order.status !== 'cancelled' && (
            <div className="py-3 sm:py-4 overflow-x-auto">
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Order Status</h3>
              <div className="relative min-w-[320px] sm:min-w-0">
                <div className="absolute top-4 sm:top-5 left-0 w-full h-0.5 bg-gray-200"></div>
                <div
                  className="absolute top-4 sm:top-5 left-0 h-0.5 bg-emerald-600 transition-all duration-500"
                  style={{
                    width: `${(getStatusIndex(order.status) / (statusTimeline.length - 1)) * 100}%`
                  }}
                ></div>
                <div className="relative flex justify-between px-2 sm:px-0">
                  {statusTimeline.map((item, index) => {
                    const isCompleted = getStatusIndex(order.status) >= index;
                    return (
                      <div key={item.status} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                            isCompleted ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {React.cloneElement(getStatusIcon(item.status as Order['status']) as React.ReactElement, {
                            className: 'w-4 h-4 sm:w-6 sm:h-6'
                          })}
                        </div>
                        <span className={`mt-1 sm:mt-2 text-[10px] sm:text-xs font-medium text-center max-w-[60px] sm:max-w-none leading-tight ${
                          isCompleted ? 'text-emerald-600' : 'text-gray-400'
                        }`}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {order.status === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Order Cancelled</h3>
                <p className="text-sm text-red-700">This order has been cancelled.</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Order Items</h3>
            <div className="space-y-3 sm:space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 sm:gap-4 border-b pb-3 sm:pb-4 last:border-b-0">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm sm:text-base truncate">{item.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-xs sm:text-sm font-medium text-emerald-600">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 border-t pt-4">
            <div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Customer Information</h3>
              <p className="text-xs sm:text-sm text-gray-600 break-words">{order.customerName}</p>
              <p className="text-xs sm:text-sm text-gray-600 break-all">{order.email}</p>
              <p className="text-xs sm:text-sm text-gray-600 break-all">{order.phone}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sm sm:text-base">Shipping Address</h3>
              <p className="text-xs sm:text-sm text-gray-600 break-words">{order.address}</p>
            </div>
          </div>

          {/* Order Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-base sm:text-lg font-semibold">Total Amount</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-600">
                ₹{order.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
