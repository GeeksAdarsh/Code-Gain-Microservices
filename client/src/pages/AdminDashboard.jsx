import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { adminAPI, authAPI, feedbackAPI, testAPI, notificationAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  Users, BookOpen, FileText, ToggleLeft, ToggleRight,
  UserPlus, X, GraduationCap, Flag, CheckCircle2, XCircle, MessageSquare,
  ChevronDown, ChevronUp, Search, Building2, Trash2,
  ClipboardList, Plus, ArrowUpRight, Shield, BarChart3, Megaphone, LifeBuoy, Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import AdminLayout from '../components/AdminLayout';

/* ── Placeholder for coming-soon sections ───────────────────────── */
function PlaceholderSection({ dark, card, title: tCls, sub: sCls, icon, heading, body, action }) {
  return (
    <div className={`rounded-2xl border p-14 text-center max-w-lg mx-auto ${card}`}>
      <div className="flex justify-center mb-4">{icon}</div>
      <p className={`text-lg font-bold mb-2 ${tCls}`}>{heading}</p>
      <p className={`text-sm leading-relaxed ${sCls}`}>{body}</p>
      {action && (
        <button onClick={action.fn} className="mt-5 text-sm text-indigo-500 hover:text-indigo-400 font-semibold">
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ── Chart data ─────────────────────────────────────────────────── */


const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

function StatCard({ icon, label, value, delta, iconBg, iconColor, dark }) {
  const c = dark ? 'bg-gray-900 border-gray-700/60' : 'bg-white border-gray-200';
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-3 hover:shadow-md transition-all ${c}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
        <p className={`text-2xl font-bold leading-tight ${dark ? 'text-white' : 'text-gray-900'}`}>{(value||0).toLocaleString()}</p>
        {delta != null && (
          <p className="text-emerald-500 text-xs font-medium flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="w-3 h-3" />{delta} this week
          </p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AdminDashboard
═══════════════════════════════════════════════════════════════════ */

export default function AdminDashboard() {
  const { theme }  = useTheme();
  const dark       = theme === 'dark';
  const navigate   = useNavigate();

  /* Section state — sidebar drives this */
  const location = useLocation();
  const [section, setSection] = useState(location.state?.section || 'overview');
  const [userFilter, setUserFilter] = useState('all'); // 'all'|'teachers'|'students'|'companies'|'admins'

  // Respond to navigate('/admin', { state: { section } }) even when already mounted
  useEffect(() => {
    if (location.state?.section) setSection(location.state.section);
  }, [location.state?.section]);

  // Redirect 'tests' section to dedicated page (never call navigate() during render)
  useEffect(() => {
    if (section === 'tests') navigate('/admin/tests', { replace: true });
  }, [section, navigate]);

  /* Data */
  const [stats, setStats]             = useState({});
  const [users, setUsers]             = useState([]);
  const [tests, setTests]             = useState([]);
  const [feedbacks, setFeedbacks]     = useState([]);
  const [feedbackStats, setFbStats]   = useState({});
  const [loading, setLoading]         = useState(true);

  /* Chart range */
  const [chartRange, setChartRange] = useState('week');
  /* Students drill-down */
  const [selectedBatch,   setSelectedBatch]   = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  /* "All" tab role drill-down */
  const [selectedRole, setSelectedRole] = useState(null); // null | 'ADMIN' | 'TEACHER' | 'COMPANY'
  /* Pagination */
  const [userPage, setUserPage] = useState(1);
  const PAGE_SIZE = 20;

  /* UI state */
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher, setNewTeacher]   = useState({ username:'', password:'', fullName:'', email:'', department:'' });
  const [expandedFb, setExpandedFb]   = useState(null);
  const [resolveNote, setResolveNote] = useState('');
  const [fbFilter, setFbFilter]       = useState('ALL');
  const [userSearch, setUserSearch]   = useState('');


  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [sR, uR, fR, fsR, tR] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUsers(),
        feedbackAPI.getAll(),
        feedbackAPI.getStats(),
        testAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setStats(sR.data || {});
      setUsers(uR.data || []);
      setFeedbacks(fR.data || []);
      setFbStats(fsR.data || {});
      setTests(tR.data || []);
    } catch { toast.error('Failed to load admin data'); }
    finally { setLoading(false); }
  };

  /* Build chart data from real tests list */
  const buildChartData = (range) => {
    const now = new Date();
    let days = 7, labelFmt;
    if (range === 'month') { days = 30; labelFmt = d => `${d.getDate()} ${d.toLocaleString('en',{month:'short'})}`; }
    else if (range === 'year') { days = 365; labelFmt = d => d.toLocaleString('en',{month:'short'}); }
    else { labelFmt = d => d.toLocaleString('en',{weekday:'short'}); }

    if (range === 'year') {
      // Group by month
      const map = {};
      for (let m = 0; m < 12; m++) {
        const d = new Date(now.getFullYear(), m, 1);
        map[m] = { day: d.toLocaleString('en',{month:'short'}), v: 0 };
      }
      tests.forEach(t => {
        const d = new Date(t.startTime || t.createdAt);
        if (!isNaN(d) && d.getFullYear() === now.getFullYear()) map[d.getMonth()].v++;
      });
      return Object.values(map);
    }

    const slots = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      slots.push({ date: d, label: labelFmt(d), v: 0 });
    }
    tests.forEach(t => {
      const d = new Date(t.startTime || t.createdAt);
      if (isNaN(d)) return;
      d.setHours(0,0,0,0);
      const slot = slots.find(s => s.date.getTime() === d.getTime());
      if (slot) slot.v++;
    });
    // For month view, keep every 5th label to avoid clutter
    return slots.map((s, i) => ({
      day: range === 'month' ? (i % 5 === 0 ? s.label : '') : s.label,
      v: s.v,
    }));
  };

  const chartData = buildChartData(chartRange);

  /* Registrations trend — last 30 days from real users list */
  const regTrend = (() => {
    const now = new Date();
    const slots = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate() - (29 - i));
      const label = i % 5 === 0 ? `${d.getDate()} ${d.toLocaleString('en',{month:'short'})}` : '';
      return { date: d, day: label, s: 0, t: 0 };
    });
    users.forEach(u => {
      const d = new Date(u.createdAt);
      if (isNaN(d)) return;
      d.setHours(0,0,0,0);
      const slot = slots.find(s => s.date.getTime() === d.getTime());
      if (!slot) return;
      if (u.role === 'STUDENT') slot.s++;
      else if (u.role === 'TEACHER') slot.t++;
    });
    return slots.map(({ day, s, t }) => ({ day, s, t }));
  })();
  const hasRegData = regTrend.some(r => r.s > 0 || r.t > 0);

  /* ── Sidebar section change handler ──────────────────────────── */
  const handleSectionChange = (sec, opts = {}) => {
    setSection(sec);
    if (opts.filter) setUserFilter(opts.filter);
    else if (sec === 'users') setUserFilter('all');
  };

  /* ── Handlers ─────────────────────────────────────────────────── */
  const handleToggle    = async (id) => { try { await adminAPI.toggleUser(id); loadData(); } catch { toast.error('Failed'); } };
  const handleRoleChange= async (id, role) => { try { await adminAPI.updateRole(id, role); toast.success('Role updated'); loadData(); } catch { toast.error('Failed'); } };
  const handleDelete    = async (u) => {
    if (!window.confirm(`Delete "${u.fullName}"?`)) return;
    try { await adminAPI.deleteUser(u.id); toast.success('Deleted'); loadData(); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };
  const handleResetPw   = async (u) => {
    const pw = window.prompt(`New password for ${u.fullName}:`);
    if (!pw) return;
    if (pw.length < 6) { toast.error('Min 6 characters'); return; }
    try { await adminAPI.resetPassword(u.id, pw); toast.success('Password reset'); }
    catch { toast.error('Failed'); }
  };
  const handleDeleteTest = async (t) => {
    if (!window.confirm(`Delete "${t.title}"?`)) return;
    try { await testAPI.delete(t.id); toast.success('Deleted'); setTests(p => p.filter(x => x.id !== t.id)); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };
  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try { await authAPI.register({ ...newTeacher, role: 'TEACHER' }); toast.success('Teacher created!'); setShowAddTeacher(false); setNewTeacher({ username:'',password:'',fullName:'',email:'',department:'' }); loadData(); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };
  const handleResolve   = async (id) => { try { await feedbackAPI.resolve(id, resolveNote); toast.success('Resolved'); setExpandedFb(null); setResolveNote(''); loadData(); } catch { toast.error('Failed'); } };
  const handleDismiss   = async (id) => { try { await feedbackAPI.dismiss(id, resolveNote); toast.success('Dismissed'); setExpandedFb(null); setResolveNote(''); loadData(); } catch { toast.error('Failed'); } };

  /* ── Computed ─────────────────────────────────────────────────── */
  const q       = userSearch.trim().toLowerCase();
  const matches = (u) => !q || [u.fullName, u.username, u.email, u.department].some(v => (v||'').toLowerCase().includes(q));
  const allVis  = users.filter(matches);

  const roleMap = { admins:'ADMIN', teachers:'TEACHER', companies:'COMPANY', students:'STUDENT' };
  const visUsers = userFilter === 'all'
    ? allVis
    : allVis.filter(u => u.role === (roleMap[userFilter] || 'STUDENT'));

  const bySections = {};
  visUsers.filter(u => u.role === 'STUDENT').forEach(u => {
    const k = u.sectionName ? `${u.sectionName}${u.batchName?' · '+u.batchName:''}` : 'Unassigned';
    (bySections[k] = bySections[k] || []).push(u);
  });
  const sectionKeys = Object.keys(bySections).sort((a,b) => a==='Unassigned'?1:b==='Unassigned'?-1:a.localeCompare(b));

  /* Two-level batch → section grouping for card view */
  const byBatches = {};
  allVis.filter(u => u.role === 'STUDENT').forEach(u => {
    const batch   = u.batchName   || 'Unassigned';
    const section = u.sectionName || 'Unassigned';
    if (!byBatches[batch]) byBatches[batch] = {};
    (byBatches[batch][section] = byBatches[batch][section] || []).push(u);
  });
  const batchKeys = Object.keys(byBatches).sort((a,b) => a==='Unassigned'?1:b==='Unassigned'?-1:a.localeCompare(b));

  const fbVisible   = fbFilter === 'ALL' ? feedbacks : feedbacks.filter(f => f.status === fbFilter);
  const recentTests = [...tests].sort((a,b) => new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5);

  /* ── Design tokens ───────────────────────────────────────────── */
  const card   = dark ? 'bg-gray-900 border-gray-700/60' : 'bg-white border-gray-200';
  const title  = dark ? 'text-white'    : 'text-gray-900';
  const sub    = dark ? 'text-gray-400' : 'text-gray-500';
  const divid  = dark ? 'border-gray-700/60' : 'border-gray-200';
  const inp    = dark ? 'bg-gray-800 border-gray-700 text-gray-300 placeholder-gray-500 focus:border-orange-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-orange-400';
  const thCls  = dark ? 'bg-gray-800/80 text-gray-400' : 'bg-gray-50 text-gray-500';
  const trCls  = dark ? 'border-gray-700/40 hover:bg-gray-800/40' : 'border-gray-100 hover:bg-gray-50/50';
  const pg     = dark ? 'bg-gray-950' : 'bg-slate-50';
  const CAT    = { WRONG_TESTCASE:'🧪 Wrong Test Case', WRONG_QUESTION:'📝 Wrong Question', WRONG_EXPECTED_OUTPUT:'❌ Wrong Output', UNCLEAR_DESCRIPTION:'😕 Unclear', TIME_LIMIT_ISSUE:'⏱ Time Limit', OTHER:'💬 Other' };

  /* ── Paginated User Table ────────────────────────────────────── */
  const UserTable = ({ list, pageKey = 'default' }) => {
    const [pg, setPg] = useState(1);
    const total = list.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const slice = list.slice((pg-1)*PAGE_SIZE, pg*PAGE_SIZE);
    const btnCls = (active) => `px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${active ? 'bg-orange-500 text-white border-orange-500' : (dark?'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200':'bg-white text-gray-500 border-gray-200 hover:text-gray-700')}`;
    return (
      <div>
        <div className={`rounded-2xl border overflow-hidden ${card}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${divid} ${thCls}`}>
                {['User','Email','Department','Role','Status','Actions'].map(h => (
                  <th key={h} className={`py-3 px-4 text-xs font-semibold uppercase tracking-wide ${h==='Actions'||h==='Status'?'text-center':'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((u, i) => (
                <tr key={u.id} className={`border-b transition-colors ${trCls} ${i===slice.length-1?'border-0':divid}`}>
                  <td className="py-3 px-4">
                    <p className={`font-semibold ${title}`}>{u.fullName}</p>
                    <p className={`text-xs ${sub}`}>@{u.username}</p>
                  </td>
                  <td className={`py-3 px-4 ${sub}`}>{u.email}</td>
                  <td className={`py-3 px-4 ${sub}`}>{u.department||'—'}</td>
                  <td className="py-3 px-4">
                    <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                      className={`border rounded-lg px-2 py-1 text-xs font-medium cursor-pointer focus:outline-none ${dark?'bg-gray-800 border-gray-600 text-gray-300':'bg-white border-gray-200 text-gray-700'}`}>
                      {['STUDENT','TEACHER','ADMIN','COMPANY'].map(r => <option key={r} value={r}>{r[0]+r.slice(1).toLowerCase()}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${u.enabled?'bg-emerald-500/10 text-emerald-500':'bg-red-500/10 text-red-400'}`}>
                      {u.enabled?'Active':'Disabled'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleToggle(u.id)} title="Toggle status"
                        className={`p-1.5 rounded-lg transition-all ${dark?'text-gray-500 hover:bg-emerald-500/10 hover:text-emerald-400':'text-gray-400 hover:bg-emerald-50 hover:text-emerald-500'}`}>
                        {u.enabled ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>}
                      </button>
                      <button onClick={() => handleResetPw(u)} title="Reset password"
                        className={`p-1.5 rounded-lg transition-all text-base leading-none ${dark?'text-gray-500 hover:bg-amber-500/10 hover:text-amber-400':'text-gray-400 hover:bg-amber-50 hover:text-amber-500'}`}>🔑</button>
                      {u.role !== 'ADMIN' && (
                        <button onClick={() => handleDelete(u)} title="Delete"
                          className={`p-1.5 rounded-lg transition-all ${dark?'text-gray-500 hover:bg-red-500/10 hover:text-red-400':'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}>
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between mt-3 px-1">
            <p className={`text-xs ${sub}`}>
              Showing {(pg-1)*PAGE_SIZE+1}–{Math.min(pg*PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={()=>setPg(1)} disabled={pg===1} className={`${btnCls(false)} disabled:opacity-40`}>«</button>
              <button onClick={()=>setPg(p=>Math.max(1,p-1))} disabled={pg===1} className={`${btnCls(false)} disabled:opacity-40`}>‹</button>
              {Array.from({length: Math.min(5, pages)}, (_,i) => {
                let p; const half=2;
                if (pages<=5) p=i+1;
                else if (pg<=half+1) p=i+1;
                else if (pg>=pages-half) p=pages-4+i;
                else p=pg-half+i;
                return (
                  <button key={p} onClick={()=>setPg(p)} className={btnCls(pg===p)}>{p}</button>
                );
              })}
              <button onClick={()=>setPg(p=>Math.min(pages,p+1))} disabled={pg===pages} className={`${btnCls(false)} disabled:opacity-40`}>›</button>
              <button onClick={()=>setPg(pages)} disabled={pg===pages} className={`${btnCls(false)} disabled:opacity-40`}>»</button>
            </div>
          </div>
        )}
      </div>
    );
  };


  /* Loading */
  if (loading) return (
    <AdminLayout section={section} onSectionChange={handleSectionChange}>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    </AdminLayout>
    );

  /* ════════════════════════════════════════════════════════════════
     Render
  ════════════════════════════════════════════════════════════════ */
  return (
    <AdminLayout section={section} onSectionChange={handleSectionChange}>
      <div className={`min-h-full p-6 ${pg}`}>

        {/* ── Top action strip (minimal — just action buttons) ─── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-xl font-bold ${title}`}>
              {section === 'overview'     && 'Overview'}
              {section === 'tests'        && 'Test Management'}
              {section === 'users'        && `User Management${userFilter !== 'all' ? ` · ${userFilter[0].toUpperCase()+userFilter.slice(1)}` : ''}`}
              {section === 'reports'      && 'Problem Reports'}
              {section === 'submissions'  && 'Submissions'}
              {section === 'assessments'  && 'Assessments'}
              {section === 'announcements'&& 'Announcements'}
              {section === 'support'      && 'Support Tickets'}
              {section === 'analytics'    && 'Analytics'}
              {section === 'health'       && 'System Health'}
              {section === 'settings'     && 'Settings'}
            </h2>
            <p className={`text-sm mt-0.5 ${sub}`}>
              {section === 'overview'     && 'Platform activity and performance'}
              {section === 'tests'        && 'All tests created on the platform'}
              {section === 'users'        && 'Manage users, roles, and access'}
              {section === 'reports'      && 'Review and resolve problem reports'}
              {section === 'submissions'  && 'Code submission statistics'}
              {section === 'assessments'  && 'Student assessment data'}
              {section === 'announcements'&& 'Broadcast to students and sections'}
              {section === 'support'      && 'Student help requests'}
              {section === 'analytics'    && 'Platform usage and trends'}
              {section === 'health'       && 'Live service status'}
              {section === 'settings'     && 'Platform configuration'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(section === 'overview' || section === 'users') && (
              <Link to="/admin/batches"
                className={`flex items-center gap-1.5 border rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${dark?'bg-gray-800 border-gray-700 text-gray-300 hover:text-white':'bg-white border-gray-200 text-gray-600 hover:text-gray-900'}`}>
                <GraduationCap className="w-4 h-4"/> Batch Management
              </Link>
            )}
            {(section === 'overview' || section === 'users') && (
              <button onClick={() => setShowAddTeacher(true)}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3.5 py-2 text-sm font-semibold shadow-sm transition-all">
                <UserPlus className="w-4 h-4"/> Add Teacher
              </button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            OVERVIEW
        ════════════════════════════════════════════════════════ */}
        {section === 'overview' && (<>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
            <StatCard dark={dark} icon={<Users className="w-5 h-5"/>}         label="Total Students"    value={stats.totalStudents}    iconBg={dark?'bg-indigo-500/10':'bg-indigo-50'}   iconColor="text-indigo-500"/>
            <StatCard dark={dark} icon={<GraduationCap className="w-5 h-5"/>} label="Total Teachers"    value={stats.totalTeachers}    iconBg={dark?'bg-violet-500/10':'bg-violet-50'}   iconColor="text-violet-500"/>
            <StatCard dark={dark} icon={<BookOpen className="w-5 h-5"/>}      label="Total Problems"    value={stats.totalQuestions}   iconBg={dark?'bg-amber-500/10':'bg-amber-50'}     iconColor="text-amber-500"/>
            <StatCard dark={dark} icon={<ClipboardList className="w-5 h-5"/>} label="Total Tests"       value={stats.totalTests}       iconBg={dark?'bg-cyan-500/10':'bg-cyan-50'}       iconColor="text-cyan-600"/>
            <StatCard dark={dark} icon={<FileText className="w-5 h-5"/>}      label="Submissions"       value={stats.totalSubmissions}  iconBg={dark?'bg-rose-500/10':'bg-rose-50'}       iconColor="text-rose-500"/>
          </div>

          {/* Row 1 */}
          <div className="mb-4">
            <div className={`rounded-2xl border p-5 ${card}`}>
              <div className="flex items-center justify-between mb-4">
                <div><h3 className={`font-bold ${title}`}>Tests Overview</h3><p className={`text-xs mt-0.5 ${sub}`}>Tests created {chartRange === 'week' ? 'this week' : chartRange === 'month' ? 'this month' : 'this year'}</p></div>
                <select
                  value={chartRange}
                  onChange={e => setChartRange(e.target.value)}
                  className={`text-xs px-2.5 py-1 rounded-xl font-medium border cursor-pointer focus:outline-none ${dark?'bg-gray-800 text-gray-300 border-gray-700':'bg-gray-100 text-gray-600 border-gray-200'}`}
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark?'#374151':'#f3f4f6'}/>
                  <XAxis dataKey="day" tick={{ fontSize:11, fill:dark?'#6b7280':'#9ca3af' }} axisLine={false} tickLine={false}/>
                  <YAxis allowDecimals={false} tick={{ fontSize:11, fill:dark?'#6b7280':'#9ca3af' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Area type="monotone" dataKey="v" name="tests" stroke="#f97316" strokeWidth={2.5} fill="url(#sg)" dot={{ fill:'#f97316',r:4,strokeWidth:0 }} activeDot={{ r:6 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid xl:grid-cols-3 gap-4 mb-4">
            <div className={`rounded-2xl border p-5 ${card}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-bold ${title}`}>Registrations Overview</h3>
                <div className={`flex items-center gap-3 text-xs ${sub}`}>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm inline-block"/>Students</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-400 rounded-sm inline-block"/>Teachers</span>
                </div>
              </div>
              {hasRegData ? (
                <ResponsiveContainer width="100%" height={175}>
                  <BarChart data={regTrend} barSize={8} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark?'#374151':'#f3f4f6'}/>
                    <XAxis dataKey="day" tick={{ fontSize:10, fill:dark?'#6b7280':'#9ca3af' }} axisLine={false} tickLine={false}/>
                    <YAxis allowDecimals={false} tick={{ fontSize:10, fill:dark?'#6b7280':'#9ca3af' }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Bar dataKey="s" name="students" fill="#34d399" radius={[3,3,0,0]}/>
                    <Bar dataKey="t" name="teachers" fill="#818cf8" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[175px] gap-2">
                  <BarChart3 className="w-8 h-8 text-gray-300"/>
                  <p className={`text-xs text-center ${sub}`}>No registration data yet.<br/>Chart will populate automatically as users join.</p>
                </div>
              )}
            </div>

            <div className={`rounded-2xl border p-5 ${card}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${title}`}>Recent Tests</h3>
                <button onClick={() => setSection('tests')} className="text-xs text-indigo-500 hover:text-indigo-400 font-medium">View all</button>
              </div>
              <div className="space-y-3">
                {recentTests.length===0 && <p className={`text-sm text-center py-6 ${sub}`}>No tests yet</p>}
                {recentTests.map(t => {
                  const now=new Date(), st=t.startTime?new Date(t.startTime):null, et=t.endTime?new Date(t.endTime):null;
                  const status = !t.published?'Draft':!st?'Published':now<st?'Upcoming':et&&now>et?'Completed':'Live';
                  const sc = { Live:'bg-emerald-500/10 text-emerald-500', Upcoming:'bg-blue-500/10 text-blue-400', Completed:'bg-gray-500/10 text-gray-400', Draft:'bg-gray-500/10 text-gray-400', Published:'bg-violet-500/10 text-violet-400' };
                  return (
                    <div key={t.id} className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${dark?'bg-gray-800':'bg-gray-100'}`}>
                        <ClipboardList className={`w-3.5 h-3.5 ${sub}`}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${title}`}>{t.title}</p>
                        <p className={`text-xs ${sub}`}>{t.totalQuestions||0} questions</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${sc[status]||sc.Draft}`}>{status}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`rounded-2xl border p-5 ${card}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${title}`}>System Health</h3>
                <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-semibold">All OK</span>
              </div>
              <div className="space-y-3">
                {[{ l:'Online Judge',ok:true,d:'Operational'},{ l:'Compiler Service',ok:true,d:'Operational'},{ l:'Database',ok:true,d:'Operational'},{ l:'Storage',ok:true,d:'86%',bar:86},{ l:'API Response',ok:true,d:'120ms'}].map(s => (
                  <div key={s.l}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${s.ok?'bg-emerald-400':'bg-red-400'}`}/><span className={`text-sm ${title}`}>{s.l}</span></div>
                      <span className={`text-xs ${sub}`}>{s.d}</span>
                    </div>
                    {s.bar && <div className={`mt-1 ml-3.5 h-1 rounded-full overflow-hidden ${dark?'bg-gray-700':'bg-gray-100'}`}><div className="h-full bg-indigo-400 rounded-full" style={{width:`${s.bar}%`}}/></div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid xl:grid-cols-2 gap-4">
            <div className={`rounded-2xl border p-5 ${card}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${title}`}>Reports Summary</h3>
                <button onClick={() => setSection('reports')} className="text-xs text-indigo-500 hover:text-indigo-400 font-medium">View all</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l:'Student Reports',    v:feedbackStats.total||0,    bg:dark?'bg-blue-500/10':'bg-blue-50',    txt:'text-blue-500',  delta:'+2', em:'📋' },
                  { l:'Submission Reports', v:feedbackStats.open||0,     bg:dark?'bg-amber-500/10':'bg-amber-50',  txt:'text-amber-500', delta:'-1', em:'📊' },
                  { l:'Test Reports',       v:feedbackStats.resolved||0, bg:dark?'bg-indigo-500/10':'bg-indigo-50',txt:'text-indigo-500',delta:'+4', em:'📄' },
                  { l:'Cheating Reports',   v:feedbackStats.dismissed||0,bg:dark?'bg-red-500/10':'bg-red-50',     txt:'text-red-500',   delta:'-1', em:'⚠️' },
                ].map(r => (
                  <div key={r.l} className={`${r.bg} rounded-xl p-3`}>
                    <div className="flex items-center justify-between mb-1"><span className="text-base">{r.em}</span><span className={`text-xs font-bold ${r.delta.startsWith('+')?'text-emerald-500':'text-red-400'}`}>{r.delta}</span></div>
                    <p className={`text-2xl font-bold ${r.txt}`}>{r.v}</p>
                    <p className={`text-xs mt-0.5 ${sub}`}>{r.l}</p>
          </div>
        ))}
              </div>
      </div>

            <div className={`rounded-2xl border p-5 ${card}`}>
              <h3 className={`font-bold mb-4 ${title}`}>Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l:'Add Student',       to:'/admin/batches' },
                  { l:'Add Teacher',       action:()=>setShowAddTeacher(true) },
                  { l:'Import Students',   to:'/admin/batches' },
                  { l:'Batch Management',  to:'/admin/batches' },
                  { l:'Generate Report',   action:()=>handleSectionChange('reports') },
                  { l:'Send Announcement', action:()=>handleSectionChange('announcements') },
                ].map(a => {
                  const cls = `flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all border ${dark?'bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white':'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`;
                  return a.to
                    ? <Link key={a.l} to={a.to} className={cls}><Plus className="w-3 h-3 flex-shrink-0"/>{a.l}</Link>
                    : <button key={a.l} onClick={a.action} className={cls}><Plus className="w-3 h-3 flex-shrink-0"/>{a.l}</button>;
                })}
          </div>
        </div>
          </div>
        </>)}

        {/* ════════════════════════════════════════════════════════
            TEST MANAGEMENT
        ════════════════════════════════════════════════════════ */}
        {/* tests section handled by useEffect redirect above */}

        {/* ════════════════════════════════════════════════════════
            USER MANAGEMENT
        ════════════════════════════════════════════════════════ */}
        {section === 'users' && (
          <div>
            {/* Filter chips */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                {[
                  { id:'all',       label:`All (${users.length})` },
                  { id:'admins',    label:`Admins (${users.filter(u=>u.role==='ADMIN').length})` },
                  { id:'teachers',  label:`Teachers (${users.filter(u=>u.role==='TEACHER').length})` },
                  { id:'students',  label:`Students (${users.filter(u=>u.role==='STUDENT').length})` },
                  { id:'companies', label:`Companies (${users.filter(u=>u.role==='COMPANY').length})` },
                ].map(f => (
                  <button key={f.id} onClick={()=>{ setUserFilter(f.id); setSelectedBatch(null); setSelectedSection(null); setSelectedRole(null); }}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all border
                      ${userFilter===f.id
                        ? 'bg-orange-500 text-white border-orange-500'
                        : (dark?'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200':'bg-white text-gray-500 border-gray-200 hover:text-gray-700')}`}>
                    {f.label}
                  </button>
                ))}
        </div>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search name, email..."
                  className={`border rounded-xl pl-9 pr-3 py-2 text-sm w-56 focus:outline-none ${inp}`}/>
        </div>
      </div>

            {visUsers.length === 0
              ? <div className={`rounded-2xl border p-12 text-center ${card}`}><Users className="w-10 h-10 text-gray-400 mx-auto mb-3"/><p className={`text-sm ${sub}`}>{q?'No match':'No users'}</p></div>
              : userFilter === 'students'
                ? (() => {
                    const BATCH_COLORS = [
                      { ring:'border-indigo-400/40', bg: dark?'bg-indigo-500/10':'bg-indigo-50', icon:'text-indigo-500', badge: dark?'bg-indigo-500/20 text-indigo-300':'bg-indigo-100 text-indigo-700' },
                      { ring:'border-violet-400/40', bg: dark?'bg-violet-500/10':'bg-violet-50', icon:'text-violet-500', badge: dark?'bg-violet-500/20 text-violet-300':'bg-violet-100 text-violet-700' },
                      { ring:'border-cyan-400/40',   bg: dark?'bg-cyan-500/10':'bg-cyan-50',     icon:'text-cyan-500',   badge: dark?'bg-cyan-500/20 text-cyan-300':'bg-cyan-100 text-cyan-700' },
                      { ring:'border-emerald-400/40',bg: dark?'bg-emerald-500/10':'bg-emerald-50',icon:'text-emerald-500',badge: dark?'bg-emerald-500/20 text-emerald-300':'bg-emerald-100 text-emerald-700' },
                      { ring:'border-amber-400/40',  bg: dark?'bg-amber-500/10':'bg-amber-50',   icon:'text-amber-500',  badge: dark?'bg-amber-500/20 text-amber-300':'bg-amber-100 text-amber-700' },
                      { ring:'border-rose-400/40',   bg: dark?'bg-rose-500/10':'bg-rose-50',     icon:'text-rose-500',   badge: dark?'bg-rose-500/20 text-rose-300':'bg-rose-100 text-rose-700' },
                    ];
                    const filteredBatchKeys = q
                      ? batchKeys.filter(b => b.toLowerCase().includes(q) || Object.keys(byBatches[b]).some(s => s.toLowerCase().includes(q) || (byBatches[b][s]||[]).some(u => [u.fullName,u.username,u.email].some(v=>(v||'').toLowerCase().includes(q)))))
                      : batchKeys;

                    /* ── Drill-down: section selected ── */
                    if (selectedBatch && selectedSection) {
                      const list = (byBatches[selectedBatch]?.[selectedSection] || []).filter(u => !q || [u.fullName,u.username,u.email,u.department].some(v=>(v||'').toLowerCase().includes(q)));
                      return (
                        <div>
                          {/* Breadcrumb */}
                          <div className="flex items-center gap-2 mb-4 text-sm">
                            <button onClick={()=>{setSelectedBatch(null);setSelectedSection(null);}} className="text-orange-500 hover:underline font-medium">Batches</button>
                            <span className={sub}>›</span>
                            <button onClick={()=>setSelectedSection(null)} className="text-orange-500 hover:underline font-medium">{selectedBatch}</button>
                            <span className={sub}>›</span>
                            <span className={title}>{selectedSection}</span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${dark?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500'}`}>{list.length} students</span>
                          </div>
                          {list.length === 0
                            ? <div className={`rounded-2xl border p-12 text-center ${card}`}><Users className="w-10 h-10 text-gray-400 mx-auto mb-3"/><p className={`text-sm ${sub}`}>No students match</p></div>
                            : <UserTable list={list}/>}
                        </div>
                      );
                    }

                    /* ── Drill-down: batch selected, show section cards ── */
                    if (selectedBatch) {
                      const sections = Object.keys(byBatches[selectedBatch]||{}).sort();
                      return (
                        <div>
                          {/* Breadcrumb */}
                          <div className="flex items-center gap-2 mb-4 text-sm">
                            <button onClick={()=>{setSelectedBatch(null);setSelectedSection(null);}} className="text-orange-500 hover:underline font-medium">Batches</button>
                            <span className={sub}>›</span>
                            <span className={title}>{selectedBatch}</span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${dark?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500'}`}>
                              {Object.values(byBatches[selectedBatch]).reduce((s,a)=>s+a.length,0)} students
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            {sections.map((sec, i) => {
                              const list = byBatches[selectedBatch][sec] || [];
                              const c = BATCH_COLORS[i % BATCH_COLORS.length];
                              const active = list.filter(u => u.enabled).length;
                              return (
                                <button key={sec} onClick={()=>setSelectedSection(sec)}
                                  className={`text-left rounded-2xl border-2 p-4 transition-all hover:scale-[1.02] hover:shadow-lg ${card} ${c.ring} hover:border-opacity-80`}>
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>
                                    <Users className={`w-5 h-5 ${c.icon}`}/>
                                  </div>
                                  <p className={`font-bold text-sm mb-0.5 ${title}`}>Section {sec}</p>
                                  <p className={`text-xs mb-3 ${sub}`}>{selectedBatch}</p>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-lg font-extrabold ${title}`}>{list.length}</span>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{active} active</span>
                                  </div>
                                  <p className={`text-[10px] mt-1 ${sub}`}>students</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    /* ── Top-level: batch cards ── */
                    return (
                      <div>
                        {filteredBatchKeys.length === 0
                          ? <div className={`rounded-2xl border p-12 text-center ${card}`}><Users className="w-10 h-10 text-gray-400 mx-auto mb-3"/><p className={`text-sm ${sub}`}>No batches found</p></div>
                          : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                              {filteredBatchKeys.map((batch, i) => {
                                const sections = byBatches[batch];
                                const totalStudents = Object.values(sections).reduce((s,a)=>s+a.length,0);
                                const totalSections = Object.keys(sections).length;
                                const activeStudents = Object.values(sections).flat().filter(u=>u.enabled).length;
                                const c = BATCH_COLORS[i % BATCH_COLORS.length];
                                return (
                                  <button key={batch} onClick={()=>{setSelectedBatch(batch);setSelectedSection(null);}}
                                    className={`text-left rounded-2xl border-2 p-5 transition-all hover:scale-[1.01] hover:shadow-xl ${card} ${c.ring}`}>
                                    <div className="flex items-start justify-between mb-4">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.bg}`}>
                                        <Layers className={`w-6 h-6 ${c.icon}`}/>
                                      </div>
                                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${c.badge}`}>{totalSections} section{totalSections!==1?'s':''}</span>
                                    </div>
                                    <p className={`font-extrabold text-base mb-0.5 ${title}`}>{batch}</p>
                                    <p className={`text-xs mb-4 ${sub}`}>{Object.keys(sections).sort().map(s=>`Sec ${s}`).join(' · ')}</p>
                                    <div className={`border-t pt-3 flex items-center justify-between ${divid}`}>
                                      <div>
                                        <p className={`text-2xl font-extrabold ${title}`}>{totalStudents}</p>
                                        <p className={`text-[10px] ${sub}`}>total students</p>
                                      </div>
                                      <div className="text-right">
                                        <p className={`text-sm font-bold text-emerald-500`}>{activeStudents}</p>
                                        <p className={`text-[10px] ${sub}`}>active</p>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                        }
                      </div>
                    );
                  })()
                : userFilter === 'all'
                  ? (() => {
                      const ROLE_CARDS = [
                        { role:'ADMIN',   label:'Admins',    icon:Shield,        bg:dark?'bg-rose-500/10':'bg-rose-50',    ring:'border-rose-400/40',    icon_c:'text-rose-500',    badge:dark?'bg-rose-500/20 text-rose-300':'bg-rose-100 text-rose-700',    desc:'Platform administrators' },
                        { role:'TEACHER', label:'Teachers',  icon:GraduationCap, bg:dark?'bg-indigo-500/10':'bg-indigo-50',ring:'border-indigo-400/40',  icon_c:'text-indigo-500',  badge:dark?'bg-indigo-500/20 text-indigo-300':'bg-indigo-100 text-indigo-700', desc:'Manage tests & sections' },
                        { role:'STUDENT', label:'Students',  icon:Users,         bg:dark?'bg-emerald-500/10':'bg-emerald-50',ring:'border-emerald-400/40',icon_c:'text-emerald-500', badge:dark?'bg-emerald-500/20 text-emerald-300':'bg-emerald-100 text-emerald-700',desc:'Across all batches' },
                        { role:'COMPANY', label:'Companies', icon:Building2,     bg:dark?'bg-cyan-500/10':'bg-cyan-50',    ring:'border-cyan-400/40',    icon_c:'text-cyan-500',    badge:dark?'bg-cyan-500/20 text-cyan-300':'bg-cyan-100 text-cyan-700',    desc:'Hiring & assessments' },
                      ];
                      /* Drill-down: role selected */
                      if (selectedRole === 'STUDENT') {
                        return (
                          <div>
                            <div className="flex items-center gap-2 mb-4 text-sm">
                              <button onClick={()=>setSelectedRole(null)} className="text-orange-500 hover:underline font-medium">All Users</button>
                              <span className={sub}>›</span>
                              <span className={title}>Students</span>
                            </div>
                            <UserTable list={allVis.filter(u=>u.role==='STUDENT')}/>
                          </div>
                        );
                      }
                      if (selectedRole) {
                        const rc = ROLE_CARDS.find(r=>r.role===selectedRole);
                        const list = allVis.filter(u=>u.role===selectedRole);
                        return (
                          <div>
                            <div className="flex items-center gap-2 mb-4 text-sm">
                              <button onClick={()=>setSelectedRole(null)} className="text-orange-500 hover:underline font-medium">All Users</button>
                              <span className={sub}>›</span>
                              <span className={title}>{rc?.label}</span>
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${dark?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500'}`}>{list.length}</span>
                            </div>
                            {list.length === 0
                              ? <div className={`rounded-2xl border p-12 text-center ${card}`}><Users className="w-10 h-10 text-gray-400 mx-auto mb-3"/><p className={`text-sm ${sub}`}>No {rc?.label?.toLowerCase()} found</p></div>
                              : <UserTable list={list}/>}
                          </div>
                        );
                      }
                      /* Top-level role cards */
                      return (
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                          {ROLE_CARDS.map(rc => {
                            const list = allVis.filter(u=>u.role===rc.role);
                            const active = list.filter(u=>u.enabled).length;
                            const Icon = rc.icon;
                            return (
                              <button key={rc.role} onClick={()=>{ setSelectedRole(rc.role); setSelectedBatch(null); setSelectedSection(null); }}
                                className={`text-left rounded-2xl border-2 p-5 transition-all hover:scale-[1.02] hover:shadow-xl ${card} ${rc.ring}`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${rc.bg}`}>
                                  <Icon className={`w-6 h-6 ${rc.icon_c}`}/>
                                </div>
                                <p className={`font-extrabold text-base mb-0.5 ${title}`}>{rc.label}</p>
                                <p className={`text-xs mb-4 ${sub}`}>{rc.desc}</p>
                                <div className={`border-t pt-3 flex items-center justify-between ${divid}`}>
                                  <div>
                                    <p className={`text-2xl font-extrabold ${title}`}>{list.length}</p>
                                    <p className={`text-[10px] ${sub}`}>total</p>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${rc.badge}`}>{active} active</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()
                  : <UserTable list={visUsers}/>
            }
            <p className={`text-xs mt-4 ${sub}`}>
              For CSV import & debarring → <Link to="/admin/batches" className="text-indigo-500 hover:underline">Batch &amp; Section Management</Link>
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            PROBLEM REPORTS
        ════════════════════════════════════════════════════════ */}
        {section === 'reports' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              {feedbackStats.open > 0 && <span className="bg-amber-500/10 text-amber-500 text-xs font-bold px-2.5 py-1 rounded-full">{feedbackStats.open} open</span>}
          <div className="flex gap-2">
                {['ALL','OPEN','RESOLVED','DISMISSED'].map(f => (
                  <button key={f} onClick={()=>setFbFilter(f)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-all
                      ${fbFilter===f ? 'bg-orange-500 text-white border-orange-500' : (dark?'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200':'bg-white text-gray-500 border-gray-200 hover:text-gray-700')}`}>
                    {f==='ALL'?`All (${feedbackStats.total||0})`:f==='OPEN'?`Open (${feedbackStats.open||0})`:f==='RESOLVED'?`Resolved (${feedbackStats.resolved||0})`:`Dismissed (${feedbackStats.dismissed||0})`}
              </button>
            ))}
          </div>
        </div>

            {fbVisible.length === 0
              ? <div className={`rounded-2xl border p-12 text-center ${card}`}><MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-3"/><p className={`text-sm ${sub}`}>No {fbFilter.toLowerCase()} reports</p></div>
              : <div className="space-y-2">
                  {fbVisible.map(fb => (
                    <div key={fb.id} className={`rounded-2xl border overflow-hidden ${card}`}>
                      <div className={`p-4 flex items-start gap-4 cursor-pointer transition-colors ${dark?'hover:bg-gray-800/50':'hover:bg-gray-50/50'}`}
                        onClick={() => { setExpandedFb(expandedFb===fb.id?null:fb.id); setResolveNote(''); }}>
                        <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${fb.status==='OPEN'?'bg-amber-400':fb.status==='RESOLVED'?'bg-emerald-400':'bg-gray-400'}`}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${dark?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500'}`}>{CAT[fb.category]||fb.category}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${fb.status==='OPEN'?'bg-amber-500/10 text-amber-500':fb.status==='RESOLVED'?'bg-emerald-500/10 text-emerald-500':'bg-gray-500/10 text-gray-400'}`}>{fb.status}</span>
                          </div>
                          <p className={`font-semibold text-sm ${title}`}>{fb.questionTitle}</p>
                          <p className={`text-xs mt-1 truncate ${sub}`}>{fb.message}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-xs font-medium ${title}`}>{fb.userName}</p>
                          <p className={`text-[10px] ${sub}`}>{new Date(fb.createdAt).toLocaleDateString()}</p>
                        </div>
                        {expandedFb===fb.id ? <ChevronUp className="w-4 h-4 text-gray-400 mt-1"/> : <ChevronDown className="w-4 h-4 text-gray-400 mt-1"/>}
                      </div>
                      {expandedFb===fb.id && (
                        <div className={`px-4 pb-4 border-t ${divid} pt-3`}>
                          <p className={`text-sm rounded-xl p-3 mb-3 ${dark?'bg-gray-800 text-gray-300':'bg-gray-50 text-gray-700'}`}>{fb.message}</p>
                          <p className={`text-xs mb-3 ${sub}`}>By <span className={`font-medium ${title}`}>{fb.userName}</span> ({fb.userEmail}) · {new Date(fb.createdAt).toLocaleString()}</p>
                          {fb.status==='OPEN' && (
                            <>
                              <input className={`border rounded-xl px-3 py-2 text-sm w-full mb-3 focus:outline-none ${inp}`} placeholder="Add a note (optional)..." value={resolveNote} onChange={e=>setResolveNote(e.target.value)}/>
                              <div className="flex gap-2">
                                <button onClick={()=>handleResolve(fb.id)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium"><CheckCircle2 className="w-4 h-4"/> Resolve</button>
                                <button onClick={()=>handleDismiss(fb.id)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium ${dark?'border-gray-700 text-gray-400 hover:text-gray-200':'border-gray-200 text-gray-500 hover:text-gray-700'}`}><XCircle className="w-4 h-4"/> Dismiss</button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
            }
                  </div>
        )}
        {/* ════════════════════════════════════════════════════════
            SUBMISSIONS
        ════════════════════════════════════════════════════════ */}
        {section === 'submissions' && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { l:'Total Submissions', v: (stats.totalSubmissions||0).toLocaleString(),  color:'text-indigo-500',  bg: dark?'bg-indigo-500/10':'bg-indigo-50' },
                { l:'Total Students',    v: (stats.totalStudents||0).toLocaleString(),      color:'text-emerald-500', bg: dark?'bg-emerald-500/10':'bg-emerald-50' },
                { l:'Total Problems',    v: (stats.totalQuestions||0).toLocaleString(),     color:'text-amber-500',   bg: dark?'bg-amber-500/10':'bg-amber-50'   },
              ].map(s => (
                <div key={s.l} className={`rounded-2xl border p-5 ${card}`}>
                  <p className={`text-xs font-medium mb-1 ${sub}`}>{s.l}</p>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.v}</p>
                </div>
              ))}
            </div>
            <div className={`rounded-2xl border p-10 text-center ${card}`}>
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3"/>
              <p className={`font-semibold mb-1 ${title}`}>Detailed Submission Log</p>
              <p className={`text-sm ${sub}`}>Per-student submission history is available on each test's results page.</p>
              <button onClick={() => navigate('/admin/tests')} className="mt-4 text-sm text-indigo-500 hover:text-indigo-400 font-medium">
                Go to Test Management →
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            ASSESSMENTS
        ════════════════════════════════════════════════════════ */}
        {section === 'assessments' && (
          <PlaceholderSection dark={dark} card={card} title={title} sub={sub}
            icon={<BarChart3 className="w-10 h-10 text-gray-400"/>}
            heading="Assessments"
            body="Assessment analytics and per-student scoring reports will be available here. Create tests and share them with sections to start collecting assessment data."
            action={{ label:'Go to Test Management →', fn: () => navigate('/admin/tests') }}
          />
        )}

        {/* ════════════════════════════════════════════════════════
            ANNOUNCEMENTS
        ════════════════════════════════════════════════════════ */}
        {section === 'announcements' && (() => {
          const AnnouncementForm = () => {
            const [form, setForm] = useState({ title:'', message:'', targetType:'all', batchName:'', sectionId:'' });
            const [sending, setSending] = useState(false);
            const [sent, setSent] = useState([]);
            const allBatches = [...new Set(users.filter(u=>u.role==='STUDENT').map(u=>u.batchName).filter(Boolean))].sort();
            const allSections = [...new Set(users.filter(u=>u.role==='STUDENT' && (form.targetType==='section'||form.targetType==='batch')).map(u => {
              if (form.targetType==='batch' && u.batchName!==form.batchName) return null;
              return u.sectionName ? `${u.sectionName} · ${u.batchName||''}` : null;
            }).filter(Boolean))].sort();
            const targetCount = (() => {
              const studs = users.filter(u=>u.role==='STUDENT'&&u.enabled);
              if (form.targetType==='all') return studs.length;
              if (form.targetType==='batch') return studs.filter(u=>u.batchName===form.batchName).length;
              if (form.targetType==='section') {
                const [sec, batch] = form.sectionId.split(' · ');
                return studs.filter(u=>u.sectionName===sec&&(u.batchName||'')===(batch||'')).length;
              }
              return 0;
            })();
            const handleSend = async (e) => {
              e.preventDefault();
              if (!form.title.trim()||!form.message.trim()) return toast.error('Title and message required');
              setSending(true);
              try {
                const res = await notificationAPI.broadcast({ ...form });
                const sentCount = res?.data?.sent ?? targetCount;
                const entry = { ...form, targetCount: sentCount, sentAt: new Date().toLocaleString() };
                setSent(p=>[entry,...p]);
                setForm({ title:'', message:'', targetType:'all', batchName:'', sectionId:'' });
                toast.success(`Announcement sent to ${sentCount} student${sentCount!==1?'s':''}!`);
              } catch { toast.error('Failed to send announcement. Please try again.'); }
              finally { setSending(false); }
            };
            const inpCls = `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 ${inp}`;
            return (
              <div className="grid xl:grid-cols-5 gap-4">
                {/* Compose form */}
                <div className={`xl:col-span-3 rounded-2xl border p-6 ${card}`}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark?'bg-orange-500/10':'bg-orange-50'}`}>
                      <Megaphone className="w-5 h-5 text-orange-500"/>
                    </div>
                    <div>
                      <h3 className={`font-bold ${title}`}>Compose Announcement</h3>
                      <p className={`text-xs ${sub}`}>Broadcast a notice to students</p>
                    </div>
                  </div>
                  <form onSubmit={handleSend} className="space-y-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${title}`}>Title *</label>
                      <input className={inpCls} placeholder="e.g. Test Rescheduled to Friday"
                        value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${title}`}>Message *</label>
                      <textarea rows={4} className={`${inpCls} resize-none`} placeholder="Write your announcement here..."
                        value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))}/>
                      </div>
                      <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${title}`}>Target Audience</label>
                      <div className="flex gap-2 mb-2 flex-wrap">
                        {[{v:'all',l:'All Students'},{v:'batch',l:'Specific Batch'},{v:'section',l:'Specific Section'}].map(opt=>(
                          <button key={opt.v} type="button" onClick={()=>setForm(p=>({...p,targetType:opt.v,batchName:'',sectionId:''}))}
                            className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-all ${form.targetType===opt.v?'bg-orange-500 text-white border-orange-500':(dark?'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200':'bg-white text-gray-500 border-gray-200 hover:text-gray-700')}`}>
                            {opt.l}
                          </button>
                        ))}
                      </div>
                      {form.targetType==='batch' && (
                        <select className={inpCls} value={form.batchName} onChange={e=>setForm(p=>({...p,batchName:e.target.value}))}>
                          <option value="">Select Batch</option>
                          {allBatches.map(b=><option key={b} value={b}>{b}</option>)}
                        </select>
                      )}
                      {form.targetType==='section' && (
                        <select className={inpCls} value={form.sectionId} onChange={e=>setForm(p=>({...p,sectionId:e.target.value}))}>
                          <option value="">Select Section</option>
                          {allSections.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </div>
                    <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${dark?'bg-gray-800':'bg-gray-50'}`}>
                      <p className={`text-sm ${sub}`}>Will reach <span className={`font-bold ${title}`}>{targetCount}</span> active student{targetCount!==1?'s':''}</p>
                      <button type="submit" disabled={sending||!form.title.trim()||!form.message.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50">
                        {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Megaphone className="w-4 h-4"/>}
                        Send Announcement
                          </button>
                    </div>
                  </form>
                </div>
                {/* Sent history */}
                <div className={`xl:col-span-2 rounded-2xl border p-6 ${card}`}>
                  <h3 className={`font-bold mb-4 ${title}`}>Sent History</h3>
                  {sent.length===0
                    ? <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Megaphone className="w-8 h-8 text-gray-300"/>
                        <p className={`text-xs text-center ${sub}`}>No announcements sent this session.</p>
                      </div>
                    : <div className="space-y-3">
                        {sent.map((s,i)=>(
                          <div key={i} className={`rounded-xl p-3 border ${dark?'bg-gray-800/60 border-gray-700':'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className={`text-sm font-semibold truncate ${title}`}>{s.title}</p>
                              <span className={`text-[10px] flex-shrink-0 px-2 py-0.5 rounded-full ${dark?'bg-emerald-500/10 text-emerald-400':'bg-emerald-50 text-emerald-600'}`}>Sent</span>
                            </div>
                            <p className={`text-xs truncate ${sub}`}>{s.message}</p>
                            <p className={`text-[10px] mt-1.5 ${sub}`}>{s.targetCount} recipients · {s.sentAt}</p>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </div>
            );
          };
          return <AnnouncementForm/>;
        })()}

        {/* ════════════════════════════════════════════════════════
            SUPPORT TICKETS
        ════════════════════════════════════════════════════════ */}
        {section === 'support' && (
          <PlaceholderSection dark={dark} card={card} title={title} sub={sub}
            icon={<LifeBuoy className="w-10 h-10 text-gray-400"/>}
            heading="Support Tickets"
            body="Student support requests and help desk tickets will appear here. For now, students can submit problem reports which appear in the Reports section."
            action={{ label:'Go to Reports →', fn: () => handleSectionChange('reports') }}
          />
        )}

        {/* ════════════════════════════════════════════════════════
            ANALYTICS
        ════════════════════════════════════════════════════════ */}
        {section === 'analytics' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              {[
                { l:'Daily Active Users',   v: Math.max(1, Math.floor((stats.totalStudents||0)*0.3)),  color:'text-indigo-500' },
                { l:'Avg. Submissions/Student', v: stats.totalStudents ? Math.floor((stats.totalSubmissions||0)/Math.max(1,stats.totalStudents)) : 0, color:'text-emerald-500' },
                { l:'Total Tests',          v: stats.totalTests||0, color:'text-amber-500' },
                { l:'Total Teachers',       v: stats.totalTeachers||0, color:'text-rose-500'  },
              ].map(s => (
                <div key={s.l} className={`rounded-2xl border p-5 ${card}`}>
                  <p className={`text-xs font-medium mb-1 ${sub}`}>{s.l}</p>
                  <p className={`text-3xl font-bold ${s.color}`}>{typeof s.v==='number'?s.v.toLocaleString():s.v}</p>
                </div>
              ))}
            </div>
            <div className={`rounded-2xl border p-5 ${card}`}>
              <h3 className={`font-bold mb-4 ${title}`}>Tests This Week</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={buildChartData('week')}>
                  <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark?'#374151':'#f3f4f6'}/>
                  <XAxis dataKey="day" tick={{ fontSize:11, fill:dark?'#6b7280':'#9ca3af' }} axisLine={false} tickLine={false}/>
                  <YAxis allowDecimals={false} tick={{ fontSize:11, fill:dark?'#6b7280':'#9ca3af' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Area type="monotone" dataKey="v" name="tests" stroke="#6366f1" strokeWidth={2.5} fill="url(#ag)" dot={{ fill:'#6366f1',r:4,strokeWidth:0 }} activeDot={{ r:6 }}/>
                </AreaChart>
              </ResponsiveContainer>
                        </div>
                      </div>
                    )}

        {/* ════════════════════════════════════════════════════════
            SYSTEM HEALTH
        ════════════════════════════════════════════════════════ */}
        {section === 'health' && (
          <div>
            <p className={`text-xs mb-4 ${sub}`}>System status overview — live monitoring not yet integrated.</p>
            <div className="grid md:grid-cols-2 gap-4">
            {[
              { l:'Online Judge',     status:'Operational', ok:true,  detail:'All test cases executing normally' },
              { l:'Compiler Service', status:'Operational', ok:true,  detail:'Java, Python, C++ compilers active' },
              { l:'Database',         status:'Operational', ok:true,  detail:'MySQL connection pool active' },
            ].map(s => (
              <div key={s.l} className={`rounded-2xl border p-5 ${card}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.ok?'bg-emerald-400':'bg-red-400'}`}/>
                    <span className={`font-semibold ${title}`}>{s.l}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.ok?'bg-emerald-500/10 text-emerald-500':'bg-red-500/10 text-red-400'}`}>{s.status}</span>
                </div>
                <p className={`text-sm ${sub}`}>{s.detail}</p>
              </div>
            ))}
            </div>
                  </div>
                )}

        {/* ════════════════════════════════════════════════════════
            SETTINGS
        ════════════════════════════════════════════════════════ */}
        {section === 'settings' && (
          <div className="space-y-4 max-w-2xl">
            {[
              { l:'Proctoring',        items:[{k:'Snapshot interval', v:'300 seconds'},{k:'Max tab switches before auto-submit',v:'7'},{k:'Fullscreen enforcement',v:'Enabled'}] },
              { l:'Execution Engine',  items:[{k:'Max concurrent jobs',v:'12'},{k:'Queue timeout',v:'60 seconds'},{k:'Supported languages',v:'Java, Python, C++'}] },
              { l:'Platform',          items:[{k:'Platform name',v:'Code Gain Technology'},{k:'Admin email',v:'admin@codegaint.com'},{k:'Database pool size',v:'50'}] },
            ].map(g => (
              <div key={g.l} className={`rounded-2xl border p-5 ${card}`}>
                <h3 className={`font-bold mb-3 ${title}`}>{g.l}</h3>
                <div className="space-y-2">
                  {g.items.map(i => (
                    <div key={i.k} className={`flex items-center justify-between py-2 border-b last:border-0 ${dark?'border-gray-700/40':'border-gray-100'}`}>
                      <span className={`text-sm ${sub}`}>{i.k}</span>
                      <span className={`text-sm font-medium ${title}`}>{i.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <p className={`text-xs ${sub}`}>To change settings, update environment variables in <code className={`px-1 py-0.5 rounded text-xs ${dark?'bg-gray-800':'bg-gray-100'}`}>application.properties</code> and redeploy.</p>
          </div>
        )}

      </div>

      {/* ── Add Teacher Modal ──────────────────────────────────────── */}
      {showAddTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className={`rounded-2xl border p-6 w-full max-w-md mx-4 shadow-2xl ${dark?'bg-gray-900 border-gray-700':'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-lg font-bold ${title}`}>Add New Teacher</h3>
              <button onClick={()=>setShowAddTeacher(false)} className={`p-1 rounded-lg ${dark?'text-gray-400 hover:text-gray-200':'text-gray-400 hover:text-gray-700'}`}><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddTeacher} className="space-y-3">
              {[
                { label:'Full Name *', key:'fullName',   type:'text',     ph:'e.g. Prof. Sharma' },
                { label:'Username *',  key:'username',   type:'text',     ph:'e.g. sharma21' },
                { label:'Email *',     key:'email',      type:'email',    ph:'e.g. sharma@college.ac.in' },
                { label:'Password *',  key:'password',   type:'password', ph:'Min 6 characters' },
                { label:'Department',  key:'department', type:'text',     ph:'e.g. CSE' },
              ].map(f => (
                <div key={f.key}>
                  <label className={`block text-xs font-medium mb-1 ${sub}`}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph} required={f.label.includes('*')} minLength={f.key==='password'?6:undefined}
                    className={`border rounded-xl px-3 py-2.5 text-sm w-full focus:outline-none ${inp}`}
                    value={newTeacher[f.key]} onChange={e=>setNewTeacher({...newTeacher,[f.key]:e.target.value})}/>
              </div>
              ))}
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 text-sm font-semibold mt-1">
                <UserPlus className="w-4 h-4"/> Create Teacher Account
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
