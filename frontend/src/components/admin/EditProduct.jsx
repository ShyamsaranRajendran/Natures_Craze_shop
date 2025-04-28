import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const backendURL = process.env.REACT_APP_BACKEND_URL;

const productTypes = [
  "Kasturi", "Wild", "Capsule", "Bath", "Tea", "Oil", "Powder"
];

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: "",
    description: "",
    image: "",
    type: "",
    weight: "",
    price: 0,
    stock: 0,
    prices: [],
    rating: 5,
    featured: false,
    discount: 0
  });

  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${backendURL}/prod/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.product) {
          throw new Error("Product not found");
        }

        // Map the response data to our state
        setProduct({
          name: data.product.name,
          description: data.product.description,
          image: data.product.image,
          type: data.product.type,
          weight: data.product.weight,
          price: data.product.price,
          stock: data.product.stock,
          prices: data.product.prices || [],
          rating: data.product.rating || 5,
          featured: data.product.featured || false,
          discount: data.product.discount || 0
        });

      } catch (err) {
        setError(err.message);
        toast.error(`Failed to load product: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handlePriceChange = (index, e) => {
    const { name, value } = e.target;
    const updatedPrices = [...product.prices];
    updatedPrices[index] = { 
      ...updatedPrices[index], 
      [name]: name === 'price' ? Number(value) : value 
    };
    setProduct(prev => ({ ...prev, prices: updatedPrices }));
  };

  const handleAddPrice = () => {
    setProduct(prev => ({
      ...prev,
      prices: [...prev.prices, { packSize: "", price: 0 }]
    }));
  };

  const handleRemovePrice = (index) => {
    const updatedPrices = product.prices.filter((_, i) => i !== index);
    setProduct(prev => ({ ...prev, prices: updatedPrices }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      
      // Append all product fields
      formData.append("name", product.name);
      formData.append("description", product.description);
      formData.append("type", product.type);
      formData.append("weight", product.weight);
      formData.append("price", product.price);
      formData.append("stock", product.stock);
      formData.append("rating", product.rating);
      formData.append("featured", product.featured);
      formData.append("discount", product.discount);

      // Append image if changed
      if (imageFile) {
        formData.append("image", imageFile);
      }

      // Append price options
      product.prices.forEach((priceOption, index) => {
        formData.append(`prices[${index}][packSize]`, priceOption.packSize);
        formData.append(`prices[${index}][price]`, priceOption.price);
      });

      const response = await fetch(`${backendURL}/prod/update/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Update failed");
      }

      toast.success("Product updated successfully!");
      setTimeout(() => navigate("/admin/products"), 1500);

    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 mt-20">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => navigate("/admin/products")}
            className="mt-2 px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 mt-20 max-w-4xl">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-amber-500 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Edit Product</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={product.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description*
                </label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type*
                </label>
                <select
                  name="type"
                  value={product.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">Select a type</option>
                  {productTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight/Size*
                </label>
                <input
                  type="text"
                  name="weight"
                  value={product.weight}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price (₹)*
                </label>
                <input
                  type="number"
                  name="price"
                  value={product.price}
                  onChange={handleNumberInput}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity*
                </label>
                <input
                  type="number"
                  name="stock"
                  value={product.stock}
                  onChange={handleNumberInput}
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (1-5)
                </label>
                <input
                  type="number"
                  name="rating"
                  value={product.rating}
                  onChange={handleNumberInput}
                  min="1"
                  max="5"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  name="discount"
                  value={product.discount}
                  onChange={handleNumberInput}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="featured"
                  checked={product.featured}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Featured Product
                </label>
              </div>
            </div>
          </div>

          {/* Price Variants Section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Price Variants</h3>
            {product.prices.map((priceOption, index) => (
              <div key={index} className="flex items-end gap-4 mb-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    name="packSize"
                    value={priceOption.packSize}
                    onChange={(e) => handlePriceChange(index, e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={priceOption.price}
                    onChange={(e) => handlePriceChange(index, e)}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePrice(index)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPrice}
              className="mt-2 px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
            >
              + Add Price Variant
            </button>
          </div>

          {/* Image Section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-700 mb-2">Product Image</h3>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Image
                </label>
                <div className="border rounded-md p-2 flex justify-center">
                  <img
                    src={product.image || "/images/default-product.jpg"}
                    alt={product.name}
                    className="h-40 object-contain"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload New Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-amber-50 file:text-amber-700
                    hover:file:bg-amber-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG, or WEBP (Max 2MB)
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Update Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProduct;