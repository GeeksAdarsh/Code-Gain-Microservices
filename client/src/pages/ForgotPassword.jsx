import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent — check your inbox!');
    } catch (err) {
      // Backend intentionally returns a generic success, so errors here are network/validation only
      toast.error(err.response?.data?.error || 'Something went wrong. Please try again.');
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
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-slate-400 mb-6">
                If an account exists for <span className="text-slate-200">{email}</span>, we've sent a link to reset
                your password. The link expires shortly.
              </p>
              <Link to="/login" className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3">
                <ArrowLeft className="w-5 h-5" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Forgot password?</h2>
              <p className="text-slate-400 text-center mb-8">
                Enter your account email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      className="input-field pl-11"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send className="w-5 h-5" /> Send Reset Link
                    </>
                  )}
                </button>
              </form>

              <p className="text-sm text-slate-400 text-center mt-6">
                Remembered it?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Back to Sign In</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
