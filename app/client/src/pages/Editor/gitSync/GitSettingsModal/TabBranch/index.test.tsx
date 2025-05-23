/* eslint-disable jest/no-focused-tests */
import React from "react";
import { render, screen } from "test/testUtils";
import TabBranch from ".";
import type { DefaultRootState } from "react-redux";

jest.mock("../../hooks/gitPermissionHooks", () => ({
  useHasManageProtectedBranchesPermission: () => false,
  useHasManageDefaultBranchPermission: () => false,
}));

describe("TabBranch test for git admin disabled", () => {
  it("Branch protection and default branch disabled when no permission", () => {
    const initialState: Partial<DefaultRootState> = {};

    render(<TabBranch />, { initialState });
    expect(screen.queryByTestId("t--git-protected-branches-select")).toBe(null);
    expect(screen.queryByTestId("t--git-default-branch-select")).toBe(null);
  });
});
