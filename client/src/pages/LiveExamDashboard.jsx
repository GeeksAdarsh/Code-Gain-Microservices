import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { testAPI, proctoringAPI } from '../services/api';
import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  RefreshCw,
  Trophy,
  Users,
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle,
  Activity,
  Pause,
  Play,
  RotateCcw,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const REFRESH_MS = 10_000;
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
const LB_PAGE_SIZE = 20;
const PRO_PAGE_SIZE = 15;

export default function LiveExamDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbPage, setLbPage] = useState(1);
  const [proPage, setProPage] = useState(1);

  const handleResetCompletion = async (userId, userName) => {
    if (!window.confirm(`Reset ${userName}'s submission? They will see a "Rejoin Test" button and can continue.`)) return;
    try {
      await testAPI.resetCompletion(id, userId);
      toast.success(`${userName}'s submission reset — they can rejoin now`);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    }
  };
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  const showProctoring = !!(test?.proctoringEnabled);

  const formatDate = (d) =>
    d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

  const getGrade = (score) => {
    if (score >= 90) return { label: 'A+', cls: 'bg-emerald-500/15 text-emerald-400' };
    if (score >= 75) return { label: 'A',  cls: 'bg-blue-500/15 text-blue-400' };
    if (score >= 60) return { label: 'B',  cls: 'bg-indigo-500/15 text-indigo-400' };
    if (score >= 45) return { label: 'C',  cls: 'bg-amber-500/15 text-amber-400' };
    if (score >= 30) return { label: 'D',  cls: 'bg-orange-500/15 text-orange-400' };
    return              { label: 'F',  cls: 'bg-red-500/15 text-red-400' };
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

  const trust = (raw) => {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
  };

  const refresh = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const [lbRes, testRes] = await Promise.all([
        testAPI.getLeaderboard(id),
        testAPI.getById(id),
      ]);
      setLeaderboard(lbRes.data || []);
      setTest(testRes.data);
      if (testRes.data?.proctoringEnabled) {
        const proRes = await proctoringAPI.getTestOverview(id);
        setOverview(proRes.data || []);
      } else {
        setOverview([]);
      }
      setLastUpdated(new Date());
    } catch (err) {
      toast.error('Failed to refresh live data');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!autoRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      refresh();
    }, REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refresh]);

  // ── Excel export helpers ────────────────────────────────────────────
  const exportLeaderboard = () => {
    const rows = leaderboard.map(r => ({
      Rank: r.rank,
      Name: r.fullName || r.username,
      Username: r.username,
      'Questions Solved': `${r.questionsAccepted}/${r.totalQuestions}`,
      'Test Cases': `${r.testCasesPassed}/${r.totalTestCases}`,
      'MCQ Score': r.mcqMaxMarks > 0 ? `${r.mcqScore}/${r.mcqMaxMarks}` : '-',
      'Last Submission': r.lastSubmission ? formatDate(r.lastSubmission) : '—',
      'Score / 100': r.score,
      Grade: getGrade(r.score).label,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leaderboard');
    XLSX.writeFile(wb, `${test?.title || 'test'}_leaderboard.xlsx`);
  };

  const exportProctoring = () => {
    const rows = overview.map(s => ({
      Name: s.fullName,
      Username: s.username,
      'Trust %': trust(s.trustScore),
      'Tab Switches': s.tabSwitches,
      Flagged: s.flaggedCount,
      Status: trust(s.trustScore) >= 80 ? 'Clean' : trust(s.trustScore) >= 50 ? 'Review' : 'Suspicious',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Proctoring');
    XLSX.writeFile(wb, `${test?.title || 'test'}_proctoring.xlsx`);
  };

  // ── Pagination helpers ───────────────────────────────────────────────
  const Pagination = ({ page, setPage, total, pageSize }) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
        <span className="text-xs text-slate-500">
          Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, i, arr) => {
              if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) => p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-slate-600 text-xs">…</span>
            ) : (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  p === page ? 'bg-[#ffa116] text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}>{p}</button>
            ))
          }
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 hover:bg-slate-700 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400">
        <p>Test not found</p>
        <button type="button" onClick={() => navigate('/contests')} className="mt-4 text-amber-500 hover:underline">
          Back to contests
        </button>
      </div>
    );
  }

  const now = Date.now();
  const activeCoding = leaderboard.filter(
    (r) => r.lastSubmission && now - new Date(r.lastSubmission).getTime() < ACTIVE_WINDOW_MS
  ).length;

  const suspicious = overview.filter((s) => trust(s.trustScore) < 50).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link to={`/contest/${id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-2">
            <ArrowLeft className="w-4 h-4" /> Contest detail
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <Activity className="w-8 h-8 text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Live exam monitor</h1>
              <p className="text-sm text-slate-400">{test.title}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Updated {lastUpdated.toLocaleTimeString('en-IN', { timeStyle: 'medium' })}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setAutoRefresh((a) => {
                const next = !a;
                if (next) refresh();
                return next;
              });
            }}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            {autoRefresh ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {autoRefresh ? 'Pause' : 'Resume'} auto-refresh
          </button>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={refreshing}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh now
          </button>
          {showProctoring && (
            <Link to={`/proctoring/${id}`} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Full proctoring report
            </Link>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Submissions refresh every {REFRESH_MS / 1000}s{showProctoring ? ' · Proctoring summary included' : ''}.
        {'"Active (5 min)" uses recent submission time as a rough signal, not true presence.'}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-white">{leaderboard.length}</p>
          <p className="text-[11px] text-slate-500">On leaderboard</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{activeCoding}</p>
          <p className="text-[11px] text-slate-500">Active (5 min)</p>
        </div>
        {showProctoring ? (
          <>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-white">{overview.length}</p>
              <p className="text-[11px] text-slate-500">Monitored</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{suspicious}</p>
              <p className="text-[11px] text-slate-500">{'Low trust (<50%)'}</p>
            </div>
          </>
        ) : (
          <div className="glass-card p-4 col-span-2 flex items-center justify-center text-sm text-slate-500">
            Proctoring is off for this test — enable it when creating or editing the test to see alerts here.
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-1 gap-6">
        {/* ── Leaderboard ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <Link to={`/contest/${id}`} className="flex items-center gap-2 hover:opacity-80">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-white">Live leaderboard</h2>
            </Link>
            <button onClick={exportLeaderboard} disabled={leaderboard.length === 0}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-40">
              <Download className="w-3.5 h-3.5" /> Export Excel
            </button>
          </div>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center w-16">Rank</th>
                  <th className="py-3 px-4 text-sm text-slate-400 font-medium text-left">User</th>
                  <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center">Questions</th>
                  <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center">Test cases</th>
                  <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center">Last submission</th>
                  <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center">Score / 100</th>
                  <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center">Grade</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice((lbPage - 1) * LB_PAGE_SIZE, lbPage * LB_PAGE_SIZE).map((row) => (
                  <tr key={row.userId} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-center text-sm text-slate-300">{row.rank}</td>
                    <td className="py-3 px-4">
                      <Link to={`/profile/${row.username}`} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                        {row.fullName || row.username}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-300">
                      {row.questionsAccepted}/{row.totalQuestions}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-400">
                      {row.testCasesPassed}/{row.totalTestCases}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-slate-500">
                      {row.lastSubmission ? formatDate(row.lastSubmission) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-bold text-white">{row.score}</span>
                      <span className="text-xs text-slate-500">/100</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(() => { const g = getGrade(row.score); return (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${g.cls}`}>{g.label}</span>
                      ); })()}
                    </td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      No submissions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination page={lbPage} setPage={setLbPage} total={leaderboard.length} pageSize={LB_PAGE_SIZE} />
          </div>
        </section>

        {/* ── Proctoring overview ── */}
        {showProctoring && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <Link to={`/proctoring/${id}`} className="flex items-center gap-2 hover:opacity-80">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Proctoring overview</h2>
              </Link>
              <button onClick={exportProctoring} disabled={overview.length === 0}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-40">
                <Download className="w-3.5 h-3.5" /> Export Excel
              </button>
            </div>
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-5 text-sm text-slate-400 font-medium">Student</th>
                    <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Trust</th>
                    <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Tab switches</th>
                    <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Flagged</th>
                    <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Status</th>
                    <th className="text-center py-3 px-5 text-sm text-slate-400 font-medium">Reset</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.slice((proPage - 1) * PRO_PAGE_SIZE, proPage * PRO_PAGE_SIZE).map((student) => {
                    const ts = trust(student.trustScore);
                    return (
                    <tr key={student.userId} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-5">
                        <p className="text-white font-medium text-sm">{student.fullName}</p>
                        <p className="text-xs text-slate-500">@{student.username}</p>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${getTrustBg(ts)}`} style={{ width: `${ts}%` }} />
                          </div>
                          <span className={`font-bold text-sm ${getTrustColor(ts)}`}>{ts}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`text-sm font-medium ${student.tabSwitches > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {student.tabSwitches}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={`text-sm font-medium ${student.flaggedCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {student.flaggedCount}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        {ts >= 80 ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Clean
                          </span>
                        ) : ts >= 50 ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
                            <Eye className="w-3 h-3" /> Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Suspicious
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">
                        <button
                          onClick={() => handleResetCompletion(student.userId, student.fullName)}
                          title="Reset student's submission so they can rejoin"
                          className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                  {overview.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500 text-sm">
                        No proctoring events yet — students will appear here once they take the test with monitoring on.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <Pagination page={proPage} setPage={setProPage} total={overview.length} pageSize={PRO_PAGE_SIZE} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
