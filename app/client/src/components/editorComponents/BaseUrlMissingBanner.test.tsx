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

const storeWith = (currentUser: object | null) =>
  mockStore({ ui: { users: { currentUser } } });

const renderBanner = (currentUser: object | null) =>
  render(
    <Provider store={storeWith(currentUser)}>
      <ThemeProvider theme={lightTheme}>
        <Router>
          <BaseUrlMissingBanner />
        </Router>
      </ThemeProvider>
    </Provider>,
  );

describe("BaseUrlMissingBanner — GHSA-j9gf-vw2f-9hrw", () => {
  it("renders for super-user with admin settings visible and unhealthy config", () => {
    renderBanner({
      isSuperUser: true,
      adminSettingsVisible: true,
      instanceBaseUrlConfigurationHealthy: false,
    });

    expect(
      screen.getByTestId("t--base-url-missing-banner"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Email delivery is disabled on this instance/i),
    ).toBeInTheDocument();
  });

  it("does not render when configuration is healthy", () => {
    const { container } = renderBanner({
      isSuperUser: true,
      adminSettingsVisible: true,
      instanceBaseUrlConfigurationHealthy: true,
    });

    expect(container.firstChild).toBeNull();
  });

  it("does not render for non-super-user", () => {
    const { container } = renderBanner({
      isSuperUser: false,
      adminSettingsVisible: true,
      instanceBaseUrlConfigurationHealthy: false,
    });

    expect(container.firstChild).toBeNull();
  });

  it("does not render when admin settings hidden (RBAC / license guard)", () => {
    const { container } = renderBanner({
      isSuperUser: true,
      adminSettingsVisible: false,
      instanceBaseUrlConfigurationHealthy: false,
    });

    expect(container.firstChild).toBeNull();
  });

  // Rolling-deploy safety: newer client briefly paired with older server has the
  // health field absent. Banner must stay hidden until both sides are deployed.
  it("does not render when health field is missing (rolling deploy)", () => {
    const { container } = renderBanner({
      isSuperUser: true,
      adminSettingsVisible: true,
    });

    expect(container.firstChild).toBeNull();
  });
});
