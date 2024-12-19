import React from "react";
import BranchListView from "./BranchListView";
import useBranches from "git/hooks/useBranches";
import useDefaultBranch from "git/ee/hooks/useDefaultBranch";
import useProtectedBranches from "git/hooks/useProtectedBranches";

function BranchList() {
  const {
    branches,
    checkoutBranch,
    checkoutDestBranch,
    createBranch,
    currentBranch,
    deleteBranch,
    fetchBranches,
    isCheckoutBranchLoading,
    isCreateBranchLoading,
    isFetchBranchesLoading,
    toggleBranchPopup,
  } = useBranches();
  const { defaultBranch } = useDefaultBranch();
  const {
    fetchProtectedBranches,
    isFetchProtectedBranchesLoading,
    protectedBranches,
  } = useProtectedBranches();

  return (
    <BranchListView
      branches={branches}
      checkoutBranch={checkoutBranch}
      checkoutDestBranch={checkoutDestBranch}
      createBranch={createBranch}
      currentBranch={currentBranch}
      defaultBranch={defaultBranch}
      deleteBranch={deleteBranch}
      fetchBranches={fetchBranches}
      fetchProtectedBranches={fetchProtectedBranches}
      isCheckoutBranchLoading={isCheckoutBranchLoading}
      isCreateBranchLoading={isCreateBranchLoading}
      isFetchBranchesLoading={isFetchBranchesLoading}
      isFetchProtectedBranchesLoading={isFetchProtectedBranchesLoading}
      protectedBranches={protectedBranches}
      toggleBranchPopup={toggleBranchPopup}
    />
  );
}

export default BranchList;
