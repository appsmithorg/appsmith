module.exports = {
  transform: {
    "^.+\\.(ts|tsx)$": ["@swc/jest"],
  },
  roots: ["<rootDir>/src"],
  testEnvironment: "jsdom",
};
