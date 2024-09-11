import { BranchListItem } from "./BranchListItem";
import { getIsActiveItem } from "../utils";
import React from "react";
import { createMessage, LOCAL_BRANCHES } from "ee/constants/messages";
import { Text } from "@appsmith/ads";

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
  protectedBranches: string[] = [],
) {
  return (
    <div data-testid="t--git-local-branch-list-container">
      {localBranches?.length > 0 && (
        <Text
          color="var(--ads-v2-color-fg-muted)"
          data-testid="t--branch-list-header-local"
          kind="heading-s"
          style={{ fontWeight: 600 }}
        >
          {createMessage(LOCAL_BRANCHES)}
        </Text>
      )}
      {localBranches.map((branch: string, index: number) => {
        const isActive = getIsActiveItem(
          isCreateNewBranchInputValid,
          activeHoverIndex,
          index,
        );
        return (
          <BranchListItem
            active={currentBranch === branch}
            branch={branch}
            isDefault={branch === defaultBranch}
            isProtected={protectedBranches.includes(branch)}
            key={branch}
            onClick={() => switchBranch(branch)}
            selected={isActive}
            shouldScrollIntoView={isActive}
          />
        );
      })}
    </div>
  );
}
