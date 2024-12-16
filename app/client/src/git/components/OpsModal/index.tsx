import React from "react";
import OpsModalView from "./OpsModalView";
import { useGitContext } from "../GitContextProvider";

export default function OpsModal() {
  const {
    fetchStatus,
    gitMetadata,
    opsModalOpen,
    opsModalTab,
    protectedMode,
    toggleOpsModal,
  } = useGitContext();

  const repoName = gitMetadata?.repoName ?? null;

  return (
    <OpsModalView
      fetchStatus={fetchStatus}
      isOpsModalOpen={opsModalOpen}
      isProtectedMode={protectedMode}
      opsModalTab={opsModalTab}
      repoName={repoName}
      toggleOpsModal={toggleOpsModal}
    />
  );
}
