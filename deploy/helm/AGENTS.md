# Helm Chart

## Regenerating derived files

When you edit `values.yaml`, regenerate both derived files before committing:

```bash
# 1. Regenerate the JSON schema
helm schema \
  --schema-root.title "Appsmith Helm chart values" \
  --schema-root.id "https://helm.appsmith.com/values.schema.json" \
  -o values.schema.json

# 2. Regenerate the README
helm-docs --sort-values-order file
```

The CI workflow `.github/workflows/helm-docs.yml` enforces both are up to date.

## Annotation format

Each documented value in `values.yaml` carries up to three comment layers (all plain YAML comments):

- `## @param key.name Description` — Bitnami readme-generator compatibility
- `# -- Description` — helm-docs picks this up as the value description
- `# @section -- Section Name` — helm-docs groups the value into a named section table

When adding a new value, include at least the `# --` and `# @section --` lines so it lands in the correct README section. The `## @param` line is optional but preferred for consistency.

## Redis auth

`redis.auth.password` is a Bitnami subchart passthrough the Appsmith templates never read
directly. There is exactly ONE supported way to use it — fully self-managed: set
`redis.auth.password`, set `redis.auth.existingSecret: ""`, AND set
`applicationConfig.APPSMITH_REDIS_URL` so the app uses the same credential. Every other use
is rejected at render time by `appsmith.validateRedisAuth` (in `_helpers.tpl`, invoked from
`configMap.yaml` so it always evaluates). Leave the password unset for the default
(hook-bootstrapped secret) or BYO-secret paths.

Gotcha worth remembering: `helm template` cannot catch the self-managed path's runtime hazard.
When a password is set the bootstrap hook is skipped, so the chart-managed Redis secret never
exists — any pod referencing it (e.g. the `redis-init-container`'s `REDISCLI_AUTH`) must also be
skipped on that path (gate on `not applicationConfig.APPSMITH_REDIS_URL`), or the pod wedges in
`CreateContainerConfigError`. The init-container readiness ping needs no auth regardless:
`redis-cli ping` against an auth-required server replies `NOAUTH` but exits 0, satisfying the wait.
