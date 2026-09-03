import { createHash } from "node:crypto";
import { canonicalStableSerialize } from "../builder/semantic.js";

// Git-connection state of an application, read from its gitApplicationMetadata. When an app is connected to git, MCP
// edits land as UNCOMMITTED changes on the checked-out branch and confirm_publish would deploy that uncommitted
// state. So publish is refused, mutating edits carry a warning naming the branch (M1-T3), and — since M7-T1 — every
// mutation on a git-connected app must pass a `branch` parameter equal to that branch (the branch gate).
export interface GitState {
  connected: boolean;
  branchName?: string;
}

export function gitStateOf(application: unknown): GitState {
  const meta = (application as { gitApplicationMetadata?: unknown } | null)
    ?.gitApplicationMetadata as
    | { branchName?: unknown; remoteUrl?: unknown }
    | null
    | undefined;

  if (!meta) return { connected: false };

  const branchName =
    typeof meta.branchName === "string" && meta.branchName.length > 0
      ? meta.branchName
      : undefined;
  // A live connection carries a remoteUrl (and usually a branch). A bare metadata stub (neither) is not connected.
  const connected =
    (typeof meta.remoteUrl === "string" && meta.remoteUrl.length > 0) ||
    branchName !== undefined;

  return { connected, branchName };
}

// Extended — still whitelisted — git metadata projection for read_git_status: adds the default branch, the BASE
// application id (needed for protected-branches), and the remote HOST only. Never gitAuth/keys or the full remote URL.
export interface GitMetadataProjection extends GitState {
  defaultBranchName?: string;
  baseApplicationId?: string;
  remoteHost?: string;
}

// The HOST of the git remote, and nothing else. Whitelist egress guard: a full remote URL can carry credentials
// (https://user:token@host/...) or internal path detail, so only the host survives into agent context. Handles
// scp-like syntax (git@github.com:org/repo.git) and URL forms (ssh://, https://); unknown shapes -> undefined.
export function remoteHostOf(remoteUrl: unknown): string | undefined {
  if (typeof remoteUrl !== "string" || remoteUrl.length === 0) {
    return undefined;
  }

  const scpLike = /^[A-Za-z0-9._-]+@([A-Za-z0-9.-]+):/.exec(remoteUrl);

  if (scpLike) return scpLike[1];

  try {
    const host = new URL(remoteUrl).hostname;

    return host.length > 0 ? host : undefined;
  } catch {
    return undefined;
  }
}

export function gitMetadataOf(application: unknown): GitMetadataProjection {
  const base = gitStateOf(application);
  const meta = (application as { gitApplicationMetadata?: unknown } | null)
    ?.gitApplicationMetadata as
    | {
        defaultBranchName?: unknown;
        defaultApplicationId?: unknown;
        defaultArtifactId?: unknown;
        remoteUrl?: unknown;
      }
    | null
    | undefined;

  if (!meta || !base.connected) return base;

  const str = (value: unknown): string | undefined =>
    typeof value === "string" && value.length > 0 ? value : undefined;

  return {
    ...base,
    defaultBranchName: str(meta.defaultBranchName),
    baseApplicationId:
      str(meta.defaultArtifactId) ?? str(meta.defaultApplicationId),
    remoteHost: remoteHostOf(meta.remoteUrl),
  };
}

// One whitelisted modified-entity count per family from GitStatusDTO: the per-family sets (…Modified/…Added/…Removed)
// serialize as arrays; older payloads only carry the deprecated numeric fields, so those are the fallback.
export function gitEntityCount(
  status: Record<string, unknown>,
  prefix: string,
  deprecatedKey: string,
): number | undefined {
  const sets = [
    status[`${prefix}Modified`],
    status[`${prefix}Added`],
    status[`${prefix}Removed`],
  ].filter((value): value is unknown[] => Array.isArray(value));

  if (sets.length > 0) {
    return sets.reduce((total, set) => total + set.length, 0);
  }

  const deprecated = status[deprecatedKey];

  return typeof deprecated === "number" ? deprecated : undefined;
}

