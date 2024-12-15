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
  connect: jest.fn(),
  connectError: null,
  fetchSSHKey: jest.fn(),
  generateSSHKey: jest.fn(),
  gitImport: jest.fn(),
  isConnectLoading: false,
  isFetchSSHKeyLoading: false,
  isGenerateSSHKeyLoading: false,
  isGitImportLoading: false,
  isImport: false,
  sshPublicKey: "ssh-rsa AAAAB3...",
};

function completeChooseProviderStep(isImport = false) {
  fireEvent.click(screen.getByTestId("t--git-provider-radio-github"));

  if (isImport) {
    fireEvent.click(screen.getByTestId("t--existing-repo-checkbox"));
  } else {
    fireEvent.click(screen.getByTestId("t--existing-empty-repo-yes"));
  }

  fireEvent.click(screen.getByTestId("t--git-connect-next-button"));
}

function completeGenerateSSHKeyStep() {
  fireEvent.change(screen.getByTestId("git-connect-remote-url-input"), {
    target: { value: "git@example.com:user/repo.git" },
  });
  fireEvent.click(screen.getByTestId("t--git-connect-next-button"));
}

function completeAddDeployKeyStep() {
  fireEvent.click(screen.getByTestId("t--added-deploy-key-checkbox"));
  fireEvent.click(screen.getByTestId("t--git-connect-next-button"));
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
    expect(screen.getByTestId("t--git-connect-next-button")).toHaveTextContent(
      "Configure Git",
    );
  });

  it("disables the next button when form data is incomplete in ChooseGitProvider step", () => {
    render(<ConnectInitialize {...defaultProps} />);
    expect(screen.getByTestId("t--git-connect-next-button")).toBeDisabled();
  });

  it("navigates to the next step (GenerateSSH) and validates SSH URL input", () => {
    render(<ConnectInitialize {...defaultProps} />);

    completeChooseProviderStep();

    const sshInput = screen.getByTestId("git-connect-remote-url-input");

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
      expect(defaultProps.connect).toHaveBeenCalledWith(
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

  it("calls gitImport on completing AddDeployKey step in import mode", async () => {
    render(<ConnectInitialize {...defaultProps} isImport />);
    completeChooseProviderStep(true);
    completeGenerateSSHKeyStep();
    completeAddDeployKeyStep();

    await waitFor(() => {
      expect(defaultProps.gitImport).toHaveBeenCalledWith(
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

      rerender(
        <ConnectInitialize {...defaultProps} connectError={connectError} />,
      );
    });

    const { rerender } = render(
      <ConnectInitialize {...defaultProps} connect={mockConnect} />,
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
    const nextButton = screen.getByTestId("t--git-connect-next-button");

    fireEvent.click(nextButton); // Try to move to next step
    expect(nextButton).toBeDisabled();
  });

  it("renders loading state and removes buttons when connecting", () => {
    render(<ConnectInitialize {...defaultProps} isConnectLoading />);
    expect(
      screen.getByText("Please wait while we connect to Git..."),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("t--git-connect-next-button"),
    ).not.toBeInTheDocument();
  });
});
