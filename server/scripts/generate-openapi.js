#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const { swaggerSpec } = require('../index.js')

const outDir = path.resolve(__dirname, '..')
const jsonPath = path.join(outDir, 'openapi.json')

fs.writeFileSync(jsonPath, JSON.stringify(swaggerSpec, null, 2))
console.log(`Generated ${jsonPath}`)
