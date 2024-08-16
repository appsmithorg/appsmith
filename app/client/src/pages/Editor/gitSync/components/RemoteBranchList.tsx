import { RemoteBranchListItem } from "./RemoteBranchListItem";
import React from "react";
import { createMessage, REMOTE_BRANCHES } from "ee/constants/messages";
import { Text } from "@appsmith/ads";

/**
 * RemoteBranchList: returns a list of remote branches
 * @param remoteBranches {string[]} array of remote branch names
 * @param switchBranch {(branch: string) => void} dispatches ReduxActionTypes.SWITCH_GIT_BRANCH_INIT
 */
export function RemoteBranchList(
  remoteBranches: string[],
  switchBranch: (branch: string) => void,
) {
  return (
    <div data-testid="t--git-remote-branch-list-container">
      {remoteBranches?.length > 0 && (
        <Text
          color="var(--ads-v2-color-fg-muted)"
          data-testid="t--branch-list-header-local"
          kind="heading-s"
          style={{ fontWeight: 600 }}
        >
          {createMessage(REMOTE_BRANCHES)}
        </Text>
      )}
      {remoteBranches.map((branch: string) => (
        <RemoteBranchListItem
          branch={branch}
          key={branch}
          onClick={() => switchBranch(branch)}
        />
      ))}
    </div>
  );
}
