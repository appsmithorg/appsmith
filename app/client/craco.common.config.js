/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
module.exports = {
  webpack: {
    resolve: {
      modules: [path.resolve(__dirname, "src"), "node_modules"],
    },
  },
};
