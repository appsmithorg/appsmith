import {
  containsAllowAllFrameAncestor,
  containsDisableFrameAncestor,
  formatEmbedSettings,
  isAllowAllFrameAncestorToken,
  isDisableFrameAncestorToken,
  normalizeFrameAncestorToken,
  removeAllowAllFrameAncestorChips,
  removeDisableFrameAncestorChips,
  sanitizeLimitedFrameAncestors,
  stripAllowAllFrameAncestorTokens,
} from "./utils";
import { AppsmithFrameAncestorsSetting } from "../Constants/constants";

describe("isAllowAllFrameAncestorToken", () => {
  it("matches a bare *", () => {
    expect(isAllowAllFrameAncestorToken("*")).toBe(true);
    expect(isAllowAllFrameAncestorToken(" * ")).toBe(true);
  });

  it("does not match host wildcards or other sources", () => {
    expect(isAllowAllFrameAncestorToken("https://*.example.com")).toBe(false);
    expect(isAllowAllFrameAncestorToken("'self'")).toBe(false);
    expect(isAllowAllFrameAncestorToken("")).toBe(false);
  });

  it("tolerates a null/undefined token", () => {
    expect(isAllowAllFrameAncestorToken(undefined as unknown as string)).toBe(
      false,
    );
    expect(isAllowAllFrameAncestorToken(null as unknown as string)).toBe(false);
  });
});

describe("containsAllowAllFrameAncestor", () => {
  it("detects a standalone * anywhere in the list", () => {
    expect(containsAllowAllFrameAncestor("*")).toBe(true);
    expect(containsAllowAllFrameAncestor("'self' *")).toBe(true);
    expect(containsAllowAllFrameAncestor("* 'self'")).toBe(true);
  });

  it("does not treat host wildcards as allow-everywhere", () => {
    expect(containsAllowAllFrameAncestor("https://*.example.com")).toBe(false);
    expect(containsAllowAllFrameAncestor("'self' https://*.example.com")).toBe(
      false,
    );
  });

  it("is false for other sources and empty values", () => {
    expect(containsAllowAllFrameAncestor("'self'")).toBe(false);
    expect(containsAllowAllFrameAncestor("'none'")).toBe(false);
    expect(containsAllowAllFrameAncestor("")).toBe(false);
    expect(containsAllowAllFrameAncestor("   ")).toBe(false);
  });

  it("tolerates a null/undefined value without throwing", () => {
    expect(containsAllowAllFrameAncestor(undefined as unknown as string)).toBe(
      false,
    );
    expect(containsAllowAllFrameAncestor(null as unknown as string)).toBe(
      false,
    );
  });
});

describe("formatEmbedSettings", () => {
  it("maps an exact * to allow-embedding-everywhere", () => {
    expect(formatEmbedSettings("*")).toEqual({
      value: AppsmithFrameAncestorsSetting.ALLOW_EMBEDDING_EVERYWHERE,
    });
  });

  it("maps a value containing a bare * to allow-embedding-everywhere", () => {
    // "*" overrides every other source in a CSP frame-ancestors policy, so the
    // effective policy is allow-everywhere - show the truthful radio.
    expect(formatEmbedSettings("'self' *")).toEqual({
      value: AppsmithFrameAncestorsSetting.ALLOW_EMBEDDING_EVERYWHERE,
    });
    expect(formatEmbedSettings("* 'self'")).toEqual({
      value: AppsmithFrameAncestorsSetting.ALLOW_EMBEDDING_EVERYWHERE,
    });
  });

  it("maps 'none' to disable-embedding-everywhere", () => {
    expect(formatEmbedSettings("'none'")).toEqual({
      value: AppsmithFrameAncestorsSetting.DISABLE_EMBEDDING_EVERYWHERE,
    });
  });

  it("maps a single source to limit-embedding", () => {
    expect(formatEmbedSettings("'self'")).toEqual({
      value: AppsmithFrameAncestorsSetting.LIMIT_EMBEDDING,
      additionalData: "'self'",
    });
  });

  it("maps multiple sources to limit-embedding with comma-separated chips", () => {
    expect(formatEmbedSettings("'self' https://a.com")).toEqual({
      value: AppsmithFrameAncestorsSetting.LIMIT_EMBEDDING,
      additionalData: "'self',https://a.com",
    });
  });

  it("keeps a host wildcard as a limit-embedding entry", () => {
    // "https://*.example.com" only matches subdomains of example.com; it is a
    // legitimate limit-list source and must NOT be read as allow-everywhere.
    expect(formatEmbedSettings("https://*.example.com")).toEqual({
      value: AppsmithFrameAncestorsSetting.LIMIT_EMBEDDING,
      additionalData: "https://*.example.com",
    });
  });

  it("maps an empty value to an empty limit-embedding list", () => {
    expect(formatEmbedSettings("")).toEqual({
      value: AppsmithFrameAncestorsSetting.LIMIT_EMBEDDING,
      additionalData: "",
    });
  });

  it("tolerates an unhydrated (undefined/null) value without throwing", () => {
    // On a cold load of /settings/configuration the admin-settings store is not
    // yet populated, so redux-form calls format() with undefined. This must not
    // crash the settings page - it should behave like an empty limit list.
    expect(formatEmbedSettings(undefined as unknown as string)).toEqual({
      value: AppsmithFrameAncestorsSetting.LIMIT_EMBEDDING,
      additionalData: "",
    });
    expect(formatEmbedSettings(null as unknown as string)).toEqual({
      value: AppsmithFrameAncestorsSetting.LIMIT_EMBEDDING,
      additionalData: "",
    });
  });
});

