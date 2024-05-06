const { parseDependencyTree, parseCircular, prettyCircular } = require("dpdm");

const CIRCULAR_DEPS_IN_RELEASE = 2965;

parseDependencyTree("./src", {}).then((tree) => {
  const circulars = parseCircular(tree);
  if (circulars.length > CIRCULAR_DEPS_IN_RELEASE) {
    console.log("Failed!");
  }
  console.log(prettyCircular(circulars));
});
