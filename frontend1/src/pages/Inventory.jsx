import React, { useState, useEffect } from 'react';
import { Package, Warehouse as WarehouseIcon, TrendingDown, AlertTriangle, Loader2, Eye, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Filters
  const [filters, setFilters] = useState({
    warehouse: 'all',
    itemType: 'all',
  });

  const ITEM_TYPES = [
    { value: 'raw-material', label: 'Raw Material' },
    { value: 'finished-product', label: 'Finished Product' },
    { value: 'semi-finished', label: 'Semi-Finished' },
    { value: 'spare-part', label: 'Spare Part' }
  ];

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchData(true); // Silent refresh
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, filters]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      // Build query params
      const params = {};
      if (filters.warehouse !== 'all') params.warehouse = filters.warehouse;
      if (filters.itemType !== 'all') params.itemType = filters.itemType;

      const [inventoryRes, warehousesRes, statsRes] = await Promise.all([
        api.get('/warehouse/inventory', { params }),
        api.get('/warehouse/warehouses'),
        api.get('/warehouse/inventory/stats/overview')
      ]);

      setInventory(inventoryRes.data?.data?.items || []);
      setWarehouses(warehousesRes.data?.data || []);
      setStats(statsRes.data?.data || {});
      setLastUpdate(new Date());

      if (!silent) {
        console.log('✅ Inventory data loaded');
      }
    } catch (error) {
      console.error('❌ Inventory fetch error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to load inventory data';
      if (!silent) {
        toast.error(errorMsg);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      warehouse: 'all',
      itemType: 'all',
    });
  };

  const getItemTypeBadge = (type) => {
    const styles = {
      'raw-material': 'bg-blue-100 text-blue-700 border-blue-200',
      'finished-product': 'bg-green-100 text-green-700 border-green-200',
      'semi-finished': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'spare-part': 'bg-purple-100 text-purple-700 border-purple-200'
    };
    
    const labels = {
      'raw-material': 'Raw Material',
      'finished-product': 'Finished Product',
      'semi-finished': 'Semi-Finished',
      'spare-part': 'Spare Part'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[type] || 'bg-gray-100 text-gray-700'}`}>
        {labels[type] || type}
      </span>
    );
  };

  const getStockStatus = (item) => {
    const available = item.quantity - (item.reservedQuantity || 0);
    
    if (available <= 0) {
      return { label: 'Out of Stock', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else if (available < 10) {
      return { label: 'Low Stock', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    } else if (available < 50) {
      return { label: 'Medium', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    } else {
      return { label: 'Good Stock', color: 'text-green-600', bgColor: 'bg-green-100' };
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemName = (item) => {
    if (!item.item) return 'Unknown Item';
    
    return item.item.materialName || 
           item.item.productName || 
           item.item.machineName || 
           'Unknown Item';
  };

  const getItemCode = (item) => {
    if (!item.item) return '';
    
    return item.item.materialCode || 
           item.item.productCode || 
           item.item.machineCode || 
           '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500">Real-time inventory tracking across warehouses</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border transition ${
              autoRefresh 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
            type="button"
          >
            <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => fetchData()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
            type="button"
          >
            <RefreshCw size={20} /> Refresh Now
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalItems || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="text-blue-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Warehouses</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {warehouses.length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <WarehouseIcon className="text-green-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Low Stock Items</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {stats.lowStock?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <TrendingDown className="text-yellow-600" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Item Types</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats.byItemType?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <AlertTriangle className="text-purple-600" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-700">Filters</h3>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
            type="button"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warehouse
            </label>
            <select
              value={filters.warehouse}
              onChange={(e) => handleFilterChange('warehouse', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">All Warehouses</option>
              {warehouses.map(w => (
                <option key={w._id} value={w._id}>
                  {w.warehouseName} ({w.warehouseCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Type
            </label>
            <select
              value={filters.itemType}
              onChange={(e) => handleFilterChange('itemType', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              <option value="all">All Types</option>
              {ITEM_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Warehouse Breakdown */}
      {stats.byWarehouse && stats.byWarehouse.length > 0 && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">Inventory by Warehouse</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.byWarehouse.map((wh) => (
              <div
                key={wh._id}
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {wh.warehouseName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {wh.totalItems} Items
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <WarehouseIcon className="text-blue-600" size={20} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {wh.totalQuantity?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-600 mt-1">Total Units</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            Inventory Items ({inventory.length})
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {inventory.length === 0 
              ? 'No items found' 
              : `Showing ${inventory.length} item${inventory.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Item</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Location</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Available</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Package className="mx-auto mb-3 opacity-50" size={32} />
                      <p className="text-lg font-medium">No inventory items found</p>
                      <p className="text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const available = item.quantity - (item.reservedQuantity || 0);
                  
                  return (
                    <tr key={item._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {getItemName(item)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getItemCode(item)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getItemTypeBadge(item.itemType)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {item.warehouse?.warehouseName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.warehouse?.warehouseCode || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.location?.section && item.location?.rack
                          ? `${item.location.section}-${item.location.rack}`
                          : 'Not specified'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-gray-900">
                          {item.quantity} {item.unit}
                        </div>
                        {item.reservedQuantity > 0 && (
                          <div className="text-xs text-orange-600">
                            Reserved: {item.reservedQuantity}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold text-lg ${stockStatus.color}`}>
                          {available} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stockStatus.bgColor} ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats.lowStock && stats.lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-2">
                Low Stock Alert ({stats.lowStock.length} items)
              </h3>
              <div className="space-y-2">
                {stats.lowStock.slice(0, 5).map((item) => (
                  <div key={item._id} className="flex justify-between items-center bg-white p-3 rounded border">
                    <div>
                      <span className="font-medium text-gray-900">
                        {getItemName(item)}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        in {item.warehouse?.warehouseName}
                      </span>
                    </div>
                    <span className="font-bold text-yellow-600">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-gray-900">Item Details</h2>
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
                  <p className="text-gray-600 text-sm font-medium">Item Name</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {getItemName(selectedItem)}
                  </p>
                  <p className="text-xs text-gray-500">{getItemCode(selectedItem)}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm font-medium">Item Type</p>
                  <div className="mt-1">
                    {getItemTypeBadge(selectedItem.itemType)}
                  </div>
                </div>

                <div>
                  <p className="text-gray-600 text-sm font-medium">Warehouse</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedItem.warehouse?.warehouseName || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedItem.warehouse?.warehouseCode || ''}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm font-medium">Location</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedItem.location?.section && selectedItem.location?.rack
                      ? `Section: ${selectedItem.location.section}, Rack: ${selectedItem.location.rack}`
                      : 'Not specified'}
                  </p>
                  {selectedItem.location?.bin && (
                    <p className="text-xs text-gray-500">Bin: {selectedItem.location.bin}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-700 mb-4">Quantity Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Quantity:</span>
                    <span className="font-bold text-xl text-gray-900">
                      {selectedItem.quantity} {selectedItem.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Reserved Quantity:</span>
                    <span className="font-semibold text-orange-600">
                      {selectedItem.reservedQuantity || 0} {selectedItem.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-gray-600 font-medium">Available Quantity:</span>
                    <span className="font-bold text-2xl text-green-600">
                      {(selectedItem.quantity - (selectedItem.reservedQuantity || 0))} {selectedItem.unit}
                    </span>
                  </div>
                </div>
              </div>

              {selectedItem.lastStockCheck && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Last Stock Check</h3>
                  <p className="text-gray-900">{formatDate(selectedItem.lastStockCheck)}</p>
                </div>
              )}

              {selectedItem.notes && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
                  <p className="bg-gray-50 p-4 rounded-lg text-gray-900">
                    {selectedItem.notes}
                  </p>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-700 mb-2">Timestamps</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Created:</p>
                    <p className="text-gray-900">{formatDate(selectedItem.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Updated:</p>
                    <p className="text-gray-900">{formatDate(selectedItem.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
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

export default Inventory;