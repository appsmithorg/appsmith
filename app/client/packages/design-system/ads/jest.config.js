module.exports = {
  roots: ["<rootDir>", "<rootDir>/src"], // Set this to the directory containing your source code
  modulePaths: ["<rootDir>"],
  moduleDirectories: ["node_modules", "src"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // Optional: Additional setup
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          verbatimModuleSyntax: false,
        },
      },
    ], // Use ts-jest for transforming TypeScript files
    "\\.(svg)$": "<rootDir>/fileTransformer.js", // Create this file for SVG handling (see below)
  },
  moduleNameMapper: {
    //  this mocks all binary files so jest doesn't try to convert it into js
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/fileTransformer.js",
  },
};
