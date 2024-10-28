import React, { useCallback } from "react";
import { MenuItem } from "@appsmith/ads";
import { useDispatch } from "react-redux";
import { setRenameEntity } from "actions/ideActions";

interface Props {
  disabled?: boolean;
  entityId: string;
}

export const RenameMenuItem = ({ disabled, entityId }: Props) => {
  const dispatch = useDispatch();

  const setRename = useCallback(() => {
    setTimeout(() => {
      dispatch(setRenameEntity(entityId));
    }, 100);
  }, [entityId]);

  return (
    <MenuItem
      disabled={disabled}
      onSelect={setRename}
      startIcon="input-cursor-move"
    >
      Rename
    </MenuItem>
  );
};
