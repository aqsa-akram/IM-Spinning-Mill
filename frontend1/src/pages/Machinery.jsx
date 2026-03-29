import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Plus, Edit, AlertTriangle } from 'lucide-react';

const Machinery = () => {
  const [machinery, setMachinery] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    machineName: '',
    machineCode: '',
    model: '',
    manufacturer: '', // Added
    yearOfManufacture: new Date().getFullYear(), // Added
    department: '',
    quantity: 1, // Added
    purchaseDate: '',
    purchaseCost: '', // Added
    maintenanceInterval: 90
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [machRes, deptRes] = await Promise.all([
        api.get('/machinery'),
        api.get('/departments')
      ]);
      setMachinery(machRes.data.data.machinery || []);
      setDepartments(deptRes.data.data || []);
    } catch (error) { console.error("Error loading data", error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/machinery', formData);
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Validation Failed: Check Machine Code/Dept");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-brand-900">Machinery</h1>
        <button onClick={() => setShowModal(true)} className="bg-brand-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-brand-600 transition">
          <Plus size={18} className="mr-2" /> Add Machine
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
            <tr>
              <th className="px-6 py-4">Machine Name</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Maintenance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {machinery.map((machine) => (
              <tr key={machine._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-brand-900">{machine.machineName}</div>
                  <div className="text-xs text-gray-500">#{machine.machineCode}</div>
                </td>
                <td className="px-6 py-4">
                  <div>{machine.model} ({machine.manufacturer})</div>
                  <div className="text-xs text-brand-500">{machine.department?.departmentName}</div>
                </td>
                <td className="px-6 py-4"><span className="capitalize bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{machine.maintenanceStatus}</span></td>
                <td className="px-6 py-4">{machine.nextMaintenanceDate ? new Date(machine.nextMaintenanceDate).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add Machinery</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium">Name</label><input required className="w-full border rounded p-2" value={formData.machineName} onChange={e => setFormData({...formData, machineName: e.target.value})} /></div>
              <div><label className="block text-sm font-medium">Code</label><input required className="w-full border rounded p-2 uppercase" value={formData.machineCode} onChange={e => setFormData({...formData, machineCode: e.target.value})} /></div>
              
              <div><label className="block text-sm font-medium">Department</label>
                <select required className="w-full border rounded p-2" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                  <option value="">Select Dept</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.departmentName}</option>)}
                </select>
              </div>
              
              <div><label className="block text-sm font-medium">Manufacturer</label><input required className="w-full border rounded p-2" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} /></div>
              <div><label className="block text-sm font-medium">Model</label><input className="w-full border rounded p-2" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} /></div>
              <div><label className="block text-sm font-medium">Year</label><input type="number" className="w-full border rounded p-2" value={formData.yearOfManufacture} onChange={e => setFormData({...formData, yearOfManufacture: e.target.value})} /></div>
              
              <div><label className="block text-sm font-medium">Purchase Date</label><input type="date" className="w-full border rounded p-2" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} /></div>
              <div><label className="block text-sm font-medium">Cost</label><input type="number" className="w-full border rounded p-2" value={formData.purchaseCost} onChange={e => setFormData({...formData, purchaseCost: e.target.value})} /></div>

              <div className="col-span-2 flex justify-end gap-2 mt-4">
                 <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                 <button type="submit" className="px-6 py-2 bg-brand-900 text-white rounded">Add Machine</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Machinery;