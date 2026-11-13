/* global importScripts, loadPyodide */
// Web Worker: runs student Python with Pyodide, feeding stdin and capturing stdout/stderr.
// The main thread terminates this worker on timeout (e.g. infinite loops).
importScripts('./pyodide/pyodide.js');

let ready = null;
function boot() {
  if (!ready) ready = loadPyodide({ indexURL: './pyodide/' });
  return ready;
}

self.onmessage = async (event) => {
  const { id, code, stdin } = event.data;
  const started = performance.now();
  let out = '';
  let err = '';
  try {
    const py = await boot();
    const lines = String(stdin ?? '').split('\n');
    let i = 0;
    py.setStdin({ stdin: () => (i < lines.length ? lines[i++] : undefined) });
    py.setStdout({ batched: (s) => (out += s + '\n') });
    py.setStderr({ batched: (s) => (err += s + '\n') });
    // Fresh globals per run so tests don't leak state into each other.
    const globals = py.toPy({ __name__: '__main__' });
    await py.runPythonAsync(code, { globals });
    globals.destroy();
    self.postMessage({ id, ok: true, stdout: out, stderr: err, ms: performance.now() - started });
  } catch (e) {
    const message = String((e && e.message) || e);
    // Show only the student's part of the traceback, not Pyodide internals.
    const lines = message.split('\n').filter(Boolean);
    const start = lines.findIndex((l) => l.includes('File "<exec>"'));
    const tail = (start >= 0 ? lines.slice(start) : lines.slice(-3)).join('\n');
    self.postMessage({
      id,
      ok: false,
      stdout: out,
      stderr: err + tail,
      ms: performance.now() - started,
    });
  }
};
