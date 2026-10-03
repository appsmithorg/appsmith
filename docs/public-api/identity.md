# Identity and the edition boundary

Status: Phase 1 design, PR 1 of the Phase 1 epic (APP-16031; this document is APP-16047). It builds
on `conventions.md`. The two exceptions it needs (token-issuing operations and the OIDC exchange,
sections 3 and 10) and the `503` code it relies on are carve-outs added to `conventions.md` §3 and §6
in the same reviewed PR; this document never overrides a convention in place. Everything here is a
decision unless marked **proposed**; a proposed item names its owner
and the PR it gates in section 12. Nothing in this document is implemented; Phase 1 PRs 2 to 6
implement it and cite the section they satisfy (section 13).

Scope: who can call the public API, with what credential, bounded how, and how that is enforced,
audited and migrated. Existing internal `/api/v1` routes and the MCP server keep their current
behaviour; the design adds two session-only internal routes (section 3) and one rejection filter
(section 7) to the internal chain.

Every class, route, permission, flag and property named below existed at the stated location when
this document was written (CE `release` at `50a5bf0d71`, EE `release` at `b9179de69c`) unless it is
marked "new in PR n". "EE" marks a location that exists only in the enterprise repository.

## 1. Edition boundary

Two models were compared.

| | A. Secure CE baseline, EE governance | B. CE interface plus `requires_license`, EE implementation |
|---|---|---|
| CE ships | Public API framework, single-organization service accounts, personal access tokens, bounded expiring token grants, rotation, revocation, the Profile and Admin token pages | The public route layer, DTOs and interfaces; every credential and service-account operation returns `403 requires_license`; no token can be minted on CE |
| EE ships | Multi-organization scoping, instance-wide accounts, the credentials overview across SCIM, Git and workflow keys, audit entries and filters, OIDC federation | Everything in column A, plus the governance in this row |
| Security posture | Every edition validates credentials the same way; a paid operation fails closed with the documented error and never falls back to weaker authorization | Same fail-closed rule, but CE has no machine credential; CE users keep using session cookies and MCP tokens for automation |
| Code layout | The `XxxCE` / `XxxCEImpl` plus EE override pattern the server already uses; EE adds behaviour and never re-implements | Every service has a CE stub and an EE body; EE re-implements rather than extends, which the CE to EE sync rules warn against |
| Testability | The blocked-and-still-works regression suite (modelled on `AuthGuardTest`) runs in CE CI on every PR | Only the blocked half is testable in CE; the still-works half lives only in EE CI |
| Downstream phases | Phases 2, 5 and 6 (lifecycle API, CLI, SDK) work on CE; OSS users and partners can build on them | The CLI, SDK and Terraform provider are EE-only in practice because nothing can authenticate to CE |
| Precedent | MCP tokens (hashed, expiring, rotate and revoke) already ship in CE | None in CE; the closest is EE `UserApiKey`, which is `@Encrypted` (recoverable), unscoped and never expires |
| Commercial | Governance, cross-organization visibility, audit and SCIM stay paid; the credential mechanism is not the product | The whole programmable-platform story is paid |

**Decision: A, split across three editions.** A single-organization service account with bounded,
expiring tokens is the security floor in every edition, not a feature. Business and Enterprise run the
same EE build and differ by license entitlements. Governance (OIDC federation, lifetime policy,
per-resource selectors, several named organizations, instance-wide accounts) and every user-management
API are Enterprise. A licensed capability is gated from the validated license from the first PR; a
lower edition answers `403 requires_license` and the UI shows the control disabled with the license
message. Product, Sales and Security ratify this choice and the numbers in section 1a (section 12,
row 1); until they do, the PR that adds this document stays a draft. If they choose B instead,
sections 2 to 11 still hold and only the edition column of each table changes.

### 1a. Three-edition split (identity scope)

**Proposed** (Product, Sales and Security; section 12, row 1). The choice of A over B gates PR 2;
the numbers do not, because PR 2 enforces them through an injectable source (last bullet below).

| Identity capability | Community | Business | Enterprise |
|---|---|---|---|
| Personal access tokens (`apt_`) | 5 per user | 5 per user | 5 per user |
| Service accounts (single organization) | 1 per instance | 5 per organization | Unlimited |
| Tokens per service account (`ast_`) | 2 (rotation overlap) | 3 | Unlimited (soft limit 50) |
| Token lifetime | Expiry required, 90-day maximum | Expiry required, 90-day maximum | Organization-configured policy, ceiling 365 days |
| Grant selectors | Organization and workspace | Organization and workspace | Adds application, datasource, workflow and environment selectors |
| User-management scopes (`users:read`, `permissions:write`) | No | No | Yes |
| Several named organizations; instance-wide accounts | No | No | Yes (self-hosted only for instance-wide) |
| OIDC workload federation | No | No | Yes |
| Credentials overview | Own tokens; organization administrators list and revoke any credential in the organization | All organization credentials in one table across every source | Adds bulk revoke and expiry policy |
| Token events in the audit log with a service-account filter | Structured log line only | Yes | Yes |
| Rate limit per token | 60/min | 60/min, burst 120; cloud organization ceiling 300/min | 600/min |
| API call quotas | None | None | None |

Rules for the split:

- Caps are numeric license entitlements (counts, not on/off flags), checked when a credential is
  issued and never per request. The per-token rate limit is likewise stamped on the credential at
  issuance from the entitlement, so the per-request limiter reads the token, not the license.
- Community's two tokens per service account are the rotation overlap of one job. Community
  therefore supports one automated job per instance on a service account; a second job uses a
  personal access token. Product decides this knowingly in section 12, row 1; raising the number to 3
  gives two jobs plus overlap.
- The workflow selector sits with the other fine selectors on Enterprise although workflows are a
  Business capability. Product may move it to Business in the same decision; nothing else in this
  document depends on where it lands.
- Revocation is baseline security in every edition: a user can always revoke their own tokens, and an
  organization administrator can always list and revoke any credential in their organization (section
  4a, `credentials:write`). What is paid is the cross-source inventory (section 9), bulk operations and
  policy.
- Downgrade. Credentials above a numeric cap keep working until they expire; new issuance is blocked
  and administrators see a notice. A grant whose scope or selector the new edition does not allow
  answers `403 requires_license` on every request that relies on it. A several-organization or
  instance-wide account answers `403 requires_license` on every request until an administrator
  re-scopes it to one organization; the account's organization form is re-validated against the
  entitlement on every request, not only at issuance.
- Credential self-service (a user's own tokens, an organization's own service-account tokens) is not
  user management and is available in every edition within its caps. Creating users, managing groups
  and membership, and assigning roles through the API are Enterprise (roadmap Phase 2b); every edition
  keeps its existing access-management UI.
- Edition maps onto the server's existing license model: Community is the CE build, or an EE build
  with `LicensePlan.FREE`, an expired license or no license; Business is `LicensePlan.BUSINESS`, and
  until Licensing says otherwise (section 12, row 2) also the deprecated `SELF_SERVE` and
  `BUSINESS_AI`; Enterprise is `LicensePlan.ENTERPRISE` (EE `constants/LicensePlan`). The hierarchy
  the server already orders is `FREE`, `BUSINESS`, `ENTERPRISE` (EE `domains/License`,
  `licensePlansHierarchy`).
