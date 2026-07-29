# Appsmith CE — Security Review Context

## Public repository disclosure policy

This repository and all pull-request comments are public.

For inline findings, NEVER include:
- Working exploit code or proof-of-concept payloads
- Exact HTTP requests, curl commands, malicious URLs, or attacker-controlled IDs
- Step-by-step reproduction or exploitation instructions
- Secrets, tokens, credentials, or sensitive production examples

Public comments should state only:
- The vulnerability class
- The affected trust boundary and impact at a high level
- The security invariant that is violated
- High-level remediation guidance

Keep full reproduction steps, payloads, call traces, and exploit evidence in the
private Hacktron dashboard only.

For pre-existing or cross-function vulnerabilities not wholly introduced by the
diff, do not reveal the affected file, function, endpoint, or exploit path in
the public PR. If a finding cannot be explained safely, publish only a generic
notice that a potential security issue requires private review.

## Product and trust model

Appsmith is a self-hostable open-source low-code platform for building internal
tools.

Components:
- React/TypeScript browser client (`app/client/`)
- Java 25 Spring WebFlux server (`app/server/`)
- Node.js RTS real-time server (`app/client/packages/rts/`)
- Docker, Helm, Caddy reverse proxy, shell scripts (`deploy/`)

## Untrusted inputs

Treat all of these as attacker-controlled:

- Browser requests, headers, and cookies
- Anonymous app viewers and authenticated editors/workspace members
- All client-supplied IDs: workspace, application, page, action, datasource,
  environment, branch, artifact, permission group
- Imported Appsmith applications and their JSON content
- Git repositories: branches, filenames, file contents, configs, symlinks,
  submodules, archives
- Uploaded files
- Datasource and plugin query responses
- User-authored JavaScript, widgets, templates, URLs, and bindings
- Admin settings and environment-variable values (application-admin context,
  not deployment-operator configuration)
- Redirect destinations and DNS responses

A **super-admin** is authorized to administer Appsmith but is NOT trusted to
obtain container/host command execution, arbitrary filesystem access, cloud
metadata, or cross-tenant data. Do not suppress findings solely because
exploitation requires administrator access.

## Authentication and authorization

Authorization is enforced in the **service layer** using `AclPermission` and
permission helpers (`ApplicationPermission`, `PagePermission`,
`DatasourcePermission`, `WorkspacePermission`).

Low-level repository methods intentionally omit ACL checks. Do not report a
repository method merely because it has no permission check — trace whether an
externally reachable controller/service path performs the correct check before
calling it.

**Report when:**
- A service passes `null` or uses a `WithoutPermission` variant without a proven
  earlier authorization check in the same reactive chain
- A mutation reaches a repository before checking the required permission
- Read permission is used for a write operation
- Authorization is performed on one object but the operation uses a different
  client-supplied ID (BOLA/IDOR)
- Parent-child relationships are not validated (page→application,
  datasource→workspace, action→page, branch→application, environment→workspace)
- Branch and non-branch code paths enforce different permissions
- Anonymous viewer access exposes editor-only data, secrets, unpublished state,
  or cross-application resources

For Reactor code: the authorization check must be part of the same subscribed
`Mono`/`Flux` chain and execute **before** the sensitive operation. Creating a
permission-checking publisher without chaining or subscribing provides no
protection.

## Object graphs, mass assignment, and policy mutation

- Treat DTO deep merges, bean copying, JSON conversion, and patch operations as
  security-sensitive.
- Clients must not overwrite ownership, workspace/application/page/datasource
  relationships, policies, plugin identity, creator identity, or publication
  state unless explicitly authorized.
- Any operation granting public or anonymous access must verify the caller can
  manage the target object and that every referenced object belongs to the same
  workspace/application.
- Authorization on one supplied ID does not authorize other IDs nested in the DTO.

## Git and filesystem operations

Git repository content is **attacker-controlled**. The module at
`app/server/appsmith-git/` handles Git operations.

- All file operations must remain inside the configured Git root or temp directory
- Lexical `Path.normalize()` alone is insufficient — validate canonical/real paths
- Account for symlinks, not-yet-created paths, archive entries that escape
  destination, absolute paths, and traversal segments
- Security validation failures must fail closed
- Partial clone/import failures must delete residual files
- For shell execution, verify that every untrusted value remains a single argument
  through the actual shell and command boundary. Escaping is not sufficient when
  escaped fragments are concatenated, decoded again, evaluated twice, or passed
  through another interpreter. `ProcessBuilder` argument lists that do not invoke
  a shell do not require shell escaping.

**High-risk code:**
- `app/server/appsmith-git/**`
- Git import/export and autocommit services
- File and archive helpers
- Deployment shell scripts

## Environment and command execution

- Never load user-modifiable env files using `source`, `.`, `eval`, or command
  substitution
