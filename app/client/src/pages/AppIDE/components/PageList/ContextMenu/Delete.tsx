import React, { useCallback, useState } from "react";
import { MenuItem } from "@appsmith/ads";
import {
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  createMessage,
} from "ee/constants/messages";
import { useDispatch } from "react-redux";
import { deletePageAction } from "actions/pageActions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import clsx from "clsx";

interface Props {
  pageId: string;
  pageName: string;
  disabled?: boolean;
}

export const Delete = ({ disabled, pageId, pageName }: Props) => {
  const dispatch = useDispatch();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deletePageCallback = useCallback(() => {
    dispatch(deletePageAction(pageId));
    AnalyticsUtil.logEvent("DELETE_PAGE", {
      pageName: pageName,
    });
  }, [dispatch, pageId, pageName]);

  const onSelect = useCallback(
    (e?: Event) => {
      e?.preventDefault();
      confirmDelete ? deletePageCallback() : setConfirmDelete(true);
      e?.stopPropagation();
    },
    [confirmDelete, deletePageCallback],
  );

  return (
    <MenuItem
      className={clsx("single-select", { "error-menuitem": !disabled })}
      disabled={disabled}
      onSelect={onSelect}
      startIcon="trash"
    >
      {confirmDelete
        ? createMessage(CONFIRM_CONTEXT_DELETE)
        : createMessage(CONTEXT_DELETE)}
    </MenuItem>
  );
};
