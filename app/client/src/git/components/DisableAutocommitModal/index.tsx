import React from "react";
import DisableAutocommitModalView from "./DisableAutocommitModalView";
import useAutocommit from "git/hooks/useAutocommit";

function DisableAutocommitModal() {
  const {
    isAutocommitDisableModalOpen,
    isToggleAutocommitLoading,
    toggleAutocommit,
    toggleAutocommitDisableModal,
  } = useAutocommit();

  return (
    <DisableAutocommitModalView
      isAutocommitDisableModalOpen={isAutocommitDisableModalOpen}
      isToggleAutocommitLoading={isToggleAutocommitLoading}
      toggleAutocommit={toggleAutocommit}
      toggleAutocommitDisableModal={toggleAutocommitDisableModal}
    />
  );
}

export default DisableAutocommitModal;
