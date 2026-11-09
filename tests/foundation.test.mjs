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
  assert.match(read('.github/workflows/release.yml'), /SHA256SUMS\.txt/);
  assert.match(read('rust-toolchain.toml'), /channel = "1\.99\.1"/);
  assert.equal(read('.nvmrc').trim(), '24.22.1');
});

test('workflow actions use full commit SHAs', () => {
  for (const file of readdirSync(new URL('../.github/workflows/', import.meta.url))) {
    const contents = read(`.github/workflows/${file}`);
    for (const line of contents.split(/\r?\n/).filter((value) => /^\s+uses:/.test(value))) {
      assert.match(line, /@[a-f0-9]{40}(?:\s|$)/, `${file}: ${line.trim()}`);
    }
  }
});

test('desktop and Rust product jobs are skipped instead of passing when absent', () => {
  assert.match(read('.github/workflows/ci.yml'), /name: bootstrap-smoke/);
  assert.match(read('.github/workflows/desktop-build.yml'), /if: needs\.readiness\.outputs\.product-configured == 'true'/);
  assert.match(read('.github/workflows/rust.yml'), /if: needs\.readiness\.outputs\.workspace-configured == 'true'/);
  assert.match(read('.github/workflows/desktop-build.yml'), /windows-build:/);
  assert.match(read('.github/workflows/desktop-build.yml'), /linux-build:/);
  assert.match(read('.github/workflows/rust.yml'), /rust-windows:/);
  assert.match(read('.github/workflows/rust.yml'), /rust-linux:/);
  assert.match(read('.github/workflows/release.yml'), /No MSI or NSIS installer was produced/);
  assert.match(read('.github/workflows/release.yml'), /No Debian package or AppImage was produced/);
  assert.match(read('.github/workflows/release.yml'), /existing release/i);
});
