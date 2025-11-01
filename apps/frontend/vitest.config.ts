import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vitest Configuration for Frontend Unit Tests
 *
 * Testing React components, hooks, and utilities
 */
export default defineConfig({
  plugins: [react()],

  test: {
    // Use jsdom environment for DOM testing
    environment: 'jsdom',

    // Setup files to run before tests
    setupFiles: ['./src/tests/setup.ts'],

    // Global test utilities
    globals: true,

    // Include test files
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e'],

    // Environment options for React 19 compatibility
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
