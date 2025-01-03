import React from "react";
import OpsModalView from "./OpsModalView";
import useMetadata from "git/hooks/useMetadata";
import useStatus from "git/hooks/useStatus";
import useOps from "git/hooks/useOps";
import useProtectedMode from "git/hooks/useProtectedMode";
import { GitOpsTab } from "git/constants/enums";

export default function OpsModal() {
  const { isOpsModalOpen, opsModalTab, toggleOpsModal } = useOps();
  const { fetchStatus } = useStatus();
  const isProtectedMode = useProtectedMode();

  const { metadata } = useMetadata();

  const repoName = metadata?.repoName ?? null;

  return (
    <OpsModalView
      fetchStatus={fetchStatus}
      isOpsModalOpen={isOpsModalOpen}
      isProtectedMode={isProtectedMode}
      opsModalTab={opsModalTab ?? GitOpsTab.Deploy}
      repoName={repoName}
      toggleOpsModal={toggleOpsModal}
    />
  );
}
