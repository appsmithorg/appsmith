import { AppsmithFrameAncestorsSetting } from "../Constants/constants";

// A bare "*" token is a wildcard source in a CSP frame-ancestors policy. When
// present it matches every origin and overrides every other source in the list,
// so the effective policy is "allow embedding everywhere" regardless of the
// other tokens. This is different from a host wildcard like
// "https://*.example.com", which only matches subdomains of a specific host and
// is a legitimate limit-list entry.
export const isAllowAllFrameAncestorToken = (token: string): boolean =>
  (token ?? "").trim() === "*";

// True when the stored frame-ancestors value contains a standalone "*" token.
// Split on whitespace so we match a bare "*" but not a "*" embedded in a host
// pattern such as "https://*.example.com". Tolerates a null/undefined value:
// on a cold load of /settings/configuration the admin-settings store is not yet
// hydrated, so this runs before the value exists.
export const containsAllowAllFrameAncestor = (value: string): boolean => {
  const trimmed = (value ?? "").trim();

  return (
    trimmed.length > 0 &&
    trimmed.split(/\s+/).some(isAllowAllFrameAncestorToken)
  );
};

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
  (value ?? "")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0 && !isAllowAllFrameAncestorToken(token))
    .join(" ");

// Quote the CSP keyword sources. In a frame-ancestors policy "'self'" and
// "'none'" must be single-quoted; a bare "self"/"none" is parsed by the browser
// as a hostname and silently breaks the policy. Normalize them to the quoted
// form (case-insensitive). Host/scheme sources and wildcards
// ("https://x.com", "*.example.com", "*") must stay unquoted and are left as-is.
export const normalizeFrameAncestorToken = (token: string): string => {
  const trimmed = (token ?? "").trim();
  // CSP keywords are case-insensitive, and users may type them already quoted, so
  // canonicalize both the bare and quoted forms (e.g. "NONE" and "'NONE'").
  const lower = trimmed.toLowerCase();

  if (lower === "self" || lower === "'self'") return "'self'";

  if (lower === "none" || lower === "'none'") return "'none'";

  return trimmed;
};

// True when a single token is the disable-everywhere keyword ("none"/"'none'",
// case-insensitive).
export const isDisableFrameAncestorToken = (token: string): boolean =>
  normalizeFrameAncestorToken(token) === "'none'";

// True when a value contains a disable keyword token. In a CSP frame-ancestors
// policy "'none'" is exclusive: alongside other sources it disables embedding
// entirely, so it must never sit in a limit list.
export const containsDisableFrameAncestor = (value: string): boolean => {
  const trimmed = (value ?? "").trim();

  return (
    trimmed.length > 0 && trimmed.split(/\s+/).some(isDisableFrameAncestorToken)
  );
};

// Filter the comma-separated limit list emitted by the TagInput, dropping any
// chip that contains a disable keyword ("none"/"'none'"). Mirrors
// removeAllowAllFrameAncestorChips; the caller steers the admin to the "Disable
// embedding everywhere" radio. `removed` reports whether anything was dropped.
export const removeDisableFrameAncestorChips = (
  value: string,
): { value: string; removed: boolean } => {
  const chips = value ? value.split(",") : [];
  const accepted = chips.filter((chip) => !containsDisableFrameAncestor(chip));

  return {
    value: accepted.join(","),
    removed: accepted.length !== chips.length,
  };
};

// Sanitize a whitespace-separated value for use as a limited-embedding list:
// drop bare "*" tokens, quote bare "self"/"none" keywords, and strip every
// "'none'" token. Neither "*" nor "'none'" is a valid limit-list source, and
// because "'none'" is exclusive in CSP a value like "none https://a.com" must
// not persist as "'none' https://a.com" (which would silently disable embedding);
// the "'none'" is removed so the allow-list saves as intended. Host wildcards
// such as "https://*.example.com" are preserved.
export const sanitizeLimitedFrameAncestors = (value: string): string =>
  stripAllowAllFrameAncestorTokens(value)
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map(normalizeFrameAncestorToken)
    .filter((token) => token !== "'none'")
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
