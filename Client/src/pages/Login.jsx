import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// TEMP: OTP flow removed for testing — admin logs in directly with password.
// Re-wire later: restore OTP state, handleSubmit requiresOtp branch, and the
// Admin Verification Code form (see git history / previous version of this file).
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await login(username, password);
      const roleHome = data.user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard';
      const intended = location.state?.from?.pathname;
      const isAllowed = data.user.role === 'admin'
        ? intended?.startsWith('/admin')
        : intended?.startsWith('/staff');
      navigate(isAllowed && intended ? intended : roleHome);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(1200px 560px at 85% -12%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(1000px 520px at -5% 110%, rgba(255,45,120,0.09), transparent 55%), #0B1220',
      }}
    >
      <div className="w-full max-w-5xl">
        <nav className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-cyan-300 via-white to-pink-400 bg-clip-text text-transparent">
            FMG Catering · Portal
          </h1>
          <Link
            to="/"
            className="text-sm text-cyan-300 border border-cyan-400/40 px-3 py-1.5 rounded hover:bg-cyan-400/10 hover:shadow-[0_0_14px_-4px_rgba(34,211,238,0.7)] transition-all"
          >
            ← Back to site
          </Link>
        </nav>

        <div className="bg-[#101A2E] border border-[#1E2A45] rounded-xl p-8 shadow-[0_0_30px_-14px_rgba(34,211,238,0.25)]">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-gold-600 text-white font-display text-2xl font-bold shadow-[0_0_24px_-6px_rgba(251,191,36,0.6)]">
              FMG
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold text-white">Staff & Admin Portal</h2>
            <p className="text-sm text-slate-400 mt-1">Sign in to manage bookings, sales, reports, and analytics</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-md mx-auto">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-[#0B1220] border border-[#1E2A45] text-white placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-[#0B1220] border border-[#1E2A45] text-white placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent transition-all"
                required
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-400 text-white py-3 rounded-lg font-semibold hover:opacity-90 hover:shadow-[0_0_24px_-6px_rgba(251,191,36,0.7)] transition-all"
            >
              Sign In
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">Authorized personnel only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;