describe("removeAllowAllFrameAncestorChips", () => {
  it("drops a bare * committed as its own chip", () => {
    expect(removeAllowAllFrameAncestorChips("*")).toEqual({
      value: "",
      removed: true,
    });
    expect(removeAllowAllFrameAncestorChips("'self',*")).toEqual({
      value: "'self'",
      removed: true,
    });
  });

  it("drops a pasted single chip that contains a bare *", () => {
    // A pasted value has no comma separator, so the whole "'self' *" arrives as
    // one chip. The guard must still catch the bare "*" inside it.
    expect(removeAllowAllFrameAncestorChips("'self' *")).toEqual({
      value: "",
      removed: true,
    });
    expect(removeAllowAllFrameAncestorChips("* https://a.com")).toEqual({
      value: "",
      removed: true,
    });
  });

  it("keeps host wildcards and regular URLs", () => {
    expect(removeAllowAllFrameAncestorChips("https://*.example.com")).toEqual({
      value: "https://*.example.com",
      removed: false,
    });
    expect(removeAllowAllFrameAncestorChips("'self',https://a.com")).toEqual({
      value: "'self',https://a.com",
      removed: false,
    });
  });

  it("returns an empty result for an empty value", () => {
    expect(removeAllowAllFrameAncestorChips("")).toEqual({
      value: "",
      removed: false,
    });
  });
});

describe("stripAllowAllFrameAncestorTokens", () => {
  it("removes bare * tokens while keeping other sources", () => {
    expect(stripAllowAllFrameAncestorTokens("'self' *")).toBe("'self'");
    expect(stripAllowAllFrameAncestorTokens("* 'self' https://a.com")).toBe(
      "'self' https://a.com",
    );
  });

  it("returns an empty string when only a bare * is present", () => {
    expect(stripAllowAllFrameAncestorTokens("*")).toBe("");
    expect(stripAllowAllFrameAncestorTokens("")).toBe("");
  });

  it("tolerates a null/undefined value", () => {
    expect(
      stripAllowAllFrameAncestorTokens(undefined as unknown as string),
    ).toBe("");
    expect(stripAllowAllFrameAncestorTokens(null as unknown as string)).toBe(
      "",
    );
  });

  it("preserves host wildcards and normal sources unchanged", () => {
    expect(stripAllowAllFrameAncestorTokens("https://*.example.com")).toBe(
      "https://*.example.com",
    );
    expect(stripAllowAllFrameAncestorTokens("'self' https://a.com")).toBe(
      "'self' https://a.com",
    );
  });
});

describe("sanitizeLimitedFrameAncestors", () => {
  it("normalizes the disable sentinel to empty so LIMIT mode never emits it", () => {
    // Stripping "*" from "* 'none'" would leave "'none'"; LIMIT mode must not
    // return the disable-everywhere sentinel.
    expect(sanitizeLimitedFrameAncestors("* 'none'")).toBe("");
    expect(sanitizeLimitedFrameAncestors("'none'")).toBe("");
  });

  it("drops bare * tokens like the underlying strip", () => {
    expect(sanitizeLimitedFrameAncestors("*")).toBe("");
    expect(sanitizeLimitedFrameAncestors("* 'self'")).toBe("'self'");
    expect(sanitizeLimitedFrameAncestors("")).toBe("");
  });

  it("preserves host wildcards and normal sources", () => {
    expect(sanitizeLimitedFrameAncestors("https://*.example.com")).toBe(
      "https://*.example.com",
    );
    expect(sanitizeLimitedFrameAncestors("'self' https://a.com")).toBe(
      "'self' https://a.com",
    );
  });

  it("quotes bare self/none keywords so they are never persisted raw", () => {
    // A bare "self" is parsed as a hostname and breaks the CSP policy, so it must
    // be stored as the quoted "'self'" keyword.
    expect(sanitizeLimitedFrameAncestors("self")).toBe("'self'");
    expect(sanitizeLimitedFrameAncestors("self https://a.com")).toBe(
      "'self' https://a.com",
    );
    expect(sanitizeLimitedFrameAncestors("SELF *")).toBe("'self'");
    // A lone bare "none" normalizes to the disable sentinel, which LIMIT mode
    // drops to empty rather than persisting.
    expect(sanitizeLimitedFrameAncestors("none")).toBe("");
  });

  it("strips a none/'none' token combined with allow-list sources", () => {
    // In CSP "'none'" is exclusive, so "none https://a.com" must never persist as
    // "'none' https://a.com" (which would silently disable embedding). The
    // "'none'" is stripped so the allow-list saves as intended.
    expect(sanitizeLimitedFrameAncestors("none https://a.com")).toBe(
      "https://a.com",
    );
    expect(sanitizeLimitedFrameAncestors("'none' https://a.com 'self'")).toBe(
      "https://a.com 'self'",
    );
    expect(sanitizeLimitedFrameAncestors("* 'none'")).toBe("");
  });
});

