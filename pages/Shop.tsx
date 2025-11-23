import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { getProducts, getCategories } from '../services/db';
import { Product, Category, formatINR, calculateDiscount } from '../types';
import { SlidersHorizontal, Tag, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Shop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const categoryFilter = searchParams.get('category');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allProducts, allCategories] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        
        let filtered = allProducts;
        
        // Filter by category
        if (categoryFilter) {
          filtered = filtered.filter(p => p.category === categoryFilter);
        }
        
        // Filter by search term
        if (searchTerm) {
          filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        setProducts(filtered);
        setCategories(allCategories);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryFilter, searchTerm]);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-medium text-gray-900 mb-2">
              {categoryFilter ? categoryFilter : 'All Products'}
            </h1>
            <p className="text-sm sm:text-base text-gray-500 font-light">
              {products.length} items available
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="sticky top-20 z-20 bg-white/95 backdrop-blur py-4 border-b border-gray-100 mb-8 flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center text-xs sm:text-sm font-medium text-gray-900 mr-2 sm:mr-4">
            <SlidersHorizontal size={16} className="mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Filter by:</span>
            <span className="sm:hidden">Filter:</span>
          </div>
          
          <Link 
            to="/shop" 
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm border transition-colors ${!categoryFilter ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
          >
            All
          </Link>
          {categories.map(cat => (
            <Link 
              key={cat.id} 
              to={`/shop?category=${cat.name}`}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm border transition-colors ${categoryFilter === cat.name ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
            {products.length > 0 ? products.map((product) => {
              const discount = product.mrp && product.mrp > product.price
                ? calculateDiscount(product.mrp, product.price)
                : 0;

              return (
                <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col">
                  {/* Image Section - Clickable */}
                  <Link to={`/product/${product.id}`} className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden flex-shrink-0 block">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-center object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    
                    {/* Discount Badge */}
                    {discount > 0 && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-xs font-bold flex items-center gap-0.5 sm:gap-1 shadow-lg">
                        <Tag size={10} className="sm:hidden" />
                        <Tag size={14} className="hidden sm:block" />
                        <span>{discount}% OFF</span>
                      </div>
                    )}
                    
                    {/* Out of Stock Overlay */}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-white/90 px-4 py-2 rounded-full">
                          <span className="text-gray-900 font-bold text-xs uppercase tracking-wider">Out of Stock</span>
                        </div>
                      </div>
                    )}
                  </Link>

                  {/* Content Section */}
                  <div className="flex-1 p-3 sm:p-5 flex flex-col">
                    {/* Category Badge */}
                    <span className="inline-block px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gray-100 text-gray-600 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider rounded-full mb-1 sm:mb-2 self-start">
                      {product.category}
                    </span>
                    
                    {/* Product Name */}
                    <Link to={`/product/${product.id}`} className="block mb-2 sm:mb-3">
                      <h3 className="text-xs sm:text-base font-bold text-gray-900 hover:text-gray-700 transition-colors line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {/* Pricing */}
                    <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-4">
                      <span className="text-sm sm:text-xl font-bold text-gray-900">{formatINR(product.price)}</span>
                      {product.mrp && product.mrp > product.price && (
                        <span className="text-xs sm:text-sm text-gray-400 line-through">{formatINR(product.mrp)}</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {product.inStock ? (
                      <div className="flex flex-col gap-1.5 sm:gap-2 mt-auto">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart(product);
                          }}
                          className="w-full bg-white border-2 border-black text-black py-1.5 sm:py-2.5 px-2 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white active:scale-95 transition-all duration-200 rounded-lg"
                        >
                          Add to Cart
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/product/${product.id}`);
                          }}
                          className="w-full bg-black text-white py-1.5 sm:py-2.5 px-2 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-gray-800 active:scale-95 transition-all duration-200 rounded-lg shadow-lg"
                        >
                          Buy Now
                        </button>
                      </div>
                    ) : (
                      <div className="mt-auto">
                        <div className="w-full bg-gray-300 text-gray-600 py-1.5 sm:py-2.5 px-2 sm:px-4 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg text-center">
                          Out of Stock
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full text-center py-32 bg-gray-50">
                <p className="text-gray-500 text-lg font-serif italic">No exquisite items found in this collection.</p>
                <Link to="/shop" className="mt-4 inline-block text-xs uppercase tracking-widest border-b border-black">View All</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;