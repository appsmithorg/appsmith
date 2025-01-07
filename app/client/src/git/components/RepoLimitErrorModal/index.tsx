import React from "react";
import RepoLimitErrorModalView from "./RepoLimitErrorModalView";
import { useGitContext } from "../GitContextProvider";
import useRepoLimitError from "git/hooks/useRepoLimitError";
import useDisconnect from "git/hooks/useDisconnect";

function RepoLimitErrorModal() {
  const { artifacts, fetchArtifacts, workspace } = useGitContext();
  const { isRepoLimitErrorModalOpen, toggleRepoLimitErrorModal } =
    useRepoLimitError();
  const { openDisconnectModal } = useDisconnect();

  const workspaceName = workspace?.name ?? null;

  return (
    <RepoLimitErrorModalView
      artifacts={artifacts}
      fetchArtifacts={fetchArtifacts}
      isRepoLimitErrorModalOpen={isRepoLimitErrorModalOpen}
      openDisconnectModal={openDisconnectModal}
      toggleRepoLimitErrorModal={toggleRepoLimitErrorModal}
      workspaceName={workspaceName}
    />
  );
}

export default RepoLimitErrorModal;
