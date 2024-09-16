import React, { useEffect } from "react";
import CreateNewAppFromTemplatesModal from ".";
import { getIsReconnectingDatasourcesModalOpen } from "ee/selectors/entitiesSelector";
import { useSelector } from "react-redux";

interface Props {
  currentWorkspaceId: string;
  isOpen: boolean;
  onModalClose: () => void;
}

const CreateNewAppFromTemplatesWrapper = ({
  currentWorkspaceId,
  isOpen,
  onModalClose,
}: Props) => {
  const isReconnectingModalOpen = useSelector(
    getIsReconnectingDatasourcesModalOpen,
  );

  useEffect(() => {
    if (isReconnectingModalOpen) {
      onModalClose();
    }
  }, [isReconnectingModalOpen]);

  return (
    <CreateNewAppFromTemplatesModal
      currentWorkSpaceId={currentWorkspaceId}
      handleClose={onModalClose}
      isOpen={isOpen}
    />
  );
};

export default CreateNewAppFromTemplatesWrapper;
