const path = require("path");
const tsConfigPaths = require(path.resolve("tsconfig.path.json"))
  .compilerOptions.paths;

const alias = {};
const aliasReplacementPattern = /\/\*/g;

for (const pathName in tsConfigPaths) {
  const name = pathName.replace(aliasReplacementPattern, "");
  const [tsConfigPath] = tsConfigPaths[pathName];
  const location = path.resolve(
    tsConfigPath.replace(aliasReplacementPattern, ""),
  );

  alias[name] = location;
}

module.exports = alias;
