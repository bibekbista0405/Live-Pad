import { CoverageReport, FileCoverage, TestCase, TestSuite, TestStatus } from '../types/debug';

type VitestAssertion = {
  ancestorTitles?: string[];
  title?: string;
  status?: string;
  duration?: number;
  failureMessages?: string[];
  location?: { line?: number; column?: number };
};

type VitestFileResult = {
  name?: string;
  status?: string;
  assertionResults?: VitestAssertion[];
};

type VitestJsonReport = {
  success?: boolean;
  testResults?: VitestFileResult[];
};

function normalizeStatus(status: unknown): TestStatus {
  if (status === 'passed') return 'passed';
  if (status === 'failed') return 'failed';
  if (status === 'pending' || status === 'skipped' || status === 'todo') return 'skipped';
  if (status === 'running') return 'running';
  return 'idle';
}

function toRelativePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^.*?(?=(?:src|tests?|__tests__)\/)/i, '');
}

export function parseVitestJsonReport(raw: string): TestSuite[] {
  const parsed = JSON.parse(raw) as VitestJsonReport;
  if (!Array.isArray(parsed.testResults)) return [];

  return parsed.testResults.map((file, fileIndex) => {
    const filePath = typeof file.name === 'string' ? toRelativePath(file.name) : `vitest-file-${fileIndex + 1}`;
    const cases: TestCase[] = (file.assertionResults || []).map((assertion, caseIndex) => {
      const name = [...(assertion.ancestorTitles || []), assertion.title || `Test ${caseIndex + 1}`].join(' › ');
      const id = `${filePath}::${name}`;
      const failures = Array.isArray(assertion.failureMessages) ? assertion.failureMessages.filter(Boolean) : [];
      return {
        id,
        name,
        suiteId: filePath,
        fileId: '',
        filePath,
        status: normalizeStatus(assertion.status),
        durationMs: typeof assertion.duration === 'number' ? Math.round(assertion.duration) : undefined,
        errorMessage: failures[0],
        stackTrace: failures.length > 1 ? failures.join('\n\n') : undefined,
        lineNumber: assertion.location?.line,
      };
    });

    const failed = cases.some((test) => test.status === 'failed');
    const running = cases.some((test) => test.status === 'running');
    const status: TestStatus = running ? 'running' : failed ? 'failed' : cases.length > 0 && cases.every((test) => test.status === 'skipped') ? 'skipped' : 'passed';
    return { id: filePath || `suite-${fileIndex}`, name: filePath, fileId: '', filePath, status, cases };
  });
}

function pct(covered: number, total: number): number {
  return total === 0 ? 100 : Math.round((covered / total) * 10000) / 100;
}

export function parseV8Coverage(raw: string): CoverageReport {
  const parsed = JSON.parse(raw) as Record<string, any>;
  const files: FileCoverage[] = [];
  let statementTotal = 0, statementCovered = 0;
  let branchTotal = 0, branchCovered = 0;
  let functionTotal = 0, functionCovered = 0;
  let lineTotal = 0, lineCovered = 0;

  for (const [filePath, entry] of Object.entries(parsed)) {
    if (!entry || typeof entry !== 'object') continue;
    const statements = entry.s && entry.statementMap ? Object.values(entry.s) as number[] : [];
    const functions = entry.f && entry.fnMap ? Object.values(entry.f) as number[] : [];
    const branches = entry.b && entry.branchMap ? Object.values(entry.b) as number[][] : [];
    const coveredLines = new Set<number>();
    const uncoveredLines = new Set<number>();

    if (entry.statementMap && entry.s) {
      for (const [key, count] of Object.entries(entry.s as Record<string, number>)) {
        const loc = entry.statementMap[key]?.start?.line;
        if (typeof loc !== 'number') continue;
        (count > 0 ? coveredLines : uncoveredLines).add(loc);
      }
    }

    const stmtCovered = statements.filter((count) => count > 0).length;
    const branchFlat = branches.flat();
    const branchCov = branchFlat.filter((count) => count > 0).length;
    const fnCovered = functions.filter((count) => count > 0).length;
    const lineNumbers = new Set([...coveredLines, ...uncoveredLines]);
    const lineCoveredCount = coveredLines.size;

    statementTotal += statements.length; statementCovered += stmtCovered;
    branchTotal += branchFlat.length; branchCovered += branchCov;
    functionTotal += functions.length; functionCovered += fnCovered;
    lineTotal += lineNumbers.size; lineCovered += lineCoveredCount;

    files.push({
      fileId: '',
      filePath: toRelativePath(filePath),
      statements: { total: statements.length, covered: stmtCovered, pct: pct(stmtCovered, statements.length) },
      branches: { total: branchFlat.length, covered: branchCov, pct: pct(branchCov, branchFlat.length) },
      functions: { total: functions.length, covered: fnCovered, pct: pct(fnCovered, functions.length) },
      lines: { total: lineNumbers.size, covered: lineCoveredCount, pct: pct(lineCoveredCount, lineNumbers.size) },
      coveredLines: [...coveredLines].sort((a, b) => a - b),
      uncoveredLines: [...uncoveredLines].sort((a, b) => a - b),
    });
  }

  return {
    overall: {
      statementsPct: pct(statementCovered, statementTotal),
      branchesPct: pct(branchCovered, branchTotal),
      functionsPct: pct(functionCovered, functionTotal),
      linesPct: pct(lineCovered, lineTotal),
    },
    files,
  };
}
