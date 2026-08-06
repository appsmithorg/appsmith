# MCP M7 — Git awareness: status gate, agent branches, elicitation-confirmed commits

Date: 2026-07-16 (rev 2)
Status: APPROVED WITH CONDITIONS — design council rev 2: product & architect APPROVE WITH
RISKS; security re-review converted BLOCKED → APPROVE WITH RISKS. All conditions folded in
below. Security code-review sign-off required before commit (fresh-read-at-confirm refusal,
fail-closed gate, no-secrets projection).

Security rev-2 implementation conditions (binding):
1. The T1 per-session gate cache must NEVER cache read ERRORS; a "not-connected" result may
   only be cached for the short TTL (apps can be git-connected mid-session); only positive
   connected+branch is immutable-safe.
2. Non-accept elicitations do not consume the token — so bound re-prompting: max 3
   elicitations per confirmationId, then the token is invalidated (prompt-fatigue guard).
3. Message hygiene additionally rejects Unicode bidi/format controls (U+202A–U+202E,
   U+2066–U+2069) so agent text cannot visually reorder the load-bearing facts in git UIs or
   the approval prompt.
4. The content-revision fingerprint is page-list-granular (action/JS body changes are not
   captured) — the elicitation prompt says "commit ALL current changes on branch mcp/<x>",
   never an itemized claim.
Origin: user direction. The MCP can edit a git-connected app but never finish the job (publish
refuses git apps; nothing can commit; agents leave dirty shared branches). User requirements:
(1) git status MUST be read before editing an existing git app; (2) agents work on their own
branches; (3) the human — not the agent — confirms commit, via a real client prompt when the
MCP client supports elicitation.

## Ground truth (verified against server source by the council)

- **Commit implies push.** `POST /git/applications/{branchedApplicationId}/commit`
  (GitFSServiceCEImpl.commitArtifact) unconditionally pushes after the local commit; CommitDTO
  has no push flag and no separate push endpoint exists. There is NO commit-without-push.
- **create-ref pushes too.** Creating a branch pushes the new ref to the customer remote
  immediately. Branch creation is remote egress and can trigger remote CI/webhooks.
- **Branch-per-application model.** Each branch is a separate application document; the branch
  of a given applicationId is immutable. There is no server-side "checkout"; humans' editor
  views are unaffected by agent branch work.
- Protected branches are enforced server-side in the commit path (opt-in per app; backstop
  only). EE branch protection rides the same API. Missing git author profile fails commit with
  INVALID_GIT_CONFIGURATION.
- All MCP git calls go through Appsmith's REST API under the caller's own token; the push
  credential is the instance's stored deploy key.

## T1 — read_git_status (always-on read) + the branch gate

Tool `read_git_status { applicationId, compareRemote? }`:
- Composition [COUNCIL: architect]: `getApplication` metadata (connected, branchName,
  defaultBranchName) + `/status?compareRemote=false` by default (isClean/isDirty, counts of
  modified entities) + protected-branches (base artifact id). `compareRemote: true` is opt-in
  (it fetches from the remote — slow, egress, git locks) and adds ahead/behind.
- Whitelist projection only; remote URL host only; never gitAuth/keys (no-secrets test).

**The branch gate [USER REQUIREMENT 1]:** every mutation on a git-CONNECTED app requires a
`branch` parameter equal to the target app's branch.
- Gate reads use `getApplication` metadata (cheap), piggybacking commitLayout's existing git
  read for layout mutations; action mutations add one read (short per-session cache per
  applicationId is acceptable — branch is immutable; connected-ness gets a short TTL).
- **Fail-closed** [COUNCIL: security F3]: a gate read ERROR rejects the mutation
  ("could not verify git state; retry") — unlike the advisory gitWarning, which stays
  fail-open. A successful read showing not-connected passes (non-git apps unchanged, param
  optional there).
