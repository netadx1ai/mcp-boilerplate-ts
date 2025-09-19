/**
 * Jest Configuration for MCP TypeScript Boilerplate
 * 
 * This configuration enables ES modules support across the entire monorepo
 * including all servers, templates, and shared utilities.
 */

export default {
  // Use ES modules preset
  preset: 'ts-jest/presets/default-esm',
  
  // Treat .ts files as ES modules
  extensionsToTreatAsEsm: ['.ts'],
  
  // Node.js test environment
  testEnvironment: 'node',
  
  // Module name mapping for ES modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ES2022',
        target: 'ES2022',
      }
    }]
  },
  
  // Test discovery
  roots: [
    '<rootDir>/src',
    '<rootDir>/servers',
    '<rootDir>/templates', 
    '<rootDir>/tests'
  ],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  
  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.ts',
    'servers/**/*.ts',
    'templates/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  
  // Coverage output
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov', 
    'html'
  ],
  
  // Test timeout (5 seconds)
  testTimeout: 5000,
  
  // Performance
  maxWorkers: '50%',
  
  // Setup files
  setupFilesAfterEnv: [],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>'
  ],
  
  // Globals
  globals: {},
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Verbose output for debugging
  verbose: false,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Exit on first failure (useful for CI)
  bail: false,
  
  // Cache
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Notification settings
  notify: false,
  
  // Watch mode settings
  watchman: true,
  
  // Force exit after tests complete
  forceExit: false,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Detect leaked handles
  detectLeaks: false
};