- Allowlist environment-variable names; preserve values without shell evaluation
- Do not pass request, Git, datasource, or environment values through a shell
  without proper escaping
- Treat `ProcessBuilder`, shell scripts, Docker commands, CI expressions, and
  Caddy configuration as security-sensitive

## Outbound network (SSRF)

`WebClientUtils` and `RestrictedHostFilter` (in `appsmith-interfaces`) are the
canonical egress controls for WebClient-based plugins (REST, GraphQL, SaaS).

Different connector families use different networking stacks. Do not assume
WebClient controls cover JDBC, document databases, SMTP, or SSH-tunnel traffic.
For every changed outbound connector, verify equivalent controls appropriate to
that transport and deployment mode.

**Report paths that:**
- Create raw HTTP clients bypassing central egress filtering
- Reach loopback, link-local, metadata services (169.254.169.254), or IPv6 ULA
- Validate hostname but not all resolved addresses
- Are vulnerable to DNS rebinding or redirect-following without revalidation
- Allow alternate IP encodings or URL parser confusion
- Let non-HTTP connectors bypass equivalent host validation for their transport

**Do NOT report:** RFC1918 private-address access alone — self-hosted Appsmith
instances legitimately connect to internal datasources. Only report bypasses of
an operator-enabled strict-private-address policy.

## Browser, JavaScript, and XSS

Normal React text interpolation (`{}`) is escaped and is NOT an XSS issue.

App editors are expected to author JavaScript for their own applications. Do not
report that capability itself as XSS.

**Report attacker-controlled data reaching:**
- `dangerouslySetInnerHTML`, `innerHTML`, or HTML parsers without sanitization
- Script, custom-widget (`CustomWidget`), worker, iframe, or dynamic eval
  contexts
- `javascript:`, `data:`, or other executable URL schemes
- `postMessage` handlers without origin validation
- Markdown, table HTML, rich text, autocomplete, or error rendering bypassing
  sanitization
- Cross-application or viewer-to-editor execution boundaries
- Sandbox escapes, viewer compromise, cross-workspace execution, or secret
  exposure in a privileged Appsmith origin

## Intended datasource behavior

Authorized app editors intentionally write JavaScript, SQL, NoSQL, and plugin
queries and configure datasource hosts. Do not report this capability alone.

Report injection when lower-privileged viewer input crosses an authorization
boundary, bypasses an established parameter-binding mechanism, or affects another
application, workspace, tenant, or privileged Appsmith service.

## Sessions, CSRF, redirects, and trusted origins

- State-changing GET requests are vulnerabilities because GET/HEAD requests may
  bypass CSRF protection.
- Review changes to CSRF exemptions, cookie attributes, anonymous endpoints,
  permit-all matchers, login/logout, OAuth state, and session rotation.
- Origin, Referer, Host, and X-Forwarded-* headers are attacker-controlled unless
  validated against trusted server configuration and trusted proxy boundaries.
- Token-bearing email links and security redirects must derive their host from
  trusted server configuration.
- Password reset, verification, and invitation tokens must be single-use,
  time-limited, and absent from logs, analytics, and referrers.

## CI and software supply chain

Pull requests may originate from untrusted forks.

Report:
- `pull_request_target` workflows that check out or execute PR-controlled code
- PR-controlled values interpolated into shell commands or GitHub expressions
- Secrets or write-capable tokens exposed to untrusted jobs
- Overly broad workflow permissions
- Untrusted artifact, cache, or workflow-run consumption
- Mutable third-party action references in privileged workflows
- Package lifecycle scripts or build hooks introduced by dependency changes

## Multi-tenant caches and asynchronous processing

- Cache keys, background jobs, events, and reactive publishers must preserve
  workspace, organization, application, branch, user, and permission context.
- Do not reuse authorization-sensitive results across tenants or users.
- Do not swallow authorization or validation failures with `onErrorResume`,
  `defaultIfEmpty`, retries, or fallback data that permits the mutation to
  proceed.

## Secrets and sensitive data

Datasource credentials, OAuth tokens, API keys, Git SSH keys, SMTP credentials,
environment values, session tokens, and encryption material are sensitive.

Review API responses, viewer endpoints, exports, logs, analytics, Redux state,
error messages, and support bundles for accidental disclosure.

## Noise reduction

- Do not report vulnerabilities in pure documentation, comments, or inert test
  fixture data unless it is executed, shipped, or used by CI with secrets
- Do not assume test code is harmless — CI scripts, test setup that invokes
  shells, and workflow code remain security-sensitive
- Do not globally suppress any vulnerability category; use triage feedback for
  recurring safe patterns
- Do not report that `npm audit` or `yarn audit` advisories exist in lockfiles —
  dependency scanning is handled separately
