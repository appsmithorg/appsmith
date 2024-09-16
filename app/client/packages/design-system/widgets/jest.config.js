module.exports = {
  preset: "ts-jest",
  roots: ["<rootDir>/src"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\\.(css)$": "<rootDir>../../../test/__mocks__/styleMock.js",
  },
  globals: {
    "ts-jest": {
      useESM: true,
      tsconfig: {
        verbatimModuleSyntax: false,
      },
    },
  },
};
