const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    brand: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      required: true, 
      trim: true 
    },
    category: { 
      type: String, 
      required: true, 
      trim: true 
    },
    subCategory: { 
      type: String, 
      required: true, 
      trim: true 
    },
    type: {
      type: String,
      enum: ["Kasturi", "Wild", "Capsule", "Bath", "Tea", "Oil", "Powder"],
      default: "Powder"
    },
    weight: { 
      type: String, 
      required: true 
    },
    price: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    sellingPrice: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    discount: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 100 
    },
    organic: { 
      type: Boolean, 
      default: false 
    },
    origin: { 
      type: String, 
      trim: true 
    },
    rating: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 5 
    },
    inStock: { 
      type: Boolean, 
      default: true 
    },
    seller: { 
      type: String, 
      trim: true 
    },
    count: { 
      type: Number, 
      default: 1, 
      min: 0 
    },
    image: {
      data: Buffer,
      contentType: String
    }
  },
  { 
    timestamps: true,
    // Remove version key (__v) from output
    versionKey: false,
    // Transform output to remove _id and add id
    toJSON: {
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Add indexes for better query performance
productSchema.index({ name: 1, brand: 1 }); // Compound index
productSchema.index({ category: 1, subCategory: 1 }); // Compound index

// Prevent OverwriteModelError
module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);