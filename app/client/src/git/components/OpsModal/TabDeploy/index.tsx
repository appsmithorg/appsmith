import React from "react";
import TabDeployView from "./TabDeployView";
import { useGitContext } from "git/components/GitContextProvider";
import useMetadata from "git/hooks/useMetadata";
import useBranches from "git/hooks/useBranches";
import useCommit from "git/hooks/useCommit";
import useDiscard from "git/hooks/useDiscard";
import usePull from "git/hooks/usePull";
import useRedeploy from "git/hooks/useRedeploy";
import useStatus from "git/hooks/useStatus";
import type { GitApplicationArtifact } from "git/types";

export default function TabDeploy() {
  const { artifact, artifactDef } = useGitContext();
  const { clearCommitError, commit, commitError, isCommitLoading } =
    useCommit();

  const { clearDiscardError, discard, discardError, isDiscardLoading } =
    useDiscard();

  const { isPullLoading, pull, pullError } = usePull();
  const { isRedeploying, redeploy } = useRedeploy();
  const { isFetchStatusLoading, status } = useStatus();
  const { currentBranch } = useBranches();
  const { metadata } = useMetadata();

  // ! git tagging: need to handle last deplyed here when tagging is implemented
  const lastDeployedAt =
    (artifact as GitApplicationArtifact)?.lastDeployedAt ?? null;
  const modifiedAt = (artifact as GitApplicationArtifact)?.modifiedAt ?? null;
  const isPullFailing = !!pullError;
  const statusIsClean = status?.isClean ?? false;
  const statusBehindCount = status?.behindCount ?? 0;
  const remoteUrl = metadata?.remoteUrl ?? null;

  return (
    <TabDeployView
      artifactType={artifactDef?.artifactType ?? null}
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
      isRedeploying={isRedeploying}
      lastDeployedAt={lastDeployedAt}
      modifiedAt={modifiedAt}
      pull={pull}
      redeploy={redeploy}
      remoteUrl={remoteUrl}
      statusBehindCount={statusBehindCount}
      statusIsClean={statusIsClean}
    />
  );
}
