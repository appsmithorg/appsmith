# Appsmith External Integration Test Workflow

## Workflow Triggers

This workflow is triggered by the "ok to test" command dispatch. It listens for the `repository_dispatch` event with the type `ok-to-test-command`.

## Workflow Jobs

### `notify`

This job is responsible for notifying about the ongoing test run. It creates a comment on the associated pull request with details about the workflow run, commit, and links to various test results.

### `server-build`

The `server-build` job builds the server-side code. It uses the configuration defined in the `.github/workflows/server-build.yml` file. The job is skipped for running tests.

### `client-build`

The `client-build` job builds the client-side codebase. It uses the configuration from the `.github/workflows/client-build.yml` file and checks for test files.

### `rts-build`

The `rts-build` job builds the "rts" (real-time suggestions) package of the client-side codebase. It uses the configuration defined in the `.github/workflows/rts-build.yml` file.

### `build-docker-image`

The `build-docker-image` job builds and pushes the Docker image for the application. It depends on the successful completion of the `client-build`, `server-build`, and `rts-build` jobs. The Docker image is built with support for both `linux/arm64` and `linux/amd64` platforms.

### `ci-test`

The `ci-test` job runs continuous integration tests on the Docker image. It depends on the successful completion of the `build-docker-image` job.

### `ci-test-result`

The `ci-test-result` job collects the results from the `ci-test` and `perf-test` jobs and generates a report. It always runs, and it processes the test results against known failures. The results are then added as a comment on the associated pull request.

### `package`

The `package` job creates a package for release. It runs only if all previous steps are successful and the reference is either the `release` or `master` branch. The package result is then marked as complete.

Please note that this documentation is based on the information provided in the workflow file. For any specific details and further customization, refer to the actual content of the included `.yml` files for each job.
