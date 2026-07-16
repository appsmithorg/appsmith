/**
 * Schemes that a link is allowed to carry explicitly. Mirrors the allowlist
 * in utils/validation/getIsSafeURL.ts. Values with any other scheme (e.g.
 * "javascript:") or no scheme at all are treated as web URLs missing their
 * protocol and get "http://" prepended, which also neutralizes them.
 */
const SAFE_SCHEME_PATTERN = /^(?:https?|mailto|tel|ftp|file|sms):/i;

/**
 * add http if missing
 *
 * @param url
 * @returns
 */
export const addHttpIfMissing = (url: string) => {
  if (!url) {
    return url;
  }

  if (SAFE_SCHEME_PATTERN.test(url)) {
    return url;
  }

  return `http://${url}`;
};
