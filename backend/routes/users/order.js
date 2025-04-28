const express = require("express");
const Razorpay = require("razorpay");
const Order = require("../../models/order");
const PaidOrder = require("../../models/paidOrders");
const UnPaidOrder = require("../../models/unpaidOrders");
const Product = require("../../models/product");
const router = express.Router();
const crypto = require("crypto");

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  key_id: "rzp_test_814EkXmD14BWDD" ||process.env.RAZORPAY_KEY_ID ,
  key_secret: "tDGkmo8xCjbbEDG2kBSucvmB"||process.env.RAZORPAY_KEY_SECRET,
});

// // Payment verification endpoint
// router.post("/verify", async (req, res) => {
//   const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

//   try {
//     // 1. Find the existing order
//     const order = await Order.findOne({ razorpayOrderId });
//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     // 2. Verify the payment signature
//     const generatedSignature = crypto
//       .createHmac("sha256", "tDGkmo8xCjbbEDG2kBSucvmB"||process.env.RAZORPAY_KEY_SECRET)
//       .update(`${razorpayOrderId}|${razorpayPaymentId}`)
//       .digest("hex");

//     if (generatedSignature !== razorpaySignature) {
//       // Mark as failed and move to unpaid collection
//       order.paymentStatus = "failed";
//       await order.save();

//       const unpaidOrder = new UnPaidOrder({
//         ...order.toObject(),
//         reason: "Invalid payment signature",
//         movedAt: new Date(),
//       });
//       await unpaidOrder.save();

//       return res.status(400).json({ message: "Invalid payment signature" });
//     }

//     // 3. Payment is valid - update order status
//     order.paymentStatus = "paid";
//     order.razorpayPaymentId = razorpayPaymentId;
//     order.razorpaySignature = razorpaySignature;
//     await order.save();

//     // 4. Move to paid orders collection
//     const paidOrder = new PaidOrder({
//       ...order.toObject(),
//       verifiedAt: new Date(),
//     });
//     await paidOrder.save();

//     // 5. Update product quantities (if needed)
//     if (order.items && order.items.length > 0) {
//       await Promise.all(
//         order.items.map(async (item) => {
//           await Product.findByIdAndUpdate(
//             item.productId,
//             { $inc: { stock: -item.quantity } },
//             { new: true }
//           );
//         })
//       );
//     }

//     res.status(200).json({ 
//       message: "Payment verified successfully",
//       orderId: order._id 
//     });

//   } catch (error) {
//     console.error("Payment verification error:", error);
    
//     // Store failed payment attempt
//     if (razorpayOrderId) {
//       const unpaidOrder = new UnPaidOrder({
//         razorpayOrderId,
//         paymentStatus: "failed",
//         reason: error.message,
//         createdAt: new Date(),
//       });
//       await unpaidOrder.save();
//     }

//     res.status(500).json({ 
//       message: "Error verifying payment",
//       error: error.message 
//     });
//   }
// });

// // Create new order endpoint
// router.post('/create', async (req, res) => {
//   try {
//     const { items, username, phoneNumber, alternatePhoneNumber, address } = req.body;

//     // Validate required fields
//     if (!username || !phoneNumber || !address) {
//       return res.status(400).json({ 
//         message: 'Username, phone number, and address are required.' 
//       });
//     }

//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ 
//         message: 'No products in the cart' 
//       });
//     }

//     // Calculate total amount and validate products
//     let totalAmount = 0;
//     const processedItems = [];

//     for (const item of items) {
//       const { _id, name, quantities, prices: priceList } = item;

//       if (!_id || !name || !quantities || !priceList) {
//         return res.status(400).json({ 
//           message: 'Invalid cart item structure.' 
//         });
//       }

//       // Check product availability
//       const product = await Product.findById(_id);
//       if (!product) {
//         return res.status(404).json({ 
//           message: `Product ${name} not found` 
//         });
//       }

//       // Process each pack size
//       Object.entries(quantities).forEach(([packSize, quantity]) => {
//         const packPrice = priceList.find(p => p.packSize === packSize)?.price;
//         if (!packPrice) {
//           throw new Error(`Price not found for pack size ${packSize}`);
//         }

//         const totalPrice = packPrice * quantity;
//         totalAmount += totalPrice;

//         processedItems.push({
//           productId: _id,
//           name,
//           weight: packSize,
//           quantity,
//           price: packPrice,
//           totalPrice,
//         });
//       });
//     }

//     // Create order in database
//     const order = new Order({
//       username,
//       phoneNumber,
//       alternatePhoneNumber,
//       address,
//       items: processedItems,
//       totalAmount,
//       paymentStatus: 'pending'
//     });

//     const savedOrder = await order.save();

//     // Create Razorpay order
//     const razorpayOrder = await razorpay.orders.create({
//       amount: totalAmount * 100, // Convert to paise
//       currency: 'INR',
//       receipt: `order_${savedOrder._id}`,
//       payment_capture: 1,
//       notes: {
//         orderId: savedOrder._id.toString(),
//         customer: username
//       }
//     });

//     // Update order with Razorpay ID
//     savedOrder.razorpayOrderId = razorpayOrder.id;
//     await savedOrder.save();

//     // Prepare response
//     res.status(201).json({
//       message: 'Order created successfully',
//       orderId: savedOrder._id,
//       razorpayOrderId: razorpayOrder.id,
//       amount: totalAmount,
//       currency: 'INR'
//     });

//   } catch (error) {
//     console.error('Order creation error:', error);
//     res.status(500).json({ 
//       message: 'Error creating order',
//       error: error.message 
//     });
//   }
// });

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