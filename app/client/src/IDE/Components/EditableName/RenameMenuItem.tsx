import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { useDispatch } from "react-redux";
import { setRenameEntity } from "actions/ideActions";
import { CONTEXT_RENAME, createMessage } from "ee/constants/messages";

interface Props {
  disabled?: boolean;
  entityId: string;
}

export const RenameMenuItem = ({ disabled, entityId }: Props) => {
  const dispatch = useDispatch();

  const setRename = useCallback(() => {
    // We add a delay to avoid having the focus stuck in the menu trigger
    setTimeout(() => {
      dispatch(setRenameEntity(entityId));
    }, 100);
  }, [dispatch, entityId]);

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
