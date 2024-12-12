import React from "react";
import DumbGitConflictErrorModal from "./DumbGitConflictErrorModal";
import { useGitContext } from "../GitContextProvider";

export default function GitConflictErrorModal() {
  const { conflictErrorModalOpen, toggleConflictErrorModal } = useGitContext();

  return (
    <DumbGitConflictErrorModal
      isConfictErrorModalOpen={conflictErrorModalOpen}
      toggleConflictErrorModal={toggleConflictErrorModal}
    />
  );
}
