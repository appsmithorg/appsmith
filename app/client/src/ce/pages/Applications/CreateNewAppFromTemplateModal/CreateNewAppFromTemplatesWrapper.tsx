import React from "react";
import CreateNewAppFromTemplatesModal from ".";

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
  return (
    <CreateNewAppFromTemplatesModal
      currentWorkSpaceId={currentWorkspaceId}
      handleClose={onModalClose}
      isOpen={isOpen}
    />
  );
};

export default CreateNewAppFromTemplatesWrapper;
