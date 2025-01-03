import React from "react";
import ConflictErrorModalView from "./ConflictErrorModalView";
import useOps from "git/hooks/useOps";

export default function ConflictErrorModal() {
  const { isConflictErrorModalOpen, toggleConflictErrorModal } = useOps();

  return (
    <ConflictErrorModalView
      isConflictErrorModalOpen={isConflictErrorModalOpen}
      toggleConflictErrorModal={toggleConflictErrorModal}
    />
  );
}
