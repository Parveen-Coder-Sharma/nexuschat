import React, { useState } from 'react';
import axios from 'axios';
import { MdEmail, MdLock, MdPerson, MdChatBubble, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import toast from 'react-hot-toast';

const Auth = ({ onLoginSuccess }) => {
  const [view, setView] = useState('login'); 
  const [formData, setFormData] = useState({ name: '', username: '', identifier: '', password: '', otp: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 🔥 Eye toggle state
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
        toast.success("Welcome to NexusChat!");
      } else {
        toast.success("Password Reset! Username: " + response.data.username);
        setView('login');
      }
    } catch (error) { toast.error(error.response?.data?.message || "Action failed"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 sm:p-10 border border-slate-100">
        
        {/* NC Premium Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center shadow-xl mb-4 border-4 border-white">
            <span className="text-white text-5xl font-black">NC</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">NexusChat</h1>
          <span className="text-blue-600 font-bold text-xs tracking-[0.2em] uppercase">Premium</span>
        </div>

        {view === 'login' && (
          <form onSubmit={(e) => handleFinalSubmit(e, 'login')} className="space-y-5">
            <div className="relative">
              <MdPerson className="absolute top-4 left-4 text-slate-400 text-xl" />
              <input type="text" name="identifier" placeholder="Email or Username" onChange={handleChange} className="w-full bg-slate-50 py-4 pl-12 pr-4 rounded-2xl border outline-none focus:border-blue-500" required />
            </div>
            <div className="relative">
              <MdLock className="absolute top-4 left-4 text-slate-400 text-xl" />
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" onChange={handleChange} className="w-full bg-slate-50 py-4 pl-12 pr-12 rounded-2xl border outline-none focus:border-blue-500" required />
              {/* 🔥 Password Eye Toggle */}
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-4 right-4 text-slate-400 text-xl hover:text-blue-600">
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
            <button type="button" onClick={() => setView('forgot')} className="text-xs font-bold text-blue-600 block ml-auto">Forgot Password?</button>
            <button type="submit" disabled={loading} className="w-full bg-[#1E3A8A] py-4 rounded-2xl text-white font-bold shadow-lg shadow-blue-200">{loading ? "Logging in..." : "Login"}</button>
            <p className="text-center text-sm text-slate-500">New User? <button type="button" onClick={() => setView('register')} className="font-bold text-blue-600">Sign Up</button></p>
          </form>
        )}

        {view === 'register' && (
          <div className="space-y-4">
            <input type="text" name="name" placeholder="Full Name" onChange={handleChange} className="w-full bg-slate-50 py-3.5 px-4 rounded-2xl border" />
            <input type="text" name="username" placeholder="Username" onChange={handleChange} className="w-full bg-slate-50 py-3.5 px-4 rounded-2xl border" />
            <input type="email" name="identifier" placeholder="Email Address" onChange={handleChange} className="w-full bg-slate-50 py-3.5 px-4 rounded-2xl border" />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full bg-slate-50 py-3.5 px-4 rounded-2xl border" />
            <button onClick={() => handleSendOtp('register')} disabled={loading} className="w-full bg-[#1E3A8A] py-4 rounded-2xl text-white font-bold">{loading ? "Sending OTP..." : "Continue"}</button>
            <button onClick={() => setView('login')} className="w-full text-xs font-bold text-slate-400">Back to Login</button>
          </div>
        )}

        {(view === 'register-otp' || view === 'forgot-otp') && (
          <form onSubmit={(e) => handleFinalSubmit(e, view === 'register-otp' ? 'register' : 'reset-password')} className="space-y-5">
            <input type="text" name="otp" placeholder="6-DIGIT OTP" maxLength="6" onChange={handleChange} className="w-full bg-slate-50 py-4 rounded-2xl border text-center font-black text-xl tracking-[0.5em]" required />
            {view === 'forgot-otp' && <input type="password" name="newPassword" placeholder="New Password" onChange={handleChange} className="w-full bg-slate-50 py-4 px-4 rounded-2xl border" required />}
            <button type="submit" className="w-full bg-emerald-600 py-4 rounded-2xl text-white font-bold">{loading ? "Verifying..." : "Verify & Finish"}</button>
          </form>
        )}

        {view === 'forgot' && (
          <div className="space-y-5">
            <input type="email" name="identifier" placeholder="Registered Email" onChange={handleChange} className="w-full bg-slate-50 py-4 px-4 rounded-2xl border" required />
            <button onClick={() => handleSendOtp('forgot')} disabled={loading} className="w-full bg-[#1E3A8A] py-4 rounded-2xl text-white font-bold">Send Recovery Code</button>
            <button onClick={() => setView('login')} className="w-full text-xs font-bold text-slate-400">Cancel</button>
          </div>
        )}
      </div>

      {/* 🔥 Your Name Credit */}
      <div className="mt-8 text-slate-400 text-xs font-medium tracking-widest uppercase">
        Developed by <span className="text-blue-600 font-bold">Parveen Sharma</span>
      </div>
    </div>
  );
};

export default Auth;