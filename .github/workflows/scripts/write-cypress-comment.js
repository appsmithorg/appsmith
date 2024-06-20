const HEADER = '<!-- This is an auto-generated comment: Cypress test results  -->';
const FOOTER = '<!-- end of auto-generated comment: Cypress test results  -->';
const PATTERN = new RegExp(HEADER + ".*?" + FOOTER, "ims");

module.exports = async function({core, context, github}, note) {
  const prNumber = context.payload.pull_request?.number;

  if (!prNumber) {
    core.setFailed(
      `No open pull request found for ${context.eventName}, ${context.sha}`,
    );
    return;
  }

  const response = await github.rest.pulls.get({
    ...context.repo,
    pull_number: prNumber,
  });

  let body = response?.data?.body;
  if (!body) {
    core.setFailed(JSON.stringify(response, null, 2));
    return;
  }

  note = [HEADER, note, FOOTER].join("\n");

  if (body.match(PATTERN)) {
    body = body.replace(PATTERN, note);
  } else {
    body += "\n\n" + note + "\n";
  }

  await github.rest.pulls.update({
    ...context.repo,
    pull_number: prNumber,
    body,
  });
}
