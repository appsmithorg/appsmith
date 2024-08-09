import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render, screen, fireEvent } from "@testing-library/react";
import { theme } from "constants/DefaultTheme";
import { Provider } from "react-redux";
import { combineReducers, createStore } from "redux";
import { ThemeProvider } from "styled-components";
import { reducer as formReducer } from "redux-form";
import { BrowserRouter as Router } from "react-router-dom";
import Login from "../UserAuth/Login";

jest.mock("selectors/usersSelectors", () => ({
  getCurrentUser: jest.fn(),
}));
jest.mock("@appsmith/selectors/tenantSelectors", () => ({
  getIsFormLoginEnabled: jest.fn(),
  getThirdPartyAuths: jest.fn(),
  getTenantConfig: jest.fn(),
}));
jest.mock("utils/hooks/useFeatureFlag", () => ({
  useFeatureFlag: jest.fn(),
}));
jest.mock("utils/PerformanceTracker", () => ({
  startTracking: jest.fn(),
}));
jest.mock("@appsmith/utils/AnalyticsUtil", () => ({
  logEvent: jest.fn(),
}));

const rootReducer = combineReducers({
  form: formReducer,
});

const mockStore = createStore(rootReducer);
const mockEmail = "test12+34@gmail.com";

const renderComponent = () =>
  render(
    <Provider store={mockStore}>
      <Router>
        <ThemeProvider theme={theme}>
          <Login />
        </ThemeProvider>
      </Router>
    </Provider>,
  );

describe("Login Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const tenantSelectors = require("@appsmith/selectors/tenantSelectors");
    const userSelectors = require("selectors/usersSelectors");

    tenantSelectors.getTenantConfig.mockReturnValue({
      instanceName: "Appsmith",
    });
    tenantSelectors.getIsFormLoginEnabled.mockReturnValue(true);
    tenantSelectors.getThirdPartyAuths.mockReturnValue([]);
    userSelectors.getCurrentUser.mockReturnValue({
      emptyInstance: false,
    });
  });

  test("should update forgot password URL with the entered email", () => {
    renderComponent();

    const emailField = screen.getByPlaceholderText("Enter your email");
    expect(emailField).toBeInTheDocument();

    fireEvent.change(emailField, { target: { value: mockEmail } });

    const forgotPasswordLink = screen.getByRole("link", {
      name: /Forgot password/i,
    });
    expect(forgotPasswordLink).toBeInTheDocument();

    const href = forgotPasswordLink.getAttribute("href");
    expect(href).toContain(`email=${encodeURIComponent(mockEmail)}`);
  });
});
