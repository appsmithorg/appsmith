import React from "react";
import TabDeployView from "./TabDeployView";
import { useGitContext } from "git/components/GitContextProvider";
import useMetadata from "git/hooks/useMetadata";
import useBranches from "git/hooks/useBranches";
import useCommit from "git/hooks/useCommit";
import useDiscard from "git/hooks/useDiscard";
import usePull from "git/hooks/usePull";
import useStatus from "git/hooks/useStatus";
import type { GitApplicationArtifact } from "git/types";

export default function TabDeploy() {
  const { artifact } = useGitContext();
  const { clearCommitError, commit, commitError, isCommitLoading } =
    useCommit();

  const { clearDiscardError, discard, discardError, isDiscardLoading } =
    useDiscard();

  const { isPullLoading, pull, pullError } = usePull();
  const { isFetchStatusLoading, status } = useStatus();
  const { currentBranch } = useBranches();
  const { metadata } = useMetadata();

  // ! git tagging: need to handle last deplyed here when tagging is implemented
  const lastDeployedAt =
    (artifact as GitApplicationArtifact)?.lastDeployedAt ?? null;
  const isPullFailing = !!pullError;
  const statusIsClean = status?.isClean ?? false;
  const statusBehindCount = status?.behindCount ?? 0;
  const remoteUrl = metadata?.remoteUrl ?? null;

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
      lastDeployedAt={lastDeployedAt}
      pull={pull}
      remoteUrl={remoteUrl}
      statusBehindCount={statusBehindCount}
      statusIsClean={statusIsClean}
    />
  );
}
