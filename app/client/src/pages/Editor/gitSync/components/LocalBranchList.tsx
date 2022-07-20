import SegmentHeader from "components/ads/ListSegmentHeader";
import { BranchListItem } from "./BranchListItem";
import { getIsActiveItem } from "../utils";
import React from "react";
import { createMessage, LOCAL_BRANCHES } from "@appsmith/constants/messages";

/**
 * LocalBranchList: returns a list of local branches
 * @param localBranches {string[]} branches that don't start with origin/
 * @param currentBranch {string | undefined} current checked out branch in backend
 * @param isCreateNewBranchInputValid {boolean}
 * @param activeHoverIndex {number} used to figure out which list item is being selected
 * @param defaultBranch {string | undefined} this is used to put DEFAULT tag on "master" branch, which is the default branch name in the backend
 * @param switchBranch {(branch: string) => never} dispatches ReduxActionTypes.SWITCH_GIT_BRANCH_INIT
 */
export function LocalBranchList(
  localBranches: string[],
  currentBranch: string | undefined,
  isCreateNewBranchInputValid: boolean,
  activeHoverIndex: number,
  defaultBranch: string | undefined,
  switchBranch: (branch: string) => void,
) {
  return (
    <div data-testid="t--git-local-branch-list-container">
      {localBranches?.length > 0 && (
        <SegmentHeader
          data-testid="t--branch-list-header-local"
          hideStyledHr
          title={createMessage(LOCAL_BRANCHES)}
        />
      )}
      {localBranches
        .map((branch: string, index: number) => ({
          branch,
          isActive: getIsActiveItem(
            isCreateNewBranchInputValid,
            activeHoverIndex,
            index,
          ),
        }))
        .map(({ branch, isActive }) => (
          <BranchListItem
            active={currentBranch === branch}
            branch={branch}
            isDefault={branch === defaultBranch}
            key={branch}
            onClick={() => switchBranch(branch)}
            selected={isActive}
            shouldScrollIntoView={isActive}
          />
        ))}
    </div>
  );
}
