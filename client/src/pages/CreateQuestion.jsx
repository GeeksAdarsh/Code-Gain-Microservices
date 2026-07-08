import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { questionAPI } from '../services/api';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateQuestion() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditing = !!editId;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', inputFormat: '', outputFormat: '',
    constraints: '', difficulty: 'EASY', tags: '',
    sampleInput: '', sampleOutput: '', explanation: '',
    timeLimit: 2, memoryLimit: 256,
    testCases: [{ input: '', expectedOutput: '', isSample: true, isHidden: false }],
  });

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      try {
        const { data: q } = await questionAPI.getById(editId);
        setForm({
          title: q.title || '',
          description: q.description || '',
          inputFormat: q.inputFormat || '',
          outputFormat: q.outputFormat || '',
          constraints: q.constraints || '',
          difficulty: q.difficulty || 'EASY',
          tags: (q.tags || []).join(', '),
          sampleInput: q.sampleInput || '',
          sampleOutput: q.sampleOutput || '',
          explanation: q.explanation || '',
          timeLimit: q.timeLimit ?? 2,
          memoryLimit: q.memoryLimit ?? 256,
          testCases: (q.testCases && q.testCases.length)
            ? q.testCases.map(tc => ({
                input: tc.input ?? '',
                expectedOutput: tc.expectedOutput ?? '',
                isSample: !!tc.isSample,
                isHidden: !!tc.isHidden,
              }))
            : [{ input: '', expectedOutput: '', isSample: true, isHidden: false }],
        });
      } catch (err) {
        toast.error('Failed to load question');
      }
    })();
  }, [editId, isEditing]);

  const addTestCase = () => {
    setForm({
      ...form,
      testCases: [...form.testCases, { input: '', expectedOutput: '', isSample: false, isHidden: true }],
    });
  };

  const removeTestCase = (index) => {
    setForm({
      ...form,
      testCases: form.testCases.filter((_, i) => i !== index),
    });
  };

  const updateTestCase = (index, field, value) => {
    const updated = [...form.testCases];
    updated[index][field] = value;
    setForm({ ...form, testCases: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (isEditing) {
        await questionAPI.update(editId, payload);
        toast.success('Question updated successfully! ✅');
      } else {
        await questionAPI.create(payload);
        toast.success('Question created successfully! 🎉');
      }
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} question`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-3xl font-bold text-white mb-2">
        {isEditing ? 'Edit' : 'Create'} <span className="gradient-text">Question</span>
      </h1>
      <p className="text-slate-400 mb-8">
        {isEditing ? 'Review and fix the problem, including all of its test cases' : 'Add a new coding problem to the question bank'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-2">Basic Information</h3>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Title *</label>
            <input type="text" className="input-field" placeholder="e.g. Two Sum" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Description *</label>
            <textarea className="input-field min-h-[120px]" placeholder="Problem description..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Difficulty</label>
              <select className="input-field" value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Time Limit (sec)</label>
              <input type="number" className="input-field" value={form.timeLimit}
                onChange={(e) => setForm({ ...form, timeLimit: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Memory (MB)</label>
              <input type="number" className="input-field" value={form.memoryLimit}
                onChange={(e) => setForm({ ...form, memoryLimit: parseInt(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Tags (comma separated)</label>
            <input type="text" className="input-field" placeholder="Array, Hash Map, DP" value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
        </div>

        {/* Format & Constraints */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-2">Format & Constraints</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Input Format</label>
              <textarea className="input-field min-h-[80px]" value={form.inputFormat}
                onChange={(e) => setForm({ ...form, inputFormat: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Output Format</label>
              <textarea className="input-field min-h-[80px]" value={form.outputFormat}
                onChange={(e) => setForm({ ...form, outputFormat: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Constraints</label>
            <textarea className="input-field min-h-[80px]" value={form.constraints}
              onChange={(e) => setForm({ ...form, constraints: e.target.value })} />
          </div>
        </div>

        {/* Sample I/O */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-2">Sample Input/Output</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Sample Input</label>
              <textarea className="input-field font-mono min-h-[80px]" value={form.sampleInput}
                onChange={(e) => setForm({ ...form, sampleInput: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Sample Output</label>
              <textarea className="input-field font-mono min-h-[80px]" value={form.sampleOutput}
                onChange={(e) => setForm({ ...form, sampleOutput: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Explanation</label>
            <textarea className="input-field min-h-[80px]" value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
          </div>
        </div>

        {/* Test Cases */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Test Cases</h3>
            <button type="button" onClick={addTestCase} className="btn-secondary text-sm py-1.5 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Test Case
            </button>
          </div>

          <div className="space-y-4">
            {form.testCases.map((tc, i) => (
              <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">Test Case #{i + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm text-slate-400">
                      <input type="checkbox" checked={tc.isSample}
                        onChange={(e) => updateTestCase(i, 'isSample', e.target.checked)}
                        className="rounded border-slate-600" />
                      Sample
                    </label>
                    <label className="flex items-center gap-1.5 text-sm text-slate-400">
                      <input type="checkbox" checked={tc.isHidden}
                        onChange={(e) => updateTestCase(i, 'isHidden', e.target.checked)}
                        className="rounded border-slate-600" />
                      Hidden
                    </label>
                    {form.testCases.length > 1 && (
                      <button type="button" onClick={() => removeTestCase(i)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Input</label>
                    <textarea className="input-field font-mono text-sm min-h-[60px]" value={tc.input}
                      onChange={(e) => updateTestCase(i, 'input', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Expected Output</label>
                    <textarea className="input-field font-mono text-sm min-h-[60px]" value={tc.expectedOutput}
                      onChange={(e) => updateTestCase(i, 'expectedOutput', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 py-3">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
            {isEditing ? 'Save Changes' : 'Create Question'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary py-3">Cancel</button>
        </div>
      </form>
    </div>
  );
}
