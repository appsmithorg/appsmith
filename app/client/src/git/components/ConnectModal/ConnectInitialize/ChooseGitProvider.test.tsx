/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { GIT_DEMO_GIF } from "./constants";
import "@testing-library/jest-dom";
import ChooseGitProvider, { type GitProvider } from "./ChooseGitProvider";
import { BrowserRouter as Router } from "react-router-dom";

jest.mock("utils/hooks/useDeviceDetect", () => ({
  useIsMobileDevice: jest.fn(() => false),
}));

const defaultProps = {
  artifactId: "123",
  artifactType: "application",
  onChange: jest.fn(),
  onImportFromCalloutLinkClick: jest.fn(),
  value: {
    gitProvider: undefined as GitProvider | undefined,
    gitEmptyRepoExists: "",
    gitExistingRepoExists: false,
  },
  isImport: false,
  canCreateNewArtifact: true,
  toggleConnectModal: jest.fn(),
  onOpenImport: jest.fn(),
};

describe("ChooseGitProvider Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component and initial fields", () => {
    render(<ChooseGitProvider {...defaultProps} />);
    expect(screen.getByText("Choose a Git provider")).toBeInTheDocument();
    expect(
      screen.getByText("i. To begin with, choose your Git service provider"),
    ).toBeInTheDocument();

    // Provider radios
    expect(
      screen.getByTestId("t--git-provider-radio-github"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--git-provider-radio-gitlab"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--git-provider-radio-bitbucket"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("t--git-provider-radio-others"),
    ).toBeInTheDocument();
  });

  it("allows selecting a git provider and updates state via onChange", () => {
    const onChange = jest.fn();

    render(<ChooseGitProvider {...defaultProps} onChange={onChange} />);

    const githubRadio = screen.getByTestId("t--git-provider-radio-github");

    fireEvent.click(githubRadio);
    expect(onChange).toHaveBeenCalledWith({ gitProvider: "github" });
  });

  it("disables the second question (empty repo) if no git provider selected", () => {
    render(<ChooseGitProvider {...defaultProps} />);
    // The empty repo radios should be disabled initially
    const yesRadio = screen.getByTestId(
      "t--existing-empty-repo-yes",
    ) as HTMLInputElement;
    const noRadio = screen.getByTestId(
      "t--existing-empty-repo-no",
    ) as HTMLInputElement;

    expect(yesRadio).toBeDisabled();
    expect(noRadio).toBeDisabled();
  });

  it("enables empty repo question after provider is selected", () => {
    const onChange = jest.fn();

    render(
      <ChooseGitProvider
        {...defaultProps}
        onChange={onChange}
        value={{ gitProvider: "github" }}
      />,
    );

    const yesRadio = screen.getByTestId(
      "t--existing-empty-repo-yes",
    ) as HTMLInputElement;
    const noRadio = screen.getByTestId(
      "t--existing-empty-repo-no",
    ) as HTMLInputElement;

    expect(yesRadio).not.toBeDisabled();
    expect(noRadio).not.toBeDisabled();
  });

  it("calls onChange when empty repo question changes", () => {
    const onChange = jest.fn();

    render(
      <ChooseGitProvider
        {...defaultProps}
        onChange={onChange}
        value={{ gitProvider: "github" }}
      />,
    );
    fireEvent.click(screen.getByTestId("t--existing-empty-repo-no"));
    expect(onChange).toHaveBeenCalledWith({ gitEmptyRepoExists: "no" });
  });

  it("displays the collapsible instructions if gitEmptyRepoExists = no and provider != others", () => {
    render(
      <Router>
        <ChooseGitProvider
          {...defaultProps}
          value={{ gitProvider: "github", gitEmptyRepoExists: "no" }}
        />
      </Router>,
    );
    expect(
      screen.getByText("How to create a new repository?"),
    ).toBeInTheDocument();

    // Check if DemoImage is rendered
    const img = screen.getByAltText("Create an empty repo in github");

    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", GIT_DEMO_GIF.create_repo.github);
  });

  it("displays a warning callout if gitEmptyRepoExists = no and provider = others", () => {
    render(
      <Router>
        <ChooseGitProvider
          {...defaultProps}
          value={{ gitProvider: "others", gitEmptyRepoExists: "no" }}
        />
      </Router>,
    );
    expect(
      screen.getByText(
        "You need an empty repository to connect to Git on Appsmith, please create one on your Git service provider to continue.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the import callout if gitEmptyRepoExists = no and not in import mode", () => {
    render(
      <Router>
        <ChooseGitProvider
          {...defaultProps}
          value={{ gitProvider: "github", gitEmptyRepoExists: "no" }}
        />
      </Router>,
    );
    expect(
      screen.getByText(
        "If you already have an application connected to Git, you can import it to the workspace.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Import via git")).toBeInTheDocument();
  });

  it("clicking on 'Import via git' link calls onImportFromCalloutLinkClick", () => {
    const onOpenImport = jest.fn();

    render(
      <Router>
        <ChooseGitProvider
          {...defaultProps}
          onOpenImport={onOpenImport}
          value={{ gitProvider: "github", gitEmptyRepoExists: "no" }}
        />
      </Router>,
    );
    fireEvent.click(screen.getByText("Import via git"));
    expect(onOpenImport).toHaveBeenCalledTimes(1);
  });

  it("when isImport = true, shows a checkbox for existing repo", () => {
    render(<ChooseGitProvider {...defaultProps} isImport />);
    expect(screen.getByTestId("t--existing-repo-checkbox")).toBeInTheDocument();
    expect(
      screen.getByText(
        "I have an existing appsmith application connected to Git",
      ),
    ).toBeInTheDocument();
  });

  it("toggles existing repo checkbox and calls onChange", () => {
    const onChange = jest.fn();

    render(
      <ChooseGitProvider {...defaultProps} isImport onChange={onChange} />,
    );
    const checkbox = screen.getByTestId("t--existing-repo-checkbox");

    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith({ gitExistingRepoExists: true });
  });

  it("does not show second question if isImport = true", () => {
    render(<ChooseGitProvider {...defaultProps} isImport />);
    expect(
      screen.queryByText("ii. Does an empty repository exist?"),
    ).not.toBeInTheDocument();
  });

  it("respects canCreateNewArtifact and device conditions for links", () => {
    // If onOpenImport is null, "Import via git" should not appear even if conditions are met
    render(
      <ChooseGitProvider
        {...defaultProps}
        onOpenImport={null}
        value={{ gitProvider: "github", gitEmptyRepoExists: "no" }}
      />,
    );
    // This should be null because we have no permission to create new artifact
    expect(screen.queryByText("Import via git")).not.toBeInTheDocument();
  });

  it("if provider is not chosen and user tries to select empty repo option, it remains disabled", () => {
    render(<ChooseGitProvider {...defaultProps} />);
    const yesRadio = screen.getByTestId("t--existing-empty-repo-yes");

    fireEvent.click(yesRadio);
    // onChange should not be called because it's disabled
    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });
});
