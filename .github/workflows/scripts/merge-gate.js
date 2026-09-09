"use strict";

// Shared logic for the single required `ci/merge-gate` status.
//
// The gate is written on a PR's HEAD commit SHA and reflects whether the
// checks that actually apply to that PR type are green:
//   - internal PR: `qc-result` AND `perform-test / ci-test-result`
//   - fork PR:     `external-ci-result` AND the approved Cypress result
//                  (persisted as the `ci/fork-cypress` commit status)
//
// It is invoked from two places so exactly one writes per PR:
//   - merge-gate.yml (workflow_run) — recomputes on every completion / rerun
//     start of the feeding workflows; owns internal PRs and recomputes the fork
//     credential-free side.
//   - build-client-server.yml (/approve-ci dispatch) — persists ci/fork-cypress
//     and writes the gate for fork PRs, where the approved head SHA is known.
//
// Fail-closed everywhere: anything not proven green (skipped, neutral, missing,
// in-flight) maps to `pending`, never `success`.

const GATE = "ci/merge-gate";
const FORK_CYPRESS = "ci/fork-cypress";

// Feeding workflow name -> the check-run context it produces. Used to force an
// input to `pending` while that workflow is re-running (workflow_run
// `in_progress`), so an earlier success cannot linger during a rerun.
const WORKFLOW_TO_CHECK = {
  "Quality checks": "qc-result",
  "PR Automation test suite": "perform-test / ci-test-result",
  "External PR credential-free validation": "external-ci-result",
};

// A deleted fork leaves head.repo === null; treat a missing head.repo as a fork.
function isFork(pr, owner, repo) {
  return !pr.head.repo || pr.head.repo.full_name !== `${owner}/${repo}`;
}

// Only gate open PRs that target `release` and whose current head is the SHA we
// are about to write on. This prevents stale writes (head advanced) and reuse
// of results from a different merge commit after a base retarget.
function isGatable(pr, sha) {
  return Boolean(
    pr &&
      pr.state === "open" &&
      pr.base &&
      pr.base.ref === "release" &&
      pr.head &&
      pr.head.sha === sha,
  );
}

function latestChecks(checkRuns) {
  const map = new Map();
  const ts = (c) => new Date(c.started_at || c.completed_at || 0).getTime();
  for (const c of checkRuns) {
    const prev = map.get(c.name);
    if (!prev || ts(c) >= ts(prev)) map.set(c.name, c);
  }
  return map;
}

// listCommitStatusesForRef returns newest-first, so the first per context wins.
function latestStatuses(statuses) {
  const map = new Map();
  for (const s of statuses) if (!map.has(s.context)) map.set(s.context, s);
  return map;
}

// Pure decision so it can be unit-tested without the API.
function decide({ fork, checkRuns, statuses, pendingChecks, forkCypressState }) {
  const checksByName = latestChecks(checkRuns || []);
  const statusesByCtx = latestStatuses(statuses || []);
  const forced = pendingChecks || new Set();

  const checkOutcome = (name) => {
    if (forced.has(name)) return "pending";
    const c = checksByName.get(name);
    if (!c || c.status !== "completed") return "pending";
    if (c.conclusion === "success") return "success";
    // skipped / neutral are NOT a pass — keep the gate closed.
    if (c.conclusion === "skipped" || c.conclusion === "neutral") return "pending";
    return "failure";
  };
  const statusOutcome = (ctx, override) => {
    if (override) return override;
    const s = statusesByCtx.get(ctx);
    if (!s) return "pending";
    if (s.state === "success") return "success";
    if (s.state === "pending") return "pending";
    return "failure";
  };

  const parts = fork
    ? [
        ["external-ci-result", checkOutcome("external-ci-result")],
        ["approved Cypress", statusOutcome(FORK_CYPRESS, forkCypressState)],
      ]
    : [
        ["qc-result", checkOutcome("qc-result")],
        ["perform-test / ci-test-result", checkOutcome("perform-test / ci-test-result")],
      ];

  const failed = parts.filter(([, v]) => v === "failure").map(([k]) => k);
  const pending = parts.filter(([, v]) => v === "pending").map(([k]) => k);

  if (failed.length) {
    return { state: "failure", description: `Failed: ${failed.join(", ")}`.slice(0, 140) };
  }
  if (pending.length) {
    return { state: "pending", description: `Waiting: ${pending.join(", ")}`.slice(0, 140) };
  }
  return {
    state: "success",
    description: (fork
      ? "Credential-free + approved Cypress passed"
      : "Quality checks + Cypress passed"
    ).slice(0, 140),
  };
}

