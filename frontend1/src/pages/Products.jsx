import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit, Trash2, Search, Package, AlertCircle, DollarSign } from 'lucide-react';

const PRODUCT_TYPES = [
  'Industrial Thread', 'Textile Thread', 'Wiper Thread', 'Lycra Thread', 
  'Khadar Thread', 'Karandi Thread', 'Wash & Wear Thread', 'Specialty Thread', 'Custom Thread'
];

const UNITS = ['kg', 'cone', 'bale', 'piece'];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ productType: '', isActive: 'true' });

  const initialFormState = {
    productName: '',
    productCode: '',
    productType: 'Industrial Thread',
    threadCount: 1,
    blendRatio: { cotton: 0, polyester: 0, recycled: 0 },
    productionDepartment: '',
    description: '',
    specifications: { strength: '', finish: '', color: '', weight: '', packaging: '' },
    costPrice: 0,
    sellingPrice: 0,
    currency: 'PKR',
    stockQuantity: 0,
    reorderLevel: 100,
    unit: 'kg',
    applications: []
  };

  const [formData, setFormData] = useState(initialFormState);
  const [applicationInput, setApplicationInput] = useState('');

  useEffect(() => { fetchData(); }, [filters, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(filters.productType && { productType: filters.productType }),
        ...(filters.isActive && { isActive: filters.isActive }),
        ...(searchTerm && { search: searchTerm })
      });

      const [productsRes, statsRes, deptsRes] = await Promise.all([
        api.get(`/products?${params}`),
        api.get('/products/stats/overview'),
        api.get('/departments')
      ]);

      setProducts(productsRes.data.data.products || []);
      setStats(statsRes.data.data || {});
      setDepartments(deptsRes.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = { ...formData, productCode: formData.productCode.toUpperCase() };
      if (isEditing) {
        await api.patch(`/products/${currentId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      closeModal();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (product) => {
    setIsEditing(true);
    setCurrentId(product._id);
    setFormData({
      productName: product.productName,
      productCode: product.productCode,
      productType: product.productType,
      threadCount: product.threadCount,
      blendRatio: product.blendRatio || { cotton: 0, polyester: 0, recycled: 0 },
      productionDepartment: product.productionDepartment?._id || '',
      description: product.description || '',
      specifications: product.specifications || { strength: '', finish: '', color: '', weight: '', packaging: '' },
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      currency: product.currency || 'PKR',
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
      unit: product.unit,
      applications: product.applications || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deactivate this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchData();
      } catch (error) {
        alert('Failed to deactivate product');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentId(null);
    setFormData(initialFormState);
    setApplicationInput('');
  };

  const addApplication = () => {
    if (applicationInput.trim()) {
      setFormData({ ...formData, applications: [...formData.applications, applicationInput.trim()] });
      setApplicationInput('');
    }
  };

  const removeApplication = (index) => {
    setFormData({ ...formData, applications: formData.applications.filter((_, i) => i !== index) });
  };

  const getStockBadge = (product) => {
    if (product.stockQuantity === 0) return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">OUT OF STOCK</span>;
    if (product.needsReorder) return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">LOW STOCK</span>;
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">IN STOCK</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-96">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Products</h1>
          <p className="text-sm text-gray-500">Manage finished goods inventory</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-600 transition">
          <Plus size={18} className="mr-2" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalProducts || 0}</h3>
            </div>
            <Package className="text-blue-500" size={28} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Products</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.activeProducts || 0}</h3>
            </div>
            <Package className="text-green-500" size={28} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Needs Reorder</p>
              <h3 className="text-2xl font-bold text-orange-600">{stats.needsReorder || 0}</h3>
            </div>
            <AlertCircle className="text-orange-500" size={28} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Stock Value</p>
              <h3 className="text-lg font-bold text-green-600">Rs. {(stats.stockValue?.totalValue || 0).toLocaleString()}</h3>
            </div>
            <DollarSign className="text-green-500" size={28} />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or code..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filters.productType} onChange={(e) => setFilters({ ...filters, productType: e.target.value })} className="border rounded-lg px-3 py-2">
          <option value="">All Types</option>
          {PRODUCT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select value={filters.isActive} onChange={(e) => setFilters({ ...filters, isActive: e.target.value })} className="border rounded-lg px-3 py-2">
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition relative group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-brand-900">{product.productName}</h3>
                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded">{product.productCode}</span>
              </div>
              {getStockBadge(product)}
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="font-medium">{product.productType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thread Count:</span>
                <span className="font-medium">{product.threadCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stock:</span>
                <span className="font-bold text-brand-900">{product.stockQuantity} {product.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Selling Price:</span>
                <span className="font-bold text-green-600">Rs. {product.sellingPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Profit Margin:</span>
                <span className="font-medium text-green-600">{product.profitMargin}%</span>
              </div>
            </div>

            {product.blendRatio && (
              <div className="border-t pt-3 mb-3">
                <p className="text-xs text-gray-500 mb-1">Blend Ratio:</p>
                <div className="flex gap-2 text-xs flex-wrap">
                  {product.blendRatio.cotton > 0 && <span className="bg-green-50 text-green-700 px-2 py-1 rounded">Cotton {product.blendRatio.cotton}%</span>}
                  {product.blendRatio.polyester > 0 && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">Polyester {product.blendRatio.polyester}%</span>}
                  {product.blendRatio.recycled > 0 && <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">Recycled {product.blendRatio.recycled}%</span>}
                </div>
              </div>
            )}

            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition flex gap-2">
              <button onClick={() => handleEdit(product)} className="p-1.5 bg-white border rounded shadow-sm hover:text-brand-500">
                <Edit size={14}/>
              </button>
              <button onClick={() => handleDelete(product._id)} className="p-1.5 bg-white border rounded shadow-sm hover:text-red-500">
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="col-span-full border-b pb-2 mb-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase">Basic Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <input value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} className="w-full border rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product Code *</label>
                <input value={formData.productCode} onChange={(e) => setFormData({ ...formData, productCode: e.target.value.toUpperCase() })} className="w-full border rounded-lg p-2 uppercase" placeholder="PRD-001" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Product Type *</label>
                <select value={formData.productType} onChange={(e) => setFormData({ ...formData, productType: e.target.value })} className="w-full border rounded-lg p-2">
                  {PRODUCT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Thread Count *</label>
                <input type="number" step="0.1" min="0.6" max="40" value={formData.threadCount} onChange={(e) => setFormData({ ...formData, threadCount: parseFloat(e.target.value) })} className="w-full border rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Production Department</label>
                <select value={formData.productionDepartment} onChange={(e) => setFormData({ ...formData, productionDepartment: e.target.value })} className="w-full border rounded-lg p-2">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Unit *</label>
                <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full border rounded-lg p-2">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="col-span-full border-b pb-2 mb-2 mt-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase">Blend Ratio (%)</h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cotton %</label>
                <input type="number" min="0" max="100" value={formData.blendRatio.cotton} onChange={(e) => setFormData({ ...formData, blendRatio: { ...formData.blendRatio, cotton: parseInt(e.target.value) || 0 } })} className="w-full border rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Polyester %</label>
                <input type="number" min="0" max="100" value={formData.blendRatio.polyester} onChange={(e) => setFormData({ ...formData, blendRatio: { ...formData.blendRatio, polyester: parseInt(e.target.value) || 0 } })} className="w-full border rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Recycled %</label>
                <input type="number" min="0" max="100" value={formData.blendRatio.recycled} onChange={(e) => setFormData({ ...formData, blendRatio: { ...formData.blendRatio, recycled: parseInt(e.target.value) || 0 } })} className="w-full border rounded-lg p-2" />
              </div>

              <div className="col-span-full border-b pb-2 mb-2 mt-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase">Pricing & Inventory</h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cost Price *</label>
                <input type="number" min="0" value={formData.costPrice} onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })} className="w-full border rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Selling Price *</label>
                <input type="number" min="0" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })} className="w-full border rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                <input type="number" min="0" value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })} className="w-full border rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reorder Level</label>
                <input type="number" min="0" value={formData.reorderLevel} onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) })} className="w-full border rounded-lg p-2" />
              </div>

              <div className="col-span-full border-b pb-2 mb-2 mt-2">
                <h3 className="text-sm font-bold text-gray-500 uppercase">Specifications</h3>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Strength</label>
                <input value={formData.specifications.strength} onChange={(e) => setFormData({ ...formData, specifications: { ...formData.specifications, strength: e.target.value } })} className="w-full border rounded-lg p-2" placeholder="High/Medium/Low" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Finish</label>
                <input value={formData.specifications.finish} onChange={(e) => setFormData({ ...formData, specifications: { ...formData.specifications, finish: e.target.value } })} className="w-full border rounded-lg p-2" placeholder="Smooth/Rough" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <input value={formData.specifications.color} onChange={(e) => setFormData({ ...formData, specifications: { ...formData.specifications, color: e.target.value } })} className="w-full border rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Packaging</label>
                <input value={formData.specifications.packaging} onChange={(e) => setFormData({ ...formData, specifications: { ...formData.specifications, packaging: e.target.value } })} className="w-full border rounded-lg p-2" placeholder="Cone/Bale" />
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded-lg p-2" rows={3} />
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-medium mb-1">Applications</label>
                <div className="flex gap-2 mb-2">
                  <input value={applicationInput} onChange={(e) => setApplicationInput(e.target.value)} className="flex-1 border rounded-lg p-2" placeholder="Add application..." />
                  <button onClick={addApplication} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.applications.map((app, idx) => (
                    <span key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {app}
                      <button onClick={() => removeApplication(idx)} className="text-red-500 hover:text-red-700">&times;</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="col-span-full flex justify-end gap-3 mt-4 pt-4 border-t">
                <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={handleSubmit} className="px-6 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-800">{isEditing ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;