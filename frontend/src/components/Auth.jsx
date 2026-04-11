import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';

const Auth = ({ onLoginSuccess }) => {
  // Form View State (Login vs Register)
  const [isLoginView, setIsLoginView] = useState(true);
  
  // Input States
  const [name, setName] = useState('');
  const [username, setUsername] = useState(''); 
  const [identifier, setIdentifier] = useState(''); // Used for Login (Accepts Username or Email)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Submit Handler for both Login and Registration
  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const endpoint = isLoginView ? '/login' : '/register';
      
      // Construct payload dynamically based on the current view
      const payload = isLoginView 
        ? { identifier, password } 
        : { name, username, email, password };
        
      const response = await axios.post(`https://nexuschat-backend-ysa6.onrender.com/api/auth${endpoint}`, payload);

      if (isLoginView) {
        toast.success(`Welcome back, ${response.data.user.name || 'User'}!`); 
        onLoginSuccess(response.data.token, response.data.user.id);
      } else {
        toast.success("Account created! Please log in."); 
        setIsLoginView(true);
        setPassword('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="bg-white/70 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white max-w-md w-full z-10">
        
        {/* App Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">NC</div>
        </div>
        
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2 text-center">
          {isLoginView ? 'Welcome Back' : 'Join NexusChat'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-5 mt-8">
          
          {/* Registration specific fields */}
          {!isLoginView && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Full Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl outline-none" placeholder="Parveen Sharma" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Username</label>
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl outline-none lowercase" placeholder="parveen_07" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl outline-none" placeholder="you@example.com" />
              </div>
            </>
          )}

          {/* Login specific fields */}
          {isLoginView && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Email or Username</label>
              <input type="text" required value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl outline-none" placeholder="parveen_07 or email@domain.com" />
            </div>
          )}

          {/* Password Field (Common) */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-2xl outline-none pr-12" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400">
                {showPassword ? <MdVisibilityOff className="text-xl" /> : <MdVisibility className="text-xl" />}
              </button>
            </div>
          </div>
          
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg mt-4">
            {isLoading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Create Account')}
          </button>
        </form>
        
        {/* Toggle Form View */}
        <div className="mt-8 text-center">
          <button onClick={() => setIsLoginView(!isLoginView)} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">
            {isLoginView ? "New here? Create an account" : "Already a member? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;