import { describe, expect, it } from 'vitest';
import { parseVitestJsonReport, parseV8Coverage } from '../services/vitestResults';

describe('Vitest result parsing', () => {
  it('maps real JSON reporter assertions into suites and cases', () => {
    const suites = parseVitestJsonReport(JSON.stringify({
      success: false,
      testResults: [{
        name: 'C:\\project\\src\\__tests__\\example.test.ts',
        assertionResults: [
          { ancestorTitles: ['Example'], title: 'passes', status: 'passed', duration: 4.7, location: { line: 8 } },
          { ancestorTitles: ['Example'], title: 'fails', status: 'failed', duration: 2, failureMessages: ['Expected 1 to be 2'], location: { line: 14 } },
        ],
      }],
    }));
    expect(suites).toHaveLength(1);
    expect(suites[0].filePath).toBe('src/__tests__/example.test.ts');
    expect(suites[0].status).toBe('failed');
    expect(suites[0].cases[0].status).toBe('passed');
    expect(suites[0].cases[1].errorMessage).toBe('Expected 1 to be 2');
    expect(suites[0].cases[1].lineNumber).toBe(14);
  });
});

describe('V8 coverage parsing', () => {
  it('computes file and overall percentages from V8 counters', () => {
    const report = parseV8Coverage(JSON.stringify({
      '/project/src/example.ts': {
        statementMap: {
          '0': { start: { line: 1 } },
          '1': { start: { line: 2 } },
        },
        s: { '0': 1, '1': 0 },
        fnMap: { '0': { name: 'example' } },
        f: { '0': 1 },
        branchMap: { '0': { locations: [{ start: { line: 1 } }, { start: { line: 2 } }] } },
        b: { '0': [1, 0] },
      },
    }));
    expect(report.overall.statementsPct).toBe(50);
    expect(report.overall.functionsPct).toBe(100);
    expect(report.overall.branchesPct).toBe(50);
    expect(report.overall.linesPct).toBe(50);
    expect(report.files[0].coveredLines).toEqual([1]);
    expect(report.files[0].uncoveredLines).toEqual([2]);
  });
});
