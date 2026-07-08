import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { codeAPI } from '../services/api';
import { Play, RotateCcw, Copy, Check, Terminal, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { value: 'PYTHON', label: 'Python', monaco: 'python', template: '# Write your Python code here\nprint("Hello, Code Gain Technology!")' },
  { value: 'JAVA', label: 'Java', monaco: 'java', template: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Code Gain Technology!");\n    }\n}' },
  { value: 'CPP', label: 'C++', monaco: 'cpp', template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, Code Gain Technology!" << endl;\n    return 0;\n}' },
  { value: 'C', label: 'C', monaco: 'c', template: '#include <stdio.h>\n\nint main() {\n    printf("Hello, Code Gain Technology!\\n");\n    return 0;\n}' },
  { value: 'JAVASCRIPT', label: 'JavaScript', monaco: 'javascript', template: '// Write your JavaScript code here\nconsole.log("Hello, Code Gain Technology!");' },
];

const THEMES = [
  { value: 'vs-dark', label: 'Dark (VS Code)' },
  { value: 'light', label: 'Light' },
  { value: 'hc-black', label: 'High Contrast' },
];

export default function Compiler() {
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState('vs-dark');
  const [copied, setCopied] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [activeTab, setActiveTab] = useState('input');

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');
    setActiveTab('output');
    try {
      const response = await codeAPI.execute({
        code,
        language: language.value,
        input,
      });
      setOutput(response.data.output || response.data.errorOutput || 'No output');
      setExecutionTime(response.data.executionTimeMs);
      if (response.data.status === 'ACCEPTED') {
        toast.success('Code executed successfully!');
      } else if (response.data.status === 'COMPILATION_ERROR') {
        toast.error('Compilation Error');
      } else if (response.data.status === 'RUNTIME_ERROR') {
        toast.error('Runtime Error');
      }
    } catch (err) {
      setOutput('Error: ' + (err.response?.data?.message || 'Failed to execute code'));
      toast.error('Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleLanguageChange = (langValue) => {
    const lang = LANGUAGES.find((l) => l.value === langValue);
    setLanguage(lang);
    setCode(lang.template);
    setOutput('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Code copied!');
  };

  const handleReset = () => {
    setCode(language.template);
    setOutput('');
    setInput('');
    setExecutionTime(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-3">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              <span className="font-semibold text-white">Online Compiler</span>
            </div>

            {/* Language Selector */}
            <select
              className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={language.value}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>

            {/* Theme Selector */}
            <select
              className="bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {executionTime !== null && (
              <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg">
                ⏱ {executionTime}ms
              </span>
            )}

            <button onClick={handleCopy} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>

            <button onClick={handleReset} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>

            <button
              onClick={handleRun}
              disabled={isRunning}
              className="btn-success text-sm py-2 px-5 flex items-center gap-2"
            >
              {isRunning ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="flex h-[calc(100vh-130px)]">
        {/* Code Editor */}
        <div className="flex-1 border-r border-slate-700">
          <Editor
            height="100%"
            language={language.monaco}
            value={code}
            theme={theme}
            onChange={(value) => setCode(value || '')}
            options={{
              fontSize: 15,
              minimap: { enabled: false },
              padding: { top: 16 },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
              suggestOnTriggerCharacters: true,
              bracketPairColorization: { enabled: true },
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontLigatures: true,
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              renderLineHighlight: 'all',
            }}
          />
        </div>

        {/* Input/Output Panel */}
        <div className="w-[400px] flex flex-col bg-slate-900">
          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'input'
                  ? 'text-indigo-400 border-b-2 border-indigo-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('input')}
            >
              <Terminal className="w-4 h-4" />
              Input
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'output'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('output')}
            >
              <Code2 className="w-4 h-4" />
              Output
              {isRunning && <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>}
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4">
            {activeTab === 'input' ? (
              <textarea
                className="w-full h-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-indigo-500"
                placeholder="Enter your input here (stdin)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            ) : (
              <div className="h-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 overflow-auto">
                {isRunning ? (
                  <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    Executing code...
                  </div>
                ) : output ? (
                  <pre className="text-sm font-mono text-emerald-300 whitespace-pre-wrap">{output}</pre>
                ) : (
                  <p className="text-slate-500 text-sm">Output will appear here after running your code...</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
