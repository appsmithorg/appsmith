import { hideCreateAppFromTemplatesModal } from "actions/templateActions";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { createAppFromTemplatesModalSelector } from "selectors/templatesSelectors";
import CreateNewAppFromTemplatesModal from ".";

interface Props {
  currentWorkspaceId: string;
}

const CreateNewAppFromTemplatesWrapper = ({ currentWorkspaceId }: Props) => {
  const isOpen = useSelector(createAppFromTemplatesModalSelector);
  const dispatch = useDispatch();

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
