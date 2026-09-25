'use strict'
// Packs packages/shared into mobile/vendor/color-app-shared.tgz, the only way
// mobile consumes it (mobile is not part of the root npm workspace).
//   node scripts/vendor-shared.js          re-vendor + refresh mobile lockfile
//   node scripts/vendor-shared.js --check  fail if the vendored tarball is stale
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const sharedDir = path.join(root, 'packages', 'shared')
const mobileDir = path.join(root, 'mobile')
const vendored = path.join(mobileDir, 'vendor', 'color-app-shared.tgz')
const check = process.argv.includes('--check')

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString()

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-pack-'))
try {
  run('npm', ['run', 'build'], sharedDir)
  const [{ filename }] = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', tmp], sharedDir))
  const packed = path.join(tmp, filename)

  if (check) {
    if (!fs.existsSync(vendored)) {
      console.error(`Missing ${path.relative(root, vendored)}. Run: npm run vendor:shared`)
      process.exit(1)
    }
    const fresh = path.join(tmp, 'fresh')
    const current = path.join(tmp, 'current')
    fs.mkdirSync(fresh)
    fs.mkdirSync(current)
    run('tar', ['-xzf', packed, '-C', fresh], root)
    run('tar', ['-xzf', vendored, '-C', current], root)
    try {
      run('diff', ['-r', fresh, current], root)
    } catch (e) {
      console.error(e.stdout?.toString())
      console.error(`${path.relative(root, vendored)} is stale. Run: npm run vendor:shared`)
      process.exit(1)
    }
    console.log('Vendored shared package is up to date.')
  } else {
    fs.mkdirSync(path.dirname(vendored), { recursive: true })
    fs.copyFileSync(packed, vendored)
    run('npm', ['install', '--package-lock-only', '--ignore-scripts'], mobileDir)
    console.log(`Wrote ${path.relative(root, vendored)} and refreshed mobile/package-lock.json`)
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}
