// ==================== SOFT TECH BUILD PIPELINE ====================
// Minification pipeline: JS (Terser) + CSS (CleanCSS) + HTML (html-minifier-terser)
// Output: dist/ — mirrors src/ structure with .min.js / .min.css extensions
// CRITICAL: mangle.toplevel = false — all JS uses global scope, function names must be preserved

'use strict';

const fs       = require('fs-extra');
const path     = require('path');
const { glob } = require('glob');

// Lazy-loaded to avoid requiring before npm install
let terserMinify, CleanCSS, htmlMinify;

const ROOT = __dirname;
const SRC  = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

// ==================== TERSER CONFIG ====================

const TERSER_OPTS = {
  compress: {
    drop_console: false,   // preserve console.log — used in production debug
    passes: 2,
    ecma: 2015,
    toplevel: false,       // do NOT remove top-level unused declarations
    unsafe: false,         // stay safe with vanilla JS patterns
  },
  mangle: {
    toplevel: false,       // do NOT mangle global function/variable names
  },
  format: {
    comments: false,       // strip all comments
  },
  ecma: 2015,
};

// ==================== CLEAN-CSS CONFIG ====================
// Level 1 only — level 2 has a known crash bug (TypeError in remove-unused-at-rules.js)
// when processing complex CSS with backdrop-filter / CSS variables / custom at-rules.
// Level 1 still removes whitespace, comments, shortens colors and properties — safe and effective.

const CSS_LEVEL = {
  level: {
    1: { all: true },
  },
};

// ==================== HTML-MINIFIER CONFIG ====================

const HTML_OPTS = {
  collapseWhitespace: true,
  conservativeCollapse: false,
  removeComments: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true,
  minifyCSS: true,
  minifyJS: {
    toplevel: false,
    mangle: { toplevel: false },
  },
};

// ==================== UTILITIES ====================

