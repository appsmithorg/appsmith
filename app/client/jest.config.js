module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(png|js|ts|tsx)$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "css"],
  moduleDirectories: ["node_modules", "src"],
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!codemirror|react-dnd|dnd-core|@babel)"],
  moduleNameMapper: {
    "\\.(css|less)$": "<rootDir>/test/__mocks__/styleMock.js",
    "\\.svg$": "<rootDir>/test/__mocks__/svgMock.js",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/test/__mocks__/fileMock.js",
  },
};
