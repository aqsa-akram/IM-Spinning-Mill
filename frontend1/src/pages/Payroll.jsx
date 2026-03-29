import React, { useState, useEffect } from 'react';
import { Plus, Eye, X, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';
const token = localStorage.getItem('accessToken');

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const initialForm = {
    staff: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: '',
    allowances: { housing: 0, transport: 0, medical: 0, food: 0, other: 0 },
    bonuses: { performance: 0, attendance: 0, production: 0, festive: 0, other: 0 },
    deductions: { tax: 0, providentFund: 0, eobi: 0, insurance: 0, loan: 0, advance: 0, latePenalty: 0, other: 0 },
    overtimeRate: 100
  };

  const [formData, setFormData] = useState(initialForm);
  const [paymentData, setPaymentData] = useState({ paymentStatus: 'paid', paymentMethod: 'cash' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payrollRes, staffRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/payroll`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/staff`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/payroll/stats/overview`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!payrollRes.ok || !staffRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');

      const payrollData = await payrollRes.json();
      const staffData = await staffRes.json();
      const statsData = await statsRes.json();

      setPayrolls(payrollData.data.payrolls || []);
      setStaff(staffData.data.staff || []);
      setStats(statsData.data || {});
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
        [parent]: { ...prev[parent], [child]: parseFloat(value) || 0 }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      if (!formData.staff || !formData.basicSalary) {
        throw new Error('Staff and basic salary are required');
      }

      const payload = {
        ...formData,
        basicSalary: Number(formData.basicSalary),
        month: Number(formData.month),
        year: Number(formData.year),
        overtimeRate: Number(formData.overtimeRate)
      };

      const response = await fetch(`${API_BASE}/payroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to generate payroll');
      }

      await fetchData();
      setFormData(initialForm);
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!window.confirm('Generate payroll for all active staff?')) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/payroll/bulk-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to generate payroll');
      }

      await fetchData();
      alert('Payroll generated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/payroll/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ paymentStatus: status, paymentMethod: paymentData.paymentMethod })
      });

      if (!response.ok) throw new Error('Failed to update status');
      await fetchData();
      setShowPaymentModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'processed': 'bg-blue-100 text-blue-700',
      'paid': 'bg-green-100 text-green-700',
      'hold': 'bg-red-100 text-red-700'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>;
  };

  if (loading) return <div className="flex items-center justify-center h-96">Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-500">Generate and manage staff payroll</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleBulkGenerate}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-purple-700"
            type="button"
          >
            <Plus size={20} /> Bulk Generate
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            type="button"
          >
            <Plus size={20} /> Generate Payroll
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 text-sm">Total Payrolls</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalPayrolls || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 text-sm">Gross Salary</p>
          <p className="text-3xl font-bold text-green-600">PKR {(stats.summary?.totalGross || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 text-sm">Total Deductions</p>
          <p className="text-3xl font-bold text-red-600">PKR {(stats.summary?.totalDeductions || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 text-sm">Net Payable</p>
          <p className="text-3xl font-bold text-blue-600">PKR {(stats.summary?.totalNet || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Period</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Gross</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Deductions</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payrolls.map((payroll) => (
                <tr key={payroll._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{payroll.staff?.name}</div>
                    <div className="text-xs text-gray-500">{payroll.staff?.employeeId}</div>
                  </td>
                  <td className="px-6 py-4">{MONTHS[payroll.month - 1]} {payroll.year}</td>
                  <td className="px-6 py-4 font-medium">PKR {payroll.grossSalary?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-red-600">PKR {payroll.totalDeductions?.toLocaleString()}</td>
                  <td className="px-6 py-4 font-bold text-green-600">PKR {payroll.netSalary?.toLocaleString()}</td>
                  <td className="px-6 py-4">{getStatusBadge(payroll.paymentStatus)}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => { setSelectedPayroll(payroll); setShowDetailsModal(true); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      type="button"
                    >
                      <Eye size={16} />
                    </button>
                    {payroll.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => handleStatusUpdate(payroll._id, 'paid')}
                        className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100"
                        type="button"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Generate Payroll</h2>
              <button onClick={() => setShowModal(false)} type="button">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Staff *</label>
                  <select
                    name="staff"
                    value={formData.staff}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.employeeId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Month *</label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Year *</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Salary Info */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Salary Information</h3>
                <div>
                  <label className="block text-sm font-medium mb-1">Basic Salary *</label>
                  <input
                    type="number"
                    name="basicSalary"
                    value={formData.basicSalary}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Allowances */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Allowances</h3>
                <div className="grid grid-cols-3 gap-4">
                  {['housing', 'transport', 'medical', 'food', 'other'].map(key => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-1 capitalize">{key}</label>
                      <input
                        type="number"
                        name={`allowances.${key}`}
                        value={formData.allowances[key]}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-700">Deductions</h3>
                <div className="grid grid-cols-4 gap-3">
                  {['tax', 'providentFund', 'eobi', 'insurance', 'loan', 'advance', 'latePenalty', 'other'].map(key => (
                    <div key={key}>
                      <label className="block text-xs font-medium mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <input
                        type="number"
                        name={`deductions.${key}`}
                        value={formData.deductions[key]}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button onClick={() => setShowModal(false)} className="px-6 py-2 border rounded-lg" type="button">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  type="button"
                >
                  {submitting ? 'Generating...' : 'Generate Payroll'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedPayroll.staff?.name}</h2>
              <button onClick={() => setShowDetailsModal(false)} type="button">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p className="text-gray-600">Employee ID</p>
                <p className="font-medium">{selectedPayroll.staff?.employeeId}</p>
              </div>
              <div>
                <p className="text-gray-600">Period</p>
                <p className="font-medium">{MONTHS[selectedPayroll.month - 1]} {selectedPayroll.year}</p>
              </div>
              <div>
                <p className="text-gray-600">Working Days</p>
                <p className="font-medium">{selectedPayroll.workingDays}</p>
              </div>
              <div>
                <p className="text-gray-600">Present Days</p>
                <p className="font-medium">{selectedPayroll.presentDays}</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Salary Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Basic Salary</span>
                  <span className="font-medium">PKR {selectedPayroll.basicSalary?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Overtime Pay</span>
                  <span className="font-medium">PKR {selectedPayroll.overtimePay?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-green-600 border-t pt-2">
                  <span>Gross Salary</span>
                  <span>PKR {selectedPayroll.grossSalary?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Total Deductions</span>
                  <span>PKR {selectedPayroll.totalDeductions?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Net Salary</span>
                  <span>PKR {selectedPayroll.netSalary?.toLocaleString()}</span>
                </div>
              </div>
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

export default Payroll;