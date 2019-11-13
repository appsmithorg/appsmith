/* eslint-disable @typescript-eslint/no-var-requires */
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const path = require("path");
module.exports = {
  webpack: {
    plugins: [
      new MonacoWebpackPlugin({
        languages: ["json", "javascript"],
      }),
    ],
    resolve: {
      modules: [path.resolve(__dirname, "src"), "node_modules"],
    },
  },
};
