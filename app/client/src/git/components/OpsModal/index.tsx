import React from "react";
import OpsModalView from "./OpsModalView";
import useProtectedBranches from "git/hooks/useProtectedBranches";
import useMetadata from "git/hooks/useMetadata";
import useStatus from "git/hooks/useStatus";
import useOps from "git/hooks/useOps";

export default function OpsModal() {
  const { opsModalOpen, opsModalTab, toggleOpsModal } = useOps();
  const { fetchStatus } = useStatus();
  const { isProtectedMode } = useProtectedBranches();

  const { metadata } = useMetadata();

  const repoName = metadata?.repoName ?? null;

  return (
    <OpsModalView
      fetchStatus={fetchStatus}
      isOpsModalOpen={opsModalOpen}
      isProtectedMode={isProtectedMode}
      opsModalTab={opsModalTab}
      repoName={repoName}
      toggleOpsModal={toggleOpsModal}
    />
  );
}
