import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { testAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import * as XLSX from 'xlsx';
import {
  Search, Calendar, Clock, FileText, BarChart2, Trash2, Pencil,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download,
  Trophy, ClipboardList, CheckCircle2, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

const TEST_ICON_COLORS = [
  'bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600',
  'bg-amber-100 text-amber-600', 'bg-violet-100 text-violet-600',
  'bg-rose-100 text-rose-600',  'bg-cyan-100 text-cyan-600',
];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function TestsContent({ tests, dark, onDelete }) {
  const navigate = useNavigate();

  const c = {
    card:   dark ? 'bg-gray-900 border border-gray-700/60'  : 'bg-white border border-gray-200',
    title:  dark ? 'text-white'   : 'text-gray-900',
    sub:    dark ? 'text-gray-400': 'text-gray-500',
    border: dark ? 'border-gray-700/60' : 'border-gray-200',
    inp:    dark ? 'bg-gray-800 border-gray-700 text-gray-300 placeholder-gray-500 focus:border-orange-500'
                 : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-orange-400',
    sel:    dark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700',
    trH:    dark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50',
    th:     dark ? 'bg-gray-800/60 text-gray-400' : 'bg-gray-50 text-gray-500',
    btn:    dark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                 : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
  };

  const [dateView, setDateView]           = useState(null);
  const [search,   setSearch]             = useState('');
  const [filterMonth, setFilterMonth]     = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [sortBy, setSortBy]               = useState('latest');
  const [page, setPage]                   = useState(1);
  const [dateSearch, setDateSearch]       = useState('');
  const PAGE_SIZE = 8;

  const getStatus = (t) => {
    if (t.deleted) return 'deleted';
    const pub = t.published ?? t.isPublished;
    if (!pub) return 'draft';
    if (!t.startTime) return 'draft';
    const now = new Date();
    const st  = new Date(t.startTime);
    const en  = t.endTime ? new Date(t.endTime) : new Date(st.getTime() + (t.durationMinutes || 60) * 60000);
    if (now < st)  return 'scheduled';
    if (now <= en) return 'live';
    return 'ended';
  };

  const statusCfg = {
    ended:     { label: 'Ended',          cls: dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    live:      { label: 'Live',           cls: dark ? 'bg-blue-500/15 text-blue-400'       : 'bg-blue-50 text-blue-700 border border-blue-200' },
    scheduled: { label: 'Scheduled',      cls: dark ? 'bg-amber-500/15 text-amber-400'     : 'bg-amber-50 text-amber-700 border border-amber-200' },
    draft:     { label: 'Draft',          cls: dark ? 'bg-gray-500/15 text-gray-400'       : 'bg-gray-100 text-gray-500 border border-gray-200' },
    deleted:   { label: 'Deleted',        cls: dark ? 'bg-red-500/15 text-red-400'         : 'bg-red-50 text-red-600 border border-red-200' },
  };

  const today     = new Date().toDateString();
  const totalCt   = tests.length;
  const todayCt   = tests.filter(t => t.startTime && new Date(t.startTime).toDateString() === today).length;
  const schedCt   = tests.filter(t => getStatus(t) === 'scheduled').length;
  const endedCt   = tests.filter(t => getStatus(t) === 'ended').length;
  const liveCt    = tests.filter(t => getStatus(t) === 'live').length;

  const teachers = [...new Set(tests.map(t => t.createdByName).filter(Boolean))].sort();
  const sections  = [...new Set(tests.flatMap(t => t.sectionNames || []).filter(Boolean))].sort();
  const months    = [...new Set(tests.filter(t => t.startTime).map(t => {
    const d = new Date(t.startTime);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }))].sort().reverse();

  const filtered = tests.filter(t => {
    const q = search.trim().toLowerCase();
    if (q && ![t.title, t.createdByName].some(v => (v||'').toLowerCase().includes(q))) return false;
    if (filterMonth && t.startTime) {
      const d = new Date(t.startTime);
      if (`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` !== filterMonth) return false;
    } else if (filterMonth && !t.startTime) return false;
    if (filterTeacher && t.createdByName !== filterTeacher) return false;
    if (filterSection && !(t.sectionNames || []).includes(filterSection)) return false;
    if (filterStatus && getStatus(t) !== filterStatus) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'latest') return new Date(b.startTime||0) - new Date(a.startTime||0);
    if (sortBy === 'oldest') return new Date(a.startTime||0) - new Date(b.startTime||0);
    if (sortBy === 'title')  return (a.title||'').localeCompare(b.title||'');
    return 0;
  });

  const byDate = {};
  sorted.forEach(t => {
    const k = t.startTime ? new Date(t.startTime).toDateString() : '_no_date';
    if (!byDate[k]) byDate[k] = { tests: [], date: t.startTime ? new Date(t.startTime) : null };
    byDate[k].tests.push(t);
  });
  const dateGroups = Object.entries(byDate).sort((a, b) => {
    if (!a[1].date) return 1; if (!b[1].date) return -1;
    return b[1].date - a[1].date;
  });

  const detailTests = dateView
    ? (byDate[dateView]?.tests || []).filter(t => !dateSearch || (t.title||'').toLowerCase().includes(dateSearch.toLowerCase()))
    : [];
  const totalPages = Math.max(1, Math.ceil(detailTests.length / PAGE_SIZE));
  const pagedTests = detailTests.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const handleExport = () => {
    try {
      const rows = detailTests.map(t => ({
        'Test Name':       t.title,
        'Created By':      t.createdByName || '—',
        'Target Sections': t.restrictToSections ? (t.sectionNames||[]).join(', ') : 'All Students',
        'Scheduled Time':  t.startTime ? new Date(t.startTime).toLocaleString() : '—',
        'Duration (min)':  t.durationMinutes || '—',
        'Status':          statusCfg[getStatus(t)]?.label || '—',
        'Questions':       t.totalQuestions || 0,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Tests');
      XLSX.writeFile(wb, `Tests_${dateView || 'all'}.xlsx`);
    } catch { /* ignore */ }
  };

  const fmtTime     = (iso) => !iso ? '—' : new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fmtDate     = (d)   => !d   ? '—' : d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmtDateLong = (d)   => !d   ? ''  : d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const initials    = (name) => { if (!name) return '?'; const p = name.trim().split(' '); return ((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase(); };
  const iconColor   = (id)   => TEST_ICON_COLORS[(Number(id)||0) % TEST_ICON_COLORS.length];
  const openDate    = (key)  => { setDateView(key); setPage(1); setDateSearch(''); };

  /* ════════════════════════════════════════════
     DETAIL VIEW — tests for a specific date
  ════════════════════════════════════════════ */
  if (dateView) {
    const grp    = byDate[dateView];
    const dateObj = grp?.date;
    return (
      <div>
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => setDateView(null)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-all ${c.btn}`}>
            <ChevronLeft className="w-4 h-4"/> Back to All Dates
          </button>
        </div>

        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div>
            <h2 className={`text-xl font-bold flex items-center gap-2.5 ${c.title}`}>
              Tests on {fmtDate(dateObj)}
              <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${dark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
                {detailTests.length} {detailTests.length === 1 ? 'Test' : 'Tests'}
              </span>
            </h2>
            {dateObj && (
              <p className={`text-sm mt-0.5 flex items-center gap-1.5 ${c.sub}`}>
                <Calendar className="w-3.5 h-3.5"/> {fmtDateLong(dateObj)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}/>
              <input value={dateSearch} onChange={e => { setDateSearch(e.target.value); setPage(1); }}
                placeholder="Search tests…"
                className={`border rounded-xl pl-8 pr-3 py-2 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-orange-400/40 ${c.inp}`}/>
            </div>
            <button onClick={handleExport}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border transition-all ${c.btn}`}>
              <Download className="w-4 h-4"/> Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-2xl overflow-hidden ${c.card}`}>
          {pagedTests.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className={`w-10 h-10 mx-auto mb-3 ${dark ? 'text-gray-700' : 'text-gray-300'}`}/>
              <p className={`text-sm ${c.sub}`}>{dateSearch ? 'No tests match' : 'No tests on this date'}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${c.border} ${c.th}`}>
                  {['Test Name', 'Created By', 'Section / Target', 'Scheduled Time', 'Duration', 'Status', 'Actions'].map(h => (
                    <th key={h} className={`py-3 px-4 text-xs font-semibold uppercase tracking-wide text-left ${h === 'Actions' ? 'text-center' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedTests.map((t, i) => {
                  const sc  = statusCfg[getStatus(t)] || statusCfg.draft;
                  const ic  = iconColor(t.id);
                  const ini = initials(t.createdByName);
                  return (
                    <tr key={t.id} className={`border-b transition-colors ${c.border} ${c.trH} ${i === pagedTests.length-1 ? 'border-0' : ''}`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ic}`}>
                            <FileText className="w-4 h-4"/>
                          </div>
                          <div>
                            <p className={`font-semibold ${c.title}`}>{t.title}</p>
                            <p className={`text-xs ${c.sub}`}>{t.totalQuestions || 0} Questions</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {ini}
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${c.title}`}>{t.createdByName || '—'}</p>
                            <p className={`text-xs ${c.sub}`}>Teacher</p>
                          </div>
                        </div>
                      </td>
                      <td className={`py-3.5 px-4 text-sm ${c.sub}`}>
                        {t.restrictToSections && t.sectionNames?.length
                          ? t.sectionNames.join(', ')
                          : 'All Students'}
                      </td>
                      <td className={`py-3.5 px-4 text-sm ${c.sub}`}>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0"/>
                          {fmtTime(t.startTime)}
                        </div>
                      </td>
                      <td className={`py-3.5 px-4 text-sm ${c.sub}`}>{t.durationMinutes || '—'} min</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${sc.cls}`}>{sc.label}</span>
                        {t.deleted && t.deletedReason && (
                          <p className="text-[10px] text-red-500 mt-0.5 max-w-[120px] truncate" title={`Reason: ${t.deletedReason}`}>
                            Reason: {t.deletedReason}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link to={`/contest/${t.id}`}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${dark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            View
                          </Link>
                          {!t.deleted && (
                            <Link to={`/teacher/edit-test/${t.id}`}
                              className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${dark ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border-amber-200 text-amber-600 hover:bg-amber-50'}`}>
                              <Pencil className="w-3 h-3"/> Edit
                            </Link>
                          )}
                          {!t.deleted && (
                            <Link to={`/contest/${t.id}/live`}
                              className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${dark ? 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>
                              <BarChart2 className="w-3 h-3"/> Analytics
                            </Link>
                          )}
                          {!t.deleted && (
                            <button onClick={() => onDelete(t)}
                              className={`p-1.5 rounded-lg border transition-all ${dark ? 'border-red-500/20 text-red-400 hover:bg-red-500/10' : 'border-red-200 text-red-500 hover:bg-red-50'}`}>
                              <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {detailTests.length > 0 && (
          <div className={`flex items-center justify-between mt-3 text-sm ${c.sub}`}>
            <span>Showing {Math.min((page-1)*PAGE_SIZE+1, detailTests.length)} to {Math.min(page*PAGE_SIZE, detailTests.length)} of {detailTests.length} tests</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className={`p-1.5 rounded-lg border disabled:opacity-30 ${c.btn}`}><ChevronsLeft className="w-4 h-4"/></button>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className={`p-1.5 rounded-lg border disabled:opacity-30 ${c.btn}`}><ChevronLeft className="w-4 h-4"/></button>
              {Array.from({ length: totalPages }, (_, i) => i+1)
                .filter(p => Math.abs(p-page) <= 1 || p === 1 || p === totalPages)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx-1] !== p-1 && <span className={`px-1 ${c.sub}`}>…</span>}
                    <button onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg border text-xs font-medium transition-all ${p === page ? 'bg-orange-500 border-orange-500 text-white' : c.btn}`}>
                      {p}
                    </button>
                  </span>
                ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className={`p-1.5 rounded-lg border disabled:opacity-30 ${c.btn}`}><ChevronRight className="w-4 h-4"/></button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className={`p-1.5 rounded-lg border disabled:opacity-30 ${c.btn}`}><ChevronsRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════
     BROWSE VIEW — stats + filters + date cards
  ════════════════════════════════════════════ */
  return (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Total Tests',    value: totalCt,  sub: 'All time',           icon: <ClipboardList className="w-5 h-5"/>, bg: 'bg-orange-100',  cl: 'text-orange-500' },
          { label: "Today's Tests",  value: todayCt,  sub: new Date().toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'}), icon: <Calendar className="w-5 h-5"/>, bg: 'bg-emerald-100', cl: 'text-emerald-500' },
          { label: 'Scheduled',      value: schedCt,  sub: 'Upcoming tests',     icon: <Clock className="w-5 h-5"/>,        bg: 'bg-amber-100',   cl: 'text-amber-500'  },
          { label: 'Completed',      value: endedCt,  sub: 'Ended tests',        icon: <CheckCircle2 className="w-5 h-5"/>, bg: 'bg-blue-100',    cl: 'text-blue-500'   },
          { label: 'Live Now',       value: liveCt,   sub: 'Currently running',  icon: <Activity className="w-5 h-5"/>,     bg: 'bg-violet-100',  cl: 'text-violet-500' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 flex items-center gap-3 ${c.card}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <span className={s.cl}>{s.icon}</span>
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-medium truncate ${c.sub}`}>{s.label}</p>
              <p className={`text-2xl font-bold leading-tight ${c.title}`}>{s.value}</p>
              <p className={`text-[11px] truncate ${c.sub}`}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Row */}
      <div className={`rounded-2xl p-3 mb-5 flex flex-wrap items-center gap-2 ${c.card}`}>
        <div className="relative flex-1 min-w-[180px]">
          <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tests by name or teacher…"
            className={`w-full border rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 ${c.inp}`}/>
        </div>
        {[
          { val: filterMonth,   set: setFilterMonth,   opts: [{ v:'', l:'All Months'   }, ...months.map(m => { const [y,mo] = m.split('-'); return { v:m, l:`${MONTH_NAMES[parseInt(mo)-1]} ${y}` }; })] },
          { val: filterTeacher, set: setFilterTeacher, opts: [{ v:'', l:'All Teachers' }, ...teachers.map(t => ({ v:t, l:t }))] },
          { val: filterSection, set: setFilterSection, opts: [{ v:'', l:'All Sections' }, ...sections.map(s => ({ v:s, l:s }))] },
          { val: filterStatus,  set: setFilterStatus,  opts: [{ v:'', l:'All Status'   }, { v:'scheduled', l:'Scheduled' }, { v:'live', l:'Live' }, { v:'ended', l:'Ended' }, { v:'draft', l:'Draft' }] },
          { val: sortBy,        set: setSortBy,        opts: [{ v:'latest', l:'Latest First' }, { v:'oldest', l:'Oldest First' }, { v:'title', l:'By Title' }] },
        ].map((f, i) => (
          <select key={i} value={f.val} onChange={e => f.set(e.target.value)}
            className={`border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 ${c.sel}`}>
            {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        ))}
      </div>

      {/* Browse by Date */}
      <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${c.sub}`}>Browse by Date</h3>
      {dateGroups.length === 0 ? (
        <div className={`rounded-2xl p-12 text-center ${c.card}`}>
          <Trophy className={`w-10 h-10 mx-auto mb-3 ${dark ? 'text-gray-700' : 'text-gray-300'}`}/>
          <p className={`text-sm ${c.sub}`}>{search||filterMonth||filterTeacher||filterSection||filterStatus ? 'No tests match your filters' : 'No tests yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dateGroups.map(([key, grp]) => {
            const d = grp.date;
            const dayName  = d ? d.toLocaleDateString('en-US', { weekday: 'short' }) : '';
            const dateDisp = d ? `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` : 'No Date';
            const uniqTeach = [...new Set(grp.tests.map(t => t.createdByName).filter(Boolean))];
            return (
              <div key={key}
                className={`rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all hover:shadow-md border-2 ${dark ? 'bg-gray-900' : 'bg-white'} ${dark ? 'border-gray-700/60' : 'border-gray-200'} hover:border-orange-400`}
                onClick={() => openDate(key)}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className={`w-4 h-4 ${dark ? 'text-orange-400' : 'text-orange-500'}`}/>
                      <span className={`text-sm font-bold ${c.title}`}>{dateDisp}</span>
                    </div>
                    {dayName && <p className={`text-xs ${c.sub}`}>{dayName}</p>}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${dark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                    {grp.tests.length} {grp.tests.length === 1 ? 'Test' : 'Tests'}
                  </span>
                </div>
                <div className={`text-xs ${c.sub}`}>
                  <span className="font-medium">Teachers: </span>
                  {uniqTeach.length > 0
                    ? uniqTeach.slice(0,2).join(', ') + (uniqTeach.length > 2 ? ` +${uniqTeach.length-2}` : '')
                    : '—'}
                </div>
                <div className="flex flex-wrap gap-1 mt-auto">
                  {grp.tests.slice(0,3).map(t => {
                    const sc = statusCfg[getStatus(t)] || statusCfg.draft;
                    return <span key={t.id} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span>;
                  })}
                  {grp.tests.length > 3 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>+{grp.tests.length-3} more</span>
                  )}
                </div>
                <button onClick={e => { e.stopPropagation(); openDate(key); }}
                  className={`w-full flex items-center justify-center gap-1.5 text-sm font-semibold py-2 rounded-xl transition-all ${dark ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                  View Tests <ChevronRight className="w-4 h-4"/>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Delete confirmation modal ─────────────────────────────────── */
function DeleteModal({ test, dark, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const c = {
    bg:    dark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200',
    title: dark ? 'text-white' : 'text-gray-900',
    sub:   dark ? 'text-gray-400' : 'text-gray-500',
    inp:   dark ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-red-500'
                : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400 focus:border-red-400',
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    await onConfirm(test, reason.trim());
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
         onClick={onCancel}>
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 ${c.bg}`}
           onClick={e => e.stopPropagation()}>
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-500"/>
        </div>

        <h3 className={`text-lg font-bold text-center mb-1 ${c.title}`}>Delete Test</h3>
        <p className={`text-sm text-center mb-5 ${c.sub}`}>
          You are about to delete <span className="font-semibold">&ldquo;{test?.title}&rdquo;</span>.
          The teacher will be notified with your reason.
        </p>

        {/* Reason input — mandatory */}
        <div className="mb-5">
          <label className={`block text-sm font-semibold mb-1.5 ${c.title}`}>
            Reason for deletion <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Test contained incorrect questions, policy violation…"
            className={`w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400/40 ${c.inp}`}
          />
          {reason.trim() === '' && (
            <p className="text-xs text-red-500 mt-1">Reason is required before deleting.</p>
          )}
        </div>

        {/* Warning */}
        <div className={`rounded-xl p-3 mb-5 text-xs flex items-start gap-2 ${dark ? 'bg-red-500/10 text-red-300' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <span className="text-lg leading-none">⚠️</span>
          <span>The teacher will receive a notification with the test name and your reason. This action cannot be undone.</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={onCancel}
            className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${dark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim() || submitting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Deleting…</> : <><Trash2 className="w-4 h-4"/> Delete Test</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTests() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const navigate = useNavigate();

  const [tests,       setTests]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [deleteTarget,setDeleteTarget]= useState(null); // test object to delete

  useEffect(() => { loadTests(); }, []);

  const loadTests = async () => {
    try {
      const res = await testAPI.getAll();
      setTests(res.data || []);
    } catch { toast.error('Failed to load tests'); }
    finally { setLoading(false); }
  };

  const handleDelete = (t) => setDeleteTarget(t);

  const confirmDelete = async (t, reason) => {
    try {
      await testAPI.delete(t.id, reason);
      toast.success(`"${t.title}" deleted. Teacher notified.`);
      // Update list: mark as deleted (soft-delete) rather than removing
      setTests(prev => prev.map(x => x.id === t.id
        ? { ...x, deleted: true, deletedReason: reason }
        : x));
      setDeleteTarget(null);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to delete'); }
  };

  const pg   = dark ? 'bg-gray-950' : 'bg-slate-50';
  const titleC = dark ? 'text-white' : 'text-gray-900';
  const subC   = dark ? 'text-gray-500' : 'text-gray-400';

  return (
    <AdminLayout section="tests" onSectionChange={sec => navigate('/admin', { state: { section: sec } })}>
      <div className={`min-h-full p-6 ${pg}`}>
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-xl font-bold ${titleC}`}>Test Management</h2>
            <p className={`text-sm mt-0.5 ${subC}`}>All tests created on the platform</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : (
          <TestsContent tests={tests} dark={dark} onDelete={handleDelete}/>
        )}
      </div>
      {deleteTarget && (
        <DeleteModal
          test={deleteTarget}
          dark={dark}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminLayout>
  );
}
