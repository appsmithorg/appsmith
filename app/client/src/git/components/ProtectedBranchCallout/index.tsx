import React from "react";
import ProtectedBranchCalloutView from "./ProtectedBranchCalloutView";
import useProtectedBranches from "git/hooks/useProtectedBranches";
import useCurrentBranch from "git/hooks/useCurrentBranch";
import useBranches from "git/hooks/useBranches";
import useProtectedMode from "git/hooks/useProtectedMode";

function ProtectedBranchCallout() {
  const isProtectedMode = useProtectedMode();
  const currentBranch = useCurrentBranch();
  const { toggleBranchPopup } = useBranches();
  const {
    isUpdateProtectedBranchesLoading,
    protectedBranches,
    updateProtectedBranches,
  } = useProtectedBranches();

  if (!isProtectedMode) {
    return null;
  }

  return (
    <ProtectedBranchCalloutView
      currentBranch={currentBranch}
      isUpdateProtectedBranchesLoading={isUpdateProtectedBranchesLoading}
      protectedBranches={protectedBranches}
      toggleBranchPopup={toggleBranchPopup}
      updateProtectedBranches={updateProtectedBranches}
    />
  );
}

export default ProtectedBranchCallout;
