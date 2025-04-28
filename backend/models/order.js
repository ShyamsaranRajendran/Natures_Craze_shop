const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const orderSchema = new mongoose.Schema(
  {
    order_id: {
      type: Number,
      unique: true, // Auto-incremented ID, unique for each order
    },
    username: {
      type: String,
    
      trim: true,
    },
    phoneNumber: {
      type: String,
    
      trim: true,
    },
    alternatePhoneNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
    
      trim: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: {
          type: String,
        
          trim: true,
        },
        price: {
          type: Number,
        
          min: 0,
        },
        weight: {
          type: String,
        
          trim: true,
        },
        quantity: {
          type: Number,
        
          min: 1,
        },
        totalPrice: {
          type: Number,
        
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
    
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processed", "shipped", "delivered", "processing"],
      default: "pending",
    },
    razorpayOrderId: {
      type: String,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "successful", "failed"],
      default: "unpaid",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Auto-increment the `id` field
orderSchema.plugin(AutoIncrement, { inc_field: "order_id" });



const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
