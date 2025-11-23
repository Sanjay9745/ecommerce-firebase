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
      const q = query(ordersRef, where('id', '==', orderId.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Order not found. Please check your order ID.');
        setOrder(null);
      } else {
        const orderData = querySnapshot.docs[0].data() as Order;
        setOrder(orderData);
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8">Track Your Order</h1>

      <form onSubmit={trackOrder} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter your Order ID"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Tracking...' : 'Track'}
          </button>
        </div>
        {error && (
          <p className="text-red-600 mt-2 text-sm">{error}</p>
        )}
      </form>

      {order && (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Order Header */}
          <div className="border-b pb-4">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Order #{order.id}</h2>
                <p className="text-gray-600 text-sm">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getPaymentStatusColor(order.paymentStatus)}`}>
                  <CreditCard className="w-4 h-4" />
                  {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          {order.status !== 'cancelled' && (
            <div className="py-4">
              <h3 className="font-semibold mb-4">Order Status</h3>
              <div className="relative">
                <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200"></div>
                <div
                  className="absolute top-5 left-0 h-0.5 bg-emerald-600 transition-all duration-500"
                  style={{
                    width: `${(getStatusIndex(order.status) / (statusTimeline.length - 1)) * 100}%`
                  }}
                ></div>
                <div className="relative flex justify-between">
                  {statusTimeline.map((item, index) => {
                    const isCompleted = getStatusIndex(order.status) >= index;
                    return (
                      <div key={item.status} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isCompleted ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {getStatusIcon(item.status as Order['status'])}
                        </div>
                        <span className={`mt-2 text-xs font-medium text-center ${
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
            <h3 className="font-semibold mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b pb-4 last:border-b-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    <p className="text-sm font-medium text-emerald-600">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Information */}
          <div className="grid md:grid-cols-2 gap-6 border-t pt-4">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <p className="text-sm text-gray-600">{order.customerName}</p>
              <p className="text-sm text-gray-600">{order.email}</p>
              <p className="text-sm text-gray-600">{order.phone}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <p className="text-sm text-gray-600">{order.address}</p>
            </div>
          </div>

          {/* Order Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="text-2xl font-bold text-emerald-600">
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
