// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // src/core must stay pure TypeScript so it runs in Node, on device and in the browser.
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-*', 'react-native', 'react-native-*'], message: 'src/core must not import React / React Native.' },
            { group: ['expo', 'expo-*', '@expo/*', '@shopify/*'], message: 'src/core must not import Expo or Skia.' },
            { group: ['@/*', '../features/*', '../app/*', '../ui/*'], message: 'src/core must not import app code.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'atob', 'btoa', 'Buffer', 'process'].map((name) => ({
          name,
          message: 'src/core must run in Node, on device and in the browser alike.',
        })),
      ],
    },
  },
]);
