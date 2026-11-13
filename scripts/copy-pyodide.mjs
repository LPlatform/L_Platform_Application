// Copies the Pyodide runtime (Python compiled to WebAssembly) into public/pyodide so the
// desktop app can run student Python code offline. Generated output; not committed.
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const src = dirname(require.resolve('pyodide/package.json'));
const dest = join(process.cwd(), 'public', 'pyodide');
mkdirSync(dest, { recursive: true });
for (const file of [
  'pyodide.js',
  'pyodide.asm.js',
  'pyodide.asm.wasm',
  'python_stdlib.zip',
  'pyodide-lock.json',
]) {
  cpSync(join(src, file), join(dest, file));
}
console.log(`Pyodide runtime copied to ${dest}`);
