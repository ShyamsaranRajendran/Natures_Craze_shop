// src/pages/CartPage.js
import React, { useContext, useEffect, useState } from 'react';
import { ShoppingCart, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import DefaultImage from '../assets/default-placeholder.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const CartPage = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartItemCount,
    clearCart
  } = useContext(CartContext);

  const [images, setImages] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch images for all products in cart
  useEffect(() => {
  const fetchImages = async () => {
    try {
      if (cart.length === 0) {
        setIsLoading(false);
        return;
      }

      const productIds = cart.map(item => item._id);
      const response = await axios.post(`${backendUrl}/prod/images`, { productIds });

      const imageMap = {};
      response.data.images.forEach(img => {
        if (img.image) {
          imageMap[img.id] = img.image; // Already a data URI
        }
      });
      console.log('Fetched images:', imageMap);
      setImages(imageMap);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load product images');
    } finally {
      setIsLoading(false);
    }
  };

  fetchImages();
}, [cart]);


  // Function to get image for a product
  const getImage = (productId) => {
    return images[productId];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 px-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <ToastContainer position="top-right" theme="colored" />
      <div className="max-w-6xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Shopping Cart</h1>
        
        {cart.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <ShoppingCart className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start shopping to add products to your cart</p>
            <Link
              to="/products"
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg inline-block"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="font-semibold">{cartItemCount} {cartItemCount === 1 ? 'Item' : 'Items'}</h2>
                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Clear Cart
                  </button>
                </div>
                
                {cart.map(item => (
                  <div key={item._id} className="p-4 border-b last:border-b-0">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="sm:w-1/4">
                        {getImage(item._id) ? (
  <img
    src={getImage(item._id)}
    alt={item.name}
    className="w-full h-32 object-contain rounded-lg"
    onError={(e) => {
      e.target.src = DefaultImage;
    }}
    loading="lazy"
  />
) : (
  <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-lg">
    <img
      src={DefaultImage}
      alt="Placeholder"
      className="h-16 opacity-50"
    />
  </div>
)}

                      </div>
                      <div className="sm:w-3/4">
                        <div className="flex justify-between">
                          <h3 className="font-semibold">{item.name}</h3>
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm">{item.weight}</p>
                        <p className="text-amber-600 font-medium my-2">₹{item.price}</p>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                              disabled={item.quantity <= 1}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <span className="px-4">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  {cart.map(item => (
                    <div key={item._id} className="flex justify-between">
                      <span className="truncate max-w-[180px]">{item.name} × {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <Link
                  to="/checkout"
                  className="block w-full bg-amber-500 hover:bg-amber-600 text-white text-center py-3 rounded-lg font-medium"
                >
                  Proceed to Checkout
                </Link>
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>Free shipping on orders over ₹500</p>
                  <p className="mt-2">30-day money back guarantee</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;