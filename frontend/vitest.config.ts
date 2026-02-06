/**
 * Vitest Configuration
 *
 * Configuration for unit and integration tests using Vitest.
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/*.d.ts',
        '**/main.tsx',
        'dist/',
        'coverage/',
        'vite-env.d.ts',
      ],
      include: ['src/**/*.{ts,tsx}'],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});