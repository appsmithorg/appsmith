import {
  ELICITATION_TIMEOUT_CEILING_MS,
  elicitationTimeoutFromEnv,
  gateEnabled,
  parsePositiveInt,
  publicOriginFromEnv,
  sessionLimitsFromEnv,
} from "./gates.js";

describe("elicitationTimeoutFromEnv — APPSMITH_MCP_ELICITATION_TIMEOUT_MS", () => {
  it("returns undefined (built-in default) when unset or empty, with NO warning", () => {
    const warn = jest.fn();

    expect(elicitationTimeoutFromEnv(undefined, warn)).toBeUndefined();
    expect(elicitationTimeoutFromEnv("", warn)).toBeUndefined();
    expect(elicitationTimeoutFromEnv("   ", warn)).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it("parses a positive integer", () => {
    expect(elicitationTimeoutFromEnv("45000")).toBe(45_000);
  });

  it("falls back to the default with a warning on invalid values", () => {
    for (const value of ["abc", "-5", "0", "1.5"]) {
      const warn = jest.fn();

      expect(elicitationTimeoutFromEnv(value, warn)).toBeUndefined();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toContain(
        "APPSMITH_MCP_ELICITATION_TIMEOUT_MS",
      );
    }
  });

  it("clamps absurd values to the ceiling with a warning", () => {
    const warn = jest.fn();

    expect(elicitationTimeoutFromEnv("999999999", warn)).toBe(
      ELICITATION_TIMEOUT_CEILING_MS,
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("gateEnabled — opt-in gate parsing (data/JS layers)", () => {
  // The Admin Settings UI writes "true"/"false"; operators historically used "1"/"0". Regression guard: the old
  // implementation was `=== "1"`, which would silently ignore the "true" the UI now writes.
  it.each(["1", "true", "TRUE", "True", "yes", "on", " true "])(
    "enables for truthy value %j",
    (value) => {
      expect(gateEnabled(value)).toBe(true);
    },
  );

  it.each(["0", "false", "FALSE", "no", "off", "", "  ", "disabled", "2"])(
    "stays off for %j",
    (value) => {
      expect(gateEnabled(value)).toBe(false);
    },
  );

  it("stays off when the variable is unset", () => {
    expect(gateEnabled(undefined)).toBe(false);
  });
});

describe("parsePositiveInt — session cap/TTL env overrides", () => {
  it.each([
    ["25", 25],
    ["1", 1],
    ["900000", 900000],
    [" 50 ", 50],
  ])("parses %j as %d", (value, expected) => {
    expect(parsePositiveInt(value, 10)).toBe(expected);
  });

  // Zero and negatives would silently disable the limit or break the TTL math — fall back instead.
  it.each([undefined, "", "  ", "0", "-5", "2.5", "abc", "NaN", "Infinity"])(
    "falls back to the default for %j",
    (value) => {
      expect(parsePositiveInt(value, 10)).toBe(10);
    },
  );
});

describe("publicOriginFromEnv — APPSMITH_MCP_PUBLIC_ORIGIN parsing (fail-closed)", () => {
  it.each([
    ["https://apps.example.com", "https://apps.example.com"],
    ["http://apps.example.com", "http://apps.example.com"],
    ["https://apps.example.com:8443", "https://apps.example.com:8443"],
    ["http://localhost:8080", "http://localhost:8080"],
    // A bare trailing slash is a common paste artifact; it is normalized away, never emitted into URLs.
    ["https://apps.example.com/", "https://apps.example.com"],
    [" https://apps.example.com ", "https://apps.example.com"],
    // Uppercase scheme/host normalize to the canonical lowercase origin.
    ["HTTPS://Apps.Example.Com", "https://apps.example.com"],
  ])("accepts %j as origin %j", (value, expected) => {
    expect(publicOriginFromEnv(value)).toBe(expected);
  });

  // Anything that is not a bare http(s) origin fails CLOSED to undefined: a malformed or attacker-shaped value
  // must degrade URLs to root-relative paths, never produce a broken/phishing-grade absolute URL.
  it.each([
    "apps.example.com", // no scheme
    "ftp://apps.example.com",
    "javascript:alert(1)",
    "javascript://apps.example.com",
    "https://apps.example.com/base", // path
    "https://apps.example.com/base/", // path with trailing slash
    "https://apps.example.com//evil", // smuggled path
    "https://apps.example.com/?q=1", // query
    "https://apps.example.com/#frag", // fragment
    "https://user:pass@apps.example.com", // credentials
    "not a url",
    "https://",
  ])("rejects %j (returns undefined)", (value) => {
    expect(publicOriginFromEnv(value)).toBeUndefined();
  });

  it("returns undefined without warning when unset or blank", () => {
    const warn = jest.fn();

    expect(publicOriginFromEnv(undefined, warn)).toBeUndefined();
    expect(publicOriginFromEnv("", warn)).toBeUndefined();
    expect(publicOriginFromEnv("   ", warn)).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns for a present-but-invalid value (a mistyped origin must be loud at startup)", () => {
    const warn = jest.fn();

    expect(
      publicOriginFromEnv("https://apps.example.com/base", warn),
    ).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("APPSMITH_MCP_PUBLIC_ORIGIN");
    expect(warn.mock.calls[0][0]).toContain("root-relative");
  });
});

describe("sessionLimitsFromEnv — session cap/TTL resolution", () => {
  const defaults = {
    maxSessions: 100,
    maxSessionsPerUser: 25,
    sessionTtlMs: 900000,
  };

  it("returns the defaults without warning when nothing is set", () => {
    const warn = jest.fn();

    expect(sessionLimitsFromEnv({}, defaults, warn)).toEqual(defaults);
    expect(warn).not.toHaveBeenCalled();
  });

  it("applies valid overrides from the documented variable names without warning", () => {
    const warn = jest.fn();

    expect(
      sessionLimitsFromEnv(
        {
          APPSMITH_MCP_MAX_SESSIONS: "200",
          APPSMITH_MCP_MAX_SESSIONS_PER_USER: "50",
          APPSMITH_MCP_SESSION_TTL_MS: "60000",
        },
        defaults,
        warn,
      ),
    ).toEqual({
      maxSessions: 200,
      maxSessionsPerUser: 50,
      sessionTtlMs: 60000,
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it("falls back AND warns for a present-but-invalid value (a mistyped tightening override must be loud)", () => {
    const warn = jest.fn();

    expect(
      sessionLimitsFromEnv(
        { APPSMITH_MCP_MAX_SESSIONS_PER_USER: "1O" },
        defaults,
        warn,
      ),
    ).toEqual(defaults);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(
      "APPSMITH_MCP_MAX_SESSIONS_PER_USER",
    );
  });

  it("warns for zero and negative values (they would disable the limit, not tighten it)", () => {
    const warn = jest.fn();

    sessionLimitsFromEnv(
      { APPSMITH_MCP_MAX_SESSIONS: "0", APPSMITH_MCP_SESSION_TTL_MS: "-1" },
      defaults,
      warn,
    );
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("clamps absurd overrides to the ceilings with a warning (the caps exist to bound memory)", () => {
    const warn = jest.fn();

    expect(
      sessionLimitsFromEnv(
        {
          APPSMITH_MCP_MAX_SESSIONS: "1000000000",
          APPSMITH_MCP_SESSION_TTL_MS: "999999999999",
        },
        defaults,
        warn,
      ),
    ).toEqual({
      maxSessions: 10000,
      maxSessionsPerUser: 25,
      sessionTtlMs: 24 * 60 * 60 * 1000,
    });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0][0]).toContain("exceeds the maximum");
  });

  it("warns when the per-user cap exceeds the global cap (global wins at runtime)", () => {
    const warn = jest.fn();

    const limits = sessionLimitsFromEnv(
      {
        APPSMITH_MCP_MAX_SESSIONS: "50",
        APPSMITH_MCP_MAX_SESSIONS_PER_USER: "200",
      },
      defaults,
      warn,
    );

    expect(limits).toEqual({
      maxSessions: 50,
      maxSessionsPerUser: 200,
      sessionTtlMs: 900000,
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("the global cap applies first");
  });
});
