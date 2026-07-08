import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { proctoringAPI } from '../services/api';
import { ArrowLeft, Shield, Eye, Camera, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProctoringReport() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [testId]);

  const loadData = async () => {
    try {
      const res = await proctoringAPI.getTestOverview(testId);
      setOverview(res.data);
    } catch (err) {
      toast.error('Failed to load proctoring data');
    } finally {
      setLoading(false);
    }
  };

  const getTrustColor = (score) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getTrustBg = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
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
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-8 h-8 text-indigo-400" />
        <h1 className="text-3xl font-bold text-white">
          <span className="gradient-text">Proctoring Report</span>
        </h1>
      </div>
      <p className="text-slate-400 mb-8">Monitoring summary for all participants</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-white">{overview.length}</p>
          <p className="text-sm text-slate-400">Monitored Students</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-red-400">
            {overview.filter(s => s.trustScore < 50).length}
          </p>
          <p className="text-sm text-slate-400">Flagged (Trust {'<'} 50%)</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-emerald-400">
            {overview.filter(s => s.trustScore >= 80).length}
          </p>
          <p className="text-sm text-slate-400">Clean (Trust ≥ 80%)</p>
        </div>
      </div>

      {/* Student Proctoring Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-5 text-sm text-slate-400 font-medium">Student</th>
              <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Trust Score</th>
              <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Tab Switches</th>
              <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Flagged Events</th>
              <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {overview.map((student) => (
              <tr key={student.userId} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-5">
                  <p className="text-white font-medium">{student.fullName}</p>
                  <p className="text-xs text-slate-500">@{student.username}</p>
                </td>
                <td className="py-3 px-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getTrustBg(student.trustScore)}`}
                        style={{ width: `${student.trustScore}%` }}></div>
                    </div>
                    <span className={`font-bold text-sm ${getTrustColor(student.trustScore)}`}>
                      {student.trustScore}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-5 text-center">
                  <span className={`text-sm font-medium ${
                    student.tabSwitches > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {student.tabSwitches}
                  </span>
                </td>
                <td className="py-3 px-5 text-center">
                  <span className={`text-sm font-medium ${
                    student.flaggedCount > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {student.flaggedCount}
                  </span>
                </td>
                <td className="py-3 px-5 text-center">
                  {student.trustScore >= 80 ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Clean
                    </span>
                  ) : student.trustScore >= 50 ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full">
                      <Eye className="w-3 h-3" /> Review
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Suspicious
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {overview.length === 0 && (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-500">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No proctoring data available yet</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
