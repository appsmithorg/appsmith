module.exports = function ({core, context, github}) {
  // Get predictable newlines in the body content. Cause for _so_ much unneeded pain in this world!
  const body = context.payload.pull_request.body?.replaceAll(/\r(\n)?/g, "\n");
  if (!body) {
    core.setFailed("Empty payload body!");
    return;
  }

  let parseResult;
  try {
    parseResult = parseTags(body);
  } catch (error) {
    core.setFailed(error.message);
    const body = [
      "Invalid tags. Please use `/ok-to-test tags=\"@tag.All\"` or `/test all` in the PR body to run all tests.",
      "[Tags documentation](https://www.notion.so/appsmith/7c0fc64d4efb4afebf53348cd6252918).",
      "[List of valid tags](https://github.com/appsmithorg/appsmith/blob/release/app/client/cypress/tags.js).",
    ].join("\n");
    require("./write-cypress-status.js")({core, context, github}, "warning", body);
    return;
  }

  core.setOutput("tags", parseResult.tags ?? "");
  core.setOutput("spec", parseResult.spec ?? "");
}

function parseTags(body) {
  const allTags = require(process.env.GITHUB_WORKSPACE + "/app/client/cypress/tags.js").Tag;

  // "/ok-to-test" matcher. Takes precedence over the "/test" matcher.
  const okToTestPattern = body.match(/^(\/ok-to-test) tags="(.+?)"( it=true)?/m);

  if (okToTestPattern?.[1]) {
    var response = {};
    const tagsMatch = okToTestPattern?.[2];
    if (tagsMatch) {
      if (tagsMatch === "@tag.All") {
        response = { tags: tagsMatch };
      } else {
        const parts = tagsMatch.split(/\s*,\s*/);
        for (const part of parts) {
          if (!allTags.includes(part)) {
            throw new Error("Unknown tag: " + part);
          }
        }
        response = { tags: tagsMatch };
      }
    }
    const itsMatch = okToTestPattern?.[3];
    if (itsMatch) {
      response = { ...response, its: 'true' };
    }
    return response;
  }

  // "/test" code-fence matcher.
  const result = matchCodeFence(body);
  if (result) {
    console.log("Code fence match:\n" + result.spec);
    return result;
  }

  // "/test" matcher.
  const config = body.match(/^\**\/test\s+(.+?)\**$/m)?.[1] ?? "";
  const concreteTags = [];

  if (config.toLowerCase() === "all") {
    return { tags: "@tag.All" };
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

  return { tags: concreteTags.join(", ") };
}

function matchCodeFence(body) {
  const re = /^```\n\/test\n(.+?)^```\n/ms;

  const spec = body.match(re)?.[1];

  return spec ? { spec } : null;
}
