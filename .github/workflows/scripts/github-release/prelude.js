const { exec } = require("child_process");

module.exports = async function ({ core, context }, imageRepo) {
  core.summary.addList([
    "PWD: " + process.cwd(),
    "GITHUB_REF: " + context.ref,
    "GITHUB_SHA: " + context.sha,
    "GITHUB_EVENT_NAME: " + context.eventName,
  ]);

  if (!context.ref?.match(/^refs\/tags\/v/)) {
    core.setFailed(`Invalid tag: '${context.ref}'. Has to be like 'v1.22', 'v1.22.33' only.`);
    return;
  }

  const thisVersion = context.ref.replace("refs/tags/", "");
  core.setOutput("tag", thisVersion);

  const dockerTags = [
    `${imageRepo}:${thisVersion}`,
  ];
  const latestVersion = await getLatestTag();

  if (latestVersion === thisVersion) {
    dockerTags.push(`${imageRepo}:latest`);
  }

  core.summary.addHeading("Docker image tags", 3);
  core.summary.addCodeBlock(dockerTags.join("\n"));
  core.setOutput("docker_tags", dockerTags.join("\n"));
}

function getLatestTag() {
  return new Promise((resolve, reject) => {
    exec("git tag --list --sort=-version:refname 'v*' | head -1", (error, stdout, stderr) => {
      if (error) {
        reject(`exec error: ${error}`);
        return;
      }
      if (stderr) {
        reject(`stderr: ${stderr}`);
        return;
      }
      resolve(stdout.trim());
    });
  });
}
