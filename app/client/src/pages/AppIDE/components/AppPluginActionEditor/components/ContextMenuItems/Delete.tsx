import React, { useCallback, useState } from "react";
import {
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_DELETE,
  createMessage,
} from "ee/constants/messages";
import { MenuItem } from "@appsmith/ads";
import { useDispatch } from "react-redux";
import { deleteAction } from "actions/pluginActionActions";
import type { Action } from "entities/Action";

interface Props {
  action: Action;
  disabled?: boolean;
}

export const Delete = ({ action, disabled }: Props) => {
  const dispatch = useDispatch();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = useCallback(
    ({ onSuccess }: { onSuccess?: () => void }) => {
      dispatch(
        deleteAction({
          id: action?.id ?? "",
          name: action?.name ?? "",
          onSuccess,
        }),
      );
    },
    [action.id, action.name, dispatch],
  );

  const handleSelect = useCallback(
    (e?: Event) => {
      e?.preventDefault();
      confirmDelete ? handleDeleteClick({}) : setConfirmDelete(true);
      e?.stopPropagation();
    },
    [confirmDelete, handleDeleteClick],
  );

  const menuLabel = confirmDelete
    ? createMessage(CONFIRM_CONTEXT_DELETE)
    : createMessage(CONTEXT_DELETE);

  return (
    <MenuItem
      className="t--apiFormDeleteBtn single-select error-menuitem"
      disabled={disabled}
      onSelect={handleSelect}
      startIcon="trash"
    >
      {menuLabel}
    </MenuItem>
  );
};
