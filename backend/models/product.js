const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const productSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"]
    },
    image: {
      data: Buffer,
      contentType: String
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: ["Kasturi", "Wild", "Capsule", "Bath", "Tea", "Oil", "Powder"]
    },
    weight: {
      type: String,
      required: [true, "Weight is required"]
    }
  },
  {
    timestamps: true
  }
);

productSchema.plugin(AutoIncrement, { inc_field: "id", start_seq: 100 });

module.exports = mongoose.model("Product", productSchema);