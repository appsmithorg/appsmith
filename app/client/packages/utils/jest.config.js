module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(ts)$": [
      "ts-jest",
      {
        isolatedModules: true,
      },
    ],
  },
};
