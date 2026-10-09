"use strict";

// Run with: node --test .github/workflows/scripts/*.test.js
const test = require("node:test");
const assert = require("node:assert/strict");

const gate = require("./merge-gate.js");

const completed = (name, conclusion) => ({
  name,
  status: "completed",
  conclusion,
  started_at: "2026-01-01T00:00:00Z",
});

const QC = "qc-result";
const CYPRESS = "perform-test / ci-test-result";

test.describe("isDocsPath", () => {
  const docs = [
    "docs/cloud-billing/README.md",
    "docs/images/diagram.png",
    "contributions/docs/setup.md",
    ".cursor/rules/backend.mdc",
    ".claude/settings.json",
    "README.md",
    "CONTRIBUTING.md",
    "AGENTS.md",
    ".github/workflows/README.md",
    "deploy-notes.md",
  ];
  for (const p of docs) {
    test(`${p} is docs`, () => assert.equal(gate.isDocsPath(p), true));
  }

  const notDocs = [
    "app/client/README.md",
    "app/server/AGENTS.md",
    "deploy/helm/README.md",
    "deploy/docker/README.md",
    ".github/workflows/merge-gate.yml",
    ".github/CODEOWNERS",
    "scripts/release.sh",
    "docs",
    "docsite/index.md.bak",
    "app/client/src/x.md.ts",
    "docs/../app/client/src/index.ts",
    "",
  ];
  for (const p of notDocs) {
    test(`${p || "<empty>"} is not docs`, () => assert.equal(gate.isDocsPath(p), false));
  }
});

test.describe("isDocsOnlyChange", () => {
  test("every file docs-only", () => {
    const files = [{ filename: "docs/a.md" }, { filename: "README.md" }];
    assert.equal(gate.isDocsOnlyChange({ files, expectedCount: 2 }), true);
  });

  test("one non-docs file keeps the full gate", () => {
    const files = [{ filename: "docs/a.md" }, { filename: "app/client/src/x.ts" }];
    assert.equal(gate.isDocsOnlyChange({ files, expectedCount: 2 }), false);
  });

  test("a rename out of app/ keeps the full gate", () => {
    const files = [{ filename: "docs/moved.md", previous_filename: "app/client/README.md" }];
    assert.equal(gate.isDocsOnlyChange({ files, expectedCount: 1 }), false);
  });

  test("a rename within docs is docs-only", () => {
    const files = [{ filename: "docs/new.md", previous_filename: "docs/old.md" }];
    assert.equal(gate.isDocsOnlyChange({ files, expectedCount: 1 }), true);
  });

  test("an empty file list keeps the full gate", () => {
    assert.equal(gate.isDocsOnlyChange({ files: [], expectedCount: 0 }), false);
  });

  test("a listing shorter than the PR's file count keeps the full gate", () => {
    const files = [{ filename: "docs/a.md" }];
    assert.equal(gate.isDocsOnlyChange({ files, expectedCount: 2 }), false);
  });

  test("an unknown file count keeps the full gate", () => {
    const files = [{ filename: "docs/a.md" }];
    assert.equal(gate.isDocsOnlyChange({ files, expectedCount: undefined }), false);
    assert.equal(gate.isDocsOnlyChange({ files, expectedCount: null }), false);
    assert.equal(gate.isDocsOnlyChange({ files, expectedCount: "1" }), false);
  });

  test("a listing at the API cap keeps the full gate", () => {
    const files = Array.from({ length: gate.MAX_LISTED_FILES }, (_, i) => ({ filename: `docs/${i}.md` }));
    assert.equal(gate.isDocsOnlyChange({ files, expectedCount: files.length }), false);
  });
});

test.describe("decide: internal PR", () => {
  test("full gate waits on Cypress when it has not run", () => {
    const r = gate.decide({ fork: false, checkRuns: [completed(QC, "success")] });
    assert.equal(r.state, "pending");
    assert.match(r.description, /perform-test \/ ci-test-result/);
  });

  test("full gate passes when both checks are green", () => {
    const r = gate.decide({
      fork: false,
      checkRuns: [completed(QC, "success"), completed(CYPRESS, "success")],
    });
    assert.deepEqual(r, { state: "success", description: "Quality checks + Cypress passed" });
  });

  test("full gate fails on a red Cypress", () => {
    const r = gate.decide({
      fork: false,
      checkRuns: [completed(QC, "success"), completed(CYPRESS, "failure")],
    });
    assert.equal(r.state, "failure");
  });

  test("skipped qc-result keeps the gate pending", () => {
    const r = gate.decide({ fork: false, checkRuns: [completed(QC, "skipped"), completed(CYPRESS, "success")] });
    assert.equal(r.state, "pending");
  });

  test("docs-only passes from qc-result alone and says Cypress was not required", () => {
    const r = gate.decide({ fork: false, docsOnly: true, checkRuns: [completed(QC, "success")] });
    assert.equal(r.state, "success");
    assert.match(r.description, /Cypress not required/);
    assert.ok(r.description.length <= 140);
  });

  test("docs-only still waits on qc-result", () => {
    const r = gate.decide({ fork: false, docsOnly: true, checkRuns: [] });
    assert.deepEqual(r, { state: "pending", description: "Waiting: qc-result" });
  });

  test("docs-only still fails on a red qc-result", () => {
    const r = gate.decide({ fork: false, docsOnly: true, checkRuns: [completed(QC, "failure")] });
    assert.deepEqual(r, { state: "failure", description: "Failed: qc-result" });
  });

  test("docs-only ignores a Cypress rerun that is forced pending", () => {
    const r = gate.decide({
      fork: false,
      docsOnly: true,
      checkRuns: [completed(QC, "success")],
      pendingChecks: new Set([CYPRESS]),
    });
    assert.equal(r.state, "success");
  });

  test("docs-only ignores a red Cypress run that was started by hand", () => {
    const r = gate.decide({
      fork: false,
      docsOnly: true,
      checkRuns: [completed(QC, "success"), completed(CYPRESS, "failure")],
    });
    assert.equal(r.state, "success");
  });
});

