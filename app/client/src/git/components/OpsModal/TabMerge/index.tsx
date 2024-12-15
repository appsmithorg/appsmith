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
    merge,
    mergeError,
    mergeStatus,
  } = useMerge();
  const { isFetchStatusLoading, status } = useStatus();
  const { branches, currentBranch, fetchBranches, fetchBranchesLoading } =
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
      isFetchBranchesLoading={fetchBranchesLoading}
      isFetchMergeStatusLoading={isFetchMergeStatusLoading}
      isFetchStatusLoading={isFetchStatusLoading}
      isMergeLoading={isMergeLoading}
      isStatusClean={isStatusClean}
      merge={merge}
      mergeError={mergeError}
      mergeStatus={mergeStatus}
      protectedBranches={protectedBranches}
    />
  );
}
