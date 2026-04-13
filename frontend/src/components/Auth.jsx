import React, { useState } from 'react';
import axios from 'axios';
import { MdEmail, MdLock, MdPerson, MdChatBubble, MdVpnKey } from 'react-icons/md';
import toast from 'react-hot-toast';

const Auth = ({ onLoginSuccess }) => {
  const [view, setView] = useState('login'); // login, register, register-otp, forgot, forgot-otp
  const [formData, setFormData] = useState({ name: '', username: '', identifier: '', password: '', otp: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const BACKEND_URL = "https://nexuschat-backend-ysa6.onrender.com";

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = async (type) => {
    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/auth/send-otp`, { identifier: formData.identifier, type });
      toast.success("OTP sent to your email!");
      setView(type === 'register' ? 'register-otp' : 'forgot-otp');
    } catch (error) { toast.error(error.response?.data?.message || "Error"); }
    setLoading(false);
  };

  const handleFinalSubmit = async (e, endpoint) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/${endpoint}`, formData);
      if (endpoint === 'login' || endpoint === 'register') {
        onLoginSuccess(response.data.token, response.data.userId);
        toast.success("Success!");
      } else {
        toast.success("Password Reset! Username: " + response.data.username);
        setView('login');
      }
    } catch (error) { toast.error(error.response?.data?.message || "Failed"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 text-white shadow-lg"><MdChatBubble className="text-3xl" /></div>
          <h1 className="text-2xl font-bold">{view.includes('register') ? "Join NexusChat" : "Welcome Back"}</h1>
        </div>

        {view === 'login' && (
          <form onSubmit={(e) => handleFinalSubmit(e, 'login')} className="space-y-4">
            <input type="text" name="identifier" placeholder="Email or Username" onChange={handleChange} className="w-full bg-slate-50 p-3 rounded-xl border outline-none focus:border-indigo-500" required />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full bg-slate-50 p-3 rounded-xl border outline-none focus:border-indigo-500" required />
            <button type="button" onClick={() => setView('forgot')} className="text-xs font-bold text-indigo-600">Forgot Password?</button>
            <button type="submit" className="w-full bg-indigo-600 py-3 rounded-xl text-white font-bold">{loading ? "Logging in..." : "Login"}</button>
            <p className="text-center text-sm">New here? <button onClick={() => setView('register')} className="text-indigo-600 font-bold">Sign Up</button></p>
          </form>
        )}

        {view === 'register' && (
          <div className="space-y-4">
            <input type="text" name="name" placeholder="Full Name" onChange={handleChange} className="w-full bg-slate-50 p-3 rounded-xl border" />
            <input type="text" name="username" placeholder="Username" onChange={handleChange} className="w-full bg-slate-50 p-3 rounded-xl border" />
            <input type="email" name="identifier" placeholder="Email Address" onChange={handleChange} className="w-full bg-slate-50 p-3 rounded-xl border" />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full bg-slate-50 p-3 rounded-xl border" />
            <button onClick={() => handleSendOtp('register')} className="w-full bg-indigo-600 py-3 rounded-xl text-white font-bold">{loading ? "Sending..." : "Send Verification OTP"}</button>
            <button onClick={() => setView('login')} className="w-full text-xs text-slate-500">Back to Login</button>
          </div>
        )}

        {(view === 'register-otp' || view === 'forgot-otp') && (
          <form onSubmit={(e) => handleFinalSubmit(e, view === 'register-otp' ? 'register' : 'reset-password')} className="space-y-4">
            <input type="text" name="otp" placeholder="6-digit OTP" maxLength="6" onChange={handleChange} className="w-full bg-slate-50 p-3 rounded-xl border text-center font-bold text-xl tracking-widest" required />
            {view === 'forgot-otp' && <input type="password" name="newPassword" placeholder="New Password" onChange={handleChange} className="w-full bg-slate-50 p-3 rounded-xl border" required />}
            <button type="submit" className="w-full bg-emerald-600 py-3 rounded-xl text-white font-bold">{loading ? "Verifying..." : "Verify & Proceed"}</button>
          </form>
        )}

        {view === 'forgot' && (
          <div className="space-y-4">
            <input type="email" name="identifier" placeholder="Registered Email" onChange={handleChange} className="w-full bg-slate-50 p-3 rounded-xl border" />
            <button onClick={() => handleSendOtp('forgot')} className="w-full bg-indigo-600 py-3 rounded-xl text-white font-bold">{loading ? "Searching..." : "Send Recovery OTP"}</button>
            <button onClick={() => setView('login')} className="w-full text-xs text-slate-500">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;