/**
 * Generates OpenAPI TypeScript types from server/openapi.json.
 *
 * Workflow:
 *   1. cd server && npm run generate:openapi   # writes server/openapi.json
 *   2. npm run generate:client -w packages/shared   # writes src/api/openapi.d.ts
 *
 * Or in one step from the repo root:
 *   npm run generate:openapi -w server && npm run generate:client -w packages/shared
 */

const path = require('path')
const { execSync } = require('child_process')
const fs = require('fs')

const specPath = path.resolve(__dirname, '../../../server/openapi.json')

if (!fs.existsSync(specPath)) {
  console.error('ERROR: server/openapi.json not found. Run `npm run generate:openapi` in the server directory first.')
  process.exit(1)
}

const typesPath = path.resolve(__dirname, '../src/api/openapi.d.ts')
execSync(`npx openapi-typescript "${specPath}" -o "${typesPath}"`, {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..')
})
console.log('Generated TypeScript types →', typesPath)
console.log('Done. Commit the updated src/api/openapi.d.ts.')
