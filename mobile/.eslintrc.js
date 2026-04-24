module.exports = {
  extends: ['expo', 'eslint:recommended'],
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['error', 'warn'] }],
  },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/'],
};
