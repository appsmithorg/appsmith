import React from "react";
import TabDeployView from "./TabDeployView";
import useBranches from "git/hooks/useBranches";
import useCommit from "git/hooks/useCommit";
import useDiscard from "git/hooks/useDiscard";
import usePull from "git/hooks/usePull";
import useStatus from "git/hooks/useStatus";

export default function TabDeploy() {
  const { clearCommitError, commit, commitError, isCommitLoading } =
    useCommit();

  const { clearDiscardError, discard, discardError, isDiscardLoading } =
    useDiscard();

  const { isPullLoading, pull, pullError } = usePull();
  const { isFetchStatusLoading, status } = useStatus();
  const { currentBranch } = useBranches();

  const isPullFailing = !!pullError;
  const statusIsClean = status?.isClean ?? false;
  const statusBehindCount = status?.behindCount ?? 0;

  return (
    <TabDeployView
      clearCommitError={clearCommitError}
      clearDiscardError={clearDiscardError}
      commit={commit}
      commitError={commitError}
      currentBranch={currentBranch}
      discard={discard}
      discardError={discardError}
      isCommitLoading={isCommitLoading}
      isDiscardLoading={isDiscardLoading}
      isFetchStatusLoading={isFetchStatusLoading}
      isPullFailing={isPullFailing}
      isPullLoading={isPullLoading}
      pull={pull}
      statusBehindCount={statusBehindCount}
      statusIsClean={statusIsClean}
    />
  );
}
