import React, { useState, useEffect } from 'react';
import { Eye, X, TrendingUp, TrendingDown, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api'; // ✅ FIXED: Import without .js extension

const Finance = () => {
  // ============================================================================
  // STATE VARIABLES
  // ============================================================================
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [error, setError] = useState('');

  // ============================================================================
  // FILTER STATE
  // ============================================================================
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    status: 'all'
  });

  // ============================================================================
  // CONSTANTS
  // ============================================================================
  const CATEGORIES = [
    'PAYROLL',
    'SUPPLIER',
    'MAINTENANCE',
    'INVENTORY',
    'PRODUCTION',
    'RAWMATERIAL',
    'PURCHASE'
  ];

  const TYPES = ['INCOME', 'EXPENSE'];
  const STATUSES = ['pending', 'cleared', 'failed'];

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================
  useEffect(() => {
    fetchData();
  }, [filters]);

  // ============================================================================
  // API METHODS
  // ============================================================================

  /**
   * Fetch finance data with current filters
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query parameters from filters
      const params = {};
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.status !== 'all') params.status = filters.status;

      console.log('Fetching finance with filters:', params);

      // Make parallel API calls
      const [transRes, statsRes] = await Promise.all([
        api.get('/finance', { params }),
        api.get('/finance/stats/overview')
      ]);

      // Extract data from responses
      setTransactions(transRes.data?.data?.transactions || []);
      setStats(statsRes.data?.data || {});

      console.log('Finance data loaded:', {
        transactionCount: transRes.data?.data?.transactions?.length || 0,
        stats: statsRes.data?.data
      });
    } catch (error) {
      console.error('Error fetching finance data:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load finance data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FILTER HANDLERS
  // ============================================================================

  /**
   * Handle filter change
   */
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    setFilters({
      type: 'all',
      category: 'all',
      status: 'all'
    });
  };

  // ============================================================================
  // UI HELPER METHODS
  // ============================================================================

  /**
   * Get color styling based on transaction type
   */
  const getTypeColor = (type) => {
    if (type === 'INCOME') {
      return 'text-green-600 bg-green-50 border-green-200';
    } else {
      return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  /**
   * Get badge styling for status
   */
  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'cleared': 'bg-green-100 text-green-700 border-green-300',
      'failed': 'bg-red-100 text-red-700 border-red-300'
    };
    const colors = styles[status] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  /**
   * Format date
   */
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ============================================================================
  // RENDER - LOADING STATE
  // ============================================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading finance data...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER - MAIN COMPONENT
  // ============================================================================
  const filteredCount = transactions.length;

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Finance Management</h1>
        <p className="text-gray-500">Track income and expense transactions</p>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Income</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                PKR {(stats.income || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="text-green-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Expense</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                PKR {(stats.expense || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <TrendingDown className="text-red-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Net Profit/Loss</p>
              <p className={`text-3xl font-bold mt-2 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                PKR {(stats.netProfit || 0).toLocaleString()}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${stats.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <DollarSign className={stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'} size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Transactions</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.totalTransactions || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Eye className="text-blue-600" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS SECTION */}
      <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Filters</h3>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
            type="button"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">All Types</option>
              {TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">All Status</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* BREAKDOWN BY CATEGORY */}
      {stats.byCategory && stats.byCategory.length > 0 && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">Breakdown by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.byCategory.map((item) => (
              <div
                key={`${item._id.type}-${item._id.category}`}
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {item._id.category}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Type: {item._id.type}
                    </p>
                  </div>
                  <span className={`text-lg font-bold px-3 py-1 rounded ${
                    item._id.type === 'INCOME' 
                      ? 'text-green-600 bg-green-50' 
                      : 'text-red-600 bg-red-50'
                  }`}>
                    PKR {item.total?.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Transactions: <span className="font-semibold">{item.count}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            Transactions ({filteredCount})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredCount === 0 ? 'No transactions found' : `Showing ${filteredCount} transaction${filteredCount !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Reference</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <AlertCircle className="mx-auto mb-3 opacity-50" size={32} />
                      <p className="text-lg font-medium">No transactions found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.onModel || 'Manual'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold text-sm ${
                        transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}PKR {transaction.amount?.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        type="button"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRANSACTION DETAILS MODAL */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
                type="button"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Date</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formatDate(selectedTransaction.transactionDate)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm font-medium">Type</p>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-block ${getTypeColor(selectedTransaction.type)}`}>
                      {selectedTransaction.type}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 text-sm font-medium">Category</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedTransaction.category}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm font-medium">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 text-sm font-medium">Reference Model</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedTransaction.onModel || 'Manual'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm font-medium">Payment Method</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedTransaction.paymentMethod || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <p className="text-gray-600 text-sm font-medium mb-2">Amount</p>
                <p className={`text-4xl font-bold ${
                  selectedTransaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedTransaction.type === 'INCOME' ? '+' : '-'}PKR {selectedTransaction.amount?.toLocaleString()}
                </p>
              </div>

              {selectedTransaction.description && (
                <div className="border-t pt-6">
                  <p className="text-gray-600 text-sm font-medium mb-2">Description</p>
                  <p className="bg-gray-50 p-4 rounded-lg text-gray-900">
                    {selectedTransaction.description}
                  </p>
                </div>
              )}

              {selectedTransaction.bankDetails && (
                <div className="border-t pt-6">
                  <p className="text-gray-600 text-sm font-medium mb-2">Bank Details</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                    <div>
                      <p className="text-gray-600 font-medium">Bank Name:</p>
                      <p className="text-gray-900">{selectedTransaction.bankDetails.bankName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Account Number:</p>
                      <p className="text-gray-900">{selectedTransaction.bankDetails.accountNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedTransaction.recordedBy && (
                <div className="border-t pt-6">
                  <p className="text-gray-600 text-sm font-medium">Recorded By</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedTransaction.recordedBy?.username || 'N/A'}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;