import React from "react";
import GitOpsModal from "./GitOpsModal";
import GitConflictErrorModal from "./GitConflictErrorModal";

export default function GitModals() {
  return (
    <>
      <GitOpsModal />
      <GitConflictErrorModal />
    </>
  );
}
