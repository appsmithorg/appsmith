import React from "react";
import OpsModalView from "./OpsModalView";
import { useGitContext } from "../GitContextProvider";
import useProtectedBranches from "git/hooks/useProtectedBranches";

export default function OpsModal() {
  const {
    fetchStatus,
    gitMetadata,
    opsModalOpen,
    opsModalTab,
    toggleOpsModal,
  } = useGitContext();
  const { isProtectedMode } = useProtectedBranches();

  const repoName = gitMetadata?.repoName ?? null;

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
