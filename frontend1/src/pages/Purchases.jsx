import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, X, DollarSign } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';
const token = localStorage.getItem('accessToken');

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    purchaseOrderNumber: '',
    supplier: '',
    items: [{ material: '', quantity: 0, unitPrice: 0, totalPrice: 0 }],
    expectedDeliveryDate: '',
    taxAmount: 0,
    shippingCost: 0,
    discount: 0,
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [paymentData, setPaymentData] = useState({ amount: 0, paymentMethod: 'cash', notes: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purchasesRes, suppliersRes, materialsRes] = await Promise.all([
        fetch(`${API_BASE}/purchases`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/suppliers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/raw-materials`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!purchasesRes.ok || !suppliersRes.ok || !materialsRes.ok) throw new Error('Failed to fetch data');

      const purchasesData = await purchasesRes.json();
      const suppliersData = await suppliersRes.json();
      const materialsData = await materialsRes.json();

      setPurchases(purchasesData.data.purchases || []);
      setSuppliers(suppliersData.data.suppliers || []);
      setRawMaterials(materialsData.data.materials || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value;
    newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { material: '', quantity: 0, unitPrice: 0, totalPrice: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      if (!formData.purchaseOrderNumber || !formData.supplier || formData.items.length === 0) {
        throw new Error('Please fill all required fields');
      }

      const payload = {
        ...formData,
        taxAmount: Number(formData.taxAmount),
        shippingCost: Number(formData.shippingCost),
        discount: Number(formData.discount)
      };

      const response = await fetch(`${API_BASE}/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to create purchase');
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

  const handlePayment = async () => {
    if (!selectedPurchase || !paymentData.amount) {
      setError('Please enter payment amount');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/purchases/${selectedPurchase._id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to record payment');
      }

      await fetchData();
      setShowPaymentModal(false);
      setPaymentData({ amount: 0, paymentMethod: 'cash', notes: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-700',
      'confirmed': 'bg-blue-100 text-blue-700',
      'received': 'bg-green-100 text-green-700',
      'partially-received': 'bg-orange-100 text-orange-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>;
  };

  const getPaymentStatusBadge = (status) => {
    const styles = {
      'unpaid': 'bg-red-100 text-red-700',
      'partially-paid': 'bg-yellow-100 text-yellow-700',
      'paid': 'bg-green-100 text-green-700'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>;
  };

  if (loading) return <div className="flex items-center justify-center h-96">Loading...</div>;

  const subtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + (formData.taxAmount || 0) + (formData.shippingCost || 0) - (formData.discount || 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500">Manage supplier purchases and payments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> New Purchase
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">PO Number</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {purchases.map((purchase) => (
                <tr key={purchase._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{purchase.purchaseOrderNumber}</td>
                  <td className="px-6 py-4">{purchase.supplier?.supplierName || 'N/A'}</td>
                  <td className="px-6 py-4 font-medium">PKR {purchase.totalAmount?.toLocaleString() || '0'}</td>
                  <td className="px-6 py-4">{getStatusBadge(purchase.status)}</td>
                  <td className="px-6 py-4">{getPaymentStatusBadge(purchase.paymentStatus)}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => { setSelectedPurchase(purchase); setShowDetailsModal(true); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      type="button"
                    >
                      <Eye size={16} />
                    </button>
                    {purchase.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => { setSelectedPurchase(purchase); setPaymentData({ amount: purchase.remainingAmount || 0, paymentMethod: 'cash', notes: '' }); setShowPaymentModal(true); }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        type="button"
                      >
                        <DollarSign size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create Purchase Order</h2>
              <button onClick={() => setShowModal(false)} type="button">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">PO Number *</label>
                  <input
                    type="text"
                    value={formData.purchaseOrderNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, purchaseOrderNumber: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="PO-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier *</label>
                  <select
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => (
                      <option key={s._id} value={s._id}>{s.supplierName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-3">
                      <select
                        value={item.material}
                        onChange={(e) => handleItemChange(idx, 'material', e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                      >
                        <option value="">Material</option>
                        {rawMaterials.map(m => (
                          <option key={m._id} value={m._id}>{m.materialName}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                      />
                      <div className="px-3 py-2 bg-gray-50 rounded-lg">
                        {(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addItem}
                  className="mt-3 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                  type="button"
                >
                  <Plus size={16} className="inline mr-2" /> Add Item
                </button>
              </div>

              {/* Costs */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tax Amount</label>
                  <input
                    type="number"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxAmount: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Shipping</label>
                  <input
                    type="number"
                    value={formData.shippingCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-xl font-bold text-blue-900">PKR {total.toFixed(2)}</p>
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
                  {submitting ? 'Creating...' : 'Create PO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{selectedPurchase.purchaseOrderNumber}</h2>
              <button onClick={() => setShowDetailsModal(false)} type="button">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Supplier</p>
                  <p className="font-medium">{selectedPurchase.supplier?.supplierName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Order Date</p>
                  <p className="font-medium">{new Date(selectedPurchase.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Amount</p>
                  <p className="font-bold text-lg">PKR {selectedPurchase.totalAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Paid Amount</p>
                  <p className="font-bold text-lg text-green-600">PKR {selectedPurchase.paidAmount?.toLocaleString() || '0'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-2">Items</p>
                {selectedPurchase.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1">
                    <span>{item.material?.materialName}</span>
                    <span>{item.quantity} x PKR {item.unitPrice} = PKR {item.totalPrice}</span>
                  </div>
                ))}
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

      {/* Payment Modal */}
      {showPaymentModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Record Payment</h2>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Total Amount</p>
                <p className="font-bold text-lg">PKR {selectedPurchase.totalAmount?.toLocaleString()}</p>
                <p className="text-gray-600 text-sm mt-2">Remaining</p>
                <p className="font-bold text-lg text-red-600">PKR {(selectedPurchase.remainingAmount || 0).toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payment Amount *</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="cash">Cash</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border rounded-lg" type="button">
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  type="button"
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;