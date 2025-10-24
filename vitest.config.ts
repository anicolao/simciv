import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    hookTimeout: 30000, // 30 seconds for setup hooks
    testTimeout: 10000, // 10 seconds for individual tests
    include: ['src/__tests__/**/*.test.ts'],
    exclude: ['src/__tests__/helpers/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/__tests__/**',
        'src/server.ts'
      ]
    }
  }
});
