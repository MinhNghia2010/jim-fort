import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
  'lib/utils.ts',
  'hooks/use-mobile.ts',
  '!**/*.d.ts',
  '!**/node_modules/**',
],
}

export default createJestConfig(customJestConfig)