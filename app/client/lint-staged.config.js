module.exports = {
  linters: {
    '**/*.+(ts|tsx)': [
      'eslint --fix',
      'prettier --write',
      'git add',
    ],
  },
};
