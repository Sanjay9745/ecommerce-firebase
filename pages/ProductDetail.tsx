import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProducts } from '../services/db';
import { Product, formatINR, calculateDiscount } from '../types';
import { useCart } from '../context/CartContext';
import { Check, Truck, ShieldCheck, Tag } from 'lucide-react';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const { addToCart } = useCart();

  useEffect(() => {
    const fetch = async () => {
      const all = await getProducts();
      const found = all.find(p => p.id === id);
      setProduct(found || null);
      if (found) {
        setSelectedImage(found.imageUrl);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Product not found.</div>;

  // Combine main image with additional images
  const allImages = [product.imageUrl, ...(product.images || [])].filter(img => img);

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          
          {/* Image Gallery */}
          <div className="flex flex-col">
            {/* Main Image */}
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-center object-cover"
              />
            </div>
            
            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className={`aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 transition-all ${
                      selectedImage === image 
                        ? 'border-black shadow-lg' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-center object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-serif font-extrabold tracking-tight text-gray-900">{product.name}</h1>
            
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-gray-900">{formatINR(product.price)}</p>
                {product.mrp && product.mrp > product.price && (
                  <>
                    <p className="text-xl text-gray-500 line-through">{formatINR(product.mrp)}</p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-100 text-green-800 text-sm font-semibold">
                      <Tag size={14} />
                      {calculateDiscount(product.mrp, product.price)}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-gray-700 space-y-6" dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>

            <div className="mt-6">
               <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {product.inStock ? (
                      <span className="flex items-center text-green-600"><Check size={16} className="mr-1"/> In Stock</span>
                  ) : (
                      <span className="text-red-600">Out of Stock</span>
                  )}
               </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => addToCart(product)}
                disabled={!product.inStock}
                className="flex-1 bg-white border-2 border-black rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-200 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {product.inStock ? 'Add to Cart' : 'Unavailable'}
              </button>
              <button
                onClick={() => {
                  addToCart(product);
                  navigate('/checkout');
                }}
                disabled={!product.inStock}
                className="flex-1 bg-black border-2 border-black rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {product.inStock ? 'Buy Now' : 'Unavailable'}
              </button>
            </div>

            <section className="mt-10 border-t border-gray-200 pt-10">
               <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2">
                 <div className="flex items-center space-x-2 text-sm text-gray-500">
                   <Truck size={20} />
                   <span>Free shipping on orders over ₹5,000</span>
                 </div>
                 <div className="flex items-center space-x-2 text-sm text-gray-500">
                   <ShieldCheck size={20} />
                   <span>2-year quality guarantee</span>
                 </div>
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;