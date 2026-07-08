import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionAPI, testAPI, batchAPI, mcqAPI } from '../services/api';
import { Save, ArrowLeft, Calendar, Clock, Plus, X, Shield, Camera, Maximize, FileSearch, Briefcase, ChevronDown, ChevronRight, UserX, Users, Upload, Download, Code2, ListChecks, LayoutTemplate, Copy, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CreateTest() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditing = Boolean(editId);
  const { user } = useAuth();
  const isCompany = user?.role === 'COMPANY';
  const [loading, setLoading] = useState(false);
  const [shareModal, setShareModal] = useState(null); // { testId, title }
  const [questions, setQuestions] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [scopeMode, setScopeMode] = useState('all'); // 'all' | 'my_sections' | 'specific'
  const [selectedSections, setSelectedSections] = useState([]);
  const [restrictToSections, setRestrictToSections] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [sectionStudents, setSectionStudents] = useState({});
  const [excludedStudents, setExcludedStudents] = useState(new Set());
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [originalMcqSnapshot, setOriginalMcqSnapshot] = useState(null);
  const [showMcqBuilder, setShowMcqBuilder] = useState(false);
  // contentType: 'both' | 'coding' | 'mcq'
  const [contentType, setContentType] = useState('both');
  // per-question marks: { [questionId]: number }
  const [questionMarks, setQuestionMarks] = useState({});

  // Parse a CSV string into rows of fields, supporting quoted fields with commas/newlines.
  const parseCsv = (text) => {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
        } else { field += c; }
      } else if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.some(v => v.trim() !== '')) rows.push(row);
        row = [];
      } else { field += c; }
    }
    if (field !== '' || row.length) { row.push(field); if (row.some(v => v.trim() !== '')) rows.push(row); }
    return rows;
  };

  const downloadMcqTemplate = () => {
    const template = 'Question,OptionA,OptionB,OptionC,OptionD,CorrectOption,Marks,Explanation\n' +
      '"What is the time complexity of binary search?",O(n),O(log n),O(n^2),O(1),B,1,"Each step halves the search space"\n' +
      '"Which keyword defines a constant in Java?",var,let,final,const,C,1,\n';
    const url = window.URL.createObjectURL(new Blob([template], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'mcq_import_template.csv'; a.click();
  };

  const handleMcqCsv = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCsv(String(ev.target.result));
        if (rows.length < 2) { toast.error('CSV has no data rows'); return; }
        const header = rows[0].map(h => h.trim().toLowerCase());
        if (!header.includes('question')) { toast.error('Invalid CSV. Use the MCQ template.'); return; }
        const idx = (name) => header.indexOf(name);
        const parsed = [];
        let bad = 0;
        for (let r = 1; r < rows.length; r++) {
          const cols = rows[r];
          const question = (cols[idx('question')] || '').trim();
          const correct = (cols[idx('correctoption')] || '').trim().toUpperCase();
          if (!question || !['A', 'B', 'C', 'D'].includes(correct)) { bad++; continue; }
          parsed.push({
            question,
            optionA: (cols[idx('optiona')] || '').trim(),
            optionB: (cols[idx('optionb')] || '').trim(),
            optionC: (cols[idx('optionc')] || '').trim(),
            optionD: (cols[idx('optiond')] || '').trim(),
            correctOption: correct,
            explanation: idx('explanation') >= 0 ? (cols[idx('explanation')] || '').trim() : '',
            marks: parseInt(cols[idx('marks')]) || 1,
          });
        }
        if (parsed.length === 0) { toast.error('No valid MCQ rows found'); return; }
        setMcqQuestions(prev => [...prev, ...parsed]);
        toast.success(`Added ${parsed.length} MCQs${bad ? `, skipped ${bad} invalid` : ''}`);
      } catch (err) {
        toast.error('Failed to parse CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  const [qSearch, setQSearch] = useState('');
  const [qDiff, setQDiff] = useState('ALL');
  const [qTag, setQTag] = useState(null);
  const [qShowAllTags, setQShowAllTags] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '',
    startTime: '', endTime: '',
    durationMinutes: 60,
    joinWindowMinutes: 20,
    isActive: true, isPublished: false,
    questionIds: [], accessCode: '',
    // Proctoring
    proctoringEnabled: false,
    cameraRequired: false,
    fullscreenRequired: false,
    maxTabSwitches: 7,
    snapshotIntervalSeconds: 300,
    plagiarismCheckEnabled: false,
    // Enterprise
    testType: isCompany ? 'HIRING' : 'COLLEGE',
    jobRole: '',
    experienceLevel: '',
  });

  useEffect(() => {
    loadQuestions();
    batchAPI.getAllSections().then(res => setAllSections(res.data)).catch(() => {});
  }, []);

  // Edit mode: load the existing test (settings + questions + MCQs) and prefill.
  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const { data: t } = await testAPI.getById(editId);
        setForm(prev => ({
          ...prev,
          title: t.title || '',
          description: t.description || '',
          startTime: t.startTime ? t.startTime.slice(0, 16) : '',
          endTime: t.endTime ? t.endTime.slice(0, 16) : '',
          durationMinutes: t.durationMinutes || 60,
          joinWindowMinutes: t.joinWindowMinutes || 20,
          isActive: t.active ?? t.isActive ?? true,
          isPublished: t.published ?? t.isPublished ?? false,
          questionIds: t.questionIds || [],
          accessCode: t.accessCode || '',
          proctoringEnabled: t.proctoringEnabled || false,
          cameraRequired: t.cameraRequired || false,
          fullscreenRequired: t.fullscreenRequired || false,
          maxTabSwitches: t.maxTabSwitches || 7,
          snapshotIntervalSeconds: t.snapshotIntervalSeconds || 300,
          plagiarismCheckEnabled: t.plagiarismCheckEnabled || false,
          testType: t.testType || (isCompany ? 'HIRING' : 'COLLEGE'),
          jobRole: t.jobRole || '',
          experienceLevel: t.experienceLevel || '',
        }));
        if (t.restrictToSections) setRestrictToSections(true);
        if (t.sectionIds) setSelectedSections(t.sectionIds);
        // Determine scopeMode from saved data
        if (!t.restrictToSections) setScopeMode('all');
        else if (t.sectionIds && t.sectionIds.length > 0) setScopeMode('specific');
        else setScopeMode('my_sections');
        const { data: mcqs } = await mcqAPI.getQuestions(editId, true);
        const hasMcqs = Array.isArray(mcqs) && mcqs.length > 0;
        const hasCoding = (t.questionIds || []).length > 0;
        setContentType(hasMcqs && hasCoding ? 'both' : hasMcqs ? 'mcq' : 'coding');
        if (Array.isArray(mcqs) && mcqs.length) {
          const mapped = mcqs.map(m => ({
            question: m.question || '', optionA: m.optionA || '', optionB: m.optionB || '',
            optionC: m.optionC || '', optionD: m.optionD || '', correctOption: m.correctOption || 'A',
            explanation: m.explanation || '', marks: m.marks || 1,
          }));
          setMcqQuestions(mapped);
          setOriginalMcqSnapshot(JSON.stringify(mapped));
        }
        // Restore per-question marks
        if (Array.isArray(t.questionWeights) && t.questionWeights.length > 0) {
          const marks = {};
          t.questionWeights.forEach(w => { marks[w.questionId] = w.maxMarks; });
          setQuestionMarks(marks);
        } else if ((t.questionIds || []).length > 0) {
          // default: distribute evenly if no weights saved
          const def = {};
          (t.questionIds || []).forEach(qid => { def[qid] = 10; });
          setQuestionMarks(def);
        }
      } catch (err) {
        toast.error('Failed to load test for editing');
      }
    })();
  }, [editId]);

  const loadQuestions = async () => {
    try {
      const res = await questionAPI.getAll();
      setQuestions(res.data);
    } catch (err) {
      toast.error('Failed to load questions');
    }
  };

  const toggleQuestion = (id) => {
    setForm(prev => ({
      ...prev,
      questionIds: prev.questionIds.includes(id)
        ? prev.questionIds.filter(qId => qId !== id)
        : [...prev.questionIds, id]
    }));
    setQuestionMarks(prev => {
      if (prev[id] !== undefined) return prev; // already has marks
      return { ...prev, [id]: 10 };            // default 10 marks
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const needsCoding = contentType === 'coding' || contentType === 'both';
    const needsMcq    = contentType === 'mcq'    || contentType === 'both';
    if (needsCoding && form.questionIds.length === 0) {
      toast.error('Please select at least one coding question');
      return;
    }
    if (needsMcq && mcqQuestions.length === 0) {
      toast.error('Please add at least one MCQ question');
      return;
    }
    setLoading(true);
    try {
      const startDate = new Date(form.startTime);
      const endDate = new Date(startDate.getTime() + (form.durationMinutes || 60) * 60000);
      const pad = (n) => String(n).padStart(2, '0');
      const endTimeLocal = `${endDate.getFullYear()}-${pad(endDate.getMonth()+1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:${pad(endDate.getSeconds())}`;
      // Build questionWeights array from questionMarks state
      const questionWeights = (contentType !== 'mcq' ? form.questionIds : []).map(qid => ({
        questionId: qid,
        maxMarks: questionMarks[qid] || 10,
      }));
      const payload = {
        ...form,
        // If MCQ-only, send no coding questions
        questionIds: contentType === 'mcq' ? [] : form.questionIds,
        endTime: endTimeLocal,
        restrictToSections: scopeMode !== 'all',
        sectionIds: scopeMode === 'all' ? [] : scopeMode === 'my_sections' ? allSections.map(s => s.id) : selectedSections,
        questionWeights,
      };
      if (isEditing) {
        await testAPI.update(editId, payload);
        const mcqChanged = JSON.stringify(mcqQuestions) !== originalMcqSnapshot;
        if (mcqChanged || (mcqQuestions.length > 0 && originalMcqSnapshot === null)) {
          await mcqAPI.saveQuestions(editId, contentType === 'coding' ? [] : mcqQuestions);
        }
        toast.success('Test updated! ✅');
      } else {
        const res = await testAPI.create(payload);
        if (contentType !== 'coding' && mcqQuestions.length > 0 && res.data?.id) {
          await mcqAPI.saveQuestions(res.data.id, mcqQuestions);
        }
        toast.success('Test created successfully! 🎉');
        setShareModal({ testId: res.data.id, title: res.data.title || form.title });
        return; // don't navigate yet — wait for user to close the share modal
      }
      navigate(isCompany ? '/company' : '/teacher');
    } catch (err) {
      toast.error(isEditing ? 'Failed to update test' : 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  // Derived question filter vars (used in the coding questions picker below)
  const tagCounts = {};
  questions.forEach(q => q.tags?.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
  const filteredQuestions = questions.filter(q => {
    if (qDiff !== 'ALL' && q.difficulty !== qDiff) return false;
    if (qSearch && !q.title.toLowerCase().includes(qSearch.toLowerCase())) return false;
    if (qTag && !q.tags?.includes(qTag)) return false;
    return true;
  });

  return (
    <>
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-3xl font-bold text-white mb-2">
        {isEditing ? 'Edit' : 'Launch'} <span className="gradient-text">Coding Test</span>
      </h1>
      <p className="text-slate-400 mb-6">{isEditing ? 'Update questions, MCQs, timing and settings' : 'Create a timed test for your students'}</p>

      {/* Test Format Selector */}
      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-indigo-400" /> Test Format
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'coding', label: 'Only Coding',    desc: 'Programming problems only — no MCQs',         icon: <Code2 className="w-5 h-5" />,        color: 'amber' },
            { key: 'both',   label: 'Coding + MCQ',   desc: 'Mix of programming problems and MCQ questions', icon: <LayoutTemplate className="w-5 h-5" />, color: 'indigo' },
            { key: 'mcq',    label: 'Only MCQ',       desc: 'Multiple choice questions only — no coding',   icon: <ListChecks className="w-5 h-5" />,     color: 'emerald' },
          ].map(opt => (
            <button key={opt.key} type="button" onClick={() => setContentType(opt.key)}
              className={`text-left p-4 rounded-xl border transition-all ${
                contentType === opt.key
                  ? `border-${opt.color}-500/50 bg-${opt.color}-500/10 ring-1 ring-${opt.color}-500/30`
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
              }`}>
              <div className={`mb-2 ${contentType === opt.key ? `text-${opt.color}-400` : 'text-slate-500'}`}>{opt.icon}</div>
              <p className={`text-sm font-semibold ${contentType === opt.key ? 'text-white' : 'text-slate-400'}`}>{opt.label}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Info */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-2">Test Details</h3>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Test Title *</label>
            <input type="text" className="input-field" placeholder="e.g. DSA Weekly Test - Week 3"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Description</label>
            <textarea className="input-field min-h-[80px]" placeholder="Instructions for students..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" /> Start Date
              </label>
              <input type="date" className="input-field"
                value={form.startTime ? form.startTime.split('T')[0] : ''}
                onChange={(e) => {
                  const time = form.startTime ? form.startTime.split('T')[1] || '10:00' : '10:00';
                  setForm({ ...form, startTime: e.target.value + 'T' + time });
                }} required />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" /> Start Time
              </label>
              <div className="flex gap-2">
                <select className="input-field flex-1"
                  value={(() => {
                    if (!form.startTime) return '10';
                    const h = parseInt(form.startTime.split('T')[1]?.split(':')[0] || '10');
                    return String(h === 0 ? 12 : h > 12 ? h - 12 : h);
                  })()}
                  onChange={(e) => {
                    const parts = form.startTime?.split('T') || ['', '10:00'];
                    const oldH = parseInt(parts[1]?.split(':')[0] || '10');
                    const isPM = oldH >= 12;
                    let newH = parseInt(e.target.value);
                    if (isPM && newH !== 12) newH += 12;
                    if (!isPM && newH === 12) newH = 0;
                    const mins = parts[1]?.split(':')[1] || '00';
                    setForm({ ...form, startTime: parts[0] + 'T' + String(newH).padStart(2, '0') + ':' + mins });
                  }}>
                  {[12,1,2,3,4,5,6,7,8,9,10,11].map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select className="input-field w-20"
                  value={form.startTime ? form.startTime.split('T')[1]?.split(':')[1] || '00' : '00'}
                  onChange={(e) => {
                    const parts = form.startTime?.split('T') || ['', '10:00'];
                    const hour = parts[1]?.split(':')[0] || '10';
                    setForm({ ...form, startTime: parts[0] + 'T' + hour + ':' + e.target.value });
                  }}>
                  {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className="input-field w-20"
                  value={(() => {
                    if (!form.startTime) return 'AM';
                    const h = parseInt(form.startTime.split('T')[1]?.split(':')[0] || '10');
                    return h >= 12 ? 'PM' : 'AM';
                  })()}
                  onChange={(e) => {
                    const parts = form.startTime?.split('T') || ['', '10:00'];
                    let h = parseInt(parts[1]?.split(':')[0] || '10');
                    const mins = parts[1]?.split(':')[1] || '00';
                    if (e.target.value === 'PM' && h < 12) h += 12;
                    if (e.target.value === 'AM' && h >= 12) h -= 12;
                    setForm({ ...form, startTime: parts[0] + 'T' + String(h).padStart(2, '0') + ':' + mins });
                  }}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" /> Test Duration (minutes)
              </label>
              <input type="number" className="input-field" value={form.durationMinutes} min={10} max={300}
                onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 60 })} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> Join Window (minutes)
              </label>
              <input type="number" className="input-field" value={form.joinWindowMinutes || 20} min={5} max={60}
                onChange={(e) => setForm({ ...form, joinWindowMinutes: parseInt(e.target.value) || 20 })} />
              <p className="text-[11px] text-slate-500 mt-1">Students can join within this time after start. After that, entry is blocked.</p>
            </div>
          </div>

          {form.startTime && (
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3 text-xs text-slate-400">
              <span className="text-indigo-400 font-medium">Schedule: </span>
              Starts {new Date(form.startTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              {' → '}Ends {new Date(new Date(form.startTime).getTime() + (form.durationMinutes || 60) * 60000).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              {' · '}Join window closes at {new Date(new Date(form.startTime).getTime() + (form.joinWindowMinutes || 20) * 60000).toLocaleString('en-IN', { timeStyle: 'short' })}
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Access Code (optional)</label>
            <input type="text" className="input-field" placeholder="Leave empty for open access"
              value={form.accessCode} onChange={(e) => setForm({ ...form, accessCode: e.target.value })} />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="rounded border-slate-600" />
              Publish immediately
            </label>
          </div>
        </div>

        {/* Hiring Details (Company) */}
        {isCompany && (
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" /> Hiring Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Job Role</label>
                <input type="text" className="input-field" placeholder="e.g. SDE Intern, Full Stack Dev"
                  value={form.jobRole} onChange={(e) => setForm({ ...form, jobRole: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Experience Level</label>
                <select className="input-field" value={form.experienceLevel}
                  onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
                  <option value="">Select</option>
                  <option value="Fresher">Fresher</option>
                  <option value="0-1 years">0-1 years</option>
                  <option value="1-3 years">1-3 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Section Access Control */}
        {allSections.length > 0 && !isCompany && (
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" /> Who can take this test?
            </h3>

            {/* 3-option scope selector */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'all', label: 'All Students', desc: 'Any student who is in your section(s) can see this test', icon: <Users className="w-5 h-5" /> },
                { key: 'my_sections', label: 'All My Sections', desc: 'Only students from all sections assigned to you', icon: <Shield className="w-5 h-5" /> },
                { key: 'specific', label: 'Specific Sections', desc: 'Pick exactly which section(s) can take this test', icon: <UserX className="w-5 h-5" /> },
              ].map(opt => (
                <button key={opt.key} type="button"
                  onClick={() => setScopeMode(opt.key)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    scopeMode === opt.key
                      ? 'border-indigo-500/50 bg-indigo-500/10 ring-1 ring-indigo-500/30'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  }`}>
                  <div className={`mb-2 ${scopeMode === opt.key ? 'text-indigo-400' : 'text-slate-500'}`}>{opt.icon}</div>
                  <p className={`text-sm font-semibold ${scopeMode === opt.key ? 'text-white' : 'text-slate-400'}`}>{opt.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* Summary line */}
            {scopeMode === 'all' && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                Students from all your sections will see this test in their Tests page.
              </p>
            )}
            {scopeMode === 'my_sections' && (
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3 text-xs text-indigo-300 space-y-1">
                <p className="font-medium">Will be visible to all {allSections.length} of your assigned section(s):</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {allSections.map(sec => (
                    <span key={sec.id} className="bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[11px]">
                      {sec.fullName || sec.name} ({sec.studentCount})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Section picker — only for 'specific' mode */}
            {scopeMode === 'specific' && (
              <div className="space-y-2 pt-1">
                <p className="text-xs text-slate-400">Select which of your sections can see this test:</p>
                {allSections.map(sec => {
                  const isSelected = selectedSections.includes(sec.id);
                  const isExpanded = expandedSection === sec.id;
                  const students = sectionStudents[sec.id] || [];
                  const excludedInSec = students.filter(s => excludedStudents.has(s.id)).length;
                  return (
                    <div key={sec.id} className={`rounded-lg border transition-all ${isSelected ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-slate-700 bg-slate-800/30'}`}>
                      <div className="flex items-center gap-3 p-3">
                        <input type="checkbox" checked={isSelected}
                          onChange={(e) => {
                            setSelectedSections(prev => e.target.checked ? [...prev, sec.id] : prev.filter(id => id !== sec.id));
                            if (e.target.checked && !sectionStudents[sec.id]) {
                              batchAPI.getStudents(sec.id).then(res => setSectionStudents(prev => ({ ...prev, [sec.id]: res.data }))).catch(() => {});
                            }
                          }}
                          className="rounded border-slate-600 w-4 h-4" />
                        <span className={`text-sm font-medium flex-1 ${isSelected ? 'text-white' : 'text-slate-400'}`}>{sec.fullName || sec.name}</span>
                        <span className="text-[11px] text-slate-500">{sec.studentCount} students</span>
                        {excludedInSec > 0 && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">{excludedInSec} excluded</span>}
                        {isSelected && (
                          <button type="button" onClick={() => {
                            setExpandedSection(isExpanded ? null : sec.id);
                            if (!sectionStudents[sec.id]) batchAPI.getStudents(sec.id).then(res => setSectionStudents(prev => ({ ...prev, [sec.id]: res.data }))).catch(() => {});
                          }} className="text-slate-500 hover:text-white p-1">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        )}
                      </div>

                      {isSelected && isExpanded && students.length > 0 && (
                        <div className="border-t border-slate-700/50 max-h-[300px] overflow-y-auto">
                          {students.map(student => {
                            const isExcluded = excludedStudents.has(student.id) || student.isDebarred;
                            return (
                              <div key={student.id} className={`flex items-center gap-3 px-5 py-2 text-xs ${isExcluded ? 'opacity-40' : ''} hover:bg-slate-800/30`}>
                                <span className="text-slate-300 flex-1">{student.fullName}</span>
                                <span className="text-slate-500 font-mono">{student.systemId}</span>
                                {student.isDebarred ? (
                                  <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Debarred</span>
                                ) : (
                                  <button type="button" onClick={() => setExcludedStudents(prev => {
                                    const next = new Set(prev);
                                    next.has(student.id) ? next.delete(student.id) : next.add(student.id);
                                    return next;
                                  })} className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                                    excludedStudents.has(student.id)
                                      ? 'text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
                                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                                  }`}>
                                    {excludedStudents.has(student.id) ? 'Excluded' : 'Active'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {allSections.length === 0 && (
                  <p className="text-xs text-slate-500 py-2">No sections assigned to you yet. Contact an admin.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Proctoring Settings */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" /> Proctoring & Anti-Cheat
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700 cursor-pointer hover:border-indigo-500/30 transition-all">
              <input type="checkbox" checked={form.proctoringEnabled}
                onChange={(e) => setForm({ ...form, proctoringEnabled: e.target.checked })}
                className="rounded border-slate-600 w-5 h-5" />
              <div>
                <p className="text-sm text-white font-medium flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-400" /> Enable Proctoring
                </p>
                <p className="text-xs text-slate-500">Monitor student activity during test</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700 cursor-pointer hover:border-blue-500/30 transition-all">
              <input type="checkbox" checked={form.cameraRequired}
                onChange={(e) => setForm({ ...form, cameraRequired: e.target.checked })}
                className="rounded border-slate-600 w-5 h-5" />
              <div>
                <p className="text-sm text-white font-medium flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-400" /> Camera Required
                </p>
                <p className="text-xs text-slate-500">Capture webcam snapshots</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700 cursor-pointer hover:border-amber-500/30 transition-all">
              <input type="checkbox" checked={form.fullscreenRequired}
                onChange={(e) => setForm({ ...form, fullscreenRequired: e.target.checked })}
                className="rounded border-slate-600 w-5 h-5" />
              <div>
                <p className="text-sm text-white font-medium flex items-center gap-1.5">
                  <Maximize className="w-4 h-4 text-amber-400" /> Fullscreen Mode
                </p>
                <p className="text-xs text-slate-500">Force fullscreen during test</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700 cursor-pointer hover:border-red-500/30 transition-all">
              <input type="checkbox" checked={form.plagiarismCheckEnabled}
                onChange={(e) => setForm({ ...form, plagiarismCheckEnabled: e.target.checked })}
                className="rounded border-slate-600 w-5 h-5" />
              <div>
                <p className="text-sm text-white font-medium flex items-center gap-1.5">
                  <FileSearch className="w-4 h-4 text-red-400" /> Plagiarism Detection
                </p>
                <p className="text-xs text-slate-500">Compare code similarity after test</p>
              </div>
            </label>
          </div>

          {form.proctoringEnabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Max Tab Switches (auto-submit)</label>
                <input type="number" className="input-field" min="1" max="10" value={form.maxTabSwitches}
                  onChange={(e) => setForm({ ...form, maxTabSwitches: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Snapshot Interval (seconds)</label>
                <input type="number" className="input-field" min="10" max="600" value={form.snapshotIntervalSeconds}
                  onChange={(e) => setForm({ ...form, snapshotIntervalSeconds: parseInt(e.target.value) })} />
              </div>
            </div>
          )}
        </div>

        {/* Select Questions — only shown for coding/both */}
        {contentType !== 'mcq' && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Select Questions <span className="text-indigo-400">({form.questionIds.length} selected)</span>
              </h3>
            </div>

              {/* Selected Questions */}
              {form.questionIds.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 mb-2">Selected — set marks per question:</p>
                  <div className="space-y-1.5">
                    {form.questionIds.map(id => {
                      const q = questions.find(q => q.id === id);
                      return q ? (
                        <div key={id} className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl">
                          <span className="text-sm text-indigo-300 flex-1 truncate">{q.title}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
                            q.difficulty === 'EASY' ? 'bg-emerald-500/15 text-emerald-400'
                            : q.difficulty === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-red-500/15 text-red-400'
                          }`}>{q.difficulty}</span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <label className="text-[10px] text-slate-500">Marks:</label>
                            <input
                              type="number" min={1} max={200}
                              value={questionMarks[id] || 10}
                              onClick={e => e.stopPropagation()}
                              onChange={e => setQuestionMarks(prev => ({ ...prev, [id]: parseInt(e.target.value) || 1 }))}
                              className="w-14 text-xs text-center bg-slate-800 border border-slate-600 rounded-lg py-1 text-white focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <button type="button" onClick={() => toggleQuestion(id)} className="text-slate-500 hover:text-red-400 flex-shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : null;
                    })}
                    <p className="text-[11px] text-slate-600 pt-1">
                      Total coding marks: <span className="text-white font-semibold">{form.questionIds.reduce((s, id) => s + (questionMarks[id] || 10), 0)}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Topic Tags */}
              <div className="mb-3">
                <div className={`flex flex-wrap gap-x-3 gap-y-1 ${qShowAllTags ? '' : 'max-h-[22px] overflow-hidden'}`}>
                  {sortedTags.map(([tag, count]) => (
                    <button key={tag} type="button" onClick={() => setQTag(qTag === tag ? null : tag)}
                      className={`text-xs whitespace-nowrap ${qTag === tag ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-white'}`}>
                      {tag} <span className="text-slate-600">{count}</span>
                    </button>
                  ))}
                </div>
                {sortedTags.length > 8 && (
                  <button type="button" onClick={() => setQShowAllTags(!qShowAllTags)} className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-0.5">
                    {qShowAllTags ? 'Collapse ↑' : 'Expand ↓'}
                  </button>
                )}
              </div>

              {/* Search + Difficulty Filter */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1">
                  <input type="text" className="input-field pl-3 py-2 text-sm" placeholder="Search questions..."
                    value={qSearch} onChange={e => setQSearch(e.target.value)} />
                </div>
                <div className="flex gap-1">
                  {[{k:'ALL',l:'All'},{k:'EASY',l:'Easy',cl:'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'},
                    {k:'MEDIUM',l:'Med.',cl:'text-amber-400 border-amber-500/30 bg-amber-500/10'},
                    {k:'HARD',l:'Hard',cl:'text-red-400 border-red-500/30 bg-red-500/10'}].map(d => (
                    <button key={d.k} type="button" onClick={() => setQDiff(d.k)}
                      className={`px-2 py-1 rounded text-xs font-medium border ${
                        qDiff === d.k ? d.cl || 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' : 'text-slate-500 border-slate-800 hover:text-white'
                      }`}>{d.l}</button>
                  ))}
                </div>
                <span className="text-[11px] text-slate-500">{filteredQuestions.length}</span>
              </div>

              {/* Filtered Questions */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredQuestions.map(q => (
                  <div key={q.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                      form.questionIds.includes(q.id) ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                    onClick={() => toggleQuestion(q.id)}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={form.questionIds.includes(q.id)} onChange={() => {}} className="rounded border-slate-600" />
                      <span className="text-white text-sm">{q.title}</span>
                      {q.tags?.slice(0, 2).map((tag, ti) => (
                        <span key={ti} className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                    <span className={q.difficulty === 'EASY' ? 'badge-easy text-xs' : q.difficulty === 'MEDIUM' ? 'badge-medium text-xs' : 'badge-hard text-xs'}>
                      {q.difficulty}
                    </span>
                  </div>
                ))}
                {filteredQuestions.length === 0 && (
                  <p className="text-slate-500 text-center py-8">No questions match your filter</p>
                )}
              </div>
          </div>
        )} {/* end coding section */}

        {/* MCQ Questions Builder — only shown for mcq/both */}
        {contentType !== 'coding' && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              MCQ Questions <span className="text-indigo-400">({mcqQuestions.length})</span>
            </h3>
            <div className="flex items-center gap-2">
              <button type="button" onClick={downloadMcqTemplate}
                className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1" title="Download CSV template">
                <Download className="w-4 h-4" /> Template
              </button>
              <label className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1 cursor-pointer" title="Bulk upload MCQs from CSV">
                <Upload className="w-4 h-4" /> Bulk Upload
                <input type="file" accept=".csv" onChange={handleMcqCsv} className="hidden" />
              </label>
              <button type="button" onClick={() => setMcqQuestions(prev => [...prev, { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', explanation: '', marks: 1 }])}
                className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add MCQ
              </button>
            </div>
          </div>

          {mcqQuestions.length === 0 && (
            <p className="text-slate-500 text-center py-6 text-sm">No MCQ questions added. Click "Add MCQ" to create multiple choice questions.</p>
          )}

          <div className="space-y-4">
            {mcqQuestions.map((mcq, idx) => (
              <div key={idx} className="border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">MCQ #{idx + 1}</span>
                  <button type="button" onClick={() => setMcqQuestions(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-300 text-xs">Remove</button>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Question *</label>
                  <textarea className="input-field py-2 text-sm min-h-[60px]" placeholder="Enter the question..."
                    value={mcq.question} onChange={e => { const arr = [...mcqQuestions]; arr[idx].question = e.target.value; setMcqQuestions(arr); }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt}>
                      <label className="block text-xs text-slate-400 mb-1">Option {opt} *</label>
                      <input className="input-field py-2 text-sm" placeholder={`Option ${opt}`}
                        value={mcq[`option${opt}`]} onChange={e => { const arr = [...mcqQuestions]; arr[idx][`option${opt}`] = e.target.value; setMcqQuestions(arr); }} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Correct Answer *</label>
                    <select className="input-field py-2 text-sm" value={mcq.correctOption}
                      onChange={e => { const arr = [...mcqQuestions]; arr[idx].correctOption = e.target.value; setMcqQuestions(arr); }}>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Marks</label>
                    <input type="number" className="input-field py-2 text-sm" min={1} value={mcq.marks}
                      onChange={e => { const arr = [...mcqQuestions]; arr[idx].marks = parseInt(e.target.value) || 1; setMcqQuestions(arr); }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Explanation (shown after test / in practice mode)</label>
                  <textarea className="input-field py-2 text-sm min-h-[50px]" placeholder="Explain the correct answer..."
                    value={mcq.explanation} onChange={e => { const arr = [...mcqQuestions]; arr[idx].explanation = e.target.value; setMcqQuestions(arr); }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        )} {/* end contentType !== 'coding' */}

        {/* Submit */}
        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 py-3">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
            {isEditing ? 'Save Changes' : 'Create Test'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary py-3">Cancel</button>
        </div>
      </form>
    </div>

    {/* Share link modal — shown after test is created */}
    {shareModal && (() => {
      const shareUrl = `${window.location.origin}/contest/${shareModal.testId}`;
      return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-card p-7 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Test Created!</h3>
            <p className="text-sm text-slate-400 mb-5">
              Share this link with your students. They will be prompted to log in if needed, then land directly on this test.
            </p>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-5">
              <span className="flex-1 text-xs text-indigo-300 truncate text-left">{shareUrl}</span>
              <button type="button"
                onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); }}
                className="flex-shrink-0 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
            <div className="flex gap-3">
              <button type="button"
                onClick={() => { setShareModal(null); navigate(isCompany ? '/company' : '/teacher'); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 transition-colors">
                Go to Dashboard
              </button>
              <button type="button"
                onClick={() => { setShareModal(null); navigate(`/contest/${shareModal.testId}`); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors">
                View Test
              </button>
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
}
