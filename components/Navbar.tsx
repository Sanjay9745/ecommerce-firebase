import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getWebsiteSettings, WebsiteSettings } from '../services/websiteSettings';

const Navbar: React.FC = () => {
  const { cartCount, toggleCart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [settings, setSettings] = React.useState<WebsiteSettings | null>(null);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  React.useEffect(() => {
    getWebsiteSettings().then(setSettings);
  }, []);

  if (isAdmin) return null;

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 hover:text-black transition">
              {isMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>

          {/* Logo */}
          <div className="flex-1 flex justify-center md:justify-start">
            <Link to="/" className="flex items-center gap-3">
              {settings?.siteLogo ? (
                <img 
                  src={settings.siteLogo} 
                  alt={settings?.siteTitle || 'Wisania'} 
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <span className="text-3xl font-serif font-medium tracking-widest text-brand-black uppercase">
                  {settings?.siteTitle || 'Wisania'}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            <Link to="/" onClick={() => window.scrollTo(0, 0)} className="text-sm uppercase tracking-wide font-medium text-gray-500 hover:text-black transition-colors">Home</Link>
            <Link to="/shop" className="text-sm uppercase tracking-wide font-medium text-gray-500 hover:text-black transition-colors">Products</Link>
            <Link to="/track-order" className="text-sm uppercase tracking-wide font-medium text-gray-500 hover:text-black transition-colors">Track Order</Link>
            <Link to="/#contact" className="text-sm uppercase tracking-wide font-medium text-gray-500 hover:text-black transition-colors">Contact</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-6 justify-end flex-1 md:flex-none">
            <button 
              onClick={toggleCart} 
              className="p-2 text-gray-800 hover:text-black transition relative group"
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-black rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-lg transition-all duration-300 ease-in-out origin-top ${isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 h-0 overflow-hidden'}`}>
        <div className="px-6 py-6 space-y-4">
          <Link to="/" className="block text-lg font-serif text-gray-800" onClick={() => { setIsMenuOpen(false); window.scrollTo(0, 0); }}>Home</Link>
          <Link to="/shop" className="block text-lg font-serif text-gray-800" onClick={() => setIsMenuOpen(false)}>Products</Link>
          <Link to="/track-order" className="block text-lg font-serif text-gray-800" onClick={() => setIsMenuOpen(false)}>Track Order</Link>
          <Link to="/#contact" className="block text-lg font-serif text-gray-800" onClick={() => setIsMenuOpen(false)}>Contact</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;