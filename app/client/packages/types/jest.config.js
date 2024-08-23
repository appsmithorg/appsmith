module.exports = {
  transform: {
    "^.+\\.(png|js|ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          verbatimModuleSyntax: false,
        },
      },
    ],
  },
  verbose: true,
};
