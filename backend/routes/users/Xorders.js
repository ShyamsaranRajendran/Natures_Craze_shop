const Order = require('../models/Order');
const Product = require('../../models/product');
const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
dayjs.extend(advancedFormat);
const razorpay = require('../../config/razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
// Create new order with Razorpay integration
exports.createOrder = async (req, res) => {
  try {
    const { items, username, phoneNumber, alternatePhoneNumber, address, userId } = req.body;

    // Validate required fields
    if (!username || !phoneNumber || !address) {
      return res.status(400).json({ 
        success: false,
        message: 'Username, phone number, and address are required.' 
      });
    }

    // Validate address structure
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      return res.status(400).json({ 
        success: false,
        message: 'Complete address with street, city, state and zipCode is required.' 
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No products in the cart' 
      });
    }

    // Calculate total amount and validate products
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item._id);
      if (!product) {
        return res.status(404).json({ 
          success: false,
          message: `Product not found: ${item._id}` 
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          success: false,
          message: `Insufficient stock for product: ${product.name}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      processedItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        totalPrice: itemTotal
      });
    }

    // Create Razorpay order FIRST
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `order_${new mongoose.Types.ObjectId()}`, // temporary ID
      payment_capture: 1,
      notes: {
        customer: username
      }
    });

    // Create order in database with Razorpay ID
    const order = new Order({
      userId: userId || null,
      username,
      phoneNumber,
      alternatePhoneNumber,
      shippingAddress: address,
      items: processedItems,
      totalAmount,
      paymentStatus: 'pending',
      paymentMethod: 'online',
      razorpayOrderId: razorpayOrder.id ,// Set Razorpay ID immediately
      razorpaySignature: razorpayOrder.signature,
    });

    const savedOrder = await order.save();
    console
    // Prepare response
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: savedOrder._id,
        amount: totalAmount,
        currency: 'INR'
      },
      razorpay: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        signature: razorpayOrder.signature || null,
        key: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Order creation failed due to duplicate key',
        error: 'Please try again with a new order'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error creating order',
      error: error.message 
    });
  }
};
// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
  console.log("🔍 Verifying payment...");
  
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
  console.log("Received payment details:", req.body);
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: "Missing payment verification fields"
    });
  }

  try {
    // Step 1: Find the corresponding order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      console.error("❌ Order not found for Razorpay Order ID:", razorpay_order_id);
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Step 2: Validate Razorpay signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || "tDGkmo8xCjbbEDG2kBSucvmB")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn("⚠️ Invalid signature. Expected:", expectedSignature, "Got:", razorpay_signature);
      order.paymentStatus = 'failed';
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature"
      });
    }

    // Step 3: Payment is verified, update order status
    order.paymentStatus = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.status = 'processing';
    await order.save();

    // Step 4: Reduce stock for each item
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    console.log("✅ Payment verified and order updated:", order._id);

    // Step 5: Respond with success
    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      orderId: order._id,
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    console.error("💥 Payment verification error:", error);

    if (razorpay_order_id) {
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { paymentStatus: 'failed' }
      );
    }

    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message
    });
  }
};


// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, startDate, endDate } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'username email');
      
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'username email')
      .populate('items.productId', 'name image');
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is authorized to view this order
    if (req.user._id.toString() !== order.userId._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name image price');
      
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update order (admin)
exports.updateOrder = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update fields
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    
    await order.save();
    
    res.json({ message: 'Order updated successfully', order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user is authorized to cancel this order
    if (req.user._id.toString() !== order.userId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }
    
    // Check if order can be cancelled
    if (order.status === 'completed' || order.status === 'shipped') {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }
    
    // Update order status
    order.status = 'cancelled';
    order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : 'unpaid';
    
    await order.save();
    
    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }
    
    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete order (admin)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get order data for charts (admin)
exports.getOrderChartsData = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: 1 });
    
    // Prepare data for different time periods
    const dailyData = {};
    const weeklyData = {};
    const monthlyData = {};
    const statusDistribution = {};
    const revenueByMonth = {};
    
    orders.forEach(order => {
      const date = dayjs(order.createdAt);
      
      // Daily data
      const dayKey = date.format('YYYY-MM-DD');
      dailyData[dayKey] = (dailyData[dayKey] || 0) + 1;
      
      // Weekly data
      const weekKey = `${date.format('YYYY')}-W${date.isoWeek()}`;
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
      
      // Monthly data
      const monthKey = date.format('YYYY-MM');
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + order.totalAmount;
      
      // Status distribution
      statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;
    });
    
    res.json({
      daily: Object.keys(dailyData).map(date => ({ date, count: dailyData[date] })),
      weekly: Object.keys(weeklyData).map(week => ({ week, count: weeklyData[week] })),
      monthly: Object.keys(monthlyData).map(month => ({ 
        month, 
        count: monthlyData[month],
        revenue: revenueByMonth[month] 
      })),
      statusDistribution: Object.entries(statusDistribution).map(([status, count]) => ({ status, count })),
      metrics: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        avgOrderValue: orders.length > 0 
          ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length 
          : 0,
        uniqueCustomers: (await Order.distinct('userId')).length
      }
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};