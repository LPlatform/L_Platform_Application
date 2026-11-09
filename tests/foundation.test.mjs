import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('public desktop repository excludes confidential implementation and secrets', () => {
  for (const path of ['AGENTS.md', 'CONTRIBUTING.md', 'SECURITY.md', 'docs/release-process.md', 'docs/integration/api-contracts.md']) {
    assert.ok(existsSync(new URL(`../${path}`, import.meta.url)), `${path} exists`);
  }
  assert.match(read('README.md'), /public repository/i);
  assert.match(read('.gitignore'), /^\.env\.\*$/m);
  assert.match(read('AGENTS.md'), /signing keys/i);
  assert.match(read('.github/workflows/release.yml'), /SHA-256 checksums/i);
});

test('workflow actions use full commit SHAs', () => {
  for (const file of readdirSync(new URL('../.github/workflows/', import.meta.url))) {
    const contents = read(`.github/workflows/${file}`);
    for (const line of contents.split(/\r?\n/).filter((value) => /^\s+uses:/.test(value))) {
      assert.match(line, /@[a-f0-9]{40}(?:\s|$)/, `${file}: ${line.trim()}`);
    }
  }
});
