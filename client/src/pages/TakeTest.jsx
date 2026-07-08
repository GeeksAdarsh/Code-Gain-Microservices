import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { testAPI, questionAPI, mcqAPI } from '../services/api';
import { Clock, ArrowRight, CheckCircle2, Circle, AlertTriangle, Play, X, Send, RotateCcw, RefreshCw, Trophy, ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ProctoringGuard from '../components/ProctoringGuard';

function UpcomingCountdown({ startTime, onLive }) {
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(startTime) - new Date();
      if (diff <= 0) { onLive(); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setCountdown(`${d}d ${h}h ${m}m ${s}s`);
      else if (h > 0) setCountdown(`${h}h ${m}m ${s}s`);
      else setCountdown(`${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime, onLive]);

  return (
    <div className="space-y-4">
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6">
        <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Test starts in</p>
        <p className="text-3xl font-bold text-indigo-400 font-mono">{countdown}</p>
        <p className="text-xs text-slate-500 mt-2">
          📅 {new Date(startTime).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
        </p>
      </div>
      <p className="text-xs text-slate-500">The page will auto-refresh when the test goes live.</p>
    </div>
  );
}

export default function TakeTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const [started, setStarted] = useState(searchParams.get('started') === 'true');
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [questionStatus, setQuestionStatus] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completionData, setCompletionData] = useState(null);
  const [isPracticeMode, setIsPracticeMode] = useState(searchParams.get('practice') === 'true');
  const [mcqQuestions, setMcqQuestions]   = useState([]);
  const [activeSection, setActiveSection] = useState('coding');
  const [mcqSelected, setMcqSelected]     = useState({});
  const [mcqCurrentIdx, setMcqCurrentIdx] = useState(0);
  const [mcqFlagged, setMcqFlagged]       = useState({});
  const [cameraActive, setCameraActive]   = useState(false);
  const cameraStreamRef                   = useRef(null);

  /* ── Live leaderboard ───────────────────────────────────────────────── */
  const [showLB,   setShowLB]   = useState(false);
  const [lbData,   setLbData]   = useState([]);
  const [lbLoading,setLbLoading]= useState(false);
  const lbIntervalRef = useRef(null);
  // Map of questionId → { title, difficulty } loaded lazily for the question list
  const [questionMap, setQuestionMap]     = useState({});

  useEffect(() => { loadTest(); checkCompletion(); }, [id]);

  // Pre-load question status as soon as the student starts (for status icons in list)
  useEffect(() => {
    if (started && !isPracticeMode) loadQuestionStatus();
  }, [started, isPracticeMode]);

  /* ── Leaderboard: fetch once when panel opens, then every 30s ───── */
  const fetchLB = async () => {
    if (!id) return;
    setLbLoading(true);
    try {
      const res = await testAPI.getLeaderboard(id);
      setLbData(res.data || []);
    } catch { /* non-fatal */ }
    finally { setLbLoading(false); }
  };

  useEffect(() => {
    if (!showLB || isPracticeMode) { clearInterval(lbIntervalRef.current); return; }
    fetchLB();
    lbIntervalRef.current = setInterval(fetchLB, 30000);
    return () => clearInterval(lbIntervalRef.current);
  }, [showLB, isPracticeMode, id]); // eslint-disable-line

  const loadTest = async () => {
    try {
      const res = await testAPI.getById(id);
      setTest(res.data);
      // Fetch question titles for the coding question list
      const qIds = res.data?.questionIds || [];
      if (qIds.length > 0) {
        Promise.allSettled(qIds.map(qId => questionAPI.getById(qId)))
          .then(results => {
            const map = {};
            results.forEach((r, i) => {
              if (r.status === 'fulfilled') {
                map[qIds[i]] = { title: r.value.data?.title, difficulty: r.value.data?.difficulty };
              }
            });
            setQuestionMap(map);
          });
      }
      mcqAPI.getQuestions(id, false).then(r => {
        setMcqQuestions(r.data);
        const saved = {};
        r.data.forEach(q => { if (q.selectedOption) saved[q.id] = q.selectedOption; });
        setMcqSelected(saved);
      }).catch(() => {});
    } catch (err) { toast.error('Failed to load test'); }
    finally { setLoading(false); }
  };

  const checkCompletion = async () => {
    try {
      const res = await testAPI.isCompleted(id);
      if (res.data.completed) {
        setCompletionData(res.data);
      }
    } catch (err) {}
  };

  const loadQuestionStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await testAPI.getQuestionStatus(id);
      setQuestionStatus(res.data);
    } catch (err) { toast.error('Failed to load question status'); }
    finally { setLoadingStatus(false); }
  };

  const handleOpenSubmitPopup = async () => {
    await loadQuestionStatus();
    setShowSubmitPopup(true);
  };

  const handleSubmitTest = async () => {
    setSubmitting(true);
    try {
      const res = await testAPI.submitTest(id);
      setShowSubmitPopup(false);
      toast.success('Test submitted successfully!');
      try { sessionStorage.removeItem('proctor_violations'); sessionStorage.removeItem('proctor'); } catch {}
      setCompletionData({
        completed: true,
        autoSubmitted: false,
        totalScore: res.data.totalScore,
        totalMaxMarks: res.data.totalMaxMarks,
        percentage: res.data.percentage,
        mcqScore: res.data.mcqScore,
        mcqMaxMarks: res.data.mcqMaxMarks,
        codingScore: res.data.codingScore,
        questionsAccepted: res.data.questionsAccepted,
        totalQuestions: res.data.totalQuestions,
      });
      navigate('/contests');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('already submitted') || err.response?.status === 409) {
        toast.error('You have already submitted this test');
        navigate('/contests');
      } else {
        toast.error(msg || 'Failed to submit test');
      }
    } finally { setSubmitting(false); }
  };

  const handleStartPractice = () => {
    setIsPracticeMode(true);
    setStarted(true);
  };

  useEffect(() => {
    if (!test || !started || isPracticeMode) return;
    const end = test.endTime ? new Date(test.endTime) : null;
    if (!end) return;

    const tick = () => {
      const diff = end - new Date();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        toast.error('Time is up! Submitting your test...');
        handleOpenSubmitPopup();
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [test, started, isPracticeMode]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!test) return <div className="text-center text-slate-400 py-20">Test not found</div>;

  const now = new Date();
  const startTime = test.startTime ? new Date(test.startTime) : null;
  const endTime = test.endTime ? new Date(test.endTime) : null;
  const isCompleted = !!completionData?.completed;
  const joinWindow = test.joinWindowMinutes || 20;
  const joinDeadline = startTime ? new Date(startTime.getTime() + joinWindow * 60000) : null;
  const isLive = startTime && endTime && now >= startTime && now <= endTime;
  const isJoinWindowClosed = isLive && joinDeadline && now > joinDeadline && !isCompleted;
  const isUpcoming = startTime && now < startTime;
  const isEnded = endTime && now > endTime;

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="glass-card p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-2">{test.title}</h1>
          {test.description && <p className="text-slate-400 mb-6">{test.description}</p>}

          <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div className="glass-card p-3">
              <p className="text-xl font-bold text-white">{test.totalQuestions}</p>
              <p className="text-slate-500">Questions</p>
            </div>
            <div className="glass-card p-3">
              <p className="text-xl font-bold text-white">{test.durationMinutes}</p>
              <p className="text-slate-500">Minutes</p>
            </div>
            <div className="glass-card p-3">
              <p className="text-xl font-bold text-white">
                {isCompleted ? '✅ Done' : isLive ? '🟢 Live' : isUpcoming ? '🕐 Upcoming' : '⏹ Ended'}
              </p>
              <p className="text-slate-500">Status</p>
            </div>
          </div>

          {test.startTime && (
            <p className="text-xs text-slate-500 mb-2">
              📅 {new Date(test.startTime).toLocaleString('en-IN')} — {new Date(test.endTime).toLocaleString('en-IN')}
            </p>
          )}

          {isCompleted && (
            <div className="mb-6">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Test Completed</span>
                </div>
                <div className="flex justify-center gap-6 text-sm flex-wrap">
                  <span className="text-slate-300">Score: <strong className="text-emerald-400">{completionData.percentage ?? 0}%</strong></span>
                  {completionData.totalMaxMarks != null && (
                    <span className="text-slate-300">Marks: <strong className="text-emerald-400">{completionData.totalScore}/{completionData.totalMaxMarks}</strong></span>
                  )}
                  {completionData.mcqMaxMarks > 0 && (
                    <span className="text-slate-300">MCQ: <strong className="text-emerald-400">{completionData.mcqScore}/{completionData.mcqMaxMarks}</strong></span>
                  )}
                  <span className="text-slate-300">Solved: <strong className="text-emerald-400">{completionData.questionsAccepted}/{completionData.totalQuestions}</strong></span>
                </div>
              </div>
              <button onClick={handleStartPractice}
                className="btn-secondary text-sm px-8 py-2.5 flex items-center gap-2 mx-auto">
                <RotateCcw className="w-4 h-4" /> Practice Mode
              </button>
              <p className="text-xs text-slate-500 mt-2">Review questions without timer or submission limits</p>
            </div>
          )}

          {isLive && !isCompleted && !isJoinWindowClosed && (
            <>
              <div className="bg-amber-600/10 border border-amber-600/20 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Instructions
                </h3>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• Complete all questions within the time limit</li>
                  <li>• You can navigate between questions freely</li>
                  <li>• Submit each question's solution individually</li>
                  <li>• Your best submission for each question is counted</li>
                  <li>• Join window closes {joinWindow} minutes after test starts</li>
                  {test.proctoringEnabled && <li>• ⚠️ Proctoring is enabled — camera & tab monitoring active</li>}
                </ul>
              </div>
              <button onClick={() => setStarted(true)}
                className="btn-primary text-lg px-10 py-3 flex items-center gap-2 mx-auto">
                <Play className="w-5 h-5" /> Start Test
              </button>
            </>
          )}

          {isJoinWindowClosed && (
            <div className="mb-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-semibold text-sm mb-1">Join Window Closed</p>
                <p className="text-xs text-slate-400">
                  The {joinWindow}-minute join window has passed. You can no longer enter this test.
                  <br/>Join window closed at {joinDeadline?.toLocaleString('en-IN', { timeStyle: 'short' })}.
                </p>
              </div>
            </div>
          )}

          {isUpcoming && (
            <UpcomingCountdown startTime={test.startTime} onLive={() => window.location.reload()} />
          )}

          {isEnded && !isCompleted && (
            <div className="mb-6">
              <div className="bg-slate-500/10 border border-slate-500/30 rounded-lg p-4 mb-4">
                <p className="text-slate-400 text-sm mb-1">This test has ended.</p>
                <p className="text-xs text-slate-500">You can still practice the problems without timer or scoring.</p>
              </div>
              <button onClick={handleStartPractice}
                className="btn-secondary text-sm px-8 py-2.5 flex items-center gap-2 mx-auto">
                <Play className="w-4 h-4" /> Practice Mode
              </button>
            </div>
          )}

          <button onClick={() => navigate('/contests')} className="text-sm text-slate-400 hover:text-white mt-4 inline-block">
            ← Back to contests
          </button>
        </div>
      </div>
    );
  }

  const accepted = questionStatus.filter(q => q.status === 'ACCEPTED').length;
  const attempted = questionStatus.filter(q => q.status === 'ATTEMPTED').length;
  const notAttempted = questionStatus.filter(q => q.status === 'NOT_ATTEMPTED').length;

  return (
    <ProctoringGuard
      testId={test.id}
      testSettings={{
        proctoringEnabled: test.proctoringEnabled && !isPracticeMode,
        cameraRequired: test.cameraRequired && !isPracticeMode,
        fullscreenRequired: test.fullscreenRequired && !isPracticeMode,
        maxTabSwitches: test.maxTabSwitches || 7,
        snapshotIntervalSeconds: test.snapshotIntervalSeconds || 300,
      }}
      onRequestSubmit={handleOpenSubmitPopup}
      onCameraReady={(active, stream) => {
        setCameraActive(active);
        cameraStreamRef.current = stream || null;
      }}
      hideThumbnail={activeSection === 'mcq' && !isPracticeMode}
    >
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Timer Bar */}
      <div className="glass-card p-3 mb-4 flex items-center justify-between sticky z-30">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {test.title}
            {isPracticeMode && <span className="text-xs bg-amber-600/20 text-amber-600 px-2 py-0.5 rounded-full font-normal">Practice Mode</span>}
          </h2>
          <p className="text-xs text-slate-500">{test.totalQuestions} questions</p>
        </div>
        <div className="flex items-center gap-3">
          {!isPracticeMode && (
            <button onClick={handleOpenSubmitPopup}
              className="btn-success text-sm py-2 px-4 flex items-center gap-1.5">
              <Send className="w-4 h-4" /> Submit Test
            </button>
          )}
          {isPracticeMode ? (
            <div className="px-4 py-2 rounded-lg bg-amber-600/15 text-amber-600 text-sm font-medium">
              No Timer
            </div>
          ) : (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
              timeLeft && timeLeft < '00:10:00' ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-amber-600/15 text-amber-600'
            }`}>
              <Clock className="w-5 h-5" />
              {timeLeft || '--:--:--'}
            </div>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      {mcqQuestions.length > 0 && (
        <div className="flex gap-1 mb-4">
          <button onClick={() => setActiveSection('coding')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeSection === 'coding' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            Coding ({test.questionIds?.length || 0})
          </button>
          <button onClick={() => setActiveSection('mcq')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeSection === 'mcq' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            MCQ ({mcqQuestions.length})
          </button>
        </div>
      )}

      {/* Coding Questions */}
      {activeSection === 'coding' && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800/40">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Coding Questions</span>
            <button onClick={loadTest}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <RefreshCw className="w-3 h-3" /> Reload
            </button>
          </div>
          <div className="divide-y divide-slate-800/30">
            {test.questionIds?.map((qId, i) => {
              const qInfo = questionMap[qId];
              const qStatus = questionStatus.find(q => String(q.questionId) === String(qId));
              const diffColor = qInfo?.difficulty === 'EASY' ? 'text-emerald-400'
                : qInfo?.difficulty === 'MEDIUM' ? 'text-amber-400'
                : qInfo?.difficulty === 'HARD' ? 'text-red-400' : 'text-slate-500';
              return (
                <Link key={qId} to={`/problem/${qId}?testId=${test.id}${isPracticeMode ? '&practice=true' : ''}`}
                  className="flex items-center px-5 py-4 hover:bg-slate-800/20 group gap-3">
                  {qStatus?.status === 'ACCEPTED'
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    : qStatus?.status === 'ATTEMPTED'
                      ? <Circle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      : <Circle className="w-5 h-5 text-slate-700 flex-shrink-0 group-hover:text-amber-500" />}
                  <span className="text-xs text-slate-600 font-mono flex-shrink-0 w-5">{i + 1}.</span>
                  <span className="text-sm text-slate-300 group-hover:text-white flex-1 truncate">
                    {qInfo?.title || `Question ${i + 1}`}
                  </span>
                  {qInfo?.difficulty && (
                    <span className={`text-[11px] font-semibold flex-shrink-0 ${diffColor}`}>
                      {qInfo.difficulty.charAt(0) + qInfo.difficulty.slice(1).toLowerCase()}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-500 flex-shrink-0" />
                </Link>
              );
            })}
            {(!test.questionIds || test.questionIds.length === 0) && (
              <div className="py-10 text-center text-slate-500 text-sm">No coding questions in this test</div>
            )}
          </div>
        </div>
      )}

      {/* MCQ Questions – full exam-style layout */}
      {activeSection === 'mcq' && (
        <div className="fixed inset-0 z-40 flex flex-col" style={{ top: 0, left: 0, backgroundColor: '#f5f5f5' }}>

          {/* ── Top header bar ── */}
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <button onClick={() => setActiveSection('coding')}
                className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1">
                ← Back to Coding
              </button>
              <span className="h-4 w-px bg-gray-200" />
              <h1 className="text-sm font-semibold text-gray-800 truncate">{test.title}</h1>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono flex-shrink-0">
                Q {mcqCurrentIdx + 1} / {mcqQuestions.length}
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {Object.keys(mcqSelected).length} Answered
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {!isPracticeMode && (
                <button onClick={handleOpenSubmitPopup}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-500 font-semibold transition-colors">
                  <Send className="w-3.5 h-3.5" /> Submit Test
                </button>
              )}
              <div className={`flex items-center gap-1.5 text-sm font-mono font-bold px-3 py-1.5 rounded-lg ${
                timeLeft && timeLeft < '00:10:00' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'
              }`}>
                <Clock className="w-4 h-4" />
                {isPracticeMode ? 'Practice' : (timeLeft || '--:--:--')}
              </div>
            </div>
          </div>

          {/* ── Main content: question + right sidebar ── */}
          <div className="flex flex-1 overflow-hidden">

            {/* Question area */}
            <div className="flex-1 overflow-y-auto flex flex-col p-5 min-w-0">
              {mcqQuestions.length > 0 && (() => {
                const q       = mcqQuestions[mcqCurrentIdx];
                const selected = mcqSelected[q.id];
                const flagged  = mcqFlagged[q.id];
                const showResult = isPracticeMode && selected;

                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full">

                    {/* Question header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50 rounded-t-2xl flex-shrink-0">
                      <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest">Question</span>
                      <button
                        onClick={() => setMcqFlagged(prev => { const n = {...prev}; if (n[q.id]) delete n[q.id]; else n[q.id] = true; return n; })}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          flagged ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}>
                        <svg className="w-3.5 h-3.5" fill={flagged ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M3 3h13l-3 5 3 5H3" />
                        </svg>
                        Flag for Review
                      </button>
                    </div>

                    {/* Question body */}
                    <div className="flex-1 overflow-y-auto px-6 pt-5 pb-4">
                      <p className="text-[15px] font-medium text-gray-800 leading-relaxed mb-7">{q.question}</p>

                      <div className="space-y-3">
                        {['A', 'B', 'C', 'D'].map(opt => {
                          const optText   = q[`option${opt}`];
                          const isSel     = selected === opt;
                          const isCorrect = showResult && q.correctOption === opt;
                          const isWrong   = showResult && isSel && q.correctOption !== opt;
                          return (
                            <button key={opt} type="button"
                              disabled={isPracticeMode && !!selected}
                              onClick={async () => {
                                if (isPracticeMode && selected) return;
                                if (selected === opt) return;
                                setMcqSelected(prev => ({ ...prev, [q.id]: opt }));
                                try {
                                  await mcqAPI.submitAnswer(q.id, opt);
                                  if (isPracticeMode) {
                                    const r = await mcqAPI.getQuestions(test.id, true);
                                    setMcqQuestions(r.data);
                                  }
                                } catch { toast.error('Failed to save answer'); }
                              }}
                              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl border text-left text-sm transition-all
                                ${isCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-800' :
                                  isWrong   ? 'border-red-400 bg-red-50 text-red-800' :
                                  isSel     ? 'border-emerald-400 bg-emerald-50 text-emerald-800' :
                                  'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                                }`}>
                              {/* Radio circle */}
                              <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                isCorrect || isSel ? 'border-emerald-500 bg-emerald-500' :
                                isWrong           ? 'border-red-500 bg-red-500' :
                                'border-gray-300 bg-white'
                              }`}>
                                {(isSel || isCorrect) && <span className="w-2 h-2 rounded-full bg-white block" />}
                              </span>
                              <span className={`text-xs font-bold w-5 flex-shrink-0 ${isSel||isCorrect ? 'text-emerald-700' : isWrong ? 'text-red-600' : 'text-gray-400'}`}>{opt}</span>
                              <span className="flex-1">{optText}</span>
                              {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {showResult && q.explanation && (
                        <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
                          <p className="text-xs text-blue-600 font-semibold mb-1">Explanation</p>
                          <p className="text-sm text-blue-700">{q.explanation}</p>
                        </div>
                      )}
                    </div>

                    {/* Bottom nav */}
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
                      <button
                        disabled={mcqCurrentIdx === 0}
                        onClick={() => setMcqCurrentIdx(i => i - 1)}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        ← Previous
                      </button>
                      <button
                        disabled={!selected}
                        onClick={async () => {
                          if (!selected) return;
                          const prev = selected;
                          setMcqSelected(s => { const n = {...s}; delete n[q.id]; return n; });
                          try { await mcqAPI.submitAnswer(q.id, null); } catch { setMcqSelected(s => ({...s, [q.id]: prev})); }
                        }}
                        className="px-5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        Clear Answer
                      </button>
                      <button
                        disabled={mcqCurrentIdx === mcqQuestions.length - 1}
                        onClick={() => setMcqCurrentIdx(i => i + 1)}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                        Next →
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ── Right sidebar: camera + question grid ── */}
            <div className="w-64 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-y-auto">

              {/* Camera preview */}
              {test.proctoringEnabled && test.cameraRequired && !isPracticeMode && (
                <div className="p-3 border-b border-gray-100 flex-shrink-0">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video w-full">
                    {cameraActive ? (
                      <>
                        <video
                          ref={el => { if (el && cameraStreamRef.current) el.srcObject = cameraStreamRef.current; }}
                          autoPlay muted playsInline className="w-full h-full object-cover" />
                        <span className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" /> LIVE
                        </span>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                        <svg className="w-8 h-8 mb-1 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
                        <span className="text-[11px] opacity-50">Camera off</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Question number grid */}
              <div className="flex-1 p-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Questions</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {mcqQuestions.map((mq, i) => {
                    const isCur  = i === mcqCurrentIdx;
                    const isAns  = !!mcqSelected[mq.id];
                    const isFlag = !!mcqFlagged[mq.id];
                    return (
                      <button key={mq.id} onClick={() => setMcqCurrentIdx(i)}
                        title={`Question ${i + 1}${isAns ? ' — Answered' : isFlag ? ' — Flagged' : ''}`}
                        className={`w-9 h-9 rounded text-[12px] font-semibold transition-all ${
                          isCur && isAns  ? 'bg-emerald-500 text-white ring-2 ring-emerald-400 ring-offset-1' :
                          isCur && isFlag ? 'bg-amber-400 text-white ring-2 ring-amber-300 ring-offset-1' :
                          isCur  ? 'bg-gray-800 text-white ring-2 ring-gray-500 ring-offset-1' :
                          isFlag ? 'bg-amber-400 text-white' :
                          isAns  ? 'bg-emerald-500 text-white' :
                          'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                        }`}>
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Current</p>
                  {[
                    { color: 'bg-emerald-500', label: 'Answered' },
                    { color: 'bg-gray-800',    label: 'Current (unanswered)' },
                    { color: 'bg-amber-400',   label: 'Flagged' },
                    { color: 'bg-gray-100 border border-gray-200', label: 'Not Attempted' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded text-[10px] flex-shrink-0 ${l.color}`} />
                      <span className="text-[11px] text-gray-400">{l.label}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                  <div className="text-center py-2 bg-emerald-50 rounded-lg">
                    <p className="text-lg font-bold text-emerald-600">{Object.keys(mcqSelected).length}</p>
                    <p className="text-[10px] text-emerald-500">Answered</p>
                  </div>
                  <div className="text-center py-2 bg-amber-50 rounded-lg">
                    <p className="text-lg font-bold text-amber-600">{Object.keys(mcqFlagged).length}</p>
                    <p className="text-[10px] text-amber-500">Flagged</p>
                  </div>
                </div>

                {isPracticeMode && (
                  <button onClick={async () => {
                    await mcqAPI.resetAnswers(test.id);
                    setMcqSelected({}); setMcqFlagged({}); setMcqCurrentIdx(0);
                    const r = await mcqAPI.getQuestions(test.id, false);
                    setMcqQuestions(r.data);
                    toast.success('MCQ answers reset!');
                  }} className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50 bg-white transition-all">
                    <RotateCcw className="w-3 h-3" /> Reset All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500 text-center mt-4">
        {isPracticeMode
          ? 'Practice mode — solve at your own pace. Answers are saved but won\'t affect your test score.'
          : activeSection === 'mcq' ? 'Select one option per question. You can change your answer anytime before submitting — the latest choice is saved.' : 'Click on any question to solve it. Your submissions are auto-saved.'}
      </p>

      {/* ── Live Leaderboard floating button + panel (z-[9000] — above MCQ z-40) ── */}
      {started && !isPracticeMode && (
        <>
          {/* Floating toggle button */}
          <button
            onClick={() => setShowLB(v => !v)}
            className="fixed bottom-16 right-4 z-[9000] flex items-center gap-2 px-3 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xl transition-all"
            title="Live Leaderboard">
            <Trophy className="w-4 h-4" />
            Leaderboard
            {lbData.length > 0 && (
              <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{lbData.length}</span>
            )}
            {showLB ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>

          {/* Slide-over panel */}
          {showLB && (
            <div className="fixed bottom-28 right-4 z-[9000] w-80 max-h-[60vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">Live Leaderboard</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={fetchLB} title="Refresh" className="p-1 rounded text-slate-400 hover:text-white transition-colors">
                    <RefreshCw className={`w-3.5 h-3.5 ${lbLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button onClick={() => setShowLB(false)} className="p-1 rounded text-slate-400 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Leaderboard content */}
              <div className="overflow-y-auto flex-1">
                {lbLoading && lbData.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : lbData.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-8">No submissions yet</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-800/90 backdrop-blur">
                      <tr className="border-b border-slate-700">
                        <th className="text-center py-2 px-2 text-slate-400 font-medium w-8">#</th>
                        <th className="text-left py-2 px-2 text-slate-400 font-medium">Name</th>
                        <th className="text-center py-2 px-2 text-slate-400 font-medium">Qs</th>
                        <th className="text-center py-2 px-2 text-slate-400 font-medium">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lbData.map((row) => {
                        const isMe = user && row.userId === user.id;
                        return (
                          <tr key={row.userId}
                            className={`border-b border-slate-800 ${isMe ? 'bg-amber-600/20' : 'hover:bg-slate-800/50'}`}>
                            <td className="py-2 px-2 text-center">
                              {row.rank <= 3 ? (
                                <span className={`font-bold ${row.rank===1?'text-yellow-400':row.rank===2?'text-slate-300':'text-amber-600'}`}>
                                  {row.rank===1?'🥇':row.rank===2?'🥈':'🥉'}
                                </span>
                              ) : (
                                <span className="text-slate-500">{row.rank}</span>
                              )}
                            </td>
                            <td className="py-2 px-2">
                              <span className={`font-medium ${isMe ? 'text-amber-400' : 'text-slate-200'}`}>
                                {row.fullName || row.username}
                              </span>
                              {isMe && <span className="ml-1 text-[9px] text-amber-500 bg-amber-500/10 px-1 rounded">You</span>}
                            </td>
                            <td className="py-2 px-2 text-center text-slate-300">
                              {row.questionsAccepted}/{row.totalQuestions}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className={`font-bold ${row.score >= 70 ? 'text-emerald-400' : row.score >= 40 ? 'text-amber-400' : 'text-slate-300'}`}>
                                {row.score}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="px-4 py-2 bg-slate-800/60 border-t border-slate-700 text-[10px] text-slate-500 flex-shrink-0">
                Auto-refreshes every 30s
              </div>
            </div>
          )}
        </>
      )}

      {/* Submit Test Popup — z-[10000] so it sits above MCQ overlay + proctoring modal */}
      {showSubmitPopup && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onClick={() => setShowSubmitPopup(false)}>
          <div className="glass-card w-full max-w-xs mx-4 p-0 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-white">Submit Test</h3>
              <button onClick={() => setShowSubmitPopup(false)} className="text-slate-400 hover:text-white">
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
              <button onClick={() => setShowSubmitPopup(false)} className="btn-secondary flex-1 py-1.5 text-xs">
                Back
              </button>
              <button onClick={handleSubmitTest} disabled={submitting || loadingStatus}
                className="btn-success flex-1 py-1.5 text-xs flex items-center justify-center gap-1.5">
                {submitting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send className="w-3 h-3" />}
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProctoringGuard>
  );
}