- Today the license carries only `Map<String, Boolean> organizationFeatures` (EE `domains/License`)
  and the plan. Counts therefore cannot be read from the payload without a change; section 12 records
  the decision. PR 2 enforces caps against an injectable entitlement source seeded with the Community
  column, so it does not wait on the numbers; PR 6 replaces the source with the license-derived table.

## 2. Principals

| Principal | Exists today | Phase 1 |
|---|---|---|
| User | `User` | Unchanged; may hold personal access tokens |
| Service account | Only feature-specific bots: the EE Git bot and the Workflow Scheduler bot are `User` records with the CE field `User.isSystemGenerated` set, created by EE `CentralGitServiceImpl.getOrCreateGitBotUser` and `InteractWorkflowServiceImpl.getOrCreateWorkflowBotUser` | First-class: stable ID, name, description, organization(s), accountable owner (transferable), enabled flag, permission-group assignments. A distinct domain type (`ServiceAccount`, new in PR 2), never a `User` with a flag, so it never receives invitations, e-mail or a login. The existing bots are adapted onto it (section 9), not replaced on day one |
| Anonymous or session | Cookie session on `/api/v1`; anonymous principal from `SecurityConfig.securityWebFilterChain` | Never accepted on `/api/public`. The public chain has no anonymous principal, ignores cookies and has no login (section 7), so a browser session cannot reach it by accident and a cross-site request cannot ride one there |

A service account is authorized the way the bots are today: it is assigned `PermissionGroup`s, the
policies those groups produce are generated by `acl/ce/PolicyGeneratorCE`, and the repository layer
evaluates them unchanged. What is new is the principal type, not the permission model.

Ownership rules:

- The accountable owner is a user or the administrator role: the instance administrator role
  (`FieldNameCE.INSTANCE_ADMIN_ROLE`) on Community, the organization administrator role on EE. When
  an owning user is deleted, or deprovisioned through SCIM (EE
  `ProvisionServiceImpl.deleteUsersAndGroups`, which archives nothing credential-related today), the
  account is not disabled: ownership transfers to the administrator role, an audit event records it,
  and its tokens keep running. PR 2 exposes the hook on the CE service-account service; both callers
  (user deletion in EE `UserServiceImpl`, which CE does not have, and the EE provisioning path) wire
  it in the EE follow-up of the same milestone.
- On any ownership transfer, every token whose grants exceed the new owner's current permissions
  (the role's permissions when the owner is a role) is revoked, and the transfer response lists
  them; the new owner re-issues what is needed. This keeps the section 4 rule that nobody holds a
  credential wider than the caller who issued it.
- A service account whose organization is deleted is out of scope until an organization lifecycle
  exists; no organization-delete path exists in the server today.

## 3. Credential types

What exists today:

| Credential | Where | Storage | Expiry | Rotate | Revoke | Scope | Audit |
|---|---|---|---|---|---|---|---|
| MCP token, `mcp_<keyId>_<secret>` | CE `services/ce/McpTokenServiceCEImpl`, `helpers/McpUserKeyCodec`, `helpers/McpTokenUtils`, `helpers/McpTokenCache`; routes `POST`, `GET`, `POST /{keyId}/rotate`, `DELETE /{keyId}` under `/api/v1/users/mcp-tokens` (`controllers/ce/McpTokenControllerCE`, `UrlCE.MCP_TOKEN_URL`), session-only: an MCP principal is refused by `requireSessionAuthentication` | SHA-256 of the presented key (`McpTokenUtils.hash`), key id as lookup; live entry cached in Redis per key id | Required, from a fixed allowlist of spans (30 to 365 days, default 30, `ALLOWED_KEY_SPAN_DAYS`); a per-edition active-key cap (`getMaxActiveKeysPerUser`: 2 in CE, 10 in EE) | Yes, in a Mongo transaction | Yes | Fixed server allowlist (`filters/McpAllowlistWebFilter.ALLOW_RULES`, `move` and `refactor` always denied) plus the user's own ACLs; not caller-selectable | MCP change history only |
| EE user API key | EE `domains/UserApiKey`; `controllers/ApiKeyController` at `/api/v1/api-key`: `POST`, `POST /provision`, `POST /workflow/{id}` | `@Encrypted` (recoverable plaintext; the presented key is the encrypted blob, so a compromise of the instance encryption password and salt exposes every legacy key at once) | None | No | Delete only | `ApiKeySource` category (EE `enums/ApiKeySource`: `SCIM`, `GIT`, `WORKFLOWS`, `RTS`, `SYSTEM_GENERATED`); acts as the bound user | EE audit log, as that user; no last-use field |
| Git deploy bearer | EE `CentralGitServiceImpl` bot user plus a `UserApiKey` of source `GIT` | As above | None | No | Via key delete | The bot's permission group | As the bot user |
| Workflow webhook token | EE `InteractWorkflowServiceImpl` bot user plus a `UserApiKey` of source `WORKFLOWS` | As above | None | No | Via key delete | The bot's permission group; accepted in `Authorization: Bearer` or the `api-key` query parameter (`ApiKeyConstants.APPSMITH_API_KEY_QUERY_PARAM`), which `ApiKeyAuthenticationConverter` reads on every `/api/v1` route, not only the trigger | As the bot user |
| SCIM provisioning key | EE `POST /api/v1/api-key/provision`, source `SCIM` | As above | None | No | Via key delete | The provisioning user | As that user |

Phase 1 adds two types and one rule.

- **Personal access token**, prefix `apt_` (Appsmith personal token): owned by a user, dies with the
  user, grants are a subset of the user's permissions at the time of each request.
- **Service-account token**, prefix `ast_` (Appsmith service token): owned by a service account,
  several per account, each with its own name, expiry and grants, which are a subset of the account's
  permissions at each request.
- **Rule.** A new credential is `<prefix><keyId>_<secret>`: a random 128-bit key id (never a Mongo
  ObjectId, which embeds creation time) and a server-generated 256-bit random secret; callers never
  choose either part. The server stores SHA-256 of the full presented string and looks it up by key
  id, as `McpTokenUtils` and `McpUserKeyCodec` do today; a stretching hash is unnecessary for a
  256-bit random secret and would only add CPU cost on the authentication path. The key id is the
  credential id: it is the `credentialId` in every audit record and log line, the rate-limit
  identifier, and the id in every token URL. The secret is shown once with a copy control, never
  logged (converters log method and path only, as the existing ones do), never in a URL, never in an
  export or audit payload. `UserApiKey`'s reversible encryption and the `api-key` query parameter are
  legacy behaviours that section 9 retires on a schedule; the new types never carry them.
- **Token-issuing operations** (create, rotate, and the OIDC exchange in section 10) do not accept
  `Idempotency-Key`; sending one is `400 validation_failed` (the carve-out in conventions §6). A
  replayed response would re-display a secret and keep it at rest for 24 hours. A client that loses
  the response re-issues, and the extra token is visible in the list, bounded by the caps and
  revocable. These operations still return `201` with a `Location` header naming the token's
  metadata resource (conventions §2); the secret is only in the body of that one response. A token
  can always read its own metadata resource, whatever its grants, so the `Location` is always
  usable by the caller that received it.
- **Session bootstrap.** Every public caller is a token, so the first token has to come from a
  session. Personal tokens are created, rotated and revoked from the Profile page through a
  session-authenticated internal route (`/api/v1/users/access-tokens`, new in PR 2, on the session
  chain under `CsrfConfigCE`). Service accounts and their tokens are managed from Admin Settings
  through the matching session route (`/api/v1/service-accounts`, new in PR 2). Both routes accept
  **only an authentication that originated from the session cookie**, as an allowlist of that
  authentication type, and refuse everything else: `McpTokenAuthentication`, the EE
  `ApiKeyAuthentication` that `ApiKeyAuthenticationConverter` produces for every legacy `UserApiKey`
  (bearer or `api-key` query parameter), and the anonymous principal. A denylist modelled on
  `McpTokenControllerCE.requireSessionAuthentication`, which refuses only the MCP principal, would
  let a SCIM, workflow or Git key on EE mint a fresh `apt_` for its bound user and sidestep the
  section 9 retirement; the same gap exists on the MCP token routes in EE today and is tracked
  separately. EE `CsrfConfig.isUrlExemptedFromCsrf` gains no pattern for these routes. Both share
  the service layer, DTOs, caps, expiry bounds, grant bounds and audit with the public endpoints;
  the playbook's "built only on public endpoints" is satisfied at the service layer, since a session
  cannot reach the public chain (section 7). Session issuance applies section 4 rule 1 verbatim: a
  personal token is bounded by the user's permissions, and a service-account token issued from a
  session is bounded by the issuing user's permissions intersected with the account's.

## 4. Grants

A grant is a pair `(scope, resource selector)`. A token holds a list of grants.

- Scope vocabulary, initial: `applications:read`, `applications:write`, `applications:delete`,
  `applications:publish`, `deployments:write`, `datasources:read`, `datasources:write`,
  `datasources:delete`, `secrets:write`, `pages:read`, `pages:write`, `pages:delete`, `users:read`,
  `permissions:write`, `logs:read`, `audit:read`, `operations:read`, `credentials:write`. Delete is
  separate from write at every level because its impact differs (the security requirements ask for
  that split); execute scopes are absent because no Phase 1 endpoint executes an action or a
  datasource, although section 4a notes where a write scope changes what users later execute.
- Selectors: organization (always present), then optionally workspace IDs, application IDs, datasource
  IDs, workflow IDs, environment IDs. Community and Business selectors stop at organization and
  workspace; application, datasource, workflow and environment selectors are Enterprise. A selector
  is a body-referenced resource: one that names a resource the issuing caller cannot read, in another
  organization or nowhere, is the same `404 resource_not_found` as a missing resource, never a
  distinguishable `400`.
- Edition gates on scopes and selectors: `users:read` and `permissions:write` are user-management
  scopes and can be granted only on Enterprise. `audit:read` needs Business or Enterprise.
  `deployments:write` needs Enterprise. `credentials:write` is available in every edition within its
  caps. A grant whose scope or selector the edition does not allow is `403 requires_license` at
  issuance and, after a downgrade, on every request that relies on it (section 1a).
- Issuance limits: a missing or over-maximum `expiresAt` is `400 validation_failed` with
  `details[{"field": "expiresAt"}]`; a numeric cap reached (service accounts per organization, tokens
  per account, personal tokens per user) is `403 requires_license`, because the cap is an
  entitlement; the Enterprise soft limit of 50 tokens per account is `409 conflict`, because it is an
  abuse guard, not a license line.
- **Effective access on every request** is the intersection of three sets: the token's grants, the
  principal's current permissions from the unchanged policy engine, and organization policy (the
  API access switch in section 7, the lifetime policy, the license entitlement). Grants only narrow.
  Raising the principal's permissions later never widens an existing token; removing a permission
  reduces access immediately; disabling the principal or revoking the token is `401` at once
  (section 6).
