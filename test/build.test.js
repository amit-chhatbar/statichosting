// Tests for the build output, run with Node's built-in test runner (node --test).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { build, listFiles } = require('../scripts/build');

let outDir;

before(() => {
  outDir = build(fs.mkdtempSync(path.join(os.tmpdir(), 'ami-build-')));
});

after(() => fs.rmSync(outDir, { recursive: true, force: true }));

test('build produces the files S3 website hosting needs', () => {
  for (const f of ['index.html', 'error.html', 'styles.css', 'app.js', 'assets/logo.svg']) {
    assert.ok(fs.existsSync(path.join(outDir, f)), `missing ${f}`);
  }
});

test('home page is branded AMI Hospital', () => {
  const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  assert.match(html, /<title>AMI Hospital/);
  for (const id of ['departments', 'doctors', 'appointment', 'contact']) {
    assert.match(html, new RegExp(`id="${id}"`), `missing section #${id}`);
  }
});

test('build placeholders are replaced in every HTML file', () => {
  for (const file of listFiles(outDir).filter((f) => f.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /\{\{BUILD_[A-Z]+\}\}/, `placeholder left in ${path.basename(file)}`);
  }
});

test('every local href/src in index.html points to a file in the build', () => {
  const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((r) => !/^(#|https?:|mailto:|tel:)/.test(r));
  assert.ok(refs.length > 0);
  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(outDir, ref)), `broken link: ${ref}`);
  }
});
