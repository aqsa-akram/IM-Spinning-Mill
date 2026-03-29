import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit, Trash2, Search, Phone, Mail } from 'lucide-react';

// Roles matching your backend model exactly
const STAFF_ROLES = [
  'Engineer', 'Electrical Engineer', 'Technical Manager',
  'Foreman', 'Deputy Foreman', 'Assistant Foreman', 'Shift Incharge', 'Supervisor', 'Department Head',
  'Head Fitter', 'Fitter', 'Pipe Fitter', 'Head Jobber', 'Jobber', 'Electrician',
  'Operator', 'Spare Operator', 'Doffer', 'Machine Winder',
  'Helper', 'Waste Collector', 'Sweeper', 'Mali', 'Security Guard', 'Cook',
  'Accountant', 'Purchaser', 'Tax Officer', 'Time Keeper',
  'Lab Incharge', 'Lab Clerk', 'Cone Checker',
  'General Manager', 'Production Incharge', 'Labour Officer', 'Store Incharge', 'Packing Incharge', 'Mixing Incharge'
];

const CAREER_LEVELS = ['entry', 'junior', 'mid', 'senior', 'lead', 'management'];

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const initialFormState = {
    name: '',
    employeeId: '',
    role: '',
    department: '',
    shift: '', 
    careerLevel: 'entry',
    joiningDate: new Date().toISOString().split('T')[0],
    contactInfo: { phone: '', email: '', address: '' }
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [staffRes, deptRes, shiftRes] = await Promise.all([
        api.get('/staff'),
        api.get('/departments'),
        api.get('/shifts')
      ]);
      
      setStaffList(staffRes.data.data.staff || []);
      setDepartments(deptRes.data.data || []);
      setShifts(shiftRes.data.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactInfo: { ...prev.contactInfo, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clean up empty fields
      const payload = { ...formData };
      if (!payload.shift) delete payload.shift; 

      if (isEditing) {
        await api.patch(`/staff/${selectedId}`, payload);
      } else {
        await api.post('/staff', payload);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed. Check ID uniqueness.");
    }
  };

  const handleEdit = (staff) => {
    setIsEditing(true);
    setSelectedId(staff._id);
    setFormData({
      name: staff.name,
      employeeId: staff.employeeId,
      role: staff.role,
      department: staff.department?._id || '',
      shift: staff.shift?._id || '', // Handles populated object or missing shift
      careerLevel: staff.careerLevel || 'entry',
      joiningDate: staff.joiningDate ? staff.joiningDate.split('T')[0] : '',
      contactInfo: {
        phone: staff.contactInfo?.phone || '',
        email: staff.contactInfo?.email || '',
        address: staff.contactInfo?.address || ''
      }
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to terminate this employee?')) {
      try {
        await api.delete(`/staff/${id}`);
        fetchData();
      } catch (error) {
        alert("Failed to delete staff member");
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setSelectedId(null);
  };

  const filteredStaff = staffList.filter(staff => 
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Employees</h1>
          <p className="text-sm text-gray-500">Manage staff, roles, and assignments</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-600 transition shadow-sm"
        >
          <Plus size={18} className="mr-2" /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Name, ID, or Role..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role & Dept</th>
                <th className="px-6 py-4">Shift</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading staff data...</td></tr>
              ) : filteredStaff.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No employees found.</td></tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff._id} className="hover:bg-gray-50 transition group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center font-bold mr-3">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-900">{staff.name}</p>
                          <p className="text-xs text-gray-500">ID: {staff.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{staff.role}</p>
                      <p className="text-xs text-gray-500">
                        {staff.department?.departmentName || 'Unassigned'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                       {staff.shift ? (
                         <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{staff.shift.shiftName}</span>
                       ) : <span className="text-gray-400 text-xs">No Shift</span>}
                    </td>
                    <td className="px-6 py-4 text-xs space-y-1">
                       <div className="flex items-center gap-2">
                          <Phone size={14} className="text-gray-400"/> {staff.contactInfo?.phone || 'N/A'}
                       </div>
                       <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400"/> {staff.contactInfo?.email || 'N/A'}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        staff.employmentStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {staff.employmentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(staff)} className="p-1 text-gray-500 hover:text-brand-500">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(staff._id)} className="p-1 text-gray-500 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-brand-900">
                {isEditing ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="col-span-full"><h3 className="text-sm font-semibold text-gray-500 uppercase border-b pb-1">Basic Details</h3></div>
              <div><label className="block text-sm font-medium mb-1">Full Name *</label><input required name="name" value={formData.name} onChange={handleInputChange} className="w-full border rounded-lg p-2" placeholder="Ali Haroon" /></div>
              <div><label className="block text-sm font-medium mb-1">Employee ID *</label><input required name="employeeId" value={formData.employeeId} onChange={handleInputChange} className="w-full border rounded-lg p-2 uppercase" placeholder="EMP-001" disabled={isEditing} /></div>

              <div className="col-span-full mt-2"><h3 className="text-sm font-semibold text-gray-500 uppercase border-b pb-1">Job Assignment</h3></div>
              <div><label className="block text-sm font-medium mb-1">Department *</label>
                <select required name="department" value={formData.department} onChange={handleInputChange} className="w-full border rounded-lg p-2">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-1">Role *</label>
                <select required name="role" value={formData.role} onChange={handleInputChange} className="w-full border rounded-lg p-2">
                  <option value="">Select Role</option>
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-1">Shift</label>
                <select name="shift" value={formData.shift} onChange={handleInputChange} className="w-full border rounded-lg p-2">
                  <option value="">
                    {shifts.length === 0 ? 'No Shifts Found (Create in Shifts Page)' : 'Select Shift'}
                  </option>
                  {shifts.map(s => <option key={s._id} value={s._id}>{s.shiftName} ({s.startTime}-{s.endTime})</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium mb-1">Career Level</label>
                <select name="careerLevel" value={formData.careerLevel} onChange={handleInputChange} className="w-full border rounded-lg p-2 capitalize">
                  {CAREER_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="col-span-full mt-2"><h3 className="text-sm font-semibold text-gray-500 uppercase border-b pb-1">Contact Information</h3></div>
              <div><label className="block text-sm font-medium mb-1">Phone</label><input name="contact.phone" value={formData.contactInfo.phone} onChange={handleInputChange} className="w-full border rounded-lg p-2" /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" name="contact.email" value={formData.contactInfo.email} onChange={handleInputChange} className="w-full border rounded-lg p-2" /></div>

              <div className="col-span-full flex justify-end gap-3 mt-4 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-brand-900 text-white rounded-lg hover:bg-brand-800">
                  {isEditing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;