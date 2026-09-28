/**
 * @file jest.config.js
 * @description Jest configuration file
 * @architecture config
 */

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
};
