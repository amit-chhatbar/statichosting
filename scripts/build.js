// Builds the static website: copies src/ into dist/ and stamps build info
// (version + timestamp) into HTML files. Uses only built-in Node modules.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const DEFAULT_OUT_DIR = path.join(ROOT, 'dist');

function build(outDir = DEFAULT_OUT_DIR) {
  const { version } = require(path.join(ROOT, 'package.json'));
  // In GitHub Actions, GITHUB_SHA identifies the exact commit that was built.
  const commit = (process.env.GITHUB_SHA || 'local').slice(0, 7);
  const buildDate = new Date().toISOString();

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.cpSync(SRC_DIR, outDir, { recursive: true });

  for (const file of listFiles(outDir).filter((f) => f.endsWith('.html'))) {
    const html = fs
      .readFileSync(file, 'utf8')
      .replaceAll('{{BUILD_VERSION}}', `${version}+${commit}`)
      .replaceAll('{{BUILD_DATE}}', buildDate);
    fs.writeFileSync(file, html);
  }

  return outDir;
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

module.exports = { build, listFiles };

if (require.main === module) {
  const out = build(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
  console.log(`Built AMI Hospital website -> ${path.relative(ROOT, out) || out}`);
  for (const f of listFiles(out)) console.log(`  ${path.relative(out, f)}`);
}
