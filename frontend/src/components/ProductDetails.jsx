import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Star, ShoppingCart, Package, Minus, Plus } from "lucide-react";

const ProductDetails = () => {
  const { state } = useLocation();
  const product = state?.product;

  const [selectedPackSize, setSelectedPackSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  const getCartFromLocalStorage = () => {
    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
  };

  const [cart, setCart] = useState(getCartFromLocalStorage());

  const updateCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const handleAddToCart = () => {
    if (!selectedPackSize) {
      return toast.warning("Please select a pack size.");
    }

    const selectedPrice = product.prices?.find(p => p.packSize === selectedPackSize) || {
      packSize: product.quantity,
      price: product.price
    };

    const existingIndex = cart.findIndex(
      item => item.productId === product._id && item.packSize === selectedPackSize
    );

    const updatedCart = [...cart];

    if (existingIndex >= 0) {
      updatedCart[existingIndex].quantity += quantity;
      updatedCart[existingIndex].totalPrice =
        updatedCart[existingIndex].quantity * selectedPrice.price;
    } else {
      updatedCart.push({
        productId: product._id,
        name: product.name,
        image: product.image,
        packSize: selectedPrice.packSize,
        price: selectedPrice.price,
        quantity,
        totalPrice: quantity * selectedPrice.price,
      });
    }

    updateCart(updatedCart);
    toast.success(`${quantity} x ${selectedPrice.packSize} added to cart!`);
    setQuantity(1);
    setSelectedPackSize("");
  };

  return (
    <div className="min-h-screen bg-amber-50 py-12 px-4 mt-10">
      <ToastContainer position="top-right" theme="colored" />
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden md:flex">
        <div className="md:w-1/2 p-6">
          {product.image?.base64 && (
            <img
              src={`data:${product.image.contentType};base64,${product.image.base64}`}
              alt={product.name}
              className="w-full h-auto object-cover rounded-lg"
            />
          )}
        </div>

        <div className="md:w-1/2 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {product.rating && (
            <div className="flex items-center bg-amber-100 px-3 py-1 rounded-full w-fit mb-4">
              <Star className="w-4 h-4 text-amber-500 mr-1" fill="currentColor" />
              <span className="text-amber-700 font-medium">{product.rating}</span>
            </div>
          )}

          <p className="text-gray-700 mb-4">{product.description}</p>
          <p className="text-sm text-gray-500 mb-2">
            Category: {product.category} → {product.subCategory}
          </p>
          <p className="text-sm text-gray-500 mb-4">Origin: {product.origin}</p>

          {/* Pack Size and Quantity Selection */}
          <div className="bg-amber-50 p-4 rounded-xl mb-4">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
              <Package className="w-5 h-5 mr-2 text-amber-600" />
              Select Package Size
            </h3>

            <select
              value={selectedPackSize}
              onChange={(e) => setSelectedPackSize(e.target.value)}
              className="block w-full px-4 py-2 rounded border border-amber-300"
            >
              <option value="">Select Size</option>
              {product.prices?.length > 0 ? (
                product.prices.map((price) => (
                  <option key={price.packSize} value={price.packSize}>
                    {price.packSize} - ₹{price.price}
                  </option>
                ))
              ) : (
                <option value={product.quantity}>
                  {product.quantity} - ₹{product.price}
                </option>
              )}
            </select>

            <div className="flex items-center mt-4 space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 bg-amber-200 rounded"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span>{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 bg-amber-200 rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full mt-4 p-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center justify-center"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </button>
          </div>

          {/* Cart Summary */}
          {cart.filter(item => item.productId === product._id).length > 0 && (
            <div className="mt-6 bg-white p-4 border border-amber-100 rounded-lg">
              <h4 className="text-lg font-semibold mb-3">In Your Cart</h4>
              {cart
                .filter(item => item.productId === product._id)
                .map((item) => (
                  <div key={`${item.productId}-${item.packSize}`} className="mb-2">
                    {item.packSize} x {item.quantity} = ₹{item.totalPrice}
                  </div>
                ))}
              <div className="font-bold text-amber-600 mt-2">
                Total: ₹
                {cart
                  .filter(item => item.productId === product._id)
                  .reduce((sum, item) => sum + item.totalPrice, 0)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
