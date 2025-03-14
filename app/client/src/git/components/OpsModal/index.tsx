import React from "react";
import OpsModalView from "./OpsModalView";
import useMetadata from "git/hooks/useMetadata";
import useStatus from "git/hooks/useStatus";
import useOps from "git/hooks/useOps";
import useProtectedMode from "git/hooks/useProtectedMode";
import { GitOpsTab } from "git/constants/enums";
import { useGitContext } from "../GitContextProvider";

export default function OpsModal() {
  const { artifactDef } = useGitContext();
  const { isOpsModalOpen, opsModalTab, toggleOpsModal } = useOps();
  const { fetchStatus } = useStatus();
  const isProtectedMode = useProtectedMode();

  const { metadata } = useMetadata();

  const repoName = metadata?.repoName ?? null;

  return (
    <OpsModalView
      artifactDef={artifactDef}
      fetchStatus={fetchStatus}
      isOpsModalOpen={isOpsModalOpen}
      isProtectedMode={isProtectedMode}
      opsModalTab={opsModalTab ?? GitOpsTab.Deploy}
      repoName={repoName}
      toggleOpsModal={toggleOpsModal}
    />
  );
}
