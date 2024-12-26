import RemoteBranchListItem from "./RemoteBranchListItem";
import React from "react";
import { createMessage, REMOTE_BRANCHES } from "ee/constants/messages";
import { Text } from "@appsmith/ads";
import styled from "styled-components";
import noop from "lodash/noop";

const Heading = styled(Text)`
  font-weight: 600;
`;

interface RemoteBranchListProps {
  remoteBranches: string[];
  checkoutBranch: (branch: string) => void;
  checkoutDestBranch: string | null;
  isCheckoutBranchLoading: boolean;
}

export default function RemoteBranchList({
  checkoutBranch = noop,
  checkoutDestBranch = null,
  isCheckoutBranchLoading = false,
  remoteBranches = [],
}: RemoteBranchListProps) {
  return (
    <div data-testid="t--git-remote-branch-list-container">
      {remoteBranches?.length > 0 && (
        <Heading
          color="var(--ads-v2-color-fg-muted)"
          data-testid="t--branch-list-header-local"
          kind="heading-s"
        >
          {createMessage(REMOTE_BRANCHES)}
        </Heading>
      )}
      {remoteBranches.map((branch: string) => (
        <RemoteBranchListItem
          branch={branch}
          checkoutBranch={checkoutBranch}
          checkoutDestBranch={checkoutDestBranch}
          isCheckoutBranchLoading={isCheckoutBranchLoading}
          key={branch}
        />
      ))}
    </div>
  );
}
