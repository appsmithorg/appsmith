import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { AddDeployKeyProps } from "./AddDeployKey";
import AddDeployKey from "./AddDeployKey";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import "@testing-library/jest-dom";

jest.mock("ee/utils/AnalyticsUtil", () => ({
  logEvent: jest.fn(),
}));

jest.mock("copy-to-clipboard", () => ({
  __esModule: true,
  default: () => true,
}));

const DEFAULT_DOCS_URL =
  "https://docs.appsmith.com/advanced-concepts/version-control-with-git/connecting-to-git-repository";

const defaultProps: AddDeployKeyProps = {
  isModalOpen: true,
  onChange: jest.fn(),
  value: {
    gitProvider: "github",
    isAddedDeployKey: false,
    remoteUrl: "git@github.com:owner/repo.git",
  },
  fetchSSHKeyPair: jest.fn(),
  generateSSHKey: jest.fn(),
  isFetchingSSHKeyPair: false,
  isGeneratingSSHKey: false,
  sshKeyPair: "ecdsa-sha2-nistp256 AAAAE2VjZHNhAAAIBaj...",
};

describe("AddDeployKey Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing and shows default UI", () => {
    render(<AddDeployKey {...defaultProps} />);
    expect(
      screen.getByText("Add deploy key & give write access"),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    // Should show ECDSA by default since sshKeyPair includes "ecdsa"
    expect(screen.getByText(defaultProps.sshKeyPair)).toBeInTheDocument();
    expect(
      screen.getByText("I've added the deploy key and gave it write access"),
    ).toBeInTheDocument();
  });

  it("calls fetchSSHKeyPair if modal is open and not importing", () => {
    render(<AddDeployKey {...defaultProps} isImport={false} />);
    expect(defaultProps.fetchSSHKeyPair).toHaveBeenCalledTimes(1);
  });

  it("does not call fetchSSHKeyPair if importing", () => {
    render(<AddDeployKey {...defaultProps} isImport />);
    expect(defaultProps.fetchSSHKeyPair).not.toHaveBeenCalled();
  });

  it("shows dummy key loader if loading keys", () => {
    render(
      <AddDeployKey {...defaultProps} isFetchingSSHKeyPair sshKeyPair="" />,
    );
    // The actual key text should not be displayed
    expect(screen.queryByText("ecdsa-sha2-nistp256")).not.toBeInTheDocument();
  });

  it("changes SSH key type when user selects a different type and triggers generateSSHKey if needed", async () => {
    const generateSSHKey = jest.fn();

    render(
      <AddDeployKey
        {...defaultProps}
        generateSSHKey={generateSSHKey}
        sshKeyPair="" // No key to force generation
      />,
    );

    fireEvent.mouseDown(screen.getByRole("combobox"));
    const rsaOption = screen.getByText("RSA 4096");

    fireEvent.click(rsaOption);

    await waitFor(() => {
      expect(generateSSHKey).toHaveBeenCalledWith("RSA", expect.any(Object));
    });
  });

  it("displays a generic error when errorData is provided and error code is not AE-GIT-4032 or AE-GIT-4033", () => {
    // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
    const errorData = {
      data: {},
      responseMeta: {
        success: false,
        status: 503,
        error: {
          code: "GENERIC-ERROR",
          errorType: "Some Error",
          message: "Something went wrong",
        },
      },
    };

    render(<AddDeployKey {...defaultProps} errorData={errorData} />);
    expect(screen.getByText("Some Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("displays a misconfiguration error if error code is AE-GIT-4032", () => {
    // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
    const errorData = {
      data: {},
      responseMeta: {
        success: false,
        status: 503,
        error: {
          code: "AE-GIT-4032",
          errorType: "SSH Key Error",
          message: "SSH Key misconfiguration",
        },
      },
    };

    render(<AddDeployKey {...defaultProps} errorData={errorData} />);
    expect(screen.getByText("SSH key misconfiguration")).toBeInTheDocument();
    expect(
      screen.getByText(
        "It seems that your SSH key hasn't been added to your repository. To proceed, please revisit the steps below and configure your SSH key correctly.",
      ),
    ).toBeInTheDocument();
  });

  it("invokes onChange callback when checkbox is toggled", () => {
    const onChange = jest.fn();

    render(<AddDeployKey {...defaultProps} onChange={onChange} />);
    const checkbox = screen.getByTestId("t--added-deploy-key-checkbox");

    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith({ isAddedDeployKey: true });
  });

  it("calls AnalyticsUtil on copy button click", () => {
    render(<AddDeployKey {...defaultProps} />);
    const copyButton = screen.getByTestId("t--copy-generic");

    fireEvent.click(copyButton);
    expect(AnalyticsUtil.logEvent).toHaveBeenCalledWith(
      "GS_COPY_SSH_KEY_BUTTON_CLICK",
    );
  });

  it("hides copy button when connectLoading is true", () => {
    render(<AddDeployKey {...defaultProps} connectLoading />);
    expect(screen.queryByTestId("t--copy-generic")).not.toBeInTheDocument();
  });

  it("shows repository settings link if gitProvider is known and not 'others'", () => {
    render(<AddDeployKey {...defaultProps} />);
    const link = screen.getByRole("link", { name: "repository settings." });

    expect(link).toHaveAttribute(
      "href",
      "https://github.com/owner/repo/settings/keys",
    );
  });

  it("does not show repository link if gitProvider = 'others'", () => {
    render(
      <AddDeployKey
        {...defaultProps}
        value={{ gitProvider: "others", remoteUrl: "git@xyz.com:repo.git" }}
      />,
    );
    expect(
      screen.queryByRole("link", { name: "repository settings." }),
    ).not.toBeInTheDocument();
  });

  it("shows collapsible section if gitProvider is not 'others'", () => {
    render(
      <AddDeployKey
        {...defaultProps}
        // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
        value={{
          gitProvider: "gitlab",
          remoteUrl: "git@gitlab.com:owner/repo.git",
        }}
      />,
    );
    expect(
      screen.getByText("How to paste SSH Key in repo and give write access?"),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Add deploy key in gitlab")).toBeInTheDocument();
  });

  it("does not display collapsible if gitProvider = 'others'", () => {
    render(
      <AddDeployKey
        {...defaultProps}
        // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
        value={{ gitProvider: "others", remoteUrl: "git@xyz.com:repo.git" }}
      />,
    );
    expect(
      screen.queryByText("How to paste SSH Key in repo and give write access?"),
    ).not.toBeInTheDocument();
  });

  it("uses default documentation link if none provided", () => {
    render(<AddDeployKey {...defaultProps} />);
    const docsLink = screen.getByRole("link", { name: "Read Docs" });

    expect(docsLink).toHaveAttribute("href", DEFAULT_DOCS_URL);
  });

  it("uses custom documentation link if provided", () => {
    render(
      <AddDeployKey
        {...defaultProps}
        deployKeyDocUrl="https://custom-docs.com"
      />,
    );
    const docsLink = screen.getByRole("link", { name: "Read Docs" });

    expect(docsLink).toHaveAttribute("href", "https://custom-docs.com");
  });

  it("does not generate SSH key if modal is closed", () => {
    const generateSSHKey = jest.fn();

    render(
      <AddDeployKey
        {...defaultProps}
        generateSSHKey={generateSSHKey}
        isModalOpen={false}
        sshKeyPair=""
      />,
    );
    // Should not call generateSSHKey since modal is not open
    expect(generateSSHKey).not.toHaveBeenCalled();
  });

  it("generates SSH key if none is present and conditions are met", async () => {
    const fetchSSHKeyPair = jest.fn((props) => {
      props.onSuccessCallback && props.onSuccessCallback();
    });
    const generateSSHKey = jest.fn();

    render(
      <AddDeployKey
        {...defaultProps}
        fetchSSHKeyPair={fetchSSHKeyPair}
        generateSSHKey={generateSSHKey}
        isFetchingSSHKeyPair={false}
        isGeneratingSSHKey={false}
        sshKeyPair=""
      />,
    );

    expect(fetchSSHKeyPair).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(generateSSHKey).toHaveBeenCalledWith("ECDSA", expect.any(Object));
    });
  });
});
