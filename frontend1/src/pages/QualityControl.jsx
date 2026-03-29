import React, { useEffect, useState } from 'react';
import { 
  TestTube, CheckCircle, XCircle, AlertTriangle, Plus, Edit, Trash2,
  TrendingUp, Eye, Download, Filter, Activity, X
} from 'lucide-react';

const QualityControl = () => {
  const [tests, setTests] = useState([]);
  const [stats, setStats] = useState({
    totalTests: 0,
    passRate: 0,
    byGrade: [],
    byStatus: [],
    recentRejected: []
  });
  const [products, setProducts] = useState([
    { _id: '1', productName: 'Cotton Yarn', productCode: 'CY-001' },
    { _id: '2', productName: 'Polyester Blend', productCode: 'PB-002' }
  ]);
  const [staff, setStaff] = useState([
    { _id: '1', name: 'John Smith' },
    { _id: '2', name: 'Jane Doe' }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20
  });
  
  const [filters, setFilters] = useState({
    product: '',
    overallGrade: '',
    overallStatus: '',
    startDate: '',
    endDate: ''
  });
  
  const initialFormData = {
    testDate: new Date().toISOString().split('T')[0],
    product: '',
    batchNumber: '',
    yarnTests: {
      strength: { value: '' },
      count: { value: '' },
      evenness: { cv: '' },
      moistureContent: { value: '' },
      twist: { tpi: '' },
      imperfections: { thinPlaces: 0, thickPlaces: 0, neps: 0 }
    },
    blendRatio: { cotton: 0, polyester: 0, recycled: 0 },
    overallGrade: 'A',
    overallStatus: 'approved',
    testedBy: '',
    testLocation: 'Laboratory',
    sampleSize: '',
    defects: [],
    notes: ''
  };
  
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchTests();
    fetchStats();
  }, [filters, pagination.currentPage]);

  const fetchTests = async () => {
    const mockTests = [
      {
        _id: '1',
        testDate: new Date().toISOString(),
        product: { productName: 'Cotton Yarn', productCode: 'CY-001' },
        batchNumber: 'BATCH-2024-001',
        overallGrade: 'A+',
        overallStatus: 'approved',
        testedBy: { name: 'John Smith' },
        yarnTests: { strength: { value: 15.5 }, count: { value: 20 } },
        defects: []
      },
      {
        _id: '2',
        testDate: new Date(Date.now() - 86400000).toISOString(),
        product: { productName: 'Polyester Blend', productCode: 'PB-002' },
        batchNumber: 'BATCH-2024-002',
        overallGrade: 'A',
        overallStatus: 'approved',
        testedBy: { name: 'Jane Doe' },
        yarnTests: { strength: { value: 14.2 }, count: { value: 18 } },
        defects: []
      }
    ];
    setTests(mockTests);
    setPagination({ currentPage: 1, totalPages: 1, totalCount: 2, limit: 20 });
  };

  const fetchStats = async () => {
    setStats({
      totalTests: 15,
      passRate: 87,
      byGrade: [
        { _id: 'A+', count: 5 },
        { _id: 'A', count: 7 },
        { _id: 'B', count: 2 },
        { _id: 'C', count: 1 }
      ],
      byStatus: [
        { _id: 'approved', count: 13 },
        { _id: 'rejected', count: 2 }
      ],
      recentRejected: []
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(isEditing ? 'Quality test updated successfully' : 'Quality test created successfully');
    setShowModal(false);
    resetForm();
    fetchTests();
    fetchStats();
  };

  const handleEdit = (test) => {
    setIsEditing(true);
    setSelectedTest(test);
    setFormData(test);
    setShowModal(true);
  };

  const handleViewDetails = (testId) => {
    const test = tests.find(t => t._id === testId);
    setSelectedTest(test);
    setShowDetailsModal(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this quality test?')) return;
    alert('Quality test deleted successfully');
    fetchTests();
    fetchStats();
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setSelectedTest(null);
  };

  const getGradeBadge = (grade) => {
    const styles = {
      'A+': 'bg-green-100 text-green-700 border-green-300',
      'A': 'bg-blue-100 text-blue-700 border-blue-300',
      'B': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'C': 'bg-orange-100 text-orange-700 border-orange-300',
      'Rejected': 'bg-red-100 text-red-700 border-red-300'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[grade] || 'bg-gray-100'}`}>
        {grade}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      'approved': 'bg-green-100 text-green-700',
      'rejected': 'bg-red-100 text-red-700',
      'rework': 'bg-yellow-100 text-yellow-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quality Control</h1>
          <p className="text-gray-500 text-sm mt-1">Manage product quality tests and reports</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="bg-gray-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-all shadow-sm font-medium"
          >
            <Download size={20} />
            Export
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm font-medium"
          >
            <Plus size={20} />
            New Quality Test
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tests</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTests}</h3>
            </div>
            <TestTube className="text-blue-500" size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pass Rate</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.passRate}%</h3>
            </div>
            <TrendingUp className="text-green-500" size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">
                {stats.byStatus?.find(s => s._id === 'approved')?.count || 0}
              </h3>
            </div>
            <CheckCircle className="text-green-500" size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">
                {stats.byStatus?.find(s => s._id === 'rejected')?.count || 0}
              </h3>
            </div>
            <XCircle className="text-red-500" size={28} />
          </div>
        </div>
      </div>

      {/* Grade Distribution & Recent Rejected */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-blue-600" />
            Grade Distribution
          </h3>
          <div className="space-y-3">
            {['A+', 'A', 'B', 'C'].map(grade => {
              const gradeData = stats.byGrade?.find(g => g._id === grade);
              const count = gradeData?.count || 0;
              const percentage = stats.totalTests > 0 ? ((count / stats.totalTests) * 100).toFixed(1) : 0;
              return (
                <div key={grade} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {getGradeBadge(grade)}
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          grade === 'A+' || grade === 'A' ? 'bg-green-500' :
                          grade === 'B' ? 'bg-yellow-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500">{percentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-600" />
            Recent Rejected Tests
          </h3>
          <div className="text-center py-8 text-gray-500">
            <p>No recent rejections</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-500" />
          <h3 className="font-semibold text-gray-700">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <select
            value={filters.product}
            onChange={(e) => setFilters({ ...filters, product: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Products</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.productName}</option>
            ))}
          </select>

          <select
            value={filters.overallGrade}
            onChange={(e) => setFilters({ ...filters, overallGrade: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Grades</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>

          <select
            value={filters.overallStatus}
            onChange={(e) => setFilters({ ...filters, overallStatus: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="rework">Rework</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <button
            onClick={() => setFilters({ product: '', overallGrade: '', overallStatus: '', startDate: '', endDate: '' })}
            className="border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition font-medium"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tested By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <TestTube size={48} className="mx-auto mb-2 opacity-20" />
                    <p>No quality tests found. Click "New Quality Test" to create one.</p>
                  </td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr key={test._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(test.testDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{test.product?.productName}</div>
                      <div className="text-sm text-gray-500">{test.product?.productCode}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{test.batchNumber || '-'}</td>
                    <td className="px-6 py-4">{getGradeBadge(test.overallGrade)}</td>
                    <td className="px-6 py-4">{getStatusBadge(test.overallStatus)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{test.testedBy?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(test._id)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(test)}
                          className="text-green-600 hover:text-green-800 transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(test._id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {tests.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Edit Quality Test' : 'New Quality Test'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-800 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Test Date *</label>
                    <input
                      required
                      type="date"
                      value={formData.testDate}
                      onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Product *</label>
                    <select
                      required
                      value={formData.product}
                      onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.productName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Batch Number</label>
                    <input
                      type="text"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter batch number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Tested By</label>
                    <select
                      value={formData.testedBy}
                      onChange={(e) => setFormData({ ...formData, testedBy: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Staff</option>
                      {staff.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Yarn Tests */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-800 mb-3">Yarn Tests</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Strength (cN/tex)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.yarnTests.strength.value}
                      onChange={(e) => setFormData({
                        ...formData,
                        yarnTests: { ...formData.yarnTests, strength: { ...formData.yarnTests.strength, value: e.target.value }}
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Count (Ne)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.yarnTests.count.value}
                      onChange={(e) => setFormData({
                        ...formData,
                        yarnTests: { ...formData.yarnTests, count: { ...formData.yarnTests.count, value: e.target.value }}
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Evenness CV (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.yarnTests.evenness.cv}
                      onChange={(e) => setFormData({
                        ...formData,
                        yarnTests: { ...formData.yarnTests, evenness: { ...formData.yarnTests.evenness, cv: e.target.value }}
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter value"
                    />
                  </div>
                </div>
              </div>

              {/* Imperfections */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-800 mb-3">Yarn Imperfections</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Thin Places</label>
                    <input
                      type="number"
                      value={formData.yarnTests.imperfections.thinPlaces}
                      onChange={(e) => setFormData({
                        ...formData,
                        yarnTests: { ...formData.yarnTests, imperfections: { ...formData.yarnTests.imperfections, thinPlaces: parseInt(e.target.value) }}
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Thick Places</label>
                    <input
                      type="number"
                      value={formData.yarnTests.imperfections.thickPlaces}
                      onChange={(e) => setFormData({
                        ...formData,
                        yarnTests: { ...formData.yarnTests, imperfections: { ...formData.yarnTests.imperfections, thickPlaces: parseInt(e.target.value) }}
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Neps</label>
                    <input
                      type="number"
                      value={formData.yarnTests.imperfections.neps}
                      onChange={(e) => setFormData({
                        ...formData,
                        yarnTests: { ...formData.yarnTests, imperfections: { ...formData.yarnTests.imperfections, neps: parseInt(e.target.value) }}
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Blend Ratio */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-800 mb-3">Blend Ratio (%)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Cotton</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.blendRatio.cotton}
                      onChange={(e) => setFormData({
                        ...formData,
                        blendRatio: { ...formData.blendRatio, cotton: parseFloat(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Polyester</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.blendRatio.polyester}
                      onChange={(e) => setFormData({
                        ...formData,
                        blendRatio: { ...formData.blendRatio, polyester: parseFloat(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Recycled</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.blendRatio.recycled}
                      onChange={(e) => setFormData({
                        ...formData,
                        blendRatio: { ...formData.blendRatio, recycled: parseFloat(e.target.value) }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Total</label>
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700">
                      {(formData.blendRatio.cotton + formData.blendRatio.polyester + formData.blendRatio.recycled).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Grade & Status */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-800 mb-3">Overall Result</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Overall Grade *</label>
                    <select
                      required
                      value={formData.overallGrade}
                      onChange={(e) => setFormData({ ...formData, overallGrade: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="A+">A+</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Status *</label>
                    <select
                      required
                      value={formData.overallStatus}
                      onChange={(e) => setFormData({ ...formData, overallStatus: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="rework">Rework</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Test Location</label>
                    <input
                      type="text"
                      value={formData.testLocation}
                      onChange={(e) => setFormData({ ...formData, testLocation: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="pb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter any additional notes..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border border-gray-300 rounded-lg px-6 py-2 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700 transition font-medium"
                >
                  {isEditing ? 'Update Test' : 'Create Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Test Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Test Date</p>
                    <p className="font-medium">{new Date(selectedTest.testDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Product</p>
                    <p className="font-medium">{selectedTest.product?.productName}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Batch Number</p>
                    <p className="font-medium">{selectedTest.batchNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Tested By</p>
                    <p className="font-medium">{selectedTest.testedBy?.name}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Test Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Grade</p>
                    <div>{getGradeBadge(selectedTest.overallGrade)}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <div>{getStatusBadge(selectedTest.overallStatus)}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Strength</p>
                    <p className="font-medium">{selectedTest.yarnTests?.strength?.value || 'N/A'} cN/tex</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Count</p>
                    <p className="font-medium">{selectedTest.yarnTests?.count?.value || 'N/A'} Ne</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="border border-gray-300 rounded-lg px-6 py-2 hover:bg-gray-50 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityControl;