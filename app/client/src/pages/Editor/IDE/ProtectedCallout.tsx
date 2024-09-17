import React from "react";
import { Callout } from "@appsmith/ads";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  setShowBranchPopupAction,
  updateGitProtectedBranchesInit,
} from "actions/gitSyncActions";
import {
  getCurrentGitBranch,
  getIsUpdateProtectedBranchesLoading,
  getProtectedBranchesSelector,
} from "selectors/gitSyncSelectors";
import {
  BRANCH_PROTECTION_CALLOUT_CREATE_BRANCH,
  BRANCH_PROTECTION_CALLOUT_MSG,
  BRANCH_PROTECTION_CALLOUT_UNPROTECT,
  BRANCH_PROTECTION_CALLOUT_UNPROTECT_LOADING,
  createMessage,
} from "ee/constants/messages";

export const PROTECTED_CALLOUT_HEIGHT = 70;

const StyledCallout = styled(Callout)`
  height: ${PROTECTED_CALLOUT_HEIGHT}px;
  overflow-y: hidden;
`;

function ProtectedCallout() {
  const dispatch = useDispatch();
  const isLoading = useSelector(getIsUpdateProtectedBranchesLoading);
  const currentBranch = useSelector(getCurrentGitBranch);
  const protectedBranches = useSelector(getProtectedBranchesSelector);

  const handleClickOnNewBranch = () => {
    dispatch(setShowBranchPopupAction(true));
  };

  const handleClickOnUnprotect = () => {
    const remainingBranches = protectedBranches.filter(
      (protectedBranch) => protectedBranch !== currentBranch,
    );
    dispatch(
      updateGitProtectedBranchesInit({
        protectedBranches: remainingBranches,
      }),
    );
  };

  return (
    // @ts-expect-error Key is valid but does not exist in CalloutProps
    <StyledCallout
      data-testid="t--git-protected-branch-callout"
      kind="info"
      links={[
        {
          key: "create-branch",
          "data-testid": "t--git-protected-create-branch-cta",
          children: createMessage(BRANCH_PROTECTION_CALLOUT_CREATE_BRANCH),
          onClick: handleClickOnNewBranch,
        },
        {
          key: "unprotect",
          "data-testid": "t--git-protected-unprotect-branch-cta",
          children: isLoading
            ? createMessage(BRANCH_PROTECTION_CALLOUT_UNPROTECT_LOADING)
            : createMessage(BRANCH_PROTECTION_CALLOUT_UNPROTECT),
          onClick: handleClickOnUnprotect,
          isDisabled: isLoading,
        },
      ]}
    >
      {createMessage(BRANCH_PROTECTION_CALLOUT_MSG)}
    </StyledCallout>
  );
}

export default ProtectedCallout;
