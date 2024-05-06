const { parseDependencyTree, parseCircular } = require("dpdm");

const CIRCULAR_DEPS_IN_RELEASE = 0;

parseDependencyTree("./src", {}).then((tree) => {
  const circulars = parseCircular(tree);
  console.log(circulars.length);
  if (circulars.length > CIRCULAR_DEPS_IN_RELEASE) {
    console.log("More deps than release!");
  }
});
