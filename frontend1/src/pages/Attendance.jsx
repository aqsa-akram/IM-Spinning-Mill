import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { 
  CheckCircle, XCircle, Clock, Plus, Edit, Trash2, Eye, Download, Users, AlertCircle
} from 'lucide-react';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [stats, setStats] = useState({ totalStaff: 0, markedAttendance: 0, unmarked: 0, breakdown: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, limit: 20 });
  
  const [filters, setFilters] = useState({ staffId: '', status: '', startDate: '', endDate: '' });
  
  const [formData, setFormData] = useState({
    staff: '', date: new Date().toISOString().split('T')[0], shift: '', status: 'present',
    checkIn: '', checkOut: '', remarks: ''
  });

  useEffect(() => { fetchData(); }, [filters, pagination.currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(filters.staffId && { staff: filters.staffId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const [attendanceRes, statsRes, staffRes, shiftsRes] = await Promise.all([
        api.get(`/attendance?${params}`),
        api.get('/attendance/report/daily'),
        api.get('/staff'),
        api.get('/shifts')
      ]);

      setAttendance(attendanceRes.data.data.records || []);
      setPagination(attendanceRes.data.data.pagination || pagination);
      setStats(statsRes.data.data || {});
      setStaff(staffRes.data.data.staff || []);
      setShifts(shiftsRes.data.data.shifts || []);
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
      const payload = {
        staff: formData.staff,
        date: formData.date,
        shift: formData.shift || undefined,
        status: formData.status,
        checkIn: formData.checkIn ? { time: new Date(`${formData.date}T${formData.checkIn}`).toISOString(), method: 'manual' } : undefined,
        checkOut: formData.checkOut ? { time: new Date(`${formData.date}T${formData.checkOut}`).toISOString(), method: 'manual' } : undefined,
        remarks: formData.remarks
      };

      await api.post('/attendance', payload);
      alert('Attendance marked successfully');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        status: formData.status,
        checkIn: formData.checkIn ? { time: new Date(`${formData.date}T${formData.checkIn}`).toISOString(), method: 'manual' } : undefined,
        checkOut: formData.checkOut ? { time: new Date(`${formData.date}T${formData.checkOut}`).toISOString(), method: 'manual' } : undefined,
        remarks: formData.remarks
      };

      await api.patch(`/attendance/${selectedRecord._id}`, payload);
      alert('Attendance updated successfully');
      setShowEditModal(false);
      resetForm();
      setSelectedRecord(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this attendance record?')) return;
    try {
      await api.delete(`/attendance/${id}`);
      alert('Deleted successfully');
      fetchData();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const openEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      staff: record.staff?._id || '',
      date: new Date(record.date).toISOString().split('T')[0],
      shift: record.shift?._id || '',
      status: record.status,
      checkIn: record.checkIn?.time ? new Date(record.checkIn.time).toTimeString().slice(0, 5) : '',
      checkOut: record.checkOut?.time ? new Date(record.checkOut.time).toTimeString().slice(0, 5) : '',
      remarks: record.remarks || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      staff: '', date: new Date().toISOString().split('T')[0], shift: '', status: 'present',
      checkIn: '', checkOut: '', remarks: ''
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      'half-day': 'bg-yellow-100 text-yellow-700',
      late: 'bg-orange-100 text-orange-700',
      'on-leave': 'bg-blue-100 text-blue-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{status.replace('-', ' ').toUpperCase()}</span>;
  };

  if (loading) return <div className="flex items-center justify-center h-96">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* HEADER WITH BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-500 text-sm">Track daily attendance</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()} 
            className="bg-gray-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-all shadow-sm font-medium"
          >
            <Download size={20} /> Export
          </button>
          <button 
            onClick={() => setShowModal(true)} 
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all shadow-sm font-medium"
          >
            <Plus size={20} /> Mark Attendance
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Staff</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalStaff}</h3>
            </div>
            <Users className="text-blue-500" size={28} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Marked Today</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.markedAttendance}</h3>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unmarked</p>
              <h3 className="text-2xl font-bold text-red-600">{stats.unmarked}</h3>
            </div>
            <AlertCircle className="text-red-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <h3 className="text-2xl font-bold text-green-600">{stats.breakdown?.find(b => b._id === 'present')?.count || 0}</h3>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select value={filters.staffId} onChange={(e) => setFilters({ ...filters, staffId: e.target.value })} className="border rounded-lg px-3 py-2">
            <option value="">All Staff</option>
            {staff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="border rounded-lg px-3 py-2">
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="half-day">Half Day</option>
            <option value="late">Late</option>
            <option value="on-leave">On Leave</option>
          </select>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="Start Date" />
          <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="border rounded-lg px-3 py-2" placeholder="End Date" />
          <button onClick={() => setFilters({ staffId: '', status: '', startDate: '', endDate: '' })} className="border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition">Clear</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No attendance records found. Click "Mark Attendance" to add one.
                  </td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{record.staff?.name}</div>
                      <div className="text-sm text-gray-500">{record.staff?.employeeId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.shift?.shiftName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(record.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.workingHours ? `${record.workingHours.toFixed(1)}h` : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedRecord(record); setShowViewModal(true); }} className="text-blue-600 hover:text-blue-800 transition" title="View Details">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => openEdit(record)} className="text-green-600 hover:text-green-800 transition" title="Edit">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(record._id)} className="text-red-600 hover:text-red-800 transition" title="Delete">
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
        {attendance.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} records
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

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-brand-900">Mark Attendance</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Staff *</label>
                  <select 
                    required 
                    value={formData.staff} 
                    onChange={(e) => setFormData({ ...formData, staff: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="">Select Staff</option>
                    {staff.map(s => <option key={s._id} value={s._id}>{s.name} ({s.employeeId})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Date *</label>
                  <input 
                    required 
                    type="date" 
                    value={formData.date} 
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Shift</label>
                  <select 
                    value={formData.shift} 
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="">Select Shift (Optional)</option>
                    {shifts.map(s => <option key={s._id} value={s._id}>{s.shiftName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Status *</label>
                  <select 
                    required 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                    <option value="late">Late</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Check In Time</label>
                  <input 
                    type="time" 
                    value={formData.checkIn} 
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Check Out Time</label>
                  <input 
                    type="time" 
                    value={formData.checkOut} 
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Remarks</label>
                <textarea 
                  value={formData.remarks} 
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent" 
                  rows="3"
                  placeholder="Any additional notes..."
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
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition shadow-md"
                >
                  Mark Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-brand-900">Edit Attendance</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Staff</label>
                  <input 
                    type="text" 
                    value={selectedRecord?.staff?.name} 
                    disabled 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Date</label>
                  <input 
                    type="date" 
                    value={formData.date} 
                    disabled 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Status *</label>
                  <select 
                    required 
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half-day">Half Day</option>
                    <option value="late">Late</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Shift</label>
                  <input 
                    type="text" 
                    value={selectedRecord?.shift?.shiftName || 'N/A'} 
                    disabled 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Check In Time</label>
                  <input 
                    type="time" 
                    value={formData.checkIn} 
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Check Out Time</label>
                  <input 
                    type="time" 
                    value={formData.checkOut} 
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Remarks</label>
                <textarea 
                  value={formData.remarks} 
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent" 
                  rows="3"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); resetForm(); setSelectedRecord(null); }} 
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition shadow-md"
                >
                  Update Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showViewModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-brand-900">Attendance Details</h2>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Staff</p>
                  <p className="font-medium text-gray-900">{selectedRecord.staff?.name}</p>
                  <p className="text-sm text-gray-500">{selectedRecord.staff?.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">{new Date(selectedRecord.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Shift</p>
                  <p className="font-medium text-gray-900">{selectedRecord.shift?.shiftName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check In</p>
                  <p className="font-medium text-gray-900">{selectedRecord.checkIn?.time ? new Date(selectedRecord.checkIn.time).toLocaleTimeString() : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check Out</p>
                  <p className="font-medium text-gray-900">{selectedRecord.checkOut?.time ? new Date(selectedRecord.checkOut.time).toLocaleTimeString() : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Working Hours</p>
                  <p className="font-medium text-gray-900">{selectedRecord.workingHours ? `${selectedRecord.workingHours.toFixed(1)}h` : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Remarks</p>
                  <p className="font-medium text-gray-900 italic text-sm">{selectedRecord.remarks || 'No remarks'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
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

export default Attendance;