import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
import { ShoppingCart, Phone, Search, Heart, Package, Filter, X } from "lucide-react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { CartContext } from "../context/CartContext";
import DefaultImage from "../assets/default-placeholder.png";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
const backendURL = process.env.REACT_APP_BACKEND_URL;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  // Filter states - updated to match schema
  const [priceRange, setPriceRange] = useState([0, 5000]); // Increased max price
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [organicOnly, setOrganicOnly] = useState(false);
 const [toggleTypeFilter, setToggleTypeFilter] = useState(false);
 const [toggleFavorite, setToggleFavorite] = useState(false);
 const { addToCart } = useContext(CartContext);
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${backendURL}/prod/all`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        // Process products with images
        const processedProducts = data.map(product => {
          // Handle base64 image data if present
          if (product.image?.data) {
            return {
              ...product,
              imageUrl: `data:${product.image.contentType};base64,${product.image.data.toString('base64')}`
            };
          }
          return product;
        });

        setProducts(processedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Load favorites from localStorage
    try {
      const storedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
      setFavorites(storedFavorites);
    } catch (err) {
      console.error("Error loading favorites:", err);
    }
  }, []);

  // Extract filter options from products - updated to match schema
  const allCategories = useMemo(() => {
    const categories = new Set();
    products.forEach(product => product.category && categories.add(product.category));
    return Array.from(categories).sort();
  }, [products]);

  const allSubCategories = useMemo(() => {
    const subCategories = new Set();
    products.forEach(product => product.subCategory && subCategories.add(product.subCategory));
    return Array.from(subCategories).sort();
  }, [products]);

  const allTypes = useMemo(() => {
    const types = new Set();
    products.forEach(product => product.type && types.add(product.type));
    return Array.from(types).sort();
  }, [products]);

  const allBrands = useMemo(() => {
    const brands = new Set();
    products.forEach(product => product.brand && brands.add(product.brand));
    return Array.from(brands).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter (search in name, brand, and description)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!(
          product.name?.toLowerCase().includes(searchLower) ||
          product.brand?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower)
        ) ){
          return false;
        }
      }

      // Price range filter (using sellingPrice if available)
      const productPrice = product.sellingPrice || product.price || 0;
      if (productPrice < priceRange[0] || productPrice > priceRange[1]) {
        return false;
      }

      // Category filter
      if (selectedCategories.length > 0 && (!product.category || !selectedCategories.includes(product.category))) {
        return false;
      }

      // Sub-category filter
      if (selectedSubCategories.length > 0 && (!product.subCategory || !selectedSubCategories.includes(product.subCategory))) {
        return false;
      }

      // Type filter
      if (selectedTypes.length > 0 && (!product.type || !selectedTypes.includes(product.type))) {
        return false;
      }

      // Brand filter
      if (selectedBrands.length > 0 && (!product.brand || !selectedBrands.includes(product.brand))) {
        return false;
      }

      // Organic filter
      if (organicOnly && !product.organic) {
        return false;
      }

      return true;
    });
  }, [products, searchTerm, priceRange, selectedCategories, selectedSubCategories, selectedTypes, selectedBrands, organicOnly]);

  // ... (keep toggleFavorite function the same)

  const toggleCategoryFilter = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleSubCategoryFilter = (subCategory) => {
    setSelectedSubCategories(prev =>
      prev.includes(subCategory)
        ? prev.filter(s => s !== subCategory)
        : [...prev, subCategory]
    );
  };

  const toggleBrandFilter = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const clearAllFilters = () => {
    setPriceRange([0, 5000]);
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setSelectedTypes([]);
    setSelectedBrands([]);
    setOrganicOnly(false);
    setSearchTerm("");
  };

   const resolveImageURL = (imageObj) => {
    if (!imageObj || !imageObj.base64 || !imageObj.contentType) return DefaultImage;
    return `data:${imageObj.contentType};base64,${imageObj.base64}`;
  };

  // ... (keep loading and error handling the same)

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-2" ref={containerRef}>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Premium Turmeric Products</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Mobile filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg"
          >
            <Filter className="w-5 h-5" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Sidebar Filters - updated to match schema */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 bg-white p-4 rounded-lg shadow-md h-fit`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={clearAllFilters}
                className="text-sm text-amber-600 hover:text-amber-800"
              >
                Clear all
              </button>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Price Range (₹)</h3>
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                  className="w-full mb-2"
                />
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span>₹{priceRange[0]}</span>
                <span>₹{priceRange[1]}</span>
              </div>
            </div>

            {/* Category Filter */}
            {allCategories.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Categories</h3>
                <div className="space-y-2">
                  {allCategories.map((category) => (
                    <div key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`category-${category}`}
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategoryFilter(category)}
                        className="mr-2"
                      />
                      <label htmlFor={`category-${category}`}>{category}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-Category Filter */}
            {allSubCategories.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Sub-Categories</h3>
                <div className="space-y-2">
                  {allSubCategories.map((subCategory) => (
                    <div key={subCategory} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`subcat-${subCategory}`}
                        checked={selectedSubCategories.includes(subCategory)}
                        onChange={() => toggleSubCategoryFilter(subCategory)}
                        className="mr-2"
                      />
                      <label htmlFor={`subcat-${subCategory}`}>{subCategory}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Type Filter */}
            {allTypes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Product Types</h3>
                <div className="space-y-2">
                  {allTypes.map((type) => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleTypeFilter(type)}
                        className="mr-2"
                      />
                      <label htmlFor={`type-${type}`}>{type}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Filter */}
            {allBrands.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Brands</h3>
                <div className="space-y-2">
                  {allBrands.map((brand) => (
                    <div key={brand} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`brand-${brand}`}
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrandFilter(brand)}
                        className="mr-2"
                      />
                      <label htmlFor={`brand-${brand}`}>{brand}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Organic Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Organic</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="organic-filter"
                  checked={organicOnly}
                  onChange={() => setOrganicOnly(!organicOnly)}
                  className="mr-2"
                />
                <label htmlFor="organic-filter">Organic Only</label>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search bar remains the same */}
            
            {/* Active filters display - updated */}
            {(priceRange[0] > 0 || priceRange[1] < 5000 || 
              selectedCategories.length > 0 || 
              selectedSubCategories.length > 0 || 
              selectedTypes.length > 0 || 
              selectedBrands.length > 0 || 
              organicOnly || 
              searchTerm) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {priceRange[0] > 0 && (
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    Min: ₹{priceRange[0]}
                  </span>
                )}
                {priceRange[1] < 5000 && (
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    Max: ₹{priceRange[1]}
                  </span>
                )}
                {selectedCategories.map(category => (
                  <span key={category} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    {category}
                  </span>
                ))}
                {selectedSubCategories.map(subCategory => (
                  <span key={subCategory} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    {subCategory}
                  </span>
                ))}
                {selectedTypes.map(type => (
                  <span key={type} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    {type}
                  </span>
                ))}
                {selectedBrands.map(brand => (
                  <span key={brand} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    {brand}
                  </span>
                ))}
                {organicOnly && (
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    Organic
                  </span>
                )}
                {searchTerm && (
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    Search: {searchTerm}
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  className="text-amber-600 hover:text-amber-800 text-sm flex items-center"
                >
                  <X className="w-4 h-4 mr-1" /> Clear
                </button>
              </div>
            )}

            {/* Product grid - updated to show more product info */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <Package className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                <p className="text-gray-600">No products found. Try adjusting your filters.</p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 text-amber-600 hover:text-amber-800 underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                 <div
          key={product._id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => navigate(`/product/${product._id}`, { state: { product } })}
        >
          <div className="relative">
            {/* <img
              src={resolveImageURL(product.image) || DefaultImage}
              alt={product.name}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.target.src = DefaultImage;
              }}
            /> */}
            <img
              src={resolveImageURL(product.image) || DefaultImage}
  alt={product.name}
  className="w-full h-48 object-cover"
  loading="lazy"
/>

            {product.discount > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                {product.discount}% OFF
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold truncate">{product.name}</h3>
              {product.organic && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Organic
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">{product.brand}</p>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {product.description}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-amber-600 font-medium">
                ₹{product.sellingPrice || product.price}
              </p>
              {product.sellingPrice &&
                product.price &&
                product.sellingPrice < product.price && (
                  <p className="text-gray-400 text-sm line-through">
                    ₹{product.price}
                  </p>
                )}
              {product.discount > 0 && (
                <span className="text-green-600 text-xs font-medium">
                  (Save {product.discount}%)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{product.quantity}</p>
            <div
              className="flex justify-between items-center mt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="text-amber-600 hover:text-amber-700 flex items-center gap-1">
                <Phone className="w-4 h-4" /> Contact
              </button>
              <button
                onClick={() => addToCart(product)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
              >
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;