module.exports = function ({core, context}) {
  let tags;
  try {
    tags = parseTags(context.payload.pull_request.body);
  } catch (error) {
    core.setFailure(error.message);
    core.setOutput("outcome", "failure");
    const body = [
      "Invalid tags. Please use `/ok-to-test tags=\"@tag.All\"` or `/test all` in the PR body to run all tests.",
      "[Tags documentation](https://www.notion.so/appsmith/7c0fc64d4efb4afebf53348cd6252918)",
      "[List of valid tags](https://github.com/appsmithorg/appsmith/blob/release/app/client/cypress/tags.js)",
    ].join("\n");
    require("write-cypress-status.js")({core, context, github}, "warning", body);
  }

  core.setOutput("tags", tags);
  core.setOutput("outcome", "success");
}

function parseTags(body) {
  const allTags = require(process.env.GITHUB_WORKSPACE + "/app/client/cypress/tags.js").Tag;

  // "/ok-to-test" matcher. Takes precedence over the "/test" matcher.
  const strictMatch = body.match(/\/ok-to-test tags="(.+?)"/)?.[1];
  if (strictMatch) {
    if (strictMatch === "@tag.All") {
      return strictMatch;
    }
    const parts = strictMatch.split(/\s*,\s*/);
    for (const part of parts) {
      if (!allTags.includes(part)) {
        throw new Error("Unknown tag: " + part);
      }
    }
    return strictMatch;
  }

  // "/test" matcher.
  const config = body.match(/^\**\/test\s+(.+?)\**$/m)?.[1] ?? "";
  const concreteTags = [];

  if (config.toLowerCase() === "all") {
    return "@tag.All"
  }

  for (const [rawTag] of config.matchAll(/\w+/g)) {
    console.log("Given: '" + rawTag + "'");
    const rawTagLowerAndPrefixed = "@tag." + rawTag.toLowerCase();

    // See if there is exact case-insensitive match.
    const exactTagMatch = allTags.find(t => t.toLowerCase() === rawTagLowerAndPrefixed);
    if (exactTagMatch) {
      console.log("\tMatch found:", exactTagMatch);
      concreteTags.push(exactTagMatch);
      continue;
    }

    // See if there is a singular/plural match (very rudimentary language skills).
    const countedMatch = allTags.find(t => t.toLowerCase().replace(/s$/, "") === rawTagLowerAndPrefixed.replace(/s$/, ""));
    if (countedMatch) {
      console.log("\tMatch found:", countedMatch);
      concreteTags.push(countedMatch);
      continue;
    }

    // More smart matchers?

    // No match, fail.
    throw new Error("No match found for tag: " + rawTag);

    // We still process the rest, so we report all invalid tags in the input in a single run.
  }

  if (concreteTags.length === 0) {
    throw new Error("Tags were not found!")
  }

  return concreteTags.join(", ");
}