describe("isDisableFrameAncestorToken", () => {
  it("matches bare and quoted none (case-insensitive)", () => {
    expect(isDisableFrameAncestorToken("none")).toBe(true);
    expect(isDisableFrameAncestorToken("NONE")).toBe(true);
    expect(isDisableFrameAncestorToken("'none'")).toBe(true);
  });

  it("does not match other sources", () => {
    expect(isDisableFrameAncestorToken("'self'")).toBe(false);
    expect(isDisableFrameAncestorToken("https://a.com")).toBe(false);
    expect(isDisableFrameAncestorToken("*")).toBe(false);
    expect(isDisableFrameAncestorToken("")).toBe(false);
  });
});

describe("containsDisableFrameAncestor", () => {
  it("detects a none/'none' token anywhere in the list", () => {
    expect(containsDisableFrameAncestor("none")).toBe(true);
    expect(containsDisableFrameAncestor("none https://a.com")).toBe(true);
    expect(containsDisableFrameAncestor("'self' 'none'")).toBe(true);
  });

  it("is false for lists without a disable keyword", () => {
    expect(containsDisableFrameAncestor("'self' https://a.com")).toBe(false);
    expect(containsDisableFrameAncestor("https://*.example.com")).toBe(false);
    expect(containsDisableFrameAncestor("")).toBe(false);
    expect(containsDisableFrameAncestor(undefined as unknown as string)).toBe(
      false,
    );
  });
});

describe("removeDisableFrameAncestorChips", () => {
  it("drops a none chip committed on its own", () => {
    expect(removeDisableFrameAncestorChips("none")).toEqual({
      value: "",
      removed: true,
    });
    expect(removeDisableFrameAncestorChips("'self',none")).toEqual({
      value: "'self'",
      removed: true,
    });
  });

  it("drops a pasted single chip that contains a disable keyword", () => {
    // Pasting "none https://a.com" arrives as one chip; it must be rejected so
    // "'none'" is never combined with allow-list sources.
    expect(removeDisableFrameAncestorChips("none https://a.com")).toEqual({
      value: "",
      removed: true,
    });
    expect(removeDisableFrameAncestorChips("'none' https://a.com")).toEqual({
      value: "",
      removed: true,
    });
  });

  it("keeps allow-list sources untouched", () => {
    expect(removeDisableFrameAncestorChips("'self',https://a.com")).toEqual({
      value: "'self',https://a.com",
      removed: false,
    });
    expect(removeDisableFrameAncestorChips("")).toEqual({
      value: "",
      removed: false,
    });
  });
});

describe("normalizeFrameAncestorToken", () => {
  it("quotes the bare self/none keywords (case-insensitive)", () => {
    expect(normalizeFrameAncestorToken("self")).toBe("'self'");
    expect(normalizeFrameAncestorToken(" SELF ")).toBe("'self'");
    expect(normalizeFrameAncestorToken("none")).toBe("'none'");
    expect(normalizeFrameAncestorToken("None")).toBe("'none'");
  });

  it("leaves already-quoted keywords unchanged (idempotent)", () => {
    expect(normalizeFrameAncestorToken("'self'")).toBe("'self'");
    expect(normalizeFrameAncestorToken("'none'")).toBe("'none'");
  });

  it("leaves host/scheme sources and wildcards unquoted", () => {
    expect(normalizeFrameAncestorToken("https://a.com")).toBe("https://a.com");
    expect(normalizeFrameAncestorToken("https://*.example.com")).toBe(
      "https://*.example.com",
    );
    expect(normalizeFrameAncestorToken("*")).toBe("*");
    expect(normalizeFrameAncestorToken("")).toBe("");
  });
});
