import { AppsmithFrameAncestorsSetting } from "../Constants/constants";

// A bare "*" token is a wildcard source in a CSP frame-ancestors policy. When
// present it matches every origin and overrides every other source in the list,
// so the effective policy is "allow embedding everywhere" regardless of the
// other tokens. This is different from a host wildcard like
// "https://*.example.com", which only matches subdomains of a specific host and
// is a legitimate limit-list entry.
export const isAllowAllFrameAncestorToken = (token: string): boolean =>
  token.trim() === "*";

// True when the stored frame-ancestors value contains a standalone "*" token.
// Split on whitespace so we match a bare "*" but not a "*" embedded in a host
// pattern such as "https://*.example.com".
export const containsAllowAllFrameAncestor = (value: string): boolean =>
  value.trim().length > 0 &&
  value.trim().split(/\s+/).some(isAllowAllFrameAncestorToken);

// Filter the comma-separated limit list emitted by the TagInput, dropping any
// chip that contains a bare "*". Pasted content can arrive as a single chip
// holding whitespace-separated tokens (e.g. "'self' *"), so each chip is checked
// with the whitespace-aware helper rather than a strict token match - otherwise
// a bare "*" inside a pasted chip would slip into the list and silently reopen
// embedding to every origin. A host wildcard like "https://*.example.com" is
// kept. `removed` reports whether anything was dropped so the caller can surface
// an inline message.
export const removeAllowAllFrameAncestorChips = (
  value: string,
): { value: string; removed: boolean } => {
  const chips = value ? value.split(",") : [];
  const accepted = chips.filter((chip) => !containsAllowAllFrameAncestor(chip));

  return {
    value: accepted.join(","),
    removed: accepted.length !== chips.length,
  };
};

// Remove any bare "*" tokens from a whitespace-separated frame-ancestors value,
// keeping legitimate sources (including host wildcards like
// "https://*.example.com"). Used to sanitize a limited-embedding list so a stale
// allow-all "*" - e.g. one left in localStorage before allow-all detection
// existed - can never round-trip back into the stored value.
export const stripAllowAllFrameAncestorTokens = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0 && !isAllowAllFrameAncestorToken(token))
    .join(" ");

export const formatEmbedSettings = (value: string) => {
  // A value containing a bare "*" is effectively allow-everywhere, even when it
  // also lists other sources (e.g. "'self' *"). Show the truthful radio rather
  // than a contradictory "limit" state.
  if (containsAllowAllFrameAncestor(value)) {
    return {
      value: AppsmithFrameAncestorsSetting.ALLOW_EMBEDDING_EVERYWHERE,
    };
  } else if (value === "'none'") {
    return {
      value: AppsmithFrameAncestorsSetting.DISABLE_EMBEDDING_EVERYWHERE,
    };
  } else {
    return {
      value: AppsmithFrameAncestorsSetting.LIMIT_EMBEDDING,
      additionalData: value ? value.replaceAll(" ", ",") : "",
    };
  }
};
