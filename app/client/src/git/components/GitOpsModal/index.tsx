import React from "react";
import DumbGitOpsModal from "./DumbGitOpsModal";
import { useGitContext } from "../GitContextProvider";

export default function GitOpsModal() {
  const {
    gitMetadata,
    opsModalOpen,
    opsModalTab,
    protectedMode,
    toggleOpsModal,
  } = useGitContext();

  const repoName = gitMetadata?.repoName ?? null;

  return (
    <DumbGitOpsModal
      isOpsModalOpen={opsModalOpen}
      isProtectedMode={protectedMode}
      opsModalTab={opsModalTab}
      repoName={repoName}
      toggleOpsModal={toggleOpsModal}
    />
  );
}
