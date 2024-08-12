module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(png|js|ts|tsx)$": ["ts-jest", {
      isolatedModules: true,
    }],
  },
  testTimeout: 9000,
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(tsx|ts|js)?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleDirectories: ["node_modules", "src"],
};
