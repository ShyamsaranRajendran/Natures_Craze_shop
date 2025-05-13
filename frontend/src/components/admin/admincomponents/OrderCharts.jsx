import React, { useEffect, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { FiDollarSign, FiShoppingBag, FiUsers, FiTrendingUp } from "react-icons/fi";

// Register necessary chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Extend dayjs with advanced formatting
dayjs.extend(advancedFormat);

const OrderCharts = ({ orders }) => {
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    uniqueCustomers: 0
  });

  useEffect(() => {
    if (!orders || orders.length === 0) return;

    const daily = {};
    const weekly = {};
    const monthly = {};
    const statusCounts = {};
    const revenueByMonth = {};
    const customerSet = new Set();
    let totalRevenue = 0;

    orders.forEach((order) => {
      // Basic metrics
      totalRevenue += order.totalAmount || 0;
      if (order.userId) customerSet.add(order.userId);

      // Date-based aggregations
      const createdAt = dayjs(order.createdAt);
      const day = createdAt.format("YYYY-MM-DD");
      const week = `${createdAt.format("YYYY")}-W${createdAt.isoWeek()}`;
      const month = createdAt.format("YYYY-MM");

      daily[day] = (daily[day] || 0) + 1;
      weekly[week] = (weekly[week] || 0) + 1;
      monthly[month] = (monthly[month] || 0) + 1;
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (order.totalAmount || 0);

      // Status distribution
      const status = order.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Set all the states
    setDailyData(Object.keys(daily).map((day) => ({ day, count: daily[day] })));
    setWeeklyData(Object.keys(weekly).map((week) => ({ week, count: weekly[week] })));
    setMonthlyData(Object.keys(monthly).map((month) => ({ month, count: monthly[month] })));
    setRevenueData(Object.keys(revenueByMonth).map((month) => ({ month, revenue: revenueByMonth[month] })));
    setStatusDistribution(Object.entries(statusCounts).map(([status, count]) => ({ status, count })));

    // Calculate metrics
    setMetrics({
      totalOrders: orders.length,
      totalRevenue,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      uniqueCustomers: customerSet.size
    });
  }, [orders]);

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Status color mapping
  const statusColors = {
    'pending': '#F59E0B',
    'processing': '#3B82F6',
    'completed': '#10B981',
    'shipped': '#8B5CF6',
    'cancelled': '#EF4444',
    'unknown': '#6B7280'
  };

  return (
    <div className="w-full p-6 space-y-8 bg-gray-50">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Order Analytics Dashboard
      </h2>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">
              <FiShoppingBag className="text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-800">{metrics.totalOrders}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">Since inception</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50 text-green-600">
              <FiDollarSign className="text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-800">{formatCurrency(metrics.totalRevenue)}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">All-time sales</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-50 text-purple-600">
              <FiTrendingUp className="text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Order Value</p>
              <p className="text-2xl font-semibold text-gray-800">{formatCurrency(metrics.avgOrderValue)}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">Per transaction</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-50 text-amber-600">
              <FiUsers className="text-2xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unique Customers</p>
              <p className="text-2xl font-semibold text-gray-800">{metrics.uniqueCustomers}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">Total customer base</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Orders Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Daily Order Volume</h3>
          <div className="h-80">
            <Bar
              data={{
                labels: dailyData.slice(-14).map((d) => dayjs(d.day).format("MMM D")),
                datasets: [
                  {
                    label: "Orders",
                    data: dailyData.slice(-14).map((d) => d.count),
                    backgroundColor: "rgba(79, 70, 229, 0.2)",
                    borderColor: "rgba(79, 70, 229, 1)",
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => `${context.parsed.y} orders`,
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0,
                    },
                  },
                },
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Last 14 days</p>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Order Status Distribution</h3>
          <div className="h-80">
            <Pie
              data={{
                labels: statusDistribution.map((s) => s.status.toUpperCase()),
                datasets: [
                  {
                    data: statusDistribution.map((s) => s.count),
                    backgroundColor: statusDistribution.map((s) => statusColors[s.status] || '#6B7280'),
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Monthly Data Section */}
      <div className="grid grid-cols-1 gap-8">
        {/* Monthly Revenue Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Revenue Trend</h3>
          <div className="h-80">
            <Line
              data={{
                labels: revenueData.map((r) => dayjs(r.month).format("MMM YYYY")),
                datasets: [
                  {
                    label: "Revenue",
                    data: revenueData.map((r) => r.revenue),
                    borderColor: "rgba(16, 185, 129, 1)",
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => formatCurrency(context.parsed.y),
                    },
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => formatCurrency(value).replace('₹', '₹ '),
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Monthly Orders Table */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Order Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Order Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyData.map((month, index) => {
                  const revenue = revenueData.find(r => r.month === month.month)?.revenue || 0;
                  const avgValue = month.count > 0 ? revenue / month.count : 0;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {dayjs(month.month).format("MMMM YYYY")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {month.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(avgValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCharts;