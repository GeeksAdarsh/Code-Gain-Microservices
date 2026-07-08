import { useState, useEffect } from 'react';
import { batchAPI, adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronDown, ChevronRight, Upload, Download, UserX, UserCheck, GraduationCap, BookOpen, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout';

const DEMO_BATCH = 'Code-Campus-DemoBatcher';
const EMPTY_STUDENT = { systemId: '', fullName: '', email: '', department: '', section: '', track: '', mobile: '', program: '', batchName: DEMO_BATCH };
const EMPTY_BATCH = { name: '', startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 4, program: 'B.Tech' };

export default function BatchManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState({});
  const [students, setStudents] = useState({});
  const [expandedBatch, setExpandedBatch] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importBatch, setImportBatch] = useState(DEMO_BATCH);
  const [tracks, setTracks] = useState([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_STUDENT);
  const [savingStudent, setSavingStudent] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [batchForm, setBatchForm] = useState(EMPTY_BATCH);
  const [savingBatch, setSavingBatch] = useState(false);

  useEffect(() => { loadData(); loadTracks(); }, []);

  const loadTracks = async () => {
    try { const res = await batchAPI.getTracks(); setTracks(res.data || []); } catch (e) { }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setSavingStudent(true);
    try {
      const res = await batchAPI.addStudent(addForm);
      toast.success(`Student added. Login: ${res.data.loginEmail} / ${res.data.loginPassword}`);
      const { batchName, section } = addForm;
      setShowAddStudent(false);
      setAddForm(EMPTY_STUDENT);
      revealLocation(batchName, section);
      loadTracks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add student');
    } finally { setSavingStudent(false); }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    setSavingBatch(true);
    try {
      await batchAPI.createBatch({
        name: batchForm.name,
        startYear: Number(batchForm.startYear),
        endYear: Number(batchForm.endYear),
        program: batchForm.program,
      });
      toast.success('Batch created');
      setShowAddBatch(false);
      setBatchForm(EMPTY_BATCH);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create batch');
    } finally { setSavingBatch(false); }
  };

  const handleAddSection = async (batchId) => {
    const name = window.prompt('New section name (e.g. A, B, M):');
    if (!name || !name.trim()) return;
    try {
      await batchAPI.createSection(batchId, { name: name.trim() });
      toast.success('Section created');
      loadSections(batchId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create section');
    }
  };

  // Contextual single-student add: opens the form pre-filled (and locked) to a batch + section.
  const openAddStudentInSection = (batchName, sectionName) => {
    setAddForm({ ...EMPTY_STUDENT, batchName, section: sectionName });
    setShowAddStudent(true);
  };

  const handleDeleteBatch = async (batch) => {
    if (!window.confirm(`Delete batch "${batch.name}" and ALL its students/sections? This cannot be undone.`)) return;
    try {
      const res = await batchAPI.deleteBatch(batch.id);
      toast.success(res.data.message || 'Batch deleted');
      if (expandedBatch === batch.id) setExpandedBatch(null);
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete batch'); }
  };

  const handleDeleteSection = async (section, batchId) => {
    if (!window.confirm(`Delete section "${section.name}" and ALL its students? This cannot be undone.`)) return;
    try {
      const res = await batchAPI.deleteSection(section.id);
      toast.success(res.data.message || 'Section deleted');
      loadSections(batchId);
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete section'); }
  };

  const handleDeleteStudent = async (student, sectionId) => {
    if (!window.confirm(`Delete student "${student.fullName}"? This cannot be undone.`)) return;
    try {
      await batchAPI.deleteStudent(student.id);
      toast.success('Student deleted');
      loadStudents(sectionId);
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete student'); }
  };

  const loadData = async () => {
    try {
      const batchRes = await batchAPI.getBatches();
      setBatches(batchRes.data);
      try {
        const teacherRes = await adminAPI.getUsers();
        setTeachers((teacherRes.data || []).filter(u => u.role === 'TEACHER'));
      } catch (e) { }
    } catch (err) { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const loadSections = async (batchId) => {
    try {
      const res = await batchAPI.getSections(batchId);
      setSections(prev => ({ ...prev, [batchId]: res.data }));
    } catch (err) { toast.error('Failed to load sections'); }
  };

  const loadStudents = async (sectionId) => {
    try {
      const res = await batchAPI.getStudents(sectionId);
      setStudents(prev => ({ ...prev, [sectionId]: res.data }));
    } catch (err) { toast.error('Failed to load students'); }
  };

  // Refresh data, then open the batch (and the section, if given) so a newly
  // added/imported student is immediately visible.
  const revealLocation = async (batchName, sectionName) => {
    try {
      const batchRes = await batchAPI.getBatches();
      setBatches(batchRes.data);
      const batch = batchRes.data.find(b => b.name === batchName);
      if (!batch) return;
      setExpandedBatch(batch.id);
      const secRes = await batchAPI.getSections(batch.id);
      setSections(prev => ({ ...prev, [batch.id]: secRes.data }));
      if (sectionName) {
        const sec = secRes.data.find(s => s.name === sectionName);
        if (sec) {
          setExpandedSection(sec.id);
          const stuRes = await batchAPI.getStudents(sec.id);
          setStudents(prev => ({ ...prev, [sec.id]: stuRes.data }));
        }
      }
    } catch (e) { loadData(); }
  };

  const toggleBatch = (batchId) => {
    if (expandedBatch === batchId) { setExpandedBatch(null); return; }
    setExpandedBatch(batchId);
    if (!sections[batchId]) loadSections(batchId);
  };

  const toggleSection = (sectionId) => {
    if (expandedSection === sectionId) { setExpandedSection(null); return; }
    setExpandedSection(sectionId);
    if (!students[sectionId]) loadStudents(sectionId);
  };

  const handleAddTeacher = async (sectionId, teacherId, batchId) => {
    if (!teacherId) return;
    try {
      await batchAPI.addTeacher(sectionId, Number(teacherId));
      toast.success('Teacher added');
      loadSections(batchId || expandedBatch);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add teacher'); }
  };

  const handleRemoveTeacher = async (sectionId, teacherId, batchId) => {
    try {
      await batchAPI.removeTeacher(sectionId, teacherId);
      toast.success('Teacher removed');
      loadSections(batchId || expandedBatch);
    } catch (err) { toast.error('Failed to remove teacher'); }
  };

  const handleToggleDebar = async (studentId, isDebarred, sectionId) => {
    try {
      await batchAPI.toggleDebar(studentId, !isDebarred);
      toast.success(isDebarred ? 'Student un-debarred' : 'Student debarred');
      loadStudents(sectionId);
    } catch (err) { toast.error('Failed to update'); }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await batchAPI.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'student_import_template.csv'; a.click();
    } catch (err) { toast.error('Failed to download'); }
  };

  const handleImportCsv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const res = await batchAPI.importCsv(file, importBatch);
      toast.success(`Imported: ${res.data.imported}, Skipped: ${res.data.skipped}, Errors: ${res.data.errors}`);
      if (res.data.errors > 0 && res.data.errorDetails) {
        console.warn('Import row errors:', res.data.errorDetails);
        toast(`${res.data.errors} rows had issues — see console for details`, { icon: '⚠️' });
      }
      revealLocation(importBatch); loadTracks();
    } catch (err) { toast.error('Import failed: ' + (err.response?.data?.error || err.message)); }
    finally { setImporting(false); e.target.value = ''; }
  };

  if (loading) return (
    <AdminLayout onSectionChange={(sec) => navigate('/admin', { state: { section: sec } })}>
      <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin"></div></div>
    </AdminLayout>
  );

  return (
    <AdminLayout onSectionChange={(sec) => navigate('/admin', { state: { section: sec } })}>
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Batch &amp; Section Management</h1>
        <p className="text-gray-500 text-sm">Manage batches, sections, teacher assignments, and students</p>
      </div>

      {/* Bulk import panel: pick a batch first, then upload the CSV. */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="lg:w-80">
            <label className="block text-xs text-slate-400 mb-1">1. Choose batch to import into</label>
            <select value={importBatch} onChange={(e) => setImportBatch(e.target.value)} className="input-field py-2 w-full">
              {batches.length === 0 && <option value="">No batches yet — create one first</option>}
              {batches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 lg:ml-auto">
            <label className={`btn-primary text-sm py-2 px-4 flex items-center gap-2 cursor-pointer ${importing || !importBatch ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload className="w-4 h-4" /> {importing ? 'Importing...' : '2. Import CSV'}
              <input type="file" accept=".csv" onChange={handleImportCsv} className="hidden" disabled={importing || !importBatch} />
            </label>
            <button onClick={handleDownloadTemplate} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
              <Download className="w-4 h-4" /> CSV Template
            </button>
            {isAdmin && (
              <button onClick={() => { setBatchForm(EMPTY_BATCH); setShowAddBatch(true); }}
                className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Batch
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          CSV columns: <span className="font-mono">SystemID, Name, Email, Department, Section, Track, Mobile, Program</span>.
          To add one student, open a batch → section below and use <b>Add Student</b>.
        </p>
      </div>

      {showAddBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAddBatch(false)}>
          <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Batch</h3>
              <button onClick={() => setShowAddBatch(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddBatch} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Batch Name *</label>
                <input required value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} className="input-field" placeholder="Code-Campus-DemoBatcher" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-slate-400 mb-1">Start Year *</label>
                <input required type="number" value={batchForm.startYear} onChange={(e) => setBatchForm({ ...batchForm, startYear: e.target.value })} className="input-field" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-slate-400 mb-1">End Year *</label>
                <input required type="number" value={batchForm.endYear} onChange={(e) => setBatchForm({ ...batchForm, endYear: e.target.value })} className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Program</label>
                <input value={batchForm.program} onChange={(e) => setBatchForm({ ...batchForm, program: e.target.value })} className="input-field" placeholder="B.Tech" />
              </div>
              <button type="submit" disabled={savingBatch} className="col-span-2 btn-primary py-2 mt-1">
                {savingBatch ? 'Saving...' : 'Create Batch'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAddStudent(false)}>
          <div className="glass-card p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Student</h3>
              <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddStudent} className="grid grid-cols-2 gap-3">
              <div className="col-span-1">
                <label className="block text-xs text-slate-400 mb-1">System ID *</label>
                <input required value={addForm.systemId} onChange={(e) => setAddForm({ ...addForm, systemId: e.target.value })} className="input-field" placeholder="2023284369" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-slate-400 mb-1">Full Name *</label>
                <input required value={addForm.fullName} onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })} className="input-field" placeholder="Rajeev Ranjan" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Email (login)</label>
                <input value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="input-field" placeholder="2023284369.rajeev@ug.sharda.ac.in" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-slate-400 mb-1">Department</label>
                <input value={addForm.department} onChange={(e) => setAddForm({ ...addForm, department: e.target.value })} className="input-field" placeholder="CSE" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-slate-400 mb-1">Section</label>
                <input value={addForm.section} onChange={(e) => setAddForm({ ...addForm, section: e.target.value })} className="input-field" placeholder="M" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Track</label>
                <input list="track-options" value={addForm.track} onChange={(e) => setAddForm({ ...addForm, track: e.target.value })} className="input-field" placeholder="Advance DSA + System Design" />
                <datalist id="track-options">{tracks.map(t => <option key={t} value={t} />)}</datalist>
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-slate-400 mb-1">Mobile</label>
                <input value={addForm.mobile} onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value })} className="input-field" placeholder="9310650163" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs text-slate-400 mb-1">Program</label>
                <input value={addForm.program} onChange={(e) => setAddForm({ ...addForm, program: e.target.value })} className="input-field" placeholder="B.Tech" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Batch</label>
                <input value={addForm.batchName} onChange={(e) => setAddForm({ ...addForm, batchName: e.target.value })} className="input-field" />
              </div>
              <p className="col-span-2 text-xs text-slate-500">Login will be the <b>email</b> with password = <b>System ID</b>.</p>
              <button type="submit" disabled={savingStudent} className="col-span-2 btn-primary py-2 mt-1">
                {savingStudent ? 'Saving...' : 'Add Student'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-white">{batches.length}</p>
          <p className="text-xs text-slate-500">Batches</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-white">{batches.reduce((a, b) => a + b.sectionCount, 0)}</p>
          <p className="text-xs text-slate-500">Sections</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-white">{batches.reduce((a, b) => a + b.studentCount, 0)}</p>
          <p className="text-xs text-slate-500">Students</p>
        </div>
      </div>

      {/* Batches */}
      {batches.map(batch => (
        <div key={batch.id} className="glass-card overflow-hidden mb-4">
          <div className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
            <button onClick={() => toggleBatch(batch.id)} className="flex items-center gap-3 flex-1 text-left">
              {expandedBatch === batch.id ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <div className="text-left">
                <h3 className="text-white font-semibold">{batch.name}</h3>
                <p className="text-xs text-slate-500">{batch.program} · {batch.sectionCount} sections · {batch.studentCount} students</p>
              </div>
            </button>
            {isAdmin && (
              <button onClick={() => handleDeleteBatch(batch)} title="Delete batch"
                className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {expandedBatch === batch.id && sections[batch.id] && (
            <div className="border-t border-slate-800">
              {isAdmin && (
                <div className="px-8 py-2 flex justify-end">
                  <button onClick={() => handleAddSection(batch.id)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Section
                  </button>
                </div>
              )}
              {sections[batch.id].map(section => (
                <div key={section.id} className="border-b border-slate-800/50 last:border-b-0">
                  <div className="w-full px-8 py-3 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                    <button onClick={() => toggleSection(section.id)} className="flex items-center gap-3 flex-1 text-left">
                      {expandedSection === section.id ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-white font-medium">Section {section.name}</span>
                      <span className="text-xs text-slate-500">({section.studentCount} students)</span>
                    </button>
                    <div className="flex items-center gap-2 flex-wrap justify-end max-w-[60%]">
                      {(section.teachers || []).map(t => (
                        <span key={t.id} className="inline-flex items-center gap-1 text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 rounded-full pl-2.5 pr-1.5 py-0.5">
                          {t.name}
                          {isAdmin && (
                            <button onClick={() => handleRemoveTeacher(section.id, t.id, batch.id)} title="Remove teacher"
                              className="hover:text-red-400">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                      {(!section.teachers || section.teachers.length === 0) && !isAdmin && (
                        <span className="text-xs text-slate-500">No teacher</span>
                      )}
                      {isAdmin && (
                        <select
                          value=""
                          onChange={(e) => { const v = e.target.value; e.target.value = ''; handleAddTeacher(section.id, v, batch.id); }}
                          className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1"
                        >
                          <option value="">+ Add teacher</option>
                          {teachers
                            .filter(t => !(section.teachers || []).some(st => st.id === t.id))
                            .map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </select>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleDeleteSection(section, batch.id)} title="Delete section"
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {expandedSection === section.id && students[section.id] && (
                    <div className="bg-slate-900/30 overflow-x-auto">
                      <div className="px-6 py-2 flex justify-end">
                        <button onClick={() => openAddStudentInSection(batch.name, section.name)}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add Student to Section {section.name}
                        </button>
                      </div>
                      <table className="w-full min-w-[700px]">
                        <thead>
                          <tr className="text-[11px] text-slate-500 uppercase">
                            <th className="text-left py-2 px-6 w-[180px]">Name</th>
                            <th className="text-left py-2 px-4 w-[110px]">System ID</th>
                            <th className="text-left py-2 px-4 w-[200px]">Track</th>
                            <th className="text-left py-2 px-4">Email</th>
                            <th className="text-center py-2 px-4 w-[80px]">Status</th>
                            {isAdmin && <th className="text-center py-2 px-4 w-[60px]">Delete</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {students[section.id].map(student => (
                            <tr key={student.id} className="border-t border-slate-800/30 hover:bg-slate-800/20">
                              <td className="py-2 px-6 text-sm text-white whitespace-nowrap">{student.fullName}</td>
                              <td className="py-2 px-4 text-xs text-slate-400 font-mono">{student.systemId}</td>
                              <td className="py-2 px-4 text-xs text-slate-400">{student.track || '—'}</td>
                              <td className="py-2 px-4 text-xs text-slate-300 break-all">{student.email}</td>
                              <td className="py-2 px-4 text-center">
                                <button onClick={() => handleToggleDebar(student.id, student.isDebarred, section.id)}
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                    student.isDebarred
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                  }`}>
                                  {student.isDebarred ? 'Debarred' : 'Active'}
                                </button>
                              </td>
                              {isAdmin && (
                                <td className="py-2 px-4 text-center">
                                  <button onClick={() => handleDeleteStudent(student, section.id)} title="Delete student"
                                    className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
    </AdminLayout>
  );
}
