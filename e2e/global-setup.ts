import * as fs from 'fs'
import * as path from 'path'
import { FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  const istanbulCLIOutput = path.join(process.cwd(), '.nyc_output')

  if (fs.existsSync(istanbulCLIOutput)) {
    try {
      fs.rmSync(istanbulCLIOutput, { recursive: true, force: true })
      console.log(`[Global Setup] Deleted existing .nyc_output folder`)
    } catch (err: any) {
      console.warn(`[Global Setup] Could not remove .nyc_output: ${err?.message || err}`)
    }
  }

  if (!fs.existsSync(istanbulCLIOutput)) {
    fs.mkdirSync(istanbulCLIOutput, { recursive: true })
    console.log(`[Global Setup] Created .nyc_output folder`)
  }
}

export default globalSetup
