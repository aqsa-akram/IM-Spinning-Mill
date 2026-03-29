import React, { useState, useEffect } from 'react';
import { Plus, Eye, X, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const Production = () => {
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [products, setProducts] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const QUALITY_GRADES = ['A', 'B', 'C', 'rejected'];
  const STATUS_OPTIONS = ['in-progress', 'completed', 'paused', 'cancelled'];
  const UNITS = ['kg', 'cone', 'bale', 'meter', 'piece'];

  const initialForm = {
    productionDate: new Date().toISOString().split('T')[0],
    department: '',
    product: '',
    shift: '',
    machine: '',
    operator: '',
    quantityProduced: 0,
    unit: 'kg',
    targetQuantity: 0,
    rawMaterialsUsed: [],
    qualityGrade: 'A',
    defectQuantity: 0,
    startTime: '',
    endTime: '',
    downtime: 0,
    downtimeReason: '',
    batchNumber: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [materialInput, setMaterialInput] = useState({ material: '', quantityUsed: 0, unit: 'kg' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Make API calls with proper error handling for each
      const requests = [
        api.get('/production').catch(err => ({ data: { data: { records: [] } } })),
        api.get('/departments').catch(err => ({ data: { data: [] } })),
        api.get('/warehouse/products').catch(err => ({ data: { data: { products: [] } } })), // Changed from /products
        api.get('/shifts').catch(err => ({ data: { data: [] } })),
        api.get('/staff').catch(err => ({ data: { data: { staff: [] } } })),
        api.get('/raw-materials').catch(err => ({ data: { data: { materials: [] } } })),
        api.get('/production/stats/overview').catch(err => ({ data: { data: {} } }))
      ];

      const [recordsRes, deptRes, prodRes, shiftRes, staffRes, matRes, statsRes] = await Promise.all(requests);

      setRecords(recordsRes.data?.data?.records || []);
      setDepartments(deptRes.data?.data || []);
      setProducts(prodRes.data?.data?.products || []);
      setShifts(shiftRes.data?.data || []);
      setStaff(staffRes.data?.data?.staff || []);
      setRawMaterials(matRes.data?.data?.materials || []);
      setStats(statsRes.data?.data || {});

      console.log('✅ Production data loaded successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load production data';
      console.error('❌ Production fetch error:', err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addMaterial = () => {
    if (materialInput.material && materialInput.quantityUsed > 0) {
      setFormData(prev => ({
        ...prev,
        rawMaterialsUsed: [...prev.rawMaterialsUsed, { ...materialInput }]
      }));
      setMaterialInput({ material: '', quantityUsed: 0, unit: 'kg' });
      toast.success('Material added');
    } else {
      toast.error('Please select material and enter quantity');
    }
  };

  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      rawMaterialsUsed: prev.rawMaterialsUsed.filter((_, i) => i !== index)
    }));
    toast.success('Material removed');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      if (!formData.department || !formData.product || !formData.operator) {
        throw new Error('Please fill all required fields (Department, Product, Operator)');
      }

      if (formData.quantityProduced <= 0) {
        throw new Error('Quantity produced must be greater than 0');
      }

      const payload = {
        ...formData,
        quantityProduced: Number(formData.quantityProduced),
        targetQuantity: Number(formData.targetQuantity),
        defectQuantity: Number(formData.defectQuantity),
        downtime: Number(formData.downtime)
      };

      console.log('📤 Submitting production record:', payload);

      await api.post('/production', payload);

      toast.success('✅ Production record created successfully!');
      await fetchData();
      setFormData(initialForm);
      setShowModal(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to record production';
      console.error('❌ Production submit error:', err);
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
      'completed': 'bg-green-100 text-green-700 border-green-200',
      'paused': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'cancelled': 'bg-red-100 text-red-700 border-red-200'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-100'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const getQualityBadge = (grade) => {
    const styles = {
      'A': 'bg-green-100 text-green-700 border-green-200',
      'B': 'bg-blue-100 text-blue-700 border-blue-200',
      'C': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'rejected': 'bg-red-100 text-red-700 border-red-200'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[grade] || 'bg-gray-100'}`}>
        Grade {grade}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading production data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Management</h1>
          <p className="text-gray-500">Track daily production records</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          type="button"
        >
          <Plus size={20} /> Record Production
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <p className="text-gray-600 text-sm font-medium">Total Records</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRecords || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <p className="text-gray-600 text-sm font-medium">Total Output</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {stats.totalProduction?.total?.toLocaleString() || '0'} kg
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <p className="text-gray-600 text-sm font-medium">Avg Efficiency</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {stats.efficiency?.avgEfficiency?.toFixed(1) || '0'}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition">
          <p className="text-gray-600 text-sm font-medium">Defects</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {stats.totalProduction?.defects?.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            Production Records ({records.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Department</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Operator</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Output</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Quality</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Efficiency</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <AlertCircle className="mx-auto mb-3 opacity-50" size={32} />
                      <p className="text-lg font-medium">No production records found</p>
                      <p className="text-sm mt-1">Start by recording your first production</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(record.productionDate).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{record.product?.productName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{record.product?.productCode || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.department?.departmentName || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{record.operator?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{record.operator?.employeeId || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {record.quantityProduced} {record.unit}
                      </div>
                      {record.targetQuantity > 0 && (
                        <div className="text-xs text-gray-500">Target: {record.targetQuantity}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">{getQualityBadge(record.qualityGrade)}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold text-sm ${
                        record.efficiency >= 80 
                          ? 'text-green-600' 
                          : record.efficiency >= 60 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                      }`}>
                        {record.efficiency?.toFixed(1) || '0'}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => { 
                          setSelectedRecord(record); 
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Record Production</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition"
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Details */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Basic Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Production Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="productionDate"
                      value={formData.productionDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d._id} value={d._id}>{d.departmentName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="product"
                      value={formData.product}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.productName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shift <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="shift"
                      value={formData.shift}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Shift</option>
                      {shifts.map(s => (
                        <option key={s._id} value={s._id}>{s.shiftName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operator <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="operator"
                      value={formData.operator}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Operator</option>
                      {staff.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Production Quantities */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Production Quantities</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity Produced <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="quantityProduced"
                      value={formData.quantityProduced}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {UNITS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Quantity
                    </label>
                    <input
                      type="number"
                      name="targetQuantity"
                      value={formData.targetQuantity}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Quality Metrics */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Quality Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quality Grade <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="qualityGrade"
                      value={formData.qualityGrade}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {QUALITY_GRADES.map(g => (
                        <option key={g} value={g}>Grade {g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Defect Quantity
                    </label>
                    <input
                      type="number"
                      name="defectQuantity"
                      value={formData.defectQuantity}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleInputChange}
                      placeholder="BATCH-001"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Raw Materials */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Raw Materials Used</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <select
                    value={materialInput.material}
                    onChange={(e) => setMaterialInput(prev => ({ ...prev, material: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Material</option>
                    {rawMaterials.map(m => (
                      <option key={m._id} value={m._id}>{m.materialName}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Quantity Used"
                    value={materialInput.quantityUsed}
                    onChange={(e) => setMaterialInput(prev => ({ ...prev, quantityUsed: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={materialInput.unit}
                    onChange={(e) => setMaterialInput(prev => ({ ...prev, unit: e.target.value }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <button
                    onClick={addMaterial}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                    type="button"
                  >
                    Add Material
                  </button>
                </div>

                {formData.rawMaterialsUsed.length > 0 && (
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-3">Materials Added:</p>
                    <div className="space-y-2">
                      {formData.rawMaterialsUsed.map((mat, idx) => {
                        const material = rawMaterials.find(m => m._id === mat.material);
                        return (
                          <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border">
                            <span className="text-sm font-medium text-gray-900">
                              {material?.materialName || 'Unknown'} - {mat.quantityUsed} {mat.unit}
                            </span>
                            <button
                              onClick={() => removeMaterial(idx)}
                              className="text-red-500 hover:text-red-700 font-bold transition"
                              type="button"
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Additional notes about this production..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition" 
                  type="button"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center gap-2"
                  type="button"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Recording...
                    </>
                  ) : (
                    'Record Production'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedRecord.product?.productName || 'Production Details'}
              </h2>
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
                    {new Date(selectedRecord.productionDate).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Operator</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedRecord.operator?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">{selectedRecord.operator?.employeeId || ''}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Department</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedRecord.department?.departmentName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-medium">Shift</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {selectedRecord.shift?.shiftName || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-700 mb-4">Production Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Quantity Produced:</span>
                    <span className="font-bold text-lg text-green-600">
                      {selectedRecord.quantityProduced} {selectedRecord.unit}
                    </span>
                  </div>
                  {selectedRecord.targetQuantity > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Target Quantity:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedRecord.targetQuantity} {selectedRecord.unit}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Quality Grade:</span>
                    <span>{getQualityBadge(selectedRecord.qualityGrade)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Defects:</span>
                    <span className="font-medium text-red-600">
                      {selectedRecord.defectQuantity || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Efficiency:</span>
                    <span className={`font-bold ${
                      selectedRecord.efficiency >= 80 
                        ? 'text-green-600' 
                        : selectedRecord.efficiency >= 60 
                        ? 'text-yellow-600' 
                        : 'text-red-600'
                    }`}>
                      {selectedRecord.efficiency?.toFixed(1) || '0'}%
                    </span>
                  </div>
                  {selectedRecord.batchNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Batch Number:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedRecord.batchNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedRecord.rawMaterialsUsed && selectedRecord.rawMaterialsUsed.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Raw Materials Used</h3>
                  <div className="space-y-2">
                    {selectedRecord.rawMaterialsUsed.map((mat, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-900">
                          {mat.material?.materialName || 'Unknown Material'}
                        </span>
                        <span className="font-semibold text-gray-700">
                          {mat.quantityUsed} {mat.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecord.notes && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition" 
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

export default Production;