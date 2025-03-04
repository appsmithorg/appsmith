import React from "react";
import { render } from "@testing-library/react";
import LatestCommitInfoView from "./LatestCommitInfoView";
import "@testing-library/jest-dom";

describe("LatestCommitInfoView", () => {
  it("renders correctly with all props", () => {
    const { getByText } = render(
      <LatestCommitInfoView
        authorName="John Doe"
        committedAt="2025-03-01"
        hash="abc123"
        message="Initial commit"
      />,
    );

    expect(getByText("Initial commit")).toBeInTheDocument();
    expect(getByText("John Doe committed 2025-03-01")).toBeInTheDocument();
    expect(getByText("abc123")).toBeInTheDocument();
  });

  it("renders correctly with null authorName", () => {
    const { getByText } = render(
      <LatestCommitInfoView
        authorName={null}
        committedAt="2025-03-01"
        hash="abc123"
        message="Initial commit"
      />,
    );

    expect(getByText("Initial commit")).toBeInTheDocument();
    expect(getByText("- committed 2025-03-01")).toBeInTheDocument();
    expect(getByText("abc123")).toBeInTheDocument();
  });

  it("renders correctly with null committedAt", () => {
    const { getByText } = render(
      <LatestCommitInfoView
        authorName="John Doe"
        committedAt={null}
        hash="abc123"
        message="Initial commit"
      />,
    );

    expect(getByText("Initial commit")).toBeInTheDocument();
    expect(getByText("John Doe committed -")).toBeInTheDocument();
    expect(getByText("abc123")).toBeInTheDocument();
  });

  it("renders correctly with null hash", () => {
    const { getByText } = render(
      <LatestCommitInfoView
        authorName="John Doe"
        committedAt="2025-03-01"
        hash={null}
        message="Initial commit"
      />,
    );

    expect(getByText("Initial commit")).toBeInTheDocument();
    expect(getByText("John Doe committed 2025-03-01")).toBeInTheDocument();
    expect(getByText("-")).toBeInTheDocument();
  });

  it("renders correctly with null message", () => {
    const { getByText } = render(
      <LatestCommitInfoView
        authorName="John Doe"
        committedAt="2025-03-01"
        hash="abc123"
        message={null}
      />,
    );

    expect(getByText("John Doe committed 2025-03-01")).toBeInTheDocument();
    expect(getByText("abc123")).toBeInTheDocument();
  });

  it("renders correctly with all null props", () => {
    const { getByText } = render(
      <LatestCommitInfoView
        authorName={null}
        committedAt={null}
        hash={null}
        message={null}
      />,
    );

    expect(getByText("- committed -")).toBeInTheDocument();
    expect(getByText("-")).toBeInTheDocument();
  });
});
