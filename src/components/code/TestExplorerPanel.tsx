import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Search, 
  FlaskConical, 
  BarChart3, 
  Eye, 
  EyeOff,
  X,
  AlertTriangle,
  MinusCircle,
  FileCode
} from 'lucide-react';
import { 
  TestSuite, 
  TestCase, 
  CoverageReport, 
  TestStatus 
} from '../../types/debug';

interface TestExplorerPanelProps {
  testSuites: TestSuite[];
  coverageReport: CoverageReport | null;
  showCoverageOverlay: boolean;
  onToggleCoverageOverlay: () => void;
  onRunAllTests: () => void;
  onRunFailedTests: () => void;
  onRunSuite: (suiteId: string) => void;
  onRunTestCase: (caseId: string) => void;
  onSelectTestCase: (testCase: TestCase) => void;
  selectedTestCaseId: string | null;
  isTesting: boolean;
  onClose?: () => void;
}

export function TestExplorerPanel({
  testSuites,
  coverageReport,
  showCoverageOverlay,
  onToggleCoverageOverlay,
  onRunAllTests,
  onRunFailedTests,
  onRunSuite,
  onRunTestCase,
  onSelectTestCase,
  selectedTestCaseId,
  isTesting,
  onClose
}: TestExplorerPanelProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [collapsedSuites, setCollapsedSuites] = useState<Record<string, boolean>>({});

  const toggleSuite = (id: string) => {
    setCollapsedSuites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate totals
  const allCases = testSuites.flatMap(s => s.cases);
  const passedCount = allCases.filter(c => c.status === 'passed').length;
  const failedCount = allCases.filter(c => c.status === 'failed').length;
  const skippedCount = allCases.filter(c => c.status === 'skipped').length;
  const totalCount = allCases.length;

  const filteredSuites = testSuites.map(s => {
    if (!filterQuery) return s;
    const matchingCases = s.cases.filter(c => 
      c.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
      s.name.toLowerCase().includes(filterQuery.toLowerCase())
    );
    return { ...s, cases: matchingCases };
  }).filter(s => s.cases.length > 0 || s.name.toLowerCase().includes(filterQuery.toLowerCase()));

  const renderStatusIcon = (status: TestStatus) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'running':
        return <div className="w-3.5 h-3.5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin shrink-0" />;
      case 'skipped':
        return <MinusCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="w-full h-full bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col select-none text-slate-200 font-sans text-xs overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-[#252526] border-b border-[#2d2d2d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-sky-400" />
          <h2 className="font-bold uppercase tracking-wider text-[11px] text-slate-300">Test Explorer</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-[#333333] text-slate-400 hover:text-white rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="p-3 bg-[#181818] border-b border-[#2d2d2d] space-y-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onRunAllTests}
            disabled={isTesting}
            className="flex-1 py-1.5 px-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-md flex items-center justify-center gap-1.5 shadow transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isTesting ? 'Running...' : 'Run All Tests'}</span>
          </button>

          {failedCount > 0 && (
            <button
              onClick={onRunFailedTests}
              disabled={isTesting}
              className="py-1.5 px-2.5 bg-rose-600/80 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-md flex items-center gap-1 shadow transition-colors text-[11px]"
              title="Run Failed Tests"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry ({failedCount})</span>
            </button>
          )}

          <button
            onClick={onToggleCoverageOverlay}
            className={`p-1.5 border rounded-md transition-colors ${
              showCoverageOverlay
                ? 'bg-emerald-600/30 text-emerald-400 border-emerald-500/50'
                : 'bg-[#252526] text-slate-400 border-[#3c3c3c] hover:text-white'
            }`}
            title="Toggle Code Coverage Highlighting in Editor"
          >
            {showCoverageOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        {/* Filter Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter tests by name..."
            className="w-full bg-[#252526] border border-[#3c3c3c] text-slate-200 rounded-md pl-8 pr-2 py-1 text-xs focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Test Summary Bar */}
        <div className="flex items-center justify-between p-2 bg-[#252526] rounded-lg text-[11px] font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> {passedCount}
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <XCircle className="w-3 h-3" /> {failedCount}
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <MinusCircle className="w-3 h-3" /> {skippedCount}
            </span>
          </div>
          <span className="text-slate-400 font-bold">TOTAL: {totalCount}</span>
        </div>
      </div>

      {/* Coverage Widget */}
      {coverageReport && (
        <div className="p-3 bg-[#1e1e1e] border-b border-[#2d2d2d] space-y-2 shrink-0">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Coverage Overview
            </span>
            <span className="text-emerald-400 font-bold font-mono">
              {coverageReport.overall.statementsPct}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Statements</span>
                <span className="font-mono text-slate-200">{coverageReport.overall.statementsPct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${coverageReport.overall.statementsPct}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Branches</span>
                <span className="font-mono text-slate-200">{coverageReport.overall.branchesPct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${coverageReport.overall.branchesPct}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Functions</span>
                <span className="font-mono text-slate-200">{coverageReport.overall.functionsPct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${coverageReport.overall.functionsPct}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Lines</span>
                <span className="font-mono text-slate-200">{coverageReport.overall.linesPct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${coverageReport.overall.linesPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Suites Hierarchy Tree */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {filteredSuites.length === 0 ? (
          <div className="p-4 text-center text-slate-500 italic">
            No test suites found matching filter.
          </div>
        ) : (
          filteredSuites.map((suite) => {
            const isCollapsed = !!collapsedSuites[suite.id];
            const suitePassed = suite.cases.filter(c => c.status === 'passed').length;
            const suiteTotal = suite.cases.length;

            return (
              <div key={suite.id} className="bg-[#252526] border border-[#2d2d2d] rounded-lg overflow-hidden">
                {/* Suite Header */}
                <div className="p-2 bg-[#2a2d2e] flex items-center justify-between group">
                  <button
                    onClick={() => toggleSuite(suite.id)}
                    className="flex items-center gap-1.5 flex-1 min-w-0 text-left font-bold text-[11px] text-slate-200"
                  >
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    {renderStatusIcon(suite.status)}
                    <span className="truncate">{suite.name}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {suitePassed}/{suiteTotal}
                    </span>
                    <button
                      onClick={() => onRunSuite(suite.id)}
                      disabled={isTesting}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#383b3d] text-slate-300 hover:text-sky-400 rounded"
                      title="Run Suite"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                </div>

                {/* Test Cases List */}
                {!isCollapsed && (
                  <div className="p-1 space-y-0.5 bg-[#1e1e1e]">
                    {suite.cases.map((testCase) => {
                      const isSelected = selectedTestCaseId === testCase.id;

                      return (
                        <div key={testCase.id} className="flex flex-col">
                          <div
                            onClick={() => onSelectTestCase(testCase)}
                            className={`p-1.5 rounded flex items-center justify-between cursor-pointer transition-colors group text-[11px] ${
                              isSelected
                                ? 'bg-sky-600/30 border border-sky-500/50 text-white'
                                : 'hover:bg-[#2a2d2e] text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {renderStatusIcon(testCase.status)}
                              <span className="truncate font-mono">{testCase.name}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {testCase.durationMs !== undefined && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {testCase.durationMs}ms
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRunTestCase(testCase.id);
                                }}
                                disabled={isTesting}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#383b3d] text-slate-300 hover:text-sky-400 rounded"
                                title="Run Test Case"
                              >
                                <Play className="w-3 h-3 fill-current" />
                              </button>
                            </div>
                          </div>

                          {/* Error Stack Trace Dropdown if Failed */}
                          {testCase.status === 'failed' && testCase.errorMessage && isSelected && (
                            <div className="m-1 p-2 bg-rose-950/40 border border-rose-800/50 rounded font-mono text-[10px] space-y-1 text-rose-300 overflow-x-auto">
                              <div className="font-bold flex items-center gap-1 text-rose-400">
                                <AlertTriangle className="w-3 h-3" /> Assertion Error:
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed">{testCase.errorMessage}</p>
                              {testCase.stackTrace && (
                                <p className="text-slate-400 text-[9px] pt-1 border-t border-rose-900/50">
                                  {testCase.stackTrace}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TestExplorerPanel;