// Whitelist projection of GET /git/applications/{id}/status: only clean/dirty, per-family modified-entity COUNTS
// (never the entity/file name sets), and — only when the caller opted into the remote compare — ahead/behind. A
// server-side DTO change can never leak new fields through this tool because nothing outside this fixed key set is
// forwarded (same posture as projectDatasources).
export function projectGitStatus(
  raw: unknown,
  includeRemoteCounts: boolean,
): Record<string, unknown> {
  const status = (raw ?? {}) as Record<string, unknown>;
  const isClean =
    typeof status.isClean === "boolean" ? status.isClean : undefined;
  const families: [key: string, prefix: string, deprecatedKey: string][] = [
    ["pages", "pages", "modifiedPages"],
    ["queries", "queries", "modifiedQueries"],
    ["jsObjects", "jsObjects", "modifiedJSObjects"],
    ["datasources", "datasources", "modifiedDatasources"],
    ["jsLibs", "jsLibs", "modifiedJSLibs"],
  ];
  const modifiedEntityCounts: Record<string, number> = {};

  for (const [key, prefix, deprecatedKey] of families) {
    const count = gitEntityCount(status, prefix, deprecatedKey);

    if (count !== undefined) modifiedEntityCounts[key] = count;
  }

  return {
    ...(isClean !== undefined ? { isClean, isDirty: !isClean } : {}),
    modifiedEntityCounts,
    ...(includeRemoteCounts && typeof status.aheadCount === "number"
      ? { aheadCount: status.aheadCount }
      : {}),
    ...(includeRemoteCounts && typeof status.behindCount === "number"
      ? { behindCount: status.behindCount }
      : {}),
  };
}

// Branch names from GET .../refs (List<GitRefDTO>). Remote-tracking entries are normalized ("origin/mcp/x" counts
// as "mcp/x") and deduplicated so the mcp/ cap counts BRANCHES, not listings.
export function gitBranchNames(refs: unknown): string[] {
  if (!Array.isArray(refs)) return [];

  const names = new Set<string>();

  for (const ref of refs) {
    const refName = (ref as { refName?: unknown } | null)?.refName;

    if (typeof refName !== "string" || refName.length === 0) continue;

    names.add(
      refName.startsWith("origin/") ? refName.slice("origin/".length) : refName,
    );
  }

  return [...names];
}

export function fingerprintBranchList(names: string[]): string {
  return createHash("sha256")
    .update(canonicalStableSerialize([...names].sort()), "utf8")
    .digest("hex");
}

// Short TTL for cached "not connected" gate reads: an app can become git-connected mid-session, so a stale
// not-connected verdict must expire quickly.
export const GIT_GATE_NOT_CONNECTED_TTL_MS = 30_000;

// Per-session cache for the branch gate's git-state reads [SECURITY REV-2 CONDITION 1 — binding]:
// - read ERRORS are NEVER cached (callers simply do not call set() on error, and set() cannot store one);
// - a "not connected" result is cached only for the short TTL above;
// - connected + branch caches for the session: the branch of a given applicationId is immutable
//   (branch-per-application model), so this can never go stale.
// A connected-but-branchless stub is ambiguous and is never cached.
export class GitGateCache {
  private readonly entries = new Map<
    string,
    { state: GitState; expiresAt?: number }
  >();

  constructor(private readonly now: () => number = Date.now) {}

  get(applicationId: string): GitState | undefined {
    const entry = this.entries.get(applicationId);

    if (!entry) return undefined;

    if (entry.expiresAt !== undefined && entry.expiresAt <= this.now()) {
      this.entries.delete(applicationId);

      return undefined;
    }

    return entry.state;
  }

  set(applicationId: string, state: GitState): void {
    if (state.connected && state.branchName !== undefined) {
      this.entries.set(applicationId, { state });
    } else if (!state.connected) {
      this.entries.set(applicationId, {
        state,
        expiresAt: this.now() + GIT_GATE_NOT_CONNECTED_TTL_MS,
      });
    }
  }
}

// Human-readable warning attached to a mutating edit's result when the target app is git-connected: the change is
// uncommitted on the named branch and must be committed via Appsmith's git UI before it ships.
export function gitEditWarning(git: GitState): string | undefined {
  if (!git.connected) return undefined;

  const branch = git.branchName ? ` on branch "${git.branchName}"` : "";

  return `This application is connected to git. This change is saved as an UNCOMMITTED edit${branch}; commit it via Appsmith's git UI to include it in a deploy. Publishing from MCP is disabled for git-connected apps.`;
}
