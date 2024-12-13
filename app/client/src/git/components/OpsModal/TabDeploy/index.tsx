import React from "react";
import TabDeployView from "./TabDeployView";
import { useGitContext } from "git/components/GitContextProvider";

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
    gitMetadata,
    pull,
    pullError,
    pullLoading,
    status,
  } = useGitContext();

  const lastDeployedAt = artifact?.lastDeployedAt ?? null;
  const isPullFailing = !!pullError;
  const statusIsClean = status?.isClean ?? false;
  const statusBehindCount = status?.behindCount ?? 0;
  const remoteUrl = gitMetadata?.remoteUrl ?? "";

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
