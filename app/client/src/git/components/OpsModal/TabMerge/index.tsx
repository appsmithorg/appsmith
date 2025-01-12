import React from "react";
import TabMergeView from "./TabMergeView";
import useProtectedBranches from "git/hooks/useProtectedBranches";
import useBranches from "git/hooks/useBranches";
import useMerge from "git/hooks/useMerge";
import useStatus from "git/hooks/useStatus";

export default function TabMerge() {
  const {
    clearMergeStatus,
    fetchMergeStatus,
    isFetchMergeStatusLoading,
    isMergeLoading,
    isMergeSuccess,
    merge,
    mergeError,
    mergeStatus,
    resetMergeState,
  } = useMerge();
  const { isFetchStatusLoading, status } = useStatus();
  const { branches, currentBranch, fetchBranches, isFetchBranchesLoading } =
    useBranches();
  const { protectedBranches } = useProtectedBranches();

  const isStatusClean = status?.isClean ?? false;

  return (
    <TabMergeView
      branches={branches}
      clearMergeStatus={clearMergeStatus}
      currentBranch={currentBranch}
      fetchBranches={fetchBranches}
      fetchMergeStatus={fetchMergeStatus}
      isFetchBranchesLoading={isFetchBranchesLoading}
      isFetchMergeStatusLoading={isFetchMergeStatusLoading}
      isFetchStatusLoading={isFetchStatusLoading}
      isMergeLoading={isMergeLoading}
      isMergeSuccess={isMergeSuccess}
      isStatusClean={isStatusClean}
      merge={merge}
      mergeError={mergeError}
      mergeStatus={mergeStatus}
      protectedBranches={protectedBranches}
      resetMergeState={resetMergeState}
    />
  );
}
