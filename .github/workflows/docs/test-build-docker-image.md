# Test, build and push Docker Image

This GitHub workflow is triggered manually (`workflow_dispatch`) and automatically for pushes to the `release` and `master` branches. It is designed to perform various steps, including building and pushing Docker images, running tests, and creating release images.

## Workflow Triggers

The workflow can be manually triggered via the GitHub Actions UI by selecting "Run Workflow" from the actions dropdown. Additionally, it is triggered automatically for pushes to the `release` and `master` branches.

```yaml
on:
  workflow_dispatch:
  push:
    branches: [release, master]
    paths:
      - "app/client/**"
      - "app/server/**"
      - "app/client/packages/rts/**"
      - "!app/client/cypress/manual_TestSuite/**"
```

## Workflow Jobs

### `server-build`

This job, named `server-build`, is responsible for building the server-side code. It uses the configuration defined in `.github/workflows/server-build.yml`. It inherits secrets from the repository.

### `client-build`

The `client-build` job builds the client-side codebase. It uses the configuration from `.github/workflows/client-build.yml` and inherits secrets from the repository.

### `rts-build`

The `rts-build` job builds the "rts" (real-time suggestions) package of the client-side codebase. It uses the configuration defined in `.github/workflows/rts-build.yml` and inherits secrets from the repository.

### `build-docker-image`

This job, named `build-docker-image`, creates and pushes the Docker image for the application. It is dependent on the success of the `client-build`, `server-build`, and `rts-build` jobs. The Docker image is built with two platforms: `linux/arm64` and `linux/amd64`.

### `perf-test`

The `perf-test` job performs performance tests on the Docker image. It depends on the successful completion of the `build-docker-image` job.

### `ci-test`

The `ci-test` job runs continuous integration tests on the Docker image. It depends on the successful completion of the `build-docker-image` job.

### `ci-test-result`

The `ci-test-result` job collects the results from the `ci-test` job and determines whether the integration tests have passed or failed. It always runs, and it is triggered under the following conditions:
- Manual workflow dispatch.
- Push event to the repository.
- Pull request review event with an approved review and originating from the same repository.

### `package-release`

The `package-release` job is responsible for creating a Docker image for release. It runs as soon as the docker image is ready, but only for the `release` branch. It uses OIDC token authentication between Depot and GitHub.

### `package-master`

The `package-master` job creates a Docker image for the `master` branch. It runs only if the tests are successful and is used for nightly builds. It uses OIDC token authentication between Depot and GitHub.