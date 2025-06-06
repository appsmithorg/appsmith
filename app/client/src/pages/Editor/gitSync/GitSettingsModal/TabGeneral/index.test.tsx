/* eslint-disable jest/no-focused-tests */
import React from "react";
import { render, screen } from "test/testUtils";
import TabGeneral from ".";
import type { DefaultRootState } from "react-redux";

jest.mock("../../hooks/gitPermissionHooks", () => ({
  useHasConnectToGitPermission: () => false,
  useHasManageAutoCommitPermission: () => false,
}));

describe("GitSettings TabGeneral test for git admin disabled", () => {
  it("disconnect disabled when no permission", () => {
    const initialState: Partial<DefaultRootState> = {};

    render(<TabGeneral />, { initialState });
    expect(screen.queryByTestId("t--git-disconnect-btn")).toBe(null);
  });
});
