module.exports = {
  setupFiles: ["jest-canvas-mock"],
  roots: ["./src"],
  setupFilesAfterEnv: ["./jest.setup.ts"],
  testPathIgnorePatterns: ["node_modules/"],
  testEnvironment: "jsdom",
  testTimeout: 9000,
  transform: {
    "^.+\\.(png|js|ts|tsx)$": "ts-jest",
  },
  testMatch: ["**/*.test.(ts|tsx)"],
  moduleNameMapper: {
    // Mocks out all these file formats when tests are run
    "\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "identity-obj-proxy",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "css"],
  moduleDirectories: ["node_modules", "src"],
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!codemirror|react-dnd|dnd-core|@babel|(@blueprintjs/core/lib/esnext)|(@blueprintjs/core/lib/esm)|@github|lodash-es|@draft-js-plugins|react-documents)",
  ],
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
