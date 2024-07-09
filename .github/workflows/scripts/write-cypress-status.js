const HEADER = '<!-- This is an auto-generated comment: Cypress test results  -->';
const FOOTER = '<!-- end of auto-generated comment: Cypress test results  -->';
const PATTERN = new RegExp(HEADER + ".*?" + FOOTER, "ims");

// Ref: https://github.com/orgs/community/discussions/16925
const VALID_ALERT_TYPES = ["note", "tip", "important", "warning", "caution"]

const ALERT_PREFIXES = {
  tip: "🟢 🟢 🟢 ",
  important: "🟣 🟣 🟣 ",
  caution: "🔴 🔴 🔴 ",
}

module.exports = async function({core, context, github}, alertType, note) {
  if (!VALID_ALERT_TYPES.includes(alertType)) {
    core.setFailed("Invalid alert type: '" + alertType + "'. Allowed: " + VALID_ALERT_TYPES.join(", ") + ".");
  }

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

  note = [
    HEADER,
    `> [!${alertType.toUpperCase()}]`,
    ((ALERT_PREFIXES[alertType] ?? "") + note.trim()).replaceAll(/^/gm, "> "),
    "> <hr>" + new Date().toUTCString().replace("GMT", "UTC"),
    FOOTER,
  ].join("\n");

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
