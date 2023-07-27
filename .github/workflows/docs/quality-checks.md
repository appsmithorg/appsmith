# GitHub Workflow Documentation: Quality Checks

## Overview

The "Quality checks" GitHub workflow is designed to perform various quality checks on your codebase, particularly when there's a pull request targeting the "release" or "master" branches. The workflow makes use of multiple jobs, each focusing on a specific quality check task.

## Workflow Triggers

The workflow is triggered automatically when a pull request is opened or updated, but only for pull requests targeting the "release" or "master" branches.

```yaml
on:
  pull_request:
    branches: [release, master]
```

## Workflow Jobs

### `path-filter`

The first job, named `path-filter`, filters the files changed in the pull request to determine which quality checks are applicable. It identifies files related to the server, client, and Cypress tests and sets appropriate output variables accordingly.

Steps:

1. Checks out the merged commit from the pull request and the base branch.
2. Uses the `dorny/paths-filter` action to filter files and set output variables for "server," "client," and "cypress" changes.

### `server-spotless`

This job, named `server-spotless`, performs a code formatting check on the server-side codebase. It only runs if changes related to the server were detected by the `path-filter` job.

### `server-unit-tests`

The `server-unit-tests` job is responsible for running unit tests on the server-side code. It runs if changes related to the server were detected by the `path-filter` job.

### `client-build`

The `client-build` job handles the build process for the client-side codebase. It runs if changes related to the client were detected by the `path-filter` job.

### `client-prettier`

The `client-prettier` job performs code formatting checks on the client-side codebase using Prettier. It runs if changes related to the client were detected by the `path-filter` job.

### `client-unit-tests`

The `client-unit-tests` job runs unit tests for the client-side codebase. It runs if changes related to the client were detected by the `path-filter` job.

### `client-lint`

The `client-lint` job checks the client-side code for linting issues. It runs if changes related to the client were detected by the `path-filter` job.

### `qc-result`

The final job, `qc-result`, collects the results from all the previous jobs and determines whether the quality checks passed or failed. It always runs, regardless of the results of the previous jobs.

Steps:

1. Uses a Bash script to check the results of each job.
2. If any of the previous jobs' results are "failure," the script echoes "Quality checks failed" and exits with an error code (1).
3. In any other non-failing scenario (skipped steps or successful steps), the script echoes "Quality checks successful" and exits with a success code (0).