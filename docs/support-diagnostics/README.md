# Support diagnostics

An instance administrator opens **Admin Settings → Support**, reviews what the instance reports about itself, and downloads a ZIP to attach to a support ticket. Nothing is sent to Appsmith. The same page, section list, and ZIP format ship in CE and EE.

## 30-second overview

- **Access:** super users only (`UserUtils.isCurrentUserSuperUser` on the server, `shouldRegisterSupport` on the client). Workspace administrators do not qualify. When multi-org is on, the page is hidden and all three endpoints reject the request (`AppsmithError.UNSUPPORTED_OPERATION`). Hiding the page is not the control. The server check is.
- **Content:** counts and values from fixed lists that Appsmith defines. The report never holds a secret, a customer-typed name, a user or host identifier, or a log line. The instance URL and instance ID are the only exceptions.
- **Collection:** one request per section. The server runs a collector, checks the result, and keeps it in Redis for 1 hour, one entry per organization and section. Only sections with status `OK` are kept. A failed, timed-out, or unlicensed section is collected again the next time the page opens.
- **ZIP:** built in the browser. The server has no export endpoint. The password for an encrypted ZIP never leaves the browser. See [zip-contract.md](zip-contract.md).
- **No feature flag.** Rollback is a revert.

## Sections

`DiagnosticsSectionId` on the server and `SectionId` on the client list the same nine sections.

| Section ID      | File in the ZIP      | Reports                                                                    |
| --------------- | -------------------- | -------------------------------------------------------------------------- |
| `INSTANCE`      | `instance.json`      | Edition, version, build, instance ID, uptime, runtime, configured public URL |
| `DEPLOYMENT`    | `deployment.json`    | Deployment tool, cloud provider, limits. Each value says where it came from |
| `FEATURE_FLAGS` | `feature-flags.json` | Effective value of every flag in `FeatureFlagEnum`                         |
| `APPLICATIONS`  | `applications.json`  | Counts of workspaces, applications, pages, widgets by type, actions, JS objects |
| `DATASOURCES`   | `datasources.json`   | Per plugin: configured count and referenced count                          |
| `WORKFLOWS`     | `workflows.json`     | CE: `NOT_SUPPORTED`. EE: counts, engine state, migration state, reachability |
| `IDENTITY`      | `identity.json`      | Login methods, user count. EE adds SSO type, SCIM state, groups, roles     |
| `AI_MCP`        | `ai-mcp.json`        | AI assistant, AI datasources, and AI agents, reported separately           |
| `HEALTH`        | `health.json`        | Mongo, Redis, and RTS reachability. EE adds license tier and status        |

A section that has no collector in the running edition lists as `NOT_SUPPORTED`. A collector whose license check fails lists as `NOT_LICENSED`.

Status values are `OK`, `NOT_SUPPORTED`, `NOT_LICENSED`, `UNAVAILABLE`, `UNKNOWN`, and `NOT_COLLECTED` (`DiagnosticsStatus`). Unknown stays unknown: a value is never reported as zero or one when the server could not read it.

## API

All three endpoints are under `/api/v1/admin/support/diagnostics` (`Url.SUPPORT_DIAGNOSTICS_URL`, handled by `SupportDiagnosticsControllerCE`).

| Endpoint                          | Purpose                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| `GET /sections`                   | Lists every section with its kept result, or `NOT_COLLECTED`, and the collector version       |
| `POST /sections/{sectionId}/collect` | Runs one collector with a 10-second timeout, keeps an `OK` result, and returns the result  |
| `POST /downloads`                 | Records that the client built a download (`sectionIds`, `encrypted`)                          |

A collect request for a section that is already running for the same organization returns 429. A collector that fails or times out returns a section with status `UNAVAILABLE` and an `errorCode` (`collector_failed`, `timeout`, `license_unknown`, or a redaction guard code).

On the wire, the server writes `collectedAt` as epoch seconds (a decimal number) and leaves out null fields such as `errorCode`. The client passes every list and collect result through `normalizeSectionResult` in `types.ts`, which turns `collectedAt` into an ISO 8601 string and sets a missing `data` or `errorCode` to `null`.

## Redaction guard

