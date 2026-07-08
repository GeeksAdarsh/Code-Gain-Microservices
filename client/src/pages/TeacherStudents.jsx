import { useState, useEffect } from 'react';
import { batchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Users, ChevronDown, ChevronRight, BookOpen, Plus, X, UserX, UserCheck, Loader2, CheckSquare, Square, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_STUDENT = { systemId: '', fullName: '', email: '', department: '', section: '', track: '', mobile: '', program: '', batchName: '' };

export default function TeacherStudents() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const light = theme === 'light';

  const [sections, setSections]           = useState([]);
  const [students, setStudents]           = useState({});
  const [expanded, setExpanded]           = useState(null);
  const [tracks, setTracks]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showAdd, setShowAdd]             = useState(false);
  const [addForm, setAddForm]             = useState(EMPTY_STUDENT);
  const [saving, setSaving]               = useState(false);
  const [togglingId, setTogglingId]       = useState(null);
  const [selected, setSelected]           = useState({}); // { [sectionId]: Set<studentId> }
  const [bulkLoading, setBulkLoading]     = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [secRes, trackRes] = await Promise.all([
        batchAPI.getAllSections(),
        batchAPI.getTracks().catch(() => ({ data: [] })),
      ]);
      setSections(secRes.data || []);
      setTracks(trackRes.data || []);
    } catch { toast.error('Failed to load sections'); }
    finally { setLoading(false); }
  };

  const loadStudents = async (sectionId) => {
    try {
      const res = await batchAPI.getStudents(sectionId);
      setStudents(prev => ({ ...prev, [sectionId]: res.data }));
    } catch { toast.error('Failed to load students'); }
  };

  const toggleSection = (sectionId) => {
    if (expanded === sectionId) { setExpanded(null); return; }
    setExpanded(sectionId);
    if (!students[sectionId]) loadStudents(sectionId);
  };

  const openAdd = (sec) => {
    setAddForm({ ...EMPTY_STUDENT, batchName: sec.batchName || '', section: sec.name });
    setShowAdd(true);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await batchAPI.addStudent(addForm);
      toast.success(`Student added! Login: ${res.data.loginEmail} / ${res.data.loginPassword}`);
      setShowAdd(false);
      setAddForm(EMPTY_STUDENT);
      // Reload students for the open section
      const sec = sections.find(s => s.name === addForm.section);
      if (sec) loadStudents(sec.id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add student');
    } finally { setSaving(false); }
  };

  const handleToggle = async (student, sectionId) => {
    setTogglingId(student.id);
    try {
      await batchAPI.toggleDebar(student.id, !student.isDebarred);
      toast.success(student.isDebarred ? 'Student enabled' : 'Student disabled');
      loadStudents(sectionId);
    } catch { toast.error('Failed to update student status'); }
    finally { setTogglingId(null); }
  };

  const toggleSelect = (sectionId, studentId) => {
    setSelected(prev => {
      const set = new Set(prev[sectionId] || []);
      set.has(studentId) ? set.delete(studentId) : set.add(studentId);
      return { ...prev, [sectionId]: set };
    });
  };
  const toggleSelectAll = (sectionId, studs) => {
    setSelected(prev => {
      const cur = prev[sectionId] || new Set();
      const all = studs.map(s=>s.id);
      const anyUnchecked = all.some(id=>!cur.has(id));
      return { ...prev, [sectionId]: anyUnchecked ? new Set(all) : new Set() };
    });
  };
  const handleBulkAction = async (sectionId, action) => {
    const ids = [...(selected[sectionId] || new Set())];
    if (!ids.length) return;
    setBulkLoading(true);
    try {
      const studs = students[sectionId] || [];
      await Promise.all(ids.map(id => {
        const s = studs.find(st=>st.id===id);
        if (!s) return Promise.resolve();
        const shouldDebar = action === 'disable';
        if (s.isDebarred === shouldDebar) return Promise.resolve();
        return batchAPI.toggleDebar(id, shouldDebar);
      }));
      toast.success(`${ids.length} student${ids.length!==1?'s':''} ${action==='disable'?'disabled':'enabled'}`);
      setSelected(prev => ({ ...prev, [sectionId]: new Set() }));
      loadStudents(sectionId);
    } catch { toast.error('Some actions failed'); }
    finally { setBulkLoading(false); }
  };

  /* ── styling ── */
  const card   = `rounded-2xl border ${light ? 'bg-white border-gray-200 shadow-sm' : 'bg-[#1e1e1e] border-[#3e3e3e]'}`;
  const hdr    = light ? 'text-gray-800' : 'text-white';
  const sub    = light ? 'text-gray-400' : 'text-slate-500';
  const rowHov = light ? 'hover:bg-gray-50' : 'hover:bg-white/[0.03]';
  const divCls = light ? 'divide-gray-100' : 'divide-[#282828]';
  const bdr    = light ? 'border-gray-100' : 'border-[#282828]';
  const chip   = light ? 'bg-gray-100 text-gray-500' : 'bg-[#282828] text-slate-400';
  const inputCls = `w-full rounded-xl px-3 py-2 text-sm border outline-none focus:ring-2 focus:ring-[#ffa116] transition-all ${light ? 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400' : 'bg-[#282828] border-[#3e3e3e] text-white placeholder-slate-500'}`;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#ffa116] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalStudents = sections.reduce((a, s) => a + (s.studentCount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className={`text-2xl font-bold ${hdr}`}>My Students</h1>
          <p className={`text-sm mt-0.5 ${sub}`}>
            {sections.length} section{sections.length !== 1 ? 's' : ''} assigned · {totalStudents} students total
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {[
          { label: 'My Sections', val: sections.length, icon: <BookOpen className="w-5 h-5" />, bg: 'bg-violet-500/15', ic: 'text-violet-400' },
          { label: 'Total Students', val: totalStudents, icon: <Users className="w-5 h-5" />, bg: 'bg-blue-500/15', ic: 'text-blue-400' },
          { label: 'Active Students', val: sections.reduce((a, s) => a + (s.studentCount || 0), 0), icon: <UserCheck className="w-5 h-5" />, bg: 'bg-emerald-500/15', ic: 'text-[#00b8a3]' },
        ].map((s, i) => (
          <div key={i} className={`${card} p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center ${s.ic}`}>{s.icon}</div>
            <div>
              <p className={`text-xl font-bold ${hdr}`}>{s.val}</p>
              <p className={`text-xs ${sub}`}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* No sections assigned */}
      {sections.length === 0 && (
        <div className={`${card} py-16 text-center`}>
          <BookOpen className={`w-10 h-10 mx-auto mb-3 ${light ? 'text-gray-300' : 'text-slate-700'}`} />
          <p className={`text-sm ${sub}`}>No sections assigned to you yet.</p>
          <p className={`text-xs mt-1 ${light ? 'text-gray-300' : 'text-slate-600'}`}>Contact an admin to be assigned to a section.</p>
        </div>
      )}

      {/* Sections list */}
      <div className="space-y-3">
        {sections.map(section => (
          <div key={section.id} className={`${card} overflow-hidden`}>
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 text-left ${rowHov} transition-colors`}>
              {expanded === section.id
                ? <ChevronDown className={`w-5 h-5 flex-shrink-0 ${sub}`} />
                : <ChevronRight className={`w-5 h-5 flex-shrink-0 ${sub}`} />}
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0`}>
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold ${hdr}`}>
                  Section {section.name}
                  {section.batchName && <span className={`ml-2 text-xs font-normal ${sub}`}>· {section.batchName}</span>}
                </p>
                <p className={`text-xs ${sub}`}>{section.studentCount || 0} students</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); openAdd(section); }}
                className="flex items-center gap-1.5 text-xs font-medium text-[#ffa116] hover:opacity-80 px-3 py-1.5 rounded-lg border border-[#ffa116]/30 hover:bg-[#ffa116]/5 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Student
              </button>
            </button>

            {/* Students table */}
            {expanded === section.id && (
              <div className={`border-t ${bdr}`}>
                {!students[section.id] ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className={`w-5 h-5 animate-spin ${sub}`} />
                  </div>
                ) : students[section.id].length === 0 ? (
                  <div className="py-10 text-center">
                    <Users className={`w-7 h-7 mx-auto mb-2 ${light ? 'text-gray-300' : 'text-slate-700'}`} />
                    <p className={`text-sm ${sub}`}>No students yet</p>
                    <button onClick={() => openAdd(section)}
                      className="text-xs text-[#ffa116] hover:opacity-80 mt-1">
                      Add first student →
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[620px]">
                      <thead>
                        <tr className={`text-[11px] uppercase font-medium border-b ${bdr} ${sub}`}>
                          <th className="py-2.5 px-5 w-10">
                            <button onClick={()=>toggleSelectAll(section.id, students[section.id])}
                              className="flex items-center justify-center">
                              {(students[section.id]||[]).length > 0 && (selected[section.id]?.size||0) === (students[section.id]||[]).length
                                ? <CheckSquare className="w-4 h-4 text-orange-400"/>
                                : <Square className="w-4 h-4 text-gray-400"/>}
                            </button>
                          </th>
                          <th className="text-left py-2.5 px-3">Name</th>
                          <th className="text-left py-2.5 px-4">System ID</th>
                          <th className="text-left py-2.5 px-4 hidden md:table-cell">Track</th>
                          <th className="text-left py-2.5 px-4 hidden lg:table-cell">Email</th>
                          <th className="text-center py-2.5 px-4 w-28">Status</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${divCls}`}>
                        {/* Bulk action bar */}
                        {(selected[section.id]?.size||0) > 0 && (
                          <tr>
                            <td colSpan={6} className={`py-2.5 px-5 ${light?'bg-orange-50':'bg-orange-500/5'}`}>
                              <div className="flex items-center gap-3">
                                <span className={`text-xs font-semibold ${light?'text-orange-700':'text-orange-400'}`}>
                                  {selected[section.id].size} selected
                                </span>
                                <button disabled={bulkLoading} onClick={()=>handleBulkAction(section.id,'enable')}
                                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-semibold transition-all disabled:opacity-50">
                                  <UserCheck className="w-3 h-3"/> Enable All
                                </button>
                                <button disabled={bulkLoading} onClick={()=>handleBulkAction(section.id,'disable')}
                                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-semibold transition-all disabled:opacity-50">
                                  <UserX className="w-3 h-3"/> Disable All
                                </button>
                                <button onClick={()=>setSelected(p=>({...p,[section.id]:new Set()}))}
                                  className={`text-[11px] px-2 py-1 rounded-lg ${light?'text-gray-500 hover:bg-gray-100':'text-slate-500 hover:bg-white/10'}`}>
                                  Clear
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                        {students[section.id].map(student => (
                          <tr key={student.id} className={`${rowHov} transition-colors ${selected[section.id]?.has(student.id)?(light?'bg-orange-50/50':'bg-orange-500/5'):''}`}>
                            <td className="py-2.5 px-5">
                              <button onClick={()=>toggleSelect(section.id, student.id)} className="flex items-center justify-center">
                                {selected[section.id]?.has(student.id)
                                  ? <CheckSquare className="w-4 h-4 text-orange-400"/>
                                  : <Square className="w-4 h-4 text-gray-400"/>}
                              </button>
                            </td>
                            <td className={`py-2.5 px-3 text-sm font-medium ${hdr} whitespace-nowrap`}>{student.fullName}</td>
                            <td className={`py-2.5 px-4 text-xs font-mono ${sub}`}>{student.systemId}</td>
                            <td className={`py-2.5 px-4 text-xs ${sub} hidden md:table-cell`}>{student.track || '—'}</td>
                            <td className={`py-2.5 px-4 text-xs ${sub} hidden lg:table-cell break-all`}>{student.email}</td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                onClick={() => handleToggle(student, section.id)}
                                disabled={togglingId === student.id}
                                title={student.isDebarred ? 'Click to Enable student' : 'Click to Disable student (proctoring issue)'}
                                className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-semibold border transition-all disabled:opacity-50 ${
                                  student.isDebarred
                                    ? 'bg-red-500/10 text-[#ef4743] border-red-500/20 hover:bg-red-500/20'
                                    : 'bg-emerald-500/10 text-[#00b8a3] border-[rgba(0,184,163,0.2)] hover:bg-emerald-500/20'
                                }`}>
                                {togglingId === student.id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : student.isDebarred
                                    ? <><UserX className="w-3 h-3" /> Disabled</>
                                    : <><UserCheck className="w-3 h-3" /> Active</>
                                }
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Student Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowAdd(false)}>
          <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl ${light ? 'bg-white border border-gray-200' : 'bg-[#1e1e1e] border border-[#3e3e3e]'}`}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-base font-bold ${hdr}`}>Add Student</h3>
              <button onClick={() => setShowAdd(false)} className={`p-1 rounded-lg ${light ? 'text-gray-400 hover:bg-gray-100' : 'text-slate-500 hover:bg-white/10'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-medium mb-1 ${sub}`}>System ID *</label>
                <input required className={inputCls} placeholder="2023284369"
                  value={addForm.systemId} onChange={e => setAddForm({ ...addForm, systemId: e.target.value })} />
              </div>
              <div>
                <label className={`block text-[11px] font-medium mb-1 ${sub}`}>Full Name *</label>
                <input required className={inputCls} placeholder="Rajeev Ranjan"
                  value={addForm.fullName} onChange={e => setAddForm({ ...addForm, fullName: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className={`block text-[11px] font-medium mb-1 ${sub}`}>Email</label>
                <input className={inputCls} placeholder="2023284369@ug.sharda.ac.in"
                  value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} />
              </div>
              <div>
                <label className={`block text-[11px] font-medium mb-1 ${sub}`}>Department</label>
                <input className={inputCls} placeholder="CSE"
                  value={addForm.department} onChange={e => setAddForm({ ...addForm, department: e.target.value })} />
              </div>
              <div>
                <label className={`block text-[11px] font-medium mb-1 ${sub}`}>Section</label>
                <input className={inputCls} placeholder="M"
                  value={addForm.section} onChange={e => setAddForm({ ...addForm, section: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className={`block text-[11px] font-medium mb-1 ${sub}`}>Track</label>
                <input list="track-opts" className={inputCls} placeholder="Advance DSA + System Design"
                  value={addForm.track} onChange={e => setAddForm({ ...addForm, track: e.target.value })} />
                <datalist id="track-opts">{tracks.map(t => <option key={t} value={t} />)}</datalist>
              </div>
              <div>
                <label className={`block text-[11px] font-medium mb-1 ${sub}`}>Mobile</label>
                <input className={inputCls} placeholder="9310650163"
                  value={addForm.mobile} onChange={e => setAddForm({ ...addForm, mobile: e.target.value })} />
              </div>
              <div>
                <label className={`block text-[11px] font-medium mb-1 ${sub}`}>Program</label>
                <input className={inputCls} placeholder="B.Tech"
                  value={addForm.program} onChange={e => setAddForm({ ...addForm, program: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className={`block text-[11px] font-medium mb-1 ${sub}`}>Batch Name</label>
                <input className={inputCls} placeholder="Code-Campus-DemoBatcher"
                  value={addForm.batchName} onChange={e => setAddForm({ ...addForm, batchName: e.target.value })} />
              </div>
              <p className={`col-span-2 text-[11px] ${sub}`}>
                Login will be the <strong>email</strong> with password = <strong>System ID</strong>.
              </p>
              <button type="submit" disabled={saving}
                className="col-span-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: '#ffa116' }}>
                {saving ? 'Adding...' : 'Add Student'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
