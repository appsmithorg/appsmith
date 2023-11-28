/* eslint-disable jest/no-focused-tests */
import React from "react";
import { render, screen } from "test/testUtils";
import GitSettings from ".";
import type { AppState } from "@appsmith/reducers";

jest.mock("../../hooks/useIsGitAdmin", () => ({
  useIsGitAdmin: () => false,
}));

describe("GitSettings test for git admin disabled", () => {
  it("Branch protection, default branch and disconnect disabled when not ", () => {
    const initialState: Partial<AppState> = {};
    render(<GitSettings />, { initialState });
    expect(screen.queryByTestId("t--git-protected-branches-select")).toBe(null);
    expect(screen.queryByTestId("t--git-default-branch-select")).toBe(null);
    expect(screen.queryByTestId("t--git-disconnect-btn")).toBe(null);
  });
});
