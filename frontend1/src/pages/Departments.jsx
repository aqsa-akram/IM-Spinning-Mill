import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit, Trash2, Users, Activity } from 'lucide-react';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // State for Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const initialFormState = { 
    departmentName: '', 
    departmentCode: '', 
    departmentType: 'core' 
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data || []); 
    } catch (error) {
      console.error("Failed to fetch departments", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // UPDATE Existing Department
        await api.patch(`/departments/${currentId}`, formData);
      } else {
        // CREATE New Department
        await api.post('/departments', formData);
      }
      
      closeModal();
      fetchDepartments();
    } catch (error) {
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (dept) => {
    setFormData({
      departmentName: dept.departmentName,
      departmentCode: dept.departmentCode,
      departmentType: dept.departmentType || 'core'
    });
    setIsEditing(true);
    setCurrentId(dept._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await api.delete(`/departments/${id}`);
        fetchDepartments();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to delete department");
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(initialFormState);
    setIsEditing(false);
    setCurrentId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-900">Departments</h1>
        <button onClick={() => setShowModal(true)} className="bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-600 transition">
          <Plus size={18} className="mr-2" /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p>Loading...</p> : departments.map((dept) => (
          <div key={dept._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition relative group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-brand-900">{dept.departmentName}</h3>
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{dept.departmentCode}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${dept.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {dept.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="space-y-3 mt-4">
              <div className="flex items-center text-sm text-gray-600">
                <Users size={16} className="mr-2 text-brand-500" />
                <span>{dept.totalStaff || 0} Staff Members</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Activity size={16} className="mr-2 text-brand-500" />
                <span className="capitalize">{dept.departmentType} Unit</span>
              </div>
            </div>

            {/* Action Buttons with onClick Handlers */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                onClick={() => handleEdit(dept)} 
                className="p-1 bg-white border rounded hover:text-brand-500 transition-colors"
                title="Edit"
              >
                <Edit size={14}/>
              </button>
              <button 
                onClick={() => handleDelete(dept._id)} 
                className="p-1 bg-white border rounded hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? 'Edit Department' : 'New Department'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input required className="w-full border rounded p-2" value={formData.departmentName} onChange={e => setFormData({...formData, departmentName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input required className="w-full border rounded p-2" value={formData.departmentCode} onChange={e => setFormData({...formData, departmentCode: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="w-full border rounded p-2" value={formData.departmentType} onChange={e => setFormData({...formData, departmentType: e.target.value})}>
                  <option value="core">Core Production</option>
                  <option value="support">Support</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-900 text-white rounded hover:bg-brand-800">
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
export default Departments;