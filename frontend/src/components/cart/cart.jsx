// Cart.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { ShoppingBag } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import api from "./api.js";
import CartItem from "./CartItem";
import OrderSummary from "./OrderSummary";
import CheckoutModal from "./CheckoutModal";

const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const Cart = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productQuantities, setProductQuantities] = useState({});
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [userDetails, setUserDetails] = useState({
    username: "",
    phoneNumber: "",
    alternatePhoneNumber: "",
    address: "",
  });

  // Load cart on component mount
  const loadCart = useCallback(async () => {
    try {
      const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCart(storedCart);

      const initialQuantities = {};
      storedCart.forEach((item) => {
        initialQuantities[item._id] = {
          packSize: item.prices[0]?.packSize || "",
          quantity: 1,
        };
      });
      setProductQuantities(initialQuantities);
    } catch (error) {
      console.error("Error loading cart:", error);
      toast.error("Failed to load cart items");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Calculate the total price of the cart
  const calculateTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      return (
        total +
        Object.entries(item.quantities || {}).reduce((sum, [volume, qty]) => {
          const price = item.prices.find((p) => p.packSize === volume)?.price || 0;
          return sum + price * qty;
        }, 0)
      );
    }, 0);
  }, [cart]);

  // Handle checkout initiation
  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setShowCheckoutModal(true);
  }, [cart.length]);

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle confirming checkout and payment
  const handleConfirmCheckout = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Validate user details
      const { username, phoneNumber, alternatePhoneNumber, address } = userDetails;
      const phoneRegex = /^[0-9]{10}$/;

      if (!username || !phoneNumber || !address) {
        throw new Error("Please fill in all required fields");
      }

      if (!phoneRegex.test(phoneNumber)) {
        throw new Error("Please enter a valid 10-digit phone number");
      }

      if (alternatePhoneNumber && !phoneRegex.test(alternatePhoneNumber)) {
        throw new Error("Please enter a valid alternate phone number");
      }

      // Ensure Razorpay script is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      const orderItems = cart.map(({ _id, name, quantities, prices, description }) => ({
        _id,
        name,
        quantities,
        prices: prices.map(({ packSize, price }) => ({ packSize, price })),
        description: description || "No description available",
      }));

      // Validate order items
      if (orderItems.length === 0) {
        throw new Error("Your cart is empty. Please add items to proceed.");
      }

      // Send order data to backend
      const response = await api.post("/orders/create", {
        items: orderItems,
        username,
        phoneNumber,
        alternatePhoneNumber,
        address,
      });

      const { razorpayOrderId, amount } = response.data;

      if (!razorpayOrderId || !amount) {
        throw new Error("Failed to create order");
      }

      // Initialize Razorpay payment
      const options = {
        key: "rzp_live_vniaz7V3nXYe0J",
        amount,
        currency: "INR",
        name: "Natures Craze",
        description: "Order Payment",
        order_id: razorpayOrderId,
        handler: async (paymentResponse) => {
          await handlePaymentSuccess(paymentResponse, razorpayOrderId, amount);
        },
        prefill: {
          name: username,
          contact: phoneNumber,
        },
        theme: { color: "#F37254" },
        modal: {
          ondismiss: () => {
            toast.warning("Payment cancelled");
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error(error.message || "Checkout failed");
      setIsProcessing(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentResponse, razorpayOrderId, amount) => {
    try {
      const verificationResponse = await api.post("/orders/verify", {
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });

      if (verificationResponse.status === 200) {
        toast.success("Payment successful!");
        setShowCheckoutModal(false);
        setCart([]);
        localStorage.removeItem("cart");

        navigate("/payment/paymentSuccess", {
          state: {
            message: "Payment verified successfully!",
            paymentDetails: paymentResponse,
            razorpayOrderId,
            orderDetails: amount,
          },
        });
      } else {
        throw new Error("Payment verification failed");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      navigate("/payment/paymentFailed", {
        state: {
          message: "Payment verification failed",
          error: error.message,
        },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle input changes in the checkout form
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setUserDetails((prev) => ({ ...prev, [name]: value }));
  }, []);

 return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4 lg:px-8 mt-10">
      <ToastContainer position="top-right" theme="colored" />
      {isLoading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-700">Your cart is empty</h2>
          <p className="text-gray-500 text-center px-4">Add some items to your cart to continue shopping</p>
          <button
            onClick={() => navigate("/products")}
            className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 px-4">Shopping Cart</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item, index) => (
                <CartItem
                  key={item._id}
                  item={item}
                  index={index}
                  productQuantities={productQuantities}
                  handlePackSizeChange={handlePackSizeChange}
                  handleAddToCart={handleAddToCart}
                  handleUpdateQuantity={handleUpdateQuantity}
                  handleRemoveItem={handleRemoveItem}
                />
              ))}
            </div>
            <div className="lg:col-span-1">
              <OrderSummary calculateTotal={calculateTotal} handleCheckout={handleCheckout} />
            </div>
          </div>
        </div>
      )}
      <CheckoutModal
        showCheckoutModal={showCheckoutModal}
        setShowCheckoutModal={setShowCheckoutModal}
        userDetails={userDetails}
        handleInputChange={handleInputChange}
        handleConfirmCheckout={handleConfirmCheckout}
        isProcessing={isProcessing}
        calculateTotal={calculateTotal}
      />
    </div>
  );
};

export default Cart;