
const esModules = ["remark-gfm"].join("|");

module.exports = {
  preset: "ts-jest",
  roots: ["<rootDir>/src"],
  setupFiles: ["<rootDir>../../../test/__mocks__/reactMarkdown.tsx"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\\.(css)$": "<rootDir>../../../test/__mocks__/styleMock.js",
  },
  transformIgnorePatterns: [
    `[/\\\\]node_modules[/\\\\](?!${esModules}).+\\.(js|jsx|mjs|cjs|ts|tsx)$`,
  ],
  globals: {
    "ts-jest": {
      useESM: true,
      tsconfig: {
        verbatimModuleSyntax: false,
      },
    },
  },
};