- Honesty [COUNCIL: architect]: the gate proves the agent READ the status, not freshness
  (branch can't change under a fixed applicationId). `git_branch_required` /
  `git_branch_changed` errors include the current branch so recovery is a single retry.
- This is a BREAKING behavior change for agents editing git apps (warn → gate); called out in
  README/release notes. Rollback = revert; no data migration.

## T2 — Agent branches (create_branch)

Governed tool `create_branch { applicationId, name }`:
- Server enforces byte-exact prefix `mcp/` (no case folding/normalization), remainder
  `[A-Za-z0-9_-]{1,60}`, bare "mcp" rejected. `mcp/*` is documented as a RESERVED namespace —
  a human branch named mcp/* becomes agent-committable (accepted, documented).
- Calls create-ref from the source branched app. **This pushes the new ref to the remote**
  (egress) [COUNCIL: security F2/architect] — governed + audited, and rate-limited: at most
  5 mcp/ branches per base application (create returns a clear error beyond that, steering
  agents to reuse); SERVER_INSTRUCTIONS teach branch reuse.
- **Returns the NEW branched `applicationId`** [COUNCIL: architect] — there is no checkout;
  the tool result and instructions pivot all subsequent edits/commits to that id. The human's
  editor view is unaffected [COUNCIL: product].
- Dirty-source semantics [COUNCIL: product]: the new branch imports the source's CURRENT
  (uncommitted) state — the agent-recovery path carries its own work over, but a dirty human
  branch rides along too and the source app stays dirty (discard is out of scope). Teach: if
  `read_git_status` shows the source dirty with work the agent didn't make, surface that to
  the user before branching.
- Behind-remote teaching: when a remote compare shows behindCount > 0, suggest the user pull
  in Appsmith first (no pull via MCP).

## T3 — prepare_commit / confirm_commit (commit ⇒ push; mcp/-only)

**The single load-bearing rule [COUNCIL: security F1, unblock condition]: because the commit
API always pushes, `prepare_commit`/`confirm_commit` REFUSE unless a fresh, fail-closed read
AT CONFIRM TIME shows the target app's branch is `mcp/`-prefixed.** There is no push flag and
no commit-on-shared-branches, ever. Protected-branch and EE rules remain server-side backstops.

Governed pair, standard posture:
- `prepare_commit { applicationId, message }` → one-time confirmation (5-min TTL). Digest
  binds applicationId + branch + message + the CONTENT revision (page-list fingerprint, as
  confirm_publish does) so the human approves exactly what ships; drift between prepare and
  confirm fails [COUNCIL: security F6].
- Message hygiene [COUNCIL: security F4]: single line, printable charset (reject
  \x00–\x1f, \x7f), ≤ 200 chars, safeText rules on top. The server prepends a non-strippable
  `[mcp] ` marker and rejects messages beginning with `[`. In any human-facing echo the agent
  text is quoted and delimited, with the load-bearing facts (app, branch, "will push to
  remote") rendered OUTSIDE the quote.
- `CommitDTO.author`/`committer` are never accepted or forwarded — identity always derives
  from the session user server-side [COUNCIL: security F5]. `isAmendCommit` pinned false
  (append-only; no force/amend/rebase/merge/PR in v1).
- The commit API call gets a longer outbound budget than the default 30s fetch abort (export +
  commit + push on large apps) [COUNCIL: architect]. INVALID_GIT_CONFIGURATION maps to an
  agent-legible "the user must set their git author profile in Appsmith" error.
- Result = the handoff [COUNCIL: product, USER REQUIREMENT 2's closing]: branch name,
  branch-scoped editor URL (`.../edit?branch=mcp/<x>`), and next-steps text ("review on this
  branch, merge via Appsmith's branch UI or a PR on the remote, then delete the mcp/ branch").
  SERVER_INSTRUCTIONS step 7 gains a git-app carve-out: the final deliverable for a git app is
  the branch + review URL, NOT a viewerUrl (publish still refuses git apps).

**Elicitation layer [USER REQUIREMENT 3]:**
- Capability read LAZILY per session via the SDK's `getClientCapabilities()` at confirm time
  (ServerContext is built before connect(), so initialize-time capture is impossible)
  [COUNCIL: architect].
- Client supports elicitation → `confirm_commit` sends `elicitation/create` ("Commit <n>
  changed page(s) on branch <mcp/x> of <app> and PUSH to the remote? Message: '<quoted,
  truncated agent text>'"), flat schema, explicit `elicitInput` timeout of 120 s with progress
  notifications during the wait (so timeout-resetting clients don't abort while the human
  deliberates). ONLY `action: "accept"` proceeds; decline/cancel/timeout/non-accept abort
  WITHOUT consuming the one-time confirmation (consume only after accept, immediately before
  executing) [COUNCIL: architect].
- **Elicitation is UX, not a security control** [COUNCIL: security F8]: it is client-asserted
  and client-rendered; no server rule (mcp/-only, TTL, one-time token, digest) relaxes when it
  is declared. On non-elicitation clients the human prompt is advisory (the agent relays) —
  documented PLAINLY for admins, naming which popular clients support elicitation
  [COUNCIL: product].

## Gating ruling [COUNCIL: architect]

`read_git_status` + the branch gate: always-on. `create_branch`, `prepare_commit`,
`confirm_commit`: governance-gated (matches the prepare/confirm precedent; both are remote
egress; the token fallback requires the governance store anyway). "Elicitation-capable clients
may commit ungoverned" is an explicit FUTURE relaxation, not v1.

## Out of scope (v1 — never add without fresh security review)

Publish for git apps; pull/merge/conflict resolution; PR creation; arbitrary-branch checkout;
branch deletion (`delete-ref` and `merge` EXIST on the REST surface — excluded deliberately);
discard; commit-without-push server work.

## Residual risks (accepted, documented)

- Agents can push commits to `mcp/*` refs on the customer remote under the instance deploy key
  with at best one human accept; remote CI configured on all-branch pushes will run on them.
  README tells operators this explicitly.
- mcp/ branch proliferation (cap 5 + reuse guidance + human deletes via the branch UI; no
  agent resume of existing branches in v1 — accepted; a checkout-restricted-to-mcp/* carve-out
  is a possible v1.1).
- Fallback-mode confirmation depends on agent honesty (documented).

## Success measures [COUNCIL: product]

`[mcp]`-marked commits per period; elicitation accept/decline/timeout rates; git_branch_changed
error → successful-retry rate; count of live mcp/ branches per app. All from the existing
audit/logMcpEvent surface.

## Docs / tests

Git guide (status → dirty check → mcp/ branch → edit on the NEW applicationId → commit →
handoff URL; cleanup story); README (breaking gate change, deploy-key egress note, fallback
honesty, EE-branch-protection-applies selling point); capabilities/TOOL_CATALOG + drift tests.
Tests: status projection no-secrets; gate matrix (missing/stale/match/non-git/read-error
fail-closed); prefix + charset + bare-mcp + cap-5 enforcement; commit refusal off-mcp branches
(fresh read at confirm); digest binds content revision; message hygiene incl. marker
non-strippability and control-char rejection; author fields rejected; elicitation
accept/decline/cancel/timeout (mocked capability) + token preserved on non-accept; fallback
token flow unchanged; drift tests.

## Sequencing

T1 → T2 → T3 token flow → elicitation layer last (purely additive, independently testable).
Security re-review of this revision REQUIRED before implementation (their BLOCKED conversion
condition); security sign-off on the implemented commit-gates-egress rule required again at
code review.
