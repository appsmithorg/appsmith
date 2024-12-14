import React from "react";
import OpsModalView from "./OpsModalView";
import { useGitContext } from "../GitContextProvider";
import useProtectedBranches from "git/hooks/useProtectedBranches";
import useMetadata from "git/hooks/useMetadata";

export default function OpsModal() {
  const { fetchStatus, opsModalOpen, opsModalTab, toggleOpsModal } =
    useGitContext();
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
