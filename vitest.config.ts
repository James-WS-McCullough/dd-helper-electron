import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: [
      'tests-new/component/**/*.test.ts',
      'tests-new/unit/folderNavigation.test.ts',
      'tests-new/unit/mediaFiltering.test.ts'
    ],
    exclude: ['node_modules', 'tests', 'tests-legacy']
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/renderer/src', import.meta.url))
    }
  }
})
