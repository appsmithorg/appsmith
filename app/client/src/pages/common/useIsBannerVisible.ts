import { useSelector } from "react-redux";
import { useRouteMatch } from "react-router-dom";
import { shouldShowLicenseBanner } from "ee/selectors/organizationSelectors";
import { getShouldShowBaseUrlMissingBanner } from "selectors/usersSelectors";

/**
 * Single source of truth for "is a top-of-screen banner visible, so page chrome
 * must be offset below it?". Used by the page header, the Applications sidebar
 * (LeftPane) and the Applications onboarding view (CreateNewAppsOption) — all of
 * which pin/position content against the top of the viewport and must drop by
 * the banner height when a banner is shown.
 *
 * The license / trial banner is only rendered on the home (`/applications`) and
 * `/license` routes, so it is route-gated by default. The base-url-missing admin
 * banner (GHSA-j9gf-vw2f-9hrw) is a global instance signal shown on every route,
 * so it is always folded in.
 *
 * Centralising this is the fix for APP-16059: previously each site recomputed the
 * flag independently and the Applications sidebar + onboarding view folded in only
 * the license banner, so a fresh install that showed just the base-url-missing
 * banner left the sidebar un-offset and hid the create-workspace "+" button behind
 * it. The page header already folded in the base-url banner; now every site shares
 * one decision and cannot drift again.
 *
 * @param routeGated Defaults to `true`. Pass `false` for the onboarding view,
 * which is only ever mounted inside the Applications flow and therefore treats the
 * license banner as visible without a route check (mirroring its prior behaviour).
 */
export function useIsBannerVisible({
  routeGated = true,
}: { routeGated?: boolean } = {}): boolean {
  const showLicenseBanner = useSelector(shouldShowLicenseBanner);
  const showBaseUrlBanner = useSelector(getShouldShowBaseUrlMissingBanner);
  const isHomePage = Boolean(useRouteMatch("/applications")?.isExact);
  const isLicensePage = Boolean(useRouteMatch("/license")?.isExact);

  const licenseBannerVisible = routeGated
    ? showLicenseBanner && (isHomePage || isLicensePage)
    : showLicenseBanner;

  return Boolean(licenseBannerVisible || showBaseUrlBanner);
}
