import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { Zap, ArrowRight, GraduationCap, BookOpen, UserCog } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    role: 'student' 
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const roles = [
    {
      value: 'student',
      label: 'Student',
      icon: GraduationCap,
      color: 'from-blue-500 to-blue-600',
      description: 'Access collaborative documents, assignments, and polls'
    },
    {
      value: 'instructor',
      label: 'Instructor',
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      description: 'Create assignments, manage polls, and control document access'
    },
    {
      value: 'teaching-assistant',
      label: 'Teaching Assistant',
      icon: UserCog,
      color: 'from-green-500 to-green-600',
      description: 'Help grade assignments, manage discussions, and assist students'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogin) {
      // Validation for signup
      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : { 
          username: formData.username, 
          email: formData.email, 
          password: formData.password,
          role: formData.role
        };
    
    try {
      const res = await fetch(`${config.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Authentication failed');

      // Save user to localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('educonnect-user-id', data.user.id);

      // Navigate based on role
      if (data.user.role === 'instructor') {
        navigate('/instructor-dashboard');
      } else if (data.user.role === 'teaching-assistant') {
        navigate('/ta-dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-[400px] bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl z-10">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="text-white fill-white" size={24} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-white mb-2">
          {isLogin ? 'Welcome Back' : 'Join EduConnect'}
        </h2>
        <p className="text-zinc-500 text-center text-sm mb-8">
          {isLogin ? 'Enter your credentials to access your workspace.' : 'Start collaborating with your team today.'}
        </p>

        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Username" 
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          )}
          <input 
            type="email" 
            placeholder="Email Address" 
            required
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" 
            placeholder="Password" 
            required
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          {!isLogin && (
            <input 
              type="password" 
              placeholder="Confirm Password" 
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
            />
          )}

          {!isLogin && (
            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-zinc-300 block">Select Your Role</label>
              <div className="grid grid-cols-1 gap-2">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setFormData({...formData, role: role.value})}
                      className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                        formData.role === role.value
                          ? 'border-white/40 bg-white/5'
                          : 'border-white/10 bg-black/20 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="text-white" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold text-sm">{role.label}</h3>
                          <p className="text-zinc-400 text-xs line-clamp-1">{role.description}</p>
                        </div>
                        {formData.role === role.value && (
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 mt-2">
            {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ username: '', email: '', password: '', confirmPassword: '', role: 'student' });
            }}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;