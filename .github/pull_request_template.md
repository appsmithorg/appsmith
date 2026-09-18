## Description
> [!TIP]  
> _Add a TL;DR when the description is longer than 500 words or extremely technical (helps the content, marketing, and DevRel team)._
>
> _Please also include relevant motivation and context. List any dependencies that are required for this change. Add links to Notion, Figma or any other documents that might be relevant to the PR._


Fixes #`Issue Number`  
_or_  
Fixes `Issue URL`
> [!WARNING]  
> _If no issue exists, please create an issue first, and check with the maintainers if the issue is valid._

## Testing

> [!NOTE]
> **How CI runs on fork PRs — no action needed from you.**
> 1. **Workflow approval.** GitHub holds the first run on fork PRs until a maintainer approves it, so a pause before any check appears is expected.
> 2. **Credential-free checks.** Once approved, format, lint, typecheck, unit tests, cyclic-dependency and compile-only build checks run without repository secrets. Only the checks relevant to what you changed (client / server / RTS) will run, and their logs are safe to debug against.
> 3. **Maintainer-triggered checks.** Cypress, Playwright, Docker builds and deploy previews need secrets, so a maintainer starts them with `/approve-ci`, and `/build-deploy-preview` when hands-on testing is needed. Approval is pinned to one commit — pushing again requires fresh approval.
>
> The `awaiting-maintainer` / `awaiting-contributor` labels show whose turn it is. You do **not** need `ok-to-test` or any slash command. Full detail: [Pull request check states](https://github.com/appsmithorg/appsmith/blob/release/contributions/CodeContributionsGuidelines.md#pull-request-check-states).

Select the validation relevant to this change:

- [ ] Client unit tests
- [ ] Server unit tests
- [ ] Cypress
- [ ] Playwright
- [ ] Deploy preview
- [ ] Not applicable

Suggested Cypress tags or specs:


## Communication
Should the DevRel and Marketing teams inform users about this change?
- [ ] Yes
- [ ] No
