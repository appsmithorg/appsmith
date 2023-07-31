import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DisableScimModal from "./DisableScimModal";
import "@testing-library/jest-dom";
import { StaticRouter } from "react-router";
import { theme } from "constants/DefaultTheme";
import { ThemeProvider } from "styled-components";
import {
  DISABLE_SCIM_MODAL_BUTTON,
  DISABLE_SCIM_MODAL_CONFIRMATION,
  KEEP_PROVISIONED_RESOURCES,
  REMOVE_PROVISIONED_RESOURCES,
  createMessage,
} from "@appsmith/constants/messages";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

const mockDisconnect = jest.fn();
jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useDispatch: () => mockDisconnect,
}));

const props = {
  disconnect: mockDisconnect,
  isModalOpen: true,
  provisioningDetails: {
    provisionStatus: "active",
    provisionedGroups: 5,
    provisionedUsers: 10,
    isLoading: {
      apiKey: false,
      disconnectProvisioning: false,
      provisionStatus: false,
    },
    apiKey: "apiKey",
    configuredStatus: true,
  },
  setIsModalOpen: jest.fn(),
};

function renderComponent() {
  return render(
    <ThemeProvider theme={theme}>
      <StaticRouter>
        <DisableScimModal {...props} />
      </StaticRouter>
    </ThemeProvider>,
  );
}

describe("DisableScimModal", () => {
  beforeEach(() => {
    // Reset mock functions before each test
    mockDisconnect.mockClear();
  });

  it("should render the initial modal with radio group options", () => {
    renderComponent();

    // Assert that the initial modal with radio group options is displayed
    expect(
      screen.getByText(createMessage(REMOVE_PROVISIONED_RESOURCES)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(createMessage(KEEP_PROVISIONED_RESOURCES)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: createMessage(DISABLE_SCIM_MODAL_BUTTON),
      }),
    ).toBeInTheDocument();
  });

  it("should display the next screen with callout when 'Keep Provisioned Resources' is selected", async () => {
    renderComponent();

    const disableButton = screen.getByRole("button", {
      name: createMessage(DISABLE_SCIM_MODAL_BUTTON),
    });
    expect(disableButton).toBeDisabled();

    // Select 'Keep Provisioned Resources' radio option
    await fireEvent.click(
      screen.getByLabelText(createMessage(KEEP_PROVISIONED_RESOURCES)),
    );

    expect(disableButton).not.toBeDisabled();
    // Click the Next button
    await fireEvent.click(disableButton);

    // Assert that the next screen with the callout is displayed
    expect(screen.getByTestId("keep-resources-callout")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox", {
      name: createMessage(DISABLE_SCIM_MODAL_CONFIRMATION),
    });
    expect(checkbox).toBeInTheDocument();
    expect(disableButton).toBeDisabled();
  });

  it("should display the next screen with callout when 'Remove Provisioned Resources' is selected", async () => {
    renderComponent();

    const disableButton = screen.getByRole("button", {
      name: createMessage(DISABLE_SCIM_MODAL_BUTTON),
    });
    expect(disableButton).toBeDisabled();

    // Select 'Remove Provisioned Resources' radio option
    await fireEvent.click(
      screen.getByLabelText(createMessage(REMOVE_PROVISIONED_RESOURCES)),
    );

    // Click the Next button
    await fireEvent.click(disableButton);

    // Assert that the next screen with the callout is displayed
    expect(screen.getByTestId("remove-resources-callout")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: createMessage(DISABLE_SCIM_MODAL_CONFIRMATION),
      }),
    ).toBeInTheDocument();
    expect(disableButton).toBeDisabled();
  });

  it("should remove resources and call disconnect with the correct argument", async () => {
    renderComponent();

    const disableButton = screen.getByRole("button", {
      name: createMessage(DISABLE_SCIM_MODAL_BUTTON),
    });
    expect(disableButton).toBeDisabled();

    // Select 'Remove Provisioned Resources' radio option
    await fireEvent.click(
      screen.getByLabelText(createMessage(REMOVE_PROVISIONED_RESOURCES)),
    );

    // Click the Next button
    await fireEvent.click(disableButton);

    // Select the confirmation checkbox
    await fireEvent.click(screen.getByRole("checkbox"));

    // Assert that the 'Disable SCIM' button is enabled
    expect(disableButton).toBeEnabled();

    // Click the 'Disable SCIM' button
    await fireEvent.click(disableButton);

    // Assert that the disconnect function was called with the correct argument
    expect(props.disconnect).toHaveBeenCalledWith({
      type: ReduxActionTypes.DISCONNECT_PROVISIONING,
      payload: {
        keepAllProvisionedResources: false,
      },
    });
  });

  it("should keep resources and call disconnect with the correct argument", async () => {
    renderComponent();

    const disableButton = screen.getByRole("button", {
      name: createMessage(DISABLE_SCIM_MODAL_BUTTON),
    });
    expect(disableButton).toBeDisabled();

    // Select 'Remove Provisioned Resources' radio option
    await fireEvent.click(
      screen.getByLabelText(createMessage(KEEP_PROVISIONED_RESOURCES)),
    );

    // Click the Next button
    await fireEvent.click(disableButton);

    // Select the confirmation checkbox
    await fireEvent.click(screen.getByRole("checkbox"));

    // Assert that the 'Disable SCIM' button is enabled
    expect(disableButton).toBeEnabled();

    // Click the 'Disable SCIM' button
    await fireEvent.click(disableButton);

    // Assert that the disconnect function was called with the correct argument
    expect(props.disconnect).toHaveBeenCalledWith({
      type: ReduxActionTypes.DISCONNECT_PROVISIONING,
      payload: {
        keepAllProvisionedResources: true,
      },
    });
  });
});
