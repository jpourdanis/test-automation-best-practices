import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/locales/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  loader: { '.json': 'json' }
})
