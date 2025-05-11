const express = require("express");
const Razorpay = require("razorpay");
const Order = require("../../models/order");
const PaidOrder = require("../../models/paidOrders");
const UnPaidOrder = require("../../models/unpaidOrders");
const Product = require("../../models/Product");
const router = express.Router();
const crypto = require("crypto");

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  key_id: "rzp_test_814EkXmD14BWDD" ||process.env.RAZORPAY_KEY_ID ,
  key_secret: "tDGkmo8xCjbbEDG2kBSucvmB"||process.env.RAZORPAY_KEY_SECRET,
});


// Payment verification endpoint
router.post("/verify", async (req, res) => {
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

  try {
    // 1. Find the existing order using razorpayOrderId
    const order = await Order.findOne({ razorpayOrderId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 2. Verify the payment signature
    const secretKey = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    // 3. Check if the signature matches
    if (generatedSignature !== razorpaySignature) {
      // Mark as failed and move to unpaid collection
      order.paymentStatus = "failed";
      await order.save();

      const unpaidOrder = new UnPaidOrder({
        ...order.toObject(),
        reason: "Invalid payment signature",
        movedAt: new Date(),
      });
      await unpaidOrder.save();

      return res.status(400).json({ message: "Invalid payment signature" });
    }

    // 4. Payment is valid, update order status
    order.paymentStatus = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    await order.save();

    // 5. Move the order to paid orders collection
    const paidOrder = new PaidOrder({
      ...order.toObject(),
      verifiedAt: new Date(),
    });
    await paidOrder.save();

    // 7. Respond with success
    res.status(200).json({ 
       success: true,
      message: "Payment verified successfully", 
      orderId: order._id 
    });

  } catch (error) {
    console.error("Payment verification error:", error);

    // 8. Store failed payment attempt in UnPaidOrder
    if (razorpayOrderId) {
      const unpaidOrder = new UnPaidOrder({
        razorpayOrderId,
        paymentStatus: "failed",
        reason: error.message,
        createdAt: new Date(),
      });
      await unpaidOrder.save();
    }

    // 9. Return error response
    res.status(500).json({ 
      success: false,
      message: "Error verifying payment", 
      error: error.message 
    });
  }
});

// Create new order endpoint
router.post('/create', async (req, res) => {
  try {
    const { items, username, phoneNumber, alternatePhoneNumber, address } = req.body;

    // Validate required fields
    if (!username || !phoneNumber || !address) {
      return res.status(400).json({ 
        message: 'Username, phone number, and address are required.' 
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'No products in the cart' 
      });
    }

    // Calculate total amount and validate products
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const { _id, name, quantity, price } = item;

      if (!_id || !name || !quantity || !price) {
        return res.status(400).json({ 
          message: 'Invalid cart item structure.' 
        });
      }

      // Check product availability
      const product = await Product.findById(_id);
      if (!product) {
        return res.status(404).json({ 
          message: `Product ${name} not found` 
        });
      }

      const totalPrice = price * quantity;
      totalAmount += totalPrice;

      processedItems.push({
        productId: _id,
        name,
        quantity,
        price,
        totalPrice,
      });
    }

    // Create order in database
    const order = new Order({
      username,
      phoneNumber,
      alternatePhoneNumber,
      address,
      items: processedItems,
      totalAmount,
      paymentStatus: 'pending'
    });

    const savedOrder = await order.save();

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `order_${savedOrder._id}`,
      payment_capture: 1,
      notes: {
        orderId: savedOrder._id.toString(),
        customer: username
      }
    });

    // Update order with Razorpay ID
    savedOrder.razorpayOrderId = razorpayOrder.id;
    await savedOrder.save();

    // Prepare response
    res.status(201).json({
      message: 'Order created successfully',
      orderId: savedOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR'
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ 
      message: 'Error creating order',
      error: error.message 
    });
  }
});


// Get order by Razorpay ID
router.get("/id/:razorpay_order_id", async (req, res) => {
  try {
    const order = await PaidOrder.findOne({ 
      razorpayOrderId: req.params.razorpay_order_id 
    });

    if (!order) {
      return res.status(404).json({ 
        message: "Order not found" 
      });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
});

// Update order status
router.patch("/edit/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "processed", "processing", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ 
      message: "Invalid status value" 
    });
  }

  try {
    const updatedOrder = await PaidOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ 
        message: "Order not found" 
      });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Order update error:", error);
    res.status(500).json({ 
      message: "Error updating order",
      error: error.message 
    });
  }
});

// Get all paid orders
router.get("/all", async (req, res) => {
  try {
    const orders = await PaidOrder.find()
      .sort({ createdAt: -1 })
      .select('-__v'); // Exclude version key

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching orders",
      error: error.message 
    });
  }
});

module.exports = router;