import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const backendURL = process.env.REACT_APP_BACKEND_URL;

function AddProduct() {
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    type: "",
    weight: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("description", product.description);
    formData.append("price", product.price);
    formData.append("type", product.type);
    formData.append("weight", product.weight);

    if (imageFile) {
      formData.append("image", imageFile);
    }

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
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
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
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={product.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                name="type"
                value={product.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
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
              <label className="block text-sm font-medium mb-1">Price (₹)</label>
              <input
                type="number"
                name="price"
                value={product.price}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Weight/Size</label>
              <input
                type="text"
                name="weight"
                value={product.weight}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-1">Product Image</label>
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