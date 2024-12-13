import React from "react";
import ConflictErrorModal from "./ConflictErrorModal";
import OpsModal from "./OpsModal";

export default function GitModals() {
  return (
    <>
      <OpsModal />
      <ConflictErrorModal />
    </>
  );
}
