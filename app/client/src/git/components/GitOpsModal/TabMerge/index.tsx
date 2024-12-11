import React from "react";
import DumbTabMerge from "./DumbTabMerge";
import { useGitContext } from "git/components/GitContextProvider";

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
    protectedBranches,
    status,
  } = useGitContext();

  const isStatusClean = status?.isClean ?? false;
  const isMergeStatusMergeable = mergeStatus?.isMergeAble ?? false;
  const mergeStatusConflictingFiles = mergeStatus?.conflictingFiles ?? null;
  const mergeStatusMessage = mergeStatus?.message ?? null;

  return (
    <DumbTabMerge
      branches={branches}
      clearMergeStatus={clearMergeStatus}
      currentBranch={currentBranch}
      fetchBranches={fetchBranches}
      fetchMergeStatus={fetchMergeStatus}
      isFetchBranchesLoading={fetchBranchesLoading}
      isFetchMergeStatusLoading={fetchMergeStatusLoading}
      isFetchStatusLoading={fetchStatusLoading}
      isMergeLoading={mergeLoading}
      isMergeStatusMergeable={isMergeStatusMergeable}
      isStatusClean={isStatusClean}
      merge={merge}
      mergeError={mergeError}
      mergeStatusConflictingFiles={mergeStatusConflictingFiles}
      mergeStatusMessage={mergeStatusMessage}
      protectedBranches={protectedBranches}
    />
  );
}
