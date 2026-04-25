import path from 'node:path'
import type { Options } from '@wdio/types'

const APP = process.env.APP_PATH ?? path.resolve(__dirname, 'artifacts/ColorPicker.app')
const DEVICE = process.env.IOS_DEVICE ?? 'iPhone 16'
const IOS_VERSION = process.env.IOS_VERSION ?? '18'

export const config: Options.Testrunner = {
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
      'appium:wdaLaunchTimeout': 120000,
      'appium:wdaConnectionTimeout': 120000,
      'appium:noReset': false
    }
  ],

  services: [
    [
      'appium',
      {
        command: path.resolve(__dirname, '../../node_modules/.bin/appium'),
        logFileName: 'appium.log',
        outputDir: __dirname,
        args: { relaxedSecurity: true }
      }
    ]
  ],

  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 90000
  },

  logLevel: 'warn',
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3
}
