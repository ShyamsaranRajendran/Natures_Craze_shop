import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Star, ShoppingCart, Package, Minus, Plus, Trash2 } from "lucide-react";

// Import your frontend product images
import kasturiImg from "../assets/kasturi.jpg";
import capImg from "../assets/capsules.jpg";
import soapImg from "../assets/soap.jpg";
import teaImg from "../assets/tea.jpg";
import oilImg from "../assets/oil.jpg";
import faceImg from "../assets/face.jpg";

const backendURL = process.env.REACT_APP_BACKEND_URL;

// Frontend products data
const frontendProducts = [
  {
    _id: "101",
    name: "Kasturi Turmeric",
    description: "Pure Kasturi turmeric ideal for skincare and medicinal use",
    image: kasturiImg,
    prices: [
      { _id: "101-100g", packSize: "100g", price: 130 },
      { _id: "101-250g", packSize: "250g", price: 300 },
      { _id: "101-500g", packSize: "500g", price: 550 }
    ],
    type: "Kasturi",
    weight: "100g"
  },
  {
    _id: "102",
    name: "Turmeric Face Wash",
    description: "Gentle turmeric-infused face wash for naturally radiant and clear skin.",
    image: faceImg,
    prices: [
      { _id: "102-100ml", packSize: "100ml", price: 160 },
      { _id: "102-200ml", packSize: "200ml", price: 300 }
    ],
    type: "Wild",
    weight: "250g"
  },
  {
    _id: "103",
    name: "Turmeric Capsules",
    description: "Easy-to-consume capsules with 95% curcumin concentration",
    image: capImg,
    prices: [
      { _id: "103-30caps", packSize: "30 capsules", price: 200 },
      { _id: "103-60caps", packSize: "60 capsules", price: 350 }
    ],
    type: "Capsule",
    weight: "60 capsules"
  },
  {
    _id: "104",
    name: "Haldi Soap",
    description: "Turmeric infused handmade bathing soap",
    image: soapImg,
    prices: [
      { _id: "104-1pc", packSize: "1 piece", price: 55 },
      { _id: "104-3pc", packSize: "3 pieces", price: 150 }
    ],
    type: "Bath",
    weight: "75g"
  },
  {
    _id: "105",
    name: "Turmeric Tea Mix",
    description: "Healthy herbal tea blend with turmeric and ginger",
    image: teaImg,
    prices: [
      { _id: "105-100g", packSize: "100g", price: 110 },
      { _id: "105-250g", packSize: "250g", price: 250 }
    ],
    type: "Tea",
    weight: "150g"
  },
  {
    _id: "106",
    name: "Turmeric Essential Oil",
    description: "Aromatic essential oil for skin and wellness",
    image: oilImg,
    prices: [
      { _id: "106-30ml", packSize: "30ml", price: 180 },
      { _id: "106-50ml", packSize: "50ml", price: 280 }
    ],
    type: "Oil",
    weight: "30ml"
  }
];

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackSize, setSelectedPackSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  // Get cart from localStorage or initialize empty array
  const getCartFromLocalStorage = () => {
    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
  };

  const [cart, setCart] = useState(() => getCartFromLocalStorage());

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        // First check if it's a frontend product
        const frontendProduct = frontendProducts.find(p => p._id === id);
        if (frontendProduct) {
          setProduct(frontendProduct);
          setLoading(false);
          return;
        }

        // If not found in frontend products, try to fetch from backend
        const response = await fetch(`${backendURL}/prod/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const updateCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleAddToCart = () => {
    if (!selectedPackSize) {
      toast.warning("Please select a pack size.");
      return;
    }

    if (quantity <= 0) {
      toast.warning("Please select a valid quantity.");
      return;
    }

    const selectedPrice = product.prices.find(
      (price) => price.packSize === selectedPackSize
    );

    if (!selectedPrice) {
      toast.error("Selected pack size not found.");
      return;
    }

    const existingItemIndex = cart.findIndex(
      (item) => item.productId === product._id && item.packSize === selectedPackSize
    );

    let updatedCart = [...cart];

    if (existingItemIndex >= 0) {
      // Update existing item
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + quantity,
        totalPrice: (updatedCart[existingItemIndex].quantity + quantity) * selectedPrice.price
      };
    } else {
      // Add new item
      updatedCart.push({
        productId: product._id,
        name: product.name,
        image: product.image,
        packSize: selectedPackSize,
        price: selectedPrice.price,
        quantity: quantity,
        totalPrice: quantity * selectedPrice.price
      });
    }

    updateCart(updatedCart);
    toast.success(`${quantity} ${selectedPackSize} pack(s) added to cart!`);
    setQuantity(1);
    setSelectedPackSize("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
          <div className="absolute inset-3 border-4 border-amber-300 border-t-amber-600 rounded-full animate-spin-slow"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-lg text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-amber-50 to-white">
        <p className="text-lg text-gray-700">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4 sm:px-6 lg:px-8 mt-10">
      <ToastContainer position="top-right" theme="colored" />
      <button
        onClick={() => navigate(-1)}
        className="text-gray-600 hover:text-gray-800 mr-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="md:flex">
            {/* Left side - Product Image */}
            <div className="md:w-1/2 relative">
              <div className="absolute inset-0 from-amber-100/50 to-amber-50/30"></div>
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Premium Quality
              </div>
            </div>

            {/* Right side - Product Details */}
            <div className="md:w-1/2 p-8">
              <div className="flex items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-900 flex-grow">
                  {product.name}
                </h1>
                {product.rating && (
                  <div className="flex items-center bg-amber-100 px-3 py-1 rounded-full">
                    <Star
                      className="w-4 h-4 text-amber-500 mr-1"
                      fill="currentColor"
                    />
                    <span className="text-amber-700 font-medium">
                      {product.rating}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 mb-6 leading-relaxed">
                {product.description}
              </p>

              {/* Pack Size Selection */}
              <div className="bg-amber-50 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-amber-600" />
                  Select Package Size
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    value={selectedPackSize}
                    onChange={(e) => setSelectedPackSize(e.target.value)}
                    className="block w-full px-4 py-3 rounded-lg border-2 border-amber-200 focus:border-amber-500 focus:ring focus:ring-amber-200 focus:ring-opacity-50 bg-white"
                  >
                    <option value="">Select Size</option>
                    {product.prices?.map((price) => (
                      <option key={price._id} value={price.packSize}>
                        {price.packSize} - ₹{price.price}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-xl font-semibold text-gray-800 w-12 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="w-full p-3 mt-4 bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </button>
              </div>

              {/* Cart Summary */}
              {cart.filter(item => item.productId === product._id).length > 0 && (
                <div className="bg-white border-2 border-amber-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    In Your Cart
                  </h3>

                  {cart
                    .filter(item => item.productId === product._id)
                    .map((item) => (
                      <div
                        key={`${item.productId}-${item.packSize}`}
                        className="flex items-center justify-between py-3 border-b border-amber-100 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.packSize} ({item.quantity})
                          </p>
                          <p className="text-amber-600">
                            ₹{item.totalPrice}
                          </p>
                        </div>
                      </div>
                    ))}

                  <div className="mt-4 pt-4 border-t border-amber-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-gray-800">
                        Total for this product
                      </span>
                      <span className="text-xl font-bold text-amber-600">
                        ₹{cart
                          .filter(item => item.productId === product._id)
                          .reduce((sum, item) => sum + item.totalPrice, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;