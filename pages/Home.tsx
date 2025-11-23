import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Tag } from 'lucide-react';
import { getFeaturedProducts, getCategories } from '../services/db';
import { Product, Category, formatINR, calculateDiscount } from '../types';
import { useCart } from '../context/CartContext';
import Contact from '../components/Contact';

const Home: React.FC = () => {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredData, categoriesData] = await Promise.all([
          getFeaturedProducts(8),
          getCategories()
        ]);
        setFeatured(featuredData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative h-[85vh] bg-stone-100 overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover object-top opacity-90"
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
            alt="Woman in luxury clothing"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <p className="text-sm md:text-base uppercase tracking-[0.2em] mb-4 font-medium text-white/90">New Season Collection</p>
            <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight mb-6 leading-tight">
              Elegance is <br/> an attitude.
            </h1>
            <p className="mt-4 text-lg text-white/90 max-w-lg font-light leading-relaxed mb-10">
              Discover Wisania's exclusive selection of women's wear. Timeless cuts, premium fabrics, and sophistication for the modern woman.
            </p>
            <Link 
              to="/shop" 
              className="inline-flex items-center px-10 py-4 bg-white text-black text-sm uppercase tracking-widest font-medium hover:bg-black hover:text-white transition duration-300 ease-out"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-gray-900 mb-4">Curated Categories</h2>
            <p className="text-gray-500 font-light">Explore our most popular collections</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <Link key={cat.id} to={`/shop?category=${cat.name}`} className="group relative h-[500px] overflow-hidden bg-gray-100 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <img 
                  src={cat.imageUrl} 
                  alt={cat.name} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-white text-3xl font-serif italic">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-white/90 text-sm mt-2">{cat.description}</p>
                  )}
                  <span className="inline-block mt-2 text-white text-xs uppercase tracking-widest border-b border-white pb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                    View Products
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products */}
      <div className="bg-stone-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12 border-b border-gray-200 pb-4">
             <div>
               <h2 className="text-2xl font-serif text-gray-900">Featured Products</h2>
               <p className="text-sm text-gray-500 mt-1">Handpicked items just for you</p>
             </div>
             <Link to="/shop" className="text-sm uppercase tracking-wide font-medium text-gray-500 hover:text-black flex items-center transition-colors">
                View all <ArrowRight size={16} className="ml-2"/>
             </Link>
          </div>
          
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8">
              {featured.map((product) => {
                const discount = product.mrp && product.mrp > product.price
                  ? calculateDiscount(product.mrp, product.price)
                  : 0;

                return (
                  <div key={product.id} className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                    {/* Featured Badge */}
                    <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                      <Star size={12} fill="currentColor" />
                      Featured
                    </div>

                    {/* Discount Badge */}
                    {discount > 0 && (
                      <div className="absolute top-4 right-4 z-10 bg-green-600 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Tag size={12} />
                        {discount}% OFF
                      </div>
                    )}

                    {/* Product Image */}
                    <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-gray-100">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-white font-semibold text-sm uppercase tracking-wide">Out of Stock</span>
                        </div>
                      )}
                    </Link>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link to={`/product/${product.id}`} className="block">
                        <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">{product.category}</p>

                      {/* Pricing */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-gray-900">{formatINR(product.price)}</span>
                        {product.mrp && product.mrp > product.price && (
                          <span className="text-sm text-gray-500 line-through">{formatINR(product.mrp)}</span>
                        )}
                      </div>

                      {/* Quick Add Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (product.inStock) {
                            addToCart(product);
                          }
                        }}
                        disabled={!product.inStock}
                        className="w-full py-2 bg-black text-white text-sm font-semibold uppercase tracking-wider rounded hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {product.inStock ? 'Quick Add' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500">No featured products available at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Newsletter / Brand Promise */}
      <div className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif italic mb-6">"Simplicity is the keynote of all true elegance."</h2>
          <p className="text-gray-400 text-sm uppercase tracking-widest">Wisania Women's Collection 2025</p>
        </div>
      </div>

      {/* Contact Section */}
      <Contact />
    </div>
  );
};

export default Home;