import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import DisconnectModal from "./DisconnectModalView";

jest.mock("ee/utils/AnalyticsUtil", () => ({
  logEvent: jest.fn(),
}));

describe("DisconnectModal", () => {
  const defaultProps = {
    closeDisconnectModal: jest.fn(),
    disconnect: jest.fn(),
    disconnectArtifactName: "TestApp",
    isDisconnectLoading: false,
    isDisconnectModalOpen: true,
    toggleSettingsModal: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render the modal when isModalOpen is true", () => {
    render(<DisconnectModal {...defaultProps} />);
    expect(screen.getByTestId("t--git-disconnect-modal")).toBeInTheDocument();
  });

  it("should not render the modal when isModalOpen is false", () => {
    render(<DisconnectModal {...defaultProps} isDisconnectModalOpen={false} />);
    expect(
      screen.queryByTestId("t--git-disconnect-modal"),
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

  it("should enable Revoke button when appName matches disconnectAppName", () => {
    render(<DisconnectModal {...defaultProps} />);
    const input = screen.getByLabelText("Application name");
    const revokeButton = screen.getByTestId(
      "t--git-disconnect-modal-revoke-btn",
    );

    expect(revokeButton).toBeDisabled();

    fireEvent.change(input, { target: { value: "TestApp" } });
    expect(revokeButton).toBeEnabled();
  });

  it("should disable Revoke button when appName does not match disconnectAppName", () => {
    render(<DisconnectModal {...defaultProps} />);
    const input = screen.getByLabelText("Application name");
    const revokeButton = screen.getByTestId(
      "t--git-disconnect-modal-revoke-btn",
    );

    fireEvent.change(input, { target: { value: "WrongAppName" } });
    expect(revokeButton).toBeDisabled();
  });

  it("should call onBackClick when Go Back button is clicked", () => {
    render(<DisconnectModal {...defaultProps} />);
    const goBackButton = screen.getByTestId("t--git-disconnect-modal-back-btn");

    fireEvent.click(goBackButton);
    expect(defaultProps.closeDisconnectModal).toHaveBeenCalledTimes(1);
    expect(defaultProps.toggleSettingsModal).toHaveBeenCalledTimes(1);
  });

  it("should call onDisconnect when Revoke button is clicked", () => {
    render(<DisconnectModal {...defaultProps} />);
    const input = screen.getByLabelText("Application name");
    const revokeButton = screen.getByTestId(
      "t--git-disconnect-modal-revoke-btn",
    );

    fireEvent.change(input, { target: { value: "TestApp" } });
    fireEvent.click(revokeButton);

    expect(defaultProps.disconnect).toHaveBeenCalledTimes(1);
  });

  it("should disable Revoke button when isRevoking is true", () => {
    const { rerender } = render(<DisconnectModal {...defaultProps} />);
    const input = screen.getByLabelText("Application name");
    const revokeButton = screen.getByTestId(
      "t--git-disconnect-modal-revoke-btn",
    );

    fireEvent.change(input, { target: { value: "TestApp" } });
    expect(revokeButton).toBeEnabled();

    fireEvent.click(revokeButton);
    // Rerender to reflect state change
    rerender(<DisconnectModal {...defaultProps} isDisconnectLoading />);

    expect(defaultProps.disconnect).toHaveBeenCalledTimes(1);
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
    const revokeButton = screen.getByTestId(
      "t--git-disconnect-modal-revoke-btn",
    );

    fireEvent.click(revokeButton);
    expect(defaultProps.disconnect).not.toHaveBeenCalled();
  });
});
