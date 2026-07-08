import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { questionAPI, testAPI, batchAPI } from '../services/api';
import {
  BookOpen, Trophy, Plus, FileText, Calendar, Eye, Edit3, Search,
  ChevronLeft, ChevronRight, Clock, Users, Play, CheckCircle2,
  AlertCircle, BarChart2, Layers, ChevronRight as Arrow
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── helpers ── */
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

function TestStatusBadge({ test }) {
  const now = new Date();
  const start = test.startTime ? new Date(test.startTime) : null;
  const end = test.endTime ? new Date(test.endTime) : null;

  if (test.currentlyActive && end && end > now) {
    return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#00b8a3]">● Live</span>;
  }
  if (start && start > now) {
    return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Upcoming</span>;
  }
  if (end && end < now) {
    return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#3e3e3e] text-slate-400">Ended</span>;
  }
  if (test.published) {
    return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">Scheduled</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ffa116]/10 text-[#ffa116]">Draft</span>;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' • ' + new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const light = theme === 'light';

  // Admins should use /admin, not the teacher dashboard
  useEffect(() => {
    if (user?.role === 'ADMIN') navigate('/admin', { replace: true });
  }, [user, navigate]);

  const [questions, setQuestions]   = useState([]);
  const [tests, setTests]           = useState([]);
  const [batches, setBatches]       = useState([]);
  const [loading, setLoading]       = useState(true);

  /* question bank filters */
  const [qSearch, setQSearch]       = useState('');
  const [qDiff, setQDiff]           = useState('ALL');
  const [qTag, setQTag]             = useState(null);
  const [qShowTags, setQShowTags]   = useState(false);
  const [qPage, setQPage]           = useState(1);
  const [qBankOpen, setQBankOpen]   = useState(false);
  const Q_PER = 20;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [qRes, tRes, bRes] = await Promise.all([
        questionAPI.getAll(),
        testAPI.getMyTests(),
        batchAPI.getBatches().catch(() => ({ data: [] })),
      ]);
      setQuestions(qRes.data);
      setTests(tRes.data);
      setBatches(bRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handlePublish = async (id) => {
    try { await testAPI.publish(id); toast.success('Test published!'); loadData(); }
    catch { toast.error('Failed to publish'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#ffa116] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  /* derived stats */
  const activeTests    = tests.filter(t => t.currentlyActive);
  const upcomingTests  = tests.filter(t => { const s = t.startTime ? new Date(t.startTime) : null; return s && s > new Date() && !t.currentlyActive; });
  const draftTests     = tests.filter(t => !t.published);
  const totalStudents  = batches.reduce((s, b) => s + (b.studentCount || 0), 0);

  /* question bank filters */
  const tagCounts = {};
  questions.forEach(q => q.tags?.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const filtered = questions.filter(q => {
    if (qDiff !== 'ALL' && q.difficulty !== qDiff) return false;
    if (qSearch && !q.title.toLowerCase().includes(qSearch.toLowerCase())) return false;
    if (qTag && !q.tags?.includes(qTag)) return false;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / Q_PER);
  const paginated = filtered.slice((qPage - 1) * Q_PER, qPage * Q_PER);

  /* styling tokens */
  const card   = `rounded-2xl border ${light ? 'bg-white border-gray-200' : 'bg-[#1e1e1e] border-[#3e3e3e]'}`;
  const hdr    = light ? 'text-gray-800' : 'text-white';
  const sub    = light ? 'text-gray-400' : 'text-slate-500';
  const row    = light ? 'hover:bg-gray-50' : 'hover:bg-white/[0.03]';
  const div    = light ? 'divide-gray-100' : 'divide-[#2d2d2d]';
  const border = light ? 'border-gray-100' : 'border-[#2d2d2d]';
  const chip   = light ? 'bg-gray-100 text-gray-500' : 'bg-[#282828] text-slate-400';

  const stats = [
    { icon: <BookOpen className="w-5 h-5" />, bg: 'bg-blue-500/15', ic: 'text-blue-400', val: questions.length, label: 'Questions', sub: 'In question bank' },
    { icon: <Trophy className="w-5 h-5" />, bg: 'bg-violet-500/15', ic: 'text-violet-400', val: tests.length, label: 'My Tests', sub: 'Total created' },
    { icon: <Play className="w-5 h-5" />, bg: 'bg-emerald-500/15', ic: 'text-[#00b8a3]', val: activeTests.length, label: 'Live Now', sub: activeTests.length ? 'Currently active' : 'No active test' },
    { icon: <Users className="w-5 h-5" />, bg: 'bg-orange-500/15', ic: 'text-[#ffa116]', val: totalStudents || '—', label: 'Students', sub: `${batches.length} batch${batches.length !== 1 ? 'es' : ''}` },
    { icon: <AlertCircle className="w-5 h-5" />, bg: 'bg-amber-500/15', ic: 'text-[#ffc01e]', val: draftTests.length, label: 'Drafts', sub: 'Needs publishing' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-7">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className={`text-2xl font-bold ${hdr}`}>
            {greeting()}, <span className="gradient-text">{user?.fullName?.split(' ')[0]}</span>! 👋
          </h1>
          <p className={`text-sm mt-0.5 ${sub}`}>Here's what's happening with your tests today.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/teacher/create-question"
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border transition-all ${light ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-[#3e3e3e] text-slate-300 hover:bg-white/5'}`}>
            <Plus className="w-4 h-4" /> New Question
          </Link>
          <Link to="/teacher/create-test"
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl text-white transition-all"
            style={{ background: '#ffa116' }}>
            <Calendar className="w-4 h-4" /> New Test
          </Link>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-7">
        {stats.map((s, i) => (
          <div key={i} className={`${card} p-4`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center ${s.ic}`}>{s.icon}</div>
            </div>
            <p className={`text-2xl font-bold ${hdr}`}>{s.val}</p>
            <p className={`text-xs font-medium mt-0.5 ${hdr}`}>{s.label}</p>
            <p className={`text-[11px] mt-0.5 ${sub}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* My Tests — left 2/3 */}
        <div className={`lg:col-span-2 ${card} overflow-hidden`}>
          <div className={`flex items-center justify-between px-5 py-3.5 border-b ${border}`}>
            <h2 className={`text-sm font-semibold ${hdr}`}>My Tests</h2>
            <Link to="/teacher/contests" className={`text-[12px] flex items-center gap-1 text-[#ffa116] hover:opacity-80`}>
              View all <Arrow className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Table header */}
          <div className={`grid grid-cols-[1fr_90px_80px_100px] px-5 py-2 text-[11px] font-medium border-b ${border} ${sub}`}>
            <span>Test</span>
            <span>Questions</span>
            <span>Duration</span>
            <span className="text-right">Actions</span>
          </div>

          <div className={`divide-y ${div}`}>
            {tests.length === 0 ? (
              <div className="py-12 text-center">
                <Trophy className={`w-8 h-8 mx-auto mb-2 ${light ? 'text-gray-300' : 'text-slate-700'}`} />
                <p className={`text-sm mb-3 ${sub}`}>No tests created yet</p>
                <Link to="/teacher/create-test" className="text-sm font-medium text-[#ffa116] hover:opacity-80">Create your first test →</Link>
              </div>
            ) : tests.map(test => (
              <div key={test.id} className={`grid grid-cols-[1fr_90px_80px_100px] px-5 py-3 items-center ${row} transition-colors`}>
                {/* Title + meta */}
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[13px] font-medium truncate ${hdr}`}>{test.title}</span>
                    <TestStatusBadge test={test} />
                  </div>
                  <p className={`text-[11px] ${sub}`}>{test.startTime ? fmtDate(test.startTime) : 'No schedule set'}</p>
                </div>
                <span className={`text-[12px] ${sub}`}>{test.totalQuestions || 0} Qs</span>
                <span className={`text-[12px] ${sub}`}>{test.durationMinutes || '—'} min</span>
                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5">
                  <Link to={`/teacher/edit-test/${test.id}`}
                    className={`p-1.5 rounded-lg transition-colors ${light ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                    title="Edit">
                    <Edit3 className="w-3.5 h-3.5" />
                  </Link>
                  <Link to={`/contest/${test.id}`}
                    className={`p-1.5 rounded-lg transition-colors ${light ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                    title="Results">
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  {!test.published && (
                    <button onClick={() => handlePublish(test.id)}
                      className="text-[11px] px-2.5 py-1 rounded-lg font-semibold text-white bg-[#ffa116] hover:opacity-90 transition-opacity">
                      Publish
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Upcoming Tests */}
          <div className={`${card} overflow-hidden`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${border}`}>
              <h3 className={`text-sm font-semibold ${hdr}`}>Upcoming Tests</h3>
              <span className={`text-[11px] ${sub}`}>{upcomingTests.length} scheduled</span>
            </div>
            {upcomingTests.length === 0 ? (
              <div className={`px-4 py-6 text-center text-[12px] ${sub}`}>No upcoming tests</div>
            ) : (
              <div className={`divide-y ${div}`}>
                {upcomingTests.slice(0, 4).map(test => (
                  <div key={test.id} className={`flex items-center gap-3 px-4 py-3 ${row} transition-colors`}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-medium truncate ${hdr}`}>{test.title}</p>
                      <p className={`text-[10px] ${sub}`}>
                        {test.startTime ? new Date(test.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' • ' + new Date(test.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : 'No date'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {test.durationMinutes && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${light ? 'bg-violet-50 text-violet-600' : 'bg-violet-500/10 text-violet-400'}`}>{test.durationMinutes}m</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Now alert */}
          {activeTests.length > 0 && (
            <div className={`${card} overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${border} flex items-center gap-2`}>
                <span className="w-2 h-2 rounded-full bg-[#00b8a3] animate-pulse" />
                <h3 className={`text-sm font-semibold ${hdr}`}>Live Now</h3>
              </div>
              <div className={`divide-y ${div}`}>
                {activeTests.map(test => (
                  <div key={test.id} className="px-4 py-3">
                    <p className={`text-[12px] font-medium mb-1 ${hdr}`}>{test.title}</p>
                    <div className="flex items-center gap-2">
                      <Link to={`/contest/${test.id}/live`}
                        className="text-[11px] font-semibold px-3 py-1 rounded-lg text-white bg-[#00b8a3] hover:opacity-90 transition-opacity">
                        Monitor →
                      </Link>
                      <Link to={`/contest/${test.id}`}
                        className={`text-[11px] px-2 py-1 rounded-lg border transition-colors ${light ? 'border-gray-200 text-gray-500 hover:bg-gray-50' : 'border-[#3e3e3e] text-slate-400 hover:bg-white/5'}`}>
                        Results
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className={`${card} p-4`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${sub}`}>Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to: '/teacher/create-test', icon: <Calendar className="w-4 h-4" />, label: 'Create New Test', bg: 'from-violet-500 to-purple-600' },
                { to: '/teacher/create-question', icon: <Plus className="w-4 h-4" />, label: 'Add Question', bg: 'from-blue-500 to-indigo-600' },
                { to: '/teacher/students', icon: <Users className="w-4 h-4" />, label: 'Manage Students', bg: 'from-orange-500 to-amber-600' },
                { to: '/teacher/contests', icon: <BarChart2 className="w-4 h-4" />, label: 'View All Tests', bg: 'from-teal-500 to-cyan-600' },
              ].map((a, i) => (
                <Link key={i} to={a.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${light ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`}>
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${a.bg} flex items-center justify-center text-white flex-shrink-0`}>{a.icon}</div>
                  <span className={`text-[12px] font-medium ${hdr}`}>{a.label}</span>
                  <Arrow className={`w-3.5 h-3.5 ml-auto ${sub}`} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Question Bank (collapsible) ── */}
      <div className={`${card} overflow-hidden`}>
        <button
          onClick={() => setQBankOpen(v => !v)}
          className={`w-full flex items-center justify-between px-5 py-3.5 border-b ${border} ${row} transition-colors`}>
          <div className="flex items-center gap-2">
            <Layers className={`w-4 h-4 ${light ? 'text-gray-400' : 'text-slate-500'}`} />
            <h2 className={`text-sm font-semibold ${hdr}`}>Question Bank</h2>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${chip}`}>{questions.length} questions</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/teacher/create-question" onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-[12px] font-medium text-[#ffa116] hover:opacity-80">
              <Plus className="w-3.5 h-3.5" /> Add
            </Link>
            <ChevronRight className={`w-4 h-4 transition-transform ${sub} ${qBankOpen ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {qBankOpen && (
          <>
            {/* Tag cloud */}
            <div className={`px-5 pt-3 pb-2 border-b ${border}`}>
              <div className={`flex flex-wrap gap-x-3 gap-y-1 ${qShowTags ? '' : 'max-h-[22px] overflow-hidden'}`}>
                {sortedTags.map(([tag, count]) => (
                  <button key={tag} onClick={() => { setQTag(qTag === tag ? null : tag); setQPage(1); }}
                    className={`text-xs whitespace-nowrap transition-colors ${qTag === tag ? 'text-[#ffa116] font-semibold' : `${sub} hover:text-[#ffa116]`}`}>
                    {tag} <span className={`text-xs ${light ? 'text-gray-300' : 'text-slate-700'}`}>{count}</span>
                  </button>
                ))}
              </div>
              {sortedTags.length > 8 && (
                <button onClick={() => setQShowTags(!qShowTags)} className="text-[11px] text-[#ffa116] hover:opacity-80 mt-0.5">
                  {qShowTags ? 'Collapse ↑' : 'Expand ↓'}
                </button>
              )}
            </div>

            {/* Search + filter */}
            <div className={`flex items-center gap-3 px-5 py-3 border-b ${border}`}>
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${sub}`} />
                <input type="text" className="input-field pl-9 py-2 text-sm" placeholder="Search questions..."
                  value={qSearch} onChange={e => { setQSearch(e.target.value); setQPage(1); }} />
              </div>
              <div className="flex gap-1">
                {[{k:'ALL',l:'All'},{k:'EASY',l:'Easy'},{k:'MEDIUM',l:'Med.'},{k:'HARD',l:'Hard'}].map(d => (
                  <button key={d.k} onClick={() => { setQDiff(d.k); setQPage(1); }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      qDiff === d.k
                        ? d.k === 'EASY'   ? 'text-[#00b8a3] border-[rgba(0,184,163,0.3)] bg-[rgba(0,184,163,0.1)]'
                        : d.k === 'MEDIUM' ? 'text-[#ffc01e] border-[rgba(255,192,30,0.3)] bg-[rgba(255,192,30,0.1)]'
                        : d.k === 'HARD'   ? 'text-[#ef4743] border-[rgba(239,71,67,0.3)] bg-[rgba(239,71,67,0.1)]'
                        : 'text-[#ffa116] border-[rgba(255,161,22,0.3)] bg-[rgba(255,161,22,0.1)]'
                        : `${sub} ${light ? 'border-gray-200' : 'border-[#3e3e3e]'} hover:text-[#ffa116]`
                    }`}>{d.l}</button>
                ))}
              </div>
              <span className={`text-xs ${sub} whitespace-nowrap`}>{filtered.length} found</span>
            </div>

            {/* Table */}
            <table className="w-full">
              <thead>
                <tr className={`border-b ${border}`}>
                  <th className={`text-left py-2.5 px-5 text-[11px] font-medium ${sub} w-10`}>#</th>
                  <th className={`text-left py-2.5 px-5 text-[11px] font-medium ${sub}`}>Title</th>
                  <th className={`text-left py-2.5 px-5 text-[11px] font-medium ${sub} hidden sm:table-cell`}>Tags</th>
                  <th className={`text-left py-2.5 px-5 text-[11px] font-medium ${sub} w-20`}>Difficulty</th>
                  <th className={`text-right py-2.5 px-5 text-[11px] font-medium ${sub} w-20`}>Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${div}`}>
                {paginated.map((q, i) => (
                  <tr key={q.id} className={`${row} transition-colors`}>
                    <td className={`py-2.5 px-5 text-xs ${sub}`}>{(qPage - 1) * Q_PER + i + 1}</td>
                    <td className={`py-2.5 px-5 text-[13px] ${hdr}`}>{q.title}</td>
                    <td className="py-2.5 px-5 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {q.tags?.slice(0, 2).map((tag, ti) => (
                          <span key={ti} className={`text-[10px] px-1.5 py-0.5 rounded ${chip}`}>{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-5">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                        q.difficulty === 'EASY'   ? 'text-[#00b8a3] bg-[rgba(0,184,163,0.1)]' :
                        q.difficulty === 'MEDIUM' ? 'text-[#ffc01e] bg-[rgba(255,192,30,0.1)]' :
                                                    'text-[#ef4743] bg-[rgba(239,71,67,0.1)]'
                      }`}>
                        {q.difficulty === 'EASY' ? 'Easy' : q.difficulty === 'MEDIUM' ? 'Med.' : 'Hard'}
                      </span>
                    </td>
                    <td className="py-2.5 px-5 text-right">
                      <Link to={`/problem/${q.id}`} className={`text-[12px] text-[#ffa116] hover:opacity-80`}>View →</Link>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={5} className={`py-8 text-center text-sm ${sub}`}>No questions found</td></tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`flex items-center justify-center gap-1.5 px-5 py-3 border-t ${border}`}>
                <button onClick={() => setQPage(Math.max(1, qPage - 1))} disabled={qPage === 1}
                  className={`p-1.5 rounded-lg border ${light ? 'border-gray-200 text-gray-500' : 'border-[#3e3e3e] text-slate-400'} hover:text-[#ffa116] disabled:opacity-30`}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pn;
                  if (totalPages <= 7) pn = i + 1;
                  else if (qPage <= 4) pn = i + 1;
                  else if (qPage >= totalPages - 3) pn = totalPages - 6 + i;
                  else pn = qPage - 3 + i;
                  return (
                    <button key={i} onClick={() => setQPage(pn)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium border transition-all ${
                        qPage === pn
                          ? 'bg-[#ffa116] border-[#ffa116] text-white'
                          : `${light ? 'border-gray-200 text-gray-500' : 'border-[#3e3e3e] text-slate-400'} hover:text-[#ffa116]`
                      }`}>{pn}</button>
                  );
                })}
                <button onClick={() => setQPage(Math.min(totalPages, qPage + 1))} disabled={qPage === totalPages}
                  className={`p-1.5 rounded-lg border ${light ? 'border-gray-200 text-gray-500' : 'border-[#3e3e3e] text-slate-400'} hover:text-[#ffa116] disabled:opacity-30`}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
