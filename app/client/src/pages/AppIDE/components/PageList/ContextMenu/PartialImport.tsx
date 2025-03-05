import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { CONTEXT_PARTIAL_IMPORT, createMessage } from "ee/constants/messages";
import { useDispatch } from "react-redux";
import { openPartialImportModal } from "ee/actions/applicationActions";

interface Props {
  disabled?: boolean;
  onItemSelected?: () => void;
}

export const PartialImport = ({ disabled, onItemSelected }: Props) => {
  const dispatch = useDispatch();

  const handlePartialImportClick = useCallback(() => {
    if (onItemSelected) onItemSelected();

    dispatch(openPartialImportModal(true));
  }, [onItemSelected, dispatch]);

  return (
    <MenuItem
      disabled={disabled}
      onSelect={handlePartialImportClick}
      startIcon="upload-cloud"
    >
      {createMessage(CONTEXT_PARTIAL_IMPORT)}
    </MenuItem>
  );
};