`SupportDiagnosticsServiceCEImpl` passes every collector result through `DiagnosticsRedactionGuard` before it is returned or kept. Each collector declares a `DiagnosticsSchema`. The guard rejects a result when:

- it has a key the schema does not declare (`key_not_allowed`),
- a value does not match its declared kind, such as a count, boolean, category from a fixed list, version, date, or instance ID (`value_not_allowed`),
- the serialized section is over 100 KB (`section_too_large`).

A rejected section is returned as `UNAVAILABLE` with that code. A widget type or plugin outside the known list is counted under `other`, and its raw name is never exported. Tests seed secrets and names and assert that none appear in any section result.

## Audit event (EE only)

`SupportDiagnosticsServiceImpl` (EE) writes a `support_diagnostics.exported` audit-log entry from `recordDownload`. CE logs the request at INFO and writes no audit entry.

The entry records the download the client reports. The browser builds the ZIP and then calls `POST /downloads`, so the entry is client-attested:

- A caller can fetch section results and never call `/downloads`. No entry is written.
- A caller can call `/downloads` without building a ZIP. An entry is written.

The entry is not a record of data access and not a security control. If the audit write fails, the download still completes and the server logs a warning.

## Which file to read for which task

| Task                                                  | Read                                                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Change the ZIP layout, file names, or manifest        | [zip-contract.md](zip-contract.md), then `buildReport.ts`                              |
| Change or explain encryption                          | [zip-contract.md](zip-contract.md), then `zipReport.ts`                                |
| Add a field to a section                              | The collector in `app/server/.../diagnostics/collectors/` and its `DiagnosticsSchema`   |
| Add a section                                         | `DiagnosticsSectionId`, a `DiagnosticsCollector`, then `SectionId`, `SECTION_IDS`, and `SECTION_FILE_NAMES` in `types.ts` (the page ignores any section ID missing from `SECTION_IDS`) |
| Debug "result missing" or "section not refreshing"    | `DiagnosticsResultStore` (keys `support_diagnostics:<orgId>:<SECTION>`, 1-hour TTL)    |
| Debug a section stuck at `UNAVAILABLE`                | `SupportDiagnosticsServiceCEImpl.runCollector` and `DiagnosticsRedactionGuard`         |
| Change who can open the page                          | `shouldRegisterSupport` in `ce/pages/AdminSettings/config/support.ts` and `checkAccessAndGetOrganizationId` on the server |
| Change page state, retries, or request concurrency    | `useDiagnosticsSections.ts` (at most `MAX_PARALLEL_COLLECTS` requests at a time)       |
| Change how values display                             | `formatValue.ts` and `SectionCard.tsx`                                                 |
| Change the password rule or download panel            | `zipReport.ts` (`isValidPassword`), `DownloadPanel.tsx`, and the `SUPPORT_DIAGNOSTICS` messages |
| Change the audit event                                | `SupportDiagnosticsServiceImpl` and `AuditLogEvents` (EE)                              |

Client files are in `app/client/src/ce/pages/AdminSettings/SupportDiagnostics/`. The API client is `app/client/src/ce/api/SupportDiagnosticsApi.ts`. Server files are in `app/server/appsmith-server/src/main/java/com/appsmith/server/diagnostics/`.

## Limits and retention

| Limit                          | Value                                                                  |
| ------------------------------ | ---------------------------------------------------------------------- |
| Collector timeout              | 10 seconds (`SupportDiagnosticsServiceCE.COLLECT_TIMEOUT`)             |
| Kept result                    | 1 hour in Redis (`DiagnosticsResultStore.RESULT_TTL`)                  |
| Collect lock                   | 30 seconds per organization and section                                |
| Size of one section (server)   | 100 KB (`DiagnosticsRedactionGuard.MAX_SECTION_BYTES`)                 |
| Size of the whole report (browser) | 1 MB of UTF-8 text (`MAX_REPORT_BYTES`). The browser refuses to build a larger ZIP |
| Password length                | 12 to 128 characters, counted as code points                           |

Redis outages never fail a request. A read comes back empty, a write is skipped, and the section is collected again on the next open. The ZIP and the password are never stored.
