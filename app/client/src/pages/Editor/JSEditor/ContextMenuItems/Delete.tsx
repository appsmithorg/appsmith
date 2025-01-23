import React, { useCallback, useState } from "react";
import {
  CONFIRM_CONTEXT_DELETE,
  CONTEXT_DELETE,
  createMessage,
} from "ee/constants/messages";
import { MenuItem } from "@appsmith/ads";
import { useDispatch } from "react-redux";
import { deleteJSCollection } from "actions/jsActionActions";
import type { JSCollection } from "entities/JSCollection";

interface Props {
  jsAction: JSCollection;
  disabled?: boolean;
  deleteJSAction?: () => void;
}

export const Delete = ({ deleteJSAction, disabled, jsAction }: Props) => {
  const dispatch = useDispatch();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = useCallback(() => {
    jsAction.isPublic && deleteJSAction
      ? deleteJSAction()
      : dispatch(
          deleteJSCollection({
            id: jsAction?.id ?? "",
            name: jsAction?.name ?? "",
          }),
        );
  }, [jsAction.id, jsAction.name, dispatch]);

  const handleSelect = useCallback(
    (e?: Event) => {
      e?.preventDefault();
      confirmDelete ? handleDeleteClick() : setConfirmDelete(true);
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
