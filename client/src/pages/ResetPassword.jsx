import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Code2, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid reset link — no token found.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(token, form.password);
      toast.success('Password reset! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center animated-bg p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Code Gain Technology</span>
          </Link>
        </div>

        <div className="glass-card p-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">Set a new password</h2>
          <p className="text-slate-400 text-center mb-8">Choose a strong password you haven't used before.</p>

          {!token && (
            <div className="mb-5 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
              This reset link is missing its token. Please request a new one.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pl-11 pr-12"
                  placeholder="Enter new password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pl-11"
                  placeholder="Re-enter new password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading || !token} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <p className="text-sm text-slate-400 text-center mt-6">
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
