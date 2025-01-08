import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { isValidGitRemoteUrl } from "../../utils";
import "@testing-library/jest-dom";
import ConnectInitialize from ".";

jest.mock("ee/utils/AnalyticsUtil", () => ({
  logEvent: jest.fn(),
}));

jest.mock("../../utils", () => ({
  isValidGitRemoteUrl: jest.fn(),
}));

jest.mock("@appsmith/ads", () => ({
  ...jest.requireActual("@appsmith/ads"),
  ModalHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const defaultProps = {
  artifactType: "Application",
  error: null,
  onFetchSSHKey: jest.fn(),
  onGenerateSSHKey: jest.fn(),
  isSubmitLoading: false,
  isSSHKeyLoading: false,
  isImport: false,
  onSubmit: jest.fn(),
  onOpenImport: null,
  sshPublicKey: "ssh-rsa AAAAB3...",
  toggleConnectModal: jest.fn(),
};

function completeChooseProviderStep(isImport = false) {
  fireEvent.click(screen.getByTestId("t--git-connect-provider-radio-github"));

  if (isImport) {
    fireEvent.click(screen.getByTestId("t--git-import-existing-repo-checkbox"));
  } else {
    fireEvent.click(screen.getByTestId("t--git-connect-empty-repo-yes"));
  }

  fireEvent.click(screen.getByTestId("t--git-connect-next"));
}

function completeGenerateSSHKeyStep() {
  fireEvent.change(screen.getByTestId("t--git-connect-remote-input"), {
    target: { value: "git@example.com:user/repo.git" },
  });
  fireEvent.click(screen.getByTestId("t--git-connect-next"));
}

function completeAddDeployKeyStep() {
  fireEvent.click(screen.getByTestId("t--git-connect-deploy-key-checkbox"));
  fireEvent.click(screen.getByTestId("t--git-connect-next"));
}

describe("ConnectModal Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (isValidGitRemoteUrl as jest.Mock).mockImplementation((url) =>
      url.startsWith("git@"),
    );
  });

  it("renders the initial step (ChooseGitProvider)", () => {
    render(<ConnectInitialize {...defaultProps} />);
    expect(
      screen.getByText("i. To begin with, choose your Git service provider"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("t--git-connect-next")).toHaveTextContent(
      "Configure Git",
    );
  });

  it("disables the next button when form data is incomplete in ChooseGitProvider step", () => {
    render(<ConnectInitialize {...defaultProps} />);
    expect(screen.getByTestId("t--git-connect-next")).toBeDisabled();
  });

  it("navigates to the next step (GenerateSSH) and validates SSH URL input", () => {
    render(<ConnectInitialize {...defaultProps} />);

    completeChooseProviderStep();

    const sshInput = screen.getByTestId("t--git-connect-remote-input");

    fireEvent.change(sshInput, { target: { value: "invalid-url" } });
    fireEvent.blur(sshInput);

    expect(
      screen.getByText("Please enter a valid SSH URL of your repository"),
    ).toBeInTheDocument();

    fireEvent.change(sshInput, {
      target: { value: "git@example.com:user/repo.git" },
    });
    fireEvent.blur(sshInput);

    expect(
      screen.queryByText("Please enter a valid SSH URL of your repository"),
    ).not.toBeInTheDocument();
  });

  it("renders AddDeployKey step and validates state transitions", () => {
    render(<ConnectInitialize {...defaultProps} />);

    completeChooseProviderStep();
    completeGenerateSSHKeyStep();

    expect(
      screen.getByText("Add deploy key & give write access"),
    ).toBeInTheDocument();
  });

  it("calls connect on completing AddDeployKey step in connect mode", async () => {
    render(<ConnectInitialize {...defaultProps} />);
    completeChooseProviderStep();
    completeGenerateSSHKeyStep();
    completeAddDeployKeyStep();

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          remoteUrl: "git@example.com:user/repo.git",
          gitProfile: {
            authorName: "",
            authorEmail: "",
            useGlobalProfile: true,
          },
        }),
      );
    });
  });

  it("calls onSubmit on completing AddDeployKey step in import mode", async () => {
    render(<ConnectInitialize {...defaultProps} isImport />);
    completeChooseProviderStep(true);
    completeGenerateSSHKeyStep();
    completeAddDeployKeyStep();

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          remoteUrl: "git@example.com:user/repo.git",
          gitProfile: {
            authorName: "",
            authorEmail: "",
            useGlobalProfile: true,
          },
        }),
      );
    });
  });

  it("shows an error callout when an error occurs during connect", async () => {
    const mockConnect = jest.fn(() => {
      // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
      const connectError = {
        code: "AE-GIT-4033",
        message: "",
      };

      rerender(<ConnectInitialize {...defaultProps} error={connectError} />);
    });

    const { rerender } = render(
      <ConnectInitialize {...defaultProps} onSubmit={mockConnect} />,
    );

    completeChooseProviderStep();
    completeGenerateSSHKeyStep();

    expect(
      screen.queryByText("The repo you added isn't empty"),
    ).not.toBeInTheDocument();

    completeAddDeployKeyStep();

    await waitFor(() => {
      expect(
        screen.getByText("The repo you added isn't empty"),
      ).toBeInTheDocument();
    });
  });

  it("renders the previous step when Previous button is clicked", () => {
    render(<ConnectInitialize {...defaultProps} />);
    expect(
      screen.getByText("i. To begin with, choose your Git service provider"),
    ).toBeInTheDocument();
    completeChooseProviderStep();
    expect(
      screen.queryByText("i. To begin with, choose your Git service provider"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("t--git-connect-prev-button")); // Back to ChooseGitProvider step
    expect(
      screen.getByText("i. To begin with, choose your Git service provider"),
    ).toBeInTheDocument();
  });

  it("disables next button when form data is invalid in any step", () => {
    render(<ConnectInitialize {...defaultProps} />);
    const nextButton = screen.getByTestId("t--git-connect-next");

    fireEvent.click(nextButton); // Try to move to next step
    expect(nextButton).toBeDisabled();
  });

  it("renders loading state and removes buttons when connecting", () => {
    render(<ConnectInitialize {...defaultProps} isSubmitLoading />);
    expect(
      screen.getByText("Please wait while we connect to Git..."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("t--git-connect-next")).not.toBeInTheDocument();
  });
});
