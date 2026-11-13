import { describe, expect, it } from 'vitest';
import { compareOutput, normalizeOutput, runAgainstTests, type RunResult } from './python-runner';

describe('output comparison', () => {
  it('ignores trailing whitespace, CRLF and trailing blank lines', () => {
    expect(normalizeOutput('3 \r\n4\n\n')).toBe('3\n4');
    expect(compareOutput('42\n', '42')).toBe(true);
    expect(compareOutput('4 2', '42')).toBe(false);
  });
});

describe('runAgainstTests', () => {
  it('marks each case passed/failed and surfaces errors', async () => {
    const fakeRun = async (_code: string, stdin = ''): Promise<RunResult> => {
      if (stdin === 'boom') return { ok: false, stdout: '', stderr: 'ZeroDivisionError', ms: 1 };
      const [a = 0, b = 0] = stdin.split(' ').map(Number);
      return { ok: true, stdout: `${a + b}\n`, stderr: '', ms: 1 };
    };
    const results = await runAgainstTests(
      'print(sum(map(int, input().split())))',
      [
        { input: '2 3', expectedOutput: '5' },
        { input: '1 1', expectedOutput: '3' },
        { input: 'boom', expectedOutput: '0' },
      ],
      fakeRun,
    );
    expect(results.map((r) => r.passed)).toEqual([true, false, false]);
    expect(results[2]?.error).toContain('ZeroDivisionError');
  });
});
