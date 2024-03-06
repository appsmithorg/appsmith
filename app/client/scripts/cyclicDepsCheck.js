const madge = require("madge");

const formatCyclicDeps = (cyclicDeps) => {
  return cyclicDeps
    .map((deps, index) => `${index + 1}. ${deps.join(" -> ")}`)
    .join("<br />");
};

(async () => {
  const response = await madge("./src", {
    fileExtensions: ["ts", "tsx"],
  });

  const cyclicDeps = response.circular();

  if (cyclicDeps.length > 0) {
    console.log(`Found ${cyclicDeps.length} cyclic dependencies:`);
    console.log(formatCyclicDeps(cyclicDeps)); // Output the cyclic dependencies
  } else {
    console.log("No cyclic dependencies found");
  }
})();
