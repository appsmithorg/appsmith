import LocalBranchListItem from "./LocalBranchListItem";
import React from "react";
import { createMessage, LOCAL_BRANCHES } from "ee/constants/messages";
import { Text } from "@appsmith/ads";
import type { FetchProtectedBranchesResponseData } from "git/requests/fetchProtectedBranchesRequest.types";
import noop from "lodash/noop";
import styled from "styled-components";

const Heading = styled(Text)`
  font-weight: 600;
`;

interface LocalBranchListProps {
  activeHoverIndex: number;
  checkoutBranch: (branch: string) => void;
  checkoutDestBranch: string | null;
  currentBranch: string | null;
  defaultBranch: string | null;
  deleteBranch: (branch: string) => void;
  isCreateNewBranchInputValid: boolean;
  isCheckoutBranchLoading: boolean;
  localBranches: string[];
  protectedBranches: FetchProtectedBranchesResponseData | null;
}

export default function LocalBranchList({
  activeHoverIndex = 0,
  checkoutBranch = noop,
  checkoutDestBranch = null,
  currentBranch = null,
  defaultBranch = null,
  deleteBranch = noop,
  isCheckoutBranchLoading = false,
  isCreateNewBranchInputValid = false,
  localBranches = [],
  protectedBranches = null,
}: LocalBranchListProps) {
  return (
    <div data-testid="t--git-local-branch-list-container">
      {localBranches?.length > 0 && (
        <Heading
          color="var(--ads-v2-color-fg-muted)"
          data-testid="t--branch-list-header-local"
          kind="heading-s"
        >
          {createMessage(LOCAL_BRANCHES)}
        </Heading>
      )}
      {localBranches.map((branch: string, index: number) => {
        const isActive =
          (isCreateNewBranchInputValid
            ? activeHoverIndex - 1
            : activeHoverIndex) === index;

        return (
          <LocalBranchListItem
            branch={branch}
            checkoutBranch={checkoutBranch}
            checkoutDestBranch={checkoutDestBranch}
            currentBranch={currentBranch}
            defaultBranch={defaultBranch}
            deleteBranch={deleteBranch}
            isActive={currentBranch === branch}
            isCheckoutBranchLoading={isCheckoutBranchLoading}
            isDefault={branch === defaultBranch}
            isProtected={protectedBranches?.includes(branch) ?? false}
            isSelected={isActive}
            key={branch}
            shouldScrollIntoView={isActive}
          />
        );
      })}
    </div>
  );
}
