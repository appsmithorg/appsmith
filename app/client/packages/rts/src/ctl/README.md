# `appsmithctl`

This is the source for the `appsmithctl` command in Appsmith containers.

The CLI reads `docker.env` with the same data-only parser as container startup.
Quoted values and complete database URLs, including query options, are preserved;
invalid files stop the command before dispatch. External environment values take
precedence. `APPSMITH_MONGODB_URI` is supported as a fallback when
`APPSMITH_DB_URL` is unset. Restore resolves the target database URL once and uses
that value for both the database restore and the saved configuration.
