import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'; // Imports the configured axios instance
import { Lock, User, Loader2 } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: '', // Can be email or username
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Your backend login controller accepts "email" OR "username".
      // We check if the input looks like an email to decide which key to send.
      const isEmail = formData.identifier.includes('@');
      const payload = isEmail 
        ? { email: formData.identifier, password: formData.password }
        : { username: formData.identifier, password: formData.password };

      // Make API Request
      const response = await api.post('/auth/login', payload);
      
      // Your Backend Response Structure:
      // { statusCode: 200, data: { user, accessToken, refreshToken }, message: "...", success: true }
      const { user, accessToken } = response.data.data;

      // Save Data
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to Dashboard
      navigate('/');
      
    } catch (err) {
      // Handle "ApiError" response from backend
      // err.response.data usually contains { message: "Invalid credentials", ... }
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 border border-gray-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-900">IM Spinning Mills</h1>
          <p className="text-gray-500 text-sm">Sign in to manage operations</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4 text-sm flex items-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-2.5 text-gray-400" />
              <input 
                name="identifier"
                type="text" 
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                placeholder="admin@imspinning.com"
                value={formData.identifier}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-2.5 text-gray-400" />
              <input 
                name="password"
                type="password" 
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-900 text-white py-2 rounded-md hover:bg-brand-800 transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;