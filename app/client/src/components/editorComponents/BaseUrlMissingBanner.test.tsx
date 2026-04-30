import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ThemeProvider } from "styled-components";
import { BrowserRouter as Router } from "react-router-dom";
import { lightTheme } from "selectors/themeSelectors";
import BaseUrlMissingBanner from "./BaseUrlMissingBanner";

const mockStore = configureStore([]);

const storeWith = (currentUser: object | null, orgConfig?: object) =>
  mockStore({
    ui: { users: { currentUser } },
    organization: orgConfig ? { organizationConfiguration: orgConfig } : {},
  });

const renderBanner = (currentUser: object | null, orgConfig?: object) =>
  render(
    <Provider store={storeWith(currentUser, orgConfig)}>
      <ThemeProvider theme={lightTheme}>
        <Router>
          <BaseUrlMissingBanner />
        </Router>
      </ThemeProvider>
    </Provider>,
  );

const SUPER_ADMIN = {
  isSuperUser: true,
  adminSettingsVisible: true,
};

describe("BaseUrlMissingBanner — GHSA-j9gf-vw2f-9hrw", () => {
  it("renders for super-user with admin settings visible and unhealthy org config", () => {
    renderBanner(SUPER_ADMIN, { instanceBaseUrlConfigurationHealthy: false });

    expect(
      screen.getByTestId("t--base-url-missing-banner"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Email delivery is disabled/i)).toBeInTheDocument();
  });

  it("does not render when org config is healthy", () => {
    const { container } = renderBanner(SUPER_ADMIN, {
      instanceBaseUrlConfigurationHealthy: true,
    });

    expect(container.firstChild).toBeNull();
  });

  it("does not render for non-super-user", () => {
    const { container } = renderBanner(
      { isSuperUser: false, adminSettingsVisible: true },
      { instanceBaseUrlConfigurationHealthy: false },
    );

    expect(container.firstChild).toBeNull();
  });

  it("does not render when admin settings hidden (RBAC / license guard)", () => {
    const { container } = renderBanner(
      { isSuperUser: true, adminSettingsVisible: false },
      { instanceBaseUrlConfigurationHealthy: false },
    );

    expect(container.firstChild).toBeNull();
  });

  // Rolling-deploy safety: org config without the new field. Banner must stay
  // hidden, not flip on as a false positive.
  it("does not render when health field is missing from org config (rolling deploy)", () => {
    const { container } = renderBanner(SUPER_ADMIN, {});

    expect(container.firstChild).toBeNull();
  });

  it("does not render when org config is missing entirely", () => {
    const { container } = renderBanner(SUPER_ADMIN);

    expect(container.firstChild).toBeNull();
  });
});
