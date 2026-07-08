import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({
    username: '', password: '', fullName: '', email: '',
    role: 'STUDENT', department: '', enrollmentNumber: '', sectionId: '',
    companyName: '', companyWebsite: '', companyDescription: '', industry: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/batch-section/batches').then(res => setBatches(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      api.get(`/batch-section/batches/${selectedBatch}/sections`).then(res => setSections(res.data)).catch(() => {});
    } else {
      setSections([]);
    }
  }, [selectedBatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully! 🎉');
      const dest = form.role === 'COMPANY' ? '/company' : form.role === 'TEACHER' ? '/teacher' : '/student';
      navigate(dest);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
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

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Code2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Code Gain Technology</span>
          </Link>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-2">Create Account</h2>
          <p className="text-slate-400 text-center mb-8">Join the coding community</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input type="text" className="input-field" placeholder="Your full name" value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
                <input type="text" className="input-field" placeholder="Choose username" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input type="email" className="input-field" placeholder="your@email.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-12" placeholder="Min 6 characters"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Batch</label>
                <select className="input-field" value={selectedBatch}
                  onChange={(e) => { setSelectedBatch(e.target.value); setForm({ ...form, sectionId: '' }); }}>
                  <option value="">Select Batch</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.program})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Section</label>
                <select className="input-field" value={form.sectionId}
                  onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                  disabled={!selectedBatch}>
                  <option value="">Select Section</option>
                  {sections.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Department</label>
                <input type="text" className="input-field" placeholder="e.g. CSE, IT" value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Enrollment Number</label>
                <input type="text" className="input-field" placeholder="e.g. 2024CS001" value={form.enrollmentNumber}
                  onChange={(e) => setForm({ ...form, enrollmentNumber: e.target.value })} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-6">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-slate-400 text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
