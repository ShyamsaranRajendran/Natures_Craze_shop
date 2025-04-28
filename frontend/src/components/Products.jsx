import React, { useState, useLayoutEffect, useRef, useMemo, useContext } from "react";
import { ShoppingCart, Phone, Search, Heart, Package, Filter, X } from "lucide-react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { CartContext } from "../context/CartContext";
import DefaultImage from "../assets/default-placeholder.png";
import "react-toastify/dist/ReactToastify.css";
import ProductsLoader from "./ProductsLoader";

// Import your product images
import kasturiImg from "../assets/kasturi.jpg";
import capImg from "../assets/capsules.jpg";
import soapImg from "../assets/soap.jpg";
import teaImg from "../assets/tea.jpg";
import oilImg from "../assets/oil.jpg";
import faceImg from "../assets/face.jpg";

const backendURL = process.env.REACT_APP_BACKEND_URL;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef(null);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedWeights, setSelectedWeights] = useState([]);

  const { addToCart } = useContext(CartContext);

  useLayoutEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${backendURL}/prod/all`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        const mockProducts = [
          {
            _id: "101",
            name: "Kasturi Turmeric",
            description: "Pure Kasturi turmeric ideal for skincare and medicinal use",
            image: kasturiImg,
            type: "Kasturi",
            weight: "100g",
            price: 130,
          },
          {
            _id: "102",
            name: "Turmeric Face Wash",
            description: "Gentle turmeric-infused face wash for naturally radiant and clear skin.",
            image: faceImg,
            type: "Wild",
            weight: "250g",
            price: 160,
          },
          {
            _id: "103",
            name: "Turmeric Capsules",
            description: "Easy-to-consume capsules with 95% curcumin concentration",
            image: capImg,
            type: "Capsule",
            weight: "60 capsules",
            price: 200,
          },
          {
            _id: "104",
            name: "Haldi Soap",
            description: "Turmeric infused handmade bathing soap",
            image: soapImg,
            type: "Bath",
            weight: "75g",
            price: 55,
          },
          {
            _id: "105",
            name: "Turmeric Tea Mix",
            description: "Healthy herbal tea blend with turmeric and ginger",
            image: teaImg,
            type: "Tea",
            weight: "150g",
            price: 110,
          },
          {
            _id: "106",
            name: "Turmeric Essential Oil",
            description: "Aromatic essential oil for skin and wellness",
            image: oilImg,
            type: "Oil",
            weight: "30ml",
            price: 180,
          }
        ];

        setProducts([ ...mockProducts]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    const storedFavorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(storedFavorites);
  }, []);

  // Extract all unique types and weights for filters
  const allTypes = useMemo(() => {
    const types = new Set();
    products.forEach(product => types.add(product.type));
    return Array.from(types);
  }, [products]);

  const allWeights = useMemo(() => {
    const weights = new Set();
    products.forEach(product => weights.add(product.weight));
    return Array.from(weights);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Apply search filter
    if (searchTerm) {
      const regex = new RegExp(searchTerm, "i");
      result = result.filter((product) => regex.test(product.name));
    }

    // Apply price range filter
    result = result.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Apply type filter if any types are selected
    if (selectedTypes.length > 0) {
      result = result.filter((product) =>
        selectedTypes.includes(product.type)
      );
    }

    // Apply weight filter if any weights are selected
    if (selectedWeights.length > 0) {
      result = result.filter((product) =>
        selectedWeights.includes(product.weight)
      );
    }

    return result;
  }, [products, searchTerm, priceRange, selectedTypes, selectedWeights]);

  const toggleFavorite = (productId) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];

    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
    toast.success(`Product ${favorites.includes(productId) ? "removed from" : "added to"} favorites!`);
  };

  const toggleTypeFilter = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleWeightFilter = (weight) => {
    setSelectedWeights(prev =>
      prev.includes(weight)
        ? prev.filter(w => w !== weight)
        : [...prev, weight]
    );
  };

  const clearAllFilters = () => {
    setPriceRange([0, 500]);
    setSelectedTypes([]);
    setSelectedWeights([]);
  };

  if (loading) {
    return <ProductsLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-medium text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-2" ref={containerRef}>
      <ToastContainer position="top-right" theme="colored" />

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

          {/* Sidebar Filters - Hidden on mobile unless showFilters is true */}
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
              <h3 className="font-medium mb-2">Price Range</h3>
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                  className="w-full mb-2"
                />
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
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

            {/* Type Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Product Type</h3>
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

            {/* Weight Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-2">Weight/Size</h3>
              <div className="space-y-2">
                {allWeights.map((weight) => (
                  <div key={weight} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`weight-${weight}`}
                      checked={selectedWeights.includes(weight)}
                      onChange={() => toggleWeightFilter(weight)}
                      className="mr-2"
                    />
                    <label htmlFor={`weight-${weight}`}>{weight}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="relative max-w-2xl mx-auto mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-amber-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Active filters display */}
            {(priceRange[0] > 0 || priceRange[1] < 500 || selectedTypes.length > 0 || selectedWeights.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {priceRange[0] > 0 && (
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    Min: ₹{priceRange[0]}
                  </span>
                )}
                {priceRange[1] < 500 && (
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    Max: ₹{priceRange[1]}
                  </span>
                )}
                {selectedTypes.map(type => (
                  <span key={type} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    {type}
                  </span>
                ))}
                {selectedWeights.map(weight => (
                  <span key={weight} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                    {weight}
                  </span>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="text-amber-600 hover:text-amber-800 text-sm flex items-center"
                >
                  <X className="w-4 h-4 mr-1" /> Clear
                </button>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <Package className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                <p className="text-gray-600">No products found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <Link to={`/product/${product._id}`}>
                      <div className="relative">
                        <img
                          src={product.image || DefaultImage}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite(product._id);
                          }}
                          className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md"
                        >
                          <Heart className={`w-5 h-5 ${favorites.includes(product._id) ? "text-red-500" : "text-gray-400"}`} />
                        </button>
                      </div>
                    </Link>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold truncate">{product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                      <p className="text-amber-600 font-medium mt-2">₹{product.price}</p>
                      <div className="flex justify-between items-center mt-4">
                        <button className="text-amber-600 hover:text-amber-700">
                          <Phone className="w-5 h-5 inline-block" /> Contact
                        </button>
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <ShoppingCart className="w-5 h-5 inline-block" /> Add to Cart
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