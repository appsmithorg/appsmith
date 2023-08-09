import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Provisioning from "./";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import {
  CONFIGURE,
  createMessage,
  EDIT,
  PROVISIONING_DESC,
  PROVISIONING_TITLE,
  SCIM_CARD_SUB_TEXT,
  SCIM_CARD_TITLE,
} from "@appsmith/constants/messages";
import { theme } from "constants/DefaultTheme";
import { ThemeProvider } from "styled-components";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDispatch,
}));

function renderTruthyComponent() {
  /* Mock store to bypass the error of react-redux */
  const store = configureStore()({
    provisioning: {
      configuredStatus: true,
    },
  });
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Provisioning />
      </ThemeProvider>
    </Provider>,
  );
}

function renderFalsyComponent() {
  /* Mock store to bypass the error of react-redux */
  const store = configureStore()({
    provisioning: {
      configuredStatus: false,
    },
  });
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Provisioning />
      </ThemeProvider>
    </Provider>,
  );
}

describe("Provisioning", () => {
  it("should render the component with the correct title and subText", () => {
    renderTruthyComponent();

    // Assert the title and subText are correctly displayed
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      createMessage(PROVISIONING_TITLE),
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      createMessage(PROVISIONING_DESC),
    );
  });

  it("should render each provisioning method card with the correct label, subText, and Edit button", async () => {
    renderTruthyComponent();

    // Assert that each method card is correctly rendered
    const methodCards = screen.getAllByTestId("t--method-card");
    expect(methodCards).toHaveLength(1); // Change the number based on the number of methods

    // Test method card details
    expect(
      screen.getByText(createMessage(SCIM_CARD_TITLE)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(createMessage(SCIM_CARD_SUB_TEXT)),
    ).toBeInTheDocument();

    // Test configure/edit button
    const button = await screen.getByText(createMessage(EDIT));
    expect(button).toBeInTheDocument();
  });

  it("should render each provisioning method card with the correct label, subText, and Configure button", async () => {
    renderFalsyComponent();

    // Assert that each method card is correctly rendered
    const methodCards = screen.getAllByTestId("t--method-card");
    expect(methodCards).toHaveLength(1); // Change the number based on the number of methods

    // Test method card details
    expect(
      screen.getByText(createMessage(SCIM_CARD_TITLE)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(createMessage(SCIM_CARD_SUB_TEXT)),
    ).toBeInTheDocument();

    // Test configure/edit button
    const button = await screen.getByText(createMessage(CONFIGURE));
    expect(button).toBeInTheDocument();
  });

  it("should dispatch fetchProvisioningStatus when mounted", () => {
    renderTruthyComponent();

    // Assert that the fetchProvisioningStatus action was dispatched
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ReduxActionTypes.FETCH_PROVISIONING_STATUS,
    });
  });
});
