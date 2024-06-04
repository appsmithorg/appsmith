module.exports = async ({core, github, context}) => {
  const prNumber = process.env.PR_NUMBER;

  const affectedFiles = await github.paginate(github.rest.pulls.listFiles, {
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
    per_page: 100,
  });
  console.log(affectedFiles);

  const nonTsFiles = affectedFiles.filter(f => f.status === "added" && f.filename.startsWith("app/client/cypress/e2e/") && !f.filename.endsWith(".ts"));
  console.log(nonTsFiles);

  if (nonTsFiles.length > 0) {
    const body = [
      "🔴 There's new test files in JS, please port to TS and re-trigger Cypress tests:",
      `1. ${nonTsFiles.map(f => f.filename).join("\n1. ")}`,
    ].join("\n");
    github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: prNumber,
      body,
    });
    core.setFailed("There's new test files in JS\n" + body);
  }
};
