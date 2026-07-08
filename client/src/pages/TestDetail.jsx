import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { testAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Clock, Calendar, ArrowRight, CheckCircle2, XCircle, Circle, RefreshCw, Code2, BarChart3, Users, FileText, Medal, Download, LayoutDashboard, RotateCcw, AlertTriangle, Link2, Copy, ShieldX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [tab, setTab] = useState('instructions');
  const [leaderboard, setLeaderboard] = useState([]);
  const [summary, setSummary] = useState(null);
  const [questionStatus, setQuestionStatus] = useState([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [studentResults, setStudentResults] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => { loadTest(); checkCompletion(); }, [id]);

  const loadTest = async () => {
    try {
      const res = await testAPI.getById(id);
      setTest(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 403 || status === 401) {
        setAccessDenied(true);
      } else {
        toast.error('Failed to load test');
      }
    }
    finally { setLoading(false); }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/contest/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      toast.success('Test link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  const checkCompletion = async () => {
    try {
      const res = await testAPI.isCompleted(id);
      if (res.data.completed) setCompletionData(res.data);
    } catch (err) {}
  };

  const loadLeaderboard = async () => {
    setLoadingTab(true);
    try {
      const res = await testAPI.getLeaderboard(id);
      setLeaderboard(res.data);
    } catch (err) { toast.error('Failed to load leaderboard'); }
    finally { setLoadingTab(false); }
  };

  const loadSummary = async () => {
    setLoadingTab(true);
    try {
      const res = await testAPI.getSummary(id);
      setSummary(res.data);
    } catch (err) { toast.error('Failed to load summary'); }
    finally { setLoadingTab(false); }
  };

  const loadProblems = async () => {
    setLoadingTab(true);
    try {
      const res = await testAPI.getQuestionStatus(id);
      setQuestionStatus(res.data);
    } catch (err) {}
    finally { setLoadingTab(false); }
  };

  const loadStudentResults = async () => {
    setLoadingTab(true);
    try {
      const [lbRes, compRes] = await Promise.all([
        testAPI.getLeaderboard(id),
        testAPI.getCompletions(id).catch(() => ({ data: [] })),
      ]);
      setStudentResults(lbRes.data);
      setCompletions(compRes.data);
    } catch (err) { toast.error('Failed to load results'); }
    finally { setLoadingTab(false); }
  };

  const handleResetCompletion = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      await testAPI.resetCompletion(id, resetTarget.userId);
      toast.success(`${resetTarget.userName}'s submission reset — they can rejoin now`);
      setResetTarget(null);
      const [lbRes, compRes] = await Promise.all([
        testAPI.getLeaderboard(id),
        testAPI.getCompletions(id).catch(() => ({ data: [] })),
      ]);
      setStudentResults(lbRes.data);
      setCompletions(compRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset submission');
    } finally {
      setResetting(false);
    }
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (newTab === 'leaderboard' && leaderboard.length === 0) loadLeaderboard();
    if (newTab === 'summary' && !summary) loadSummary();
    if (newTab === 'problems' && questionStatus.length === 0) loadProblems();
    if (newTab === 'students' && studentResults.length === 0) loadStudentResults();
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '';

  // Grade helper — score is treated as a percentage (0-100)
  const getGrade = (score) => {
    if (score >= 90) return { label: 'A+', cls: 'bg-emerald-500/15 text-emerald-400' };
    if (score >= 75) return { label: 'A',  cls: 'bg-blue-500/15 text-blue-400' };
    if (score >= 60) return { label: 'B',  cls: 'bg-indigo-500/15 text-indigo-400' };
    if (score >= 45) return { label: 'C',  cls: 'bg-amber-500/15 text-amber-400' };
    if (score >= 30) return { label: 'D',  cls: 'bg-orange-500/15 text-orange-400' };
    return              { label: 'F',  cls: 'bg-red-500/15 text-red-400' };
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (accessDenied) return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-slate-400 mb-2">This test is not available for your account.</p>
        <p className="text-sm text-slate-500 mb-8">
          This could mean the test is restricted to specific sections, batches, or you are not enrolled in the targeted section. Please contact your teacher or administrator if you believe this is a mistake.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-secondary py-2.5 px-6 text-sm">Go Back</button>
          <Link to="/contests" className="btn-primary py-2.5 px-6 text-sm">Browse Tests</Link>
        </div>
      </div>
    </div>
  );

  if (!test) return <div className="text-center text-slate-400 py-20">Test not found</div>;

  const now = new Date();  const startTime = test.startTime ? new Date(test.startTime) : null;
  const endTime = test.endTime ? new Date(test.endTime) : null;
  const isLive = startTime && endTime && now >= startTime && now <= endTime;
  const isEnded = endTime && now > endTime;
  const isCompleted = !!completionData?.completed;

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
  const canSeeLiveMonitor = isTeacher || user?.role === 'COMPANY';
  const tabs = [
    { id: 'instructions', label: 'Instructions', icon: FileText },
    { id: 'problems', label: 'Coding Problems', icon: Code2 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    ...(isTeacher ? [{ id: 'students', label: 'Student Results', icon: Users }] : []),
    ...(canSeeLiveMonitor ? [{ id: 'live', label: 'Live monitor', icon: LayoutDashboard, href: `/contest/${id}/live` }] : []),
    { id: 'summary', label: 'Summary', icon: BarChart3 },
  ];

  return (
    <>
    {/* Reset submission confirmation modal */}
    {resetTarget && (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="glass-card p-6 max-w-sm w-full mx-4 text-center">
          <div className="w-14 h-14 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <RotateCcw className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Reset Submission?</h3>
          <p className="text-sm text-slate-400 mb-5">
            This will clear <span className="text-white font-medium">{resetTarget.userName}</span>'s submission.
            They will be able to rejoin and retake the test <strong className="text-white">if it is still live</strong>.
            Their previous answers will be removed.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setResetTarget(null)} disabled={resetting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors">
              Cancel
            </button>
            <button onClick={handleResetCompletion} disabled={resetting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {resetting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              {resetting ? 'Resetting…' : 'Yes, Reset'}
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0">
          <div className="sticky top-20 space-y-1">
            {tabs.map(t => (
              t.href ? (
                <Link
                  key={t.id}
                  to={t.href}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all text-slate-400 hover:text-white hover:bg-slate-800/50"
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </Link>
              ) : (
                <button key={t.id} onClick={() => handleTabChange(t.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all ${
                    tab === t.id ? 'bg-amber-600/20 text-amber-600 font-medium border-l-2 border-amber-600' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}>
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              )
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Instructions Tab */}
          {tab === 'instructions' && (
            <div>
              {/* Deleted by Admin banner */}
              {test.deleted && (
                <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🚫</span>
                  <div>
                    <p className="font-bold text-red-400 text-sm">This test was deleted by Admin</p>
                    {test.deletedReason && (
                      <p className="text-sm text-red-300/80 mt-0.5">
                        Reason: <span className="font-medium text-red-300">{test.deletedReason}</span>
                        {test.deletedByAdminName && <span className="text-red-400/70"> • by {test.deletedByAdminName}</span>}
                      </p>
                    )}
                    <p className="text-xs text-red-400/60 mt-1">Students can no longer see or take this test. Please create a new test if needed.</p>
                  </div>
                </div>
              )}
              <div className="glass-card p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">{test.title}</h1>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isTeacher && !test.deleted && (
                      <button onClick={copyShareLink}
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          linkCopied
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                        }`}>
                        {linkCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {linkCopied ? 'Copied!' : 'Copy Share Link'}
                      </button>
                    )}
                    {isLive && !isCompleted && !test.deleted && (
                      <span className="text-xs bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full font-medium">Live</span>
                    )}
                    {isEnded && !isCompleted && (
                      <span className="text-xs bg-slate-700/50 text-slate-400 px-3 py-1 rounded-full">Archived</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-400 mb-4 flex-wrap">
                  <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {test.totalQuestions} Questions</span>
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> {test.totalMarks || 100} Marks</span>
                  <span className="flex items-center gap-1.5 text-red-400">
                    <Calendar className="w-4 h-4" />
                    From {formatDate(test.startTime)}<br/>to {formatDate(test.endTime)}
                  </span>
                </div>

                <ul className="text-sm text-slate-300 space-y-2 mb-4">
                  <li>• This Contest consists of <strong className="text-white">{test.totalQuestions} Coding Problems</strong> and is of <strong className="text-white">{test.durationMinutes} Minutes</strong> duration.</li>
                  {test.description && <li>• {test.description}</li>}
                  <li>• Solve as many problems as you can before time runs out. Score is based on test cases passed.</li>
                </ul>
              </div>

              <h2 className="text-lg font-bold text-white mb-3">Coding Problem Details</h2>
              <div className="glass-card p-5 mb-4">
                <p className="text-sm text-slate-300 mb-4">
                  Solve as many problem(s) as you can before the time runs out and based on the accuracy of your correct submission you will get the scores.
                </p>
                <div className="flex items-center gap-8 text-sm">
                  <span className="flex items-center gap-2 text-slate-300"><FileText className="w-4 h-4 text-slate-500" /> {test.totalQuestions} Questions</span>
                  <span className="flex items-center gap-2 text-slate-300"><CheckCircle2 className="w-4 h-4 text-slate-500" /> {test.totalMarks || 100} Marks</span>
                  {(isLive && !isCompleted) && (
                    <Link to={`/test/${id}`} className="ml-auto text-sm py-2 px-5 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2">
                      Solve Problems <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  {(isCompleted || isEnded) && (
                    <Link to={`/test/${id}`} className="ml-auto btn-secondary text-sm py-2 px-5 flex items-center gap-2">
                      Practice <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Coding Problems Tab */}
          {tab === 'problems' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">All Problems</h2>
                <button onClick={loadProblems} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              {loadingTab ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <div className="space-y-3">
                  {questionStatus.map((q, i) => (
                    <div key={q.questionId} className="glass-card p-5 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold">{q.title || `Question ${q.questionNumber}`}</h3>
                          {q.status === 'ACCEPTED' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {q.status === 'ATTEMPTED' && <XCircle className="w-4 h-4 text-red-400" />}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Max Marks: {q.maxMarks}</span>
                          {q.status !== 'NOT_ATTEMPTED' && (
                            <>
                              <span>Test Cases: {q.testCasesPassed}/{q.totalTestCases}</span>
                              <span>Marks: {q.marksObtained}/{q.maxMarks}</span>
                            </>
                          )}
                          {q.difficulty && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              q.difficulty === 'EASY' ? 'bg-emerald-500/15 text-emerald-400'
                              : q.difficulty === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-red-500/15 text-red-400'
                            }`}>{q.difficulty}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${
                          q.status === 'ACCEPTED' ? 'text-emerald-400'
                          : q.status === 'ATTEMPTED' ? 'text-red-400'
                          : 'text-slate-600'
                        }`}>
                          {q.marksObtained}/{q.maxMarks}
                        </span>
                        <Link to={`/problem/${q.questionId}?testId=${id}&practice=true`}
                          className="text-xs py-1.5 px-4 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Solve</Link>
                      </div>
                    </div>
                  ))}
                  {questionStatus.length === 0 && (
                    <div className="glass-card p-8 text-center text-slate-500">No problems loaded</div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Solution Accepted</span>
                    <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" /> Wrong Answer</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {tab === 'leaderboard' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Contest Leaderboard</h2>
                <button onClick={loadLeaderboard} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <p className="text-xs text-red-400 mb-1">*Results get refreshed every time you click Refresh.</p>
              <p className={`text-xs text-red-400 ${canSeeLiveMonitor ? 'mb-1' : 'mb-4'}`}>*This is the live leaderboard based on submissions.</p>
              {canSeeLiveMonitor && (
                <p className="text-xs text-slate-500 mb-4">
                  For auto-refresh and proctoring in one place, use{' '}
                  <Link to={`/contest/${id}/live`} className="text-amber-500 hover:underline">Live monitor</Link>.
                </p>
              )}
              {loadingTab ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div></div>
              ) : leaderboard.length > 0 ? (
                <div className="glass-card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center w-16">Rank</th>
                        <th className="py-3 px-4 text-sm text-slate-400 font-medium text-left">User</th>
                        <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center">Questions</th>
                        <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center">Test Cases</th>
                        <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center">MCQ</th>
                        <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center">Last Submission</th>
                        <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center">Score / 100</th>
                        <th className="py-3 px-4 text-sm text-slate-400 font-medium text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((row) => {
                        const isMe = user && row.userId === user.id;
                        return (
                          <tr key={row.userId} className={`border-b border-slate-800 transition-colors ${isMe ? 'bg-amber-600/10' : 'hover:bg-slate-800/50'}`}>
                            <td className="py-3 px-4 text-center">
                              {row.rank <= 3 ? (
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                  row.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' : row.rank === 2 ? 'bg-slate-400/20 text-slate-300' : 'bg-amber-500/20 text-amber-600'
                                }`}>{row.rank}</span>
                              ) : (
                                <span className="text-sm text-slate-400">{row.rank}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Link to={`/profile/${row.username}`} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
                                {row.fullName || row.username}
                              </Link>
                              {isMe && <span className="ml-2 text-[10px] text-amber-600 bg-amber-600/20 px-1.5 py-0.5 rounded">You</span>}
                            </td>
                            <td className="py-3 px-4 text-center text-sm text-slate-300">{row.questionsAccepted}/{row.totalQuestions}</td>
                            <td className="py-3 px-4 text-center text-sm text-slate-400">{row.testCasesPassed}/{row.totalTestCases}</td>
                            <td className="py-3 px-4 text-center text-sm text-slate-300">{row.mcqMaxMarks > 0 ? `${row.mcqScore}/${row.mcqMaxMarks}` : '-'}</td>
                            <td className="py-3 px-4 text-center text-xs text-slate-500">
                              {row.lastSubmission ? formatDate(row.lastSubmission) : '-'}
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="glass-card p-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400">No submissions yet</p>
                </div>
              )}
            </div>
          )}

          {/* Student Results Tab — Teacher Only */}
          {tab === 'students' && isTeacher && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Student Results</h2>
                <div className="flex gap-2">
                  <button onClick={loadStudentResults} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                  <button onClick={() => {
                    const csv = ['Rank,Name,Email,Questions Solved,Total Questions,Test Cases Passed,Total Test Cases,MCQ Score,MCQ Max,Score/100,Grade,Last Submission'];
                    studentResults.forEach(r => {
                      const grade = getGrade(r.score).label;
                      csv.push(`${r.rank},"${r.fullName}","${r.email || ''}",${r.questionsAccepted},${r.totalQuestions},${r.testCasesPassed},${r.totalTestCases},${r.mcqScore || 0},${r.mcqMaxMarks || 0},${r.score},${grade},"${r.lastSubmission || ''}"`);
                    });
                    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${test.title}_results.csv`; a.click();
                  }} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="glass-card p-3 text-center">
                  <p className="text-xl font-bold text-white">{studentResults.length}</p>
                  <p className="text-[11px] text-slate-500">Attempted</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-xl font-bold text-emerald-400">{studentResults.filter(r => r.score >= 70).length}</p>
                  <p className="text-[11px] text-slate-500">Passed (≥70%)</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-xl font-bold text-amber-400">{studentResults.length > 0 ? Math.round(studentResults.reduce((a, r) => a + r.score, 0) / studentResults.length) : 0}</p>
                  <p className="text-[11px] text-slate-500">Avg Score</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-xl font-bold text-white">{studentResults.length > 0 ? Math.max(...studentResults.map(r => r.score)) : 0}</p>
                  <p className="text-[11px] text-slate-500">Top Score</p>
                </div>
              </div>

              {loadingTab ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div></div>
              ) : studentResults.length > 0 ? (
                <div className="glass-card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="py-3 px-4 text-xs text-slate-400 font-medium text-center w-12">#</th>
                        <th className="py-3 px-4 text-xs text-slate-400 font-medium text-left">Student</th>
                        <th className="py-3 px-4 text-xs text-slate-400 font-medium text-center">Solved</th>
                        <th className="py-3 px-4 text-xs text-slate-400 font-medium text-center">Test Cases</th>
                        <th className="py-3 px-4 text-xs text-slate-400 font-medium text-center">MCQ</th>
                        <th className="py-3 px-4 text-xs text-slate-400 font-medium text-center">Score / 100</th>
                        <th className="py-3 px-4 text-xs text-slate-400 font-medium text-center">Grade</th>
                        <th className="py-3 px-4 text-xs text-slate-400 font-medium text-center">Submitted</th>
                        {isTeacher && <th className="py-3 px-4 text-xs text-slate-400 font-medium text-center">Reset</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {studentResults.map(r => (
                        <tr key={r.userId} className="border-b border-slate-800 hover:bg-slate-800/30">
                          <td className="py-3 px-4 text-center text-sm text-slate-400">{r.rank}</td>
                          <td className="py-3 px-4">
                            <Link to={`/profile/${r.username}`} className="text-sm text-white font-medium hover:text-indigo-400">{r.fullName}</Link>
                            <p className="text-[11px] text-slate-500">@{r.username}</p>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm text-white font-medium">{r.questionsAccepted}</span>
                            <span className="text-xs text-slate-500">/{r.totalQuestions}</span>
                          </td>
                          <td className="py-3 px-4 text-center text-xs text-slate-400">{r.testCasesPassed}/{r.totalTestCases}</td>
                          <td className="py-3 px-4 text-center text-xs text-slate-300">{r.mcqMaxMarks > 0 ? `${r.mcqScore}/${r.mcqMaxMarks}` : '-'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-sm font-bold ${r.score >= 60 ? 'text-emerald-400' : r.score >= 45 ? 'text-amber-400' : 'text-red-400'}`}>{r.score}</span>
                            <span className="text-xs text-slate-500">/100</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {(() => { const g = getGrade(r.score); return (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${g.cls}`}>{g.label}</span>
                            ); })()}
                          </td>
                          <td className="py-3 px-4 text-center text-[11px] text-slate-500">
                            {r.lastSubmission ? formatDate(r.lastSubmission) : '-'}
                          </td>
                          {isTeacher && (() => {
                            const comp = completions.find(c => c.userId === r.userId);
                            return (
                              <td className="py-3 px-4 text-center">
                                {comp ? (
                                  <div className="flex flex-col items-center gap-1">
                                    {comp.autoSubmitted && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                                        <AlertTriangle className="w-2.5 h-2.5" /> Auto
                                      </span>
                                    )}
                                    <button
                                      onClick={() => setResetTarget({ userId: r.userId, userName: r.fullName })}
                                      title="Reset this student's submission so they can rejoin"
                                      className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 flex items-center gap-1 transition-colors">
                                      <RotateCcw className="w-2.5 h-2.5" /> Reset
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-600">—</span>
                                )}
                              </td>
                            );
                          })()}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="glass-card p-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400">No students have attempted this test yet</p>
                </div>
              )}
            </div>
          )}

          {/* Summary Tab */}
          {tab === 'summary' && (
            <div>
              {loadingTab ? (
                <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div></div>
              ) : summary ? (
                <>
                  {/* Profile Card */}
                  <div className="glass-card p-6 mb-6" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                        {summary.profileImage ? (
                          <img src={summary.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          summary.fullName?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{summary.fullName}</h2>
                        <p className="text-sm text-slate-400">@{summary.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-8 mt-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Rank</p>
                        <p className="text-2xl font-bold text-amber-400">{summary.rank || '-'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Score</p>
                        <p className="text-2xl font-bold text-white">{summary.score}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">Time Taken</p>
                        <p className="text-2xl font-bold text-slate-300">{summary.durationMinutes || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Performance Overview */}
                  <h2 className="text-lg font-bold text-white mb-3">Performance Overview</h2>
                  <div className="glass-card p-6 mb-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-3">Score</h3>
                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#334155" strokeWidth="3" />
                              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3"
                                strokeDasharray={`${summary.percentage} ${100 - summary.percentage}`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{summary.percentage}%</span>
                          </div>
                          <div>
                            <p className="text-sm"><span className="text-amber-400">Problem Score</span> <span className="text-slate-400">Total Score</span></p>
                            <p className="text-lg font-bold text-white">{summary.score}/{summary.totalMarks}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-3">Problems</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">{summary.questionsAttempted}/{summary.totalQuestions}</span>
                            <span className="text-slate-500">Question attempted</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-300">{summary.questionsAccepted}/{summary.totalQuestions}</span>
                            <span className="text-slate-500">Correct answers</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Per-question Breakdown */}
                  <h2 className="text-lg font-bold text-white mb-3">Problems</h2>
                  <div className="glass-card overflow-hidden">
                    <div className="flex justify-between px-5 py-3 border-b border-slate-700 text-xs text-slate-500 font-medium">
                      <span>Problem</span>
                      <span>Marks: {summary.score}/{summary.totalMarks}</span>
                    </div>
                    {summary.questions?.map((q, i) => (
                      <div key={q.questionId} className="flex items-center justify-between px-5 py-3 border-b border-slate-800/50 hover:bg-slate-800/30">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-5">{i + 1}.</span>
                          {q.status === 'ACCEPTED' ? (
                            <span className="text-xs text-emerald-400">Test Cases: {q.testCasesPassed}/{q.totalTestCases} ✓ Correct</span>
                          ) : q.status === 'ATTEMPTED' ? (
                            <span className="text-xs text-red-400">Test Cases: {q.testCasesPassed}/{q.totalTestCases} ✗ Incorrect</span>
                          ) : (
                            <span className="text-xs text-slate-500">Not Attempted</span>
                          )}
                        </div>
                        <span className={`text-sm font-bold ${q.status === 'ACCEPTED' ? 'text-emerald-400' : q.status === 'ATTEMPTED' ? 'text-amber-400' : 'text-slate-600'}`}>
                          {q.marksObtained}/{q.maxMarks}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="glass-card p-12 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p className="text-slate-400">No summary available — attempt the test first</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
