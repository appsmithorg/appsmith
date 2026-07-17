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
