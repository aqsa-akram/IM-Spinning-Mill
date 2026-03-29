import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, X, Layers } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';
const token = localStorage.getItem('accessToken');

const RawMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const MATERIAL_TYPES = [
    'Cotton Fiber', 'Polyester Fiber', 'Recycled Material', 'Cotton PC2',
    'Blended Fiber', 'Chemical', 'Dye', 'Other'
  ];

  const initialForm = {
    materialName: '',
    materialCode: '',
    materialType: 'Cotton Fiber',
    description: '',
    unit: 'kg',
    stockQuantity: 0,
    reorderLevel: 100,
    maxStockLevel: 1000,
    unitPrice: 0,
    currency: 'PKR',
    supplier: '',
    location: { warehouse: '', section: '', rack: '' },
    specifications: { quality: '', grade: '', origin: '' }
  };

  const [formData, setFormData] = useState(initialForm);
  const [stockForm, setStockForm] = useState({ type: 'add', quantity: 0, reason: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matRes, supRes] = await Promise.all([
        fetch(`${API_BASE}/raw-materials`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!matRes.ok || !supRes.ok) throw new Error('Failed to fetch data');

      const matData = await matRes.json();
      const supData = await supRes.json();

      setMaterials(matData.data.materials || []);
      setSuppliers(supData.data.suppliers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      if (!formData.materialName || !formData.materialCode) {
        throw new Error('Material name and code are required');
      }

      const payload = {
        ...formData,
        stockQuantity: Number(formData.stockQuantity),
        reorderLevel: Number(formData.reorderLevel),
        maxStockLevel: Number(formData.maxStockLevel),
        unitPrice: Number(formData.unitPrice)
      };

      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing ? `${API_BASE}/raw-materials/${selectedId}` : `${API_BASE}/raw-materials`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to save material');
      }

      await fetchData();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (material) => {
    setIsEditing(true);
    setSelectedId(material._id);
    setFormData({
      materialName: material.materialName,
      materialCode: material.materialCode,
      materialType: material.materialType,
      description: material.description || '',
      unit: material.unit,
      stockQuantity: material.stockQuantity,
      reorderLevel: material.reorderLevel,
      maxStockLevel: material.maxStockLevel || 0,
      unitPrice: material.unitPrice,
      currency: material.currency || 'PKR',
      supplier: material.supplier?._id || '',
      location: material.location || { warehouse: '', section: '', rack: '' },
      specifications: material.specifications || { quality: '', grade: '', origin: '' }
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;

    try {
      const response = await fetch(`${API_BASE}/raw-materials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete');
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStockSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/raw-materials/${selectedId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...stockForm,
          quantity: Number(stockForm.quantity)
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update stock');
      }

      await fetchData();
      setShowStockModal(false);
      setStockForm({ type: 'add', quantity: 0, reason: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedId(null);
    setFormData(initialForm);
  };

  const filteredMaterials = materials.filter(m =>
    m.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.materialCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-96">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Raw Materials</h1>
          <p className="text-gray-500">Manage inventory stock</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> Add Material
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg border">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => (
          <div key={material._id} className="bg-white p-6 rounded-lg border hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{material.materialName}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {material.materialCode}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {material.materialType}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedMaterial(material); setShowDetailsModal(true); }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  type="button"
                >
                  <Eye size={18} />
                </button>
                <button onClick={() => handleEdit(material)} className="p-2 text-green-600 hover:bg-green-50 rounded" type="button">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(material._id)} className="p-2 text-red-600 hover:bg-red-50 rounded" type="button">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Stock:</span>
                <span className={`font-bold ${material.needsReorder ? 'text-red-600' : 'text-green-600'}`}>
                  {material.stockQuantity} {material.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unit Price:</span>
                <span className="font-medium">{material.unitPrice} {material.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reorder Level:</span>
                <span className="font-medium">{material.reorderLevel}</span>
              </div>
            </div>

            <button
              onClick={() => { setSelectedId(material._id); setShowStockModal(true); }}
              className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-2"
              type="button"
            >
              <Layers size={16} /> Adjust Stock
            </button>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {isEditing ? 'Edit Material' : 'Add New Material'}
              </h2>
              <button onClick={closeModal} type="button">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Material Name *</label>
                    <input
                      type="text"
                      name="materialName"
                      value={formData.materialName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="e.g. Premium Cotton"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Material Code *</label>
                    <input
                      type="text"
                      name="materialCode"
                      value={formData.materialCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg uppercase"
                      placeholder="MAT-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <select
                      name="materialType"
                      value={formData.materialType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      {MATERIAL_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit</label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      {['kg', 'ton', 'litre', 'meter', 'piece', 'bale'].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Pricing & Stock</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Unit Price *</label>
                    <input
                      type="number"
                      name="unitPrice"
                      value={formData.unitPrice}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Reorder Level</label>
                    <input
                      type="number"
                      name="reorderLevel"
                      value={formData.reorderLevel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Stock</label>
                    <input
                      type="number"
                      name="maxStockLevel"
                      value={formData.maxStockLevel}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Supplier</label>
                    <select
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map(s => (
                        <option key={s._id} value={s._id}>{s.supplierName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Storage Location</h3>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="location.warehouse"
                    value={formData.location.warehouse}
                    onChange={handleInputChange}
                    placeholder="Warehouse"
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    name="location.section"
                    value={formData.location.section}
                    onChange={handleInputChange}
                    placeholder="Section"
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    name="location.rack"
                    value={formData.location.rack}
                    onChange={handleInputChange}
                    placeholder="Rack"
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button onClick={closeModal} className="px-6 py-2 border rounded-lg" type="button">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  type="button"
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-2xl font-bold mb-6">Adjust Stock</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Action Type</label>
                <select
                  value={stockForm.type}
                  onChange={(e) => setStockForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="add">Add Stock (+)</option>
                  <option value="remove">Remove Stock (-)</option>
                  <option value="set">Set Exact Quantity</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason *</label>
                <input
                  type="text"
                  value={stockForm.reason}
                  onChange={(e) => setStockForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. New Purchase, Damaged"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setShowStockModal(false)} className="px-4 py-2 border rounded-lg" type="button">
                  Cancel
                </button>
                <button
                  onClick={handleStockSubmit}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  type="button"
                >
                  {submitting ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedMaterial.materialName}</h2>
              <button onClick={() => setShowDetailsModal(false)} type="button">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-600">Code</p><p className="font-medium">{selectedMaterial.materialCode}</p></div>
              <div><p className="text-gray-600">Type</p><p className="font-medium">{selectedMaterial.materialType}</p></div>
              <div><p className="text-gray-600">Unit Price</p><p className="font-medium">{selectedMaterial.unitPrice} {selectedMaterial.currency}</p></div>
              <div><p className="text-gray-600">Current Stock</p><p className="font-bold text-lg">{selectedMaterial.stockQuantity} {selectedMaterial.unit}</p></div>
              <div><p className="text-gray-600">Supplier</p><p className="font-medium">{selectedMaterial.supplier?.supplierName || 'N/A'}</p></div>
              <div><p className="text-gray-600">Status</p><p className={`font-medium ${selectedMaterial.needsReorder ? 'text-red-600' : 'text-green-600'}`}>{selectedMaterial.needsReorder ? 'Low Stock' : 'Normal'}</p></div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button onClick={() => setShowDetailsModal(false)} className="px-6 py-2 border rounded-lg" type="button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RawMaterials;