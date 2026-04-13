import React, { useState } from 'react';
import axios from 'axios';
import { MdEmail, MdLock, MdPerson, MdVpnKey } from 'react-icons/md';
import toast from 'react-hot-toast';

const Auth = ({ onLoginSuccess }) => {
  const [view, setView] = useState('login'); 
  const [formData, setFormData] = useState({ name: '', username: '', identifier: '', password: '', otp: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [recoveredUsername, setRecoveredUsername] = useState('');
  
  const BACKEND_URL = "https://nexuschat-backend-ysa6.onrender.com";

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = async (type) => {
    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/auth/send-otp`, { identifier: formData.identifier, type });
      toast.success("OTP sent to your email!");
      setView(type === 'register' ? 'register-otp' : 'forgot-otp');
    } catch (error) { toast.error(error.response?.data?.message || "Error processing request"); }
    setLoading(false);
  };

  const handleFinalSubmit = async (e, endpoint) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/${endpoint}`, formData);
      if (endpoint === 'login' || endpoint === 'register') {
        onLoginSuccess(response.data.token, response.data.userId);
        toast.success(endpoint === 'login' ? "Welcome Back!" : "Account Created!");
      } else {
        setRecoveredUsername(response.data.username);
        toast.success("Password Reset Successful!");
        setView('reset-success');
      }
    } catch (error) { toast.error(error.response?.data?.message || "Action failed"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-blue-500 selection:text-white" style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%)' }}>
      
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-500 border border-white">
        
        {/* 🔥 3D METALLIC CSS LOGO - DITTO IMAGE JAISA */}
        <div className="flex flex-col items-center mb-10">
          
          {/* Outer Silver/Metallic Ring */}
          <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-full p-[4px] shadow-[0_15px_35px_rgba(0,50,150,0.2),inset_0_-4px_8px_rgba(0,0,0,0.1)] bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 mb-5">
            
            {/* Inner Deep Blue Circle with 3D inset shadow */}
            <div className="flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-[#0B2A5A] via-[#154699] to-[#2563EB] shadow-[inset_0_8px_16px_rgba(0,0,0,0.6),inset_0_-2px_6px_rgba(255,255,255,0.2)] relative overflow-hidden">
              
              {/* Top Glass/Gloss Reflection */}
              <div className="absolute -top-1/4 left-1/4 w-3/4 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-full blur-[2px] transform -rotate-12"></div>
              
              {/* 3D Bold Text */}
              <span className="text-white text-5xl sm:text-6xl font-black tracking-tighter relative z-10" 
                    style={{ 
                      fontFamily: 'Arial, sans-serif', 
                      textShadow: '0px 4px 10px rgba(0,0,0,0.5), 0px -1px 1px rgba(255,255,255,0.3)' 
                    }}>
                NC
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A5A] tracking-tight drop-shadow-sm">NexusChat</h1>
          <span className="text-blue-600 font-bold text-[10px] sm:text-xs tracking-[0.3em] uppercase mt-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Premium</span>
        </div>

        {/* --- LOGIN VIEW --- */}
        {view === 'login' && (
          <form onSubmit={(e) => handleFinalSubmit(e, 'login')} className="space-y-4 sm:space-y-5 animate-in slide-in-from-right-4">
            <div className="relative group">
              <MdPerson className="absolute top-4 left-5 text-slate-400 text-xl group-focus-within:text-[#154699] transition-colors" />
              <input type="text" name="identifier" placeholder="Username / Email" onChange={handleChange} className="w-full bg-[#F8FAFC] py-4 pl-14 pr-5 rounded-2xl border-2 border-transparent focus:border-[#154699]/20 outline-none focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all text-sm sm:text-base text-slate-700 font-medium" required />
            </div>
            <div className="relative group">
              <MdLock className="absolute top-4 left-5 text-slate-400 text-xl group-focus-within:text-[#154699] transition-colors" />
              <input type="password" name="password" placeholder="Password" onChange={handleChange} className="w-full bg-[#F8FAFC] py-4 pl-14 pr-5 rounded-2xl border-2 border-transparent focus:border-[#154699]/20 outline-none focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all text-sm sm:text-base text-slate-700 font-medium" required />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setView('forgot')} className="text-xs sm:text-sm font-bold text-[#154699] hover:text-blue-800 transition-colors py-1 outline-none">Forgot your password?</button>
            </div>
            
            {/* 3D Button */}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-b from-[#1C51B2] to-[#0B2A5A] hover:from-[#154699] hover:to-[#081F45] text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-[0_8px_20px_rgba(11,42,90,0.3)] text-sm sm:text-base outline-none border border-[#2563EB]/50">
              {loading ? "Logging in..." : "Log in"}
            </button>
            
            <div className="pt-5 text-center text-sm text-slate-500 font-medium">
              Don't have an account? <button type="button" onClick={() => setView('register')} className="font-bold text-[#154699] hover:underline outline-none ml-1">Sign Up</button>
            </div>
          </form>
        )}

        {/* --- REGISTER STEP 1 --- */}
        {view === 'register' && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <h2 className="text-center font-extrabold text-[#0B2A5A] mb-4 text-lg">Secure Registration</h2>
            <div className="relative">
              <MdPerson className="absolute top-4 left-5 text-slate-400 text-xl" />
              <input type="text" name="name" placeholder="Full Name" onChange={handleChange} className="w-full bg-[#F8FAFC] py-3.5 pl-14 pr-5 rounded-2xl border-2 border-transparent focus:border-[#154699]/20 outline-none focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-sm font-medium" />
            </div>
            <div className="relative">
              <MdPerson className="absolute top-4 left-5 text-slate-400 text-xl" />
              <input type="text" name="username" placeholder="Username" onChange={handleChange} className="w-full bg-[#F8FAFC] py-3.5 pl-14 pr-5 rounded-2xl border-2 border-transparent focus:border-[#154699]/20 outline-none focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-sm font-medium" />
            </div>
            <div className="relative">
              <MdEmail className="absolute top-4 left-5 text-slate-400 text-xl" />
              <input type="email" name="identifier" placeholder="Email Address" onChange={handleChange} className="w-full bg-[#F8FAFC] py-3.5 pl-14 pr-5 rounded-2xl border-2 border-transparent focus:border-[#154699]/20 outline-none focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-sm font-medium" />
            </div>
            <div className="relative">
              <MdLock className="absolute top-4 left-5 text-slate-400 text-xl" />
              <input type="password" name="password" placeholder="Create Password" onChange={handleChange} className="w-full bg-[#F8FAFC] py-3.5 pl-14 pr-5 rounded-2xl border-2 border-transparent focus:border-[#154699]/20 outline-none focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-sm font-medium" />
            </div>
            <button onClick={() => handleSendOtp('register')} disabled={loading} className="w-full bg-gradient-to-b from-[#1C51B2] to-[#0B2A5A] hover:from-[#154699] hover:to-[#081F45] text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-[0_8px_20px_rgba(11,42,90,0.3)] text-sm sm:text-base outline-none mt-2">
              {loading ? "Sending Code..." : "Continue"}
            </button>
            <div className="text-center mt-3">
              <button onClick={() => setView('login')} className="text-xs sm:text-sm font-bold text-slate-400 hover:text-[#0B2A5A] outline-none">Cancel</button>
            </div>
          </div>
        )}

        {/* --- OTP VERIFICATION --- */}
        {(view === 'register-otp' || view === 'forgot-otp') && (
          <form onSubmit={(e) => handleFinalSubmit(e, view === 'register-otp' ? 'register' : 'reset-password')} className="space-y-5 animate-in slide-in-from-right-4">
            <div className="text-center mb-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <h2 className="font-extrabold text-[#0B2A5A]">Verify Email</h2>
              <p className="text-xs text-[#154699] mt-1 font-medium">Code sent to:<br/><b>{formData.identifier}</b></p>
            </div>
            <div className="relative">
              <MdVpnKey className="absolute top-4 left-5 text-slate-400 text-xl" />
              <input type="text" name="otp" placeholder="6-DIGIT OTP" maxLength="6" onChange={handleChange} className="w-full bg-[#F8FAFC] py-4 pl-14 pr-5 rounded-2xl border-2 border-transparent focus:border-[#154699]/20 outline-none focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-center font-black text-xl tracking-[0.6em] text-slate-800 uppercase" required />
            </div>
            {view === 'forgot-otp' && (
              <div className="relative mt-4">
                <MdLock className="absolute top-4 left-5 text-slate-400 text-xl" />
                <input type="password" name="newPassword" placeholder="Set New Password" onChange={handleChange} className="w-full bg-[#F8FAFC] py-4 pl-14 pr-5 rounded-2xl border-2 border-transparent focus:border-[#154699]/20 outline-none focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-sm font-medium" required />
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-[0_8px_20px_rgba(16,185,129,0.3)] text-sm sm:text-base outline-none">
              {loading ? "Verifying..." : "Verify & Complete"}
            </button>
            <div className="text-center mt-3">
              <button type="button" onClick={() => setView(view === 'register-otp' ? 'register' : 'forgot')} className="text-xs sm:text-sm font-bold text-slate-400 hover:text-slate-600 outline-none">Back</button>
            </div>
          </form>
        )}

        {/* --- FORGOT PASSWORD --- */}
        {view === 'forgot' && (
          <div className="space-y-5 animate-in slide-in-from-right-4">
            <h2 className="text-center font-extrabold text-[#0B2A5A] mb-4 text-lg">Account Recovery</h2>
            <div className="relative">
              <MdEmail className="absolute top-4 left-5 text-slate-400 text-xl" />
              <input type="email" name="identifier" placeholder="Registered Email Address" onChange={handleChange} className="w-full bg-[#F8FAFC] py-4 pl-14 pr-5 rounded-2xl border-2 border-transparent focus:border-[#154699]/20 outline-none focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-sm sm:text-base font-medium" required />
            </div>
            <button onClick={() => handleSendOtp('forgot')} disabled={loading} className="w-full bg-gradient-to-b from-[#1C51B2] to-[#0B2A5A] hover:from-[#154699] hover:to-[#081F45] text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-[0_8px_20px_rgba(11,42,90,0.3)] text-sm sm:text-base outline-none">
              {loading ? "Searching..." : "Send Recovery Code"}
            </button>
            <div className="text-center mt-3">
              <button onClick={() => setView('login')} className="text-xs sm:text-sm font-bold text-slate-400 hover:text-[#0B2A5A] outline-none">Back to Login</button>
            </div>
          </div>
        )}

        {/* --- RESET SUCCESS --- */}
        {view === 'reset-success' && (
          <div className="text-center space-y-6 animate-in zoom-in-95">
            <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl shadow-inner">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-emerald-500/30">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <p className="text-base font-extrabold text-emerald-900">Password Reset Complete!</p>
              <p className="text-sm text-emerald-700 mt-2 font-medium">Your Username:<br/><span className="inline-block mt-1 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-emerald-100 font-bold text-emerald-800">@{recoveredUsername}</span></p>
            </div>
            <button onClick={() => setView('login')} className="w-full bg-gradient-to-b from-[#1C51B2] to-[#0B2A5A] text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_rgba(11,42,90,0.3)] transition-all active:scale-[0.98] text-sm sm:text-base outline-none">
              Proceed to Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Auth;