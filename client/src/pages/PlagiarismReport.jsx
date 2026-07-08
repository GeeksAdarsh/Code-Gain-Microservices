import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plagiarismAPI } from '../services/api';
import { ArrowLeft, FileSearch, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlagiarismReport() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [expandedReport, setExpandedReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, [testId]);

  const loadReports = async () => {
    try {
      const res = await plagiarismAPI.getReports(testId);
      setReports(res.data);
    } catch (err) {
      // No reports yet
    } finally {
      setLoading(false);
    }
  };

  const runCheck = async () => {
    setChecking(true);
    try {
      const res = await plagiarismAPI.runCheck(testId);
      toast.success(`Scan complete! Found ${res.data.length} cases.`);
      loadReports();
    } catch (err) {
      toast.error('Plagiarism check failed');
    } finally {
      setChecking(false);
    }
  };

  const updateStatus = async (reportId, status) => {
    try {
      await plagiarismAPI.updateStatus(reportId, status, '');
      toast.success('Status updated');
      loadReports();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const getSimilarityColor = (pct) => {
    if (pct >= 90) return 'text-red-400 bg-red-500/20 border-red-500/30';
    if (pct >= 70) return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
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
          <div className="flex items-center gap-3 mb-2">
            <FileSearch className="w-8 h-8 text-red-400" />
            <h1 className="text-3xl font-bold text-white">
              <span className="gradient-text">Plagiarism Report</span>
            </h1>
          </div>
          <p className="text-slate-400">Code similarity analysis between submissions</p>
        </div>
        <button onClick={runCheck} disabled={checking} className="btn-danger flex items-center gap-2">
          {checking ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <FileSearch className="w-4 h-4" />
          )}
          {checking ? 'Scanning...' : 'Run Plagiarism Scan'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-white">{reports.length}</p>
          <p className="text-sm text-slate-400">Cases Detected</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-red-400">
            {reports.filter(r => r.similarity >= 90).length}
          </p>
          <p className="text-sm text-slate-400">Critical (≥90%)</p>
        </div>
        <div className="glass-card p-5 text-center">
          <p className="text-3xl font-bold text-amber-400">
            {reports.filter(r => r.status === 'DETECTED' || r.status === 'UNDER_REVIEW').length}
          </p>
          <p className="text-sm text-slate-400">Pending Review</p>
        </div>
      </div>

      {/* Reports */}
      {reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="glass-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* User 1 */}
                    <div className="text-center">
                      <p className="text-white font-medium">{report.user1Name}</p>
                      <p className="text-xs text-slate-500">@{report.user1Username}</p>
                    </div>

                    {/* Similarity */}
                    <div className="text-center">
                      <div className={`text-2xl font-bold px-4 py-2 rounded-xl border ${getSimilarityColor(report.similarity)}`}>
                        {Math.round(report.similarity)}%
                      </div>
                      <p className="text-xs text-slate-500 mt-1">similarity</p>
                    </div>

                    {/* User 2 */}
                    <div className="text-center">
                      <p className="text-white font-medium">{report.user2Name}</p>
                      <p className="text-xs text-slate-500">@{report.user2Username}</p>
                    </div>

                    {/* Question */}
                    <div className="ml-6">
                      <p className="text-xs text-slate-500">Question</p>
                      <p className="text-sm text-slate-300">{report.questionTitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${
                      report.status === 'CONFIRMED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      report.status === 'FALSE_POSITIVE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      report.status === 'DISMISSED' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                      'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {report.status}
                    </span>

                    <button onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                      className="btn-secondary text-xs py-1 px-2">
                      <Eye className="w-3 h-3" />
                    </button>
                    <button onClick={() => updateStatus(report.id, 'CONFIRMED')}
                      className="text-red-400 hover:text-red-300 p-1" title="Confirm Plagiarism">
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => updateStatus(report.id, 'FALSE_POSITIVE')}
                      className="text-emerald-400 hover:text-emerald-300 p-1" title="Mark as False Positive">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded: Matched Code */}
              {expandedReport === report.id && report.matchedTokens && (
                <div className="border-t border-slate-700 p-5 bg-slate-800/30">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Matching Code Segments:</h4>
                  <pre className="text-xs text-red-300 font-mono bg-slate-900 p-4 rounded-xl overflow-auto max-h-60 whitespace-pre-wrap">
                    {report.matchedTokens}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <FileSearch className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 text-lg mb-2">No plagiarism reports yet</p>
          <p className="text-slate-500 text-sm mb-4">Click "Run Plagiarism Scan" to check submissions</p>
        </div>
      )}
    </div>
  );
}
