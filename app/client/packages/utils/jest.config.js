module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(ts)$": ["ts-jest", {
      isolatedModules: true,
    }],
  },
  testTimeout: 9000,
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(ts)?$",
  moduleFileExtensions: ["ts"],
  moduleDirectories: ["node_modules", "src"],
};
