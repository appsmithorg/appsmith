import React from "react";
import TabDeployView from "./TabDeployView";
import { useGitContext } from "git/components/GitContextProvider";
import useMetadata from "git/hooks/useMetadata";

export default function TabDeploy() {
  const {
    artifact,
    clearCommitError,
    clearDiscardError,
    commit,
    commitError,
    commitLoading,
    currentBranch,
    discard,
    discardError,
    discardLoading,
    fetchStatusLoading,
    pull,
    pullError,
    pullLoading,
    status,
  } = useGitContext();
  const { metadata } = useMetadata();

  const lastDeployedAt = artifact?.lastDeployedAt ?? null;
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
      isCommitLoading={commitLoading}
      isDiscardLoading={discardLoading}
      isFetchStatusLoading={fetchStatusLoading}
      isPullFailing={isPullFailing}
      isPullLoading={pullLoading}
      lastDeployedAt={lastDeployedAt}
      pull={pull}
      remoteUrl={remoteUrl}
      statusBehindCount={statusBehindCount}
      statusIsClean={statusIsClean}
    />
  );
}
