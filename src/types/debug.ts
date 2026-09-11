export interface Breakpoint {
  id: string;
  fileId: string;
  filePath: string;
  lineNumber: number;
  enabled: boolean;
  condition?: string;
  logMessage?: string;
}

export interface VariableScope {
  name: 'Local' | 'Closure' | 'Global' | 'Module';
  variables: Record<string, any>;
}

export interface WatchExpression {
  id: string;
  expression: string;
  value?: string;
  error?: string;
}

export interface StackFrame {
  id: string;
  name: string;
  fileId: string;
  filePath: string;
  lineNumber: number;
  columnNumber: number;
}

export interface RunConfiguration {
  id: string;
  name: string;
  type: 'node' | 'chrome' | 'jest' | 'python' | 'custom';
  program: string;
  args?: string[];
  env?: Record<string, string>;
  port?: number;
}

export type DebugStatus = 'idle' | 'starting' | 'running' | 'paused' | 'stopped';

export type TestStatus = 'passed' | 'failed' | 'running' | 'skipped' | 'idle';

export interface TestCase {
  id: string;
  name: string;
  suiteId: string;
  fileId: string;
  filePath: string;
  status: TestStatus;
  durationMs?: number;
  errorMessage?: string;
  stackTrace?: string;
  lineNumber?: number;
}

export interface TestSuite {
  id: string;
  name: string;
  fileId: string;
  filePath: string;
  status: TestStatus;
  cases: TestCase[];
}

export interface FileCoverage {
  fileId: string;
  filePath: string;
  statements: { total: number; covered: number; pct: number };
  branches: { total: number; covered: number; pct: number };
  functions: { total: number; covered: number; pct: number };
  lines: { total: number; covered: number; pct: number };
  coveredLines: number[];
  uncoveredLines: number[];
}

export interface CoverageReport {
  overall: {
    statementsPct: number;
    branchesPct: number;
    functionsPct: number;
    linesPct: number;
  };
  files: FileCoverage[];
}
