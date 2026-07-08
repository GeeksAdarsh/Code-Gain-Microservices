import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { testAPI } from '../services/api';
import {
  Trophy, Clock, Calendar, ArrowRight, CheckCircle2,
  ChevronLeft, ChevronRight, Search, X, Radio, Play,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

function pad2(n) { return String(n).padStart(2, '0'); }
function toYMD(d) { return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }

function getStatus(test) {
  const now = new Date();
  const st  = test.startTime ? new Date(test.startTime) : null;
  const et  = test.endTime   ? new Date(test.endTime)   : null;
  if (test.deleted)                      return 'deleted';
  if (st && et && now >= st && now <= et) return 'live';
  if (st && st > now)                    return 'upcoming';
  if (et && now > et)                    return 'ended';
  return 'draft';
}

function StatusBadge({ status, small = false }) {
  const cfg = {
    live:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    upcoming: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    ended:    'bg-slate-500/15 text-slate-400 border-slate-500/25',
    draft:    'bg-amber-500/15 text-amber-400 border-amber-500/25',
    deleted:  'bg-red-500/15 text-red-400 border-red-500/25',
    completed:'bg-teal-500/15 text-teal-400 border-teal-500/25',
  };
  const labels = { live:'Live', upcoming:'Upcoming', ended:'Ended', draft:'Draft', deleted:'Deleted', completed:'Completed' };
  const sz = small ? 'text-[10px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';
  return (
    <span className={`${sz} font-bold rounded-full border flex-shrink-0 ${cfg[status] || cfg.ended}`}>
      {labels[status] || status}
    </span>
  );
}

export default function Contests() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate  = useNavigate();
  const dark = theme === 'dark';

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'COMPANY';

  const [allTests,        setAllTests]        = useState([]);
  const [completedTests,  setCompletedTests]  = useState([]);
  const [completedTestIds,setCompletedTestIds]= useState(new Set());
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [viewDate,        setViewDate]        = useState(null);
  const [curMonth,        setCurMonth]        = useState(() => {
    const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() };
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [allRes, completedRes] = await Promise.all([
        testAPI.getAll(),
        testAPI.getCompleted().catch(() => ({ data: [] })),
      ]);
      setAllTests(allRes.data || []);
      const completed = completedRes.data || [];
      setCompletedTests(completed);
      setCompletedTestIds(new Set(completed.map(t => t.testId)));
    } catch {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  /* ── stats ─────────────────────────────────────────────── */
  const stats = useMemo(() => {
    let live=0, upcoming=0, completed=0, ended=0;
    allTests.forEach(t => {
      const s = getStatus(t);
      if (s === 'live') live++;
      else if (s === 'upcoming') upcoming++;
      else if (s === 'ended') ended++;
      if (completedTestIds.has(t.id)) completed++;
    });
    return { total: allTests.length, live, upcoming, completed, ended };
  }, [allTests, completedTestIds]);

  /* ── date grouping ──────────────────────────────────────── */
  const testsByDate = useMemo(() => {
    const map = {};
    allTests.forEach(t => {
      const d = t.startTime || t.createdAt;
      if (!d) return;
      const key = toYMD(new Date(d));
      (map[key] = map[key] || []).push(t);
    });
    return map;
  }, [allTests]);

  /* ── calendar days for current month ───────────────────── */
  const calDays = useMemo(() => {
    const days = [];
    const daysInMonth = new Date(curMonth.y, curMonth.m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${curMonth.y}-${pad2(curMonth.m+1)}-${pad2(d)}`;
      days.push({ d, key, count: testsByDate[key]?.length || 0 });
    }
    return days;
  }, [curMonth, testsByDate]);

  /* ── filtered tests for selected date ──────────────────── */
  const filteredTests = useMemo(() => {
    let list = viewDate ? (testsByDate[viewDate] || []) : allTests;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title?.toLowerCase().includes(q) || t.createdByName?.toLowerCase().includes(q));
    }
    return list;
  }, [viewDate, testsByDate, allTests, search]);

  /* ── live & upcoming (for top section) ─────────────────── */
  const liveTests     = allTests.filter(t => getStatus(t) === 'live');
  const upcomingTests = allTests.filter(t => getStatus(t) === 'upcoming');

  /* ── theme tokens ───────────────────────────────────────── */
  const bg   = dark ? 'bg-[#1a1a2e]'   : 'bg-white';
  const card = dark ? 'bg-[#16213e] border-slate-700/50' : 'bg-white border-gray-200';
  const title = dark ? 'text-white'    : 'text-gray-900';
  const sub   = dark ? 'text-slate-400': 'text-gray-500';
  const inp   = dark ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-indigo-500'
                     : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-400';
  const calCard = (active, hasTests) =>
    active   ? 'bg-indigo-500 text-white shadow-lg scale-105' :
    hasTests ? (dark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200') :
               (dark ? 'bg-slate-800 text-slate-500 hover:bg-slate-700' : 'bg-gray-50 text-gray-400 hover:bg-gray-100');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* ── Page header ── */}
      <div>
        <h1 className={`text-3xl font-bold mb-1 ${title}`}>
          <span className="gradient-text">Contests & Tests</span>
        </h1>
        <p className={`text-sm ${sub}`}>Participate in coding tests and compete with peers</p>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label:'Total Tests', value: stats.total,     color:'text-indigo-400' },
          { label:'Live Now',    value: stats.live,      color:'text-emerald-400' },
          { label:'Upcoming',    value: stats.upcoming,  color:'text-blue-400' },
          { label:'Completed',   value: stats.completed, color:'text-teal-400' },
          { label:'Ended',       value: stats.ended,     color:'text-slate-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${card}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className={`text-xs mt-0.5 ${sub}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Live Now strip ── */}
      {liveTests.length > 0 && (
        <div>
          <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${title}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"/>
            Live Now
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {liveTests.map(test => {
              const isDone = completedTestIds.has(test.id);
              return (
                <div key={test.id} className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all cursor-pointer hover:shadow-lg ${card} border-emerald-500/30`}
                  onClick={() => navigate(isDone ? `/contest/${test.id}` : `/test/${test.id}`)}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-semibold text-sm leading-snug flex-1 ${title}`}>{test.title}</p>
                    <StatusBadge status={isDone ? 'completed' : 'live'} />
                  </div>
                  <div className={`flex flex-wrap gap-3 text-xs ${sub}`}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{test.durationMinutes} min</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3"/>{test.totalQuestions} Qs</span>
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    {isDone ? (
                      <Link to={`/contest/${test.id}`}
                        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-colors">
                        <CheckCircle2 className="w-3.5 h-3.5"/> View Results
                      </Link>
                    ) : (
                      <Link to={`/test/${test.id}`}
                        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                        <Play className="w-3.5 h-3.5"/> Enter Now
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Upcoming strip ── */}
      {upcomingTests.length > 0 && (
        <div>
          <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${title}`}>
            <Calendar className="w-4 h-4 text-blue-400"/> Upcoming
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {upcomingTests.map(test => (
              <Link key={test.id} to={`/contest/${test.id}`}
                className={`rounded-2xl border p-5 flex flex-col gap-2 transition-all hover:shadow-md ${card} border-blue-500/20 hover:border-blue-500/40`}>
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-semibold text-sm flex-1 ${title}`}>{test.title}</p>
                  <StatusBadge status="upcoming" />
                </div>
                <div className={`flex flex-wrap gap-3 text-xs ${sub}`}>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{fmt(test.startTime)}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{test.durationMinutes} min</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── All Tests — date-wise ── */}
      <div>
        <h2 className={`text-xl font-bold mb-4 ${title}`}>All Tests</h2>

        {/* Month navigator */}
        <div className={`rounded-2xl border p-4 mb-4 ${card}`}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurMonth(p => {
              const d = new Date(p.y, p.m - 1); return { y: d.getFullYear(), m: d.getMonth() };
            })} className={`p-1.5 rounded-lg transition-colors ${dark?'hover:bg-slate-700 text-slate-400':'hover:bg-gray-100 text-gray-500'}`}>
              <ChevronLeft className="w-4 h-4"/>
            </button>
            <span className={`text-sm font-bold ${title}`}>{MONTH_NAMES[curMonth.m]} {curMonth.y}</span>
            <button onClick={() => setCurMonth(p => {
              const d = new Date(p.y, p.m + 1); return { y: d.getFullYear(), m: d.getMonth() };
            })} className={`p-1.5 rounded-lg transition-colors ${dark?'hover:bg-slate-700 text-slate-400':'hover:bg-gray-100 text-gray-500'}`}>
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {calDays.map(({ d, key, count }) => (
              <button key={key} onClick={() => setViewDate(v => v === key ? null : key)}
                className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center relative ${calCard(viewDate === key, count > 0)}`}>
                <span>{d}</span>
                {count > 0 && (
                  <span className={`absolute -top-1 -right-1 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${viewDate===key?'bg-white text-indigo-600':'bg-indigo-500 text-white'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>
          {viewDate && (
            <button onClick={() => setViewDate(null)}
              className={`mt-3 flex items-center gap-1 text-xs ${dark?'text-slate-400 hover:text-white':'text-gray-500 hover:text-gray-800'} transition-colors`}>
              <X className="w-3.5 h-3.5"/> Show all tests
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark?'text-slate-500':'text-gray-400'}`}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tests…"
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-colors ${inp}`}/>
          {search && (
            <button onClick={() => setSearch('')} className={`absolute right-3 top-1/2 -translate-y-1/2 ${dark?'text-slate-500 hover:text-white':'text-gray-400 hover:text-gray-700'}`}>
              <X className="w-4 h-4"/>
            </button>
          )}
        </div>

        {/* Label for selected date */}
        {viewDate && (
          <p className={`text-sm font-semibold mb-3 ${sub}`}>
            Tests on {new Date(viewDate + 'T00:00:00').toLocaleDateString('en-IN', { dateStyle:'long' })}
            {' '}— {filteredTests.length} found
          </p>
        )}

        {/* Test cards grid */}
        {filteredTests.length === 0 ? (
          <div className={`rounded-2xl border p-12 text-center ${card}`}>
            <Radio className={`w-10 h-10 mx-auto mb-3 ${dark?'text-slate-600':'text-gray-300'}`}/>
            <p className={`font-medium ${sub}`}>{viewDate ? 'No tests on this date' : 'No tests available'}</p>
            <p className={`text-xs mt-1 ${dark?'text-slate-600':'text-gray-400'}`}>
              {viewDate ? 'Select another date or clear the filter.' : 'Tests will appear here when teachers create them.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTests.map(test => {
              const isCompleted = completedTestIds.has(test.id);
              const isDeleted   = test.deleted === true;
              const status      = isCompleted ? 'completed' : getStatus(test);
              const ct          = completedTests.find(c => c.testId === test.id);

              return (
                <div key={test.id}
                  className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all ${
                    isDeleted ? 'opacity-55' : 'hover:shadow-md cursor-pointer'
                  } ${card}`}
                  onClick={() => {
                    if (isDeleted) return;
                    navigate(isCompleted || isTeacher ? `/contest/${test.id}` : `/test/${test.id}`);
                  }}>

                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm leading-snug ${isDeleted ? 'line-through text-gray-400' : title}`}>
                        {test.title}
                      </p>
                      <p className={`text-xs mt-0.5 ${sub}`}>{test.createdByName || '—'}</p>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  {/* Deleted reason */}
                  {isDeleted && test.deletedReason && (
                    <p className="text-xs text-red-400/80">Reason: {test.deletedReason}</p>
                  )}

                  {/* Meta */}
                  <div className={`flex flex-wrap gap-3 text-xs ${sub}`}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{test.durationMinutes} min</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3"/>{test.totalQuestions} Qs</span>
                    {test.startTime && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{fmt(test.startTime)}</span>
                    )}
                  </div>

                  {/* Score bar for completed tests */}
                  {isCompleted && ct && (() => {
                    const pct = ct.percentage ?? ct.totalScore ?? 0;
                    return (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={sub}>Your Score</span>
                          <span className={`font-bold ${pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</span>
                        </div>
                        <div className={`w-full rounded-full h-1.5 ${dark?'bg-slate-700':'bg-gray-100'}`}>
                          <div className={`h-1.5 rounded-full transition-all ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${pct}%` }}/>
                        </div>
                        <p className={`text-xs mt-1 ${sub}`}>{ct.questionsAccepted}/{ct.totalQuestions} solved</p>
                      </div>
                    );
                  })()}

                  {/* CTA button */}
                  {!isDeleted && (
                    <div className="mt-auto pt-1" onClick={e => e.stopPropagation()}>
                      {isTeacher ? (
                        <Link to={`/contest/${test.id}`}
                          className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold border transition-colors ${dark?'border-slate-600 text-slate-300 hover:text-white hover:border-slate-500':'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'}`}>
                          View Details
                        </Link>
                      ) : isCompleted ? (
                        <Link to={`/contest/${test.id}`}
                          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-colors">
                          <CheckCircle2 className="w-3.5 h-3.5"/> View Results
                        </Link>
                      ) : status === 'live' ? (
                        <Link to={`/test/${test.id}`}
                          className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                          <ArrowRight className="w-3.5 h-3.5"/> Enter Now
                        </Link>
                      ) : status === 'upcoming' ? (
                        <div className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold border ${dark?'bg-blue-500/10 text-blue-400 border-blue-500/20':'bg-blue-50 text-blue-600 border-blue-200'}`}>
                          <Calendar className="w-3.5 h-3.5"/> {fmt(test.startTime)}
                        </div>
                      ) : (
                        <div className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold border ${dark?'bg-slate-700/40 text-slate-500 border-slate-700':'bg-gray-100 text-gray-400 border-gray-200'}`}>
                          Ended
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Completed Tests table (kept for reference) ── */}
      {completedTests.length > 0 && (
        <div>
          <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${title}`}>
            <CheckCircle2 className="w-5 h-5 text-teal-400"/> My Completed Tests
          </h2>
          <div className={`rounded-2xl border overflow-hidden ${card}`}>
            <table className="w-full">
              <thead>
                <tr className={`border-b ${dark?'border-slate-700':'border-gray-100'}`}>
                  {['Test','Score','Solved','Completed',''].map(h => (
                    <th key={h} className={`text-left py-3 px-5 text-xs font-semibold ${sub}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedTests.map(ct => {
                  const pct = ct.percentage ?? ct.totalScore ?? 0;
                  return (
                    <tr key={ct.testId} className={`border-b last:border-0 transition-colors ${dark?'border-slate-800 hover:bg-slate-800/50':'border-gray-50 hover:bg-gray-50'}`}>
                      <td className="py-3 px-5">
                        <p className={`font-medium text-sm ${title}`}>{ct.title}</p>
                        <p className={`text-xs ${sub}`}>{ct.createdByName || '—'}</p>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`text-sm font-bold ${pct >= 70 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          {pct}%
                          {ct.totalMaxMarks ? <span className={`text-xs font-normal ml-1 ${sub}`}>({ct.totalScore}/{ct.totalMaxMarks})</span> : null}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`text-sm ${dark?'text-slate-300':'text-gray-700'}`}>{ct.questionsAccepted}/{ct.totalQuestions}</span>
                        <div className={`w-20 rounded-full h-1.5 mt-1 ${dark?'bg-slate-700':'bg-gray-200'}`}>
                          <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${ct.totalQuestions > 0 ? (ct.questionsAccepted/ct.totalQuestions)*100 : 0}%` }}/>
                        </div>
                      </td>
                      <td className={`py-3 px-5 text-xs ${sub}`}>{fmt(ct.completedAt)}</td>
                      <td className="py-3 px-5">
                        <Link to={`/contest/${ct.testId}`} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">View →</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
