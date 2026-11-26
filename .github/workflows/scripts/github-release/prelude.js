// Plain version tags only, like 'v1.22', 'v1.22.33' or 'v1.9.37.1'.
const VERSION_PATTERN = /^v\d+(\.\d+)*$/;

module.exports = async function ({ core, context, github }, imageRepo) {
  core.summary.addTable([
    [{ data: "PWD", header: true }, process.cwd()],
    [{ data: "GITHUB_REF", header: true }, context.ref],
    [{ data: "GITHUB_SHA", header: true }, context.sha],
    [{ data: "GITHUB_EVENT_NAME", header: true }, context.eventName],
  ]);

  if (!context.ref?.match(/^refs\/tags\/v/)) {
    core.setFailed(`Invalid tag: '${context.ref}'. Has to be like 'v1.22', 'v1.22.33' only.`);
    return;
  }

  // Current version being tagged, including the 'v' prefix.
  const thisVersion = context.ref.replace("refs/tags/", "");
  core.setOutput("tag", thisVersion);

  // The docker tags to be pushed to the registry.
  const dockerTags = [
    `${imageRepo}:${thisVersion}`,
  ];

  const skipLatestReason = await getSkipLatestReason({ context, github }, thisVersion);
  if (skipLatestReason) {
    core.notice(`Not tagging ${imageRepo}:latest: ${skipLatestReason}`);
  } else {
    dockerTags.push(`${imageRepo}:latest`);
  }

  core.summary.addHeading("Docker image tags", 3);
  core.summary.addCodeBlock(dockerTags.join("\n"));
  core.setOutput("docker_tags", dockerTags.join("\n"));

  core.summary.write();
}

// The checkout holds only the tag being released, so the comparison must use the published releases.
async function getSkipLatestReason({ context, github }, thisVersion) {
  if (!VERSION_PATTERN.test(thisVersion)) {
    return `${thisVersion} is not a plain version number.`;
  }

  const releases = await github.paginate(github.rest.repos.listReleases, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    per_page: 100,
  });

  const higherRelease = releases.find(
    (release) =>
      !release.draft &&
      !release.prerelease &&
      VERSION_PATTERN.test(release.tag_name) &&
      compareVersions(release.tag_name, thisVersion) > 0,
  );

  return higherRelease && `${higherRelease.tag_name} is a higher published release than ${thisVersion}.`;
}

function compareVersions(a, b) {
  const aParts = a.slice(1).split(".").map(Number);
  const bParts = b.slice(1).split(".").map(Number);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
}
