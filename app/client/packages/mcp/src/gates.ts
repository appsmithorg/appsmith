// Env-gate parsing shared by the MCP entrypoint. The Admin Settings UI writes "true"/"false"; operators may also
// use "1"/"0".

// The ONE gate helper: a capability is enabled only for a recognized truthy value. Absent, blank, and unrecognized
// all mean disabled, so no capability can be acquired by an upgrade or a typo. There is deliberately no default-ON
// counterpart — every MCP gate is opt-in.
export function gateEnabled(value: string | undefined): boolean {
  return value !== undefined && /^(1|true|yes|on)$/i.test(value.trim());
}

// Positive-integer env override (session caps, TTLs). Unset, non-numeric, fractional, zero, or negative values fall
// back to the built-in default rather than failing startup or silently disabling a limit.
export function parsePositiveInt(
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === "") return fallback;

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

// Public origin override for the URLs build_application returns (APPSMITH_MCP_PUBLIC_ORIGIN). Accepts ONLY an
// absolute http(s) origin — scheme + host + optional port, with no path, query, fragment, or credentials (a bare
// trailing slash is normalized away). Anything else fails CLOSED to undefined, so URLs degrade to root-relative
// paths rather than carrying a malformed or attacker-shaped absolute origin into a trusted agent channel. A
// present-but-invalid value is reported via `warn` (like the session-limit overrides) so a mistyped origin is
// loud at startup instead of silently vanishing.
export function publicOriginFromEnv(
  value: string | undefined,
  warn: (message: string) => void = () => {},
): string | undefined {
  if (value === undefined || value.trim() === "") return undefined;

  const trimmed = value.trim();
  const invalid = (reason: string): undefined => {
    warn(
      `APPSMITH_MCP_PUBLIC_ORIGIN=${trimmed} ${reason}; application URLs will be root-relative`,
    );

    return undefined;
  };

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return invalid("is not an absolute URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return invalid("must use http or https");
  }

  if (url.username !== "" || url.password !== "") {
    return invalid("must not carry credentials");
  }

  // "https://host/" parses to pathname "/" and is tolerated (normalized below); any real path, query, or
  // fragment — including a smuggled "//evil" pathname — is rejected outright.
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "") {
    return invalid("must be a bare origin (no path, query, or fragment)");
  }

  // url.origin is the normalized form: lowercased scheme+host, non-default port only, no trailing slash.
  return url.origin;
}

// Ceiling for the elicitation-wait override: a destructive confirm call holds its HTTP request open for the whole
// wait, so an absurd value would pin connections arbitrarily long. Clamped with a warning, like the session TTL.
export const ELICITATION_TIMEOUT_CEILING_MS = 10 * 60 * 1000;

// APPSMITH_MCP_ELICITATION_TIMEOUT_MS resolved to an override (or undefined for the built-in default). Unset and
// empty are silent; a present-but-invalid value warns and falls back, an over-ceiling value warns and clamps —
// matching the sessionLimitsFromEnv posture so a mistyped override is loud at startup.
export function elicitationTimeoutFromEnv(
  value: string | undefined,
  warn: (message: string) => void = () => {},
): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;

  const parsed = parsePositiveInt(value, 0);

  if (parsed === 0) {
    warn(
      `APPSMITH_MCP_ELICITATION_TIMEOUT_MS=${value} is not a positive integer; using the built-in default`,
    );

    return undefined;
  }

  if (parsed > ELICITATION_TIMEOUT_CEILING_MS) {
    warn(
      `APPSMITH_MCP_ELICITATION_TIMEOUT_MS=${value} exceeds the maximum ${ELICITATION_TIMEOUT_CEILING_MS}; using ${ELICITATION_TIMEOUT_CEILING_MS}`,
    );

    return ELICITATION_TIMEOUT_CEILING_MS;
  }

  return parsed;
}

export interface SessionLimits {
  maxSessions: number;
  maxSessionsPerUser: number;
  sessionTtlMs: number;
}

// Sanity ceilings for the session env overrides: the caps and TTL exist to bound memory, so an absurd override
// (e.g. "1e9" sessions, a week-long TTL) would silently remove the bound. Clamped with a warning, not rejected.
export const MAX_SESSION_CAP_CEILING = 10_000;
export const SESSION_TTL_CEILING_MS = 24 * 60 * 60 * 1000;

// Session-limit env overrides resolved against their built-in defaults. Lives here (not in the entrypoint) so the
// env-var names and fallback behavior are unit-testable. A present-but-invalid value falls back AND is reported via
// `warn`, so an operator who mistypes a *tightening* override finds out at startup instead of silently running with
// the more permissive default.
export function sessionLimitsFromEnv(
  env: Record<string, string | undefined>,
  defaults: SessionLimits,
  warn: (message: string) => void = () => {},
): SessionLimits {
  const resolve = (name: string, fallback: number, ceiling: number): number => {
    const raw = env[name];
    const parsed = parsePositiveInt(raw, fallback);

    if (raw !== undefined && raw.trim() !== "" && Number(raw) !== parsed) {
      warn(`${name}=${raw} is not a positive integer; using ${fallback}`);
    }

    if (parsed > ceiling) {
      warn(`${name}=${raw} exceeds the maximum ${ceiling}; using ${ceiling}`);

      return ceiling;
    }

    return parsed;
  };

  const limits = {
    maxSessions: resolve(
      "APPSMITH_MCP_MAX_SESSIONS",
      defaults.maxSessions,
      MAX_SESSION_CAP_CEILING,
    ),
    maxSessionsPerUser: resolve(
      "APPSMITH_MCP_MAX_SESSIONS_PER_USER",
      defaults.maxSessionsPerUser,
      MAX_SESSION_CAP_CEILING,
    ),
    sessionTtlMs: resolve(
      "APPSMITH_MCP_SESSION_TTL_MS",
      defaults.sessionTtlMs,
      SESSION_TTL_CEILING_MS,
    ),
  };

  // A per-user cap above the global cap is admissible but misleading: users hit the global hard 503 in a regime
  // documented as evict-not-reject. The global cap wins at runtime; tell the operator instead of silently confusing.
  if (limits.maxSessionsPerUser > limits.maxSessions) {
    warn(
      `APPSMITH_MCP_MAX_SESSIONS_PER_USER (${limits.maxSessionsPerUser}) exceeds ` +
        `APPSMITH_MCP_MAX_SESSIONS (${limits.maxSessions}); the global cap applies first`,
    );
  }

  return limits;
}
