import {
  containsAllowAllFrameAncestor,
  formatEmbedSettings,
  isAllowAllFrameAncestorToken,
  removeAllowAllFrameAncestorChips,
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

  it("preserves host wildcards and normal sources unchanged", () => {
    expect(stripAllowAllFrameAncestorTokens("https://*.example.com")).toBe(
      "https://*.example.com",
    );
    expect(stripAllowAllFrameAncestorTokens("'self' https://a.com")).toBe(
      "'self' https://a.com",
    );
  });
});
