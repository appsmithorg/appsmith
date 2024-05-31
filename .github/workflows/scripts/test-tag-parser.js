function parseTags({core, context}) {
  const body = context.payload.pull_request.body;

  // "/ok-to-test" matcher. Takes precedence over the "/test" matcher.
  const strictMatch = body.match(/\/ok-to-test tags="(.+?)"/)?.[1];
  if (strictMatch) {
    return strictMatch;
  }

  // "/test" matcher.
  const allTags = require(process.env.GITHUB_WORKSPACE + "/app/client/cypress/tags.js").Tag;
  const config = body.match(/^\**\/test\s+(.+?)\**$/m)?.[1] ?? "";
  const concreteTags = [];

  if (config.toLowerCase() === "all") {
    return "@tag.All"
  }

  for (const [rawTag] of config.matchAll(/\w+/g)) {
    console.log("Given: '" + rawTag + "'");

    // See if there is exact case-insensitive match.
    const exactTagMatch = allTags.find(t => t.toLowerCase() === "@tag." + rawTag);
    if (exactTagMatch) {
      console.log("\tMatch found:", exactTagMatch);
      concreteTags.push(exactTagMatch);
      continue;
    }

    // See if there is a singular/plural match (very rudimentary language skills).
    const countedMatch = allTags.find(t => t.toLowerCase().replace(/s$/, "") === "@tag." + rawTag.replace(/s$/, ""));
    if (countedMatch) {
      console.log("\tMatch found:", countedMatch);
      concreteTags.push(countedMatch);
      continue;
    }

    // More smart matchers?

    // No match, fail.
    core.setFailed("\tNo match found for tag:", rawTag);

    // We still process the rest, so we report all invalid tags in the input in a single run.
  }

  return concreteTags.join(", ");
}

module.exports = {
  parseTags,
}
