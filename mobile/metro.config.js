const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [monorepoRoot]

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules')
]

// react-native@0.81.5 ships react-native-renderer@19.1.0.
// React enforces that react and react-native-renderer are the exact same version.
// Force every `react` import — including ones from root packages like expo and
// react-i18next — to mobile/node_modules/react@19.1.0 so all three stay in sync.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react' ||
    moduleName.startsWith('react/') ||
    moduleName === 'react-dom' ||
    moduleName.startsWith('react-dom/')
  ) {
    // Pin react and react-dom to mobile/node_modules so both resolve to 19.1.0
    // rather than the root workspace versions which may differ.
    const resolved = require.resolve(moduleName, { paths: [projectRoot] })
    return { filePath: resolved, type: 'sourceFile' }
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
