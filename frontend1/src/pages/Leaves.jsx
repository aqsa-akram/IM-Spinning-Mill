import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  Calendar, Clock, CheckCircle, XCircle, Plus, Edit, Trash2, Eye, Download, 
  AlertCircle, Filter, UserCheck, UserX, FileText
} from 'lucide-react';

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHalfDayModal, setShowHalfDayModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 20 });
  
  const [filters, setFilters] = useState({ staffId: '', status: '', leaveType: '' });
  
  const [formData, setFormData] = useState({
    staff: '', leaveType: 'annual', startDate: '', endDate: '', reason: '', isHalfDay: false
  });

  const [approvalData, setApprovalData] = useState({ status: 'approved', rejectionReason: '' });

  useEffect(() => { fetchData(); }, [filters, pagination.currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.staffId && { staff: filters.staffId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.leaveType && { leaveType: filters.leaveType })
      });

      const [leavesRes, staffRes] = await Promise.all([
        api.get(`/leaves?${params}`),
        api.get('/staff')
      ]);

      setLeaves(leavesRes.data.data.leaves || []);
      setPagination(leavesRes.data.data.pagination || pagination);
      setStaff(staffRes.data.data.staff || []);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', formData);
      alert('Leave application submitted successfully');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to apply leave');
    }
  };

  const handleHalfDayCreate = async (e) => {
    e.preventDefault();
    try {
      const halfDayData = { ...formData, isHalfDay: true, endDate: formData.startDate };
      await api.post('/leaves', halfDayData);
      alert('Half-day leave application submitted successfully');
      setShowHalfDayModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to apply half-day leave');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/leaves/${selectedLeave._id}`, formData);
      alert('Leave updated successfully');
      setShowEditModal(false);
      resetForm();
      setSelectedLeave(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update leave');
    }
  };

  const handleApproval = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/leaves/${selectedLeave._id}/status`, approvalData);
      alert(`Leave ${approvalData.status === 'approved' ? 'approved' : 'rejected'} successfully`);
      setShowApprovalModal(false);
      setSelectedLeave(null);
      setApprovalData({ status: 'approved', rejectionReason: '' });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleQuickApprove = async (leaveId) => {
    if (!window.confirm('Are you sure you want to approve this leave?')) return;
    try {
      await api.patch(`/leaves/${leaveId}/status`, { status: 'approved' });
      alert('Leave approved successfully');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve leave');
    }
  };

  const handleQuickReject = async (leave) => {
    setSelectedLeave(leave);
    setApprovalData({ status: 'rejected', rejectionReason: '' });
    setShowApprovalModal(true);
  };

  const fetchLeaveBalance = async (staffId) => {
    try {
      const response = await api.get(`/leaves/staff/${staffId}/balance`);
      setLeaveBalance(response.data.data);
      setShowBalanceModal(true);
    } catch (error) {
      alert('Failed to fetch leave balance');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this leave application?')) return;
    try {
      await api.delete(`/leaves/${id}`);
      alert('Deleted successfully');
      fetchData();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const openEdit = (leave) => {
    setSelectedLeave(leave);
    setFormData({
      staff: leave.staff?._id || '',
      leaveType: leave.leaveType,
      startDate: new Date(leave.startDate).toISOString().split('T')[0],
      endDate: new Date(leave.endDate).toISOString().split('T')[0],
      reason: leave.reason,
      isHalfDay: leave.isHalfDay
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      staff: '', leaveType: 'annual', startDate: '', endDate: '', reason: '', isHalfDay: false
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{status.toUpperCase()}</span>;
  };

  const getLeaveTypeBadge = (type) => {
    const styles = {
      annual: 'bg-blue-100 text-blue-700',
      sick: 'bg-red-100 text-red-700',
      casual: 'bg-purple-100 text-purple-700',
      maternity: 'bg-pink-100 text-pink-700',
      paternity: 'bg-indigo-100 text-indigo-700',
      unpaid: 'bg-gray-100 text-gray-700',
      emergency: 'bg-orange-100 text-orange-700',
      compensatory: 'bg-teal-100 text-teal-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-700'}`}>{type.replace('-', ' ').toUpperCase()}</span>;
  };

  const statsData = {
    pending: leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    total: leaves.length
  };

  if (loading) return <div className="flex items-center justify-center h-96">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-500 text-sm">Manage staff leave requests and approvals</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()} 
            className="bg-gray-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-all shadow-sm font-medium"
          >
            <Download size={20} /> Export
          </button>
          <button 
            onClick={() => setShowHalfDayModal(true)} 
            className="bg-purple-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-all shadow-sm font-medium"
          >
            <Clock size={20} /> Half Day
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm font-medium"
          >
            <Plus size={20} /> Apply Leave
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Applications</p>
              <h3 className="text-2xl font-bold text-gray-900">{statsData.total}</h3>
            </div>
            <FileText className="text-blue-500" size={28} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <h3 className="text-2xl font-bold text-yellow-600">{statsData.pending}</h3>
            </div>
            <Clock className="text-yellow-500" size={28} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <h3 className="text-2xl font-bold text-green-600">{statsData.approved}</h3>
            </div>
            <CheckCircle className="text-green-500" size={28} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <h3 className="text-2xl font-bold text-red-600">{statsData.rejected}</h3>
            </div>
            <XCircle className="text-red-500" size={28} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select value={filters.staffId} onChange={(e) => setFilters({ ...filters, staffId: e.target.value })} className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Staff</option>
            {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filters.leaveType} onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })} className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Types</option>
            <option value="annual">Annual</option>
            <option value="sick">Sick</option>
            <option value="casual">Casual</option>
            <option value="maternity">Maternity</option>
            <option value="paternity">Paternity</option>
            <option value="unpaid">Unpaid</option>
            <option value="emergency">Emergency</option>
            <option value="compensatory">Compensatory</option>
          </select>
          <button onClick={() => setFilters({ staffId: '', status: '', leaveType: '' })} className="border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition font-medium">
            <Filter size={18} className="inline mr-2" />Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No leave applications found. Click "Apply Leave" to create one.
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium text-gray-900">{leave.staff?.name}</div>
                          <div className="text-sm text-gray-500">{leave.staff?.employeeId}</div>
                        </div>
                        <button
                          onClick={() => fetchLeaveBalance(leave.staff?._id)}
                          className="text-blue-500 hover:text-blue-700 text-xs"
                          title="View Balance"
                        >
                          <Calendar size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getLeaveTypeBadge(leave.leaveType)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className="font-semibold">{leave.numberOfDays}</span> {leave.isHalfDay && <span className="text-purple-600">(Half)</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(leave.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{leave.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2 items-center">
                        <button onClick={() => { setSelectedLeave(leave); setShowViewModal(true); }} className="text-blue-600 hover:text-blue-800 transition" title="View Details">
                          <Eye size={18} />
                        </button>
                        {leave.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleQuickApprove(leave._id)} 
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition font-medium"
                              title="Approve Leave"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleQuickReject(leave)} 
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition font-medium"
                              title="Reject Leave"
                            >
                              Reject
                            </button>
                            <button onClick={() => openEdit(leave)} className="text-purple-600 hover:text-purple-800 transition" title="Edit">
                              <Edit size={18} />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(leave._id)} className="text-red-600 hover:text-red-800 transition" title="Delete">
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
        {leaves.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })} 
                disabled={pagination.currentPage === 1} 
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button 
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })} 
                disabled={pagination.currentPage === pagination.totalPages} 
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE FULL DAY LEAVE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Apply for Leave</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Staff *</label>
                  <select 
                    required 
                    value={formData.staff} 
                    onChange={(e) => setFormData({ ...formData, staff: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => <option key={s._id} value={s._id}>{s.name} ({s.employeeId})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Leave Type *</label>
                  <select 
                    required 
                    value={formData.leaveType} 
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="maternity">Maternity Leave</option>
                    <option value="paternity">Paternity Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                    <option value="emergency">Emergency Leave</option>
                    <option value="compensatory">Compensatory Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Start Date *</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.startDate} 
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">End Date *</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.endDate} 
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
                    min={formData.startDate}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Reason *</label>
                <textarea 
                  required 
                  value={formData.reason} 
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  rows="3"
                  placeholder="Please provide reason for leave..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); resetForm(); }} 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HALF DAY LEAVE MODAL */}
      {showHalfDayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
              <Clock className="text-purple-600" size={24} />
              Apply for Half-Day Leave
            </h2>
            <form onSubmit={handleHalfDayCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Staff *</label>
                  <select 
                    required 
                    value={formData.staff} 
                    onChange={(e) => setFormData({ ...formData, staff: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => <option key={s._id} value={s._id}>{s.name} ({s.employeeId})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Leave Type *</label>
                  <select 
                    required 
                    value={formData.leaveType} 
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="annual">Annual Leave</option>
                    <option value="emergency">Emergency Leave</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Date *</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.startDate} 
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value, endDate: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                  />
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800 flex items-center gap-2">
                  <AlertCircle size={16} />
                  This will be marked as a half-day (0.5 day) leave
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Reason *</label>
                <textarea 
                  required 
                  value={formData.reason} 
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                  rows="3"
                  placeholder="Please provide reason for half-day leave..."
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowHalfDayModal(false); resetForm(); }} 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-md"
                >
                  Submit Half-Day Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Leave Application</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Staff</label>
                  <input 
                    type="text" 
                    value={selectedLeave.staff?.name} 
                    disabled 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Leave Type *</label>
                  <select 
                    required 
                    value={formData.leaveType} 
                    onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="maternity">Maternity Leave</option>
                    <option value="paternity">Paternity Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                    <option value="emergency">Emergency Leave</option>
                    <option value="compensatory">Compensatory Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Start Date *</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.startDate} 
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">End Date *</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.endDate} 
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
                    min={formData.startDate}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={formData.isHalfDay} 
                  onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })} 
                  className="rounded"
                  id="editHalfDay"
                />
                <label htmlFor="editHalfDay" className="text-sm font-medium text-gray-700">Half Day Leave</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Reason *</label>
                <textarea 
                  required 
                  value={formData.reason} 
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  rows="3"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); resetForm(); setSelectedLeave(null); }} 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md"
                >
                  Update Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVAL MODAL */}
      {showApprovalModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Review Leave Request</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
              <p className="text-sm"><strong className="text-gray-700">Staff:</strong> <span className="text-gray-900">{selectedLeave.staff?.name}</span></p>
              <p className="text-sm"><strong className="text-gray-700">Employee ID:</strong> <span className="text-gray-900">{selectedLeave.staff?.employeeId}</span></p>
              <p className="text-sm"><strong className="text-gray-700">Type:</strong> {getLeaveTypeBadge(selectedLeave.leaveType)}</p>
              <p className="text-sm"><strong className="text-gray-700">Duration:</strong> <span className="text-gray-900">{new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}</span></p>
              <p className="text-sm"><strong className="text-gray-700">Days:</strong> <span className="text-gray-900 font-semibold">{selectedLeave.numberOfDays} {selectedLeave.isHalfDay && '(Half Day)'}</span></p>
              <p className="text-sm"><strong className="text-gray-700">Reason:</strong> <span className="text-gray-900 italic">{selectedLeave.reason}</span></p>
            </div>
            <form onSubmit={handleApproval} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Decision *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApprovalData({ ...approvalData, status: 'approved' })}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      approvalData.status === 'approved'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-green-300'
                    }`}
                  >
                    <CheckCircle className="inline mr-2" size={20} />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalData({ ...approvalData, status: 'rejected' })}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      approvalData.status === 'rejected'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-red-300'
                    }`}
                  >
                    <XCircle className="inline mr-2" size={20} />
                    Reject
                  </button>
                </div>
              </div>
              {approvalData.status === 'rejected' && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Rejection Reason *</label>
                  <textarea 
                    required 
                    value={approvalData.rejectionReason} 
                    onChange={(e) => setApprovalData({ ...approvalData, rejectionReason: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                    rows="3"
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowApprovalModal(false); setSelectedLeave(null); setApprovalData({ status: 'approved', rejectionReason: '' }); }} 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`px-4 py-2 text-white rounded-lg transition shadow-md ${
                    approvalData.status === 'approved' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {approvalData.status === 'approved' ? 'Approve Leave' : 'Reject Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showViewModal && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Leave Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Staff</p>
                  <p className="font-medium text-gray-900">{selectedLeave.staff?.name}</p>
                  <p className="text-xs text-gray-500">{selectedLeave.staff?.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Leave Type</p>
                  <div className="mt-1">{getLeaveTypeBadge(selectedLeave.leaveType)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900">{new Date(selectedLeave.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium text-gray-900">{new Date(selectedLeave.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium text-gray-900">{selectedLeave.numberOfDays} days {selectedLeave.isHalfDay && <span className="text-purple-600">(Half Day)</span>}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedLeave.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Applied Date</p>
                  <p className="font-medium text-gray-900">{new Date(selectedLeave.appliedDate || selectedLeave.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedLeave.approvedBy && (
                  <div>
                    <p className="text-sm text-gray-500">Approved By</p>
                    <p className="font-medium text-gray-900">{selectedLeave.approvedBy?.fullName || selectedLeave.approvedBy?.username}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Reason</p>
                <p className="font-medium text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">{selectedLeave.reason}</p>
              </div>
              {selectedLeave.rejectionReason && (
                <div className="border-l-4 border-red-500 pl-3">
                  <p className="text-sm text-gray-500">Rejection Reason</p>
                  <p className="font-medium text-red-600 mt-1">{selectedLeave.rejectionReason}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6 gap-3">
              {selectedLeave.status === 'pending' && (
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setShowApprovalModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Review Request
                </button>
              )}
              <button 
                onClick={() => { setShowViewModal(false); setSelectedLeave(null); }} 
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE BALANCE MODAL */}
      {showBalanceModal && leaveBalance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Leave Balance</h2>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-gray-900">{leaveBalance.staff?.name}</p>
              <p className="text-sm text-gray-600">{leaveBalance.staff?.employeeId}</p>
              <p className="text-sm text-gray-600">Year: {leaveBalance.year}</p>
            </div>
            <div className="space-y-3">
              {leaveBalance.balance?.map((item) => (
                <div key={item.leaveType} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900 capitalize">{item.leaveType} Leave</span>
                    {getLeaveTypeBadge(item.leaveType)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Allocated</p>
                      <p className="font-semibold text-blue-600">{item.allocated}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Taken</p>
                      <p className="font-semibold text-red-600">{item.taken}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Balance</p>
                      <p className="font-semibold text-green-600">{item.balance}</p>
                    </div>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(item.taken / item.allocated) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button 
                onClick={() => { setShowBalanceModal(false); setLeaveBalance(null); }} 
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
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

export default Leaves;