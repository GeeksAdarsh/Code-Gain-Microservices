import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { companyAPI } from '../services/api';
import { ArrowLeft, Users, Trophy, CheckCircle, XCircle, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CandidateResults() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCandidates();
  }, [testId]);

  const loadCandidates = async () => {
    try {
      const res = await companyAPI.getCandidates(testId);
      setCandidates(res.data);
    } catch (err) {
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
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
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="gradient-text">Candidate Results</span>
          </h1>
          <p className="text-slate-400">{candidates.length} candidates evaluated</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-white">{candidates.length}</p>
          <p className="text-sm text-slate-400">Total Candidates</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-emerald-400">
            {candidates.filter(c => c.status === 'SHORTLISTED').length}
          </p>
          <p className="text-sm text-slate-400">Shortlisted (≥60%)</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-amber-400">
            {candidates.length > 0 ? Math.round(candidates.reduce((sum, c) => sum + c.percentage, 0) / candidates.length) : 0}%
          </p>
          <p className="text-sm text-slate-400">Average Score</p>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-5 text-sm text-slate-400 font-medium">Rank</th>
              <th className="text-left py-3 px-5 text-sm text-slate-400 font-medium">Candidate</th>
              <th className="text-left py-3 px-5 text-sm text-slate-400 font-medium">Email</th>
              <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Score</th>
              <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Test Cases</th>
              <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Questions</th>
              <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c, i) => (
              <tr key={c.userId} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="py-3 px-5">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-amber-500/20 text-amber-400' :
                    i === 1 ? 'bg-slate-400/20 text-slate-300' :
                    i === 2 ? 'bg-orange-500/20 text-orange-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {i + 1}
                  </span>
                </td>
                <td className="py-3 px-5">
                  <p className="text-white font-medium">{c.fullName}</p>
                  <p className="text-xs text-slate-500">@{c.username}</p>
                </td>
                <td className="py-3 px-5 text-slate-400 text-sm">{c.email}</td>
                <td className="py-3 px-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        c.percentage >= 80 ? 'bg-emerald-500' :
                        c.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`} style={{ width: `${c.percentage}%` }}></div>
                    </div>
                    <span className="text-white font-medium text-sm">{c.percentage}%</span>
                  </div>
                </td>
                <td className="py-3 px-5 text-center text-slate-400 text-sm">
                  {c.testCasesPassed}/{c.totalTestCases}
                </td>
                <td className="py-3 px-5 text-center text-slate-400 text-sm">
                  {c.questionsAttempted}
                </td>
                <td className="py-3 px-5 text-center">
                  {c.status === 'SHORTLISTED' ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Shortlisted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2.5 py-1 rounded-full">
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No candidates have taken this test yet</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
