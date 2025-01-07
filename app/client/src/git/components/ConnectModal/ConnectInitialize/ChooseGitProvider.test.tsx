import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ChooseGitProvider from "./ChooseGitProvider";
import "@testing-library/jest-dom";

// Mock the useDeviceDetect hook
jest.mock("utils/hooks/useDeviceDetect", () => ({
  useIsMobileDevice: () => false,
}));

// Helper function to wrap component with Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("ChooseGitProvider", () => {
  const defaultProps = {
    artifactType: "application",
    onChange: jest.fn(),
    onOpenImport: jest.fn(),
    value: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders git provider options", () => {
    renderWithRouter(<ChooseGitProvider {...defaultProps} />);

    expect(screen.getByText("Github")).toBeInTheDocument();
    expect(screen.getByText("Gitlab")).toBeInTheDocument();
    expect(screen.getByText("Bitbucket")).toBeInTheDocument();
    expect(screen.getByText("Others")).toBeInTheDocument();
  });

  it("calls onChange with selected git provider", () => {
    renderWithRouter(<ChooseGitProvider {...defaultProps} />);

    const githubRadio = screen.getByTestId(
      "t--git-connect-provider-radio-github",
    );

    fireEvent.click(githubRadio);

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      gitProvider: "github",
    });
  });

  it("shows empty repo options when not in import mode", () => {
    renderWithRouter(<ChooseGitProvider {...defaultProps} />);

    expect(
      screen.getByText(
        /Do you have an existing empty repository to connect to Git/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--git-connect-empty-repo-yes"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--git-connect-empty-repo-no"),
    ).toBeInTheDocument();
  });

  it("calls onChange with empty repo selection", () => {
    renderWithRouter(
      <ChooseGitProvider {...defaultProps} value={{ gitProvider: "github" }} />,
    );

    const noRadio = screen.getByTestId("t--git-connect-empty-repo-no");

    fireEvent.click(noRadio);

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      gitEmptyRepoExists: "no",
    });
  });

  it("shows import checkbox when in import mode", () => {
    renderWithRouter(<ChooseGitProvider {...defaultProps} isImport />);

    const importCheckbox = screen.getByTestId(
      "t--git-import-existing-repo-checkbox",
    );

    expect(importCheckbox).toBeInTheDocument();

    fireEvent.click(importCheckbox);
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      gitExistingRepoExists: true,
    });
  });

  it("shows demo gif when non-empty repo is selected for supported providers", () => {
    renderWithRouter(
      <ChooseGitProvider
        {...defaultProps}
        value={{ gitProvider: "github", gitEmptyRepoExists: "no" }}
      />,
    );

    expect(
      screen.getByText(/How to create a new repository/i),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("Create an empty repo in github"),
    ).toBeInTheDocument();
  });

  it("shows warning for non-empty repo with 'others' provider", () => {
    renderWithRouter(
      <ChooseGitProvider
        {...defaultProps}
        value={{ gitProvider: "others", gitEmptyRepoExists: "no" }}
      />,
    );

    expect(
      screen.getByText(
        /You need an empty repository to connect to Git on Appsmith, please create one on your Git service provider to continue/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows import callout when repo is not empty and onOpenImport is provided", () => {
    renderWithRouter(
      <ChooseGitProvider
        {...defaultProps}
        value={{ gitEmptyRepoExists: "no" }}
      />,
    );

    expect(screen.getByText(/Import via git/i)).toBeInTheDocument();
  });
});
