import React from "react";
import CreateNewAppFromTemplatesModal from ".";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { useDispatch, useSelector } from "react-redux";
import { createAppFromTemplatesModalSelector } from "selectors/templatesSelectors";
import { hideCreateAppFromTemplatesModal } from "actions/templateActions";

interface Props {
  currentWorkspaceId: string;
}

const CreateNewAppFromTemplatesWrapper = ({ currentWorkspaceId }: Props) => {
  const isCreateAppFromTemplatesEnabled = useFeatureFlag(
    "release_show_create_app_from_templates_enabled",
  );
  const isOpen = useSelector(createAppFromTemplatesModalSelector);
  const dispatch = useDispatch();

  if (!isCreateAppFromTemplatesEnabled) return null;

  const handleClose = () => {
    dispatch(hideCreateAppFromTemplatesModal());
  };

  return (
    <CreateNewAppFromTemplatesModal
      currentWorkSpaceId={currentWorkspaceId}
      handleClose={handleClose}
      isOpen={isOpen}
    />
  );
};

export default CreateNewAppFromTemplatesWrapper;
