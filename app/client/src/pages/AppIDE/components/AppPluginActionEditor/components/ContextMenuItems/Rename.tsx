import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import type { Action } from "entities/Action";
import { useDispatch } from "react-redux";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { CONTEXT_RENAME, createMessage } from "ee/constants/messages";

interface Props {
  action: Action;
  disabled?: boolean;
}

export const Rename = ({ action, disabled }: Props) => {
  const dispatch = useDispatch();

  const setRename = useCallback(() => {
    // We add a delay to avoid having the focus stuck in the menu trigger
    setTimeout(() => {
      dispatch(initExplorerEntityNameEdit(action.id));
    }, 100);
  }, [dispatch, action.id]);

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
