import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import axios from "axios";
import Layout from "./components/Layout";
import Home from "./components/Home";
import Login from "./components/auth/Login";
import SignUp from "./components/auth/SignUp";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import Contact from "./components/Contact";
import About from "./components/About";
import Products from "./components/Products";
import ProductDetails from "./components/ProductDetails";
import AdminDashboard from "./components/admin/dashboard"; 
import AdminProducts from "./components/admin/products";
import AdminAddProducts from "./components/admin/Addproduct"
import AdminEditProducts from "./components/admin/EditProduct"
import AdminOrder from "./components/admin/order/orders";
import AdminOrderDetail from "./components/admin/order/orderDetail";
import AdminProcessing from "./components/admin/order/ProcessingOrders";
import AdminProcessed from "./components/admin/order/ProcessedOrder";
import AdminFailedOrders from "./components/admin/order/failedOrders";
import Privacy from "./components/policy/privacy";
import Terms from "./components/policy/terms"; 
import Refund from "./components/policy/refund";
import Shipping from "./components/policy/shipping";
import Cart from "./components/cartsub";
import PaymentFail from "./components/paymentFail";
import PaymentSuccess from "./components/paymentSuccess";
import Developer from "./components/Developer";
import Checkout from "./components/checkout";
import { Provider } from "react-redux";
import store from "./redux/store";
import Chatbot from "./components/Chatbot";
const backendURL = process.env.REACT_APP_BACKEND_URL;
const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <h1 className="text-4xl font-bold text-red-500">404</h1>
    <p className="text-lg">Page Not Found</p>
    <a
      href="/"
      className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Go to Home
    </a>
  </div>
);

const fetchUserRole = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      return null; 
    }

    const response = await axios.get(`${backendURL}/auth/role`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      
      if (error.response.status === 401) {
        console.error("Unauthorized: Token is missing or invalid");
      } else if (error.response.status === 403) {
        console.error("Forbidden: Access is denied");
      } else {
        console.error("An error occurred:", error.response.data);
      }
    } else {
      console.error("Error fetching user role:", error);
    }
    return null;
  }
};

const PrivateRoute = ({ children, allowedRoles }) => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      const fetchedRole = await fetchUserRole();
      console.log("Fetched Role:", fetchedRole);
      setRole(fetchedRole);
      setLoading(false);
    };
    getRole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div
          className="border-4 border-gray-300 border-t-black rounded-full w-12 h-12 animate-spin"
          aria-label="Loading..."
        ></div>
      </div>
    );
  }

  if (!role) {
    console.log("No role, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("Role in PrivateRoute:", role?.user?.role); // Debug log for the role

  // Ensure the role comparison is strict and exact
  if (!allowedRoles.includes(role?.user?.role)) {
    console.log("Unauthorized role, redirecting to home");
    return <Navigate to="/" replace />;
  }

  return children;
};





function App() {

  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const getRole = async () => {
      const roleData = await fetchUserRole();
      if (roleData?.user?.role === "admin") {
        setIsAdmin(true);
      }
    };
    getRole();
  }, []);

  return (
    <Provider store={store}>

    <Router>
      <Routes>
        {/* Main Layout */}
        <Route path="/" element={<Layout  isAdmin={isAdmin}  />}>
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          {/* <Route path="signup" element={<SignUp />} /> */}
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="contact" element={<Contact />} />
          <Route path="about" element={<About />} />
          <Route path="products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/policy/privacy" element={<Privacy />} />
          <Route path="/policy/terms" element={<Terms />} />
          <Route path="/policy/refund" element={<Refund />} />
          <Route path="/policy/shipping" element={<Shipping />} />
          <Route path="/payment/paymentFailed" element={<PaymentFail />} />
          <Route path="/payment/paymentSuccess" element={<PaymentSuccess />} />
          <Route path ="/developer" element={<Developer/>}/>
          {/* Protected Admin Routes */}
          <Route
            path="admin/dashboard"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/products"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminProducts />
              </PrivateRoute>
            }
          />
           <Route
            path="admin/failedOrders"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <AdminFailedOrders />
              </PrivateRoute>
            }
          />
          <Route 
          path="admin/products/add"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminAddProducts/>
            </PrivateRoute>
          }
          />
          <Route 
          path="admin/products/edit/:id"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminEditProducts/>
            </PrivateRoute>
          }
          />
           <Route 
          path="admin/orders"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminOrder/>
            </PrivateRoute>
          }
          />
          <Route 
          path="admin/processing"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminProcessing/>
            </PrivateRoute>
          }
          />
          <Route 
          path="admin/processed"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminProcessed/>
            </PrivateRoute>
          }
          />
           <Route 
          path="admin/orders/:id"
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminOrderDetail/>
            </PrivateRoute>
          }
          />

          {/* Fallback for unmatched routes */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
    </Provider>

  );
}

export default App;
