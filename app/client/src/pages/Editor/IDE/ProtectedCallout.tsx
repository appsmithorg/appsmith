import React from "react";
import { Callout } from "design-system";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  setShowBranchPopupAction,
  updateGitProtectedBranchesInit,
} from "actions/gitSyncActions";
import { getIsUpdateProtectedBranchesLoading } from "selectors/gitSyncSelectors";
import {
  BRANCH_PROTECTION_CALLOUT_CREATE_BRANCH,
  BRANCH_PROTECTION_CALLOUT_MSG,
  BRANCH_PROTECTION_CALLOUT_UNPROTECT,
  BRANCH_PROTECTION_CALLOUT_UNPROTECT_LOADING,
  createMessage,
} from "@appsmith/constants/messages";

const StyledCallout = styled(Callout)`
  height: 70px;
  overflow-y: hidden;
`;

function ProtectedCallout() {
  const dispatch = useDispatch();
  const isLoading = useSelector(getIsUpdateProtectedBranchesLoading);

  const handleClickOnNewBranch = () => {
    dispatch(setShowBranchPopupAction(true));
  };

  const handleClickOnUnprotect = () => {
    dispatch(
      updateGitProtectedBranchesInit({
        protectedBranches: [],
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
          children: createMessage(BRANCH_PROTECTION_CALLOUT_CREATE_BRANCH),
          onClick: handleClickOnNewBranch,
        },
        {
          key: "unprotect",
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
