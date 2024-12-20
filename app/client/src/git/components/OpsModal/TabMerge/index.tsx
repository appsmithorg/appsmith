import React from "react";
import TabMergeView from "./TabMergeView";
import { useGitContext } from "git/components/GitContextProvider";
import useProtectedBranches from "git/hooks/useProtectedBranches";

export default function TabMerge() {
  const {
    branches,
    clearMergeStatus,
    currentBranch,
    fetchBranches,
    fetchBranchesLoading,
    fetchMergeStatus,
    fetchMergeStatusLoading,
    fetchStatusLoading,
    merge,
    mergeError,
    mergeLoading,
    mergeStatus,
    status,
  } = useGitContext();
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
      isFetchMergeStatusLoading={fetchMergeStatusLoading}
      isFetchStatusLoading={fetchStatusLoading}
      isMergeLoading={mergeLoading}
      isStatusClean={isStatusClean}
      merge={merge}
      mergeError={mergeError}
      mergeStatus={mergeStatus}
      protectedBranches={protectedBranches}
    />
  );
}
