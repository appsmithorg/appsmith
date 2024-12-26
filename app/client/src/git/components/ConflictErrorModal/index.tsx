import React from "react";
import ConflictErrorModalView from "./ConflictErrorModalView";
import useOps from "git/hooks/useOps";

export default function ConflictErrorModal() {
  const { conflictErrorModalOpen, toggleConflictErrorModal } = useOps();

  return (
    <ConflictErrorModalView
      isConflictErrorModalOpen={conflictErrorModalOpen}
      toggleConflictErrorModal={toggleConflictErrorModal}
    />
  );
}
