/** Runs Python locally (Pyodide in a Web Worker) so students get instant feedback, offline. */

export interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  ms: number;
  timedOut?: boolean;
}

export interface TestRun {
  index: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  ms: number;
}

const TIMEOUT_MS = 5000;
let worker: Worker | null = null;
let seq = 0;

function getWorker(): Worker {
  if (!worker) worker = new Worker('./python-runner.js');
  return worker;
}

/** Restart the worker (after a timeout) so a stuck program can't block later runs. */
function resetWorker() {
  worker?.terminate();
  worker = null;
}

export function runPython(code: string, stdin = '', timeoutMs = TIMEOUT_MS): Promise<RunResult> {
  const w = getWorker();
  const id = ++seq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      w.removeEventListener('message', onMessage);
      resetWorker();
      resolve({
        ok: false,
        stdout: '',
        stderr: `Time limit exceeded (${timeoutMs / 1000}s). Check for an infinite loop.`,
        ms: timeoutMs,
        timedOut: true,
      });
    }, timeoutMs);
    function onMessage(event: MessageEvent) {
      if (event.data?.id !== id) return;
      clearTimeout(timer);
      w.removeEventListener('message', onMessage);
      resolve(event.data as RunResult);
    }
    w.addEventListener('message', onMessage);
    w.postMessage({ id, code, stdin });
  });
}

/** Normalises output the way judges usually do: ignore trailing spaces and blank lines. */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

export function compareOutput(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

export async function runAgainstTests(
  code: string,
  tests: Array<{ input: string; expectedOutput: string }>,
  run: typeof runPython = runPython,
): Promise<TestRun[]> {
  const results: TestRun[] = [];
  for (const [index, test] of tests.entries()) {
    const r = await run(code, test.input);
    results.push({
      index,
      input: test.input,
      expected: test.expectedOutput,
      actual: r.stdout,
      passed: r.ok && compareOutput(r.stdout, test.expectedOutput),
      error: r.ok ? undefined : r.stderr,
      ms: Math.round(r.ms),
    });
  }
  return results;
}
