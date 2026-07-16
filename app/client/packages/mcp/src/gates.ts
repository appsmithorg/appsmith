// Env-gate parsing shared by the MCP entrypoint. The Admin Settings UI writes "true"/"false"; operators may also
// use "1"/"0".

// Explicit-truthy check: enabled only for a recognized truthy value. Used where a value is always present.
export function gateEnabled(value: string | undefined): boolean {
  return value !== undefined && /^(1|true|yes|on)$/i.test(value.trim());
}

// Default-ON gate: enabled unless explicitly disabled (false/0/no/off). The MCP data layer and restricted JS objects
// are ON by default, matching the master APPSMITH_MCP_ENABLED gate — a missing/unrecognized value stays enabled.
export function gateEnabledByDefault(value: string | undefined): boolean {
  return value === undefined || !/^(false|0|no|off)$/i.test(value.trim());
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
