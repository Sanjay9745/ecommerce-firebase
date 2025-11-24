import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProducts } from '../services/db';
import { Product, formatINR, calculateDiscount } from '../types';
import { useCart } from '../context/CartContext';
import { Check, Truck, ShieldCheck, Tag, ChevronLeft, ChevronRight, X } from 'lucide-react';
import LottieLoader from '../components/LottieLoader';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const { addToCart } = useCart();

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    const fetch = async () => {
      const all = await getProducts();
      const found = all.find(p => p.id === id);
      setProduct(found || null);
      if (found) {
        setSelectedImage(found.imageUrl);
        setSelectedImageIndex(0);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  // Auto-play carousel
  useEffect(() => {
    if (!product || !isAutoPlaying) return;
    
    const allImages = [product.imageUrl, ...(product.images || [])].filter(img => img);
    if (allImages.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % allImages.length;
        setSelectedImage(allImages[nextIndex]);
        return nextIndex;
      });
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [product, isAutoPlaying]);

  const handleImageClick = (image: string, index: number) => {
    setSelectedImage(image);
    setSelectedImageIndex(index);
    setIsAutoPlaying(false); // Pause auto-play when user manually selects
  };

  const handlePrevImage = () => {
    if (!product) return;
    const allImages = [product.imageUrl, ...(product.images || [])].filter(img => img);
    const newIndex = selectedImageIndex === 0 ? allImages.length - 1 : selectedImageIndex - 1;
    setSelectedImage(allImages[newIndex]);
    setSelectedImageIndex(newIndex);
    setIsAutoPlaying(false);
  };

  const handleNextImage = () => {
    if (!product) return;
    const allImages = [product.imageUrl, ...(product.images || [])].filter(img => img);
    const newIndex = (selectedImageIndex + 1) % allImages.length;
    setSelectedImage(allImages[newIndex]);
    setSelectedImageIndex(newIndex);
    setIsAutoPlaying(false);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNextImage();
    } else if (isRightSwipe) {
      handlePrevImage();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><LottieLoader size="lg" text="Loading..." /></div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Product not found.</div>;

  // Combine main image with additional images
  const allImages = [product.imageUrl, ...(product.images || [])].filter(img => img);

  return (
    <div className="bg-white">
      {/* Image Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X size={32} />
          </button>
          
          <div 
            className="relative w-full max-w-5xl"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-auto max-h-[90vh] object-contain"
            />
            
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                  className="hidden sm:block absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                >
                  <ChevronLeft size={24} className="text-black" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                  className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all"
                >
                  <ChevronRight size={24} className="text-black" />
                </button>
                
                {/* Mobile swipe hint */}
                <div className="sm:hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="text-white text-xs">← Swipe to navigate →</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          
          {/* Image Gallery */}
          <div className="flex flex-col">
            {/* Main Image with Carousel Controls */}
            <div 
              className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4 group"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <img
                src={selectedImage}
                alt={product.name}
                onClick={() => setIsModalOpen(true)}
                className="w-full h-full object-center object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Carousel Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="hidden sm:block absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft size={24} className="text-black" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight size={24} className="text-black" />
                  </button>
                  
                  {/* Auto-play indicator - Desktop only */}
                  <div className="hidden sm:flex absolute bottom-4 left-1/2 -translate-x-1/2 items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-full">
                    <button
                      onClick={toggleAutoPlay}
                      className="text-white text-xs font-medium hover:text-gray-300 transition-colors"
                    >
                      {isAutoPlaying ? '⏸ Pause' : '▶ Play'}
                    </button>
                    <span className="text-white text-xs">
                      {selectedImageIndex + 1} / {allImages.length}
                    </span>
                  </div>
                  
                  {/* Image counter - Mobile only */}
                  <div className="sm:hidden absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <span className="text-white text-xs font-medium">
                      {selectedImageIndex + 1} / {allImages.length}
                    </span>
                  </div>
                  
                  {/* Progress dots */}
                  <div className="absolute bottom-4 right-4 flex gap-1.5">
                    {allImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleImageClick(allImages[index], index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === selectedImageIndex 
                            ? 'bg-white w-6' 
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageClick(image, index)}
                    className={`aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-black shadow-lg scale-105' 
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