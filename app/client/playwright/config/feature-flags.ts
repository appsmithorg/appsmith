/**
 * Base feature flag overrides applied to ALL test runs.
 * These merge on top of real server responses — they never replace them.
 *
 * Only add flags here when the test environment consistently needs
 * a flag value that differs from what the server returns.
 *
 * For per-run overrides, use:
 *   PW_FLAG_OVERRIDES='{"flag_name":true}' yarn test:pw
 *
 * For per-test overrides, use page.route() inline in the test body.
 *
 * Precedence (highest wins):
 *   per-test page.route > PW_FLAG_OVERRIDES env var > this file > real server
 */
export const BASE_FLAG_OVERRIDES: Record<string, boolean> = {};
