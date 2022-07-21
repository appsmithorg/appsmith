import SegmentHeader from "components/ads/ListSegmentHeader";
import { RemoteBranchListItem } from "./RemoteBranchListItem";
import React from "react";
import { createMessage, REMOTE_BRANCHES } from "@appsmith/constants/messages";

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
        <SegmentHeader
          data-testid="t--branch-list-header-remote"
          hideStyledHr
          title={createMessage(REMOTE_BRANCHES)}
        />
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
