'use strict'
// `npm audit --audit-level=high` with an allowlist. npm audit has no way to
// ignore an advisory, so an advisory with no patched release anywhere (nothing
// an override or upgrade can fix) would otherwise block every PR. Advisories
// listed in .npmauditignore (one GHSA id per line, # comments, same style as
// .trivyignore) are reported but not fatal; anything else at high/critical
// fails, exactly like the plain npm audit gate.
const fs = require('node:fs')
const { spawnSync } = require('node:child_process')

const FAIL_LEVELS = new Set(['high', 'critical'])

const ignored = new Set(
  fs.existsSync('.npmauditignore')
    ? fs
        .readFileSync('.npmauditignore', 'utf8')
        .split('\n')
        .map((line) => line.replace(/#.*/, '').trim())
        .filter(Boolean)
    : []
)

const res = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
let report
try {
  report = JSON.parse(res.stdout)
} catch {
  console.error(res.stdout, res.stderr)
  console.error('npm-audit: could not parse `npm audit --json` output')
  process.exit(1)
}
if (report.error) {
  console.error('npm-audit:', report.error.summary || report.error)
  process.exit(1)
}

const failing = new Map()
const allowed = new Map()
for (const [pkg, vuln] of Object.entries(report.vulnerabilities || {})) {
  for (const via of vuln.via) {
    // String entries point at another vulnerable package; its own advisory is
    // reported under that package's key.
    if (typeof via === 'string' || !FAIL_LEVELS.has(via.severity)) continue
    const id = via.url.split('/').pop()
    const line = `${via.severity.padEnd(8)} ${pkg}@${via.range}  ${id}  ${via.title}`
    ;(ignored.has(id) ? allowed : failing).set(`${pkg} ${id}`, line)
  }
}

if (allowed.size) {
  console.log(`Allowed by .npmauditignore (${allowed.size}):`)
  for (const line of allowed.values()) console.log(`  ${line}`)
}
if (failing.size) {
  console.error(`High/critical advisories (${failing.size}):`)
  for (const line of failing.values()) console.error(`  ${line}`)
  console.error('\nUpgrade or override the package; use .npmauditignore only when no patched version exists.')
  process.exit(1)
}
console.log('npm audit: no high/critical advisories outside .npmauditignore')
