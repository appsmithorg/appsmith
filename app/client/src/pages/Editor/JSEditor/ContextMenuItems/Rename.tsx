import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { useDispatch } from "react-redux";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import { CONTEXT_RENAME, createMessage } from "ee/constants/messages";
import type { JSCollection } from "entities/JSCollection";

interface Props {
  jsAction: JSCollection;
  disabled?: boolean;
}

export const Rename = ({ disabled, jsAction }: Props) => {
  const dispatch = useDispatch();

  const setRename = useCallback(() => {
    // We add a delay to avoid having the focus stuck in the menu trigger
    setTimeout(() => {
      dispatch(initExplorerEntityNameEdit(jsAction.id));
    }, 100);
  }, [dispatch, jsAction.id]);

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
