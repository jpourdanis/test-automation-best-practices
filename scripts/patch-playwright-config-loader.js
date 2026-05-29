'use strict'
// browserstack-node-sdk requires playwright internal files that Playwright 1.60
// merged into playwright/lib/common/index.js and removed from the exports map.
// This script patches both the exports map and creates stub files so the SDK's
// requirePWModule calls resolve correctly.
const fs = require('fs')
const path = require('path')

const playwrightPkgPath = path.join('node_modules', 'playwright', 'package.json')
const pkg = JSON.parse(fs.readFileSync(playwrightPkgPath, 'utf8'))
let pkgChanged = false

function ensureExportAndStub(exportKey, stubFile, stubContent) {
  if (!pkg.exports[exportKey]) {
    pkg.exports[exportKey] = stubFile
    pkgChanged = true
    console.log(`postinstall: added ${exportKey} to playwright exports`)
  }
  const stubPath = path.join('node_modules', 'playwright', stubFile.replace('./', ''))
  if (!fs.existsSync(stubPath)) {
    fs.writeFileSync(stubPath, stubContent)
    console.log(`postinstall: created ${stubFile} stub`)
  }
}

// 1. playwright/lib/common/configLoader.js → was merged into common/index.js
ensureExportAndStub(
  './lib/common/configLoader.js',
  './lib/common/configLoader.js',
  "'use strict'\nconst { configLoader } = require('./')\nmodule.exports = configLoader || {}\n"
)

// 2. playwright/lib/transform/transform.js → was merged into common/index.js as 'transform'
ensureExportAndStub(
  './lib/transform/transform.js',
  './lib/transform/transform.js',
  "'use strict'\nconst { transform } = require('../common/')\nmodule.exports = transform || {}\n"
)

if (pkgChanged) {
  fs.writeFileSync(playwrightPkgPath, JSON.stringify(pkg, null, 2) + '\n')
}
