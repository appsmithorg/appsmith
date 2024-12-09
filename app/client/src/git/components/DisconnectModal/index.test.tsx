import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import DisconnectModal from ".";

jest.mock("ee/utils/AnalyticsUtil", () => ({
  logEvent: jest.fn(),
}));

describe("DisconnectModal", () => {
  const defaultProps = {
    isModalOpen: true,
    disconnectingApp: {
      id: "app123",
      name: "TestApp",
    },
    closeModal: jest.fn(),
    onBackClick: jest.fn(),
    onDisconnect: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render the modal when isModalOpen is true", () => {
    render(<DisconnectModal {...defaultProps} />);
    expect(screen.getByTestId("t--disconnect-git-modal")).toBeInTheDocument();
  });

  it("should not render the modal when isModalOpen is false", () => {
    render(<DisconnectModal {...defaultProps} isModalOpen={false} />);
    expect(
      screen.queryByTestId("t--disconnect-git-modal"),
    ).not.toBeInTheDocument();
  });

  it("should display the correct modal header", () => {
    render(<DisconnectModal {...defaultProps} />);
    expect(screen.getByText("Revoke access to TestApp")).toBeInTheDocument();
  });

  it("should display the correct instruction text", () => {
    render(<DisconnectModal {...defaultProps} />);
    expect(
      screen.getByText("Type “TestApp” in the input box to revoke access."),
    ).toBeInTheDocument();
  });

  it("should update appName state when input changes", () => {
    render(<DisconnectModal {...defaultProps} />);
    const input = screen.getByLabelText("Application name");

    fireEvent.change(input, { target: { value: "TestApp" } });
    expect(input).toHaveValue("TestApp");
  });

  it("should enable Revoke button when appName matches disconnectingApp.name", () => {
    render(<DisconnectModal {...defaultProps} />);
    const input = screen.getByLabelText("Application name");
    const revokeButton = document.getElementsByClassName(
      "t--git-revoke-button",
    )[0];

    expect(revokeButton).toBeDisabled();

    fireEvent.change(input, { target: { value: "TestApp" } });
    expect(revokeButton).toBeEnabled();
  });

  it("should disable Revoke button when appName does not match disconnectingApp.name", () => {
    render(<DisconnectModal {...defaultProps} />);
    const input = screen.getByLabelText("Application name");
    const revokeButton = document.getElementsByClassName(
      "t--git-revoke-button",
    )[0];

    fireEvent.change(input, { target: { value: "WrongAppName" } });
    expect(revokeButton).toBeDisabled();
  });

  it("should call onBackClick when Go Back button is clicked", () => {
    render(<DisconnectModal {...defaultProps} />);
    const goBackButton = document.getElementsByClassName(
      "t--git-revoke-back-button",
    )[0];

    fireEvent.click(goBackButton);
    expect(defaultProps.onBackClick).toHaveBeenCalledTimes(1);
  });

  it("should call onDisconnect when Revoke button is clicked", () => {
    render(<DisconnectModal {...defaultProps} />);
    const input = screen.getByLabelText("Application name");
    const revokeButton = document.getElementsByClassName(
      "t--git-revoke-button",
    )[0];

    fireEvent.change(input, { target: { value: "TestApp" } });
    fireEvent.click(revokeButton);

    expect(defaultProps.onDisconnect).toHaveBeenCalledTimes(1);
  });

  it("should disable Revoke button when isRevoking is true", () => {
    const { rerender } = render(<DisconnectModal {...defaultProps} />);
    const input = screen.getByLabelText("Application name");
    const revokeButton = document.getElementsByClassName(
      "t--git-revoke-button",
    )[0];

    fireEvent.change(input, { target: { value: "TestApp" } });
    expect(revokeButton).toBeEnabled();

    fireEvent.click(revokeButton);
    // Rerender to reflect state change
    rerender(<DisconnectModal {...defaultProps} />);

    expect(defaultProps.onDisconnect).toHaveBeenCalledTimes(1);
    expect(revokeButton).toBeDisabled();
  });

  it("should log analytics event on input blur", () => {
    render(<DisconnectModal {...defaultProps} />);
    const input = screen.getByLabelText("Application name");

    fireEvent.change(input, { target: { value: "SomeValue" } });
    fireEvent.blur(input);

    expect(AnalyticsUtil.logEvent).toHaveBeenCalledWith(
      "GS_MATCHING_REPO_NAME_ON_GIT_DISCONNECT_MODAL",
      {
        value: "SomeValue",
        expecting: "TestApp",
      },
    );
  });

  it("should display callout with non-reversible message and learn more link", () => {
    render(<DisconnectModal {...defaultProps} />);
    expect(
      screen.getByText(
        "This action is non-reversible. Please proceed with caution.",
      ),
    ).toBeInTheDocument();
    const learnMoreLink = screen.getByText("Learn more").parentElement;

    expect(learnMoreLink).toBeInTheDocument();
    expect(learnMoreLink).toHaveAttribute(
      "href",
      "https://docs.appsmith.com/advanced-concepts/version-control-with-git/disconnect-the-git-repository",
    );
  });

  it("should not call onDisconnect when Revoke button is clicked and appName does not match", () => {
    render(<DisconnectModal {...defaultProps} />);
    const revokeButton = document.getElementsByClassName(
      "t--git-revoke-button",
    )[0];

    fireEvent.click(revokeButton);
    expect(defaultProps.onDisconnect).not.toHaveBeenCalled();
  });
});
