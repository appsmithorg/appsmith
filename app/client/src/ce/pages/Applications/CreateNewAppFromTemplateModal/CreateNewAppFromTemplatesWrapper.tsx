import React from "react";
import CreateNewAppFromTemplatesModal from ".";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

interface Props {
  currentWorkspaceId: string;
  handleClose: () => void;
  isOpen: boolean;
}

const CreateNewAppFromTemplatesWrapper = ({
  currentWorkspaceId,
  handleClose,
  isOpen,
}: Props) => {
  const isCreateAppFromTemplatesEnabled = useFeatureFlag(
    "release_show_create_app_from_templates_enabled",
  );

  if (!isCreateAppFromTemplatesEnabled) return null;

  return (
    <CreateNewAppFromTemplatesModal
      currentWorkSpaceId={currentWorkspaceId}
      handleClose={handleClose}
      isOpen={isOpen}
    />
  );
};

export default CreateNewAppFromTemplatesWrapper;
