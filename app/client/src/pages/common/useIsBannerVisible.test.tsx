import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import configureStore from "redux-mock-store";

import { shouldShowLicenseBanner } from "ee/selectors/organizationSelectors";
import { getShouldShowBaseUrlMissingBanner } from "selectors/usersSelectors";
import { useIsBannerVisible } from "./useIsBannerVisible";

// The two banner signals are the inputs to the layout decision. Mock them so the
// test drives the decision directly instead of reconstructing instance/license
// state. Route matching is left real (via MemoryRouter) because route-gating is
// part of the behaviour under test.
jest.mock("ee/selectors/organizationSelectors", () => ({
  ...jest.requireActual("ee/selectors/organizationSelectors"),
  shouldShowLicenseBanner: jest.fn(),
}));
jest.mock("selectors/usersSelectors", () => ({
  ...jest.requireActual("selectors/usersSelectors"),
  getShouldShowBaseUrlMissingBanner: jest.fn(),
}));

const mockLicenseBanner = shouldShowLicenseBanner as unknown as jest.Mock;
const mockBaseUrlBanner =
  getShouldShowBaseUrlMissingBanner as unknown as jest.Mock;

const mockStore = configureStore([]);

const renderOn = (route: string, options?: { routeGated?: boolean }) =>
  renderHook(() => useIsBannerVisible(options), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider store={mockStore({})}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    ),
  });

describe("useIsBannerVisible (APP-16059)", () => {
  beforeEach(() => {
    mockLicenseBanner.mockReset();
    mockBaseUrlBanner.mockReset();
  });

  describe("route-gated (default) — Applications sidebar / PageHeader chrome", () => {
    it("is visible for the license banner on /applications", () => {
      mockLicenseBanner.mockReturnValue(true);
      mockBaseUrlBanner.mockReturnValue(false);

      expect(renderOn("/applications").result.current).toBe(true);
    });

    it("is visible for the license banner on /license", () => {
      mockLicenseBanner.mockReturnValue(true);
      mockBaseUrlBanner.mockReturnValue(false);

      expect(renderOn("/license").result.current).toBe(true);
    });

    it("is not visible for the license banner off the home/license routes", () => {
      mockLicenseBanner.mockReturnValue(true);
      mockBaseUrlBanner.mockReturnValue(false);

      expect(renderOn("/settings/general").result.current).toBe(false);
    });

    // The reported bug: on a fresh install the base-url-missing banner is the
    // only banner, yet the sidebar must still offset below it so the "+" button
    // is not hidden. Pre-fix this returned false.
    it("is visible when only the base-url-missing banner is active on /applications", () => {
      mockLicenseBanner.mockReturnValue(false);
      mockBaseUrlBanner.mockReturnValue(true);

      expect(renderOn("/applications").result.current).toBe(true);
    });

    // The base-url-missing banner is a global instance signal, not route-gated.
    it("is visible for the base-url-missing banner regardless of route", () => {
      mockLicenseBanner.mockReturnValue(false);
      mockBaseUrlBanner.mockReturnValue(true);

      expect(renderOn("/settings/general").result.current).toBe(true);
    });

    it("is not visible when no banner is active", () => {
      mockLicenseBanner.mockReturnValue(false);
      mockBaseUrlBanner.mockReturnValue(false);

      expect(renderOn("/applications").result.current).toBe(false);
    });
  });

  describe("ungated — Applications onboarding (CreateNewAppsOption)", () => {
    it("is visible for the license banner regardless of route", () => {
      mockLicenseBanner.mockReturnValue(true);
      mockBaseUrlBanner.mockReturnValue(false);

      expect(
        renderOn("/applications", { routeGated: false }).result.current,
      ).toBe(true);
    });

    // Sibling of the reported bug: the onboarding view offsets its content by the
    // same banner height, and pre-fix ignored the base-url-missing banner.
    it("is visible when only the base-url-missing banner is active", () => {
      mockLicenseBanner.mockReturnValue(false);
      mockBaseUrlBanner.mockReturnValue(true);

      expect(
        renderOn("/create-new-app", { routeGated: false }).result.current,
      ).toBe(true);
    });

    it("is not visible when no banner is active", () => {
      mockLicenseBanner.mockReturnValue(false);
      mockBaseUrlBanner.mockReturnValue(false);

      expect(
        renderOn("/applications", { routeGated: false }).result.current,
      ).toBe(false);
    });
  });
});
