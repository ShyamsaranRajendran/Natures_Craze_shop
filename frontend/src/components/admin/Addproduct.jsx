import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const backendURL = process.env.REACT_APP_BACKEND_URL;

function AddProduct() {
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: "",
    brand: "",
    description: "",
    category: "",
    subCategory: "",
    type: "",
    quantity: "",
    price: "",
    sellingPrice: "",
    discount: 0,
    organic: false,
    origin: "",
    rating: 0,
    inStock: true,
    seller: "",
    count: 1
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!imageFile) {
      toast.error("Please upload an image.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("brand", product.brand);
    formData.append("description", product.description);
    formData.append("category", product.category);
    formData.append("subCategory", product.subCategory);
    formData.append("type", product.type);
    formData.append("quantity", product.quantity);
    formData.append("price", product.price);
    formData.append("sellingPrice", product.sellingPrice);
    formData.append("discount", product.discount);
    formData.append("organic", product.organic);
    formData.append("origin", product.origin);
    formData.append("rating", product.rating);
    formData.append("inStock", product.inStock);
    formData.append("seller", product.seller);
    formData.append("count", product.count);
    formData.append("image", imageFile);

    try {
      const response = await fetch(`${backendURL}/prod/add`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to add product");
      }

      toast.success("Product added successfully!");
      navigate("/products");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name*</label>
              <input
                type="text"
                name="name"
                value={product.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Brand*</label>
              <input
                type="text"
                name="brand"
                value={product.brand}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description*</label>
              <textarea
                name="description"
                value={product.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category*</label>
              <input
                type="text"
                name="category"
                value={product.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Sub Category*</label>
              <input
                type="text"
                name="subCategory"
                value={product.subCategory}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                name="type"
                value={product.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select type</option>
                <option value="Kasturi">Kasturi</option>
                <option value="Wild">Wild</option>
                <option value="Capsule">Capsule</option>
                <option value="Bath">Bath</option>
                <option value="Tea">Tea</option>
                <option value="Oil">Oil</option>
                <option value="Powder">Powder</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantity/Weight*</label>
              <input
                type="text"
                name="quantity"
                value={product.quantity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price (₹)*</label>
              <input
                type="number"
                name="price"
                value={product.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Selling Price (₹)*</label>
              <input
                type="number"
                name="sellingPrice"
                value={product.sellingPrice}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={product.discount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                max="100"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Origin</label>
              <input
                type="text"
                name="origin"
                value={product.origin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Seller</label>
              <input
                type="text"
                name="seller"
                value={product.seller}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="organic"
                checked={product.organic}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium">Organic Product</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="inStock"
                checked={product.inStock}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium">In Stock</label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Initial Stock Count</label>
              <input
                type="number"
                name="count"
                value={product.count}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-1">Product Image*</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? "Adding..." : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;