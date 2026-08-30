import fs from 'node:fs'
import path from 'node:path'

const DEVICE = process.env.IOS_DEVICE ?? 'iPhone 16'
const IOS_VERSION = process.env.IOS_VERSION ?? '18.5'
const VIDEO_DIR = path.resolve(__dirname, 'videos')

// Metro dev server the app loads its JS bundle from. Testing against Expo
// Go instead of an EAS-built binary means there is nothing to install here —
// the deep link in `before` below is what actually loads our project.
const EXPO_HOST = process.env.EXPO_HOST ?? '127.0.0.1'
const EXPO_GO_BUNDLE_ID = 'host.exp.Exponent'

export const config: WebdriverIO.Config = {
  runner: 'local',
  tsConfigPath: path.resolve(__dirname, '../tsconfig.e2e.json'),

  specs: [path.resolve(__dirname, 'tests/**/*.test.ts')],
  maxInstances: 1,

  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': DEVICE,
      'appium:platformVersion': IOS_VERSION,
      'appium:bundleId': EXPO_GO_BUNDLE_ID,
      'appium:newCommandTimeout': 240,
      'appium:wdaLaunchTimeout': 1200000,
      'appium:wdaConnectionTimeout': 1200000,
      'appium:derivedDataPath': path.resolve(__dirname, '.wda-derived-data'),
      'appium:noReset': true,
      'appium:autoLaunch': false
    }
  ],

  hostname: '127.0.0.1',
  port: 4723,
  path: '/',

  services: [],

  framework: 'mocha',
  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: path.resolve(__dirname, 'allure-results'),
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false
      }
    ]
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: 90000
  },

  logLevel: 'warn',
  waitforTimeout: 15000,
  connectionRetryTimeout: 1260000,
  connectionRetryCount: 3,

  // Expo Go opens to its own home screen on launch; deep-link into our
  // project's Metro bundle before any spec runs.
  before: async function () {
    await browser.execute('mobile: deepLink', {
      url: `exp://${EXPO_HOST}:8081`,
      bundleId: EXPO_GO_BUNDLE_ID
    })
  },

  beforeTest: async function () {
    await browser.startRecordingScreen({ timeLimit: '120' })
  },

  afterTest: async function (test, _context, { error }) {
    const videoBase64 = await browser.stopRecordingScreen()
    if (error) {
      fs.mkdirSync(VIDEO_DIR, { recursive: true })
      const safeName = test.title.replaceAll(/[^a-z0-9]+/gi, '-').toLowerCase()
      fs.writeFileSync(path.join(VIDEO_DIR, `${safeName}.mp4`), Buffer.from(videoBase64, 'base64'))
    }
  }
}
