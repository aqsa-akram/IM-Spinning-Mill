import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit, Trash2, Clock, Users } from 'lucide-react';

// Hardcoded based on common backend constants. 
// If your backend fails validation, we must ask for your "constants.js" file.
const SHIFT_NAMES = ['Morning', 'Evening', 'Night', 'General'];

const Shifts = () => {
  const [shifts, setShifts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    shiftName: 'Morning', // Default to valid enum
    shiftCode: '',
    startTime: '',
    endTime: '',
    breakTime: { duration: 60, startTime: '' }
  });

  useEffect(() => { fetchShifts(); }, []);

  const fetchShifts = async () => {
    try {
      const response = await api.get('/shifts');
      setShifts(response.data.data || []);
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shifts', formData);
      setShowModal(false);
      fetchShifts();
      setFormData({ shiftName: 'Morning', shiftCode: '', startTime: '', endTime: '', breakTime: { duration: 60, startTime: '' } });
    } catch (error) {
      alert(error.response?.data?.message || "Validation Error: Check Shift Name/Times");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-900">Shift Management</h1>
        <button onClick={() => setShowModal(true)} className="bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-600 transition">
          <Plus size={18} className="mr-2" /> Create Shift
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <div key={shift._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-brand-900">{shift.shiftName}</h3>
                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{shift.shiftCode}</span>
              </div>
              <button className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2"><Clock size={16}/> {shift.startTime} - {shift.endTime} ({shift.duration}h)</div>
              <div className="flex items-center gap-2"><Users size={16}/> {shift.staffCount || 0} Staff</div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Shift</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Shift Name</label>
                <select className="w-full border rounded p-2" value={formData.shiftName} onChange={e => setFormData({...formData, shiftName: e.target.value})}>
                  {SHIFT_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <input required className="w-full border rounded p-2 uppercase" value={formData.shiftCode} onChange={e => setFormData({...formData, shiftCode: e.target.value})} placeholder="M-01"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Start (HH:MM)</label><input type="time" required className="w-full border rounded p-2" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">End (HH:MM)</label><input type="time" required className="w-full border rounded p-2" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} /></div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-900 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Shifts;