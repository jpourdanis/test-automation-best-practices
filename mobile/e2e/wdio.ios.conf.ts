import fs from 'node:fs'
import path from 'node:path'

const APP = process.env.APP_PATH ?? path.resolve(__dirname, 'artifacts/ColorPicker.app')
const DEVICE = process.env.IOS_DEVICE ?? 'iPhone 16'
const IOS_VERSION = process.env.IOS_VERSION ?? '18.5'
const VIDEO_DIR = path.resolve(__dirname, 'videos')

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
      'appium:app': APP,
      'appium:newCommandTimeout': 240,
      'appium:wdaLaunchTimeout': 600000,
      'appium:wdaConnectionTimeout': 600000,
      'appium:derivedDataPath': path.resolve(__dirname, '.wda-derived-data'),
      'appium:noReset': false
    }
  ],

  services: [],

  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 90000
  },

  logLevel: 'warn',
  waitforTimeout: 15000,
  connectionRetryTimeout: 660000,
  connectionRetryCount: 3,

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
