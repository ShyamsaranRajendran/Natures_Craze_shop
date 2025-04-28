const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../../models/order');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: "rzp_test_814EkXmD14BWDD",
  key_secret:  "tDGkmo8xCjbbEDG2kBSucvmB"
});

/**
 * @route POST /payments/create
 * @desc Create a new order and Razorpay order
 */
router.post('/create', async (req, res) => {
  try {
    const { customer, items, paymentMethod } = req.body;
    
    // Validate required fields
    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required customer information'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items in cart'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    console.log(totalAmount)

    // Create order in database
    const order = new Order({
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      },
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        weight: item.weight,
        quantity: item.quantity,
        price: item.price,
        image: item.image
      })),
      totalAmount,
      paymentMethod,
      paymentStatus: 'pending'
    });

    const savedOrder = await order.save();

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // in paise
      currency: 'INR',
      receipt: `order_${savedOrder._id}`,
      notes: {
        orderId: savedOrder._id.toString(),
        customerName: customer.name
      }
    });

    // Update order with Razorpay ID
    savedOrder.razorpayOrderId = razorpayOrder.id;
    await savedOrder.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: savedOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /payments/verify
 * @desc Verify Razorpay payment
 */
router.post('/verify', async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, orderId } = req.body;

    // 1. Verify the signature
    const generatedSignature = crypto
      .createHmac('sha256', "tDGkmo8xCjbbEDG2kBSucvmB")
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // 2. Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: 'paid',
        razorpayPaymentId,
        razorpaySignature,
        paidAt: new Date()
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 3. Update product stock (if needed)
    await Promise.all(
      order.items.map(item => 
        Product.findByIdAndUpdate(
          item.productId, 
          { $inc: { stock: -item.quantity } }
        )
      )
    );

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      orderId: order._id
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;