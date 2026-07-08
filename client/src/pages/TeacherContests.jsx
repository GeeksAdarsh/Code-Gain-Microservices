import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { testAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Trophy, Calendar, Plus, Eye, Edit3, BarChart2,
  ChevronLeft, ChevronRight, Play, FileText, CheckCircle2,
  Layers, Search, X, Radio
} from 'lucide-react';
import toast from 'react-hot-toast';

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

function getStatus(test) {
  if (test.deleted) return 'deleted';
  if (!test.published) return 'draft';
  const now = new Date();
  const st  = test.startTime ? new Date(test.startTime) : null;
  const et  = test.endTime   ? new Date(test.endTime)   : null;
  if (st && st > now) return 'scheduled';
  if (st && et && now >= st && now <= et) return 'live';
  if (et && now > et) return 'ended';
  return 'published';
}

const STATUS_META = {
  live:      { label: 'Live',      cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  scheduled: { label: 'Scheduled', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  draft:     { label: 'Draft',     cls: 'bg-gray-500/15 text-gray-400 border-gray-500/20' },
  published: { label: 'Published', cls: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  ended:     { label: 'Ended',     cls: 'bg-slate-500/15 text-slate-500 border-slate-500/20' },
  deleted:   { label: 'Deleted',   cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
};

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function TeacherContests() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const [tests,   setTests]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [viewDate, setViewDate] = useState(null); // selected date string YYYY-MM-DD
  const [curMonth, setCurMonth] = useState(() => {
    const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() };
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await testAPI.getMyTests();
      setTests(res.data || []);
    } catch { toast.error('Failed to load tests'); }
    finally { setLoading(false); }
  };

  /* ── styling ── */
  const card = dark ? 'bg-[#1a1a1a] border-[#2e2e2e]' : 'bg-white border-gray-200';
  const hdr  = dark ? 'text-white'    : 'text-gray-900';
  const sub  = dark ? 'text-gray-400' : 'text-gray-500';
  const divd = dark ? 'border-[#2e2e2e]' : 'border-gray-100';
  const inp  = dark ? 'bg-[#252525] border-[#3e3e3e] text-white placeholder-gray-500 focus:border-[#ffa116]'
                    : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-orange-400';

  /* ── derived stats ── */
  const stats = useMemo(() => ({
    total:     tests.length,
    live:      tests.filter(t => getStatus(t) === 'live').length,
    upcoming:  tests.filter(t => getStatus(t) === 'scheduled').length,
    draft:     tests.filter(t => getStatus(t) === 'draft').length,
    ended:     tests.filter(t => getStatus(t) === 'ended').length,
  }), [tests]);

  /* ── date grouping for calendar navigation ── */
  const byDate = useMemo(() => {
    const map = {};
    tests.forEach(t => {
      const d = new Date(t.startTime || t.createdAt);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      (map[key] = map[key] || []).push(t);
    });
    return map;
  }, [tests]);

  /* ── date cards for current month ── */
  const daysInMonth = useMemo(() => {
    const days = [];
    const { y, m } = curMonth;
    const dim = new Date(y, m+1, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const key = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (byDate[key]) days.push({ key, d, tests: byDate[key] });
    }
    return days;
  }, [curMonth, byDate]);

  /* ── selected date tests ── */
  const selectedTests = useMemo(() => {
    const base = viewDate ? (byDate[viewDate] || []) : tests;
    const q = search.trim().toLowerCase();
    return base.filter(t => !q || t.title.toLowerCase().includes(q) || (t.createdByName||'').toLowerCase().includes(q));
  }, [viewDate, byDate, tests, search]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#ffa116] border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${hdr}`}>My Tests</h1>
          <p className={`text-sm mt-0.5 ${sub}`}>All tests you have created</p>
        </div>
        <Link to="/teacher/create-test"
          className="flex items-center gap-2 px-4 py-2 bg-[#ffa116] hover:bg-orange-500 text-white font-semibold rounded-xl text-sm transition-all">
          <Plus className="w-4 h-4"/> New Test
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Total',     val: stats.total,    icon: Layers,       col: 'text-[#ffa116]',   bg: dark?'bg-orange-500/10':'bg-orange-50' },
          { label: 'Live Now',  val: stats.live,     icon: Radio,        col: 'text-emerald-400', bg: dark?'bg-emerald-500/10':'bg-emerald-50' },
          { label: 'Upcoming',  val: stats.upcoming, icon: Calendar,     col: 'text-blue-400',    bg: dark?'bg-blue-500/10':'bg-blue-50' },
          { label: 'Drafts',    val: stats.draft,    icon: FileText,     col: 'text-violet-400',  bg: dark?'bg-violet-500/10':'bg-violet-50' },
          { label: 'Ended',     val: stats.ended,    icon: CheckCircle2, col: 'text-slate-400',   bg: dark?'bg-slate-500/10':'bg-slate-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 flex items-center gap-3 ${card}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.col}`}/>
            </div>
            <div>
              <p className={`text-xl font-extrabold ${hdr}`}>{s.val}</p>
              <p className={`text-xs ${sub}`}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Month navigator + date cards */}
      <div className={`rounded-2xl border p-5 mb-6 ${card}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold ${hdr}`}>Browse by Date</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurMonth(p => { const d = new Date(p.y, p.m-1); return { y: d.getFullYear(), m: d.getMonth() }; })}
              className={`p-1.5 rounded-lg transition-all ${dark?'hover:bg-white/10 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
              <ChevronLeft className="w-4 h-4"/>
            </button>
            <span className={`text-sm font-semibold w-32 text-center ${hdr}`}>
              {MONTH_NAMES[curMonth.m]} {curMonth.y}
            </span>
            <button onClick={() => setCurMonth(p => { const d = new Date(p.y, p.m+1); return { y: d.getFullYear(), m: d.getMonth() }; })}
              className={`p-1.5 rounded-lg transition-all ${dark?'hover:bg-white/10 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}>
              <ChevronRight className="w-4 h-4"/>
            </button>
            {viewDate && (
              <button onClick={() => setViewDate(null)}
                className="flex items-center gap-1 text-xs text-[#ffa116] hover:opacity-80 ml-2">
                <X className="w-3 h-3"/> Clear
              </button>
            )}
          </div>
        </div>

        {daysInMonth.length === 0 ? (
          <p className={`text-sm text-center py-6 ${sub}`}>No tests scheduled in {MONTH_NAMES[curMonth.m]} {curMonth.y}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {daysInMonth.map(({ key, d, tests: dayTests }) => {
              const liveCount = dayTests.filter(t => getStatus(t) === 'live').length;
              const active = viewDate === key;
              return (
                <button key={key} onClick={() => setViewDate(active ? null : key)}
                  className={`flex flex-col items-center rounded-2xl border-2 px-4 py-3 min-w-[72px] transition-all hover:scale-105 ${
                    active
                      ? 'bg-[#ffa116] border-[#ffa116] text-white'
                      : liveCount > 0
                        ? (dark?'border-emerald-500/40 bg-emerald-500/10 text-emerald-400':'border-emerald-300 bg-emerald-50 text-emerald-600')
                        : (dark?`border-[#2e2e2e] bg-[#252525] text-gray-300`:`border-gray-200 bg-gray-50 text-gray-600`)
                  }`}>
                  <span className="text-xs font-medium opacity-70">
                    {new Date(curMonth.y, curMonth.m, d).toLocaleString('en', { weekday: 'short' })}
                  </span>
                  <span className="text-xl font-extrabold leading-tight">{d}</span>
                  <span className={`text-[10px] font-semibold mt-0.5 ${active ? 'text-white/80' : ''}`}>
                    {dayTests.length} test{dayTests.length !== 1 ? 's' : ''}
                  </span>
                  {liveCount > 0 && !active && (
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Tests list */}
      <div className={`rounded-2xl border ${card}`}>
        {/* List header */}
        <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b ${divd}`}>
          <h3 className={`font-bold ${hdr}`}>
            {viewDate
              ? `Tests on ${new Date(viewDate+'T00:00:00').toLocaleDateString('en-IN',{dateStyle:'long'})}`
              : 'All My Tests'}
            <span className={`ml-2 text-sm font-normal ${sub}`}>({selectedTests.length})</span>
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tests…"
              className={`border rounded-xl pl-9 pr-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-orange-400/30 ${inp}`}/>
          </div>
        </div>

        {selectedTests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Trophy className={`w-10 h-10 ${dark?'text-gray-700':'text-gray-300'}`}/>
            <p className={`text-sm ${sub}`}>{search ? 'No tests match your search' : viewDate ? 'No tests on this date' : 'No tests created yet'}</p>
            {!viewDate && !search && (
              <Link to="/teacher/create-test" className="text-[#ffa116] text-sm hover:opacity-80 font-medium">
                Create your first test →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className={`text-[11px] uppercase font-semibold border-b ${divd} ${dark?'bg-[#1f1f1f] text-gray-500':'bg-gray-50 text-gray-400'}`}>
                  <th className="text-left py-3 px-5">Test</th>
                  <th className="text-left py-3 px-4">Schedule</th>
                  <th className="text-center py-3 px-4">Duration</th>
                  <th className="text-center py-3 px-4">Questions</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-center py-3 px-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedTests.map((test, i) => {
                  const status = getStatus(test);
                  const sm = STATUS_META[status] || STATUS_META.draft;
                  const isLast = i === selectedTests.length - 1;
                  return (
                    <tr key={test.id}
                      className={`transition-colors ${isLast ? '' : `border-b ${divd}`} ${dark?'hover:bg-white/[0.03]':'hover:bg-gray-50/70'}`}>
                      <td className="py-3.5 px-5">
                        <p className={`font-semibold text-sm ${hdr}`}>{test.title}</p>
                        <p className={`text-xs mt-0.5 ${sub}`}>{test.totalQuestions || 0} questions · {test.durationMinutes || 0} min</p>
                      </td>
                      <td className={`py-3.5 px-4 text-xs ${sub}`}>
                        <div>{fmt(test.startTime)}</div>
                        {test.endTime && <div className="opacity-60">to {fmt(test.endTime)}</div>}
                      </td>
                      <td className={`py-3.5 px-4 text-sm text-center ${sub}`}>
                        {test.durationMinutes} min
                      </td>
                      <td className={`py-3.5 px-4 text-sm text-center ${sub}`}>
                        {test.totalQuestions || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${sm.cls}`}>
                          {sm.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link to={`/contest/${test.id}`} title="View Details"
                            className={`p-1.5 rounded-lg transition-all ${dark?'text-gray-500 hover:bg-blue-500/10 hover:text-blue-400':'text-gray-400 hover:bg-blue-50 hover:text-blue-500'}`}>
                            <Eye className="w-4 h-4"/>
                          </Link>
                          {status !== 'deleted' && (
                            <Link to={`/teacher/edit-test/${test.id}`} title="Edit"
                              className={`p-1.5 rounded-lg transition-all ${dark?'text-gray-500 hover:bg-amber-500/10 hover:text-amber-400':'text-gray-400 hover:bg-amber-50 hover:text-amber-500'}`}>
                              <Edit3 className="w-4 h-4"/>
                            </Link>
                          )}
                          {(status === 'live' || status === 'ended') && (
                            <Link to={`/contest/${test.id}/live`} title="Live Monitor"
                              className={`p-1.5 rounded-lg transition-all ${dark?'text-gray-500 hover:bg-emerald-500/10 hover:text-emerald-400':'text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'}`}>
                              <BarChart2 className="w-4 h-4"/>
                            </Link>
                          )}
                          {status === 'scheduled' && (
                            <Link to={`/contest/${test.id}`} title="Preview"
                              className={`p-1.5 rounded-lg transition-all ${dark?'text-gray-500 hover:bg-violet-500/10 hover:text-violet-400':'text-gray-400 hover:bg-violet-50 hover:text-violet-500'}`}>
                              <Play className="w-4 h-4"/>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
