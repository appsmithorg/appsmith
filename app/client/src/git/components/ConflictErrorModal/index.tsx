import React from "react";
import ConflictErrorModalView from "./ConflictErrorModalView";
import { useGitContext } from "../GitContextProvider";

export default function ConflictErrorModal() {
  const { conflictErrorModalOpen, toggleConflictErrorModal } = useGitContext();

  return (
    <ConflictErrorModalView
      isConflictErrorModalOpen={conflictErrorModalOpen}
      toggleConflictErrorModal={toggleConflictErrorModal}
    />
  );
}