// Exactly one of the three fork Cypress result jobs runs per invocation; 0 or
// >1 is unexpected and fails closed.
function forkCypressStateFromResults(results) {
  const ran = (results || []).filter((r) => r && r !== "skipped");
  if (ran.length !== 1) return "failure";
  return ran[0] === "success" ? "success" : "failure";
}

// Resolve the unique open PR whose head is `sha`. No arbitrary fallback: a
// non-unique / no match returns null so we never gate the wrong PR.
async function resolvePr({ github, owner, repo, sha, workflowRun }) {
  const uniqueBySha = (arr) => {
    const m = (arr || []).filter((p) => p.head && p.head.sha === sha);
    return m.length === 1 ? m[0] : null;
  };

  // 1) Same-repo PRs are attached to the run.
  const fromRun = uniqueBySha(workflowRun && workflowRun.pull_requests);
  if (fromRun) {
    return (await github.rest.pulls.get({ owner, repo, pull_number: fromRun.number })).data;
  }

  // 2) Fork PRs: workflow_run.pull_requests is empty, so query by head owner:branch.
  const headOwner =
    workflowRun &&
    workflowRun.head_repository &&
    workflowRun.head_repository.owner &&
    workflowRun.head_repository.owner.login;
  const headBranch = workflowRun && workflowRun.head_branch;
  if (headOwner && headBranch) {
    const list = await github.paginate(github.rest.pulls.list, {
      owner,
      repo,
      state: "open",
      head: `${headOwner}:${headBranch}`,
      per_page: 100,
    });
    const m = uniqueBySha(list);
    if (m) return m;
  }

  // 3) Last resort: commit association, exact single SHA match only.
  const assoc = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit, {
    owner,
    repo,
    commit_sha: sha,
    per_page: 100,
  });
  return uniqueBySha(assoc);
}

async function readRef({ github, owner, repo, sha }) {
  const checkRuns = await github.paginate(github.rest.checks.listForRef, {
    owner,
    repo,
    ref: sha,
    per_page: 100,
  });
  const statuses = await github.paginate(github.rest.repos.listCommitStatusesForRef, {
    owner,
    repo,
    ref: sha,
    per_page: 100,
  });
  return { checkRuns, statuses };
}

async function writeGate({ github, owner, repo, sha, state, description, runUrl }) {
  await github.rest.repos.createCommitStatus({
    owner,
    repo,
    sha,
    state,
    context: GATE,
    description,
    target_url: runUrl,
  });
}

async function publishForkCypress({ github, owner, repo, sha, results, runUrl }) {
  const state = forkCypressStateFromResults(results);
  await github.rest.repos.createCommitStatus({
    owner,
    repo,
    sha,
    state,
    context: FORK_CYPRESS,
    description: state === "success" ? "Approved Cypress passed" : "Approved Cypress not green",
    target_url: runUrl,
  });
  return state;
}

// Caller supplies the resolved PR. Writes ci/merge-gate on `sha`.
async function evaluate({ github, core, owner, repo, sha, pr, pendingChecks, forkCypressState, runUrl }) {
  if (!isGatable(pr, sha)) {
    if (core && core.info) core.info(`PR not gatable for ${sha} (open + base=release + head==sha); skipping.`);
    return null;
  }
  const fork = isFork(pr, owner, repo);
  const { checkRuns, statuses } = await readRef({ github, owner, repo, sha });
  const { state, description } = decide({ fork, checkRuns, statuses, pendingChecks, forkCypressState });
  await writeGate({ github, owner, repo, sha, state, description, runUrl });
  if (core && core.info) core.info(`ci/merge-gate=${state} on ${sha} (fork=${fork}) — ${description}`);
  return state;
}

module.exports = {
  GATE,
  FORK_CYPRESS,
  WORKFLOW_TO_CHECK,
  isFork,
  isGatable,
  decide,
  forkCypressStateFromResults,
  resolvePr,
  readRef,
  writeGate,
  publishForkCypress,
  evaluate,
};
