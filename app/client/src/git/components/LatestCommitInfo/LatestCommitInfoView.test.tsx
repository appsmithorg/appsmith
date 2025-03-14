import React from "react";
import { render } from "@testing-library/react";
import LatestCommitInfoView from "./LatestCommitInfoView";
import "@testing-library/jest-dom";

describe("LatestCommitInfoView", () => {
  const currentTimestamp = Math.floor((Date.now() - 3600000) / 1000);

  it("renders correctly with all props", () => {
    const { getByTestId } = render(
      <LatestCommitInfoView
        authorName="John Doe"
        committedAt={currentTimestamp}
        hash="abc123"
        isLoading={false}
        message="Initial commit"
      />,
    );

    expect(getByTestId("t--git-latest-commit-message")).toHaveTextContent(
      "Initial commit",
    );
    expect(getByTestId("t--git-latest-commit-commited-by")).toHaveTextContent(
      "John Doe committed 1 hr ago",
    );
    expect(getByTestId("t--git-latest-commit-hash")).toHaveTextContent(
      "abc123",
    );
  });

  it("renders correctly with null authorName", () => {
    const { getByTestId, queryByTestId } = render(
      <LatestCommitInfoView
        authorName={null}
        committedAt={currentTimestamp}
        hash="abc123"
        isLoading={false}
        message="Initial commit"
      />,
    );

    expect(
      queryByTestId("t--git-latest-commit-commited-by"),
    ).not.toBeInTheDocument();
    expect(getByTestId("t--git-latest-commit-message")).toHaveTextContent(
      "Initial commit",
    );
  });

  it("renders correctly with null committedAt", () => {
    const { getByTestId } = render(
      <LatestCommitInfoView
        authorName="John Doe"
        committedAt={null}
        hash="abc123"
        isLoading={false}
        message="Initial commit"
      />,
    );

    expect(getByTestId("t--git-latest-commit-message")).toHaveTextContent(
      "Initial commit",
    );
    expect(getByTestId("t--git-latest-commit-commited-by")).toHaveTextContent(
      "Committed by John Doe",
    );
  });

  it("renders correctly with null hash", () => {
    const { getByTestId } = render(
      <LatestCommitInfoView
        authorName="John Doe"
        committedAt={currentTimestamp}
        hash={null}
        isLoading={false}
        message="Initial commit"
      />,
    );

    expect(getByTestId("t--git-latest-commit-message")).toHaveTextContent(
      "Initial commit",
    );
    expect(getByTestId("t--git-latest-commit-commited-by")).toHaveTextContent(
      "John Doe committed 1 hr ago",
    );
    expect(getByTestId("t--git-latest-commit-hash")).toHaveTextContent("-");
  });

  it("renders correctly with null message", () => {
    const { getByTestId } = render(
      <LatestCommitInfoView
        authorName="John Doe"
        committedAt={currentTimestamp}
        hash="abc123"
        isLoading={false}
        message={null}
      />,
    );

    expect(getByTestId("t--git-latest-commit-message")).toHaveTextContent(
      "No commit message found",
    );
    expect(getByTestId("t--git-latest-commit-commited-by")).toHaveTextContent(
      "John Doe committed 1 hr ago",
    );
    expect(getByTestId("t--git-latest-commit-hash")).toHaveTextContent(
      "abc123",
    );
  });

  it("renders correctly with all null props", () => {
    const { queryByTestId } = render(
      <LatestCommitInfoView
        authorName={null}
        committedAt={null}
        hash={null}
        isLoading={false}
        message={null}
      />,
    );

    expect(
      queryByTestId("t--git-latest-commit-commited-by"),
    ).not.toBeInTheDocument();
    expect(queryByTestId("t--git-latest-commit-message")).toHaveTextContent(
      "No commit message found",
    );
    expect(queryByTestId("t--git-latest-commit-hash")).toHaveTextContent("-");
  });

  it("renders loading state correctly", () => {
    const { getByTestId } = render(
      <LatestCommitInfoView
        authorName="John Doe"
        committedAt={currentTimestamp}
        hash="abc123"
        isLoading
        message="Initial commit"
      />,
    );

    expect(getByTestId("t--git-latest-commit-loading")).toHaveTextContent(
      "Fetching latest commit...",
    );
  });
});
