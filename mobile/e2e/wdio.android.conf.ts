import fs from 'node:fs'
import path from 'node:path'

const APK = process.env.APK_PATH ?? path.resolve(__dirname, 'artifacts/android.apk')
const DEVICE = process.env.ANDROID_DEVICE ?? 'Pixel_6_API_35'
const ANDROID_VERSION = process.env.ANDROID_VERSION ?? '35'
const VIDEO_DIR = path.resolve(__dirname, 'videos')

export const config: WebdriverIO.Config = {
  runner: 'local',
  tsConfigPath: path.resolve(__dirname, '../tsconfig.e2e.json'),

  specs: [path.resolve(__dirname, 'tests/**/*.test.ts')],
  maxInstances: 1,

  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': DEVICE,
      'appium:platformVersion': ANDROID_VERSION,
      'appium:app': APK,
      'appium:newCommandTimeout': 240,
      'appium:noReset': false,
      'appium:autoGrantPermissions': true
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
  waitforTimeout: 30000,
  connectionRetryTimeout: 300000,
  connectionRetryCount: 3,

  beforeTest: async function () {
    await browser.startRecordingScreen()
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
