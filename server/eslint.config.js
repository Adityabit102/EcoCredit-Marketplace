// Flat config (ESLint 9). Lenient on purpose — catches real mistakes, not style.
module.exports = [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { process: 'readonly', console: 'readonly', require: 'readonly', module: 'writable', __dirname: 'readonly', Buffer: 'readonly', setTimeout: 'readonly', setInterval: 'readonly' },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$|^req$|^res$' }],
      'no-undef': 'error',
    },
  },
];
