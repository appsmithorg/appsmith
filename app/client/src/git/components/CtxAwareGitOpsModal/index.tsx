import React from "react";
import GitOpsModal from "../GitOpsModal";
import { useGitContext } from "../GitContextProvider";

export default function CtxAwareGitOpsModal() {
  const {
    gitMetadata,
    opsModalOpen,
    opsModalTab,
    protectedMode,
    toggleOpsModal,
  } = useGitContext();

  const repoName = gitMetadata?.repoName ?? null;

  return (
    <GitOpsModal
      isOpsModalOpen={opsModalOpen}
      isProtectedMode={protectedMode}
      opsModalTab={opsModalTab}
      repoName={repoName}
      toggleOpsModal={toggleOpsModal}
    />
  );
}
