import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, X, Phone, Mail, MapPin } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';
const token = localStorage.getItem('accessToken');

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const MATERIAL_TYPES = [
    'Cotton Fiber', 'Polyester Fiber', 'Recycled Material',
    'Chemical', 'Dye', 'Machinery', 'Spare Parts', 'Other'
  ];

  const PAYMENT_TERMS = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit-15', label: 'Credit 15 Days' },
    { value: 'credit-30', label: 'Credit 30 Days' },
    { value: 'credit-45', label: 'Credit 45 Days' },
    { value: 'credit-60', label: 'Credit 60 Days' },
    { value: 'advance', label: 'Advance Payment' }
  ];

  const initialForm = {
    supplierName: '',
    supplierCode: '',
    contactPerson: { name: '', designation: '', phone: '', email: '' },
    address: { street: '', city: '', state: '', country: 'Pakistan', postalCode: '' },
    phone: '',
    email: '',
    website: '',
    materialTypes: [],
    paymentTerms: 'credit-30',
    creditLimit: 0,
    taxId: '',
    ntn: '',
    rating: 3,
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/suppliers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      const data = await response.json();
      setSuppliers(data.data.suppliers || []);
      setError('');
    } catch (err) {
      setError(err.message);
      console.error(err);
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

  const handleMaterialToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      materialTypes: prev.materialTypes.includes(type)
        ? prev.materialTypes.filter(t => t !== type)
        : [...prev.materialTypes, type]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        phone: formData.phone ? [formData.phone] : [],
        creditLimit: Number(formData.creditLimit),
        rating: Number(formData.rating)
      };

      const method = isEditing ? 'PATCH' : 'POST';
      const url = isEditing ? `${API_BASE}/suppliers/${selectedId}` : `${API_BASE}/suppliers`;

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
        throw new Error(errData.message || 'Failed to save supplier');
      }

      await fetchSuppliers();
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (supplier) => {
    setIsEditing(true);
    setSelectedId(supplier._id);
    setFormData({
      supplierName: supplier.supplierName,
      supplierCode: supplier.supplierCode,
      contactPerson: supplier.contactPerson || { name: '', designation: '', phone: '', email: '' },
      address: supplier.address || { street: '', city: '', state: '', country: 'Pakistan', postalCode: '' },
      phone: supplier.phone?.[0] || '',
      email: supplier.email || '',
      website: supplier.website || '',
      materialTypes: supplier.materialTypes || [],
      paymentTerms: supplier.paymentTerms || 'credit-30',
      creditLimit: supplier.creditLimit || 0,
      taxId: supplier.taxId || '',
      ntn: supplier.ntn || '',
      rating: supplier.rating || 3,
      notes: supplier.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;

    try {
      const response = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete supplier');
      await fetchSuppliers();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setSelectedId(null);
    setFormData(initialForm);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.supplierCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-500">Manage and track suppliers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
        >
          <Plus size={20} /> Add Supplier
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
        {filteredSuppliers.map((supplier) => (
          <div key={supplier._id} className="bg-white p-6 rounded-lg border hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{supplier.supplierName}</h3>
                <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {supplier.supplierCode}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedSupplier(supplier); setShowDetails(true); }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Eye size={18} />
                </button>
                <button onClick={() => handleEdit(supplier)} className="p-2 text-green-600 hover:bg-green-50 rounded">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(supplier._id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              {supplier.contactPerson?.name && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{supplier.contactPerson.name}</span>
                </div>
              )}
              {supplier.phone?.[0] && (
                <div className="flex items-center gap-2">
                  <Phone size={14} /> {supplier.phone[0]}
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} /> {supplier.email}
                </div>
              )}
              {supplier.address?.city && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} /> {supplier.address.city}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Terms:</span>
                <span className="font-medium capitalize">{supplier.paymentTerms}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Rating:</span>
                <span className="font-medium">{supplier.rating}/5 ⭐</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name *</label>
                  <input
                    required
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier Code *</label>
                  <input
                    required
                    name="supplierCode"
                    value={formData.supplierCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                    placeholder="SUP-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="+92 42 1234567"
                  />
                </div>
              </div>

              {/* Contact Person */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Primary Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="contactPerson.name"
                    value={formData.contactPerson.name}
                    onChange={handleInputChange}
                    placeholder="Contact Name"
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    name="contactPerson.designation"
                    value={formData.contactPerson.designation}
                    onChange={handleInputChange}
                    placeholder="Designation"
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    name="contactPerson.phone"
                    value={formData.contactPerson.phone}
                    onChange={handleInputChange}
                    placeholder="Direct Phone"
                    className="px-4 py-2 border rounded-lg"
                  />
                  <input
                    name="contactPerson.email"
                    value={formData.contactPerson.email}
                    onChange={handleInputChange}
                    placeholder="Direct Email"
                    className="px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Financial */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Terms</label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {PAYMENT_TERMS.map(term => (
                      <option key={term.value} value={term.value}>{term.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Credit Limit</label>
                  <input
                    type="number"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rating (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    name="rating"
                    value={formData.rating}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Materials */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Materials Supplied</h3>
                <div className="grid grid-cols-2 gap-2">
                  {MATERIAL_TYPES.map(type => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.materialTypes.includes(type)}
                        onChange={() => handleMaterialToggle(type)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedSupplier.supplierName}</h2>
              <button onClick={() => setShowDetails(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Supplier Code</p>
                <p className="font-medium">{selectedSupplier.supplierCode}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{selectedSupplier.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone</p>
                <p className="font-medium">{selectedSupplier.phone?.[0] || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Payment Terms</p>
                <p className="font-medium capitalize">{selectedSupplier.paymentTerms}</p>
              </div>
              <div>
                <p className="text-gray-600">Credit Limit</p>
                <p className="font-medium">PKR {selectedSupplier.creditLimit?.toLocaleString() || '0'}</p>
              </div>
              <div>
                <p className="text-gray-600">Rating</p>
                <p className="font-medium">{selectedSupplier.rating}/5 ⭐</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <p className="text-gray-600 text-sm mb-2">Materials Supplied</p>
              <div className="flex flex-wrap gap-2">
                {selectedSupplier.materialTypes?.map(type => (
                  <span key={type} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button onClick={() => setShowDetails(false)} className="px-6 py-2 border rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;