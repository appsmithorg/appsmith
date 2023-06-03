module.exports = {
  preset: "ts-jest",
  roots: ["<rootDir>/src"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    // Mocks out all these file formats when tests are run
    "\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "identity-obj-proxy",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  transform: {
    "node_modules/@blueprintjs/core/.+\\.(j|t)sx?$": "ts-jest",
  },
  transformIgnorePatterns: ["node_modules/(?!@blueprintjs/core/.*)"],
};
