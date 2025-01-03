import React, { useCallback, useMemo } from "react";
import { Callout } from "@appsmith/ads";
import styled from "styled-components";
import {
  BRANCH_PROTECTION_CALLOUT_CREATE_BRANCH,
  BRANCH_PROTECTION_CALLOUT_MSG,
  BRANCH_PROTECTION_CALLOUT_UNPROTECT,
  BRANCH_PROTECTION_CALLOUT_UNPROTECT_LOADING,
  createMessage,
} from "ee/constants/messages";
import { noop } from "lodash";
import type { FetchProtectedBranchesResponseData } from "git/requests/fetchProtectedBranchesRequest.types";

export const PROTECTED_CALLOUT_HEIGHT = 70;

const StyledCallout = styled(Callout)`
  height: ${PROTECTED_CALLOUT_HEIGHT}px;
  overflow-y: hidden;
`;

interface ProtectedBranchCalloutViewProps {
  currentBranch: string | null;
  isUpdateProtectedBranchesLoading: boolean;
  protectedBranches: FetchProtectedBranchesResponseData | null;
  toggleBranchPopup: (isOpen: boolean) => void;
  updateProtectedBranches: (branches: string[]) => void;
}

function ProtectedBranchCalloutView({
  currentBranch = null,
  isUpdateProtectedBranchesLoading = false,
  protectedBranches = null,
  toggleBranchPopup = noop,
  updateProtectedBranches = noop,
}: ProtectedBranchCalloutViewProps) {
  const handleClickOnNewBranch = useCallback(() => {
    toggleBranchPopup(true);
  }, [toggleBranchPopup]);

  const handleClickOnUnprotect = useCallback(() => {
    const allBranches = protectedBranches || [];
    const remainingBranches = allBranches.filter(
      (protectedBranch) => protectedBranch !== currentBranch,
    );

    updateProtectedBranches(remainingBranches);
  }, [currentBranch, protectedBranches, updateProtectedBranches]);

  const links = useMemo(
    () => [
      {
        key: "create-branch",
        "data-testid": "t--git-protected-create-branch-cta",
        children: createMessage(BRANCH_PROTECTION_CALLOUT_CREATE_BRANCH),
        onClick: handleClickOnNewBranch,
      },
      {
        key: "unprotect",
        "data-testid": "t--git-protected-unprotect-branch-cta",
        children: isUpdateProtectedBranchesLoading
          ? createMessage(BRANCH_PROTECTION_CALLOUT_UNPROTECT_LOADING)
          : createMessage(BRANCH_PROTECTION_CALLOUT_UNPROTECT),
        onClick: handleClickOnUnprotect,
        isDisabled: isUpdateProtectedBranchesLoading,
      },
    ],
    [
      handleClickOnNewBranch,
      handleClickOnUnprotect,
      isUpdateProtectedBranchesLoading,
    ],
  );

  return (
    <StyledCallout
      data-testid="t--git-protected-branch-callout"
      kind="info"
      links={links}
    >
      {createMessage(BRANCH_PROTECTION_CALLOUT_MSG)}
    </StyledCallout>
  );
}

export default ProtectedBranchCalloutView;
