The following list describes all the workflows that are configured to run in this repository:

## Release process related Actions

1. [Build RTS Workflow](#build-rts-workflow)
2. [Appsmith Client Build Workflow](#appsmith-client-build-workflow)
3. [Appsmith External Integration Test Workflow](#appsmith-external-integration-test-workflow)
4. [Appsmith Github Release Workflow](#appsmith-github-release-workflow)
5. [Ok To Test](#ok-to-test)
6. [Appsmith Server Workflow](#appsmith-server-workflow)
7. [Test, build and push Docker Image](#test-build-and-push-docker-image)

## Utility Actions

1. [Mark stale issues and pull requests](#mark-stale-issues-and-pull-requests)
2. [Label PRs based on title](#label-prs-based-on-title)
3. [Release Drafter](#release-drafter)
4. [Remove old artifacts](#remove-old-artifacts)
5. [Sync Community workflow](#sync-community-workflow)
6. [Potential Duplicate Issues](#potential-duplicate-issues)
7. [Mastermind Labeler Workflow](#mastermind-labeler-workflow)

#### Build RTS Workflow

_Workflow file: [build-rts.yml](build-rts.yml)_
Triggered on every commit to the rts folder. This workflow is responsible for building the RTS Node server. There are dummy steps for ui-tests and packaging. **(Comment: Useless right now because it does not have ui-test-result)**

#### Appsmith Client Build Workflow

_Workflow file: [client-build.yml](client-build.yml)_
Triggered on every commit to the client folder. This workflow is responsible for building & unit-testing the client side.

#### Appsmith Server Workflow

_Workflow file: [server.yml](server.yml)_
Triggered on every commit to the server folder. This workflow is responsible for building & unit-testing the Java server codebase.

#### Appsmith External Integration Test Workflow

_Workflow file: [external-client-test.yml](external-client-test.yml)_
Triggered only by the ok to test command dispatch. This workflow is responsible for building, unit-testing, integration testing and packaging both server and client code base. **(Comment: Notably not RTS)**

#### Appsmith Github Release Workflow

_Workflow file: [github-release.yml](github-release.yml)_
Triggered on `release` event on Github. This workflow is responsible for building client, server and RTS binaries and packaging them to the latest as well as the relevant release tag on Docker.

#### Ok To Test

_Workflow file: [ok-to-test.yml](ok-to-test.yml)_
Triggered by PR comments. This workflow triggers a repository dispatch for the [Appsmith External Integration Test Workflow](#appsmith-external-integration-test-workflow).

#### Test, build and push Docker Image

_Workflow file: [test-build-docker-image.yml](test-build-docker-image.yml)_
Triggered by PR reviews and push to release or master. This workflow is responsible for building client, server and RTS binaries and packaging them to fata container as well as the older separate containers.

#### Mark stale issues and pull requests

_Workflow file: [stale.yml](stale.yml)_

#### Label PRs based on title

_Workflow file: [pr-labeler.yml](pr-labeler.yml)_

#### Release Drafter

_Workflow file: [release-drafter.yml](release-drafter.yml)_

#### Remove old artifacts

_Workflow file: [remove-old-artifacts.yml](remove-old-artifacts.yml)_

#### Sync Community workflow

_Workflow file: [sync-community-repo.yml](sync-community-repo.yml)_

#### Potential Duplicate Issues

_Workflow file: [duplicate-issue-detector.yml](duplicate-issue-detector.yml)_

#### Mastermind Labeler Workflow

_Workflow file: [mastermind-labeler.yml](mastermind-labeler.yml)_
