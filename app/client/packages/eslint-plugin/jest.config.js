module.exports = {
  roots: ["<rootDir>"],
  transform: {
    "^.+\\.(ts)$": [
      "ts-jest",
      {
        isolatedModules: true,
      },
    ],
  },
};
