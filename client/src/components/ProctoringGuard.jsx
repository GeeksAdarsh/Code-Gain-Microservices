import { useState, useEffect, useRef, useCallback } from 'react';
import { proctoringAPI } from '../services/api';
import { Camera, AlertTriangle, Eye, Shield, Maximize, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * ProctoringGuard — wraps test content with camera, tab-switch, fullscreen monitoring.
 *
 * Props:
 *   testId            – test ID for proctoring events
 *   testSettings      – { proctoringEnabled, cameraRequired, fullscreenRequired, maxTabSwitches, snapshotIntervalSeconds }
 *   onRequestSubmit   – called when student should manually submit (limit reached warning)
 *   onCameraReady     – (active: boolean, stream: MediaStream|null) => void
 *   hideThumbnail     – when true, hides the bottom-left widget (MCQ view shows its own camera)
 *   children
 */
export default function ProctoringGuard({
  testId, testSettings, onRequestSubmit, onCameraReady, hideThumbnail, children,
}) {
  const videoRef             = useRef(null);
  const streamRef            = useRef(null);
  const snapshotIntervalRef  = useRef(null);
  const hasEnteredFullscreen = useRef(false);
  const lastSwitchAt         = useRef(0);
  const modalOpenRef         = useRef(false);   // suppress tab-switch when warning modal is visible

  const [cameraActive,       setCameraActive]       = useState(false);
  const [cameraLoading,      setCameraLoading]      = useState(false);
  const [cameraDenied,       setCameraDenied]       = useState(false);
  // Restore violation count from sessionStorage so navigating between questions
  // (TakeTest → ProblemDetail → back) doesn't reset the counter to 0.
  const [tabSwitchCount,     setTabSwitchCount]     = useState(() => {
    try { return parseInt(sessionStorage.getItem('proctor_violations') || '0', 10) || 0; } catch { return 0; }
  });
  const [isFullscreen,       setIsFullscreen]       = useState(!!document.fullscreenElement);
  const [needsFullscreen,    setNeedsFullscreen]    = useState(false);
  const [showWarningModal,   setShowWarningModal]   = useState(false);
  const [warningMessage,     setWarningMessage]     = useState('');
  const [showSubmitBtn,      setShowSubmitBtn]      = useState(false);

  const {
    proctoringEnabled        = false,
    cameraRequired           = false,
    fullscreenRequired       = false,
    maxTabSwitches           = 7,
    snapshotIntervalSeconds  = 300,
  } = testSettings || {};

  // ── session storage for ProblemDetail ────────────────────────────────────────
  useEffect(() => {
    if (proctoringEnabled && testId) {
      sessionStorage.setItem('proctor', JSON.stringify({
        testId, proctoringEnabled, fullscreenRequired, maxTabSwitches,
      }));
    }
    return () => {
      sessionStorage.removeItem('proctor');
      // proctor_violations is intentionally kept so the count persists
      // across navigation between TakeTest and ProblemDetail within the same exam session.
      // It is cleared only when the test is submitted (see handleSubmitTest in TakeTest.jsx).
    };
  }, [proctoringEnabled, testId, fullscreenRequired, maxTabSwitches]);

  // ── Log event (fire-and-forget; never auto-submits) ───────────────────────────
  const logEvent = useCallback(async (eventType, details = '', snapshot = '') => {
    if (!testId) return;
    try {
      await proctoringAPI.logEvent({ testId, eventType, details, snapshot });
    } catch { /* non-fatal */ }
  }, [testId]);

  // ── Camera initialization ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!proctoringEnabled || !cameraRequired) return;

    setCameraLoading(true);

    navigator.mediaDevices?.getUserMedia({
      video: { width: 320, height: 240, facingMode: 'user' },
      audio: false,
    }).then(stream => {
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
      setCameraLoading(false);
      setCameraDenied(false);
      onCameraReady?.(true, stream);
      logEvent('TEST_STARTED', 'Camera enabled');
    }).catch(err => {
      console.warn('Camera error:', err.message);
      setCameraActive(false);
      setCameraLoading(false);
      setCameraDenied(true);
      onCameraReady?.(false, null);
      logEvent('CAMERA_BLOCKED', err.message);
    });

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      clearInterval(snapshotIntervalRef.current);
    };
  }, [proctoringEnabled, cameraRequired]); // eslint-disable-line

  // ── Camera snapshots ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cameraActive || !proctoringEnabled) return;
    snapshotIntervalRef.current = setInterval(() => {
      if (!videoRef.current) return;
      const canvas = document.createElement('canvas');
      canvas.width = 320; canvas.height = 240;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 240);
      logEvent('CAMERA_SNAPSHOT', 'Periodic', canvas.toDataURL('image/jpeg', 0.5));
    }, snapshotIntervalSeconds * 1000);
    return () => clearInterval(snapshotIntervalRef.current);
  }, [cameraActive, proctoringEnabled, snapshotIntervalSeconds, logEvent]);

  // ── Fullscreen gate ───────────────────────────────────────────────────────────
  // We do NOT call requestFullscreen() automatically — browsers reject it without
  // a user gesture. Instead, we show a gate that the student clicks.
  useEffect(() => {
    if (!proctoringEnabled || !fullscreenRequired) return;
    if (!document.fullscreenElement) {
      setNeedsFullscreen(true);
      setIsFullscreen(false);
    }

    const onChange = () => {
      if (document.fullscreenElement) {
        hasEnteredFullscreen.current = true;
        setIsFullscreen(true);
        setNeedsFullscreen(false);
        closeWarning();
      } else {
        setIsFullscreen(false);
        setNeedsFullscreen(true);
        logEvent('FULLSCREEN_EXIT', 'Exited fullscreen');
        openWarning('You exited fullscreen. Click "Return to Fullscreen" to continue your test.');
      }
    };

    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [proctoringEnabled, fullscreenRequired]); // eslint-disable-line

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      // state updated by fullscreenchange listener
    } catch {
      toast.error('Fullscreen failed — please try again or use F11.');
    }
  };

  // ── Tab-switch / focus detection ──────────────────────────────────────────────
  useEffect(() => {
    if (!proctoringEnabled) return;

    const register = (reason) => {
      if (modalOpenRef.current) return;              // don't count while warning visible
      const now = Date.now();
      if (now - lastSwitchAt.current < 1500) return; // de-dupe blur + visibilitychange
      lastSwitchAt.current = now;

      setTabSwitchCount(prev => {
        const n = prev + 1;
        sessionStorage.setItem('proctor_violations', String(n));
        logEvent('TAB_SWITCH', `${reason} (#${n})`);
        if (n >= maxTabSwitches) {
          openWarning(
            `⚠️ You have left the test window ${n} times (limit: ${maxTabSwitches}). ` +
            `Your activity is flagged. Please submit your test now.`,
            true,
          );
        } else {
          toast.error(`⚠️ Left the test window (${n}/${maxTabSwitches})`, { duration: 4000 });
          openWarning(
            `Warning: You left the test window (${n}/${maxTabSwitches}). ` +
            `After ${maxTabSwitches} violations you will be asked to submit.`,
          );
        }
        return n;
      });
    };

    const onVis  = () => { if (document.hidden)    register('Tab hidden'); };
    const onBlur = () => { if (!modalOpenRef.current) register('Window blur'); };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
    };
  }, [proctoringEnabled, maxTabSwitches, logEvent]);

  // ── Copy / Paste / Right-click blocking ───────────────────────────────────────
  useEffect(() => {
    if (!proctoringEnabled) return;

    const block = (action) => (e) => {
      e.preventDefault();
      logEvent('COPY_PASTE_DETECTED', `${action} blocked`);
      openWarning(`Copy & paste are disabled during this test. (${action} blocked)`);
    };

    const handleCopy = block('Copy');
    const handlePaste = block('Paste');
    const handleCut = block('Cut');

    const handleKey = (e) => {
      const k = e.key?.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ['c','v','x'].includes(k)) {
        e.preventDefault();
        logEvent('COPY_PASTE_DETECTED', `Ctrl+${k.toUpperCase()} blocked`);
        openWarning(`🚫 Ctrl+${k.toUpperCase()} is disabled during this proctored test.\nCopy & paste actions are not allowed.`);
      }
      // Warn on ESC — we can't actually prevent fullscreen exit but we show a popup immediately
      if (e.key === 'Escape') {
        logEvent('ESC_PRESSED', 'ESC key during test');
        openWarning('⚠️ ESC is not allowed during this test. Do not attempt to exit or minimize the test window.');
      }
    };

    const handleCtx = (e) => {
      e.preventDefault();
      logEvent('RIGHT_CLICK_DETECTED', 'Right-click');
    };

    document.addEventListener('copy',        handleCopy,  { capture: true });
    document.addEventListener('paste',       handlePaste, { capture: true });
    document.addEventListener('cut',         handleCut,   { capture: true });
    document.addEventListener('keydown',     handleKey,   { capture: true });
    document.addEventListener('contextmenu', handleCtx,   { capture: true });
    return () => {
      document.removeEventListener('copy',        handleCopy,  { capture: true });
      document.removeEventListener('paste',       handlePaste, { capture: true });
      document.removeEventListener('cut',         handleCut,   { capture: true });
      document.removeEventListener('keydown',     handleKey,   { capture: true });
      document.removeEventListener('contextmenu', handleCtx,   { capture: true });
    };
  }, [proctoringEnabled, logEvent]);

  // ── Warning modal helpers ─────────────────────────────────────────────────────
  const openWarning = (msg, withSubmit = false) => {
    modalOpenRef.current = true;
    setWarningMessage(msg);
    setShowSubmitBtn(withSubmit);
    setShowWarningModal(true);
  };

  const closeWarning = () => {
    modalOpenRef.current = false;
    setShowWarningModal(false);
  };

  // ── Early returns: no proctoring ──────────────────────────────────────────────
  if (!proctoringEnabled) return children;

  // ── Camera loading spinner (brief moment while getUserMedia resolves) ─────────
  if (cameraRequired && cameraLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="glass-card p-8 max-w-sm w-full text-center">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-1">Starting Camera…</h2>
          <p className="text-slate-400 text-sm">Please allow camera access when your browser asks.</p>
        </div>
      </div>
    );
  }

  // ── Camera denied gate ────────────────────────────────────────────────────────
  if (cameraRequired && cameraDenied && !cameraActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Camera Access Required</h2>
          <p className="text-slate-400 text-sm mb-6">
            This test requires camera access. Please allow your browser to use the camera.
          </p>
          <button
            onClick={() => {
              setCameraLoading(true);
              setCameraDenied(false);
              navigator.mediaDevices?.getUserMedia({ video: { width: 320, height: 240 }, audio: false })
                .then(stream => {
                  streamRef.current = stream;
                  if (videoRef.current) videoRef.current.srcObject = stream;
                  setCameraActive(true);
                  setCameraLoading(false);
                  onCameraReady?.(true, stream);
                  logEvent('TEST_STARTED', 'Camera enabled (retry)');
                })
                .catch(err => {
                  setCameraLoading(false);
                  setCameraDenied(true);
                  toast.error('Camera still blocked — check browser settings.');
                });
            }}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 mb-3">
            <Camera className="w-5 h-5" /> Allow Camera & Continue
          </button>
          <p className="text-xs text-slate-500">
            Click the camera icon in your browser's address bar to unblock, then retry.
          </p>
        </div>
      </div>
    );
  }

  // ── Fullscreen gate ───────────────────────────────────────────────────────────
  if (fullscreenRequired && needsFullscreen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className={`glass-card p-8 max-w-md w-full text-center ${hasEnteredFullscreen.current ? 'border-red-500/30' : ''}`}>
          <div className={`w-16 h-16 ${hasEnteredFullscreen.current ? 'bg-red-500/20' : 'bg-amber-500/20'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {hasEnteredFullscreen.current
              ? <AlertTriangle className="w-8 h-8 text-red-400" />
              : <Maximize className="w-8 h-8 text-amber-400" />}
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {hasEnteredFullscreen.current ? '⚠️ Fullscreen Exited' : 'Fullscreen Required'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {hasEnteredFullscreen.current
              ? 'You exited fullscreen. This has been logged. Click below to return and continue your test.'
              : 'This test must be taken in fullscreen. Click the button below to enter fullscreen and begin.'}
          </p>
          <button onClick={enterFullscreen}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Maximize className="w-5 h-5" />
            {hasEnteredFullscreen.current ? 'Return to Fullscreen' : 'Enter Fullscreen & Start'}
          </button>
        </div>
      </div>
    );
  }

  // ── Normal: render children with proctoring overlay ──────────────────────────
  return (
    <>
      {/* Bottom-left widget — hidden when MCQ exam view renders its own camera */}
      {!hideThumbnail && (
        <div className="fixed bottom-3 left-3 z-40 flex flex-col gap-1.5 pointer-events-none">
          {cameraRequired && cameraActive && (
            <div className="relative w-24 h-16 rounded-md overflow-hidden border border-indigo-500/50 shadow-lg">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-full px-2.5 py-1 shadow-lg w-fit">
            <Shield className="w-3 h-3 text-indigo-400" />
            {cameraRequired && (
              <Camera className={`w-3 h-3 ${cameraActive ? 'text-emerald-400' : 'text-red-400'}`} />
            )}
            <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${
              tabSwitchCount === 0 ? 'text-emerald-400' :
              tabSwitchCount >= maxTabSwitches - 1 ? 'text-red-400 animate-pulse' : 'text-amber-400'
            }`}>
              <Eye className="w-3 h-3" />{tabSwitchCount}/{maxTabSwitches}
            </span>
            {fullscreenRequired && (
              <Maximize className={`w-3 h-3 ${isFullscreen ? 'text-emerald-400' : 'text-red-400'}`} />
            )}
          </div>
        </div>
      )}

      {/* Warning modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-card p-8 max-w-md w-full mx-4 text-center border-red-500/30">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">⚠️ Warning</h3>
            <p className="text-slate-300 mb-6 text-sm">{warningMessage}</p>
            <div className="flex flex-col gap-2">
              {fullscreenRequired && !isFullscreen ? (
                <button onClick={enterFullscreen} className="btn-primary w-full">
                  Return to Fullscreen
                </button>
              ) : (
                <button onClick={closeWarning} className="btn-secondary w-full">
                  I Understand — Continue Test
                </button>
              )}
              {showSubmitBtn && (
                <button
                  onClick={() => { closeWarning(); onRequestSubmit?.(); }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors">
                  Submit Test Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
