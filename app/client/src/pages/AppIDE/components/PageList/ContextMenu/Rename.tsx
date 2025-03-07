import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { CONTEXT_RENAME, createMessage } from "ee/constants/messages";
import { useDispatch } from "react-redux";
import { initExplorerEntityNameEdit } from "actions/explorerActions";

interface Props {
  pageId: string;
  disabled?: boolean;
}

export const Rename = ({ disabled, pageId }: Props) => {
  const dispatch = useDispatch();
  const setRename = useCallback(() => {
    // We add a delay to avoid having the focus stuck in the menu trigger
    setTimeout(() => {
      dispatch(initExplorerEntityNameEdit(pageId));
    }, 100);
  }, [dispatch, pageId]);

  return (
    <MenuItem
      disabled={disabled}
      onSelect={setRename}
      startIcon="input-cursor-move"
    >
      {createMessage(CONTEXT_RENAME)}
    </MenuItem>
  );
};
