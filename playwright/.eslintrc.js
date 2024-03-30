module.exports = {
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'sourceType': 'module',
    'ecmaVersion': 2020,
  },
  'rules': {
    'max-len': ['error', 100],
    'object-curly-spacing': ['error', 'always'],
    'jsx-quotes': ['error', 'prefer-single'],
  },
  'plugins': ['@typescript-eslint'],
  'extends': ['google'],
};
