const { parseDependencyTree, parseCircular } = require("dpdm");

const CIRCULAR_DEPS_IN_RELEASE = 2900;

parseDependencyTree("./src", {}).then((tree) => {
  const circulars = parseCircular(tree);
  if (circulars.length > CIRCULAR_DEPS_IN_RELEASE) {
    console.log("More deps than release!");
  }

  console.log(circulars);
});
