import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { questionAPI, codeAPI, testAPI, feedbackAPI } from '../services/api';
import api from '../services/api';
import { Play, Send, ChevronRight, ChevronLeft, Clock, Cpu, CheckCircle2, XCircle, GripHorizontal, History, ArrowRight, X, AlertTriangle, Sparkles, Plus, Trash2, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import ProctoringGuard from '../components/ProctoringGuard';

const LANGUAGES = [
  {
    value: 'JAVA', label: 'Java', monaco: 'java',
    default: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\n        // Read input\n\n\n        // Print output\n\n    }\n}\n',
    cp: 'import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        StringBuilder sb = new StringBuilder();\n\n        // Read input\n\n\n        // Print output\n        System.out.print(sb);\n    }\n}\n',
  },
  {
    value: 'PYTHON', label: 'Python', monaco: 'python',
    default: '# Read input\n\n\n# Print output\n\n',
    cp: 'import sys\ninput = sys.stdin.readline\n\ndef solve():\n    # Read input\n\n\n    # Print output\n    pass\n\nsolve()\n',
  },
  {
    value: 'CPP', label: 'C++', monaco: 'cpp',
    default: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read input\n\n\n    // Print output\n\n    return 0;\n}\n',
    cp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n\n    // Read input\n\n\n    // Print output\n\n    return 0;\n}\n',
  },
  {
    value: 'C', label: 'C', monaco: 'c',
    default: '#include <stdio.h>\n\nint main() {\n    // Read input\n\n\n    // Print output\n\n    return 0;\n}\n',
    cp: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    // Read input\n\n\n    // Print output\n\n    return 0;\n}\n',
  },
  {
    value: 'JAVASCRIPT', label: 'JavaScript', monaco: 'javascript',
    default: '// Read input and print output\n\n',
    cp: 'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\nrl.on("line", l => lines.push(l));\nrl.on("close", () => {\n    // Process input from lines[]\n\n});\n',
  },
];

// Get template: "default" = simple/clean, "cp" = competitive programming
const getTemplate = (lang, mode) => mode === 'cp' ? lang.cp : lang.default;

/* ── Relative time: "9m ago", "2h ago", "3d ago" ── */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ── Language badge ── */
const LANG_COLORS = {
  JAVA: 'bg-orange-500/15 text-orange-400',
  PYTHON: 'bg-blue-500/15 text-blue-400',
  JAVASCRIPT: 'bg-yellow-500/15 text-yellow-400',
  C: 'bg-slate-500/15 text-slate-300',
  CPP: 'bg-purple-500/15 text-purple-400',
};
function LangBadge({ lang }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${LANG_COLORS[lang] || 'bg-slate-700 text-slate-300'}`}>
      {lang}
    </span>
  );
}

/* ── Submissions list with "Recent AC" / "All" tabs ── */
function SubList({ submissions, isTestMode, testId, question, onView }) {
  const [subTab, setSubTab] = React.useState('all');

  // In test mode only show submissions for THIS test; in practice show all
  const base = isTestMode
    ? submissions.filter(s => String(s.testId) === String(testId))
    : submissions;

  const visible = subTab === 'ac'
    ? base.filter(s => s.status === 'ACCEPTED')
    : base;

  const acCount = base.filter(s => s.status === 'ACCEPTED').length;

  if (base.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <svg className="w-10 h-10 mx-auto mb-3 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"/>
        </svg>
        <p className="text-sm">{isTestMode ? 'No attempts yet for this question' : 'No submissions yet'}</p>
        <p className="text-xs mt-1 opacity-60">Submit your solution to see results here</p>
      </div>
    );
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex items-center gap-0 border-b border-slate-700/50 mb-3">
        <button
          onClick={() => setSubTab('ac')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all border-b-2 -mb-px ${
            subTab === 'ac'
              ? 'text-[#00b8a3] border-[#00b8a3]'
              : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          Recent AC
          {acCount > 0 && <span className="ml-1 text-[10px] bg-[#00b8a3]/20 text-[#00b8a3] px-1.5 py-0.5 rounded-full">{acCount}</span>}
        </button>
        <button
          onClick={() => setSubTab('all')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all border-b-2 -mb-px ${
            subTab === 'all'
              ? 'text-white border-[#ffa116]'
              : 'text-slate-500 border-transparent hover:text-slate-300'
          }`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
          </svg>
          All
          <span className="ml-1 text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">{base.length}</span>
        </button>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-8">No accepted submissions yet</p>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {visible.map((sub, i) => (
            <button key={i} onClick={() => onView(sub)}
              className="w-full flex items-center justify-between py-3 px-1 hover:bg-white/[0.03] transition-colors text-left group">
              <div className="flex items-center gap-3">
                {sub.status === 'ACCEPTED' ? (
                  <svg className="w-5 h-5 flex-shrink-0" style={{color:'#00b8a3'}} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${sub.status === 'ACCEPTED' ? 'text-white' : 'text-red-400'} group-hover:underline`}>
                      {question?.title || 'Submission'}
                    </span>
                    <LangBadge lang={sub.language} />
                    {isTestMode && (
                      <span className="text-[10px] bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded font-medium">Test</span>
                    )}
                  </div>
                  {sub.status !== 'ACCEPTED' && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {sub.testCasesPassed}/{sub.totalTestCases} passed
                      {sub.executionTimeMs > 0 ? ` · ${sub.executionTimeMs} ms` : ''}
                    </p>
                  )}
                  {sub.status === 'ACCEPTED' && sub.executionTimeMs > 0 && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{sub.executionTimeMs} ms · {sub.score}%</p>
                  )}
                </div>
              </div>
              <span className="text-[11px] text-slate-500 flex-shrink-0 ml-4">{timeAgo(sub.submittedAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.15);padding:2px 6px;border-radius:4px;font-size:0.85em">$1</code>')
    .replace(/\n/g, '<br/>');
}

/** First Code Coach line that reads like a complexity / performance hint (not a formal proof). */
function pickComplexityHint(codeReview) {
  if (!Array.isArray(codeReview) || codeReview.length === 0) return null;
  return codeReview.find((l) =>
    typeof l === 'string' &&
    /\bO\s*\(|O\(n|nested loops|TLE|time complexity|O\(n²\)|O\(n\^2\)|HashMap|two pointers|prefix sums|brute force|O\(n²\)/i.test(l)
  ) || null;
}

function getVerdictLabel(status) {
  if (status === 'ACCEPTED') return 'Accepted';
  if (status === 'WRONG_ANSWER') return 'Wrong Answer';
  if (!status) return 'Result';
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

class PanelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error) {
    console.error('RightPanel render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 p-6 bg-slate-900">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-300">Output panel crashed</p>
            <p className="text-xs text-slate-300 mt-1">{this.state.message}</p>
            <p className="text-xs text-slate-400 mt-2">Refresh once. If it repeats, share this message.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ProblemDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const testId = searchParams.get('testId');
  const isPractice = searchParams.get('practice') === 'true';
  const isTestMode = !!testId;

  // Proctoring for the solve page is now handled by wrapping the render in
  // <ProctoringGuard> (see bottom of the component). The guard owns clipboard
  // blocking, fullscreen enforcement, tab-switch detection, camera and auto-submit,
  // so the previous inline sessionStorage-based effect is no longer needed here.
  const [testData, setTestData] = useState(null);
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [questionStatus, setQuestionStatus] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [question, setQuestion] = useState(null);
  const [editorMode, setEditorMode] = useState(() => localStorage.getItem('editorMode') || 'function');
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('preferredLang');
    return LANGUAGES.find(l => l.value === saved) || LANGUAGES[0];
  });
  const [code, setCode] = useState(() => {
    const codeKey = `code_${id}_${localStorage.getItem('preferredLang') || 'JAVA'}`;
    const savedCode = sessionStorage.getItem(codeKey);
    if (savedCode) return savedCode;
    const saved = localStorage.getItem('preferredLang');
    const mode = localStorage.getItem('editorMode') || 'function';
    const lang = LANGUAGES.find(l => l.value === saved) || LANGUAGES[0];
    return getTemplate(lang, mode === 'cp' ? 'cp' : 'default');
  });
  const [functionAvailable, setFunctionAvailable] = useState(false);
  const [starterCode, setStarterCode] = useState('');
  const hydratedRef = useRef(false);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [leftTab, setLeftTab] = useState('description');
  const [submissions, setSubmissions] = useState([]);
  const [viewingCode, setViewingCode] = useState(null);
  const [customInput, setCustomInput] = useState('');
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [runResults, setRunResults] = useState([]);
  const [runReviewHints, setRunReviewHints] = useState([]);
  const [extraCases, setExtraCases] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  useEffect(() => {
    loadQuestion();
    loadSubmissions();
    if (isTestMode) loadTestData();
    setOutput('');
    setResult(null);
    setRunResults([]);
    setRunReviewHints([]);
  }, [id]);

  // Code shown for a given mode: Function = LeetCode-style starter, else generic Default/CP template.
  const codeForMode = (mode, starter, lang) =>
    mode === 'function' && starter ? starter : getTemplate(lang, mode === 'cp' ? 'cp' : 'default');

  // Resolve the editor template for the current problem + language:
  // saved session code → chosen mode (Function starter / Default / CP template).
  useEffect(() => {
    let cancelled = false;
    hydratedRef.current = false;
    const codeKey = `code_${id}_${language.value}`;
    const rawSaved = sessionStorage.getItem(codeKey);
    const savedCode = rawSaved && rawSaved.trim() !== '' ? rawSaved : null;
    const pickMode = (fnAvail) => {
      let mode = localStorage.getItem('editorMode') || 'function';
      if (mode === 'function' && !fnAvail) mode = 'default';
      return mode;
    };

    questionAPI.getStarter(id, language.value)
      .then((res) => {
        if (cancelled) return;
        const fnAvail = !!res.data?.functionMode;
        const starter = res.data?.starterCode || '';
        setFunctionAvailable(fnAvail);
        setStarterCode(starter);
        const mode = pickMode(fnAvail);
        setEditorMode(mode);
        setCode(savedCode != null ? savedCode : codeForMode(mode, starter, language));
      })
      .catch(() => {
        if (cancelled) return;
        setFunctionAvailable(false);
        setStarterCode('');
        const mode = pickMode(false);
        setEditorMode(mode);
        setCode(savedCode != null ? savedCode : codeForMode(mode, '', language));
      })
      .finally(() => { if (!cancelled) hydratedRef.current = true; });

    return () => { cancelled = true; };
  }, [id, language.value]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const codeKey = `code_${id}_${language.value}`;
    sessionStorage.setItem(codeKey, code);
  }, [code, id, language.value]);

  const loadTestData = async () => {
    try {
      const res = await testAPI.getById(testId);
      setTestData(res.data);
    } catch (err) {}
  };

  const handleOpenSubmitPopup = async () => {
    setLoadingStatus(true);
    try {
      const res = await testAPI.getQuestionStatus(testId);
      setQuestionStatus(res.data);
    } catch (err) { toast.error('Failed to load status'); }
    finally { setLoadingStatus(false); }
    setShowSubmitPopup(true);
  };

  const handleSubmitTest = async () => {
    setSubmittingTest(true);
    try {
      await testAPI.submitTest(testId);
      setShowSubmitPopup(false);
      toast.success('Test submitted successfully!');
      navigate('/contests');
    } catch (err) {
      if (err.response?.data?.message?.includes('already submitted')) {
        toast.error('Already submitted');
        navigate('/contests');
      } else { toast.error('Failed to submit test'); }
    } finally { setSubmittingTest(false); }
  };

  // Test navigation
  const currentQIndex = testData?.questionIds?.indexOf(parseInt(id)) ?? -1;
  const prevQId = currentQIndex > 0 ? testData.questionIds[currentQIndex - 1] : null;
  const nextQId = testData?.questionIds && currentQIndex < testData.questionIds.length - 1 ? testData.questionIds[currentQIndex + 1] : null;
  const isLastQuestion = testData?.questionIds && currentQIndex === testData.questionIds.length - 1;

  const loadQuestion = async () => {
    setLoadError(false);
    try {
      const res = await questionAPI.getById(id);
      setQuestion(res.data);
    } catch (err) {
      setLoadError(true);
      toast.error('Failed to load problem');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const res = await api.get(`/code/submissions/${id}`);
      setSubmissions(res.data);
    } catch (err) { /* ignore if not logged in */ }
  };

  // Get sample test cases from question
  const sampleTCs = question?.testCases?.filter(tc => tc.isSample) || [];

  const mergeReviewHints = (prev, hints) => {
    const add = hints && Array.isArray(hints) ? hints : [];
    const next = [...prev];
    for (const h of add) {
      if (h && !next.includes(h)) next.push(h);
    }
    return next;
  };

  const handleRun = async () => {
    setIsRunning(true);
    setResult(null);
    setRunResults([]);
    setRunReviewHints([]);
    setOutput('');

    const qid = parseInt(id, 10);
    const reviewPayload = Number.isFinite(qid) ? { reviewQuestionId: qid } : {};

    try {
      const baseCases = sampleTCs.length > 0
        ? sampleTCs.map(tc => ({ input: tc.input, expected: tc.expectedOutput }))
        : question?.sampleInput
          ? [{ input: question.sampleInput, expected: question.sampleOutput }]
          : [];
      const allInputs = [...baseCases, ...extraCases.filter(c => c.input.trim() !== '')];

      if (allInputs.length === 0) {
        setOutput('No test cases to run. Add a case with the + button.');
        setIsRunning(false);
        return;
      }

      const results = [];
      let hintsAcc = [];
      for (const tc of allInputs) {
        const response = await codeAPI.execute({ code, language: language.value, input: tc.input, ...reviewPayload });
        const actual = (response.data.output || '').trim();
        const expected = (tc.expected || '').trim();
        const hasExpected = expected.length > 0;
        const passed = hasExpected && actual === expected;
        results.push({
          input: tc.input,
          expected: tc.expected || '',
          actual: response.data.output || response.data.errorOutput || '(no output)',
          status: response.data.errorOutput ? 'ERROR' : !hasExpected ? 'RAN' : passed ? 'PASSED' : 'FAILED',
          error: response.data.errorOutput,
          executionTimeMs: response.data.executionTimeMs,
        });
        hintsAcc = mergeReviewHints(hintsAcc, response.data.codeReview);
      }
      setRunResults(results);
      setRunReviewHints(hintsAcc);
      const passedCount = results.filter(r => r.status === 'PASSED').length;
      const totalJudged = results.filter(r => r.status !== 'RAN').length;
      setOutput(totalJudged > 0
        ? `Test Cases: ${passedCount}/${totalJudged} passed`
        : `Ran ${results.length} case(s) — check output`);
    } catch (err) {
      setOutput('Error: Failed to execute code');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setResult(null);
    try {
      const response = await codeAPI.submit({
        code,
        language: language.value,
        questionId: parseInt(id),
        ...(isTestMode ? { testId: parseInt(testId) } : {}),
      });
      setResult(response.data);
      setOutput(response.data.output || response.data.errorOutput || '');
      setLeftTab('result');
      setExtraCases([]);
      if (response.data.status === 'ACCEPTED') {
        toast.success('All test cases passed! 🎉');
      } else {
        toast.error(`${response.data.testCasesPassed}/${response.data.totalTestCases} test cases passed`);
      }
      loadSubmissions();
    } catch (err) {
      setOutput('Error: Failed to submit code');
      toast.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLanguageChange = (langValue) => {
    const lang = LANGUAGES.find(l => l.value === langValue);
    setLanguage(lang);
    localStorage.setItem('preferredLang', langValue);
    // Code is resolved by the template effect (saved → starter → generic).
  };

  const handleCycleMode = () => {
    const order = functionAvailable ? ['function', 'default', 'cp'] : ['default', 'cp'];
    const next = order[(order.indexOf(editorMode) + 1) % order.length];
    setEditorMode(next);
    localStorage.setItem('editorMode', next);
    setCode(codeForMode(next, starterCode, language));
    const labels = {
      function: 'ƒ Function mode — implement the given function',
      default: '📝 Default — clean template',
      cp: '⚡ CP — fast I/O template',
    };
    toast.success(labels[next], { id: 'template-switch', duration: 1600 });
  };

  // Horizontal drag — MUST be before any early returns (React hooks rule)
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem('panelWidth');
    return saved ? parseInt(saved) : 45;
  });
  const hDragging = useRef(false);

  const onHDragStart = useCallback((e) => {
    e.preventDefault();
    hDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (e) => {
      if (!hDragging.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      const clamped = Math.max(25, Math.min(65, pct));
      setLeftWidth(clamped);
      localStorage.setItem('panelWidth', Math.round(clamped));
    };
    const onUp = () => {
      hDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const handleFeedbackSubmit = async () => {
    if (!feedbackCategory || !feedbackMessage.trim()) { toast.error('Please select a category and write a message'); return; }
    setFeedbackSubmitting(true);
    try {
      await feedbackAPI.submit({ questionId: question.id, category: feedbackCategory, message: feedbackMessage.trim() });
      toast.success('Feedback submitted! The team will review it.');
      setShowFeedback(false);
      setFeedbackCategory('');
      setFeedbackMessage('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit feedback');
    } finally { setFeedbackSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-400">Loading question…</p>
      </div>
    );
  }

  if (!question || loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <p className="text-lg font-semibold text-white">Question Not Found</p>
        <p className="text-sm text-slate-400">Failed to load this question. Please check your connection and try again.</p>
        <button
          onClick={() => { setLoading(true); loadQuestion(); loadSubmissions(); if (isTestMode) loadTestData(); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Retry
        </button>
        {isTestMode && (
          <button onClick={() => navigate(`/contest/${testId}`)} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to test
          </button>
        )}
      </div>
    );
  }

  const pageContent = (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left Panel */}
      <div style={{ width: `${leftWidth}%` }} className="flex flex-col bg-slate-900/50 flex-shrink-0">
        {/* Tabs */}
        <div className="flex border-b border-slate-700/50 px-4 flex-shrink-0">
          <button onClick={() => { setLeftTab('description'); setViewingCode(null); }}
            className={`px-4 py-2.5 text-sm font-medium transition-all ${leftTab === 'description' ? 'text-white border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'}`}>
            📝 {isTestMode ? `Q${currentQIndex + 1}/${testData?.questionIds?.length || '?'}` : 'Description'}
          </button>
          {result && (
            <div className="relative flex items-center">
              <button onClick={() => setLeftTab('result')}
                className={`px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-1.5 ${leftTab === 'result' ? 'text-white border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'}`}>
                {result.status === 'ACCEPTED'
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                <span className={result.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-red-400'}>
                  {getVerdictLabel(result.status)}
                </span>
              </button>
              <button type="button"
                onClick={(e) => { e.stopPropagation(); setResult(null); if (leftTab === 'result') setLeftTab('description'); }}
                className="ml-0.5 p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-all" title="Close result">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <button onClick={() => { setLeftTab('submissions'); loadSubmissions(); }}
            className={`px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-1.5 ${leftTab === 'submissions' ? 'text-white border-b-2 border-amber-500' : 'text-slate-400 hover:text-white'}`}>
            <History className="w-3.5 h-3.5" /> {isTestMode ? 'My Attempts' : 'Submissions'}
            {submissions.length > 0 && <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full">{isTestMode ? submissions.filter(s => String(s.testId) === String(testId)).length : submissions.length}</span>}
          </button>

          {/* Test navigation — always visible in tab bar */}
          {isTestMode && testData && (
            <div className="ml-auto flex items-center gap-1.5">
              {isPractice && (
                <span className="text-[10px] bg-amber-600/20 text-amber-600 px-2 py-1 rounded-full mr-1">Practice</span>
              )}
              {prevQId && (
                <button onClick={() => navigate(`/problem/${prevQId}?testId=${testId}${isPractice ? '&practice=true' : ''}`)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500/30 transition-all flex items-center gap-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
              )}
              {nextQId && (
                <button onClick={() => navigate(`/problem/${nextQId}?testId=${testId}${isPractice ? '&practice=true' : ''}`)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-all flex items-center gap-1">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => navigate(`/test/${testId}?started=true${isPractice ? '&practice=true' : ''}`)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-amber-500/30 flex items-center gap-1">
                📋 Overview
              </button>
              {!isPractice && isLastQuestion && (
                <button onClick={handleOpenSubmitPopup}
                  className="px-3 py-1.5 text-xs rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center gap-1 font-medium">
                  <Send className="w-3 h-3" /> Submit Test
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
        {/* Submissions Tab */}
        {leftTab === 'submissions' && !viewingCode && (
          <SubList
            submissions={submissions}
            isTestMode={isTestMode}
            testId={testId}
            question={question}
            onView={setViewingCode}
          />
        )}

        {/* Viewing a submission's code */}
        {leftTab === 'submissions' && viewingCode && (
          <div>
            <button onClick={() => setViewingCode(null)} className="text-xs text-indigo-400 hover:text-indigo-300 mb-3 flex items-center gap-1">
              ← Back to submissions
            </button>
            <div className={`p-3 rounded-xl border mb-3 ${viewingCode.status === 'ACCEPTED' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-center gap-2">
                {viewingCode.status === 'ACCEPTED' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                <span className={`text-sm font-medium ${viewingCode.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {viewingCode.status === 'ACCEPTED' ? 'Accepted' : viewingCode.status?.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-400 ml-auto">
                  {viewingCode.language} • {viewingCode.score}%
                  {viewingCode.executionTimeMs > 0 ? ` • ${viewingCode.executionTimeMs} ms` : ''}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Submitted code</span>
              <button onClick={() => { setCode(viewingCode.code); setLeftTab('description'); setViewingCode(null); toast.success('Code loaded into editor'); }}
                className="text-xs text-indigo-400 hover:text-indigo-300">
                📋 Load into editor
              </button>
            </div>
            <pre className="text-xs font-mono text-slate-300 bg-slate-800 rounded-xl p-4 overflow-auto max-h-[60vh] border border-slate-700 whitespace-pre-wrap">{viewingCode.code}</pre>
          </div>
        )}

        {/* Result Tab (LeetCode-style verdict with complexity) */}
        {leftTab === 'result' && result && (
          <div className="max-w-xl">
            {/* Verdict header */}
            <div className={`rounded-xl p-5 mb-5 border ${
              result.status === 'ACCEPTED'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-3 mb-1">
                {result.status === 'ACCEPTED'
                  ? <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  : <XCircle className="w-7 h-7 text-red-400" />}
                <h2 className={`text-2xl font-bold ${result.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {getVerdictLabel(result.status)}
                </h2>
              </div>
              <p className="text-xs text-slate-400 ml-10">
                {result.testCasesPassed}/{result.totalTestCases} testcases passed
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Runtime</p>
                <p className="text-xl font-mono font-bold text-cyan-300">
                  {typeof result.executionTimeMs === 'number' && result.status !== 'COMPILATION_ERROR'
                    ? `${result.executionTimeMs} ms` : '—'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 text-center">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Score</p>
                <p className="text-xl font-mono font-bold text-amber-300">{result.score}%</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 mb-5">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-300 font-medium">Test Cases</span>
                <span className="font-semibold text-white">{result.testCasesPassed}/{result.totalTestCases}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-700/80 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${result.status === 'ACCEPTED' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-amber-500'}`}
                  style={{ width: `${Math.max(2, Math.min(100, (result.testCasesPassed / Math.max(1, result.totalTestCases)) * 100))}%` }}
                />
              </div>
            </div>

            {/* Time & Space Complexity Analysis */}
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 mb-5">
              <p className="text-xs font-semibold text-violet-300 mb-3 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Complexity Analysis
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Time Complexity</p>
                  <p className="text-sm font-mono text-cyan-200">
                    {pickComplexityHint(result.codeReview)
                      ? (pickComplexityHint(result.codeReview).match(/O\([^)]+\)/)?.[0] || 'See hint below')
                      : '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-900/50 border border-slate-700/50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Space Complexity</p>
                  <p className="text-sm font-mono text-cyan-200">
                    {Array.isArray(result.codeReview) && result.codeReview.some(l => typeof l === 'string' && /O\(1\)\s*(extra|space|memory)/i.test(l))
                      ? 'O(1) extra' : '—'}
                  </p>
                </div>
              </div>
              {pickComplexityHint(result.codeReview) && (
                <p className="text-xs text-slate-300 leading-relaxed">{pickComplexityHint(result.codeReview)}</p>
              )}
            </div>

            {/* Failed test case */}
            {result.failedInput && result.status !== 'ACCEPTED' && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 mb-5">
                <p className="text-xs font-semibold text-red-400 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Test Case {result.failedTestCaseNumber} Failed
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-slate-500 mb-1.5">Input</p>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/60">
                      <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap">{result.failedInput}</pre>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 mb-1.5">Expected</p>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/60">
                      <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap">{result.failedExpected}</pre>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 mb-1.5">Your Output</p>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/60">
                      <pre className="text-sm font-mono text-red-300 whitespace-pre-wrap">{result.failedActual || '(empty)'}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Code Coach */}
            {Array.isArray(result.codeReview) && result.codeReview.length > 0 && (
              <div className="rounded-xl bg-violet-500/10 border border-violet-500/25 p-4 mb-5">
                <p className="text-xs font-semibold text-violet-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Code Coach
                </p>
                <ul className="space-y-1.5 text-sm text-slate-300 list-disc list-inside">
                  {result.codeReview.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            <button type="button" onClick={() => setLeftTab('description')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              ← Back to description
            </button>
          </div>
        )}

        {/* Description Tab */}
        {leftTab === 'description' && (
        <div className="max-w-xl">
          {/* Title & Difficulty */}
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-2xl font-bold text-white">{question.title}</h1>
            {submissions.some(s => s.status === 'ACCEPTED') && (
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" /> Solved
              </span>
            )}
            <span className={
              question.difficulty === 'EASY' ? 'badge-easy' :
              question.difficulty === 'MEDIUM' ? 'badge-medium' : 'badge-hard'
            }>
              {question.difficulty}
            </span>
          </div>

          {/* Tags */}
          <div className="flex gap-2 mb-6">
            {question.tags?.map((tag, i) => (
              <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg">{tag}</span>
            ))}
          </div>

          {/* Description */}
          <div className="prose prose-invert max-w-none mb-6 text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(question.description) }} />

          {/* Constraints */}
          {question.constraints && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" /> Constraints
              </h3>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <pre className="text-sm text-slate-400 whitespace-pre-wrap">{question.constraints}</pre>
              </div>
            </div>
          )}

          {/* Input Format */}
          {question.inputFormat && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Input Format</h3>
              <p className="text-sm text-slate-400">{question.inputFormat}</p>
            </div>
          )}

          {/* Output Format */}
          {question.outputFormat && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Output Format</h3>
              <p className="text-sm text-slate-400">{question.outputFormat}</p>
            </div>
          )}

          {/* Sample Test Cases — show all samples */}
          {sampleTCs.length > 0 ? (
            sampleTCs.map((tc, i) => (
              <div key={i} className="mb-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Example {i + 1}:</h3>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                  <div className="p-3 border-b border-slate-700/50">
                    <p className="text-[11px] text-slate-500 mb-1">Input</p>
                    <pre className="text-sm font-mono text-cyan-300 whitespace-pre-wrap">{tc.input}</pre>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] text-slate-500 mb-1">Output</p>
                    <pre className="text-sm font-mono text-emerald-300 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Example 1:</h3>
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                  <div className="p-3 border-b border-slate-700/50">
                    <p className="text-[11px] text-slate-500 mb-1">Input</p>
                    <pre className="text-sm font-mono text-cyan-300 whitespace-pre-wrap">{question.sampleInput}</pre>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] text-slate-500 mb-1">Output</p>
                    <pre className="text-sm font-mono text-emerald-300 whitespace-pre-wrap">{question.sampleOutput}</pre>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Explanation */}
          {question.explanation && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Explanation</h3>
              <p className="text-sm text-slate-400">{question.explanation}</p>
            </div>
          )}

          {/* Limits */}
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Time: {question.timeLimit}s</span>
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Memory: {question.memoryLimit}MB</span>
          </div>

          {/* Report / Feedback Button */}
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <button onClick={() => setShowFeedback(true)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-amber-400 transition-colors group">
              <Flag className="w-3.5 h-3.5 group-hover:text-amber-400" />
              Found an issue? Report this problem
            </button>
          </div>

          {/* Feedback Modal */}
          {showFeedback && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowFeedback(false)}>
              <div className="glass-card p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Flag className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-bold text-white">Report Issue</h3>
                  </div>
                  <button onClick={() => setShowFeedback(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                <p className="text-sm text-slate-400 mb-4">
                  Reporting: <span className="text-white font-medium">{question.title}</span>
                </p>

                <div className="mb-4">
                  <label className="block text-xs text-slate-400 mb-2">What's the issue? *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'WRONG_TESTCASE', label: '🧪 Wrong Test Case' },
                      { value: 'WRONG_QUESTION', label: '📝 Wrong Question' },
                      { value: 'WRONG_EXPECTED_OUTPUT', label: '❌ Wrong Expected Output' },
                      { value: 'UNCLEAR_DESCRIPTION', label: '😕 Unclear Description' },
                      { value: 'TIME_LIMIT_ISSUE', label: '⏱️ Time Limit Issue' },
                      { value: 'OTHER', label: '💬 Other' },
                    ].map(cat => (
                      <button key={cat.value} type="button"
                        onClick={() => setFeedbackCategory(cat.value)}
                        className={`p-2.5 rounded-lg text-xs text-left transition-all border ${
                          feedbackCategory === cat.value
                            ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-white'
                        }`}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs text-slate-400 mb-2">Describe the issue *</label>
                  <textarea
                    className="input-field w-full h-28 resize-none text-sm"
                    placeholder="e.g. Test case 3 expects '5' but the correct answer should be '6' because..."
                    value={feedbackMessage}
                    onChange={e => setFeedbackMessage(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowFeedback(false)}
                    className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all text-sm">
                    Cancel
                  </button>
                  <button onClick={handleFeedbackSubmit} disabled={feedbackSubmitting || !feedbackCategory || !feedbackMessage.trim()}
                    className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {feedbackSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Submit Report</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
        )}
        </div>
      </div>

      {/* Horizontal Drag Handle */}
      <div onMouseDown={onHDragStart}
        className="w-1.5 bg-slate-800 hover:bg-indigo-500/40 cursor-col-resize transition-colors flex-shrink-0 flex items-center justify-center group">
        <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-indigo-400 rounded-full transition-colors"></div>
      </div>

      {/* Submit Test Popup Modal */}
      {showSubmitPopup && (
        <SubmitTestModal
          questionStatus={questionStatus}
          loadingStatus={loadingStatus}
          submitting={submittingTest}
          onClose={() => setShowSubmitPopup(false)}
          onSubmit={handleSubmitTest}
        />
      )}

      {/* Right: Editor & Output — Resizable */}
      <PanelErrorBoundary>
        <RightPanel
          language={language} languages={LANGUAGES} code={code} setCode={setCode}
          handleLanguageChange={handleLanguageChange} handleRun={handleRun} handleSubmit={handleSubmit}
          isRunning={isRunning} isSubmitting={isSubmitting} output={output} result={result}
          question={question}
          editorMode={editorMode} functionAvailable={functionAvailable} onCycleMode={handleCycleMode}
          runResults={runResults} runReviewHints={runReviewHints}
          useCustomInput={useCustomInput} customInput={customInput}
          setCustomInput={setCustomInput} setUseCustomInput={setUseCustomInput}
          extraCases={extraCases} setExtraCases={setExtraCases}
        />
      </PanelErrorBoundary>
    </div>
  );

  // In a real (non-practice) proctored test, the solve page enforces the same
  // proctoring as the test landing page. ProctoringGuard owns camera, fullscreen,
  // tab-switch, clipboard, so no separate page-level effect is needed.
  // While testData is still loading, we show a spinner so ProctoringGuard is
  // not first rendered without it then remounted — avoids camera double-start.
  if (isTestMode && !isPractice) {
    if (!testData) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <ProctoringGuard
        testId={testData.id}
        testSettings={{
          proctoringEnabled: testData.proctoringEnabled,
          cameraRequired: testData.cameraRequired,
          fullscreenRequired: testData.fullscreenRequired,
          maxTabSwitches: testData.maxTabSwitches || 7,
          snapshotIntervalSeconds: testData.snapshotIntervalSeconds || 300,
        }}
        onRequestSubmit={handleOpenSubmitPopup}
      >
        {pageContent}
      </ProctoringGuard>
    );
  }

  return pageContent;
}

function RightPanel({ language, languages, code, setCode, handleLanguageChange, handleRun, handleSubmit, isRunning, isSubmitting, output, result, question, editorMode, functionAvailable, onCycleMode, runResults, runReviewHints, useCustomInput, customInput, setCustomInput, setUseCustomInput, extraCases, setExtraCases }) {
  const [outputHeight, setOutputHeight] = useState(220);
  const [bottomTab, setBottomTab] = useState('testcase');
  const [activeCase, setActiveCase] = useState(0);
  const customCases = extraCases;
  const setCustomCases = setExtraCases;
  const dragging = useRef(false);
  const containerRef = useRef(null);

  const sampleTCs = question?.testCases?.filter(tc => tc.isSample) || [];
  const baseCases = sampleTCs.length > 0
    ? sampleTCs.map(tc => ({ input: tc.input, expected: tc.expectedOutput, editable: false }))
    : question?.sampleInput
      ? [{ input: question.sampleInput, expected: question.sampleOutput, editable: false }]
      : [];
  const allCases = [...baseCases, ...customCases];

  const addCustomCase = () => {
    setCustomCases(prev => [...prev, { input: '', expected: '', editable: true }]);
    setActiveCase(allCases.length);
  };

  const removeCustomCase = (customIdx) => {
    setCustomCases(prev => prev.filter((_, i) => i !== customIdx));
    setActiveCase(0);
  };

  const updateCustomCase = (customIdx, field, value) => {
    setCustomCases(prev => prev.map((c, i) => i === customIdx ? { ...c, [field]: value } : c));
  };

  React.useEffect(() => {
    if (runResults.length > 0) setBottomTab('result');
    if (result) setBottomTab('result');
  }, [runResults.length, result]);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    const onMouseMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setOutputHeight(Math.max(100, Math.min(rect.bottom - e.clientY, rect.height - 100)));
    };
    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  return (
      <div ref={containerRef} className="flex-1 flex flex-col">
        {/* Editor Toolbar */}
        <div className="bg-slate-900 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-1.5 text-sm"
              value={language.value} onChange={(e) => handleLanguageChange(e.target.value)}>
              {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <button type="button" onClick={onCycleMode}
              title={functionAvailable
                ? 'Template: click to switch between Function / Default / CP'
                : 'Template: click to switch between Default / CP'}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                editorMode === 'function'
                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25'
                  : editorMode === 'cp'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-slate-800 text-slate-400 border-slate-600 hover:text-white'
              }`}>
              {editorMode === 'function' ? 'ƒ Function' : editorMode === 'cp' ? '⚡ CP' : '📝 Default'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleRun} disabled={isRunning} className="btn-secondary text-sm py-1.5 px-4 flex items-center gap-1.5">
              {isRunning ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Play className="w-4 h-4" />}
              Run
            </button>
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="btn-success text-sm py-1.5 px-4 flex items-center gap-1.5">
              {isSubmitting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send className="w-4 h-4" />}
              Submit
            </button>
          </div>
        </div>

        {/* Code Editor */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor height="100%" language={language.monaco} value={code} theme="vs-dark"
            onChange={(v) => setCode(v || '')}
            options={{ fontSize: 14, minimap:{enabled:false}, padding:{top:12}, scrollBeyondLastLine:false, automaticLayout:true, tabSize:4, fontFamily:"'JetBrains Mono','Fira Code',monospace" }}
          />
        </div>

        {/* Drag Handle */}
        <div onMouseDown={onMouseDown}
          className="h-2 bg-slate-800 border-y border-slate-700 cursor-row-resize flex items-center justify-center hover:bg-indigo-500/20 transition-colors group">
          <GripHorizontal className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
        </div>

        {/* Bottom Panel — Testcase / Test Result tabs (LeetCode-style) */}
        <div style={{ height: outputHeight }} className="bg-slate-900 flex flex-col flex-shrink-0">
          {/* Tab bar */}
          <div className="flex items-center border-b border-slate-700 px-4 gap-3 flex-shrink-0">
            <button type="button" onClick={() => setBottomTab('testcase')}
              className={`py-2 text-xs font-medium border-b-2 transition-all ${bottomTab === 'testcase' ? 'text-white border-emerald-500' : 'text-slate-400 border-transparent hover:text-white'}`}>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Testcase</span>
            </button>
            <button type="button" onClick={() => setBottomTab('result')}
              className={`py-2 text-xs font-medium border-b-2 transition-all ${bottomTab === 'result' ? 'text-white border-emerald-500' : 'text-slate-400 border-transparent hover:text-white'}`}>
              <span className="flex items-center gap-1.5">{'>'}_  Test Result</span>
            </button>
            {(result || runResults.length > 0) && (
              <span className={`ml-auto text-[11px] ${result?.status === 'ACCEPTED' || runResults.every(r => r.status === 'PASSED') ? 'text-emerald-400' : 'text-red-400'}`}>
                {result
                  ? `${result.testCasesPassed}/${result.totalTestCases} passed`
                  : `${runResults.filter(r => r.status === 'PASSED').length}/${runResults.length} passed`}
                {result && typeof result.executionTimeMs === 'number' && result.status !== 'COMPILATION_ERROR' && ` • ${result.executionTimeMs} ms`}
              </span>
            )}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {/* ── Testcase tab ── */}
            {bottomTab === 'testcase' && (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {allCases.map((c, i) => (
                    <button key={i} type="button" onClick={() => setActiveCase(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        activeCase === i
                          ? 'bg-slate-700 text-white border-slate-500'
                          : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white'
                      }`}>
                      Case {i + 1}
                      {c.editable && (
                        <span onClick={(e) => { e.stopPropagation(); removeCustomCase(i - baseCases.length); }}
                          className="ml-0.5 text-slate-500 hover:text-red-400 cursor-pointer">
                          <X className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  ))}
                  <button type="button" onClick={addCustomCase}
                    className="px-2 py-1.5 rounded-lg text-xs text-slate-400 border border-dashed border-slate-600 hover:border-slate-400 hover:text-white transition-all flex items-center gap-1"
                    title="Add custom test case">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {allCases[activeCase] && !allCases[activeCase].editable && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1.5">Input</p>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/60">
                        <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap">{allCases[activeCase].input}</pre>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1.5">Expected</p>
                      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/60">
                        <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap">{allCases[activeCase].expected}</pre>
                      </div>
                    </div>
                  </div>
                )}

                {allCases[activeCase] && allCases[activeCase].editable && (() => {
                  const ci = activeCase - baseCases.length;
                  return (
                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1.5">Input</p>
                        <textarea
                          className="w-full bg-slate-800/50 border border-slate-700/60 rounded-lg p-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-y min-h-[60px]"
                          placeholder="Enter input..."
                          value={customCases[ci]?.input || ''}
                          onChange={(e) => updateCustomCase(ci, 'input', e.target.value)}
                        />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1.5">Expected (optional)</p>
                        <textarea
                          className="w-full bg-slate-800/50 border border-slate-700/60 rounded-lg p-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-y min-h-[40px]"
                          placeholder="Enter expected output (optional)..."
                          value={customCases[ci]?.expected || ''}
                          onChange={(e) => updateCustomCase(ci, 'expected', e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })()}

                {allCases.length === 0 && (
                  <p className="text-sm text-slate-500">No sample test cases. Click + to add your own.</p>
                )}
              </div>
            )}

            {/* ── Test Result tab ── */}
            {bottomTab === 'result' && (
              <div className="p-4">
                {/* After Submit — same style as Run with case pills */}
                {result && (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-lg font-bold ${result.status === 'ACCEPTED' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {getVerdictLabel(result.status)}
                      </span>
                      {typeof result.executionTimeMs === 'number' && result.status !== 'COMPILATION_ERROR' && (
                        <span className="text-xs text-slate-400">Runtime: {result.executionTimeMs} ms</span>
                      )}
                    </div>

                    {(result.status === 'COMPILATION_ERROR' || result.status === 'RUNTIME_ERROR') && (
                      <pre className="text-sm font-mono text-red-300 whitespace-pre-wrap bg-slate-800/60 rounded-lg p-3 mb-3 border border-red-500/20">{output}</pre>
                    )}

                    {result.testCasesPassed !== undefined && (
                      <p className="text-xs text-slate-400 mb-3">{result.testCasesPassed}/{result.totalTestCases} testcases passed</p>
                    )}

                    {/* Case pills — sample cases + failed case */}
                    {(() => {
                      const submitCases = [];
                      allCases.forEach((c, i) => {
                        submitCases.push({ label: `Case ${i + 1}`, input: c.input, expected: c.expected, actual: null, status: null });
                      });
                      if (result.failedInput && result.status !== 'ACCEPTED') {
                        const alreadyShown = submitCases.some(c => c.input === result.failedInput);
                        if (!alreadyShown) {
                          submitCases.push({
                            label: `TC ${result.failedTestCaseNumber}`,
                            input: result.failedInput,
                            expected: result.failedExpected,
                            actual: result.failedActual,
                            status: 'FAILED',
                          });
                        } else {
                          const match = submitCases.find(c => c.input === result.failedInput);
                          if (match) { match.actual = result.failedActual; match.status = 'FAILED'; }
                        }
                      }
                      if (result.status === 'ACCEPTED') {
                        submitCases.forEach(c => { c.status = 'PASSED'; });
                      }
                      if (submitCases.length === 0) return null;
                      const safeActive = Math.min(activeCase, submitCases.length - 1);
                      const cur = submitCases[safeActive];
                      return (
                        <>
                          <div className="flex items-center gap-2 my-3 flex-wrap">
                            {submitCases.map((c, i) => (
                              <button key={i} type="button" onClick={() => setActiveCase(i)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                                  (safeActive === i)
                                    ? 'bg-slate-700 text-white border-slate-500'
                                    : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white'
                                }`}>
                                {c.status === 'PASSED'
                                  ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  : c.status === 'FAILED'
                                    ? <XCircle className="w-3 h-3 text-red-400" />
                                    : null}
                                {c.label}
                              </button>
                            ))}
                          </div>
                          {cur && (
                            <div className="space-y-2.5">
                              <div>
                                <p className="text-[11px] text-slate-500 mb-1">Input</p>
                                <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/60">
                                  <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap">{cur.input}</pre>
                                </div>
                              </div>
                              {cur.expected && (
                                <div>
                                  <p className="text-[11px] text-slate-500 mb-1">Expected</p>
                                  <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/60">
                                    <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap">{cur.expected}</pre>
                                  </div>
                                </div>
                              )}
                              {cur.actual != null && (
                                <div>
                                  <p className="text-[11px] text-slate-500 mb-1">Output</p>
                                  <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/60">
                                    <pre className={`text-sm font-mono whitespace-pre-wrap ${cur.status === 'PASSED' ? 'text-emerald-300' : 'text-red-300'}`}>{cur.actual || '(empty)'}</pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}

                {/* After Run — sample case pills */}
                {!result && runResults.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-lg font-bold ${runResults.every(r => r.status === 'PASSED') ? 'text-emerald-400' : 'text-red-400'}`}>
                        {runResults.every(r => r.status === 'PASSED') ? 'Accepted' : 'Wrong Answer'}
                      </span>
                      {runResults[activeCase]?.executionTimeMs != null && (
                        <span className="text-xs text-slate-400">Runtime: {runResults[activeCase].executionTimeMs} ms</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 my-3 flex-wrap">
                      {runResults.map((r, i) => (
                        <button key={i} type="button" onClick={() => setActiveCase(i)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            activeCase === i
                              ? 'bg-slate-700 text-white border-slate-500'
                              : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-white'
                          }`}>
                          {r.status === 'PASSED'
                            ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            : <XCircle className="w-3 h-3 text-red-400" />}
                          Case {i + 1}
                        </button>
                      ))}
                    </div>

                    {runResults[activeCase] && (
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-[11px] text-slate-500 mb-1">Input</p>
                          <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/60">
                            <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap">{runResults[activeCase].input}</pre>
                          </div>
                        </div>
                        {runResults[activeCase].expected && (
                          <div>
                            <p className="text-[11px] text-slate-500 mb-1">Expected</p>
                            <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/60">
                              <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap">{runResults[activeCase].expected}</pre>
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-[11px] text-slate-500 mb-1">Output</p>
                          <div className="bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/60">
                            <pre className={`text-sm font-mono whitespace-pre-wrap ${runResults[activeCase].status === 'PASSED' ? 'text-emerald-300' : 'text-red-300'}`}>{runResults[activeCase].actual || '(empty)'}</pre>
                          </div>
                        </div>
                        {runResults[activeCase].error && (
                          <div>
                            <p className="text-[11px] text-slate-500 mb-1">Error</p>
                            <div className="bg-slate-800/50 rounded-lg p-2.5 border border-red-500/20">
                              <pre className="text-sm font-mono text-red-300 whitespace-pre-wrap">{runResults[activeCase].error}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {runReviewHints.length > 0 && (
                      <div className="mt-4 rounded-xl bg-violet-500/10 border border-violet-500/25 p-3">
                        <p className="text-[11px] font-semibold text-violet-300 mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Code Coach
                        </p>
                        <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                          {runReviewHints.map((line, i) => (<li key={i}>{line}</li>))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* Loading — fancy animation */}
                {(isRunning || isSubmitting) && !result && runResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-[3px] border-slate-700 border-t-emerald-400 animate-spin"></div>
                      <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-b-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-300">
                        {isSubmitting ? 'Judging against all test cases...' : 'Running test cases...'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {isSubmitting ? 'This runs your code against all hidden tests' : 'Executing against sample inputs'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Empty */}
                {!isRunning && !isSubmitting && !result && runResults.length === 0 && (
                  <div className="text-sm text-slate-500">Run or submit your code to see results...</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

function SubmitTestModal({ questionStatus, loadingStatus, submitting, onClose, onSubmit }) {
  const accepted = questionStatus.filter(q => q.status === 'ACCEPTED').length;
  const attempted = questionStatus.filter(q => q.status === 'ATTEMPTED').length;
  const notAttempted = questionStatus.filter(q => q.status === 'NOT_ATTEMPTED').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="glass-card w-full max-w-xs mx-4 p-0 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-white">Submit Test</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3">
          {loadingStatus ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <div className="flex-1 rounded-lg py-2 text-center bg-emerald-600/15 border border-emerald-600/25">
                  <p className="text-lg font-bold text-emerald-500">{accepted}</p>
                  <p className="text-[10px] text-emerald-600">Solved</p>
                </div>
                <div className="flex-1 rounded-lg py-2 text-center bg-red-500/10 border border-red-500/20">
                  <p className="text-lg font-bold text-red-500">{attempted}</p>
                  <p className="text-[10px] text-red-500">Failed</p>
                </div>
                <div className="flex-1 rounded-lg py-2 text-center bg-slate-500/10 border border-slate-600/20">
                  <p className="text-lg font-bold text-slate-400">{notAttempted}</p>
                  <p className="text-[10px] text-slate-500">Pending</p>
                </div>
              </div>

              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {questionStatus.map((q) => (
                  <div key={q.questionId}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                      q.status === 'ACCEPTED' ? 'bg-emerald-600/10' : q.status === 'ATTEMPTED' ? 'bg-red-500/10' : 'bg-slate-800/20'
                    }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      q.status === 'ACCEPTED' ? 'bg-emerald-600/25 text-emerald-500'
                      : q.status === 'ATTEMPTED' ? 'bg-red-500/25 text-red-500'
                      : 'bg-slate-600/30 text-slate-500'
                    }`}>{q.questionNumber}</span>
                    <span className="flex-1 truncate text-slate-300">{q.title || `Question ${q.questionNumber}`}</span>
                    <span className={`text-[10px] font-medium ${
                      q.status === 'ACCEPTED' ? 'text-emerald-500' : q.status === 'ATTEMPTED' ? 'text-red-500' : 'text-slate-500'
                    }`}>
                      {q.status === 'ACCEPTED' ? '✓' : q.status === 'ATTEMPTED' ? '✗' : '—'}
                    </span>
                  </div>
                ))}
              </div>

              {notAttempted > 0 && (
                <div className="mt-2.5 px-2.5 py-2 rounded-md bg-orange-900/20 border border-orange-800/30 flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-orange-500 font-medium">
                    {notAttempted} unanswered — cannot modify after submit.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-slate-700/50">
          <button onClick={onClose} className="btn-secondary flex-1 py-1.5 text-xs">Back</button>
          <button onClick={onSubmit} disabled={submitting || loadingStatus}
            className="btn-success flex-1 py-1.5 text-xs flex items-center justify-center gap-1.5">
            {submitting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send className="w-3 h-3" />}
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