- Visibility for the anti-enumeration order in conventions §3 is computed from the token's effective
  access, never from the principal's permissions alone. An under-scoped read is `404
  resource_not_found`, byte-identical to a missing resource; an under-scoped write on a resource the
  token can read is `403 forbidden`. A resource named in the body that the token cannot read is the
  same `404`. `credentials:write` on a principal the token cannot see is the same `404`.
- Body-referenced resources are checked with the same rule as the URL: import into a workspace, move
  to a workspace, a datasource referenced by an action, a page referenced by a layout. A grant on the
  addressed resource does not carry over to a resource named in the body.
- **Issuing a token is itself authorized, by the caller, not by the principal.** The issuer can
  delegate only grants they hold at the time of issuance; over-delegation is `403 forbidden`. When
  the caller is itself a token (the public chain has no other caller), four rules apply, and the
  section 7 regression list carries one test each:
  1. The grants of any credential a token creates or rotates are bounded by the calling token's own
     effective access, further intersected with the target principal's permissions when the target
     is another principal, never by the target principal's permissions alone.
  2. The new credential's `expiresAt` cannot exceed the calling token's `expiresAt`.
  3. A federated token (section 10) can never carry `credentials:write`, so a one-hour OIDC
     credential cannot become a 90-day one.
  4. Rotation re-validates the successor's grants against the rotating caller, not against the
     predecessor.
  MCP already enforces the same floor in two layers (`McpAllowlistWebFilter` omits the token routes
  and `McpTokenControllerCE.requireSessionAuthentication` refuses an MCP principal); the public API
  cannot copy that because every caller is a token, so it bounds instead of refusing. Session
  issuance (section 3, session bootstrap) is bounded by the user's permissions, as today.
- Managing another principal's credentials needs `credentials:write` on that principal (section 4a);
  changing a principal's permission groups needs `permissions:write` (Enterprise, Phase 2b), and
  `permissions:write` never applies to the calling principal's own memberships.
- Not in scope: a general-purpose permission editor. Scopes map onto existing `AclPermission` values
  through the permission providers the internal services already use.

### 4a. Scope to permission mapping (contract)

The public layer checks permissions through the same `XxxPermission` provider methods the internal
services call (`solutions/ce/ApplicationPermissionCEImpl`, `WorkspacePermissionCEImpl`,
`PagePermissionCEImpl`, `DatasourcePermissionCEImpl`, `ActionPermissionCEImpl`, and their EE
overrides in `solutions/`). That matters because the two resolve some methods differently: the CE
providers answer the coarse `MANAGE_*` value for delete and create; the EE overrides answer the
granular one, and every EE override of a method this table names is
`@FeatureFlagged(license_gac_enabled)`, so an EE build without that flag resolves to the CE value
through `FeatureFlaggedMethodInvokerAspect`. The table
names the provider method per operation and shows both resolutions as "without / with
`license_gac_enabled`"; where no provider exists the `AclPermission` is checked directly. Composite
operations that reuse an internal service list the cascaded provider methods that service checks.
Each public operation names its scope and provider methods in its OpenAPI description. PR 4 turns
this table into a test, at the provider level, run on CE and on EE with the flag on and off, that
fails when an operation calls a provider method its scope does not list; permissions the policy
graph derives from a listed one (`PolicyGeneratorCE` derives `MANAGE_THEMES` from
`MANAGE_APPLICATIONS` and `READ_THEMES` from `READ_APPLICATIONS`) are exempt from the assertion
and named in the test. `AclPermission` values are from CE `acl/AclPermission` unless marked EE.

| Scope | Edition | Provider methods, and the permission each resolves to (without / with `license_gac_enabled` when they differ) |
|---|---|---|
| `applications:read` | All | `ApplicationPermission.getReadPermission()` = `READ_APPLICATIONS`. Workspace collection: `WorkspacePermission.getReadPermission()` = `READ_WORKSPACES`, filtered by `WORKSPACE_READ_APPLICATIONS`. Export: `ApplicationPermission.getExportPermission()` = `EXPORT_APPLICATIONS`, cascading as the internal export does today to `PagePermission`, `ActionPermission` and `DatasourcePermission.getExportPermission(false, false)`, which each resolve to the edit permission (`MANAGE_PAGES`, `MANAGE_ACTIONS`, `MANAGE_DATASOURCES`), and to `READ_THEMES` (derived); an export therefore needs edit on the children, as it does for a session user today, and the public export refuses with `403 forbidden` when any child would be filtered out rather than returning a silently partial bundle. The public export forces `exportWithConfiguration=false` on its own path and never populates `decryptedFields`, which the internal path (`exports/internal/ExportServiceCEImpl` copying the application's stored flag, `datasources/exportable/DatasourceExportableServiceCEImpl`) can emit today; the PR 4 test exports an application whose stored flag is true |
| `applications:write` | All | `ApplicationPermission.getEditPermission()` = `MANAGE_APPLICATIONS`. Create or import into a workspace: `WorkspacePermission.getApplicationCreatePermission()` = `WORKSPACE_MANAGE_APPLICATIONS` / `WORKSPACE_CREATE_APPLICATION`; import cascades through `ImportArtifactPermissionProviderCE` and `READ_THEMES` (derived). Clone, as `ApplicationPageServiceCEImpl.cloneApplication` checks today: `getEditPermission()` on the source, the create permission on the target workspace, and the cascade in `validateAllObjectsForPermissions` and `validateDatasourcesForCreatePermission`: `PagePermission.getEditPermission()` and `ActionPermission.getEditPermission()` on every page, action and collection, `DatasourcePermission.getActionCreatePermission()` = `MANAGE_DATASOURCES` / `CREATE_DATASOURCE_ACTIONS` on every referenced datasource, and `READ_THEMES` (derived); a clone is refused, not narrowed, when any cascade fails. `forkWithConfiguration` is never honoured. The public write model never carries `exportWithConfiguration`, `forkWithConfiguration`, `forkingEnabled` or `isPublic` |
| `applications:delete` | All | `ApplicationPermission.getDeletePermission()` = `MANAGE_APPLICATIONS` / `DELETE_APPLICATIONS`, cascading as `deleteApplicationResources` does today through `PagePermission.getDeletePermission()` = `MANAGE_PAGES` / `DELETE_PAGES`, `ActionPermission.getDeletePermission()` = `MANAGE_ACTIONS` / `DELETE_ACTIONS` and `MANAGE_THEMES` (derived) |
| `applications:publish` | All | `ApplicationPermission.getPublishPermission()` = `PUBLISH_APPLICATIONS` |
| `deployments:write` | Enterprise | `ApplicationPermission.getEditPermission()` = `MANAGE_APPLICATIONS`, which is what EE `CentralGitServiceImpl.autoDeployGitArtifact` checks through `getArtifactEditPermission()` today, plus `getPublishPermission()` = `PUBLISH_APPLICATIONS`, added here because the public operation publishes. Gated by `license_git_continuous_delivery_enabled` |
| `datasources:read` | All | `DatasourcePermission.getReadPermission()` = `READ_DATASOURCES`; workspace collection filtered by `WORKSPACE_READ_DATASOURCES`. Never returns the `authentication` object |
| `datasources:write` | All | `DatasourcePermission.getEditPermission()` = `MANAGE_DATASOURCES`. Create: `WorkspacePermission.getDatasourceCreatePermission()` = `WORKSPACE_MANAGE_DATASOURCES` / `WORKSPACE_CREATE_DATASOURCE`. EE environment mapping: `WORKSPACE_MANAGE_ENVIRONMENTS` (EE). Caveat, stated in the scope description: this scope can repoint a datasource's endpoint, after which the stored secret is sent to the new endpoint on the next test or execution, so it is credential-exfiltration-capable on its own; `secrets:write` is split off for auditability, not as a stronger boundary |
| `datasources:delete` | All | `DatasourcePermission.getDeletePermission()` = `MANAGE_DATASOURCES` / `DELETE_DATASOURCES` |
| `secrets:write` | All | `DatasourcePermission.getEditPermission()` = `MANAGE_DATASOURCES`. Same permission as `datasources:write`, separate scope because the operation writes only the `authentication` object |
| `pages:read` | All | `PagePermission.getReadPermission()` = `READ_PAGES`; `ActionPermission.getReadPermission()` = `READ_ACTIONS`. The public action model redacts known credential headers and never returns datasource `authentication` |
| `pages:write` | All | `PagePermission.getEditPermission()` = `MANAGE_PAGES`. Create page: `ApplicationPermission.getPageCreatePermission()` = `MANAGE_APPLICATIONS` / `APPLICATION_CREATE_PAGES`. Create action: `PagePermission.getActionCreatePermission()` = `MANAGE_PAGES` / `PAGE_CREATE_PAGE_ACTIONS` and `DatasourcePermission.getActionCreatePermission()` = `MANAGE_DATASOURCES` / `CREATE_DATASOURCE_ACTIONS`. Edit action: `ActionPermission.getEditPermission()` = `MANAGE_ACTIONS`. Caveat, stated in the scope description: it rewrites query and JS bodies that application users then execute |
| `pages:delete` | All | `PagePermission.getDeletePermission()` = `MANAGE_PAGES` / `DELETE_PAGES`; `ApplicationPermission.getApplicationDeletePagesPermission()` = `APPLICATION_DELETE_PAGES`; `ActionPermission.getDeletePermission()` = `MANAGE_ACTIONS` / `DELETE_ACTIONS` |
| `users:read` | Enterprise | Checked directly: `READ_USERS`, `READ_PERMISSION_GROUP_MEMBERS`; organization-wide `ORGANIZATION_READ_ALL_USERS`, `ORGANIZATION_READ_USER_GROUPS` (EE). Phase 2b defines the operations |
| `permissions:write` | Enterprise | Checked directly: `ASSIGN_PERMISSION_GROUPS`, `UNASSIGN_PERMISSION_GROUPS`, `MANAGE_PERMISSION_GROUPS`; organization-wide `ORGANIZATION_MANAGE_ALL_USERS`, `ORGANIZATION_MANAGE_USER_GROUPS` (EE). Never on the caller's own memberships. The deprecated `READ_PERMISSION_GROUPS` and `WORKSPACE_INVITE_USERS` are not used |
| `logs:read` | All | `ApplicationPermission.getReadPermission()` = `READ_APPLICATIONS`. **Proposed** (Phase 3 lead; section 12, row 8): Phase 3 confirms or tightens this when it defines the diagnostic reads, including whether logs can carry query results |
| `audit:read` | Business, Enterprise | Checked directly: `READ_ORGANIZATION_AUDIT_LOGS` (EE), gated by `license_audit_logs_enabled` |
| `operations:read` | All | The permission the operation itself required, re-evaluated at poll time (conventions §8); no separate permission |
| `credentials:write` | All | On the caller's own tokens: the section 4 token-caller rules. On a service account: `READ_SERVICE_ACCOUNTS` and `MANAGE_SERVICE_ACCOUNTS` on the `ServiceAccount` domain, granted to the administrator role (instance administrator on Community, organization administrator on EE) and to the account's owner. On another user's personal tokens: `MANAGE_USER_CREDENTIALS` on the `User` domain, granted to each user on their own record and to the administrator role, and permitting list and revoke only, never create or rotate. All three are new `AclPermission` values in PR 2 with edges in `PolicyGeneratorCE` (and the EE `PolicyGenerator` override for the organization administrator role); `MANAGE_USER_CREDENTIALS` also needs a migration that backfills the policy onto every existing `User` document (precedent: the per-user group in `UserServiceHelperCEImpl`), or administrators cannot revoke existing users' tokens, so PR 2 seats the data-migration reviewer. `MANAGE_USERS` is deliberately not reused: it is already wired in `PolicyGeneratorCE` with lateral edges to `READ_USERS` and `RESET_PASSWORD_USERS`, every user holds it on their own record (`helpers/ce/UserServiceHelperCEImpl`), and EE moves it from a SCIM-provisioned user to the provisioning role, so reusing it would hand the SCIM key control of personal tokens and hand administrators password reset on every user |

Enum placement: the three new values go between `MANAGE_DEFAULT_BRANCHES` and `MANAGE_AUTO_COMMIT`,
a region that is identical in both repositories; the end of the CE enum is exactly where EE inserts
its own block, so appending there would conflict in every sync.

Permissions that no scope grants in Phase 1: `EXECUTE_ACTIONS`, `EXECUTE_DATASOURCES`,
`MAKE_PUBLIC_APPLICATIONS`, `COMMENT_ON_APPLICATIONS`, `CONNECT_TO_GIT`,
`MANAGE_PROTECTED_BRANCHES`, `MANAGE_DEFAULT_BRANCHES`, `MANAGE_AUTO_COMMIT`,
`MANAGE_INSTANCE_CONFIGURATION`, `MANAGE_ORGANIZATION`, `MANAGE_USERS`, and the workspace package
and workflow permissions (EE). `MANAGE_THEMES` and `READ_THEMES` are reached only as derived
permissions of the rows above. A later phase that needs one adds a scope to this table in a
reviewed PR; an operation never calls a provider method its scope does not list.

## 5. Organizations and routing

Account scope comes in three forms:

- **Single organization**: every edition, within its service-account cap.
- **Several named organizations**: Enterprise, gated by `license_multi_org_enabled` (EE
  `FeatureFlagEnum`, in `appsmith-interfaces`).
- **Instance-wide**: Enterprise, self-hosted only (multi-tenant cloud has no customer-facing instance
  administrator), same gate, and only a member of the instance administrator role
  (`FieldNameCE.INSTANCE_ADMIN_ROLE`) can issue it.

EE resolves the request organization from the host: `filters/OrganizationContextFilter` reads the
host that `filters/HostUrlFilter` put in the context, extracts the subdomain and maps it to an
organization id. The public API keeps one documented base URL per installation and resolves the
organization **from the addressed resource** (conventions §9). Then three values must agree: the
host-derived organization, the organization selected in the path (when the route has one) and the
organization that owns the resource. Any disagreement is the same `404 resource_not_found` as a
missing resource. A caller-supplied organization never widens authorization; it only selects a
collection.

The host predicate is defence in depth, never the boundary. `helpers/ce/HostUrlHelperCE` reads the
`Forwarded` and `X-Forwarded-Host` headers. The shipped Caddy configuration
(`deploy/docker/fs/opt/appsmith/caddy-reconfigure.mjs`) strips `Forwarded` and honours forwarded
headers only from `APPSMITH_TRUSTED_PROXIES`, but Caddy's `reverse_proxy` default sets
`X-Forwarded-Host` from the client-supplied `Host` on the catch-all site, so the host predicate is
caller-influenced even with the shipped proxy, and more so behind a different one. The path and
owner predicates are what bind.
The PR 4 tests cover a spoofed host with a correct path and owner.

Cross-organization listing (`GET /organizations` returning more than one row) is Enterprise and
available only to a several-organization or instance-wide account. Until the cloud routing question
below is answered, this is the only route that spans organizations.

**Proposed** (Platform and Cloud leads; gates PR 4): whether the cloud front door can route a single
base URL to the right organization backend for a globally addressed resource, or whether the
contract must be "one base URL per organization". Self-hosted installations are unaffected either
way; the routing layer in PR 4 is written so that the host check is one predicate that either form
satisfies.

## 6. Lifecycle

- **Expiry is mandatory.** No non-expiring credential is ever issued, including for webhooks; the
  persistence that appsmith#35061 asks for comes from rotation with overlap, not from immortality.
  **Proposed** numbers (Security lead; gates PR 2): default 90 days; Community and Business 90-day
  maximum; Enterprise organization-configurable maximum up to a hard ceiling of 365 days, which is the
  ceiling MCP tokens already have.
- **Rotation.** Issue the successor, keep the predecessor valid for a bounded overlap, then retire
  it. The owner is notified at issuance and at retirement. Nothing rotates silently. **Proposed**
  (Security lead; gates PR 2): overlap default 24 hours, maximum 7 days. MCP rotation today is
  immediate (one Mongo transaction; the old secret stops working at commit); the overlap is new and
  is the reason the Community cap is 2 tokens per service account. Rotation follows the section 4
  token-caller rules.
- **Revocation.** Per token, per account (all tokens), and per principal on disable, delete or
  deprovision. **Proposed** propagation target (Security lead; gates PR 2): at most 60 seconds across
  replicas. The mechanism is the `McpTokenCache` shape, one Redis entry per key id holding the hash
  and expiry, overwritten on rotate and deleted on revoke, with two changes PR 2 must make rather than
  copy the class verbatim: the Redis TTL is capped at the propagation target regardless of the
  token's expiry, so Mongo is authoritative at least once per window by construction; and revoke and
  rotate fail with a retryable `503` (conventions §3 and §6) when the eviction fails, instead of
  swallowing the error as `McpTokenCache.evict` does. Order of operations, since a Redis eviction
  cannot sit inside a Mongo transaction: evict first, then commit the Mongo transaction (key, token
  and status together, which MCP's `revoke` does not do today), then repopulate the cache after
  commit, as `McpTokenServiceCEImpl.rotateInStore` already does for rotation. A concurrent
  authentication between the evict and the commit can read the still-valid Mongo row and repopulate
  the old entry; that entry lives at most until the capped TTL, which is why the cap is load-bearing
  and why the single-context test is deterministic only single-threaded. The invariant a caller
  relies on: a `503` from create, rotate or revoke means no persisted state changed, so the retry is
  safe and cannot mint a stray successor or hit a cap. A failure of the post-commit repopulate is
  logged and the `2xx` is still returned, because the next read falls through to Mongo. A cache
  miss or a Redis error on the read path
  falls through to the authoritative Mongo read; there is no in-memory fallback store.
- **Last use.** Timestamp and source IP recorded per token for the UI, the credentials overview and
  cleanup. **Proposed** (Security lead; gates PR 2): coarsened to once per minute.
- **Expired tokens** are `401 unauthenticated` (conventions §3). **Proposed** (Security lead; gates
  PR 2): purged from the store 30 days after expiry so the audit trail can still resolve the
  credential id.
- **Tests.** Time-dependent behaviour (expiry, overlap, last-use coarsening) is tested through an
  injectable `Clock`, never by sleeping. Revocation propagation is tested in one application context
  by revoking, asserting the Redis key is gone, and asserting the next authentication reads Mongo and
  answers `401`; a two-replica test is a CI follow-up, not a gate.

## 7. Enforcement

- `/api/public/**` is served by its own stateless `SecurityWebFilterChain` in a new CE-owned
  configuration class, laid out like `CsrfConfigCE` and `CsrfConfig` (an unannotated CE base plus a
  CE subclass that EE overrides; `CsrfConfig` carries `@Component`): an unannotated
  `configurations/ce/PublicApiSecurityConfigCE` plus a CE `configurations/PublicApiSecurityConfig`
  carrying `@Configuration`, because it declares a bean (all new in PR 4). It is not added to
  `configurations/SecurityConfig`, a fully diverged CE/EE file where a hand-merge can silently drop
  a filter. The chain carries an explicit `@Order` between the actuator
  chain (`SecurityConfig.internalWebFilterChain`, highest precedence) and the session chain, and a
  `securityMatcher` on the base path. On it: bearer credentials in `Authorization` only; cookies
  ignored, which means `NoOpServerSecurityContextRepository` and the request cache disabled so the
  session cookie is never loaded; `httpBasic`, `formLogin`, OAuth2 login and the anonymous principal
  disabled; excluded from `configurations/ce/CsrfConfigCE` by matcher (no cookie session can reach
  it; nothing is added to `isUrlExemptedFromCsrf`); CORS denied, observable as a preflight `OPTIONS`
  with an `Origin` answering `403` without `Access-Control-Allow-Origin` and simple responses carrying
  no CORS headers; `Cache-Control: no-store` (conventions §2 and §10). `SecurityConfig` has no rule
  for the path today, so it falls to `authenticated()` on the session chain until PR 4 registers the
  new chain.
- **The internal `/api/v1` chain never authenticates `apt_` or `ast_`, and actively rejects them.**
  Passive declining is not enough: in CE an unclaimed bearer is ignored and a session cookie on the
  same request still authenticates, and EE `ApiKeyAuthenticationConverter` resolves an undecryptable
  bearer to the anonymous user. PR 4 adds a CE-owned `WebFilter` bean that answers `401
  unauthenticated` to any `Authorization: Bearer apt_…` or `ast_…` on the session chain before any
  other authentication runs, cookie or not; each repository's `SecurityConfig` registers it in one
  line, so the diverged file changes minimally on both sides. A public credential never becomes a
  session; a session never authenticates the public path.
- **One converter per prefix.** `mcp_` stays with `authentication/converters/McpTokenAuthenticationConverter`,
  which additionally requires the loopback marker `X-Appsmith-Mcp-Internal`. EE
  `ApiKeyAuthenticationConverter` already declines `mcp_` by prefix and will decline `apt_` and
  `ast_` the same way. A new converter (`PlatformTokenAuthenticationConverter`, new in PR 4) accepts
  `apt_` and `ast_` on the public chain and nothing else; the OIDC exchange route (section 10) has its
  own converter for provider JWTs, and a JWT presented to any other public route is `401`.
- **API access switch.** An organization setting, on by default on fresh installs and upgrades,
  that an organization administrator (or the instance administrator on Community) can turn off. Off
  blocks issuance and answers `403 forbidden` with a fixed message. It is evaluated at
  authentication against the credential's own organization(s), before any resource lookup, so it can
  never act as an existence oracle; for a several-organization or instance-wide account it is
  evaluated against the resolved organization only after the visibility check has passed. The OIDC
  exchange follows the same switch. It is the operator's kill switch and the
  rollback story for PRs 2 to 6. PR 4 adds the setting and the check, PR 5 the control; the
  per-organization form is Enterprise, other editions have one switch for the instance. **Proposed**
  (API lead; section 12, row 9): a dedicated error code instead of `forbidden`, which needs a
  reviewed change to conventions §3.
- **Rate limits** are per credential through `ratelimiting/ce/RateLimitServiceCEImpl.tryIncreaseCounter`
  with the key id as the identifier and a public-API bucket in `ratelimiting/RateLimitConfig`. Three
  changes from the MCP limiter: public buckets expire after their refill window instead of the
  ten-year TTL `RateLimitConfig` sets today, so caller-controlled identifiers cannot grow the key
  space; the per-credential bucket is created only after the credential validates; failed
  authentications count against a bucket keyed on both the trusted client IP and the presented key
  id, which throttles each source without letting one source lock a key out. The client IP is the
  one Caddy forwards from `APPSMITH_TRUSTED_PROXIES` and Spring's `ForwardedHeaderTransformer`
  applies; a deployment
  behind a different front proxy must set that variable or the per-IP bucket keys on the proxy. On a
  limiter error the public path fails closed with `503` and logs at error level, unlike
  `McpTokenAuthenticationManager`, which fails open. **Proposed** per-token defaults (Product,
  Sales and Security; section 12, row 1): 60/min on Community and Business (Business burst 120, with
  a 300/min organization ceiling on cloud), 600/min on Enterprise; self-hosted administrators can
  adjust. The limit is stamped on the credential at issuance (section 1a). No call quotas in any
  edition.
- **Caps** (service accounts per organization, tokens per account, maximum lifetime) are read from
  the entitlement and enforced at issuance, never per request, with the statuses in section 4.
- **Unsupported routes.** Anything outside `/api/public` rejects platform credentials. The MCP
  allowlist is untouched; whether MCP accepts `ast_` tokens is a Phase 5 decision.
- **Tests.** Every guard has a regression test modelled on `AuthGuardTest` with a blocked case and a
  still-works case: session cookie on the public path; `apt_` on `/api/v1` with and without a valid
  session cookie; on the session bootstrap routes (section 3): an `mcp_` principal, an EE
  `UserApiKey` of each `ApiKeySource` as bearer and as `api-key` query parameter, and the anonymous
  principal, each `401`; CSRF on those routes stated precisely, because `CsrfConfigCE` exempts JSON
  bodies and requests carrying `X-Appsmith-Version` by design: a form-encodable `POST` without the
  XSRF token is `403`, the same with the token passes the CSRF check (the controller may still
  reject the body), and a JSON `POST` from a foreign `Origin` receives no
  `Access-Control-Allow-Origin`; `mcp_` on the public path; a provider JWT on a
  non-exchange route; expired; revoked; under-scoped read (`404`, byte-identical to a missing id)
  and under-scoped write (`403`);
  wrong organization; spoofed host with correct path and owner; body-referenced resource; the four
  token-caller rules from section 4 (wider grants, longer expiry, `credentials:write` on a federated
  token, rotation by a narrower caller); the API access switch off; cap reached and over-maximum
  expiry; and the check order from conventions §3 for a globally addressed resource, a collection
  route and a cross-organization request.

## 8. Audit and attribution

- Every public call carries `principalType` (`user` or `serviceAccount`), `principalId`,
  `credentialId` (the key id), `organizationId`, the route's OpenAPI `operationId`, the long-running
  operation id when one is involved, `requestId`, source IP, user agent, and outcome (status and error
  `code`). In EE `services/AuditLogServiceImpl` writes the audit log entry; in CE the same fields go
  to one structured server log line under the request id that `filters/MDCFilter` already places in
  the MDC (`REQUEST_ID_HEADER`). PR 4 also extends `MDCFilter` to generate and echo `X-Request-Id`
  as conventions §2 requires. The attribution filter awaits the write in the reactive chain before
  the response is committed (it never fires and forgets), so a client abort cannot suppress it.
- Authentication failures and `429` responses on the public path are recorded before any principal
  exists: key id (never the secret), trusted client IP, and a reason class. Brute-force detection
  needs them.
- Token events are audit events: create, rotate, revoke, expire, first use after rotation, and
  service-account create, disable, enable, delete and ownership transfer. Each records the actor
  separately from the owner, and issuance records the grant snapshot and `expiresAt`. They are new
  values in EE `constants/AuditLogEvents` beside the existing `USER_*` events, and the audit UI gains
  a service-account filter (Business and Enterprise). Secrets never appear in any record.
- OIDC exchanges add the provider, trust policy id, repository, workflow, run id, `sub` and `jti`
  (section 10).

## 9. Existing credentials: adapters first, replacement later

1. **Inventory (PR 3, CE and EE).** A read model that lists every machine credential regardless of
   origin (MCP tokens from `repositories/McpKeyRepository`; in EE, `UserApiKey` rows by
   `ApiKeySource`, which covers the Git deploy keys, workflow webhook keys and the SCIM key) with
   owner, type, organizations, expiry (or "none"), and last use. Adapters read the existing stores;
   nothing is migrated, rewritten or rotated. `UserApiKey` has no last-use field (only `metadata`),
   so its column reads "unknown" until PR 3 adds tracking on the authentication path.
2. **Interim exposure cut (PR 3, EE).** The `api-key` query parameter is accepted on every `/api/v1`
   route today. PR 3 restricts it by matcher to the workflow trigger route, the only documented user,
   ahead of the scheduled retirement; nothing else changes.
3. **Replacement (opt-in).** For each type, a documented path to a service-account token with
   equivalent grants, run in parallel with the old credential until the owner retires it.
4. **Retirement (scheduled, EE, later than Phase 1).** The `api-key` query parameter and
   non-expiring `UserApiKey`s get a published deprecation date with owner notification and a rollback
   switch. Nothing is rotated silently and no existing secret needs to be recoverable at any point.
   The date is bounded, not open-ended, because every legacy key is recoverable from the instance
   encryption secret for as long as it exists (section 3).
5. **Bots (EE, with step 4).** The Git and Workflow bot users are re-pointed at service accounts with
   the same permission groups; their existing `UserApiKey`s stay valid through step 4.

Impact on existing instances: fresh install, upgrade from default and upgrade from a customized
instance see no change to any existing credential before step 2, and steps 2 and 4 each ship with
their own "Impact on existing instances" section and rollback.

## 10. Workload identity federation (OIDC), GitHub Actions first

Enterprise, gated by a new license flag (`license_workload_identity_enabled`, new in PR 4, in EE
`FeatureFlagEnum`). On Community and Business the route exists and answers `403 requires_license`
before any JWT is parsed; on an air-gapped Enterprise instance (`license_airgapped_flag`) it does
the same. That is the carve-out in conventions §3 (`401` before `403 requires_license` everywhere
else): the route addresses no resource, so answering `requires_license` first reveals nothing but
the edition, which is accepted; the per-IP `429` still precedes it. Unreachable keys never mean
"validate without keys". Scoped, expiring tokens remain available everywhere.

- **Trust policy** (per organization, administered by an organization administrator): the provider,
  chosen from a fixed list (`github-actions` only in Phase 1), which fixes the issuer
  `https://token.actions.githubusercontent.com` and the JWKS URL in server code, never in
  administrator input and never derived from the token's `iss` or a discovery document; the
  audience, which is installation-specific and never the provider's default (the repository owner
  URL); the allowed repository by GitHub's immutable `repository_id` and `repository_owner_id`, with
  the names recorded for display only, so a renamed or transferred repository cannot reuse a policy;
  optional `ref`, `environment`, `event_name` and `job_workflow_ref` claims, so a `pull_request_target`
  or fork run cannot satisfy a policy meant for `main`; the mapped service account; explicit grants
  that are a subset of that account's permissions and never include `credentials:write` (section 4);
  and a maximum token lifetime. **Proposed** (Security lead; section 12, row 4): lifetime at most one
  hour.
- **Exchange:** `POST /api/public/v1/auth/exchange` with body `{"provider": "github-actions",
  "token": "<jwt>"}` returns `201` with a `Location` naming the issued token's metadata resource and
  `{"token": "ast_...", "expiresAt": "...", "serviceAccountId": "...", "grants": [...]}`. The route
  is on the public chain, is subject to the API access switch, has its own converter that accepts
  only a provider JWT, does not accept `Idempotency-Key` (section 3), and is rate-limited per trusted
  client IP because it is unauthenticated. Validation, all of it before any lookup: `alg` in an
  allowlist (`RS256`; `none` and HMAC rejected), `kid` present, signature against the pinned JWKS,
  `iss`, `aud`, `exp`, `nbf`, `iat` with a maximum token age and a stated clock-skew tolerance, `sub`
  matching the policy, `jti` unused within the JWT's validity window (replay protection, in a Redis
  set whose entries expire with the JWT), and every claim the policy requires. Any mismatch is
  `401 unauthenticated` with no detail about which check failed. Trust in the provider alone never
  grants access; the issued token carries the policy's
  grants and nothing more, and is revocable like any other `ast_` token.
- **JWKS handling:** fetched over verified TLS from the pinned URL, response size bounded, cached
  with a minimum interval between refetches that an unknown `kid` cannot shorten (random `kid`s must
  not cause a fetch per request), and previous keys retained for at least the maximum token lifetime.
- **Disablement:** disabling a policy revokes every token issued under it, through the section 6
  path, rather than letting them run out their lifetime; revoking or disabling the mapped service
  account does the same.
- **Audit:** each exchange records provider, trust policy id, repository id and name, workflow, run
  id, `sub`, `jti` and the resulting credential id (section 8).
- **Acceptance tests (first provider):** an approved repository, workflow and audience obtain a token
  that can manage only the permitted applications in the mapped workspace; a token from an unapproved
  repository, a renamed repository with a reused name, a wrong audience, a wrong `alg`, an expired
  JWT, a replayed `jti`, an unknown key id and a tampered signature are each rejected with the same
  `401`; a valid JWT on a non-exchange route is `401`; a valid JWT on Community is `403
  requires_license`; a disabled policy stops new exchanges immediately and its issued tokens are
  `401` within the section 6 target; a policy that names `credentials:write` is rejected at save.
- **Delivery scope:** GitHub Actions only. GitLab and Azure DevOps follow customer validation.

## 11. OAuth client credentials: evaluated, deferred

- What it would add over `ast_` tokens: standard client libraries, and short-lived access tokens
  derived from a long-lived client secret.
- What it would cost: an authorization-server component, client registration and management, and
  secret rotation for the client secret, which is the same lifecycle problem moved one level up.
- **Decision:** not in Phase 1. Issuance stays pluggable: opaque tokens now, OIDC exchange in this
  phase, OAuth client credentials only if an enterprise CI integration cannot use either. The Security
  lead confirms or reopens this at the end of Phase 1 (section 12).
- Delegated-user OAuth (authorization code with PKCE) is a separate product decision and is out of
  scope for this roadmap.

## 12. Decisions still needed

| | Decision | Options | Owner | Gates |
|---|---|---|---|---|
| 1 | Ratify the edition split (section 1) and the numbers, rate limits, Community token count and workflow-selector edition in section 1a | A as three editions (this document's decision), or B | Product, Sales, Security | PR 2 |
| 2 | Numeric license entitlements, and the edition of `SELF_SERVE`, `BUSINESS_AI` and an expired license | The license payload carries counts and limits, or the server derives caps from `LicensePlan` in a table | Licensing and Identity leads | PR 6 (PR 2 uses the injectable source) |
| 3 | Single base URL or per-organization URL in cloud (section 5) | Route by resource, or one URL per organization | Platform and Cloud leads | PR 4 |
| 4 | Lifetimes, overlap, propagation target, last-use coarsening, expired-token retention, OIDC lifetime (sections 6 and 10) | 90-day maximum below Enterprise, Enterprise policy up to 365 days, overlap 24 hours to 7 days, 60 seconds, once per minute, 30 days, one hour | Security lead | PR 2 (PR 4 for the OIDC lifetime) |
| 5 | Retirement date for the `api-key` query parameter and non-expiring `UserApiKey`s (section 9) | Schedule | Identity lead | Section 9 step 4 |
| 6 | OAuth client credentials (section 11) | Defer, or build | Security lead | End of Phase 1 |
| 7 | Whether MCP accepts `ast_` tokens | Yes or no | MCP and API leads | Phase 5 |
| 8 | `logs:read` permission mapping (section 4a) | `READ_APPLICATIONS`, or a dedicated permission | Phase 3 lead | Phase 3 |
| 9 | Error code when the API access switch is off (section 7), and the six-month `Sunset` minimum that conventions §1 defers to Phase 1 | `forbidden`, or a new code by reviewed change to conventions §3; confirm or amend six months | API lead, Product | PR 4; end of Phase 1 |

Row 1 is also the gate for this document: the PR that adds it stays a draft until the
edition-boundary decision is recorded in the roadmap's "Decisions needed" table.

## 13. Delivery map

| Phase 1 PR | Repository | Implements | Tests it must add |
|---|---|---|---|
| PR 2, service accounts and tokens | CE, plus an EE follow-up in the same milestone (organization administrator edges in the EE `PolicyGenerator`, the SCIM deprovision call into the CE hook, and the test that `ApiKeyAuthentication` is refused on the bootstrap routes, since that type exists only in EE) | Sections 2, 3 (including the session bootstrap routes), 4 (issuance and token-caller rules), 6; the `ServiceAccount` domain, `READ_SERVICE_ACCOUNTS`, `MANAGE_SERVICE_ACCOUNTS` and `MANAGE_USER_CREDENTIALS` with their `PolicyGeneratorCE` edges and the `User` policy backfill migration (data-migration reviewer seated), `apt_` and `ast_` issuance, hashed storage, the revocation cache with capped TTL and evict-before-commit, caps at issuance against the injectable entitlement source seeded with the Community column, the owner-removal hook | Issuance statuses (section 4), the four token-caller rules, ownership transfer revocation, expiry and overlap through an injectable `Clock`, single-context revocation propagation, eviction failure surfaces as `503` with no state change, token principal refused on the bootstrap routes |
| PR 3, central credential administration | CE and EE | Section 9 steps 1 and 2; the inventory read model, the credentials overview, the `api-key` query-parameter matcher | Inventory lists every source; `api-key` accepted on the trigger route and rejected elsewhere |
| PR 4, public API routing layer | CE, plus EE for `license_workload_identity_enabled`, the audit events, the `PublicApiSecurityConfig` override, the one-line filter registration in EE `SecurityConfig` and `ApiKeyAuthenticationConverter` declining the new prefixes | Sections 5, 7, 8, 10; `PublicApiSecurityConfigCE` and `PublicApiSecurityConfig`, `PlatformTokenAuthenticationConverter`, the session-chain rejection filter, the API access switch, rate limits, attribution, `MDCFilter` request-id generation, the OIDC exchange, and two proof endpoints (organizations visible to the caller, applications in an organization) | The section 4a provider-level mapping test on CE and on EE with `license_gac_enabled` on and off, the full section 7 regression list, the section 10 acceptance tests, the conventions §3 check-order tests |
| PR 5, management UI | CE (EE-only controls disabled with the license message) | The screens listed in the Phase 1 playbook, built on the session bootstrap routes that share the service layer with the public endpoints (section 3); the API access switch control | Cypress specs for create, rotate and revoke that fail without the feature |
| PR 6, edition entitlements | CE and EE | Section 1a numbers, the license-derived entitlement source, downgrade behaviour | Per-edition tests for every `LicensePlan` value, an expired license and the CE build; downgrade of caps, gated scopes, selectors and account forms |
| Later, EE | EE | Section 9 steps 4 and 5 | Retirement switch and rollback |

PR 2 waits on the A-or-B choice in section 12 row 1 but not on its numbers: the mechanism is the
same whatever the numbers, and the injectable entitlement source is replaced in PR 6.

How Phase 1 knows it worked, measured from the PR 3 inventory and the section 8 records: the count
of active `ast_` tokens against legacy `UserApiKey`s over time; the share of Git deploy and workflow
calls attributed to service accounts; the share of federated against stored-secret CI calls; and the
elapsed time from the retirement date to the last `api-key` query-parameter use.
