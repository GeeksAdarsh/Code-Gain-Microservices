import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companyAPI, plagiarismAPI } from '../services/api';
import { Building2, Users, Trophy, Plus, Briefcase, ArrowRight, Eye, ShieldCheck, FileSearch } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, testsRes] = await Promise.all([
        companyAPI.getDashboard(),
        companyAPI.getHiringTests(),
      ]);
      setStats(statsRes.data);
      setTests(testsRes.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRunPlagiarismCheck = async (testId) => {
    try {
      const res = await plagiarismAPI.runCheck(testId);
      if (res.data.length > 0) {
        toast.error(`Found ${res.data.length} plagiarism cases!`);
      } else {
        toast.success('No plagiarism detected!');
      }
      navigate(`/plagiarism/${testId}`);
    } catch (err) {
      toast.error('Plagiarism check failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 fade-in">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-indigo-400" />
          <h1 className="text-3xl font-bold text-white">
            <span className="gradient-text">{stats.companyName || user?.companyName || 'Company'}</span>
          </h1>
        </div>
        <p className="text-slate-400">Manage hiring tests, evaluate candidates, and find top talent</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Trophy className="w-6 h-6" />, label: 'Hiring Tests', value: stats.totalHiringTests || 0, color: 'from-indigo-500 to-blue-500' },
          { icon: <Users className="w-6 h-6" />, label: 'Total Candidates', value: stats.totalCandidates || 0, color: 'from-emerald-500 to-teal-500' },
          { icon: <Briefcase className="w-6 h-6" />, label: 'Active Tests', value: stats.activeTests || 0, color: 'from-amber-500 to-orange-500' },
          { icon: <FileSearch className="w-6 h-6" />, label: 'Questions', value: stats.totalQuestions || 0, color: 'from-pink-500 to-rose-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-5 fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link to="/company/create-test" className="glass-card p-6 hover:border-indigo-500/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Create Hiring Test</h3>
              <p className="text-xs text-slate-400">With proctoring & plagiarism detection</p>
            </div>
          </div>
        </Link>
        <Link to="/teacher/create-question" className="glass-card p-6 hover:border-cyan-500/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Add Question</h3>
              <p className="text-xs text-slate-400">Create coding problems for tests</p>
            </div>
          </div>
        </Link>
        <Link to="/problems" className="glass-card p-6 hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Question Bank</h3>
              <p className="text-xs text-slate-400">Browse available problems</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Hiring Tests */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Hiring Tests</h2>
        {tests.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {tests.map((test) => (
              <div key={test.id} className="glass-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{test.title}</h3>
                    {test.jobRole && (
                      <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {test.jobRole}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${
                    test.currentlyActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : test.published
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                  }`}>
                    {test.currentlyActive ? '🟢 Live' : test.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-4">{test.description}</p>

                {/* Proctoring badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {test.proctoringEnabled && (
                    <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Proctored
                    </span>
                  )}
                  {test.cameraRequired && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">📷 Camera</span>
                  )}
                  {test.plagiarismCheckEnabled && (
                    <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">🔍 Plagiarism Check</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <span>{test.totalQuestions} questions</span>
                  <span>•</span>
                  <span>{test.durationMinutes} min</span>
                  {test.experienceLevel && (
                    <>
                      <span>•</span>
                      <span>{test.experienceLevel}</span>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link to={`/company/candidates/${test.id}`} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Candidates
                  </Link>
                  <button onClick={() => handleRunPlagiarismCheck(test.id)}
                    className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    <FileSearch className="w-3 h-3" /> Check Plagiarism
                  </button>
                  <Link to={`/proctoring/${test.id}`} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Proctoring
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 text-lg mb-2">No hiring tests yet</p>
            <p className="text-slate-500 text-sm mb-4">Create your first hiring test with proctoring</p>
            <Link to="/company/create-test" className="btn-primary">Create Hiring Test</Link>
          </div>
        )}
      </div>
    </div>
  );
}
