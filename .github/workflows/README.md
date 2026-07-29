# CI workflows

The workflow files in this directory are the source of truth for what runs and when.
Each one is named for what it does, and its `on:` block states its triggers.

This README covers only what you cannot infer from the YAML: how to trigger CI by hand.

## Running Cypress on a PR

1. Keep the `## Automation` section from the PR template in your PR description, and
   fill in the tags:

   ```
   /ok-to-test tags="@tag.All"
   ```

2. Add the `ok-to-test` label to the PR.

Results are written back into the PR description under "Cypress test results", and
reported as the `PR Automation test suite / perform-test / ci-test-result` check.

Notes:

- Pushing new commits cancels the in-flight run and retests the new HEAD.
- Remove the `ok-to-test` label to stop tests running on each push.
- Remove and re-add the label to re-run against the same commit.
- Do not edit the auto-generated "Cypress test results" block. The workflow rewrites
  it, and corrupting it disrupts the CI result for the PR.
- Add any other labels *before* `ok-to-test`. Adding a label afterwards resets results.

### Commenting `/ok-to-test` does nothing

The comment-triggered version of this command was retired in March 2024. Commenting it
gets you a bot reply saying the method is defunct. Use the PR body and the label, as
above.

### Fork PRs cannot run Cypress this way

GitHub gives workflows on pull requests from forks a read-only token and no access to
secrets, regardless of the `permissions:` block. The `ok-to-test` label path therefore
cannot work for external contributions, and the run fails when it tries to write test
status back to the PR.

## Slash commands

These are still comment-triggered. They dispatch through a GitHub App and require write
access on the repository, so they work on fork PRs.

| Command | What it does |
| --- | --- |
| `/build-deploy-preview` | Builds an image and deploys a preview environment |
| `/test-pw` | Runs the Playwright suite |
| `/ci-test-limit` | Runs a limited Cypress set |

Configured in [ok-to-test.yml](ok-to-test.yml).
