/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { isValidGitRemoteUrl } from "../../utils";
import GenerateSSH from "./GenerateSSH";
import type { GitProvider } from "./ChooseGitProvider";
import "@testing-library/jest-dom";

jest.mock("../../utils", () => ({
  isValidGitRemoteUrl: jest.fn(),
}));

const defaultProps = {
  onChange: jest.fn(),
  value: {
    gitProvider: "github" as GitProvider,
    remoteUrl: "",
  },
  error: null,
};

describe("GenerateSSH Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the component correctly", () => {
    render(<GenerateSSH {...defaultProps} />);
    expect(screen.getByText("Generate SSH key")).toBeInTheDocument();
    expect(
      screen.getByTestId("git-connect-remote-url-input"),
    ).toBeInTheDocument();
  });

  it("renders an error callout when errorData has code 'AE-GIT-4033'", () => {
    const errorData = {
      message: "",
      code: "AE-GIT-4033",
    };

    render(<GenerateSSH {...defaultProps} error={errorData} />);
    expect(
      screen.getByText("The repo you added isn't empty"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Kindly create a new repository and provide its remote SSH URL here. We require an empty repository to continue.",
      ),
    ).toBeInTheDocument();
  });

  it("does not render error callout for other error codes", () => {
    const errorData = {
      message: "",
      code: "SOME_OTHER_ERROR",
    };

    render(<GenerateSSH {...defaultProps} error={errorData} />);
    expect(
      screen.queryByText("The repo you added isn't empty"),
    ).not.toBeInTheDocument();
  });

  it("handles remote URL input changes", () => {
    const onChange = jest.fn();

    render(<GenerateSSH {...defaultProps} onChange={onChange} />);
    const input = screen.getByTestId("git-connect-remote-url-input");

    fireEvent.change(input, {
      target: { value: "git@example.com:user/repo.git" },
    });
    expect(onChange).toHaveBeenCalledWith({
      remoteUrl: "git@example.com:user/repo.git",
    });
  });

  it("shows an error message if remote URL is invalid", async () => {
    (isValidGitRemoteUrl as jest.Mock).mockReturnValue(false);

    render(<GenerateSSH {...defaultProps} />);
    const input = screen.getByTestId("git-connect-remote-url-input");

    fireEvent.change(input, { target: { value: "invalid-url" } });
    fireEvent.blur(input); // Trigger validation

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid SSH URL of your repository"),
      ).toBeInTheDocument();
    });
  });

  it("does not show an error message for a valid remote URL", async () => {
    (isValidGitRemoteUrl as jest.Mock).mockReturnValue(true);

    render(<GenerateSSH {...defaultProps} />);
    const input = screen.getByTestId("git-connect-remote-url-input");

    fireEvent.change(input, {
      target: { value: "git@example.com:user/repo.git" },
    });
    fireEvent.blur(input); // Trigger validation

    await waitFor(() => {
      expect(
        screen.queryByText("Please enter a valid SSH URL of your repository"),
      ).not.toBeInTheDocument();
    });
  });

  it("renders the collapsible section if gitProvider is not 'others'", () => {
    render(<GenerateSSH {...defaultProps} />);
    expect(
      screen.getByText("How to copy & paste SSH remote URL"),
    ).toBeInTheDocument();
    expect(
      screen.getByAltText("Copy and paste remote url from github"),
    ).toBeInTheDocument();
  });

  it("does not render the collapsible section if gitProvider is 'others'", () => {
    render(
      <GenerateSSH
        {...defaultProps}
        value={{ gitProvider: "others", remoteUrl: "" }}
      />,
    );
    expect(
      screen.queryByText("How to copy & paste SSH remote URL"),
    ).not.toBeInTheDocument();
  });
});
