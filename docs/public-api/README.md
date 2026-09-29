# Public platform API

Knowledge base for the supported, versioned platform API described in the Notion roadmap
"Making Appsmith More Programmable: Platform Gaps and API Roadmap" and its Implementation Playbook.

| Document | Use it for |
|---|---|
| [conventions.md](conventions.md) | The contract every public endpoint follows: base path, versioning, errors, pagination, rate limits, idempotency, side effects, long-running operations, organization and branch addressing, authentication and audit. Adopted in Phase 0 (APP-16030). |

Later phases add their own documents here (identity, releases, hosted logic) without changing the
conventions except through a reviewed PR to that file.

## The OpenAPI document

The server's HTTP API is described by an OpenAPI 3 document generated from the Spring controllers
by springdoc. It is produced by the default server test run, not by a running instance:

- `OpenApiDocumentGenerationTest` (in `appsmith-server`, under `configurations`) boots the real
  application context with springdoc enabled for the test context only, fetches `/v3/docs` as an
  authenticated user, checks the shape, and writes
  `app/server/appsmith-server/target/openapi/appsmith-server-openapi.json`.
- The `server-build` workflow uploads that directory as the `openapi-document` artifact. On a pull
  request that is the `server-unit-tests` job of `quality-checks`; callers that pass `skip-tests`
  (the release build, the Cypress image build) run no tests and upload nothing. On a rerun that
  executes only previously failed tests, the artifact is absent unless this test was among them.
- The test is also the compatibility check for the springdoc dependency in `appsmith-server/pom.xml`.
  springdoc must track the Spring Boot line (2.9.x for Spring Boot 3.5); an older version compiles
  but fails at generation time with `NoSuchMethodError`, which the test turns into a build failure
  instead of a silent gap.

Three tests pin the document's exposure: `OpenApiDocsDisabledByDefaultTest` (default configuration,
authenticated user, 404), `OpenApiDocsAuthTest` (springdoc enabled, unauthenticated, 401) and
`OpenApiDocumentGenerationTest` (springdoc enabled, authenticated, 200).

Running instances keep `springdoc.api-docs.enabled=false` and `springdoc.swagger-ui.enabled=false`
(`application-ce.properties`). That default was set for GHSA-v6jh-fx3m-7xhw, and the standard Caddy
configuration only proxies `/api/*`, `/oauth2/*` and `/login/*` to the backend, so `/v3/docs` is not
reachable through a normal deployment either way. Exposing the document from a running instance is a
Phase 1 design item (public base path, admin gating), not a configuration flip.

### Generating the document locally

Prerequisites are the same as the `Run only tests` step of `server-build.yml`: export that step's
environment block (`ACTIVE_PROFILE=test`, `APPSMITH_DB_URL`, `APPSMITH_REDIS_URL`, the encryption
password and salt, `APPSMITH_ENVFILE_PATH`), have a Redis listening on port 6379, and have the sibling
modules built (`-am` below builds them; drop it once they are installed in your local Maven repository).

```bash
cd app/server
mvn -pl appsmith-server -am test \
  -Dtest=OpenApiDocumentGenerationTest \
  -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false
```

The document lands in `appsmith-server/target/openapi/`. To browse it from a locally running
server instead, add `-Dspringdoc.api-docs.enabled=true -Dspringdoc.swagger-ui.enabled=true` to the
`java` command line and open `/v3/swagger` on the backend port (authentication is still required).

## What the current document is, and is not

The generated document describes the internal `/api/v1` routes the editor uses. It is implementation
evidence and the input for later phases; it is not the supported public contract. Public endpoints
live under the base path in `conventions.md`, get their own request and response models, and are the
only operations the published public document will contain. In the EE repository the same test
enumerates EE-only routes; that artifact stays inside the private repository and is never republished
without the `public` tag filter from the conventions.
