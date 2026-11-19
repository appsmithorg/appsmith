"use strict";

// Run with: find .github/workflows/scripts -name '*.test.js' -exec node --test {} +
const test = require("node:test");
const assert = require("node:assert/strict");

const prelude = require("./prelude.js");

const IMAGE = "appsmith/appsmith-ee";

const release = (tag_name, extra = {}) => ({
  tag_name,
  draft: false,
  prerelease: false,
  ...extra,
});

function fakeCore() {
  const outputs = {};
  const summary = {
    addTable: () => summary,
    addHeading: () => summary,
    addCodeBlock: () => summary,
    write: async () => summary,
  };
  return {
    outputs,
    failed: undefined,
    summary,
    setOutput(name, value) {
      outputs[name] = value;
    },
    setFailed(message) {
      this.failed = message;
    },
    notice() {},
  };
}

function fakeGithub(releasesOrError) {
  const listReleases = () => {};
  return {
    rest: { repos: { listReleases } },
    paginate: async (method, params) => {
      assert.equal(method, listReleases);
      assert.deepEqual(params, {
        owner: "appsmithorg",
        repo: "appsmith-ee",
        per_page: 100,
      });
      if (releasesOrError instanceof Error) {
        throw releasesOrError;
      }
      return releasesOrError;
    },
  };
}

async function run(tag, releases) {
  const core = fakeCore();
  const context = {
    ref: `refs/tags/${tag}`,
    sha: "0000000",
    eventName: "release",
    repo: { owner: "appsmithorg", repo: "appsmith-ee" },
  };
  await prelude({ core, context, github: fakeGithub(releases) }, IMAGE);
  return core;
}

const dockerTags = (core) => core.outputs.docker_tags.split("\n");

test.describe("prelude docker tags", () => {
  test("hotfix on an older line does not move latest", async () => {
    const core = await run("v2.5.2", [
      release("v2.5.2"),
      release("v2.6.0"),
      release("v2.5.1"),
    ]);
    assert.deepEqual(dockerTags(core), [`${IMAGE}:v2.5.2`]);
  });

  test("highest published release is tagged latest", async () => {
    const core = await run("v2.6.0", [
      release("v2.6.0"),
      release("v2.5.1"),
      release("v2.5.0"),
    ]);
    assert.deepEqual(dockerTags(core), [`${IMAGE}:v2.6.0`, `${IMAGE}:latest`]);
  });

  test("this release counts even if the API does not list it yet", async () => {
    const core = await run("v2.6.0", [release("v2.5.1")]);
    assert.deepEqual(dockerTags(core), [`${IMAGE}:v2.6.0`, `${IMAGE}:latest`]);
  });

  test("a higher draft or pre-release does not block latest", async () => {
    const core = await run("v2.6.0", [
      release("v2.6.0"),
      release("v2.7.0", { draft: true }),
      release("v2.8.0", { prerelease: true }),
    ]);
    assert.deepEqual(dockerTags(core), [`${IMAGE}:v2.6.0`, `${IMAGE}:latest`]);
  });

  test("tags that are not plain version numbers do not block latest", async () => {
    const core = await run("v2.6.0", [
      release("v2.6.0"),
      release("v2.6.0-auth-patch"),
      release("v.9.9.9"),
      release("9.9.9"),
    ]);
    assert.deepEqual(dockerTags(core), [`${IMAGE}:v2.6.0`, `${IMAGE}:latest`]);
  });

  test("a release that is not a plain version number is never latest", async () => {
    const core = await run("v2.6.1-auth-patch", [release("v2.6.0")]);
    assert.deepEqual(dockerTags(core), [`${IMAGE}:v2.6.1-auth-patch`]);
  });

  test("versions compare by number, with any number of parts", async () => {
    const higherFourPart = await run("v1.9.37.2", [
      release("v1.9.37.1"),
      release("v1.9.37"),
    ]);
    assert.deepEqual(dockerTags(higherFourPart), [
      `${IMAGE}:v1.9.37.2`,
      `${IMAGE}:latest`,
    ]);

    const lowerMinor = await run("v1.9.9", [release("v1.10.0")]);
    assert.deepEqual(dockerTags(lowerMinor), [`${IMAGE}:v1.9.9`]);

    const samePatchZero = await run("v2.6", [release("v2.6.0")]);
    assert.deepEqual(dockerTags(samePatchZero), [
      `${IMAGE}:v2.6`,
      `${IMAGE}:latest`,
    ]);
  });

  test("an API error fails without setting any docker tags", async () => {
    const core = fakeCore();
    const context = {
      ref: "refs/tags/v2.6.0",
      sha: "0000000",
      eventName: "release",
      repo: { owner: "appsmithorg", repo: "appsmith-ee" },
    };
    await assert.rejects(
      prelude(
        { core, context, github: fakeGithub(new Error("API rate limit exceeded")) },
        IMAGE,
      ),
      /API rate limit exceeded/,
    );
    assert.equal(core.outputs.docker_tags, undefined);
  });

  test("a ref that is not a version tag fails", async () => {
    const core = fakeCore();
    const context = {
      ref: "refs/heads/release",
      sha: "0000000",
      eventName: "release",
      repo: { owner: "appsmithorg", repo: "appsmith-ee" },
    };
    await prelude({ core, context, github: fakeGithub([]) }, IMAGE);
    assert.match(core.failed, /Invalid tag: 'refs\/heads\/release'/);
    assert.equal(core.outputs.docker_tags, undefined);
  });
});
