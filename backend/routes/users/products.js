const express = require("express");
const router = express.Router();
const Product = require('../../models/Product'); // adjust the path if necessary
const jwt = require("jsonwebtoken");
require("dotenv").config();
const multer = require("multer");
const JWT_SECRET = process.env.JWT_SECRET;


const storage = multer.memoryStorage(); // Store image in memory as a buffer
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB size limit for images
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed."), false);
    }
    cb(null, true);
  },
});

router.post("/add", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      brand,
      description,
      category,
      subCategory,
      type,
      quantity,
      price,
      sellingPrice,
      discount,
      organic,
      origin,
      rating,
      inStock,
      seller,
      count
    } = req.body;

    // Required fields validation
    if (!name || !brand || !description || !category || !subCategory || 
        !quantity || !price || !sellingPrice || !req.file) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    const newProduct = new Product({
      name,
      brand,
      description,
      category,
      subCategory,
      type: type || undefined, // Make optional
      weight:quantity,
      price: parseFloat(price),
      sellingPrice: parseFloat(sellingPrice),
      discount: parseInt(discount) || 0,
      organic: organic === 'true',
      origin: origin || undefined,
      rating: parseFloat(rating) || 0,
      inStock: inStock !== 'false', // Default to true unless explicitly false
      seller: seller || undefined,
      count: parseInt(count) || 1,
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype
      },
      addedAt: new Date()
    });

    await newProduct.save();

    res.status(201).json({ 
      message: "Product added successfully!", 
      product: {
        _id: newProduct._id,
        name: newProduct.name,
        brand: newProduct.brand,
        price: newProduct.price
      }
    });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ 
      message: "Failed to add product.", 
      error: error.message 
    });
  }
});


router.post("/images", async (req, res) => {
  try {
    const ids  = req.body.productIds ;

    // Validate input: Check if IDs are provided and in the correct format
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No product IDs provided" });
    }

    // Find products by IDs in the database
    const products = await Product.find({ _id: { $in: ids } });

    // Handle case where no matching products are found
    if (products.length === 0) {
      return res.status(404).json({ error: "No products found for the given IDs" });
    }

    // Map images with their corresponding IDs
    const images = products.map((product) => {
  if (product.image && product.image.data) {
    const contentType = product.image.contentType || 'image/jpeg'; // fallback
    const base64 = product.image.data.toString("base64");

    return {
      id: product._id,
      image: `data:${contentType};base64,${base64}`,
    };
  }

  return {
    id: product._id,
    image: null,
  };
});


    // Send the mapped images and IDs to the frontend
    res.status(200).json({ images });
  } catch (error) {
    console.error("Error fetching product images:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// Utility to format products (e.g., convert image buffer to base64)
const formatProduct = (product) => {
  return {
    ...product._doc,
    image: product.image ? `data:image/jpeg;base64,${product.image.toString("base64")}` : null,
  };
};

// Route to fetch all products
// routes/product.js or similar
router.get("/all", async (req, res) => {
  try {
    console.log("Fetching all products...");

    const products = await Product.find();

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    // Helper function to format each product
    const formatProduct = (product) => {
      const formatted = product.toObject(); // convert Mongoose doc to plain object

      if (formatted.image?.data && formatted.image?.contentType) {
        formatted.image = {
          contentType: formatted.image.contentType,
          base64: formatted.image.data.toString("base64"),
        };
      }

      return formatted;
    };

    const formattedProducts = products.map(formatProduct);

    res.status(200).json(formattedProducts);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all/Tableformat", async (req, res) => {
  try {
    console.log("Fetching all products...");

   const products = await Product.find().select("-image");

    if (!products || products.length === 0) {
      return res.status(404).json({ message: "No products found" });
    }

    // Helper function to format each product
    const formatProduct = (product) => {
      const formatted = product.toObject(); // convert Mongoose doc to plain object

      if (formatted.image?.data && formatted.image?.contentType) {
        formatted.image = {
          contentType: formatted.image.contentType,
          base64: formatted.image.data.toString("base64"),
        };
      }

      return formatted;
    };

    const formattedProducts = products.map(formatProduct);
    console.log("Formatted products:", formattedProducts);

    // console.log(`Found ${formattedProducts.length} products`);
    console.log("Products fetched successfully");
    // Send the formatted products to the frontend

    res.status(200).json(formattedProducts);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Route to fetch a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Fetching product with ID: ${id}`);
    const product = await Product.findById(id); // Fixed: Removed the unnecessary object syntax

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Fetch recommended products
    const recommendedProducts = await Product.find({
      name: { $regex: product.name.split(" ")[0], $options: "i" },
      _id: { $ne: id },
    }).limit(5);

    // No need for formatProduct if you're sending the raw product data
    console.log(`Product found: ${product.name}`);
    res.status(200).json({ 
      product,  // Changed from formattedProduct to just product
      recommendedProducts 
    });
  } catch (err) {
    console.error("Error fetching product:", err);

    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid product ID format" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// Update Product Route - changed path to match frontend (just '/:id')
router.put('/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    brand,
    description, 
    category,
    subCategory,
    type,
    quantity,
    price,
    sellingPrice,
    discount,
    organic,
    origin,
    rating,
    inStock,
    seller,
    count
  } = req.body;
  
  const image = req.file;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update all product fields from the request
    product.name = name || product.name;
    product.brand = brand || product.brand;
    product.description = description || product.description;
    product.category = category || product.category;
    product.subCategory = subCategory || product.subCategory;
    product.type = type || product.type;
    product.weight = quantity || product.quantity;
    product.price = price || product.price;
    product.sellingPrice = sellingPrice || product.sellingPrice;
    product.discount = discount !== undefined ? discount : product.discount;
    product.organic = organic !== undefined ? organic : product.organic;
    product.origin = origin || product.origin;
    product.rating = rating || product.rating;
    product.inStock = inStock !== undefined ? inStock : product.inStock;
    product.seller = seller || product.seller;
    product.count = count || product.count;

    // Handle image update if new image was uploaded
    if (image) {
      product.image = {
        data: image.buffer,
        contentType: image.mimetype
      };
    }

    await product.save();

    res.status(200).json({
      message: 'Product updated successfully',
      product, // Return the updated product
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ 
      message: 'Error updating product',
      error: err.message 
    });
  }
});
// Delete Product Route
router.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete the product." });
  }
});

// Get Product Count
router.get("/count", async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    res.status(200).json({ count: productCount });
  } catch (error) {
    console.error("Error fetching product count:", error);
    res.status(500).json({ message: "Failed to fetch product count." });
  }
});

// Get Recent Products
router.get("/recent", async (req, res) => {
  try {
    const recentProducts = await Product.find()
      .sort({ updatedAt: -1 }) 
      .limit(5); 
    res.status(200).json({ products: recentProducts });
  } catch (error) {
    console.error("Error fetching recent products:", error);
    res.status(500).json({ message: "Failed to fetch recent products." });
  }
});


// Fetch product price list
router.get("/price-chart", async (req, res) => {
  try {
    // Query all products and return their name and prices
    const products = await Product.find({}, { name: 1, prices: 1, _id: 0 });

    res.status(200).json({
      success: true,
      message: "Product price list fetched successfully",
      products,
    });
  } catch (error) {
    console.error("Error fetching product price list:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product price list",
      error: error.message,
    });
  }
});

module.exports = router;
