module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(png|js|ts|tsx)$": "ts-jest",
  },
  testTimeout: 9000,
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(tsx|ts|js)?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "css"],
  moduleDirectories: ["node_modules", "src", "test"],
  moduleNameMapper: {
    "@constants/(.*)": ["<rootDir>/src/constants/$1"],
    "@services/(.*)": ["<rootDir>/src/services/$1"],
    "@middlewares/(.*)": ["<rootDir>/src/middlewares/$1"],
    "@controllers/(.*)": ["<rootDir>/src/controllers/$1"],
    "@rules/(.*)": ["<rootDir>/src/middlewares/rules/$1"],
    "@utils/(.*)": ["<rootDir>/src/utils/$1"],
  },
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
