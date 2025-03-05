import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { CONTEXT_PARTIAL_EXPORT, createMessage } from "ee/constants/messages";
import { useDispatch } from "react-redux";
import { openPartialExportModal } from "actions/widgetActions";

interface Props {
  disabled?: boolean;
  onItemSelected?: () => void;
}

export const PartialExport = ({ disabled, onItemSelected }: Props) => {
  const dispatch = useDispatch();

  const handlePartialExportClick = useCallback(() => {
    if (onItemSelected) onItemSelected();

    dispatch(openPartialExportModal(true));
  }, [onItemSelected, dispatch]);

  return (
    <MenuItem
      disabled={disabled}
      onSelect={handlePartialExportClick}
      startIcon="download"
    >
      {createMessage(CONTEXT_PARTIAL_EXPORT)}
    </MenuItem>
  );
};
