import React from "react";
import DumbGitOpsModal from "./DumbGitOpsModal";
import { useGitContext } from "../GitContextProvider";

export default function GitOpsModal() {
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
    <DumbGitOpsModal
      fetchStatus={fetchStatus}
      isOpsModalOpen={opsModalOpen}
      isProtectedMode={protectedMode}
      opsModalTab={opsModalTab}
      repoName={repoName}
      toggleOpsModal={toggleOpsModal}
    />
  );
}
