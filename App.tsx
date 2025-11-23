import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import { CartProvider } from './context/CartContext';
// Compatibility: when the app is served with path-style URLs (e.g. /admin)
// but the app uses HashRouter, redirect path-style routes to hash routes
// so direct navigation/bookmarks like http://host/admin still work.
if (typeof window !== 'undefined') {
  const pathname = window.location.pathname || '/';
  // Only redirect top-level app paths (avoid redirecting real static assets)
  const appPaths = ['/admin', '/shop', '/product', '/checkout'];
  const shouldRedirect = appPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
  if (shouldRedirect && !window.location.hash.startsWith('#')) {
    const targetHash = `#${pathname}${window.location.search || ''}${window.location.hash || ''}`;
    // Replace so browser history isn't polluted
    window.location.replace(`${window.location.origin}/${targetHash}`);
  }
}
// Scroll to hash on navigation
const ScrollToHash = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const elementId = location.hash.replace('#', '');
      const element = document.getElementById(elementId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [location]);

  return null;
};

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

// Components
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';

// Protected Route Wrapper for Admin
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check if user has admin custom claim
        const idTokenResult = await currentUser.getIdTokenResult();
        setIsAdmin(idTokenResult.claims.admin === true);
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <CartProvider>
      <Router>
        <div className="min-h-screen bg-white text-brand-black font-sans">
          <ScrollToHash />
          <Navbar />
          <CartDrawer />
          <Routes>
            {/* Guest Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
};

export default App;