test.describe("decide: fork PR", () => {
  test("docs-only does not relax the fork gate", () => {
    const r = gate.decide({
      fork: true,
      docsOnly: true,
      checkRuns: [completed("external-ci-result", "success")],
      statuses: [],
    });
    assert.deepEqual(r, { state: "pending", description: "Waiting: approved Cypress" });
  });

  test("fork gate passes with credential-free + approved Cypress", () => {
    const r = gate.decide({
      fork: true,
      checkRuns: [completed("external-ci-result", "success")],
      statuses: [{ context: gate.FORK_CYPRESS, state: "success" }],
    });
    assert.equal(r.state, "success");
  });
});

test.describe("readDocsOnly", () => {
  const prOf = (n, changed) => ({ number: n, changed_files: changed, head: { repo: { full_name: "o/r" } } });
  const githubWith = (files, { fail, fetchedCount, calls = [] } = {}) => ({
    rest: {
      pulls: {
        listFiles: "listFiles",
        get: async (params) => {
          calls.push("get");
          assert.equal(params.pull_number, 7);
          return { data: { number: 7, changed_files: fetchedCount } };
        },
      },
    },
    paginate: async (fn, params) => {
      assert.equal(fn, "listFiles");
      assert.equal(params.pull_number, 7);
      if (fail) throw new Error("boom");
      return files;
    },
  });
  const core = { info: () => {}, warning: () => {} };

  test("returns true for a docs-only internal PR", async () => {
    const github = githubWith([{ filename: "docs/a.md" }]);
    assert.equal(await gate.readDocsOnly({ github, core, owner: "o", repo: "r", pr: prOf(7, 1) }), true);
  });

  test("returns false when the file listing fails", async () => {
    const github = githubWith([], { fail: true });
    assert.equal(await gate.readDocsOnly({ github, core, owner: "o", repo: "r", pr: prOf(7, 1) }), false);
  });

  test("returns false when the listing disagrees with the PR's file count", async () => {
    const github = githubWith([{ filename: "docs/a.md" }]);
    assert.equal(await gate.readDocsOnly({ github, core, owner: "o", repo: "r", pr: prOf(7, 3) }), false);
  });

  test("does not call pulls.get when the PR object already carries its file count", async () => {
    const calls = [];
    const github = githubWith([{ filename: "docs/a.md" }], { calls });
    await gate.readDocsOnly({ github, core, owner: "o", repo: "r", pr: prOf(7, 1) });
    assert.deepEqual(calls, []);
  });

  test("fetches the file count through pulls.get when the PR object lacks it", async () => {
    const calls = [];
    const github = githubWith([{ filename: "docs/a.md" }], { fetchedCount: 1, calls });
    const pr = { number: 7, head: { repo: { full_name: "o/r" } } };
    assert.equal(await gate.readDocsOnly({ github, core, owner: "o", repo: "r", pr }), true);
    assert.deepEqual(calls, ["get"]);
  });

  test("returns false when the fetched file count disagrees with the listing", async () => {
    const github = githubWith([{ filename: "docs/a.md" }], { fetchedCount: 2 });
    const pr = { number: 7, head: { repo: { full_name: "o/r" } } };
    assert.equal(await gate.readDocsOnly({ github, core, owner: "o", repo: "r", pr }), false);
  });

  test("returns false when pulls.get fails", async () => {
    const github = githubWith([{ filename: "docs/a.md" }]);
    github.rest.pulls.get = async () => {
      throw new Error("boom");
    };
    const pr = { number: 7, head: { repo: { full_name: "o/r" } } };
    assert.equal(await gate.readDocsOnly({ github, core, owner: "o", repo: "r", pr }), false);
  });
});
