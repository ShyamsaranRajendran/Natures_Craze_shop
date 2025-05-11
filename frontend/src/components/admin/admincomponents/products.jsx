import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const backendURL = process.env.REACT_APP_BACKEND_URL;

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    quantity: "",
    minPrice: "",
    maxPrice: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${backendURL}/prod/all/Tableformat`);
        setProducts(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !filters.search ||
        product.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesQuantity = !filters.quantity || product.quantity === filters.quantity;
      const matchesPrice =
        (!filters.minPrice || product.price >= parseFloat(filters.minPrice)) &&
        (!filters.maxPrice || product.price <= parseFloat(filters.maxPrice));
      return matchesSearch && matchesQuantity && matchesPrice;
    });
  }, [products, filters]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const handlePageChange = useCallback((pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  }, [totalPages]);

  const handleExportToExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(
      filteredProducts.map((product) => ({
        "Product ID": product._id,
        "Product Name": product.name,
        "MRP": product.price,
        "Selling Price": product.sellingPrice,
        "Quantity": product.quantity,
        "In Stock": product.inStock ? "Yes" : "No",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products.xlsx");
  }, [filteredProducts]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Products</h1>

      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by product name"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-1/3"
          />
          <input
            type="text"
            placeholder="Filter by quantity (e.g., 500g)"
            value={filters.quantity}
            onChange={(e) => setFilters({ ...filters, quantity: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-1/4"
          />
          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-1/4"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            className="border border-gray-300 rounded-lg px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-1/4"
          />
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={handleExportToExcel}
          className="bg-green-500 text-white px-6 py-2 rounded-lg shadow hover:bg-green-600 transition duration-150"
        >
          Download as Excel
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3 border-b">Product ID</th>
                <th className="px-6 py-3 border-b">Name</th>
                <th className="px-6 py-3 border-b">Quantity</th>
                <th className="px-6 py-3 border-b">Pricing</th>
                <th className="px-6 py-3 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.length > 0 ? (
                currentProducts.map((product,index) => (
                  <tr key={product._id} className="hover:bg-gray-100 transition duration-150">
                    <td className="px-6 py-4 border-b">{index+1}</td>
                    <td className="px-6 py-4 border-b font-medium">{product.name}</td>
                    <td className="px-6 py-4 border-b">{product.quantity}</td>
                    <td className="px-6 py-4 border-b w-1/4">
                      <div className="p-2 bg-gray-50 rounded-lg shadow-sm">
                        <p>
                          <strong>MRP:</strong> ₹{product.price}<br />
                          <strong>Selling Price:</strong> ₹{product.sellingPrice}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b text-center">
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition duration-150"
                        onClick={() => (window.location.href = `/admin/products/edit/${product._id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500 border-b">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex justify-center">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg hover:bg-gray-400 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="mx-4 text-gray-600">Page {currentPage} of {totalPages}</span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg hover:bg-gray-400 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProductsPage;
