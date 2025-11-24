import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/db';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { formatINR } from '../types';

const Checkout: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    countryCode: '+91',
    phone: '',
    address: '',
    city: '',
    zip: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.zip}`;
      const fullPhone = `${formData.countryCode}${formData.phone}`;
      
      const result = await createOrder({
        customerName: formData.customerName,
        email: formData.email,
        phone: fullPhone,
        address: fullAddress,
        items: cart,
        totalAmount: cartTotal,
      });

      // Simulate email notification logic (would be server-side)
      console.log(`Sending email to ${formData.email}... (Mock)`);
      console.log(`Order #${result.orderNumber} created`);
      
      setOrderNumber(result.orderNumber);
      clearCart();
      setSuccess(true);
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Order Placed Successfully!</h2>
            {orderNumber && (
              <p className="mt-2 text-lg font-semibold text-gray-900">
                Order #{orderNumber}
              </p>
            )}
            <p className="mt-2 text-gray-600">
              Thank you for shopping with Wisania. An email confirmation has been sent to {formData.email}.
            </p>
            {orderNumber && (
              <button 
                onClick={() => navigate(`/track-order?id=${orderNumber}`)}
                className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Track Your Order
              </button>
            )}
            <button 
              onClick={() => navigate('/')}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium">Your cart is empty</h2>
          <button onClick={() => navigate('/shop')} className="mt-4 text-blue-600 hover:underline">Go to Shop</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8">Checkout</h1>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        {/* Order Summary */}
        <div className="lg:col-span-5 bg-gray-50 p-6 rounded-lg mb-8 lg:mb-0 lg:order-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
          <ul className="divide-y divide-gray-200">
            {cart.map(item => (
              <li key={item.id} className="py-4 flex">
                <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded object-cover" />
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium">{formatINR(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between">
            <span className="text-base font-medium text-gray-900">Total</span>
            <span className="text-base font-bold text-gray-900">{formatINR(cartTotal)}</span>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-7 lg:order-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input required type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <div className="mt-1 flex gap-2">
                  <select 
                    name="countryCode" 
                    value={formData.countryCode} 
                    onChange={handleChange}
                    className="w-32 border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+65">🇸🇬 +65</option>
                    <option value="+60">🇲🇾 +60</option>
                    <option value="+92">🇵🇰 +92</option>
                    <option value="+880">🇧🇩 +880</option>
                    <option value="+94">🇱🇰 +94</option>
                    <option value="+977">🇳🇵 +977</option>
                  </select>
                  <input 
                    required 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2" 
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">WhatsApp messages will be sent to this number</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input required type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2" />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input required type="text" name="city" value={formData.city} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2" />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">ZIP / Postal Code</label>
                <input required type="text" name="zip" value={formData.zip} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black sm:text-sm border p-2" />
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : `Pay ${formatINR(cartTotal)} (Cash/Manual)`}
            </button>
            <p className="text-xs text-center text-gray-500">Payment integration not active. Order will be marked as Pending.</p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;