function fmtSize(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

function fmtPct(before, after) {
  const pct = ((1 - after / before) * 100).toFixed(1);
  return `-${pct}%`;
}

function pad(str, len) {
  return String(str).padEnd(len);
}

// Replace local .css hrefs and .js srcs in HTML to point to .min versions.
// CDN URLs (http/https/protocol-relative) are left untouched.
function updateHtmlRefs(html) {
  // href="*.css" → href="*.min.css"  (local only)
  html = html.replace(/(href=["'])([^"'?#]+)\.css(["'])/g, (m, pre, file, post) => {
    if (/^https?:|^\/\//.test(file)) return m;
    return `${pre}${file}.min.css${post}`;
  });
  // src="*.js" → src="*.min.js"  (local only)
  html = html.replace(/(src=["'])([^"'?#]+)\.js(["'])/g, (m, pre, file, post) => {
    if (/^https?:|^\/\//.test(file)) return m;
    return `${pre}${file}.min.js${post}`;
  });
  return html;
}

// ==================== MINIFICATION FUNCTIONS ====================

const report = []; // { label, before, after }

async function minifyJS(srcFile, destFile, label) {
  const code = await fs.readFile(srcFile, 'utf8');
  const before = Buffer.byteLength(code, 'utf8');

  let result;
  try {
    result = await terserMinify(code, TERSER_OPTS);
  } catch (err) {
    console.error(`  [ERROR] Terser failed on ${label}: ${err.message}`);
    // Fall back to copying original
    await fs.ensureDir(path.dirname(destFile));
    await fs.copyFile(srcFile, destFile);
    console.log(`  [COPY]  ${label} (minification failed, copied original)`);
    return;
  }

  const minified = result.code;
  const after = Buffer.byteLength(minified, 'utf8');
  await fs.ensureDir(path.dirname(destFile));
  await fs.writeFile(destFile, minified, 'utf8');
  report.push({ label, before, after });
  console.log(`  [JS]    ${pad(label, 40)} ${pad(fmtSize(before), 9)} → ${pad(fmtSize(after), 9)} ${fmtPct(before, after)}`);
}

async function minifyCSS(srcFile, destFile, label) {
  const code = await fs.readFile(srcFile, 'utf8');
  const before = Buffer.byteLength(code, 'utf8');

  const cssMinifier = new CleanCSS({ ...CSS_LEVEL, returnPromise: true });
  let result;
  try {
    result = await cssMinifier.minify(code);
  } catch (err) {
    console.error(`  [ERROR] CleanCSS failed on ${label}: ${err.message}`);
    await fs.ensureDir(path.dirname(destFile));
    await fs.copyFile(srcFile, destFile);
    console.log(`  [COPY]  ${label} (CSS minification failed, copied original)`);
    return;
  }

  if (result.errors && result.errors.length) {
    console.error(`  [ERROR] CleanCSS errors in ${label}:`, result.errors);
    await fs.ensureDir(path.dirname(destFile));
    await fs.copyFile(srcFile, destFile);
    return;
  }

  const minified = result.styles;
  const after = Buffer.byteLength(minified, 'utf8');
  await fs.ensureDir(path.dirname(destFile));
  await fs.writeFile(destFile, minified, 'utf8');
  report.push({ label, before, after });
  console.log(`  [CSS]   ${pad(label, 40)} ${pad(fmtSize(before), 9)} → ${pad(fmtSize(after), 9)} ${fmtPct(before, after)}`);
}

async function processHTML(srcFile, destFile, label) {
  const code = await fs.readFile(srcFile, 'utf8');
  const before = Buffer.byteLength(code, 'utf8');

  let updated = updateHtmlRefs(code);

  let minified;
  try {
    minified = await htmlMinify(updated, HTML_OPTS);
  } catch (err) {
    console.error(`  [ERROR] html-minifier-terser failed on ${label}: ${err.message}`);
    await fs.ensureDir(path.dirname(destFile));
    await fs.writeFile(destFile, updated, 'utf8');
    return;
  }

  const after = Buffer.byteLength(minified, 'utf8');
  await fs.ensureDir(path.dirname(destFile));
  await fs.writeFile(destFile, minified, 'utf8');
  report.push({ label, before, after });
  console.log(`  [HTML]  ${pad(label, 40)} ${pad(fmtSize(before), 9)} → ${pad(fmtSize(after), 9)} ${fmtPct(before, after)}`);
}

async function copyStatic(srcFile, destFile, label) {
  await fs.ensureDir(path.dirname(destFile));
  await fs.copyFile(srcFile, destFile);
  const size = (await fs.stat(srcFile)).size;
  console.log(`  [COPY]  ${pad(label, 40)} ${fmtSize(size)} (static)`);
}

// ==================== BUILD TASKS ====================

async function buildJS() {
  console.log('\n── JavaScript ─────────────────────────────────────────────');

  // src/ JS files
  const srcJsFiles = await glob('src/**/*.js', { cwd: ROOT, posix: false });
  for (const rel of srcJsFiles) {
    const srcFile  = path.join(ROOT, rel);
    const minRel   = rel.replace(/\.js$/, '.min.js');
    const destFile = path.join(DIST, minRel);
    const label    = rel.replace(/\\/g, '/');
    await minifyJS(srcFile, destFile, label);
  }

  // assets/data JS files
  const dataJsFiles = await glob('assets/data/*.js', { cwd: ROOT, posix: false });
  for (const rel of dataJsFiles) {
    const srcFile  = path.join(ROOT, rel);
    const minRel   = rel.replace(/\.js$/, '.min.js');
    const destFile = path.join(DIST, minRel);
    const label    = rel.replace(/\\/g, '/');
    await minifyJS(srcFile, destFile, label);
  }
}

async function buildCSS() {
  console.log('\n── CSS ─────────────────────────────────────────────────────');

  const cssFiles = await glob('src/**/*.css', { cwd: ROOT, posix: false });
  for (const rel of cssFiles) {
    const srcFile  = path.join(ROOT, rel);
    const minRel   = rel.replace(/\.css$/, '.min.css');
    const destFile = path.join(DIST, minRel);
    const label    = rel.replace(/\\/g, '/');
    await minifyCSS(srcFile, destFile, label);
  }
}

async function buildHTML() {
  console.log('\n── HTML ─────────────────────────────────────────────────────');

  const htmlFiles = await glob('src/**/*.html', { cwd: ROOT, posix: false });
  for (const rel of htmlFiles) {
    const srcFile  = path.join(ROOT, rel);
    const destFile = path.join(DIST, rel);
    const label    = rel.replace(/\\/g, '/');
    await processHTML(srcFile, destFile, label);
  }
}

async function copyAssets() {
  console.log('\n── Static assets ───────────────────────────────────────────');

  // Copy images directory if it exists
  const imgSrc = path.join(ROOT, 'assets', 'images');
  if (await fs.pathExists(imgSrc)) {
    const imgDest = path.join(DIST, 'assets', 'images');
    await fs.copy(imgSrc, imgDest);
    console.log(`  [COPY]  assets/images/ (entire directory)`);
  }

  // Copy any other non-JS assets in assets/ (json, fonts, etc.)
  const otherAssets = await glob('assets/**/*', { cwd: ROOT, posix: false, nodir: true });
  for (const rel of otherAssets) {
    if (/\.(js|css)$/.test(rel)) continue; // handled by build steps
    const srcFile  = path.join(ROOT, rel);
    const destFile = path.join(DIST, rel);
    const label    = rel.replace(/\\/g, '/');
    await copyStatic(srcFile, destFile, label);
  }
}

// ==================== REPORT ====================

function printReport() {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log(' BUILD REPORT');
  console.log('════════════════════════════════════════════════════════════');

  let totalBefore = 0;
  let totalAfter  = 0;

  // Sort by before size descending
  const sorted = [...report].sort((a, b) => b.before - a.before);

  for (const { label, before, after } of sorted) {
    totalBefore += before;
    totalAfter  += after;
    const pct = fmtPct(before, after);
    console.log(`  ${pad(label, 42)} ${pad(fmtSize(before), 9)} → ${pad(fmtSize(after), 9)} ${pct}`);
  }

  console.log('────────────────────────────────────────────────────────────');
  console.log(`  ${'TOTAL'.padEnd(42)} ${pad(fmtSize(totalBefore), 9)} → ${pad(fmtSize(totalAfter), 9)} ${fmtPct(totalBefore, totalAfter)}`);
  console.log('════════════════════════════════════════════════════════════\n');
}

// ==================== MAIN ====================

async function main() {
  const startTime = Date.now();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       SOFT TECH — Professional Minification Build            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`  Root:   ${ROOT}`);
  console.log(`  Output: ${DIST}`);

  // Load dependencies
  try {
    ({ minify: terserMinify } = require('terser'));
    CleanCSS                  = require('clean-css');
    ({ minify: htmlMinify }   = require('html-minifier-terser'));
  } catch (e) {
    console.error('\n[ERROR] Dependencies not installed. Run: npm install\n');
    process.exit(1);
  }

  // Clean dist/
  console.log('\n  Cleaning dist/...');
  await fs.remove(DIST);
  await fs.ensureDir(DIST);

  // Build steps (sequential to preserve readable output)
  await buildJS();
  await buildCSS();
  await buildHTML();
  await copyAssets();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  printReport();
  console.log(`  Build completed in ${elapsed}s`);
  console.log(`  Output: ${DIST}\n`);
}

main().catch(err => {
  console.error('\n[FATAL]', err);
  process.exit(1);
});
